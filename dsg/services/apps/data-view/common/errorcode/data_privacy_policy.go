package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(DataPrivacyPolicyErrorMap)
}

const (
	dataPrivacyPolicyPreCoder = constant.ServiceName + ".DataPrivacyPolicy."

	DataPrivacyPolicyDatabaseError = dataPrivacyPolicyPreCoder + "DatabaseError"
	DataPrivacyPolicyisExist       = dataPrivacyPolicyPreCoder + "isExist"
	DataPrivacyPolicyNotFound      = dataPrivacyPolicyPreCoder + "NotFound"
)

var DataPrivacyPolicyErrorMap = errorcode.ErrorCode{
	DataPrivacyPolicyDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	DataPrivacyPolicyisExist: {
		Description: "数据隐私策略已存在",
		Cause:       "",
		Solution:    "",
	},
	DataPrivacyPolicyNotFound: {
		Description: "数据隐私策略不存在",
		Cause:       "",
		Solution:    "",
	},
}
