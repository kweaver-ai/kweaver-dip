export enum typeList {
    catalogPublish = 'af-data-catalog-publish',
    catalogOnline = 'af-data-catalog-online',
    catalogOffline = 'af-data-catalog-offline',
    catalogDownload = 'af-data-catalog-download',
    apiPublish = 'af-data-application-publish',
    apiOnline = 'af-data-application-online',
    apiOffline = 'af-data-application-offline',
    apiRequest = 'af-data-application-request',
}

// 业务类型
export enum BizType {
    /** 数据申请 */
    AuthService = 'auth-service',
    /** 库表 */
    DataView = 'data-view',
    /** 任务中心 */
    TaskCenter = 'task-center',
    /** 配置中心 */
    ConfigurationCenter = 'configuration-center',
}

export enum PolicyType {
    // 数据目录
    CatalogPublish = 'af-data-catalog-publish',
    CatalogOnline = 'af-data-catalog-online',
    CatalogOffline = 'af-data-catalog-offline',
    CatalogChange = 'af-data-catalog-change',
    // 开放目录申请
    CatalogOpenApply = 'af-data-catalog-open',
    // TODO: 待对接
    // 库表
    DataViewPublish = 'af-data-view-publish',
    DataViewOnline = 'af-data-view-online',
    DataViewOffline = 'af-data-view-offline',
    DataViewChange = 'af-data-view-change',
    // 接口
    ApiPublish = 'af-data-application-publish',
    ApiChange = 'af-data-application-change',
    ApiOnline = 'af-data-application-online',
    ApiOffline = 'af-data-application-offline',
    // 信息资源目录
    InfoRescCatlgPublish = 'af-info-catalog-publish',
    InfoRescCatlgOnline = 'af-info-catalog-online',
    InfoRescCatlgOffline = 'af-info-catalog-offline',
    InfoRescCatlgChange = 'af-info-catalog-alter',
    // 电子证照目录
    ElecLicenceOnline = 'af-elec-licence-online',
    ElecLicenceOffline = 'af-elec-licence-offline',

    // 数据需求分析
    DataRequirementAnalysis = 'af_demand_analysis_confirm',
    // 资源权限申请
    AssetPermission = 'af-data-permission-request',
    // 应用案例上报审核
    SSZDApplicationCaseReport = 'af-sszd-application-example-report',
    // 应用案例下架审核
    SSZDApplicationCaseOffline = 'af-sszd-application-example-withdraw',
    // 省市直达供需上报审核
    SSZDDemandEscalate = 'af-sszd-demand-escalate',
    // 省市直达资源申请审核
    SSZDShareApplyEscalate = 'af-sszd-share-apply-escalate',
    // 省市直达资源共享审核
    SSZDShareApplyApprove = 'af-sszd-share-apply-approve',
    // 开放目录
    OpenCatalog = 'af-data-catalog-open',
    // 省市直达数据异议申请
    SSZDObjectionEscalate = 'af-sszd-objection-escalate',
    // 省市直达目录上报申请
    SSZDCatalogReportApprove = 'af-sszd-catalog-report-approve',
    // 省市直达资源上报申请
    SSZDResourceReportApprove = 'af-sszd-catalog-resource-approve',
    // 市州供需对接  供需申报
    CityDemandDeclare = 'af_require_report',
    // 市州供需对接  供需分析
    CityDemandAnalysis = 'af_require_analysis',

    // 数据归集计划申请
    PlanCollection = 'af-task-center-data-aggregation-plan',
    // 数据归集清单申请
    ListCollection = 'af-data-aggregation-inventory',
    // 数据处理计划申请
    PlanProcessing = 'af-task-center-data-processing-plan',
    // 数据理解计划申请
    PlanUnderstanding = 'af-task-center-data-comprehension-plan',
    // 数据理解报告申请
    DataUnderstandingReport = 'af-data-comprehension-report',
    // 调研报告申请
    InvestigationReport = 'af-task-center-data-search-report',
    // 前置机申请
    FrontMachineApply = 'af-front-end-processor-request',
    // 应用申请审核
    SSZDAppApplyEscalate = 'af-sszd-app-apply-escalate',
    // 省直达应用上报审核
    SSZDAppReportEscalate = 'af-sszd-app-report-escalate',
    // 数据理解工单申请
    WorkOrderUnderstanding = 'af-data-comprehension-work-order',
    // 数据归集工单申请
    WorkOrderCollection = 'af-data-aggregation-work-order',
    // 标准化工单申请
    WorkOrderStandard = 'af-data-standardization-work-order',
    // 数据质量整改申请
    WorkOrderQuality = 'af-data-quality-work-order',
    // 质量检测工单申请
    WorkOrderQualityExamine = 'af-data-quality-audit-work-order',
    // 融合工单申请
    WorkOrderFusion = 'af-data-fusion-work-order',
    // 调研工单申请
    WorkOrderResearch = 'af-research-report-work-order',
    // 资源编目申请
    WorkOrderDataCatalog = 'af-data-catalog-work-order',
    // 前置机工单申请
    WorkOrderFrontProcessors = 'af-front-end-processors-work-order',
    // 租户申请
    TenantApplication = 'af-data-processing-tenant-application',
    // 标签管理
    BigdataCreateCategoryLabel = 'af-basic-bigdata-create-category-label', // 业务标签分类发布审核
    BigdataUpdateCategoryLabel = 'af-basic-bigdata-update-category-label', // 业务标签分类变更审核
    BigdataDeleteCategoryLabel = 'af-basic-bigdata-delete-category-label', // 业务标签分类删除审核
    BigdataAuthCategoryLabel = 'af-basic-bigdata-auth-category-label', // 业务标签授权审核
    // 市州共享申请
    // 申报审核
    ShareApplyReport = 'af_share_apply_report',
    // 分析结论审核
    ShareApplyAnalysis = 'af_share_apply_analysis',
    // 数据推送
    DataPushAudit = 'af-data-push-audit',
    // 业务领域 发布
    AfBgPublishBusinessArea = 'af-bg-publish-business-area',
    // 业务领域 删除
    AfBgDeleteBusinessArea = 'af-bg-delete-business-area',
    // 主干业务 发布
    AfBgPublishMainBusiness = 'af-bg-publish-main-business',
    // 业务诊断 发布
    AfBgPublishBusinessDiagnosis = 'af-bg-publish-business-diagnosis',
    // 业务模型 发布
    AfBgPublishBusinessModel = 'af-bg-publish-business-model',
    // 数据模型 发布
    AfBgPublishDataModel = 'af-bg-publish-data-model',
    // 文件资源 发布
    AfFileResourcePublish = 'af-file-resource-publish',
    // 数据分析需求申报审核
    AfDataAnalRequireReport = 'af_data_anal_require_report',
    // 数据分析需求分析结论审核
    AfDataAnalRequireAnalysis = 'af_data_anal_require_analysis',
    // 数据沙箱申请
    AfDataSandboxApply = 'af-db-sandbox-apply',
    // 数据沙箱扩容
    AfDataSandboxExtend = 'af-db-sandbox-extend',
    // 成效反馈
    AfCitySharingFeedback = 'af_share_apply_feedback',
    // 数据分析需求成效反馈
    AfDataAnalRequireFeedback = 'af_data_anal_require_feedback',
    // 数据分析需求分析成果出库审核
    AfDataAnalRequireOutbound = 'af_data_anal_require_outbound',
    AfDwhDataAuthRequest = 'af-dwh-data-auth-request',
}

export interface IoptionItem {
    value: string
    label: string
}

export interface IProcessItem {
    audit_type: string
    label: string
    value: string | null
    searchValue: string
    error: '' | 'error' | 'warning' | undefined
    placeholder: string
    options: IoptionItem[]
    showOptBtn: boolean
    showUnbind?: boolean
    disabledUnbindBtn?: boolean
    initData: any[]
}
