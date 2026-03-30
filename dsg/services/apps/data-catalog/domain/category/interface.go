package category

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/middleware"
)

const MiddleMax uint64 = 1 << 31

type UseCase interface {
	Add(ctx context.Context, req *AddReqParama) (*CategorRespParam, error)
	Delete(ctx context.Context, req *DeleteReqParam) (*CategorRespParam, error)
	Edit(ctx context.Context, req *EditReqParam) (*CategorRespParam, error)
	EditUsing(ctx context.Context, req *EditUsingReqParam) (*CategorRespParam, error)
	NameExistCheck(ctx context.Context, req *NameExistReqParam) (*NameExistRespParam, error)
	BatchEdit(ctx context.Context, req []BatchEditReqParam) ([]CategorRespParam, error)
	GET(ctx context.Context, req *GetReqParam) (*CategoryInfo, error)
	GetAll(ctx context.Context, keyword *ListReqParam) (*ListCategoryRespParam, error)
}

type UseCaseTree interface {
	Add(ctx context.Context, req *AddTreeReqParama) (*TreeRespParam, error)
	Delete(ctx context.Context, req *DeleteTreeReqParam) (*TreeRespParam, error)
	Edit(ctx context.Context, req *EditTreeReqParam) (*TreeRespParam, error)
	NameExistCheck(ctx context.Context, req *NameTreeExistReqParam) (*NameExistRespParam, error)
	Reorder(ctx context.Context, req *RecoderReqParam) (*CategorRespParam, error)
}

// ///////////////// Common ///////////////////
type CategoryPathParam struct {
	CategoryID string `json:"category_id" uri:"category_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` //类目ID
}

type CategoryBodyParam struct {
	Name     string `json:"name" binding:"TrimSpace,required,min=1,max=32" example:"数据分类"`                      // 类目名称
	Describe string `json:"describe" binding:"TrimSpace,omitempty,max=300,VerifyDescription" example:"数据分类的描述"` // 类目描述
}

type CategorRespParam struct {
	ID string `json:"id"  example:"c9e795a5-324b-4986-9403-51c5528f508e"` // 对象ID
}

type NameExistQueryParam struct {
	Name string `json:"name" uri:"name" form:"name"  binding:"TrimSpace,required,min=1,max=32" example:"类目名称"`          // 类目名称
	ID   string `json:"id" uri:"id" form:"id" binding:"omitempty,uuid"  example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` //类目ID
	// ParentID string `json:"parent_id" uri:"parent_id" form:"parent_id" binding:"TrimSpace,omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`
}

type NameExistRespParam struct {
	response.CheckRepeatResp
}

// ///////////////// Add ///////////////////
type AddReqParama struct {
	CategoryBodyParam `param_type:"body"`
}

func (a *AddReqParama) ToModel(userInfo *middleware.User) *model.Category {
	m := &model.Category{
		Name:        a.Name,
		Description: a.Describe,
		Required:    0,
		Type:        "customize",
		Using:       0,
		SortWeight:  MiddleMax,
		CreatorUID:  userInfo.ID,
		CreatorName: userInfo.Name,
		UpdaterUID:  userInfo.ID,
		UpdaterName: userInfo.Name,
	}
	return m
}

// ///////////////// Delete ///////////////////
type DeleteReqParam struct {
	CategoryPathParam `param_type:"uri"`
}

// ///////////////// Edit ///////////////////
type EditReqParam struct {
	CategoryPathParam `param_type:"uri"`
	CategoryBodyParam `param_type:"body"`
}

func (e *EditReqParam) ToModel(userInfo *middleware.User) *model.Category {
	// id, _ := strconv.ParseInt(e.CategoryID, 10, 64)
	m := &model.Category{
		CategoryID:  e.CategoryID,
		Name:        e.Name,
		Description: e.Describe,
		UpdaterUID:  userInfo.ID,
		UpdaterName: userInfo.Name,
	}
	return m
}

// 停用、启用接口
type EditUsingReqParam struct {
	CategoryPathParam     `param_type:"uri"`
	EditUsingReqBodyParam `param_type:"body"`
}

func (e *EditUsingReqParam) ToModel(userInfo *middleware.User) *model.Category {
	using := 0
	if e.Using {
		using = 1
	}

	m := &model.Category{
		CategoryID:  e.CategoryID,
		Using:       using,
		SortWeight:  MiddleMax,
		UpdaterUID:  userInfo.ID,
		UpdaterName: userInfo.Name,
	}
	return m
}

type EditUsingReqBodyParam struct {
	Using bool `json:"using" binding:"omitempty" example:"true"`
}

// 批量修改指定类目排序和是否必填
type BatchEditParam struct {
	BatchEditReqParam `param_type:"body"`
}

type BatchEditReqParam struct {
	Index int    `json:"index" binding:"required" example:"1"`                                       // 排序
	ID    string `json:"id" binding:"required,uuid"  example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 类目ID
	// 仅支持排序调整，不再支持是否必填与应用范围批量修改
}

func (e *BatchEditReqParam) ToModel(userInfo *middleware.User) model.Category {
	m := model.Category{
		CategoryID:  e.ID,
		SortWeight:  uint64(e.Index),
		UpdaterUID:  userInfo.ID,
		UpdaterName: userInfo.Name,
	}
	return m
}

/////////////////// NameExistCheck ///////////////////

type NameExistReqParam struct {
	NameExistQueryParam `param_type:"query"`
}

// ///////////////// Get ///////////////////
type GetReqParam struct {
	CategoryPathParam `param_type:"uri"`
}

type ListReqParam struct {
	ListReqQueryParam `param_type:"query"`
}

type ListReqQueryParam struct {
	request.KeywordInfo
}

/////////////////// Common ///////////////////

type TreeRespParam = CategorRespParam

type IDPathParam struct {
	CategoryID string `json:"category_id" uri:"category_id" binding:"required,uuid"  example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`
}

type IDTreePathParam struct {
	CategoryID string `json:"category_id" uri:"category_id" binding:"required,uuid"  example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`
	NodeID     string `json:"node_id" uri:"node_id" binding:"required,uuid"  example:"664c3791-297e-44da-bfbb-2f1b82f3b671"`
}

type EditReqaBodyParam struct {
	Name     string `json:"name" binding:"TrimSpace,required,min=1,max=32"  example:"节点名称"`                     // 类目节点名称
	Owner    string `json:"owner" binding:"TrimSpace,omitempty,min=1,max=128"  example:"小王"`                    // 数据Owner
	OwnerUID string `json:"ownner_uid" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 数据Owner的uuid
	Required *bool  `json:"required,omitempty"`
	Selected *bool  `json:"selected,omitempty"`
}

/////////////////// AddTreeNode ///////////////////

type AddTreeReqParama struct {
	IDPathParam         `param_type:"uri"`
	AddTreeReqBodyParam `param_type:"body"`
}

func (a *AddTreeReqParama) ToModel(userInfo *middleware.User) *model.CategoryNode {
	m := &model.CategoryNode{
		CategoryID:  a.CategoryID,
		Name:        a.Name,
		ParentID:    a.ParentID,
		Owner:       a.Owner,
		OwnerUID:    a.OwnerUID,
		CreatorUID:  userInfo.ID,
		CreatorName: userInfo.Name,
		UpdaterUID:  userInfo.ID,
		UpdaterName: userInfo.Name,
	}
	// 非根节点新增：若未传递则采用默认值 required=false, selected=true
	if a.ParentID != "0" {
		// required
		if a.Required != nil {
			if *a.Required {
				m.Required = 1
			} else {
				m.Required = 0
			}
		} else {
			m.Required = 0
		}
		// selected
		if a.Selected != nil {
			if *a.Selected {
				m.Selected = 1
			} else {
				m.Selected = 0
			}
		} else {
			m.Selected = 1
		}
	}
	return m
}

type AddTreeReqBodyParam struct {
	ParentID string `json:"parent_id" binding:"required,uuid"  example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`   // 父类别ID，为0或不传时，为在一级目录下新增
	Name     string `json:"name" binding:"TrimSpace,required,min=1,max=32"  example:"类目名称"`                      // 类目节点名称
	Owner    string `json:"owner" binding:"TrimSpace,omitempty,min=1,max=128"  example:"小王"`                     // 数据Owner
	OwnerUID string `json:"ownner_uid" binding:"omitempty,uuid"  example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 数据Owner的uuid
	Required *bool  `json:"required,omitempty"`
	Selected *bool  `json:"selected,omitempty"`
}

/////////////////// DeleteTreeNode ///////////////////

type DeleteTreeReqParam struct {
	IDTreePathParam `param_type:"uri"`
}

/////////////////// EditTreeNode ///////////////////

type EditTreeReqParam struct {
	IDTreePathParam   `param_type:"uri"`
	EditReqaBodyParam `param_type:"body"`
}

func (a *EditTreeReqParam) ToModel(userInfo *middleware.User) *model.CategoryNode {
	m := &model.CategoryNode{
		CategoryID:     a.CategoryID,
		CategoryNodeID: a.NodeID,
		Name:           a.Name,
		Owner:          a.Owner,
		OwnerUID:       a.OwnerUID,
		UpdaterUID:     userInfo.ID,
		UpdaterName:    userInfo.Name,
	}
	return m
}

// /////////////////// NameExistCheck ///////////////////

type NameTreeExistReqParam struct {
	IDPathParam    `param_type:"uri"`
	TreeQueryParam `param_type:"query"`
}

type TreeQueryParam struct {
	ParentID string `json:"parent_id" uri:"parent_id" form:"parent_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 节点ID
	NodeID   string `json:"node_id" uri:"node_id" form:"node_id" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"`      // 节点ID
	Name     string `json:"name" uri:"name" form:"name" binding:"TrimSpace,required,min=1,max=32" example:"节点名称"`                              // 节点名称
}

// ///////////////// Recoder ///////////////////
type RecoderReqParam struct {
	CategoryPathParam `param_type:"uri"`
	RecpderParam      `param_type:"body"`
}

type RecpderParam struct {
	ID           string `json:"id" uri:"id" form:"id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b671"`                                     // 节点名称
	DestParentID string `json:"dest_parent_id" uri:"dest_parent_id" form:"dest_parent_id" binding:"required,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b672"` // 节点父目录
	NextID       string `json:"next_id" uri:"next_id" form:"next_id" binding:"omitempty,uuid" example:"664c3791-297e-44da-bfbb-2f1b82f3b673"`                     // 节点下一个节点id
}

type CategoryTreeBaseInfo struct {
	CategoryNodeID models.ModelID `json:"id" form:"id" binding:"required,min=1,max=32" example:"bb96c1f2-5c07-4a01-99a0-e65d25f8f8e1"`         // 类目编码
	ParentID       models.ModelID `json:"parent_id,omitempty" binding:"required,VerifyModelID" example:"bb96c1f2-5c07-4a01-99a0-e65d25f8f8e1"` // 目录类别父节点ID
	Name           string         `json:"name" binding:"required,min=1,max=128" example:"类目树节点一"`                                              // 目录类别名称
	Owner          string         `json:"owner" binding:"required,min=1,max=128" example:"小王"`
	OwnerUID       string         `json:"ownner_uid" example:"d68be29a-b6b4-11ef-8dc7-a624066a8dd7"`
	Required       bool           `json:"required"`
	Selected       bool           `json:"selected"`
}

func NewCategoryTreeBaseInfo(m *model.CategoryNode) *CategoryTreeBaseInfo {
	if m == nil {
		return nil
	}
	return &CategoryTreeBaseInfo{
		Name:           m.Name,
		ParentID:       models.ModelID(m.ParentID),
		Owner:          m.Owner,
		OwnerUID:       m.OwnerUID,
		CategoryNodeID: models.ModelID(m.CategoryNodeID),
		Required:       m.Required == 1,
		Selected:       m.Selected == 1,
	}
}

type CategoryTreeSummaryInfo struct {
	*CategoryTreeBaseInfo
	Children []*CategoryTreeSummaryInfo `json:"children,omitempty" binding:"omitempty"` // 当前TreeNode的子Node列表
}

func NewCategoryTreeSummaryInfo(m *model.CategoryNodeExt, defaultExpansion bool) *CategoryTreeSummaryInfo {
	if m == nil {
		return nil
	}

	ret := &CategoryTreeSummaryInfo{
		CategoryTreeBaseInfo: NewCategoryTreeBaseInfo(m.CategoryNode),
		Children:             nil,
	}

	if len(m.Children) < 1 {
		return ret
	}

	ret.Children = make([]*CategoryTreeSummaryInfo, 0, len(m.Children))
	for _, child := range m.Children {
		ret.Children = append(ret.Children, NewCategoryTreeSummaryInfo(child, defaultExpansion))
	}

	return ret
}

type CategoryInfo struct {
	ID             string             `json:"id" binding:"required" example:"d7549ded-f226-44a2-937a-6731eb256940"`               // 对象ID
	Name           string             `json:"name" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"数据分类"`          // 类目名称
	Describe       string             `json:"describe" binding:"TrimSpace,omitempty,max=255,VerifyDescription" example:"数据分类的描述"` // 类目描述
	Using          bool               `json:"using" form:"using" example:"false"`                                                 // 是否启用
	Required       bool               `json:"required" binding:"" example:"true"`                                                 // 是否必填
	Type           string             `json:"type" binding:"TrimSpace,required,min=1,max=128,VerifyName" example:"customize"`     // 类型：customize(自定义的), system(系统）
	ApplyScopeInfo []model.ApplyScope `json:"apply_scope_info" binding:"omitempty"`                                               // 应用范围
	response.CreateUpdateTime
	response.CreateUpdateUser
	TreeNode []*CategoryTreeSummaryInfo `json:"tree_node" `
}

type ListTreeRespParam struct {
	response.PageResult[CategoryTreeSummaryInfo]
}

func NewListTreeRespParam(nodes []*model.CategoryNodeExt, defaultExpansion bool) []*CategoryTreeSummaryInfo {
	ret := make([]*CategoryTreeSummaryInfo, len(nodes))
	for i, node := range nodes {
		ret[i] = NewCategoryTreeSummaryInfo(node, defaultExpansion)
	}

	return ret

	// return &ListTreeRespParam{
	// 	PageResult: response.PageResult[SummaryInfo]{
	// 		Entries:    ret,
	// 		TotalCount: int64(len(ret)),
	// 	},
	// }
}

type ListCategoryRespParam struct {
	response.PageResult[CategoryInfo]
}
