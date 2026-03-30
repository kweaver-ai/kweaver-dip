package errorcode

import (
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
)

func init() {
	errorcode.RegisterErrorCode(exploreTaskErrorMap)
}

const (
	exploreTaskPreCoder = constant.ServiceName + ".ExploreTask."

	ExploreTaskDatabaseError = exploreTaskPreCoder + "DatabaseError"
	TaskIdNotExist           = exploreTaskPreCoder + "TaskIdNotExist"
	GetTaskConfigError       = exploreTaskPreCoder + "GetTaskConfigError"
	ExploreTaskRepeat        = exploreTaskPreCoder + "ExploreTaskRepeat"
)

var exploreTaskErrorMap = errorcode.ErrorCode{
	ExploreTaskDatabaseError: {
		Description: "数据库异常",
		Cause:       "",
		Solution:    "",
	},
	TaskIdNotExist: {
		Description: "任务id不存在",
		Cause:       "",
		Solution:    "",
	},
	GetTaskConfigError: {
		Description: "任务配置错误",
		Cause:       "",
		Solution:    "请检查任务配置是否正确",
	},
	ExploreTaskRepeat: {
		Description: "已存在该类型的探查任务，待任务结束后再发起",
		Cause:       "",
		Solution:    "请检查任务配置是否正确",
	},
}
