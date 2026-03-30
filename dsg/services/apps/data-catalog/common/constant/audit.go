package constant

// 发布状态
const (
	PublishStatusUnPublished = "unpublished"     //未发布
	PublishStatusPubAuditing = "pub-auditing"    //发布审核中
	PublishStatusPublished   = "published"       //已发布
	PublishStatusPubReject   = "pub-reject"      //发布审核未通过
	PublishStatusChAuditing  = "change-auditing" //变更审核中
	PublishStatusChReject    = "change-reject"   //变更审核未通过
)

var (
	UnPublishedMap = map[string]struct{}{
		PublishStatusUnPublished: {},
		PublishStatusPubAuditing: {},
		PublishStatusPubReject:   {},
	}
	PublishedMap = map[string]struct{}{
		PublishStatusPublished:  {},
		PublishStatusChAuditing: {},
		PublishStatusChReject:   {},
	}
	PublishedSlice = []string{
		PublishStatusPublished,
		PublishStatusChAuditing,
		PublishStatusChReject,
	}
)

// 上下线状态
const (
	LineStatusNotLine           = "notline"             //未上线 ->未上线
	LineStatusOnLine            = "online"              //已上线 ->已上线
	LineStatusOffLine           = "offline"             //已下线 ->未上线
	LineStatusUpAuditing        = "up-auditing"         //未上线（上线审核中） ->未上线
	LineStatusUpReject          = "up-reject"           //未上线（上线审核未通过） ->未上线
	LineStatusDownAuditing      = "down-auditing"       //已上线（下线审核中） ->已上线
	LineStatusDownReject        = "down-reject"         //已上线（下线审核未通过） ->已上线
	LineStatusOfflineUpAuditing = "offline-up-auditing" //已下线（上线审核中） ->已下线
	LineStatusOfflineUpReject   = "offline-up-reject"   //已下线（上线审核未通过） ->已下线
	LineStatusDownAuto          = "down-auto"           //自动下线 ->未上线
)

var (
	OnLineMap = map[string]struct{}{
		LineStatusOnLine:       {},
		LineStatusDownAuditing: {},
		LineStatusDownReject:   {},
	}
	OnLineArray = []string{
		LineStatusOnLine,
		LineStatusDownAuditing,
		LineStatusDownReject,
	}
	OffLineMap = map[string]struct{}{
		LineStatusNotLine:           {},
		LineStatusOffLine:           {},
		LineStatusUpAuditing:        {},
		LineStatusUpReject:          {},
		LineStatusOfflineUpAuditing: {},
		LineStatusOfflineUpReject:   {},
		LineStatusDownAuto:          {},
	}
)

// 审核撤回类型
const (
	UndoPublishAudit = "publish-audit" //发布审核撤回
	UndoUpAudit      = "up-audit"      //上线审核撤回
	UndoDownAudit    = "down-audit"    //下线审核撤回
)

// 审核类型
const (
	AuditTypeUnpublished         = "unpublished"
	AuditTypePublish             = "af-data-catalog-publish"
	AuditTypeChange              = "af-data-catalog-change"
	AuditTypeOnline              = "af-data-catalog-online"
	AuditTypeOffline             = "af-data-catalog-offline"
	AuditTypeDownload            = "af-data-catalog-download"
	AuditTypeOpen                = "af-data-catalog-open"
	AuditTypeElecLicenceOnline   = "af-elec-licence-online"
	AuditTypeElecLicenceOffline  = "af-elec-licence-offline"
	AuditTypeFileResourcePublish = "af-file-resource-publish"
)

const (
	AuditTypeDataPushAudit = "af-data-push-audit" //数据推送发布审核，修改，停用等审核共用一个
)

// 审核状态
const (
	AuditStatusUnaudited = iota // 未审核
	AuditStatusAuditing         // 审核中
	AuditStatusPass             // 通过
	AuditStatusReject           // 驳回
	AuditStatusUndone           //
)

// 审核状态
const (
	WorkFlowAuditStatusAuditing = "auditing"
	WorkFlowAuditStatusPass     = "pass"
	WorkFlowAuditStatusReject   = "reject"
	WorkFlowAuditStatusUndone   = "undone"
)

//审核类型 map

var (
	AuditTypeMap = map[string]struct{}{
		AuditTypePublish: {},
		AuditTypeOnline:  {},
		AuditTypeOffline: {},
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
		PublishStatusPublished + LineStatusNotLine:  {}, //1
		PublishStatusPublished + LineStatusOffLine:  {}, //2
		PublishStatusPublished + LineStatusUpReject: {},
	}
)

var (
	ServiceAllowedDownStatus = map[string]struct{}{
		PublishStatusPublished + LineStatusOnLine:     {}, //1
		PublishStatusPublished + LineStatusDownReject: {}, //1

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
		PublishStatusUnPublished + LineStatusNotLine: {}, //1
		PublishStatusPubReject + LineStatusNotLine:   {}, //2
		PublishStatusPublished + LineStatusNotLine:   {},
		PublishStatusPublished + LineStatusUpReject:  {},
		PublishStatusPublished + LineStatusOffLine:   {},
		PublishStatusUnPublished + "":                {},
		PublishStatusPublished + "":                  {},
		PublishStatusPubReject + "":                  {},
	}
)

const (
	OwnerAuditStrategyTag = "af_data_owner_audit" // 数据owner审核
	AuditIconBase64       = "data:image/png;base64,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"
)

var LineStatusMap = map[string]bool{
	LineStatusNotLine:      true,
	LineStatusOnLine:       true,
	LineStatusOffLine:      true,
	LineStatusUpAuditing:   true,
	LineStatusDownAuditing: true,
	LineStatusUpReject:     true,
	LineStatusDownReject:   true,
}

// 开放目录状态
const (
	OpenStatusNotOpen = "notOpen" //未开放
	OpenStatusOpened  = "opened"  //已开放
)
