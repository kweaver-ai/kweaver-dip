package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"

const (
	explorationModelName = constant.ServiceName + ".Exploration."
)

const (
	WhereOpNotAllowed         = explorationModelName + "WhereOpNotAllowed"
	ExploreSqlError           = explorationModelName + "ExploreSqlError"
	DrivenMDLUQQueryDataError = explorationModelName + "DrivenMDLUQQueryDataError"
)

var explorationErrorMap = errorCode{
	WhereOpNotAllowed: {
		description: "非法的过滤条件",
		cause:       "",
		solution:    "检查过滤条件",
	},
	ExploreSqlError: {
		description: "探查规则配置错误",
		cause:       "",
		solution:    "请检查执行SQL或数据库状态",
	},
	DrivenMDLUQQueryDataError: {
		description: "MDL UniQuery服务异常",
		cause:       "",
		solution:    "请检查执行SQL或服务状态",
	},
}
