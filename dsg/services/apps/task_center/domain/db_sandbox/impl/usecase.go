package impl

import (
	"context"

	repo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/db_sandbox"
	tcMember "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_member"
	tcProject "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_project"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_catalog"
	wf_rest "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

type useCase struct {
	operation     *OperationMachine
	repo          repo.Repo
	ccDriven      configuration_center.Driven
	wf            wf_go.WorkflowInterface
	wfDriven      wf_rest.WorkflowDriven
	projectRepo   tcProject.Repo
	memberRepo    tcMember.Repo
	catalogDriven data_catalog.Driven
}

func NewUseCase(
	repo repo.Repo,
	ccDriven configuration_center.Driven,
	wf wf_go.WorkflowInterface,
	wfDriven wf_rest.WorkflowDriven,
	projectRepo tcProject.Repo,
	memberRepo tcMember.Repo,
	catalogDriven data_catalog.Driven,
) domain.UseCase {
	uc := &useCase{
		repo:          repo,
		ccDriven:      ccDriven,
		wf:            wf,
		wfDriven:      wfDriven,
		projectRepo:   projectRepo,
		memberRepo:    memberRepo,
		catalogDriven: catalogDriven,
	}
	uc.RegisterWorkflowHandler()
	//初始操作管理器
	uc.operation = uc.NewOperationMachine()
	return uc
}

func (u *useCase) SandboxSpaceList(ctx context.Context, req *domain.SandboxSpaceListReq) (*response.PageResultNew[domain.SandboxSpaceListItem], error) {
	//确定查询人信息
	accessor, err := u.fixAccessor(ctx)
	if err != nil {
		return nil, err
	}
	req.SandboxAccessor = *accessor
	//列表查询
	spaceList, total, err := u.repo.SpaceList(ctx, req)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Err()
	}

	applicantIDSlice := lo.Uniq(lo.Times(len(spaceList), func(index int) string {
		return spaceList[index].ApplicantID
	}))
	userInfoMap, err := u.GetUserInfoDict(ctx, applicantIDSlice)
	if err != nil {
		log.Warnf("GetUserInfoDict error %v", err.Error())
	}
	//查询数据集数量
	sandboxIDSlice := lo.Uniq(lo.Times(len(spaceList), func(index int) string {
		return spaceList[index].SandboxID
	}))
	dataPushCountDict, err := u.catalogDriven.SandboxPushCount(ctx, sandboxIDSlice)
	if err != nil {
		log.Errorf("SandboxPushCount error %v", err.Error())
		dataPushCountDict = make(map[string]int)
	}
	for i := range spaceList {
		userInfo, ok := userInfoMap[spaceList[i].ApplicantID]
		if ok {
			spaceList[i].ApplicantName = userInfo.Name
			spaceList[i].ApplicantPhone = userInfo.PhoneNumber
			spaceList[i].DataSetNumber = dataPushCountDict[spaceList[i].SandboxID]
		}
		spaceList[i].UpdatedAtStr = spaceList[i].UpdatedAtObj.Format(constant.CommonTimeFormat)
	}
	return &response.PageResultNew[domain.SandboxSpaceListItem]{
		Entries:    spaceList,
		TotalCount: total,
	}, nil
}

func (u *useCase) SandboxSpaceSimple(ctx context.Context, req *request.IDReq) (*model.DBSandbox, error) {
	detail, err := u.repo.GetSandboxSpace(ctx, req.ID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Err()
	}
	//更新申请人手机号
	applicantInfo, err := u.ccDriven.GetUserInfo(ctx, detail.ApplicantID)
	if err != nil {
		log.Warnf("GetUserInfo error %v", err.Error())
	} else if applicantInfo != nil {
		detail.ApplicantName = applicantInfo.Name
		detail.ApplicantPhone = applicantInfo.PhoneNumber
	}
	return detail, nil
}
