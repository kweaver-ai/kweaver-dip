package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

// DataKind  基础信息分类
type AuthorityScope enum.Object

var (
	AuthorityScopeDemandTask          = enum.New[AuthorityScope](1<<0, "demand_task", "数据需求及项目管理")
	AuthorityScopeBusinessGrooming    = enum.New[AuthorityScope](1<<1, "business_grooming", "业务梳理")
	AuthorityScopeStandardization     = enum.New[AuthorityScope](1<<2, "standardization", "标准管理")
	AuthorityScopeResourceManagement  = enum.New[AuthorityScope](1<<3, "resource_management", "数据资源管理")
	AuthorityScopeConfigurationCenter = enum.New[AuthorityScope](1<<4, "configuration_center", "配置中心")
)

// AreaName 应用领域
type AreaName enum.Object

var (
	_ = enum.New[AreaName](1, "1", "信用服务")
	_ = enum.New[AreaName](2, "2", "医疗卫生")
	_ = enum.New[AreaName](3, "3", "社保就业")
	_ = enum.New[AreaName](4, "4", "公共安全")
	_ = enum.New[AreaName](5, "5", "城建住房")
	_ = enum.New[AreaName](6, "6", "交通运输")
	_ = enum.New[AreaName](7, "7", "教育文化")
	_ = enum.New[AreaName](8, "8", "科技创新")
	_ = enum.New[AreaName](9, "9", "资源能源")
	_ = enum.New[AreaName](10, "10", "生态环境")
	_ = enum.New[AreaName](11, "11", "工业农业")
	_ = enum.New[AreaName](12, "12", "商贸流通")
	_ = enum.New[AreaName](13, "13", "财税金融")
	_ = enum.New[AreaName](14, "14", "安全生产")
	_ = enum.New[AreaName](15, "15", "市场监管")
	_ = enum.New[AreaName](16, "16", "社会救助")
	_ = enum.New[AreaName](17, "17", "法律服务")
	_ = enum.New[AreaName](18, "18", "生活服务")
	_ = enum.New[AreaName](19, "19", "气象服务")
	_ = enum.New[AreaName](20, "20", "地理空间")
	_ = enum.New[AreaName](21, "21", "机构团体")
	_ = enum.New[AreaName](22, "22", "其他")
)

// RangeName  应用范围
type RangeName enum.Object

var (
	_ = enum.New[RangeName](1, "1", "部本级")
	_ = enum.New[RangeName](2, "2", "部委所属机构")
	_ = enum.New[RangeName](3, "3", "部级及地方")
	_ = enum.New[RangeName](4, "4", "地方")
	_ = enum.New[RangeName](5, "5", "其他")
)

// AuditType 任务类型枚举
type AuditType enum.Object

var (
	_ = enum.New[AuditType](1<<0, "af-data-view-publish", "逻辑视图发布审核")
	_ = enum.New[AuditType](1<<1, "af-data-view-online ", "逻辑视图上线审核")
	_ = enum.New[AuditType](1<<2, "af-data-view-offline", "逻辑视图下线审核")
	_ = enum.New[AuditType](1<<3, "af-data-permission-request", "auth-service数据权限申请")
	_ = enum.New[AuditType](1<<4, "af-data-catalog-online", "")
	_ = enum.New[AuditType](1<<5, "af-data-catalog-offline", "")
	_ = enum.New[AuditType](1<<6, "af-data-catalog-publish", "")
	_ = enum.New[AuditType](1<<7, "af-data-catalog-download", "")
	_ = enum.New[AuditType](1<<8, "af-front-end-processor-request", "")
	_ = enum.New[AuditType](1<<9, "af-info-catalog-publish", "")
	_ = enum.New[AuditType](1<<10, "af-info-catalog-online", "")
	_ = enum.New[AuditType](1<<11, "af-info-catalog-offline", "")
	_ = enum.New[AuditType](1<<12, "af-task-center-data-aggregation-plan", "归集计划审核")
	_ = enum.New[AuditType](1<<13, "af-task-center-data-processing-plan", "处理计划审核")
	_ = enum.New[AuditType](1<<14, "af-task-center-data-comprehension-plan", "理解计划审核")
	_ = enum.New[AuditType](1<<15, "af-task-center-data-search-report", "")
	_ = enum.New[AuditType](1<<16, "af-sszd-app-apply-escalate", "应用创建")
	_ = enum.New[AuditType](1<<17, "af-sszd-app-report-escalate", "省市直达应用上报审核")
	_ = enum.New[AuditType](1<<18, "af-basic-bigdata-create-category-label", "业务标签分类")
	_ = enum.New[AuditType](1<<19, "af-basic-bigdata-update-category-label", "业务标签分类")
	_ = enum.New[AuditType](1<<20, "af-basic-bigdata-delete-category-label ", "业务标签分类")
	_ = enum.New[AuditType](1<<21, "af-basic-bigdata-auth-category-label", "业务标签分类")
	_ = enum.New[AuditType](1<<22, "af-data-catalog-open", "")
	_ = enum.New[AuditType](1<<23, "af-bg-publish-business-area", "业务领域发布审核")
	_ = enum.New[AuditType](1<<24, "af-bg-delete-business-area", "业务领域删除审核")
	_ = enum.New[AuditType](1<<25, "af-bg-publish-main-business", "主干业务发布审核")
	_ = enum.New[AuditType](1<<26, "af-bg-delete-main-business", "主干业务删除审核")
	_ = enum.New[AuditType](1<<27, "af-bg-publish-business-diagnosis", "业务诊断发布审核")
)

// AuditTypeStrings 所有任务类型的逗号分隔字符串
var AuditTypeStrings = enum.Strings[AuditType](enum.String)
