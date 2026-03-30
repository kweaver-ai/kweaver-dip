package impl

import (
	"context"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

/*
审核流转操作
*/

type NodeFunc func(ctx context.Context, dataPush *domain.DBSandboxTotalDetail) (bool, error)
type StateHandle func(ctx context.Context, dataPush *domain.DBSandboxTotalDetail) error

// OperationMachine 在不同的状态下，有允许的不同操作，都在这个集合里面，方便管理
type OperationMachine struct {
	workflowHandler NodeFunc
	Dispatcher      map[int32]StateHandle
}

func (u *useCase) NewOperationMachine() *OperationMachine {
	s := &OperationMachine{
		workflowHandler: u.workflow,
		Dispatcher:      make(map[int32]StateHandle),
	}
	s.Dispatcher[constant.SandboxStatusApplying.Integer.Int32()] = u.emptyOperation   //申请中
	s.Dispatcher[constant.SandboxStatusWaiting.Integer.Int32()] = u.statusWaiting     //待实施
	s.Dispatcher[constant.SandboxStatusExecuting.Integer.Int32()] = u.statusExecuting //实施中
	s.Dispatcher[constant.SandboxStatusCompleted.Integer.Int32()] = u.emptyOperation  //已实施
	return s
}
func (s *OperationMachine) RunWithoutWorkflow(ctx context.Context, detail *domain.DBSandboxTotalDetail) error {
	handler, ok := s.Dispatcher[detail.ApplyObj.Status]
	if !ok {
		return nil
	}
	err := handler(ctx, detail)
	if err != nil {
		log.WithContext(ctx).Errorf("RunWithoutWorkflow push:%v, name:%v, error err: %v", detail.ApplyObj.ID, detail.ApplyObj.SandboxID, err)
	}
	return err
}

func (s *OperationMachine) RunWithWorkflow(ctx context.Context, detail *domain.DBSandboxTotalDetail) error {
	exeNext, err := s.workflowHandler(ctx, detail)
	if err != nil {
		return err
	}
	if !exeNext {
		return nil
	}
	if err = s.RunWithoutWorkflow(ctx, detail); err != nil {
		log.WithContext(ctx).Errorf(err.Error())
	}
	return nil
}

// workflow   流程流转图, 结果是true是代表需要继续执行下去
func (u *useCase) workflow(ctx context.Context, detail *domain.DBSandboxTotalDetail) (bool, error) {
	hasAuditProcess, err := u.SendAuditMsg(ctx, detail)
	if err != nil {
		log.WithContext(ctx).Errorf("SendAuditMsg err: %v", err.Error())
		return false, err
	}
	//如果有审核，那么直接结束，流程交给审核处理
	if hasAuditProcess {
		detail.ApplyObj.AuditState = constant.AuditStatusAuditing.Integer.Int32()
		return false, nil
	}
	detail.ApplyObj.AuditState = constant.AuditStatusUnaudited.Integer.Int32()
	detail.ApplyObj.Status = constant.SandboxStatusWaiting.Integer.Int32()
	//没有审核，向下继续处理
	return true, nil
}

func (u *useCase) emptyOperation(ctx context.Context, detail *domain.DBSandboxTotalDetail) error {
	return nil

}

// statusWaiting   待实施，新增实施实例，此时数据库新增一个实施实例
func (u *useCase) statusWaiting(ctx context.Context, detail *domain.DBSandboxTotalDetail) error {
	//插入新的执行数据，为了申请列表页面的正常显示
	execution := &model.DBSandboxExecution{
		ID:            uuid.NewString(),
		SandboxID:     detail.ApplyObj.SandboxID,
		ApplyID:       detail.ApplyObj.ID,
		ExecuteType:   constant.ExecuteTypeOffline.Integer.Int32(),
		ExecuteStatus: constant.SandboxStatusWaiting.Integer.Int32(),
	}
	//更新操作
	if err := u.repo.InsertExecution(ctx, execution, detail.ApplyObj); err != nil {
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

// statusApplying   实施中
func (u *useCase) statusExecuting(ctx context.Context, detail *domain.DBSandboxTotalDetail) error {
	//TODO 调用接口，申请空间
	return nil
}
