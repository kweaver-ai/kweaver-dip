package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(systemOperationErrorMap)
}

const (
	systemOperationPreCoder = constant.ServiceName + "." + systemOperationModelName + "."

	WhiteListNotExist                  = systemOperationPreCoder + "WhiteListNotExist"
	SystemOperationDetailsExportFailed = systemOperationPreCoder + "SystemOperationDetailsExportFailed"
	OverallEvaluationsExportFailed     = systemOperationPreCoder + "OverallEvaluationsExportFailed"
	DrivenDataExploration              = systemOperationPreCoder + "DrivenDataExploration"
	DataExplorationGetReportError      = systemOperationPreCoder + "DataExplorationGetReportError"
)

var systemOperationErrorMap = errorCode{
	WhiteListNotExist: {
		description: "白名单设置不存在",
		solution:    "请重新选择",
	},
	SystemOperationDetailsExportFailed: {
		description: "系统运行明细导出失败",
		solution:    "请检查",
	},
	OverallEvaluationsExportFailed: {
		description: "整体评价结果导出失败",
		solution:    "请检查",
	},
	DrivenDataExploration: {
		description: "数据探查服务异常",
		solution:    "请重试",
	},
	DataExplorationGetReportError: {
		description: "数据探查服务获取探查报告失败",
		solution:    "请重试",
	},
}
