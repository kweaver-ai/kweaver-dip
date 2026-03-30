package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"

func init() {
	registerErrorCode(serviceApplyErrorMap)
}

const (
	serviceApplyModelName = "Service"
)

const (
	serviceApplyPreCoder = constant.ServiceName + "." + serviceApplyModelName + "."

	ServiceApplyAuditingExist  = serviceApplyPreCoder + "ServiceApplyAuditingExist"
	ServiceApplyAvailableExist = serviceApplyPreCoder + "ServiceApplyAvailableExist"
	GetOwnerAuditorsNotAllowed = serviceApplyPreCoder + "GetOwnerAuditorsNotAllowed"
	ServiceNoOwner             = serviceApplyPreCoder + "ServiceNoOwner"
	ServiceApplyIdNotExist     = serviceApplyPreCoder + "ServiceApplyIdNotExist"
	ServiceApplyNotExist       = serviceApplyPreCoder + "ServiceApplyNotExist"
	ServiceApplyNotPass        = serviceApplyPreCoder + "ServiceApplyNotPass"
	OrgCodeNotExist            = serviceApplyPreCoder + "OrgCodeNotExist"
	SubjectDomainNotExist      = serviceApplyPreCoder + "SubjectDomainNotExist"
)

var serviceApplyErrorMap = errorCode{
	ServiceApplyAuditingExist: {
		description: "接口调用申请正在审核中",
		cause:       "",
		solution:    "请稍后再试",
	},
	ServiceApplyAvailableExist: {
		description: "当前接口已有调用权限, 无需再次申请",
		cause:       "",
		solution:    "",
	},
	GetOwnerAuditorsNotAllowed: {
		description: "当前接口未发布, 不可获取owner审核员",
		cause:       "",
		solution:    "请稍后再试",
	},
	ServiceNoOwner: {
		description: "当前接口没有数据Owner",
		cause:       "",
		solution:    "请配置数据Owner",
	},
	ServiceApplyIdNotExist: {
		description: "申请id不存在",
		cause:       "",
		solution:    "请重试",
	},
	ServiceApplyNotExist: {
		description: "当前接口没有申请记录, 无法查看授权信息",
		cause:       "",
		solution:    "请稍后再试",
	},
	ServiceApplyNotPass: {
		description: "当前接口暂无调用权限, 无法查看授权信息",
		cause:       "",
		solution:    "请稍后再试",
	},
	OrgCodeNotExist: {
		description: "部门id不存在",
		cause:       "",
		solution:    "请重试",
	},
	SubjectDomainNotExist: {
		description: "主题域id不存在",
		solution:    "请重试",
	},
}
