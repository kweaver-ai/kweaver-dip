package impl

import (
	"context"
	"slices"
	"sort"
	"strings"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
)

// List implements sub_service.SubServiceUseCase.
func (s *subServiceUseCase) List(ctx context.Context, opts sub_service.ListOptions) (*sub_service.List[sub_service.SubService], error) {
	// TODO: 重构，排序应该作为逻辑的一部分
	if opts.Sort == sub_service.SortByIsAuthorized {
		return s.listSortByIsAuthorized(ctx, opts)
	}

	listOpt := opts.RepositoryListOptions()

	////查询可授权的子视图ID
	//authedSubServiceIDSlice, err := s.listUserAuthedSubView(ctx, opts.ServiceID)
	//if err != nil {
	//	return nil, err
	//}
	//authedSubServiceIDDict := lo.SliceToMap(authedSubServiceIDSlice, func(item string) (string, int) {
	//	return item, 1
	//})

	m, c, err := s.subServiceRepo.List(ctx, listOpt)
	if err != nil {
		return nil, err
	}

	r := &sub_service.List[sub_service.SubService]{Entries: make([]sub_service.SubService, len(m)), TotalCount: c}
	for i := range m {
		r.Entries[i] = *sub_service.GenSubServiceByModel(&m[i])
		r.Entries[i].CanAuth = true
		//r.Entries[i].CanAuth = authedSubServiceIDDict[r.Entries[i].ID.String()] > 0
	}

	return r, err
}

// ListID implements sub_service.SubServiceUseCase.
func (s *subServiceUseCase) ListID(ctx context.Context, serviceID uuid.UUID) ([]uuid.UUID, error) {
	return s.subServiceRepo.ListID(ctx, serviceID)
}

// ListSubServices implements sub_service.SubServiceUseCase.
func (s *subServiceUseCase) ListSubServices(ctx context.Context, req *sub_service.ListSubServicesReq) (map[string][]string, error) {
	serviceID := strings.Split(req.ServiceID, ",")
	return s.subServiceRepo.ListSubServices(ctx, serviceID...)
}

// listUserAuthedSubView implements sub_view.SubViewRepo.
// 查询用户授权的行列规则ID列表
func (s *subServiceUseCase) listUserAuthedSubView(ctx context.Context, logicViewID uuid.UUID) ([]string, error) {
	allSubServices, err := s.subServiceRepo.ListID(ctx, logicViewID)
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	if len(allSubServices) <= 0 {
		return []string{}, nil
	}
	userInfo, _ := util.GetUserInfo(ctx)
	if userInfo == nil {
		return make([]string, 0), nil
	}
	opt := &auth_service_v1.PolicyListOptions{
		Subjects: []auth_service_v1.Subject{
			{
				ID:   userInfo.ID,
				Type: auth_service_v1.SubjectUser,
			},
		},
		Objects: lo.Times(len(allSubServices), func(index int) auth_service_v1.Object {
			return auth_service_v1.Object{
				ID:   allSubServices[index].String(),
				Type: auth_service_v1.ObjectSubService,
			}
		}),
	}
	policy, err := s.internalAuthService.ListPolicies(ctx, opt)
	if err != nil {
		return nil, err
	}
	policy = lo.Filter(policy, func(item auth_service_v1.Policy, index int) bool {
		return item.Action == auth_service_v1.ActionAuth || item.Action == auth_service_v1.ActionAllocate
	})
	//返回结果
	return lo.Uniq(lo.Times(len(policy), func(index int) string {
		return policy[index].Object.ID
	})), nil
}

// listSortByIsAuthorized 获取列表并根据是否被授权排序
func (s *subServiceUseCase) listSortByIsAuthorized(ctx context.Context, opts sub_service.ListOptions) (*sub_service.List[sub_service.SubService], error) {
	// TODO: 先获取对哪些子视图有权限，再从数据库里获取
	m, c, err := s.subServiceRepo.List(ctx, gorm.ListOptions{ServiceID: opts.ServiceID})
	if err != nil {
		return nil, err
	}

	subServices := make([]sub_service.SubService, len(m))
	for i := range m {
		subServices[i] = *sub_service.GenSubServiceByModel(&m[i])
	}

	// 根据当前用户是否被授权排序
	if err = s.sortSubServicesByIsAuthorized(ctx, subServices, opts.Direction); err != nil {
		return nil, err
	}
	// 分页边界 subServices[h:t]
	var (
		h = min(len(subServices), (opts.Offset-1)*opts.Limit)
		t = min(len(subServices), h+opts.Limit)
	)

	return &sub_service.List[sub_service.SubService]{
		Entries:    subServices[h:t],
		TotalCount: c,
	}, nil
}

func (s *subServiceUseCase) sortSubServicesByIsAuthorized(ctx context.Context, subServices []sub_service.SubService, direction sub_service.Direction) error {
	u, err := util.GetUserInfo(ctx)
	if err != nil {
		return err
	}

	// 当前用户可以对子视图（行列规则）执行下列任意动作，即认为被授权
	actions := []string{
		string(auth_service_v1.ActionRead),
		string(auth_service_v1.ActionDownload),
	}

	// 策略验证的请求
	var requests []auth_service_v1.EnforceRequest
	for _, sv := range subServices {
		for _, a := range actions {
			requests = append(requests, auth_service_v1.EnforceRequest{
				Subject: auth_service_v1.Subject{
					Type: auth_service_v1.SubjectUser,
					ID:   u.ID,
				},
				Object: auth_service_v1.Object{
					Type: auth_service_v1.ObjectSubService,
					ID:   sv.ID.String(),
				},
				Action: auth_service_v1.Action(a),
			})
		}
	}

	// 验证当前用户是否可以对资源执行指定动作
	responses, err := s.internalAuthService.Enforce(ctx, requests)
	if err != nil {
		return err
	}

	// 根据当前用户是否被授权排序
	results := lo.Times(len(responses), func(index int) auth_service_v1.EnforceResponse {
		return auth_service_v1.EnforceResponse{
			EnforceRequest: requests[index],
			Effect:         lo.If(responses[index], auth_service_v1.PolicyAllow).Else(auth_service_v1.PolicyDeny),
		}
	})
	subServiceDict := newAuthorizedSubServicesForEnforceResponses(results, u.ID, actions)
	sort.Slice(subServices, orderByIsAuthorized(subServiceDict, subServices, direction))
	return nil
}

func newAuthorizedSubServicesForEnforceResponses(responses []auth_service_v1.EnforceResponse, userID string, actions []string) (authorizedSubServices map[string]bool) {
	for _, r := range responses {
		// 忽略操作者类型不是用户
		if r.Subject.Type != auth_service_v1.SubjectUser {
			continue
		}
		// 忽略操作者 ID 不是当前用户的 ID
		if r.Subject.ID != userID {
			continue
		}
		// 忽略资源类型不是子视图（行列规则）
		if r.Object.Type != auth_service_v1.ObjectSubService {
			continue
		}
		// 忽略未指定的 action
		if !slices.Contains(actions, string(r.Action)) {
			continue
		}
		// 忽略未被允许
		if r.Effect != auth_service_v1.PolicyAllow {
			continue
		}

		if authorizedSubServices == nil {
			authorizedSubServices = make(map[string]bool)
		}
		authorizedSubServices[r.Object.ID] = true
	}
	return
}

func orderByIsAuthorized(authorizedSubServices map[string]bool, subServiceSlice []sub_service.SubService, direction sub_service.Direction) func(i, j int) bool {
	return func(i, j int) bool {
		var aa, ba int
		if authorizedSubServices[subServiceSlice[i].ID.String()] {
			aa = 1
		}
		if authorizedSubServices[subServiceSlice[j].ID.String()] {
			ba = 1
		}
		if direction == sub_service.DirectionDescend {
			return (aa - ba) > 0
		}
		return (aa - ba) < 0
	}
}

//func orderByIsAuthorized(authorizedSubServices map[string]bool) func(a, b sub_service.SubService) int {
//	return func(a, b sub_service.SubService) int {
//		var aa, ba int
//		if authorizedSubServices[a.ID.String()] {
//			aa = 1
//		}
//		if authorizedSubServices[b.ID.String()] {
//			ba = 1
//		}
//		return aa - ba
//	}
//}

func min(a, b int) int {
	if a < b {
		return a
	}
	return b
}
