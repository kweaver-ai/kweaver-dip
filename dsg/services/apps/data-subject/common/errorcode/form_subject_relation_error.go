package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(formSubjectRelationErrorMap)
}

const (
	FormSubjectRelationPreCoder = constant.ServiceName + ".FormSubjectRelation."
)
const (
	FormAndFieldInfoQueryError        = FormSubjectRelationPreCoder + "FormAndFieldInfoQueryError"
	FieldNotInFormExistError          = FormSubjectRelationPreCoder + "FieldNotInFormExistError"
	AttributeBindMustDataSourceImport = FormSubjectRelationPreCoder + "AttributeBindMustDataSourceImport"
	RefAttributeNotExistError         = FormSubjectRelationPreCoder + "RefAttributeNotExistError"
	FieldOnlyRelatedOneAttributeError = FormSubjectRelationPreCoder + "FieldOnlyRelatedOneAttributeError"
	AttributeOnlyRelatedOneFieldError = FormSubjectRelationPreCoder + "AttributeOnlyRelatedOneFieldError"
)

var formSubjectRelationErrorMap = errorcode.ErrorCode{
	FormAndFieldInfoQueryError: {
		Description: "查询业务表和字段信息错误",
		Cause:       "",
		Solution:    "请重试",
	},
	FieldNotInFormExistError: {
		Description: "字段不存在或者暂未保存",
		Solution:    "请检查参数",
	},
	AttributeBindMustDataSourceImport: {
		Description: "表字段关联属性必须为数据源导入的表",
		Solution:    "",
	},
	RefAttributeNotExistError: {
		Description: "部分属性被删除，重置列表后请重新保存",
		Solution:    "请重置列表",
	},
	FieldOnlyRelatedOneAttributeError: {
		Description: "一个业务表字段仅能关联一个逻辑实体的属性",
		Solution:    "请检查参数",
	},
	AttributeOnlyRelatedOneFieldError: {
		Description: "一个业务表内，逻辑实体的属性仅能关联一个字段",
		Solution:    "请检查参数",
	},
}
