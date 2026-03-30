package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	wf_rest "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	wf "github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"

	//data_resource_catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog/impl"
	"encoding/json"
	"fmt"
	"math"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/open_catalog"
	data_resource_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	open_catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/open_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"go.uber.org/zap"
)

type OpenCatalogDomain struct {
	configurationCenterDriven configuration_center.Driven
	openCatalogRepo           open_catalog_repo.OpenCatalogRepo
	catalogRepo               catalog_repo.DataResourceCatalogRepo
	wf                        wf.WorkflowInterface
	workflowDriven            wf_rest.DocAuditDriven
	dataSubjectDriven         data_subject.Driven
	dataResourceRepo          data_resource_repo.DataResourceRepo
}

func NewOpenCatalogDomain(
	configurationCenterDriven configuration_center.Driven,
	openCatalogRepo open_catalog_repo.OpenCatalogRepo,
	catalogRepo catalog_repo.DataResourceCatalogRepo,
	wf wf.WorkflowInterface,
	workflowDriven wf_rest.DocAuditDriven,
	dataSubjectDriven data_subject.Driven,
	dataResourceRepo data_resource_repo.DataResourceRepo,
) open_catalog.OpenCatalogDomain {
	dc := &OpenCatalogDomain{
		configurationCenterDriven: configurationCenterDriven,
		openCatalogRepo:           openCatalogRepo,
		catalogRepo:               catalogRepo,
		wf:                        wf,
		workflowDriven:            workflowDriven,
		dataSubjectDriven:         dataSubjectDriven,
		dataResourceRepo:          dataResourceRepo,
	}
	dc.wf.RegistConusmeHandlers(common.WORKFLOW_AUDIT_TYPE_CATALOG_OPEN,
		dc.AuditProcessMsgProc,
		common.HandlerFunc[wf_common.AuditResultMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_OPEN, dc.AuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](common.WORKFLOW_AUDIT_TYPE_CATALOG_OPEN, dc.AuditProcessDelMsgProc))
	return dc
}

func (d *OpenCatalogDomain) GetOpenableCatalogList(ctx context.Context, req *open_catalog.GetOpenableCatalogListReq) (*open_catalog.DataCatalogRes, error) {
	totalCount, catalogs, err := d.openCatalogRepo.GetOpenableCatalogList(ctx, req)
	if err != nil {
		return nil, err
	}
	res := make([]*open_catalog.DataCatalog, len(catalogs))
	for i, catalog := range catalogs {
		res[i] = &open_catalog.DataCatalog{
			ID:   strconv.FormatUint(catalog.ID, 10),
			Name: catalog.Title,
			Code: catalog.Code,
		}
	}
	return &open_catalog.DataCatalogRes{
		Entries:    res,
		TotalCount: totalCount,
	}, nil
}

func (d *OpenCatalogDomain) CreateOpenCatalog(ctx context.Context, req *open_catalog.CreateOpenCatalogReq) (resp *open_catalog.CreateOpenCatalogRes, err error) {
	resp = &open_catalog.CreateOpenCatalogRes{
		Success: make([]*open_catalog.CatalogInfo, 0),
		Failed:  make([]*open_catalog.CatalogInfo, 0),
	}
	for _, catalogId := range req.CatalogIDs {
		//判断是否存在数据目录记录
		catalog, err := d.catalogRepo.Get(ctx, catalogId.Uint64())
		if err != nil {
			resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: ""})
			continue
		}
		//判断是否存在开放记录
		openCatalog, err := d.openCatalogRepo.GetByCatalogId(ctx, catalogId.Uint64())
		if err != nil {
			log.WithContext(ctx).Errorf("%s", err)
			resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
			continue
		}
		if openCatalog.ID > 0 {
			log.WithContext(ctx).Errorf("The data catalog (%s) has been added to the open catalog.", catalogId)
			resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
			continue
		}
		//只有已上线和允许开放的编目的数据资源目录才能添加开放目录
		if catalog.OnlineStatus != constant.LineStatusOnLine || catalog.OpenType == 3 {
			log.WithContext(ctx).Errorf("audit apply (type: %s) not allowed", constant.AuditTypeOpen)
			resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
			continue
		}

		//检查是否有绑定的审核流程
		process, err := d.configurationCenterDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: constant.AuditTypeOpen})
		if err != nil {
			log.WithContext(ctx).Errorf("failed to check audit process info (type: %s), err: %v", constant.AuditTypeOpen, err)
			resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
			continue
		}
		isAuditProcessExist := util.CE(process.ProcDefKey != "", true, false).(bool)

		//开放目录记录
		t := time.Now()
		openCatalogModel := &model.TOpenCatalog{}
		openCatalogID, err := utils.GetUniqueID()
		if err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
			continue
		}
		openCatalogModel.ID = openCatalogID
		openCatalogModel.CatalogID = catalogId.Uint64()
		openCatalogModel.OpenType = req.OpenType
		if req.OpenType == 2 {
			openCatalogModel.OpenLevel = req.OpenLevel
		}
		if !isAuditProcessExist {
			openCatalogModel.OpenStatus = constant.OpenStatusOpened
			openCatalogModel.OpenAt = &t
			openCatalogModel.AuditState = constant.AuditStatusPass
		} else {
			openCatalogModel.OpenStatus = constant.OpenStatusNotOpen
			openCatalogModel.AuditState = constant.AuditStatusAuditing
			openCatalogModel.ProcDefKey = process.ProcDefKey
			openCatalogModel.AuditApplySN, err = utils.GetUniqueID()
			if err != nil {
				log.Errorf("failed to general unique id, err: %v", err)
				resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
				continue
			}
		}
		userInfo := request.GetUserInfo(ctx)
		openCatalogModel.CreatorUID = userInfo.ID
		openCatalogModel.CreatedAt = t
		openCatalogModel.UpdaterUID = userInfo.ID
		openCatalogModel.UpdatedAt = t

		err = d.openCatalogRepo.Create(ctx, openCatalogModel)
		if err != nil {
			log.Errorf("%s", err)
			resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
			continue
		}

		if isAuditProcessExist {
			//提交开放目录申请
			msg := &wf_common.AuditApplyMsg{}
			msg.Process.ApplyID = common.GenAuditApplyID(openCatalogModel.ID, openCatalogModel.AuditApplySN)
			msg.Process.AuditType = process.AuditType
			msg.Process.UserID = userInfo.ID
			msg.Process.UserName = userInfo.Name
			msg.Process.ProcDefKey = process.ProcDefKey
			msg.Data = map[string]any{
				"id":             fmt.Sprint(openCatalogModel.ID),
				"catalog_id":     fmt.Sprint(catalog.ID),
				"code":           catalog.Code,
				"title":          catalog.Title,
				"submitter":      userInfo.ID,
				"submit_time":    t.UnixMilli(),
				"submitter_name": userInfo.Name,
			}
			msg.Workflow.TopCsf = 5
			msg.Workflow.AbstractInfo.Icon = common.AUDIT_ICON_BASE64
			msg.Workflow.AbstractInfo.Text = catalog.Title + "(" + msg.Process.ApplyID + ")"
			err = d.wf.AuditApply(msg)
			if err != nil {
				log.Errorf("%s", err)
				resp.Failed = append(resp.Failed, &open_catalog.CatalogInfo{Id: catalogId.String(), Name: catalog.Title})
				continue
			}
		}
		resp.Success = append(resp.Success, &open_catalog.CatalogInfo{Id: strconv.FormatUint(openCatalogID, 10), Name: catalog.Title})
	}

	return resp, nil
}

func (d *OpenCatalogDomain) GetOpenCatalogList(ctx context.Context, req *open_catalog.GetOpenCatalogListReq) (*open_catalog.OpenCatalogRes, error) {
	if req.SourceDepartmentID != "" && req.SourceDepartmentID != constant.UnallocatedId {
		req.SubDepartmentIDs = []string{req.SourceDepartmentID}
		departmentList, err := d.configurationCenterDriven.GetChildDepartments(ctx, req.SourceDepartmentID)
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			util.SliceAdd(&req.SubDepartmentIDs, entry.ID)
		}
	}
	totalCount, catalogs, err := d.openCatalogRepo.GetOpenCatalogList(ctx, req)
	if err != nil {
		return nil, err
	}
	departIds := make([]string, 0)
	catalogIds := make([]uint64, len(catalogs))
	for i, catalog := range catalogs {
		departIds = append(departIds, catalog.SourceDepartmentId)
		catalogIds[i] = catalog.ID
	}
	/*//赋值挂载数据资源
	dataResources, err := d.dataResourceRepo.GetByCatalogIds(ctx, catalogIds...)
	if err != nil {
		return nil, err
	}
	resourceMap := data_resource_catalog.GenResourceMap(dataResources)*/

	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}
	res := make([]*open_catalog.OpenCatalog, len(catalogs))
	for i, catalog := range catalogs {
		res[i] = &open_catalog.OpenCatalog{
			ID:           strconv.FormatUint(catalog.ID, 10),
			CatalogID:    strconv.FormatUint(catalog.CatalogID, 10),
			Name:         catalog.Title,
			Code:         catalog.Code,
			OpenStatus:   catalog.OpenStatus,
			OnlineStatus: catalog.OnlineStatus,
			Resource: []*data_resource_catalog.Resource{
				{
					ResourceType:  constant.MountView,
					ResourceCount: catalog.ViewCount,
				},
				{
					ResourceType:  constant.MountAPI,
					ResourceCount: catalog.ApiCount,
				},
				{
					ResourceType:  constant.MountFile,
					ResourceCount: catalog.FileCount,
				},
			},
			SourceDepartment:     departmentNameMap[catalog.SourceDepartmentId],
			SourceDepartmentPath: departmentPathMap[catalog.SourceDepartmentId],
			UpdatedAt:            catalog.UpdatedAt.UnixMilli(),
			AuditState:           catalog.AuditState,
			AuditAdvice:          catalog.AuditAdvice,
		}
	}
	return &open_catalog.OpenCatalogRes{
		Entries:    res,
		TotalCount: totalCount,
	}, nil
}
func (d *OpenCatalogDomain) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		return nameMap, pathMap, err
	}

	for _, departmentInfo := range departmentInfos.Departments {
		nameMap[departmentInfo.ID] = ""
		pathMap[departmentInfo.ID] = ""
		if departmentInfo.DeletedAt == 0 {
			nameMap[departmentInfo.ID] = departmentInfo.Name
			pathMap[departmentInfo.ID] = departmentInfo.Path
		}
	}
	return nameMap, pathMap, nil
}

func (d *OpenCatalogDomain) GetOpenCatalogDetail(ctx context.Context, ID uint64) (*open_catalog.OpenCatalogDetailRes, error) {
	openCatalog, err := d.openCatalogRepo.GetById(ctx, ID)
	if err != nil {
		return nil, err
	}
	if openCatalog.ID == 0 {
		return nil, errorcode.Desc(errorcode.DataCatalogNotFound)
	}

	dataCatalog, err := d.catalogRepo.Get(ctx, openCatalog.CatalogID)
	if err != nil {
		return nil, err
	}

	departIds := []string{dataCatalog.SourceDepartmentID}
	//获取所属部门map
	departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	res := &open_catalog.OpenCatalogDetailRes{
		ID:                 strconv.FormatUint(openCatalog.ID, 10),
		CatalogID:          strconv.FormatUint(openCatalog.CatalogID, 10),
		Name:               dataCatalog.Title,
		Code:               dataCatalog.Code,
		Description:        dataCatalog.Description,
		OpenType:           openCatalog.OpenType,
		OpenLevel:          openCatalog.OpenLevel,
		AdministrativeCode: dataCatalog.AdministrativeCode,
		SourceDepartmentId: dataCatalog.SourceDepartmentID,
		SourceDepartment:   departmentNameMap[dataCatalog.SourceDepartmentID],
		UpdatedAt:          openCatalog.UpdatedAt.UnixMilli(),
		PublishAt:          GetUnixMilli(dataCatalog.PublishedAt),
	}

	return res, nil
}
func GetUnixMilli(t *time.Time) int64 {
	if t != nil {
		return t.UnixMilli()
	}
	return 0
}

func (d *OpenCatalogDomain) UpdateOpenCatalog(ctx context.Context, ID uint64, req *open_catalog.UpdateOpenCatalogReqBody) (resp *open_catalog.IDResp, err error) {
	openCatalog, err := d.openCatalogRepo.GetById(ctx, ID)
	if err != nil {
		return nil, err
	}
	if openCatalog.ID == 0 {
		return nil, errorcode.Desc(errorcode.DataCatalogNotFound)
	}

	if openCatalog.OpenStatus == constant.OpenStatusOpened || openCatalog.AuditState == constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("The catalog (id: %d) cannot be updated", ID)
		return nil, errorcode.Desc(errorcode.PublicAuditApplyNotAllowedError)
	}

	//判断是否存在数据目录记录
	catalog, err := d.catalogRepo.Get(ctx, openCatalog.CatalogID)
	if err != nil {
		return nil, err
	}
	//只有已上线和允许开放的编目的数据资源目录才能发起开放目录审核
	if catalog.OnlineStatus != constant.LineStatusOnLine || catalog.OpenType == 3 {
		log.WithContext(ctx).Errorf("audit apply (type: %s) not allowed", constant.AuditTypeOpen)
		return nil, errorcode.Desc(errorcode.PublicAuditApplyNotAllowedError)
	}

	//检查是否有绑定的审核流程
	process, err := d.configurationCenterDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: constant.AuditTypeOpen})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to check audit process info (type: %s), err: %v", constant.AuditTypeOpen, err)
		return nil, err
	}
	isAuditProcessExist := util.CE(process.ProcDefKey != "", true, false).(bool)

	//开放目录记录
	t := time.Now()
	openCatalog.OpenType = req.OpenType
	if req.OpenType == 2 {
		openCatalog.OpenLevel = req.OpenLevel
	} else {
		openCatalog.OpenLevel = 0
	}
	if !isAuditProcessExist {
		openCatalog.OpenStatus = constant.OpenStatusOpened
		openCatalog.OpenAt = &t
		openCatalog.AuditState = constant.AuditStatusPass
	} else {
		openCatalog.OpenStatus = constant.OpenStatusNotOpen
		openCatalog.AuditState = constant.AuditStatusAuditing
		openCatalog.ProcDefKey = process.ProcDefKey
		openCatalog.AuditApplySN, err = utils.GetUniqueID()
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
	}
	userInfo := request.GetUserInfo(ctx)
	openCatalog.UpdaterUID = userInfo.ID
	openCatalog.UpdatedAt = t

	tx := d.openCatalogRepo.Db().WithContext(ctx).Begin()
	err = d.openCatalogRepo.Save(ctx, openCatalog)
	if err != nil {
		tx.Rollback()
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	if isAuditProcessExist {
		//提交开放目录申请
		msg := &wf_common.AuditApplyMsg{}
		msg.Process.ApplyID = common.GenAuditApplyID(openCatalog.ID, openCatalog.AuditApplySN)
		msg.Process.AuditType = process.AuditType
		msg.Process.UserID = userInfo.ID
		msg.Process.UserName = userInfo.Name
		msg.Process.ProcDefKey = process.ProcDefKey
		msg.Data = map[string]any{
			"id":             fmt.Sprint(openCatalog.ID),
			"catalog_id":     fmt.Sprint(openCatalog.CatalogID),
			"code":           catalog.Code,
			"title":          catalog.Title,
			"submitter":      userInfo.ID,
			"submit_time":    t.UnixMilli(),
			"submitter_name": userInfo.Name,
		}
		msg.Workflow.TopCsf = 5
		msg.Workflow.AbstractInfo.Icon = common.AUDIT_ICON_BASE64
		msg.Workflow.AbstractInfo.Text = catalog.Title + "(" + msg.Process.ApplyID + ")"
		err = d.wf.AuditApply(msg)
		if err != nil {
			tx.Rollback()
			return nil, errorcode.Detail(errorcode.PublicAuditApplyFailedError, err.Error())
		}
	}
	err = tx.Commit().Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	return &open_catalog.IDResp{ID: strconv.FormatUint(openCatalog.ID, 10)}, nil
}

func (d *OpenCatalogDomain) DeleteOpenCatalog(ctx context.Context, ID uint64) error {
	openCatalog, err := d.openCatalogRepo.GetById(ctx, ID)
	if err != nil {
		return err
	}
	if openCatalog.ID == 0 {
		return errorcode.Desc(errorcode.DataCatalogNotFound)
	}

	if openCatalog.OpenStatus == constant.OpenStatusOpened || openCatalog.AuditState == constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("The catalog (id: %d) cannot be deleted", ID)
		return errorcode.Desc(errorcode.PublicResourceDelNotAllowedError)
	}

	userInfo := request.GetUserInfo(ctx)
	deletedAt := time.Now()
	err = d.openCatalogRepo.Delete(ctx, &model.TOpenCatalog{ID: ID, DeleteUID: userInfo.ID, DeletedAt: &deletedAt})
	if err != nil {
		return err
	}
	return nil
}

func (d *OpenCatalogDomain) CancelAudit(ctx context.Context, ID uint64) (resp *open_catalog.IDResp, err error) {

	openCatalog, err := d.openCatalogRepo.GetById(ctx, ID)
	if err != nil {
		log.WithContext(ctx).Errorf("", err)
		return nil, err
	}
	if openCatalog.ID == 0 {
		return nil, errorcode.Desc(errorcode.DataCatalogNotFound)
	}
	if openCatalog.AuditState != constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("Cancel audit Failed, catalog id:%d.", ID)
		return nil, errorcode.Detail(errorcode.PublicAuditCancelNotAllowedError, err)
	}

	userInfo := request.GetUserInfo(ctx)
	tx := d.openCatalogRepo.Db().WithContext(ctx).Begin()
	openCatalog.AuditState = constant.AuditStatusUnaudited
	openCatalog.UpdaterUID = userInfo.ID
	openCatalog.UpdatedAt = time.Now()
	err = d.openCatalogRepo.Save(ctx, openCatalog)
	if err != nil {
		tx.Rollback()
		log.WithContext(ctx).Errorf("failed to cancel open audit (catalog id: %d), err info: %v", ID, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	//撤销开放目录审核
	msg := &wf_common.AuditCancelMsg{}
	msg.ApplyIDs = []string{common.GenAuditApplyID(openCatalog.ID, openCatalog.AuditApplySN)}
	msg.Cause.ZHCN = "撤销开放目录审核"
	msg.Cause.ZHTW = "撤销开放目录审核"
	msg.Cause.ENUS = "Cancel open catalog audit"
	err = d.wf.AuditCancel(msg)
	if err != nil {
		tx.Rollback()
		log.WithContext(ctx).Errorf("failed to cancel open audit (catalog id: %d), err info: %v", ID, err)
		return
	}

	err = tx.Commit().Error
	if err != nil {
		err = errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		return
	}

	return &open_catalog.IDResp{ID: strconv.FormatUint(openCatalog.ID, 10)}, nil
}

func (d *OpenCatalogDomain) GetAuditList(ctx context.Context, req *open_catalog.GetAuditListReq) (resp *open_catalog.AuditListRes, err error) {

	auditTypes := []string{constant.AuditTypeOpen}
	docAuditReq := &wf_rest.GetMyTodoListReq{Type: auditTypes, Abstracts: req.Keyword, Limit: *req.Limit, Offset: util.CalculateOffset(*req.Offset, *req.Limit)}
	audits, err := d.workflowDriven.GetMyTodoList(ctx, docAuditReq)
	if err != nil {
		log.WithContext(ctx).Errorf("workflow.GetMyTodoList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	resp = &open_catalog.AuditListRes{
		TotalCount: int64(audits.TotalCount),
		Entries:    make([]*open_catalog.WorkflowItem, 0),
	}
	if len(audits.Entries) <= 0 {
		return resp, nil
	}
	for i := range audits.Entries {
		auditItem := audits.Entries[i]
		customData := make(map[string]any)
		err := json.Unmarshal([]byte(auditItem.ApplyDetail.Data), &customData)
		if err != nil {
			return nil, err
		}
		applierTime, err := time.Parse(time.RFC3339Nano, auditItem.ApplyTime)
		if err != nil {
			log.WithContext(ctx).Errorf("time parse failed: %v", err)
			return nil, err
		}
		data := &open_catalog.WorkflowItem{
			ID:           auditItem.ID,
			ApplyCode:    auditItem.ApplyDetail.Process.ApplyID,
			CatalogTitle: fmt.Sprintf("%v", customData["title"]),
			CatalogID:    fmt.Sprintf("%v", customData["id"]),
			CatalogCode:  fmt.Sprintf("%v", customData["code"]),
			ApplierID:    auditItem.ApplyDetail.Process.UserID,
			ApplierName:  auditItem.ApplyDetail.Process.UserName,
			ApplierTime:  applierTime.UnixMilli(),
		}
		resp.Entries = append(resp.Entries, data)
	}
	return resp, nil
}

func (d *OpenCatalogDomain) GetOverview(ctx context.Context) (resp *open_catalog.GetOverviewRes, err error) {
	resp = &open_catalog.GetOverviewRes{
		CatalogTotalCount:      0,
		AuditingCatalogCount:   0,
		TypeCatalogCount:       make([]*open_catalog.TypeCatalogCount, 0),
		NewOpenCatalogCount:    make([]*open_catalog.NewOpenCatalogCount, 0),
		DepartmentCatalogCount: make([]*open_catalog.DepartmentCatalogCount, 0),
		CatalogThemeCount:      make([]*open_catalog.CatalogThemeCount, 0),
	}
	//开放目录总数量
	resp.CatalogTotalCount, err = d.openCatalogRepo.GetTotalOpenCatalogCount(ctx)
	if err != nil {
		return nil, err
	}

	//审核中的数量
	resp.AuditingCatalogCount, err = d.openCatalogRepo.GetAuditingOpenCatalogCount(ctx)
	if err != nil {
		return nil, err
	}

	//资源类型开放目录数量
	resp.TypeCatalogCount, err = d.openCatalogRepo.GetResourceTypeCount(ctx)
	if err != nil {
		return nil, err
	}
	for i := 0; i < len(resp.TypeCatalogCount); i++ {
		resp.TypeCatalogCount[i].Proportion = float64(resp.TypeCatalogCount[i].Count) / float64(resp.CatalogTotalCount) * 100
	}

	//补全缺失的类型目录统计
	if len(resp.TypeCatalogCount) == 1 {
		if resp.TypeCatalogCount[0].Type == 1 {
			resp.TypeCatalogCount = append(resp.TypeCatalogCount, &open_catalog.TypeCatalogCount{Type: 2, Count: 0, Proportion: 0})
		} else if resp.TypeCatalogCount[0].Type == 2 {
			resp.TypeCatalogCount = append(resp.TypeCatalogCount, &open_catalog.TypeCatalogCount{Type: 1, Count: 0, Proportion: 0})

		}
	} else if len(resp.TypeCatalogCount) == 0 {
		resp.TypeCatalogCount = append(resp.TypeCatalogCount,
			&open_catalog.TypeCatalogCount{Type: 1, Count: 0, Proportion: 0},
			&open_catalog.TypeCatalogCount{Type: 2, Count: 0, Proportion: 0})
	}

	//近一年开放目录新增数量(按月统计)
	resp.NewOpenCatalogCount, err = d.openCatalogRepo.GetMonthlyNewOpenCatalogCount(ctx)
	if err != nil {
		return nil, err
	}

	//部门提供目录数量TOP10
	resp.DepartmentCatalogCount, err = d.openCatalogRepo.GetDepartmentCatalogCount(ctx)
	if err != nil {
		return nil, err
	}
	departIds := make([]string, len(resp.DepartmentCatalogCount))
	for _, vo := range resp.DepartmentCatalogCount {
		departIds = append(departIds, vo.DepartmentId)
	}
	//获取所属部门map
	departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}
	for i := 0; i < len(resp.DepartmentCatalogCount); i++ {
		resp.DepartmentCatalogCount[i].DepartmentName = departmentNameMap[resp.DepartmentCatalogCount[i].DepartmentId]
	}

	//开放目录主题数量
	catalogIds, err := d.openCatalogRepo.GetAllCatalogIds(ctx)
	if err != nil {
		return nil, err
	}
	var themeCatalogCount int64
	themeCatalogCount, resp.CatalogThemeCount, err = d.GetCatalogThemeCounts(ctx, catalogIds)
	if err != nil {
		return nil, err
	}
	for i := 0; i < len(resp.CatalogThemeCount); i++ {
		proportion := float64(resp.CatalogThemeCount[i].Count) / float64(themeCatalogCount) * 100
		resp.CatalogThemeCount[i].Proportion = math.Round(proportion*100) / 100
	}
	return resp, nil
}

func (d *OpenCatalogDomain) GetCatalogThemeCounts(ctx context.Context, catalogIds []uint64) (int64, []*open_catalog.CatalogThemeCount, error) {
	category, err := d.catalogRepo.GetCategoriesByCatalogIds(ctx, catalogIds)
	if err != nil {
		return 0, nil, err
	}
	subjectIds := make([]string, 0)
	themeCounts := make(map[string]*open_catalog.CatalogThemeCount, 0)
	for _, c := range category {
		switch c.CategoryType {
		case constant.CategoryTypeSubject:
			subjectIds = append(subjectIds, c.CategoryID)
			if _, ok := themeCounts[c.CategoryID]; ok {
				themeCounts[c.CategoryID].Count++
			} else {
				themeCounts[c.CategoryID] = &open_catalog.CatalogThemeCount{ThemeId: c.CategoryID, ThemeName: "", Count: 1}
				if c.CategoryID == constant.OtherSubject {
					themeCounts[c.CategoryID].ThemeName = constant.OtherName
				}
			}
		}
	}
	themeCatalogCount := len(subjectIds)
	subjectIds = util.DuplicateStringRemoval(subjectIds)
	if len(subjectIds) != 0 {
		subjectInfos, err := d.dataSubjectDriven.GetDataSubjectByID(ctx, subjectIds)
		if err != nil {
			return 0, nil, err
		}
		for _, subjectInfo := range subjectInfos.Objects {
			themeCounts[subjectInfo.ID].ThemeName = subjectInfo.Name
		}
	}
	res := make([]*open_catalog.CatalogThemeCount, 0)
	for _, themeCount := range themeCounts {
		res = append(res, themeCount)
	}
	return int64(themeCatalogCount), res, nil
}

func (d *OpenCatalogDomain) AuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessMsgProc ", zap.Any("err", err))
		}
	}()
	catalogID, applySN, err := common.ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result flow_type: %v  apply_id: %s, err: %v", msg.ProcessDef.Category, msg.ProcessInputModel.Fields.ApplyID, err)
		return err
	}

	alterInfo := map[string]interface{}{
		"audit_advice": "",
		"updated_at":   &util.Time{Time: time.Now()},
	}

	alterInfo["flow_id"] = msg.ProcInstId
	alterInfo["flow_apply_id"] = msg.ProcessInputModel.Fields.FlowApplyID
	if msg.CurrentActivity == nil {
		if len(msg.NextActivity) > 0 {
			alterInfo["flow_node_id"] = msg.NextActivity[0].ActDefId
			alterInfo["flow_node_name"] = msg.NextActivity[0].ActDefName
		} else {
			log.WithContext(ctx).Infof("audit result flow_type: %v catalog_id: %d audit_apply_sn: %s auto finished, do nothing", msg.ProcessDef.Category, catalogID, applySN)
		}
	} else if len(msg.NextActivity) == 0 {
		if !msg.ProcessInputModel.Fields.AuditIdea {
			alterInfo["audit_state"] = constant.AuditStatusReject
			alterInfo["audit_advice"] = common.GetAuditMsg(&msg.ProcessInputModel.WFCurComment, &msg.ProcessInputModel.Fields.AuditMsg)
		}
	} else {
		if msg.ProcessInputModel.Fields.AuditIdea {
			alterInfo["flow_node_id"] = msg.NextActivity[0].ActDefId
			alterInfo["flow_node_name"] = msg.NextActivity[0].ActDefName
		} else {
			alterInfo["audit_state"] = constant.AuditStatusReject
			alterInfo["audit_advice"] = common.GetAuditMsg(&msg.ProcessInputModel.WFCurComment, &msg.ProcessInputModel.Fields.AuditMsg)
		}
	}

	_, err = d.openCatalogRepo.AuditProcessMsgProc(ctx, catalogID, applySN, alterInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit result flow_type: %v catalog_id: %d audit_apply_sn: %s alterInfo: %+v, err: %v", msg.ProcessDef.Category, catalogID, applySN, alterInfo, err)
	}
	return err
}

func (d *OpenCatalogDomain) AuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditResult ", zap.Any("err", err))
		}
	}()
	log.WithContext(ctx).Infof("recv audit result type: %s apply_id: %s Result: %s", auditType, msg.ApplyID, msg.Result)
	catalogID, applySN, err := common.ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}
	alterInfo := map[string]interface{}{"updated_at": &util.Time{Time: time.Now()}}
	switch auditType {
	case constant.AuditTypeOpen:
		switch msg.Result {
		case common.AUDIT_RESULT_PASS:
			alterInfo["audit_state"] = constant.AuditStatusPass
			alterInfo["audit_advice"] = ""
			alterInfo["open_status"] = constant.OpenStatusOpened
			alterInfo["open_at"] = alterInfo["updated_at"]
		case common.AUDIT_RESULT_REJECT:
			alterInfo["audit_state"] = constant.AuditStatusReject
			alterInfo["open_status"] = constant.OpenStatusNotOpen
		case common.AUDIT_RESULT_UNDONE:
			alterInfo["audit_state"] = constant.AuditStatusUndone
			alterInfo["open_status"] = constant.OpenStatusNotOpen
		default:
			log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
			return nil
		}
	}
	_, err = d.openCatalogRepo.AuditResultUpdate(ctx, catalogID, applySN, alterInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("[mq] Audit failed toAuditResultUpdate, err info: %v", err.Error())
		return err
	}
	return nil
}

func (d *OpenCatalogDomain) AuditProcessDelMsgProc(ctx context.Context, auditType string, msg *wf_common.AuditProcDefDelMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessDelMsgProc ", zap.Any("err", err))
		}
	}()
	if len(msg.ProcDefKeys) == 0 {
		return nil
	}

	log.WithContext(ctx).Infof("recv audit type: %s proc_def_keys: %v delete msg, proc related unfinished audit process",
		auditType, msg.ProcDefKeys)

	_, err := d.openCatalogRepo.UpdateAuditStateByProcDefKey(ctx, msg.ProcDefKeys)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit type: %s proc_def_keys: %v related unfinished audit process to reject status, err: %v",
			auditType, msg.ProcDefKeys, err)
	}
	return err
}
