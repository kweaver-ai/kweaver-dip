package model

import "gorm.io/plugin/soft_delete"

const TableNameSubViews = "sub_views"

// 子视图（行列规则），包含 deleted_at
type SubView struct {
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	//授权范围
	AuthScopeID string `json:"auth_scope_id,omitempty"`
	// 所属逻辑视图的 ID
	LogicViewID string `json:"logic_view_id,omitempty"`

	DeletedAt soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at,omitempty"`
}

func (SubView) TableName() string { return TableNameSubViews }

// 子视图（行列规则），部分字段
type SubViewWithNameAndDataViewOwner struct {
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// 子视图所属逻辑视图的 Owner 的 ID
	DataViewOwnerID string `json:"data_view_owner_id,omitempty"`
	// 子视图所属逻辑视图的 Owner 的显示名称
	DataViewOwnerName string `json:"data_view_owner_name,omitempty"`
}

func (SubViewWithNameAndDataViewOwner) TableName() string { return TableNameSubViews }

// 子视图（行列规则），部分字段
type SubViewWithNameAndDataViewIDAndName struct {
	// ID
	ID string `json:"id,omitempty"`
	// 名称
	Name string `json:"name,omitempty"`
	// 子视图所属逻辑视图 的 ID
	DataViewID string `json:"data_view_id,omitempty"`
	// 子视图所属逻辑视图的业务名称
	DataViewBusinessName string `json:"data_view_business_name,omitempty"`
}
