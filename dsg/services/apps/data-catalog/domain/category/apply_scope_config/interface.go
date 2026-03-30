package apply_scope_config

import (
	"context"

	_ "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
)

type UseCase interface {
	Get(ctx context.Context, keyword string) (*GetResp, error)
	Update(ctx context.Context, categoryID string, items []Item) error
}

type Item struct {
	ApplyScopeID string        `json:"apply_scope_id" binding:"required,uuid"`
	Selected     bool          `json:"selected"`
	Required     bool          `json:"required"`
	Name         string        `json:"name,omitempty"`
	Trees        []*ModuleTree `json:"trees,omitempty"`
}

type GetResp struct {
	Categories []*CategorySummary `json:"categories"`
	TotalCount int64              `json:"total_count"`
}

// ===== controller 绑定用请求结构 =====
type PathParam struct {
	CategoryID string `json:"category_id" uri:"category_id" binding:"required,uuid"`
}

type GetReqParam struct {
	QueryParam `param_type:"query"`
}

type UpdateBody struct {
	Items []Item `json:"items" binding:"required,dive"`
}

type UpdateReqParam struct {
	PathParam  `param_type:"uri"`
	UpdateBody `param_type:"body"`
}

// 左侧类目列表的精简信息
type CategorySummary struct {
	ID       string  `json:"id"`
	Name     string  `json:"name"`
	Using    bool    `json:"using"`
	Required bool    `json:"required"`
	Modules  []*Item `json:"modules"`
}

type ModuleTree struct {
	Key   string      `json:"key,omitempty"`
	Name  string      `json:"name,omitempty"`
	Nodes []*TreeNode `json:"nodes"`
}

type TreeNode struct {
	ID       string      `json:"id"`
	ParentID string      `json:"parent_id,omitempty"`
	Name     string      `json:"name,omitempty"`
	Selected bool        `json:"selected"`
	Required bool        `json:"required"`
	Children []*TreeNode `json:"children,omitempty"`
}

// 可选查询参数
type QueryParam struct {
	Keyword string `json:"keyword" form:"keyword" binding:"omitempty,min=1,max=128"`
}
