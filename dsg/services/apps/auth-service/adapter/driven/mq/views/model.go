package views

import "github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"

type ObjectType string

// supported message types
const (
	ObjectTypeAdded    ObjectType = "Added"
	ObjectTypeDeleted  ObjectType = "Deleted"
	ObjectTypeModified ObjectType = "Modified"
)

type objectSubView struct {
	// ID
	ID string `json:"id,omitempty" path:"id"`
	// 名称
	Name string `json:"name,omitempty"`
	// 子视图所属逻辑视图的 ID
	LogicViewID string `json:"logic_view_id,omitempty"`
	// 子视图所属逻辑视图的名称
	LogicViewName string `json:"logic_view_name,omitempty"`
	// 子视图的列的名称列表，逗号分隔
	Columns string `json:"columns,omitempty"`
	// 行列配置详情，JSON 格式，与下载数据接口的过滤条件结构相同
	RowFilterClause string `json:"row_filter_clause,omitempty"`
}

type KafkaMessageSubView struct {
	Type ObjectType `json:"type,omitempty"`

	Object model.AuthSubView `json:"object,omitempty"`
}
