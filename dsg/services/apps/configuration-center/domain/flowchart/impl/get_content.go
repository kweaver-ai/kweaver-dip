package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (f *flowchartUseCase) GetContent(ctx context.Context, req *domain.GetContentReqParamQuery, fId string) (*domain.GetContentRespParam, error) {
	fc, err := f.FlowchartExistCheckUnscopedDie(ctx, fId)
	if err != nil {
		return nil, err
	}

	var fcV *model.FlowchartVersion
	if req.VersionID != nil {
		fcV, err = f.getContentByVersion(ctx, *req.VersionID, fc)
	} else {
		// 获取最新内容的运营流程，不能是已删除的状态
		if fc.DeletedAt != 0 {
			// 已经被删除，报错
			log.WithContext(ctx).Errorf("flowchart not exist, flowchart id: %v", fId)
			return nil, errorcode.Desc(errorcode.FlowchartNotExist)
		}

		fcV, err = f.getContentByNewest(ctx, fc)
	}
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get flowchart content, fid: %v, vid: %v, err: %v", fId, req.VersionID, err)
		return nil, err
	}

	return &domain.GetContentRespParam{
		ID:      fc.ID,
		Content: fcV.DrawProperties,
	}, nil
}

func (f *flowchartUseCase) getContentByVersion(ctx context.Context, vId string, fc *model.Flowchart) (*model.FlowchartVersion, error) {
	fcV, err := f.FlowchartVersionExistAndMatchCheckUnscopedDie(ctx, fc.ID, vId)
	if err != nil {
		return nil, err
	}

	return fcV, nil
}

func (f *flowchartUseCase) getContentByNewest(ctx context.Context, fc *model.Flowchart) (*model.FlowchartVersion, error) {
	var fcVId string
	switch constant.FlowchartEditStatus(fc.EditStatus) {
	case constant.FlowchartEditStatusCreating:
		fcVId = fc.EditingVersionID

	case constant.FlowchartEditStatusEditing:
		fcVId = fc.EditingVersionID

	case constant.FlowchartEditStatusNormal:
		fcVId = fc.CurrentVersionID

	default:
		return nil, fmt.Errorf("unsupport flowchart status, status: %v", fc.EditingVersionID)
	}

	fcV, err := f.FlowchartVersionExistAndMatchCheckDie(ctx, fc.ID, fcVId)
	if err != nil {
		return nil, err
	}

	return fcV, nil
}
