package impl

import (
	"context"
	"database/sql"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DeferFunc func(ctx context.Context, err error, dataPush *model.TDataPushModel)
type NodeFunc func(ctx context.Context, dataPush *model.TDataPushModel) (bool, error)
type StateHandle func(ctx context.Context, dataPush *model.TDataPushModel) error

// OperationMachine 在不同的状态下，有允许的不同操作，都在这个集合里面，方便管理
type OperationMachine struct {
	workflowHandler NodeFunc
	Dispatcher      map[int32]StateHandle
	DeferFunc       DeferFunc
}

func (u *useCase) NewOperationMachine() *OperationMachine {
	s := &OperationMachine{
		workflowHandler: u.workflow,
		Dispatcher:      make(map[int32]StateHandle),
		DeferFunc:       u.LastWithoutWorkflow,
	}
	s.Dispatcher[constant.DataPushStatusShadow.Integer.Int32()] = u.statusShadow     //隐藏状态
	s.Dispatcher[constant.DataPushStatusDraft.Integer.Int32()] = u.statusDraft       //草稿状态
	s.Dispatcher[constant.DataPushStatusWaiting.Integer.Int32()] = u.statusWaiting   //待发布
	s.Dispatcher[constant.DataPushStatusStarting.Integer.Int32()] = u.statusStarting //未开始
	s.Dispatcher[constant.DataPushStatusGoing.Integer.Int32()] = u.statusGoing       //进行中
	s.Dispatcher[constant.DataPushStatusStopped.Integer.Int32()] = u.statusStopped   //已结束
	s.Dispatcher[constant.DataPushStatusEnd.Integer.Int32()] = u.statusEnd           //已停用
	return s
}

func (s *OperationMachine) RunWithoutWorkflow(ctx context.Context, dataPush *model.TDataPushModel) error {
	handler, ok := s.Dispatcher[dataPush.PushStatus]
	if !ok {
		return nil
	}
	err := handler(ctx, dataPush)
	if err != nil {
		log.WithContext(ctx).Errorf("RunWithoutWorkflow push:%v, name:%v, error err: %v", dataPush.ID, dataPush.Name, err)
	}
	return err
}

func (s *OperationMachine) RunWithWorkflow(ctx context.Context, dataPush *model.TDataPushModel) error {
	exeNext, err := s.workflowHandler(ctx, dataPush)
	if err != nil {
		return err
	}
	if !exeNext {
		return nil
	}
	return s.RunWithoutWorkflow(ctx, dataPush)
}

// workflow   流程流转图, 结果是true是代表需要继续执行下去
func (u *useCase) workflow(ctx context.Context, dataPush *model.TDataPushModel) (bool, error) {
	hasAuditProcess, err := u.SendAuditMsg(ctx, dataPush)
	if err != nil {
		log.WithContext(ctx).Errorf("SendAuditMsg err: %v", err.Error())
		return false, err
	}
	//如果有审核，那么直接结束，流程交给审核处理
	if hasAuditProcess {
		dataPush.AuditState = constant.AuditStatusAuditing
		return false, nil
	}
	//没有审核，向下继续处理
	return true, nil
}

// statusShadow 隐藏状态
func (u *useCase) statusShadow(ctx context.Context, dataPush *model.TDataPushModel) (err error) {
	switch dataPush.Operation {
	case constant.DataPushOperationPublish.Integer.Int32():
		//由隐藏状态变为发布状态
		return u.CreateSyncModel(ctx, dataPush)
	default:
		return errorcode.Desc(errorcode.DataPushInvalidOperation)
	}
	return nil
}

// statusDraft 草稿状态
func (u *useCase) statusDraft(ctx context.Context, dataPush *model.TDataPushModel) error {
	switch dataPush.Operation {
	case constant.DataPushOperationPublish.Integer.Int32():
		//由草稿状态变为发布状态
		return u.CreateSyncModel(ctx, dataPush)
	default:
		return errorcode.Desc(errorcode.DataPushInvalidOperation)
	}
	return nil
}

// statusWaiting   待发布
func (u *useCase) statusWaiting(ctx context.Context, dataPush *model.TDataPushModel) error {
	switch dataPush.Operation {
	case constant.DataPushOperationPublish.Integer.Int32():
		//待发布可以编辑，然后审核，这里是审核通过后由workflow逻辑调用的
		return u.CreateSyncModel(ctx, dataPush)
	default:
		return errorcode.Desc(errorcode.DataPushInvalidOperation)
	}
	return nil
}

// statusStarting   未开始
func (u *useCase) statusStarting(ctx context.Context, dataPush *model.TDataPushModel) error {
	switch dataPush.Operation {
	case constant.DataPushOperationChange.Integer.Int32():
		//未开始状态，可以修改调度计划，操作是变更
		return u.UpdateWorkflowSchedule(ctx, domain.GenSchedulePlanReq(dataPush))
	case constant.DataPushOperationStop.Integer.Int32():
		//未开始状态，可以修停用推送，操作是停用
		status := constant.ScheduleStatusOff.Integer.Int32()
		req := &domain.SwitchReq{
			ScheduleStatus: status,
			PushData:       dataPush,
		}
		return u.SwitchSyncModel(ctx, req)
	default:
		return errorcode.Desc(errorcode.DataPushInvalidOperation)
	}
	return nil
}

// statusGoing 进行中
func (u *useCase) statusGoing(ctx context.Context, dataPush *model.TDataPushModel) error {
	switch dataPush.Operation {
	case constant.DataPushOperationChange.Integer.Int32():
		//进行中状态，可以修改调度计划，操作是变更
		return u.UpdateWorkflowSchedule(ctx, domain.GenSchedulePlanReq(dataPush))
	case constant.DataPushOperationStop.Integer.Int32():
		//进行中状态，可以修停用推送，操作是停用
		status := constant.ScheduleStatusOff.Integer.Int32()
		req := &domain.SwitchReq{
			ScheduleStatus: status,
			PushData:       dataPush,
		}
		return u.SwitchSyncModel(ctx, req)
	default:
		return errorcode.Desc(errorcode.DataPushInvalidOperation)
	}
	return nil
}

// statusStopped 已停用
func (u *useCase) statusStopped(ctx context.Context, dataPush *model.TDataPushModel) error {
	switch dataPush.Operation {
	case constant.DataPushOperationChange.Integer.Int32():
		//已停用状态，可以修改钓调度时间，操作是变更
		return u.UpdateWorkflowSchedule(ctx, domain.GenSchedulePlanReq(dataPush))
	case constant.DataPushOperationRestart.Integer.Int32():
		status := constant.ScheduleStatusOn.Integer.Int32()
		req := &domain.SwitchReq{
			ScheduleStatus: status,
			PushData:       dataPush,
		}
		u.UpdateWorkflowSchedule(ctx, domain.GenSchedulePlanReq(dataPush))
		return u.SwitchSyncModel(ctx, req)
	default:
		return errorcode.Desc(errorcode.DataPushInvalidOperation)
	}
	return nil
}

// statusEnd 已结束
func (u *useCase) statusEnd(ctx context.Context, dataPush *model.TDataPushModel) error {
	return errorcode.Desc(errorcode.DataPushInvalidOperation)
}

// LastWithoutWorkflow 最后没有审核流执行成功的再执行的方法
func (u *useCase) LastWithoutWorkflow(ctx context.Context, err error, dataPush *model.TDataPushModel) {
	if err != nil {
		return
	}
	if dataPush.DraftSchedule.String != "" {
		dataPush.DraftSchedule = sql.NullString{String: "", Valid: true}
	}
}

// JudgePushStatus 根据状态和开始时间判断是否开始
func JudgePushStatus(dataPush *model.TDataPushModel) int32 {
	//如果是一次性的
	if dataPush.ScheduleType == constant.ScheduleTypeOnce.String {
		if dataPush.ScheduleTime == "" {
			return constant.DataPushStatusGoing.Integer.Int32() //一次性立即执行
		}
		//一次性定时执行
		scheduleTime, _ := time.ParseInLocation(constant.LOCAL_TIME_FORMAT, dataPush.ScheduleTime, time.Local)
		if scheduleTime.Before(time.Now()) {
			return constant.DataPushStatusGoing.Integer.Int32()
		}
		return constant.DataPushStatusStarting.Integer.Int32()
	}
	//周期性
	startTime, _ := time.ParseInLocation("2006-01-02", dataPush.ScheduleStart, time.Local)
	if startTime.Before(time.Now()) {
		return constant.DataPushStatusGoing.Integer.Int32() //周期性，已经开始了
	}
	return constant.DataPushStatusStarting.Integer.Int32() //周期性，未开始
}
