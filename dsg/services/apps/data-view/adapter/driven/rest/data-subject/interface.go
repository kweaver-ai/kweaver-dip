package data_subject

import (
	"context"
)

type DrivenDataSubject interface {
	GetsObjectById(ctx context.Context, id string) (*GetObjectResp, error)
	GetObjectPrecision(ctx context.Context, ids []string) (*GetObjectPrecisionRes, error)
	GetSubjectList(ctx context.Context, parentId, subjectType string) (*DataSubjectListRes, error)
	GetAttributeByIds(ctx context.Context, ids []string) (*GetAttributRes, error)
}
type GetObjectResp struct {
	ID          string        `json:"id"`          // 对象id
	Name        string        `json:"name"`        // 对象名称
	Description string        `json:"description"` // 描述
	Type        string        `json:"type"`        // 对象类型
	PathID      string        `json:"path_id"`     // 路径id
	PathName    string        `json:"path_name"`   // 路径名称
	Owners      *UserInfoResp `json:"owners"`      // 拥有者
	CreatedBy   string        `json:"created_by"`  // 创建人
	CreatedAt   int64         `json:"created_at"`  // 创建时间
	UpdatedBy   string        `json:"updated_by"`  // 修改人
	UpdatedAt   int64         `json:"updated_at"`  // 修改时间
}
type UserInfoResp struct {
	UID      string `json:"user_id"`   // 用户id，uuid
	UserName string `json:"user_name"` // 用户名
}

type GetObjectPrecisionRes struct {
	Object []*GetObjectResp `json:"object"`
}

// GetSubjectList

type DataSubjectListRes struct {
	Entries    []DataSubject `json:"entries"`
	TotalCount int           `json:"total_count"`
}
type DataSubject struct {
	Id               string   `json:"id"`
	Name             string   `json:"name"`
	Description      string   `json:"description"`
	Type             string   `json:"type"`
	PathId           string   `json:"path_id"`
	PathName         string   `json:"path_name"`
	Owners           []string `json:"owners"`
	CreatedBy        string   `json:"created_by"`
	CreatedAt        int64    `json:"created_at"`
	UpdatedBy        string   `json:"updated_by"`
	UpdatedAt        int64    `json:"updated_at"`
	ChildCount       int      `json:"child_count"`
	SecondChildCount int      `json:"second_child_count"`
}

type GetAttributRes struct {
	Attributes []*GetAttributResp `json:"attributes"`
}
type GetAttributResp struct {
	ID          string `json:"id"`          // 对象id
	Name        string `json:"name"`        // 对象名称
	Description string `json:"description"` // 描述
	Type        string `json:"type"`        // 对象类型
	PathID      string `json:"path_id"`     // 路径id
	PathName    string `json:"path_name"`   // 路径名称
	LabelId     string `json:"label_id"`    // 标签ID
	LabelName   string `json:"label_name"`  // 标签名称
	LabelIcon   string `json:"label_icon"`  // 标签颜色
	LabelPath   string `json:"label_path"`  //标签路径
}

//
