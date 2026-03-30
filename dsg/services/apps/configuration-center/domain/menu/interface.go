package menu

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/samber/lo"
)

const (
	DefaultPlatform         = 1 //数据语义治理
	SmartDataQueryPlatform  = 2 //智能问数
	SmartDataSearchPlatform = 3 //智能找数
)

type UseCase interface {
	GetMenus(ctx context.Context, req *GetMenusReq) (*GetMenusRes, error)
	GetPermissionMenus(ctx context.Context, req *PermissionMenusReq) (*response.PageResults[PermissionMenusRes], error)
	SetMenus(ctx context.Context, req SetMenusReq) error
	GetResourceMenuKeys(ctx context.Context) (map[string]string, error)
}

type GetMenusReq struct {
	ResourceType string `json:"resource_type" form:"resource_type" binding:"omitempty"`
	Platform     int32  `json:"-"`
}

type GetMenusRes struct {
	Menus []any `json:"menus"` // 菜单列表
}

type PermissionMenusReq struct {
	ID           string `json:"id" form:"id" binding:"omitempty"`
	ResourceType string `json:"resource_type" form:"resource_type" binding:"omitempty"`
	Platform     int32  `json:"-"`
	PermissionMenusFixedReq
}

type PermissionMenusFixedReq struct {
	Keyword string `json:"keyword" form:"keyword" binding:"omitempty,max=255"`
	Limit   int    `json:"limit" form:"limit" binding:"omitempty,gt=0"`
	Offset  int    `json:"offset" form:"offset" binding:"omitempty,gt=0"`
}

type PermissionMenusRes struct {
	ID   string `json:"id"`
	Type string `json:"type"`
	Name string `json:"name"`
}

type SetMenusReq map[string][]Mu

type Mu struct {
	Type          string   `json:"type,omitempty"`
	Label         string   `json:"label,omitempty"`
	DomTitle      string   `json:"domtitle,omitempty"`
	Path          string   `json:"path"`
	Key           string   `json:"key,omitempty"`
	LayoutElement string   `json:"layoutElement,omitempty"`
	Module        []string `json:"module,omitempty"`
	Attribute     any      `json:"attribute,omitempty"`
	Element       string   `json:"element,omitempty"`
	Index         bool     `json:"index,omitempty"`
	Belong        []string `json:"belong,omitempty"`
	Hide          bool     `json:"hide,omitempty"`
	ResourceType  string   `json:"resource_type,omitempty"`
	Children      []*Mu    `json:"children,omitempty"`
	Actions       []string `json:"actions"`
}

// ResourceToPlatform 复用原来的platform列，映射到不同的resource
func ResourceToPlatform(resourceID string) int32 {
	switch {
	case resourceID == authorization.RESOURCE_SMART_DATA_QUERY:
		return SmartDataQueryPlatform
	case resourceID == authorization.RESOURCE_SMART_DATA_FIND:
		return SmartDataSearchPlatform
	default:
		return DefaultPlatform
	}
}

func PlatformToResourceType(platform int32) string {
	switch {
	case platform == SmartDataQueryPlatform:
		return authorization.RESOURCE_SMART_DATA_QUERY
	case platform == SmartDataSearchPlatform:
		return authorization.RESOURCE_SMART_DATA_FIND
	default:
		return authorization.RESOURCE_TYPE_MENUS
	}
}

func (m *Mu) Keys() []string {
	if !m.IsPermissionMenu() {
		return []string{}
	}
	keys := []string{m.Key}
	for _, child := range m.Children {
		if !child.IsPermissionMenu() {
			continue
		}
		keys = append(keys, child.Keys()...)
	}
	return keys
}

func (m *Mu) IsPermissionMenu() bool {
	return !(m.Label == "" || m.Hide)
}

func ToPermissionMenus(ms []*Mu, resourceType string) []*PermissionMenusRes {
	return lo.Times(len(ms), func(index int) *PermissionMenusRes {
		return &PermissionMenusRes{
			ID:   ms[index].Key,
			Name: ms[index].Label,
			Type: resourceType,
		}
	})
}
