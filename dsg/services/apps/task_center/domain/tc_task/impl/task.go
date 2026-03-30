package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"sort"
	"strings"
	"time"

	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/operation_log"
	taskRelationData "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/task_relation_data"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_flow_info"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task"
	user_repo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order/scope"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	domain_work_order "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"

	"go.uber.org/zap"
	"golang.org/x/text/encoding/simplifiedchinese"
	"golang.org/x/text/transform"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	log_v0 "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	//"github.com/kweaver-ai/dsg/services/apps/task_center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_catalog"
	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project"
	work_order "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	gConfiguration_center "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	data_catalog_comon "github.com/kweaver-ai/idrm-go-common/rest/data_catalog"
	standardization "github.com/kweaver-ai/idrm-go-common/rest/standardization"
)

type TaskUserCase struct {
	producer               kafkax.Producer
	taskRepo               tc_task.Repo
	flowInfoRepo           tc_flow_info.Repo
	userDomain             user.IUser
	userRepo               user_repo.IUserRepo
	opLogRepo              operation_log.Repo
	relationDataRepo       taskRelationData.Repo
	dataCatalog            data_catalog.Call
	datalogCommonDriven    data_catalog_comon.Driven
	workOrderRepo          work_order.Repo
	standardizationDrivern standardization.Driven
	projectRepo            tcProject.Repo
	ccDriven               gConfiguration_center.Driven
}

func NewTaskUserCase(
	producer kafkax.Producer,
	taskRepo tc_task.Repo,
	flowInfoRepo tc_flow_info.Repo,
	userDomain user.IUser,
	relationDataRepo taskRelationData.Repo,
	userRepo user_repo.IUserRepo,
	opLogRepo operation_log.Repo,
	dataCatalog data_catalog.Call,
	datalogCommonDriven data_catalog_comon.Driven,
	workOrderRepo work_order.Repo,
	standardizationDrivern standardization.Driven,
	projectRepo tcProject.Repo,
	ccDriven gConfiguration_center.Driven,
) domain.UserCase {
	return &TaskUserCase{
		producer:               producer,
		taskRepo:               taskRepo,
		flowInfoRepo:           flowInfoRepo,
		userDomain:             userDomain,
		userRepo:               userRepo,
		opLogRepo:              opLogRepo,
		relationDataRepo:       relationDataRepo,
		dataCatalog:            dataCatalog,
		datalogCommonDriven:    datalogCommonDriven,
		workOrderRepo:          workOrderRepo,
		standardizationDrivern: standardizationDrivern,
		projectRepo:            projectRepo,
		ccDriven:               ccDriven,
	}
}

func (t *TaskUserCase) Create(ctx context.Context, taskReq *domain.TaskCreateReqModel) error {
	//检查任务类型和参数是否匹配
	if err := t.CheckTaskReq(ctx, taskReq); err != nil {
		return err
	}
	//如果项目ID为空，那么就创建单独的任务，不和项目挂钩，两者逻辑差距大，所以拆开
	if taskReq.ProjectId == "" {
		return t.CreateStandalone(ctx, taskReq)
	}

	// //如果项目WorkOrderId为空，那么就创建工单的任务，不和项目和独立任务挂钩，先拆开
	// if taskReq.WorkOrderId == "" {
	// 	return t.CreateWorkOrder(ctx, taskReq)
	// }

	project, err := t.GetProject(ctx, taskReq.ProjectId)
	if err != nil {
		return err
	}
	//已完成的项目不可以再创建任务
	if project.Status == constant.CommonStatusCompleted.Integer.Int8() {
		return errorcode.Desc(errorcode.TaskProjectCompletedNoCreate)
	}
	//查询当前节点的任务，如果有任务处理没有完成状态，就可以创建
	if err = t.CanCreate(ctx, taskReq.ProjectId, taskReq.NodeId); err != nil {
		return err
	}

	//校验NodeId在流程图中是否存在：报错即不存在
	nodeInfo, err := t.GetFlowNode(ctx, project.FlowID, project.FlowVersion, taskReq.NodeId)
	if err != nil {
		return err
	}
	// 判断节点任务类型是否和任务的任务类型匹配
	if !constant.ValidTaskType(taskReq.TaskType, nodeInfo.TaskType) {
		return errorcode.Desc(errorcode.TaskTypeNotMathNode)
	}
	taskReq.StageId = nodeInfo.StageUnitID

	//校验用户执行人是否为项目成员及角色是否属于该节点
	if taskReq.ExecutorId != "" {
		if _, err := t.userDomain.GetByUserId(ctx, taskReq.ExecutorId); err != nil {
			return errorcode.Desc(errorcode.TaskUserNotExist)
		}
		if err = t.CheckExecutorId(ctx, taskReq.ProjectId, taskReq.TaskType, taskReq.ExecutorId); err != nil {
			return err
		}
	}
	//向数据库插入记录
	taskModel := taskReq.ToModel(taskReq.ProjectId, project.FlowID, project.FlowVersion)
	if err = t.taskRepo.InsertExecutable(ctx, taskModel, nodeInfo, taskReq.Data, t.relationDataRepo.TransactionUpsert); err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError Insert ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	taskReq.Id = taskModel.ID
	go t.opLogRepo.Insert(ctx, domain.NewTaskOperationLog(taskReq))
	return nil
}

func (t *TaskUserCase) UpdateTask(ctx context.Context, taskReq *domain.TaskUpdateReqModel) ([]string, error) {
	task, err := t.GetTask(ctx, "", taskReq.Id)
	if err != nil {
		return []string{}, err
	}
	if err := t.CheckTaskTypeDependencies(ctx, task, taskReq); err != nil {
		return []string{}, err
	}
	//如果任务是因为执行人被移除而废弃， 又添加回了执行人，任务状态更新
	if taskReq.ExecutorId != nil && *taskReq.ExecutorId != "" && task.ExecutorID.String == "" &&
		task.ConfigStatus == constant.TaskConfigStatusExecutorDeleted.Integer.Int8() {
		taskReq.ExecutableStatus = constant.TaskExecuteStatusExecutable.Integer.Int8()
		taskReq.ConfigStatus = constant.TaskConfigStatusNormal.Integer.Int8()
	}

	//如果没有绑定项目，走另外一个单独的逻辑
	if task.ProjectID == "" {
		//任务创建者，任务执行者才可以修改任务
		if taskReq.UpdatedByUID != task.CreatedByUID &&
			taskReq.UpdatedByUID != task.ExecutorID.String {
			return []string{}, errorcode.Desc(errorcode.TaskOnlyCanChangeByOwner)
		}
		return []string{}, t.UpdateStandaloneTask(ctx, task, taskReq)
	}
	project, err := t.GetProject(ctx, task.ProjectID)
	if err != nil {
		return []string{}, err
	}
	taskReq.ProjectId = project.ID
	//项目管理员，任务创建者，任务执行者才可以修改任务
	if taskReq.UpdatedByUID != task.CreatedByUID &&
		taskReq.UpdatedByUID != task.ExecutorID.String &&
		taskReq.UpdatedByUID != project.OwnerID {
		return []string{}, errorcode.Desc(errorcode.TaskOnlyCanChangeByOwner)
	}

	if project.Status == constant.CommonStatusCompleted.Integer.Int8() {
		return []string{}, errorcode.Desc(errorcode.TaskProjectCompletedNoModify)
	}
	if task.Status == constant.CommonStatusCompleted.Integer.Int8() && ((taskReq.Name != "" && taskReq.Name != task.Name) || (taskReq.Description != nil) || (taskReq.ExecutorId != nil) || (taskReq.Deadline != nil)) { //已完成的任务不允许编辑
		return []string{}, errorcode.Desc(errorcode.TaskCompletedNoModify)
	}

	completeTime := int64(0)
	taskStatus := enum.ToString[constant.CommonStatus](task.Status)
	if taskReq.Status != "" && taskReq.Status != taskStatus { //修改状态情况
		//项目未开启，任务不能修改状态
		if project.Status == constant.CommonStatusReady.Integer.Int8() {
			return []string{}, errorcode.Desc(errorcode.TaskCanNotChangeStatusWhenProjectNotStart)
		}
		//修改执行人情况，修改状态加执行人为空报错
		if taskReq.ExecutorId != nil && *taskReq.ExecutorId == "" {
			return []string{}, errorcode.Desc(errorcode.TaskCanNotBothChangeExecutorAndStatus)
		}
		//修改任务是否合理，是否可以开启
		switch {
		case taskReq.Status == constant.CommonStatusOngoing.String && taskStatus == constant.CommonStatusReady.String: //Ready->Ongoing，检查任务状态不能修改为启动
			if taskReq.ExecutorId == nil && task.ExecutorID.String == "" {
				return []string{}, errorcode.Desc(errorcode.TaskCannotOpeningNoExecutor)
			}
			//检查前序节点
			if err := t.CanBeOpening(ctx, task); err != nil {
				return []string{}, err
			}
		case taskReq.Status == constant.CommonStatusCompleted.String && taskStatus == constant.CommonStatusOngoing.String: //Ongoing->Completed
			completeTime = time.Now().Unix()
			// 检查业务建模诊断任务、主干业务梳理任务、业务建模任务、数据建模任务完成依赖
			if err := t.checkCompletedDependencies(ctx, task, taskReq); err != nil {
				return nil, err
			}
		case taskReq.Status == constant.CommonStatusOngoing.String && taskStatus == constant.CommonStatusCompleted.String: //Completed->Ongoing,项目管理管才可修改
			if project.OwnerID != taskReq.UpdatedByUID { //todo check node is Completed return false
				return []string{}, errorcode.Desc(errorcode.TaskOnlyProjectOwnerCanChange)
			}
		default:
			return []string{}, errorcode.Desc(errorcode.TaskStatusChangesFailed)
		}
		//如果新建标准任务，并且是修改状态已完成, 检查下字段标准是否都完成了
		if task.TaskType == constant.TaskTypeFieldStandard.Integer.Int32() && taskReq.Status == constant.CommonStatusCompleted.String {
			//检查父任务是否存在
			parentTaskInfo, err := t.taskRepo.GetTask(ctx, task.ParentTaskId)
			if err != nil {
				return []string{}, err
			}
			if parentTaskInfo == nil || parentTaskInfo.ID == "" {
				return []string{}, errorcode.Desc(errorcode.ParentTaskIdNotExists)
			}
			//不检查当然任务是否真的完成，任务没完成，按钮不可带点击
		}
		// goto  UpdateTask
	} else {
		//不修改状态情况
		if taskReq.ExecutorId != nil && *taskReq.ExecutorId == "" && (task.Status == constant.CommonStatusReady.Integer.Int8() || task.Status == constant.CommonStatusOngoing.Integer.Int8()) { //修改执行人空情况
			// goto  UpdateTask
		} else if taskReq.ExecutorId != nil && *taskReq.ExecutorId != "" && (task.Status == constant.CommonStatusReady.Integer.Int8() || task.Status == constant.CommonStatusOngoing.Integer.Int8()) { //修改执行人情况，可以修改
			if _, err := t.userDomain.GetByUserId(ctx, *taskReq.ExecutorId); err != nil {
				return []string{}, errorcode.Desc(errorcode.TaskUserNotExist)
			}
			if err = t.CheckExecutorId(ctx, taskReq.ProjectId, enum.ToString[constant.TaskType](task.TaskType), *taskReq.ExecutorId); err != nil {
				return []string{}, err
			}
			// goto  UpdateTask
		} else if taskReq.ExecutorId != nil && *taskReq.ExecutorId != task.ExecutorID.String && task.Status == constant.CommonStatusCompleted.Integer.Int8() { //修改执行人情况，不可以修改
			return []string{}, errorcode.Desc(errorcode.TaskCanNotChangeExecutor)
		}
		// goto  UpdateTask
	}

	/*	//非初始化状态，ExecutorId  ProjectId StageId NodeId 都不可以修改
		if constant.Status(task.Status) != constant.StatusReady && (taskReq.ExecutorId != task.ExecutorID || taskReq.ProjectId != task.ProjectID || taskReq.StageId != task.StageID || taskReq.NodeId != task.NodeID) {
			return err
		}*/

	/*if taskReq.Name != "" {
		exist, err := t.taskRepo.CheckRepeat(ctx, uri.PId, uri.Id, taskReq.Name)
		if err != nil {
			log.WithContext(ctx).Error("TaskDatabaseError CheckRepeat ", zap.Error(err))
			return errorcode.Desc(errorcode.TaskDatabaseError)
		}
		if exist {
			return errorcode.Desc(errorcode.TaskNameRepeatError)
		}
	}*/
	/*if taskReq.ProjectId != task.ProjectID && taskReq.NodeId != task.NodeID {
		project, err := t.GetProject(ctx, taskReq.ProjectId)
		if err != nil {
			return err
		}
		// 校验NodeId在流程图中是否存在
		err = t.FlowNodeExist(ctx, project.FlowID, project.FlowVersion, taskReq.NodeId)
		if err != nil {
			return err
		}
		nodes, err := t.flowInfoRepo.GetNodes(ctx, project.FlowID, project.FlowVersion)
		if err != nil {
			return errorcode.Desc(errorcode.TaskDatabaseError)
		}
		if len(nodes) == 0 {
			return errorcode.Desc(errorcode.TaskFlowHadNoNode)
		}
		//验证StageId是否必填及有流水线情况下StageUnitID是否有空的可能性
		var hasStage bool
		for _, node := range nodes {
			if node.StageUnitID != "" {
				hasStage = true
			}
			if hasStage && node.StageUnitID == "" { //有流水线情况下StageUnitID是否有空的可能性
				return errorcode.Desc(errorcode.TaskFlowHadNodeNoStage)
			}
		}
		if hasStage && taskReq.StageId == "" { //StageId必填,且未传入
			return errorcode.Desc(errorcode.TaskStageIdIsRequired)
		} else if hasStage { //验证StageId
			var stageLegal bool
			for k, node := range nodes {
				if taskReq.StageId == node.StageUnitID && taskReq.NodeId != node.NodeUnitID {
					stageLegal = true
				} else if taskReq.StageId == node.StageUnitID && taskReq.NodeId == node.NodeUnitID {
					break //StageId找到，且传入的节点属于该Stage
				}
				if stageLegal && k == len(nodes)-1 {
					return errorcode.Desc(errorcode.TaskNodeNotBelongStageId)
				} else if !stageLegal && k == len(nodes)-1 {
					return errorcode.Desc(errorcode.TaskStageIdIllegality)
				}
			}
		}
	} else if taskReq.ProjectId != "" && taskReq.NodeId == "" {
		return errorcode.Desc(errorcode.TaskNodeIdRequired)
	}*/
	//if taskReq.ExecutorId != task.ExecutorID.String && task.Status != constant.CommonStatusReady.Integer.Int8() {
	//	return errorcode.Desc(errorcode.TaskCanNotChangeExecutor)
	//}
	//if task.Status != constant.PriorityStringToInt8(string(taskReq.Status)) && taskReq.ExecutorId != task.ExecutorID.String {
	//	return errorcode.Desc(errorcode.TaskCanNotBothChangeExecutorAndStatus)
	//}
	/*	if taskReq.ExecutorId != "" && taskReq.ExecutorId != task.ExecutorID.String {
		if user := users.GetUser(taskReq.ExecutorId); user == nil {
			return errorcode.Desc(errorcode.TaskUserNotExist)
		}
				//nodeId := task.NodeID
				//if taskReq.NodeId != "" {
				//	nodeId = taskReq.NodeId
				//}
		if err = t.CheckExecutorId(ctx, uri.PId, task.FlowID, task.FlowVersion, task.NodeID, taskReq.ExecutorId); err != nil {
			return err
		}
	}*/
	/*	if taskReq.Status != "" && string(taskReq.Status) != constant.StatusInt8ToString(task.Status) {
		taskReqStatusInt := constant.StatusStringToInt8(string(taskReq.Status))
		if constant.StatusInt8ToString(task.Status) != string(taskReq.Status) && taskReqStatusInt != 0 { //修改状态情况
			if taskReqStatusInt-1 != task.Status {
				return errorcode.Desc(errorcode.TaskStatusChangesFailed)
			}
			if taskReq.Status == constant.CommonStatusOngoing.String { //检查任务状态不能修改为启动
				if taskReq.ExecutorId == "" && task.ExecutorID.String == "" {
					return errorcode.Desc(errorcode.TaskCannotOpeningNoExecutor)
				}
				err = t.CanBeOpening(ctx, task) //检查前序节点
				if err != nil {
					return err
				}

			}
		}
	}*/

	updateTaskModel := taskReq.ToModel(completeTime)
	//如果是修改成已完成，那就标记下可执行状态
	if taskReq.Status != taskStatus && taskReq.Status == constant.CommonStatusCompleted.String {
		updateTaskModel.ExecutableStatus = constant.TaskExecuteStatusCompleted.Integer.Int8()
	}

	taskIds, err2 := t.taskRepo.UpdateTask(ctx, updateTaskModel)
	if err2 != nil {
		log.WithContext(ctx).Error("TaskDatabaseError UpdateTask ", zap.Error(err2))
		return []string{}, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if taskReq.Name == "" {
		taskReq.Name = task.Name
	}
	go t.opLogRepo.Insert(ctx, t.UpdateOperationLog(taskReq, task)...)

	// 如果任务是业务建模诊断任务， 并且是完成，更新诊断任中任务状态
	if task.TaskType == constant.TaskTypeBusinessDiagnosis.Integer.Int32() && taskReq.Status == constant.CommonStatusCompleted.String {
		err := business_grooming.Service.UpdateBusinessDiagnosisTaskStaus(ctx, taskReq.Id)
		if err != nil {
			return nil, err
		}
	}

	return taskIds, nil
}

func (t *TaskUserCase) UpdateOperationLog(taskReq *domain.TaskUpdateReqModel, task *model.TcTask) []*model.OperationLog {
	logs := make([]*model.OperationLog, 0)

	if taskReq.Name != "" && task.Name != taskReq.Name {
		opLog := domain.NewSimpleOperationLog(taskReq, task)
		opLog.Name = "变更任务名称"
		opLog.Result = fmt.Sprintf("由 %s 变为 %s ", task.Name, taskReq.Name)
		logs = append(logs, opLog)
	}

	if taskReq.Status != "" && taskReq.Status != enum.ToString[constant.CommonStatus](task.Status) {
		opLog := domain.NewSimpleOperationLog(taskReq, task)
		opLog.Name = "变更任务状态"
		opLog.Result = fmt.Sprintf("由 %s 变为 %s ", enum.Get[constant.CommonStatus](task.Status).Display,
			enum.Get[constant.CommonStatus](taskReq.Status).Display)
		logs = append(logs, opLog)
	}

	if taskReq.ExecutorId != nil && (*taskReq.ExecutorId) != task.ExecutorID.String {
		opLog := domain.NewSimpleOperationLog(taskReq, task)
		opLog.Name = "变更执行人"
		sourceUserInfo := t.userDomain.GetNameByUserId(context.Background(), task.ExecutorID.String)
		if sourceUserInfo == "" {
			sourceUserInfo = "未分配"
		}
		destUserInfo := t.userDomain.GetNameByUserId(context.Background(), *taskReq.ExecutorId)
		if destUserInfo == "" {
			opLog.Name = "移除任务执行人"
			destUserInfo = "未分配"
		}
		opLog.Result = fmt.Sprintf("由 %s 变为 %s ", sourceUserInfo, destUserInfo)
		logs = append(logs, opLog)
	}

	if taskReq.Priority != "" && string(taskReq.Priority) != enum.ToString[constant.CommonPriority](task.Priority) {
		opLog := domain.NewSimpleOperationLog(taskReq, task)
		opLog.Name = "变更优先级"
		opLog.Result = fmt.Sprintf("从 %s 变更到 %s ", enum.Get[constant.CommonPriority](task.Priority).Display,
			enum.Get[constant.CommonPriority](string(taskReq.Priority)).Display)
		logs = append(logs, opLog)
	}

	if task.Deadline.Int64 == 0 && taskReq.Deadline != nil && (*taskReq.Deadline) != task.Deadline.Int64 {
		opLog := domain.NewSimpleOperationLog(taskReq, task)
		opLog.Name = "添加截止时间"
		logs = append(logs, opLog)
	}

	if task.Deadline.Int64 > 0 && taskReq.Deadline != nil && (*taskReq.Deadline) > 0 && (*taskReq.Deadline) != task.Deadline.Int64 {
		opLog := domain.NewSimpleOperationLog(taskReq, task)
		opLog.Name = "变更截止时间"
		opLog.Result = fmt.Sprintf("由 %s 变为 %s ",
			time.Unix(task.Deadline.Int64, 0).Format(constant.DateTimeFormat),
			time.Unix(*taskReq.Deadline, 0).Format(constant.DateTimeFormat))
		logs = append(logs, opLog)
	}

	return logs
}
func (t *TaskUserCase) CanCreate(ctx context.Context, pId string, nodeId string) error {
	// tasks, err := t.taskRepo.GetTaskByNodeId(ctx, nodeId, pId)
	// if err != nil {
	// 	return errorcode.Desc(errorcode.TaskDatabaseError)
	// }
	// if len(tasks) == 0 { //empty node can create
	// 	return nil
	// }
	// for _, task := range tasks {
	// 	if task.Status != constant.CommonStatusCompleted.Integer.Int8() {
	// 		return nil
	// 	}
	// }
	isCompleted, err := t.projectRepo.IsNodeCompleted(ctx, nil, pId, nodeId)
	if err != nil {
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if isCompleted {
		return errorcode.Desc(errorcode.TaskCannotCreate)
	}
	return nil
}
func (t *TaskUserCase) CheckExecutorId(ctx context.Context, pid, taskType, ExecutorId string) error {
	//roleId, err := t.taskRepo.GetSupportRole(ctx, flowId, flowVersion, nodeId)
	//if err != nil {
	//	if errors.Is(err, gorm.ErrRecordNotFound) {
	//		return errorcode.Desc(errorcode.TaskExecutorUserRoleNotInNode)
	//	}
	//	log.WithContext(ctx).Error("TaskDatabaseError GetSupportRole ", zap.Error(err))
	//	return errorcode.Desc(errorcode.TaskDatabaseError)
	//}
	//roleIds := domain.TaskToRole(ctx, taskType)

	//check Node Executor roleId
	//if _, err := configuration_center.GetRolesInfo(ctx, roleIds); err != nil {
	//	return errorcode.Detail(errorcode.TaskNodeExecutorRoleIdNotExist, err.Error())
	//}

	members, err := t.taskRepo.GetSupportUserIdsFromProjectById(ctx, pid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.TaskExecutorUserNotHasMembersInProject)
		}
		log.WithContext(ctx).Error("TaskDatabaseError GetSupportUserIdsFromProjectByRoleId ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if len(members) == 0 {
		return errorcode.Desc(errorcode.TaskProjectMembersIsEmpty)
	}
	//ExecutorId in members
	for i, member := range members {
		if member.UserID == ExecutorId {
			break
		}
		if i == len(members)-1 {
			return errorcode.Desc(errorcode.TaskExecutorUserNotInProjectMembers)
		}
	}
	return nil
}

// CanBeOpening 只检查了邻近节点
func (t *TaskUserCase) CanBeOpening(ctx context.Context, task *model.TcTask) error {
	nowFlowInfo, err := t.flowInfoRepo.GetById(ctx, task.FlowID, task.FlowVersion, task.NodeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.TaskNodeNotExist)
		}
		log.WithContext(ctx).Error("TaskDatabaseError GetById ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if nowFlowInfo.PrevNodeUnitIds == "" { //没有前序节点，第一节点不用验证是否可以开启
		return nil
	}
	split := strings.Split(nowFlowInfo.PrevNodeUnitIds, ",")
	preFlowInfos, err := t.flowInfoRepo.GetByIds(ctx, task.FlowID, task.FlowVersion, split)
	if err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError GetByIds ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if len(preFlowInfos) != len(split) {
		return errorcode.Desc(errorcode.TaskHasPreNodeNotExist)
	}
	switch nowFlowInfo.NodeStartMode {
	case constant.AllNodeCompletion.ToString():
		for _, flowInfo := range preFlowInfos {
			isCompleted, err := t.projectRepo.IsNodeCompleted(ctx, nil, task.ProjectID, flowInfo.NodeUnitID)
			if err != nil {
				log.WithContext(ctx).Error("TaskDatabaseError IsNodeCompleted ", zap.Error(err))
				return errorcode.Desc(errorcode.TaskDatabaseError)
			}
			if !isCompleted {
				return errorcode.Desc(errorcode.TaskCannotOpening1)
			}

			// preflowInfoTasks, err := t.taskRepo.GetTaskByNodeId(ctx, flowInfo.NodeUnitID, task.ProjectID)
			// if err != nil {
			// 	log.WithContext(ctx).Error("TaskDatabaseError GetByIds ", zap.Error(err))
			// 	return errorcode.Desc(errorcode.TaskDatabaseError)
			// }
			// if len(preflowInfoTasks) == 0 {
			// 	return errorcode.Desc(errorcode.TaskHasPreNodeTasksEmpty) //发现一个前序节点为空就报错
			// }
			// for _, preflowInfoTask := range preflowInfoTasks {
			// 	if preflowInfoTask.Status != constant.CommonStatusCompleted.Integer.Int8() {
			// 		//return errorcode.Desc(errorcode.TaskCannotOpening, "请完成全部前序节点")
			// 		return errorcode.Desc(errorcode.TaskCannotOpening1)
			// 	}
			// }
		}
		//all preFlowInfos had Completed
		return nil
	case constant.AnyNodeCompletion.ToString():
		if len(preFlowInfos) == 0 {
			return nil
		}

		// var emptyNodeNum int
		for _, flowInfo := range preFlowInfos {
			isCompleted, err := t.projectRepo.IsNodeCompleted(ctx, nil, task.ProjectID, flowInfo.NodeUnitID)
			if err != nil {
				log.WithContext(ctx).Error("TaskDatabaseError IsNodeCompleted ", zap.Error(err))
				return errorcode.Desc(errorcode.TaskDatabaseError)
			}
			if isCompleted {
				return nil
			}

			// preflowInfoTasks, err := t.taskRepo.GetTaskByNodeId(ctx, flowInfo.NodeUnitID, task.ProjectID)
			// if err != nil {
			// 	log.WithContext(ctx).Error("TaskDatabaseError GetByIds ", zap.Error(err))
			// 	return errorcode.Desc(errorcode.TaskDatabaseError)
			// }
			// if len(preflowInfoTasks) == 0 {
			// 	emptyNodeNum++
			// 	continue
			// }
			// var complateCount int
			// for _, preflowInfoTask := range preflowInfoTasks {
			// 	if preflowInfoTask.Status == constant.CommonStatusCompleted.Integer.Int8() {
			// 		complateCount++
			// 	}
			// }
			// //once preFlowInfo had Completed
			// if complateCount == len(preflowInfoTasks) && len(preflowInfoTasks) != 0 {
			// 	return nil
			// }
		}
		// if len(preFlowInfos) == emptyNodeNum { //全部相邻前序节点都是空的
		// 	return errorcode.Desc(errorcode.TaskAllPreNodeTasksEmpty)
		// }
		//return errorcode.Desc(errorcode.TaskCannotOpening, "请完成任意一个前序节点")
		return errorcode.Desc(errorcode.TaskCannotOpening2)
		/*	case constant.AnyNodeStart.ToString():
			if len(preFlowInfos) == 0 {
				return nil
			}
			var emptyNodeNum int
			for _, flowInfo := range preFlowInfos {
				preflowInfoTasks, err := t.taskRepo.GetTaskByNodeId(ctx, flowInfo.NodeUnitID, task.ProjectID)
				if err != nil {
					log.WithContext(ctx).Error("TaskDatabaseError GetByIds ", zap.Error(err))
					return errorcode.Desc(errorcode.TaskDatabaseError)
				}
				if len(preflowInfoTasks) == 0 {
					emptyNodeNum++
				}
				for _, preflowInfoTask := range preflowInfoTasks {
					if preflowInfoTask.Status != constant.CommonStatusReady.Integer.Int8() {
						return nil
					}
				}
			}
			if len(preFlowInfos) == emptyNodeNum { //全部相邻前序节点都是空的
				return errorcode.Desc(errorcode.TaskPreNodeTasksEmpty)
			}
			return errorcode.Desc(errorcode.TaskCannotOpening, "请将任意前序节点设为启动状态")*/
	}
	return errorcode.Desc(errorcode.TaskCannotOpening)
}

func (t *TaskUserCase) ProjectExist(ctx context.Context, pid string) error {
	if err := t.taskRepo.ExistProject(ctx, pid); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.TaskProjectNotFound)
		}
		log.WithContext(ctx).Error("TaskDatabaseError ExistPid ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return nil
}
func (t *TaskUserCase) GetProject(ctx context.Context, pid string) (*model.TcProject, error) {
	project, err := t.taskRepo.GetProject(ctx, pid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskProjectNotFound)
		}
		log.WithContext(ctx).Error("TaskDatabaseError ExistPid ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return project, nil
}

// GetFlowNode 获取node，判断是否存在
func (t *TaskUserCase) GetFlowNode(ctx context.Context, fid, flowVersion, nid string) (*model.TcFlowInfo, error) {
	nodeInfo, err := t.flowInfoRepo.GetByNodeId(ctx, fid, flowVersion, nid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskNodeNotExist)
		}
		log.WithContext(ctx).Error("TaskDatabaseError GetByFlowIdAndFlowVersion ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return nodeInfo, nil
}
func (t *TaskUserCase) TaskExist(ctx context.Context, pid, id string) error {
	if _, err := t.taskRepo.GetTaskByTaskId(ctx, pid, id); err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.TaskTaskNotFound)
		}
		log.WithContext(ctx).Error("TaskDatabaseError GetTaskByTaskId ", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return nil
}
func (t *TaskUserCase) GetTask(ctx context.Context, pid, id string) (*model.TcTask, error) {
	res, err := t.taskRepo.GetTaskByTaskId(ctx, pid, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskTaskNotFound)
		}
		log.WithContext(ctx).Error("TaskDatabaseError GetTaskByTaskId ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return res, nil
}
func (t *TaskUserCase) GetTaskExecutors(ctx context.Context, taskReq domain.TaskUserId) ([]*model.User, error) {
	userIds, err := t.taskRepo.GetAllTaskExecutors(ctx, taskReq.UId)
	if err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError GetAllTaskExecutors ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//var resUsers []*users.UserInfo
	users, err := t.userRepo.ListUserByIDs(ctx, userIds...)
	if err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError ListUserByIDs ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	/*	resUsers := make([]*users.UserInfo, 0)
		for _, userId := range userIds {
			if user := users.GetUser(userId); user != nil {
				resUsers = append(resUsers, user)
			}
		}*/
	return users, nil
}
func (t *TaskUserCase) GetProjectTaskExecutors(ctx context.Context, taskReq domain.TaskPathProjectId) ([]*model.User, error) {
	if err := t.ProjectExist(ctx, taskReq.PId); err != nil {
		return nil, err
	}
	userIds, err := t.taskRepo.GetProjectTaskExecutors(ctx, taskReq.PId)
	if err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError GetProjectTaskExecutors ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	users, err := t.userRepo.ListUserByIDs(ctx, userIds...)
	if err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError ListUserByIDs ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	/*	resUsers := make([]*users.UserInfo, 0)
		for _, userId := range userIds {
			if user := users.GetUser(userId); user != nil {
				resUsers = append(resUsers, user)
			}
		}*/
	return users, nil
}

//func TasksToRoleDump(ctx context.Context, taskTypes ...string) []string {
//	rolesMap := make(map[string]struct{})
//	for _, taskType := range taskTypes {
//		switch {
//		case constant.TaskTypeNormal.String == taskType:
//			res = append(res, access_control.ProjectMgm, access_control.SystemMgm, access_control.BusinessMgm, access_control.BusinessOperationEngineer, access_control.StandardMgmEngineer, access_control.DataQualityEngineer, access_control.DataAcquisitionEngineer, access_control.DataProcessingEngineer, access_control.IndicatorMgmEngineer)
//		case constant.TaskTypeModeling.String == taskType:
//			rolesMap[access_control.BusinessOperationEngineer] = struct{}{}
//		case constant.TaskTypeStandardization.String == taskType:
//			res = append(res, access_control.BusinessOperationEngineer)
//		case constant.TaskTypeIndicator.String == taskType:
//			res = append(res, access_control.IndicatorMgmEngineer)
//		case constant.TaskTypeFieldStandard.String == taskType:
//			res = append(res, access_control.StandardMgmEngineer)
//		case constant.TaskTypeDataCollecting.String == taskType:
//			res = append(res, access_control.DataAcquisitionEngineer)
//		case constant.TaskTypeDataProcessing.String == taskType:
//			res = append(res, access_control.DataProcessingEngineer)
//		default:
//			log.WithContext(ctx).Error("TaskToRole error taskType ", zap.String("taskType", taskType))
//		}
//	}
//	var res []string
//	for k, _ := range rolesMap {
//		res = append(res, k)
//	}
//	return res
//}

func (t *TaskUserCase) GetTaskMember(ctx context.Context, taskReq domain.TaskPathTaskType) ([]*model.User, error) {
	if err := t.ProjectExist(ctx, taskReq.PId); err != nil {
		return nil, err
	}
	roleIds := domain.TaskToRole(ctx, taskReq.TaskType)
	/*	roleId, err := t.taskRepo.GetTaskSupportRole(ctx, taskReq.PId, taskReq.NId)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errorcode.Desc(errorcode.TaskNodeNotExist)
			}
			log.WithContext(ctx).Error("TaskDatabaseError GetTaskSupportRole ", zap.Error(err))
			return nil, errorcode.Desc(errorcode.TaskDatabaseError)
		}*/
	resUsers := make([]*model.User, 0)
	if len(roleIds) == 0 {
		return resUsers, nil
	}
	members, err := t.taskRepo.GetSupportUserIdsFromProjectByRoleIds(ctx, roleIds, taskReq.PId)
	if err != nil {
		log.WithContext(ctx).Error("TaskDatabaseError GetSupportUserIdsFromProjectByRoleIds ", zap.Error(err))
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	//过滤下当前用户，检查是否还是该角色的用户
	userIds := make(map[string]struct{})
	for _, m := range members {
		userIds[m.UserID] = struct{}{}
	}
	roleInfos, err := configuration_center.GetRolesInfo(ctx, roleIds)
	if err != nil {
		return nil, errorcode.Detail(errorcode.TaskNodeExecutorRoleIdNotExist, err.Error())
	}
	userIdsMap := make(map[string]int)
	for _, roleInfo := range roleInfos {
		for _, uid := range roleInfo.UserIds {
			userIdsMap[uid] = 1
		}
	}
	//var resUsers []*users.UserInfo
	uniqueMap := make(map[string]int)
	for _, member := range members {
		_, ok := userIdsMap[member.UserID]
		if !ok {
			continue //验证members中脏数据 ，member.UserID不是该role的用户
		}
		if _, has := uniqueMap[member.UserID]; has {
			continue
		} else {
			uniqueMap[member.UserID] = 1
		}
		if u, err := t.userDomain.GetByUserId(ctx, member.UserID); err == nil { //不存在的用户也不添加
			if u.Status == int32(constant.UserNormal) {
				resUsers = append(resUsers, u)
			}
		}
	}
	return resUsers, nil
}

func (t *TaskUserCase) GetDetail(ctx context.Context, id string) (*domain.TaskDetailModel, error) {
	taskBrief, err := t.taskRepo.GetTaskBriefById(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	newMainBusinessID := t.GetNewMainBusinessID(ctx, taskBrief)
	//如果没有绑定项目，直接返回简单的任务信息
	if taskBrief.ProjectID == "" {
		ids, err := t.relationDataRepo.GetByTaskId(ctx, taskBrief.ID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
		}
		taskDetailInfo, err := domain.ToHttpStandaloneDetail(ctx, taskBrief, ids...)
		if err != nil {
			taskDetailInfo.ConfigStatus = constant.TaskConfigStatusMainBusinessDeleted.String
			log_v0.Error(err.Error())
		} else {
			taskDetailInfo.NewMainBusinessId = newMainBusinessID
		}
		if err := t.fixRelationData(ctx, taskDetailInfo); err != nil {
			log.Error(err.Error())
		}
		if taskDetailInfo.DataComprehensionTemplateID != "" {
			templateDetail, err := t.datalogCommonDriven.GetTemplateDetail(ctx, taskDetailInfo.DataComprehensionTemplateID)
			if err != nil {
				return nil, err
			}
			taskDetailInfo.DataComprehensionTemplateName = templateDetail.Name
		}
		if taskBrief.WorkOrderId != "" {
			workOrder, err := t.workOrderRepo.GetById(ctx, taskBrief.WorkOrderId)
			if err != nil {
				// 记录日志
				log.WithContext(ctx).Error("TaskDatabaseError GetWorkOrder ", zap.Error(err))
			} else {
				taskDetailInfo.WorkOrderName = workOrder.Name
			}
		}

		return taskDetailInfo, nil
	}
	//任务绑定了项目，查询项目，流水线等信息
	taskDetail, err := t.taskRepo.GetTask(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	detailModel := &domain.TaskDetailModel{
		ExecutorName: t.userDomain.GetNameByUserId(ctx, taskDetail.ExecutorID),
		CreatedBy:    t.userDomain.GetNameByUserId(ctx, taskDetail.CreatedByUID),
		UpdatedBy:    t.userDomain.GetNameByUserId(ctx, taskDetail.UpdatedByUID),
	}
	taskDetailInfo, err := detailModel.ToHttp(ctx, taskDetail)
	if err != nil {
		return nil, err
	}
	if err := t.fixRelationData(ctx, taskDetailInfo); err != nil {
		log.Error(err.Error())
	}
	taskDetailInfo.NewMainBusinessId = newMainBusinessID
	return taskDetailInfo, nil
}

func (t *TaskUserCase) GetBriefTaskByModelID(ctx context.Context, id string) (*domain.TaskBriefModel, error) {
	taskDetail, err := t.taskRepo.GetTaskBriefByModelId(ctx, id)
	if err != nil {
		log_v0.Error(err.Error())
		return &domain.TaskBriefModel{}, nil
	}
	project, err := t.taskRepo.GetProject(ctx, taskDetail.ProjectID)
	if err != nil {
		log_v0.Error(err.Error())
		err = nil
		project = new(model.TcProject)
	}
	var modelChildTaskTypesArr = make([]string, 0)
	if taskDetail.ModelChildTaskTypes != "" {
		modelChildTaskTypesArr = strings.Split(taskDetail.ModelChildTaskTypes, ",")
	}
	briefTask := &domain.TaskBriefModel{
		Id:                  taskDetail.ID,
		Name:                taskDetail.Name,
		ProjectId:           taskDetail.ProjectID,
		ProjectName:         project.Name,
		BusinessModelID:     taskDetail.BusinessModelID,
		Executor:            taskDetail.ExecutorID.String,
		ConfigStatus:        enum.ToString[constant.TaskConfigStatus](taskDetail.ConfigStatus),
		TaskType:            enum.ToString[constant.TaskType](taskDetail.TaskType),
		Status:              enum.ToString[constant.CommonStatus](taskDetail.Status),
		ModelChildTaskTypes: modelChildTaskTypesArr,
	}
	return briefTask, nil
}

func (t *TaskUserCase) GetTaskInfo(ctx context.Context, id string) (*domain.TaskInfo, error) {
	taskDetail, err := t.taskRepo.GetTaskInfoById(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	if taskDetail.ID == "" {
		return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
	}
	return (&domain.TaskInfo{}).ToHttp(ctx, taskDetail), nil
}

func (t *TaskUserCase) GetTaskBriefInfo(ctx context.Context, reqData *domain.BriefTaskQueryModel) ([]map[string]any, error) {
	taskInfos, err := t.taskRepo.GetTaskBriefByIdSlice(ctx, strings.Join(reqData.FieldSlice, ","), reqData.IDSlice...)
	if err != nil {
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	results := make([]map[string]any, 0)
	if len(taskInfos) <= 0 {
		return results, nil
	}
	for i := range taskInfos {
		bs, _ := json.Marshal(domain.ToTaskBrief(taskInfos[i]))
		item := make(map[string]any)
		if err := json.Unmarshal(bs, &item); err != nil {
			log.Warnf("unmarshal task brief info error %v", err)
			continue
		}
		if len(reqData.FieldSlice) <= 0 {
			results = append(results, item)
			continue
		}
		result := make(map[string]any)
		for j := range reqData.FieldSlice {
			result[reqData.FieldSlice[j]] = item[reqData.FieldSlice[j]]
		}
		results = append(results, result)
	}
	return results, nil
}

func (t *TaskUserCase) ListTasks(ctx context.Context, query domain.TaskQueryParam) (*domain.QueryPageReapParam, error) {
	countInfo, err := t.taskRepo.Count(ctx, query.UserId, query.TaskType)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	resp := &domain.QueryPageReapParam{
		TotalCreatedTasks:    countInfo.TotalCreatedTasks,
		TotalProcessedTasks:  countInfo.TotalProcessedTasks,
		TotalBlockedTasks:    countInfo.TotalBlockedTasks,
		TotalExecutableTasks: countInfo.TotalExecutableTasks,
		TotalInvalidTasks:    countInfo.TotalInvalidTasks,
		TotalCompletedTasks:  countInfo.TotalCompletedTasks,
	}
	//如果只是想查询数量，立即返回统计即可
	if query.Statistics {
		resp.TotalCount = 0
		resp.Entries = make([]*domain.TaskInfo, 0)
		return resp, nil
	}
	//if !form_validator.CheckKeyWord32(&query.Keyword) {
	//	log.WithContext(ctx).Warnf("keyword is invalid, keyword: %s", query.Keyword)
	//	resp.Entries = make([]*domain.TaskInfo, 0)
	//	return resp, nil
	//}
	createdBy := ""
	project := new(model.TcProject)
	if query.ProjectId != "" {
		project, err = t.GetProject(ctx, query.ProjectId)
		if err != nil {
			return resp, err
		}
		if query.NodeId != "" {
			if _, err = t.GetFlowNode(ctx, project.FlowID, project.FlowVersion, query.NodeId); err != nil {
				return resp, err
			}
		}
	} else if query.WorkOrderId != "" {
		// query.ExecutorId = ""
	} else {
		if query.NodeId != "" {
			return resp, errorcode.Desc(errorcode.TaskLackProjectId)
		}
		if query.IsCreate {
			createdBy = query.UserId
		} else {
			if query.ExecutorId == "" {
				query.ExecutorId = query.UserId
			} else if query.ExecutorId != query.UserId {
				return resp, errorcode.Desc(errorcode.TaskExecutorFilteringFailed)
			}
		}
	}
	//如果是查询前置节点，给出所有的前置节点ID
	if query.ProjectId != "" && query.NodeId != "" && query.IsPre {
		flowInfos, err := t.flowInfoRepo.GetNodes(ctx, project.FlowID, project.FlowVersion)
		if err != nil {
			return nil, errorcode.Desc(errorcode.TaskDatabaseError)
		}
		hasNode := false
		// #按照固定的顺序排序
		nodesMap := make(map[string]*model.TcFlowInfo)
		for _, flowInfo := range flowInfos {
			if flowInfo.NodeUnitID == query.NodeId {
				hasNode = true
			}
			nodesMap[flowInfo.NodeUnitID] = flowInfo
		}
		if !hasNode {
			return nil, errorcode.Desc(errorcode.TaskNodeNotExist)
		}
		currentNode := nodesMap[query.NodeId]
		query.PreNodes = domain.GetUniquePreNodeIds(nodesMap, currentNode)
		if len(query.PreNodes) <= 0 {
			resp.TotalCount = 0
			resp.Entries = make([]*domain.TaskInfo, 0)
			return resp, nil
		}
	}

	//query.Keyword = strings.Replace(query.Keyword, "_", "\\_", -1)
	tasks, count, err := t.taskRepo.GetTasks(ctx, query, createdBy)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return resp, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return resp, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	//查询下结果中的业务表标准化
	taskList := make([]*domain.TaskInfo, 0)
	for _, task := range tasks {
		taskInfo := (&domain.TaskInfo{
			ExecutorName: t.userDomain.GetNameByUserId(ctx, task.ExecutorID),
			UpdatedBy:    t.userDomain.GetNameByUserId(ctx, task.UpdatedByUID),
		}).ToHttp(ctx, task)
		//如果是新建标准任务，不补充进度，由前端挨个调用
		//
		if task.TaskType == constant.TaskTypeDataCollecting.Integer.Int32() {
			// 查看model id是否还在
			// 获取关联数据信息
			_, err := business_grooming.GetRemoteBusinessModelInfo(ctx, task.BusinessModelID)
			if err != nil {
				taskInfo.ConfigStatus = constant.TaskConfigStatusMainBusinessDeleted.String
				log_v0.Error(err.Error())
				err = nil
			}
		}
		if (task.TaskType == constant.TaskTypeNewMainBusiness.Integer.Int32() || task.TaskType == constant.TaskTypeDataMainBusiness.Integer.Int32()) && task.BusinessModelID != "" {
			// todo check domain exist
			_, err = business_grooming.GetRemoteDomainInfo(ctx, task.BusinessModelID)
			if err != nil {
				taskInfo.ConfigStatus = constant.TaskConfigStatusBusinessDomainDeleted.String
				log_v0.Error(err.Error())
				err = nil
			}
		}

		//taskInfo.ExecuteStatus = t.executeStatus(ctx, task)
		taskList = append(taskList, taskInfo)

	}
	if query.Sort == "deadline" && query.Direction == "asc" {
		tmp := make([]*domain.TaskInfo, 0)
		for _, task := range taskList {
			if task.Deadline != 0 {
				tmp = append(tmp, task)
			}
		}
		for _, task := range taskList {
			if task.Deadline == 0 {
				tmp = append(tmp, task)
			}
		}
		taskList = tmp
	}
	resp.TotalCount = count
	resp.Entries = taskList
	return resp, nil
}

type NodeInfoSlice []*domain.NodeInfo

func (s NodeInfoSlice) Len() int {
	return len(s)
}

func (s NodeInfoSlice) Swap(i, j int) {
	s[i], s[j] = s[j], s[i]
}

func UTF82GBK(src string) ([]byte, error) {
	GB18030 := simplifiedchinese.All[0]
	return ioutil.ReadAll(transform.NewReader(bytes.NewReader([]byte(src)), GB18030.NewEncoder()))
}

func (s NodeInfoSlice) Less(i, j int) bool {
	a, _ := UTF82GBK(s[i].NodeName)
	b, _ := UTF82GBK(s[j].NodeName)
	bLen := len(b)
	for index, chr := range a {
		if index > bLen-1 {
			return false
		}
		if chr != b[index] {
			return chr < b[index]
		}
	}
	return true
}

func (t *TaskUserCase) GetNodes(ctx context.Context, pid string) ([]*domain.NodeInfo, int64, error) {
	project, err := t.GetProject(ctx, pid)
	if err != nil {
		return nil, 0, err
	}
	nodeInfo, count, err := t.taskRepo.GetNodeInfo(ctx, project.FlowID, project.FlowVersion)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return nil, 0, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}

	nodeInfoList := make([]*domain.NodeInfo, 0)
	stageId := nodeInfo[0].StageID
	if stageId == "" {
		for _, node := range nodeInfo {
			nodeInfoList = append(nodeInfoList, (&domain.NodeInfo{}).ToHttp(ctx, node))
		}
		sort.Sort(NodeInfoSlice(nodeInfoList))
		return nodeInfoList, count, nil
	}
	tmpList := make([]*domain.NodeInfo, 0)
	for _, node := range nodeInfo {
		if stageId == node.StageID {
			tmpList = append(tmpList, (&domain.NodeInfo{}).ToHttp(ctx, node))
		} else {
			sort.Sort(NodeInfoSlice(tmpList))
			for _, node := range tmpList {
				nodeInfoList = append(nodeInfoList, node)
			}
			tmpList = nil
			stageId = node.StageID
			tmpList = append(tmpList, (&domain.NodeInfo{}).ToHttp(ctx, node))
		}
	}
	sort.Sort(NodeInfoSlice(tmpList))
	for _, node := range tmpList {
		nodeInfoList = append(nodeInfoList, node)
	}
	return nodeInfoList, count, nil
}

func (t *TaskUserCase) GetRateInfo(ctx context.Context, pid string) ([]*domain.RateInfo, error) {
	project, err := t.GetProject(ctx, pid)
	if err != nil {
		return nil, err
	}
	flowInfos, err := t.flowInfoRepo.GetNodes(ctx, project.FlowID, project.FlowVersion)
	taskInfo, err := t.taskRepo.GetStatusInfo(ctx, pid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}

	// 获取属于这个项目的工单
	orders, _, err := t.workOrderRepo.ListV2(ctx, work_order.ListOptions{
		Scopes: []func(*gorm.DB) *gorm.DB{
			scope.SourceType(domain_work_order.WorkOrderSourceTypeProject.Integer.Int32()),
			scope.SourceID(pid),
		},
	})
	if err != nil {
		return nil, errorcode.Detail(errorcode.WorkOrderDatabaseError, err.Error())
	}

	rateInfoList := make([]*domain.RateInfo, 0)
	for _, flow := range flowInfos {
		rateInfo := new(domain.RateInfo)
		for _, task := range taskInfo {
			if task.NodeID == flow.NodeUnitID {
				rateInfo.TotalCount++
				if task.Status == constant.CommonStatusCompleted.Integer.Int8() {
					rateInfo.FinishedCount++
				}
			}
		}
		rateInfo.TotalCount += uint64(lo.CountBy(orders, workOrderNodeIDEqual(flow.NodeUnitID)))
		rateInfo.FinishedCount += uint64(lo.CountBy(orders, workOrderNodeIDEqualAndFinished(flow.NodeUnitID)))
		rateInfo.NodeId = flow.NodeUnitID
		rateInfoList = append(rateInfoList, rateInfo)
	}
	return rateInfoList, nil
}
func (t *TaskUserCase) DeleteTask(ctx context.Context, req domain.BriefTaskPathModel) (string, error) {
	task, err := t.GetTask(ctx, "", req.Id)
	if err != nil {
		return "", err
	}
	//正常情况下，已完成任务不可删除
	if task.Status == constant.CommonStatusCompleted.Integer.Int8() && task.ConfigStatus == constant.TaskConfigStatusNormal.Integer.Int8() {
		return "", errorcode.Desc(errorcode.TaskCanNotDelete)
	}
	//如果任务有项目绑定，那就校验下，已经完成的项目，不能删除任务
	if task.ProjectID != "" {
		project, err := t.GetProject(ctx, task.ProjectID)
		if err != nil {
			return "", err
		}
		if project.Status == constant.CommonStatusCompleted.Integer.Int8() {
			return "", errorcode.Desc(errorcode.TaskProjectCompletedNoDelete)
		}
	}
	//查询关联数据
	nodeID := ""
	relationData, err := t.relationDataRepo.GetDetailByTaskId(ctx, task.ID)
	if err != nil {
		log.WithContext(ctx).Infof("query task relation data error %v", err.Error())
	} else {
		nodeID = relationData.BusinessModelId
	}
	//删除任务
	if err = t.taskRepo.Delete(ctx, task); err != nil {
		return "", err
	}
	if _, err := t.taskRepo.UpdateFollowExecutable(ctx, task, "", t.SendTaskDeletedMsgFunc(ctx, task, nodeID)); err != nil {
		return "", errorcode.Detail(errorcode.TaskActiveFollowError, err.Error())
	}
	return task.Name, nil
}

// DeleteTaskExecutorsUseRole 删除未完成任务的执行人
func (t *TaskUserCase) DeleteTaskExecutorsUseRole(ctx context.Context, roleId string, userId string) error {
	projects, err := t.taskRepo.GetHasMemberRoleProject(ctx, roleId, userId)
	if err != nil {
		log.WithContext(ctx).Error("GetHasMemberRoleProject DatabaseError ", zap.Error(err))
		return err
	}
	if len(projects) == 0 {
		log.WithContext(ctx).Warn("GetHasMemberRoleProject empty")
		return nil
	}
	projectIds := make([]string, len(projects), len(projects))
	for i, project := range projects {
		projectIds[i] = project.ID
	}
	log.Debugf("GetHasMemberRoleProject projectId :%v", projectIds)
	if err = t.taskRepo.DeleteExecutorsByRoleIdUserId(ctx, roleId, userId, projectIds); err != nil {
		log.WithContext(ctx).Error("DeleteExecutorsByRoleIdUserId DatabaseError ", zap.Error(err))
		return err
	}
	return nil
}

// HandleDeleteMainBusinessMessage 处理删除业务域主干业务的消息
func (t *TaskUserCase) HandleDeleteMainBusinessMessage(ctx context.Context, executorID string, businessModelId string) error {
	tasks, err := t.taskRepo.GetTaskByDomain(ctx, "", businessModelId)
	if err != nil {
		return err
	}
	taskIds := make([]string, 0)
	opLogs := make([]*model.OperationLog, 0)
	for _, task := range tasks {
		if err = t.relationDataRepo.Delete(ctx, task.ID, ""); err != nil {
			log.WithContext(ctx).Error(err.Error())
		}
		if task.ProjectID == "" {
			taskIds = append(taskIds, task.ID)
			task.ConfigStatus = constant.TaskConfigStatusMainBusinessDeleted.Integer.Int8()
			opLogs = append(opLogs, domain.TaskDiscardOperationLog(task, executorID))
		}
	}
	if err := t.taskRepo.DeleteTaskMainBusiness(ctx, taskIds...); err != nil {
		return err
	}
	go t.opLogRepo.Insert(ctx, opLogs...)
	return nil
}

// HandleDeleteBusinessDomainMessage 处理删除业务域的消息
func (t *TaskUserCase) HandleDeleteBusinessDomainMessage(ctx context.Context, executorID string, subjectDomainId string) error {
	tasks, err := t.taskRepo.GetTaskByDomain(ctx, subjectDomainId, "")
	if err != nil {
		return err
	}
	taskIds := make([]string, 0)
	opLogs := make([]*model.OperationLog, 0)
	for _, task := range tasks {
		if task.ProjectID == "" {
			taskIds = append(taskIds, task.ID)
			task.ConfigStatus = constant.TaskConfigStatusBusinessDomainDeleted.Integer.Int8()
			opLogs = append(opLogs, domain.TaskDiscardOperationLog(task, executorID))
		}
	}
	if err := t.taskRepo.DeleteTaskBusinessDomain(ctx, taskIds...); err != nil {
		return err
	}
	go t.opLogRepo.Insert(ctx, opLogs...)
	return nil
}

func (t *TaskUserCase) GetFollowNodes(ctx context.Context, task *model.TcTask) (flowInfos []*model.TcFlowInfo, err error) {
	nowFlowInfo, err := t.flowInfoRepo.GetById(ctx, task.FlowID, task.FlowVersion, task.NodeID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskNodeNotExist)
		}
		log.WithContext(ctx).Error("GetNextNodes TaskDatabaseError GetById ", zap.Error(err))
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	followFlowInfos, err := t.flowInfoRepo.GetFollowNodes(ctx, nowFlowInfo.NodeUnitID)
	if err != nil {
		log.WithContext(ctx).Error("GetNextNodes TaskDatabaseError GetByIds ", zap.Error(err))
		return flowInfos, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if len(followFlowInfos) <= 0 {
		return flowInfos, errorcode.Desc(errorcode.TaskHasPreNodeNotExist)
	}
	return flowInfos, nil
}

// HandleModifyBusinessDomainMessage 处理删除业务域的消息
func (t *TaskUserCase) HandleModifyBusinessDomainMessage(ctx context.Context, subjectDomainId string, businessModelId string) error {
	return nil
	//tasks, err := t.taskRepo.GetTaskByDomain(ctx, "", businessModelId)
	//if err != nil {
	//	return err
	//}
	//modifyTasks := make([]*model.TcTask, 0)
	//for _, task := range tasks {
	//	if task.TaskType == constant.TaskTypeIndicator.Integer.Int32() {
	//		modifyTasks = append(modifyTasks, &model.TcTask{
	//			ID:              task.ID,
	//			BusinessModelID: task.BusinessModelID,
	//			SubjectDomainId: subjectDomainId,
	//		})
	//	}
	//}
	//return t.taskRepo.UpdateMultiTasks(ctx, modifyTasks...)
}

// HandleDeletedBusinessFormMessage 处理删除业务表的消息
func (t *TaskUserCase) HandleDeletedBusinessFormMessage(ctx context.Context, businessModelId string, formId string) error {
	taskIds, err := t.relationDataRepo.GetTaskIds(ctx, businessModelId, formId)
	if err != nil {
	}
	if err := t.taskRepo.DiscardTaskBecauseOfFormInvalid(ctx, taskIds...); err != nil {
		return errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	opLogs := make([]*model.OperationLog, 0, len(taskIds))
	for _, taskId := range taskIds {
		task := &model.TcTask{
			ID:           taskId,
			ConfigStatus: constant.TaskConfigStatusFormDeleted.Integer.Int8(),
		}
		opLog := domain.TaskDiscardOperationLog(task, "")
		opLogs = append(opLogs, opLog)
	}
	t.opLogRepo.Insert(ctx, opLogs...)
	return nil
}

// SendTaskDeletedMsgFunc  发送删除任务的消息
func (t *TaskUserCase) SendTaskDeletedMsgFunc(ctx context.Context, task *model.TcTask, nodeID string) func() error {
	return func() error {
		//删除成功，项目中的建模任务发送下消息
		if task.ProjectID != "" && nodeID != "" {
			if task.TaskType != constant.TaskTypeNewMainBusiness.Integer.Int32() && task.TaskType != constant.TaskTypeDataMainBusiness.Integer.Int32() {
				return nil
			}
			token, err := user_util.ObtainToken(ctx)
			if err != nil {
				log.WithContext(ctx).Error("publish msg obtain token error", zap.Any("topic", constant.DeleteTaskTopic), zap.Error(err))
				return err
			}
			msg := NewTaskDeletedMsg(nodeID, token, task.TaskType)
			bytes, _ := json.Marshal(msg)
			if err = t.producer.Send(constant.DeleteTaskTopic, bytes); err != nil {
				log.WithContext(ctx).Error("publish msg error", zap.Any("topic", constant.DeleteTaskTopic), zap.Error(err))
				return err
			}
		}
		return nil
	}
}
func (t *TaskUserCase) GetComprehensionTemplateRelation(ctx context.Context, req *domain.GetComprehensionTemplateRelationReq) (*domain.GetComprehensionTemplateRelationRes, error) {
	tasks, err := t.taskRepo.GetComprehensionTemplateRelation(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}

	res := make([]string, len(tasks))
	for i, task := range tasks {
		res[i] = task.DataComprehensionTemplateId
	}
	return &domain.GetComprehensionTemplateRelationRes{
		TemplateIds: res,
	}, nil
}

// workOrderNodeIDEqual 判断工单是否属于指定节点
func workOrderNodeIDEqual(id string) func(model.WorkOrder) bool {
	return func(o model.WorkOrder) bool {
		return o.NodeID == id
	}
}

// workOrderNodeIDEqualAndFinished 判断工单是否属于指定节点且已完成
func workOrderNodeIDEqualAndFinished(id string) func(model.WorkOrder) bool {
	return func(o model.WorkOrder) bool {
		return o.NodeID == id && o.Status == domain_work_order.WorkOrderStatusFinished.Integer.Int32()
	}
}
