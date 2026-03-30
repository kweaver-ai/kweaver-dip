package tenant_application

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	//"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	//"github.com/google/uuid"
)

type TenantApplication interface {
	Create(ctx context.Context, req *TenantApplicationCreateReq, userId, userName string) (*IDResp, error)
	Update(ctx context.Context, req *TenantApplicationUpdateReq, id, userId, userName string) (*IDResp, error)
	CheckNameRepeat(ctx context.Context, req *TenantApplicationNameRepeatReq) error
	CheckNameRepeatV2(ctx context.Context, req *TenantApplicationNameRepeatReq) (*TenantApplicationNameRepeatReqResp, error)
	Delete(ctx context.Context, id string) error
	GetDetails(ctx context.Context, id string) (*TenantApplicationDetailResp, error)
	GetByWorkOrderId(ctx context.Context, id string) (*TenantApplicationDetailResp, error)
	GetList(ctx context.Context, req *TenantApplicationListReq, userId string) (*TenantApplicationListResp, error)
	Cancel(ctx context.Context, req *TenantApplicationCancelReq, id string) (err error)
	AuditList(ctx context.Context, query *AuditListGetReq) (*TenantApplicationAuditListResp, error)
	UpdateTenantApplicationStatus(ctx context.Context, req *UpdateTenantApplicationStatusReq, id, userId string) (*IDResp, error)
}

const (
	S_STATUS_UNREPORT           = "unreport"           // 未申报
	S_STATUS_PENDING_ACTIVATION = "pending_activation" // 待激活
	S_STATUS_ACTIVATION         = "activated"          // 已激活
	S_STATUS_DEACTIVATED        = "deactivated"        // 已禁用
	S_STATUS_DELETE             = "delete"             // 租户申请不存在, 不是正式状态
)

const (
	T_DATACATALOG_ONLINE_STATUS_NOTLINE       = "notline"       // 未上线
	T_DATACATALOG_ONLINE_STATUS_ONLINE        = "online"        // 已上线
	T_DATACATALOG_ONLINE_STATUS_OFFLINE       = "offline"       // 未上线
	T_DATACATALOG_ONLINE_STATUS_UN_AUDITING   = "up-auditing"   // 上线审核中
	T_DATACATALOG_ONLINE_STATUS_DOWN_AUDITING = "down-auditing" // 下线审核中
	T_DATACATALOG_ONLINE_STATUS_UP_REJECT     = "up-reject"     // 上线审核未通过
	T_DATACATALOG_ONLINE_STATUS_DOWN_REJECT   = "down-reject"   // 下线审核未通过
)

const (
	T_RESROUCE_NORMAL_STATUS = "normal"
	T_RESROUCE_DELETE_STATUS = "delete"
)

const (
	T_SUBMIT = "submit" // 提交
	T_DRAFT  = "draft"  // 草稿
)

type TenantAuditStatus enum.Object

var (
	AuditStatusAuditing = enum.New[TenantAuditStatus](1, "auditing") // 审核中
	AuditStatusUndone   = enum.New[TenantAuditStatus](2, "undone")   // 撤销
	AuditStatusReject   = enum.New[TenantAuditStatus](3, "reject")   // 拒绝
	AuditStatusPass     = enum.New[TenantAuditStatus](4, "pass")     // 通过
	AuditStatusNone     = enum.New[TenantAuditStatus](5, "none")     // 未发起审核
)

const (
	T_AUDIT_STATUS_AUDITING = "auditing" // 审核中
	T_AUDIT_STATUS_UNDONE   = "undone"   // 撤销
	T_AUDIT_STATUS_REJECT   = "reject"   // 拒绝
	T_AUDIT_STATUS_PASS     = "pass"     // 通过
	T_AUDIT_STATUS_NONE     = "none"     // 未发起审核
)

const (
	TN_AUDIT_STATUS_AUDITING int32 = 1 // 审核中
	TN_AUDIT_STATUS_UNDONE   int32 = 2 // 撤销
	TN_AUDIT_STATUS_REJECT   int32 = 3 // 拒绝
	TN_AUDIT_STATUS_PASS     int32 = 4 // 通过
	TN_AUDIT_STATUS_NONE     int32 = 5 // 未发起审核
)

func TAAuditStatus2Enum(status string) int32 {
	var s int32 = 0
	switch status {
	case T_AUDIT_STATUS_AUDITING:
		s = TN_AUDIT_STATUS_AUDITING
	case T_AUDIT_STATUS_UNDONE:
		s = TN_AUDIT_STATUS_UNDONE
	case T_AUDIT_STATUS_REJECT:
		s = TN_AUDIT_STATUS_REJECT
	case T_AUDIT_STATUS_PASS:
		s = TN_AUDIT_STATUS_PASS
	case T_AUDIT_STATUS_NONE:
		s = TN_AUDIT_STATUS_NONE
	}
	return s
}

func TAEnum2AuditStatus(status int32) string {
	s := ""
	switch status {
	case TN_AUDIT_STATUS_AUDITING:
		s = T_AUDIT_STATUS_AUDITING
	case TN_AUDIT_STATUS_UNDONE:
		s = T_AUDIT_STATUS_UNDONE
	case TN_AUDIT_STATUS_REJECT:
		s = T_AUDIT_STATUS_REJECT
	case TN_AUDIT_STATUS_PASS:
		s = T_AUDIT_STATUS_PASS
	case TN_AUDIT_STATUS_NONE:
		s = T_AUDIT_STATUS_NONE
	}
	return s
}

const (
	DARA_STATUS_UNREPORT           = 1 // 未申报
	DARA_STATUS_PENDING_ACTIVATION = 2 // 待激活
	DARA_STATUS_ACTIVATION         = 3 // 已激活
	DARA_STATUS_DEACTIVATED        = 4 // 已禁用
)

func SAAStatus2Enum(status string) int {
	s := 0
	switch status {
	case S_STATUS_UNREPORT:
		s = DARA_STATUS_UNREPORT
	case S_STATUS_PENDING_ACTIVATION:
		s = DARA_STATUS_PENDING_ACTIVATION
	case S_STATUS_ACTIVATION:
		s = DARA_STATUS_ACTIVATION
	case S_STATUS_DEACTIVATED:
		s = DARA_STATUS_DEACTIVATED
	}
	return s
}

func SAAStatus2Str(status int) string {
	s := ""
	switch status {
	case DARA_STATUS_UNREPORT:
		s = S_STATUS_UNREPORT
	case DARA_STATUS_PENDING_ACTIVATION:
		s = S_STATUS_PENDING_ACTIVATION
	case DARA_STATUS_ACTIVATION:
		s = S_STATUS_ACTIVATION
	case DARA_STATUS_DEACTIVATED:
		s = S_STATUS_DEACTIVATED
	}
	return s
}

type TenantApplicationCreateReq struct {
	TenantApplicationBase
	DatabaseAccountList []*TenantApplicationDatabaseAccountItem `json:"database_account_list" binding:"required_if=SubmitType submit,VerifyTenantApplicationDataAccountList,omitempty"` // 数据库清单
}

type TenantApplicationBase struct {
	SubmitType                   string `json:"submit_type" binding:"required,oneof=draft submit"`
	ApplicationName              string `json:"application_name" form:"application_name" binding:"trimSpace,required,max=128,omitempty"`                                              // 申请名称
	TenantName                   string `json:"tenant_name" form:"tenant_name" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty"`                                   // 数据归集计划ID
	TenantAdminID                string `json:"tenant_admin_id" form:"tenant_admin_id" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty"`                           // 调研目的
	TenantAdminName              string `json:"tenant_admin_name" form:"tenant_admin_name" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty"`                       // 调研目的
	BusinessUnitID               string `json:"business_unit_id" form:"business_unit_id" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty,uuid"`                    // 调研对象
	BusinessUnitName             string `json:"business_unit_name" form:"business_unit_name" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty"`                     // 调研方法
	BusinessUnitContactorID      string `json:"business_unit_contactor_id" form:"business_unit_contactor_id" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty"`     // 调研内容
	BusinessUnitContactorName    string `json:"business_unit_contactor_name" form:"business_unit_contactor_name" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty"` // 调研结论
	BusinessUnitPhone            string `json:"business_unit_phone" form:"business_unit_phone" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty,VerifyPhone"`       // 申报意见
	BusinessUnitEmail            string `json:"business_unit_email" form:"business_unit_email" binding:"trimSpace,required_if=SubmitType submit,max=128,omitempty,len=0|email"`
	BusinessUnitFax              string `json:"business_unit_fax" form:"business_unit_fax" binding:"trimSpace,max=128,omitempty"`
	MaintenanceUnitID            string `json:"maintenance_unit_id" form:"maintenance_unit_id" binding:"trimSpace,max=128,omitempty"`
	MaintenanceUnitName          string `json:"maintenance_unit_name" form:"maintenance_unit_name" binding:"trimSpace,max=128,omitempty"`
	MaintenanceUnitContactorID   string `json:"maintenance_unit_contactor_id" form:"maintenance_unit_contactor" binding:"trimSpace,max=128,omitempty"`
	MaintenanceUnitContactorName string `json:"maintenance_unit_contactor_name" form:"maintenance_unit_contactor_name" binding:"trimSpace,max=128,omitempty"`
	MaintenanceUnitPhone         string `json:"maintenance_unit_phone" form:"maintenance_unit_phone" binding:"trimSpace,max=128,omitempty,VerifyPhone"`
	MaintenanceUnitEmail         string `json:"maintenance_unit_email" form:"maintenance_unit_email" binding:"trimSpace,max=128,omitempty,len=0|email"`
}

type TenantApplicationDatabaseAccountItem struct {
	DatabaseType             string                               `json:"database_type" form:"database_type" binding:"required,oneof=tbds tbase,trimSpace,min=1,max=128"`                               // 名称
	DatabaseName             string                               `json:"database_name" form:"database_name" binding:"required_if=DatabaseType tbase,trimSpace,min=1,max=128"`                          // 名称
	TenantAccount            string                               `json:"tenant_account" form:"tenant_account" binding:"required_if=DatabaseType tbds,trimSpace,min=1,max=128"`                         // 数据归集计划ID
	TenantPasswd             string                               `json:"tenant_passwd" form:"tenant_passwd" binding:"required_if=DatabaseType tbds,trimSpace,min=1,max=128"`                           // 调研
	ProjectName              string                               `json:"project_name" form:"project_name" binding:"required_if=DatabaseType tbds,min=1,max=128"`                                       // 调研
	ActualAllocatedResources string                               `json:"actual_allocated_resources" form:"actual_allocated_resources" binding:"required_if=DatabaseType tbds,trimSpace,min=1,max=128"` // 调研
	UserAuthenticationHadoop string                               `json:"user_authentication_hadoop" form:"user_authentication_hadoop" binding:"required_if=DatabaseType tbds,trimSpace,min=1,max=500"` // 调研
	UserAuthenticationHbase  string                               `json:"user_authentication_hbase" form:"user_authentication_hbase" binding:"required_if=DatabaseType tbds,trimSpace,min=1,max=500"`   // 调研
	UserAuthenticationHive   string                               `json:"user_authentication_hive" form:"user_authentication_hive" binding:"required_if=DatabaseType tbds,trimSpace,min=1,max=500"`     // 调研
	DataResourceList         []*TenantApplicationDataResourceItem `json:"data_resource_list" binding:"omitempty"`
}

type TenantApplicationDataResourceItem struct {
	DataCatalogId     string   `json:"data_catalog_id" form:"data_catalog_id" binding:"required,trimSpace,min=1,max=128"`         // 名称
	DataCatalogName   string   `json:"data_catalog_name" form:"data_catalog_name" binding:"required,trimSpace,min=1,max=128"`     // 名称
	DataCatalogCode   string   `json:"data_catalog_code" form:"data_catalog_code" binding:"required,trimSpace,min=1,max=128"`     // 名称
	MountResourceId   string   `json:"mount_resource_id" form:"mount_resource_id" binding:"required,trimSpace,min=1,max=128"`     // 名称
	MountResourceName string   `json:"mount_resource_name" form:"mount_resource_name" binding:"required,trimSpace,min=1,max=128"` // 名称
	MountResourceCode string   `json:"mount_resource_code" form:"mount_resource_code" binding:"required,trimSpace,min=1,max=128"` // 名称
	DataSourceId      string   `json:"data_source_id" form:"data_source_id" binding:"required,trimSpace,min=1,max=128"`           // 名称
	DataSourceName    string   `json:"data_source_name" form:"data_source_name" binding:"required,trimSpace,min=1,max=128"`       // 名称
	ApplyPermission   []string `json:"apply_permission" form:"apply_permission" binding:"required,trimSpace,min=1,max=128"`       // 名称
	ApplyPurpose      string   `json:"apply_purpose" form:"apply_purpose" binding:"required,trimSpace,min=1,max=128"`             // 名称
}

func (t *TenantApplicationCreateReq) ToModel(userId string, uniqueID uint64) *model.TcTenantApp {
	item := model.TcTenantApp{
		TenantApplicationID: uniqueID,
		ID:                  uuid.NewString(),
		ApplicationName:     t.ApplicationName,

		Status:       DARA_STATUS_UNREPORT,
		CreatedByUID: userId,
		UpdatedByUID: userId,
	}

	if t.TenantName != "" {
		item.TenantName = t.TenantName
	}

	if t.TenantAdminID != "" {
		item.TenantAdminID = t.TenantAdminID
	}
	if t.BusinessUnitID != "" {
		item.BusinessUnitID = t.BusinessUnitID
	}
	if t.BusinessUnitContactorID != "" {
		item.BusinessUnitContactorID = t.BusinessUnitContactorID
	}
	if t.BusinessUnitPhone != "" {
		item.BusinessUnitPhone = t.BusinessUnitPhone
	}
	if t.BusinessUnitEmail != "" {
		item.BusinessUnitEmail = t.BusinessUnitEmail
	}
	if t.BusinessUnitFax != "" {
		item.BusinessUnitFax = t.BusinessUnitFax
	}

	if t.MaintenanceUnitID != "" {
		item.MaintenanceUnitID = t.MaintenanceUnitID
	}
	if t.MaintenanceUnitName != "" {
		item.MaintenanceUnitName = t.MaintenanceUnitName
	}
	if t.MaintenanceUnitContactorID != "" {
		item.MaintenanceUnitContactorID = t.MaintenanceUnitContactorID
	}
	if t.MaintenanceUnitContactorName != "" {
		item.MaintenanceUnitContactorName = t.MaintenanceUnitContactorName
	}
	if t.MaintenanceUnitPhone != "" {
		item.MaintenanceUnitPhone = t.MaintenanceUnitPhone
	}
	if t.MaintenanceUnitEmail != "" {
		item.MaintenanceUnitEmail = t.MaintenanceUnitEmail
	}

	return &item
}

func TenantApplicationListParams2Map(req *TenantApplicationListReq) map[string]any {
	rMap := map[string]any{}
	if req.Offset > 0 {
		rMap["offset"] = req.Offset
	} else {
		rMap["offset"] = 1
	}

	if req.Limit > 0 {
		rMap["limit"] = req.Limit
	} else {
		rMap["limit"] = 10
	}

	if len(req.Direction) > 0 {
		rMap["direction"] = req.Direction
	} else {
		rMap["direction"] = "desc"
	}

	if len(req.Sort) > 0 {
		if req.Sort == "applied_at" {
			rMap["sort"] = "updated_at"
		} else {
			rMap["sort"] = req.Sort
		}

	} else {
		rMap["sort"] = "updated_at"
	}

	if len(req.Keyword) > 0 {
		rMap["keyword"] = req.Keyword
	}
	if req.ApplyBeginTime != nil && *req.ApplyBeginTime > 0 {
		rMap["apply_begin_time"] = time.UnixMilli(int64(*req.ApplyBeginTime))
	}

	if req.ApplyEndTime != nil && *req.ApplyEndTime > 0 {
		rMap["apply_end_time"] = time.UnixMilli(int64(*req.ApplyEndTime))
	}

	if req.ApplyDepartmentId != nil && len(*req.ApplyDepartmentId) > 0 {

		rMap["business_unit_id"] = []string{*req.ApplyDepartmentId}
	}

	if req.OnlyMine == true {
		rMap["only_mine"] = true
	}

	if req.Status != nil && len(*req.Status) > 0 {
		statusList := strings.Split(*req.Status, ",")
		statusIntList := []int{}
		for _, item := range statusList {
			statusInt := SAAStatus2Enum(item)
			if statusInt == 0 {
				continue
			}
			statusIntList = append(statusIntList, statusInt)
		}
		if len(statusIntList) > 0 {
			rMap["status_list"] = statusIntList
		}
	}

	return rMap
}

type TenantApplicationUpdateReq struct {
	//SubmitType string `json:"submit_type" binding:"required,oneof=draft submit"`
	TenantApplicationBase
	DatabaseAccountList []*TenantApplicationDatabaseAccountUpdateItem `json:"database_account_list" binding:"required_if=SubmitType submit,VerifyTenantApplicationDataAccountUpdateList,omitempty"`
}

type TenantApplicationDatabaseAccountUpdateItem struct {
	DatabaseAccountId        string                                     `json:"database_account_id" form:"database_account_id" binding:"required,trimSpace,min=1,max=128"`
	DatabaseType             string                                     `json:"database_type" form:"database_type" binding:"required,trimSpace,min=1,max=128"`                           // 名称
	DatabaseName             string                                     `json:"database_name" form:"database_name" binding:"required,trimSpace,min=1,max=128"`                           // 名称
	TenantAccount            string                                     `json:"tenant_account" form:"tenant_account" binding:"required,trimSpace,max=128"`                               // 数据归集计划ID
	TenantPasswd             string                                     `json:"tenant_passwd" form:"tenant_passwd" binding:"required,trimSpace,max=128"`                                 // 调研
	ProjectName              string                                     `json:"project_name" form:"project_name" binding:"required,trimSpace,max=128"`                                   // 调研
	ActualAllocatedResources string                                     `json:"actual_allocated_resources" form:"actual_allocated_resources" binding:"required,trimSpace,min=1,max=128"` // 调研
	UserAuthenticationHadoop string                                     `json:"user_authentication_hadoop" form:"user_authentication_hadoop" binding:"required,trimSpace,min=1,max=500"` // 调研
	UserAuthenticationHbase  string                                     `json:"user_authentication_hbase" form:"user_authentication_hbase" binding:"required,trimSpace,min=1,max=500"`   // 调研
	UserAuthenticationHive   string                                     `json:"user_authentication_hive" form:"user_authentication_hive" binding:"required,trimSpace,min=1,max=500"`     // 调研
	DataResourceList         []*TenantApplicationDataResourceUpdateItem `json:"data_resource_list" binding:"omitempty"`
}

type TenantApplicationDataResourceUpdateItem struct {
	DataResourceItemId string   `json:"data_resource_item_id" form:"data_resource_item_id" binding:"required,trimSpace,min=1,max=128"` // 名称
	DataCatalogId      string   `json:"data_catalog_id" form:"data_catalog_id" binding:"required,trimSpace,min=1,max=128"`             // 名称
	DataCatalogName    string   `json:"data_catalog_name" form:"data_catalog_name" binding:"required,trimSpace,min=1,max=128"`         // 名称
	DataCatalogCode    string   `json:"data_catalog_code" form:"data_catalog_code" binding:"required,trimSpace,min=1,max=128"`         // 名称
	MountResourceId    string   `json:"mount_resource_id" form:"mount_resource_id" binding:"required,trimSpace,min=1,max=128"`         // 名称
	MountResourceName  string   `json:"mount_resource_name" form:"mount_resource_name" binding:"required,trimSpace,min=1,max=128"`     // 名称
	MountResourceCode  string   `json:"mount_resource_code" form:"mount_resource_code" binding:"required,trimSpace,min=1,max=128"`     // 名称
	DataSourceId       string   `json:"data_source_id" form:"data_source_id" binding:"required,trimSpace,min=1,max=128"`               // 名称
	DataSourceName     string   `json:"data_source_name" form:"data_source_name" binding:"required,trimSpace,min=1,max=128"`           // 名称
	ApplyPermission    []string `json:"apply_permission" form:"apply_permission" binding:"required,trimSpace,min=1,max=128"`           // 名称
	ApplyPurpose       string   `json:"apply_purpose" form:"apply_purpose" binding:"required,trimSpace,min=1,max=128"`                 // 名称
	EditStatus         string   `json:"edit_status" form:"edit_status" binding:"required,trimSpace,min=1,max=300"`                     // 调研
}

func (t *TenantApplicationUpdateReq) ToModel(userId string) *model.TcTenantApp {
	item := model.TcTenantApp{
		ApplicationName: t.ApplicationName,

		UpdatedByUID: userId,
	}

	if t.TenantName != "" {
		item.TenantName = t.TenantName
	}

	if t.TenantAdminID != "" {
		item.TenantAdminID = t.TenantAdminID
	}
	if t.BusinessUnitID != "" {
		item.BusinessUnitID = t.BusinessUnitID
	}
	if t.BusinessUnitContactorID != "" {
		item.BusinessUnitContactorID = t.BusinessUnitContactorID
	}
	if t.BusinessUnitPhone != "" {
		item.BusinessUnitPhone = t.BusinessUnitPhone
	}
	if t.BusinessUnitEmail != "" {
		item.BusinessUnitEmail = t.BusinessUnitEmail
	}
	//if t.MaintenanceUnitID != "" {
	//	item.MaintenanceUnitID = t.MaintenanceUnitID
	//}
	item.MaintenanceUnitID = t.MaintenanceUnitID
	//if t.MaintenanceUnitName != "" {
	//	item.MaintenanceUnitName = t.MaintenanceUnitName
	//}
	item.MaintenanceUnitName = t.MaintenanceUnitName
	//if t.MaintenanceUnitContactorID != "" {
	//	item.MaintenanceUnitContactorID = t.MaintenanceUnitContactorName
	//}
	item.MaintenanceUnitContactorID = t.MaintenanceUnitContactorName
	//if t.MaintenanceUnitContactorName != "" {
	//	item.MaintenanceUnitContactorName = t.MaintenanceUnitContactorName
	//}
	item.MaintenanceUnitContactorName = t.MaintenanceUnitContactorName
	//if t.MaintenanceUnitPhone != "" {
	//	item.MaintenanceUnitPhone = t.MaintenanceUnitPhone
	//}
	item.MaintenanceUnitPhone = t.MaintenanceUnitPhone
	//if t.MaintenanceUnitEmail != "" {
	//	item.MaintenanceUnitEmail = t.MaintenanceUnitEmail
	//}
	item.MaintenanceUnitEmail = t.MaintenanceUnitEmail
	//if t.BusinessUnitFax != "" {
	//	item.BusinessUnitFax = t.BusinessUnitFax
	//}
	item.BusinessUnitFax = t.BusinessUnitFax
	return &item
}

type IDResp struct {
	UUID string `json:"id"  example:"4a5a3cc0-0169-4d62-9442-62214d8fcd8d"` //UUID
}

type TenantApplicationNameRepeatReq struct {
	Id   string `json:"id" form:"id"  binding:"verifyUuidNotRequired"`
	Name string `json:"name" form:"name" binding:"trimSpace,required,max=128"`
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries"`     // 对象列表
	TotalCount int64 `json:"total_count"` // 当前筛选条件下的对象数量
}

type TenantApplicationDetailResp struct {
	ID                           string                                     `json:"id"`
	ApplicationName              string                                     `json:"application_name"`
	ApplicationCode              string                                     `json:"application_code"`
	TenantName                   string                                     `json:"tenant_name"`
	TenantAdminID                string                                     `json:"tenant_admin_id"`
	TenantAdminName              string                                     `json:"tenant_admin_name"`
	BusinessUnitID               string                                     `json:"business_unit_id"`
	BusinessUnitName             string                                     `json:"business_unit_name"`
	BusinessUnitContactorID      string                                     `json:"business_unit_contactor_id"`
	BusinessUnitContactorName    string                                     `json:"business_unit_contactor_name"`
	BusinessUnitPhone            string                                     `json:"business_unit_phone"`
	BusinessUnitEmail            string                                     `json:"business_unit_email"`
	BusinessUnitFax              *string                                    `json:"business_unit_fax"`
	MaintenanceUnitID            string                                     `json:"maintenance_unit_id"`
	MaintenanceUnitName          string                                     `json:"maintenance_unit_name"`
	MaintenanceUnitContactorID   string                                     `json:"maintenance_unit_contactor_id"`
	MaintenanceUnitContactorName string                                     `json:"maintenance_unit_contactor_name"`
	MaintenanceUnitPhone         string                                     `json:"maintenance_unit_phone"`
	MaintenanceUnitEmail         string                                     `json:"maintenance_unit_email"`
	AppliedByUid                 string                                     `json:"applied_by_uid"`
	AppliedByName                string                                     `json:"applied_by_name"`
	Status                       string                                     `json:"status"`
	DatabaseAccountList          []*TenantApplicationDatabaseAccountDetails `json:"database_account_list" binding:"omitempty"` // 分析场景产物列表,仅自助型必填，委托型不传或传null）
}

type TenantApplicationDatabaseAccountDetails struct {
	DatabaseAccountId        string                                  `json:"database_account_id" `
	DatabaseType             string                                  `json:"database_type" `              // 名称
	DatabaseName             string                                  `json:"database_name"`               // 名称
	TenantAccount            string                                  `json:"tenant_account" `             // 数据归集计划ID
	TenantPasswd             string                                  `json:"tenant_passwd" `              // 调研
	ProjectName              string                                  `json:"project_name" `               // 调研
	ActualAllocatedResources string                                  `json:"actual_allocated_resources" ` // 调研
	UserAuthenticationHadoop string                                  `json:"user_authentication_hadoop" ` // 调研
	UserAuthenticationHbase  string                                  `json:"user_authentication_hbase" `  // 调研
	UserAuthenticationHive   string                                  `json:"user_authentication_hive" `   // 调研
	DataResourceList         []*TenantApplicationDataResourceDetails `json:"data_resource_list" binding:"omitempty"`
}

type TenantApplicationDataResourceDetails struct {
	DataResourceItemId      string   `json:"data_resource_item_id" `
	DataCatalogId           string   `json:"data_catalog_id" `            // 名称
	DataCatalogName         string   `json:"data_catalog_name" `          // 名称
	DataCatalogCode         string   `json:"data_catalog_code" `          // 名称
	DataCatalogOnlineStatus string   `json:"data_catalog_online_status" ` // 名称
	MountResourceId         string   `json:"mount_resource_id" `          // 名称
	MountResourceName       string   `json:"mount_resource_name" `        // 名称
	MountResourceCode       string   `json:"mount_resource_code" `        // 名称
	DataSourceId            string   `json:"data_source_id" `             // 名称
	DataSourceName          string   `json:"data_source_name" `           // 名称
	ApplyPermission         []string `json:"apply_permission" `           // 名称
	ApplyPurpose            string   `json:"apply_purpose" `              // 名称
	Status                  string   `json:"status" `
}

type PageInfo struct {
	Offset    int    `form:"offset,default=1" binding:"omitempty" example:"1" default:"1"`                            // 页码，默认1
	Limit     int    `form:"limit,default=1" binding:"omitempty" example:"10" default:"10"`                           // 每页大小，默认1
	Direction string `form:"direction,default=desc" binding:"omitempty,oneof=asc desc" example:"desc" default:"desc"` // 排序方向，枚举：asc：正序；desc：倒序。默认倒序
	Sort      string `form:"sort,default=applied_at" binding:"omitempty"`                                             // 排序类型，枚举：created_at：按创建时间排序；finish_date：按期望完成时间排序。默认按创建时间排序
}

type KeywordInfo struct {
	Keyword string `form:"keyword" binding:"omitempty,min=1,max=128" example:"keyword"` // 关键字查询，字符无限制
}

type PageInfoWithKeyword struct {
	PageInfo
	KeywordInfo
}

type TenantApplicationListReq struct {
	PageInfoWithKeyword
	ApplyDepartmentId *string `json:"apply_department_id" form:"apply_department_id" binding:"omitempty,min=1"`
	Status            *string `json:"status" form:"status" binding:"omitempty,min=1"`
	ApplyBeginTime    *int    `form:"apply_begin_time" binding:"omitempty"` // 实施时间筛选（起始时间）
	ApplyEndTime      *int    `form:"apply_end_time" binding:"omitempty"`   // 实施时间筛选（结束时间）                                            // 开始日期
	OnlyMine          bool    `json:"only_mine" form:"only_mine" binding:"omitempty"`
}

type TenantApplicationListResp struct {
	PageResult[TenantApplicationObject]
}

type TenantApplicationObjectItem struct {
	ID              string `json:"id" form:"id" binding:"required,trimSpace,min=1,max=128"`                             // 名称
	ApplicationName string `json:"application_name" form:"application_name" binding:"required,trimSpace,min=1,max=128"` // 名称
	ApplicationCode string `json:"application_code" form:"application_code" binding:"required,trimSpace,min=1,max=128"` // 名称

	TenantName     string `json:"tenant_name" form:"tenant_name" binding:"required"`                                 // 数据归集计划ID
	DepartmentId   string `json:"department_id" form:"department_id" binding:"required,trimSpace,min=1,max=300"`     // 调研
	DepartmentName string `json:"department_name" form:"department_name" binding:"required,trimSpace,min=1,max=300"` // 调研
	DepartmentPath string `json:"department_path" form:"department_path" binding:"required,trimSpace,min=1,max=300"` // 调研
	ContactorName  string `json:"contactor_name" form:"contactor_name" binding:"required,trimSpace,min=1,max=300"`   // 调研
	ContactorId    string `json:"contactor_id" form:"contactor_id" binding:"required,trimSpace,min=1,max=300"`       // 调研
	ContactorPhone string `json:"contactor_phone" form:"contactor_phone" binding:"required,trimSpace,min=1,max=300"` // 调研
	AppliedAt      int64  `json:"applied_at" form:"applied_at" binding:"required,trimSpace,min=1,max=300"`           // 调研
	AppliedByUid   string `json:"applied_by_uid" form:"applied_by_uid" binding:"required,trimSpace,min=1,max=300"`   // 调研
	AppliedByName  string `json:"applied_by_name" form:"applied_by_name" binding:"required,trimSpace,min=1,max=300"` // 调研
	AuditStatus    string `json:"audit_status"`
	RejectReason   string `json:"reject_reason"`
	CancelReason   string `json:"cancel_reason"`
}
type TenantApplicationObject struct {
	TenantApplicationObjectItem
	Status string `json:"status" form:"status" binding:"required,trimSpace,min=1,max=128"` // 名称
}

type TenantApplicationAuditListResp struct {
	PageResult[TenantApplicationAuditItem]
}

type TenantApplicationAuditItem struct {
	TenantApplicationObjectItem
	AuditStatus string `json:"audit_status"`
	AuditType   string `json:"audit_type"`
	ProcInstID  string `json:"proc_inst_id"`
	TaskID      string `json:"task_id"`
	Status      string `json:"status"`
}

type AuditListGetReq struct {
	//Target  string `form:"target" binding:"required,oneof=tasks historys"`      // 审核列表类型 tasks 待审核 historys 已审核
	Offset  int    `form:"offset,default=1" binding:"omitempty" default:"1"`    // 页码，默认1
	Limit   int    `form:"limit,default=10" binding:"omitempty" default:"10"`   // 每页size，默认10
	Keyword string `form:"keyword" binding:"omitempty,trimSpace,min=1,max=128"` // 关键字查询，字符无限制
}

type TenantApplicationCancelReq struct {
	CancelReason string `json:"cancel_reason" binding:"required,oneof=draft submit"` // 撤销理由，字符无限制
}

type BriefTenantApplicationPathModel struct {
	Id string `json:"id" form:"id" uri:"id" binding:"required,uuid" example:"2eaccf8e-c7f0-40f9-ab7a-317d3b0c3802"` // 任务id，uuid（36）
}

type UpdateTenantApplicationStatusReq struct {
	Status string `json:"status" binding:"required,oneof=activated deactivated"`
}

type TenantApplicationNameRepeatReqResp struct {
	IsRepeated bool `json:"is_repeated"` // 是否重复
}

type Data struct {
	Id         string `json:"id"`
	Title      string `json:"title"`
	Type       string `json:"type"`
	SubmitTime int64  `json:"submit_time"`
}
