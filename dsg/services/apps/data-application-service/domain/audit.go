package domain

import (
	"context"
	"encoding/json"
	"fmt"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	configuration_center "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// auditOperationForServiceType 返回接口类型对应的审计日志操作动作
func auditOperationForServiceType(t string) v1.Operation {
	switch t {
	case "service_generate":
		return v1.OperationGenerateAPI
	case "service_register":
		return v1.OperationRegisterAPI
	default:
		return v1.Operation(fmt.Sprintf("undefined_data_application_service_%s", t))
	}
}

// serviceAuditResource 定义审计日志中的接口资源
type serviceAuditResource struct {
	// 接口 ID
	ID string `json:"id,omitempty"`
	// 接口名称
	Name string `json:"name,omitempty"`
	// 接口 Owner 的显示名称
	OwnerName string `json:"owner_name,omitempty"`
	// 接口所属主题的路径
	SubjectPath string `json:"subject_path,omitempty"`
	// 接口所属部门的路径
	DepartmentPath string `json:"department_path,omitempty"`
}

// GetName implements v1.ResourceObject.
func (r *serviceAuditResource) GetName() string {
	return r.Name
}

// GetDetail implements v1.ResourceObject.
func (r *serviceAuditResource) GetDetail() json.RawMessage {
	d, _ := json.Marshal(r)
	return d
}

var _ v1.ResourceObject = &serviceAuditResource{}

// auditLogCreate 记录审计日志：生成、注册接口
//   - id  接口服务的 ID
//   - serviceInfo 接口服务
func (u *ServiceDomain) auditLogCreate(ctx context.Context, id string, serviceInfo *dto.ServiceInfo) {
	logger := audit.FromContextOrDiscard(ctx)

	// 因为审计日志的内容需要额外调用接口获取，所以当不需要记录审计日志即日志器
	// 是 Discard 时直接返回
	if logger.IsZero() {
		return
	}

	// 接口类型对应的审计日志操作动作
	var operation = auditOperationForServiceType(serviceInfo.ServiceType)

	// 接口 Owner 的显示名称
	var ownerName string = getUserNameOrIDIfNotEmpty(ctx, u.UserManagementRepo, serviceInfo.OwnerId)

	// 接口所属的主题域
	var subjectPath string = getSubjectPathOrIDIfNotEmpty(ctx, u.DataSubjectRepo, serviceInfo.SubjectDomainId)

	// 接口所属的部门
	var departmentPath string = getDepartmentPathOrIDIfNotEmpty(ctx, u.configurationCenterRepo, serviceInfo.Department.ID)

	// 审计日志中的资源
	_ = &configuration_center.DetailAPI{
		ID:         id,
		Name:       serviceInfo.ServiceName,
		OwnerName:  ownerName,
		Subject:    subjectPath,
		Department: departmentPath,
	}
	var resource = &serviceAuditResource{
		ID:             id,
		Name:           serviceInfo.ServiceName,
		OwnerName:      ownerName,
		SubjectPath:    subjectPath,
		DepartmentPath: departmentPath,
	}

	logger.Info(operation, resource)
}

// 根据审核类型记录审计日志：发布、上线、下线接口
func auditLogAuditProcessInstanceCreate(ctx context.Context, auditType, serviceID, serviceName string) {
	var operation v1.Operation
	switch auditType {
	//发布
	case enum.AuditTypePublish:
		operation = v1.OperationPublicAPI
	//变更，接口变更的审计日志由 auditLogUpdateAPI 记录
	case enum.AuditTypeChange:
		// 因为“草稿 - 暂存”场景未调用 /audit-process-instance 所以审计日志“修改
		// 接口”不在此处记录
		return
	//上线
	case enum.AuditTypeOnline:
		operation = v1.OperationUpAPI
	//下线
	case enum.AuditTypeOffline:
		operation = v1.OperationDownAPI
	default:
		operation = v1.Operation(fmt.Sprintf("undefined_data_application_service_%s", auditType))
	}

	audit.FromContextOrDiscard(ctx).Info(operation, &serviceAuditResource{ID: serviceID, Name: serviceName})
}

// auditLog 记录审计日志
//
//   - serviceInfo 接口服务
func (u *ServiceDomain) auditLogDelete(ctx context.Context, serviceInfo *dto.ServiceInfo) {
	logger := audit.FromContextOrDiscard(ctx)

	// 审计日志中的资源
	var resource = &serviceAuditResource{
		ID:   serviceInfo.ServiceID,
		Name: serviceInfo.ServiceName,
	}

	logger.Warn(v1.OperationDeleteAPI, resource)
}

// auditLogPublicAPI 记录审计日志：发布接口
//   - id  接口服务的 ID
//   - serviceInfo 接口服务
func (u *ServiceDomain) auditLogPublicAPI(ctx context.Context, id string, name string) {
	logger := audit.FromContextOrDiscard(ctx)

	// 因为审计日志的内容需要额外调用接口获取，所以当不需要记录审计日志即日志器
	// 是 Discard 时直接返回
	if logger.IsZero() {
		return
	}

	// 接口类型对应的审计日志操作动作
	var operation = v1.OperationPublicAPI

	// 审计日志中的资源
	var resource = &serviceAuditResource{
		ID:   id,
		Name: name,
	}

	logger.Info(operation, resource)
}

// auditLogUpdateAPI 记录审计日志：修改接口
func (u *ServiceDomain) auditLogUpdateAPI(ctx context.Context, n *dto.ServiceInfo) {
	logger := audit.FromContextOrDiscard(ctx)

	// 因为审计日志的内容需要额外调用接口获取，所以当不需要记录审计日志即日志器
	// 是 Discard 时直接返回
	if logger.IsZero() {
		return
	}

	logger.Info(v1.OperationUpdateAPI, u.resourceForDTOServiceInfo(ctx, n))
}

// resourceForDTOServiceGetRes 根据 dto.ServiceGetRes 生成用于审计日志的 v1.ResourceObject
func (u *ServiceDomain) resourceForDTOServiceInfo(ctx context.Context, info *dto.ServiceInfo) v1.ResourceObject {
	// 接口 Owner 的显示名称
	var ownerName string = getUserNameOrIDIfNotEmpty(ctx, u.UserManagementRepo, info.OwnerId)

	// 接口所属的主题域
	var subjectPath string = getSubjectPathOrIDIfNotEmpty(ctx, u.DataSubjectRepo, info.SubjectDomainId)

	// 接口所属的部门
	var departmentPath string = getDepartmentPathOrIDIfNotEmpty(ctx, u.configurationCenterRepo, info.Department.ID)

	// 审计日志中的资源
	return &serviceAuditResource{
		ID:             info.ServiceID,
		Name:           info.ServiceName,
		OwnerName:      ownerName,
		SubjectPath:    subjectPath,
		DepartmentPath: departmentPath,
	}
}

// getUserNameOrID 当用户 ID 非空时，返回用户的显示名称，如果获取用户失败则返回用户 ID
func getUserNameOrIDIfNotEmpty(ctx context.Context, client microservice.UserManagementRepo, id string) string {
	if id == "" {
		return ""
	}

	userInfo, err := client.GetUserById(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("get user fail", zap.Error(err), zap.String("id", id))
		return id
	}
	return userInfo.Name
}

// getSubjectPathOrIDIfNotEmpty 当主题域 ID 非空时，返回主题域完整路径，如果获取主题域失败则返回主题域 ID
func getSubjectPathOrIDIfNotEmpty(ctx context.Context, client microservice.DataSubjectRepo, id string) string {
	if id == "" {
		return ""
	}

	res, err := client.DataSubjectGet(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("get data subject fail", zap.Error(err), zap.String("id", id))
		return id
	}
	return res.PathName
}

// getDepartmentPathOrIDIfNotEmpty 当部门 ID 非空时，返回部门及其上级部门完整路径，如果获取部门失败则返回部门 ID
func getDepartmentPathOrIDIfNotEmpty(ctx context.Context, client microservice.ConfigurationCenterRepo, id string) string {
	if id == "" {
		return ""
	}

	res, err := client.DepartmentGet(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("get department fail", zap.Error(err), zap.String("id", id))
		return id
	}
	return res.Path
}
