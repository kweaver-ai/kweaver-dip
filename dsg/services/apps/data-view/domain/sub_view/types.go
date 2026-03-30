package sub_view

import (
	"encoding/json"
	"github.com/google/uuid"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/samber/lo"

	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

// Create 选项
type CreateSubViewOptions struct {
	// 是否检查当前用户是逻辑视图的 Owner
	CheckLogicViewOwner bool `json:"check_owner,omitempty"`
}

// List query 选项
type ListOptions struct {
	// 子视图所属逻辑视图的 ID
	//
	// gin 无法正确地 bind 字符串到 uuid.UUID 所以不需要定义 tag form
	LogicViewID uuid.UUID `json:"logic_view_id,omitempty"`
	// 页码
	Offset int `form:"offset,default=1" json:"offset,omitempty"`
	// 每页数量
	Limit int `form:"limit,default=10" json:"limit,omitempty"`
	// 排序的依据,为空时不排序
	Sort SortBy `form:"sort" json:"sort,omitempty"`
	// 排序的方向
	Direction Direction `form:"direction,default=asc" json:"direction,omitempty"`
}

// SortBy 定义排子视图的依据
type SortBy string

const (
	// 根据当前用户对子视图(行列规则)是否拥有权限排序。升序：无权限在前，有权限
	// 在后。降序：有权限在前，无权限在后。拥有 read，download 任意权限即为有权
	// 限
	SortByIsAuthorized SortBy = "is_authorized"
)

var SupportedSortBy = sets.New(
	SortByIsAuthorized,
)

// Direction 定义排序的方向
type Direction string

var (
	// 升序
	DirectionAscend Direction = "asc"
	// 降序
	DirectionDescend Direction = "desc"
)

var SupportedDirections = sets.New(
	DirectionAscend,
	DirectionDescend,
)

// RepositoryListOptions 返回 repository 层的 ListOptions
func (opts *ListOptions) RepositoryListOptions() repo.ListOptions {
	return repo.ListOptions{
		LogicViewID: opts.LogicViewID,
		Offset:      opts.Offset,
		Limit:       opts.Limit,
	}
}

// 列表
type List[T any] struct {
	Entries    []T `json:"entries"`
	TotalCount int `json:"total_count"`
}

// 子视图
type SubView struct {
	// ID
	ID uuid.UUID `json:"id,omitempty" path:"id"`
	// 名称
	Name string `json:"name,omitempty"`
	// 子视图所属逻辑视图的 ID
	LogicViewID uuid.UUID `json:"logic_view_id,omitempty"`
	// 当前用户是否可以授权该资源给其他人
	CanAuth bool `json:"can_auth"`
	//  授权范围, 可能是视图ID，可能是行列规则
	AuthScopeID uuid.UUID `json:"auth_scope_id,omitempty"`
	// 行列配置详情，JSON 格式，与下载数据接口的过滤条件结构相同
	Detail string `json:"detail,omitempty"`
}

func (s *SubView) ScopeType() authServiceV1.ObjectType {
	objectType := authServiceV1.ObjectSubView
	if s.LogicViewID.String() == s.AuthScopeID.String() {
		objectType = authServiceV1.ObjectDataView
	}
	return objectType
}

func (s *SubView) RuleDetail() (*SubViewDetail, error) {
	currentSubViewDetail := &SubViewDetail{}
	err := json.Unmarshal([]byte(s.Detail), &currentSubViewDetail)
	return currentSubViewDetail, err
}

// SubViewDetail 子视图（行列规则）详情
type SubViewDetail struct {
	//固定范围的字段，
	ScopeFields []string `json:"scope_fields,omitempty"`
	// 列、字段列表
	Fields []Field `json:"fields,omitempty"`
	// 行过滤规则
	RowFilters RowFilters `json:"row_filters,omitempty"`
	//固定的行过滤规则
	FixedRowFilters *RowFilters `json:"fixed_row_filters,omitempty"`
}

func (s *SubViewDetail) Str() string {
	return string(lo.T2(json.Marshal(s)).A)
}

// 列、字段
type Field struct {
	ID       string `json:"id,omitempty"`
	Name     string `json:"name,omitempty"`
	NameEn   string `json:"name_en,omitempty"`
	DataType string `json:"data_type,omitempty"`
}

// 行过滤条件
type RowFilters struct {
	// 条件组间关系
	WhereRelation string `json:"where_relation,omitempty"`
	// 条件组列表
	Where []Where `json:"where,omitempty"`
}

// 过滤条件
type Where struct {
	// 限定对象
	Member []Member `json:"member,omitempty"`
	// 限定关系
	Relation string `json:"relation,omitempty"`
}

type Member struct {
	Field `json:",inline"`
	// 限定条件
	Operator string `json:"operator,omitempty"`
	// 限定比较值
	Value string `json:"value,omitempty"`
}

// UpdateSubViewByModel 根据 Repository 层的 Model 更新 SubView
func UpdateSubViewByModel(sv *SubView, m *model.SubView) {
	sv.ID = m.ID
	sv.Name = m.Name
	sv.LogicViewID = m.LogicViewID
	sv.Detail = m.Detail
	sv.AuthScopeID = m.AuthScopeID
}

// Model 返回 Repository 层的 Model
func (s *SubView) Model() *model.SubView {
	return &model.SubView{
		ID:          s.ID,
		Name:        s.Name,
		LogicViewID: s.LogicViewID,
		AuthScopeID: s.AuthScopeID,
		Detail:      s.Detail,
	}
}

type ListIDReq struct {
	ListIDReqQuery `param_type:"query"`
}

type ListIDReqQuery struct {
	LogicViewID string `binding:"omitempty,uuid" form:"logic_view_id" json:"logic_view_id,omitempty"`
}

type ListSubViewsReq struct {
	ListSubViews `param_type:"query"`
}

// ListSubViews 批量查询视图的子视图，逗号分割
type ListSubViews struct {
	LogicViewID string `binding:"omitempty" form:"logic_view_id" json:"logic_view_id,omitempty"`
}
