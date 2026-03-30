package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

// CommonStatus项目和任务等状态
type CommonStatus enum.Object

var (
	CommonStatusReady     = enum.New[CommonStatus](1, "ready", "未开始")
	CommonStatusOngoing   = enum.New[CommonStatus](2, "ongoing", "进行中")
	CommonStatusCompleted = enum.New[CommonStatus](3, "completed", "已完成")
)

// CommonPriority 项目和任务等优先级
type CommonPriority enum.Object

var (
	CommonPriorityCommon = enum.New[CommonPriority](1, "common", "普通")
	CommonStatusEmergent = enum.New[CommonPriority](2, "emergent", "紧急")
	CommonStatusUrgent   = enum.New[CommonPriority](3, "urgent", "非常紧急")
)

type NodeStartMode string

const (
	AllNodeCompletion NodeStartMode = "all_node_completion" //全部前序节点完成
	AnyNodeCompletion NodeStartMode = "any_node_completion" //任一前序节点完成
	AnyNodeStart      NodeStartMode = "any_node_start"      //任一前序节点处于非未启动
)

func (n NodeStartMode) ToString() string {
	return string(n)
}

// TaskType 任务类型枚举
type TaskType enum.Object

var (
	TaskTypeNormal = enum.New[TaskType](1<<0, "normal", "普通任务")

	//TaskTypeModeling          = enum.New[TaskType](1<<1, "modeling", "业务建模任务")
	//TaskTypeStandardization   = enum.New[TaskType](1<<2, "standardization", "业务表标准化任务")
	//TaskTypeIndicator         = enum.New[TaskType](1<<3, "indicator", "业务指标梳理任务")
	TaskTypeFieldStandard               = enum.New[TaskType](1<<4, "fieldStandard", "新建标准任务")
	TaskTypeDataCollecting              = enum.New[TaskType](1<<5, "dataCollecting", "数据采集任务")
	TaskTypeDataProcessing              = enum.New[TaskType](1<<6, "dataProcessing", "数据加工任务")
	TaskTypeNewMainBusiness             = enum.New[TaskType](1<<7, "modeling", "业务建模任务")
	TaskTypeDataComprehension           = enum.New[TaskType](1<<8, "dataComprehension", "数据目录理解任务")
	TaskTypeSyncDataView                = enum.New[TaskType](1<<9, "syncDataView", "同步数据表视图任务")
	TaskTypeIndicatorProcessing         = enum.New[TaskType](1<<10, "indicatorProcessing", "指标开发任务")
	TaskTypeDataComprehensionWorkOrder  = enum.New[TaskType](1<<11, "dataComprehensionWorkOrder", "数据资源目录理解工单任务")
	TaskTypeDataMainBusiness            = enum.New[TaskType](1<<12, "dataModeling", "数据建模任务")
	TaskTypeMainBusiness                = enum.New[TaskType](1<<13, "mainBusiness", "主干业务梳理任务")
	TaskTypeBusinessDiagnosis           = enum.New[TaskType](1<<14, "businessDiagnosis", "业务建模诊断任务")
	TaskTypeStandardization             = enum.New[TaskType](1<<15, "standardization", "标准新建任务")
	TaskTypeResearchReportWorkOrder     = enum.New[TaskType](1<<16, "researchReportWorkOrder", "调研工单任务")
	TaskTypeDataCatalogWorkOrder        = enum.New[TaskType](1<<17, "dataCatalogWorkOrder", "资源编目工单任务")
	TaskTypeFrontEndProcessorsWorkOrder = enum.New[TaskType](1<<18, "frontEndProcessorsWorkOrder", "前置机申请工单任务")
)

var ModelTaskTypeSlice = []int32{
	TaskTypeNewMainBusiness.Integer.Int32(),
	TaskTypeDataMainBusiness.Integer.Int32(),
}

// TaskTypeStrings 所有任务类型的逗号分隔字符串
var TaskTypeStrings = enum.Strings[TaskType](enum.String)

// RelationIdType 根据任务类型判断的关联数据类型
type RelationIdType enum.Object

var (
	RelationDataTypeBusinessModelId = enum.New[RelationIdType](1, "businessModelId", "业务模型ID&数据模型ID")
	RelationDataTypeBusinessFromId  = enum.New[RelationIdType](2, "businessFormId", "业务表ID")
	RelationDataTypeCatalogId       = enum.New[RelationIdType](3, "catalogId", "数据目录ID")
	RelationDataBusinessIndicator   = enum.New[RelationIdType](4, "businessIndicatorId", "业务指标ID")
	RelationDataTypeDomainId        = enum.New[RelationIdType](5, "domainId", "主干业务ID")
	RelationFileId                  = enum.New[RelationIdType](5, "fileId", "文件ID")
)

// TaskRelationLevel 任务关联的层级
type TaskRelationLevel int

var (
	TaskRelationInvalid             TaskRelationLevel = -1 //非法的任务类型
	TaskRelationEmpty               TaskRelationLevel = 0  //任务啥也不关联
	TaskRelationMainBusiness        TaskRelationLevel = 1  //任务关联到业务建模和数据建模
	TaskRelationDomain              TaskRelationLevel = 2  //任务关联到主干业务（业务流程）
	TaskRelationBusinessForm        TaskRelationLevel = 3  //任务关联到业务表单
	TaskRelationDataCatalog         TaskRelationLevel = 4  //任务关联到数据资源目录
	TaskRelationBusinessIndicator   TaskRelationLevel = 5  //任务关联到业务指标
	TaskRelationStandardizationFile TaskRelationLevel = 6  //任务关联到标准文件
)

// TaskConfigStatus 任务的配置状态，即关联的信息表是否已经被删除
type TaskConfigStatus enum.Object

var (
	TaskConfigStatusNormal                   = enum.New[TaskConfigStatus](1, "normal", "正常任务")                  // 正常状态
	TaskConfigStatusBusinessDomainDeleted    = enum.New[TaskConfigStatus](2, "businessDomainDeleted", "业务域被删除") // 缺失业务域
	TaskConfigStatusMainBusinessDeleted      = enum.New[TaskConfigStatus](3, "mainBusinessDeleted", "主干业务被删除")  // 缺失主干业务
	TaskConfigStatusExecutorDeleted          = enum.New[TaskConfigStatus](4, "executorDeleted", "任务执行人被移除")     // 缺失任务执行人
	TaskConfigStatusFormDeleted              = enum.New[TaskConfigStatus](5, "formDeleted", "关联业务表被删除")         // 关联表单删除
	TaskConfigStatusCatalogDeleted           = enum.New[TaskConfigStatus](6, "catalogDeleted", "关联数据资源目录被删除")   // 关联数据资源目录被删除
	TaskConfigStatusBusinessIndicatorDeleted = enum.New[TaskConfigStatus](7, "indicatorDeleted", "关联业务指标被删除")   // 关联业务指标被删除
)

// TaskExecuteStatus  任务是否可执行状态
type TaskExecuteStatus enum.Object

var (
	TaskExecuteStatusBlocked    = enum.New[TaskExecuteStatus](1, "blocked")    //不可执行任务
	TaskExecuteStatusExecutable = enum.New[TaskExecuteStatus](2, "executable") //可执行任务
	TaskExecuteStatusInvalid    = enum.New[TaskExecuteStatus](3, "invalid")    //失效任务
	TaskExecuteStatusCompleted  = enum.New[TaskExecuteStatus](4, "completed")  //已完成任务
)

// AuditStatus 沙箱审核状态
type AuditStatus enum.Object

var (
	AuditStatusUnaudited = enum.New[AuditStatus](0, "unaudited", "未审核") //未审核
	AuditStatusAuditing  = enum.New[AuditStatus](1, "auditing", "审核中")  //审核中
	AuditStatusPass      = enum.New[AuditStatus](2, "approve", "审核通过")  //审核通过
	AuditStatusReject    = enum.New[AuditStatus](3, "reject", "未通过")    //未通过
	AuditStatusUndone    = enum.New[AuditStatus](4, "undone", "审核撤回")   //审核撤回
)

// RequestResult 请求状态，沙箱清单详情页面使用
type RequestResult enum.Object

var (
	RequestResultApprove = enum.New[RequestResult](1, "approve", "通过") //审核通过
	RequestResultReject  = enum.New[RequestResult](2, "reject", "未通过") //未通过
	RequestResultUndone  = enum.New[RequestResult](3, "undone", "撤回")  //撤回
)

// SandboxOperation 沙箱操作类型
type SandboxOperation enum.Object

var (
	SandboxOperationApply  = enum.New[SandboxOperation](1, "apply", "申请")  //申请
	SandboxOperationExtend = enum.New[SandboxOperation](2, "extend", "扩容") //扩容
)

// SandboxExecuteStatus 沙箱状态
type SandboxExecuteStatus enum.Object

var (
	SandboxStatusApplying  = enum.New[SandboxExecuteStatus](1, "applying", "申请中")
	SandboxStatusWaiting   = enum.New[SandboxExecuteStatus](2, "waiting", "待实施")
	SandboxStatusExecuting = enum.New[SandboxExecuteStatus](3, "executing", "实施中")
	SandboxStatusCompleted = enum.New[SandboxExecuteStatus](4, "completed", "已完成")
	SandboxStatusReject    = enum.New[SandboxExecuteStatus](5, "reject", "已驳回")
	SandboxStatusUndone    = enum.New[SandboxExecuteStatus](6, "undone", "已撤回")
)

// OneProjectOneApplyCondition 一个项目只能有一个未完成的申请
var OneProjectOneApplyCondition = []int32{
	SandboxStatusWaiting.Integer.Int32(),
	SandboxStatusExecuting.Integer.Int32(),
}

// SandboxExecuteStep 沙箱请求执行步骤，沙箱详情使用
type SandboxExecuteStep enum.Object

var (
	SandboxExecuteStepApply     = enum.New[SandboxExecuteStep](1, "apply", "申请")
	SandboxExecuteStepExtend    = enum.New[SandboxExecuteStep](2, "extend", "扩容")
	SandboxExecuteStepAuditing  = enum.New[SandboxExecuteStep](3, "auditing", "审核")
	SandboxExecuteStepExecution = enum.New[SandboxExecuteStep](4, "execution", "实施")
	SandboxExecuteStepCompleted = enum.New[SandboxExecuteStep](5, "completed", "已完成")
)

// SandboxSpaceStatus 沙箱空间状态
type SandboxSpaceStatus enum.Object

var (
	SandboxSpaceStatusDisable   = enum.New[SandboxSpaceStatus](0, "disable", "不可用")
	SandboxSpaceStatusAvailable = enum.New[SandboxSpaceStatus](1, "available", "可用")
)

// ExecuteType 实施方式
type ExecuteType enum.Object

var (
	ExecuteTypeOnline  = enum.New[ExecuteType](1, "online", "线上")
	ExecuteTypeOffline = enum.New[ExecuteType](2, "offline", "线下")
)

// ProjectType 项目类型
type ProjectType enum.Object

var (
	ProjectTypeFromLocal      = enum.New[ProjectType](1, "local", "本地")
	ProjectTypeFromThirdParty = enum.New[ProjectType](2, "thirdParty", "来自第三方")
)
