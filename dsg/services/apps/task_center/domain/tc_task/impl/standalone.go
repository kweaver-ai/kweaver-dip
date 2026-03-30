package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (t *TaskUserCase) CreateStandalone(ctx context.Context, taskReq *domain.TaskCreateReqModel) error {
	//校验用户执行人是否合法
	if taskReq.ExecutorId != "" {
		if _, err := t.userDomain.GetByUserId(ctx, taskReq.ExecutorId); err != nil {
			return err
		}
	}
	//向数据库插入记录
	taskModel := taskReq.ToModel("", "", "")
	//游离任务默认可开启
	taskModel.ExecutableStatus = constant.TaskExecuteStatusExecutable.Integer.Int8()
	if taskReq.ExecutorId == "" {
		taskModel.ExecutableStatus = constant.TaskExecuteStatusBlocked.Integer.Int8()
	}
	if err := t.taskRepo.InsertWithRelation(ctx, taskModel, taskReq.Data, t.relationDataRepo.TransactionUpsert); err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError Insert ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	taskReq.Id = taskModel.ID
	//添加操作日志
	go t.opLogRepo.Insert(ctx, domain.NewTaskOperationLog(taskReq))
	return nil
}

func (t *TaskUserCase) UpdateStandaloneTask(ctx context.Context, task *model.TcTask, taskReq *domain.TaskUpdateReqModel) error {
	if task.Status == constant.CommonStatusCompleted.Integer.Int8() && ((taskReq.Name != "" && taskReq.Name != task.Name) ||
		(taskReq.Description != nil) || (taskReq.ExecutorId != nil) || (taskReq.Deadline != nil)) { //已完成的任务不允许编辑
		return errorcode.Desc(errorcode.TaskCompletedNoModify)
	}

	completeTime := int64(0)
	taskStatus := enum.ToString[constant.CommonStatus](task.Status)
	//修改状态情况
	if taskReq.Status != "" && taskReq.Status != taskStatus {
		//修改执行人情况，修改状态加执行人为空报错
		if taskReq.ExecutorId != nil && *taskReq.ExecutorId == "" {
			return errorcode.Desc(errorcode.TaskCanNotBothChangeExecutorAndStatus)
		}
		//修改任务是否合理，是否可以开启
		switch {
		//Ready->Ongoing，检查任务状态不能修改为启动
		case taskReq.Status == constant.CommonStatusOngoing.String && taskStatus == constant.CommonStatusReady.String:
			if taskReq.ExecutorId == nil && task.ExecutorID.String == "" {
				return errorcode.Desc(errorcode.TaskCannotOpeningNoExecutor)
			}
		//Ongoing->Completed
		case taskReq.Status == constant.CommonStatusCompleted.String && taskStatus == constant.CommonStatusOngoing.String:
			completeTime = time.Now().Unix()
			// 检查业务建模诊断任务、主干业务梳理任务、业务建模任务、数据建模任务完成依赖
			if err := t.checkCompletedDependencies(ctx, task, taskReq); err != nil {
				return err
			}
		//Completed->Ongoing,项目管理管才可修改
		case taskReq.Status == constant.CommonStatusOngoing.String && taskStatus == constant.CommonStatusCompleted.String:
			//todo check node is Completed return false
			if task.ExecutorID.String != taskReq.UpdatedByUID {
				return errorcode.Desc(errorcode.TaskOnlyProjectOwnerCanChange)
			}
		default:
			return errorcode.Desc(errorcode.TaskStatusChangesFailed)
		}
	} else { //不修改状态情况
		switch {
		//修改执行人情况，可以修改
		case taskReq.ExecutorId != nil && *taskReq.ExecutorId != "" && (task.Status == constant.CommonStatusReady.Integer.Int8() ||
			task.Status == constant.CommonStatusOngoing.Integer.Int8()):
			if _, err := t.userDomain.GetByUserId(ctx, *taskReq.ExecutorId); err != nil {
				//return errorcode.Desc(errorcode.TaskUserNotExist)
				return err
			}
		//修改执行人情况，不可以修改
		case taskReq.ExecutorId != nil && *taskReq.ExecutorId != task.ExecutorID.String && task.Status == constant.CommonStatusCompleted.Integer.Int8():
			return errorcode.Desc(errorcode.TaskCanNotChangeExecutor)
		}
	}
	updateTaskModel := taskReq.ToModel(completeTime)
	//如果是修改成已完成，那就标记下可执行状态
	if taskReq.Status != taskStatus && taskReq.Status == constant.CommonStatusCompleted.String {
		updateTaskModel.ExecutableStatus = constant.TaskExecuteStatusCompleted.Integer.Int8()
	}

	if err := t.taskRepo.UpdateTaskWithRelation(ctx, updateTaskModel, taskReq.Data, t.relationDataRepo.TransactionUpsert); err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError UpdateTask ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if taskReq.Name == "" {
		taskReq.Name = task.Name
	}

	go t.opLogRepo.Insert(ctx, t.UpdateOperationLog(taskReq, task)...)

	// 如果任务是业务建模诊断任务，更新诊断任中任务状态
	if task.TaskType == constant.TaskTypeBusinessDiagnosis.Integer.Int32() {
		err := business_grooming.Service.UpdateBusinessDiagnosisTaskStaus(ctx, taskReq.Id)
		if err != nil {
			return err
		}
	}
	return nil
}
