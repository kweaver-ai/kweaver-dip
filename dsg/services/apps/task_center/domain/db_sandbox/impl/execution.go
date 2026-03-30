package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/db_sandbox"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

// Executing 实施
func (u *useCase) Executing(ctx context.Context, req *domain.ExecuteReq) (*response.IDResp, error) {
	//获取申请详情
	sandBoxApply, err := u.repo.GetSandboxApply(ctx, req.ApplyID)
	if err != nil {
		return nil, err
	}
	if sandBoxApply.Status == constant.SandboxStatusExecuting.Integer.Int32() {
		return nil, errorcode.SandboxIsExecutingError.Err()
	}
	if sandBoxApply.Status != constant.SandboxStatusWaiting.Integer.Int32() {
		return nil, errorcode.SandboxOnlyWaitingError.Err()
	}
	//补充数据
	userInfo, _ := user_util.ObtainUserInfo(ctx)
	req.ExecutorID = userInfo.ID
	req.ExecutorName = userInfo.Name
	req.SandboxID = sandBoxApply.SandboxID
	dbObj := req.NewExecution()
	//插入数据库
	if err = u.repo.Executing(ctx, dbObj); err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return response.ID(dbObj.ID), nil
}

func (u *useCase) Executed(ctx context.Context, req *domain.ExecutedReq) (*response.IDResp, error) {
	//获取实施详情
	sandBoxExecution, err := u.repo.GetExecution(ctx, req.ExecutionID)
	if err != nil {
		return nil, err
	}
	//已经实施完成的不能实施
	if sandBoxExecution.ExecuteStatus == constant.SandboxStatusCompleted.Integer.Int32() {
		return nil, errorcode.SandboxIsExecutedError.Err()
	}
	if sandBoxExecution.ExecuteStatus != constant.SandboxStatusExecuting.Integer.Int32() {
		return nil, errorcode.SandboxOnlyExecutingError.Err()
	}
	//补充数据
	userInfo, _ := user_util.ObtainUserInfo(ctx)
	sandBoxExecution.Description = req.Desc
	sandBoxExecution.ExecuteStatus = constant.SandboxStatusCompleted.Integer.Int32()
	currentTime := time.Now()
	sandBoxExecution.ExecutedTime = &currentTime
	sandBoxExecution.UpdaterUID = userInfo.ID
	//插入数据库
	if err = u.repo.Executed(ctx, sandBoxExecution); err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return response.ID(sandBoxExecution.ID), nil
}

func (u *useCase) ExecutionList(ctx context.Context, req *domain.SandboxExecutionListArg) (*response.PageResultNew[domain.SandboxExecutionListItem], error) {
	//1. 补充下数据
	accessor, err := u.fixAccessor(ctx)
	if err != nil {
		return nil, err
	}
	req.SandboxAccessor = *accessor
	//2. 查询
	ds, total, err := u.repo.ListExecution(ctx, req)
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
		ds[i].EnumExchange()
	}
	//3. 返回结果
	return &response.PageResultNew[domain.SandboxExecutionListItem]{
		Entries:    ds,
		TotalCount: total,
	}, nil
}

func (u *useCase) ExecutionDetail(ctx context.Context, req *request.IDReq) (*domain.SandboxExecutionDetail, error) {
	//检查下是否存在
	if _, err := u.repo.GetExecution(ctx, req.ID); err != nil {
		return nil, err
	}
	detail, err := u.repo.GetExecutionDetail(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	detail.EnumExchange()
	//更新用户信息
	applicantInfo, err := u.ccDriven.GetUserInfo(ctx, detail.ApplicantID)
	if err != nil {
		log.Warnf("GetUserInfo error %v", err.Error())
	} else if applicantInfo != nil {
		detail.ApplicantName = applicantInfo.Name
		detail.ApplicantPhone = applicantInfo.PhoneNumber
	}
	return detail, nil
}

func (u *useCase) ExecutionLog(ctx context.Context, req *request.IDReq) (data []*domain.SandboxExecutionLogListItem, err error) {
	data, err = u.repo.GetApplyLogList(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return data, nil
}
