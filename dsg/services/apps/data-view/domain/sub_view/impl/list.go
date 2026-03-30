package impl

import (
	"context"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/samber/lo"
)

// List implements sub_view.SubViewUseCase.
func (s *subViewUseCase) List(ctx context.Context, opts sub_view.ListOptions) (*sub_view.List[sub_view.SubView], error) {
	// TODO: 重构，排序应该作为逻辑的一部分
	if opts.Sort == sub_view.SortByIsAuthorized {
		return s.listSortByIsAuthorized(ctx, opts)
	}

	listOpt := opts.RepositoryListOptions()

	//查询可授权的子视图ID
	authedSubViewIDSlice, err := s.listUserAuthedSubView(ctx, opts.LogicViewID)
	if err != nil {
		return nil, err
	}
	authedSubViewIDDict := lo.SliceToMap(authedSubViewIDSlice, func(item uuid.UUID) (string, int) {
		return item.String(), 1
	})

	m, c, err := s.subViewRepo.List(ctx, listOpt)
	if err != nil {
		return nil, err
	}

	r := &sub_view.List[sub_view.SubView]{Entries: make([]sub_view.SubView, len(m)), TotalCount: c}
	for i := range m {
		sub_view.UpdateSubViewByModel(&r.Entries[i], &m[i])
		r.Entries[i].CanAuth = authedSubViewIDDict[r.Entries[i].ID.String()] > 0
	}

	return r, err
}

// ListID implements sub_view.SubViewUseCase.
func (s *subViewUseCase) ListID(ctx context.Context, dataViewID uuid.UUID) ([]uuid.UUID, error) {
	return s.subViewRepo.ListID(ctx, dataViewID)
}

// listUserAuthedSubView implements sub_view.SubViewRepo.
// 查询用户授权的行列规则ID列表
func (s *subViewUseCase) listUserAuthedSubView(ctx context.Context, logicViewID uuid.UUID) ([]uuid.UUID, error) {
	allSubViews, err := s.subViewRepo.ListID(ctx, logicViewID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	if len(allSubViews) <= 0 {
		return make([]uuid.UUID, 0), nil
	}
	userInfo, _ := util.GetUserInfo(ctx)
	if userInfo == nil {
		return make([]uuid.UUID, 0), nil
	}
	opt := &authServiceV1.PolicyListOptions{
		Subjects: []authServiceV1.Subject{
			{
				ID:   userInfo.ID,
				Type: authServiceV1.SubjectUser,
			},
		},
		Objects: lo.Times(len(allSubViews), func(index int) authServiceV1.Object {
			return authServiceV1.Object{
				ID:   allSubViews[index].String(),
				Type: authServiceV1.ObjectSubView,
			}
		}),
	}
	policy, err := s.internalAuthService.ListPolicies(ctx, opt)
	if err != nil {
		return nil, err
	}
	policy = lo.Filter(policy, func(item authServiceV1.Policy, index int) bool {
		return item.Action == authServiceV1.ActionAuth || item.Action == authServiceV1.ActionAllocate
	})
	//返回结果
	return lo.Uniq(lo.Times(len(policy), func(index int) uuid.UUID {
		return uuid.MustParse(policy[index].Object.ID)
	})), nil
}

// subViewPermissions implements sub_view.SubViewRepo.
// 查询用户授权的行列规则ID列表
func (s *subViewUseCase) subViewPermissions(ctx context.Context, logicViewID uuid.UUID) ([]string, error) {
	allSubViews, err := s.subViewRepo.ListID(ctx, logicViewID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	userInfo := util.ObtainUserInfo(ctx)
	opt := &authServiceV1.PolicyListOptions{
		Subjects: []authServiceV1.Subject{
			{
				ID:   userInfo.ID,
				Type: authServiceV1.SubjectUser,
			},
		},
		Objects: lo.Times(len(allSubViews), func(index int) authServiceV1.Object {
			return authServiceV1.Object{
				ID:   allSubViews[index].String(),
				Type: authServiceV1.ObjectSubView,
			}
		}),
	}
	policy, err := s.internalAuthService.ListPolicies(ctx, opt)
	if err != nil {
		return nil, err
	}
	return lo.Times(len(policy), func(index int) string {
		return string(policy[index].Action)
	}), nil
}

// ListSubViews implements sub_view.SubViewUseCase.
func (s *subViewUseCase) ListSubViews(ctx context.Context, dataViewID ...string) (map[string][]string, error) {
	return s.subViewRepo.ListSubViews(ctx, dataViewID...)
}
