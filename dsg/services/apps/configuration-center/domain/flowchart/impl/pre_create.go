package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (f *flowchartUseCase) PreCreate(ctx context.Context, req *domain.PreCreateReqParam, uid string) (*domain.PreCreateRespParam, error) {
	exist, err := f.repoFlowchart.ExistByName(ctx, *req.Name)
	if err != nil {
		return nil, err
	}

	if exist {
		err = errorcode.Desc(errorcode.FlowchartNameAlreadyExist)
		log.WithContext(ctx).Error("flowchart name already exist", zap.String("name", *req.Name), zap.Error(err))
		return nil, err
	}

	if req.ClonedById != nil && req.ClonedByTemplateId != nil {
		err = errorcode.Desc(errorcode.FlowchartOnlyClonedOne)
		log.WithContext(ctx).Error("create flowchart cloned_by_id And cloned_by_template_id is not nil")
		return nil, err
	}

	var fcVId string
	if req.ClonedById != nil {
		// 运营流程是否存在
		fc, err := f.FlowchartExistCheckDie(ctx, *req.ClonedById, constant.FlowchartEditStatusNormal, constant.FlowchartEditStatusEditing)
		if err != nil {
			return nil, err
		}

		fcVId = fc.CurrentVersionID
	}

	if req.ClonedByTemplateId != nil {
		// TODO 检测模版是否存在
		// TODO implement me
		fcVId = ""
	}

	var fcV *model.FlowchartVersion
	if len(fcVId) > 0 {
		fcV, err = f.FlowchartVersionExistCheckDie(ctx, fcVId)
		if err != nil {
			return nil, err
		}

		if constant.FlowchartEditStatus(fcV.EditStatus) != constant.FlowchartEditStatusNormal {
			err = errorcode.Detail(errorcode.PublicInternalError, fmt.Errorf("flowchart current version is not normal status"))
			log.WithContext(ctx).Error("flowchart current version is not normal status", zap.String("flowchart id", fcV.FlowchartID), zap.Any("flowchart version", fcV), zap.Error(err))
			return nil, err
		}
	}

	fc := req.ToModel(uid)
	err = f.repoFlowchart.Create(ctx, fc, fcV, uid)
	if err != nil {
		return nil, err
	}

	return &domain.PreCreateRespParam{
		ID:   fc.ID,
		Name: fc.Name,
	}, nil
}
