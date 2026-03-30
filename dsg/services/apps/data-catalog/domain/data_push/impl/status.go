package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/callback"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const ExecuteTimeout = time.Hour * 2

type StatusHelper interface {
	LatestExecute(ctx context.Context, mid uint64) (*domain.TaskLogInfo, error) //查询执行日志
	UpdateStatus(ctx context.Context, data *model.TDataPushModel) error         //更新状态
	QueryUnFinished(ctx context.Context) ([]*model.TDataPushModel, error)       //查询未结束的推送
	SendPushSuccessMsg(pushModel *model.TDataPushModel)
}

// StatusManagement 后台运行的任务，负责管理工作流的状态，保证工作流的状态是正确的
// 手动状态管理，比较挫，建议换成消息
type StatusManagement struct {
	mc     chan *model.TDataPushModel
	size   int
	helper StatusHelper
	//数据推送回调
	callback *DataPushCallback
}

func (u *useCase) NewStatusManagement(
	callback callback.Interface,
	cfgRepo configuration_center.Repo,
) *StatusManagement {
	return &StatusManagement{
		mc:       make(chan *model.TDataPushModel, 1000),
		size:     1000,
		helper:   u,
		callback: NewDataPushCallback(callback.DataCatalogV1().DataPush(), cfgRepo),
	}
}

func (s *StatusManagement) AutoCompleted() {
	ticker := time.NewTicker(10 * time.Second)
	for {
		select {
		case <-ticker.C:
			pushModels, err := s.helper.QueryUnFinished(context.Background())
			if err != nil {
				log.Warnf("QueryUnFinished error:%v", err)
			} else {
				for i := range pushModels {
					s.mc <- pushModels[i]
				}
			}
		}
	}
}

func (s *StatusManagement) Run() *model.TDataPushModel {
	go s.AutoCompleted()
	for {
		select {
		case data, ok := <-s.mc:
			if !ok {
				return nil
			}
			shouldStatus := s.CheckPushStatus(data)
			if data.PushStatus == shouldStatus {
				continue
			}
			if shouldStatus > constant.DataPushStatusStarting.Integer.Int32() {
				s.helper.SendPushSuccessMsg(data)
			}
			data.PushStatus = shouldStatus
			if err := s.helper.UpdateStatus(context.Background(), data); err != nil {
				log.Warnf("update model status error %v", err)
			}
		}
	}
}

func (s *StatusManagement) Close() {
	close(s.mc)
}

// CheckPushStatus 检查状态，不符合条件的，要更新状态，有操作
func (s *StatusManagement) CheckPushStatus(dataPush *model.TDataPushModel) int32 {
	//只有审核通过，或者未审核的，才可以进行状态校验
	if !(dataPush.AuditState == constant.AuditStatusPass || dataPush.AuditState == constant.AuditStatusUnaudited) ||
		dataPush.PushStatus <= constant.DataPushStatusDraft.Integer.Int32() {
		return dataPush.PushStatus
	}
	//只处理推送中的和未开始的，因为这两个状态需要变化
	if !(dataPush.PushStatus == constant.DataPushStatusStarting.Integer.Int32() ||
		dataPush.PushStatus == constant.DataPushStatusGoing.Integer.Int32()) {
		return dataPush.PushStatus
	}
	//处理未开始的
	if dataPush.PushStatus == constant.DataPushStatusStarting.Integer.Int32() {
		//开始时间
		startTime := time.UnixMilli(0)
		if dataPush.ScheduleType == constant.ScheduleTypeOnce.String {
			if dataPush.ScheduleTime != "" {
				startTime, _ = time.ParseInLocation(constant.LOCAL_TIME_FORMAT, dataPush.ScheduleTime, time.Local)
			} else {
				startTime = time.Now()
			}
		} else {
			startTime, _ = time.ParseInLocation(constant.LOCAL_TIME_FORMAT, dataPush.ScheduleStart, time.Local)
		}
		if s.judgeGoingByExecuteLog(context.Background(), dataPush.ID, startTime) {
			return constant.DataPushStatusGoing.Integer.Int32()
		}
	}
	//处理进行中的
	if dataPush.PushStatus == constant.DataPushStatusGoing.Integer.Int32() { //结束时间
		endTime := time.UnixMilli(0)
		if dataPush.ScheduleType == constant.ScheduleTypeOnce.String {
			if dataPush.ScheduleTime != "" {
				endTime, _ = time.ParseInLocation(constant.LOCAL_TIME_FORMAT, dataPush.ScheduleTime, time.Local)
			} else {
				endTime = dataPush.CreatedAt
			}
		} else {
			endTime, _ = time.Parse(constant.LOCAL_TIME_FORMAT, dataPush.ScheduleEnd)
		}
		if s.judgeEndByExecuteLog(context.Background(), dataPush, endTime) {
			return constant.DataPushStatusEnd.Integer.Int32()
		}
	}
	return dataPush.PushStatus
}

// judgeStatusByExecuteLog 检查执行历史，如果有则更新
func (s *StatusManagement) judgeEndByExecuteLog(ctx context.Context, dataPush *model.TDataPushModel, endTime time.Time) bool {
	if endTime.UnixMilli() <= 0 {
		return false
	}
	// if endTime.Add(ExecuteTimeout).Before(time.Now()) {
	// 	return true
	// }
	executeLog, err := s.helper.LatestExecute(ctx, dataPush.ID)
	if err != nil {
		return false
	}
	//检查最后一条的执行记录是什么时候的
	startTime, err := time.Parse(constant.LOCAL_TIME_FORMAT, executeLog.StartTime)
	if err != nil {
		return false
	}

	result := startTime.After(endTime) && executeLog.EndTime != ""
	// var result bool

	// // 修复：对于一次性任务，如果有完整的执行记录，直接认为已完成
	// if dataPush.ScheduleType == constant.ScheduleTypeOnce.String {
	// 	// 一次性任务：有end_time且状态为SUCCESS/FAILURE就认为已完成
	// 	result = executeLog.EndTime != "" &&
	// 		(executeLog.Status == "SUCCESS" || executeLog.Status == "FAILURE")
	// } else {
	// 	// 周期性任务：保持原有逻辑，要求执行时间晚于计划时间
	// 	result = startTime.After(endTime) && executeLog.EndTime != ""
	// }

	//完成时，发送回调
	if result {
		log.Infof("send callback complete task, dataPush: %v, executeLog: %v", dataPush, executeLog)
		s.callback.OnCompleteTask(ctx, dataPush, executeLog)
	}
	return result
}

// judgeGoingByExecuteLog 检查执行历史，如果有则更新，如果没有。根据超时时间来判断，
func (s *StatusManagement) judgeGoingByExecuteLog(ctx context.Context, id uint64, startTime time.Time) bool {
	if startTime.UnixMilli() <= 0 {
		return false
	}
	if startTime.Before(time.Now()) {
		return true
	}
	executeLog, err := s.helper.LatestExecute(ctx, id)
	if err != nil {
		return false
	}
	//检查最后一条的执行记录是什么时候的
	executeStartTime, err := time.Parse(constant.LOCAL_TIME_FORMAT, executeLog.StartTime)
	if err != nil {
		return false
	}
	return startTime.After(executeStartTime) && executeLog.EndTime != ""
}
