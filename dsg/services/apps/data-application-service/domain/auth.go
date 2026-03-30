package domain

import (
	"context"
	"sort"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/samber/lo"
)

// authedServiceID 查询用户被授权的接口服务
func (u *ServiceDomain) authedServiceID(ctx context.Context, req *dto.ServiceListReq) (err error) {
	// 访问者可以对逻辑视图执行的动作，包括已经过期的权限。Key 是逻辑视图的
	// ID，Value 是可以执行的动作的集合。
	//  1. 访问者可以对逻辑视图整表的动作
	//  2. 访问者对逻辑视图至少一个子视图（行列规则）执行的动作
	var serviceActions = make(map[string]sets.Set[string])
	// 访问者对逻辑视图及其子视图的权限是否过期
	var serviceIsExpired = make(map[string]bool)
	// 访问者对逻辑视图及其子视图（行列规则）的权限规则，根据逻辑视图、子视图
	// （行列规则）所属逻辑视图分组
	var objectsGroupedBySubService = make(map[string][]auth_service_v1.ObjectWithPermissions)

	// 获取访问者对逻辑视图、子视图（行列规则）的权限规则列表。列表包括已经
	// 过期的权限规则。
	res, err := u.drivenAuthService.ListSubjectObjects(ctx, &auth_service_v1.SubjectObjectsListOptions{
		ObjectTypes: []auth_service_v1.ObjectType{auth_service_v1.ObjectSubService, auth_service_v1.ObjectAPI},
		SubjectID:   req.OwnerId,
		SubjectType: auth_service_v1.SubjectUser,
	})
	if err != nil {
		return err
	}
	// 根据所属逻辑视图分组，非逻辑视图、子视图（行列规则）或获取子视图（行
	// 列规则）所属逻辑视图失败，所属逻辑视图 ID 视为 ""
	objectsGroupedBySubService = lo.GroupBy(res.Entries, func(item auth_service_v1.ObjectWithPermissions) string {
		switch item.Object.Type {
		// 接口服务，返回 ID
		case auth_service_v1.ObjectAPI:
			return item.ID
		// 子接口，返回所属逻辑视图的 ID
		case auth_service_v1.ObjectSubService:
			// 获取子视图（行列规则）所属逻辑视图的 ID
			subService, err := u.serviceRepo.GetSubService(ctx, item.Object.ID)
			if err != nil {
				return ""
			}
			return subService.ServiceID.String()
		default:
			return ""
		}
	})

	totalObjectIDSlice := make([]string, 0)
	for serviceID, objects := range objectsGroupedBySubService {
		// 忽略逻辑视图 ID 为空
		if serviceID == "" {
			continue
		}
		for _, o := range objects {
			// 忽略非逻辑视图或子视图（行列规则）
			if o.Object.Type != auth_service_v1.ObjectAPI && o.Object.Type != auth_service_v1.ObjectSubService {
				continue
			}
			totalObjectIDSlice = append(totalObjectIDSlice, o.Object.ID)
		}
	}
	ownedIDSlice, err := u.serviceRepo.GetByOwnerID(ctx, req.OwnerId)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	totalObjectIDSlice = append(totalObjectIDSlice, ownedIDSlice...)
	//查询是否过期
	expiredDict := make(map[string]bool)
	if len(totalObjectIDSlice) > 0 {
		expiredViewSlice, err := u.drivenAuthServiceInternal.FilterPolicyHasExpiredObjects(ctx, totalObjectIDSlice...)
		if err != nil {
			return err
		}
		expiredDict = lo.SliceToMap(expiredViewSlice, func(item string) (string, bool) {
			return item, true
		})
	}

	expiredServiceDict := make(map[string]bool)
	for _, id := range ownedIDSlice {
		expiredServiceDict[id] = expiredDict[id]
	}

	for serviceID, objects := range objectsGroupedBySubService {
		// 忽略逻辑视图 ID 为空
		if serviceID == "" {
			continue
		}
		for _, o := range objects {
			// 忽略非逻辑视图或子视图（行列规则）
			if o.Object.Type != auth_service_v1.ObjectAPI && o.Object.Type != auth_service_v1.ObjectSubService {
				continue
			}
			if expiredDict[serviceID] {
				expiredServiceDict[serviceID] = true
			}
			if expiredDict[o.Object.ID] {
				expiredServiceDict[serviceID] = true
			}
			for _, p := range o.Permissions {
				// 忽略非“允许”的规则
				if p.Effect != auth_service_v1.PolicyAllow {
					continue
				}
				if serviceActions[serviceID] == nil {
					serviceActions[serviceID] = make(sets.Set[string])
				}
				serviceActions[serviceID].Insert(string(p.Action))
			}
			// 存在过期时间，且早于当前时间，视为已过期
			serviceIsExpired[serviceID] = serviceIsExpired[serviceID] || (o.ExpiredAt != nil && u.clock.Now().After(o.ExpiredAt.Time))
		}
	}

	// 页面显示的逻辑视图 ID 列表。用户拥有这些逻辑视图或其至少一个子视图
	// （行列规则）的 download 或 read 权限。
	allowActions := []string{auth_service_v1.ActionDownload.Str(), auth_service_v1.ActionRead.Str(), auth_service_v1.ActionAuth.Str(), auth_service_v1.ActionAllocate.Str()}
	if req.OwnerId != "" {
		allowActions = []string{auth_service_v1.ActionAuth.Str(), auth_service_v1.ActionAllocate.Str()}
	}
	req.ServiceIDSlice = lo.Filter(lo.Keys(serviceActions), func(id string, _ int) bool {
		return serviceActions[id].HasAny(allowActions...)
	})
	if req.OwnerId != "" {
		req.ServiceIDSlice = append(req.ServiceIDSlice, ownedIDSlice...)
	}

	// 根据权限规则的过期时间过滤
	if req.PolicyStatus != "" {
		req.ServiceIDSlice = lo.Filter(req.ServiceIDSlice, func(id string, _ int) bool {
			switch req.PolicyStatus {
			case dto.PolicyActive:
				return !expiredServiceDict[id]
			case dto.PolicyExpired:
				return expiredServiceDict[id]
			default:
				return false
			}
		})
	}
	// 为了分页查询结果稳定，对 req.ViewIds 排序
	sort.Strings(req.ServiceIDSlice)
	return nil
}
