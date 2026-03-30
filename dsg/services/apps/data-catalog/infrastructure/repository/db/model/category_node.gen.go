package model

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameCategoryNode = "category_node"
const TableNameCategoryNodeExt = "category_node_ext"

// CategoryNode mapped from table <category_node>
type CategoryNode struct {
	ID             uint64                `gorm:"column:id;primaryKey" json:"id"`                                            // 唯一id，雪花算法
	CategoryNodeID string                `gorm:"column:category_node_id;not null" json:"category_node_id"`                  // 类目树节点ID
	CategoryID     string                `gorm:"column:category_id;not null" json:"category_id"`                            // 类目ID
	ParentID       string                `gorm:"column:parent_id;not null" json:"parent_id"`                                // 类目树父节点id
	Name           string                `gorm:"column:name;not null" json:"name"`                                          // 类目树节点名称
	Owner          string                `gorm:"column:owner" json:"owner"`                                                 // 类目树节点所有者
	OwnerUID       string                `gorm:"column:owner_uid" json:"owner_uid"`                                         // 类目树节点所有者的ID
	Required       int                   `gorm:"column:required" json:"required"`                                           // 是否必填，0否 1是
	Selected       int                   `gorm:"column:selected" json:"selected"`                                           // 是否选中，0否 1是
	SortWeight     uint64                `gorm:"column:sort_weight;not null" json:"sort_weight"`                            // 排序权重
	CreatedAt      time.Time             `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatorUID     string                `gorm:"column:creator_uid" json:"creator_uid"`                                     // 创建用户ID
	CreatorName    string                `gorm:"column:creator_name" json:"creator_name"`                                   // 创建用户名称
	UpdatedAt      time.Time             `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"`               // 更新时间
	UpdaterUID     string                `gorm:"column:updater_uid" json:"updater_uid"`                                     // 更新用户ID
	UpdaterName    string                `gorm:"column:updater_name" json:"updater_name"`                                   // 更新用户名称
	DeletedAt      soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`             // 删除时间(逻辑删除)
	DeleterUID     string                `gorm:"column:deleter_uid" json:"deleter_uid"`                                     // 删除用户ID
	DeleterName    string                `gorm:"column:deleter_name" json:"deleter_name"`                                   // 删除用户名称
}

func (m *CategoryNode) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		m.ID, err = utils.GetUniqueID()
	}

	return err
}

// TableName CategoryNode's table name
func (*CategoryNode) TableName() string {
	return TableNameCategoryNode
}

type CategoryNodeRecursive struct {
	*CategoryNode
	Children []*TreeNodeRecursive
}

type CategoryNodeExt struct {
	*CategoryNode
	Expansion           bool               `gorm:"-:all"`
	Hit                 bool               `gorm:"-:all"`
	NotDefaultExpansion bool               `gorm:"-:all"`
	Children            []*CategoryNodeExt `gorm:"-:all"`
}

// CategoryNodeExtModel 映射 category_node_ext 表
type CategoryNodeExtModel struct {
	ID             uint64                `gorm:"column:id;primaryKey" json:"id"`                                            // 唯一id，雪花算法
	CategoryNodeID string                `gorm:"column:category_node_id;not null;default:uuid()" json:"category_node_id"`   // 类目树节点ID
	CategoryID     string                `gorm:"column:category_id;not null;default:uuid()" json:"category_id"`             // 类目ID
	ParentID       string                `gorm:"column:parent_id;not null" json:"parent_id"`                                // 类目树父节点id
	Name           string                `gorm:"column:name;not null" json:"name"`                                          // 类目树节点名称
	Owner          string                `gorm:"column:owner" json:"owner"`                                                 // 类目树节点所有者
	OwnerUID       string                `gorm:"column:owner_uid" json:"owner_uid"`                                         // 类目树节点所有者的ID
	Required       int                   `gorm:"column:required" json:"required"`                                           // 是否必填，0否 1是
	Selected       int                   `gorm:"column:selected" json:"selected"`                                           // 是否选中，0否 1是
	SortWeight     uint64                `gorm:"column:sort_weight;not null" json:"sort_weight"`                            // 排序权重
	CreatedAt      time.Time             `gorm:"column:created_at;not null;default:current_timestamp(3)" json:"created_at"` // 创建时间
	CreatorUID     string                `gorm:"column:creator_uid" json:"creator_uid"`                                     // 创建用户ID
	CreatorName    string                `gorm:"column:creator_name" json:"creator_name"`                                   // 创建用户名称
	UpdatedAt      time.Time             `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"`               // 更新时间
	UpdaterUID     string                `gorm:"column:updater_uid" json:"updater_uid"`                                     // 更新用户ID
	UpdaterName    string                `gorm:"column:updater_name" json:"updater_name"`                                   // 更新用户名称
	DeletedAt      soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`             // 删除时间(逻辑删除)
	DeleterUID     string                `gorm:"column:deleter_uid" json:"deleter_uid"`                                     // 删除用户ID
	DeleterName    string                `gorm:"column:deleter_name" json:"deleter_name"`                                   // 删除用户名称
}

func (m *CategoryNodeExtModel) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.ID == 0 {
		m.ID, err = utils.GetUniqueID()
	}
	return err
}

func (*CategoryNodeExtModel) TableName() string {
	return TableNameCategoryNodeExt
}

// func TreeNodeToRecursive(nodes ...*TreeNode) []*TreeNodeRecursive {
// 	if len(nodes) < 1 {
// 		return nil
// 	}

// 	ret := make([]*TreeNodeRecursive, len(nodes))
// 	for i, node := range nodes {
// 		ret[i] = &TreeNodeRecursive{TreeNode: node}
// 	}

// 	if len(ret) > 1 {
// 		sort.Slice(ret, func(i, j int) bool {
// 			return ret[i].SortWeight < ret[j].SortWeight
// 		})
// 	}

// 	return ret
// }
