package workflow

import (
	"github.com/samber/lo"
)

const (
	AppApplyEscalate = "af-sszd-app-apply-escalate"  // 配置中心应用申请审核
	AppApplyReport   = "af-sszd-app-report-escalate" // 配置中心应用s上报审核
)

// AuditTypeSlice 审核类型数组方便参数检查
var AuditTypeSlice = []string{
	AppApplyEscalate,
	AppApplyReport,
}

var AuditTypeMap = lo.SliceToMap(AuditTypeSlice, func(t string) (string, any) {
	return t, 1
})
