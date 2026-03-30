package front_end_processor

import (
	"database/sql"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

// Convert FrontEndProcessor: v1 -> Model
func convertFrontEndProcessorV1IntoModel(in *configuration_center_v1.FrontEndProcessor, out *model.FrontEndProcessor) {
	out.ID = in.ID
	out.OrderID = in.OrderID
	out.CreatorID = in.CreatorID
	out.UpdaterID = in.UpdaterID
	out.RequesterID = in.RequesterID
	out.RecipientID = in.RecipientID
	if in.CreationTimestamp != "" {
		out.CreationTimestamp = &in.CreationTimestamp
	} else {
		out.CreationTimestamp = nil
	}
	if in.UpdateTimestamp != "" {
		out.UpdateTimestamp = &in.UpdateTimestamp
	} else {
		out.UpdateTimestamp = nil
	}
	if in.RequestTimestamp != "" {
		out.RequestTimestamp = &in.RequestTimestamp
	} else {
		out.RequestTimestamp = nil
	}
	if in.AllocationTimestamp != "" {
		out.AllocationTimestamp = &in.AllocationTimestamp
	} else {
		out.AllocationTimestamp = nil
	}
	if in.ReceiptTimestamp != "" {
		out.ReceiptTimestamp = &in.ReceiptTimestamp
	} else {
		out.ReceiptTimestamp = nil
	}
	if in.ReclaimTimestamp != "" {
		out.ReclaimTimestamp = &in.ReclaimTimestamp
	} else {
		out.ReclaimTimestamp = nil
	}
	out.DepartmentID = in.Request.Department.ID
	out.DepartmentAddress = in.Request.Department.Address
	out.ContactName = in.Request.Contact.Name
	out.ContactPhone = in.Request.Contact.Phone
	out.ContactMobile = in.Request.Contact.Mobile
	out.ContactMail = in.Request.Contact.Mail
	out.Comment = in.Request.Comment
	out.IsDraft = ptr.To(in.Request.IsDraft)

	out.AdministratorName = in.Request.Contact.AdministratorName
	out.AdministratorPhone = in.Request.Contact.AdministratorPhone
	out.AdministratorEmail = in.Request.Contact.AdministratorMail
	out.AdministratorFax = in.Request.Contact.AdministratorFax
	out.DeploymentSystem = in.Request.Deployment.RunBusinessSystem
	out.DeploymentArea = in.Request.Deployment.DeployArea
	out.ProtectionLevel = in.Request.Deployment.BusinessSystemLevel
	out.ApplyType = in.Request.ApplyType

	if in.Node != nil {
		out.NodeIP = in.Node.IP
		out.NodePort = in.Node.Port
		out.NodeName = in.Node.Name
		out.AdministratorName = in.Node.Administrator.Name
		out.AdministratorPhone = in.Node.Administrator.Phone
	}
	out.Phase = ptr.To(convertFrontEndProcessorPhaseV1ToModel(in.Status.Phase))
	out.RejectReason = in.Status.RejectReason
	out.ApplyID = &in.Status.ApplyID
}

// Convert FrontEndProcessor: v1 -> Model
func convertFrontEndProcessorV1ToModel(in *configuration_center_v1.FrontEndProcessor) (out *model.FrontEndProcessor) {
	out = new(model.FrontEndProcessor)
	convertFrontEndProcessorV1IntoModel(in, out)
	return
}

// Convert FrontEndProcessorRequest: v1 -> model
func convertFrontEndProcessorRequestV1IntoModel(in *configuration_center_v1.FrontEndProcessorRequest, out *model.FrontEndProcessorRequest) {
	out.DepartmentID = in.Department.ID
	out.DepartmentAddress = in.Department.Address
	out.ContactName = in.Contact.Name
	out.ContactPhone = in.Contact.Phone
	out.ContactMobile = in.Contact.Mobile
	out.ContactMail = in.Contact.Mail
	out.Comment = in.Comment
	out.IsDraft = ptr.To(in.IsDraft)

}

// Convert []FrontEndProcessorPhase: v1 -> model
func convertFrontEndProcessorPhasesV1IntoModel(in []configuration_center_v1.FrontEndProcessorPhase, out []model.FrontEndProcessorPhase) {
	for i := 0; i < len(in) && i < len(out); i++ {
		convertFrontEndProcessorPhaseV1IntoModel(&in[i], &out[i])
	}
}

// Convert []FrontEndProcessorPhase: v1 -> model
func convertFrontEndProcessorPhasesV1ToModel(in []configuration_center_v1.FrontEndProcessorPhase) (out []model.FrontEndProcessorPhase) {
	if in == nil {
		return
	}
	out = make([]model.FrontEndProcessorPhase, len(in))
	convertFrontEndProcessorPhasesV1IntoModel(in, out)
	return
}

// Convert FrontEndProcessorPhase: v1 -> model
func convertFrontEndProcessorPhaseV1IntoModel(in *configuration_center_v1.FrontEndProcessorPhase, out *model.FrontEndProcessorPhase) {
	switch *in {
	// 待处理，用户创建了前置机申请，但未上报。
	case configuration_center_v1.FrontEndProcessorPending:
		*out = model.FrontEndProcessorPending
	// 审核中，用户的前置机申请正在被审核。
	case configuration_center_v1.FrontEndProcessorAuditing:
		*out = model.FrontEndProcessorAuditing
	// 分配中，用户的前置机申请已经被批准，正在分配前置机。
	case configuration_center_v1.FrontEndProcessorAllocating:
		*out = model.FrontEndProcessorAllocating
	// 已分配，已经分配前置机，等待用户签收。
	case configuration_center_v1.FrontEndProcessorAllocated:
		*out = model.FrontEndProcessorAllocated
	// 使用中，用户已经签收前置机，前置机在使用中。
	case configuration_center_v1.FrontEndProcessorInCompleted:
		*out = model.FrontEndProcessorInCompleted
	// 已回收，前置机已经被回收。
	case configuration_center_v1.FrontEndProcessorReclaimed:
		*out = model.FrontEndProcessorReclaimed
	// 已驳回，用户frontend processor申请被驳回。
	case configuration_center_v1.FrontEndProcessorRejected:
		*out = model.FrontEndProcessorRejected
	default:
		return
	}
}

// Convert FrontEndProcessorPhase: v1 -> model
func convertFrontEndProcessorPhaseV1ToModel(in configuration_center_v1.FrontEndProcessorPhase) (out model.FrontEndProcessorPhase) {
	convertFrontEndProcessorPhaseV1IntoModel(&in, &out)
	return
}

// Convert []FrontEndProcessor: model -> v1
func convertFrontEndProcessorsModelIntoV1(in []model.FrontEndProcessorV2, out []configuration_center_v1.FrontEndProcessor) {
	for i := 0; i < len(in) && i < len(out); i++ {
		convertFrontEndProcessorModelIntoV1(&in[i], &out[i])
	}
}

// Convert []FrontEndProcessor: model -> v1
func convertFrontEndProcessorsModelToV1(in []model.FrontEndProcessorV2) (out []configuration_center_v1.FrontEndProcessor) {
	if in == nil {
		return nil
	}
	out = make([]configuration_center_v1.FrontEndProcessor, len(in))
	convertFrontEndProcessorsModelIntoV1(in, out)
	return
}

// Convert FrontEndProcessor: model -> v1
func convertFrontEndProcessorModelIntoV1(in *model.FrontEndProcessorV2, out *configuration_center_v1.FrontEndProcessor) {
	convertFrontEndProcessorMetadataModelIntoV1(&in.FrontEndProcessorMetadata, &out.FrontEndProcessorMetadata)
	convertFrontEndProcessorRequestModelIntoV1(&in.FrontEndProcessorRequest, &out.Request)
	out.Node = convertFrontEndProcessorNodeModelToV1(&in.FrontEndProcessorNode)
	convertFrontEndProcessorStatusModelIntoV1(&in.FrontEndProcessorStatus, &out.Status)
}

func convertFrontEndProcessorDetails(in *model.FrontEndProcessorV2, out *configuration_center_v1.FrontEndProcessor) {
	out.ID = in.ID
	out.OrderID = in.OrderID
	out.Request.Department.ID = in.DepartmentID
	out.Request.Contact.Name = in.ContactName
	out.Request.Contact.Phone = in.ContactPhone
	out.Request.Contact.Mobile = in.ContactMobile
	out.Request.Contact.Mail = in.ContactMail
	out.Request.Comment = in.Comment
	out.Request.Contact.AdministratorName = in.FrontEndProcessorRequest.AdministratorName
	out.Request.Contact.AdministratorMail = in.FrontEndProcessorRequest.AdministratorEmail
	out.Request.Contact.AdministratorFax = in.FrontEndProcessorRequest.AdministratorFax
	out.Request.Contact.AdministratorPhone = in.FrontEndProcessorRequest.AdministratorPhone
	out.Request.ApplyType = in.ApplyType
	out.CreatorID = in.CreatorID
	out.RequesterID = in.RequesterID
	out.RecipientID = in.RecipientID
	out.ReclaimTimestamp = in.ReclaimTimestamp.Time.Format("2006-01-02 15:04:05.000")
	out.AllocationTimestamp = in.AllocationTimestamp.Time.Format("2006-01-02 15:04:05.000")
	out.Request.Department.Address = in.DepartmentAddress
	out.CreationTimestamp = in.CreationTimestamp.Time.Format("2006-01-02 15:04:05.000")
	out.UpdateTimestamp = in.UpdateTimestamp.Time.Format("2006-01-02 15:04:05.000")
	out.RequestTimestamp = in.RequestTimestamp.Time.Format("2006-01-02 15:04:05.000")
	out.Request.Deployment.DeployArea = in.DeploymentArea
	out.Request.Deployment.RunBusinessSystem = in.DeploymentSystem
	out.Request.Deployment.BusinessSystemLevel = in.ProtectionLevel
	convertFrontEndProcessorStatusModelIntoV1(&in.FrontEndProcessorStatus, &out.Status)
}

// Convert FrontEndProcessor: model -> v1
func convertFrontEndProcessorModelToV1(in *model.FrontEndProcessorV2) (out *configuration_center_v1.FrontEndProcessor) {
	if in == nil {
		return
	}
	out = new(configuration_center_v1.FrontEndProcessor)
	convertFrontEndProcessorModelIntoV1(in, out)
	return
}

func convertFrontEndProcessorDetailNodeModelToV1(in *model.FrontEndProcessorV2) (out *configuration_center_v1.FrontEndProcessor) {
	if in == nil {
		return
	}
	out = new(configuration_center_v1.FrontEndProcessor)
	convertFrontEndProcessorDetails(in, out)
	return
}

// Convert FrontEndProcessorNode: model -> v1
func convertFrontEndProcessorNodeV1IntoModel(in *configuration_center_v1.FrontEndProcessorNode, out *model.FrontEndProcessorNode) {
	out.NodeIP = in.IP
	out.NodePort = in.Port
	out.NodeName = in.Name
	out.AdministratorName = in.Administrator.Name
	out.AdministratorPhone = in.Administrator.Phone
}

func convertFrontEndProcessorMetadataModelIntoV1(in *model.FrontEndProcessorMetadata, out *configuration_center_v1.FrontEndProcessorMetadata) {
	out.ID = in.ID
	out.OrderID = in.OrderID
	out.CreatorID = in.CreatorID
	out.UpdaterID = in.UpdaterID
	out.RequesterID = in.RequesterID
	out.RecipientID = in.RecipientID
	out.CreationTimestamp = nullTimeToString(in.CreationTimestamp)
	out.UpdateTimestamp = nullTimeToString(in.UpdateTimestamp)
	out.RequestTimestamp = nullTimeToString(in.RequestTimestamp)
	out.AllocationTimestamp = nullTimeToString(in.AllocationTimestamp)
	out.ReceiptTimestamp = nullTimeToString(in.ReceiptTimestamp)
	out.ReclaimTimestamp = nullTimeToString(in.ReclaimTimestamp)
}

func nullTimeToString(nt sql.NullTime) string {
	if nt.Valid {
		return nt.Time.Format("2006-01-02 15:04:05")
	}
	return ""
}

func convertFrontEndProcessorRequestModelIntoV1(in *model.FrontEndProcessorRequest, out *configuration_center_v1.FrontEndProcessorRequest) {
	out.Department = configuration_center_v1.FrontEndProcessorDepartment{
		ID:      in.DepartmentID,
		Address: in.DepartmentAddress,
	}
	out.Contact = configuration_center_v1.FrontEndProcessorContact{
		Name:               in.ContactName,
		Phone:              in.ContactPhone,
		Mobile:             in.ContactMobile,
		Mail:               in.ContactMail,
		AdministratorName:  in.AdministratorName,
		AdministratorMail:  in.AdministratorEmail,
		AdministratorFax:   in.AdministratorFax,
		AdministratorPhone: in.AdministratorPhone,
	}

	out.Deployment = configuration_center_v1.FrontEndProcessorDeployment{
		DeployArea:          in.DeploymentArea,
		RunBusinessSystem:   in.DeploymentSystem,
		BusinessSystemLevel: in.ProtectionLevel,
	}
	out.Comment = in.Comment
	out.IsDraft = ptr.Deref(in.IsDraft, false)
	out.ApplyType = in.ApplyType
}

func convertFrontEndProcessorNodeModelIntoV1(in *model.FrontEndProcessorNode, out *configuration_center_v1.FrontEndProcessorNode) {
	out.IP = in.NodeIP
	out.Port = in.NodePort
	out.Name = in.NodeName
	out.Administrator = configuration_center_v1.FrontEndProcessorNodeAdministrator{
		Name:  in.AdministratorName,
		Phone: in.AdministratorPhone,
	}
}
func convertFrontEndProcessorNodeModelToV1(in *model.FrontEndProcessorNode) (out *configuration_center_v1.FrontEndProcessorNode) {
	if in == nil {
		return
	}
	// 如果所有字段都为零值也返回 nil
	if in.NodeIP == "" && in.NodeName == "" && in.NodePort == 0 && in.AdministratorName == "" && in.AdministratorPhone == "" {
		return
	}

	out = new(configuration_center_v1.FrontEndProcessorNode)
	convertFrontEndProcessorNodeModelIntoV1(in, out)
	return
}
func convertFrontEndProcessorStatusModelIntoV1(in *model.FrontEndProcessorStatus, out *configuration_center_v1.FrontEndProcessorStatus) {
	out.Phase = convertFrontEndProcessorPhaseModelToV1(in.Phase)
	out.ApplyID = ptr.Deref(in.ApplyID, "")
	out.RejectReason = ptr.Deref(in.RejectReason, "")
}

func convertFrontEndProcessorPhaseModelToV1(in *model.FrontEndProcessorPhase) (out configuration_center_v1.FrontEndProcessorPhase) {
	if in == nil {
		return configuration_center_v1.FrontEndProcessorPending
	}

	switch *in {
	// 待处理，用户创建了前置机申请，但未上报。
	case model.FrontEndProcessorPending:
		out = configuration_center_v1.FrontEndProcessorPending
	// 审核中，用户的前置机申请正在被审核。
	case model.FrontEndProcessorAuditing:
		out = configuration_center_v1.FrontEndProcessorAuditing
	// 分配中，用户的前置机申请已经被批准，正在分配前置机。
	case model.FrontEndProcessorAllocating:
		out = configuration_center_v1.FrontEndProcessorAllocating
	// 已分配，已经分配前置机，等待用户签收。
	case model.FrontEndProcessorAllocated:
		out = configuration_center_v1.FrontEndProcessorAllocated
	// 使用中，用户已经签收前置机，前置机在使用中。
	case model.FrontEndProcessorInCompleted:
		out = configuration_center_v1.FrontEndProcessorInCompleted
	// 已回收，前置机已经被回收。
	case model.FrontEndProcessorReclaimed:
		out = configuration_center_v1.FrontEndProcessorReclaimed
	// 已驳回 ，前置机申请被驳回。
	case model.FrontEndProcessorRejected:
		out = configuration_center_v1.FrontEndProcessorRejected
	}
	return
}
