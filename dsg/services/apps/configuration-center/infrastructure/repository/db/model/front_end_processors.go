package model

import (
	"database/sql"
	"gorm.io/gorm"
)

const TableNameFrontEndProcessors = "front_end_processors"
const TableNameFrontEndItem = "front_end_item"

// FrontEndProcessor mapped from table <front_end_processors>
type FrontEndProcessor struct {
	// ID
	ID string `gorm:"column:id;primaryKey" json:"id,omitempty"`
	// 申请单号
	OrderID string `gorm:"column:order_id" json:"order_id,omitempty"`
	// 创建者 ID
	CreatorID string `gorm:"column:creator_id" json:"creator_id,omitempty"`
	// 更新者 ID
	UpdaterID string `gorm:"column:updater_id;default:null" json:"updater_id,omitempty"`
	// 申请者 ID
	RequesterID string `gorm:"column:requester_id;default:null" json:"requester_id,omitempty"`
	// 签收者 ID
	RecipientID string `gorm:"column:recipient_id;default:null" json:"recipient_id,omitempty"`
	// 创建时间
	CreationTimestamp *string `gorm:"column:creation_timestamp;default:CURRENT_TIMESTAMP(3)" json:"creator_timestamp,omitempty"`
	// 更新时间
	UpdateTimestamp *string `gorm:"column:update_timestamp;default:null" json:"update_timestamp,omitempty"`
	// 申请时间
	RequestTimestamp *string `gorm:"column:request_timestamp;default:null" json:"request_timestamp,omitempty"`
	// 分配时间
	AllocationTimestamp *string `gorm:"column:allocation_timestamp;default:null" json:"allocation_timestamp,omitempty"`
	// 签收时间
	ReceiptTimestamp *string `gorm:"column:receipt_timestamp;default:null" json:"receipt_timestamp,omitempty"`
	// 回收时间
	ReclaimTimestamp *string `gorm:"column:reclaim_timestamp;default:null" json:"reclaim_timestamp,omitempty"`
	// 删除时间
	DeletionTimestamp gorm.DeletedAt `gorm:"column:deletion_timestamp;default:null" json:"deletion_timestamp,omitempty"`
	// 所属部门 ID
	DepartmentID string `gorm:"column:department_id" json:"department_id,omitempty"`
	// 所属部门地址
	DepartmentAddress string `gorm:"column:department_address" json:"department_address,omitempty"`
	// 联系人姓名
	ContactName string `gorm:"column:contact_name" json:"contact_name,omitempty"`
	// 联系人电话
	ContactPhone string `gorm:"column:contact_phone;default:null" json:"contact_phone,omitempty"`
	// 联系人手机
	ContactMobile string `gorm:"column:contact_mobile;default:null" json:"contact_mobile,omitempty"`
	// 联系人邮箱
	ContactMail string `gorm:"column:contact_mail;default:null" json:"contact_mail,omitempty"`
	// 申请理由
	Comment string `gorm:"column:comment;default:null" json:"comment,omitempty"`
	// 是否为草稿、暂存
	IsDraft *bool `gorm:"column:is_draft;default:false;not null" json:"is_draft,omitempty"`
	// 节点 IP
	NodeIP string `gorm:"column:node_ip;default:null" json:"node_ip,omitempty"`
	// 节点端口号
	NodePort int `gorm:"column:node_port;default:null" json:"node_port,omitempty"`
	// 节点名称
	NodeName string `gorm:"column:node_name;default:null" json:"node_name,omitempty"`
	// 技术负责人姓名
	AdministratorName string `gorm:"column:administrator_name;default:null" json:"administrator_name,omitempty"`
	// 技术负责人电话
	AdministratorPhone string `gorm:"column:administrator_phone;default:null" json:"administrator_phone,omitempty"`
	// 在生命周期所处阶段
	Phase *FrontEndProcessorPhase `gorm:"column:phase" json:"phase,omitempty"`
	// workflow 审核 apply id
	ApplyID *string `gorm:"column:apply_id;default:null" json:"apply_id,omitempty"`
	//技术负责人邮箱
	AdministratorEmail string `gorm:"column:administrator_email;default:null" json:"administrator_email,omitempty"`
	//技术负责人传真
	AdministratorFax string `gorm:"column:administrator_fax;default:null" json:"administrator_fax,omitempty"`
	//部署区域
	DeploymentArea string `gorm:"column:deployment_area" json:"deployment_area,omitempty"`
	//运行业务系统
	DeploymentSystem string `gorm:"column:deployment_system" json:"deployment_system,omitempty"`
	//业务系统保护级别
	ProtectionLevel string `gorm:"column:protection_level" json:"protection_level,omitempty"`
	//申请类型
	ApplyType string `gorm:"column:apply_type" json:"apply_type,omitempty"`
	// 驳回原因
	RejectReason string `gorm:"column:reject_reason;default:null" json:"reject_reason,omitempty"`
}

// TableName FrontEndProcessor's table name
func (*FrontEndProcessor) TableName() string {
	return TableNameFrontEndProcessors
}

// FrontEndItem mapped from table <front_end_item>
type FrontEndItem struct {
	// 分配者 ID
	ID string `gorm:"column:id" json:"front_end_item_id,omitempty"`
	//关联前置机表front_end_id
	FrontEndID string `gorm:"column:front_end_id" json:"front_end_id,omitempty"`
	// 更新时间
	UpdatedAt string `gorm:"column:updated_at" json:"updated_at,omitempty"`
	// node信息
	//Node *FrontEndProcessorNode `json:"node,omitempty"`
	IP string `gorm:"column:node_ip" json:"ip,omitempty"`
	// 端口
	Port int32 `gorm:"column:node_port" json:"port,omitempty"`
	// 节点名称
	Name string `gorm:"column:node_name" json:"name,omitempty"`
	//技术负责人
	AdministratorName string `gorm:"column:administrator_name" json:"administrator_name,omitempty"`
	//技术负责人手机
	AdministratorPhone string `gorm:"column:administrator_phone" json:"administrator_phone,omitempty"`
	// 操作系统
	OS string `gorm:"column:operator_system" json:"operator_system,omitempty"`
	// 技术资源
	Resource string `gorm:"column:computer_resource" json:"computer_resource,omitempty"`
	// 业务磁盘空间
	ComputerDiskSpace string `gorm:"column:disk_space" json:"disk_space,omitempty"`
	// 前置库数量
	ComputerCount int32 `gorm:"column:library_number" json:"library_number,omitempty"`
	// 前置机状态
	Status string `gorm:"column:status" json:"status,omitempty"`
}

func (*FrontEndItem) TableName() string {
	return TableNameFrontEndItem
}

type FrontEndProcessorV2 struct {
	FrontEndProcessorMetadata

	FrontEndProcessorRequest

	FrontEndProcessorNode

	FrontEndProcessorStatus
}

func (FrontEndProcessorV2) TableName() string { return TableNameFrontEndProcessors }

// TODO: 添加分配时间
type FrontEndProcessorMetadata struct {
	// ID
	ID string `gorm:"column:id;primaryKey" json:"id,omitempty"`
	// 申请单号
	OrderID string `gorm:"column:order_id" json:"order_id,omitempty"`
	// 创建者 ID
	CreatorID string `gorm:"column:creator_id" json:"creator_id,omitempty"`
	// 更新者 ID
	UpdaterID string `gorm:"column:updater_id;default:null" json:"updater_id,omitempty"`
	// 申请者 ID
	RequesterID string `gorm:"column:requester_id;default:null" json:"requester_id,omitempty"`
	// 签收者 ID
	RecipientID string `gorm:"column:recipient_id;default:null" json:"recipient_id,omitempty"`
	// 创建时间
	CreationTimestamp sql.NullTime `gorm:"column:creation_timestamp;default:CURRENT_TIMESTAMP(3)" json:"creator_timestamp,omitempty"`
	// 更新时间
	UpdateTimestamp sql.NullTime `gorm:"column:update_timestamp;default:null" json:"update_timestamp,omitempty"`
	// 申请时间
	RequestTimestamp sql.NullTime `gorm:"column:request_timestamp;default:null" json:"request_timestamp,omitempty"`
	// 分配时间
	AllocationTimestamp sql.NullTime `gorm:"column:allocation_timestamp;default:null" json:"allocation_timestamp,omitempty"`
	// 签收时间
	ReceiptTimestamp sql.NullTime `gorm:"column:receipt_timestamp;default:null" json:"receipt_timestamp,omitempty"`
	// 回收时间
	ReclaimTimestamp sql.NullTime `gorm:"column:reclaim_timestamp;default:null" json:"reclaim_timestamp,omitempty"`
	// 删除时间
	DeletionTimestamp gorm.DeletedAt `gorm:"column:deletion_timestamp;default:null" json:"deletion_timestamp,omitempty"`
}

type FrontEndProcessorRequest struct {
	// 所属部门 ID
	DepartmentID string `gorm:"column:department_id" json:"department_id,omitempty"`
	// 所属部门地址
	DepartmentAddress string `gorm:"column:department_address" json:"department_address,omitempty"`
	// 联系人姓名
	ContactName string `gorm:"column:contact_name" json:"contact_name,omitempty"`
	// 联系人电话
	ContactPhone string `gorm:"column:contact_phone;default:null" json:"contact_phone,omitempty"`
	// 联系人手机
	ContactMobile string `gorm:"column:contact_mobile;default:null" json:"contact_mobile,omitempty"`
	// 联系人邮箱
	ContactMail string `gorm:"column:contact_mail;default:null" json:"contact_mail,omitempty"`
	// 技术负责人姓名
	AdministratorName string `gorm:"column:administrator_name;default:null" json:"administrator_name,omitempty"`
	// 技术负责人电话
	AdministratorPhone string `gorm:"column:administrator_phone;default:null" json:"administrator_phone,omitempty"`
	// 技术负责人传真
	AdministratorFax string `gorm:"column:administrator_fax;default:null" json:"administrator_fax,omitempty"`
	// 技术负责人邮箱
	AdministratorEmail string `gorm:"column:administrator_email;default:null" json:"administrator_email,omitempty"`
	// 申请理由
	Comment string `gorm:"column:comment;default:null" json:"comment,omitempty"`
	// 是否为草稿、暂存
	IsDraft *bool `gorm:"column:is_draft;default:false;not null" json:"is_draft,omitempty"`
	//部署区域
	DeploymentArea string `gorm:"column:deployment_area" json:"deployment_area,omitempty"`
	//运行业务系统
	DeploymentSystem string `gorm:"column:deployment_system" json:"deployment_system,omitempty"`
	//业务系统保护级别
	ProtectionLevel string `gorm:"column:protection_level" json:"protection_level,omitempty"`
	// 申请类型
	ApplyType string `gorm:"column:apply_type" json:"apply_type,omitempty"`
}

type FrontEndProcessorNode struct {
	// 节点 IP
	NodeIP string `gorm:"column:node_ip;default:null" json:"node_ip,omitempty"`
	// 节点端口号
	NodePort int `gorm:"column:node_port;default:null" json:"node_port,omitempty"`
	// 节点名称
	NodeName string `gorm:"column:node_name;default:null" json:"node_name,omitempty"`
	// 技术负责人姓名
	AdministratorName string `gorm:"column:administrator_name;default:null" json:"administrator_name,omitempty"`
	// 技术负责人电话
	AdministratorPhone string `gorm:"column:administrator_phone;default:null" json:"administrator_phone,omitempty"`
}

type FrontEndProcessorStatus struct {
	// 在生命周期所处阶段
	Phase *FrontEndProcessorPhase `gorm:"column:phase" json:"phase,omitempty"`
	// workflow 审核 apply id
	ApplyID *string `gorm:"column:apply_id;default:null" json:"apply_id,omitempty"`
	// 驳回理由
	RejectReason *string `gorm:"column:reject_reason;default:null" json:"reject_reason,omitempty"`
}

// 前置机在生命周期中所处的阶段
type FrontEndProcessorPhase int

// 前置机在生命周期中所处的阶段
const (
	// 待处理，用户创建了前置机申请，但未上报。
	FrontEndProcessorPending = FrontEndProcessorPhase(iota)
	// 审核中，用户的前置机申请正在被审核。
	FrontEndProcessorAuditing
	// 分配中，用户的前置机申请已经被批准，正在分配前置机。
	FrontEndProcessorAllocating
	// 已分配，已经分配前置机，等待用户签收。
	FrontEndProcessorAllocated
	// 使用中，用户已经签收前置机，前置机在使用中。
	FrontEndProcessorInCompleted
	// 已回收，前置机已经被回收。
	FrontEndProcessorReclaimed
	// 已驳回，用户已经驳回了申请。
	FrontEndProcessorRejected
)
