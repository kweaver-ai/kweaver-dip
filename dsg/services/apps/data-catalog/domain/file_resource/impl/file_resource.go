package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"mime/multipart"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	file_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/file_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	file_resource_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/file_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	common_errorcode "github.com/kweaver-ai/idrm-go-common/errorcode"
	gocephclient "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	"github.com/kweaver-ai/idrm-go-common/rest/basic_bigdata_service"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	wf_rest "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	wf "github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"go.uber.org/zap"
)

type FileResourceDomain struct {
	configurationCenterDriven configuration_center.Driven
	fileResourceRepo          file_resource_repo.FileResourceRepo
	dataResourceRepo          data_resource.DataResourceRepo
	catalogRepo               catalog_repo.DataResourceCatalogRepo
	wf                        wf.WorkflowInterface
	workflowDriven            wf_rest.DocAuditDriven
	fileMgnt                  basic_bigdata_service.Driven
	cephClient                gocephclient.CephClient
	departmentDomain          *common.DepartmentDomain
}

func NewFileResourceDomain(
	configurationCenterDriven configuration_center.Driven,
	fileResourceRepo file_resource_repo.FileResourceRepo,
	dataResourceRepo data_resource.DataResourceRepo,
	catalogRepo catalog_repo.DataResourceCatalogRepo,
	wf wf.WorkflowInterface,
	workflowDriven wf_rest.DocAuditDriven,
	fileMgnt basic_bigdata_service.Driven,
	cephClient gocephclient.CephClient,
	departmentDomain *common.DepartmentDomain,
) file_resource.FileResourceDomain {
	dc := &FileResourceDomain{
		configurationCenterDriven: configurationCenterDriven,
		fileResourceRepo:          fileResourceRepo,
		dataResourceRepo:          dataResourceRepo,
		catalogRepo:               catalogRepo,
		wf:                        wf,
		workflowDriven:            workflowDriven,
		fileMgnt:                  fileMgnt,
		cephClient:                cephClient,
		departmentDomain:          departmentDomain,
	}
	dc.wf.RegistConusmeHandlers(common.WORKFLOW_AUDIT_TYPE_FILE_RESOURCE_PUBLISH,
		dc.AuditProcessMsgProc,
		common.HandlerFunc[wf_common.AuditResultMsg](common.WORKFLOW_AUDIT_TYPE_FILE_RESOURCE_PUBLISH, dc.AuditResult),
		common.HandlerFunc[wf_common.AuditProcDefDelMsg](common.WORKFLOW_AUDIT_TYPE_FILE_RESOURCE_PUBLISH, dc.AuditProcessDelMsgProc))
	return dc
}

func (d *FileResourceDomain) CreateFileResource(ctx context.Context, req *file_resource.CreateFileResourceReq) (resp *file_resource.IDResp, err error) {

	resourceModel := &model.TFileResource{}
	resourceID, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)
	}
	resourceModel.ID = resourceID
	resourceModel.Name = req.Name
	//region 生成编码规则
	codeList, err := d.configurationCenterDriven.Generate(ctx, configuration_center.GenerateCodeIdFileResource, 1)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)
	}
	if codeList != nil && len(codeList.Entries) != 0 {
		resourceModel.Code = codeList.Entries[0]
	} else {
		return nil, errorcode.Desc(common_errorcode.GenerateCodeError)
	}
	//endregion
	resourceModel.DepartmentID = req.DepartmentId
	resourceModel.Description = req.Description
	resourceModel.PublishStatus = constant.PublishStatusUnPublished
	resourceModel.AuditState = constant.AuditStatusUnaudited
	userInfo := request.GetUserInfo(ctx)
	t := time.Now()
	resourceModel.CreatorUID = userInfo.ID
	resourceModel.CreatedAt = t
	resourceModel.UpdaterUID = userInfo.ID
	resourceModel.UpdatedAt = &t

	err = d.fileResourceRepo.Create(ctx, resourceModel)
	if err != nil {
		log.Errorf("%s", err)
		return nil, err
	}

	return &file_resource.IDResp{ID: strconv.FormatUint(resourceID, 10)}, nil
}

const (
	maxUploadSize = 1024 * 1024 * 10
)

// validSize check valid size
func validSize(size int64) bool {
	return size <= maxUploadSize
}

func (d *FileResourceDomain) CreateDataResource(ctx context.Context, resourceModel *model.TFileResource) error {
	return d.dataResourceRepo.Create(ctx, &model.TDataResource{
		ResourceId:   strconv.FormatUint(resourceModel.ID, 10),
		Name:         resourceModel.Name,
		Code:         resourceModel.Code,
		Type:         domain.ResourceTypeFileResource,
		DepartmentId: resourceModel.DepartmentID,
		SubjectId:    "",
		PublishAt:    resourceModel.PublishedAt,
		Status:       constant.ReSourceTypeNormal,
	})
}
func (d *FileResourceDomain) GetFileResourceList(ctx context.Context, req *file_resource.GetFileResourceListReq) (*file_resource.GetFileResourceListRes, error) {
	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId {
		req.SubDepartmentIDs = []string{req.DepartmentID}
		departmentList, err := d.configurationCenterDriven.GetChildDepartments(ctx, req.DepartmentID)
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			util.SliceAdd(&req.SubDepartmentIDs, entry.ID)
		}
	}
	if req.MyDepartmentResource {
		depart, err := d.departmentDomain.GetMainDepart(ctx)
		if err != nil {
			return nil, err
		}
		if req.SubDepartmentIDs == nil {
			req.SubDepartmentIDs = []string{}
		}
		req.SubDepartmentIDs = append(req.SubDepartmentIDs, depart...)
	}
	totalCount, fileResources, err := d.fileResourceRepo.GetFileResourceList(ctx, req)
	if err != nil {
		return nil, err
	}
	departIds := make([]string, 0)
	resourceIds := make([]string, 0)
	for _, fileResource := range fileResources {
		departIds = append(departIds, fileResource.DepartmentID)
		resourceIds = append(resourceIds, strconv.FormatUint(fileResource.ID, 10))
	}

	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	countMap := make(map[string]int64, 0)
	if len(resourceIds) > 0 {
		//获取文件资源所关联的文件数量
		countInfos, err := d.fileMgnt.GetCountsByIds(ctx,
			&basic_bigdata_service.GetCountsByIdsReq{
				Type: basic_bigdata_service.EnumFileResource.String,
				IDs:  resourceIds,
			})
		if err != nil {
			return nil, err
		}
		for _, countInfo := range countInfos.Entries {
			countMap[countInfo.ID] = countInfo.Count
		}
	}

	fileResourceIds := make([]string, 0)
	res := make([]*file_resource.FileResource, len(fileResources))
	for i, fileResource := range fileResources {
		resourceId := strconv.FormatUint(fileResource.ID, 10)
		res[i] = &file_resource.FileResource{
			ID:             resourceId,
			Name:           fileResource.Name,
			Code:           fileResource.Code,
			DepartmentId:   fileResource.DepartmentID,
			Department:     departmentNameMap[fileResource.DepartmentID],
			DepartmentPath: departmentPathMap[fileResource.DepartmentID],
			Description:    fileResource.Description,
			PublishStatus:  fileResource.PublishStatus,
			AuditState:     fileResource.AuditState,
			AuditAdvice:    fileResource.AuditAdvice,
		}
		if attachmentCount, ok := countMap[resourceId]; ok {
			res[i].AttachmentCount = attachmentCount
		}
		if fileResource.UpdatedAt != nil {
			res[i].UpdatedAt = fileResource.UpdatedAt.UnixMilli()
		}
		if req.MyDepartmentResource {
			fileResourceIds = append(fileResourceIds, resourceId)
		}
		// 发布日期
		if fileResource.PublishedAt != nil {
			res[i].PublishedAt = fileResource.PublishedAt.UnixMilli()
		}
	}
	if req.MyDepartmentResource {
		resourceAndCatalog, err := d.dataResourceRepo.GetResourceAndCatalog(ctx, fileResourceIds)
		if err != nil {
			return nil, err
		}
		resourceAndCatalogMap := make(map[string]*data_resource_catalog.DataCatalogWithMount)
		for _, c := range resourceAndCatalog {
			resourceAndCatalogMap[c.ResourceID] = c
		}
		for i := 0; i < len(res); i++ {
			if _, exist := resourceAndCatalogMap[res[i].ID]; exist {
				res[i].DataCatalogID = strconv.FormatUint(resourceAndCatalogMap[res[i].ID].CatalogID, 10)
				res[i].DataCatalogName = resourceAndCatalogMap[res[i].ID].CatalogName
			}
		}
	}

	// 批量查询目录提供方：根据文件资源ID列表查询目录提供方路径
	// 1. 批量查询 t_data_resource 表，条件：resource_id IN (文件资源ID列表) AND type=3
	if len(resourceIds) > 0 {
		dataResources, err := d.dataResourceRepo.GetByResourceIds(ctx, resourceIds, constant.MountFile, nil)
		if err != nil {
			log.WithContext(ctx).Warnf("failed to batch get data resources by resource_ids, err: %v", err)
		} else if len(dataResources) > 0 {
			// 2. 收集所有的 catalog_id
			catalogIDs := make([]uint64, 0)
			resourceIDToCatalogIDMap := make(map[string]uint64) // resource_id -> catalog_id
			for _, dr := range dataResources {
				if dr.CatalogID > 0 {
					catalogIDs = append(catalogIDs, dr.CatalogID)
					resourceIDToCatalogIDMap[dr.ResourceId] = dr.CatalogID
				}
			}

			// 3. 批量查询 t_data_catalog 表获取 source_department_id
			if len(catalogIDs) > 0 {
				dataCatalogs, err := d.catalogRepo.ListCatalogsByIDs(ctx, catalogIDs)
				if err != nil {
					log.WithContext(ctx).Warnf("failed to batch get data catalogs by catalog_ids, err: %v", err)
				} else if len(dataCatalogs) > 0 {
					// 4. 收集所有的 source_department_id
					sourceDepartmentIDs := make([]string, 0)
					catalogIDToSourceDeptIDMap := make(map[uint64]string) // catalog_id -> source_department_id
					for _, dc := range dataCatalogs {
						if dc.DepartmentID != "" {
							sourceDepartmentIDs = append(sourceDepartmentIDs, dc.DepartmentID)
							catalogIDToSourceDeptIDMap[dc.ID] = dc.DepartmentID
						}
					}

					// 5. 批量查询部门路径
					if len(sourceDepartmentIDs) > 0 {
						_, catalogProviderPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(sourceDepartmentIDs))
						if err != nil {
							log.WithContext(ctx).Warnf("failed to batch get catalog provider department paths, err: %v", err)
						} else {
							// 6. 构建 resource_id -> catalog_provider_path 的映射
							resourceIDToProviderPathMap := make(map[string]string)
							for resourceID, catalogID := range resourceIDToCatalogIDMap {
								if sourceDeptID, exists := catalogIDToSourceDeptIDMap[catalogID]; exists {
									if path, pathExists := catalogProviderPathMap[sourceDeptID]; pathExists && path != "" {
										resourceIDToProviderPathMap[resourceID] = path
									}
								}
							}

							// 7. 填充目录提供方路径到返回结果
							for i := 0; i < len(res); i++ {
								if path, exists := resourceIDToProviderPathMap[res[i].ID]; exists {
									res[i].CatalogProviderPath = path
								}
							}
						}
					}
				}
			}
		}
	}

	return &file_resource.GetFileResourceListRes{
		Entries:    res,
		TotalCount: totalCount,
	}, nil
}
func (d *FileResourceDomain) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
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

func (d *FileResourceDomain) GetFileResourceDetail(ctx context.Context, ID uint64) (*file_resource.GetFileResourceDetailRes, error) {
	fileResource, err := d.fileResourceRepo.GetById(ctx, ID)
	if err != nil {
		return nil, err
	}
	if fileResource.ID == 0 {
		return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	}

	departIds := []string{fileResource.DepartmentID}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	res := &file_resource.GetFileResourceDetailRes{
		ID:             strconv.FormatUint(fileResource.ID, 10),
		Name:           fileResource.Name,
		Code:           fileResource.Code,
		DepartmentId:   fileResource.DepartmentID,
		Department:     departmentNameMap[fileResource.DepartmentID],
		DepartmentPath: departmentPathMap[fileResource.DepartmentID],
		Description:    fileResource.Description,
		PublishStatus:  fileResource.PublishStatus,
		CreatedAt:      fileResource.CreatedAt.UnixMilli(),
		CreatorUID:     fileResource.CreatorUID,
		UpdaterUID:     fileResource.UpdaterUID,
	}
	if fileResource.PublishedAt != nil {
		res.PublishedAt = fileResource.PublishedAt.UnixMilli()
	}
	if fileResource.UpdatedAt != nil {
		res.UpdatedAt = fileResource.UpdatedAt.UnixMilli()
	}

	//获取用户名
	users, err := d.configurationCenterDriven.GetUsers(ctx, []string{fileResource.CreatorUID, fileResource.UpdaterUID})
	if err != nil {
		return nil, err
	}
	for _, user := range users {
		if user.ID == fileResource.CreatorUID {
			res.CreatorName = user.Name
		}
		if user.ID == fileResource.UpdaterUID {
			res.UpdaterName = user.Name
		}
	}

	// 获取目录提供方：根据文件资源ID查询目录提供方路径
	// 1. 根据文件资源ID（转为字符串）查询 t_data_resource 表，条件：resource_id=文件资源ID 且 type=3
	fileResourceIDStr := strconv.FormatUint(ID, 10)
	dataResource, err := d.dataResourceRepo.GetByResourceId(ctx, fileResourceIDStr)
	if err != nil {
		// 如果查询失败，记录日志但不影响主流程，目录提供方为空
		log.WithContext(ctx).Warnf("failed to get data resource by resource_id=%s, err: %v", fileResourceIDStr, err)
	} else if dataResource != nil && dataResource.Type == constant.MountFile && dataResource.CatalogID > 0 {
		// 2. 根据 catalog_id 查询 t_data_catalog 表获取 source_department_id
		dataCatalog, err := d.catalogRepo.Get(ctx, dataResource.CatalogID)
		if err != nil {
			log.WithContext(ctx).Warnf("failed to get data catalog by catalog_id=%d, err: %v", dataResource.CatalogID, err)
		} else if dataCatalog != nil && dataCatalog.SourceDepartmentID != "" {
			// 3. 根据 source_department_id 通过配置中心接口查询部门路径
			departIds := []string{dataCatalog.SourceDepartmentID}
			_, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
			if err != nil {
				log.WithContext(ctx).Warnf("failed to get department path by source_department_id=%s, err: %v", dataCatalog.SourceDepartmentID, err)
			} else if path, exists := departmentPathMap[dataCatalog.SourceDepartmentID]; exists && path != "" {
				res.CatalogProviderPath = path
			}
		}
	}

	return res, nil
}

func (d *FileResourceDomain) UpdateFileResource(ctx context.Context, ID uint64, req *file_resource.UpdateFileResourceReq) (resp *file_resource.IDResp, err error) {
	fileResource, err := d.fileResourceRepo.GetById(ctx, ID)
	if err != nil {
		return nil, err
	}
	if fileResource.ID == 0 {
		return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	}

	//已发布和审核中的文件资源不允许修改
	if fileResource.PublishStatus == constant.PublishStatusPublished || fileResource.AuditState == constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("The file resource (id: %d) cannot be updated", ID)
		return nil, errorcode.Desc(errorcode.PublicAuditApplyNotAllowedError)
	}

	//修改文件资源记录
	fileResource.Name = req.Name
	fileResource.DepartmentID = req.DepartmentId
	fileResource.Description = req.Description
	userInfo := request.GetUserInfo(ctx)
	fileResource.UpdaterUID = userInfo.ID
	t := time.Now()
	fileResource.UpdatedAt = &t
	err = d.fileResourceRepo.Save(ctx, fileResource)
	if err != nil {
		log.Errorf("%s", err)
		return nil, err
	}

	return &file_resource.IDResp{ID: strconv.FormatUint(ID, 10)}, nil
}

func (d *FileResourceDomain) DeleteFileResource(ctx context.Context, ID uint64) error {
	fileResource, err := d.fileResourceRepo.GetById(ctx, ID)
	if err != nil {
		return err
	}
	if fileResource.ID == 0 {
		return errorcode.Desc(errorcode.PublicResourceNotExisted)
	}

	//已发布和审核中的文件资源不允许删除
	if fileResource.PublishStatus == constant.PublishStatusPublished || fileResource.AuditState == constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("The file resource (id: %d) cannot be deleted", ID)
		return errorcode.Desc(errorcode.PublicResourceDelNotAllowedError)
	}

	userInfo := request.GetUserInfo(ctx)
	deletedAt := time.Now()
	err = d.fileResourceRepo.Delete(ctx, &model.TFileResource{ID: ID, DeleterUID: userInfo.ID, DeletedAt: &deletedAt})
	if err != nil {
		return err
	}

	err = d.fileMgnt.DeleteFiles(ctx, &basic_bigdata_service.DeleteReq{
		ID: strconv.FormatUint(ID, 10),
	})
	if err = d.dataResourceRepo.DeleteTransaction(ctx, strconv.FormatUint(ID, 10)); err != nil {
		log.WithContext(ctx).Error("FileResourceDomain DeleteFileResource DeleteTransaction error", zap.Error(err))
		return err
	}

	return nil
}

func (d *FileResourceDomain) PublishFileResource(ctx context.Context, ID uint64) (resp *file_resource.IDResp, err error) {

	fileResource, err := d.fileResourceRepo.GetById(ctx, ID)
	if err != nil {
		return nil, err
	}
	if fileResource.ID == 0 {
		return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	}

	//已发布和审核中的文件资源不允许发起审核
	if fileResource.PublishStatus == constant.PublishStatusPublished || fileResource.AuditState == constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("The file resource (id: %d) cannot initiate audit", ID)
		return nil, errorcode.Desc(errorcode.PublicAuditApplyNotAllowedError)
	}

	//获取文件资源所关联的文件数量
	countInfos, err := d.fileMgnt.GetCountsByIds(ctx,
		&basic_bigdata_service.GetCountsByIdsReq{
			Type: basic_bigdata_service.EnumFileResource.String,
			IDs:  []string{strconv.FormatUint(fileResource.ID, 10)},
		})
	if err != nil {
		return nil, err
	}
	//没有附件的文件资源不允许发起审核
	if len(countInfos.Entries) != 1 || countInfos.Entries[0].Count <= 0 {
		log.WithContext(ctx).Errorf("The file resource (id: %d) cannot initiate audit", ID)
		return nil, errorcode.Desc(errorcode.PublicAuditApplyNotAllowedError)
	}

	//检查是否有绑定的审核流程
	process, err := d.configurationCenterDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: constant.AuditTypeFileResourcePublish})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to check audit process info (type: %s), err: %v", constant.AuditTypeFileResourcePublish, err)
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)
	}
	isAuditProcessExist := util.CE(process.ProcDefKey != "", true, false).(bool)

	//修改文件资源记录
	t := time.Now()
	if !isAuditProcessExist {
		fileResource.PublishStatus = constant.PublishStatusPublished
		fileResource.PublishedAt = &t
		fileResource.AuditState = constant.AuditStatusPass
		if err = d.CreateDataResource(ctx, fileResource); err != nil {
			return nil, err
		}
	} else {
		fileResource.PublishStatus = constant.PublishStatusPubAuditing
		fileResource.AuditState = constant.AuditStatusAuditing
		fileResource.ProcDefKey = process.ProcDefKey
		fileResource.AuditApplySN, err = utils.GetUniqueID()
		if err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			return nil, err
		}
	}
	userInfo := request.GetUserInfo(ctx)
	fileResource.UpdaterUID = userInfo.ID
	fileResource.UpdatedAt = &t

	err = d.fileResourceRepo.Save(ctx, fileResource)
	if err != nil {
		log.Errorf("%s", err)
		return nil, err
	}

	//文件资源发布审核
	if isAuditProcessExist {
		msg := &wf_common.AuditApplyMsg{}
		msg.Process.ApplyID = common.GenAuditApplyID(fileResource.ID, fileResource.AuditApplySN)
		msg.Process.AuditType = process.AuditType
		msg.Process.UserID = userInfo.ID
		msg.Process.UserName = userInfo.Name
		msg.Process.ProcDefKey = process.ProcDefKey
		departIds := []string{fileResource.DepartmentID}
		//获取所属部门map
		departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
		if err != nil {
			return nil, err
		}
		msg.Data = map[string]any{
			"id":              fmt.Sprint(fileResource.ID),
			"name":            fileResource.Name,
			"code":            fileResource.Code,
			"department":      departmentNameMap[fileResource.DepartmentID],
			"department_path": departmentPathMap[fileResource.DepartmentID],
			"description":     fileResource.Description,
			"submitter":       userInfo.ID,
			"submit_time":     t.UnixMilli(),
			"submitter_name":  userInfo.Name,
		}
		msg.Workflow.TopCsf = 5
		msg.Workflow.AbstractInfo.Icon = common.AUDIT_ICON_BASE64
		msg.Workflow.AbstractInfo.Text = fileResource.Name + "(" + msg.Process.ApplyID + ")"
		err = d.wf.AuditApply(msg)
		if err != nil {
			log.Errorf("%s", err)
			return nil, err
		}
	}

	return &file_resource.IDResp{ID: strconv.FormatUint(ID, 10)}, nil
}

func (d *FileResourceDomain) CancelAudit(ctx context.Context, ID uint64) (resp *file_resource.IDResp, err error) {

	fileResource, err := d.fileResourceRepo.GetById(ctx, ID)
	if err != nil {
		log.WithContext(ctx).Errorf("", err)
		return nil, err
	}
	if fileResource.ID == 0 {
		return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	}
	if fileResource.AuditState != constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("Cancel audit Failed, file resource id:%d.", ID)
		return nil, errorcode.Detail(errorcode.PublicAuditCancelNotAllowedError, err)
	}

	userInfo := request.GetUserInfo(ctx)
	tx := d.fileResourceRepo.Db().WithContext(ctx).Begin()
	fileResource.PublishStatus = constant.PublishStatusUnPublished
	fileResource.AuditState = constant.AuditStatusUnaudited
	fileResource.UpdaterUID = userInfo.ID
	t := time.Now()
	fileResource.UpdatedAt = &t
	err = d.fileResourceRepo.Save(ctx, fileResource)
	if err != nil {
		tx.Rollback()
		log.WithContext(ctx).Errorf("failed to cancel audit (file resource id: %d), err info: %v", ID, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	//撤销文件资源审核
	msg := &wf_common.AuditCancelMsg{}
	msg.ApplyIDs = []string{common.GenAuditApplyID(fileResource.ID, fileResource.AuditApplySN)}
	msg.Cause.ZHCN = "撤销文件资源审核"
	msg.Cause.ZHTW = "撤销文件资源审核"
	msg.Cause.ENUS = "Cancel file resource audit"
	err = d.wf.AuditCancel(msg)
	if err != nil {
		tx.Rollback()
		log.WithContext(ctx).Errorf("failed to cancel audit (file resource id: %d), err info: %v", ID, err)
		return
	}

	err = tx.Commit().Error
	if err != nil {
		err = errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		return
	}

	return &file_resource.IDResp{ID: strconv.FormatUint(fileResource.ID, 10)}, nil
}

func (d *FileResourceDomain) GetAuditList(ctx context.Context, req *file_resource.GetAuditListReq) (resp *file_resource.AuditListRes, err error) {

	auditTypes := []string{constant.AuditTypeFileResourcePublish}

	docAuditReq := &wf_rest.GetMyTodoListReq{Type: auditTypes, Abstracts: req.Keyword, Limit: *req.Limit, Offset: util.CalculateOffset(*req.Offset, *req.Limit)}
	audits, err := d.workflowDriven.GetMyTodoList(ctx, docAuditReq)
	if err != nil {
		log.WithContext(ctx).Errorf("workflow.GetMyTodoList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	resp = &file_resource.AuditListRes{
		TotalCount: int64(audits.TotalCount),
		Entries:    make([]*file_resource.WorkflowItem, 0),
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
		data := &file_resource.WorkflowItem{
			ID:               auditItem.ID,
			ApplyCode:        auditItem.ApplyDetail.Process.ApplyID,
			FileResourceID:   fmt.Sprintf("%v", customData["id"]),
			FileResourceName: fmt.Sprintf("%v", customData["name"]),
			FileResourceCode: fmt.Sprintf("%v", customData["code"]),
			Department:       fmt.Sprintf("%v", customData["department"]),
			DepartmentPath:   fmt.Sprintf("%v", customData["department_path"]),
			Description:      fmt.Sprintf("%v", customData["description"]),
			ApplierID:        auditItem.ApplyDetail.Process.UserID,
			ApplierName:      auditItem.ApplyDetail.Process.UserName,
			ApplierTime:      applierTime.UnixMilli(),
		}
		resp.Entries = append(resp.Entries, data)
	}
	return resp, nil
}

func (d *FileResourceDomain) GetAttachmentList(ctx context.Context, ID string, req *file_resource.GetAttachmentListReq) (*file_resource.GetAttachmentListRes, error) {
	fileList, err := d.fileMgnt.QueryPageFile(ctx, &basic_bigdata_service.QueryPageReq{
		Keyword:          req.Keyword,
		Type:             basic_bigdata_service.EnumFileResource.String,
		RelatedObjectIDs: []string{ID},
		Offset:           *req.Offset,
		Limit:            *req.Limit,
	})
	if err != nil {
		log.WithContext(ctx).Errorf("fileMgnt.QueryPageFile failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	attachmentList := make([]*file_resource.AttachmentInfo, len(fileList.Entries))
	for i, fileInfo := range fileList.Entries {
		attachmentList[i] = &file_resource.AttachmentInfo{
			ID:           fileInfo.ID,
			Size:         fileInfo.Size,
			PreviewOssID: fileInfo.PreviewOssID,
			OssID:        fileInfo.ExportOssID,
			CreatedAt:    fileInfo.CreatedAt,
		}
		parts := strings.Split(fileInfo.Name, ".")
		if len(parts) == 2 {
			attachmentList[i].Name = parts[0]
			attachmentList[i].Type = parts[1]
		} else {
			attachmentList[i].Name = fileInfo.Name
		}
	}

	res := &file_resource.GetAttachmentListRes{
		TotalCount: int64(fileList.TotalCount),
		Entries:    attachmentList,
	}
	return res, nil

}

func (d *FileResourceDomain) UploadAttachment(ctx context.Context, ID uint64, files []*multipart.FileHeader) (resp *file_resource.UploadAttachmentRes, err error) {

	fileResource, err := d.fileResourceRepo.GetById(ctx, ID)
	if err != nil {
		return nil, err
	}
	if fileResource.ID == 0 {
		return nil, errorcode.Desc(errorcode.PublicResourceNotExisted)
	}

	//已发布和审核中的文件资源不允许上传附件
	if fileResource.PublishStatus == constant.PublishStatusPublished || fileResource.AuditState == constant.AuditStatusAuditing {
		log.WithContext(ctx).Errorf("The file resource (id: %d) cannot upload file", ID)
		return nil, errorcode.Desc(errorcode.PublicAuditApplyNotAllowedError)
	}

	resp = &file_resource.UploadAttachmentRes{
		FileSuccess: make([]*file_resource.FileInfo, 0),
		FileFailed:  make([]string, 0),
	}

	//上传文件
	for _, file := range files {
		//check size
		if !validSize(file.Size) {
			log.WithContext(ctx).Errorf("The file (%s) size exceeds 10MB", file.Filename)
			resp.FileFailed = append(resp.FileFailed, file.Filename)
			continue
		}

		f, err := file.Open()
		if err != nil {
			log.WithContext(ctx).Errorf("The file (%s) failed to open", file.Filename)
			resp.FileFailed = append(resp.FileFailed, file.Filename)
			continue
		}
		defer f.Close()

		//get content
		bts, err := ioutil.ReadAll(f)
		if err != nil {
			log.WithContext(ctx).Errorf("Failed to obtain the contents of the file (%s)", file.Filename)
			resp.FileFailed = append(resp.FileFailed, file.Filename)
			continue
		}

		//upload
		uploadRes, err := d.fileMgnt.UploadFile(ctx, &basic_bigdata_service.UploadReq{
			Name:            file.Filename,
			Type:            basic_bigdata_service.EnumFileResource.String,
			RelatedObjectID: strconv.FormatUint(ID, 10),
			Content:         bts,
		})
		if err != nil {
			log.WithContext(ctx).Errorf("The file (%s) failed to be uploaded ", file.Filename)
			resp.FileFailed = append(resp.FileFailed, file.Filename)
			continue
		}
		resp.FileSuccess = append(resp.FileSuccess, &file_resource.FileInfo{OssID: uploadRes.OssID, Name: file.Filename})
	}
	return resp, nil
}

func (d *FileResourceDomain) PreviewPdf(ctx context.Context, req *file_resource.PreviewPdfReq) (res *file_resource.PreviewPdfRes, err error) {
	info, err := d.fileMgnt.PreviewPdfHref(ctx, &basic_bigdata_service.PreviewPdfReq{
		ID:        req.ID,
		PreviewID: req.PreviewID,
	})
	if err != nil {
		log.WithContext(ctx).Errorf("fileMgnt.PreviewPdfHref failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	res = &file_resource.PreviewPdfRes{
		ID:        info.ID,
		PreviewID: info.PreviewID,
		HrefUrl:   info.HrefUrl,
	}
	return res, nil
}

func (d *FileResourceDomain) DeleteAttachment(ctx context.Context, ID string) error {
	err := d.fileMgnt.DeleteFile(ctx, &basic_bigdata_service.DeleteReq{
		ID: ID,
	})
	if err != nil {
		log.WithContext(ctx).Errorf("fileMgnt.QueryPageFile failed: %v", err)
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	return nil
}

func (d *FileResourceDomain) AuditProcessMsgProc(ctx context.Context, msg *wf_common.AuditProcessMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditProcessMsgProc ", zap.Any("err", err))
		}
	}()
	fileResourceID, applySN, err := common.ParseAuditApplyID(msg.ProcessInputModel.Fields.ApplyID)
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
			log.WithContext(ctx).Infof("audit result flow_type: %v file_resource_id: %d audit_apply_sn: %s auto finished, do nothing", msg.ProcessDef.Category, fileResourceID, applySN)
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

	_, err = d.fileResourceRepo.AuditProcessMsgProc(ctx, fileResourceID, applySN, alterInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit result flow_type: %v file_resource_id: %d audit_apply_sn: %s alterInfo: %+v, err: %v", msg.ProcessDef.Category, fileResourceID, applySN, alterInfo, err)
	}
	return err
}

func (d *FileResourceDomain) AuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
	defer func() {
		if err := recover(); err != nil {
			log.WithContext(ctx).Error("[mq] AuditResult ", zap.Any("err", err))
		}
	}()
	log.WithContext(ctx).Infof("recv audit result type: %s apply_id: %s Result: %s", auditType, msg.ApplyID, msg.Result)
	fileResourceID, applySN, err := common.ParseAuditApplyID(msg.ApplyID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to parse audit result apply_id: %s, err: %v", msg.ApplyID, err)
		return err
	}
	alterInfo := map[string]interface{}{"updated_at": &util.Time{Time: time.Now()}}
	switch auditType {
	case constant.AuditTypeFileResourcePublish:
		switch msg.Result {
		case common.AUDIT_RESULT_PASS:
			alterInfo["audit_state"] = constant.AuditStatusPass
			alterInfo["audit_advice"] = ""
			alterInfo["publish_status"] = constant.PublishStatusPublished
			alterInfo["published_at"] = alterInfo["updated_at"]
		case common.AUDIT_RESULT_REJECT:
			alterInfo["audit_state"] = constant.AuditStatusReject
			alterInfo["publish_status"] = constant.PublishStatusPubReject
		case common.AUDIT_RESULT_UNDONE:
			alterInfo["audit_state"] = constant.AuditStatusUndone
			alterInfo["publish_status"] = constant.PublishStatusUnPublished
		default:
			log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
			return nil
		}
	}
	_, err = d.fileResourceRepo.AuditResultUpdate(ctx, fileResourceID, applySN, alterInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("[mq] Audit failed toAuditResultUpdate, err info: %v", err.Error())
		return err
	}
	if msg.Result == common.AUDIT_RESULT_PASS { // 发布成功，创建数据资源
		fileResource, err := d.fileResourceRepo.GetById(ctx, fileResourceID)
		if err != nil {
			return err
		}
		if err = d.dataResourceRepo.Create(ctx, &model.TDataResource{
			ResourceId:   strconv.FormatUint(fileResourceID, 10),
			Name:         fileResource.Name,
			Code:         fileResource.Code,
			Type:         domain.ResourceTypeFileResource,
			DepartmentId: fileResource.DepartmentID,
			SubjectId:    "",
			PublishAt:    fileResource.PublishedAt,
			Status:       constant.ReSourceTypeNormal,
		}); err != nil {
			log.WithContext(ctx).Errorf("[mq] FileResourceDomain Audit failed dataResourceRepo Create, err info: %v", err.Error())
			return err
		}
	}
	return nil
}

func (d *FileResourceDomain) AuditProcessDelMsgProc(ctx context.Context, auditType string, msg *wf_common.AuditProcDefDelMsg) error {
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

	_, err := d.fileResourceRepo.UpdateAuditStateByProcDefKey(ctx, msg.ProcDefKeys)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to update audit type: %s proc_def_keys: %v related unfinished audit process to reject status, err: %v",
			auditType, msg.ProcDefKeys, err)
	}
	return err
}
