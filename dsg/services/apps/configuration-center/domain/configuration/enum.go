package configuration

import (
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// TaskConfigStatus 任务的配置状态，即关联的信息表是否已经被删除

// DataKind  基础信息分类
type DataKind enum.Object

var (
	DataKindHuman  = enum.New[DataKind](1<<0, "human", "人")
	DataKindLand   = enum.New[DataKind](1<<1, "land", "地")
	DataKindEvent  = enum.New[DataKind](1<<2, "event", "事")
	DataKindObject = enum.New[DataKind](1<<3, "object", "物")
	DataKindOrg    = enum.New[DataKind](1<<4, "org", "组织")
	DataKindOther  = enum.New[DataKind](1<<5, "other", "其他")
)

// SharedAttribute  共享属性
type SharedAttribute enum.Object

var (
	SharedAttributeUnconditional = enum.New[SharedAttribute](1, "share_no_conditions", "无条件共享")
	SharedAttributeConditional   = enum.New[SharedAttribute](2, "share_with_conditions", "有条件共享")
	SharedAttributeUnshared      = enum.New[SharedAttribute](3, "not_share", "不予共享")
)

// ConfidentialAttribute  是否涉密
type ConfidentialAttribute enum.Object

var (
	ConfidentialAttributeNo  = enum.New[ConfidentialAttribute](0, "not_confidential", "非涉密")
	ConfidentialAttributeYes = enum.New[ConfidentialAttribute](1, "confidential", "涉密")
)

// SensitiveAttribute 是否是敏感数据
type SensitiveAttribute enum.Object

var (
	SensitiveAttributeNo  = enum.New[SensitiveAttribute](0, "not_sensitive", "不敏感")
	SensitiveAttributeYes = enum.New[SensitiveAttribute](1, "sensitive", "敏感")
)

// SharedMode  共享方式
type SharedMode enum.Object

var (
	SharedModePlatform = enum.New[SharedMode](1, "platform", "共享平台方式")
	SharedModeMail     = enum.New[SharedMode](2, "mail", "邮件方式")
	SharedModeMedium   = enum.New[SharedMode](3, "medium", "介质方式")
)

// OpenAttribute 开放属性
type OpenAttribute enum.Object

var (
	OpenAttributeOpen    = enum.New[OpenAttribute](1, "open", "向公众开放")
	OpenAttributeNotOpen = enum.New[OpenAttribute](2, "not_open", "不向公众开放")
)

// UpdateCycle  更新周期
type UpdateCycle enum.Object

var (
	UpdateCycleNonschedule  = enum.New[UpdateCycle](1, "nonschedule", "不定期")
	UpdateCycleRealtime     = enum.New[UpdateCycle](2, "realtime", "实时")
	UpdateCycleDaily        = enum.New[UpdateCycle](3, "daily", "每日")
	UpdateCycleWeekly       = enum.New[UpdateCycle](4, "weekly", "每周")
	UpdateCycleMonthly      = enum.New[UpdateCycle](5, "monthly", "每月")
	UpdateCycleQuarterly    = enum.New[UpdateCycle](6, "quarterly", "每季度")
	UpdateCycleSemiannually = enum.New[UpdateCycle](7, "semiannually", "每半年")
	UpdateCycleYearly       = enum.New[UpdateCycle](8, "yearly", "每年")
	UpdateCycleOther        = enum.New[UpdateCycle](9, "other", "其他")
)

// DataRange 数据范围
type DataRange enum.Object

var (
	DataRangeWholeCity            = enum.New[DataRange](1, "whole_city", "全市")
	DataRangeCityJurisdictionArea = enum.New[DataRange](2, "city_jurisdiction_area", "市直")
	DataRangeCounty               = enum.New[DataRange](3, "county", "区县")
)

// 表单来源类型
type FormType enum.Object

var (
	FormTypeNormal         = enum.New[FormType](1, "normal", "普通")
	FormTypeFromDs         = enum.New[FormType](2, "fromDs", "从数据源导入")
	FormTypeFromFormView   = enum.New[FormType](3, "form_view", "从元数据视图创建")
	FormTypeFromDataOrigin = enum.New[FormType](4, "data_origin", "从数据原始表创建")
)

// DataType  数据种类
type DataType enum.Object

var (
	DataTypeChar     = enum.New[DataType](1, "char", "字符型")
	DataTypeInteger  = enum.New[DataType](10, "int", "整数型")
	DataTypeFloat    = enum.New[DataType](8, "float", "小数型")
	DataTypeDecimal  = enum.New[DataType](7, "decimal", "高精度型")
	DataTypeDate     = enum.New[DataType](2, "date", "日期型")
	DataTypeDateTime = enum.New[DataType](3, "datetime", "日期时间型")
	//DataTypeTimestamp = enum.New[DataType](4, "timestamp", "时间戳型") //合并到日期型
	DataTypeTime   = enum.New[DataType](9, "time", "时间型")
	DataTypeBool   = enum.New[DataType](5, "bool", "布尔型")
	DataTypeNumber = enum.New[DataType](0, "number", "数字型")
)

// Source  数据来源
type Source enum.Object

var (
	SourceOnline  = enum.New[Source](1, "online", "线上")
	SourceOffline = enum.New[Source](2, "offline", "线下")
)

// ValueRangeType  值域类型
type ValueRangeType enum.Object

var (
	ValueRangeTypeNo             = enum.New[ValueRangeType](1, "no", "无限制")
	ValueRangeTypeCodeTable      = enum.New[ValueRangeType](2, "codeTable", "码表")
	ValueRangeTypeCodeRule       = enum.New[ValueRangeType](3, "custom", "自定义")
	ValueRangeTypeChooseCodeRule = enum.New[ValueRangeType](4, "codeRule", "编码规则")
)

// CurrentBusinessGeneration 是否本业务产生
type CurrentBusinessGeneration enum.Object

var (
	CurrentBusinessGenerationNo  = enum.New[CurrentBusinessGeneration](0, "no", "否")
	CurrentBusinessGenerationYes = enum.New[CurrentBusinessGeneration](1, "yes", "是")
)

// StandardizationRequired 是否需标准化
type StandardizationRequired enum.Object

var (
	StandardizationRequiredNo  = enum.New[StandardizationRequired](0, "no", "否")
	StandardizationRequiredYes = enum.New[StandardizationRequired](1, "yes", "是")
)

// EnumStandard 是否标准
type EnumStandard enum.Object

var (
	StandardNo  = enum.New[EnumStandard](0, "no", "否")
	StandardYes = enum.New[EnumStandard](1, "yes", "是")
)

// EnumRequired 是否必填
type EnumRequired enum.Object

var (
	EnumRequiredNo  = enum.New[EnumRequired](0, "no", "否")
	EnumRequiredYes = enum.New[EnumRequired](1, "yes", "是")
)

// IncrementalField 是否是自增字段
type IncrementalField enum.Object

var (
	IncrementalFieldNo  = enum.New[IncrementalField](0, "no", "否")
	IncrementalFieldYes = enum.New[IncrementalField](1, "yes", "是")
)

// EnumPrimaryKey 是否是主键
type EnumPrimaryKey enum.Object

var (
	EnumPrimaryKeyNo  = enum.New[EnumPrimaryKey](0, "no", "否")
	EnumPrimaryKeyYes = enum.New[EnumPrimaryKey](1, "yes", "是")
)

// FormulateBasis 数据标准类型
type FormulateBasis enum.Object

var (
	FormulateBasisGroupStandard         = enum.New[FormulateBasis](1, "group", "团体标准")
	FormulateBasisEnterpriseStandard    = enum.New[FormulateBasis](2, "enterprise", "企业标准")
	FormulateBasisIndustryStandard      = enum.New[FormulateBasis](3, "industry", "行业标准")
	FormulateBasisProvincialStandard    = enum.New[FormulateBasis](4, "provincial", "地方标准")
	FormulateBasisNationalStandard      = enum.New[FormulateBasis](5, "national", "国家标准")
	FormulateBasisInternationalStandard = enum.New[FormulateBasis](6, "international", "国际标准")
	FormulateBasisForeignStandard       = enum.New[FormulateBasis](8, "foreign", "国外标准")
	FormulateBasisOtherStandard         = enum.New[FormulateBasis](7, "other", "其他标准")
)

// StandardFormulateBasis   标准化那边的枚举，和FormulateBasis相同的地方就是中间的英文名称
type StandardFormulateBasis enum.Object

var (
	StandardFormulateBasisGroupStandard         = enum.New[StandardFormulateBasis](0, "group", "团体标准")
	StandardFormulateBasisEnterpriseStandard    = enum.New[StandardFormulateBasis](1, "enterprise", "企业标准")
	StandardFormulateBasisIndustryStandard      = enum.New[StandardFormulateBasis](2, "industry", "行业标准")
	StandardFormulateBasisProvincialStandard    = enum.New[StandardFormulateBasis](3, "provincial", "地方标准")
	StandardFormulateBasisNationalStandard      = enum.New[StandardFormulateBasis](4, "national", "国家标准")
	StandardFormulateBasisInternationalStandard = enum.New[StandardFormulateBasis](5, "international", "国际标准")
	StandardFormulateBasisForeignStandard       = enum.New[StandardFormulateBasis](6, "foreign", "国外标准")
	StandardFormulateBasisOtherStandard         = enum.New[StandardFormulateBasis](99, "other", "其他标准")
)

// ModelTableKind  数据模型&业务模型下的表类型
type ModelTableKind enum.Object

var (
	ModelTableKindBusiness     = enum.New[ModelTableKind](1, "business", "业务节点表")
	ModelTableKindStandard     = enum.New[ModelTableKind](2, "standard", "业务标准表")
	ModelTableKindDataOrigin   = enum.New[ModelTableKind](3, "data_origin", "数据原始表")
	ModelTableKindDataStandard = enum.New[ModelTableKind](4, "data_standard", "数据标准表")
	ModelTableKindDataFusion   = enum.New[ModelTableKind](5, "data_fusion", "数据融合表")
)

// SourceTableKind  数据模型&业务模型下的表类型
type SourceTableKind enum.Object

var (
	SourceTableKindLogicalView  = enum.New[SourceTableKind](0, "form_view", "逻辑视图")
	SourceTableKindBusiness     = enum.New[SourceTableKind](1, "business", "业务节点表")
	SourceTableKindStandard     = enum.New[SourceTableKind](2, "standard", "业务标准表")
	SourceTableKindDataOrigin   = enum.New[SourceTableKind](3, "data_origin", "数据原始表")
	SourceTableKindDataStandard = enum.New[SourceTableKind](4, "data_standard", "数据标准表")
	SourceTableKindDataFusion   = enum.New[SourceTableKind](5, "data_fusion", "数据融合表")
)

// FieldValueRule 取值规则
type FieldValueRule enum.Object

var (
	FieldValueRuleUnique     = enum.New[FieldValueRule](1, "unique", "唯一性")
	FieldValueRuleTimeliness = enum.New[FieldValueRule](2, "timeliness", "时间性")
	FieldValueRuleConformity = enum.New[FieldValueRule](3, "conformity", "从众性")
)

// 数据模型&业务模型的类型
type BusinessModelType enum.Object

var (
	BusinessModelTypeBusiness = enum.New[BusinessModelType](1, "business", "业务模型")
	BusinessModelTypeData     = enum.New[BusinessModelType](2, "data", "数据模型")
)

// 数据模型&业务模型的状态
type BusinessModelStatus enum.Object

var (
	BusinessModelStatusDraft   = enum.New[BusinessModelStatus](1, "draft", "草稿")
	BusinessModelStatusPublish = enum.New[BusinessModelStatus](2, "publish", "发布")
)

type TotalStatisticType enum.Object

var (
	MainBusinessNum      = enum.New[TotalStatisticType](1, "main_business_num", "主干业务数量")
	BusinessMatterNum    = enum.New[TotalStatisticType](2, "business_matter_num", "业务事项数量")
	BusinessModelNum     = enum.New[TotalStatisticType](3, "business_model_num", "业务模型数量")
	DataModelNum         = enum.New[TotalStatisticType](4, "data_model_num", "数据模型数量")
	FlowchartNum         = enum.New[TotalStatisticType](5, "flowchart_num", "业务流程图数量")
	BusinessTableNum     = enum.New[TotalStatisticType](6, "business_table_num", "业务节点表数量")
	StandardTableNum     = enum.New[TotalStatisticType](7, "standard_table_num", "业务标准表数量")
	BusinessIndicatorNum = enum.New[TotalStatisticType](8, "business_indicator_num", "业务指标数量")
	DataOriginTableNum   = enum.New[TotalStatisticType](9, "data_origin_table_num", "数据原始表数量")
	DataStandardTableNum = enum.New[TotalStatisticType](10, "data_standard_table_num", "数据标准表数量")
	DataFusionTableNum   = enum.New[TotalStatisticType](11, "data_fusion_table_num", "数据融合表数量")
	DataIndicatorNum     = enum.New[TotalStatisticType](12, "data_indicator_num", "数据统计表数量")
)

type TotalUnit enum.Object

var (
	TotalUnit1 = enum.New[TotalUnit](1, "个")
	TotalUnit2 = enum.New[TotalUnit](2, "张")
)

type EnumObject struct {
	DataRange              []KV `json:"data_range"`
	FormulateBasis         []KV `json:"formulate_basis"`
	StandardFormulateBasis []KV `json:"standard_formulate_basis"`
	UpdateCycle            []KV `json:"update_cycle"`
	DataType               []KV `json:"data_type"`
	DataKind               []KV `json:"data_kind"`
	SensitiveAttribute     []KV `json:"sensitive_attribute"`
	ConfidentialAttribute  []KV `json:"confidential_attribute"`
	SharedAttribute        []KV `json:"shared_attribute"`
	OpenAttribute          []KV `json:"open_attribute"`
	SharedMode             []KV `json:"shared_mode"`
	ModelTableKind         []KV `json:"model_table_kind"`
}

var enumObject *EnumObject

func init() {
	enumObject = new(EnumObject)
	enumObject.DataRange = newKV(enum.Objects[DataRange]())
	enumObject.FormulateBasis = newKV(enum.Objects[FormulateBasis]())
	enumObject.StandardFormulateBasis = newKV(enum.Objects[StandardFormulateBasis]())
	enumObject.UpdateCycle = newKV(enum.Objects[UpdateCycle]())
	enumObject.DataType = newKV(enum.Objects[DataType]())
	enumObject.DataKind = newKV(enum.Objects[DataKind]())
	enumObject.SensitiveAttribute = newKV(enum.Objects[SensitiveAttribute]())
	enumObject.ConfidentialAttribute = newKV(enum.Objects[ConfidentialAttribute]())
	enumObject.SharedAttribute = newKV(enum.Objects[SharedAttribute]())
	enumObject.OpenAttribute = newKV(enum.Objects[OpenAttribute]())
	enumObject.SharedMode = newKV(enum.Objects[SharedMode]())
	enumObject.ModelTableKind = newKV(enum.Objects[ModelTableKind]())
}
func newKV(objs []enum.Object) []KV {
	rs := make([]KV, 0)
	for _, obj := range objs {
		rs = append(rs, KV{
			ID:      obj.Integer.Int(),
			Value:   obj.Display,
			ValueEn: obj.String,
		})
	}
	return rs
}

func GetEnumConfig() *EnumObject {
	return enumObject
}

type KV struct {
	ID      int    `json:"id"`
	Value   string `json:"value"`
	ValueEn string `json:"value_en"`
}

// DataLengthTypeSet 可以有长度的类型集合
var DataLengthTypeSet = []string{
	DataTypeNumber.String,
	DataTypeDecimal.String,
	DataTypeDecimal.String,
	DataTypeChar.String,
}

// DataAccuracyTypeSet 可以有精度的类型集合
var DataAccuracyTypeSet = []string{
	DataTypeNumber.String,
	DataTypeDecimal.String,
}
