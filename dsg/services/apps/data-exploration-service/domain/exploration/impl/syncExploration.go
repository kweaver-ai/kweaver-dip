package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
	mdl_uniquery "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mdl-uniquery"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/nsql"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

const (
	autoRefreshTime    = 1 * time.Second
	AddASyncReportKey  = "AddASyncReport-"
	ExecASyncReportKey = "ExecASyncReport-"
	ExecExploreTask    = "ExecExploreTask"
	RecExploreTask     = "RecExploreTask"
)

/*
// DataASyncExplore 数据异步探查，仅添加探查报告对象，并将id发送到消息队列，由消费者异步处理该探查事件

	func (e *ExplorationDomainImpl) DataASyncExplore(ctx context.Context, req *exploration.DataASyncExploreReq) (result []*exploration.DataASyncExploreResp, err error) {
		taskConfigs := make([]*model.TaskConfig, 0)
		if len(req.TaskIds) > 0 {
			taskIds := make([]uint64, 0)
			for _, taskId := range req.TaskIds {
				tid, err := strconv.ParseUint(taskId, 10, 64)
				if err == nil {
					taskIds = append(taskIds, tid)
				}
			}
			taskConfigs, err = e.task_repo.GetLatestByTaskIds(nil, ctx, taskIds)
		}

		now := time.Now()
		result = []*exploration.DataASyncExploreResp{}
		for _, taskConfig := range taskConfigs {
			reportCode, err := e.AddASyncReport(ctx, taskConfig)
			if len(reportCode) > 0 && err == nil {
				record := exploration.DataASyncExploreResp{
					Code:    reportCode,
					TaskId:  strconv.FormatUint(taskConfig.TaskID, 10),
					Version: *taskConfig.Version,
				}
				taskConfig.ExecStatus = util.ValueToPtr(constant.Explore_Status_Excuting)
				taskConfig.ExecAt = &now
				e.task_repo.Update(nil, ctx, taskConfig)
				result = append(result, &record)
			}
		}
		return result, err
	}

// AddSyncReport 添加异步探查报告

	func (e *ExplorationDomainImpl) AddASyncReport(ctx context.Context, taskConfig *model.TaskConfig) (reportCode string, err error) {
		key := fmt.Sprintf("%s-%d", AddASyncReportKey, taskConfig.TaskID)
		ctx, cancel := context.WithCancel(ctx)
		defer cancel()

		locker, err := e.mtx.ObtainLocker(ctx, key, autoRefreshTime)
		if err != nil {
			return reportCode, errorcode.Detail(errorcode.OpConflictError, ctx.Err())
		}
		defer e.mtx.Release(ctx, locker)
		//unFinishedReport, err := e.repo.GetUnfinishedByTaskId(nil, ctx, taskConfig.TaskID)
		//// 如果该task配置已有未完成的报告，则直接返回报告编号，不再重复添加
		//if unFinishedReport != nil && err == nil {
		//	return *unFinishedReport.Code, nil
		//}
		uInfo := models.GetUserInfo(ctx)
		id, err := utils.GetUniqueID()
		if err != nil {
			return reportCode, err
		}
		reportCode = uuid.NewString()
		now := time.Now()
		report := &model.Report{
			ID:          id,
			Code:        util.ValueToPtr(reportCode),
			TaskID:      taskConfig.TaskID,
			TaskVersion: taskConfig.Version,
			QueryParams: taskConfig.QueryParams,
			ExploreType: taskConfig.ExploreType,
			Table:       taskConfig.Table,
			TableID:     taskConfig.TableID,
			Schema:      taskConfig.Schema,
			VeCatalog:   taskConfig.VeCatalog,
			TotalSample: taskConfig.TotalSample,
			Status:      util.ValueToPtr(constant.Explore_Status_Undo),
			Latest:      constant.NO,
			CreatedAt:   &now,
			DvTaskID:    taskConfig.DvTaskID,
		}
		if uInfo != nil {
			report.CreatedByUID = &uInfo.ID
			report.CreatedByUname = &uInfo.Name
		}
		err = e.repo.Create(nil, ctx, report)
		if err == nil {
			err = publishExploreTask(ctx, report, e)
			if err != nil {
				e.repo.Delete(nil, ctx, report.ID)
			}
		} else {
			return "", errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		return reportCode, err
	}

// publishExploreTask 发布探查任务

	func publishExploreTask(ctx context.Context, report *model.Report, e *ExplorationDomainImpl) (err error) {
		// 同一个表的探查任务有序放入同一个消息分区中
		key := report.TableID
		value, err := newDataASyncExploreReportExecMsg(ctx, report)
		if err != nil {
			return errorcode.Detail(errorcode.MqProduceError, err)
		}
		err = e.mq_producter.SyncProduce(mq.AsyncDataExplorationTopic, util.StringToBytes(*key), util.StringToBytes(value))
		if err != nil {
			return errorcode.Detail(errorcode.MqProduceError, err)
		}
		return err
	}

// newDataASyncExploreReportExecMsg 创建数据异步探查报告执行消息

	func newDataASyncExploreReportExecMsg(ctx context.Context, report *model.Report) (msg string, err error) {
		dataASyncExploreMsg := &exploration.DataASyncExploreMsg{
			ReportId: report.ID,
		}
		b, err := json.Marshal(dataASyncExploreMsg)
		if err != nil {
			log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", dataASyncExploreMsg, err)
			return msg, errorcode.Detail(errorcode.PublicInternalError, err)
		}
		msg = string(b)
		return msg, err
	}
*/

func (e *ExplorationDomainImpl) TaskConfigProcess(ctx context.Context, task *model.TaskConfig) error {
	var err error
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			log.WithContext(ctx).Error("【ExplorationDomainImpl Exploration panic】", zap.Any("error", err))
		}
	}(&err)

	/*	report, _ := e.repo.GetByTaskIdAndVersion(nil, ctx, task.TaskID, task.Version)
		if report != nil {
			if task.ExecStatus != report.Status {
				task.ExecStatus = report.Status
				now := time.Now()
				task.ExecAt = &now
				if err = e.task_repo.Update(nil, ctx, task); err != nil {
					return err
				}
				return nil
			}
		}*/

	report := TaskConfigToReport(task)

	if err = e.repo.Create(nil, ctx, report); err != nil {
		return err
	}

	errMsg, err := e.SyncExecExplore(ctx, task, report)
	if err != nil && errMsg == "" {
		errMsg = err.Error()
	}
	now := time.Now()
	if err != nil {
		report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
		report.FinishedAt = &now
		report.Reason = &errMsg

		if err = e.repo.Update(nil, ctx, report); err != nil {
			log.Errorf("updateReport Update sql execute err : %v", err)
		}
		err = e.task_repo.UpdateExecStatus(nil, ctx, report.TaskID, constant.Explore_Status_Fail)
		if err != nil {
			log.Errorf("updateReport UpdateExecStatus sql execute err : %v", err)
		}
	} else {
		err = e.repo.UpdateLatestState(nil, ctx, report.TaskID)
		if err != nil {
			log.Errorf("updateReport UpdateLatestState sql execute err : %v", err)
		}
		report.FinishedAt = &now
		// 计算报告得分
		reportFormat, err := e.getReport(nil, ctx, report)
		if err != nil {
			log.Errorf("updateReport getReport  err : %v", err)
			report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
			// 更新探查报告状态
			err = e.repo.Update(nil, ctx, report)
			if err != nil {
				log.Errorf("updateReport Update  err : %v", err)
			}
			// 更新任务执行状态
			err = e.task_repo.UpdateExecStatus(nil, ctx, report.TaskID, constant.Explore_Status_Fail)
			if err != nil {
				log.Errorf("updateReport UpdateExecStatus  err : %v", err)
			}
		} else {
			b, err := json.Marshal(reportFormat)
			if err != nil {
				log.Errorf("json.Marshal failed, body: %v, err: %v", reportFormat, err)
			}
			report.Result = util.ValueToPtr(string(b))
			report.Status = util.ValueToPtr(constant.Explore_Status_Success)
			report.Latest = constant.YES
			report.TotalCompleteness = reportFormat.CompletenessScore
			report.TotalStandardization = reportFormat.StandardizationScore
			report.TotalUniqueness = reportFormat.UniquenessScore
			report.TotalAccuracy = reportFormat.AccuracyScore
			report.TotalConsistency = reportFormat.ConsistencyScore
			report.TotalScore = reportFormat.TotalScore
			// 更新探查报告状态
			err = e.repo.Update(nil, ctx, report)
			if err != nil {
				log.Errorf("updateReport Update  err : %v", err)
			}
			// 更新任务执行状态
			err = e.task_repo.UpdateExecStatus(nil, ctx, report.TaskID, constant.Explore_Status_Success)
			if err != nil {
				log.Errorf("updateReport UpdateExecStatus  err : %v", err)
			}
			reportList, err := e.repo.GetListByTaskIdWithOutLatest(nil, ctx, report.TaskID)
			if err != nil {
				log.Errorf("updateReport GetListByTaskIdWithOutLatest  err : %v", err)
			}
			codeSet := make([]string, 0)
			for _, r := range reportList {
				codeSet = append(codeSet, *r.Code)
			}
			// 删除旧的报告项，仅保留最新的
			//err = e.item_repo.DeleteByTaskWithOutCurrentReport(tx, ctx, codeSet)
			//if err != nil {
			//	log.Errorf("updateReport DeleteByTaskWithOutCurrentReport  err : %v", err)
			//}
			if *report.ExploreType == ExploreType_Timestamp {
				// 消息通知逻辑视图服务
				key := report.TableID
				value, err := newExploreFinishedMsg(ctx, report)
				if err != nil {
					return errorcode.Detail(errorcode.MqProduceError, err)
				}
				err = e.mq_producter.SyncProduce(mq.ExploreFinishedTopic, util.StringToBytes(*key), util.StringToBytes(value))
				if err != nil {
					return errorcode.Detail(errorcode.MqProduceError, err)
				}
			}
			if *report.ExploreType == ExploreType_Data {
				// 消息通知逻辑视图服务
				key := report.TableID
				value, err := newExploreDataFinishedMsg(ctx, report)
				if err != nil {
					return errorcode.Detail(errorcode.MqProduceError, err)
				}
				err = e.mq_producter.SyncProduce(mq.ExploreDataFinishedTopic, util.StringToBytes(*key), util.StringToBytes(value))
				if err != nil {
					return errorcode.Detail(errorcode.MqProduceError, err)
				}
			}
		}
	}
	return nil
}
func (e *ExplorationDomainImpl) taskProcess(ctx context.Context) {
	var err error
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			log.WithContext(ctx).Error("【ExplorationDomainImpl Exploration panic】", zap.Any("error", err))
		}
	}(&err)
	log.Info("start taskProcess")
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	// 获取待执行的任务
	tasks, err := e.task_repo.GetTaskV2(ctx, []int32{ExploreType_Data}, []int32{constant.Explore_Status_Undo})
	if err != nil {
		log.WithContext(ctx).Errorf("获取待处理任务失败，err: %v", err)
		return
	}
	if len(tasks) == 0 {
		return
	}
	key := fmt.Sprintf("%s-%d", ExecExploreTask, tasks[0].ID)
	locker, err := e.mtx.ObtainLocker(ctx, key, autoRefreshTime)
	if err != nil {
		log.Errorf("执行操作冲突 err :%v", err)
		return
	}
	defer e.mtx.Release(ctx, locker)
	e.iteratorTask(ctx, tasks)
}
func (e *ExplorationDomainImpl) RecoverExecuting(ctx context.Context) {
	var err error
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
		}
	}(&err)
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	// 获取待执行的任务
	tasks, err := e.task_repo.GetTaskV2(ctx, []int32{ExploreType_Data}, []int32{constant.Explore_Status_Excuting})
	if err != nil {
		log.WithContext(ctx).Errorf("获取进行中的任务失败，err: %v", err)
		return
	}
	if len(tasks) == 0 {
		return
	}
	key := fmt.Sprintf("%s-%d", RecExploreTask, tasks[0].ID)
	locker, err := e.mtx.ObtainLocker(ctx, key, autoRefreshTime)
	if err != nil {
		log.Errorf("执行操作冲突 err :%v", err)
		return
	}
	defer e.mtx.Release(ctx, locker)
	//todo 删除上次的report，需要区分是否其他节点进行中的任务，还是本次中断的任务

	//创建新的report
	e.iteratorTask(ctx, tasks)
}
func (e *ExplorationDomainImpl) iteratorTask(ctx context.Context, tasks []*model.TaskConfig) {
	for _, task := range tasks {
		report, _ := e.repo.GetByTaskIdAndVersion(nil, ctx, task.TaskID, task.Version)
		if report != nil {
			if task.ExecStatus != report.Status {
				task.ExecStatus = report.Status
				now := time.Now()
				task.ExecAt = &now
				e.task_repo.Update(nil, ctx, task)
			}
			continue
		}

		id, err := utils.GetUniqueID()
		if err != nil {
			return
		}
		reportCode := uuid.NewString()
		now := time.Now()
		report = &model.Report{
			ID:             id,
			Code:           util.ValueToPtr(reportCode),
			TaskID:         task.TaskID,
			TaskVersion:    task.Version,
			QueryParams:    task.QueryParams,
			ExploreType:    task.ExploreType,
			Table:          task.Table,
			TableID:        task.TableID,
			Schema:         task.Schema,
			VeCatalog:      task.VeCatalog,
			TotalSample:    task.TotalSample,
			Status:         util.ValueToPtr(constant.Explore_Status_Excuting),
			Latest:         constant.NO,
			CreatedAt:      &now,
			DvTaskID:       task.DvTaskID,
			CreatedByUID:   task.CreatedByUID,
			CreatedByUname: task.CreatedByUname,
		}
		err = e.repo.Create(nil, ctx, report)
		if err != nil {
			continue
		}

		reportStatus := util.ValueToPtr(constant.Explore_Status_Excuting)
		times := 0
		for {
			times++
			time.Sleep(waitTime * time.Second)
			_, err = e.SyncExecExplore(ctx, task, report)
			if err == nil {
				break
			} else {
				if agerrors.Code(err).GetErrorCode() == errorcode.ExploreSqlError {
					break
				}
				if times > maxTimes {
					break
				}
			}
		}
		if err != nil {
			var errMsg string
			if agerrors.Code(err).GetErrorCode() == errorcode.ExploreSqlError {
				errMsg = fmt.Sprintf("探查规则配置错误_%v", agerrors.Code(err).GetDescription())
			} else {
				errMsg = fmt.Sprintf("虚拟化引擎请求失败：%v", err)
			}
			// 有错误直接保存探查报告结果为异常,不再进行探查
			reportStatus = util.ValueToPtr(constant.Explore_Status_Fail)
			report.Reason = &errMsg
			now := time.Now()
			report.FinishedAt = &now
			taskConfig, err := e.task_repo.GetLatestByTaskId(nil, ctx, report.TaskID)
			if err == nil && taskConfig != nil {
				taskConfig.ExecStatus = util.ValueToPtr(constant.Explore_Status_Fail)
				e.task_repo.Update(nil, ctx, taskConfig)
			}
		}
		report1, err := e.repo.Get(nil, ctx, id)
		if err == nil {
			if report1.FinishedAt == nil {
				report.Status = reportStatus
				// 更新探查报告状态
				e.repo.Update(nil, ctx, report)
			} else {
				reportStatus = report1.Status
			}
		}
		// 更新config的状态
		task.ExecStatus = util.ValueToPtr(constant.Explore_Status_Success)
		now = time.Now()
		task.ExecAt = &now
		e.task_repo.Update(nil, ctx, task)

	}
}

/*
// DataAsyncExploreExec 调用虚拟化引擎异步查询接口，执行探查报告中所有探查项
func (e *ExplorationDomainImpl) DataAsyncExploreExec(ctx context.Context, task *exploration.DataASyncExploreMsg) (err error) {
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
		}
	}(&err)
	log.Info("start DataAsyncExploreExec")
	reportId := task.ReportId
	key := fmt.Sprintf("%s-%d", ExecASyncReportKey, reportId)
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	locker, err := e.mtx.ObtainLocker(ctx, key, autoRefreshTime)
	if err != nil {
		return errorcode.Detail(errorcode.OpConflictError, ctx.Err())
	}
	defer e.mtx.Release(ctx, locker)
	report, err := e.repo.Get(nil, ctx, reportId)
	if report == nil || err != nil {
		return
	}
	if *report.Status != constant.Explore_Status_Undo {
		return
	}
	reportStatus := util.ValueToPtr(constant.Explore_Status_Excuting)
	err = e.Exec(ctx, report)
	if err != nil {
		times := 0
		for {
			times++
			time.Sleep(waitTime * time.Second)
			err = e.Exec(ctx, report)
			if err == nil {
				break
			} else if times > maxTimes {
				break
			}
		}
		if err != nil {
			// 有错误直接保存探查报告结果为异常,不再进行探查
			reportStatus = util.ValueToPtr(constant.Explore_Status_Fail)
			errMsg := fmt.Sprintf("执行时报错：err :%v", err)
			report.Reason = &errMsg
			now := time.Now()
			report.FinishedAt = &now
			taskConfig, err := e.task_repo.GetLatestByTaskId(nil, ctx, report.TaskID)
			if err == nil && taskConfig != nil {
				taskConfig.ExecStatus = util.ValueToPtr(constant.Explore_Status_Fail)
				e.task_repo.Update(nil, ctx, taskConfig)
			}
		}
	}
	report1, err := e.repo.Get(nil, ctx, reportId)
	if report1.FinishedAt == nil {
		report.Status = reportStatus
		// 更新探查报告状态
		e.repo.Update(nil, ctx, report)
	}
	return
}
*/

type ConcurrencyInfo struct {
	wg                sync.WaitGroup
	explorationFailCh chan *ExplorationFail //接收失败消息
	semaphore         chan struct{}         // 用于限制并发数的信号量
}

func (e *ExplorationDomainImpl) SyncExecExplore(ctx context.Context, task *model.TaskConfig, report *model.Report) (errMsg string, err error) {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("【ExplorationDomainImpl SyncExecExplore panic】", zap.Any("error", err))
			// 更新探查报告状态
			report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
			if err = e.repo.Update(nil, ctx, report); err != nil {
				log.Errorf("SyncExecExplore Update  err : %v", err)
			}
			// 更新任务执行状态
			if err = e.task_repo.UpdateExecStatus(nil, ctx, report.TaskID, constant.Explore_Status_Success); err != nil {
				log.Errorf("SyncExecExplore UpdateExecStatus  err : %v", err)
			}
		}
	}()
	var exploreReq *exploration.DataExploreReq
	if err = json.Unmarshal([]byte(*report.QueryParams), &exploreReq); err != nil {
		return "", err
	}
	tableInfo := exploration.MetaDataTableInfo{
		Name:        exploreReq.Table,
		Code:        report.Code,
		SchemaName:  exploreReq.Schema,
		VeCatalogId: exploreReq.VeCatalog,
	}
	var res map[string]exploration.ColumnInfo
	if exploreReq.FieldInfo != "" {
		if err = json.Unmarshal([]byte(exploreReq.FieldInfo), &res); err != nil {
			log.Errorf("json.Unmarshal task exploreReq FieldInfo (%s) failed: %v", exploreReq.FieldInfo, err)
			return "", err
		}
		tableInfo.Columns = res
	}

	if err = e.data.DB.WithContext(ctx).Table("af_main.form_view").Select("mdl_id").Where("id = ?", exploreReq.TableId).Take(&exploreReq.MdlId).Error; err != nil {
		return "mdl_id not found", err
	}

	var ci *ConcurrencyInfo

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	if settings.GetConfig().ExplorationConf.ConcurrencyEnable == "true" {
		concurrencyTaskLimit, _ := strconv.Atoi(settings.GetConfig().ExplorationConf.ConcurrencyTaskLimit)
		if concurrencyTaskLimit <= 0 {
			concurrencyTaskLimit = 10 // 默认并发数为10
		}

		ci = &ConcurrencyInfo{
			wg:                sync.WaitGroup{},
			explorationFailCh: make(chan *ExplorationFail),
			semaphore:         make(chan struct{}, concurrencyTaskLimit),
		}
		go func(ci *ConcurrencyInfo, errMsg *string) {
			for c := range ci.explorationFailCh {
				*errMsg += c.Error.Error()
				cancel()
			}
		}(ci, &errMsg)
	}

	// 执行时间戳探查
	if exploreReq.ExploreType == 2 {
		err = timestampAsyncExplore(exploreReq, e, ctx, nil, *report)
		if err != nil {
			return "", err
		}
		return "", nil
	}

	// 执行字段级探查
	if err = e.fieldAsyncExplore(ci, exploreReq, ctx, tableInfo); err != nil {
		return "", err
	}

	// 执行行级探查
	if err = RowAsyncExplore(ci, exploreReq, e, ctx, tableInfo); err != nil {
		return "", err
	}

	// 执行视图级探查
	timelinessCount, err := ViewAsyncExplore(ci, exploreReq, e, ctx, tableInfo)
	if err != nil {
		return "", err
	}

	if len(exploreReq.RowExplore) == 0 && len(exploreReq.FieldExplore) == 0 && len(exploreReq.ViewExplore) == 0 && timelinessCount == len(exploreReq.ViewExplore) {
		if len(exploreReq.MetadataExplore) > 0 || len(exploreReq.ViewExplore) > 0 {
			reportFormat, err := e.getReport(nil, ctx, report)
			b, err := json.Marshal(reportFormat)
			if err != nil {
				log.Errorf("json.Marshal failed, body: %v, err: %v", reportFormat, err)
			}
			report.Result = util.ValueToPtr(util.BytesToString(b))
			report.TotalCompleteness = reportFormat.CompletenessScore
			report.TotalStandardization = reportFormat.StandardizationScore
			if report.TotalCompleteness != nil {
				report.TotalScore = report.TotalCompleteness
				if report.TotalStandardization != nil {
					report.TotalScore = formatCalculateScoreResult(*report.TotalCompleteness+*report.TotalStandardization, float64(2))
				}
			} else {
				report.TotalScore = report.TotalStandardization
			}
		} else {
			report.Result = nil
		}
		report.Status = util.ValueToPtr(constant.Explore_Status_Success)
		report.Latest = constant.YES
		now := time.Now()
		report.FinishedAt = &now
		// 更新探查报告状态
		err = e.repo.Update(nil, ctx, report)
		if err != nil {
			log.Errorf("updateReport Update  err : %v", err)
		}
		// 更新任务执行状态
		err = e.task_repo.UpdateExecStatus(nil, ctx, report.TaskID, constant.Explore_Status_Success)
		if err != nil {
			log.Errorf("updateReport UpdateExecStatus  err : %v", err)
		}

		// 消息通知逻辑视图服务
		key := report.TableID
		value, err := newExploreDataFinishedMsg(ctx, report)
		if err != nil {
			return "", errorcode.Detail(errorcode.MqProduceError, err)
		}
		err = e.mq_producter.SyncProduce(mq.ExploreDataFinishedTopic, util.StringToBytes(*key), util.StringToBytes(value))
		if err != nil {
			return "", errorcode.Detail(errorcode.MqProduceError, err)
		}
		return "", nil
	}

	// 更新config的状态
	task.ExecStatus = util.ValueToPtr(constant.Explore_Status_Success)
	now := time.Now()
	task.ExecAt = &now
	if err = e.task_repo.Update(nil, ctx, task); err != nil {
		return "", errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	if ci != nil {
		ci.wg.Wait()
		close(ci.explorationFailCh)
	}
	if errMsg != "" {
		errMsg += "MDLUniQuery Fail" + errMsg
		log.WithContext(ctx).Error("SyncExecExplore", zap.String("errMsg", errMsg))
		err = errors.New(errMsg)
	}
	return
}

func toFieldReportItem(tableInfo exploration.MetaDataTableInfo, fieldProject *exploration.ExploreField, project *exploration.Project) *model.ReportItem {
	now := time.Now()
	return &model.ReportItem{
		Code:          tableInfo.Code,
		Column:        &fieldProject.FieldName,
		RuleId:        &project.RuleId,
		Project:       &project.RuleName,
		Params:        &fieldProject.Params,
		Status:        util.ValueToPtr(constant.Explore_Status_Excuting),
		CreatedAt:     &now,
		DimensionType: &project.DimensionType,
	}
}

func (e *ExplorationDomainImpl) fieldAsyncExplore(ci *ConcurrencyInfo, exploreReq *exploration.DataExploreReq, ctx context.Context, tableInfo exploration.MetaDataTableInfo) error {
	var err error

	statisticsSqls := make([]string, 0)
	statisticsRules := make([]*model.ReportItem, 0)

	mergeSqls := make([]string, 0)
	mergeRules := make([]*model.ReportItem, 0)
	for _, fieldProject := range exploreReq.FieldExplore {
		groupRules := make([]*model.ReportItem, 0)
		for _, project := range fieldProject.Projects {
			res := &exploration.RuleConfig{}
			if project.RuleConfig != nil {
				err := json.Unmarshal([]byte(*project.RuleConfig), res)
				if err != nil {
					log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
					return errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
				}
			}
			if project.RuleName == constant.NullCount || project.DimensionType == constant.DimensionTypeNull.String {
				nullSql, err := GetFieldNullSql(res, fieldProject.FieldId, tableInfo, project.RuleId)
				if err != nil {
					return err
				}
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				mergeSqls = append(mergeSqls, nullSql)
				continue
			}
			if project.RuleName == constant.Unique || project.DimensionType == constant.DimensionTypeRepeat.String {
				uniqueSql := GetFieldUniqueSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId)
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				mergeSqls = append(mergeSqls, uniqueSql)
			}
			if project.RuleName == constant.Dict || project.DimensionType == constant.DimensionTypeDict.String {
				dictSql, err := GetFieldDictSql(res, fieldProject.FieldId, tableInfo, project.RuleId)
				if err != nil {
					return err
				}
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				mergeSqls = append(mergeSqls, dictSql)
				continue
			}
			if project.RuleName == constant.Regexp || project.DimensionType == constant.DimensionTypeFormat.String {
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				mergeSqls = append(mergeSqls, GetFieldRegexpSql(res, tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}

			var sql string
			if res.RuleExpression != nil {
				sql, err = GetFieldRuleExpressionSql(res, tableInfo)
				if err != nil {
					return err
				}
			}
			if project.RuleName == constant.Group {
				sql = nsql.Group
			}

			switch project.RuleName {
			case constant.Max:
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				statisticsSqls = append(statisticsSqls, GetFieldMaxSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
			case constant.Min:
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				statisticsSqls = append(statisticsSqls, GetFieldMinSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
			case constant.Quantile:
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				statisticsSqls = append(statisticsSqls, GetFieldQuantileSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
			case constant.Avg:
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				statisticsSqls = append(statisticsSqls, GetFieldAvgSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
			case constant.StddevPop:
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				statisticsSqls = append(statisticsSqls, GetFieldStddevPopSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
			case constant.TrueCount:
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				statisticsSqls = append(statisticsSqls, GetFieldTrueSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
			case constant.FalseCount:
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				statisticsSqls = append(statisticsSqls, GetFieldFalseSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
			}
			if project.RuleName == constant.Day || project.RuleName == constant.Month || project.RuleName == constant.Year {
				mergeRules = append(mergeRules, toFieldReportItem(tableInfo, fieldProject, project))
				groupRules = append(groupRules, toFieldReportItem(tableInfo, fieldProject, project))
			}

			if sql != "" {
				sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, fieldProject)
				if err != nil {
					return err
				}
				if err = e.DataStatistic(ctx, ci, exploreReq.MdlId, toFieldReportItem(tableInfo, fieldProject, project), sql); err != nil { //fieldAsyncExplore sql
					return err
				}
			}
		}
		if len(groupRules) > 0 {
			groupColumns := make([]string, 0)
			groupSqls := make([]string, 0)
			for _, ruleName := range groupRules {
				switch *ruleName.Project {
				case constant.Day:
					groupColumns = append(groupColumns, "t.day")
					groupSqls = append(groupSqls, fmt.Sprintf(`TO_CHAR("%s", 'yyyy-mm-dd') as "day"`, fieldProject.FieldName))
				case constant.Month:
					groupColumns = append(groupColumns, "t.month")
					groupSqls = append(groupSqls, fmt.Sprintf(`TO_CHAR("%s", 'yyyy-mm') as "month"`, fieldProject.FieldName))
				case constant.Year:
					groupColumns = append(groupColumns, "t.year")
					groupSqls = append(groupSqls, fmt.Sprintf(`TO_CHAR("%s", 'yyyy') as "year"`, fieldProject.FieldName))
				}
			}
			groupSql := strings.Replace(nsql.GroupSql, "${group_column_name}", strings.Join(groupColumns, ", "), -1)
			groupSql = strings.Replace(groupSql, "${group_sql}", strings.Join(groupSqls, ", "), -1)
			groupSql = strings.Replace(groupSql, "${column_name}", fieldProject.FieldName, -1)
			groupSql, err = e.generateSql(groupSql, tableInfo, exploreReq.TotalSample, fieldProject)
			if err != nil {
				return err
			}
			if err = e.DataStatistics(ctx, ci, exploreReq.MdlId, groupRules, groupSql); err != nil { //groupSql
				return err
			}
		}
	}
	if len(statisticsSqls) > 0 {
		statisticsSql := strings.Replace(nsql.StatisticsSql, "${sql}", strings.Join(statisticsSqls, ","), -1)
		statisticsSql, err = e.generateSql(statisticsSql, tableInfo, exploreReq.TotalSample, nil)
		if err != nil {
			return err
		}
		log.WithContext(ctx).Infof("统计类合并规则为: %s", statisticsSql)
		if err = e.DataStatistics(ctx, ci, exploreReq.MdlId, statisticsRules, statisticsSql); err != nil { //statisticsSql
			return err
		}
	}
	if len(mergeSqls) > 0 {
		mergeSql := strings.Replace(nsql.MergeSql, "${sql}", strings.Join(mergeSqls, ","), -1)
		mergeSql, err = e.generateSql(mergeSql, tableInfo, exploreReq.TotalSample, nil)
		if err != nil {
			return err
		}
		log.WithContext(ctx).Infof("空值、枚举值、格式检查合并规则为: %s", mergeSql)
		if err = e.DataStatistics(ctx, ci, exploreReq.MdlId, mergeRules, mergeSql); err != nil { //mergeSql
			return err
		}
	}
	return nil
}

func (e *ExplorationDomainImpl) DataStatistic(ctx context.Context, ci *ConcurrencyInfo, tableId string, item *model.ReportItem, sql string) error {
	if ci != nil {
		// 获取信号量，限制并发数
		e.semaphore <- struct{}{}
		ci.semaphore <- struct{}{}
		ci.wg.Add(1)

		go func() {
			defer func() {
				// 释放信号量
				<-e.semaphore
				<-ci.semaphore

				if err := recover(); err != nil {
					log.WithContext(ctx).Error("【ExplorationDomainImpl Exploration panic】", zap.Any("error", err))
				}
				ci.wg.Done()
			}()
			_ = e.dataStatisticCore(ctx, ci, tableId, item, sql)
		}()
		return nil
	} else {
		return e.dataStatisticCore(ctx, ci, tableId, item, sql)
	}
}

// dataStatisticCore 是 DataStatistic 的核心处理逻辑，可被同步和异步执行复用
func (e *ExplorationDomainImpl) dataStatisticCore(ctx context.Context, ci *ConcurrencyInfo, tableId string, item *model.ReportItem, sql string) error {
	item.Sql = &sql
	item.Status = util.ValueToPtr(constant.Explore_Status_Success)
	concurrencyTaskLimit, _ := strconv.Atoi(settings.GetConfig().ExplorationConf.ConcurrencyTaskLimit)
	if concurrencyTaskLimit <= 0 {
		concurrencyTaskLimit = 10 // 默认并发数为10
	}

	result, err := e.queryDataWithSearchAfter(ctx, tableId, sql, "DataStatistic single")
	if err != nil {
		if ci != nil {
			ci.explorationFailCh <- &ExplorationFail{
				Error: err,
				Id:    tableId,
			}
		}
		item.Status = util.ValueToPtr(constant.Explore_Status_Fail)
	}

	e.ResultToItem(item, result)
	if err2 := e.item_repo.Create(nil, ctx, item); err2 != nil {
		return err2
	}

	return nil
}

func (e *ExplorationDomainImpl) DataStatistics(ctx context.Context, ci *ConcurrencyInfo, tableId string, items []*model.ReportItem, sql string) error {
	if ci != nil {
		// 获取信号量，限制并发数
		ci.semaphore <- struct{}{}
		ci.wg.Add(1)
		go func() {
			defer func() {
				// 释放信号量
				<-ci.semaphore

				if err := recover(); err != nil {
					log.WithContext(ctx).Error("【ExplorationDomainImpl DataStatistics panic】", zap.Any("error", err))
				}
				ci.wg.Done()
			}()
			_ = e.dataStatisticsCore(ctx, ci, tableId, items, sql)
		}()
		return nil
	} else {
		return e.dataStatisticsCore(ctx, ci, tableId, items, sql)
	}
}

// dataStatisticsCore 是 DataStatistics 的核心处理逻辑，可被同步和异步执行复用
func (e *ExplorationDomainImpl) dataStatisticsCore(ctx context.Context, ci *ConcurrencyInfo, tableId string, items []*model.ReportItem, sql string) error {
	result, err := e.queryDataWithSearchAfter(ctx, tableId, sql, "DataStatistics multiple")

	for _, item := range items {
		item.Status = util.ValueToPtr(constant.Explore_Status_Success)
		if err != nil {
			item.Status = util.ValueToPtr(constant.Explore_Status_Fail)
		}
		item.Sql = &sql
		e.ResultToItem(item, result)
	}
	if err2 := e.item_repo.BatchCreate(nil, ctx, items); err2 != nil {
		return err2
	}
	if err != nil && ci != nil {
		ci.explorationFailCh <- &ExplorationFail{
			Error: err,
			Id:    tableId,
		}
	}
	return err
}

func toRowReportItem(tableInfo exploration.MetaDataTableInfo, project *exploration.Project) *model.ReportItem {
	now := time.Now()
	return &model.ReportItem{
		Code:          tableInfo.Code,
		RuleId:        &project.RuleId,
		Project:       &project.RuleName,
		Status:        util.ValueToPtr(constant.Explore_Status_Excuting),
		CreatedAt:     &now,
		DimensionType: &project.DimensionType,
	}
}

// queryDataWithSearchAfter 执行带 SearchAfter 功能的数据查询
func (e *ExplorationDomainImpl) queryDataWithSearchAfter(ctx context.Context, tableId, sql string, funcName string) ([]map[string]any, error) {
	// 使用通用的重试函数
	wrapperResult, err := util.RetryWithResultAndSearchAfter(
		ctx,
		func(searchAfter []string) (*mdl_uniquery.QueryDataResult, error) {
			queryBody := mdl_uniquery.QueryDataBody{SQL: sql, NeedTotal: true}
			// 如果有 SearchAfter 参数，则在查询中使用它
			if searchAfter != nil {
				queryBody.UseSearchAfter = true
				queryBody.SearchAfter = searchAfter
			}
			result, err := e.mdl_uniquery.QueryData(ctx, tableId, settings.GetConfig().ExplorationConf.RetryTimeOut, queryBody)
			return result, err
		},
		settings.RetryCount,
		time.Millisecond*time.Duration(settings.RetryWaitTime),
		funcName,
		func(result *mdl_uniquery.QueryDataResult) []map[string]any {
			if result != nil {
				return result.Entries
			}
			return nil
		},
		func(result *mdl_uniquery.QueryDataResult) []string {
			if result != nil {
				return result.SearchAfter
			}
			return nil
		},
	)
	if wrapperResult != nil {
		return wrapperResult.Entries, err
	}
	return nil, err
}

// RowAsyncExplore 行级探查
func RowAsyncExplore(ci *ConcurrencyInfo, exploreReq *exploration.DataExploreReq, e *ExplorationDomainImpl, ctx context.Context, tableInfo exploration.MetaDataTableInfo) error {
	var err error
	for _, project := range exploreReq.RowExplore {
		var sql string
		res := &exploration.RuleConfig{}
		if project.RuleConfig != nil {
			err := json.Unmarshal([]byte(*project.RuleConfig), res)
			if err != nil {
				log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
				return errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
			}
		}
		if project.RuleName == constant.RowNull || project.DimensionType == constant.DimensionTypeRowNull.String {
			sql = GetRowNullSql(res, tableInfo)
			sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, nil)
			if err != nil {
				return err
			}
		} else if project.RuleName == constant.RowUnique || project.DimensionType == constant.DimensionTypeRowRepeat.String {
			var columnNames, columnNotNull string
			for _, id := range res.RowRepeat.FieldIds {
				if columnNotNull == "" {
					columnNames = fmt.Sprintf(`"%s"`, tableInfo.Columns[id].Name)
					columnNotNull = fmt.Sprintf(`"%s" is NOT NULL `, tableInfo.Columns[id].Name)
				} else {
					columnNames = fmt.Sprintf(`%s,"%s"`, columnNames, tableInfo.Columns[id].Name)
					columnNotNull = fmt.Sprintf(`%s AND "%s" is NOT NULL`, columnNotNull, tableInfo.Columns[id].Name)
				}
			}
			sql = strings.Replace(nsql.RowUnique, "${column_names}", columnNames, -1)
			sql = strings.Replace(sql, "${column_not_null}", columnNotNull, -1)
			if exploreReq.TotalSample > 0 {
				limitSql := fmt.Sprintf(`ORDER BY RAND() LIMIT %d`, exploreReq.TotalSample)
				sql = strings.Replace(sql, "${limit}", limitSql, -1)
			} else {
				sql = strings.Replace(sql, "${limit}", "", -1)
			}
		} else {
			var ruleExpressionSql, filterSql string
			if res.Filter != nil {
				if res.Filter.Where != nil {
					filterSql, err = getWhereSQL(res.Filter.Where, res.Filter.WhereRelation, tableInfo, "")
					if err != nil {
						return err
					}
				} else {
					filterSql = strings.TrimSuffix(res.Filter.Sql, ";")
				}
			}
			if res.RuleExpression.Where != nil {
				if res.Filter != nil {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "tmp_table")
					sql = strings.Replace(nsql.CustomRule, "${rule_expression}", ruleExpressionSql, -1)
					sql = strings.Replace(sql, "${filter}", filterSql, -1)
				} else {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "")
					sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
				}
			} else {
				ruleExpressionSql = strings.TrimSuffix(res.RuleExpression.Sql, ";")
				sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
			}
		}
		if sql != "" {
			sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, nil)
			if err != nil {
				return err
			}
			if err = e.DataStatistic(ctx, ci, exploreReq.MdlId, toRowReportItem(tableInfo, project), sql); err != nil { //RowAsyncExplore sql
				return err
			}
		}
	}
	return nil
}

func toViewReportItem(tableInfo exploration.MetaDataTableInfo, project *exploration.Project) *model.ReportItem {
	now := time.Now()
	return &model.ReportItem{
		Code:      tableInfo.Code,
		RuleId:    &project.RuleId,
		Project:   &project.RuleName,
		Status:    util.ValueToPtr(constant.Explore_Status_Excuting),
		CreatedAt: &now,
	}
}
func ViewAsyncExplore(ci *ConcurrencyInfo, exploreReq *exploration.DataExploreReq, e *ExplorationDomainImpl, ctx context.Context, tableInfo exploration.MetaDataTableInfo) (int, error) {
	timelinessCount := 0
	var err error
	for _, project := range exploreReq.ViewExplore {
		res := &exploration.RuleConfig{}
		if project.RuleConfig != nil {
			err := json.Unmarshal([]byte(*project.RuleConfig), res)
			if err != nil {
				log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
				return timelinessCount, errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
			}
		}
		if project.RuleName == constant.Update || project.Dimension == constant.DimensionTimeliness.String {
			timelinessCount++
			continue
		} else {
			var ruleExpressionSql, filterSql, sql string
			if res.Filter != nil {
				if res.Filter.Where != nil {
					filterSql, err = getWhereSQL(res.Filter.Where, res.Filter.WhereRelation, tableInfo, "")
					if err != nil {
						return timelinessCount, err
					}
				} else {
					filterSql = strings.TrimSuffix(res.Filter.Sql, ";")
				}
			}
			if res.RuleExpression.Where != nil {
				if res.Filter != nil {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "tmp_table")
					sql = strings.Replace(nsql.CustomRule, "${rule_expression}", ruleExpressionSql, -1)
					sql = strings.Replace(sql, "${filter}", filterSql, -1)
				} else {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "")
					sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
				}
			} else {
				ruleExpressionSql = strings.TrimSuffix(res.RuleExpression.Sql, ";")
				sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
			}
			sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, nil)
			if err != nil {
				return timelinessCount, err
			}
			if err = e.DataStatistic(ctx, ci, exploreReq.MdlId, toViewReportItem(tableInfo, project), sql); err != nil { //ViewAsyncExplore sql
				return timelinessCount, err
			}
		}
	}
	return timelinessCount, nil
}

func GetFieldNullSql(res *exploration.RuleConfig, fieldId string, tableInfo exploration.MetaDataTableInfo, ruleId string) (sql string, err error) {
	dataType := constant.DataType2string(tableInfo.Columns[fieldId].Type)
	fieldName := tableInfo.Columns[fieldId].Name
	if res.Null != nil {
		var fieldNullConfig string
		for _, config := range res.Null {
			if dataType == constant.DataTypeChar.String {
				if config == " " {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`trim(cast("%s" as string)) = ' '`, fieldName)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or trim(cast("%s" as string)) = ' '`, fieldNullConfig, fieldName)
					}
				} else if config == "NULL" {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" is NULL`, fieldName)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, fieldNullConfig, fieldName)
					}
				} else {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" = '%s'`, fieldName, config)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" = '%s'`, fieldNullConfig, fieldName, config)
					}
				}
			} else if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
				if config == "NULL" {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" is NULL`, fieldName)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, fieldNullConfig, fieldName)
					}
				} else {
					num, err := strconv.ParseInt(config, 10, 64)
					if err != nil {
						log.Errorf("getFormatResult ParseInt err: %v", err)
						return sql, errorcode.Detail(errorcode.PublicInvalidParameter, "空值配置不合法")
					}
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" = %d`, fieldName, num)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" = %d`, fieldNullConfig, fieldName, num)
					}
				}
			} else {
				if fieldNullConfig == "" {
					fieldNullConfig = fmt.Sprintf(`"%s" is NULL `, fieldName)
				} else {
					fieldNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, fieldNullConfig, fieldName)
				}
			}
		}
		sql = strings.Replace(nsql.Null, "${null_config}", fieldNullConfig, -1)
		sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, tableInfo.Columns[fieldId].Name), -1)
	}
	return sql, nil
}

func GetFieldUniqueSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Unique, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldDictSql(res *exploration.RuleConfig, fieldId string, tableInfo exploration.MetaDataTableInfo, ruleId string) (sql string, err error) {
	if res.Dict == nil {
		return "", errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
	}
	dataType := constant.DataType2string(tableInfo.Columns[fieldId].Type)
	var dictSql string
	for _, data := range res.Dict.Data {
		if dataType == constant.DataTypeChar.String {
			if dictSql == "" {
				dictSql = fmt.Sprintf(`'%s'`, data.Code)
			} else {
				dictSql = fmt.Sprintf(`%s,'%s'`, dictSql, data.Code)
			}
		} else if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if dictSql == "" {
				dictSql = fmt.Sprintf(`%s`, data.Code)
			} else {
				dictSql = fmt.Sprintf(`%s,%s`, dictSql, data.Code)
			}
		}
	}
	sql = strings.Replace(nsql.Dict, "${column_name}", tableInfo.Columns[fieldId].Name, -1)
	sql = strings.Replace(sql, "${dict_config}", dictSql, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, tableInfo.Columns[fieldId].Name), -1)
	return sql, nil
}

func GetFieldRegexpSql(res *exploration.RuleConfig, fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Regexp, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${regexp_config}", res.Format.Regex, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldMaxSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Max, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldMinSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Min, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldQuantileSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Quantile, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${quantile_25}", fmt.Sprintf("%s_quantile_25", ruleId), -1)
	sql = strings.Replace(sql, "${quantile_50}", fmt.Sprintf("%s_quantile_50", ruleId), -1)
	sql = strings.Replace(sql, "${quantile_75}", fmt.Sprintf("%s_quantile_75", ruleId), -1)
	return sql
}

func GetFieldAvgSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Avg, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldStddevPopSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.StddevPop, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldTrueSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.True, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldFalseSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.False, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldRuleExpressionSql(res *exploration.RuleConfig, tableInfo exploration.MetaDataTableInfo) (sql string, err error) {
	var ruleExpressionSql, filterSql string
	if res.Filter != nil {
		if res.Filter.Where != nil {
			filterSql, err = getWhereSQL(res.Filter.Where, res.Filter.WhereRelation, tableInfo, "")
			if err != nil {
				return sql, err
			}
		} else {
			filterSql = strings.TrimSuffix(res.Filter.Sql, ";")
		}
	}
	if res.RuleExpression.Where != nil {
		if filterSql != "" {
			ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "tmp_table")
			sql = strings.Replace(nsql.CustomRule, "${rule_expression}", ruleExpressionSql, -1)
			sql = strings.Replace(sql, "${filter}", filterSql, -1)
		} else {
			ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "")
			sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
		}
	} else {
		ruleExpressionSql = strings.TrimSuffix(res.RuleExpression.Sql, ";")
		sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
	}
	return sql, nil
}

func GetRowNullSql(res *exploration.RuleConfig, tableInfo exploration.MetaDataTableInfo) (sql string) {
	if res.RowNull != nil {
		var rowNullConfig string
		for _, config := range res.RowNull.Config {
			for _, id := range res.RowNull.FieldIds {
				dataType := constant.DataType2string(tableInfo.Columns[id].Type)
				if config == " " && dataType == constant.DataTypeChar.String {
					if rowNullConfig == "" {
						rowNullConfig = fmt.Sprintf(`trim(cast("%s" as string)) = ' '`, tableInfo.Columns[id].Name)
					} else {
						rowNullConfig = fmt.Sprintf(`%s or trim(cast("%s" as string)) = ' '`, rowNullConfig, tableInfo.Columns[id].Name)
					}
				}
				if config == "0" && (dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String) {
					if rowNullConfig == "" {
						rowNullConfig = fmt.Sprintf(`"%s" = 0 `, tableInfo.Columns[id].Name)
					} else {
						rowNullConfig = fmt.Sprintf(`%s or "%s" = 0`, rowNullConfig, tableInfo.Columns[id].Name)
					}
				}
				if config == "NULL" {
					if rowNullConfig == "" {
						rowNullConfig = fmt.Sprintf(`"%s" is NULL `, tableInfo.Columns[id].Name)
					} else {
						rowNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, rowNullConfig, tableInfo.Columns[id].Name)
					}
				}
			}
		}
		sql = strings.Replace(nsql.RowNull, "${row_null_config}", rowNullConfig, -1)
	}
	return sql
}

func getWhereSQL(where []*exploration.Where, whereRelation string, tableInfo exploration.MetaDataTableInfo, tableName string) (whereSQL string, err error) {
	var whereArgs []string
	for _, v := range where {
		var wherePreGroupFormat string
		for _, vv := range v.Member {
			var opAndValueSQL string
			columnName := tableInfo.Columns[vv.FieldId].Name
			if tableName != "" {
				columnName = fmt.Sprintf(`"%s"."%s" `, tableName, columnName)
			}
			opAndValueSQL, err = whereOPAndValueFormat(tableInfo.Columns[vv.FieldId].Name, vv.Operator, vv.Value, constant.DataType2string(tableInfo.Columns[vv.FieldId].Type))
			if err != nil {
				return
			}
			if wherePreGroupFormat != "" {
				wherePreGroupFormat = wherePreGroupFormat + " " + v.Relation + " " + opAndValueSQL
			} else {
				wherePreGroupFormat = opAndValueSQL
			}
		}
		wherePreGroupFormat = "(" + wherePreGroupFormat + ")"
		whereArgs = append(whereArgs, wherePreGroupFormat)

	}
	if whereRelation != "" {
		whereRelation = fmt.Sprintf(` %s `, whereRelation)
	} else {
		whereRelation = " AND "
	}
	whereSQL = strings.Join(whereArgs, whereRelation)
	return
}

func whereOPAndValueFormat(name, op, value, dataType string) (whereBackendSql string, err error) {
	special := strings.NewReplacer(`\`, `\\\\`, `'`, `\'`, `%`, `\%`, `_`, `\_`)
	switch op {
	case "<", "<=", ">", ">=":
		if _, err = strconv.ParseFloat(value, 64); err != nil {
			return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
		}
		whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, op, value)
	case "=", "<>":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, op, value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, op, value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}

	case "=dict":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, "=", value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, "=", value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "<>dict":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, "<>", value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, "<>", value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}

	case "null":
		whereBackendSql = fmt.Sprintf(`"%s" IS NULL`, name)
	case "not null":
		whereBackendSql = fmt.Sprintf(`"%s" IS NOT NULL`, name)
	case "include":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" LIKE '%s'`, name, "%"+value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "not include":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" NOT LIKE '%s'`, name, "%"+value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "prefix":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" LIKE '%s'`, name, value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "not prefix":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" NOT LIKE '%s'`, name, value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "in list":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.DataTypeChar.String {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf(`"%s" IN %s`, name, "("+value+")")
	case "belong":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.DataTypeChar.String {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf(`"%s" IN %s`, name, "("+value+")")
	case "true":
		whereBackendSql = fmt.Sprintf(`"%s" = true`, name)
	case "false":
		whereBackendSql = fmt.Sprintf(`"%s" = false`, name)
	case "before":
		valueList := strings.Split(value, " ")
		whereBackendSql = fmt.Sprintf(`"%s" >= DATE_add('%s', -%s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') AND "%s" <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai'`, name, valueList[1], valueList[0], name)
	case "current":
		if value == "%Y" || value == "%Y-%m" || value == "%Y-%m-%d" || value == "%Y-%m-%d %H" || value == "%Y-%m-%d %H:%i" || value == "%x-%v" {
			whereBackendSql = fmt.Sprintf(`DATE_FORMAT("%s", '%s') = DATE_FORMAT(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai', '%s')`, name, value, value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "between":
		valueList := strings.Split(value, ",")
		whereBackendSql = fmt.Sprintf(`"%s" BETWEEN DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP)) AND DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP))`, name, valueList[0], valueList[1])
	default:
		return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
	}
	return
}

// timestampAsyncExplore 时间戳探查
func timestampAsyncExplore(exploreReq *exploration.DataExploreReq, e *ExplorationDomainImpl, c context.Context, tx *gorm.DB, reportEntity model.Report) (err error) {
	if len(exploreReq.FieldExplore) > 0 {
		limit := ""
		if exploreReq.TotalSample > 0 {
			limit = strconv.FormatInt(int64(exploreReq.TotalSample), 10)
		}
		veReq := &exploration.VirtualizationEngineExploreReq{
			CatalogName: exploreReq.VeCatalog,
			Schema:      exploreReq.Schema,
			Table:       exploreReq.Table,
			Limit:       limit,
			Topic:       mq.VirtualEngineAsyncQueryResultTopic,
		}
		if *reportEntity.ExploreType == 1 {
			groupLimit := "5"
			if settings.GetConfig().ExplorationConf.GroupLimit > 0 {
				groupLimit = strconv.FormatInt(int64(settings.GetConfig().ExplorationConf.GroupLimit), 10)
			}
			veReq.GroupLimit = groupLimit
		}
		fields := make([]*exploration.Field, 0)
		for _, fieldExplore := range exploreReq.FieldExplore {
			value := make([]string, 0)
			for _, code := range fieldExplore.Code {
				value = append(value, code)
			}
			field := &exploration.Field{
				Key:   fieldExplore.FieldName,
				Value: value,
				Type:  fieldExplore.FieldType,
			}
			fields = append(fields, field)
		}
		veReq.Fields = fields
		buf, err := json.Marshal(veReq)
		if err != nil {
			log.Errorf("json.Marshal 虚拟化引擎异步查询请求参数失败，err is %v", err)
			return errorcode.Detail(errorcode.JsonMarshalError, err)
		}
		taskIds, err := e.engineSource.AsyncExplore(c, bytes.NewReader(buf), 1)
		if err != nil {
			log.Errorf("execExplore failed, err: %v", err)
			return err
		}
		err = e.saveAsyncExploreRecord(tx, c, taskIds[0], *reportEntity.Code, exploreReq.FieldExplore)
	} else {
		report, err := e.repo.GetByDvTaskIdAndTable(tx, c, exploreReq.DvTaskID, exploreReq.Table)
		if err != nil {
			log.Errorf("GetByDvTaskId failed, err: %v", err)
			return err
		}
		report.Result = nil
		report.Status = util.ValueToPtr(constant.Explore_Status_Success)
		report.Latest = constant.YES
		now := time.Now()
		report.FinishedAt = &now
		// 更新探查报告状态
		err = e.repo.Update(tx, c, report)
		if err != nil {
			log.Errorf("updateReport Update  err : %v", err)
		}
		// 更新任务执行状态
		err = e.task_repo.UpdateExecStatus(tx, c, report.TaskID, constant.Explore_Status_Success)
		if err != nil {
			log.Errorf("updateReport UpdateExecStatus  err : %v", err)
		}
	}

	return err
}

// newExploreFinishedMsg 创建数据异步探查时间戳完成消息
func newExploreFinishedMsg(ctx context.Context, report *model.Report) (msg string, err error) {
	exploreFinishedMsg := &exploration.ExploreFinishedMsg{
		TableId: *report.TableID,
		TaskId:  strconv.FormatUint(report.TaskID, 10),
		Result:  *report.Result,
	}
	b, err := json.Marshal(exploreFinishedMsg)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", exploreFinishedMsg, err)
		return msg, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg = string(b)
	return msg, err
}

// newExploreDataFinishedMsg 创建数据异步探查数据完成消息
func newExploreDataFinishedMsg(ctx context.Context, report *model.Report) (msg string, err error) {
	exploreDataFinishedMsg := &exploration.ExploreDataFinishedMsg{
		TableId:     *report.TableID,
		TaskId:      strconv.FormatUint(report.TaskID, 10),
		TaskVersion: report.TaskVersion,
		FinishedAt:  report.FinishedAt.UnixMilli(),
	}
	b, err := json.Marshal(exploreDataFinishedMsg)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", exploreDataFinishedMsg, err)
		return msg, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg = string(b)
	return msg, err
}

// DeleteTask 删除探查任务
func (e *ExplorationDomainImpl) DeleteTask(ctx context.Context, req *exploration.DeleteTaskReq) (result *exploration.DeleteTaskResp, err error) {
	result = &exploration.DeleteTaskResp{
		TaskId: req.TaskId,
	}
	tasks, _, err := e.task_repo.ListByDvTaskId(ctx, req.TaskId, []int32{constant.Explore_Status_Undo, constant.Explore_Status_Excuting})
	if err != nil {
		return result, err
	}
	if len(tasks) == 0 {
		return result, nil
	}
	err = e.task_repo.UpdateExecStatusByDvTaskId(nil, ctx, req.TaskId, constant.Explore_Status_Canceled)
	if err != nil {
		return result, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	err = e.publishDeleteExploreTask(ctx, req.TaskId)
	return result, err
}

// publishDeleteExploreTask 发布删除任务消息
func (e *ExplorationDomainImpl) publishDeleteExploreTask(ctx context.Context, taskId string) (err error) {
	now := time.Now()
	uInfo := models.GetUserInfo(ctx)
	key := taskId
	deleteExploreTaskMsg := &exploration.DeleteTaskMsg{
		TaskId:    taskId,
		UserId:    uInfo.ID,
		UserName:  uInfo.Name,
		DeletedAt: &now,
	}
	b, err := json.Marshal(deleteExploreTaskMsg)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", deleteExploreTaskMsg, err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	value := string(b)
	err = e.mq_producter.SyncProduce(mq.DeleteExploreTaskTopic, util.StringToBytes(key), util.StringToBytes(value))
	if err != nil {
		return errorcode.Detail(errorcode.MqProduceError, err)
	}
	return nil
}

func (e *ExplorationDomainImpl) DeleteExploreTaskHandler(ctx context.Context, msg *exploration.DeleteTaskMsg) error {
	tasks, _, err := e.task_repo.ListByDvTaskId(ctx, msg.TaskId, []int32{constant.Explore_Status_Undo, constant.Explore_Status_Excuting})
	if err != nil {
		return err
	}
	if len(tasks) > 0 {
		err = e.task_repo.UpdateExecStatusByDvTaskId(nil, ctx, msg.TaskId, constant.Explore_Status_Canceled)
		if err != nil {
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}

	reports, _, err := e.repo.ListByDvTaskId(ctx, msg.TaskId)
	if err != nil {
		return err
	}
	for _, report := range reports {
		if *report.Status == constant.Explore_Status_Excuting {
			items, _ := e.item_repo.GetByCode(nil, ctx, *report.Code)
			if len(items) > 0 {
				//todo kill 执行中协程

				// 更新状态
				for _, item := range items {
					item.Status = util.ValueToPtr(constant.Explore_Status_Canceled)
					item.FinishedAt = msg.DeletedAt
					err = e.item_repo.Update(nil, ctx, item)
					if err != nil {
						log.Errorf("updateReport Update status execute err : %v", err)
					}
				}
			}
		}
		if *report.Status == constant.Explore_Status_Undo || *report.Status == constant.Explore_Status_Excuting {
			report.Status = util.ValueToPtr(constant.Explore_Status_Canceled)
			report.FinishedAt = msg.DeletedAt
			err = e.repo.Update(nil, ctx, report)
			if err != nil {
				log.Errorf("updateReport Update status execute err : %v", err)
			}
		}
	}
	return nil
}
