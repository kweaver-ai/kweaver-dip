package errorcode

import "errors"

var NoRowAffectedError = errors.New("没有数据变化，数据已经删除或者更新")
var FlowChartMissingRoleError = errors.New("流程图缺失角色，无法查询")
