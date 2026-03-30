package impl

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task"
	relationData "github.com/kweaver-ai/dsg/services/apps/task_center/domain/relation_data"

	"go.uber.org/zap"
	"gorm.io/gorm"

	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type TaskRepo struct {
	data        *db.Data
	projectRepo tcProject.Repo
}

func NewTaskRepo(data *db.Data, projectRepo tcProject.Repo) tc_task.Repo {
	return &TaskRepo{data: data, projectRepo: projectRepo}
}

func (t *TaskRepo) Insert(ctx context.Context, task *model.TcTask) error {
	return t.data.DB.WithContext(ctx).Create(task).Error
}

func (t *TaskRepo) InsertWithRelation(ctx context.Context, task *model.TcTask, data []string, h relationData.UpsertRelation) error {
	err := t.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.WithContext(ctx).Create(task).Error; err != nil {
			return err
		}
		//插入关系
		rd := domain.NewRelationData(task, data)
		if err := h(ctx, tx, rd); err != nil {
			return err
		}
		return nil
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (t *TaskRepo) InsertExecutable(ctx context.Context, task *model.TcTask, nodeInfo *model.TcFlowInfo, data []string, h relationData.UpsertRelation) error {
	err := t.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		executableStatus := constant.TaskExecuteStatusBlocked.Integer.Int8()
		var err1 error
		if task.ExecutorID.String != "" {
			// executableStatus, err1 = Executable(ctx, tx, task.ProjectID, nodeInfo)
			// if err1 != nil {
			// 	return err1
			// }
			executableStatus, err1 = t.projectRepo.NodeExecutable(ctx, tx, task.ProjectID, nodeInfo)
			if err1 != nil {
				return err1
			}

		}
		task.ExecutableStatus = executableStatus
		if err := tx.Create(task).Error; err != nil {
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		// 插入关系
		rd := domain.NewRelationData(task, data)
		if err := h(ctx, tx, rd); err != nil {
			return err
		}
		// 更新下项目表中的数据
		if err := tx.Model(new(model.TcProject)).Where("id=?", task.ProjectID).Updates(&model.TcProject{}).Error; err != nil {
			log.WithContext(ctx).Error("update project update time error", zap.Any("projectId", task.ProjectID), zap.Error(err))
		}
		return nil
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error("DeleteProject transaction error", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// Executable 判断当前节点是否可开启
// func Executable(ctx context.Context, tx *gorm.DB, projectId string, nodeInfo *model.TcFlowInfo) (int8, error) {
// 	projectInfo := &model.TcProject{}
// 	if err := tx.Find(projectInfo, &model.TcProject{ID: projectId}).Error; err != nil {
// 		return 0, errorcode.Desc(errorcode.TaskDatabaseError)
// 	}
// 	//项目未开始，不可开启
// 	if projectInfo.Status == constant.CommonStatusReady.Integer.Int8() {
// 		return constant.TaskExecuteStatusBlocked.Integer.Int8(), nil
// 	}
// 	if nodeInfo.PrevNodeUnitIds == "" {
// 		return constant.TaskExecuteStatusExecutable.Integer.Int8(), nil
// 	}
// 	preNodeIds := strings.Split(nodeInfo.PrevNodeUnitIds, ",")
// 	executable := 0
// 	switch nodeInfo.NodeStartMode {
// 	case constant.AllNodeCompletion.ToString(): //全部前序节点完成
// 		if err := tx.Raw(`select count(*)=count(node_tasks_total=node_complete_tasks or null) and count(*)=? all_completed  from
// 						(select count(*) node_tasks_total, count(status =? or null) node_complete_tasks from af_tasks.tc_task
// 								where deleted_at=0 and  project_id=? and  node_id in ? group by node_id ) r`,
// 			len(preNodeIds), constant.CommonStatusCompleted.Integer.Int8(), projectId, preNodeIds).Scan(&executable).Error; err != nil {
// 			log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
// 			return 0, errorcode.Desc(errorcode.TaskDatabaseError)
// 		}
// 	case constant.AnyNodeCompletion.ToString(): //任意前序节点完成
// 		if err := tx.Raw(`select count(node_tasks_total = node_complete_tasks or null)>=1   has_completed  from
// 						(select count(*) node_tasks_total, count(status =? or null) node_complete_tasks from af_tasks.tc_task
// 								where deleted_at=0 and  project_id=? and  node_id in ? group by node_id ) r`,
// 			constant.CommonStatusCompleted.Integer.Int8(), projectId, preNodeIds).Scan(&executable).Error; err != nil {
// 			log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
// 			return 0, errorcode.Desc(errorcode.TaskDatabaseError)
// 		}
// 	}
// 	if executable == 1 {
// 		return constant.TaskExecuteStatusExecutable.Integer.Int8(), nil
// 	}
// 	return constant.TaskExecuteStatusBlocked.Integer.Int8(), nil
// }

// updateCurrentExecutable 更新当前任务所在节点的状态
// func updateCurrentExecutable(ctx context.Context, tx *gorm.DB, projectId string, nodeInfo *model.TcFlowInfo) ([]*model.TcTask, error) {
// 	executable, err := Executable(ctx, tx, projectId, nodeInfo)
// 	if err != nil {
// 		return nil, err
// 	}
// 	//查询激活的任务
// 	tasks := make([]*model.TcTask, 0)
// 	if executable == constant.TaskExecuteStatusExecutable.Integer.Int8() {
// 		if err := tx.Model(new(model.TcTask)).Where("project_id=? and node_id=? and executable_status = ?",
// 			projectId, nodeInfo.NodeUnitID, constant.TaskExecuteStatusBlocked.Integer.Int8()).Find(&tasks).Error; err != nil {
// 			return nil, errorcode.Desc(errorcode.TaskDatabaseError)
// 		}
// 	}
// 	if len(tasks) == 0 {
// 		return tasks, nil
// 	}
// 	//开启同项目，同节点下的未开启的任务
// 	if err := tx.Model(new(model.TcTask)).Where("project_id=? and node_id=? and executable_status = ?",
// 		projectId, nodeInfo.NodeUnitID, constant.TaskExecuteStatusBlocked.Integer.Int8()).Update("executable_status", executable).Error; err != nil {
// 		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
// 	}
// 	return tasks, nil
// }

// nodeCompleted 判断节点是否完成
func nodeCompleted(ctx context.Context, tx *gorm.DB, task *model.TcTask) (bool, error) {
	isNodeCompleted := 0
	if err := tx.Raw(`select count(*)=count(case when status=? then null end) node_completed from
								af_tasks.tc_task where project_id=? and node_id=? and deleted_at=0`,
		constant.CommonStatusCompleted.Integer.Int8(), task.ProjectID, task.NodeID).Scan(&isNodeCompleted).Error; err != nil {
		log.WithContext(ctx).Error("nodeCompleted error ", zap.Error(err))
		return false, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return isNodeCompleted == 1, nil
}

func followNodes(tx *gorm.DB, task *model.TcTask) ([]*model.TcFlowInfo, error) {
	nodeInfos := make([]*model.TcFlowInfo, 0)
	if err := tx.Model(new(model.TcFlowInfo)).Where("prev_node_unit_ids like ? and flow_id=? and flow_version=? ",
		"%"+task.NodeID+"%", task.FlowID, task.FlowVersion).Find(&nodeInfos).Error; err != nil {
		return nodeInfos, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return nodeInfos, nil
}
func currentNode(tx *gorm.DB, task *model.TcTask) (nodeInfo *model.TcFlowInfo, err error) {
	if err = tx.Model(new(model.TcFlowInfo)).Where("node_unit_id = ? and flow_id=? and flow_version=? ",
		task.NodeID, task.FlowID, task.FlowVersion).First(&nodeInfo).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	return nodeInfo, nil
}

// // updateFollowExecutable 更新下面节点任务所在节点的状态，task是当前任务，nodeInfo是当前的节点信息
// func updateFollowExecutable(ctx context.Context, tx *gorm.DB, task *model.TcTask, executorId string) (taskIds []string, err error) {
// 	taskIds = make([]string, 0)
// 	//当前节点未完成就直接返回
// 	//todo 当前节点工单
// 	completed, err := nodeCompleted(ctx, tx, task)
// 	if err != nil {
// 		return taskIds, err
// 	}
// 	if !completed {
// 		return taskIds, nil
// 	}
// 	//查询后续节点
// 	nodeInfos, err2 := followNodes(tx, task)
// 	if err2 != nil {
// 		return taskIds, err2
// 	}
// 	//没有后续节点了，正常退出
// 	if len(nodeInfos) <= 0 {
// 		return taskIds, nil
// 	}
// 	//挨个更新后续节点可执行状态
// 	for _, flowNode := range nodeInfos {
// 		tasks, err1 := updateCurrentExecutable(ctx, tx, task.ProjectID, flowNode)
// 		if err1 != nil {
// 			return taskIds, err1
// 		}
// 		for _, info := range tasks {
// 			if info.ExecutorID.String == executorId {
// 				taskIds = append(taskIds, info.ID)
// 			}
// 		}
// 	}
// 	return taskIds, nil
// }

// UpdateFollowExecutable 更新下面节点任务所在节点的状态，task是当前任务，nodeInfo是当前的节点信息
func (t *TaskRepo) UpdateFollowExecutable(ctx context.Context, task *model.TcTask, executorId string, txFunc func() error) ([]string, error) {
	taskIds := make([]string, 0)
	err := t.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err1 error
		// taskIds, err1 = updateFollowExecutable(ctx, tx, task, executorId)
		// if err1 != nil {
		// 	return err1
		// }

		tasks, err1 := t.projectRepo.UpdateFollowExecutable(ctx, tx, task.ProjectID, task.FlowID, task.FlowVersion, task.NodeID)
		if err1 != nil {
			return err1
		}
		for _, info := range tasks {
			if info.ExecutorID.String == task.UpdatedByUID {
				taskIds = append(taskIds, info.ID)
			}
		}
		//执行需要的方法，发送消息
		if err1 := txFunc(); err1 != nil {
			return err1
		}
		return nil
	})
	if errorcode.IsErrorCode(err) {
		return nil, err
	}
	if err != nil {
		log.WithContext(ctx).Error("DeleteProject transaction error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return taskIds, nil
}

// StartProjectExecutable 开启项目的第一个节点的所有任务
func (t *TaskRepo) StartProjectExecutable(ctx context.Context, project *model.TcProject) error {
	nodeInfo := new(model.TcFlowInfo)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TcFlowInfo)).Where("prev_node_unit_ids='' and flow_id=? and flow_version=? ",
		project.FlowID, project.FlowVersion).First(&nodeInfo).Error; err != nil {
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//开启同项目，同节点下的未开启的任务
	if err := t.data.DB.Model(new(model.TcTask)).Where("project_id=? and node_id=? and executable_status=? and executor_id!='' ",
		project.ID, nodeInfo.NodeUnitID, constant.TaskExecuteStatusBlocked.Integer.Int8()).Update("executable_status",
		constant.TaskExecuteStatusExecutable.Integer.Int8()).Error; err != nil {
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//开启同项目，同节点下的未开启的任务(todo @吴毓喆)
	return nil
}

func (t *TaskRepo) CheckRepeat(ctx context.Context, pid, id, name string) (bool, error) {
	var nameList []string
	tx := t.data.DB.WithContext(ctx).Model(&model.TcTask{})
	tx.Distinct("name")
	tx.Where("name = ? and project_id = ?", name, pid)
	if id != "" {
		tx.Where("id != ?", id)
	}
	result := tx.Find(&nameList)
	if result.Error != nil {
		return false, result.Error
	}
	count := len(nameList)
	if count != 0 {
		return true, nil
	}
	return false, nil
}
func (t *TaskRepo) ExistProject(ctx context.Context, pid string) error {
	return t.data.DB.WithContext(ctx).First(&model.TcProject{
		ID: pid,
	}).Error
}
func (t *TaskRepo) GetProject(ctx context.Context, pid string) (project *model.TcProject, err error) {
	err = t.data.DB.WithContext(ctx).Where("id=?", pid).First(&project).Error
	return
}
func (t *TaskRepo) GetTaskByTaskId(ctx context.Context, pid, tid string) (task *model.TcTask, err error) {
	tx := t.data.DB.WithContext(ctx).Where("id =? ", tid)
	if pid != "" {
		tx.Where("project_id =? ", pid)
	}
	err = tx.First(&task).Error
	return
}
func (t *TaskRepo) ExistFlow(ctx context.Context, pid, fid string) error {
	return t.data.DB.Debug().Model(&model.TcProject{}).Where("id = ? and flow_id = ?", pid, fid).First(&model.TcProject{}).Error
}

func (t *TaskRepo) UpdateTaskWithRelation(ctx context.Context, task *model.TcTask, data []string, h relationData.UpsertRelation) error {
	err := t.data.DB.Transaction(func(tx *gorm.DB) error {
		if _, err := t.updateTaskTransaction(ctx, tx, task); err != nil {
			return err
		}
		if data == nil {
			return nil
		}
		//更新关系
		rd := domain.NewRelationData(task, data)
		if err := h(ctx, tx, rd); err != nil {
			return err
		}
		return nil
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error("DeleteProject transaction error", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (t *TaskRepo) updateTaskTransaction(ctx context.Context, tx *gorm.DB, task *model.TcTask) (taskIds []string, err error) {
	old := new(model.TcTask)
	if err := tx.WithContext(ctx).Model(task).Where("id=?", task.ID).First(&old).Error; err != nil {
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//如果当前任务是未开始的，并且没有执行人的，本次添加了负责人。那么就尝试更新下可执行状态
	if task.ExecutorID.String != "" && old.ExecutableStatus == constant.TaskExecuteStatusBlocked.Integer.Int8() && old.ExecutorID.String == "" {
		if old.ProjectID != "" {
			currentNodeInfo, err := currentNode(tx, old)
			if err != nil {
				return nil, err
			}
			// executable, err := Executable(ctx, tx, old.ProjectID, currentNodeInfo)
			// if err != nil {
			// 	return nil, err
			// }
			executable, err := t.projectRepo.NodeExecutable(ctx, tx, old.ProjectID, currentNodeInfo)
			if err != nil {
				return nil, err
			}

			task.ExecutableStatus = executable
		} else {
			//游离任务，填了人就直接可执行了
			task.ExecutableStatus = constant.TaskExecuteStatusExecutable.Integer.Int8()
		}
	}
	//更新任务
	if err := tx.WithContext(ctx).Model(task).Omit("task_type").Updates(task).Error; err != nil {
		return nil, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//游离任务，不需要连锁反应
	if old.ProjectID == "" {
		return []string{}, nil
	}
	//添加一些固定的信息，更新的请求参数里面可能没有这些信息
	task.ProjectID = old.ProjectID
	task.FlowID = old.FlowID
	task.FlowVersion = old.FlowVersion
	task.NodeID = old.NodeID
	//如果是完成任务，激活下一个节点的任务
	if old.Status == constant.CommonStatusOngoing.Integer.Int8() && task.Status == constant.CommonStatusCompleted.Integer.Int8() {
		isCompleted, err := t.projectRepo.IsNodeCompleted(ctx, tx, task.ProjectID, task.NodeID)
		if err != nil {
			return taskIds, errorcode.Desc(errorcode.TaskDatabaseError)
		}
		if !isCompleted {
			return taskIds, nil
		}

		//查询后续节点
		nodeInfos := make([]*model.TcFlowInfo, 0)
		if err := tx.Model(new(model.TcFlowInfo)).Where("prev_node_unit_ids like ? and flow_id=? and flow_version=? ",
			"%"+task.NodeID+"%", task.FlowID, task.FlowVersion).Find(&nodeInfos).
			Error; err != nil {
			return taskIds, errorcode.Desc(errorcode.TaskDatabaseError)
		}
		//没有后续节点了，正常退出
		if len(nodeInfos) <= 0 {
			return taskIds, nil
		}
		//挨个更新后续节点可执行状态
		for _, flowNode := range nodeInfos {
			tasks, err1 := t.projectRepo.UpdateCurrentExecutable(ctx, tx, task.ProjectID, flowNode)
			if err1 != nil {
				return taskIds, err1
			}
			for _, info := range tasks {
				if info.ExecutorID.String == task.UpdatedByUID {
					taskIds = append(taskIds, info.ID)
				}
			}
		}
	}
	// 更新下项目表中的数据
	if err := tx.Model(new(model.TcProject)).Where("id=?", task.ProjectID).Updates(&model.TcProject{}).Error; err != nil {
		log.WithContext(ctx).Error("update project update time error", zap.Any("projectId", task.ProjectID), zap.Error(err))
	}
	return taskIds, nil
}

func (t *TaskRepo) UpdateTask(ctx context.Context, task *model.TcTask) (taskIds []string, err error) {
	taskIds = make([]string, 0)
	err = t.data.DB.Transaction(func(tx *gorm.DB) error {
		taskIdList, err1 := t.updateTaskTransaction(ctx, tx, task)
		if len(taskIdList) > 0 {
			taskIds = taskIdList
		}
		return err1
	})
	if errorcode.IsErrorCode(err) {
		return taskIds, err
	}
	if err != nil {
		log.WithContext(ctx).Error("DeleteProject transaction error", zap.Error(err))
		return taskIds, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return taskIds, nil
}

//func (t *TaskRepo) GetTaskSupportRole(ctx context.Context, pid string, nid string) (roleId string, err error) {
//	err = t.data.DB.WithContext(ctx).
//		Model(&model.TcProject{}).
//		Select("task_exec_role").
//		Joins("join tc_flow_info f ON tc_project.flow_id=f.flow_id AND tc_project.flow_version=f.flow_version").
//		Where("tc_project.id=?  and f.node_unit_id=?", pid, nid).First(&roleId).Error
//	return
//}

func (t *TaskRepo) GetAllTaskExecutors(ctx context.Context, uid string) (userIds []string, err error) {
	err = t.data.DB.WithContext(ctx).
		Model(&model.TcTask{}).
		Distinct("name").
		Select("executor_id").
		Where("created_by_uid=?", uid).
		Find(&userIds).Error
	return
}
func (t *TaskRepo) GetProjectTaskExecutors(ctx context.Context, pid string) (userIds []string, err error) {
	err = t.data.DB.WithContext(ctx).
		Model(&model.TcTask{}).
		Distinct("name").
		Select("executor_id").
		Where("project_id=?", pid).
		Find(&userIds).Error
	return
}

//func (t *TaskRepo) GetSupportRole(ctx context.Context, flowId, flowVersion, nodeId string) (roleId string, err error) {
//	err = t.data.DB.WithContext(ctx).
//		Model(&model.TcFlowInfo{}).
//		Select("task_exec_role").
//		Where("flow_id=? and flow_version=? and node_unit_id=? ", flowId, flowVersion, nodeId).First(&roleId).Error
//	return
//}

func (t *TaskRepo) GetTaskByNodeId(ctx context.Context, nodeId, projectId string) (tasks []*model.TcTask, err error) {
	err = t.data.DB.WithContext(ctx).
		Where(" node_id=? and project_id =?", nodeId, projectId).
		Find(&tasks).Error
	return
}
func (t *TaskRepo) GetProjectSupportUserIds(ctx context.Context, pid string) (roleIds []string, err error) {
	err = t.data.DB.WithContext(ctx).
		Model(&model.TcMember{}).
		Select("user_id").
		Where("obj_id=?", pid).Find(&roleIds).Error
	return
}
func (t *TaskRepo) GetSupportUserIdsFromProjectByRoleId(ctx context.Context, roleId, projectId string) (members []*model.TcMember, err error) {
	err = t.data.DB.WithContext(ctx).
		Where("role_id=? and obj_id=?", roleId, projectId).
		Find(&members).Error
	return
}
func (t *TaskRepo) GetSupportUserIdsFromProjectByRoleIds(ctx context.Context, roleIds []string, projectId string) (members []*model.TcMember, err error) {
	err = t.data.DB.WithContext(ctx).
		Where("role_id in ? and obj_id=?", roleIds, projectId).
		Find(&members).Error
	return
}

func (t *TaskRepo) GetSupportUserIdsFromProjectById(ctx context.Context, projectId string) (members []*model.TcMember, err error) {
	err = t.data.DB.WithContext(ctx).
		Where("obj_id=?", projectId).
		Find(&members).Error
	return
}

func (t *TaskRepo) GetTask(ctx context.Context, tid string) (detail *model.TaskDetail, err error) {
	err = t.data.DB.Table("tc_task t").Select("t.*, p.name as project_name, p.image, f.stage_name, f.node_name").
		Joins("join tc_project p on p.id=t.project_id").
		Joins("join tc_flow_info f on f.flow_id = t.flow_id and f.flow_version = t.flow_version and f.stage_unit_id = t.stage_id and f.node_unit_id = t.node_id").
		Where("t.id =? and t.deleted_at = 0 and p.deleted_at = 0", tid).Find(&detail).Error
	if err != nil {
		return nil, err
	}
	return
}
func (t *TaskRepo) GetTaskBriefById(ctx context.Context, tid string) (brief *model.TcTask, err error) {
	brief = new(model.TcTask)
	err = t.data.DB.Debug().Model(&model.TcTask{}).Where("id=?", tid).Take(brief).Error
	return
}
func (t *TaskRepo) GetTaskBriefByModelId(ctx context.Context, tid string) (brief *model.TcTask, err error) {
	brief = new(model.TcTask)
	err = t.data.DB.Debug().WithContext(ctx).Model(&model.TcTask{}).Where("business_model_id=?", tid).Take(brief).Error
	return
}

func (t *TaskRepo) GetTaskBriefByIds(ctx context.Context, tids ...string) (briefs []*model.TcTask, err error) {
	err = t.data.DB.Debug().Model(&model.TcTask{}).Where("id in ?", tids).Find(briefs).Error
	return
}

// GetProjectModelTaskCount  查询项目中已完成模型任务数量
func (t *TaskRepo) GetProjectModelTaskCount(ctx context.Context, pid string) (int64, int64, error) {
	countObj := &struct {
		BusinessModelCount int64 `gorm:"business_model_count"`
		DataModelCount     int64 `gorm:"data_model_count"`
	}{}
	db := t.data.DB.WithContext(ctx).Debug()
	rawSQL := "select count(case when task_type=? then null end) as business_model_count, count(case when task_type=? then null end ) as data_model_count " +
		" from tc_task where project_id=? and status=? and deleted_at=0;"
	err := db.Raw(rawSQL, constant.TaskTypeNewMainBusiness.Integer.Int32(), constant.TaskTypeDataMainBusiness.Integer.Int32(),
		pid, constant.CommonStatusCompleted.Integer.Int8()).Scan(countObj).Error
	return countObj.BusinessModelCount, countObj.DataModelCount, err
}

// GetProjectModelTaskStatus  查询项目中已完成模型任务
func (t *TaskRepo) GetProjectModelTaskStatus(ctx context.Context, pid string) (briefs []*model.TcTask, err error) {
	err = t.data.DB.WithContext(ctx).Debug().Where("project_id = ? and task_type in ? and status=?",
		pid, constant.ModelTaskTypeSlice, constant.CommonStatusCompleted.Integer.Int8()).Find(&briefs).Error
	return
}

// GetTaskBriefByIdSlice 获取参数的指定列，这么写会SQL注入?
func (t *TaskRepo) GetTaskBriefByIdSlice(ctx context.Context, fields string, tids ...string) (briefs []*model.TcTask, err error) {
	s := t.data.DB.Debug().WithContext(ctx).Model(&model.TcTask{})
	if fields != "" {
		s = s.Select(fields)
	}
	err = s.Where("id in ?", tids).Find(&briefs).Error
	return
}

// GetTaskInfoById 获取任务和项目信息
func (t *TaskRepo) GetTaskInfoById(ctx context.Context, tid string) (taskInfo *model.TaskInfo, err error) {
	taskInfo = new(model.TaskInfo)
	err = t.data.DB.WithContext(ctx).Table("tc_task t").Select("t.*, p.name as project_name, p.status as project_status").
		Joins("left join tc_project p on p.id=t.project_id").Where("t.id = ? and t.deleted_at = 0 ", tid).Find(taskInfo).Error
	return taskInfo, err
}

func (t *TaskRepo) Count(ctx context.Context, userId, taskType string) (countInfo *model.CountInfo, err error) {
	// 如果是数据目录理解报告, 只取自己的
	if taskType == constant.TaskTypeDataComprehensionWorkOrder.String {
		err = t.data.DB.WithContext(ctx).Raw(`select count(case when executor_id=? THEN NULL END ) total_processed_tasks,
									count(case when created_by_uid=?   THEN NULL END ) total_created_tasks,
									count(case when executable_status=? and executor_id=?  THEN NULL END ) total_blocked_tasks,
									count(case when executable_status=? and executor_id=? and task_type=?  THEN NULL END ) total_executable_tasks,
									count(case when executable_status=? and executor_id=?  THEN NULL END ) total_invalid_tasks,
									count(case when executable_status=? and executor_id=? and task_type=?  THEN NULL END ) total_completed_tasks
                              from tc_task where deleted_at=0`, userId, userId,
			constant.TaskExecuteStatusBlocked.Integer.Int8(), userId,
			constant.TaskExecuteStatusExecutable.Integer.Int8(), userId, enum.ToInteger[constant.TaskType](taskType).Int(),
			constant.TaskExecuteStatusInvalid.Integer.Int8(), userId,
			constant.TaskExecuteStatusCompleted.Integer.Int8(), userId, enum.ToInteger[constant.TaskType](taskType).Int()).Scan(&countInfo).Error
	} else {
		err = t.data.DB.WithContext(ctx).Raw(`select count(case when executor_id=?  THEN NULL END ) total_processed_tasks,
									count(case when created_by_uid=?   THEN NULL END ) total_created_tasks,
									count(case when executable_status=? and executor_id=?  THEN NULL END ) total_blocked_tasks,
									count(case when executable_status=? and executor_id=?  THEN NULL END ) total_executable_tasks,
									count(case when executable_status=? and executor_id=?  THEN NULL END ) total_invalid_tasks,
									count(case when executable_status=? and executor_id=?  THEN NULL END ) total_completed_tasks
                              from tc_task where deleted_at=0`, userId, userId,
			constant.TaskExecuteStatusBlocked.Integer.Int8(), userId,
			constant.TaskExecuteStatusExecutable.Integer.Int8(), userId,
			constant.TaskExecuteStatusInvalid.Integer.Int8(), userId,
			constant.TaskExecuteStatusCompleted.Integer.Int8(), userId).Scan(&countInfo).Error
	}
	return
}

// CountByWorkOrderID 返回属于指定工单的任务数量
func (t *TaskRepo) CountByWorkOrderID(ctx context.Context, workOrderID string) (int, error) {
	var result int64
	if err := t.data.DB.WithContext(ctx).
		Model(&model.TcTask{}).
		Where(&model.TcTask{WorkOrderId: workOrderID}).
		Count(&result).Error; err != nil {
		return 0, err
	}
	return int(result), nil
}

// CountByWorkOrderID 返回属于指定工单，处于指定状态的任务数量
func (t *TaskRepo) CountByWorkOrderIDAndStatus(ctx context.Context, workOrderID string, status constant.CommonStatus) (int, error) {
	var result int64
	if err := t.data.DB.WithContext(ctx).
		Model(&model.TcTask{}).
		Where(&model.TcTask{WorkOrderId: workOrderID, Status: status.Integer.Int8()}).
		Count(&result).Error; err != nil {
		return 0, err
	}
	return int(result), nil
}

func (t *TaskRepo) GetInvalidTasks(ctx context.Context, projectId string) (list []*model.TcTask, err error) {
	err = t.data.DB.WithContext(ctx).Model(new(model.TcTask)).Where("project_id = ? and executable_status=?",
		projectId, constant.TaskExecuteStatusInvalid.Integer.Int8()).Find(&list).Error
	return
}
func (t *TaskRepo) GetSpecifyTypeTasks(ctx context.Context, projectId string, taskType int32) (list []*model.TcTask, err error) {
	err = t.data.DB.WithContext(ctx).Model(new(model.TcTask)).Where("project_id = ? and task_type=?",
		projectId, taskType).Find(&list).Error
	return
}

func (t *TaskRepo) GetTasks(ctx context.Context, query domain.TaskQueryParam, createdBy string) (list []*model.TaskInfo, total int64, err error) {
	limit := query.Limit
	offset := limit * (query.Offset - 1)
	db := t.data.DB.WithContext(ctx).Model(&model.TcTask{})
	if query.ProjectId != "" {
		db = db.Where("tc_task.project_id = ?", query.ProjectId)
	}
	if query.NodeId != "" && !query.IsPre {
		db = db.Where("tc_task.node_id = ?", query.NodeId)
	}
	if createdBy != "" {
		db = db.Where("tc_task.created_by_uid =  ?", createdBy)
	}
	if query.Keyword != "" {
		db = db.Where("tc_task.name like ?", "%"+util.KeywordEscape(query.Keyword)+"%")
	}
	if query.WorkOrderId != "" {
		db = db.Where("tc_task.work_order_id =  ?", query.WorkOrderId)
	}
	if query.Status != "" {
		arr := strings.Split(query.Status, ",")
		statues := make([]int8, 0)
		for _, s := range arr {
			si := enum.ToInteger[constant.CommonStatus](s, 0).Int8()
			if si > 0 {
				statues = append(statues, si)
			}
		}
		if len(statues) > 0 {
			db = db.Where("tc_task.status  in   ?", statues)
		}
	}
	if query.Priority != "" {
		arr := strings.Split(query.Priority, ",")
		if len(arr) == 1 {
			db = db.Where("tc_task.priority =  ?", enum.ToInteger[constant.CommonPriority](arr[0]))
		} else if len(arr) == 2 {
			db = db.Where("tc_task.priority =  ? or tc_task.priority =  ?", enum.ToInteger[constant.CommonPriority](arr[0]), enum.ToInteger[constant.CommonPriority](arr[1]))
		}
	}
	if query.ExecutorId != "" {
		//允许查询未分配执行人的任务
		query.ExecutorId = strings.Replace(query.ExecutorId, constant.EmptyExecutor, "", -1)
		arr := strings.Split(query.ExecutorId, ",")
		db = db.Where("tc_task.executor_id  in  ?", arr)
	}
	if query.TaskType != "" {
		arr := strings.Split(query.TaskType, ",")
		typeIntegers := make([]int, 0)
		for _, ti := range arr {
			typeIntegers = append(typeIntegers, enum.ToInteger[constant.TaskType](ti).Int())
		}
		db = db.Where("tc_task.task_type  in   ?", typeIntegers)
	}
	if query.ExcludeTaskType != "" {
		arr := strings.Split(query.ExcludeTaskType, ",")
		db = db.Where("tc_task.task_type   not in ? ", constant.TaskTypeStringArrToIntArr(arr))
	}

	time := time.Now().Unix()
	if query.Overdue == "overdue" {
		db = db.Where("tc_task.deadline != 0 and ((tc_task.complete_time =  0 and tc_task.deadline  < ?) or (tc_task.complete_time != 0 and tc_task.deadline  < tc_task.complete_time))", time)
	} else if query.Overdue == "due" {
		db = db.Where("tc_task.deadline != 0 and ((tc_task.complete_time =  0 and tc_task.deadline >= ?) or (tc_task.complete_time != 0 and tc_task.deadline >= tc_task.complete_time))", time)
	}
	if query.ExecutableStatus != "" {
		db = db.Where("tc_task.executable_status=?", enum.ToInteger[constant.TaskExecuteStatus](query.ExecutableStatus).Int8())
	}
	//给出排序规则
	sortPairs := make([]string, 0)
	switch {
	case query.ExecutableStatus == constant.TaskExecuteStatusExecutable.String: //可执行列表查询排序
		sortPairs = append(sortPairs, "has_deadline desc")
		sortPairs = append(sortPairs, "deadline asc")
		sortPairs = append(sortPairs, "priority desc")
		sortPairs = append(sortPairs, fmt.Sprintf("%s %s", query.Sort, query.Direction))

	case query.ProjectId != "" && query.NodeId != "" && query.IsPre: //如果是查询前置节点，按照泳道，更新时间排序
		if len(query.PreNodes) > 0 {
			db = db.Where(" tc_task.node_id  in  ?", query.PreNodes)
		}
		sortPairs = append(sortPairs, "f.stage_order desc")
		sortPairs = append(sortPairs, "updated_at desc")
	default:
		sortPairs = append(sortPairs, fmt.Sprintf("%s %s", query.Sort, query.Direction))
	}

	if db.Error != nil {
		return nil, 0, db.Error
	}
	err = db.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	db = db.Limit(int(limit)).Offset(int(offset))

	db = db.Order(strings.Join(sortPairs, ","))
	if total > 0 {
		err = db.Debug().Table("tc_task").Select("tc_task.*, p.name as project_name,  w.name as work_order_name, tc_task.deadline>0 has_deadline, p.status as project_status").
			Joins("left join tc_project p   on  p.id=tc_task.project_id").
			Joins("left join work_order w   on  w.work_order_id=tc_task.work_order_id").
			Joins("left join tc_flow_info f  on  f.flow_id=tc_task.flow_id and f.flow_version=tc_task.flow_version   and f.node_unit_id=tc_task.node_id").Find(&list).Error
		if err != nil {
			return nil, 0, err
		}
		return list, total, nil
	}

	return nil, 0, nil
}

func (t *TaskRepo) GetNodeInfo(ctx context.Context, fid, flowVersion string) (list []*model.TcFlowInfo, total int64, err error) {
	db := t.data.DB.WithContext(ctx).Debug().Model(&model.TcFlowInfo{}).Where("flow_id=? and flow_version =?", fid, flowVersion).Order("stage_order asc").Find(&list)
	if db.Error != nil {
		return nil, 0, err
	}
	err = db.WithContext(ctx).Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	return list, total, nil
}
func (t *TaskRepo) GetStatusInfo(ctx context.Context, pid string) (list []*model.TcTask, err error) {
	err = t.data.DB.WithContext(ctx).Model(&model.TcTask{}).Where("project_id=?", pid).Find(&list).Error
	if err != nil {
		return nil, err
	}
	return list, nil
}
func (t *TaskRepo) Delete(ctx context.Context, task *model.TcTask) error {
	err := t.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(new(model.TcTask)).Where("id=?", task.ID).Delete(&model.TcTask{}).Error; err != nil {
			return errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
		}
		// 更新下项目表中的数据
		if task.ProjectID != "" {
			if err := tx.Model(new(model.TcProject)).Where("id=?", task.ProjectID).Updates(&model.TcProject{}).Error; err != nil {
				log.WithContext(ctx).Error("update project update time error", zap.Any("projectId", task.ProjectID), zap.Error(err))
			}
		}
		return nil
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error("Delete transaction error", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return nil
}
func (t *TaskRepo) DeleteExecutorsByRoleIdUserId(ctx context.Context, roleId string, userId string, projectIds []string) error {
	tids := []string{}
	err := t.data.DB.WithContext(ctx).Table("tc_task   t").Select("t.id").
		Joins("left join tc_flow_info i on t.node_id=i.node_unit_id").
		Where("i.task_exec_role=?", roleId).
		Where("t.project_id in ? and t.status in ? and t.executor_id=?", projectIds,
			[]int8{constant.CommonStatusReady.Integer.Int8(), constant.CommonStatusOngoing.Integer.Int8()}, userId).Find(&tids).Error
	if err != nil {
		log.WithContext(ctx).Error("DeleteExecutorsByRoleIdUserId error", zap.Error(err))
		return err
	}
	tx := t.data.DB.WithContext(ctx).Table(new(model.TcTask).TableName()).Where("id in ?", tids).Updates(&model.TcTask{
		ExecutableStatus: constant.TaskExecuteStatusBlocked.Integer.Int8(),
		ExecutorID:       sql.NullString{String: "", Valid: true},
	})
	log.WithContext(ctx).Infof("DeleteExecutorsByRoleIdUserId RowsAffected :%v", tx.RowsAffected)
	return tx.Error
}
func (t *TaskRepo) GetHasMemberRoleProject(ctx context.Context, roleId string, userId string) (projects []*model.TcProject, err error) {
	err = t.data.DB.WithContext(ctx).Table("tc_project").
		Joins("join tc_member   m on m.obj_id =  tc_project.id").
		Where("m.obj=1 and m.role_id=? and m.user_id=?", roleId, userId).
		Find(&projects).Error
	return
}
func (t *TaskRepo) GetProjectsByFlowInfo(ctx context.Context, flowId string, flowVersion string) (projects []*model.TcProject, err error) {
	err = t.data.DB.WithContext(ctx).Table("tc_project   ").
		Where("(tc_project.status=1 or tc_project.status = 2) and tc_project.flow_id=? and tc_project.flow_version=?", flowId, flowVersion).
		Find(&projects).Error
	return
}

func (t *TaskRepo) GetTaskByDomain(ctx context.Context, subjectDomainId string, businessModelId string) (tasks []*model.TcTask, err error) {
	if subjectDomainId == "" && businessModelId == "" {
		return
	}
	db := t.data.DB.WithContext(ctx)
	if subjectDomainId != "" {
		db = db.Where("subject_domain_id=?", subjectDomainId)
	}
	if businessModelId != "" {
		db = db.Where("business_model_id=?", businessModelId)
	}
	err = db.Find(&tasks).Error
	return
}

// DeleteTaskMainBusiness 标记主干业务缺失
func (t *TaskRepo) DeleteTaskMainBusiness(ctx context.Context, taskIds ...string) error {
	if len(taskIds) <= 0 {
		return nil
	}
	err := t.data.DB.WithContext(ctx).Model(&model.TcTask{}).Where("id in ? ", taskIds).
		Select("domain_id", "business_model_id", "config_status", "executable_status").Updates(&model.TcTask{
		SubjectDomainId:  "",
		BusinessModelID:  "",
		ConfigStatus:     constant.TaskConfigStatusMainBusinessDeleted.Integer.Int8(),
		ExecutableStatus: constant.TaskExecuteStatusInvalid.Integer.Int8(),
	}).Error
	return err
}

// DeleteTaskBusinessDomain 标记业务域缺失
func (t *TaskRepo) DeleteTaskBusinessDomain(ctx context.Context, taskIds ...string) error {
	if len(taskIds) <= 0 {
		return nil
	}
	err := t.data.DB.WithContext(ctx).Model(&model.TcTask{}).Where("id in ? ", taskIds).
		Select("domain_id", "business_model_id", "config_status", "executable_status").Updates(&model.TcTask{
		SubjectDomainId:  "",
		BusinessModelID:  "",
		ConfigStatus:     constant.TaskConfigStatusBusinessDomainDeleted.Integer.Int8(),
		ExecutableStatus: constant.TaskExecuteStatusInvalid.Integer.Int8(),
	}).Error
	return err
}

func (t *TaskRepo) QueryStandardSubTaskStatus(ctx context.Context, taskId string, statuses []int8) (int, error) {
	var notFinished int64
	err := t.data.DB.WithContext(ctx).Model(&model.TcTask{}).Where("parent_task_id=?  and status in ? ", taskId, statuses).Count(&notFinished).Error
	return int(notFinished), err
}

// UpdateMultiTasks 批量修改任务的业务域ID
func (t *TaskRepo) UpdateMultiTasks(ctx context.Context, tasks ...*model.TcTask) error {
	err := t.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, task := range tasks {
			if err := tx.Updates(task).Error; err != nil {
				return errorcode.Desc(errorcode.TaskDatabaseError)
			}
		}
		return nil
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error("UpdateMultiTasks transaction error", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return nil

}

// DiscardTaskBecauseOfFormInvalid 标记业务域缺失
func (t *TaskRepo) DiscardTaskBecauseOfFormInvalid(ctx context.Context, taskIds ...string) error {
	if len(taskIds) <= 0 {
		return nil
	}
	selectedStatus := make([]int8, 0)
	selectedStatus = append(selectedStatus, constant.CommonStatusReady.Integer.Int8())
	selectedStatus = append(selectedStatus, constant.CommonStatusOngoing.Integer.Int8())
	err := t.data.DB.WithContext(ctx).Model(&model.TcTask{}).Where("id in ? and status in ?", taskIds, selectedStatus).
		Select("config_status", "executable_status").Updates(&model.TcTask{
		ConfigStatus:     constant.TaskConfigStatusFormDeleted.Integer.Int8(),
		ExecutableStatus: constant.TaskExecuteStatusInvalid.Integer.Int8(),
	}).Error
	return err
}
func (t *TaskRepo) GetComprehensionTemplateRelation(ctx context.Context, req *domain.GetComprehensionTemplateRelationReq) (tasks []*model.TcTask, err error) {
	tx := t.data.DB.WithContext(ctx).Where("task_type=2048")
	if len(req.TemplateIds) == 1 {
		tx = tx.Where("data_comprehension_template_id = ?", req.TemplateIds[0])
	} else {
		tx.Where(" data_comprehension_template_id in ?", req.TemplateIds)
	}
	if len(req.Status) != 0 {
		tx.Where("status in ? ", req.Status)
	}
	err = tx.Find(&tasks).Error

	return
}

func (t *TaskRepo) GetTaskByWorkOrderId(ctx context.Context, wid string) (tasks []*model.TcTask, err error) {
	err = t.data.DB.WithContext(ctx).
		Where(" work_order_id =?", wid).
		Find(&tasks).Error
	return
}

func (t *TaskRepo) GetLatestComprehensionTask(ctx context.Context, catalogId string) (task *model.TcTask, err error) {
	err = t.data.DB.WithContext(ctx).
		Model(&model.TcTask{}).
		Where(" task_type = 2048 and data_comprehension_catalog_id like ?", "%"+catalogId+"%").
		Order("updated_at desc").
		First(&task).Error
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, nil
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return
}
