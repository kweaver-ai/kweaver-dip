package impl

import (
	"bytes"
	"context"
	"database/sql"
	_ "embed"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"text/template"

	"github.com/go-sql-driver/mysql"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"gorm.io/gorm"

	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order/scope"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	taskDomain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type ProjectRepo struct {
	data *db.Data

	callbacksOnNodeStart map[string]tcProject.CallbackOnNodeStart
}

func NewProjectRepo(data *db.Data) tcProject.Repo {
	return &ProjectRepo{data: data}
}

// Insert a new  project
func (p *ProjectRepo) Insert(ctx context.Context, pro *model.TcProject, members []*model.TcMember, info []*model.TcFlowInfo, view *model.TcFlowView) error {

	err := p.data.DB.WithContext(ctx).Debug().Transaction(func(tx *gorm.DB) error {
		//1 insert Project record
		tx = tx.WithContext(ctx).Debug()
		if err := tx.Create(pro).Error; err != nil {
			//rollback
			return err
		}

		//2 insert batch member:
		// 2.1 assign project id to member
		for i := 0; i < len(members); i++ {
			members[i].ObjID = pro.ID
		}
		// 2.2 insert batch members
		if len(members) != 0 {
			if err := tx.WithContext(ctx).Create(&members).Error; err != nil {
				//rollback
				return err
			}
		}

		//3 insert bach nodes : if not exist, insert batch records :  if id-version exist, represents that all nodes have inserted

		if err := tx.WithContext(ctx).Select("id").Where("flow_id=? and flow_version=?", view.ID, view.Version).Take(&model.TcFlowInfo{}).Error; err != nil {
			//other error:
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}

			// record not found error : if view not exist, create it
			if err = tx.WithContext(ctx).Create(&info).Error; err != nil {
				mysqlErr := &mysql.MySQLError{}
				if !errors.As(err, &mysqlErr) || mysqlErr.Number != 1062 {
					// 返回错误回滚事务
					return err
				}
			}
		}

		//4 insert view :  if not exist, insert view.   not use First but use Take
		if err := tx.WithContext(ctx).Select("id").Where("id=? and version=?", view.ID, view.Version).Take(&model.TcFlowView{}).Error; err != nil {
			//other error:
			if !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}

			// record not found error : if view not exist, create it
			if err = tx.WithContext(ctx).Create(view).Error; err != nil {
				mysqlErr := &mysql.MySQLError{}
				if !errors.As(err, &mysqlErr) || mysqlErr.Number != 1062 {
					// 返回错误回滚事务
					return err
				}
			}
		}

		//5 commit transaction
		return nil
	})

	return err

}
func (p *ProjectRepo) Update(ctx context.Context, pro *model.TcProject, members []*model.TcMember) error {

	err := p.data.DB.WithContext(ctx).Debug().Transaction(func(tx *gorm.DB) error {
		//1 insert Project record
		tx = tx.Debug()
		if err := tx.WithContext(ctx).Updates(pro).Error; err != nil {
			//rollback
			return err
		}
		if members == nil {
			return nil
		}
		//更新任务的状态，清空执行人，切换未不可执行状态
		if err := updateTaskStatus(ctx, tx, pro, members); err != nil {
			return err
		}

		//先查询下所有的成员
		oldMembers := make([]*model.TcMember, 0)
		if err := tx.WithContext(ctx).Where("obj=1 and obj_id=?", pro.ID).Find(&oldMembers).Error; err != nil {
			return err
		}

		oldMemberDict := lo.SliceToMap(oldMembers, func(item *model.TcMember) (string, *model.TcMember) {
			return fmt.Sprintf("%v-%v", item.UserID, item.RoleID), item
		})

		//更新下新角色的创建时间
		for _, member := range members {
			key := fmt.Sprintf("%v-%v", member.UserID, member.RoleID)
			oldMember, ok := oldMemberDict[key]
			if ok {
				member.CreatedAt = oldMember.CreatedAt
			}
		}

		// 2 update member : 2.1 delete member before all, and then insert
		if err := tx.WithContext(ctx).Where("obj=1 and obj_id=?", pro.ID).Delete(&model.TcMember{}).Error; err != nil {
			//rollback
			return err
		}
		// 2.2 insert batch members
		if len(members) != 0 {
			if err := tx.WithContext(ctx).Create(&members).Error; err != nil {
				//rollback
				return err
			}
		}
		//5 commit transaction
		return nil
	})

	return err

}

// UpdateProjectBecauseDeleteUser 删除项目成员，清楚任务执行人
func (p *ProjectRepo) UpdateProjectBecauseDeleteUser(ctx context.Context, pro *model.TcProject, member *model.TcMember) error {
	err := p.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		members := make([]*model.TcMember, 0)
		if err := tx.WithContext(ctx).Model(new(model.TcMember)).Where("obj=1 and obj_id = ? and (role_id, user_id) not in ?",
			pro.ID, [][]string{{member.RoleID, member.UserID}}).Scan(&members).Error; err != nil {
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
		//更新任务信息
		if err := updateTaskStatus(ctx, tx, pro, members); err != nil {
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
		//删除项目成员
		if err := tx.WithContext(ctx).Where("role_id=? and user_id=? and obj=1 and obj_id = ?",
			member.RoleID, member.UserID, pro.ID).Delete(&model.TcMember{}).Error; err != nil {
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
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

// queryExecutorRemovedTasks2 查询执行人移除的任务
func queryExecutorRemovedTasks2(ctx context.Context, tx *gorm.DB, pro *model.TcProject, members []*model.TcMember, status int8) ([]*model.TcTask, error) {
	tasks := make([]*model.TcTask, 0)
	dSlice := make([][]string, 0)
	for _, m := range members {
		dSlice = append(dSlice, []string{m.RoleID, m.UserID})
	}
	//项目进行中，进行中，未开始的任务，
	sql := `select distinct t.*
			FROM
			    (
			        select tt.*,(
					CASE `
	objs := enum.List[constant.TaskType]()
	for _, taskType := range objs {
		sql += fmt.Sprintf("WHEN tt.task_type = %d  THEN '%s'", taskType.Integer, strings.Join(taskDomain.TaskToRole(ctx, taskType.String), ","))
	}
	sql += `
					END
				    ) AS task_role_id
			        FROM
		            	tc_task tt
			    ) t
		left join tc_member m on t.executor_id = m.user_id  and task_role_id like concat("%%",m.role_id,"%%")
		where t.status = ? and t.config_status=?  and m.obj_id =?  and t.project_id = ? and m.deleted_at =0 `
	if len(dSlice) > 0 {
		sql += "  and  (m.role_id,m.user_id)  not in ?  "
		if err := tx.WithContext(ctx).Raw(sql, status, constant.TaskConfigStatusNormal.Integer.Int8(), pro.ID, pro.ID, dSlice).Scan(&tasks).Error; err != nil {
			return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
	} else {
		if err := tx.WithContext(ctx).Raw(sql, status, constant.TaskConfigStatusNormal.Integer.Int8(), pro.ID, pro.ID).Scan(&tasks).Error; err != nil {
			return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
	}
	return tasks, nil
}

// queryExecutorRemovedTasks 查询执行人移除的任务
func queryExecutorRemovedTasks(ctx context.Context, tx *gorm.DB, pro *model.TcProject, members []*model.TcMember, status int8) ([]*model.TcTask, error) {
	tasks := make([]*model.TcTask, 0)
	dSlice := make([][]string, 0)
	for _, m := range members {
		dSlice = append(dSlice, []string{m.RoleID, m.UserID})
	}
	//项目进行中，进行中，未开始的任务，
	sql := `select distinct t.* from tc_task t
		left join af_tasks.tc_flow_info f on  t.node_id = f.node_unit_id
		left join tc_member m on t.executor_id = m.user_id  and f.task_exec_role = m.role_id
		where t.status = ? and t.config_status=?  and m.obj_id =?  and t.project_id = ? and m.deleted_at =0 `
	if len(dSlice) > 0 {
		sql += "  and  (role_id,user_id)  not in ?  "
		if err := tx.WithContext(ctx).Raw(sql, status, constant.TaskConfigStatusNormal.Integer.Int8(), pro.ID, pro.ID, dSlice).Scan(&tasks).Error; err != nil {
			return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
	} else {
		if err := tx.WithContext(ctx).Raw(sql, status, constant.TaskConfigStatusNormal.Integer.Int8(), pro.ID, pro.ID).Scan(&tasks).Error; err != nil {
			return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
	}
	return tasks, nil
}

// updateTaskStatus
func updateTaskStatus(ctx context.Context, tx *gorm.DB, pro *model.TcProject, members []*model.TcMember) error {
	var total int64 = 0
	if err := tx.WithContext(ctx).Model(new(model.TcMember)).Where("obj=1 and obj_id=?", pro.ID).Count(&total).Error; err != nil {
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	if len(members) == 0 && total == 0 {
		return nil
	}

	//未开始的任务，执行人去掉，置为未开启
	removedTasks, err := queryExecutorRemovedTasks2(ctx, tx, pro, members, constant.CommonStatusReady.Integer.Int8())
	if err != nil {
		return err
	}
	logs := make([]*model.OperationLog, 0)
	if len(removedTasks) > 0 {
		removedTaskIds := make([]string, 0, len(removedTasks))
		for _, task := range removedTasks {
			removedTaskIds = append(removedTaskIds, task.ID)
			oplog := taskDomain.TaskExecutorRemovedOperationLog(ctx, task)
			if oplog != nil {
				logs = append(logs, oplog)
			}
		}
		if err := tx.WithContext(ctx).Model(new(model.TcTask)).Select("executor_id", "executor_name", "executable_status").
			Where("id in ?", removedTaskIds).Updates(&model.TcTask{
			ExecutableStatus: constant.TaskExecuteStatusBlocked.Integer.Int8(),
			ExecutorID:       sql.NullString{String: "", Valid: true},
		}).Error; err != nil {
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
	}

	//进行中的任务，修改任务状态为 任务执行人被移除
	onGoingTasks, err := queryExecutorRemovedTasks2(ctx, tx, pro, members, constant.CommonStatusOngoing.Integer.Int8())
	if err != nil {
		return err
	}
	if len(onGoingTasks) > 0 {
		onGoingTaskIds := make([]string, 0, len(onGoingTasks))
		for _, task := range onGoingTasks {
			onGoingTaskIds = append(onGoingTaskIds, task.ID)
			task.ConfigStatus = constant.TaskConfigStatusExecutorDeleted.Integer.Int8()
			//任务失效日志
			logs = append(logs, taskDomain.TaskDiscardOperationLog(task, ""))
		}

		if err := tx.WithContext(ctx).Model(new(model.TcTask)).Select("executor_id", "executor_name", "executable_status", "config_status").
			Where("id in ?", onGoingTaskIds).Updates(&model.TcTask{
			ExecutableStatus: constant.TaskExecuteStatusInvalid.Integer.Int8(),
			ConfigStatus:     constant.TaskConfigStatusExecutorDeleted.Integer.Int8(),
			ExecutorID:       sql.NullString{String: "", Valid: true},
		}).Error; err != nil {
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
	}
	//插入操作日志
	if len(logs) > 0 {
		if err := tx.WithContext(ctx).Create(&logs).Error; err != nil {
			log.WithContext(ctx).Error("updateTaskStatus OperationLogRepo Insert error", zap.Error(err))
			return err
		}
	}
	return nil
}

// updateTaskBecauseRemoveMembers 置空任务的执行人, 置未不可执行状态
func updateTaskBecauseRemoveMembers(ctx context.Context, tx *gorm.DB, taskIds []string, task *model.TcTask) error {
	if err := tx.WithContext(ctx).Model(new(model.TcTask)).Select("executor_id", "executor_name", "executable_status").
		Where("id in ?", taskIds).Updates(task).Error; err != nil {
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	return nil
}

// Get one project by id
func (p *ProjectRepo) Get(ctx context.Context, id string) (pro *model.TcProject, err error) {
	err = p.data.DB.WithContext(ctx).Model(&model.TcProject{}).Where("id=?", id).First(&pro).Error
	return
}
func (p *ProjectRepo) GetThirdProjectDetail(ctx context.Context, thirdId string) (pro *model.TcProject, err error) {
	err = p.data.DB.WithContext(ctx).Model(&model.TcProject{}).Where("third_project_id=?", thirdId).First(&pro).Error
	return
}
func (p *ProjectRepo) GetProjectNotCompletedByFlow(ctx context.Context, fid, fVersion string) (projects []*model.TcProject, err error) {
	err = p.data.DB.WithContext(ctx).Model(&model.TcProject{}).
		Where("(status=? or status=? ) and  flow_id=? and flow_version=?", constant.CommonStatusReady.Integer.Int8(),
			constant.CommonStatusOngoing.Integer.Int8(), fid, fVersion).
		Find(&projects).Error
	return
}

func (p *ProjectRepo) GetAllTasks(ctx context.Context, id string) ([]*model.TcTask, error) {
	list := make([]*model.TcTask, 0)
	err := p.data.DB.WithContext(ctx).Model(&model.TcTask{}).Where("project_id=?", id).Find(&list).Error
	return list, err
}
func (p *ProjectRepo) GetFlowView(ctx context.Context, fid, fVersion string) (*model.TcFlowView, error) {
	view := &model.TcFlowView{}
	err := p.data.DB.WithContext(ctx).Model(&model.TcFlowView{}).Where("id=? and version=?", fid, fVersion).Take(view).Error
	return view, err
}

// CheckRepeat check whether project name 'name' is exists or not'
func (p *ProjectRepo) CheckRepeat(ctx context.Context, id string, name string) (bool, error) {
	var nameList []string
	tx := p.data.DB.WithContext(ctx).Model(&model.TcProject{})
	tx.Distinct("name")
	tx.Where("name = ?", name)
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

// TaskRoles one project by id
func (p *ProjectRepo) TaskRoles(ctx context.Context, flow_id, flow_version string) (roles []string, err error) {
	err = p.data.DB.WithContext(ctx).Model(&model.TcFlowInfo{}).Select("task_exec_role").Distinct("task_exec_role").Where(
		"flow_id =? and flow_version=?", flow_id, flow_version).Scan(&roles).Error
	return
}

// CheckTaskRoles check one flow by id
func (p *ProjectRepo) CheckTaskRoles(ctx context.Context, flowId, flowVersion string) (exists bool, err error) {
	var total int64
	err = p.data.DB.WithContext(ctx).Model(&model.TcFlowInfo{}).Where("flow_id =? and flow_version=?", flowId, flowVersion).Count(&total).Error
	if err != nil {
		return false, err
	}
	return total > 0, nil
}

func (p *ProjectRepo) QueryProjects(ctx context.Context, params *tc_project.ProjectCardQueryReq) (projects []model.TcProject, total int64, err error) {
	db := p.data.DB.WithContext(ctx).Model(&model.TcProject{})
	db = db.Debug()

	if params.ProjectType != "" {
		db = db.Where("project_type = ?", enum.ToInteger[constant.ProjectType](params.ProjectType).Int())
	}

	if params.Name != "" {
		db = db.Where(fmt.Sprintf("name like '%s'", "%"+util.KeywordEscape(util.XssEscape(params.Name))+"%"))
	}
	if params.Status != "" {
		db = db.Where(fmt.Sprintf("status in (%s)", params.Status))
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}

	if params.Sort == "name" {
		db = db.Order(fmt.Sprintf("name %s,id asc", params.Direction))
	} else {
		db = db.Order(fmt.Sprintf("%s %s,id asc", params.Sort, params.Direction))
	}

	db = db.Offset(int((params.Offset - 1) * params.Limit)).Limit(int(params.Limit))
	err = db.Find(&projects).Error

	return
}

func (p *ProjectRepo) DeleteProject(ctx context.Context, projectId string, txFunc func() error) ([]string, error) {
	taskIds := make([]string, 0)
	err := p.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err1 := tx.WithContext(ctx).Where(" id = ?", projectId).Delete(new(model.TcProject)).Error; err1 != nil {
			if errors.Is(err1, gorm.ErrRecordNotFound) {
				return errorcode.Desc(errorcode.TaskProjectNotFound)
			}
			return errorcode.Detail(errorcode.ProjectDatabaseError, err1.Error())
		}
		if err1 := tx.WithContext(ctx).Model(new(model.TcTask)).Select("id").Where(" project_id=? ", projectId).Scan(&taskIds).Error; err1 != nil {
			if errors.Is(err1, gorm.ErrRecordNotFound) {
				return nil
			}
			return errorcode.Detail(errorcode.ProjectDatabaseError, err1.Error())
		}
		//删除项目
		if err1 := tx.WithContext(ctx).Where(" project_id=? ", projectId).Delete(new(model.TcTask)).Error; err1 != nil {
			if errors.Is(err1, gorm.ErrRecordNotFound) {
				return nil
			}
			return errorcode.Detail(errorcode.ProjectDatabaseError, err1.Error())
		}
		//删除项目成员
		if err := tx.WithContext(ctx).Where("obj=1 and obj_id=?", projectId).Delete(new(model.TcMember)).Error; err != nil {
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}

		if txFunc != nil {
			//发送消息，删除项目内的业务模型
			if err1 := txFunc(); err1 != nil {
				return err1
			}
		}

		return nil
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

func (p *ProjectRepo) QueryUserProjects(ctx context.Context, userId, roleId string, status int8) (ps []*model.TcProject, err error) {
	sqlFormat := `select p.* from %s p join  (select distinct(obj_id) as project_id  from %s  where user_id=? and role_id=? and obj=1  and deleted_at=0) m
                  on m.project_id = p.id where p.status=? and p.deleted_at=0`
	rawSQL := fmt.Sprintf(sqlFormat, new(model.TcProject).TableName(), new(model.TcMember).TableName())
	err = p.data.DB.Raw(rawSQL, userId, roleId, status).Scan(&ps).Error
	return
}

// isNodeCompleted 判断节点是否完成
func (p *ProjectRepo) IsNodeCompleted(ctx context.Context, tx *gorm.DB, projectId, nodeId string) (bool, error) {
	// isNodeCompleted := 0
	// if err := p.data.DB.Raw(`select count(*)=count(status=? or null) node_completed from
	// 							af_tasks.tc_task where project_id=? and node_id=? and deleted_at=0`,
	// 	constant.CommonStatusCompleted.Integer.Int8(), projectId, projectId).Debug().Scan(&isNodeCompleted).Error; err != nil {
	// 	log.WithContext(ctx).Error("nodeCompleted error ", zap.Error(err))
	// 	return false, errorcode.Desc(errorcode.TaskDatabaseError)
	// }
	// return isNodeCompleted == 1, nil

	if tx == nil {
		tx = p.data.DB
	}
	// 获取属于指定项目、节点，且状态不是已完成的工单数量
	c, err := count(
		tx.WithContext(ctx).Model(&model.WorkOrder{}),
		scope.SourceType(work_order.WorkOrderSourceTypeProject.Integer.Int32()),
		scope.SourceID(projectId),
		scope.NodeID(nodeId),
		scope.StatusNot(work_order.WorkOrderStatusFinished.Integer.Int32()),
	)
	if err != nil {
		return false, err
	}
	log.Debug("count unfinished work orders belonging to the specified project and node", zap.Int("count", c), zap.String("projectID", projectId), zap.String("nodeID", nodeId))
	if c != 0 {
		return false, nil
	}
	if c == 0 {
		var statuses []int8
		if err := tx.Raw(`select status from af_tasks.tc_task where project_id=? and node_id=? and deleted_at=0`,
			projectId, nodeId).Debug().Scan(&statuses).Error; err != nil {
			log.WithContext(ctx).Error("nodeCompleted error ", zap.Error(err))
			return false, errorcode.Desc(errorcode.TaskDatabaseError)
		}

		orderTotal, err := count(
			tx.WithContext(ctx).Model(&model.WorkOrder{}),
			scope.SourceType(work_order.WorkOrderSourceTypeProject.Integer.Int32()),
			scope.SourceID(projectId),
			scope.NodeID(nodeId),
			// scope.Status(work_order.WorkOrderStatusFinished.Integer.Int32()),
		)
		if err != nil {
			return false, err
		}

		if orderTotal == 0 && (len(statuses)) == 0 { //empty node can create
			return false, nil
		}

		for _, status := range statuses {
			if status != constant.CommonStatusCompleted.Integer.Int8() {
				return false, nil
			}
		}
	}

	return true, nil

}

// NodeExecutableExecutable 判断当前节点是否可开启,获取当前节点状态
func (p *ProjectRepo) NodeExecutable(ctx context.Context, tx *gorm.DB, projectId string, nodeInfo *model.TcFlowInfo) (int8, error) {
	if tx == nil {
		tx = p.data.DB
	}
	projectInfo := &model.TcProject{}
	if err := tx.Find(projectInfo, &model.TcProject{ID: projectId}).Error; err != nil {
		return 0, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//项目未开始，不可开启
	if projectInfo.Status == constant.CommonStatusReady.Integer.Int8() {
		return constant.TaskExecuteStatusBlocked.Integer.Int8(), nil
	}
	if nodeInfo.PrevNodeUnitIds == "" {
		return constant.TaskExecuteStatusExecutable.Integer.Int8(), nil
	}
	preNodeIds := strings.Split(nodeInfo.PrevNodeUnitIds, ",")
	executable := 0
	//node_tasks_total := 0

	switch nodeInfo.NodeStartMode {
	case constant.AllNodeCompletion.ToString(): //全部前序节点完成
		// 过滤前序节点。条件：节点的工单都已完成
		//if filtered, err := filterNodeIDsWithFinishedWorkOrder(tx.WithContext(ctx), projectId, preNodeIds); err != nil {
		//	return 0, err
		//} else if len(filtered) >= len(preNodeIds) {
		//	executable = 1
		//	// return constant.TaskExecuteStatusBlocked.Integer.Int8(), nil
		//}
		//
		//if err := tx.Debug().Raw(`select count(*) node_tasks_total from af_tasks.tc_task
		//where deleted_at=0 and  project_id=? and  node_id in ?`,
		//	projectId, preNodeIds).Scan(&node_tasks_total).Error; err != nil {
		//	log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
		//	return 0, errorcode.Desc(errorcode.TaskDatabaseError)
		//}
		//if node_tasks_total != 0 {
		//	err := tx.Raw(`select count(*)=count(node_tasks_total=node_complete_tasks or null) and count(*)=? all_completed  from
		//				(select count(*) node_tasks_total, count(status =? or null) node_complete_tasks from af_tasks.tc_task
		//						where deleted_at=0 and  project_id=? and  node_id in ? group by node_id ) r`,
		//		len(preNodeIds), constant.CommonStatusCompleted.Integer.Int8(), projectId, preNodeIds).Scan(&executable).Error
		//	if err != nil {
		//		log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
		//		return 0, errorcode.Desc(errorcode.TaskDatabaseError)
		//	}
		//}
		rawSQL := `select count(node_tasks_total = node_complete_tasks  or null) and count(*)=? all_completed from 
				( select count(*) node_tasks_total, count(complete_status =1 or null) node_complete_tasks
					from 
					( 
					select id, status=? as complete_status, node_id  from af_tasks.tc_task
						where deleted_at = 0 and project_id =? and node_id in ?
					union 
					select id,status=? as complete_status, node_id  from af_tasks.work_order wo 
						where deleted_at = 0 and node_id in ?
					) r0  group by r0.node_id 
			    ) r1`
		err := tx.Raw(rawSQL,
			len(preNodeIds), constant.CommonStatusCompleted.Integer.Int8(), projectId, preNodeIds,
			work_order.WorkOrderStatusFinished.Integer.Int32(), preNodeIds).Scan(&executable).Error
		if err != nil {
			log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
			return 0, errorcode.Desc(errorcode.TaskDatabaseError)
		}

	case constant.AnyNodeCompletion.ToString(): //任意前序节点完成
		// 过滤前序节点。条件：节点的工单都已完成
		//filtered, err := filterNodeIDsWithFinishedWorkOrderV2(tx.WithContext(ctx), projectId, preNodeIds)
		//if err != nil {
		//	return 0, err
		//}
		//if len(filtered) > 0 {
		//	executable = 1
		//}
		//if err := tx.Debug().Raw(`select count(*) node_tasks_total from af_tasks.tc_task
		//						where deleted_at=0 and  project_id=? and  node_id in ?`,
		//	projectId, filtered).Scan(&node_tasks_total).Error; err != nil {
		//	log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
		//	return 0, errorcode.Desc(errorcode.TaskDatabaseError)
		//}
		//if node_tasks_total != 0 {
		//	if err := tx.Debug().Raw(`select count(node_tasks_total = node_complete_tasks or null)>=1   has_completed  from
		//				(select count(*) node_tasks_total, count(status =? or null) node_complete_tasks from af_tasks.tc_task
		//						where deleted_at=0 and  project_id=? and  node_id in ? group by node_id ) r`,
		//		constant.CommonStatusCompleted.Integer.Int8(), projectId, filtered).Scan(&executable).Error; err != nil {
		//		log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
		//		return 0, errorcode.Desc(errorcode.TaskDatabaseError)
		//	}
		//}
		//理论上，判断下一个节点能否开启，只要任一前序节点状态是完成的即可，不需要纠结任务中的工单是否完成
		//有工单任务的完成校验应该放在一开始的时候校验，不是这里

		rawSQL := `select count(node_tasks_total = node_complete_tasks  or null) >= 1 has_completed from 
				( select count(*) node_tasks_total, count(complete_status =1 or null) node_complete_tasks
					from 
					( 
					select id, status=? as complete_status, node_id  from af_tasks.tc_task
						where deleted_at = 0 and project_id =? and node_id in ?
					union 
					select id,status=? as complete_status, node_id  from af_tasks.work_order wo 
						where deleted_at = 0 and node_id in ?
					) r0  group by r0.node_id 
			    ) r1`
		if err := tx.Debug().Raw(rawSQL,
			constant.CommonStatusCompleted.Integer.Int8(), projectId, preNodeIds,
			work_order.WorkOrderStatusFinished.Integer.Int32(), preNodeIds).Scan(&executable).Error; err != nil {
			log.WithContext(ctx).Error("task Executable AllNodeCompletion error ", zap.Error(err))
			return 0, errorcode.Desc(errorcode.TaskDatabaseError)
		}
	}
	if executable == 1 {
		return constant.TaskExecuteStatusExecutable.Integer.Int8(), nil
	}
	return constant.TaskExecuteStatusBlocked.Integer.Int8(), nil

}

// select count(node_tasks_total = node_complete_tasks or null)>=1   has_completed  from (select count(*) node_tasks_total, count(status =3 or null) node_complete_tasks from af_tasks.tc_task where deleted_at=0 and  project_id='e980a363-eaa2-4a35-9813-a0e1c480832c' and  node_id in ('9dbc57cd-770a-4eee-8eb8-0e22d3f4281c') group by node_id ) r

func (p *ProjectRepo) UpdateFollowExecutable(ctx context.Context, tx *gorm.DB, projectId, flowId, flowVersion, nodeId string) (tasks []*model.TcTask, err error) {
	//当前节点未完成就直接返回
	//todo 当前节点工单
	if tx == nil {
		tx = p.data.DB
	}
	completed, err := p.IsNodeCompleted(ctx, tx, projectId, nodeId)
	if err != nil {
		return tasks, err
	}
	if !completed {
		return tasks, nil
	}
	//查询后续节点
	nodeInfos := make([]*model.TcFlowInfo, 0)
	if err := tx.Model(new(model.TcFlowInfo)).Where(`prev_node_unit_ids like ? and flow_id=? and flow_version=? `,
		"%"+nodeId+"%", flowId, flowVersion).Find(&nodeInfos).
		Error; err != nil {
		return tasks, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//没有后续节点了，正常退出
	if len(nodeInfos) <= 0 {
		return tasks, nil
	}
	//挨个更新后续节点可执行状态
	for _, flowNode := range nodeInfos {
		tasks, err1 := p.UpdateCurrentExecutable(ctx, tx, projectId, flowNode)
		if err1 != nil {
			return tasks, err1
		}
	}
	return tasks, nil
}

func (p *ProjectRepo) UpdateFollowExecutableV2(ctx context.Context, projectId, flowId, flowVersion, nodeId string) (tasks []*model.TcTask, err error) {
	err = p.data.DB.Transaction(func(tx *gorm.DB) error {
		_, err := p.UpdateFollowExecutable(ctx, tx, projectId, flowId, flowVersion, nodeId)
		return err
	})

	if err != nil {
		log.WithContext(ctx).Error("DeleteProject transaction error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil, err
}

// UpdateCurrentExecutable 更新当前任务所在节点的状态
func (p *ProjectRepo) UpdateCurrentExecutable(ctx context.Context, tx *gorm.DB, projectId string, nodeInfo *model.TcFlowInfo) (tasks []*model.TcTask, err error) {
	if tx == nil {
		tx = p.data.DB
	}

	executable, err := p.NodeExecutable(ctx, tx, projectId, nodeInfo)
	if err != nil {
		return tasks, err
	}
	//查询激活的任务
	// tasks := make([]*model.TcTask, 0)
	if executable == constant.TaskExecuteStatusExecutable.Integer.Int8() {
		if err := p.data.DB.Model(new(model.TcTask)).Where("project_id=? and node_id=? and executable_status = ?",
			projectId, nodeInfo.NodeUnitID, constant.TaskExecuteStatusBlocked.Integer.Int8()).Debug().Find(&tasks).Error; err != nil {
			return tasks, errorcode.Desc(errorcode.TaskDatabaseError)
		}
		// 如果节点可执行，调用回调
		//
		//  1. 开启同项目，同节点下的未开启的工单
		for n, c := range p.callbacksOnNodeStart {
			if err := c(ctx, tx, projectId, nodeInfo.NodeUnitID); err != nil {
				return nil, fmt.Errorf("callback on node start fail, %s: %v", n, err)
			}
		}
	}
	if len(tasks) == 0 {
		return tasks, nil
	}
	//开启同项目，同节点下的未开启的任务
	if err := tx.Model(new(model.TcTask)).Where("project_id=? and node_id=? and executable_status = ?",
		projectId, nodeInfo.NodeUnitID, constant.TaskExecuteStatusBlocked.Integer.Int8()).Debug().Update("executable_status", executable).Error; err != nil {
		return tasks, errorcode.Desc(errorcode.TaskDatabaseError)
	}
	return tasks, nil
}

// StartProjectExecutable 开启项目的第一个节点的所有任务
func (p *ProjectRepo) StartProjectExecutable(ctx context.Context, tx *gorm.DB, projectId, projectFlowId, projectFlowVersionId string) error {
	if tx == nil {
		tx = p.data.DB
	}
	nodeInfo := new(model.TcFlowInfo)
	if err := tx.WithContext(ctx).Model(new(model.TcFlowInfo)).Where(`prev_node_unit_ids='' and flow_id=? and flow_version=? `,
		projectFlowId, projectFlowVersionId).First(&nodeInfo).Error; err != nil {
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//开启同项目，同节点下的未开启的任务
	if err := tx.Model(new(model.TcTask)).Where("project_id=? and node_id=? and executable_status=? and executor_id!='' ",
		projectId, nodeInfo.NodeUnitID, constant.TaskExecuteStatusBlocked.Integer.Int8()).Update("executable_status",
		constant.TaskExecuteStatusExecutable.Integer.Int8()).Error; err != nil {
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	//开启同项目，同节点下的未开启的工单
	for n, c := range p.callbacksOnNodeStart {
		if err := c(ctx, tx, projectId, nodeInfo.NodeUnitID); err != nil {
			return fmt.Errorf("callback on node start %q fail: %v", n, err)
		}
	}
	return nil
}

func (p *ProjectRepo) GetProjectWorkitems(ctx context.Context, query *tc_project.WorkitemsQueryParam) (list []*model.ProjectWorkitems, total int64, err error) {

	db := p.data.DB.WithContext(ctx).Model(&model.TcTask{})
	taskSql := "select tc_task.`id`, tc_task.`name`,'task' as type,  tc_task.`task_type` as sub_type, tc_task.`node_id` as node_id, " +
		"tc_task.`stage_id` as stage_id, tc_task.`status` as status,tc_task.`executor_id` as executor_id,tc_task.`updated_by_uid` as updated_by_uid,tc_task.`updated_at` as updated_at " +
		", tc_task.created_at AS created_at" +
		", tc_task.deadline AS deadline" +
		", 0 AS audit_status" +
		", 0 AS audit_description" +
		", false AS synced" +
		" " +
		"from af_tasks.tc_task"
	taskCountSql := "select count(*) from af_tasks.tc_task"
	taskWhere := fmt.Sprintf("where deleted_at = 0 and  tc_task.`project_id` = '%s'", query.ProjectId)

	if query.NodeId != "" {
		taskWhere = fmt.Sprintf("%s and tc_task.`node_id` = '%s'", taskWhere, query.NodeId)
	}
	if query.Keyword != "" {
		taskWhere = fmt.Sprintf("%s and tc_task.`name` like '%s'", taskWhere, "%"+util.KeywordEscape(query.Keyword)+"%")
	}
	if query.Status != "" {
		taskWhere = fmt.Sprintf("%s and tc_task.`status` =  %v", taskWhere, enum.ToInteger[constant.CommonStatus](query.Status, 0).Int8())
	}
	if query.Priority != "" {
		taskWhere = fmt.Sprintf("%s and tc_task.`priority` = %v", taskWhere, enum.ToInteger[constant.CommonPriority](query.Priority))
	}
	if query.ExecutorId != "" {
		taskWhere = fmt.Sprintf("%s and tc_task.`executor_id` = '%s'", taskWhere, query.ExecutorId)
	}

	var withClause string = "WITH project_workitems AS (\n"
	switch query.WorkitemType {
	// 全部
	case "task,work_order", "work_order,task", "":
		var b bytes.Buffer
		if err = tpl_raw_select_work_order_as_project_workitem.Execute(&b, query); err != nil {
			log.Error("generate sql for selecting work order fail", zap.Error(err))
			return
		}
		withClause = withClause + taskSql + "\n" + taskWhere + "\nUNION ALL\n" + b.String()

	//任务:
	case "task":
		withClause = withClause + taskSql + "\n" + taskWhere
	// 工单:
	case "work_order":
		var b bytes.Buffer
		if err = tpl_raw_select_work_order_as_project_workitem.Execute(&b, query); err != nil {
			log.Error("generate sql for selecting work order fail", zap.Error(err))
			return
		}
		withClause = withClause + b.String()
	default:
		log.Warn("unsupported object type", zap.String("objectType", query.WorkitemType))
	}
	withClause += " )"
	log.Debug("generated where statement", zap.String("taskWhere", withClause))

	var empty string
	var taskWereWithoutOrderBY string = taskWhere
	taskWhere = fmt.Sprintf("%s order by %s %s", taskWhere, query.Sort, query.Direction)
	limitWhere := fmt.Sprintf("limit %v offset %v", int(query.Limit), int(query.Limit*(query.Offset-1)))

	taskCountSql = withClause + " SELECT COUNT(`id`) FROM `project_workitems`"
	taskWhere, empty = empty, taskWhere
	err = db.Raw(fmt.Sprintf("%s %s", taskCountSql, taskWhere)).Debug().Scan(&total).Error
	if err != nil {
		return nil, 0, err
	}
	taskWhere, empty = empty, taskWhere

	if total > 0 {
		taskSql = withClause + " SELECT * FROM `project_workitems`"
		taskWhere = strings.TrimPrefix(taskWhere, taskWereWithoutOrderBY)
		err := db.Raw(fmt.Sprintf("%s %s %s", taskSql, taskWhere, limitWhere)).Debug().Scan(&list).Error
		if err != nil {
			return nil, 0, err
		}
		return list, total, nil
	}

	return nil, 0, nil
}

// 注册节点开启时的回调
func (p *ProjectRepo) RegisterCallbackOnNodeStart(name string, callback tcProject.CallbackOnNodeStart) error {
	if _, ok := p.callbacksOnNodeStart[name]; ok {
		return fmt.Errorf("callback %q already exists", name)
	}
	if p.callbacksOnNodeStart == nil {
		p.callbacksOnNodeStart = make(map[string]tcProject.CallbackOnNodeStart)
	}
	p.callbacksOnNodeStart[name] = callback
	return nil
}

// count 返回满足条件的数量
func count(tx *gorm.DB, conditions ...func(*gorm.DB) *gorm.DB) (int, error) {
	var c int64
	for _, cond := range conditions {
		tx = cond(tx)
	}
	if err := tx.Count(&c).Error; err != nil {
		return 0, err
	}
	return int(c), nil
}

//go:embed select_work_order_as_project_objection.sql
var raw_select_work_order_as_project_workitem string

// query 语句模板
var tpl_raw_select_work_order_as_project_workitem = template.Must(template.New("").Funcs(template.FuncMap{
	"workOrderStatusesForObjectionQueryParamStatus": workOrderStatusesForObjectionQueryParamStatus,
	"commonPriorityToInt32":                         func(p string) int32 { return enum.ToInteger[constant.CommonPriority](p).Int32() },
}).Parse(raw_select_work_order_as_project_workitem))

// ObjectQueryParam.Status -> work_order.WorkOrderStatus
func workOrderStatusesForObjectionQueryParamStatus(s string) (string, error) {
	var statuses []int
	switch s {
	case constant.CommonStatusReady.String:
		statuses = []int{
			work_order.WorkOrderStatusPendingSignature.Integer.Int(),
			work_order.WorkOrderStatusSignedFor.Integer.Int(),
		}
	case constant.CommonStatusOngoing.String:
		statuses = []int{
			work_order.WorkOrderStatusOngoing.Integer.Int(),
		}
	case constant.CommonStatusCompleted.String:
		statuses = []int{
			work_order.WorkOrderStatusFinished.Integer.Int(),
		}
	default:
		return "", fmt.Errorf("invalid objection query param status %q", s)
	}
	var buf bytes.Buffer
	buf.WriteRune('(')
	for i, s := range statuses {
		if i != 0 {
			buf.WriteString(", ")
		}
		buf.WriteString(strconv.Itoa(s))
	}
	buf.WriteRune(')')
	return buf.String(), nil
}

// filterNodeIDsWithFinishedWorkOrder 过滤节点列表，返回的每个节点的每个工单都已经完成
func filterNodeIDsWithFinishedWorkOrder(tx *gorm.DB, projectID string, nodeIDs []string) (result []string, err error) {
	// 获取属于前序节点的、未完成的工单
	var workOrders []model.WorkOrder
	log.Debug("list unfinished work orders belonging to the nodes", zap.String("projectID", projectID), zap.Strings("nodeIDs", nodeIDs))
	if err = tx.Model(&model.WorkOrder{}).
		Scopes(
			scope.SourceType(work_order.WorkOrderSourceTypeProject.Integer.Int32()),
			scope.SourceID(projectID),
			scope.NodeIDs(nodeIDs),
			scope.StatusNot(work_order.WorkOrderStatusFinished.Integer.Int32()),
		).Find(&workOrders).Error; err != nil {
		log.Error("list unfinished work orders belonging to the nodes failed", zap.Error(err), zap.String("projectID", projectID), zap.Strings("preNodeIDs", nodeIDs))
		return
	}
	log.Debug("unfinished work orders belonging to the nodes", zap.Any("workOrders", workOrders), zap.String("projectID", projectID), zap.Strings("nodeIDs", nodeIDs))

	// 存在未完成工单的节点 ID
	var incompleteNodeIDs = sets.New(lo.Map(workOrders, func(o model.WorkOrder, _ int) string { return o.NodeID })...)

	// 差集：全部 - 存在未完成工单的 = 全部工单已完成的
	result = sets.List(sets.New(nodeIDs...).Difference(incompleteNodeIDs))
	return
}

func filterNodeIDsWithFinishedWorkOrderV2(tx *gorm.DB, projectID string, nodeIDs []string) (result []string, err error) {
	// 获取属于前序节点的、未完成的工单
	var workOrders []model.WorkOrder
	log.Debug("list unfinished work orders belonging to the nodes", zap.String("projectID", projectID), zap.Strings("nodeIDs", nodeIDs))
	if err = tx.Model(&model.WorkOrder{}).
		Scopes(
			scope.SourceType(work_order.WorkOrderSourceTypeProject.Integer.Int32()),
			scope.SourceID(projectID),
			scope.NodeIDs(nodeIDs),
			// scope.StatusNot(work_order.WorkOrderStatusFinished.Integer.Int32()),
		).Find(&workOrders).Error; err != nil {
		log.Error("list unfinished work orders belonging to the nodes failed", zap.Error(err), zap.String("projectID", projectID), zap.Strings("preNodeIDs", nodeIDs))
		return
	}
	log.Debug("unfinished work orders belonging to the nodes", zap.Any("workOrders", workOrders), zap.String("projectID", projectID), zap.Strings("nodeIDs", nodeIDs))

	for _, workOrder := range workOrders {
		if workOrder.Status == work_order.WorkOrderStatusFinished.Integer.Int32() {
			result = append(result, workOrder.NodeID)
		}
	}
	return
}
