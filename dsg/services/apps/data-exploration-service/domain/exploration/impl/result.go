package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	engine "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/virtualization_engine"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const (
	success  = "success"
	fail     = "failed"
	vTaskKey = "ExplorationResultUpdate-"
	maxTimes = 5
	waitTime = 1
)

/*
// saveResult 保存探查结果
func (e *ExplorationDomainImpl) saveResult(tx *gorm.DB, c context.Context, results []map[string]any, reportCode string, projectCode string, field *exploration.ExploreField) error {
	now := time.Now()
	reportItemId, err := utils.GetUniqueID()
	if err != nil {
		return err
	}
	mResult := model.ReportItem{
		ID:         reportItemId,
		Code:       &reportCode,
		CreatedAt:  &now,
		Project:    &projectCode,
		Status:     util.ValueToPtr(constant.Explore_Status_Success),
		FinishedAt: &now,
	}
	if field != nil {
		mResult.Column = &field.FieldName
	}
	if results != nil {
		b, err := json.Marshal(results)
		if err != nil {
			log.Errorf("json.Marshal failed, body: %v, err: %v", results, err)
			return errorcode.Detail(errorcode.PublicInternalError, err)
		}
		resultsJson := string(b)
		mResult.Result = &resultsJson
	}

	e.item_repo.Create(tx, c, &mResult)
	return nil
}*/

// saveAsyncExploreRecord 保存异步探查项目
func (e *ExplorationDomainImpl) saveAsyncExploreRecord(tx *gorm.DB, c context.Context, taskId string, reportCode string, fields []*exploration.ExploreField) error {
	now := time.Now()
	items := make([]*model.ReportItem, 0)
	for _, field := range fields {
		for i, _ := range field.Code {
			item := &model.ReportItem{
				Code:      &reportCode,
				Column:    &field.FieldName,
				Params:    &field.Params,
				CreatedAt: &now,
				Project:   &field.Code[i],
				Status:    util.ValueToPtr(constant.Explore_Status_Excuting),
				//VeTaskID:  &taskId,
			}
			items = append(items, item)
		}
	}
	//sameItem, err := e.item_repo.GetByProjectCode(tx, c, *mResult.Project, *mResult.Code, mResult.Column, mResult.Params)
	//if err == nil && sameItem != nil {
	//	// 已有该探查项目，不重复添加
	//	return nil
	//}
	err := e.item_repo.BatchCreate(tx, c, items)
	if err != nil {
		log.WithContext(c).Errorf("创建子探查项失败，reportCode:%s, ve_task_id:%s，err: %v", reportCode, taskId, err)
	}
	return err
}

/*
// saveAsyncExploreRecord 保存异步探查项目
func (e *ExplorationDomainImpl) saveAsyncExploreDataRecord(tx *gorm.DB, c context.Context, taskIds []string, sqlMap map[string]string, statisticsSql, mergeSql string, groupMap map[string]string, reportCode string, exploreReq *exploration.DataExploreReq) error {
	now := time.Now()
	items := make([]*model.ReportItem, 0)
	i := 0
	if statisticsSql != "" {
		i++
	}
	if mergeSql != "" {
		i++
	}
	if exploreReq.FieldExplore != nil {
		for _, fieldRule := range exploreReq.FieldExplore {
			hasGroupRule := false
			for _, rule := range fieldRule.Projects {
				ruleName := fmt.Sprintf("字段级(%s):%s", fieldRule.FieldName, rule.RuleName)
				item := &model.ReportItem{
					Code:          &reportCode,
					Column:        &fieldRule.FieldName,
					Params:        &fieldRule.Params,
					CreatedAt:     &now,
					RuleId:        &rule.RuleId,
					Project:       &rule.RuleName,
					Status:        util.ValueToPtr(constant.Explore_Status_Excuting),
					DimensionType: &rule.DimensionType,
				}
				sql, exist := sqlMap[ruleName]
				if exist {
					item.VeTaskID = &taskIds[i]
					item.Sql = &sql
					items = append(items, item)
					i++
				} else {
					if rule.Dimension == constant.DimensionDataStatistics.String {
						if rule.RuleName == constant.Day || rule.RuleName == constant.Month || rule.RuleName == constant.Year {
							item.VeTaskID = &taskIds[i]
							groupSql := groupMap[fieldRule.FieldName]
							item.Sql = &groupSql
							hasGroupRule = true
						} else {
							item.VeTaskID = &taskIds[0]
							item.Sql = &statisticsSql
						}
					} else {
						if statisticsSql != "" {
							item.VeTaskID = &taskIds[1]
						} else {
							item.VeTaskID = &taskIds[0]
						}
						item.Sql = &mergeSql
					}
					items = append(items, item)
				}
			}
			if hasGroupRule {
				i++
			}
		}
	}
	if exploreReq.RowExplore != nil {
		for _, rule := range exploreReq.RowExplore {
			ruleName := fmt.Sprintf("行级:%s", rule.RuleName)
			if sql, exist := sqlMap[ruleName]; exist {
				item := &model.ReportItem{
					Code:          &reportCode,
					CreatedAt:     &now,
					RuleId:        &rule.RuleId,
					Project:       &rule.RuleName,
					Status:        util.ValueToPtr(constant.Explore_Status_Excuting),
					VeTaskID:      &taskIds[i],
					Sql:           &sql,
					DimensionType: &rule.DimensionType,
				}
				items = append(items, item)
				i++
			}
		}
	}
	if exploreReq.ViewExplore != nil {
		for _, rule := range exploreReq.ViewExplore {
			if rule.RuleName == constant.Update {
				continue
			}
			ruleName := fmt.Sprintf("视图数据级:%s", rule.RuleName)
			if sql, exist := sqlMap[ruleName]; exist {
				item := &model.ReportItem{
					Code:      &reportCode,
					CreatedAt: &now,
					RuleId:    &rule.RuleId,
					Project:   &rule.RuleName,
					Status:    util.ValueToPtr(constant.Explore_Status_Excuting),
					VeTaskID:  &taskIds[i],
					Sql:       &sql,
				}
				items = append(items, item)
				i++
			}
		}
	}

	err := e.item_repo.BatchCreate(tx, c, items)
	if err != nil {
		log.WithContext(c).Errorf("创建子探查项失败，reportCode:%s，err: %v", reportCode, err)
	}
	return err
}
*/
// getCache 获取缓存结果
func getCache(exploreReq *exploration.DataExploreReq, e *ExplorationDomainImpl, c *gin.Context, key string) (*exploration.DataExploreResp, error) {
	if exploreReq.Cache == 1 {
		result, err := e.data.RedisCli.Get(c, key).Result()
		if err == nil && len(result) > 1 {
			var exploreResp exploration.DataExploreResp
			if err := json.Unmarshal([]byte(result), &exploreResp); err == nil {
				return &exploreResp, nil
			}
		}
	}
	return nil, nil
}

// setCache 设置缓存
func setCache(exploreReq *exploration.DataExploreReq, resp *exploration.DataExploreResp, err error, e *ExplorationDomainImpl, c *gin.Context, key string) error {
	if exploreReq.Cache == 1 {
		var expireTime time.Duration
		if exploreReq.ExpireTime == 0 {
			expireTime = time.Minute * time.Duration(settings.GetConfig().ExplorationConf.CacheExpireTime)
		} else {
			expireTime = time.Minute * time.Duration(exploreReq.ExpireTime)
		}
		bytes, _ := json.Marshal(resp)
		value := string(bytes)
		err = e.data.RedisCli.Set(c, key, value, expireTime).Err()
		if err != nil {
			log.Error(fmt.Sprintf("set redis cache error : %s", err.Error()))
		}
	}
	return err
}

func (e *ExplorationDomainImpl) ResultToItem(item *model.ReportItem, result []map[string]any) {
	var res string
	if *item.Project == constant.Quantile {
		itemResult := make([]map[string]any, 0)
		resultMap := make(map[string]any)
		quantile25Column := fmt.Sprintf("%s_quantile_25", *item.RuleId)
		quantile50Column := fmt.Sprintf("%s_quantile_50", *item.RuleId)
		quantile75Column := fmt.Sprintf("%s_quantile_75", *item.RuleId)
		quantile25, ok := result[0][quantile25Column].(float64)
		if ok {
			resultMap["quantile_25"] = quantile25
		}
		quantile50, ok := result[0][quantile50Column].(float64)
		if ok {
			resultMap["quantile_50"] = quantile50
		}
		quantile75, ok := result[0][quantile75Column].(float64)
		if ok {
			resultMap["quantile_75"] = quantile75
		}
		itemResult = append(itemResult, resultMap)
		resultBytes, _ := json.Marshal(itemResult)
		res = string(resultBytes)
	} else if *item.Project == constant.Max || *item.Project == constant.Min || *item.Project == constant.Avg ||
		*item.Project == constant.StddevPop || *item.Project == constant.TrueCount || *item.Project == constant.FalseCount {
		itemResult := make([]map[string]any, 0)
		resultMap := make(map[string]any)
		ruleId := fmt.Sprintf("%s_%s", *item.RuleId, *item.Column)
		resultMap["result"] = result[0][ruleId]
		itemResult = append(itemResult, resultMap)
		resultBytes, _ := json.Marshal(itemResult)
		res = string(resultBytes)
	} else if *item.Project == constant.NullCount || *item.Project == constant.Dict ||
		*item.Project == constant.Regexp || *item.Project == constant.Unique ||
		(item.DimensionType != nil && (*item.DimensionType == constant.DimensionTypeNull.String || *item.DimensionType == constant.DimensionTypeDict.String ||
			*item.DimensionType == constant.DimensionTypeFormat.String || *item.DimensionType == constant.DimensionTypeRepeat.String)) {
		itemResult := make([]map[string]any, 0)
		resultMap := make(map[string]any)
		ruleId := fmt.Sprintf("%s_%s", *item.RuleId, *item.Column)
		resultMap["count1"] = result[0][ruleId]
		resultMap["count2"] = result[0]["count2"]
		itemResult = append(itemResult, resultMap)
		resultBytes, _ := json.Marshal(itemResult)
		res = string(resultBytes)
	} else if *item.Project == constant.Day || *item.Project == constant.Month || *item.Project == constant.Year {
		yearly, monthly, daily := processAllData(result)
		resultBytes := make([]byte, 0)
		if *item.Project == constant.Day {
			resultBytes, _ = json.Marshal(daily)
		}
		if *item.Project == constant.Month {
			resultBytes, _ = json.Marshal(monthly)
		}
		if *item.Project == constant.Year {
			resultBytes, _ = json.Marshal(yearly)
		}
		res = string(resultBytes)
	} else {
		resultBytes, _ := json.Marshal(result)
		res = string(resultBytes)
	}
	item.Result = &res
}

// ExplorationResultUpdate 保存异步探查项目结果，如果所有项目完成或者某个探查结果异常，则结束整个探查报告
func (e *ExplorationDomainImpl) ExplorationResultUpdate(ctx context.Context, result *exploration.DataASyncExploreResultMsg) (err error) {
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
		}
	}(&err)
	veTaskId := result.Result.TaskId
	log.Debugf("start ExplorationResultUpdate: vetaskid = %s", veTaskId)
	now := time.Now()
	reportItems, err := e.item_repo.GetByVeTaskId(nil, ctx, veTaskId)
	if len(reportItems) == 0 || err != nil {
		times := 0
		for {
			times++
			time.Sleep(waitTime * time.Second)
			reportItems, _ = e.item_repo.GetByVeTaskId(nil, ctx, veTaskId)
			if len(reportItems) > 0 {
				break
			} else if times > maxTimes {
				break
			}
		}
		if len(reportItems) == 0 {
			log.Errorf("skip time out veTask , vtaskid = : %s", veTaskId)
			return nil
		}
	}
	log.Infof("start to handle msg: %v", result)
	reportCode := reportItems[0].Code
	log.Infof("start to handle msg: %v", result)
	report, err := e.repo.GetByCode(nil, ctx, *reportCode)
	if report == nil || err != nil {
		return
	}
	if report.FinishedAt != nil {
		return
	}
	reportItemStatus := util.ValueToPtr(constant.Explore_Status_Fail)
	result.Result.Status = strings.ToLower(result.Result.Status)
	formatResult := make([]map[string]any, 0)
	if result.Result.Status == success {
		reportItemStatus = util.ValueToPtr(constant.Explore_Status_Success)
		rawResult := &engine.RawResult{
			Data:    result.Data,
			Columns: result.Columns,
		}
		formatResult, _ = e.engineSource.Format(rawResult)
	}
	for _, item := range reportItems {
		if len(formatResult) > 0 {
			e.ResultToItem(item, formatResult)
		} else {
			item.Result = nil
		}
		item.Status = reportItemStatus
		item.FinishedAt = &now
		err = e.item_repo.Update(nil, ctx, item)
		if err != nil {
			return err
		}
		err = e.updateExploreReport(nil, ctx, result, report, now, item)
		if err != nil {
			return err
		}
	}

	return
}

func processAllData(data []map[string]interface{}) ([]exploration.Result, []exploration.Result, []exploration.Result) {
	daily := make([]exploration.Result, 0)
	monthly := make([]exploration.Result, 0)
	yearly := make([]exploration.Result, 0)

	dailyMap := make(map[string]int)
	monthlyMap := make(map[string]int)
	yearlyMap := make(map[string]int)

	for _, entry := range data {
		value, exists := entry["value"]
		if !exists || value == nil {
			continue
		}

		valueNum, ok := value.(float64)
		if !ok {
			continue
		}

		// 处理日级数据
		if day, exists := entry["day"]; exists && day != nil {
			if dayStr, ok := day.(string); ok && dayStr != "" {
				dailyMap[dayStr] += int(valueNum)
			}
		}

		// 处理月级数据
		if month, exists := entry["month"]; exists && month != nil {
			if monthStr, ok := month.(string); ok && monthStr != "" {
				monthlyMap[monthStr] += int(valueNum)
			}
		}

		// 处理年级数据
		if year, exists := entry["year"]; exists && year != nil {
			if yearStr, ok := year.(string); ok && yearStr != "" {
				yearlyMap[yearStr] += int(valueNum)
			}
		}
	}

	for k, v := range dailyMap {
		daily = append(daily, exploration.Result{Key: k, Value: v})
	}
	for k, v := range monthlyMap {
		monthly = append(monthly, exploration.Result{Key: k, Value: v})
	}
	for k, v := range yearlyMap {
		yearly = append(yearly, exploration.Result{Key: k, Value: v})
	}

	return yearly, monthly, daily
}

func (e *ExplorationDomainImpl) ExplorationResultHandler(ctx context.Context, msg []byte) (err error) {
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
		}
	}(&err)
	var result *exploration.DataExploreResultMsg
	if err = json.Unmarshal(msg, &result); err != nil {
		log.Errorf("json.Unmarshal task msg (%s) failed: %v", string(msg), err)
		return nil
	}
	veTaskId := result.Result.TaskId
	log.Debugf("start ExplorationResultUpdate: vetaskid = %s", veTaskId)
	now := time.Now()
	reportItems, err := e.item_repo.GetByVeTaskId(nil, ctx, veTaskId)
	if len(reportItems) == 0 || err != nil {
		times := 0
		for {
			times++
			time.Sleep(waitTime * time.Second)
			reportItems, _ = e.item_repo.GetByVeTaskId(nil, ctx, veTaskId)
			if len(reportItems) > 0 {
				break
			} else if times > maxTimes {
				break
			}
		}
		if len(reportItems) == 0 {
			log.Errorf("skip time out veTask , vtaskid = : %s", veTaskId)
			return nil
		}
	}
	log.Infof("start to handle msg: %v", result)
	reportCode := reportItems[0].Code
	report, err := e.repo.GetByCode(nil, ctx, *reportCode)
	if report == nil || err != nil {
		return
	}
	if report.FinishedAt != nil {
		return
	}
	reportItemStatus := util.ValueToPtr(constant.Explore_Status_Fail)
	exploreDataResult := make(map[string]map[string]any)
	exploreTimestampResult := make(map[string]string)
	result.Result.Status = strings.ToLower(result.Result.Status)
	if result.Result.Status == success {
		reportItemStatus = util.ValueToPtr(constant.Explore_Status_Success)
		if result.Aggregation != nil && result.Aggregation.TotalCount >= 0 {
			report.TotalNum = util.ValueToPtr(int32(result.Aggregation.TotalCount))
			err = e.repo.Update(nil, ctx, report)
		}
		if result != nil {
			bytes, _ := json.Marshal(result)
			resultData := string(bytes)
			if result.NotNull == nil {
				exploreDataResult, err = e.FormatExploreDataResult(resultData)
			} else {
				exploreTimestampResult, err = e.FormatExploreTimestampResult(resultData)
			}
			if err != nil {
				reportItemStatus = util.ValueToPtr(constant.Explore_Status_Fail)
				log.Errorf("FormatResult failed, vtaskid = : %s,result :%s", veTaskId, resultData)
			}
		}
	}
	for _, item := range reportItems {
		if len(exploreDataResult) > 0 {
			var res string
			if *item.Project == constant.Quantile {
				quantile := make([]string, 0)
				quantile25, ok := exploreDataResult[*item.Column]["Quantile_25"].(float64)
				if ok {
					quantile = append(quantile, strconv.FormatFloat(quantile25, 'f', -1, 64))
				}
				quantile50, ok := exploreDataResult[*item.Column]["Quantile_50"].(float64)
				if ok {
					quantile = append(quantile, strconv.FormatFloat(quantile50, 'f', -1, 64))
				}
				quantile75, ok := exploreDataResult[*item.Column]["Quantile_75"].(float64)
				if ok {
					quantile = append(quantile, strconv.FormatFloat(quantile75, 'f', -1, 64))
				}
				res = strings.Join(quantile, ", ")
			} else {
				resultBytes, _ := json.Marshal(exploreDataResult[*item.Column][*item.Project])
				res = string(resultBytes)
			}
			item.Result = &res
		} else if len(exploreTimestampResult) > 0 {
			res := exploreTimestampResult[*item.Column]
			item.Result = &res
		} else {
			item.Result = nil
		}
		item.Status = reportItemStatus
		item.FinishedAt = &now
		e.item_repo.Update(nil, ctx, item)
	}

	e.updateReport(nil, ctx, result, report, now, *reportCode)
	return
}

// updateReport 更新报告信息
func (e *ExplorationDomainImpl) updateReport(tx *gorm.DB, ctx context.Context, result *exploration.DataExploreResultMsg, report *model.Report, now time.Time, reportCode string) (err error) {
	if result.Result.Status == fail {
		// 项目异常,直接更新报告状态为失败
		report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
		report.FinishedAt = &now
		errMsg := fmt.Sprintf("虚拟化引擎执行失败")
		report.Reason = &errMsg
		err = e.repo.Update(tx, ctx, report)
		if err != nil {
			log.Errorf("updateReport Update sql execute err : %v", err)
		}
		err = e.task_repo.UpdateExecStatus(tx, ctx, report.TaskID, constant.Explore_Status_Fail)
		if err != nil {
			log.Errorf("updateReport UpdateExecStatus sql execute err : %v", err)
		}
	} else {
		unfinishItemList, err := e.item_repo.GetUnfinishedListByCode(tx, ctx, reportCode)
		if err != nil {
			log.Errorf("updateReport GetUnfinishedListByCode sql execute err : %v", err)
		}
		// 所有项目均已执行，则更新报告整体状态为完结
		if *report.Status == constant.Explore_Status_Excuting && len(unfinishItemList) == 0 {
			// e.repo.GetByTaskId
			err = e.repo.UpdateLatestState(tx, ctx, report.TaskID)
			if err != nil {
				log.Errorf("updateReport UpdateLatestState sql execute err : %v", err)
			}
			report.FinishedAt = &now
			var reportFormat exploration.ReportFormat
			var timestampReportFormat []*exploration.FieldInfo
			if *report.ExploreType == ExploreType_Data {
				// 计算报告得分
				reportFormat, err = e.getReport(tx, ctx, report)
			} else if *report.ExploreType == ExploreType_Timestamp {
				timestampReportFormat, err = e.getTimestampReport(tx, ctx, report)
			}
			if err != nil {
				log.Errorf("updateReport getReport  err : %v,task_id:%d", err, report.TaskID)
				report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
				// 更新探查报告状态
				err = e.repo.Update(tx, ctx, report)
				if err != nil {
					log.Errorf("updateReport Update  err : %v", err)
				}
				// 更新任务执行状态
				err = e.task_repo.UpdateExecStatus(tx, ctx, report.TaskID, constant.Explore_Status_Fail)
				if err != nil {
					log.Errorf("updateReport UpdateExecStatus  err : %v", err)
				}
				// 删除报告项
				codeSet := make([]string, 0)
				codeSet = append(codeSet, *report.Code)
				err = e.item_repo.DeleteByTaskWithOutCurrentReport(tx, ctx, codeSet)
				if err != nil {
					log.Errorf("updateReport DeleteByTaskWithOutCurrentReport  err : %v", err)
				}
			} else {
				if *report.ExploreType == ExploreType_Data {
					b, err := json.Marshal(reportFormat)
					if err != nil {
						log.Errorf("json.Marshal failed, body: %v, err: %v", reportFormat, err)
					}
					report.Result = util.ValueToPtr(string(b))
				} else if *report.ExploreType == ExploreType_Timestamp {
					b, err := json.Marshal(timestampReportFormat)
					if err != nil {
						log.Errorf("json.Marshal failed, body: %v, err: %v", timestampReportFormat, err)
					}
					if len(b) > 0 {
						report.Result = util.ValueToPtr(string(b))
					} else {
						report.Result = nil
					}
				}
				report.Status = util.ValueToPtr(constant.Explore_Status_Success)
				report.Latest = constant.YES
				// 更新探查报告状态
				err = e.repo.Update(tx, ctx, report)
				if err != nil {
					log.Errorf("updateReport Update  err : %v", err)
				}
				// 更新任务执行状态
				err = e.task_repo.UpdateExecStatus(tx, ctx, report.TaskID, constant.Explore_Status_Success)
				if err != nil {
					log.Errorf("updateReport UpdateExecStatus  err : %v", err)
				}
				reportList, err := e.repo.GetListByTaskIdWithOutLatest(tx, ctx, report.TaskID)
				if err != nil {
					log.Errorf("updateReport GetListByTaskIdWithOutLatest  err : %v", err)
				}
				codeSet := make([]string, 0)
				for _, r := range reportList {
					codeSet = append(codeSet, *r.Code)
				}
				// 删除旧的报告项，仅保留最新的
				err = e.item_repo.DeleteByTaskWithOutCurrentReport(tx, ctx, codeSet)
				if err != nil {
					log.Errorf("updateReport DeleteByTaskWithOutCurrentReport  err : %v", err)
				}
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
	}
	return
}

// updateReport 更新报告信息
func (e *ExplorationDomainImpl) updateExploreReport(tx *gorm.DB, ctx context.Context, result *exploration.DataASyncExploreResultMsg, report *model.Report, now time.Time, reportItem *model.ReportItem) (err error) {
	if result.Result.Status == fail {
		// 项目异常,直接更新报告状态为失败
		report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
		report.FinishedAt = &now
		errMsg := fmt.Sprintf("虚拟化引擎执行失败，err:%v", result)
		report.Reason = &errMsg
		err = e.repo.Update(tx, ctx, report)
		if err != nil {
			log.Errorf("updateReport Update sql execute err : %v", err)
		}
		err = e.task_repo.UpdateExecStatus(tx, ctx, report.TaskID, constant.Explore_Status_Fail)
		if err != nil {
			log.Errorf("updateReport UpdateExecStatus sql execute err : %v", err)
		}
	} else {
		unfinishItemList, err := e.item_repo.GetUnfinishedListByCode(tx, ctx, *reportItem.Code)
		if err != nil {
			log.Errorf("updateReport GetUnfinishedListByCode sql execute err : %v", err)
		}
		// 所有项目均已执行，则更新报告整体状态为完结
		if *report.Status == constant.Explore_Status_Excuting && len(unfinishItemList) == 0 {
			// e.repo.GetByTaskId
			err = e.repo.UpdateLatestState(tx, ctx, report.TaskID)
			if err != nil {
				log.Errorf("updateReport UpdateLatestState sql execute err : %v", err)
			}
			report.FinishedAt = &now
			// 计算报告得分
			reportFormat, err := e.getReport(tx, ctx, report)
			if err != nil {
				log.Errorf("updateReport getReport  err : %v", err)
				report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
				// 更新探查报告状态
				err = e.repo.Update(tx, ctx, report)
				if err != nil {
					log.Errorf("updateReport Update  err : %v", err)
				}
				// 更新任务执行状态
				err = e.task_repo.UpdateExecStatus(tx, ctx, report.TaskID, constant.Explore_Status_Fail)
				if err != nil {
					log.Errorf("updateReport UpdateExecStatus  err : %v", err)
				}
				// 删除报告项
				//codeSet := make([]string, 0)
				//codeSet = append(codeSet, *report.Code)
				//err = e.item_repo.DeleteByTaskWithOutCurrentReport(tx, ctx, codeSet)
				//if err != nil {
				//	log.Errorf("updateReport DeleteByTaskWithOutCurrentReport  err : %v", err)
				//}
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
				err = e.repo.Update(tx, ctx, report)
				if err != nil {
					log.Errorf("updateReport Update  err : %v", err)
				}
				// 更新任务执行状态
				err = e.task_repo.UpdateExecStatus(tx, ctx, report.TaskID, constant.Explore_Status_Success)
				if err != nil {
					log.Errorf("updateReport UpdateExecStatus  err : %v", err)
				}
				reportList, err := e.repo.GetListByTaskIdWithOutLatest(tx, ctx, report.TaskID)
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
	}
	return
}

func (e *ExplorationDomainImpl) ThirdPartyExplorationResultHandler(ctx context.Context, msg []byte) (err error) {
	var result *exploration.ThirdPartyDataExploreResultMsg
	if err = json.Unmarshal(msg, &result); err != nil {
		log.Errorf("json.Unmarshal task msg (%s) failed: %v", string(msg), err)
		return nil
	}
	// todo 根据工单id查询report记录，有就忽略，没有就更新
	finishedReport, err := e.thirdPartyTaskRepo.GetByWorkOrderIdAndCode(ctx, result.WorkOrderId, result.InstanceId)
	if err != nil {
		return
	}
	if finishedReport != nil {
		return
	}
	report, err := e.thirdPartyTaskRepo.GetByWorkOrderId(ctx, result.WorkOrderId)
	if err != nil {
		return
	}
	if report != nil {
		report.Code = result.InstanceId
		reportFormat, err := e.getThirdPartyReport(nil, ctx, report, result)
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
		finishedTime := time.UnixMilli(result.FinishedAt)
		if report.FinishedAt != nil {
			newReport := report
			newReport.FinishedAt = &finishedTime
			id, err := utils.GetUniqueID()
			if err != nil {
				return err
			}
			newReport.ID = id
			version := *report.TaskVersion + 1
			newReport.TaskVersion = &version
			err = e.thirdPartyTaskRepo.UpdateLatestState(nil, ctx, report.TaskID)
			if err != nil {
				return err
			}
			err = e.thirdPartyTaskRepo.Create(nil, ctx, newReport)
		} else {
			err = e.thirdPartyTaskRepo.UpdateLatestState(nil, ctx, report.TaskID)
			if err != nil {
				return err
			}
			// 更新探查报告状态
			report.FinishedAt = &finishedTime
			err = e.thirdPartyTaskRepo.Update(nil, ctx, report)
		}
	}
	return
}

func (e *ExplorationDomainImpl) DeleteExploreReport(ctx context.Context, req *exploration.DeleteDataExploreReportReq) (*exploration.DeleteDataExploreReportResp, error) {
	now := time.Now()
	report, err := e.repo.GetByTaskIdAndVersion(nil, ctx, req.TaskId.Uint64(), &req.TaskVersion)
	if report == nil || err != nil {
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, err)
	}
	report.DeletedAt = &now
	err = e.repo.Update(nil, ctx, report)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	} else {
		resp := &exploration.DeleteDataExploreReportResp{
			TaskId:  strconv.FormatUint(req.TaskId.Uint64(), 10),
			Version: req.TaskVersion,
		}
		return resp, nil
	}
}
