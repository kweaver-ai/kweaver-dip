package sub_service

import (
	"encoding/json"

	"github.com/google/uuid"
	repo "github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	authServiceV1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
)

// CreateSubServiceOptions 选项
type CreateSubServiceOptions struct {
	// 是否检查当前用户是逻辑视图的 Owner
	CheckLogicViewOwner bool `json:"check_owner,omitempty"`
}

// ListOptions query 选项
type ListOptions struct {
	// 子视图所属逻辑视图的 ID
	//
	// gin 无法正确地 bind 字符串到 uuid.UUID 所以不需要定义 tag form
	ServiceID uuid.UUID `json:"service_id,omitempty"`
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
	//SortByIsAuthorized 根据当前用户对子视图(行列规则)是否拥有权限排序。升序：无权限在前，有权限
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
	DirectionAscend  Direction = "asc"
	DirectionDescend Direction = "desc"
)

var SupportedDirections = sets.New(
	DirectionAscend,
	DirectionDescend,
)

// RepositoryListOptions 返回 repository 层的 ListOptions
func (opts *ListOptions) RepositoryListOptions() repo.ListOptions {
	return repo.ListOptions{
		ServiceID: opts.ServiceID,
		Offset:    opts.Offset,
		Limit:     opts.Limit,
	}
}

// List 列表
type List[T any] struct {
	Entries    []T `json:"entries"`
	TotalCount int `json:"total_count"`
}

// SubService 子视图
type SubService struct {
	// ID
	ID uuid.UUID `json:"id,omitempty" path:"id"`
	// 名称
	Name string `json:"name,omitempty"`
	// 子视图所属逻辑视图的 ID
	ServiceID uuid.UUID `json:"service_id,omitempty"`
	//  授权范围, 可能是视图ID，可能是行列规则
	AuthScopeID uuid.UUID `json:"auth_scope_id,omitempty"`
	//当前用户是否有该子接口的授权权限
	CanAuth bool `json:"can_auth,omitempty"`
	// 行列配置详情，JSON 格式，与下载数据接口的过滤条件结构相同
	Detail string `json:"detail,omitempty"`
}

func (s *SubService) ScopeType() authServiceV1.ObjectType {
	objectType := authServiceV1.ObjectSubService
	if s.ServiceID.String() == s.AuthScopeID.String() {
		objectType = authServiceV1.ObjectAPI
	}
	return objectType
}

// SubServiceDetail 接口行列规则详情
type SubServiceDetail struct {
	//固定的字段ID
	ScopeFields []string `json:"scope_fields"`
	// 行过滤规则
	RowFilters RowFilters `json:"row_filters,omitempty"`
	//固定的行过滤规则
	FixedRowFilters *RowFilters `json:"fixed_row_filters,omitempty"`
}

// Field 列、字段
type Field struct {
	ID       string `json:"id,omitempty"`
	Name     string `json:"name,omitempty"`
	NameEn   string `json:"name_en,omitempty"`
	DataType string `json:"data_type,omitempty"`
}

// RowFilters 行过滤条件
type RowFilters struct {
	// 条件组间关系
	WhereRelation string `json:"where_relation,omitempty"`
	// 条件组列表
	Where []Where `json:"where,omitempty"`
}

// Where 过滤条件
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

// GenSubServiceByModel 根据 Repository 层的 Model 更新 SubService
func GenSubServiceByModel(m *model.SubService) *SubService {
	detail := &SubServiceDetail{}
	json.Unmarshal([]byte(m.Detail), detail)
	return &SubService{
		ID:          m.ID,
		Name:        m.Name,
		ServiceID:   m.ServiceID,
		AuthScopeID: m.AuthScopeID,
		Detail:      m.Detail,
	}
}

// Model 返回 Repository 层的 Model
func (s *SubService) Model() *model.SubService {
	return &model.SubService{
		ID:          s.ID,
		Name:        s.Name,
		AuthScopeID: s.AuthScopeID,
		ServiceID:   s.ServiceID,
		Detail:      s.Detail,
	}
}

type ListIDReq struct {
	ListIDReqQuery `param_type:"query"`
}

type ListIDReqQuery struct {
	ServiceID string `binding:"omitempty,uuid" form:"service_id" json:"service_id,omitempty"`
}

type ListSubServicesReq struct {
	ListSubServices `param_type:"query"`
}

// ListSubServices 批量查询视图的子视图，逗号分割
type ListSubServices struct {
	ServiceID string `binding:"required" form:"service_id" json:"service_id,omitempty"`
}
