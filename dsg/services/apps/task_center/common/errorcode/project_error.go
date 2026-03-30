package errorcode

const (
	ProjectInvalidParameter         = projectPreCoder + "InvalidParameter"
	ProjectInvalidParameterJson     = projectPreCoder + "InvalidParameterJson"
	ProjectNameRepeatError          = projectPreCoder + "NameRepeatError"
	ProjectDatabaseError            = projectPreCoder + "DatabaseError"
	ProjectStatusError              = projectPreCoder + "StatusError"
	ProjectCompletedCantUpdateError = projectPreCoder + "CompletedCantUpdate"
	ProjectStatusCompletedError     = projectPreCoder + "StatusCompletedError"
	ProjectRecordNotFoundError      = projectPreCoder + "RecordNotFoundError"
	ProjectViewNotFoundError        = projectPreCoder + "ViewNotFoundError"
	ProjectNotAllowedError          = projectPreCoder + "NotAllowedError"
	ProjectModifiableKeyEmpty       = projectPreCoder + "ModifiableKeyEmpty"
	ProjectConfigCenterDataError    = projectPreCoder + "ConfigCenterDataError"
	ProjectConfigCenterUrlError     = projectPreCoder + "ConfigCenterUrlError"
	ProjectConfigCenterFlowNotFound = projectPreCoder + "ConfigCenterFlowNotFound"
	ProjectGetAllTaskError          = projectPreCoder + "GetAllTaskError"
	ProjectImgNotFound              = projectPreCoder + "ProjectImgNotFound"
	ProjectAndViewNotMatchedError   = projectPreCoder + "ProjectAndViewNotMatchedError"

	ProjectGroomingDataError         = projectPreCoder + "BusinessGroomingDataError"
	ProjectGroomingUrlError          = projectPreCoder + "BusinessGroomingUrlError"
	ProjectRoleNotFoundError         = projectPreCoder + "RoleNotFoundError"
	ProjectRelatedFlowChartValid     = projectPreCoder + "ProjectRelatedFlowChartValid"
	ProjectInvalidRole               = projectPreCoder + "InvalidRole"
	ProjectCompletedCantDeleteError  = projectPreCoder + "CompletedCantDeleteError"
	ProjectActiveTaskError           = projectPreCoder + "ProjectActiveTaskError"
	ProjectHasInvalidTaskError       = projectPreCoder + "HasInvalidTaskError"
	ProjectCallBusinessGroomingError = projectPreCoder + "CallBusinessGroomingError"
	OwnerIdIsNotProjectMgm           = projectPreCoder + "OwnerIdIsNotProjectMgm"
)

var projectErrorMap = errorCode{
	ProjectInvalidParameter: {
		description: "参数值校验不通过",
		solution:    SeeAPIManual,
	},
	ProjectInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		solution:    SeeAPIManual,
	},
	ProjectDatabaseError: {
		description: "数据库连接错误或者SQL语句错误",
		solution:    CheckDatabaseOrSyntax,
	},
	ProjectStatusError: {
		description: "项目状态修改错误，请检查重试",
		solution:    "请检查重试",
	},
	ProjectCompletedCantUpdateError: {
		description: "已完成的项目不允许编辑",
		solution:    "请选择未完成的项目重新操作",
	},
	ProjectCompletedCantDeleteError: {
		description: "已完成的项目不允许删除",
		solution:    "请谨慎操作",
	},
	ProjectStatusCompletedError: {
		description: "该项目存在未完成的任务，暂不可变更为已完成状态",
		solution:    "请检查项目任务，在完成任务后重试",
	},
	ProjectNameRepeatError: {
		description: "该项目名称已存在，请重新输入",
		solution:    "请检查输入的项目名称",
	},
	ProjectRecordNotFoundError: {
		description: "该项目不存在",
		solution:    "请选择存在的项目重新操作",
	},
	ProjectViewNotFoundError: {
		description: "该流水线视图不存在",
		solution:    "请重新操作",
	},
	ProjectNotAllowedError: {
		description: "项目不允许删除",
		solution:    SeeAPIManual,
	},
	ProjectModifiableKeyEmpty: {
		description: "可修改属性为空",
		cause:       "输入的属性不包含可修改的属性",
		solution:    SeeAPIManual,
	},
	ProjectConfigCenterDataError: {
		description: "配置中心返回的数据有误",
		solution:    "请重试",
	},
	ProjectConfigCenterUrlError: {
		description: "配置中心服务异常，或url地址有误",
		solution:    "请检查配置中心服务，检查ip和端口后重试",
	},
	ProjectConfigCenterFlowNotFound: {
		description: "该版本的流水线不存在",
		solution:    "请检查参数：flowchart_id 和 flowchart_version",
	},
	ProjectGetAllTaskError: {
		description: "该项目不存在任务，暂不可变更为已完成状态",
		solution:    "请新建项目任务并完成后重试",
	},
	ProjectImgNotFound: {
		description: "该图片不存在",
		solution:    "请重试",
	},
	ProjectAndViewNotMatchedError: {
		description: "项目和流水线不匹配",
		solution:    "请检查项目ID和流水线参数",
	},

	ProjectGroomingDataError: {
		description: "业务治理服务返回的数据有误",
		solution:    "请重试",
	},
	ProjectGroomingUrlError: {
		description: "业务治理服务异常，或url地址有误",
		solution:    "请检查业务治理服务，检查ip和端口后重试",
	},
	ProjectRoleNotFoundError: {
		description: "项目角色不存在",
		solution:    "请检查项目成员角色",
	},
	ProjectRelatedFlowChartValid: {
		description: "关联流水线失效，请重新选择",
		solution:    "请检查流水线",
	},
	ProjectInvalidRole: {
		description: "流水线不存在该角色",
		solution:    "请检查输入参数",
	},
	ProjectActiveTaskError: {
		description: "激活任务失败",
		solution:    "请重试",
	},
	ProjectHasInvalidTaskError: {
		description: "项目完成前请先删除失效任务",
		solution:    "请先删除失效任务",
	},
	OwnerIdIsNotProjectMgm: {
		description: "项目负责人不具备项目管理员角色",
		solution:    "请先给该用户添加项目管理员角色",
	},
	ProjectCallBusinessGroomingError: {
		description: "调用业务治理服务错误",
		solution:    "请重试",
	},
}
