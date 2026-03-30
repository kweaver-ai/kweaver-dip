package impl

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	ccSelfDriven "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_catalog"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	utilities "github.com/kweaver-ai/idrm-go-frame/core/utils"

	//data_research_report_driven "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_research_report"
	tenant_application_driven "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tenant_application"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"

	//data_research_report_domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_research_report"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tenant_application"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	AUDIT_ICON_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABQklEQVR4nO2UP0tCURjGnwOh" +
		"lINSGpRZEjjVUENTn6CWWoKc2mpra6qxpra2mnIybKipPkFTVA41CWGZBUmhg4US2HPuRfpzrn/OQcHBH9z3Pi+Xe393eM8r/FeJEwgsog2ICg6F/zpRYW4" +
		"bXUFDHAXR/jD2xmaw+3LHDtgYmmBV+f18/eES8fc0/uMoyE0vsQIHrynrpZ3gFDuVzWzS+pnVwQg7IHBzzPqXuoLCVxn7uRRTbdYCEXh7XEwGAl06U7Byf4Gzw" +
		"jOTyrx3GLHxWSYbI8FjqYhMucikEnJ5MOr2MNkYCeTHM6UPJpWQu8+SVDESbD0la06SnKDtkZ8RNhLoYCQ4z2dx+5lnUpns9WHOF2SyMRLE39I44ml2YpmnODo" +
		"QRhUjgQ5NC+R+kctOB61l10q6goZIwSnvC7xajoCIfQOxQqhkUqjuTQAAAABJRU5ErkJggg=="
)

type TenantApplication struct {
	tenantApplicationRepo tenant_application_driven.TenantApplicationRepo
	ccDriven              configuration_center.Driven
	ccSelfDriven          ccSelfDriven.Call
	userDomain            user.IUser
	wf                    wf_go.WorkflowInterface
	wfRest                workflow.WorkflowInterface
	dataCatalogDriven     data_catalog.Driven
	data                  *db.Data
}

func NewTenantApplication(tenantApplication tenant_application_driven.TenantApplicationRepo,
	ccDriven configuration_center.Driven,
	ccSelfDriven ccSelfDriven.Call,
	userDomain user.IUser,
	wf wf_go.WorkflowInterface,
	wfRest workflow.WorkflowInterface,
	dataCatalogDriven data_catalog.Driven,
	data *db.Data,
) domain.TenantApplication {
	d := &TenantApplication{tenantApplicationRepo: tenantApplication,
		ccDriven:          ccDriven,
		ccSelfDriven:      ccSelfDriven,
		userDomain:        userDomain,
		wf:                wf,
		wfRest:            wfRest,
		dataCatalogDriven: dataCatalogDriven,
		data:              data,
	}
	wf.RegistConusmeHandlers(workflow.AF_TASKS_DATA_PROCESSING_TENANT_APPLICATION,
		d.TenantApplicationAuditProcessMsgProc,
		d.TenantApplicationAuditResultMsgProc,
		nil)
	return d
}

func GenAuditApplyID(ID uint64, auditRecID uint64) string {
	return fmt.Sprintf("%d-%d", ID, auditRecID)
}

func (t *TenantApplication) Create(ctx context.Context, req *domain.TenantApplicationCreateReq, userId, userName string) (*domain.IDResp, error) {
	var (
		err            error
		bIsAuditNeeded bool
		codes          []string
	)

	//  检查同名冲突
	err = t.CheckNameRepeat(ctx, &domain.TenantApplicationNameRepeatReq{Name: req.ApplicationName, Id: userId})
	if err != nil {
		return nil, err
	}

	uniqueID, err := utilities.GetUniqueID()
	if err != nil {
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}
	tenantApplication := req.ToModel(userId, uniqueID)
	aStatus := domain.TN_AUDIT_STATUS_NONE
	tenantApplication.AuditStatus = &aStatus

	if codes, err = t.ccSelfDriven.GenUniformCode(ctx, settings.ConfigInstance.DepServices.TenantApplicationCodeRuleID, 1); err != nil {
		log.WithContext(ctx).Errorf("get tenant application code failed: %v", err)
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	tenantApplication.ApplicationCode = codes[0]

	if req.SubmitType == domain.T_SUBMIT {

		uniqueID := tenantApplication.TenantApplicationID

		if *tenantApplication.AuditStatus != domain.TN_AUDIT_STATUS_PASS {
			auditBindInfo, err := t.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_TASKS_DATA_PROCESSING_TENANT_APPLICATION})
			if err != nil {
				return nil, err
			}
			if len(auditBindInfo.ID) > 0 && auditBindInfo.ProcDefKey != "" {
				bIsAuditNeeded = true
			}

			if bIsAuditNeeded {
				var auditRecID uint64
				auditRecID, err = utilities.GetUniqueID()
				if err != nil {
					return nil, errorcode.Detail(errorcode.InternalError, err)
				}
				applyID := GenAuditApplyID(uniqueID, auditRecID)
				msg := &wf_common.AuditApplyMsg{
					Process: wf_common.AuditApplyProcessInfo{
						ApplyID:    applyID,
						AuditType:  workflow.AF_TASKS_DATA_PROCESSING_TENANT_APPLICATION,
						UserID:     userId,
						UserName:   userName,
						ProcDefKey: auditBindInfo.ProcDefKey,
					},
					Data: map[string]any{
						"id":          tenantApplication.ID,
						"title":       req.ApplicationName,
						"submit_time": time.Now().UnixMilli(),
					},
					Workflow: wf_common.AuditApplyWorkflowInfo{
						TopCsf: 5,
						AbstractInfo: wf_common.AuditApplyAbstractInfo{
							Icon: AUDIT_ICON_BASE64,
							Text: "租户申请名称：" + req.ApplicationName + "_" + tenantApplication.ApplicationCode,
						},
					},
				}

				if err := t.wf.AuditApply(msg); err != nil {
					log.WithContext(ctx).Errorf("send start audit instance message error %v", err)
					return nil, errorcode.Detail(errorcode.InternalError, err)
				}
				//modelPlan.AuditStatus = &domain_plan.Auditing //审核中
				//modelPlan.AuditID = &auditRecID

				//tenantApplication.ApplicationCode = applyID
				aStatus = domain.TN_AUDIT_STATUS_AUDITING
				tenantApplication.AuditStatus = &aStatus
				tenantApplication.AuditID = &auditRecID
			} else {
				aStatus = domain.TN_AUDIT_STATUS_PASS
				tenantApplication.AuditStatus = &aStatus

				tStatus := domain.DARA_STATUS_PENDING_ACTIVATION
				tenantApplication.Status = tStatus
			}

		}

	}

	tx := t.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)
	if err = t.tenantApplicationRepo.Create(tx, ctx, tenantApplication); err != nil {
		tx.Rollback()
		log.WithContext(ctx).Errorf("t.tenantApplicationRepo.Create failed: %v", err)
		panic(errorcode.Detail(errorcode.PublicDatabaseError, err))
	}
	//	err = t.tenantApplicationRepo.Create(ctx, tenantApplication)
	//if err != nil {
	//	return nil, err
	//}

	var tenantApplicationDatabaseAccount []*model.TcTenantAppDbAccount
	var tenantApplicationDataResource []*model.TcTenantAppDbDataResource
	if req.DatabaseAccountList == nil {
		req.DatabaseAccountList = []*domain.TenantApplicationDatabaseAccountItem{}
	}
	for _, item := range req.DatabaseAccountList {
		dbAccountUniqueID, _ := utilities.GetUniqueID()

		modelItem := model.TcTenantAppDbAccount{
			DatabaseAccountID:   dbAccountUniqueID,
			ID:                  uuid.NewString(),
			TenantApplicationID: tenantApplication.ID,
			DatabaseType:        item.DatabaseType,
			DatabaseName:        item.DatabaseName,

			TenantAccount:            item.TenantAccount,
			TenantPasswd:             item.TenantPasswd,
			ProjectName:              item.ProjectName,
			ActualAllocatedResources: item.ActualAllocatedResources,
			UserAuthenticationHadoop: item.UserAuthenticationHadoop,
			UserAuthenticationHive:   item.UserAuthenticationHive,
			UserAuthenticationHbase:  item.UserAuthenticationHbase,

			CreatedByUID: userId,
			UpdatedByUID: userId,
		}
		tenantApplicationDatabaseAccount = append(tenantApplicationDatabaseAccount, &modelItem)

		if item.DataResourceList == nil {
			item.DataResourceList = []*domain.TenantApplicationDataResourceItem{}
		}
		for _, subItem := range item.DataResourceList {
			dResourceUniqueID, _ := utilities.GetUniqueID()
			subResourceItem := model.TcTenantAppDbDataResource{
				DataResourceID:      dResourceUniqueID,
				ID:                  uuid.NewString(),
				TenantApplicationID: tenantApplication.ID,
				DatabaseAccountID:   modelItem.ID,
				DataCatalogID:       subItem.DataCatalogId,
				DataCatalogName:     subItem.DataCatalogName,
				DataCatalogCode:     subItem.DataCatalogCode,
				MountResourceID:     subItem.MountResourceId,
				MountResourceName:   subItem.MountResourceName,
				MountResourceCode:   subItem.MountResourceCode,
				DataSourceID:        subItem.DataSourceId,
				DataSourceName:      subItem.DataSourceName,
				ApplyPermission:     strings.Join(subItem.ApplyPermission, ","),
				ApplyPurpose:        subItem.ApplyPurpose,
				CreatedByUID:        userId,
				UpdatedByUID:        userId,
			}
			tenantApplicationDataResource = append(tenantApplicationDataResource, &subResourceItem)
		}
	}

	if len(tenantApplicationDatabaseAccount) > 0 {
		if err = t.tenantApplicationRepo.BatchCreateDatabaseAccount(tx, ctx, tenantApplicationDatabaseAccount); err != nil {
			tx.Rollback()
			log.WithContext(ctx).Errorf("t.BatchCreateDatabaseAccount.Create failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}
	//err = t.tenantApplicationRepo.BatchCreateDatabaseAccount(ctx, tenantApplicationDatabaseAccount)
	//if err != nil {
	//	return nil, err
	//}
	if len(tenantApplicationDataResource) > 0 {
		if err = t.tenantApplicationRepo.BatchCreateDataResource(tx, ctx, tenantApplicationDataResource); err != nil {
			tx.Rollback()
			log.WithContext(ctx).Errorf("t.BatchCreateDataResource.Create failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}
	//err = t.tenantApplicationRepo.BatchCreateDataResource(ctx, tenantApplicationDataResource)
	//if err != nil {
	//	return nil, err
	//}

	return &domain.IDResp{UUID: tenantApplication.ID}, nil

}

func (t *TenantApplication) Update(ctx context.Context, req *domain.TenantApplicationUpdateReq, id, userId, userName string) (*domain.IDResp, error) {
	var (
		err error

		bIsAuditNeeded bool

		nameResp *domain.TenantApplicationNameRepeatReqResp
	)
	//  检查同名冲突
	nameResp, err = t.CheckNameRepeatV2(ctx, &domain.TenantApplicationNameRepeatReq{Name: req.ApplicationName, Id: id})
	if err != nil {
		return nil, err
	}

	if nameResp.IsRepeated == true {
		return nil, errorcode.Desc(errorcode.TenantApplicationNameRepeatError)
	}

	//  检查是否存在
	tenantApplication, err := t.tenantApplicationRepo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}
	//审核中不可编辑
	if tenantApplication.AuditStatus != nil && (*tenantApplication.AuditStatus == domain.AuditStatusAuditing.Integer.Int32()) {
		return nil, errorcode.Desc(errorcode.ReportEditError)
	}

	tenantApplicationU := req.ToModel(userId)
	tenantApplicationU.ID = id

	if req.SubmitType == domain.T_SUBMIT {

		auditBindInfo, err := t.ccDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_TASKS_DATA_PROCESSING_TENANT_APPLICATION})
		if err != nil {
			return nil, err
		}
		if len(auditBindInfo.ID) > 0 && auditBindInfo.ProcDefKey != "" {
			bIsAuditNeeded = true
		}
		//fmt.Println(bIsAuditNeeded, auditBindInfo.ID, "=========")
		if bIsAuditNeeded {
			var auditRecID uint64
			auditRecID, err = utilities.GetUniqueID()
			if err != nil {
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}

			applyID := GenAuditApplyID(tenantApplication.TenantApplicationID, auditRecID)
			msg := &wf_common.AuditApplyMsg{
				Process: wf_common.AuditApplyProcessInfo{
					ApplyID:    applyID,
					AuditType:  workflow.AF_TASKS_DATA_PROCESSING_TENANT_APPLICATION,
					UserID:     userId,
					UserName:   userName,
					ProcDefKey: auditBindInfo.ProcDefKey,
				},
				Data: map[string]any{
					"id":          tenantApplication.ID,
					"title":       req.ApplicationName,
					"submit_time": time.Now().UnixMilli(),
				},
				Workflow: wf_common.AuditApplyWorkflowInfo{
					TopCsf: 5,
					AbstractInfo: wf_common.AuditApplyAbstractInfo{
						Icon: AUDIT_ICON_BASE64,
						Text: "租户申请名称：" + req.ApplicationName + "_" + tenantApplication.ApplicationCode,
					},
				},
			}

			if err := t.wf.AuditApply(msg); err != nil {
				log.WithContext(ctx).Errorf("send start audit instance message error %v", err)
				return nil, errorcode.Detail(errorcode.InternalError, err)
			}
			//modelPlan.AuditStatus = &domain_plan.Auditing //审核中
			//modelPlan.AuditID = &auditRecID

			aStatus := domain.TN_AUDIT_STATUS_AUDITING
			tenantApplicationU.AuditStatus = &aStatus
			tenantApplicationU.AuditID = &auditRecID
		} else {
			aStatus := domain.TN_AUDIT_STATUS_PASS
			tenantApplicationU.AuditStatus = &aStatus

			tStatus := domain.DARA_STATUS_PENDING_ACTIVATION
			tenantApplicationU.Status = tStatus
		}

	}

	tx := t.data.DB.WithContext(ctx).Begin()
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
			tx.Rollback()
		} else if e = tx.Commit().Error; e != nil {
			*err = errorcode.Detail(errorcode.PublicDatabaseError, e)
			tx.Rollback()
		}
	}(&err)

	// 更新基础信息
	err = t.tenantApplicationRepo.Update(tx, ctx, tenantApplicationU)
	if err != nil {
		//tx.Rollback()
		return nil, err
	}

	// 新增的数据库账号
	var accountList []*model.TcTenantAppDbAccount

	// 新增的数据资源
	var resourceList []*model.TcTenantAppDbDataResource

	for _, item := range req.DatabaseAccountList {
		dbAccountUniqueID, _ := utilities.GetUniqueID()

		modelItem := model.TcTenantAppDbAccount{
			DatabaseAccountID:   dbAccountUniqueID,
			ID:                  uuid.NewString(),
			TenantApplicationID: tenantApplication.ID,
			DatabaseType:        item.DatabaseType,
			DatabaseName:        item.DatabaseName,

			TenantAccount:            item.TenantAccount,
			TenantPasswd:             item.TenantPasswd,
			ProjectName:              item.ProjectName,
			ActualAllocatedResources: item.ActualAllocatedResources,
			UserAuthenticationHadoop: item.UserAuthenticationHadoop,
			UserAuthenticationHive:   item.UserAuthenticationHive,
			UserAuthenticationHbase:  item.UserAuthenticationHbase,
			CreatedByUID:             userId,
			UpdatedByUID:             userId,
		}
		accountList = append(accountList, &modelItem)

		for _, subItem := range item.DataResourceList {
			dResourceUniqueID, _ := utilities.GetUniqueID()
			subResourceItem := model.TcTenantAppDbDataResource{
				DataResourceID:      dResourceUniqueID,
				ID:                  uuid.NewString(),
				TenantApplicationID: tenantApplication.ID,
				DatabaseAccountID:   modelItem.ID,
				DataCatalogID:       subItem.DataCatalogId,
				DataCatalogName:     subItem.DataCatalogName,
				DataCatalogCode:     subItem.DataCatalogCode,
				MountResourceID:     subItem.MountResourceId,
				MountResourceName:   subItem.MountResourceName,
				MountResourceCode:   subItem.MountResourceCode,
				DataSourceID:        subItem.DataSourceId,
				DataSourceName:      subItem.DataSourceName,
				ApplyPermission:     strings.Join(subItem.ApplyPermission, ","),
				ApplyPurpose:        subItem.ApplyPurpose,
				CreatedByUID:        userId,
				UpdatedByUID:        userId,
			}
			resourceList = append(resourceList, &subResourceItem)
		}
	}

	// 删除已有数据
	if err = t.tenantApplicationRepo.DeleteDatabaseAccountByTenantApplyId(tx, ctx, id); err != nil {
		log.WithContext(ctx).Errorf("uc.aoItemRepo.DeleteByDataAnalReqID failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if err = t.tenantApplicationRepo.DeleteDataResourceByTenantApplyId(tx, ctx, id); err != nil {
		log.WithContext(ctx).Errorf("uc.aoItemCatalogRepo.DeleteByDataAnalReqID failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(accountList) > 0 {
		err = t.tenantApplicationRepo.BatchCreateDatabaseAccount(tx, ctx, accountList)

		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	if len(resourceList) > 0 {
		err = t.tenantApplicationRepo.BatchCreateDataResource(tx, ctx, resourceList)

		if err != nil {
			tx.Rollback()
			return nil, err
		}
	}

	resp := domain.IDResp{id}
	return &resp, nil
}
func (d *TenantApplication) CheckNameRepeat(ctx context.Context, req *domain.TenantApplicationNameRepeatReq) error {
	exist, err := d.tenantApplicationRepo.CheckNameRepeat(ctx, req.Id, req.Name)
	if err != nil {
		return errorcode.Detail(errorcode.TenantApplicationDatabaseError, err.Error())
	}
	if exist {
		return errorcode.Desc(errorcode.TenantApplicationNameRepeatError)
	}
	return nil
}

func (d *TenantApplication) CheckNameRepeatV2(ctx context.Context, req *domain.TenantApplicationNameRepeatReq) (*domain.TenantApplicationNameRepeatReqResp, error) {
	exist, err := d.tenantApplicationRepo.CheckNameRepeat(ctx, req.Id, req.Name)
	if err != nil {
		return nil, errorcode.Detail(errorcode.TenantApplicationDatabaseError, err.Error())
	}
	resp := domain.TenantApplicationNameRepeatReqResp{
		IsRepeated: false,
	}
	if exist {
		resp.IsRepeated = true
	}
	return &resp, nil
}

func (d *TenantApplication) Delete(ctx context.Context, id string) error {
	var (
		err error
	)
	//  检查是否存在
	tenant, err := d.tenantApplicationRepo.GetById(ctx, id)
	if err != nil {
		return err
	}

	// 审核处于审核中的(撤回的,拒绝,驳回的可以删除), 状态为已经申报的,不可以删除
	if tenant.AuditStatus != nil && *tenant.AuditStatus == domain.AuditStatusReject.Integer.Int32() {
		return errorcode.Desc(errorcode.TenantApplicationDeleteError)
	}

	err = d.tenantApplicationRepo.Delete(ctx, id)
	if err != nil {
		return err
	}
	// 删除变更审核
	//_ = d.dataResearchReportRepo.DeleteChangeAudit(ctx, id)
	return nil
}
func (t *TenantApplication) GetDetails(ctx context.Context, id string) (*domain.TenantApplicationDetailResp, error) {
	var (
		err error
	)
	entity, err := t.tenantApplicationRepo.GetById(ctx, id)

	if err != nil {
		return nil, err
	}
	adminUserInfo, err := t.userDomain.GetByUserId(ctx, entity.TenantAdminID)

	businessUnitName := ""
	if entity.BusinessUnitID != "" {
		departmentInfo, err := t.ccDriven.GetDepartmentPrecision(ctx, []string{entity.BusinessUnitID})
		if err != nil {
			return nil, err
		}
		if len(departmentInfo.Departments) == 0 {
			return nil, errorcode.Detail(errorcode.InternalError, "部门信息为空")
		}
		businessUnitName = departmentInfo.Departments[0].Name
	}

	userInfo, err := t.userDomain.GetByUserId(ctx, entity.BusinessUnitContactorID)
	appliedByUid, err := t.userDomain.GetByUserId(ctx, entity.CreatedByUID)

	resp := &domain.TenantApplicationDetailResp{
		ID:                           id,
		ApplicationName:              entity.ApplicationName,
		ApplicationCode:              entity.ApplicationCode,
		TenantName:                   entity.TenantName,
		TenantAdminID:                entity.TenantAdminID,
		TenantAdminName:              adminUserInfo.Name,
		BusinessUnitID:               entity.BusinessUnitID,
		BusinessUnitName:             businessUnitName,
		BusinessUnitContactorID:      entity.BusinessUnitContactorID,
		BusinessUnitContactorName:    userInfo.Name,
		BusinessUnitPhone:            entity.BusinessUnitPhone,
		BusinessUnitEmail:            entity.BusinessUnitEmail,
		BusinessUnitFax:              &entity.BusinessUnitFax,
		MaintenanceUnitID:            entity.MaintenanceUnitID,
		MaintenanceUnitName:          entity.MaintenanceUnitName,
		MaintenanceUnitContactorID:   entity.MaintenanceUnitContactorID,
		MaintenanceUnitContactorName: entity.MaintenanceUnitContactorName,
		MaintenanceUnitPhone:         entity.MaintenanceUnitPhone,
		MaintenanceUnitEmail:         entity.MaintenanceUnitEmail,
		AppliedByUid:                 entity.CreatedByUID,
		AppliedByName:                appliedByUid.Name,
		Status:                       domain.SAAStatus2Str(entity.Status),
	}

	resp.DatabaseAccountList = []*domain.TenantApplicationDatabaseAccountDetails{}

	entityAccount, err := t.tenantApplicationRepo.GetDatabaseAccountList(ctx, id)

	for _, item := range entityAccount {
		accountItem := domain.TenantApplicationDatabaseAccountDetails{
			DatabaseAccountId:        item.ID,
			DatabaseType:             item.DatabaseType,
			DatabaseName:             item.DatabaseName,
			TenantAccount:            item.TenantAccount,
			TenantPasswd:             item.TenantPasswd,
			ProjectName:              item.ProjectName,
			ActualAllocatedResources: item.ActualAllocatedResources,
			UserAuthenticationHadoop: item.UserAuthenticationHadoop,
			UserAuthenticationHive:   item.UserAuthenticationHive,
			UserAuthenticationHbase:  item.UserAuthenticationHbase,
		}

		entityDataResource, err := t.tenantApplicationRepo.GetDataResourceList(ctx, item.ID)
		if err != nil {
			return nil, err
		}

		for _, subItem := range entityDataResource {
			dResourceItem := domain.TenantApplicationDataResourceDetails{
				DataResourceItemId:      subItem.ID,
				DataCatalogId:           subItem.DataCatalogID,
				DataCatalogName:         subItem.DataCatalogName,
				DataCatalogOnlineStatus: domain.T_DATACATALOG_ONLINE_STATUS_ONLINE,
				DataCatalogCode:         subItem.DataCatalogCode,
				MountResourceId:         subItem.MountResourceID,
				MountResourceName:       subItem.MountResourceName,
				MountResourceCode:       subItem.MountResourceCode,
				DataSourceId:            subItem.DataSourceID,
				DataSourceName:          subItem.DataSourceName,
				ApplyPermission:         strings.Split(subItem.ApplyPermission, ","),
				ApplyPurpose:            subItem.ApplyPurpose,
				Status:                  domain.T_RESROUCE_NORMAL_STATUS,
			}
			var dataInfo *data_catalog.GetDataCatalogDetailResp
			dataInfo, err = t.dataCatalogDriven.GetDataCatalogDetail(ctx, dResourceItem.DataCatalogId)
			if err != nil {
				//formattedErr := fmt.Sprintf("%v", err)
				//result1 := strings.Contains(formattedErr, "数据资源目录不存在")
				//if result1 {
				//	dResourceItem.Status = domain.T_RESROUCE_DELETE_STATUS
				//} else {
				//	continue
				//}
				continue

			} else {
				if dataInfo.OnlineStatus == domain.T_DATACATALOG_ONLINE_STATUS_UN_AUDITING || dataInfo.OnlineStatus == domain.T_DATACATALOG_ONLINE_STATUS_OFFLINE || dataInfo.OnlineStatus == domain.T_DATACATALOG_ONLINE_STATUS_UP_REJECT {
					dResourceItem.DataCatalogOnlineStatus = domain.T_DATACATALOG_ONLINE_STATUS_OFFLINE
				}
			}

			//if dataInfo.OnlineStatus != "online" && dataInfo.OnlineStatus != "down-auditing" && dataInfo.OnlineStatus != "down-reject" {
			//	dResourceItem.DataCatalogOnlineStatus = "offline"
			//}
			accountItem.DataResourceList = append(accountItem.DataResourceList, &dResourceItem)
		}

		resp.DatabaseAccountList = append(resp.DatabaseAccountList, &accountItem)

	}

	return resp, nil
}
func (d *TenantApplication) GetByWorkOrderId(ctx context.Context, id string) (*domain.TenantApplicationDetailResp, error) {
	resp := domain.TenantApplicationDetailResp{}
	return &resp, nil
}

func (t *TenantApplication) GetList(ctx context.Context, req *domain.TenantApplicationListReq, userId string) (*domain.TenantApplicationListResp, error) {
	var (
		err            error
		departmentList *configuration_center.QueryPageReapParam
	)

	pMap := domain.TenantApplicationListParams2Map(req)

	// 部门筛选，获取子部门下的申请
	if req.ApplyDepartmentId != nil {
		nReq := configuration_center.QueryPageReqParam{
			ID:     *req.ApplyDepartmentId,
			Limit:  0,
			Offset: 1,
		}
		if departmentList, err = t.ccDriven.GetDepartmentList(ctx, nReq); err != nil {
			return nil, err
		}

		paramDepartmentList := []string{*req.ApplyDepartmentId}

		for _, department := range departmentList.Entries {

			paramDepartmentList = append(paramDepartmentList, department.ID)
		}

		pMap["business_unit_id"] = paramDepartmentList

	}

	count, tenantApplicationList, err := t.tenantApplicationRepo.List(ctx, pMap, userId)

	if err != nil {
		return nil, err
	}

	result := make([]*domain.TenantApplicationObject, 0, len(tenantApplicationList))
	for _, apply := range tenantApplicationList {
		appliedByUid, err := t.userDomain.GetByUserId(ctx, apply.CreatedByUID)
		if err != nil {
			return nil, err
		}
		item := domain.TenantApplicationObject{
			TenantApplicationObjectItem: domain.TenantApplicationObjectItem{
				ID:              apply.ID,
				ApplicationName: apply.ApplicationName,
				AppliedAt:       apply.UpdatedAt.UnixMilli(),
				AppliedByUid:    apply.CreatedByUID,
				AppliedByName:   appliedByUid.Name,
			},
			Status: domain.SAAStatus2Str(apply.Status)}

		if apply.ApplicationCode != "" {
			item.ApplicationCode = apply.ApplicationCode

		}

		if apply.TenantName != "" {
			item.TenantName = apply.TenantName
		}

		if apply.BusinessUnitContactorID != "" {
			item.ContactorId = apply.BusinessUnitContactorID
			item.ContactorName = t.userDomain.GetNameByUserId(ctx, item.ContactorId)
		}

		if apply.BusinessUnitPhone != "" {
			item.ContactorPhone = apply.BusinessUnitPhone
		}

		if apply.BusinessUnitID != "" {
			departmentInfo, err := t.ccDriven.GetDepartmentPrecision(ctx, []string{apply.BusinessUnitID})
			if err != nil {
				return nil, err
			}
			if len(departmentInfo.Departments) == 0 {
				return nil, errorcode.Detail(errorcode.InternalError, "部门信息为空")
			}

			item.DepartmentId = apply.BusinessUnitID
			item.DepartmentName = departmentInfo.Departments[0].Name
			item.DepartmentPath = departmentInfo.Departments[0].Path

		}

		if apply.AuditStatus != nil {
			item.AuditStatus = domain.TAEnum2AuditStatus(*apply.AuditStatus)
		}

		if apply.RejectReason != "" {
			item.RejectReason = apply.RejectReason
		}

		if apply.CancelReason != "" {
			item.CancelReason = apply.CancelReason
		}

		result = append(result, &item)
	}
	return &domain.TenantApplicationListResp{PageResult: domain.PageResult[domain.TenantApplicationObject]{
		Entries:    result,
		TotalCount: count,
	}}, nil
}

func (t *TenantApplication) UpdateTenantApplicationStatus(ctx context.Context, req *domain.UpdateTenantApplicationStatusReq, id, userId string) (*domain.IDResp, error) {
	tenantApplication, err := t.tenantApplicationRepo.GetById(ctx, id)
	if err != nil {
		return nil, err
	}

	//审核中不可编辑
	if tenantApplication.AuditStatus != nil && (*tenantApplication.AuditStatus == domain.AuditStatusAuditing.Integer.Int32()) {
		//return nil, errorcode.Desc(errorcode.ReportEditError)
		fmt.Println("undo")
	}
	tenantApplicationU := model.TcTenantApp{
		ID:           id,
		UpdatedByUID: userId,
		Status:       domain.SAAStatus2Enum(req.Status),
	}

	// 更新基础信息
	err = t.tenantApplicationRepo.Update(nil, ctx, &tenantApplicationU)
	if err != nil {
		return nil, err
	}
	resp := domain.IDResp{id}
	return &resp, nil
}

func ParseAuditApplyID(auditApplyID string) (uint64, uint64, error) {
	strs := strings.Split(auditApplyID, "-")
	if len(strs) != 2 {
		return 0, 0, errors.New("audit apply id format invalid")
	}

	var auditID uint64
	ID, err := strconv.ParseUint(strs[0], 10, 64)
	if err == nil {
		auditID, err = strconv.ParseUint(strs[1], 10, 64)
	}
	return ID, auditID, err
}
