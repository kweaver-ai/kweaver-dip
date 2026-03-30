package model

import (
	"database/sql"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

const TableNameAppsHistory = "app_history"

// AppsHistory mapped from table <app_history>
type AppsHistory struct {
	ID                     uint64                `gorm:"column:id;primaryKey" json:"id"`                                              // 雪花id
	AppID                  uint64                `gorm:"column:app_id" json:"app_id"`                                                 // 雪花id
	Name                   string                `gorm:"column:name;not null" json:"name"`                                            // 应用名称
	PassID                 string                `gorm:"column:pass_id" json:"pass_id"`                                               // PassID
	Token                  string                `gorm:"column:token" json:"token"`                                                   // PassID
	Description            *string               `gorm:"column:description" json:"description"`                                       // 应用描述
	InfoSystem             *string               `gorm:"column:info_system" json:"info_system"`                                       // 信息系统
	ApplicationDeveloperID string                `gorm:"column:application_developer_id" json:"application_developer_id"`             // 应用开发者账号ID
	AppType                string                `gorm:"column:app_type" json:"app_type"`                                             // 应用类型
	IpAddr                 string                `gorm:"column:ip_addr" json:"ip_addr"`                                               // json类型字段, 关联ip和port
	IsRegisterGateway      sql.NullInt32         `gorm:"column:is_register_gateway;not null" json:"is_register_gateway"`              // 是否必填，bool：0：不是；1：是
	RegisterAt             time.Time             `gorm:"column:register_at;not null;default:current_timestamp(3)" json:"register_at"` // 注册时间
	AccountID              string                `gorm:"column:account_id" json:"account_id"`                                         // 账号ID
	AccountName            string                `gorm:"column:account_name" json:"account_name"`                                     // 账户名称
	AccountPassowrd        string                `gorm:"column:account_passowrd" json:"account_passowrd"`                             // 账户密码
	ProvinceAppID          string                `gorm:"column:province_app_id;not null" json:"province_app_id"`                      // 省平台注册ID
	AccessKey              string                `gorm:"column:access_key;not null" json:"access_key"`                                // 省平台应用key
	AccessSecret           string                `gorm:"column:access_secret;not null" json:"access_secret"`                          // 省平台应用secret
	ProvinceIP             string                `gorm:"column:province_ip" json:"province_ip"`                                       // 对外提供ip地址
	ProvinceURL            string                `gorm:"column:province_url" json:"province_url"`                                     // 对外提供url地址
	ContactName            string                `gorm:"column:contact_name" json:"contact_name"`                                     // 联系人姓名
	ContactPhone           string                `gorm:"column:contact_phone" json:"contact_phone"`                                   // 联系人联系方式
	AreaID                 string                `gorm:"column:area_id" json:"area_id"`                                               // 应用领域Id
	RangeID                string                `gorm:"column:range_id;not null" json:"range_id"`                                    // 应用范围
	DepartmentID           string                `gorm:"column:department_id" json:"department_id"`                                   // 所属部门
	OrgCode                string                `gorm:"column:org_code" json:"org_code"`                                             // 应用系统所属组织机构编码
	DeployPlace            string                `gorm:"column:deploy_place" json:"deploy_place"`                                     // 部署地点
	Status                 int32                 `gorm:"column:status" json:"status"`                                                 // 审核状态
	RejectReason           string                `gorm:"column:reject_reason" json:"reject_reason"`                                   // 驳回原因
	CancelReason           string                `gorm:"column:cancel_reason" json:"cancel_reason"`                                   // 需求撤销原因
	AuditID                uint64                `gorm:"column:audit_id" json:"audit_id"`                                             // 审核记录ID
	AuditProcInstID        string                `gorm:"column:audit_proc_inst_id" json:"audit_proc_inst_id"`                         // 审核实例ID
	AuditResult            string                `gorm:"column:audit_result" json:"audit_result"`                                     // 上报审核结果 agree 通过 reject 拒绝 undone 撤销
	ReportAuditStatus      int32                 `gorm:"column:report_audit_status" json:"report_audit_status"`                       // 上报审核状态
	ReportRejectReason     string                `gorm:"column:report_reject_reason" json:"report_reject_reason"`                     // 上报驳回原因
	ReportCancelReason     string                `gorm:"column:report_cancel_reason" json:"report_cancel_reason"`                     // 上报撤销原因
	ReportAuditID          uint64                `gorm:"column:report_audit_id" json:"report_audit_id"`                               // 上报审核记录ID
	ReportAuditProcInstID  string                `gorm:"column:report_audit_proc_inst_id" json:"report_audit_proc_inst_id"`           // 上报审核实例ID
	ReportAuditResult      string                `gorm:"column:report_audit_result" json:"report_audit_result"`                       // 上报审核结果 agree 通过 reject 拒绝 undone 撤销
	ReportStatus           int32                 `gorm:"column:report_status" json:"report_status"`                                   // 上报审核状态
	ProvinceID             uint64                `gorm:"column:province_id;not null" json:"province_id"`                              // 雪花id
	ReportAt               time.Time             `gorm:"column:reported_at;not null;default:current_timestamp(3)" json:"reported_at"` // 上报时间
	UpdatedAt              time.Time             `gorm:"column:updated_at;not null;autoUpdateTime" json:"updated_at"`                 // 更新时间
	UpdaterUID             string                `gorm:"column:updater_uid" json:"updater_uid"`                                       // 更新用户ID
	UpdaterName            string                `gorm:"column:updater_name" json:"updater_name"`                                     // 更新用户名称
	DeletedAt              soft_delete.DeletedAt `gorm:"column:deleted_at;not null;softDelete:milli" json:"deleted_at"`               // 删除时间(逻辑删除)
}

func (m *AppsHistory) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}

	if m.ID == 0 {
		if m.ID, err = utils.GetUniqueID(); err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
			return err
		}
	}
	return nil
}

// TableName AppsHistory's table name
func (*AppsHistory) TableName() string {
	return TableNameAppsHistory
}
