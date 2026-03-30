package data_grade

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type DataGradeCase interface {
	Add(ctx context.Context, req AddReqParam) (*AddRespParam, error)
	Reorder(ctx context.Context, req ReorderReqParam) (*ReorderRespParam, error)
	List(ctx context.Context, req ListReqParam) (*ListRespParam, error)
	ListByParentID(ctx context.Context, parentID string) (*ListRespParam, error)
	StatusOpen(ctx context.Context) (bool, error)
	StatusCheckOpen(ctx context.Context) (string, error)
	Delete(ctx context.Context, req *DeleteReqParam) (*DeleteRespParam, error)
	GetInfoByID(ctx context.Context, req *GetInfoByIDReqParam) (*TreeNodeExtInfo, error)
	GetInfoByName(ctx context.Context, req *GetInfoByNameReqParam) (*model.DataGrade, error)
	ListTree(ctx context.Context, req *ListTreeReqParam) (*ListTreeRespParam, error)
	ExistByName(ctx context.Context, name string, id models.ModelID, nodeType int) (bool, error)
	ListIcon(ctx context.Context) ([]string, error)
	GetListByIds(ctx context.Context, ids string) (*TreeNodeExtInfoList, error)
	GetBindObjects(ctx context.Context, labelID string) (listBindObjects *ListBindObjects, err error)
}

type AddReqParam struct {
	ID                  models.ModelID `gorm:"column:id;not null" json:"id"`                                                                       // 主键ID
	ParentID            models.ModelID `gorm:"column:parent_id;not null" json:"parentId" binding:"required"`                                       // 父id，根节点传1
	Name                string         `gorm:"column:name;not null" json:"name" binding:"required,max=128,TrimSpace"`                              // 名称
	Description         string         `json:"description" binding:"max=300,TrimSpace"`                                                            // 描述
	NodeType            int            `gorm:"column:node_type;not null" json:"nodeType" binding:"oneof=1 2" `                                     // 节点类型 1：node,2:group
	Icon                string         `json:"icon"`                                                                                               // 目录类别描述
	SensitiveAttri      *string        `json:"sensitive_attri" binding:"omitempty,TrimSpace,oneof=sensitive insensitive"`                          // 敏感属性预设
	SecretAttri         *string        `json:"secret_attri" binding:"omitempty,TrimSpace,oneof=secret non-secret"`                                 // 涉密属性预设
	ShareCondition      *string        `json:"share_condition" binding:"omitempty,TrimSpace,oneof=no_share conditional_share unconditional_share"` // 共享条件：不共享，有条件共享，无条件共享
	DataProtectionQuery bool           `json:"data_protection_query" binding:"omitempty,TrimSpace"`                                                // 数据保护查询开关
}

type ReorderReqParam struct {
	ID           models.ModelID `json:"id" binding:"required" example:"0"`             // 主键ID
	DestParentID models.ModelID `json:"dest_parent_id" binding:"required" example:"0"` // 移动到的目标父目录类别ID，为0表示移动到第一层级
	NextID       models.ModelID `json:"next_id" binding:"required" example:"1"`        // 将节点移动到该next_id节点的前面
}

type ListReqParam struct {
	ListReqQueryParam `param_type:"query"`
}

type ListReqQueryParam struct {
	Keyword string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"` // 关键字查询，字符无限制
}

type ListByParentIDReqParam struct {
	ParentID string `json:"parent_id" uri:"parentID" binding:"required" example:"0"` // 主键ID
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

func (a *AddReqParam) ToModel(userId string) *model.DataGrade {
	m := &model.DataGrade{
		ParentID:            a.ParentID,
		Name:                a.Name,
		Description:         a.Description,
		Icon:                a.Icon,
		CreatedByUID:        userId,
		UpdatedByUID:        userId,
		ID:                  a.ID,
		NodeType:            a.NodeType,
		SensitiveAttri:      a.SensitiveAttri,
		SecretAttri:         a.SecretAttri,
		ShareCondition:      a.ShareCondition,
		DataProtectionQuery: a.DataProtectionQuery,
	}

	return m
}

type AddRespParam struct {
	response.IDResp
}

type ReorderRespParam struct {
	response.IDResp
}

func NewReorderRespParam(id models.ModelID) *ReorderRespParam {
	return &ReorderRespParam{
		IDResp: response.IDResp{
			ID: id,
		},
	}
}

type TreeNodeExt struct {
	//*model.DataGrade
	*model.DataGrade
	//ID models.ModelID `gorm:"column:id;primaryKey" json:"id"` // 雪花id
	//GradeId     string         `gorm:"column:grade_id;primaryKey" json:"grade_id"`     // 业务主键ID
	//ParentID            models.ModelID `gorm:"column:parent_id;not null" json:"parent_id"`     // 父目录类别id，为0表示没有父id
	//Name                string         `gorm:"column:name;not null" json:"name"`               // 名称
	//Description         string         `gorm:"column:description;not null" json:"description"` // 描述
	//SortWeight          uint64         `gorm:"column:sort_weight;not null" json:"sort_weight"` // 排序权重
	//NodeType            int            `gorm:"column:node_type;not null" json:"node_type"`     // 节点类型
	//Icon                string         `gorm:"column:icon;not null" json:"icon"`               // 目录类别描述
	Children            []*TreeNodeExt `gorm:"-:all"`
	Hit                 bool           `gorm:"-:all"`
	NotDefaultExpansion bool           `gorm:"-:all"`
	Expansion           bool           `gorm:"-:all"`
}

type TreeNodeExtInfo struct {
	*model.DataGrade
	NameDisplay string `json:"name_display"` // 名称
}

type TreeNodeExtInfoList struct {
	Entries []*TreeNodeExtInfo
}
type DeleteRespParam struct {
	response.IDResp
}

type DeleteReqParam struct {
	ID models.ModelID `json:"id" uri:"id" binding:"required" example:"1"` // ID`
}

type GetInfoByIDReqParam struct {
	ID models.ModelID `json:"id" uri:"id" binding:"required" example:"1"` // ID`
}

type GetInfoByNameReqParam struct {
	Name     string         `json:"name" uri:"name" form:"name" binding:"required,max=128" example:"1"` // Name`
	NodeType int            `json:"node_type" uri:"node_type" form:"node_type"`                         // 节点类型 1：node,2:group
	ID       models.ModelID `json:"id" uri:"id" form:"id" example:"1"`                                  // ID`
}

type CheckNameReqParam struct {
	Name     string         `json:"name" uri:"name" form:"name" binding:"required,max=128" example:"1"`      // Name`
	NodeType int            `json:"node_type" uri:"node_type" form:"node_type" binding:"required,oneof=1 2"` // 节点类型 1：node,2:group
	ID       models.ModelID `json:"id" uri:"id" form:"id" example:"1"`
}

type ListRespParam struct {
	Entries []*model.DataGrade
}

type SubNode struct {
	response.IDResp
	Name      string     `json:"name" binding:"required,min=1,max=128" example:"catalog_class_name"` // 目录类别名称
	Expansion bool       `json:"expansion" binding:"required" example:"true"`                        // 目录类别是否可展开
	Children  []*SubNode `json:"children,omitempty" binding:"omitempty"`                             // 当前TreeNode的子Node列表
}

type ListTreeRespParam struct {
	response.PageResultArray[SummaryInfo]
}

type ListIconRespParam struct {
	Icon string ` json:"icon"` // 目录类别描述
}

type SummaryInfo struct {
	*SummaryBaseInfo
	RawName string `json:"raw_name" binding:"required,min=1,max=128" example:"catalog_class_name"` // 目录类别原始的名称
	//Expansion bool   `json:"expansion" binding:"required" example:"true"`                            // TreeNode是否可展开
	//DefaultExpansion bool           `json:"default_expansion" binding:"required" example:"false"`                   // TreeNode是否默认展开
	Children []*SummaryInfo `json:"children,omitempty" binding:"omitempty"` // 当前TreeNode的子Node列表
}

type SummaryBaseInfo struct {
	response.IDResp
	response.CreateUpdateTime
	Name                string         `json:"name" binding:"required,min=1,max=128" example:"catalog_class_name"` // 目录类别名称
	ParentID            models.ModelID `json:"parent_id,omitempty" binding:"required,VerifyModelID" example:"0"`   // 目录类别父节点ID
	Description         string         `json:"description"`                                                        // 描述
	SortWeight          uint64         `json:"sort_weight"`                                                        // 排序权重
	NodeType            int            `json:"node_type"`                                                          // 节点类型
	Icon                string         `json:"icon"`                                                               // 目录类别描述
	SensitiveAttri      *string        `json:"sensitive_attri"`                                                    // 敏感属性预设
	SecretAttri         *string        `json:"secret_attri"`                                                       // 涉密属性预设
	ShareCondition      *string        `json:"share_condition"`                                                    // 共享条件：不共享，有条件共享，无条件共享
	DataProtectionQuery bool           `json:"data_protection_query"`                                              // 数据保护查询开关
	//CategoryID string         `json:"category_id" form:"category_id" binding:"required,min=1,max=32"`                  // 类目编码
	//MgmDepID   string         `json:"mgm_dep_id" binding:"required,min=1,max=128" example:"mgm dep id"`                // 管理部门ID
	//MgmDepName string         `json:"mgm_dep_name" binding:"required,min=1,max=128,VerifyName" example:"mgm dep name"` // 管理部门名称
}

type ListTreeReqParam struct {
	Keyword     string `json:"keyword" form:"keyword" binding:"TrimSpace,omitempty,min=1,max=128"` // 关键字查询，字符无限制
	IsShowLabel bool   `json:"is_show_label" form:"is_show_label,default=true" default:"true"`     // 是否展示标签
}

type ListByIdsReqParam struct {
	Ids string `json:"ids" form:"ids"  uri:"ids" binding:"required"` // 关键字查询，字符无限制
}

func NewListTreeRespParam(nodes []*TreeNodeExt, keyword string, defaultExpansion bool) *ListTreeRespParam {
	ret := make([]*SummaryInfo, len(nodes))
	for i, node := range nodes {
		ret[i] = NewSummaryInfo(node, keyword, defaultExpansion)
	}

	return &ListTreeRespParam{
		PageResultArray: response.PageResultArray[SummaryInfo]{
			Entries:    ret,
			TotalCount: int64(len(ret)),
		},
	}
}
func NewSummaryBaseInfo(m *model.DataGrade) *SummaryBaseInfo {
	if m == nil {
		return nil
	}
	return &SummaryBaseInfo{
		IDResp: response.IDResp{
			ID: m.ID,
		},
		CreateUpdateTime:    response.NewCreateUpdateTime(m.CreatedAt, m.UpdatedAt),
		Name:                m.Name,
		ParentID:            m.ParentID,
		Description:         m.Description,
		SortWeight:          m.SortWeight,
		NodeType:            m.NodeType,
		Icon:                m.Icon,
		SensitiveAttri:      m.SensitiveAttri,
		SecretAttri:         m.SecretAttri,
		ShareCondition:      m.ShareCondition,
		DataProtectionQuery: m.DataProtectionQuery,
		//CategoryID:       m.CategoryNum,
		//MgmDepID:         m.MgmDepID,
		//MgmDepName:       m.MgmDepName,
	}
}

func NewSummaryInfo(m *TreeNodeExt, keyword string, defaultExpansion bool) *SummaryInfo {
	if m == nil {
		return nil
	}

	ret := &SummaryInfo{
		SummaryBaseInfo: NewSummaryBaseInfo(m.DataGrade),
		RawName:         m.Name,
		//Expansion:       m.Expansion,
		Children: nil,
	}

	if m.Hit && len(keyword) > 0 {
		// keyword命中的，需要高亮
		ret.Name = highlight(ret.Name, keyword)
	}

	//if defaultExpansion {
	//	if m.NotDefaultExpansion {
	//		// 该node的子node的都不默认展开
	//		defaultExpansion = false
	//	} else {
	//		ret.DefaultExpansion = true
	//	}
	//}

	if len(m.Children) < 1 {
		return ret
	}

	ret.Children = make([]*SummaryInfo, 0, len(m.Children))
	for _, child := range m.Children {
		ret.Children = append(ret.Children, NewSummaryInfo(child, keyword, defaultExpansion))
	}

	return ret
}

func highlight(src, keyword string) string {
	srcLow := strings.ToLower(src)
	keywordLow := strings.ToLower(keyword)

	sIdx := strings.Index(srcLow, keywordLow)
	if sIdx < 0 {
		return src
	}

	ret := src[:sIdx] + "<em>" + src[sIdx:sIdx+len(keyword)] + "</em>" + highlight(src[sIdx+len(keyword):], keywordLow)
	return strings.ReplaceAll(ret, "</em><em>", "")
}

type EntrieObj struct {
	ID   string `gorm:"column:id" json:"id"`     // id
	Name string `gorm:"column:name" json:"name"` // name
}

type BindObjects struct {
	Entries    []EntrieObj `json:"entries"`
	TotalCount int64       `json:"total_count"`
}

type ListBindObjects struct {
	DataStandardization BindObjects `json:"data_standardization"`
	BusinessAttri       BindObjects `json:"business_attri"`
	DataView            BindObjects `json:"data_view"`
	BusinessFormField   BindObjects `json:"Business_from_field"`
	DataCatalog         BindObjects `json:"data_catalog"`
}
