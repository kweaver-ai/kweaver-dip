package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service/validation"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Update implements sub_service.SubServiceUseCase.
func (s *subServiceUseCase) Update(ctx context.Context, subService *sub_service.SubService) (*sub_service.SubService, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	if err := s.subServiceRepo.IsRepeat(ctx, subService.Model()); err != nil {
		return nil, err
	}

	////检查当前用户是否有权限删除子视图
	//if err := s.checkPermission(ctx, subService.ID.String(), authServiceV1.ObjectSubService, AllocateAction, AuthAction); err != nil {
	//	return nil, err
	//}

	// 获取已存在的 SubService
	mOld, err := s.subServiceRepo.Get(ctx, subService.ID)
	if err != nil {
		return nil, err
	}
	svOld := sub_service.GenSubServiceByModel(mOld)

	// 参数校验
	if allErrs := validation.ValidateSubServiceUpdate(svOld, subService); allErrs != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.CreateValidErrorsFromFieldErrorList(allErrs))
	}

	//生成过滤逻辑
	subServiceModel := subService.Model()
	subServiceModel.RowFilterClause = genWhereClause(subService)
	// 在 Repository 中更新子视图
	mNew, err := s.subServiceRepo.Update(ctx, subServiceModel)
	if err != nil {
		return nil, err
	}

	return sub_service.GenSubServiceByModel(mNew), nil
}
