package errorcode

import "github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"

func init() {
	registerErrorCode(dataPushErrorMap)
}

// Tree error
const (
	dataPushPreCoder                      = constant.ServiceName + ".DataPush."
	DataPushNotExistError                 = dataPushPreCoder + "DataPushNotExistError"
	DataPushGetAuditInfoError             = dataPushPreCoder + "GetAuditInfoError"
	SendAuditApplyMsgError                = dataPushPreCoder + "SendAuditApplyMsgError"
	DataSyncStopError                     = dataPushPreCoder + "DataSyncStopError"
	DataSyncStartError                    = dataPushPreCoder + "DataSyncStartError"
	DataSyncUpdateError                   = dataPushPreCoder + "DataSyncUpdateError"
	CreateDataSyncModelError              = dataPushPreCoder + "CreateDataSyncModelError"
	DataSyncExecuteError                  = dataPushPreCoder + "DataSyncExecuteError"
	DataSyncHistoryError                  = dataPushPreCoder + "DataSyncHistoryError"
	DataSyncAuditingExecuteError          = dataPushPreCoder + "DataSyncAuditingExecuteError"
	DataPushInvalidOperation              = dataPushPreCoder + "DataPushInvalidOperation"
	DataPushInvalidRevocation             = dataPushPreCoder + "DataPushInvalidRevocation"
	DataPushRevocationFailed              = dataPushPreCoder + "DataPushRevocationFailed"
	DataPushMustContainPrimaryKey         = dataPushPreCoder + "MustContainPrimaryKey"
	IncrementDataPushMustChoicePrimaryKey = dataPushPreCoder + "IncrementDataPushMustChoicePrimaryKey"
	DataSyncInvalidTimeFormat             = dataPushPreCoder + "DataSyncInvalidTimeFormat"
	DataPushInvalidCrontabExpression      = dataPushPreCoder + "DataPushInvalidCrontabExpression"
	DataPushGetTargetDatasourceInfoError  = dataPushPreCoder + "DataPushGetTargetDatasourceInfoError"
	DataPushGetSpaceInfoError             = dataPushPreCoder + "DataPushGetSpaceInfoError"
	DataPushInvalidTypeMapping            = dataPushPreCoder + "DataPushInvalidTypeMapping"
)

var dataPushErrorMap = errorCode{
	DataPushNotExistError: {
		description: "数据推送不存在",
		solution:    "请检查",
	},
	DataPushGetAuditInfoError: {
		description: "获取审核模板信息错误",
		solution:    "请检查",
	},
	SendAuditApplyMsgError: {
		description: "发送审核信息错误",
		solution:    "请检查",
	},
	CreateDataSyncModelError: {
		description: "创建数据同步模型失败",
		solution:    "请检查",
	},
	DataSyncStartError: {
		description: "数据同步作业开启失败",
		solution:    "请检查",
	},
	DataSyncStopError: {
		description: "数据同步作业停止失败",
		solution:    "请检查",
	},
	DataSyncUpdateError: {
		description: "数据同步作业更新失败",
		solution:    "请检查",
	},
	DataSyncExecuteError: {
		description: "数据同步作业执行失败",
		solution:    "请检查",
	},
	DataSyncHistoryError: {
		description: "查询数据同步作业执行日志失败",
		solution:    "请检查",
	},
	DataSyncAuditingExecuteError: {
		description: "数据同步作业审核中，无法操作",
		solution:    "请检查",
	},
	DataPushInvalidOperation: {
		description: "非法操作",
		solution:    "请检查",
	},
	DataPushInvalidRevocation: {
		description: "只有审核中的才能撤回",
		solution:    "请检查",
	},
	DataPushRevocationFailed: {
		description: "撤回失败",
		solution:    "请检查",
	},
	DataPushMustContainPrimaryKey: {
		description: "目标字段必须包含主键",
		solution:    "请检查",
	},
	IncrementDataPushMustChoicePrimaryKey: {
		description: "增量推送必须包含主键",
		solution:    "请检查",
	},
	DataSyncInvalidTimeFormat: {
		description: "非法时间格式，正确的格式是：2006-01-02 15:04:05",
		solution:    "请检查",
	},
	DataPushInvalidCrontabExpression: {
		description: "非法crontab表达式",
		solution:    "请检查",
	},
	DataPushGetTargetDatasourceInfoError: {
		description: "获取目标数据源信息失败",
		solution:    "请检查",
	},
	DataPushGetSpaceInfoError: {
		description: "获取沙箱空间信息错误",
		solution:    "请检查",
	},
	DataPushInvalidTypeMapping: {
		description: "数据类型映射错误，无法推送",
		solution:    "请检查",
	},
}
