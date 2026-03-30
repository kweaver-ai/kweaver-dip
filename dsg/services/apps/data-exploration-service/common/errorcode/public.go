package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
)

// Model Name
const (
	publicModelName = constant.ServiceName + ".Public."
)

const (
	PublicInternalError            = publicModelName + "InternalError"
	PublicInvalidParameter         = publicModelName + "InvalidParameter"
	PublicInvalidParameterJson     = publicModelName + "InvalidParameterJson"
	PublicInvalidParameterValue    = publicModelName + "InvalidParameterValue"
	PublicVEngineRequestBad        = publicModelName + "VEngineRequestBad"
	PublicUniqueIDError            = publicModelName + "PublicUniqueIDError"
	PublicDatabaseParameterError   = publicModelName + "DatabaseParameterError"
	PublicDataNotFoundError        = publicModelName + "DataNotFoundError"
	PublicDatabaseError            = publicModelName + "DatabaseError"
	PublicExploreError             = publicModelName + "ExploreError"
	PublicRequestParameterError    = publicModelName + "RequestParameterError"
	UserNotHavePermission          = publicModelName + "UserNotHavePermission"
	AccessTypeNotSupport           = publicModelName + "AccessTypeNotSupport"
	GetAccessPermissionError       = publicModelName + "GetAccessPermissionError"
	TokenAuditFailed               = publicModelName + "TokenAuditFailed"
	UserNotActive                  = publicModelName + "UserNotActive"
	GetUserInfoFailed              = publicModelName + "GetUserInfoFailed"
	GetUserInfoFailedInterior      = publicModelName + "GetUserInfoFailedInterior"
	GetTokenEmpty                  = publicModelName + "GetTokenEmpty"
	ADUrlError                     = publicModelName + "ADUrlError"
	ModelTaskCenterProjectNotFound = publicModelName + "TaskCenterProjectNotFoundError"
	ADDataError                    = publicModelName + "ADDataError"
	JsonMarshalError               = publicModelName + "JsonMarshalError"
	CurrentEmptyDataError          = publicModelName + "CurrentEmptyDataError"
	OpConflictError                = publicModelName + "OpConflictError"
	MqProduceError                 = publicModelName + "MqProduceError"
	PublicReportUnfinishedError    = publicModelName + "ReportUnfinishedError"
	PublicReportFailedError        = publicModelName + "ReportFailedError"
	StandardizationUrlError        = publicModelName + "StandardizationUrlError"
)

var publicErrorMap = errorCode{
	JsonMarshalError: {
		description: "json.Marshal转化失败",
		cause:       "",
		solution:    "检查文件内容",
	},
	ADDataError: {
		description: "AnyData返回的数据有误",
		solution:    "请重试",
	},
	ModelTaskCenterProjectNotFound: {
		description: "该项目不存在",
		solution:    "请检查参数：project_id ",
	},
	PublicInternalError: {
		description: "内部错误",
		cause:       "",
		solution:    "",
	},
	CurrentEmptyDataError: {
		description: "暂未获取到数据",
		cause:       "",
		solution:    "请稍后重试",
	},
	PublicInvalidParameter: {
		description: "参数值校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	PublicInvalidParameterJson: {
		description: "参数值校验不通过：json格式错误",
		solution:    "请使用请求参数构造规范化的请求字符串，详细信息参见产品 API 文档",
	},
	PublicInvalidParameterValue: {
		description: "参数值[param]校验不通过",
		cause:       "",
		solution:    "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档",
	},
	PublicDatabaseError: {
		description: "数据库异常",
		cause:       "",
		solution:    "请检查执行SQL或数据库状态",
	},
	PublicRequestParameterError: {
		description: "请求参数格式错误",
		cause:       "输入请求参数格式或内容有问题",
		solution:    "请输入正确格式的请求参数",
	},
	UserNotHavePermission: {
		description: "暂无权限，您可联系系统管理员配置",
		cause:       "",
		solution:    "请重试",
	},
	AccessTypeNotSupport: {
		description: "暂不支持的访问类型",
		cause:       "",
		solution:    "请重试",
	},
	GetAccessPermissionError: {
		description: "获取访问权限失败",
		cause:       "",
		solution:    "请重试",
	},
	TokenAuditFailed: {
		description: "用户信息验证失败",
		cause:       "",
		solution:    "请重试",
	},
	UserNotActive: {
		description: "用户登录已过期",
		cause:       "",
		solution:    "请重新登陆",
	},
	GetUserInfoFailed: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请重试",
	},
	GetUserInfoFailedInterior: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	GetTokenEmpty: {
		description: "获取用户信息失败",
		cause:       "",
		solution:    "请联系系统维护者",
	},
	ADUrlError: {
		description: "AnyData服务异常，或url地址有误",
		solution:    "请检查AnyData服务，检查ip和端口后重试",
	},
	StandardizationUrlError: {
		description: "Standardization服务异常，或url地址有误",
		solution:    "请检查Standardization服务，检查ip和端口后重试",
	},
	PublicExploreError: {
		description: "数据探查失败",
		solution:    "请联系系统管理员，获取错误日志排查问题",
	},
	PublicDatabaseParameterError: {
		description: "数据库连接参数错误",
		solution:    "请检查提交数据库连接参数是否正确",
	},
	PublicVEngineRequestBad: {
		description: "虚拟化引擎请求失败",
		solution:    "请检查提交数据库连接参数或SQL是否正确",
	},
	PublicDataNotFoundError: {
		description: "数据未找到",
		solution:    "请检查请求参数",
	},
	PublicUniqueIDError: {
		description: "模型ID生成失败",
		cause:       "",
		solution:    "",
	},
	OpConflictError: {
		description: "执行操作冲突",
		cause:       "",
		solution:    "请勿频繁请求，或稍后重试",
	},
	MqProduceError: {
		description: "消息发送失败",
		cause:       "",
		solution:    "请稍后重试",
	},
	PublicReportUnfinishedError: {
		description: "探查报告尚未完成",
		cause:       "",
		solution:    "请稍后重新获取",
	},
	PublicReportFailedError: {
		description: "探查失败",
		cause:       "",
		solution:    "请重新执行探查任务",
	},
}
