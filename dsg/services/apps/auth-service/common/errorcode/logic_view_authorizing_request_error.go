package errorcode

func init() {
	registerErrorCode(logicViewAuthorizingRequestErrorMap)
}

const (
	logicViewAuthorizingRequestModelName = "LogicViewAuthorizingRequest"
)

const (
	LogicViewAuthorizingRequestPreCoder = ServiceName + "." + logicViewAuthorizingRequestModelName

	// 当前用户不是正在审核的审核员
	LogicViewAuthorizingRequestNotAuditor = LogicViewAuthorizingRequestPreCoder + ".NotAuditor"
	// 未找到指定的逻辑视图授权申请
	LogicViewAuthorizingRequestNotFound = LogicViewAuthorizingRequestPreCoder + ".NotFound"
	// 未找到逻辑视图授权申请引用的逻辑视图
	LogicViewAuthorizingRequestLogicViewNotFound = LogicViewAuthorizingRequestPreCoder + ".LogicViewNotFound"
	// 未找到逻辑视图授权申请引用的操作者
	LogicViewAuthorizingRequestSubjectNotFound = LogicViewAuthorizingRequestPreCoder + ".SubjectNotFound"
	// 未找到审核流程绑定
	LogicViewAuthorizingRequestProcessBindNotFound = LogicViewAuthorizingRequestPreCoder + ".AuditProcessNotFound"
)

var logicViewAuthorizingRequestErrorMap = errorCode{
	LogicViewAuthorizingRequestNotAuditor: {
		description: "当前用户不是正在审核的审核员",
	},
	LogicViewAuthorizingRequestNotFound: {
		description: "逻辑视图授权申请[%s]未找到",
	},
	LogicViewAuthorizingRequestLogicViewNotFound: {
		description: "逻辑视图授权申请引用的逻辑视图[%s]未找到",
	},
	LogicViewAuthorizingRequestSubjectNotFound: {
		description: "逻辑视图授权申请引用的操作者[%s/%s]未找到",
	},
	LogicViewAuthorizingRequestProcessBindNotFound: {
		description: "审核流程绑定[%s]未找到",
	},
}
