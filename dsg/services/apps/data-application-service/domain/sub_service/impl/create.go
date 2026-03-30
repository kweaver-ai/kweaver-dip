package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service/validation"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Create implements sub_service.SubServiceUseCase.
// 创建子接口
func (s *subServiceUseCase) Create(ctx context.Context, subService *sub_service.SubService, isInternal bool) (*sub_service.SubService, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	if err := s.subServiceRepo.IsRepeat(ctx, subService.Model()); err != nil {
		return nil, err
	}

	// 参数格式检查
	if allErrs := validation.ValidateSubServiceCreate(subService); allErrs != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.CreateValidErrorsFromFieldErrorList(allErrs))
	}

	if !isInternal {
		////检查当前用户是否有权限创建子接口
		//err := s.checkPermission(ctx, subService.AuthScopeID.String(), subService.ScopeType(), AllocateAction, AuthAction)
		//if err != nil {
		//	return nil, err
		//}
	}

	//生成where语句
	subServiceModel := subService.Model()
	subServiceModel.RowFilterClause = genWhereClause(subService)
	// 在 Repository 中记录子视图
	m, err := s.subServiceRepo.Create(ctx, subServiceModel)
	if err != nil {
		return nil, err
	}
	return sub_service.GenSubServiceByModel(m), nil
}
