package tree_node

import (
	"context"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type UseCase interface {
	Add(ctx context.Context, req *AddReqParam) (*AddRespParam, error)
	Delete(ctx context.Context, req *DeleteReqParam) (*DeleteRespParam, error)
	Edit(ctx context.Context, req *EditReqParam) (*EditRespParam, error)
	List(ctx context.Context, req *ListReqParam) (*ListRespParam, error)
	ListTree(ctx context.Context, req *ListTreeReqParam) (*ListTreeRespParam, error)
	Get(ctx context.Context, req *GetReqParam) (*GetRespParam, error)
	Reorder(ctx context.Context, req *ReorderReqParam) (*ReorderRespParam, error)
	NameExistCheck(ctx context.Context, req *NameExistReqParam) (*NameExistRespParam, error)
}

/////////////////// Common ///////////////////

type TreeIDQueryParam struct {
	TreeID models.ModelID `json:"tree_id" uri:"tree_id" form:"tree_id" binding:"omitempty,VerifyModelID" example:"1" swaggerignore:"true"` // Tree ID
}

type IDPathParam struct {
	ID models.ModelID `json:"id" uri:"node_id" binding:"required,VerifyModelID" example:"1"` // 目录分类ID
}

/////////////////// Add ///////////////////

type AddReqParam struct {
	TreeIDQueryParam `param_type:"query"`
	AddReqBodyParam  `param_type:"body"`
}

func (a *AddReqParam) ToModel(userId models.UserID) *model.TreeNode {
	// func (a *AddReqParam) ToModel() *model.TreeNode {
	m := &model.TreeNode{
		TreeID:       a.TreeID,
		ParentID:     a.ParentID,
		Name:         *a.Name,
		Describe:     a.Describe,
		MgmDepID:     *a.MgmDepID,
		MgmDepName:   *a.MgmDepName,
		CreatedByUID: userId,
		UpdatedByUID: userId,
	}

	return m
}

type AddReqBodyParam struct {
	Name       *string        `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"catalog_class_name"`       // 目录类别名称，仅支持中英文、数字、下划线及中划线，前后空格自动去除
	ParentID   models.ModelID `json:"parent_id" binding:"omitempty,VerifyModelID=omit" example:"1"`                                  // 父类别ID，为0或不传时，为在一级目录下新增
	Describe   string         `json:"describe" binding:"TrimSpace,omitempty,max=255,VerifyDescription" example:"catalog_class_desc"` // 目录类别描述，仅支持中英文、数字及键盘上的特殊字符，前后空格自动去除
	MgmDepID   *string        `json:"mgm_dep_id" binding:"TrimSpace,required,min=1,max=36" example:"mgm_dep_id"`                     // 管理部门ID
	MgmDepName *string        `json:"mgm_dep_name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"mgm_dep_name"`     // 管理部门名称
	//Expansion *bool `json:"expansion" binding:"required" example:"true"` // TreeNod是否可展开
}

type AddRespParam struct {
	response.IDResp
}

/////////////////// Delete ///////////////////

type DeleteReqParam struct {
	IDPathParam      `param_type:"uri"`
	TreeIDQueryParam `param_type:"query"`
}

type DeleteRespParam struct {
	response.IDResp
}

/////////////////// Edit ///////////////////

type EditReqParam struct {
	IDPathParam      `param_type:"uri"`
	TreeIDQueryParam `param_type:"query"`
	EditReqBodyParam `param_type:"body"`
}

func (e *EditReqParam) ToModel(updateUserId models.UserID) *model.TreeNode {
	m := &model.TreeNode{
		ID:           e.ID,
		Name:         *e.Name,
		Describe:     e.Describe,
		UpdatedByUID: updateUserId,
	}

	return m
}

type EditReqBodyParam struct {
	Name     *string `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"catalog_class_name"`       // 目录类别名称，仅支持中英文、数字、下划线及中划线，前后空格自动去除
	Describe string  `json:"describe" binding:"TrimSpace,omitempty,max=255,VerifyDescription" example:"catalog_class_desc"` // 目录类别描述，仅支持中英文、数字及键盘上的特殊字符，前后空格自动去除
	//MgmDepID   *string `json:"mgm_dep_id" binding:"TrimSpace,required,min=1,max=128" example:"mgm_dep_id"`                    // 管理部门ID
	//MgmDepName *string `json:"mgm_dep_name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"mgm_dep_name"`     // 管理部门名称
}

type EditRespParam struct {
	response.IDResp
}

/////////////////// List ///////////////////

type ListReqParam struct {
	ListReqQueryParam `param_type:"query"`
}

type ListReqQueryParam struct {
	TreeIDQueryParam
	request.KeywordInfo
	ParentID  models.ModelID `json:"parent_id" form:"node_id" binding:"omitempty,VerifyModelID=omit" example:"0"` // 父目录类别ID，不传或0为展示一级分类；当keyword不为空&recursive为true时，指定该参数无效
	Recursive bool           `json:"recursive" form:"recursive" binding:"omitempty" example:"false"`              // 是否递归获取所有子树
	//RecursiveLayers int            `json:"recursive_layers" form:"recursive_layers" binding:"omitempty,gte=0" default:"0" example:"3"` // 递归层数，当recursive为true时有效，0表示递归所有子树，N表示最多递归N层，默认为0
}

type ListRespParam struct {
	response.PageResult[SubNode]
}

func NewListRespParam(entries []*SubNode, total int64) *ListRespParam {
	return &ListRespParam{
		PageResult: response.PageResult[SubNode]{
			Entries:    entries,
			TotalCount: total,
		},
	}
}

func NewListRespParamByTreeNode(nodes []*model.TreeNodeExt, total int64) *ListRespParam {
	if len(nodes) < 1 {
		return NewListRespParam(nil, total)
	}

	subNodes := make([]*SubNode, 0, len(nodes))
	for _, node := range nodes {
		subNodes = append(subNodes, NewSubNode(node))
	}

	return NewListRespParam(subNodes, total)
}

type SubNode struct {
	response.IDResp
	Name      string     `json:"name" binding:"required,min=1,max=128" example:"catalog_class_name"` // 目录类别名称
	Expansion bool       `json:"expansion" binding:"required" example:"true"`                        // 目录类别是否可展开
	Children  []*SubNode `json:"children,omitempty" binding:"omitempty"`                             // 当前TreeNode的子Node列表
}

func NewSubNode(m *model.TreeNodeExt) *SubNode {
	node := SubNode{
		IDResp: response.IDResp{
			ID: m.ID,
		},
		Name:      m.Name,
		Expansion: m.Expansion,
		Children:  nil,
	}

	if len(m.Children) < 1 {
		return &node
	}

	node.Children = make([]*SubNode, 0, len(m.Children))
	for _, child := range m.Children {
		node.Children = append(node.Children, NewSubNode(child))
	}
	return &node
}

/////////////////// ListTree ///////////////////

type ListTreeReqParam struct {
	ListTreeReqQueryParam `param_type:"query"`
}

type ListTreeReqQueryParam struct {
	TreeIDQueryParam
	request.KeywordInfo
}

type ListTreeRespParam struct {
	response.PageResult[SummaryInfo]
}

func NewListTreeRespParam(nodes []*model.TreeNodeExt, keyword string, defaultExpansion bool) *ListTreeRespParam {
	ret := make([]*SummaryInfo, len(nodes))
	for i, node := range nodes {
		ret[i] = NewSummaryInfo(node, keyword, defaultExpansion)
	}

	return &ListTreeRespParam{
		PageResult: response.PageResult[SummaryInfo]{
			Entries:    ret,
			TotalCount: int64(len(ret)),
		},
	}
}

type SummaryBaseInfo struct {
	response.IDResp
	response.CreateUpdateTime
	Name       string         `json:"name" binding:"required,min=1,max=128" example:"catalog_class_name"`              // 目录类别名称
	ParentID   models.ModelID `json:"parent_id,omitempty" binding:"required,VerifyModelID" example:"0"`                // 目录类别父节点ID
	CategoryID string         `json:"category_id" form:"category_id" binding:"required,min=1,max=32"`                  // 类目编码
	MgmDepID   string         `json:"mgm_dep_id" binding:"required,min=1,max=128" example:"mgm dep id"`                // 管理部门ID
	MgmDepName string         `json:"mgm_dep_name" binding:"required,min=1,max=128,VerifyName" example:"mgm dep name"` // 管理部门名称
}

func NewSummaryBaseInfo(m *model.TreeNode) *SummaryBaseInfo {
	if m == nil {
		return nil
	}
	return &SummaryBaseInfo{
		IDResp: response.IDResp{
			ID: m.ID,
		},
		CreateUpdateTime: response.NewCreateUpdateTime(m.CreatedAt, m.UpdatedAt),
		Name:             m.Name,
		ParentID:         m.ParentID,
		CategoryID:       m.CategoryNum,
		MgmDepID:         m.MgmDepID,
		MgmDepName:       m.MgmDepName,
	}
}

type SummaryInfo struct {
	*SummaryBaseInfo
	RawName          string         `json:"raw_name" binding:"required,min=1,max=128" example:"catalog_class_name"` // 目录类别原始的名称
	Expansion        bool           `json:"expansion" binding:"required" example:"true"`                            // TreeNode是否可展开
	DefaultExpansion bool           `json:"default_expansion" binding:"required" example:"false"`                   // TreeNode是否默认展开
	Children         []*SummaryInfo `json:"children,omitempty" binding:"omitempty"`                                 // 当前TreeNode的子Node列表
}

func NewSummaryInfo(m *model.TreeNodeExt, keyword string, defaultExpansion bool) *SummaryInfo {
	if m == nil {
		return nil
	}

	ret := &SummaryInfo{
		SummaryBaseInfo: NewSummaryBaseInfo(m.TreeNode),
		RawName:         m.Name,
		Expansion:       m.Expansion,
		Children:        nil,
	}

	if m.Hit && len(keyword) > 0 {
		// keyword命中的，需要高亮
		ret.Name = highlight(ret.Name, keyword)
	}

	if defaultExpansion {
		if m.NotDefaultExpansion {
			// 该node的子node的都不默认展开
			defaultExpansion = false
		} else {
			ret.DefaultExpansion = true
		}
	}

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

/////////////////// Get ///////////////////

type GetReqParam struct {
	IDPathParam      `param_type:"uri"`
	TreeIDQueryParam `param_type:"query"`
}

type GetRespParam struct {
	*SummaryBaseInfo
	response.CreateUpdateUser
	Describe *string `json:"describe" binding:"TrimSpace,omitempty,max=512,VerifyDescription" example:"catalog_class_desc"` // 目录类别描述
}

func NewGetRespParam(m *model.TreeNode, createUserName, updateUserName string) *GetRespParam {
	return &GetRespParam{
		SummaryBaseInfo:  NewSummaryBaseInfo(m),
		CreateUpdateUser: response.NewCreateUpdateUser(createUserName, updateUserName),
		Describe:         &m.Describe,
	}
}

/////////////////// Reorder ///////////////////

type ReorderReqParam struct {
	IDPathParam         `param_type:"uri"`
	TreeIDQueryParam    `param_type:"query"`
	ReorderReqBodyParam `param_type:"body"`
}

type ReorderReqBodyParam struct {
	DestParentID models.ModelID `json:"dest_parent_id" binding:"required,VerifyModelID=omit" example:"0"` // 移动到的目标父目录类别ID，为0表示移动到第一层级
	NextID       models.ModelID `json:"next_id" binding:"omitempty,VerifyModelID=omit" example:"1"`       // 将节点移动到该next_id节点的前面，不传或传0表示移动该dest_parent_id的子节点尾部
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

/////////////////// NameExistCheck ///////////////////

type NameExistReqParam struct {
	TreeIDQueryParam      `param_type:"query"`
	NameExistReqBodyParam `param_type:"body"`
}

type NameExistReqBodyParam struct {
	Name     *string         `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"tree_node_name"` // 节点名称
	CurID    *models.ModelID `json:"cur_id" binding:"omitempty,VerifyModelID=omit" example:"1"`                           // 当前在修改的节点ID
	ParentID models.ModelID  `json:"parent_id" binding:"omitempty,VerifyModelID=omit" example:"1"`                        // 要新增子节点的父节点ID，不传或传0表示在一级目录下检测
}

type NameExistRespParam struct {
	response.CheckRepeatResp
}
