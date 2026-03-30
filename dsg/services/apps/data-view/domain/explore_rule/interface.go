package explore_rule

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

type ExploreRuleUseCase interface {
	CreateTemplateRule(ctx context.Context, req *CreateTemplateRuleReq) (*TemplateRuleIDResp, error)
	GetTemplateRuleList(ctx context.Context, req *GetTemplateRuleListReq) ([]*GetTemplateRuleResp, error)
	GetTemplateRule(ctx context.Context, req *GetTemplateRuleReq) (*GetTemplateRuleResp, error)
	TemplateRuleNameRepeat(ctx context.Context, req *TemplateRuleNameRepeatReq) (bool, error)
	UpdateTemplateRule(ctx context.Context, req *UpdateTemplateRuleReq) (*TemplateRuleIDResp, error)
	UpdateTemplateRuleStatus(ctx context.Context, req *UpdateTemplateRuleStatusReq) (bool, error)
	DeleteTemplateRule(ctx context.Context, req *DeleteTemplateRuleReq) (*TemplateRuleIDResp, error)

	CreateRule(ctx context.Context, req *CreateRuleReq) (*RuleIDResp, error)
	BatchCreateRule(ctx context.Context, req *BatchCreateRuleReq) (*BatchCreateRuleResp, error)
	GetRuleList(ctx context.Context, req *GetRuleListReq) ([]*GetRuleResp, error)
	GetRule(ctx context.Context, req *GetRuleReq) (*GetRuleResp, error)
	NameRepeat(ctx context.Context, req *NameRepeatReq) (bool, error)
	UpdateRule(ctx context.Context, req *UpdateRuleReq) (*RuleIDResp, error)
	UpdateRuleStatus(ctx context.Context, req *UpdateRuleStatusReq) (bool, error)
	DeleteRule(ctx context.Context, req *DeleteRuleReq) (*RuleIDResp, error)
}

//region CreateRuleReq

type CreateRuleReq struct {
	CreateRuleReqBody `param_type:"body"`
}

type CreateRuleReqBody struct {
	TemplateId      string  `json:"template_id" form:"template_id" binding:"omitempty,uuid" example:"3d397df3-d1af-4126-b3ad-539fd7ae2f54"`                       // 模板id
	FormViewId      string  `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"`                     // 视图id
	FieldId         string  `json:"field_id" form:"field_id" binding:"omitempty,uuid" example:"962b749f-32e6-41d1-bd79-33ce839a8598"`                             // 字段id
	RuleName        string  `json:"rule_name" form:"rule_name" binding:"omitempty,min=1,max=128"`                                                                 // 规则名称
	RuleDescription string  `json:"rule_description" form:"rule_description" binding:"omitempty,min=1,max=300"`                                                   // 规则描述
	RuleLevel       string  `json:"rule_level" form:"rule_level" binding:"omitempty,oneof=metadata field row view"`                                               // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension" form:"dimension" binding:"omitempty,oneof=completeness standardization uniqueness accuracy consistency timeliness"` // 维度，完整性 规范性 唯一性 准确性 一致性 及时性 数据统计
	DimensionType   string  `json:"dimension_type" form:"dimension_type" binding:"omitempty,oneof=row_null row_repeat null dict repeat format custom"`            // 维度类型,行数据空值项检查 行数据重复值检查 空值项检查 码值检查 重复值检查 格式检查 自定义规则                                                                  // 维度类型
	RuleConfig      *string `json:"rule_config" form:"rule_config" binding:"omitempty"`                                                                           // 规则配置
	Enable          *bool   `json:"enable" form:"enable" binding:"required"`                                                                                      // 是否启用
	Draft           *bool   `json:"draft" form:"draft" binding:"omitempty"`                                                                                       // 是否草稿
}

type RuleIDResp struct {
	RuleID string `json:"rule_id"` // 规则id
}

type RuleConfig struct {
	Null           []string        `json:"null" form:"null" binding:"omitempty,dive"`
	Dict           *Dict           `json:"dict" form:"dict" binding:"omitempty"`
	Format         *Format         `json:"format" form:"format" binding:"omitempty"`
	RuleExpression *RuleExpression `json:"rule_expression" form:"rule_expression" binding:"omitempty"`
	Filter         *RuleExpression `json:"filter" form:"filter" binding:"omitempty"`
	RowNull        *RowNull        `json:"row_null" form:"row_null" binding:"omitempty"`
	RowRepeat      *RowRepeat      `json:"row_repeat" form:"row_repeat" binding:"omitempty"`
	UpdatePeriod   *string         `json:"update_period" form:"update_period" binding:"omitempty,oneof=day week month quarter half_a_year year"`
}

type Dict struct {
	DictId   string `json:"dict_id" form:"dict_id" binding:"omitempty"`
	DictName string `json:"dict_name" form:"dict_name" binding:"required"`
	Data     []Data `json:"data" form:"data" binding:"required,dive"`
}

type Data struct {
	Code  string `json:"code" form:"code" binding:"required"`
	Value string `json:"value" form:"value" binding:"required"`
}

type Format struct {
	CodeRuleId string `json:"code_rule_id" form:"code_rule_id" binding:"omitempty"`
	Regex      string `json:"regex" form:"regex" binding:"required"`
}

type RuleExpression struct {
	WhereRelation string   `json:"where_relation" form:"where_relation" binding:"omitempty"`
	Where         []*Where `json:"where" form:"where" binding:"omitempty,dive"`
	Sql           string   `json:"sql" form:"sql" binding:"omitempty"`
}

type Where struct {
	Member   []*Member `json:"member" form:"member" binding:"omitempty,dive"` // 限定对象
	Relation string    `json:"relation" form:"relation" binding:"omitempty"`  // 限定关系
}

type Member struct {
	FieldId  string `json:"id" form:"id" binding:"required"`             // 字段对象
	Operator string `json:"operator" form:"operator" binding:"required"` // 限定条件
	Value    string `json:"value" form:"value" binding:"required"`       // 限定比较值
}

type RowNull struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid,unique"`
	Config   []string `json:"config" form:"config" binding:"required,dive"`
}

type RowRepeat struct {
	FieldIds []string `json:"field_ids" form:"field_ids" binding:"required,dive,uuid,unique"`
}

//endregion

//region CreateRuleReq

type BatchCreateRuleReq struct {
	BatchCreateRuleReqBody `param_type:"body"`
}

type BatchCreateRuleReqBody struct {
	FormViewId string `json:"form_view_id" form:"form_view_id" binding:"required,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 视图id
	RuleLevel  string `json:"rule_level" form:"rule_level" binding:"required,oneof=metadata field"`                                    // 规则级别，元数据级 字段级
}

type BatchCreateRuleResp struct {
	FormViewId string `json:"form_view_id"` // 规则id
}

//endregion

//region GetRuleListReq

type GetRuleListReq struct {
	explore_task.GetRuleListReqQuery `param_type:"query"`
}

type GetRuleListResp struct {
	RuleId          string  `json:"rule_id"`               // 规则id
	RuleName        string  `json:"rule_name"`             // 规则名称
	RuleDescription string  `json:"rule_description"`      // 规则描述
	RuleLevel       string  `json:"rule_level"`            // 规则级别，元数据级 字段级 行级 视图级
	Dimension       string  `json:"dimension"`             // 维度
	RuleConfig      *string `json:"rule_config,omitempty"` // 规则配置
	Enable          bool    `json:"enable"`                // 是否启用
}

//endregion

//region GetRuleReq

type RuleIDReqPath struct {
	RuleId string `json:"id" uri:"id" binding:"required,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 规则id
}

type GetRuleReq struct {
	RuleIDReqPath `param_type:"path"`
}

type GetRuleResp struct {
	RuleId          string  `json:"rule_id"`          // 规则id
	RuleName        string  `json:"rule_name"`        // 规则名称
	RuleDescription string  `json:"rule_description"` // 规则描述
	RuleLevel       string  `json:"rule_level"`       // 规则级别，元数据级 字段级 行级 视图级
	FieldId         string  `json:"field_id"`         // 字段id
	Dimension       string  `json:"dimension"`        // 维度，完整性 规范性 唯一性 准确性 一致性 及时性
	DimensionType   string  `json:"dimension_type"`   // 维度类型
	RuleConfig      *string `json:"rule_config"`      // 规则配置
	Enable          bool    `json:"enable"`           // 是否启用
	Draft           bool    `json:"draft"`            // 是否草稿
	TemplateId      string  `json:"template_id"`      // 模板id
}

//endregion

//region NameRepeatReq

type NameRepeatReq struct {
	NameRepeatReqQuery `param_type:"query"`
}

type NameRepeatReqQuery struct {
	FormViewId string `json:"form_view_id" form:"form_view_id" binding:"omitempty,uuid" example:"13b8a80b-1914-4896-99d8-51559dba26c4"` // 视图id
	FieldId    string `json:"field_id" form:"field_id" binding:"omitempty,uuid"`                                                        // 字段id
	RuleId     string `json:"rule_id" form:"rule_id" binding:"omitempty,uuid"`                                                          // 规则id
	RuleName   string `json:"rule_name" form:"rule_name" binding:"required,min=1,max=128"`                                              // 规则名称
}

//endregion

//region UpdateRuleReq

type UpdateRuleReq struct {
	RuleIDReqPath     `param_type:"path"`
	UpdateRuleReqBody `param_type:"body"`
}

type UpdateRuleReqBody struct {
	RuleName        string  `json:"rule_name" form:"rule_name" binding:"required,min=1,max=128"`                // 规则名称
	RuleDescription string  `json:"rule_description" form:"rule_description" binding:"omitempty,min=1,max=300"` // 规则描述
	RuleConfig      *string `json:"rule_config" form:"rule_config" binding:"omitempty"`                         // 规则配置
	Enable          *bool   `json:"enable" form:"enable" binding:"omitempty"`                                   // 是否启用
	Draft           *bool   `json:"draft" form:"draft" binding:"omitempty"`                                     // 是否草稿
}

//endregion

//region UpdateRuleStatusReq

type UpdateRuleStatusReq struct {
	UpdateRuleStatusReqBody `param_type:"body"`
}

type UpdateRuleStatusReqBody struct {
	Enable  *bool    `json:"enable" form:"enable" binding:"required"`                      // 是否启用
	RuleIds []string `json:"rule_ids" form:"rule_ids" binding:"required,unique,dive,uuid"` // 规则id数组
}

//endregion

//region UpdateRuleReq

type DeleteRuleReq struct {
	RuleIDReqPath `param_type:"path"`
}

//endregion

type RuleLevel enum.Object

var (
	RuleLevelMetadata = enum.New[RuleLevel](1, "metadata") // 元数据级
	RuleLevelField    = enum.New[RuleLevel](2, "field")    // 字段级
	RuleLevelRow      = enum.New[RuleLevel](3, "row")      // 行级
	RuleLevelView     = enum.New[RuleLevel](4, "view")     // 视图级
)

type Dimension enum.Object

var (
	DimensionCompleteness    = enum.New[Dimension](1, "completeness")    // 完整性
	DimensionStandardization = enum.New[Dimension](2, "standardization") // 规范性
	DimensionUniqueness      = enum.New[Dimension](3, "uniqueness")      // 唯一性
	DimensionAccuracy        = enum.New[Dimension](4, "accuracy")        // 准确性
	DimensionConsistency     = enum.New[Dimension](5, "consistency")     // 一致性
	DimensionTimeliness      = enum.New[Dimension](6, "timeliness")      // 及时性
	DimensionDataStatistics  = enum.New[Dimension](7, "data_statistics") // 数据统计
)

type DimensionType enum.Object

var (
	DimensionTypeRowNull   = enum.New[DimensionType](1, "row_null")   // 行数据空值项检查
	DimensionTypeRowRepeat = enum.New[DimensionType](2, "row_repeat") // 行数据重复值检查
	DimensionTypeNull      = enum.New[DimensionType](3, "null")       // 空值项检查
	DimensionTypeDict      = enum.New[DimensionType](4, "dict")       // 码值检查
	DimensionTypeRepeat    = enum.New[DimensionType](5, "repeat")     // 重复值检查
	DimensionTypeFormat    = enum.New[DimensionType](6, "format")     // 格式检查
	DimensionTypeCustom    = enum.New[DimensionType](7, "custom")     // 自定义规则
)

type Source enum.Object

var (
	SourceInternal = enum.New[Source](1, "internal") // 系统预置
	SourceCustom   = enum.New[Source](2, "custom")   // 自定义
)

var (
	RuleViewDescription  = "表注释检查"   // 表注释检查
	RuleFieldDescription = "字段注释检查"  // 字段注释检查
	RuleDataType         = "数据类型检查"  // 数据类型检查
	RuleNull             = "空值项检查"   // 空值项检查
	RuleDict             = "码值检查"    // 码值检查
	RuleFormat           = "格式检查"    // 格式检查
	RuleRowNull          = "行级空值项检查" // 行级空值项检查
	RuleRowRepeat        = "行级重复值检查" // 行级重复值检查
	RuleUpdatePeriod     = "更新周期"    // 更新周期
	RuleOther            = "无配置"     // 无配置
)

var TemplateRuleMap = map[string]string{
	"4662a178-140f-4869-88eb-57f789baf1d3": RuleOther,        // 表注释检查
	"931bf4e4-914e-4bff-af0c-ca57b63d1619": RuleOther,        // 字段注释检查
	"c2c65844-5573-4306-92d7-d3f9ac2edbf6": RuleOther,        // 数据类型检查
	"cf0b5b51-79f1-4cb3-8f0c-be0c3ad25e55": RuleNull,         // 空值项检查
	"fcbad175-862e-4d24-882c-c6dd96d9f4f2": RuleDict,         // 码值检查
	"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc": RuleOther,        // 重复值检查
	"0e75ad19-a39b-4e41-b8f1-e3cee8880182": RuleFormat,       // 格式检查
	"442f627c-b9bd-43f6-a3b1-b048525276a2": RuleRowNull,      // 行级空值项检查
	"401f8069-21e5-4dd0-bfa8-432f2635f46c": RuleRowRepeat,    // 行级重复值检查
	"f7447b7a-13a6-4190-9d0d-623af08bedea": RuleUpdatePeriod, // 数据及时性检查
	"0c790158-9721-41ce-b8b3-b90341575485": RuleOther,        // 最大值
	"73271129-2ae3-47aa-83c5-6c0bf002140c": RuleOther,        // 最小值
	"91920b32-b884-4d23-a649-0518b038bf3b": RuleOther,        // 分位数
	"fd9fa13a-40db-4283-9c04-bf0ff3edcb32": RuleOther,        // 平均值统计
	"06ad1362-9545-415d-9278-265e3abe7c10": RuleOther,        // 标准差统计
	"96ac5dc0-2e5c-4397-87a7-8414dddf8179": RuleOther,        // 枚举值分布
	"95e5b917-6313-4bd0-8812-bf0d4aa68d73": RuleOther,        // 天分布
	"69c3d959-1c72-422b-959d-7135f52e4f9c": RuleOther,        // 月分布
	"709fca1a-4640-4cd7-94ed-50b1b16e0aa5": RuleOther,        // 年分布
	"ae0f6573-b3e0-4be2-8330-a643261f8a18": RuleOther,        // TRUE值数
	"45a4b3cb-b93c-469d-b3b4-631a3b8db5fe": RuleOther,        // FALSE值数
}

var ValidPeriods = map[string]bool{
	"day":         true,
	"week":        true,
	"month":       true,
	"quarter":     true,
	"half_a_year": true,
	"year":        true,
}

var (
	ColTypeInternalRuleMap = map[string][]string{
		constant.SimpleInt: {
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc",
			"0c790158-9721-41ce-b8b3-b90341575485",
			"73271129-2ae3-47aa-83c5-6c0bf002140c",
			"91920b32-b884-4d23-a649-0518b038bf3b",
			"fd9fa13a-40db-4283-9c04-bf0ff3edcb32",
			"06ad1362-9545-415d-9278-265e3abe7c10",
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179"},
		constant.SimpleFloat: {
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc",
			"0c790158-9721-41ce-b8b3-b90341575485",
			"73271129-2ae3-47aa-83c5-6c0bf002140c",
			"91920b32-b884-4d23-a649-0518b038bf3b",
			"fd9fa13a-40db-4283-9c04-bf0ff3edcb32",
			"06ad1362-9545-415d-9278-265e3abe7c10",
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179"},
		constant.SimpleDecimal: {
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc",
			"0c790158-9721-41ce-b8b3-b90341575485",
			"73271129-2ae3-47aa-83c5-6c0bf002140c",
			"91920b32-b884-4d23-a649-0518b038bf3b",
			"fd9fa13a-40db-4283-9c04-bf0ff3edcb32",
			"06ad1362-9545-415d-9278-265e3abe7c10",
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179"},
		constant.SimpleChar: {
			"6d8d7fdc-8cc4-4e89-a5dd-9b8d07a685dc",
			"96ac5dc0-2e5c-4397-87a7-8414dddf8179"},
		constant.SimpleDate: {
			"0c790158-9721-41ce-b8b3-b90341575485",
			"73271129-2ae3-47aa-83c5-6c0bf002140c",
			"95e5b917-6313-4bd0-8812-bf0d4aa68d73",
			"69c3d959-1c72-422b-959d-7135f52e4f9c",
			"709fca1a-4640-4cd7-94ed-50b1b16e0aa5"},
		constant.SimpleDatetime: {
			"0c790158-9721-41ce-b8b3-b90341575485",
			"73271129-2ae3-47aa-83c5-6c0bf002140c",
			"95e5b917-6313-4bd0-8812-bf0d4aa68d73",
			"69c3d959-1c72-422b-959d-7135f52e4f9c",
			"709fca1a-4640-4cd7-94ed-50b1b16e0aa5"},
		constant.SimpleTime: {
			"0c790158-9721-41ce-b8b3-b90341575485",
			"73271129-2ae3-47aa-83c5-6c0bf002140c"},
		constant.SimpleBool: {
			"ae0f6573-b3e0-4be2-8330-a643261f8a18",
			"45a4b3cb-b93c-469d-b3b4-631a3b8db5fe"},
	}
)
