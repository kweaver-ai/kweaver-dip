package constant

import "github.com/kweaver-ai/idrm-go-frame/core/enum"

// TransmitMode 传输模式
type TransmitMode enum.Object

var (
	TransmitModeInc = enum.New[TransmitMode](1, "inc", "增量")
	TransmitModeAll = enum.New[TransmitMode](2, "all", "全量")
)

type ScheduleType enum.Object

var (
	ScheduleTypeOnce   = enum.New[ScheduleType](1, "ONCE", "一次性")
	ScheduleTypePeriod = enum.New[ScheduleType](2, "PERIOD", "周期性")
)

// DataPushStatus  数据推送状态
type DataPushStatus enum.Object

var (
	DataPushStatusShadow   = enum.New[DataPushStatus](0, "shadow", "不流转")
	DataPushStatusDraft    = enum.New[DataPushStatus](1, "draft", "草稿")
	DataPushStatusWaiting  = enum.New[DataPushStatus](2, "waiting", "待发布")
	DataPushStatusStarting = enum.New[DataPushStatus](3, "starting", "未开始")
	DataPushStatusGoing    = enum.New[DataPushStatus](4, "going", "进行中")
	DataPushStatusStopped  = enum.New[DataPushStatus](5, "stopped", "已停用")
	DataPushStatusEnd      = enum.New[DataPushStatus](6, "end", "已结束")
)

// DataPushAuditStatus  数据推送审核状态
type DataPushAuditStatus enum.Object

var (
	DataPushAuditStatusUnaudited  = enum.New[DataPushAuditStatus](0, "unaudited", "未审核")
	DataPushAuditStatusWaiting    = enum.New[DataPushAuditStatus](1, "auditing", "审核中")
	DataPushAuditStatusApproved   = enum.New[DataPushAuditStatus](2, "pass", "审核通过")
	DataPushAuditStatusReject     = enum.New[DataPushAuditStatus](3, "reject", "审核驳回")
	DataPushAuditStatusRevocation = enum.New[DataPushAuditStatus](4, "revocation", "审核撤回")
)

// DataPushOperation  数据推送操作
type DataPushOperation enum.Object

var (
	DataPushOperationPublish = enum.New[DataPushOperation](1, "publish", "发布")
	DataPushOperationChange  = enum.New[DataPushOperation](2, "change", "变更")
	DataPushOperationStop    = enum.New[DataPushOperation](3, "stop", "停用")
	DataPushOperationRestart = enum.New[DataPushOperation](4, "restart", "启用")
)

// DataPushChannel  数据推送操作
type DataPushChannel enum.Object

var (
	DataPushChannelWeb           = enum.New[DataPushChannel](1, "web", "AF界面")
	DataPushChannelShareApply    = enum.New[DataPushChannel](2, "share_apply", "数据共享申请")
	DataPushChannelCatalogReport = enum.New[DataPushChannel](3, "catalog_report", "省市直达目录上报")
)

type ScheduleStatus enum.Object

var (
	ScheduleStatusOff = enum.New[ScheduleStatus](0, "off", "关闭")
	ScheduleStatusOn  = enum.New[ScheduleStatus](1, "on", "打开")
)
