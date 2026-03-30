package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (f *flowchartUseCase) Edit(ctx context.Context, body *domain.EditReqParamBody, fId string, uid string) (*response.NameIDResp, error) {
	fc, err := f.FlowchartExistCheckDie(ctx, fId)
	if err != nil {
		return nil, err
	}

	exist, err := f.repoFlowchart.ExistByName(ctx, *body.Name, fId)
	if err != nil {
		return nil, err
	}

	if exist {
		err = errorcode.Desc(errorcode.FlowchartNameAlreadyExist)
		log.WithContext(ctx).Error("flowchart name already exist", zap.String("name", *body.Name), zap.Error(err))
		return nil, err
	}

	fc.Name = *body.Name
	fc.Description = util.PtrToValue(body.Description)
	fc.UpdatedByUID = uid
	err = f.repoFlowchart.UpdateNameAndDesc(ctx, fc)
	if err != nil {
		return nil, err
	}

	return &response.NameIDResp{
		ID:   fId,
		Name: *body.Name,
	}, nil
}
