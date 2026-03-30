package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(dataSourceErrorMap)
}

const (
	subjectDomainPreCoder = constant.ServiceName + ".SubjectDomain."

	NameRepeat                                 = subjectDomainPreCoder + "NameRepeat"
	ParentNotExist                             = subjectDomainPreCoder + "ParentNotExist"
	ObjectNotExist                             = subjectDomainPreCoder + "ObjectNotExist"
	UnsupportedCreate                          = subjectDomainPreCoder + "UnsupportedCreate"
	UnsupportedUpdate                          = subjectDomainPreCoder + "UnsupportedUpdate"
	UnsupportedAddOwner                        = subjectDomainPreCoder + "UnsupportedAddOwner"
	UnsupportedUpdateType                      = subjectDomainPreCoder + "UnsupportedUpdateType"
	OwnersNotExist                             = subjectDomainPreCoder + "OwnersNotExist"
	TypeNotExist                               = subjectDomainPreCoder + "TypeNotExist"
	UniqueErr                                  = subjectDomainPreCoder + "UniqueErr"
	UniqueNotExist                             = subjectDomainPreCoder + "UniqueNotExist"
	RefObjectNotExist                          = subjectDomainPreCoder + "RefObjectNotExist"
	OwnersIncorrect                            = subjectDomainPreCoder + "OwnersIncorrect"
	RefBusinessObjectNotExist                  = subjectDomainPreCoder + "RefBusinessObjectNotExist"
	AttributeHadBindError                      = subjectDomainPreCoder + "AttributeHadBindError"
	ObjectIDSHasNotExist                       = subjectDomainPreCoder + "ObjectIDSHasNotExist"
	BusinessObjectNameExist                    = subjectDomainPreCoder + "BusinessObjectNameExist"
	BusinessObjectNotExist                     = subjectDomainPreCoder + "BusinessObjectNotExist"
	CascadeDeleteSubjectDomainViewRelatedError = subjectDomainPreCoder + "CascadeDeleteSubjectDomainViewRelatedError"
	QueryViewCountError                        = subjectDomainPreCoder + "QueryViewCountError"
	QueryIndicatorCountError                   = subjectDomainPreCoder + "QueryIndicatorCountError"
	QueryApplicationServiceCountError          = subjectDomainPreCoder + "QueryApplicationServiceCountError"
)

var dataSourceErrorMap = errorcode.ErrorCode{
	NameRepeat: {
		Description: "名称已存在，请重新输入",
		Cause:       "",
		Solution:    "请重新输入后检查重试",
	},
	ParentNotExist: {
		Description: "父节点不存在",
		Cause:       "",
		Solution:    "请刷新后检查重试",
	},
	ObjectNotExist: {
		Description: "目标节点不存在",
		Cause:       "",
		Solution:    "请刷新后检查重试",
	},
	UnsupportedCreate: {
		Description: "当前节点下不支持新建该类型节点",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	UnsupportedUpdate: {
		Description: "当前节点下不支持修改",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	UnsupportedAddOwner: {
		Description: "当前节点下不支持添加/修改拥有者",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	UnsupportedUpdateType: {
		Description: "当前节点下不支持修改对象类型",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	OwnersNotExist: {
		Description: "owners为必填项",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	TypeNotExist: {
		Description: "type为必填项",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	UniqueErr: {
		Description: "业务对象/业务活动最多只能有一个唯一标识",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	UniqueNotExist: {
		Description: "业务对象必须要有一个唯一标识",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	RefObjectNotExist: {
		Description: "引用的业务对象/业务活动不存在",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	OwnersIncorrect: {
		Description: "owners不是数据owner下的用户",
		Cause:       "",
		Solution:    "请检查后重试",
	},
	RefBusinessObjectNotExist: {
		Description: "关联业务对象/活动已不存在",
		Solution:    "",
	},
	AttributeHadBindError: {
		Description: "属性[test]已被关联，重置列表后请重新保存",
		Solution:    "重置列表后请重新保存",
	},
	ObjectIDSHasNotExist: {
		Description: "对象id不存在",
		Solution:    "",
	},
	BusinessObjectNameExist: {
		Description: "业务对象、活动名称重复",
		Solution:    "",
	},
	BusinessObjectNotExist: {
		Description: "业务对象/业务活动不存在",
		Solution:    "",
	},
	CascadeDeleteSubjectDomainViewRelatedError: {
		Description: "刪除业务对象下绑定的视图关联失败",
		Solution:    "",
	},
	QueryViewCountError: {
		Description: "查询视图数量错误",
		Solution:    "请联系管理员",
	},
	QueryIndicatorCountError: {
		Description: "查询指标数量错误",
		Solution:    "请联系管理员",
	},
	QueryApplicationServiceCountError: {
		Description: "查询接口服务数量错误",
		Solution:    "请联系管理员",
	},
}
