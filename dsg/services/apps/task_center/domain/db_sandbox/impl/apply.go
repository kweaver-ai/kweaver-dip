package impl

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

// Apply 申请空间
// 1. 同一个项目同时只能有一个空间，并且只能有一个申请
// 2. 用户是项目人员才可以申请
func (u *useCase) Apply(ctx context.Context, req *domain.SandboxApplyReq) (*response.IDResp, error) {
	//step1, 能否申请检查
	applicant, err := u.canOperate(ctx, req.ProjectID)
	if err != nil {
		return nil, err
	}
	req.Applicant = *applicant
	req.SandboxProjectName = req.CurrentProjectName
	req.SandboxDepartmentName = req.CurrentDepartmentName
	//沙箱申请
	req.ApplyObj = req.NewSandboxApply()
	//沙箱空间
	req.SandboxObj = req.NewSandboxSpace()
	//提交审核
	detail := req.DBSandboxTotalDetail
	if err := u.operation.RunWithWorkflow(ctx, &detail); err != nil {
		return nil, err
	}
	//保存, 同时创建申请和空间
	if err := u.repo.CreateApplyWithSpace(ctx, req.ApplyObj, req.SandboxObj); err != nil {
		log.WithContext(ctx).Errorf("create sandbox apply err: %v", err.Error())
		return nil, err
	}
	//返回的是沙箱申请的ID
	return response.ID(req.ApplyObj.ID), nil
}

func (u *useCase) Extend(ctx context.Context, req *domain.SandboxExtendReq) (*response.IDResp, error) {
	//扩容，必须检查下的sandbox信息
	sandboxSpaceInfo, err := u.repo.GetSandboxSpace(ctx, req.SandboxID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	req.ProjectID = sandboxSpaceInfo.ProjectID
	//原来的空间必须是可用的才可以扩容
	if sandboxSpaceInfo.Status == constant.SandboxSpaceStatusDisable.Integer.Int32() {
		return nil, errorcode.SandboxInvalidSpaceError.Err()
	}
	//检查当前项目只能有一个扩容
	count, err := u.repo.GetApplyingCountByProject(ctx, sandboxSpaceInfo.ProjectID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if count > 0 {
		return nil, errorcode.SandboxProjectOnlyHasOneApplyError.Err()
	}
	//检查允不允许申请人扩容
	applicant, err := u.canOperate(ctx, req.ProjectID)
	if err != nil {
		return nil, err
	}
	req.Applicant = *applicant
	req.SandboxDepartmentName = req.CurrentDepartmentName
	req.SandboxProjectName = req.CurrentProjectName
	//新建沙箱申请
	req.ApplyObj = req.NewSandboxExtend()
	req.SandboxObj = sandboxSpaceInfo

	//提交审核
	detail := req.DBSandboxTotalDetail
	if err = u.operation.RunWithWorkflow(ctx, &detail); err != nil {
		return nil, err
	}
	//保存
	if err = u.repo.CreateExtend(ctx, req.ApplyObj); err != nil {
		log.WithContext(ctx).Errorf("create sandbox apply err: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//返回的是沙箱申请的ID
	return response.ID(req.ApplyObj.ID), nil
}

// ApplyList  申请列表
// 1. 运营人员查看所有的单子
// 2. 本人可以查看自己的单子
func (u *useCase) ApplyList(ctx context.Context, req *domain.SandboxApplyListArg) (*response.PageResultNew[domain.SandboxApplyListItem], error) {
	//1. 补充下数据
	accessor, err := u.fixAccessor(ctx)
	if err != nil {
		return nil, err
	}
	req.SandboxAccessor = *accessor
	//2. 查询
	u.AddDepartmentIDSlice(ctx, req)
	ds, total, err := u.repo.ListApply(ctx, req)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	applicantIDSlice := lo.Uniq(lo.Times(len(ds), func(index int) string {
		return ds[index].ApplicantID
	}))
	userInfoMap, err := u.GetUserInfoDict(ctx, applicantIDSlice)
	if err != nil {
		log.Warnf("GetUserInfoDict error %v", err.Error())
	}
	for i := range ds {
		userInfo, ok := userInfoMap[ds[i].ApplicantID]
		if ok {
			ds[i].ApplicantName = userInfo.Name
			ds[i].ApplicantPhone = userInfo.PhoneNumber
		}
		projectID := ds[i].ProjectID
		projectMemberInfoSlice, err1 := u.GetProjectMemberInfo(ctx, projectID)
		if err1 != nil {
			log.Warnf("query project member info err: %v", err1.Error())
		}
		ds[i].ProjectMemberID = lo.Times(len(projectMemberInfoSlice), func(index int) string {
			return projectMemberInfoSlice[index].ID
		})
		ds[i].ProjectMemberName = lo.Times(len(projectMemberInfoSlice), func(index int) string {
			return projectMemberInfoSlice[index].Name
		})
		ds[i].EnumExchange()
		//申请通过之前，申请中的容量都是0
		if ds[i].SandboxStatusInt <= constant.SandboxStatusApplying.Integer.Int32() {
			ds[i].InApplySpace = 0
		}
	}
	//3. 整理结果
	return &response.PageResultNew[domain.SandboxApplyListItem]{
		Entries:    ds,
		TotalCount: total,
	}, nil
}

func (u *useCase) SandboxDetail(ctx context.Context, req *request.IDReq) (*domain.SandboxSpaceDetail, error) {
	detail, err := u.repo.GetSandboxDetail(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//更新申请人手机号
	applicantInfo, err := u.ccDriven.GetUserInfo(ctx, detail.ApplicantID)
	if err != nil {
		log.Warnf("GetUserInfo error %v", err.Error())
	} else if applicantInfo != nil {
		detail.ApplicantName = applicantInfo.Name
		detail.ApplicantPhone = applicantInfo.PhoneNumber
	}
	projectInfo, err := u.projectRepo.Get(ctx, detail.ProjectID)
	if err != nil {
		log.Warnf("query project info error %v", err.Error())
		projectInfo = nil
	}

	//查询项目成员
	members, err := u.memberRepo.QueryProjectMembers(ctx, detail.ProjectID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	memberDict := lo.SliceToMap(members, func(item *model.TcMember) (string, *model.TcMember) {
		return item.UserID, item
	})
	userIDSlice := lo.Uniq(lo.Times(len(members), func(index int) string {
		return members[index].UserID
	}))
	userIDSlice = append(userIDSlice, detail.ProjectOwnerID)
	userIDSlice = lo.Uniq(userIDSlice)
	//查询用户部门
	for _, userID := range userIDSlice {
		userInfo, err := u.ccDriven.GetUserInfo(ctx, userID)
		if err != nil {
			log.Errorf("query user detail info error %v", err.Error())
			continue
		}
		pm := &domain.ProjectMember{
			ID:             userInfo.ID,
			Name:           userInfo.Name,
			IsProjectOwner: userInfo.ID == detail.ProjectOwnerID && detail.ProjectOwnerID != "",
		}
		if len(userInfo.ParentDeps) <= 0 {
			detail.ProjectMembers = append(detail.ProjectMembers, pm)
			continue
		}
		chosenDepartment := userInfo.ParentDeps[0]
		directDepartment := chosenDepartment[len(chosenDepartment)-1]
		pm.DepartmentName = directDepartment.Name
		pm.DepartmentID = directDepartment.ID
		pm.DepartmentIDPath = strings.Join(lo.Times(len(chosenDepartment), func(index int) string {
			return chosenDepartment[index].ID
		}), "/")
		pm.DepartmentNamePath = strings.Join(lo.Times(len(chosenDepartment), func(index int) string {
			return chosenDepartment[index].Name
		}), "/")
		if memberInfo, ok := memberDict[userInfo.ID]; ok {
			pm.JoinTime = memberInfo.CreatedAt.Format(constant.CommonTimeFormat)
		}
		//负责人加入时间就是项目的创建时间
		if pm.ID == detail.ProjectOwnerID && projectInfo != nil {
			pm.JoinTime = projectInfo.CreatedAt.Format(constant.CommonTimeFormat)
		}
		detail.ProjectMembers = append(detail.ProjectMembers, pm)
	}
	//补充项目所有的申请记录
	detail.ApplyRecords, err = u.repo.GetSandboxApplyRecords(ctx, detail.SandboxID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	detail.EnumExchange()
	return detail, nil
}
