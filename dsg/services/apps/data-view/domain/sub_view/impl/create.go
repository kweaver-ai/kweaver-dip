package impl

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view/validation"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Create implements sub_view.SubViewUseCase.
func (s *subViewUseCase) Create(ctx context.Context, subView *sub_view.SubView, isInternal bool) (*sub_view.SubView, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	if err := s.subViewRepo.IsRepeat(ctx, subView.Model()); err != nil {
		return nil, err
	}

	if !isInternal {
		//检查当前用户是否有权限创建子视图
		if err := s.checkPermission(ctx, subView.AuthScopeID.String(), subView.ScopeType(), AuthAllocate, AuthAction); err != nil {
			return nil, err
		}
	}

	// 参数格式检查
	if allErrs := validation.ValidateSubViewCreate(subView); allErrs != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.CreateValidErrorsFromFieldErrorList(allErrs))
	}

	// 获取子视图所属的逻辑视图
	lv, err := s.logicViewRepo.Get(ctx, subView.LogicViewID.String())
	if err != nil {
		return nil, err
	}

	// 在 Repository 中记录子视图
	m, err := s.subViewRepo.Create(ctx, subView.Model())
	if err != nil {
		return nil, err
	}

	result := &sub_view.SubView{}
	sub_view.UpdateSubViewByModel(result, m)

	// 生产消息
	s.produceMessageSubViewAdded(s.newObjectSubView(ctx, result, lv))

	return result, nil
}
