package front_end_processor

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	doc_audit_rest_v1 "github.com/kweaver-ai/idrm-go-common/api/doc_audit_rest/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 聚合
func (uc *useCase) aggregateFrontEndProcessorListInto(ctx context.Context, in *configuration_center_v1.FrontEndProcessorList, out *configuration_center_v1.AggregatedFrontEndProcessorList) {
	out.Entries = make([]configuration_center_v1.AggregatedFrontEndProcessor, len(in.Entries))
	for i := range in.Entries {
		uc.aggregateFrontEndProcessorInto(ctx, &in.Entries[i], &out.Entries[i])
	}
	out.TotalCount = in.TotalCount
}

// 聚合
func (uc *useCase) aggregateFrontEndProcessorList(ctx context.Context, in *configuration_center_v1.FrontEndProcessorList) (out *configuration_center_v1.AggregatedFrontEndProcessorList) {
	if in == nil {
		return nil
	}
	out = new(configuration_center_v1.AggregatedFrontEndProcessorList)
	uc.aggregateFrontEndProcessorListInto(ctx, in, out)
	return
}

// 聚合 FrontEndProcessor
func (uc *useCase) aggregateFrontEndProcessorInto(ctx context.Context, in *configuration_center_v1.FrontEndProcessor, out *configuration_center_v1.AggregatedFrontEndProcessor) {
	var err error
	// 创建人
	creator, err := uc.user.GetByUserId(ctx, in.CreatorID)
	if err != nil {
		log.Warn("get front end processor creator fail", zap.Error(err), zap.String("id", in.CreatorID))
		creator = new(model.User)
	}
	// 更新人
	updater, err := uc.user.GetByUserId(ctx, in.UpdaterID)
	if err != nil {
		log.Warn("get front end processor updater fail", zap.Error(err), zap.String("id", in.UpdaterID))
		updater = new(model.User)
	}
	// 申请人
	requester, err := uc.user.GetByUserId(ctx, in.RequesterID)
	if err != nil {
		log.Warn("get front end processor requester fail", zap.Error(err), zap.String("id", in.RequesterID))
		requester = new(model.User)
	}
	// 签收人
	recipient, err := uc.user.GetByUserId(ctx, in.RecipientID)
	if err != nil {
		log.Warn("get front end processor recipient fail", zap.Error(err), zap.String("id", in.RecipientID))
		recipient = new(model.User)
	}
	// 部门
	department, err := uc.businessStructure.GetObjByID(ctx, in.Request.Department.ID)
	if err != nil {
		log.Warn("get front end processor department fail", zap.Error(err), zap.String("id", in.Request.Department.ID))
		department = new(model.Object)
	}
	// workflow 审核结果、意见
	var audit *configuration_center_v1.AggregatedWorkflowAudit
	if bizID := in.Status.ApplyID; bizID != "" {
		apply, err := uc.biz.Get(ctx, bizID)
		if err != nil {
			log.Warn("get workflow biz fail", zap.Error(err), zap.String("id", bizID))
			apply = &doc_audit_rest_v1.Apply{BizID: bizID}
		}
		audit = &configuration_center_v1.AggregatedWorkflowAudit{
			ID:          apply.ID,
			BizID:       apply.BizID,
			AuditStatus: normalizeAuditStatus(apply.AuditStatus),
			AuditMsg:    apply.AuditMsg,
			TaskID:      apply.TaskID,
		}
	}

	out.AggregatedFrontEndProcessorMetadata = configuration_center_v1.AggregatedFrontEndProcessorMetadata{
		FrontEndProcessorMetadata: in.FrontEndProcessorMetadata,
		CreatorName:               creator.Name,
		UpdaterName:               updater.Name,
		RequesterName:             requester.Name,
		RecipientName:             recipient.Name,
	}

	// 获取 front_end 数据
	frontEnd, err := uc.frontEndProcessor.GetFrontEndsByFrontEndProcessorID(ctx, in.ID)
	if err != nil {
		log.Warn("get front end processor front_end fail", zap.Error(err), zap.String("id", in.ID))
		frontEnd = []*configuration_center_v1.FrontEnd{}
	}

	// 构建 infos 切片
	var infos []configuration_center_v1.FrontEndProcessorInfo

	// 遍历每个 front_end
	for _, fe := range frontEnd {
		// 初始化 libs 为空列表
		var libs []configuration_center_v1.FrontEndLibrary

		// 获取该 front_end 对应的 libraries
		frontEndLibraries, err := uc.frontEndProcessor.GetFrontEndLibrariesByFrontEndID(ctx, in.ID, fe.ID)
		if err != nil {
			log.Warn("get front end libraries fail", zap.Error(err), zap.String("frontEndID", fe.ID))
			frontEndLibraries = []*configuration_center_v1.FrontEndLibrary{}
		}

		// 构建 library list
		for _, lib := range frontEndLibraries {
			libs = append(libs, configuration_center_v1.FrontEndLibrary{
				ID:             lib.ID,
				Name:           lib.Name,
				Type:           lib.Type,
				FrontEndItemID: lib.FrontEndItemID,
				Version:        lib.Version,
				Comment:        lib.Comment,
				Username:       lib.Username,
				Password:       lib.Password,
				BusinessName:   lib.BusinessName,
				FrontEndID:     lib.FrontEndID,
				UpdatedAt:      lib.UpdatedAt,
				CreatedAt:      lib.CreatedAt,
				BusinessTime:   lib.BusinessTime,
			})
		}

		// 构建 info 条目
		info := configuration_center_v1.FrontEndProcessorInfo{
			ID:                 fe.ID,
			FrontEndID:         fe.FrontEndID,
			OS:                 fe.OperatorSystem,
			Spec:               fe.ComputerResource,
			IP:                 fe.IP,
			Port:               fe.Port,
			Name:               fe.Node,
			AdministratorName:  fe.AdministratorName,
			AdministratorPhone: fe.AdministratorPhone,
			BusinessDiskSpace:  fe.DiskSpace,
			LibraryCount:       fe.LibraryNumber,
			LibraryList:        libs,
		}

		// 添加进 infos 数组
		infos = append(infos, info)
	}

	// 根据id获取业务系统名称
	var businessSystemName string
	if in.Request.Deployment.RunBusinessSystem == "" {
		businessSystemName = ""
	} else {
		infoSystem, err := uc.repo.GetByID(ctx, in.Request.Deployment.RunBusinessSystem)
		if err != nil {
			log.Warn("get front end processor info system fail", zap.Error(err), zap.String("id", in.Request.Department.ID))
			infoSystem = new(model.InfoSystem)
		}
		businessSystemName = infoSystem.Name
	}

	out.Request = configuration_center_v1.AggregatedFrontEndProcessorRequest{
		Department: configuration_center_v1.AggregatedFrontEndProcessorDepartment{
			FrontEndProcessorDepartment: configuration_center_v1.FrontEndProcessorDepartment{
				ID:      in.Request.Department.ID,
				Address: in.Request.Department.Address,
			},
			Path: department.Path,
		},
		Contact: in.Request.Contact,
		Deployment: configuration_center_v1.FrontEndProcessorDeployment{
			DeployArea:          in.Request.Deployment.DeployArea,
			RunBusinessSystem:   businessSystemName,
			BusinessSystemLevel: in.Request.Deployment.BusinessSystemLevel,
		},
		Info:      infos,
		Comment:   in.Request.Comment,
		IsDraft:   in.Request.IsDraft,
		ApplyType: in.Request.ApplyType,
	}

	/*out.Deployment = configuration_center_v1.FrontEndProcessorDeployment{
		DeployArea:          in.Request.Deployment.DeployArea,
		RunBusinessSystem:   in.Request.Deployment.RunBusinessSystem,
		BusinessSystemLevel: in.Request.Deployment.BusinessSystemLevel,
	}*/

	// 赋值给 out.Info（必须是 slice）
	//out.Info = infos

	out.Node = in.Node

	out.Status = configuration_center_v1.AggregatedFrontEndProcessorStatus{
		Phase:        in.Status.Phase,
		Audit:        audit,
		RejectReason: in.Status.RejectReason,
	}

	// 设置默认的 audit 值
	/*defaultAudit := &configuration_center_v1.AggregatedWorkflowAudit{
		ID:          "",
		BizID:       "",
		AuditStatus: doc_audit_rest_v1.AuditStatus(in.Status.Phase),
		AuditMsg:    "",
		TaskID:      "",
	}

	// 如果 audit 不为 nil，则使用其值
	if audit != nil {
		defaultAudit = &configuration_center_v1.AggregatedWorkflowAudit{
			ID:          audit.ID,
			BizID:       audit.BizID,
			AuditStatus: doc_audit_rest_v1.AuditStatus(in.Status.Phase),
			AuditMsg:    audit.AuditMsg,
			TaskID:      audit.TaskID,
		}
	}

	// 状态映射：当 audit_status 为 auditing 时，phase 显示为 pending
	var phase configuration_center_v1.FrontEndProcessorPhase
	if string(defaultAudit.AuditStatus) == "Auditing" {
		phase = configuration_center_v1.FrontEndProcessorPending
	} else {
		phase = configuration_center_v1.FrontEndProcessorPhase(defaultAudit.AuditStatus)
	}

	out.Status = configuration_center_v1.AggregatedFrontEndProcessorStatus{
		Phase: phase,
		Audit: defaultAudit,
	}*/
}

// 添加状态转换函数
func normalizeAuditStatus(status doc_audit_rest_v1.AuditStatus) doc_audit_rest_v1.AuditStatus {
	if status == doc_audit_rest_v1.AuditStatus(AuditStatusPending) {
		return doc_audit_rest_v1.AuditStatus(AuditStatusAuditing)
	}
	return status
}

// 聚合 FrontEndProcessorDetail
func (uc *useCase) aggregateFrontEndProcessorDetailInto(ctx context.Context, in *configuration_center_v1.FrontEndProcessor, out *configuration_center_v1.FrontEndProcessorDetail) {
	var err error

	// 创建人
	_, err = uc.user.GetByUserId(ctx, in.CreatorID)
	if err != nil {
		log.Warn("get front end processor creator fail", zap.Error(err), zap.String("id", in.CreatorID))
		_ = new(model.User)
	}
	// 更新人
	_, err = uc.user.GetByUserId(ctx, in.UpdaterID)
	if err != nil {
		log.Warn("get front end processor updater fail", zap.Error(err), zap.String("id", in.UpdaterID))
		_ = new(model.User)
	}
	// 申请人
	_, err = uc.user.GetByUserId(ctx, in.RequesterID)
	if err != nil {
		log.Warn("get front end processor requester fail", zap.Error(err), zap.String("id", in.RequesterID))
		_ = new(model.User)
	}
	// 签收人
	_, err = uc.user.GetByUserId(ctx, in.RecipientID)
	if err != nil {
		log.Warn("get front end processor recipient fail", zap.Error(err), zap.String("id", in.RecipientID))
		_ = new(model.User)
	}
	// 部门
	_, err = uc.businessStructure.GetObjByID(ctx, in.Request.Department.ID)
	if err != nil {
		log.Warn("get front end processor department fail", zap.Error(err), zap.String("id", in.Request.Department.ID))
		_ = new(model.Object)
	}
	// workflow 审核结果、意见
	var audit *configuration_center_v1.AggregatedWorkflowAudit
	if bizID := in.Status.ApplyID; bizID != "" {
		apply, err := uc.biz.Get(ctx, bizID)
		if err != nil {
			log.Warn("get workflow biz fail", zap.Error(err), zap.String("id", bizID))
			apply = &doc_audit_rest_v1.Apply{BizID: bizID}
		}
		audit = &configuration_center_v1.AggregatedWorkflowAudit{
			ID:          apply.ID,
			BizID:       apply.BizID,
			AuditStatus: apply.AuditStatus,
			AuditMsg:    apply.AuditMsg,
			TaskID:      apply.TaskID,
		}
	}

	out.FrontEndProcessorMetadataResponse = configuration_center_v1.FrontEndProcessorMetadataResponse{
		ID:                 in.ID,
		OrderID:            in.OrderID,
		Name:               in.Request.Contact.Name,
		Phone:              in.Request.Contact.Phone,
		Mail:               in.Request.Contact.Mail,
		Mobile:             in.Request.Contact.Mobile,
		AdministratorName:  in.Request.Contact.AdministratorName,
		AdministratorPhone: in.Request.Contact.AdministratorPhone,
		AdministratorMail:  in.Request.Contact.AdministratorMail,
		AdministratorFax:   in.Request.Contact.AdministratorFax,
	}

	out.Deployment = configuration_center_v1.FrontEndProcessorDeployment{
		DeployArea:          in.Request.Deployment.DeployArea,
		RunBusinessSystem:   in.Request.Deployment.RunBusinessSystem,
		BusinessSystemLevel: in.Request.Deployment.BusinessSystemLevel,
	}

	out.Status = configuration_center_v1.AggregatedFrontEndProcessorStatus{
		Phase: in.Status.Phase,
		Audit: audit,
	}
}

func (uc *useCase) aggregateFrontEndProcessorDetail(
	ctx context.Context,
	in *configuration_center_v1.FrontEndProcessor,
	frontEnds []*configuration_center_v1.FrontEnd,
	frontLibraries []*configuration_center_v1.FrontEndLibrary,
) (*configuration_center_v1.FrontEndProcessorDetail, error) {

	detail := &configuration_center_v1.FrontEndProcessorDetail{
		// 假设 FrontEndProcessorMetadataResponse 可以从 in 中构造
		FrontEndProcessorMetadataResponse: configuration_center_v1.FrontEndProcessorMetadataResponse{
			ID:                 in.ID,
			OrderID:            in.OrderID,
			Name:               in.Request.Contact.Name,
			Phone:              in.Request.Contact.Phone,
			Mail:               in.Request.Contact.Mail,
			Mobile:             in.Request.Contact.Mobile,
			AdministratorName:  in.Request.Contact.AdministratorName,
			AdministratorPhone: in.Request.Contact.AdministratorPhone,
			AdministratorMail:  in.Request.Contact.AdministratorMail,
			AdministratorFax:   in.Request.Contact.AdministratorFax,
		},
		// Request 字段
		Request: in.Request,
	}

	// 获取 front_end 数据
	frontEnd, err := uc.frontEndProcessor.GetFrontEndsByFrontEndProcessorID(ctx, in.ID)
	if err != nil {
		log.Warn("get front end processor front_end fail", zap.Error(err), zap.String("id", in.ID))
		frontEnd = []*configuration_center_v1.FrontEnd{}
	}

	// 构建 infos 切片
	for _, fe := range frontEnd {
		// 直接从数据库获取 libraries
		log.WithContext(ctx).Info("-------------------------------prepared query--------------------" + fe.ID)
		frontEndLibraries, err := uc.frontEndProcessor.GetFrontEndLibrariesByFrontEndID(ctx, in.ID, fe.ID)
		log.WithContext(ctx).Info("-------------------------------query finished--------------------" + fe.ID)
		//打印frontEndLibraries是否有数据呢

		if err != nil {
			log.Warn("get front end libraries fail", zap.Error(err), zap.String("frontEndID", fe.ID))
			frontEndLibraries = []*configuration_center_v1.FrontEndLibrary{}
		}

		// 构建 library list
		var libs []configuration_center_v1.FrontEndLibrary
		for _, lib := range frontEndLibraries {
			log.WithContext(ctx).Info("-------------------------------id.value--------------------" + lib.ID)
			log.WithContext(ctx).Info("-------------------------------id.Type--------------------" + lib.Type)
			log.WithContext(ctx).Info("-------------------------------id.FrontEndItemID--------------------" + lib.FrontEndItemID)
			log.WithContext(ctx).Info("-------------------------------id.Username--------------------" + lib.Username)
			log.WithContext(ctx).Info("-------------------------------id.Password--------------------" + lib.Password)
			log.WithContext(ctx).Info("-------------------------------id.BusinessName--------------------" + lib.BusinessName)
			log.WithContext(ctx).Info("-------------------------------id.Comment--------------------" + lib.Comment)
			log.WithContext(ctx).Info("-------------------------------id.UpdatedAt--------------------" + lib.UpdatedAt)
			libs = append(libs, configuration_center_v1.FrontEndLibrary{
				ID:             lib.ID,
				FrontEndID:     lib.FrontEndID, // 添加此行
				Name:           lib.Name,
				Type:           lib.Type,
				Username:       lib.Username, // 添加此行
				Password:       lib.Password,
				BusinessName:   lib.BusinessName, // 添加此行
				Comment:        lib.Comment,      // 添加此行
				UpdatedAt:      lib.UpdatedAt,    // 添加此行
				CreatedAt:      lib.CreatedAt,    // 添加此行
				FrontEndItemID: lib.FrontEndItemID,
			})
		}

		//打印libs中各个字段的值
		for _, lib := range libs {
			log.WithContext(ctx).Info("-------------after------------------id.value--------------------" + lib.ID)
			log.WithContext(ctx).Info("--------------after-----------------id.Type--------------------" + lib.Type)
			log.WithContext(ctx).Info("--------------after-----------------id.value--------------------" + lib.FrontEndItemID)
			log.WithContext(ctx).Info("---------------after----------------id.value--------------------" + lib.Username)
			log.WithContext(ctx).Info("----------------after---------------id.value--------------------" + lib.Password)
			log.WithContext(ctx).Info("-----------------after--------------id.value--------------------" + lib.BusinessName)
		}
		// 将 LibraryList 设置为 libs
		fe.LibraryList = libs

		// 添加到 detail.Processor
		detail.Processor = append(detail.Processor, configuration_center_v1.FrontEndProcessorInfo{
			FrontEndID:        fe.FrontEndID,
			Spec:              fe.ComputerResource,
			BusinessDiskSpace: fe.DiskSpace,
			OS:                fe.OperatorSystem,
			LibraryCount:      fe.LibraryNumber,
			LibraryList:       fe.LibraryList,
		})
	}
	return detail, nil
}

// 在文件顶部定义常量
const (
	AuditStatusPending  = "pending"
	AuditStatusAuditing = "auditing"
)

// 聚合 FrontEndProcessor
func (uc *useCase) aggregateFrontEndProcessor(ctx context.Context, in *configuration_center_v1.FrontEndProcessor) (out *configuration_center_v1.AggregatedFrontEndProcessor) {
	out = new(configuration_center_v1.AggregatedFrontEndProcessor)
	uc.aggregateFrontEndProcessorInto(ctx, in, out)
	return out
}

/*func (uc *useCase) aggregateFrontEndProcessorDetail(ctx context.Context, in *configuration_center_v1.FrontEndProcessor) (out *configuration_center_v1.FrontEndProcessorDetail) {
	out = new(configuration_center_v1.FrontEndProcessorDetail)
	uc.aggregateFrontEndProcessorDetailInto(ctx, in, out)
	return out
}*/

// 如果存在下面这两个函数，请确认其用途是否与当前聚合逻辑冲突，否则建议删除或重命名避免混淆
// func (uc *useCase) aggregateFrontEndProcessor(...) {}
// func (uc *useCase) aggregateFrontEndProcessorDetail(...) {}
