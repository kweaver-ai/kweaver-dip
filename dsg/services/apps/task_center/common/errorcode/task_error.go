package errorcode

const (
	TaskInvalidParameter     = taskPreCoder + "InvalidParameter"
	TaskInvalidParameterJson = taskPreCoder + "InvalidParameterJson"
	TaskNameRepeatError      = taskPreCoder + "NameRepeatError"
	TaskDatabaseError        = taskPreCoder + "DatabaseError"
	TaskRecordNotFoundError  = taskPreCoder + "RecordNotFoundError"
	TaskPanic                = taskPreCoder + "Panic"

	TaskToModelError                          = taskPreCoder + "ToModelError"
	TaskProjectNotFound                       = taskPreCoder + "ProjectNotFound"
	TaskTaskNotFound                          = taskPreCoder + "TaskNotFound"
	TaskNodeNotFound                          = taskPreCoder + "NodeNotFound"
	TaskExecutorUserRoleNotInNode             = taskPreCoder + "ExecutorUserRoleNotInNode"
	TaskNodeExecutorRoleIdNotExist            = taskPreCoder + "NodeExecutorRoleIdNotExist"
	TaskExecutorUserNotHasMembersInProject    = taskPreCoder + "ExecutorUserNotHasMembersInProject"
	TaskExecutorUserNotInProjectMembers       = taskPreCoder + "ExecutorUserNotInProjectMembers"
	TaskProjectMembersIsEmpty                 = taskPreCoder + "ProjectMembersIsEmpty"
	TaskCannotOpening                         = taskPreCoder + "CannotOpening"
	TaskCannotOpeningNoExecutor               = taskPreCoder + "CannotOpeningNoExecutor"
	TaskLackProjectId                         = taskPreCoder + "LackProjectId"
	TaskExecutorFilteringFailed               = taskPreCoder + "ExecutorFilteringFailed"
	TaskFlowNotExist                          = taskPreCoder + "FlowNotExist"
	TaskNodeNotExist                          = taskPreCoder + "NodeNotExist"
	TaskUserNotExist                          = taskPreCoder + "UserNotExist"
	TaskStatusChangesFailed                   = taskPreCoder + "StatusChangesFailed"
	TaskStageIdIsRequired                     = taskPreCoder + "StageIdIsRequired"
	TaskFlowHadNodeNoStage                    = taskPreCoder + "FlowHadNodeNoStage"
	TaskFlowHadNoNode                         = taskPreCoder + "FlowHadNoNode"
	TaskStageIdIllegality                     = taskPreCoder + "StageIdIllegality"
	TaskNodeNotBelongStageId                  = taskPreCoder + "NodeNotBelongStageId"
	TaskNodeIdRequired                        = taskPreCoder + "NodeIdRequired"
	TaskDeleteFailed                          = taskPreCoder + "DeleteFailed"
	TaskCanNotDelete                          = taskPreCoder + "CanNotDelete"
	TaskCanNotChangeExecutor                  = taskPreCoder + "CanNotChangeExecutor"
	TaskCanNotBothChangeExecutorAndStatus     = taskPreCoder + "CanNotBothChangeExecutorAndStatus"
	TaskCanNotChangeStatusWhenProjectNotStart = taskPreCoder + "CanNotChangeStatusWhenProjectNotStart"
	TaskOnlyProjectOwnerCanChange             = taskPreCoder + "OnlyProjectOwnerCanChange"
	TaskHasPreNodeNotExist                    = taskPreCoder + "HasPreNodeNotExist"
	TaskHasPreNodeTasksEmpty                  = taskPreCoder + "HasPreNodeTasksEmpty"
	TaskAllPreNodeTasksEmpty                  = taskPreCoder + "AllPreNodeTasksEmpty"
	TaskCannotOpening1                        = taskPreCoder + "TaskCannotOpening1"
	TaskCannotOpening2                        = taskPreCoder + "TaskCannotOpening2"
	TaskProjectCompletedNoCreate              = taskPreCoder + "TaskProjectCompletedNoCreate"
	TaskProjectCompletedNoModify              = taskPreCoder + "TaskProjectCompletedNoModify"
	TaskProjectCompletedNoDelete              = taskPreCoder + "TaskProjectCompletedNoDelete"
	TaskCompletedNoModify                     = taskPreCoder + "TaskCompletedNoModify"
	TaskCannotCreate                          = taskPreCoder + "TaskCannotCreate"
	TaskTypeNotMathNode                       = taskPreCoder + "TaskTypeNotMathNode"

	TaskDomainNotEmpty              = taskPreCoder + "TaskDomainNotEmpty"
	TaskDomainMustEmpty             = taskPreCoder + "TaskDomainMustEmpty"
	TaskDomainNotExist              = taskPreCoder + "TaskDomainNotExist"
	TaskMainBusinessNotExist        = taskPreCoder + "TaskMainBusinessNotExist"
	TaskMainBusinessNotDeleted      = taskPreCoder + "TaskMainBusinessDeleted"
	TaskMainBusinessNotEmpty        = taskPreCoder + "TaskMainBusinessNotEmpty"
	TaskActiveFollowError           = taskPreCoder + "TaskActiveFollowError"
	FieldTaskStandaloneNotAllowed   = taskPreCoder + "FieldTaskStandaloneNotAllowed"
	ParentTaskIdEmpty               = taskPreCoder + "ParentTaskIdEmpty"
	DomainIdEmpty                   = taskPreCoder + "DomainIdEmpty"
	ParentTaskMustMatched           = taskPreCoder + "ParentTaskMustMatched"
	SubTaskMustFinished             = taskPreCoder + "SubTaskMustFinished"
	FieldStandardMustFinished       = taskPreCoder + "FieldStandardMustFinished"
	ParentTaskIdNotExists           = taskPreCoder + "ParentTaskIdNotExists"
	ParentTaskIdNotOnGoing          = taskPreCoder + "ParentTaskIdNotOnGoing"
	StandardTaskFinisRateQueryError = taskPreCoder + "StandardTaskFinisRateQueryError"
	TaskModelShouldBeMainBusiness   = taskPreCoder + "TaskModelShouldBeMainBusiness"
	TaskRelationDataInvalid         = taskPreCoder + "RelationDataInvalid"
	TaskRelationDataEmpty           = taskPreCoder + "RelationDataEmpty"
	TaskRelationDataQueryError      = taskPreCoder + "RelationDataQueryError"
	TaskRelationDataDeleteError     = taskPreCoder + "RelationDataDeleteError"
	TaskExecutorRoleIdNotExist      = taskPreCoder + "TaskExecutorRoleIdNotExist"
	TaskDataCatalogJsonError        = taskPreCoder + "DataCatalogJsonError"
	TaskDataCatalogUrlError         = taskPreCoder + "DataCatalogUrlError"
	TaskDataCatalogQueryError       = taskPreCoder + "DataCatalogQueryError"
	TaskDataIndicatorEmpty          = taskPreCoder + "TaskDataIndicatorEmpty"
	TaskOnlyCanChangeByOwner        = taskPreCoder + "TaskOnlyCanChangeByOwner"

	TaskDataCompletedAuditStatusError = taskPreCoder + "TaskDataCompletedAuditStatusError"
	TaskDataExplorationUrlError     = taskPreCoder + "DataExplorationUrlError"
	TaskDataExplorationQueryError   = taskPreCoder + "DataExplorationQueryError"
	TaskDataExplorationJsonError    = taskPreCoder + "DataExplorationJsonError"
	TaskDataViewUrlError            = taskPreCoder + "DataViewUrlError"
	TaskDataViewQueryError          = taskPreCoder + "DataViewQueryError"
	TaskDataViewJsonError           = taskPreCoder + "DataViewJsonError"
)

var taskErrorMap = errorCode{
	TaskInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    SeeAPIManual,
	},
	TaskInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		cause:       "",
		solution:    SeeAPIManual,
	},
	TaskDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		cause:       "",
		solution:    CheckDatabaseOrSyntax,
	},
	TaskNameRepeatError: {
		description: "该任务名称已存在，请重新输入",
		cause:       "",
		solution:    "请检查输入的项目名称",
	},
	TaskRecordNotFoundError: {
		description: "该任务不存在",
		cause:       "没有该任务",
		solution:    "请重新操作",
	},

	TaskToModelError: {
		description: "任务信息不合法",
		cause:       "",
		solution:    "",
	},
	TaskProjectNotFound: {
		description: "该项目不存在",
		cause:       "",
		solution:    "请重新操作",
	},
	TaskTaskNotFound: {
		description: "该任务不存在",
		cause:       "",
		solution:    "请重新操作",
	},
	TaskNodeNotFound: {
		description: "该节点不存在",
		cause:       "",
		solution:    "请重新操作",
	},
	TaskExecutorUserRoleNotInNode: {
		description: "所选任务执行人角色不属于该节点的角色",
		cause:       "",
		solution:    "请重新选择",
	},
	TaskNodeExecutorRoleIdNotExist: {
		description: "该流水线节点的可执行角色在角色列表中不存在",
		cause:       "",
		solution:    "",
	},
	TaskExecutorUserNotHasMembersInProject: {
		description: "该项目中没有所选任务执行人角色的项目成员",
		cause:       "",
		solution:    "请在项目中添加该角色的项目成员",
	},
	TaskExecutorUserNotInProjectMembers: {
		description: "所选任务执行人不在项目成员中",
		cause:       "",
		solution:    "请重新选择",
	},
	TaskProjectMembersIsEmpty: {
		description: "暂未添加该节点可执行角色的项目成员",
		cause:       "",
		solution:    "请先添加该节点可执行角色的项目成员",
	},
	TaskCannotOpening: {
		description: "任务不能开启",
		cause:       "",
		solution:    "请完成序节点状态",
	},
	TaskCannotOpeningNoExecutor: {
		description: "任务不能开启，任务缺少任务执行人",
		cause:       "",
		solution:    "请设置任务执行人",
	},
	TaskLackProjectId: {
		description: "缺少项目标识",
		cause:       "",
		solution:    "请检查",
	},
	TaskExecutorFilteringFailed: {
		description: "我执行的任务不能按任务执行人筛选",
		cause:       "",
		solution:    "请检查",
	},
	TaskFlowNotExist: {
		description: "流水线不存在",
		cause:       "",
		solution:    "请重新选择流水线",
	},
	TaskNodeNotExist: {
		description: "该节点不存在",
		cause:       "",
		solution:    "请重新选择节点",
	},
	TaskUserNotExist: {
		description: "该任务执行人不存在",
		cause:       "",
		solution:    "请重新选择执行人",
	},
	TaskStatusChangesFailed: {
		description: "该任务状态切换失败,只能按照未开启->进行中->已完成流程切换状态",
		cause:       "",
		solution:    "请重新选择状态",
	},
	TaskStageIdIsRequired: {
		description: "该流水线有阶段，阶段id必填",
		cause:       "",
		solution:    "请重试",
	},
	TaskFlowHadNodeNoStage: {
		description: "该流水线存在某个节点不属于某个阶段",
		cause:       "",
		solution:    "请重试",
	},
	TaskFlowHadNoNode: {
		description: "该流水线没有节点",
		cause:       "",
		solution:    "请重试",
	},
	TaskStageIdIllegality: {
		description: "该阶段id不存在该项目的流水线中",
		cause:       "",
		solution:    "请重试",
	},
	TaskNodeNotBelongStageId: {
		description: "该节点不属于该阶段",
		cause:       "",
		solution:    "请重试",
	},
	TaskNodeIdRequired: {
		description: "编辑关联项目，节点必选",
		cause:       "",
		solution:    "请重试",
	},
	TaskDeleteFailed: {
		description: "该任务不存在",
		cause:       "",
		solution:    "请重试",
	},
	TaskCanNotDelete: {
		description: "任务已完成，不允许删除",
		cause:       "",
		solution:    "请重试",
	},
	TaskCanNotChangeExecutor: {
		description: "该状态的任务不能修改执行人",
		cause:       "",
		solution:    "请重试",
	},
	TaskCanNotBothChangeExecutorAndStatus: {
		description: "任务不能同时开启任务和修改执行人为空",
		cause:       "",
		solution:    "请重试",
	},
	TaskCanNotChangeStatusWhenProjectNotStart: {
		description: "项目未开启情况下任务也不能开启",
		cause:       "",
		solution:    "请重试",
	},
	TaskOnlyProjectOwnerCanChange: {
		description: "只有项目管理员才能从完成切换到",
		cause:       "",
		solution:    "请重试",
	},
	TaskOnlyCanChangeByOwner: {
		description: "只有项目管理员、任务创建者、任务执行者才能编辑任务",
		cause:       "",
		solution:    "请重试",
	},
	TaskHasPreNodeNotExist: {
		description: "存在不合法的前序节点",
		cause:       "",
		solution:    "请检查配置中心获取的数据",
	},
	TaskHasPreNodeTasksEmpty: {
		description: "该节点的前序节点并未添加任务，请先添加任务",
		cause:       "",
		solution:    "请检查前序节点",
	},
	TaskAllPreNodeTasksEmpty: {
		description: "该节点的全部前序节点并未添加任务，请先添加任务",
		cause:       "",
		solution:    "请检查前序节点",
	},
	TaskCannotOpening1: {
		description: "该节点的前序节点中任务并未全部完成，请检查",
		cause:       "",
		solution:    "请检查前序节点",
	},
	TaskCannotOpening2: {
		description: "该节点的全部前序节点中存在未完成的任务，请检查",
		cause:       "",
		solution:    "请检查前序节点",
	},
	TaskProjectCompletedNoCreate: {
		description: "已完成的项目不允许新建",
		cause:       "",
		solution:    "请检查项目状态",
	},
	TaskProjectCompletedNoModify: {
		description: "已完成的项目不允许修改",
		cause:       "",
		solution:    "请检查项目状态",
	},
	TaskProjectCompletedNoDelete: {
		description: "已完成的项目不允许删除",
		cause:       "",
		solution:    "请检查项目状态",
	},
	TaskCompletedNoModify: {
		description: "已完成的任务不允许编辑",
		cause:       "",
		solution:    "请检查任务状态",
	},
	TaskCannotCreate: {
		description: "当前项目中该节点状态为“已完成”，无法新建任务",
		cause:       "",
		solution:    "请检查节点状态",
	},
	TaskTypeNotMathNode: {
		description: "无法新建与节点任务类型不匹配的任务",
		cause:       "",
		solution:    "请检查节点任务类型，重新创建",
	},

	TaskDomainNotEmpty: {
		description: "建模类任务，必须关联业务域",
		cause:       "",
		solution:    "请修改参数重试",
	},
	TaskDomainMustEmpty: {
		description: "非建模类任务，业务域必须为空",
		cause:       "",
		solution:    "请修改参数重试",
	},
	TaskDomainNotExist: {
		description: "该业务流程不存在",
		cause:       "",
		solution:    "请重新选择业务域",
	},
	TaskMainBusinessNotExist: {
		description: "该主干业务不存在",
		cause:       "",
		solution:    "请重新选择",
	},
	TaskMainBusinessNotDeleted: {
		description: "该主干业务已被删除",
		cause:       "",
		solution:    "请重新选择",
	},
	TaskMainBusinessNotEmpty: {
		description: "必须关联主干业务",
		cause:       "",
		solution:    "请修改参数重试",
	},
	FieldTaskStandaloneNotAllowed: {
		description: "单个任务不支持新建标准任务",
		solution:    "请在业务表标准换中重试",
	},
	ParentTaskIdEmpty: {
		description: "新建标准任务关联的业务表标准化任务不能为空",
		cause:       "",
		solution:    "请关联业务表标准化任务",
	},
	DomainIdEmpty: {
		description: "业务建模任务关联的业务流程不能为空",
		cause:       "",
		solution:    "请关联业务流程，且id格式必须为uuid",
	},
	ParentTaskMustMatched: {
		description: "新建标准任务只能关联的业务表标准化任务",
		cause:       "",
		solution:    "请关联业务表标准化任务",
	},
	SubTaskMustFinished: {
		description: "新建标准任务必须都完成才可以完成业务表标准化任务",
		cause:       "",
		solution:    "请先完成新建标准任务",
	},
	FieldStandardMustFinished: {
		description: "字段标准必须都创建完毕才可以完成新建标准任务",
		cause:       "",
		solution:    "请先完成新建标准任务",
	},
	ParentTaskIdNotExists: {
		description: "父任务不存在",
		cause:       "",
		solution:    "请检查",
	},
	ParentTaskIdNotOnGoing: {
		description: "父任务未开启",
		cause:       "",
		solution:    "请开启父任务",
	},
	StandardTaskFinisRateQueryError: {
		description: "新建标准任务字段完成详情查询错误",
		cause:       "",
		solution:    "请重试",
	},
	TaskModelShouldBeMainBusiness: {
		description: "指标类任务必须关联主干业务对应的业务模型",
		solution:    "请修改参数重试",
	},
	TaskActiveFollowError: {
		description: "激活后续任务失败",
		solution:    "请重试",
	},
	TaskRelationDataInvalid: {
		description: "任务关联的数据非法",
		solution:    "请重试",
	},
	TaskRelationDataEmpty: {
		description: "任务关联的数据为空",
		solution:    "请至少关联一条数据",
	},
	TaskRelationDataQueryError: {
		description: "任务关联数据查询错误",
		solution:    "请重试",
	},
	TaskRelationDataDeleteError: {
		description: "任务关联数据删除错误",
		solution:    "请重试",
	},
	TaskExecutorRoleIdNotExist: {
		description: "该任务的可执行角色在角色列表中不存在",
		cause:       "",
		solution:    "",
	},
	TaskDataCatalogJsonError: {
		description: "数据资源目录接口数据错误",
		solution:    "请重试",
	},
	TaskDataCatalogUrlError: {
		description: "数据资源目录服务异常，或url地址有误",
		solution:    "请检查数据资源目录服务，检查ip和端口后重试",
	},
	TaskDataCatalogQueryError: {
		description: "数据资源目录查询失败",
		solution:    "请检查参数后重试",
	},
	TaskDataIndicatorEmpty: {
		description: "未关联业务指标",
		solution:    "请至少关联一个业务指标",
	},
	TaskDataCompletedAuditStatusError: {
		description: "任务需要等待审核通过后才允许完成任务",
		solution:    "该任务需要等待审核通过后才允许完成任务",
	},
	TaskDataExplorationUrlError: {
		description: "数据探查服务异常，或url地址有误",
		solution:    "请检查数据探查服务，检查ip和端口后重试",
	},
	TaskDataExplorationQueryError: {
		description: "数据探查服务查询失败",
		solution:    "请检查参数后重试",
	},
	TaskDataExplorationJsonError: {
		description: "数据探查服务接口数据错误",
		solution:    "请重试",
	},
	TaskDataViewUrlError: {
		description: "逻辑视图服务异常，或url地址有误",
		solution:    "请检查逻辑视图服务，检查ip和端口后重试",
	},
	TaskDataViewQueryError: {
		description: "逻辑视图服务查询失败",
		solution:    "请检查参数后重试",
	},
	TaskDataViewJsonError: {
		description: "逻辑视图服务接口数据错误",
		solution:    "请重试",
	},
}
