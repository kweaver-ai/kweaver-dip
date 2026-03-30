package errorcode

import (
	"github.com/kweaver-ai/idrm-go-frame/core/errorx"
)

const (
	ReadManualSolution = "请使用请求参数构造规范化的请求字符串。详细信息参见产品 API 文档"
)

var (
	publicModule   = errorx.New(ServiceName + ".Public.")
	authModule     = errorx.New(ServiceName + ".Auth.")
	DWHDataModule  = errorx.New(ServiceName + ".DataApplicationForm.")
	workflowModule = errorx.New(ServiceName + ".Workflow.")
	UserModule     = errorx.New(ServiceName + ".UserModule.")
)

var (
	PublicDatabaseErr              = publicModule.Description("DatabaseError", "数据库异常")
	PublicQueryUserInfoError       = publicModule.Description("QueryUserInfoError", "查询用户信息错误")
	PublicInternalErr              = publicModule.Description("InternalError", "内部错误")
	PublicDataAuditingErr          = publicModule.Description("DataAuditingErr", "审核中，无法修改")
	PublicResourceNotExistErr      = publicModule.Description("ResourceNotExistErr", "资源不存在")
	PublicInvalidParameterErr      = publicModule.Solution("InvalidParameter", "参数值校验不通过", "", ReadManualSolution)
	PublicInvalidParameterJsonErr  = publicModule.Solution("InvalidParameterJson", "参数值校验不通过：json格式错误", "", ReadManualSolution)
	PublicConfigurationCenterError = publicModule.Description("QueryConfigurationCenterError", "配置中心查询错误")
)

var (
	NoAuthError                   = authModule.Description("NoAuthError", "没有权限")
	OwnerIdErr                    = authModule.Description("OwnerIdError", "资源 Owner 检查不匹配, 无操作权限")
	IndicatorRuleNameRepeatError  = authModule.Description("NameRepeatError", "该授权维度规则名称已经存在，请重新输入")
	DataAssetAuditMsgSendError    = authModule.Description("DataAssetAuditMsgSendError", "审核消息发送错误，请重试")
	DataAssetApplicantRoleInvalid = authModule.Description("DataAssetApplicantRoleInvalid", "申请人缺少对应角色，请联系管理员")
	AuthPolicyError               = authModule.Description("AuthPolicyError", "授权策略数据错误，请重新输入")
	AuthCacheError                = authModule.Description("AuthCacheError", "缓存服务错误，请联系管理员")
)

var (
	DWHAuthReqFormDuplicatedErr       = DWHDataModule.Description("AuthReqFormDuplicatedErr", "用户的数仓数据申请单已经存在，不能新建")
	DWHAuthReqFormDataViewNotExistErr = DWHDataModule.Description("AuthReqFormDataViewNotExistErr", "库表资源不存在")
	DWHAuthReqInvalidCancelErr        = DWHDataModule.Description("InvalidCancelErr", "只有审核中的才能撤回")
	DWHAuthReqCancelErr               = DWHDataModule.Description("CancelErr", "撤回失败")
)

var (
	AuditProcessNotExistErr = workflowModule.Description("AuditProcessNotExistErr", "审核策略不存在或配置错误,请检查审核策略")
	AuditMsgSendErr         = workflowModule.Description("AuditMsgSendErr", "审核消息发送错误")
)

var (
	UserNotExistErr = UserModule.Description("UserNotExistError", "用户不存在")
)
