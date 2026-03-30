package impl

import (
	"context"

	"github.com/samber/lo"

	gorm "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util/slices"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
)

// listSortByIsAuthorized 获取列表并根据是否被授权排序
func (s *subViewUseCase) listSortByIsAuthorized(ctx context.Context, opts domain.ListOptions) (*domain.List[domain.SubView], error) {
	// TODO: 先获取对哪些子视图有权限，再从数据库里获取
	m, c, err := s.subViewRepo.List(ctx, gorm.ListOptions{LogicViewID: opts.LogicViewID})
	if err != nil {
		return nil, err
	}

	subViews := make([]domain.SubView, len(m))
	for i := range m {
		domain.UpdateSubViewByModel(&subViews[i], &m[i])
	}

	// 根据当前用户是否被授权排序
	if err := s.sortSubViewsByIsAuthorized(ctx, subViews, opts.Direction); err != nil {
		return nil, err
	}
	// 分页边界 subViews[h:t]
	var (
		h = min(len(subViews), (opts.Offset-1)*opts.Limit)
		t = min(len(subViews), h+opts.Limit)
	)

	return &domain.List[domain.SubView]{
		Entries:    subViews[h:t],
		TotalCount: c,
	}, nil
}

func (s *subViewUseCase) sortSubViewsByIsAuthorized(ctx context.Context, subViews []sub_view.SubView, direction sub_view.Direction) error {
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return err
	}

	// 当前用户可以对子视图（行列规则）执行下列任意动作，即认为被授权
	actions := []string{
		auth_service.Action_Read,
		auth_service.Action_Download,
	}

	// 策略验证的请求
	var requests []auth_service.EnforceRequest
	for _, sv := range subViews {
		for _, a := range actions {
			requests = append(requests, auth_service.EnforceRequest{SubjectType: auth_service.SubjectTypeUser, SubjectID: u.ID, ObjectType: auth_service.ObjectTypeSubView, ObjectID: sv.ID.String(), Action: a})
		}
	}

	// 验证当前用户是否可以对资源执行指定动作
	responses, err := s.drivenAuthService.Enforce(ctx, requests)
	if err != nil {
		return err
	}
	results := lo.Times(len(requests), func(i int) auth_service.EnforceResponse {
		return auth_service.EnforceResponse{
			EnforceRequest: requests[i],
			Result:         responses[i],
		}
	})

	// 根据当前用户是否被授权排序
	slices.SortFunc(subViews, orderByIsAuthorized(newAuthorizedSubViewsForEnforceResponses(results, u.ID, actions)))
	if direction == sub_view.DirectionDescend {
		slices.Reverse(subViews)
	}

	return nil
}

func newAuthorizedSubViewsForEnforceResponses(responses []auth_service.EnforceResponse, userID string, actions []string) (authorizedSubViews map[string]bool) {
	for _, r := range responses {
		// 忽略操作者类型不是用户
		if r.SubjectType != auth_service.SubjectTypeUser {
			continue
		}
		// 忽略操作者 ID 不是当前用户的 ID
		if r.SubjectID != userID {
			continue
		}
		// 忽略资源类型不是子视图（行列规则）
		if r.ObjectType != auth_service.ObjectTypeSubView {
			continue
		}
		// 忽略未指定的 action
		if !slices.Contains(actions, r.Action) {
			continue
		}
		// 忽略未被允许
		if !r.Result {
			continue
		}

		if authorizedSubViews == nil {
			authorizedSubViews = make(map[string]bool)
		}
		authorizedSubViews[r.ObjectID] = true
	}
	return
}

func orderByIsAuthorized(authorizedSubViews map[string]bool) func(a, b sub_view.SubView) int {
	return func(a, b sub_view.SubView) int {
		var aa, ba int
		if authorizedSubViews[a.ID.String()] {
			aa = 1
		}
		if authorizedSubViews[b.ID.String()] {
			ba = 1
		}
		return aa - ba
	}
}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
