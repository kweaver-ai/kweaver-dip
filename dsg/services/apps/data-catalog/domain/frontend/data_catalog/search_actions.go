package data_catalog

import (
	"bytes"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	frontend_common "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/frontend/common"
	auth_service_v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
)

type errorSlice []error

func (s errorSlice) Error() string {
	var buf bytes.Buffer
	for _, e := range s {
		fmt.Fprintln(&buf, e.Error())
	}
	return buf.String()
}

var _ error = &errorSlice{}

// updateDataCatalogSearchRespActions 以当前用户作为访问者，更新搜索结果 dataCatalogSearchResp 的 Actions
//func (d *DataCatalogDomain) updateDataCatalogSearchRespActions(ctx context.Context, respSlice []DataCatalogSearchResp) error {
//	// 从 Context 获取用于鉴权的访问者
//	sub, err := interception.AuthServiceSubjectFromContext(ctx)
//	if err != nil {
//		log.Warn("get subject from context for enforcing authorization fail", zap.Error(err))
//		return nil
//	}
//
//	var errors errorSlice
//	// 搜索结果中的数据资源可能已被删除，向 auth-service 对已删除的资源鉴权会失
//	// 败，所以每个资源分别向 auth-service 鉴权
//	for i, resp := range respSlice {
//		// 构造鉴权请求
//		requests := requestsForSubjectAndSearchResultEntry(sub, &resp.SearchResultEntry)
//		// 向 auth-service 鉴权
//		responses, err := d.authServiceV1.Enforce(ctx, requests)
//		if err != nil {
//			errors = append(errors, fmt.Errorf("enforce data-resources/%v fail: %w", resp.ID, err))
//			continue
//		}
//		// 解析鉴权请求，更新 dataCatalogSearchResp.actions
//		respSlice[i].Actions = actionsForSubjectAndSearchResultEntry(responses, sub, &resp.SearchResultEntry)
//	}
//	return errors
//}

// objectForDataResourceTypeAndID 类型转换 (dataResourceType, id) -> auth_service_v1.Object
// func objectForDataResourceTypeAndID(dataResourceType int, id string) (obj *auth_service_v1.Object, err error) {
// 	t, err := objectTypeForDataResourceType(dataResourceType)
// 	if err != nil {
// 		return
// 	}
// 	obj = &auth_service_v1.Object{Time: t, ID: id}
// 	return
// }

// objectTypeForDataResourceType 返回指定 dataResourceType 对应的 auth_service_v1.ObjectType
func objectTypeForDataResourceType(dataResourceType common.DataResourceType) (t auth_service_v1.ObjectType) {
	switch dataResourceType {
	case common.DataResourceTypeDataView:
		return auth_service_v1.ObjectDataView
	case common.DataResourceTypeInterface:
		return auth_service_v1.ObjectAPI
	case common.DataResourceTypeFile:
		return auth_service_v1.ObjectType("file")
	default:
		return auth_service_v1.ObjectType("unknown")
	}
}

// actionsForObjectType 返回对于指定的资源类型，需要检查哪些动作有权限
func actionsForObjectType(t auth_service_v1.ObjectType) (actions []auth_service_v1.Action) {
	switch t {
	case auth_service_v1.ObjectAPI:
		actions = []auth_service_v1.Action{
			auth_service_v1.ActionRead,
		}
	case auth_service_v1.ObjectDataView:
		actions = []auth_service_v1.Action{
			auth_service_v1.ActionRead,
			auth_service_v1.ActionDownload,
		}
	default:
		// return nil for unsupported object type
	}
	return
}

// requestsForSubjectAndDataResourceAndID 返回访问者 sub 对数据资源（类型、ID）的鉴权请求列表
// func requestsForSubjectAndDataResourceAndID(sub *auth_service_v1.Subject, dataResourceType int, dataResourceID string) (requests []auth_service_v1.EnforceRequest) {
// 	obj, err := objectForDataResourceTypeAndID(dataResourceType, dataResourceID)
// 	if err != nil {
// 		log.Warn("unsupported data resource", zap.Int("dataResourceType", dataResourceType), zap.String("id", dataResourceID))
// 		return
// 	}
// 	return requestsForSubjectAndObject(sub, obj)
// }

// requestsForSubjectAndSearchResultEntry 返回访问者 sub 对（从 basic-search 搜索到的）数据资源目录的鉴权请求列表
//
// 只返回对数据资源目录的第一个数据资源，且资源类型是逻辑视图的鉴权请求列表。如果资源列表的第一个的类型不是逻辑视图则返回空。
func requestsForSubjectAndSearchResultEntry(sub *auth_service_v1.Subject, entry *frontend_common.SearchResultEntry) (requests []auth_service_v1.EnforceRequest) {
	if len(entry.MountDataResources) == 0 {
		return
	}
	resource := entry.MountDataResources[0]

	if resource.DataResourcesType != string(common.DataResourceTypeDataView) {
		return
	}
	objectType := objectTypeForDataResourceType(common.DataResourceType(resource.DataResourcesType))

	if len(resource.DataResourcesIdS) == 0 {
		return
	}

	for _, id := range resource.DataResourcesIdS {
		obj := auth_service_v1.Object{
			Type: objectType,
			ID:   id,
		}
		for _, act := range actionsForObjectType(objectType) {
			requests = append(requests, auth_service_v1.EnforceRequest{
				Subject: *sub,
				Object:  obj,
				Action:  act,
			})
		}

		// 只要第一个
		break
	}
	return
}

// requestsForSubjectAndDataResourceAndID 返回访问者 sub 对资源 obj 的鉴权请求列表
func requestsForSubjectAndObject(sub *auth_service_v1.Subject, obj *auth_service_v1.Object) (requests []auth_service_v1.EnforceRequest) {
	for _, act := range actionsForObjectType(obj.Type) {
		requests = append(requests, auth_service_v1.EnforceRequest{
			Subject: *sub,
			Object:  *obj,
			Action:  act,
		})
	}
	return
}

// actionsForResponsesAndSubjectAndObject 解析鉴权相应列表，返回 sub 可以对指定数据资源执行的动作列表
// func actionsForSubjectAndDataResourceAndID(responses []auth_service_v1.EnforceResponse, sub *auth_service_v1.Subject, dataResourceType int, dataResourceID string) (actions []auth_service_v1.Action) {
// 	obj, err := objectForDataResourceTypeAndID(dataResourceType, dataResourceID)
// 	if err != nil {
// 		log.Warn("unsupported data resource", zap.Int("dataResourceType", dataResourceType), zap.String("id", dataResourceID))
// 		return
// 	}
// 	return actionsForResponsesAndSubjectAndObject(responses, sub, obj)
// }

// actionsForSubjectAndSearchResultEntry 解析鉴权响应列表，返回 sub 可以对数据资源目录指定的动作列表
func actionsForSubjectAndSearchResultEntry(responses []auth_service_v1.EnforceResponse, sub *auth_service_v1.Subject, entry *frontend_common.SearchResultEntry) (actions []auth_service_v1.Action) {
	for _, req := range requestsForSubjectAndSearchResultEntry(sub, entry) {
		if eft := effectForRequest(responses, req); eft != auth_service_v1.PolicyAllow {
			continue
		}
		actions = append(actions, req.Action)
	}
	return
}

// actionsForResponsesAndSubjectAndObject 解析鉴权相应列表，返回指定 sub, obj 且 eft 为 allow 的 action 列表
func actionsForResponsesAndSubjectAndObject(responses []auth_service_v1.EnforceResponse, sub *auth_service_v1.Subject, obj *auth_service_v1.Object) (actions []auth_service_v1.Action) {
	for _, act := range actionsForObjectType(obj.Type) {
		req := auth_service_v1.EnforceRequest{
			Subject: *sub,
			Object:  *obj,
			Action:  act,
		}
		if eft := effectForRequest(responses, req); eft != auth_service_v1.PolicyAllow {
			continue
		}
		actions = append(actions, act)
	}
	return
}

// effectForRequest 根据鉴权响应列表返回鉴权请求是否通过
func effectForRequest(responses []auth_service_v1.EnforceResponse, request auth_service_v1.EnforceRequest) auth_service_v1.PolicyEffect {
	for _, resp := range responses {
		if resp.EnforceRequest != request {
			continue
		}
		return resp.Effect
	}
	// 如果未匹配到，返回 deny
	return auth_service_v1.PolicyDeny
}
