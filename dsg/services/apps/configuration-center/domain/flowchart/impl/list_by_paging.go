package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (f *flowchartUseCase) ListByPaging(ctx context.Context, req *domain.QueryPageReqParam) (*domain.QueryPageReapParam, error) {
	resp := &domain.QueryPageReapParam{}
	var err error
	// 获取已发布、未发布的运营流程数量

	resp.UnreleasedTotalCount, err = f.repoFlowchart.Count(ctx, constant.FlowchartReleaseStateToEditStatus[constant.FlowchartReleaseStateUnreleased]...)
	resp.ReleasedTotalCount, err = f.repoFlowchart.Count(ctx, constant.FlowchartReleaseStateToEditStatus[constant.FlowchartReleaseStateReleased]...)

	// 判断keyword是否有效，无效返回空
	if !util.CheckKeyword(&req.Keyword) {
		log.Warnf("keyword is invalid, keyword: %s", req.Keyword)
		resp.Entries = make([]*domain.SummaryInfo, 0)
		return resp, nil
	}
	/*
		includeStatus := make([]constant.FlowchartEditStatus, 0, 2)
		if req.ReleaseState == constant.FlowchartReleaseStateReleased && req.ChangeState != nil {
			includeStatus = append(includeStatus, constant.FlowchartReleaseChangedStatusToInt[*req.ChangeState])
		} else {
			includeStatus = append(includeStatus, constant.FlowchartReleaseStateToEditStatus[req.ReleaseState]...)
		}
	*/

	includeStatus := make([]int32, 0, 2)
	if req.ReleaseState == constant.FlowchartReleaseStateReleased && req.ChangeState != nil {
		includeStatus = append(includeStatus, constant.FlowchartReleaseChangedStatusToInt[*req.ChangeState].ToInt32())
	} else if req.ReleaseState == constant.FlowchartReleaseStateReleased {
		includeStatus = append(includeStatus, constant.FlowchartEditStatusNormal.ToInt32())
		includeStatus = append(includeStatus, constant.FlowchartEditStatusEditing.ToInt32())
	} else {
		includeStatus = append(includeStatus, constant.FlowchartEditStatusCreating.ToInt32())
	}

	pageInfo := &request.PageInfo{
		Offset:    *req.Offset,
		Limit:     *req.Limit,
		Direction: *req.Direction,
		Sort:      *req.Sort,
	}

	models, total, err := f.repoFlowchart.ListByPagingNew(ctx, pageInfo, req.Keyword, req.IsAll, includeStatus)
	if err != nil {
		return nil, err
	}

	getUsernameOp := common.NewGetUsernameOp(f.repoUser)
	fcVIds := make([]string, 0, len(models))
	for _, fcModel := range models {
		getUsernameOp.AddUserId(fcModel.CreatedByUID, fcModel.UpdatedByUID)

		// 新增中的运营流程获取其临时的缩略图，已经发布过版本的运营流程获取其已发布的运营流程缩略图
		if constant.FlowchartEditStatus(fcModel.EditStatus) == constant.FlowchartEditStatusCreating {
			fcVIds = append(fcVIds, fcModel.EditingVersionID)
		} else {
			fcVIds = append(fcVIds, fcModel.CurrentVersionID)
		}
	}

	fcVModels, err := f.repoFlowchartVersion.GetByIds(ctx, fcVIds...)
	if err != nil {
		return nil, err
	}

	fcIdToVMap := make(map[string]*model.FlowchartVersion)
	for _, fcVModel := range fcVModels {
		fcIdToVMap[fcVModel.FlowchartID] = fcVModel
	}

	err = getUsernameOp.GetUser(ctx)
	if err != nil {
		return nil, err
	}

	res := make([]*domain.SummaryInfo, 0, len(models))
	for _, fcModel := range models {
		createUserName := getUsernameOp.GetUsername(fcModel.CreatedByUID)
		updateUserName := getUsernameOp.GetUsername(fcModel.UpdatedByUID)

		fcVModel := fcIdToVMap[fcModel.ID]

		vid := fcModel.CurrentVersionID
		if len(vid) == 0 {
			vid = fcModel.EditingVersionID
		}

		res = append(res, (&domain.SummaryInfo{}).ToHttp(fcModel, vid, fcVModel.Image, createUserName, updateUserName, req.WithImage))
	}

	resp.Entries = res
	resp.TotalCount = total
	return resp, nil
}
