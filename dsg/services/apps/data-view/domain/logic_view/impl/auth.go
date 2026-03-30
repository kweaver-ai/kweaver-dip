package impl

import (
	"context"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
	"github.com/samber/lo"
	"sort"
	"strings"
)

func (l *logicViewUseCase) GetUserAuthedViews(ctx context.Context) ([]string, error) {
	// 访问者，用于鉴权
	subject, err := interception.AuthServiceSubjectFromContext(ctx)
	if err != nil {
		return nil, err
	}
	// 访问者可以对逻辑视图执行的动作，包括已经过期的权限。Key 是逻辑视图的
	// ID，Value 是可以执行的动作的集合。
	//  1. 访问者可以对逻辑视图整表的动作
	//  2. 访问者对逻辑视图至少一个子视图（行列规则）执行的动作
	var formViewActions = make(map[string]sets.Set[string])
	// 访问者对逻辑视图及其子视图的权限是否过期
	var formViewIsExpired = make(map[string]bool)
	// 访问者对逻辑视图及其子视图（行列规则）的权限规则，根据逻辑视图、子视图
	// （行列规则）所属逻辑视图分组
	var objectsGroupedByFormView = make(map[string][]*auth_service.Entries)

	// 获取访问者对逻辑视图、子视图（行列规则）的权限规则列表。列表包括已经
	// 过期的权限规则。
	res, err := l.DrivenAuthService.GetUsersObjects(ctx, &auth_service.GetUsersObjectsReq{
		ObjectType:  strings.Join([]string{auth_service.ObjectTypeDataView, auth_service.ObjectTypeSubView}, ","),
		SubjectId:   subject.ID,
		SubjectType: string(subject.Type),
	})
	if err != nil {
		return nil, err
	}
	// 根据所属逻辑视图分组，非逻辑视图、子视图（行列规则）或获取子视图（行
	// 列规则）所属逻辑视图失败，所属逻辑视图 ID 视为 ""
	objectsGroupedByFormView = lo.GroupBy(res.EntriesList, func(item *auth_service.Entries) string {
		switch item.ObjectType {
		// 逻辑视图，返回 ID
		case auth_service.ObjectTypeDataView:
			return item.ObjectId
		// 子视图，返回所属逻辑视图的 ID
		case auth_service.ObjectTypeSubView:
			id, err := uuid.Parse(item.ObjectId)
			if err != nil {
				return ""
			}
			// 获取子视图（行列规则）所属逻辑视图的 ID
			logicViewID, err := l.subViewRepo.GetLogicViewID(ctx, id)
			if err != nil {
				return ""
			}
			return logicViewID.String()
		default:
			return ""
		}
	})

	for formViewID, objects := range objectsGroupedByFormView {
		// 忽略逻辑视图 ID 为空
		if formViewID == "" {
			continue
		}
		for _, o := range objects {
			// 忽略非逻辑视图或子视图（行列规则）
			if o.ObjectType != auth_service.ObjectTypeDataView && o.ObjectType != auth_service.ObjectTypeSubView {
				continue
			}
			for _, p := range o.PermissionsList {
				// 忽略非“允许”的规则
				if p.Effect != auth_service.Effect_Allow {
					continue
				}
				if formViewActions[formViewID] == nil {
					formViewActions[formViewID] = make(sets.Set[string])
				}
				formViewActions[formViewID].Insert(p.Action)
			}
			// 存在过期时间，且早于当前时间，视为已过期
			formViewIsExpired[formViewID] = formViewIsExpired[formViewID] || (o.ExpiredAt != nil && l.clock.Now().After(o.ExpiredAt.Time))
		}
	}

	// 页面显示的逻辑视图 ID 列表。用户拥有这些逻辑视图或其至少一个子视图
	// （行列规则）的 download 或 read 权限。
	allowActions := []string{auth_service.Action_Auth, auth_service.Action_Allocate}
	viewIds := lo.Filter(lo.Keys(formViewActions), func(id string, _ int) bool {
		return formViewActions[id].HasAny(allowActions...)
	})
	// 为了分页查询结果稳定，对 req.ViewIds 排序
	sort.Strings(viewIds)
	return viewIds, nil
}
