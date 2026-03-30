package enum

// 接口状态
const (
	ServiceStatusDraft        = "draft"
	ServiceStatusPublish      = "publish"
	ServiceStatusOnline       = "online"
	ServiceStatusOffline      = "offline"
	ServiceStatusDownAuditing = "down-auditing"
	ServiceStatusDownReject   = "down-reject"
)

// 审核状态
const (
	AuditStatusUnpublished = "unpublished"
	AuditStatusAuditing    = "auditing"
	AuditStatusPass        = "pass"
	AuditStatusReject      = "reject"
	AuditStatusUndone      = "undone"
)

// 发布状态
const (
	PublishStatusUnPublished    = "unpublished"     //未发布
	PublishStatusPubAuditing    = "pub-auditing"    //发布审核中
	PublishStatusPublished      = "published"       //已发布
	PublishStatusPubReject      = "pub-reject"      //发布审核未通过
	PublishStatusChangeAuditing = "change-auditing" //变更审核中
	PublishStatusChangeReject   = "change-reject"   //变更审核未通过

)
