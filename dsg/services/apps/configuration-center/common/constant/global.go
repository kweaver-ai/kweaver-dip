package constant

import (
	"time"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

const (
	ServiceName = "ConfigurationCenter"

	DefaultHttpRequestTimeout = 60 * time.Second

	CommonTimeFormat = "2006-01-02 15:04:05"
)

const (
	SortByCreatedAt = "created_at"
	SortByUpdatedAt = "updated_at"
)

const (
	BusinessDomainLevel        = "BusinessDomainLevel"
	BusinessDomainLevelType    = 0
	BusinessDomainLevelDefault = "1,2,3"
	DataGradeLabel             = "data_grade_label"
)

type BusinessDomainLevelEnum enum.Object

var (
	DomainGroup = enum.New[BusinessDomainLevelEnum](1, "domain_group")
	Domain      = enum.New[BusinessDomainLevelEnum](2, "domain")
	Process     = enum.New[BusinessDomainLevelEnum](3, "process")
)

const (
	DataViewAuditTypePublish        = "af-data-view-publish"
	DataViewAuditTypeOnline         = "af-data-view-online"
	DataViewAuditTypeOffline        = "af-data-view-offline"
	AuthServicePermissionRequest    = "af-data-permission-request"
	DataCatalogPublish              = "af-data-catalog-publish"
	DataCatalogChange               = "af-data-catalog-change"
	DataCatalogOnline               = "af-data-catalog-online"
	DataCatalogOffline              = "af-data-catalog-offline"
	DataCatalogDownload             = "af-data-catalog-download"
	FrontEndProcessorRequest        = "af-front-end-processor-request"
	InfoCatalogPublish              = "af-info-catalog-publish"
	InfoCatalogOnline               = "af-info-catalog-online"
	InfoCatalogOffline              = "af-info-catalog-offline"
	AppApplyEscalate                = "af-sszd-app-apply-escalate"
	AppApplyReport                  = "af-sszd-app-report-escalate"
	TasksDataAggregationPlan        = "af-task-center-data-aggregation-plan"
	TasksDataProcessingPlan         = "af-task-center-data-processing-plan"
	TasksDataComprehensionPlan      = "af-task-center-data-comprehension-plan"
	TasksDataSearchReport           = "af-task-center-data-search-report"
	BigdataCreateCategoryLabel      = "af-basic-bigdata-create-category-label" // 业务标签分类发布审核
	BigdataUpdateCategoryLabel      = "af-basic-bigdata-update-category-label" // 业务标签分类变更审核
	BigdataDeleteCategoryLabel      = "af-basic-bigdata-delete-category-label" // 业务标签分类删除审核
	BigdataAuthCategoryLabel        = "af-basic-bigdata-auth-category-label"   // 业务标签授权审核
	DataCatalogOpen                 = "af-data-catalog-open"
	BGPublishBusinessArea           = "af-bg-publish-business-area"
	BGDeleteBusinessArea            = "af-bg-delete-business-area"
	BGPublishMainBusiness           = "af-bg-publish-main-business"
	BGDeleteMainBusiness            = "af-bg-delete-main-business"
	BGPublishBusinessDiagnosis      = "af-bg-publish-business-diagnosis"
	TasksDataComprehensionWorkOrder = "af-data-comprehension-work-order"
	// 数据归集清单
	TasksDataAggregationInventory = "af-data-aggregation-inventory"
	// 数据归集工单
	TasksDataAggregationWorkOrder  = "af-data-aggregation-work-order"
	DataCatalogComprehensionReport = "af-data-comprehension-report"
	FileResourcePublish            = "af-file-resource-publish"
	// 标准化工单
	TaskStandardWorkOrder          = "af-data-standardization-work-order"
	TaskSDataFusionWorkOrder       = "af-data-fusion-work-order"
	DataQualityWorkOrder           = "af-data-quality-work-order"
	TaskSDataQualityAuditWorkOrder = "af-data-quality-audit-work-order"
)

const (
	EntityChangeTopic  = "af.business-grooming.entity_change"
	PDFHasSuffix       = ".pdf"
	ExcelXlsHasSuffix  = ".xls"
	ExcelXlsxHasSuffix = ".xlsx"
	WordDocHasSuffix   = ".doc"
	WordDocxHasSuffix  = ".docx"
	TXTDocHasSuffix    = ".txt"
	PPTXDocHasSuffix   = ".pptx"

	PPTDocHasSuffix = ".ppt"
	MaxUploadSize   = 1024 * 1024 * 50
	WorkerPath      = "/usr/lib/libreoffice/program/"
	DataPath        = "/usr/local/af/tmp_data"
)
const (
	ServiceTypeDataView            = "data-view"
	ServiceTypeAuthService         = "auth-service"
	ServiceTypeDataCatalog         = "data-catalog"
	ServiceTypeTasks               = "task-center"
	ServiceTypeConfigurationCenter = "configuration-center"
	ServiceTypeBasicBigdataService = "basic-bigdata-service"
	ServiceTypeOpenCatalog         = "open-catalog"
	ServiceTypeBusinessGrooming    = "business-grooming"
)

var (
	ServiceTypeAllowedAuditType = map[string]struct{}{
		ServiceTypeDataView + DataViewAuditTypePublish:              {},
		ServiceTypeDataView + DataViewAuditTypeOnline:               {},
		ServiceTypeDataView + DataViewAuditTypeOffline:              {},
		ServiceTypeAuthService + AuthServicePermissionRequest:       {},
		ServiceTypeDataCatalog + DataCatalogPublish:                 {},
		ServiceTypeDataCatalog + DataCatalogOnline:                  {},
		ServiceTypeDataCatalog + DataCatalogOffline:                 {},
		ServiceTypeDataCatalog + InfoCatalogPublish:                 {},
		ServiceTypeDataCatalog + InfoCatalogOnline:                  {},
		ServiceTypeDataCatalog + InfoCatalogOffline:                 {},
		ServiceTypeDataCatalog + DataCatalogComprehensionReport:     {},
		ServiceTypeConfigurationCenter + AppApplyEscalate:           {},
		ServiceTypeConfigurationCenter + AppApplyReport:             {},
		ServiceTypeConfigurationCenter + FrontEndProcessorRequest:   {},
		ServiceTypeTasks + TaskStandardWorkOrder:                    {},
		ServiceTypeTasks + DataQualityWorkOrder:                     {},
		ServiceTypeTasks + TasksDataAggregationInventory:            {},
		ServiceTypeTasks + TasksDataAggregationPlan:                 {},
		ServiceTypeTasks + TasksDataAggregationWorkOrder:            {},
		ServiceTypeTasks + TasksDataProcessingPlan:                  {},
		ServiceTypeTasks + TasksDataComprehensionPlan:               {},
		ServiceTypeTasks + TasksDataSearchReport:                    {},
		ServiceTypeBasicBigdataService + BigdataCreateCategoryLabel: {},
		ServiceTypeBasicBigdataService + BigdataUpdateCategoryLabel: {},
		ServiceTypeBasicBigdataService + BigdataDeleteCategoryLabel: {},
		ServiceTypeBasicBigdataService + BigdataAuthCategoryLabel:   {},
		ServiceTypeOpenCatalog + DataCatalogOpen:                    {},
		ServiceTypeBusinessGrooming + BGPublishBusinessArea:         {},
		ServiceTypeBusinessGrooming + BGDeleteBusinessArea:          {},
		ServiceTypeBusinessGrooming + BGPublishMainBusiness:         {},
		ServiceTypeBusinessGrooming + BGDeleteMainBusiness:          {},
		ServiceTypeBusinessGrooming + BGPublishBusinessDiagnosis:    {},
		ServiceTypeTasks + TasksDataComprehensionWorkOrder:          {},
		ServiceTypeDataCatalog + FileResourcePublish:                {},
		ServiceTypeTasks + TaskSDataFusionWorkOrder:                 {},
		ServiceTypeTasks + TaskSDataQualityAuditWorkOrder:           {},
	}
)

const (
	DataDirectoryMode = 1 //数据目录模式
	DataResourceMode  = 2 //数据资源模式
)

// 账号类型
type VisitorType string

const (
	RealName VisitorType = "1" //普通用户
	APP      VisitorType = "6" //应用
)

const UnallocatedId = "00000000-0000-0000-0000-000000000000" //未分类

const ZkHiveDefaultPort = 2181
const ZkHiveReplaceDefaultPort = 10000

const CSSJJ = "cssjj"
