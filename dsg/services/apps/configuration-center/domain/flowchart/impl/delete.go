package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
)

func (f *flowchartUseCase) Delete(ctx context.Context, fid string) (*response.NameIDResp, error) {
	fcModel, err := f.FlowchartExistCheckDie(ctx, fid)
	if err != nil {
		return nil, err
	}

	// 暂不加上编辑状态中不让删除，目前没法判断

	if constant.FlowchartEditStatus(fcModel.EditStatus) != constant.FlowchartEditStatusCreating {
		// TODO 检测任务中心是否在使用该运营流程，若使用，则不允许删除
	}

	err = f.repoFlowchart.Delete(ctx, fid)
	if err != nil {
		return nil, err
	}

	return &response.NameIDResp{
		ID:   fcModel.ID,
		Name: fcModel.Name,
	}, nil
}
