package my

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
)

// AssetApplyListRespItem 数据目录-资产申请列表返回
type AssetApplyListRespItem struct {
	AssetId   string `gorm:"column:cid" json:"asset_id"`          // 目录表-资产ID
	AssetCode string `gorm:"column:code" json:"asset_code"`       // 目录表-资产编码
	AssetName string `gorm:"column:title" json:"asset_name"`      // 目录表-资产名称
	Orgcode   string `gorm:"column:orgcode" json:"orgcode"`       // 目录表-所属部门ID
	Orgname   string `gorm:"column:orgname" json:"orgname"`       // 目录表-所属部门名称
	OwnerId   string `gorm:"column:owner_id" json:"owner_id"`     // 目录表-数据owner用户ID
	OwnerName string `gorm:"column:owner_name" json:"owner_name"` // 目录表-数据owner用户名称

	ID          string     `gorm:"column:id" json:"id"`                       // 申请表-主键
	ApplySn     string     `gorm:"column:audit_apply_sn" json:"apply_sn"`     // 申请表-发起审核申请编号
	FlowApplyId string     `gorm:"column:flow_apply_id" json:"flow_apply_id"` // 审核流程ID
	ApplyDays   int        `gorm:"column:apply_days" json:"apply_days"`       // 申请表-申请天数（7、15、30天）
	ApplyState  int8       `gorm:"column:state" json:"apply_state"`           // 申请表-申请状态
	CreatedAt   *util.Time `gorm:"column:created_at" json:"created_at"`       // 申请表-申请创建时间
	UpdatedAt   *util.Time `gorm:"column:updated_at" json:"updated_at"`       // 申请表-申请创建时间
}

// AssetApplyDetailResp 数据目录-资产申请详情返回
type AssetApplyDetailResp struct {
	Id             uint64     `gorm:"column:id" json:"id,string"`                   // 申请表-主键
	ApplySn        uint64     `gorm:"column:audit_apply_sn" json:"apply_sn,string"` // 申请表-申请编号
	UserId         string     `gorm:"column:uid" json:"user_id"`                    // 申请表-申请人id
	ApplyCreatedAt *util.Time `gorm:"column:created_at" json:"apply_created_at"`    // 申请表-申请创建时间
	ApplyDays      int        `gorm:"column:apply_days" json:"apply_days"`          // 申请表-申请天数（7、15、30天）
	ApplyState     int8       `gorm:"column:state" json:"apply_state"`              // 申请表-申请状态
	ApplyReason    string     `gorm:"column:apply_reason" json:"apply_reason"`      // 申请表-申请说明
	AuditType      string     `gorm:"column:audit_type" json:"audit_type"`          // 申请表-服务类型

	AssetCode    string               `gorm:"column:code" json:"asset_code"`           // 目录表-资产编码
	AssetName    string               `gorm:"column:title" json:"asset_name"`          // 目录表-资产名称
	AssetOrgcode string               `gorm:"column:orgcode" json:"asset_orgcode"`     // 目录表-所属部门ID
	AssetOrgname string               `gorm:"column:orgname" json:"asset_orgname"`     // 目录表-所属部门名称
	UpdateCycle  int32                `gorm:"column:update_cycle" json:"update_cycle"` // 目录表-更新周期
	Infos        []*response.InfoItem `json:"asset_infos"`                             // 关联信息-仅返回关联信息系统和标签

	OrgInfos []*user_management.DepInfo `json:"apply_orgs"` // 申请人部门信息数组
}

//UserName    string `json:"user_name"`    // 申请人名称
//UserOrgcode string `json:"user_orgcode"` // 申请部门ID
//UserOrgname string `json:"user_orgname"` // 申请部门名称
//UserPhone   string `json:"user_phone"`   // 申请人电话
//UserEmail   string `json:"user_email"`   // 申请人邮箱

type InfoSystemItem struct {
	Id   string `json:"id"`   // 主键
	Name string `json:"name"` // 信息系统名称
}

// AvailableAssetListRespItem 数据目录-我的可用资产列表返回
/*type AvailableAssetListRespItem struct {
	Id          string     `gorm:"column:id" json:"id"`                     // 目录表-主键
	AssetCode   string     `gorm:"column:code" json:"asset_code"`           // 目录表-资产编码
	AssetName   string     `gorm:"column:title" json:"asset_name"`          // 目录表-资产名称
	Orgcode     string     `gorm:"column:orgcode" json:"orgcode"`           // 目录表-所属部门ID
	Orgname     string     `gorm:"column:orgname" json:"orgname"`           // 目录表-所属部门名称
	OwnerId     string     `gorm:"column:owner_id" json:"owner_id"`         // 目录表-数据owner用户ID
	OwnerName   string     `gorm:"column:owner_name" json:"owner_name"`     // 目录表-数据owner用户名称
	Description string     `gorm:"column:description" json:"description"`   // 目录表-资源目录描述
	PublishedAt *util.Time `gorm:"column:published_at" json:"published_at"` // 目录表-上线发布时间

	//DownloadAccessResult     int   `json:"download_access"`                // 结果 1 无下载权限  2 审核中  3 有下载权限
	//DownloadAccessExpireTime int64 `json:"download_expire_time,omitempty"` // 数据下载有效期，时间戳毫秒
	Permissions []*auth_service.Permission `json:"permissions"` // 权限数组

	VirtualCatalogName string `json:"virtual_catalog_name"`  // 虚拟化引擎catalog_name
	DataSourceType     int8   `json:"data_source_type"`      // 数据源类型
	DataSourceTypeName string `json:"data_source_type_name"` // 数据源类型名称
	DataSourceId       string `json:"data_source_id"`        // 数据源ID
	DataSourceName     string `json:"data_source_name"`      // 数据源名称
	SchemaId           string `json:"schema_id"`             // schema ID
	SchemaName         string `json:"schema_name"`           // schema名称
	TableId            uint64 `json:"table_id,string"`       // 表ID
	TableName          string `json:"table_name"`            // 表名称
}*/
