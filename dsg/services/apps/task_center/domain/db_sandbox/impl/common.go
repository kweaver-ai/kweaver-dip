package impl

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

// applyListCheck 数据沙箱清单列表数据检查，补充数据
// 1. 补充用户角色
// 2. 补充用户所在项目
func (u *useCase) queryUserInfo(ctx context.Context) (req *domain.Applicant, err error) {
	uInfo, _ := user_util.ObtainUserInfo(ctx)
	userInfo, err := u.ccDriven.GetUserInfo(ctx, uInfo.ID)
	if err != nil {
		return nil, errorcode.PublicQueryUserInfoError.Detail(err.Error())
	}
	firstDepartment := userInfo.ParentDeps[0]
	lastNode := firstDepartment[len(firstDepartment)-1]
	return &domain.Applicant{
		ApplicantID:    userInfo.ID,
		ApplicantName:  userInfo.Name,
		DepartmentID:   lastNode.ID,
		DepartmentName: lastNode.Name,
		ApplicantPhone: userInfo.PhoneNumber,
		ApplicantRole: lo.Times(len(userInfo.Roles), func(index int) string {
			return userInfo.Roles[index].ID
		}),
	}, nil
}

// applyListCheck 数据沙箱清单列表数据检查，补充数据
// 1. 补充用户角色
// 2. 补充用户所在项目
func (u *useCase) fixAccessor(ctx context.Context) (req *domain.SandboxAccessor, err error) {
	req = &domain.SandboxAccessor{}
	//1. 补充用户角色
	applicant, err := u.queryUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	req.Applicant = *applicant
	//2. 补充用户所在项目
	projectID, err := u.memberRepo.QueryUserProject(ctx, req.ApplicantID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	req.AuthorizedProjects = projectID
	return req, nil
}

// canOperate 申请/扩容检查
// 1. 用户是项目人员才可以操作
// 2. 一个项目同时只能有一个申请/扩容
func (u *useCase) canOperate(ctx context.Context, projectID string) (req *domain.Applicant, err error) {
	req, err = u.queryUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	req.CurrentDepartmentName = req.DepartmentName
	//查询项目, 检查项目是否存在
	if projectInfo, err := u.projectRepo.Get(ctx, projectID); err != nil {
		return nil, errorcode.PublicQueryProjectError.Detail(err.Error())
	} else {
		req.CurrentProjectName = projectInfo.Name
	}
	//检查当前项目只能有一个申请
	count, err := u.repo.GetApplyingCountByProject(ctx, projectID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if count > 0 {
		return nil, errorcode.SandboxProjectOnlyHasOneApplyError.Err()
	}
	//检查当前用户能不能给当前项目申请空间
	members, err := u.memberRepo.QueryProjectMembers(ctx, projectID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	memberDict := lo.SliceToMap(members, func(item *model.TcMember) (string, *model.TcMember) {
		return item.UserID, item
	})
	//必须是项目成员才可以
	if _, ok := memberDict[req.ApplicantID]; !ok {
		return nil, errorcode.SandboxOnlyProjectMemberCanApplyError.Err()
	}
	return req, nil
}

func (u *useCase) GetProjectMemberInfo(ctx context.Context, projectID string) ([]*domain.ProjectMember, error) {
	//补充项目数据，部门数据
	members, err := u.memberRepo.QueryProjectMembers(ctx, projectID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	userIDSlice := lo.Uniq(lo.Times(len(members), func(index int) string {
		return members[index].UserID
	}))
	pms := make([]*domain.ProjectMember, 0)
	if len(userIDSlice) <= 0 {
		return pms, nil
	}
	userInfoSlice, err := u.ccDriven.GetUsers(ctx, userIDSlice)
	if err != nil {
		return nil, errorcode.PublicQueryProjectError.Detail(err.Error())
	}
	userInfoDict := lo.SliceToMap(userInfoSlice, func(item *configuration_center.User) (string, *configuration_center.User) {
		return item.ID, item
	})

	for _, userID := range userIDSlice {
		userInfo, ok := userInfoDict[userID]
		if ok {
			pms = append(pms, &domain.ProjectMember{
				ID:   userID,
				Name: userInfo.Name,
			})
		}
	}
	return pms, nil
}
func (u *useCase) GetUserInfoDict(ctx context.Context, userID []string) (map[string]*configuration_center.UserRespItem, error) {
	pageResult, err := u.ccDriven.GetUserInfoSlice(ctx, userID...)
	if err != nil {
		return make(map[string]*configuration_center.UserRespItem), errorcode.PublicQueryUserInfoError.Detail(err.Error())
	}
	return lo.SliceToMap(pageResult.Entries, func(item *configuration_center.UserRespItem) (string, *configuration_center.UserRespItem) {
		return item.ID, item
	}), nil
}

func (u *useCase) AddDepartmentIDSlice(ctx context.Context, req *domain.SandboxApplyListArg) {
	if req.DepartmentID == "" {
		return
	}
	req.ChildDepartmentIDSlice = []string{
		req.DepartmentID,
	}
	departmentSlice, err := u.ccDriven.GetChildDepartments(ctx, req.DepartmentID)
	if err != nil {
		log.Errorf("query list department path info error, %v", err)
		return
	}
	for i := range departmentSlice.Entries {
		node := departmentSlice.Entries[i]
		ids := strings.Split(node.PathID, "/")
		req.ChildDepartmentIDSlice = append(req.ChildDepartmentIDSlice, ids...)
	}
	req.ChildDepartmentIDSlice = lo.Uniq(req.ChildDepartmentIDSlice)
}
