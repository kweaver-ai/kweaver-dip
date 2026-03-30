package grade_rule_group

import "context"

// GradeRuleGroupUseCase 是分级规则组用例接口
// 定义了分级规则组相关的业务逻辑操作
type GradeRuleGroupUseCase interface {
	// List 获取规则组数据
	List(ctx context.Context, req *GradeRuleGroupListReq) (*GradeRuleGroupListResp, error)

	// Create 新增规则组
	Create(ctx context.Context, req *GradeRuleGroupCreateReq) (*GradeRuleGroupCreateResp, error)

	// Update 编辑规则组
	Update(ctx context.Context, req *GradeRuleGroupUpdateReq) (*GradeRuleGroupUpdateResp, error)

	// Delete 删除规则组
	Delete(ctx context.Context, req *GradeRuleGroupDeleteReq) (*GradeRuleGroupDeleteResp, error)

	// Repeat 规则组验重
	Repeat(ctx context.Context, req *GradeRuleGroupRepeatReq) (*GradeRuleGroupRepeatResp, error)

	// Limited 规则组数量上限检查
	Limited(ctx context.Context, req *GradeRuleGroupLimitedReq) (*GradeRuleGroupLimitedResp, error)
}

type GradeRuleGroup struct {
	ID               string `json:"id"`                 // ID
	Name             string `json:"name"`               // 名称
	Description      string `json:"description"`        // 描述
	BusinessObjectID string `json:"business_object_id"` // 业务对象ID
	CreatedAt        int64  `json:"created_at"`         // 创建时间
	UpdatedAt        int64  `json:"updated_at"`         // 更新时间
}

type IDReqParamPath struct {
	ID string `json:"-" uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type PageResultNew[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type GradeRuleGroupListReq struct {
	GradeRuleGroupListReqQueryParam `param_type:"query"`
}

type GradeRuleGroupListReqQueryParam struct {
	BusinessObjectID string `json:"business_object_id" form:"business_object_id" binding:"required"`
}

type GradeRuleGroupListResp struct {
	PageResultNew[GradeRuleGroup]
}

type GradeRuleGroupCreateReq struct {
	GradeRuleGroupCreateBody `param_type:"body"`
}

type GradeRuleGroupCreateBody struct {
	Name             string `json:"name" binding:"required,TrimSpace"`               // 名称
	Description      string `json:"description"`                                     // 描述
	BusinessObjectID string `json:"business_object_id" binding:"required,TrimSpace"` // 业务对象ID
}

type GradeRuleGroupCreateResp struct {
	ID string `json:"id"`
}

type GradeRuleGroupUpdateReq struct {
	IDReqParamPath           `param_type:"path"`
	GradeRuleGroupUpdateBody `param_type:"body"`
}

type GradeRuleGroupUpdateBody struct {
	Name        string `json:"name" binding:"required,TrimSpace"`
	Description string `json:"description"`
}

type GradeRuleGroupUpdateResp struct {
	ID string `json:"id"`
}

type GradeRuleGroupDeleteReq struct {
	IDReqParamPath `param_type:"path"`
}

type GradeRuleGroupDeleteResp struct {
	ID string `json:"id"`
}

type GradeRuleGroupRepeatReq struct {
	GradeRuleGroupRepeatBody `param_type:"body"`
}

type GradeRuleGroupRepeatBody struct {
	ID               string `json:"id"`
	Name             string `json:"name" binding:"required,TrimSpace"`
	BusinessObjectID string `json:"business_object_id" binding:"required,TrimSpace"`
}

type GradeRuleGroupRepeatResp struct {
	Repeat bool `json:"repeat"`
}

type GradeRuleGroupLimitedReq struct {
	GradeRuleGroupLimitedReqQueryParam `param_type:"query"`
}

type GradeRuleGroupLimitedReqQueryParam struct {
	BusinessObjectID string `json:"business_object_id" form:"business_object_id" binding:"required"`
}

type GradeRuleGroupLimitedResp struct {
	Limited bool `json:"limited"`
}
