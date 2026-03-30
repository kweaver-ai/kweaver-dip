package model

import (
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const TableNameElecLicence = "elec_licence"

type ElecLicence struct {
	ID                       uint64     `gorm:"primaryKey;column:id;type:bigint(20);not null"`
	ElecLicenceID            string     `gorm:"column:elec_licence_id;type:varchar(50);not null"`
	LicenceName              string     `gorm:"column:licence_name;type:varchar(255)"`
	LicenceBasicCode         string     `gorm:"column:licence_basic_code;type:varchar(255)"`
	LicenceAbbreviation      string     `gorm:"column:licence_abbreviation;type:varchar(255)"`
	GroupID                  string     `gorm:"column:group_id;type:varchar(50)"`
	GroupName1               string     `gorm:"column:group_name1;type:varchar(100)"`
	IndustryDepartment       string     `gorm:"column:industry_department;type:varchar(255)"` //行业类别
	IndustryDepartmentID     string     `gorm:"column:industry_department_id;type:char(36)"`  //行业类别id
	CertificationLevel       string     `gorm:"column:certification_level;type:varchar(255)"` //发证级别
	HolderType               string     `gorm:"column:holder_type;type:varchar(255)"`         //证照主体 持证者类型定义
	LicenceType              string     `gorm:"column:licence_type;type:varchar(255)"`        //证照类型
	UseLimit                 string     `gorm:"column:use_limit;type:varchar(255)"`
	ProvOverallPlanSignIssue string     `gorm:"column:prov_overall_plan_sign_issue;type:varchar(255)"`
	ReleaseCancelTime        string     `gorm:"column:release_cancel_time;type:varchar(255)"`
	Remark                   string     `gorm:"column:remark;type:text"`
	LicenceState             string     `gorm:"column:licence_state;type:varchar(255)"`
	InceptionState           string     `gorm:"column:inception_state;type:varchar(255)"`
	Department               string     `gorm:"column:department;type:varchar(255)"`
	NewDeptID                string     `gorm:"column:new_dept_id;type:varchar(255)"`
	NewDept                  string     `gorm:"column:new_dept;type:varchar(255)"`
	Version                  string     `gorm:"column:version;type:varchar(50)"`
	UseConstraintType        string     `gorm:"column:use_constraint_type;type:varchar(50)"`
	Description              string     `gorm:"column:description;type:varchar(1000)"`
	IconImage                string     `gorm:"column:icon_image;type:text"`
	AdminOrg                 string     `gorm:"column:admin_org;type:varchar(100)"`
	AdminOrgCode             string     `gorm:"column:admin_org_code;type:varchar(50)"`
	Division                 string     `gorm:"column:division;type:varchar(50)"`
	DivisionCode             string     `gorm:"column:division_code;type:varchar(50)"`
	PublishData              *time.Time `gorm:"column:publish_data;type:datetime"`
	Creator                  string     `gorm:"column:creator;type:varchar(50)"`
	CreatorName              string     `gorm:"column:creator_name;type:varchar(50)"`
	CreatorPart              string     `gorm:"column:creator_part;type:varchar(50)"`
	CreatorPartName          string     `gorm:"column:creator_part_name;type:varchar(50)"`
	CreateTime               *time.Time `gorm:"column:create_time;type:datetime"`
	Updater                  string     `gorm:"column:updater;type:varchar(50)"`
	UpdaterName              string     `gorm:"column:updater_name;type:varchar(50)"`
	UpdaterPart              string     `gorm:"column:updater_part;type:varchar(50)"`
	UpdaterPartName          string     `gorm:"column:updater_part_name;type:varchar(50)"`
	UpdateTime               *time.Time `gorm:"column:update_time;type:datetime;autoUpdateTime"`
	Deleter                  string     `gorm:"column:deleter;type:varchar(50)"`
	DeleterName              string     `gorm:"column:deleter_name;type:varchar(50)"`
	DeleterPart              string     `gorm:"column:deleter_part;type:varchar(50)"`
	DeleterPartName          string     `gorm:"column:deleter_part_name;type:varchar(50)"`
	DeleteTime               *time.Time `gorm:"column:delete_time;type:datetime"`
	OrgCode                  string     `gorm:"column:orgcode;type:varchar(50)"`
	OrgName                  string     `gorm:"column:orgname;type:varchar(50)"`
	CreationTime             *time.Time `gorm:"column:creation_time;type:datetime"`
	LastModificator          string     `gorm:"column:last_modificator;type:varchar(50)"`
	LastModificationTime     string     `gorm:"column:last_modification_time;type:varchar(50)"`
	SharedType               int        `gorm:"column:shared_type;type:smallint"`
	IsProvincialManagement   int        `gorm:"column:is_provincial_management;type:smallint"`
	NewOrgID                 string     `gorm:"column:new_org_id;type:varchar(50)"`
	NewOrg                   string     `gorm:"column:new_org;type:varchar(255)"`
	IsNewAdd                 string     `gorm:"column:is_new_add;type:varchar(2)"`
	ApplyNumBase             float64    `gorm:"column:apply_num_base;type:double"`
	ResQuality               int        `gorm:"column:res_quality;type:smallint"`
	ApplyNum                 float64    `gorm:"column:apply_num;type:double"`
	Score                    float64    `gorm:"column:score;type:double"`
	EvaluatorsNum            string     `gorm:"column:evaluators_num;type:varchar(255)"`
	IsCollection             string     `gorm:"column:is_collection;type:varchar(255)"`
	Type                     string     `gorm:"column:type;type:varchar(255)"`
	ReleaseDepartment        string     `gorm:"column:release_department;type:varchar(255)"`
	ReleaseDepartmentName    string     `gorm:"column:release_department_name;type:varchar(255)"`
	ReleaseTime              *time.Time `gorm:"column:release_time;type:datetime"`
	AuditDepartment          string     `gorm:"column:audit_department;type:varchar(255)"`
	AuditDepartmentName      string     `gorm:"column:audit_department_name;type:varchar(255)"`
	Expire                   string     `gorm:"column:expire;type:varchar(255)"` //有效期
	CatalogueID              string     `gorm:"column:catalogue_id;type:varchar(50)"`
	DeleteFlag               string     `gorm:"column:delete_flag;type:varchar(2)"`

	FlowNodeID   string     `gorm:"column:flow_node_id" json:"flow_node_id"`     // 目录当前所处审核流程结点ID
	FlowNodeName string     `gorm:"column:flow_node_name" json:"flow_node_name"` // 目录当前所处审核流程结点名称
	FlowID       string     `gorm:"column:flow_id" json:"flow_id"`               // 审批流程实例ID
	FlowName     string     `gorm:"column:flow_name" json:"flow_name"`           // 审批流程名称
	FlowVersion  string     `gorm:"column:flow_version" json:"flow_version"`     // 审批流程版本
	AuditAdvice  string     `gorm:"audit_advice" json:"audit_advice"`
	ProcDefKey   string     `gorm:"column:proc_def_key" json:"proc_def_key"`                                                                                                                                 // 审核流程key
	FlowApplyId  string     `gorm:"column:flow_apply_id" json:"flow_apply_id"`                                                                                                                               // 审核流程ID
	AuditType    string     `gorm:"column:audit_type;type:varchar(50);not null;default:unpublished;comment:审核类型 unpublished 未发布 af-data-catalog-online 上线审核 af-data-catalog-offline 下线审核" json:"audit_type"` // 审核类型 unpublished 未发布 af-data-catalog-online 上线审核 af-data-catalog-offline  下线审核
	AuditState   int        `gorm:"audit_state" json:"audit_state"`                                                                                                                                          // 审核状态，1 审核中  2 通过  3 驳回
	OnlineStatus string     `gorm:"column:online_status;type:varchar(20);not null;default:notline;comment:上线状态 " json:"status"`                                                                              // 上线状态 未上线 notline、已上线 online、已下线offline、上线审核中up-auditing、下线审核中down-auditing、上线审核未通过up-reject
	OnlineTime   *time.Time `gorm:"column:online_time;type:datetime;comment:上线时间" json:"online_time"`                                                                                                        // 上线时间
}

func (*ElecLicence) TableName() string {
	return TableNameElecLicence
}

func (m *ElecLicence) BeforeCreate(_ *gorm.DB) error {
	var err error
	if m == nil {
		return nil
	}
	if m.ID == 0 {
		if m.ID, err = utils.GetUniqueID(); err != nil {
			return err
		}
	}
	if m.ElecLicenceID == "" {
		m.ElecLicenceID = uuid.New().String()
	}
	now := time.Now()

	if m.CreateTime == nil {
		m.CreateTime = &now
	}
	if m.UpdateTime == nil {
		m.UpdateTime = &now
	}

	return err
}
