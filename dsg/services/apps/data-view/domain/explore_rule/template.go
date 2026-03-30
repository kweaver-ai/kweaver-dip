package explore_rule

//region CreateTemplateRuleReq

type CreateTemplateRuleReq struct {
	CreateTemplateRuleReqBody `param_type:"body"`
}

type CreateTemplateRuleReqBody struct {
	RuleName        string  `json:"rule_name" form:"rule_name" binding:"required,min=1,max=128"`                                                                 // 规则名称
	RuleDescription string  `json:"rule_description" form:"rule_description" binding:"omitempty,min=1,max=300"`                                                  // 规则描述
	RuleLevel       string  `json:"rule_level" form:"rule_level" binding:"required,oneof=metadata field row view"`                                               // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension" form:"dimension" binding:"required,oneof=completeness standardization uniqueness accuracy consistency timeliness"` // 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计
	DimensionType   string  `json:"dimension_type" form:"dimension_type" binding:"omitempty,oneof=row_null row_repeat null dict repeat format custom"`           // 维度类型,行数据空值项检查 行数据重复值检查 空值项检查 码值检查 重复值检查 格式检查 自定义规则
	RuleConfig      *string `json:"rule_config" form:"rule_config" binding:"omitempty"`                                                                          // 规则配置
	Enable          *bool   `json:"enable" form:"enable" binding:"required"`                                                                                     // 是否启用
}

type TemplateRuleIDResp struct {
	RuleID string `json:"rule_id"` // 规则id
}

type TemplateRuleConfig struct {
	Null           []string             `json:"null" form:"null" binding:"omitempty,dive"`
	Dict           *Dict                `json:"dict" form:"dict" binding:"omitempty"`
	Format         *Format              `json:"format" form:"format" binding:"omitempty"`
	RuleExpression *RuleExpression      `json:"rule_expression" form:"rule_expression" binding:"omitempty"`
	Filter         *RuleExpression      `json:"filter" form:"filter" binding:"omitempty"`
	RowNull        *TemplateRuleRowNull `json:"row_null" form:"row_null" binding:"omitempty"`
	UpdatePeriod   *string              `json:"update_period" form:"update_period" binding:"omitempty,oneof=day week month quarter half_a_year year"`
}

type TemplateRuleRowNull struct {
	Config []string `json:"config" form:"config" binding:"required,dive"`
}

//endregion

//region GetTemplateRuleListReq

type GetTemplateRuleListReq struct {
	GetTemplateRuleListReqQuery `param_type:"query"`
}

type GetTemplateRuleListReqQuery struct {
	RuleLevel     string `json:"rule_level" form:"rule_level" binding:"omitempty,oneof=metadata field row view"`                                                               // 规则级别，元数据级 字段级 行级 视图级
	Dimension     string `json:"dimension" form:"dimension" binding:"omitempty,oneof=completeness standardization uniqueness accuracy consistency timeliness data_statistics"` // 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计
	DimensionType string `json:"dimension_type" form:"dimension_type" binding:"omitempty,oneof=row_null row_repeat null dict repeat format custom"`                            // 维度类型,行数据空值项检查 行数据重复值检查 空值项检查 码值检查 重复值检查 格式检查 自定义规则
	Direction     string `json:"direction" form:"direction,default=desc" binding:"oneof=asc desc" default:"desc"`                                                              // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort          string `json:"sort" form:"sort,default=created_at" binding:"oneof=created_at updated_at"  default:"created_at"`                                              // 排序类型，枚举：created_at：按创建时间排序；updated_at：按更新时间排序。默认按创建时间排序
	Keyword       string `json:"keyword" form:"keyword" binding:"KeywordTrimSpace,omitempty,min=1,max=128"`                                                                    // 关键字查询
	Enable        *bool  `json:"enable" form:"enable" binding:"omitempty"`                                                                                                     // 启用状态，true为已启用，false为未启用，不传该参数则不跟据启用状态筛选
}

type GetTemplateRuleListResp struct {
	RuleId          string  `json:"rule_id"`               // 规则id
	RuleName        string  `json:"rule_name"`             // 规则名称
	RuleDescription string  `json:"rule_description"`      // 规则描述
	RuleLevel       string  `json:"rule_level"`            // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension"`             // 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计
	DimensionType   string  `json:"dimension_type"`        // 维度类型,行数据空值项检查 行数据重复值检查 空值项检查 码值检查 重复值检查 格式检查 自定义规则
	RuleConfig      *string `json:"rule_config,omitempty"` // 规则配置
	Enable          bool    `json:"enable"`                // 是否启用
	Source          string  `json:"source"`                // 来源,internal:系统预置 custom:自定义
	UpdatedAt       int64   `json:"updated_at"`            // 更新时间
}

//endregion

//region GetTemplateRuleReq

type GetTemplateRuleReq struct {
	RuleIDReqPath `param_type:"path"`
}

type GetTemplateRuleResp struct {
	RuleId          string  `json:"rule_id"`          // 规则id
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription string  `json:"rule_description"` // 规则描述
	RuleLevel       string  `json:"rule_level"`       // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension"`        // 维度，完整性 规范性 唯一性 准确性 一致性 及时性
	DimensionType   string  `json:"dimension_type"`   // 维度类型,行数据空值项检查 行数据重复值检查 空值项检查 码值检查 重复值检查 格式检查 自定义规则
	RuleConfig      *string `json:"rule_config"`      // 规则配置
	Enable          bool    `json:"enable"`           // 是否启用
	Source          string  `json:"source"`           // 来源,internal:系统预置 custom:自定义
	UpdatedAt       int64   `json:"updated_at"`       // 更新时间
}

//endregion

//region TemplateRuleNameRepeatReq

type TemplateRuleNameRepeatReq struct {
	TemplateRuleNameRepeatReqQuery `param_type:"query"`
}

type TemplateRuleNameRepeatReqQuery struct {
	RuleId   string `json:"rule_id" form:"rule_id" binding:"omitempty,uuid"`             // 规则id
	RuleName string `json:"rule_name" form:"rule_name" binding:"required,min=1,max=128"` // 规则名称
}

//endregion

//region UpdateTemplateRuleReq

type UpdateTemplateRuleReq struct {
	RuleIDReqPath             `param_type:"path"`
	CreateTemplateRuleReqBody `param_type:"body"`
}

//endregion

//region UpdateTemplateRuleStatusReq

type UpdateTemplateRuleStatusReq struct {
	UpdateTemplateRuleStatusReqBody `param_type:"body"`
}

type UpdateTemplateRuleStatusReqBody struct {
	Enable *bool  `json:"enable" form:"enable" binding:"required"`        // 是否启用
	RuleId string `json:"rule_id" form:"rule_id" binding:"required,uuid"` // 规则id
}

//endregion

//region UpdateTemplateRuleReq

type DeleteTemplateRuleReq struct {
	RuleIDReqPath `param_type:"path"`
}

//endregion
