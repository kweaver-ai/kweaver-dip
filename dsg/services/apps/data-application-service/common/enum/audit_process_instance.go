package enum

import "github.com/kweaver-ai/idrm-go-common/util/sets"

// 接口状态
const (
	ServiceStatusDraft   = "draft"
	ServiceStatusPublish = "publish"
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

// 可以被视为“已发布”的发布状态
var consideredAsPublishedStatuses = sets.New(
	PublishStatusPublished,
	PublishStatusChangeAuditing,
	PublishStatusChangeReject,
)

// 被视为“已发布”的发布状态
var ConsideredAsPublishedStatuses = sets.List(consideredAsPublishedStatuses)

// 返回发布状态是否可以被视为“已发布”
func IsConsideredAsPublished(status string) bool {
	return consideredAsPublishedStatuses.Has(status)
}

// 上下线状态(换掉之前的接口状态)
const (
	LineStatusNotLine      = "notline"       //未上线
	LineStatusOnLine       = "online"        //已上线
	LineStatusOffLine      = "offline"       //已下线
	LineStatusUpAuditing   = "up-auditing"   //上线审核中
	LineStatusDownAuditing = "down-auditing" //下线审核中
	LineStatusUpReject     = "up-reject"     //上线审核未通过
	LineStatusDownReject   = "down-reject"   //下线审核未通过
)

// 可以被视为“已上线”的上线状态
var consideredAsOnlineStatuses = sets.New(
	LineStatusOnLine,
	LineStatusDownAuditing,
	LineStatusDownReject,
)

// 被视为“已上线”的上线状态
var ConsideredAsOnlineStatuses = sets.List(consideredAsOnlineStatuses)

// 返回上线状态是否可以被视为已上线
func IsConsideredAsOnline(status string) bool {
	return consideredAsOnlineStatuses.Has(status)
}

// 审核撤回类型
const (
	UndoPublishAudit = "publish-audit" //发布审核撤回
	UndoChangeAudit  = "change-audit"  //变更审核撤回
	UndoUpAudit      = "up-audit"      //上线审核撤回
	UndoDownAudit    = "down-audit"    //下线审核撤回
)

// 审核类型
const (
	AuditTypeUnpublished = "unpublished"
	AuditTypePublish     = "af-data-application-publish"
	AuditTypeChange      = "af-data-application-change"
	AuditTypeOnline      = "af-data-application-online"
	AuditTypeOffline     = "af-data-application-offline"
	AuditTypeRequest     = "af-data-application-request"
)

// 审核状态
const (
	AuditStatusUnpublished = "unpublished"
	AuditStatusAuditing    = "auditing"
	AuditStatusPass        = "pass"
	AuditStatusReject      = "reject"
	AuditStatusUndone      = "undone"
)

// 系统类目的分类，定义的三个固定的cate_id
const (
	OrgCateId           = "00000000-0000-0000-0000-000000000001"
	InfoSystemCateId    = "00000000-0000-0000-0000-000000000002"
	SubjectDomainCateId = "00000000-0000-0000-0000-000000000003"
)

//审核类型 map

var (
	AuditTypeMap = map[string]struct{}{
		AuditTypeUnpublished: {},
		AuditTypePublish:     {},
		AuditTypeChange:      {},
		AuditTypeOnline:      {},
		AuditTypeOffline:     {},
		AuditTypeRequest:     {},
	}
)

//审核状态 map

var (
	AuditStatusMap = map[string]struct{}{
		AuditStatusUnpublished: {},
		AuditStatusAuditing:    {},
		AuditStatusPass:        {},
		AuditStatusReject:      {},
		AuditStatusUndone:      {},
	}
)

/* 可编辑的状态
| 序号 | 发布状态 | 审核类型 | 审核状态 |
|------|----------|----------|----------|
| 1    | 草稿     | 未发布   | 未发布   |
| 2    | 草稿     | 发布     | 驳回     |
*/

var (
	ServiceAllowedUpdateStatus = map[string]struct{}{
		PublishStatusUnPublished + AuditTypeUnpublished + AuditStatusUnpublished: {}, //1
		PublishStatusUnPublished + AuditTypePublish + AuditStatusReject:          {}, //2
	}
)

/* 可上线的状态
| 序号 | 发布状态 | 上线状态 |
|------|----------|----------|
| 1    | 已发布     | 未上线   |
| 2    | 已发布     | 已下线   |
| 3    | 变更审核中     | 未上线     |
| 4    | 变更审核中     | 已下线     |
| 5    | 变更审核未通过     | 未上线     |
| 6    | 变更审核未通过     | 已下线     |
*/

var (
	ServiceAllowedUpStatus = map[string]struct{}{
		PublishStatusPublished + LineStatusNotLine:       {}, //1
		PublishStatusPublished + LineStatusOffLine:       {}, //2
		PublishStatusPublished + LineStatusUpReject:      {},
		PublishStatusChangeAuditing + LineStatusNotLine:  {},
		PublishStatusChangeAuditing + LineStatusOffLine:  {},
		PublishStatusChangeAuditing + LineStatusUpReject: {},
		PublishStatusChangeReject + LineStatusNotLine:    {},
		PublishStatusChangeReject + LineStatusOffLine:    {},
		PublishStatusChangeReject + LineStatusUpReject:   {},
	}
)

var (
	ServiceAllowedDownStatus = map[string]struct{}{
		PublishStatusPublished + LineStatusOnLine:          {}, //1
		PublishStatusChangeAuditing + LineStatusOnLine:     {},
		PublishStatusChangeReject + LineStatusOnLine:       {},
		PublishStatusPublished + LineStatusDownReject:      {}, //1
		PublishStatusChangeAuditing + LineStatusDownReject: {},
		PublishStatusChangeReject + LineStatusDownReject:   {},
	}
)

/* 可删除的状态
| 序号 | 发布状态 | 上线状态 |
|------|----------|----------|
| 1    | 未发布       | 未上线     |
| 2    | 发布审核未通过| 未上线     |
| 3    | 已发布       | 未上线     |
| 4    | 已发布       | 上线审核未通过|
| 5    | 变更审核未通过| 上线审核未通过     |
| 6    | 已发布       | 已下线     |
| 7    | 变更审核未通过| 未上线     |
*/

var (
	ServiceAllowedDeleteStatus = map[string]struct{}{
		PublishStatusUnPublished + LineStatusNotLine:   {}, //1
		PublishStatusPubReject + LineStatusNotLine:     {}, //2
		PublishStatusPublished + LineStatusNotLine:     {},
		PublishStatusPublished + LineStatusUpReject:    {},
		PublishStatusChangeReject + LineStatusUpReject: {},
		PublishStatusPublished + LineStatusOffLine:     {},
		PublishStatusChangeReject + LineStatusNotLine:  {},
		PublishStatusUnPublished + "":                  {},
		PublishStatusPublished + "":                    {},
		PublishStatusPubReject + "":                    {},
		PublishStatusChangeReject + "":                 {},
	}
)

/* 可用的审核类型
| 序号 | 接口状态 | 审核类型 | 审核状态 | 可用的审核类型 |
|------|----------|----------|----------|------------------|
| 1    | 草稿     | 未发布   | 未发布   | 发布             |
| 2    | 草稿     | 发布     | 驳回     | 发布             |
*/

var (
	AllowedAuditType = map[string]struct{}{
		PublishStatusUnPublished + AuditTypeUnpublished + AuditStatusUnpublished + AuditTypePublish: {}, //1
		PublishStatusUnPublished + AuditTypePublish + AuditStatusReject + AuditTypePublish:          {}, //2
	}
)

const (
	OwnerAuditStrategyTag = "af_data_owner_audit" // 数据owner审核
	AuditIconBase64       = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAAA4klEQVR4nO3QMQ4BQRTG8W8SCoWChMIVtllZpYJCzSVcg3ANDSegUbAFByAqVyAh0ShISMbbyMrs7owZkQ3F/orJe8nO/JNl3LXH4GghHkPG5zanITZJQEsdcAZAvkKDgdMKWLdpiFIHGhs6Qi474LqnQZBz6CBumY4ofUBx8UXznVlAnD3iLs4SPwxUp0Cm9LwYfkTcxVlCHvAvfUoSSQJBxoFCHbB6QDpLi4HbGdh2geOCliB5wJOix60+UKzhrcOSHu8Ad4pIqAM+3e+S/BbRHwS+lAS0GJ/ZEzA0aY7D6AEy2oYaVU4r2QAAAABJRU5ErkJggg=="
)

// 统计接口传参固定值枚举
const (
	ReqAll   = "all"
	ReqCount = "count"
	ReqTotal = "total"
)
