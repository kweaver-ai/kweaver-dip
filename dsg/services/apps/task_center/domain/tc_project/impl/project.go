package impl

import (
	"context"
	"errors"
	"fmt"
	"sort"
	"strings"
	"time"

	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_view"
	operationLog "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/operation_log"
	taskRelationData "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/task_relation_data"
	tcFlowInfo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_flow_info"
	tcMember "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_member"
	tcOss "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_oss"
	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project"
	tcTask "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"

	"github.com/go-sql-driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type ProjectUserCase struct {
	producer         kafkax.Producer
	repo             tcProject.Repo
	taskRepo         tcTask.Repo
	taskUserCase     tc_task.UserCase
	ossRepo          tcOss.Repo
	memberRepo       tcMember.Repo
	flowInfoRepo     tcFlowInfo.Repo
	userDomain       user.IUser
	opLogRepo        operationLog.Repo
	cc               configuration_center.Call
	relationDataRepo taskRelationData.Repo
	dataViewDriven   data_view.DataView
}

func NewProjectUserCase(
	producer kafkax.Producer,
	repo tcProject.Repo,
	taskRepo tcTask.Repo,
	taskUserCase tc_task.UserCase,
	ossRepo tcOss.Repo,
	memberRepo tcMember.Repo,
	flowInfoRepo tcFlowInfo.Repo,
	userDomain user.IUser,
	opLogRepo operationLog.Repo,
	relationDataRepo taskRelationData.Repo,
	cc configuration_center.Call,
	dataView data_view.DataView,
) tc_project.UserCase {
	return &ProjectUserCase{
		producer:         producer,
		repo:             repo,
		taskRepo:         taskRepo,
		taskUserCase:     taskUserCase,
		ossRepo:          ossRepo,
		memberRepo:       memberRepo,
		flowInfoRepo:     flowInfoRepo,
		userDomain:       userDomain,
		opLogRepo:        opLogRepo,
		relationDataRepo: relationDataRepo,
		cc:               cc,
		dataViewDriven:   dataView,
	}
}

// Create a new project
func (p *ProjectUserCase) Create(ctx context.Context, projectReq *tc_project.ProjectReqModel) error {
	//1. check project name: must be unique
	exist, err := p.repo.CheckRepeat(ctx, "", projectReq.Name)
	if err != nil {
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.ProjectNameRepeatError)
	}

	//2. check image existence
	if projectReq.Image != "" {
		err = p.CheckImageExistence(ctx, projectReq.Image)
		if err != nil {
			return err
		}
	}

	//2.1 check user role
	//is, err := p.cc.HasAccessPermission(ctx, projectReq.OwnerID, access_control.POST_ACCESS, access_control.Task)
	//if err != nil {
	//	return err
	//}
	//if !is {
	//	return errorcode.Desc(errorcode.OwnerIdIsNotProjectMgm)
	//}
	//is, err := p.cc.UserIsInRole(ctx, access_control.TCDataButler, projectReq.OwnerID)
	//if err != nil {
	//	return err
	//}
	//if !is {
	//	return errorcode.Desc(errorcode.OwnerIdIsNotProjectMgm)
	//}

	//3. get pipelines view and nodes from configuration center, and check
	info, err := configuration_center.GetRemotePipelineInfo(ctx, projectReq.FlowID, projectReq.FlowVersion)
	if err != nil {
		return err
	}

	// TODO 20250611 权限可以动态配置后，根据角色校验没什么作用了
	//3.1.1 check role existence
	//realRoles := make(map[string]int)
	//for _, info := range info.Nodes {
	//	roles := tc_task.TasksToRole(ctx, info.TaskConfig.TaskType...)
	//	for _, role := range roles {
	//		realRoles[role] = 1
	//	}
	//}

	//relations := projectReq.GenRelations()
	//if err := CheckRoleExistence(ctx, realRoles, relations, projectReq.GenRoles()); err != nil {
	//	return err
	//}
	//过滤掉不存在的用户角色
	//if len(relations) > 0 {
	//	projectReq.RemoveInvalid(relations)
	//}

	//3.1 gen repo‘s project，TcFlowInfo，TcFlowView
	tableProject, err := projectReq.GenProject()
	if err != nil {
		return err
	}
	//3.2 gen members
	members, err := projectReq.GenMembers()
	if err != nil {
		return err
	}

	//3.3
	flowInfos, err := GenFlowInfo(info)
	if err != nil {
		return err
	}
	//4
	flowView, err := GenFlowView(info)
	if err != nil {
		return err
	}

	//4. insert project, tc_flow_info and tc_flow_view
	if err = p.repo.Insert(ctx, tableProject, members, flowInfos, flowView); err != nil {
		mysqlErr := &mysql.MySQLError{}
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return errorcode.Desc(errorcode.ProjectNameRepeatError)
		}
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}

	projectReq.ID = tableProject.ID
	return nil
}
func (p *ProjectUserCase) Update(ctx context.Context, projectReq *tc_project.ProjectEditModel) error {
	//1.1. check pid whether exist
	old, err := p.repo.Get(ctx, projectReq.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.ProjectRecordNotFoundError)
		}
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	//1.2 can't update completed project
	if old.Status == constant.CommonStatusCompleted.Integer.Int8() {
		return errorcode.Desc(errorcode.ProjectCompletedCantUpdateError)
	}

	//if projectReq.OwnerID != old.OwnerID {
	//	is, err := p.cc.UserIsInRole(ctx, access_control.TCDataButler, projectReq.OwnerID)
	//	if err != nil {
	//		return err
	//	}
	//	if !is {
	//		return errorcode.Desc(errorcode.OwnerIdIsNotProjectMgm)
	//	}
	//}

	//1.3. check project name: unique
	exist, err := p.repo.CheckRepeat(ctx, projectReq.ID, projectReq.Name)
	if err != nil {
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.ProjectNameRepeatError)
	}
	//1.4. check image existence
	if projectReq.Image != nil && *projectReq.Image != "" {
		err = p.CheckImageExistence(ctx, *projectReq.Image)
		if err != nil {
			return err
		}
	}
	if projectReq.ThirdProjectId == "" {
		projectReq.ThirdProjectId = old.ThirdProjectId
	}
	//2.1 gen repo‘s project，TcFlowInfo，TcFlowView
	tcProject, err := projectReq.GenTcProject()
	if err != nil {
		return err
	}

	// check role existence
	//flowInfo, err := p.flowInfoRepo.GetNodes(ctx, old.FlowID, old.FlowVersion)
	//if err != nil {
	//	return errorcode.Desc(errorcode.TaskDatabaseError)
	//}
	//realRoles := make(map[string]int)
	//for _, info := range flowInfo {
	//	taskTypes := enum.BitsSplit[constant.TaskType](uint32(info.TaskType))
	//	roles := tc_task.TasksToRole(ctx, taskTypes...)
	//	for _, role := range roles {
	//		realRoles[role] = 1
	//	}
	//}
	//relations := projectReq.GenRelations()
	//if err := CheckRoleExistence(ctx, realRoles, relations, projectReq.GenRoles()); err != nil {
	//	return err
	//}
	////过滤掉不存在的用户角色
	//if len(relations) > 0 {
	//	projectReq.RemoveInvalid(relations)
	//}

	//2.2 check whether status can be updated
	err = p.CheckStatus(ctx, tcProject, old)
	if err != nil {
		return err
	}
	// 完成项目, 发布消息
	if old.Status == constant.CommonStatusOngoing.Integer.Int8() && tcProject.Status == constant.CommonStatusCompleted.Integer.Int8() {
		//先检查是否有未删除的失效任务
		invalidTasks, err := p.taskRepo.GetInvalidTasks(ctx, old.ID)
		if err != nil {
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
		if len(invalidTasks) > 0 {
			return errorcode.Desc(errorcode.ProjectHasInvalidTaskError)
		}

		if err = p.FinishDataViewTask(ctx, old.ID); err != nil {
			return err
		}

		tcProject.CompleteTime = time.Now().Unix()
		log.WithContext(ctx).Info("publish projects......")
		if err := p.SendProjectChangeMsg(ctx, old.ID, constant.FinishProjectTopic); err != nil {
			log.WithContext(ctx).Error(err.Error() + "........")
		}
	}

	//2.3 gen members
	members := projectReq.GenMembers()

	//2.4. insert project, tc_flow_info and tc_flow_view
	if err = p.repo.Update(ctx, tcProject, members); err != nil {
		mysqlErr := &mysql.MySQLError{}
		if errors.As(err, &mysqlErr) && mysqlErr.Number == 1062 {
			return errorcode.Desc(errorcode.ProjectNameRepeatError)
		}
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	if projectReq.Status == constant.CommonStatusOngoing.String && old.Status == constant.CommonStatusReady.Integer.Int8() {
		// if err := p.taskRepo.StartProjectExecutable(ctx, old); err != nil {
		// 	return errorcode.Detail(errorcode.ProjectActiveTaskError, err.Error())
		// }
		if err := p.repo.StartProjectExecutable(ctx, nil, old.ID, old.FlowID, old.FlowVersion); err != nil {
			return errorcode.Detail(errorcode.ProjectActiveTaskError, err.Error())
		}

	}
	//if projectReq.OwnerID != old.OwnerID {
	//	if err = p.cc.AddUsersToRole(ctx, access_control.ProjectMgm, projectReq.OwnerID); err != nil {
	//		return err
	//	}
	//	if err = p.cc.DeleteUsersToRole(ctx, access_control.ProjectMgm, old.OwnerID); err != nil {
	//		return err
	//	}
	//}

	return nil
}
func (p *ProjectUserCase) FinishDataViewTask(ctx context.Context, pid string) error {
	//同步数据表视图任务 项目完成发布
	tasks, err := p.taskRepo.GetSpecifyTypeTasks(ctx, pid, constant.TaskTypeSyncDataView.Integer.Int32())
	if err != nil {
		return err
	}
	taskIds := make([]string, len(tasks))
	for i, task := range tasks {
		taskIds[i] = task.ID
	}
	if err = p.dataViewDriven.FinishProject(ctx, taskIds); err != nil {
		return err
	}
	return nil
}

// GetDetail get indicator detail info by id
func (p *ProjectUserCase) GetDetail(ctx context.Context, id string) (*tc_project.ProjectDetailModel, error) {
	projectInfo, err := p.repo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ProjectRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	//add flow info name
	view, err := p.repo.GetFlowView(ctx, projectInfo.FlowID, projectInfo.FlowVersion)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ProjectViewNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	detail := tc_project.NewProjectDetailModel(projectInfo)
	detail.FlowName = view.Name
	//add project member
	members, err := p.memberRepo.Query(ctx, constant.ProjectObjValue, id)
	if err != nil {
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	mmap := make(map[string]tc_project.ProjectMemberExport)
	for _, member := range members {
		m, ok := mmap[member.UserID]
		if ok {
			m.Roles = append(m.Roles, member.RoleID)
			mmap[member.UserID] = m
		} else {
			mmap[member.UserID] = tc_project.ProjectMemberExport{
				UserId: member.UserID,
				//UserName: users.GetUser(member.UserID).Name(),
				UserName: p.userDomain.GetNameByUserId(ctx, member.UserID),
				Roles:    []string{member.RoleID},
			}
		}
	}
	membersExport := make([]tc_project.ProjectMemberExport, 0)
	for _, v := range mmap {
		membersExport = append(membersExport, v)
	}
	detail.Members = membersExport
	//add username
	/*	detail.OwnerName = users.Get(detail.OwnerID).Name()
		detail.CreatedBy = users.Get(detail.CreatedByUID).Name()
		detail.UpdatedBy = users.Get(detail.UpdatedByUID).Name()*/
	detail.OwnerName = p.userDomain.GetNameByUserId(ctx, detail.OwnerID)
	detail.CreatedBy = p.userDomain.GetNameByUserId(ctx, detail.CreatedByUID)
	detail.UpdatedBy = p.userDomain.GetNameByUserId(ctx, detail.UpdatedByUID)
	return detail, nil
}

// GetDetail get indicator detail info by id
func (p *ProjectUserCase) GetThirdProjectDetail(ctx context.Context, thirdId string) (*tc_project.ProjectDetailModel, error) {
	projectInfo, err := p.repo.GetThirdProjectDetail(ctx, thirdId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ProjectRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	if projectInfo != nil {
		return p.GetDetail(ctx, projectInfo.ID)
	}
	return nil, nil
}

// CheckRepeat check whether project name is repeat or not
func (p *ProjectUserCase) CheckRepeat(ctx context.Context, req tc_project.ProjectNameRepeatReq) error {
	//check project name, name must be unique
	exist, err := p.repo.CheckRepeat(ctx, req.Id, req.Name)
	if err != nil {
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.ProjectNameRepeatError)
	}
	return nil
}

// GetProjectCandidate get project member candidates
func (p *ProjectUserCase) GetProjectCandidate(ctx context.Context, reqData *tc_project.FlowIdModel) (*tc_project.ProjectCandidates, error) {
	candidates := tc_project.ProjectCandidates{}
	exists, err := p.repo.CheckTaskRoles(ctx, reqData.FlowID, reqData.FlowVersion)
	if err != nil {
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}

	var taskTypes []string
	roles := make([]string, 0)
	if exists {
		nodes, err := p.flowInfoRepo.GetNodes(ctx, reqData.FlowID, reqData.FlowVersion)
		if err != nil {
			return nil, err
		}
		for _, node := range nodes {
			taskTypes = append(taskTypes, enum.BitsSplit[constant.TaskType](uint32(node.TaskType))...)
		}
		taskTypes = util.SliceUnique(taskTypes)
		roles = util.SliceUnique(tc_task.TasksToRole(ctx, taskTypes...))
	} else {
		pipLineInfo, err := configuration_center.GetRemotePipelineInfo(ctx, reqData.FlowID, reqData.FlowVersion)
		if err != nil {
			return nil, err
		}
		for _, node := range pipLineInfo.Nodes {
			taskTypes = append(taskTypes, node.TaskConfig.TaskType...)
		}
		taskTypes = util.SliceUnique(taskTypes)
		roles = util.SliceUnique(tc_task.TasksToRole(ctx, taskTypes...))
	}
	sort.Slice(roles, func(i, j int) bool {
		return roles[i] < roles[j]
	})
	//in group
	candidates.RoleGroups, err = p.genRoleGroup(ctx, roles)
	if err != nil {
		return nil, err
	}
	//select
	if reqData.Id != "" {
		//check project and flowId
		projectInfo, err := p.repo.Get(ctx, reqData.Id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errorcode.Desc(errorcode.ProjectRecordNotFoundError)
			}
			return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}

		if projectInfo.FlowID != reqData.FlowID || projectInfo.FlowVersion != reqData.FlowVersion {
			return nil, errorcode.Desc(errorcode.ProjectAndViewNotMatchedError)
		}

		members, err := p.memberRepo.Query(ctx, constant.ProjectObjValue, reqData.Id)
		if err != nil {
			return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
		chosen(candidates.RoleGroups, members)
	}
	return &candidates, nil
}

// GetProjectCandidateByTaskType get project member candidates by task type same to GetProjectCandidate
func (p *ProjectUserCase) GetProjectCandidateByTaskType(ctx context.Context, reqData *tc_project.ProjectID) ([]tc_project.TaskTypeGroup, error) {
	//任务类型返回所有
	taskTypes := enum.List[constant.TaskType]()
	res := make([]tc_project.TaskTypeGroup, len(taskTypes), len(taskTypes))
	for i, taskType := range taskTypes {
		member, err := p.taskUserCase.GetTaskMember(ctx, tc_task.TaskPathTaskType{
			PId:      reqData.Id,
			TaskType: taskType.String,
		})
		if err != nil {
			return nil, err
		}
		res[i] = tc_project.TaskTypeGroup{
			TaskType: taskType.String,
			Members:  member,
		}
	}
	return res, nil
}

func (p *ProjectUserCase) QueryProjects(ctx context.Context, params *tc_project.ProjectCardQueryReq) (response.PageResult, error) {
	if params.Status != "" {
		statusSlice := strings.Split(params.Status, ",")
		for i, s := range statusSlice {
			intStatus := enum.ToInteger[constant.CommonStatus](s)
			if intStatus <= 0 {
				continue
			}
			statusSlice[i] = fmt.Sprintf("%d", intStatus)
		}
		params.Status = strings.Join(statusSlice, ",")
	}

	var data interface{}
	pageResult := response.PageResult{
		Limit:      int(params.Limit),
		Offset:     int(params.Offset),
		TotalCount: 0,
		Entries:    data,
	}
	//if params.Name != "" {
	//	params.Name = strings.ReplaceAll(params.Name, "_", "\\_")
	//}
	projects, total, err := p.repo.QueryProjects(ctx, params)
	if err != nil {
		return pageResult, errorcode.Detail(errorcode.ProjectDatabaseError, err)
	}
	exportProjects := make([]tc_project.ProjectListModel, len(projects))
	for i, project := range projects {
		exportProjects[i] = tc_project.NewProjectListModel(&project,
			p.userDomain.GetNameByUserId(ctx, project.OwnerID),
			p.userDomain.GetNameByUserId(ctx, project.UpdatedByUID),
		)
		//未开始就不用判断是否有模型数据了
		if project.Status == constant.CommonStatusReady.Integer.Int8() {
			continue
		}
		btc, dtc, err := p.taskRepo.GetProjectModelTaskCount(ctx, project.ID)
		if err != nil {
			log.Warnf("查询项目任务状态报错：%v", err.Error())
		} else {
			//判断是否有完成的业务模型任务
			exportProjects[i].HasBusinessModelData = btc > 0
			//判断是否有完成的数据模型任务
			exportProjects[i].HasDataModelData = dtc > 0
		}
	}
	pageResult.TotalCount = total
	pageResult.Entries = exportProjects
	return pageResult, nil
}

func (p *ProjectUserCase) CheckStatus(ctx context.Context, newProject *model.TcProject, old *model.TcProject) error {
	// 0 检查状态有无变化:未开始1、进行中2、已完成3

	oldStatus, newStatus := old.Status, newProject.Status
	// 1 如果没变，不管。old==0 或者相等
	if newStatus == 0 || newStatus == old.Status {
		return nil
	}

	// 2 如果变了： 状态不能越级，不能回退，更新为completed
	if newStatus-oldStatus > 1 {
		return errorcode.Detail(errorcode.ProjectStatusError, "状态切换不可越级")
	}
	if newStatus < oldStatus {
		return errorcode.Detail(errorcode.ProjectStatusError, "状态切换不可回退")
	}
	if oldStatus == constant.CommonStatusCompleted.Integer.Int8() {
		return errorcode.Detail(errorcode.ProjectStatusError, "已完成的项目不可再切换其他任何状态")
	}
	//项目中的所有任务均为已完成的情况下，项目才可切换成“已完成” ； 已完成--已完成的项目不可再切换其他任何状态
	if newStatus == constant.CommonStatusCompleted.Integer.Int8() {
		//检查所有任务是否完成
		tasks, err := p.repo.GetAllTasks(ctx, newProject.ID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return errorcode.Detail(errorcode.ProjectGetAllTaskError, "项目中的所有任务均为已完成的情况下，项目才可切换成“已完成")
			}
			return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
		}
		for _, task := range tasks {
			if task.Status != constant.CommonStatusCompleted.Integer.Int8() {
				//return errorcode.Detail(errorcode.ProjectStatusError, "项目中的所有任务均为已完成的情况下，项目才可切换成“已完成”")
				return errorcode.Desc(errorcode.ProjectStatusCompletedError)
			}
		}
		//项目中的所有任务均为已完成的情况下，项目才可切换成“已完成” ； 已完成--已完成的项目不可再切换其他任何状态(todo @吴毓喆)
	}

	return nil
}

func (p *ProjectUserCase) GetFlowView(ctx context.Context, pid string) (*tc_project.FlowchartView, error) {
	project, err := p.repo.Get(ctx, pid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ProjectRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	view, err := p.repo.GetFlowView(ctx, project.FlowID, project.FlowVersion)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ProjectViewNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	flowchartView := &tc_project.FlowchartView{}
	flowchartView.Content = view.Content
	return flowchartView, nil
}

func (p *ProjectUserCase) CheckImageExistence(ctx context.Context, id string) error {
	_, err := p.ossRepo.Get(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.ProjectImgNotFound)
		}
		return errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	return nil
}

// DeleteMemberByUsedRoleUserProject 删除未完成的项目中涉及到该角色用户的成员
func (p *ProjectUserCase) DeleteMemberByUsedRoleUserProject(ctx context.Context, roleId string, userId string) error {
	//查询未完成的项目
	totalProjects, err := p.repo.QueryUserProjects(ctx, userId, roleId, constant.CommonStatusReady.Integer.Int8())
	if err != nil {
		log.WithContext(ctx).Error("GetProjectNotCompletedByFlow DatabaseError ", zap.Error(err))
		return err
	}
	if len(totalProjects) == 0 {
		log.WithContext(ctx).Warn("DeleteMemberByUsedRoleUserProject empty")
		return nil
	}
	uniqueMap := make(map[string]int)
	for _, project := range totalProjects {
		if _, ok := uniqueMap[project.ID]; ok {
			continue
		} else {
			uniqueMap[project.ID] = 1
		}
		//删除member中的项目成员信息
		if err := p.repo.UpdateProjectBecauseDeleteUser(ctx, project, &model.TcMember{
			ObjID:  project.ID,
			UserID: userId,
			RoleID: roleId,
		}); err != nil {
			return err
		}
	}
	return nil
}

// DeleteProject 删除项目
func (p *ProjectUserCase) DeleteProject(ctx context.Context, projectId string) (string, error) {
	project, err := p.repo.Get(ctx, projectId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return "", errorcode.Desc(errorcode.ProjectRecordNotFoundError)
		}
		return "", errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}

	//已完成的项目，不允许删除
	if project.Status == constant.CommonStatusCompleted.Integer.Int8() {
		return "", errorcode.Desc(errorcode.ProjectCompletedCantDeleteError)
	}

	//如果是进行中的任务,需要发送消息
	var msgFunc func() error
	if project.Status == constant.CommonStatusOngoing.Integer.Int8() {
		businessProcessIDSlice := p.GetModelTaskProcessInfo(ctx, projectId, constant.TaskTypeNewMainBusiness.Integer.Int32())
		dataProcessIDSlice := p.GetModelTaskProcessInfo(ctx, projectId, constant.TaskTypeDataMainBusiness.Integer.Int32())
		// 如果有模型,发消息
		if !(len(businessProcessIDSlice) <= 0 && len(dataProcessIDSlice) <= 0) {
			msgFunc = p.SendProjectDeletedMsgFunc(ctx, projectId, constant.DeleteProjectTopic, businessProcessIDSlice, dataProcessIDSlice)
		}
	}

	if _, err := p.repo.DeleteProject(ctx, projectId, msgFunc); err != nil {
		return "", err
	}

	//暂不发送任务删除消息
	//_ = p.cc.DeleteUsersToRole(ctx, access_control.ProjectMgm, project.OwnerID)
	return project.Name, nil
}

func (p *ProjectUserCase) SendProjectDeletedMsgFunc(ctx context.Context, pid, topic string, businessProcessIDSlice, dataProcessIDSlice []string) func() error {
	return func() error {
		token, err1 := user_util.ObtainToken(ctx)
		if err1 != nil {
			return err1
		}
		msg := tc_project.NewProjectChangeMsg(pid, businessProcessIDSlice, dataProcessIDSlice, token)
		bytes := msg.Marshal()
		log.Infof("topic:%v, sending message:%s", topic, string(bytes))
		if err := p.producer.Send(topic, bytes); err != nil {
			log.WithContext(ctx).Error("publish msg error", zap.Any("topic", topic), zap.Error(err))
			return err
		}
		return nil
	}
}

func (p *ProjectUserCase) SendProjectChangeMsg(ctx context.Context, pid, topic string) error {
	token, err1 := user_util.ObtainToken(ctx)
	if err1 != nil {
		return err1
	}
	businessProcessIDSlice := p.GetModelTaskProcessInfo(ctx, pid, constant.TaskTypeNewMainBusiness.Integer.Int32())
	dataProcessIDSlice := p.GetModelTaskProcessInfo(ctx, pid, constant.TaskTypeDataMainBusiness.Integer.Int32())
	if len(businessProcessIDSlice) <= 0 && len(dataProcessIDSlice) <= 0 {
		return nil
	}
	msg := tc_project.NewProjectChangeMsg(pid, businessProcessIDSlice, dataProcessIDSlice, token)
	bytes := msg.Marshal()
	log.Infof("topic:%v, sending message:%s", topic, string(bytes))
	if err := p.producer.Send(topic, bytes); err != nil {
		log.WithContext(ctx).Error("publish msg error", zap.Any("topic", topic), zap.Error(err))
		return err
	}
	return nil
}

func (p *ProjectUserCase) GetModelTaskProcessInfo(ctx context.Context, pid string, taskType int32) []string {
	tc, err := p.taskRepo.GetSpecifyTypeTasks(ctx, pid, taskType)
	if err != nil {
		log.Warnf("查询项目%v业务模型任务错误：%v", pid, err.Error())
	}
	if len(tc) <= 0 {
		return nil
	}
	tids := lo.Times(len(tc), func(index int) string {
		return tc[index].ID
	})
	ids, err := p.relationDataRepo.GetProjectProcessId(ctx, pid, tids)
	if err != nil {
		log.Warnf("查询项目%v任务关联数据错误：%v", pid, err.Error())
	}
	if len(ids) <= 0 {
		return nil
	}
	return lo.Uniq(ids)
}

// QueryDomainCreatedByProject 查询项目中创建的业务流程
func (p *ProjectUserCase) QueryDomainCreatedByProject(ctx context.Context, projectId string) (*tc_project.ProjectDomainInfo, error) {
	project, err := p.repo.Get(ctx, projectId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.ProjectRecordNotFoundError)
		}
		return nil, errorcode.Detail(errorcode.ProjectDatabaseError, err.Error())
	}
	mts, err := p.taskRepo.GetProjectModelTaskStatus(ctx, projectId)
	if err != nil {
		log.Warn("query project business domain error!", zap.Error(err))
	}
	//查询业务模型的流程ID
	bts := lo.FlatMap(mts, func(item *model.TcTask, index int) []string {
		if item.TaskType == constant.TaskTypeNewMainBusiness.Integer.Int32() {
			return []string{item.ID}
		}
		return nil
	})
	businessProcessIDSlice := make([]string, 0)
	if len(bts) > 0 {
		businessProcessIDSlice, err = p.relationDataRepo.GetTaskProcessId(ctx, bts...)
		if err != nil {
			log.Warn("query project business domain error!", zap.Error(err))
			businessProcessIDSlice = make([]string, 0)
		}
	}
	//查询数据模型的流程ID
	dts := lo.FlatMap(mts, func(item *model.TcTask, index int) []string {
		if item.TaskType == constant.TaskTypeDataMainBusiness.Integer.Int32() {
			return []string{item.ID}
		}
		return nil
	})
	dataProcessIDSlice := make([]string, 0)
	if len(dts) > 0 {
		dataProcessIDSlice, err = p.relationDataRepo.GetTaskProcessId(ctx, dts...)
		if err != nil {
			log.Warn("query project business domain error!", zap.Error(err))
			dataProcessIDSlice = make([]string, 0)
		}
	}

	return &tc_project.ProjectDomainInfo{
		ID:               project.ID,
		Name:             project.Name,
		Status:           enum.ToString[constant.CommonStatus](project.Status),
		BusinessDomainID: businessProcessIDSlice,
		DataDomainID:     dataProcessIDSlice,
	}, nil
}

func (p *ProjectUserCase) GetProjectWorkitems(ctx context.Context, query *tc_project.WorkitemsQueryParam) (*tc_project.WorkitemsQueryResp, error) {
	workitemLists, count, err := p.repo.GetProjectWorkitems(ctx, query)
	if err != nil {
		return nil, err
	}

	workitemListsResp := make([]*tc_project.WorkitemsInfo, 0)
	for _, workitem := range workitemLists {
		workitemInfo := &tc_project.WorkitemsInfo{
			Id:               workitem.ID,
			Name:             workitem.Name,
			Type:             workitem.Type,
			SubType:          lo.Switch[string, string](workitem.Type).Case("task", enum.ToString[constant.TaskType](workitem.SubType)).Case("work_order", enum.ToString[work_order.WorkOrderType](workitem.SubType)).Default(""),
			StageId:          workitem.StageID,
			NodeId:           workitem.NodeID,
			Status:           enum.ToString[constant.CommonStatus](workitem.Status),
			ExecutorId:       workitem.ExecutorID.String,
			ExecutorName:     p.userDomain.GetNameByUserId(ctx, workitem.ExecutorID.String),
			Deadline:         workitem.Deadline.Int64,
			UpdatedBy:        p.userDomain.GetNameByUserId(ctx, workitem.UpdatedByUID),
			UpdatedAt:        workitem.UpdatedAt.UnixMilli(),
			AuditStatus:      enum.ToString[work_order.AuditStatus](workitem.AuditStatus),
			AuditDescription: workitem.AuditDescription,
			NeedSync:         checkProjectWorkitemsNeedSync(workitem),
		}
		workitemListsResp = append(workitemListsResp, workitemInfo)
	}
	resp := &tc_project.WorkitemsQueryResp{}
	resp.TotalCount = count
	resp.Entries = workitemListsResp
	return resp, nil
}

// checkProjectWorkitemsNeedSync 返回 ProjectWorkitems 是否需要同步
func checkProjectWorkitemsNeedSync(in *model.ProjectWorkitems) bool {
	// 仅工单需要同步
	if in.Type != "work_order" {
		return false
	}
	// 理解工单不需要同步
	if in.SubType == work_order.WorkOrderTypeDataComprehension.Integer.Int32() {
		return false
	}
	// 未同步的需要同步
	return !in.Synced
}
