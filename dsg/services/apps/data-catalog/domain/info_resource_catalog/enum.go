package info_resource_catalog

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// [数据范围取值枚举]
type EnumDataRange enum.Object

var (
	DataRangeUndefined EnumDataRange = enum.New[EnumDataRange](-1, "")                 // 空值，表示未定义
	DataRangeAll       EnumDataRange = enum.New[EnumDataRange](1, "all", "全市")         // 全市
	DataRangeCity      EnumDataRange = enum.New[EnumDataRange](2, "city", "市直")        // 市直
	DataRangeDistrict  EnumDataRange = enum.New[EnumDataRange](3, "district", "区县(市)") // 区县
) // [/]

// [更新周期取值枚举]
type EnumUpdateCycle enum.Object

var (
	UpdateCycleUndefined  EnumUpdateCycle = enum.New[EnumUpdateCycle](-1, "")                  // 空值，表示未定义
	UpdateCycleQuarterly  EnumUpdateCycle = enum.New[EnumUpdateCycle](1, "quarterly", "每季度")   // 每季度
	UpdateCycleMonthly    EnumUpdateCycle = enum.New[EnumUpdateCycle](2, "monthly", "每月")      // 每月
	UpdateCycleWeekly     EnumUpdateCycle = enum.New[EnumUpdateCycle](3, "weekly", "每周")       // 每周
	UpdateCycleDaily      EnumUpdateCycle = enum.New[EnumUpdateCycle](4, "daily", "每日")        // 每日
	UpdateCycleHourly     EnumUpdateCycle = enum.New[EnumUpdateCycle](5, "hourly", "每小时")      // 每小时（废弃枚举，暂不删除）
	UpdateCycleRealtime   EnumUpdateCycle = enum.New[EnumUpdateCycle](6, "realtime", "实时")     // 实时
	UpdateCycleIrregular  EnumUpdateCycle = enum.New[EnumUpdateCycle](7, "irregular", "其他")    // 其他/不定期
	UpdateCycleYearly     EnumUpdateCycle = enum.New[EnumUpdateCycle](8, "yearly", "每年")       // 每年
	UpdateCycleHalfYearly EnumUpdateCycle = enum.New[EnumUpdateCycle](9, "half-yearly", "每半年") // 每半年
) // [/]

// [共享属性取值枚举]
type EnumSharedType enum.Object

var (
	SharedTypeUndefined     EnumSharedType = enum.New[EnumSharedType](-1, "")                // 空值，表示未定义
	SharedTypeNone          EnumSharedType = enum.New[EnumSharedType](0, "none", "不予共享")     // 不予共享
	SharedTypeUnconditional EnumSharedType = enum.New[EnumSharedType](1, "all", "无条件共享")     // 无条件共享
	SharedTypeConditional   EnumSharedType = enum.New[EnumSharedType](2, "partial", "有条件共享") // 有条件共享
) // [/]

// [共享方式取值枚举]
type EnumSharedMode enum.Object

var (
	SharedModeUndefined EnumSharedMode = enum.New[EnumSharedMode](-1, "")                  // 空值，表示未定义
	SharedModePlatform  EnumSharedMode = enum.New[EnumSharedMode](1, "platform", "共享平台方式") // 共享平台
	SharedModeMail      EnumSharedMode = enum.New[EnumSharedMode](2, "mail", "邮件方式")       // 邮件
	SharedModeMedia     EnumSharedMode = enum.New[EnumSharedMode](3, "media", "介质方式")      // 介质
) // [/]

// [开放属性取值枚举]
type EnumOpenType enum.Object

var (
	OpenTypeUndefined     EnumOpenType = enum.New[EnumOpenType](-1, "")                // 空值，表示未定义
	OpenTypeNone          EnumOpenType = enum.New[EnumOpenType](0, "none", "不予开放")     // 不予开放
	OpenTypeUnconditional EnumOpenType = enum.New[EnumOpenType](1, "all", "无条件开放")     // 无条件开放
	OpenTypeConditional   EnumOpenType = enum.New[EnumOpenType](2, "partial", "有条件开放") // 有条件开放
) // [/]

// [业务场景类型取值枚举]
type EnumBusinessSceneType enum.Object

var (
	BusinessSceneTypeOther             EnumBusinessSceneType = enum.New[EnumBusinessSceneType](0, "other", "其他")                // 其他
	BusinessSceneTypeGovernmentService EnumBusinessSceneType = enum.New[EnumBusinessSceneType](1, "government_service", "政务服务") // 政务服务
	BusinessSceneTypePublicService     EnumBusinessSceneType = enum.New[EnumBusinessSceneType](2, "public_service", "公共服务")     // 公共服务
	BusinessSceneTypeSupervision       EnumBusinessSceneType = enum.New[EnumBusinessSceneType](3, "supervision", "监管")          // 监管
) // [/]

// [发布状态取值枚举]
type EnumPublishStatus enum.Object

var (
	PublishStatusUnpublished EnumPublishStatus = enum.New[EnumPublishStatus](0, constant.PublishStatusUnPublished) // 草稿
	PublishStatusPubAuditing EnumPublishStatus = enum.New[EnumPublishStatus](1, constant.PublishStatusPubAuditing) // 发布审核中
	PublishStatusPublished   EnumPublishStatus = enum.New[EnumPublishStatus](2, constant.PublishStatusPublished)   // 已发布
	PublishStatusPubReject   EnumPublishStatus = enum.New[EnumPublishStatus](3, constant.PublishStatusPubReject)   // 发布审核未通过
	PublishStatusChAuditing  EnumPublishStatus = enum.New[EnumPublishStatus](4, constant.PublishStatusChAuditing)  // 变更审核中
	PublishStatusChReject    EnumPublishStatus = enum.New[EnumPublishStatus](5, constant.PublishStatusChReject)    // 变更审核未通过
) // [/]

// [上线状态取值枚举]
type EnumOnlineStatus enum.Object

var (
	OnlineStatusNotOnline           EnumOnlineStatus = enum.New[EnumOnlineStatus](0, constant.LineStatusNotLine)           // 未上线
	OnlineStatusNotOnlineUpAuditing EnumOnlineStatus = enum.New[EnumOnlineStatus](1, constant.LineStatusUpAuditing)        // 未上线（上线审核中）
	OnlineStatusOnline              EnumOnlineStatus = enum.New[EnumOnlineStatus](2, constant.LineStatusOnLine)            // 已上线
	OnlineStatusNotOnlineUpReject   EnumOnlineStatus = enum.New[EnumOnlineStatus](3, constant.LineStatusUpReject)          // 未上线（上线审核未通过）
	OnlineStatusOnlineDownAuditing  EnumOnlineStatus = enum.New[EnumOnlineStatus](4, constant.LineStatusDownAuditing)      // 已上线（下线审核中）
	OnlineStatusOffline             EnumOnlineStatus = enum.New[EnumOnlineStatus](5, constant.LineStatusOffLine)           // 已下线
	OnlineStatusOnlineDownReject    EnumOnlineStatus = enum.New[EnumOnlineStatus](6, constant.LineStatusDownReject)        // 已上线（下线审核未通过）
	OnlineStatusOfflineUpAuditing   EnumOnlineStatus = enum.New[EnumOnlineStatus](7, constant.LineStatusOfflineUpAuditing) // 已下线（上线审核中）
	OnlineStatusOfflineUpReject     EnumOnlineStatus = enum.New[EnumOnlineStatus](8, constant.LineStatusOfflineUpReject)   // 已下线（上线审核未通过）

) // [/]

// [审核类型取值枚举] 与其它枚举值采用String作为接口参数值不同，这里String为内部值，拼接前的字符串枚举为接口参数值
type EnumAuditTypeParam string

const (
	AuditTypeParamPublish EnumAuditTypeParam = "publish"
	AuditTypeParamOnline  EnumAuditTypeParam = "online"
	AuditTypeParamOffline EnumAuditTypeParam = "offline"
	AuditTypeParamAlter   EnumAuditTypeParam = "alter"
)

func EnumAuditTypeValue(param EnumAuditTypeParam) (value string) {
	return "af-info-catalog-" + string(param)
}

type EnumAuditType enum.Object

var (
	AuditTypePublish EnumAuditType = enum.New[EnumAuditType](1, EnumAuditTypeValue(AuditTypeParamPublish), string(AuditTypeParamPublish)) // 发布审核
	AuditTypeOnline  EnumAuditType = enum.New[EnumAuditType](2, EnumAuditTypeValue(AuditTypeParamOnline), string(AuditTypeParamOnline))   // 上线审核
	AuditTypeOffline EnumAuditType = enum.New[EnumAuditType](3, EnumAuditTypeValue(AuditTypeParamOffline), string(AuditTypeParamOffline)) // 下线审核
	AuditTypeAlter   EnumAuditType = enum.New[EnumAuditType](4, EnumAuditTypeValue(AuditTypeParamAlter), string(AuditTypeParamAlter))     // 变更审核
) // [/]

// [数据类型取值枚举]
type EnumDataType enum.Object

var (
	DataTypeChar     EnumDataType = enum.New[EnumDataType](1, "char", "字符型")       // 字符型
	DataTypeDate     EnumDataType = enum.New[EnumDataType](2, "date", "日期型")       // 日期型
	DataTypeDateTime EnumDataType = enum.New[EnumDataType](3, "datetime", "日期时间型") // 日期时间型
	DataTypeBool     EnumDataType = enum.New[EnumDataType](4, "bool", "布尔型")       // 布尔型
	DataTypeOther    EnumDataType = enum.New[EnumDataType](5, "other", "其他")       // 其他
	DataTypeInt      EnumDataType = enum.New[EnumDataType](6, "int", "整数型")        // 整数型
	DataTypeFloat    EnumDataType = enum.New[EnumDataType](7, "float", "小数型")      // 浮点数型
	DataTypeDecimal  EnumDataType = enum.New[EnumDataType](8, "decimal", "高精度型")   // 精准数值型
	DataTypeTime     EnumDataType = enum.New[EnumDataType](9, "time", "时间型")       // 时间型
) // [/]

// [创建动作取值枚举]
type EnumAction string

var (
	ActionSave   EnumAction = "save"   // 暂存
	ActionSubmit EnumAction = "submit" // 提交
) // [/]

// [对象类型取值枚举]
type EnumObjectType string

const (
	ObjectTypeDepartment          EnumObjectType = "department"
	ObjectTypeBusinessProcess     EnumObjectType = "business_process"
	ObjectTypeInfoSystem          EnumObjectType = "info_system"
	ObjectTypeDataResourceCatalog EnumObjectType = "data_catalog"
	ObjectTypeInfoClass           EnumObjectType = "info_catalog"
	ObjectTypeInfoItem            EnumObjectType = "info_item"
	ObjectTypeDataRefer           EnumObjectType = "data_element"
	ObjectTypeCodeSet             EnumObjectType = "code_set"
	ObjectTypeBusinessForm        EnumObjectType = "business_form"
) // [/]

const ( // 类目类型ID
	CATEGORY_TYPE_ORGANIZATION   = "00000000-0000-0000-0000-000000000001" // 组织架构
	CATEGORY_TYPE_SYSTEM         = "00000000-0000-0000-0000-000000000002" // 信息系统
	CATEGORY_TYPE_SUBJECT_DOMAIN = "00000000-0000-0000-0000-000000000003" // 主题域
)
