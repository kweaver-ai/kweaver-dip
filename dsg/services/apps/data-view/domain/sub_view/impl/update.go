package impl

import (
	"context"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"encoding/json"
	"github.com/samber/lo"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view/validation"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

// Update implements sub_view.SubViewUseCase.
func (s *subViewUseCase) Update(ctx context.Context, subView *sub_view.SubView, isInternal bool) (*sub_view.SubView, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()


	if err := s.subViewRepo.IsRepeat(ctx, subView.Model()); err != nil {
		return nil, err
	}

	if !isInternal{
		//检查当前用户是否有权限更新子视图，至少是分配权限
		if err := s.checkPermission(ctx, subView.ID.String(), authServiceV1.ObjectSubView, AuthAllocate, AuthAction); err != nil {
			return nil, err
		}
		//检查是否修改了不该修改的
		if err := s.canModify(ctx, subView); err != nil {
			return nil, err
		}
	}
	lv, err := s.logicViewRepo.Get(ctx, subView.LogicViewID.String())
	if err != nil {
		return nil, err
	}

	// 获取已存在的 SubView
	mOld, err := s.subViewRepo.Get(ctx, subView.ID)
	if err != nil {
		return nil, err
	}
	svOld := &sub_view.SubView{}
	sub_view.UpdateSubViewByModel(svOld, mOld)

	// 参数校验
	if allErrs := validation.ValidateSubViewUpdate(svOld, subView); allErrs != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, form_validator.CreateValidErrorsFromFieldErrorList(allErrs))
	}

	// 在 Repository 中更新子视图
	subView.AuthScopeID = svOld.AuthScopeID
	mNew, err := s.subViewRepo.Update(ctx, subView.Model())
	if err != nil {
		return nil, err
	}

	result := &sub_view.SubView{}
	sub_view.UpdateSubViewByModel(result, mNew)

	// 生产消息
	s.produceMessageSubViewModified(s.newObjectSubView(ctx, result, lv))

	return result, nil
}

// canModify 检擦是否能修改，简单检查，没有对比老的数据
func (s *subViewUseCase) canModify(ctx context.Context, subView *sub_view.SubView) error {
	permissions, err := s.subViewPermissions(ctx, subView.ID)
	if err != nil {
		return err
	}
	permissionStr := strings.Join(permissions, ",")
	//如果是授权权限，则可以修改
	if strings.Contains(permissionStr, string(authServiceV1.ActionAuth)) {
		return nil
	}
	//如果不是授权仅分配，那么就不允许了
	if !strings.Contains(permissionStr, string(authServiceV1.ActionAllocate)) {
		return nil
	}
	//请求详情
	reqData, err := subView.RuleDetail()
	if err != nil {
		return errorcode.PublicInternalError.Detail(err.Error())
	}
	//原来的
	existsSubViewInfo, err := s.subViewRepo.Get(ctx, subView.ID)
	if err != nil {
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	existsData := &sub_view.SubViewDetail{}
	if err = json.Unmarshal([]byte(existsSubViewInfo.Detail), &existsData); err != nil {
		return errorcode.PublicInternalError.Detail(err.Error())
	}
	//固定限定列数据
	reqData.ScopeFields = existsData.ScopeFields
	//比较下行规则
	existsRowRule := string(lo.T2(json.Marshal(existsData.FixedRowFilters)).A)
	newRowRule := string(lo.T2(json.Marshal(reqData.FixedRowFilters)).A)

	if existsRowRule != newRowRule {
		return errorcode.AllocatedCanOperatorSelfErr.Err()
	}
	return nil
}
