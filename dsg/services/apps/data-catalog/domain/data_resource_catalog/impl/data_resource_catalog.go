package impl

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/virtual_engine"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/file_resource"
	"github.com/kweaver-ai/idrm-go-common/rest/task_center"

	"github.com/samber/lo"
	"github.com/shopspring/decimal"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	catalog_column "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_column"
	stats_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_stats_info"
	data_resource_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	open_catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/open_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	common_errorcode "github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DataResourceCatalogDomain struct {
	//catalogRepo               catalog.RepoOp
	dataResourceRepo          data_resource_repo.DataResourceRepo
	configurationCenterDriven configuration_center.Driven
	dataSubjectDriven         data_subject.Driven
	catalogRepo               catalog_repo.DataResourceCatalogRepo
	oldCatalogRepo            catalog.RepoOp
	columnRepo                catalog_column.RepoOp
	standardDriven            standardization.Driven
	applicationServiceDriven  data_application_service.Driven
	wf                        workflow.WorkflowInterface
	es                        es.ESRepo
	categoryRepo              category.Repo
	categoryNodeRepo          category.TreeRepo
	statsRepo                 stats_info.RepoOp
	dataViewDriven            data_view.Driven
	openCatalogRepo           open_catalog_repo.OpenCatalogRepo
	dataComprehensionRepo     data_comprehension.RepoOp
	myFavoriteRepo            my_favorite.Repo
	catalogFeedbackRepo       catalog_feedback.Repo
	fileResourceRepo          file_resource.FileResourceRepo
	taskDriven                task_center.Driven
	virtualEngineDriven       virtual_engine.Driven
	departmentDomain          *common.DepartmentDomain
}

func NewDataResourceCatalogDomain(
	//catalogRepo catalog.RepoOp,
	dataResourceRepo data_resource_repo.DataResourceRepo,
	configurationCenterDriven configuration_center.Driven,
	dataSubjectDriven data_subject.Driven,
	catalogRepo catalog_repo.DataResourceCatalogRepo,
	oldCatalogRepo catalog.RepoOp,
	columnRepo catalog_column.RepoOp,
	standardDriven standardization.Driven,
	applicationServiceDriven data_application_service.Driven,
	wf workflow.WorkflowInterface,
	es es.ESRepo,
	categoryRepo category.Repo,
	categoryNodeRepo category.TreeRepo,
	statsRepo stats_info.RepoOp,
	dataViewDriven data_view.Driven,
	openCatalogRepo open_catalog_repo.OpenCatalogRepo,
	dataComprehensionRepo data_comprehension.RepoOp,
	myFavoriteRepo my_favorite.Repo,
	catalogFeedbackRepo catalog_feedback.Repo,
	fileResourceRepo file_resource.FileResourceRepo,
	taskDriven task_center.Driven,
	virtualEngineDriven virtual_engine.Driven,
	departmentDomain *common.DepartmentDomain,
) data_resource_catalog.DataResourceCatalogDomain {
	return &DataResourceCatalogDomain{
		//catalogRepo:               catalogRepo,
		dataResourceRepo:          dataResourceRepo,
		configurationCenterDriven: configurationCenterDriven,
		dataSubjectDriven:         dataSubjectDriven,
		catalogRepo:               catalogRepo,
		oldCatalogRepo:            oldCatalogRepo,
		columnRepo:                columnRepo,
		standardDriven:            standardDriven,
		applicationServiceDriven:  applicationServiceDriven,
		wf:                        wf,
		es:                        es,
		categoryRepo:              categoryRepo,
		categoryNodeRepo:          categoryNodeRepo,
		statsRepo:                 statsRepo,
		dataViewDriven:            dataViewDriven,
		openCatalogRepo:           openCatalogRepo,
		dataComprehensionRepo:     dataComprehensionRepo,
		myFavoriteRepo:            myFavoriteRepo,
		catalogFeedbackRepo:       catalogFeedbackRepo,
		fileResourceRepo:          fileResourceRepo,
		taskDriven:                taskDriven,
		virtualEngineDriven:       virtualEngineDriven,
		departmentDomain:          departmentDomain,
	}
}
func NewDataResourceCatalogInternal(src data_resource_catalog.DataResourceCatalogDomain) data_resource_catalog.DataResourceCatalogInternal {
	dst, ok := src.(data_resource_catalog.DataResourceCatalogInternal)
	if ok {
		return dst
	}
	panic("Conversion failed: data_resource_catalog.DataResourceCatalogDomain does not implement data_resource_catalog.DataResourceCatalogInternal")
}

func (d *DataResourceCatalogDomain) SaveDataCatalogDraft(ctx context.Context, req *data_resource_catalog.SaveDataCatalogDraftReqBody) (resp *data_resource_catalog.IDResp, err error) {
	userInfo := request.GetUserInfo(ctx)
	/*if req.UpdateOnly && req.CatalogID.Uint64() != 0 { //直接更新，不审核草稿
		if err = d.UpdateDataCatalog(ctx, &model.TDataCatalog{
			ID:                 req.CatalogID.Uint64(),
			AppSceneClassify:   req.AppSceneClassify,
			DataRelatedMatters: req.DataRelatedMatters,
			Description:        req.Description,
			SharedType:         req.SharedType,
			OpenType:           req.OpenType,
			PhysicalDeletion:   req.PhysicalDeletion,
			SyncMechanism:      req.SyncMechanism,
			SyncFrequency:      req.SyncFrequency,
			UpdaterUID:         userInfo.ID,
		}, req.CategoryNodeIds, req.InfoSystemID, req.SubjectID); err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		//d.PushCatalogToEs(ctx)
		return &data_resource_catalog.IDResp{ID: req.CatalogID.String()}, nil
	}*/
	// if err = data_resource_catalog.CheckColumnValid(req.Columns); err != nil {
	// 	return nil, err
	// }
	/*dirDepart, err := d.departmentDomain.UserInMainDepart(ctx, req.DepartmentID)
	if err != nil || !dirDepart {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "department_id not main depart")
	}
	*/
	var catalogID uint64
	var isPublish bool
	var changeFlag bool
	var oldCatalog *model.TDataCatalog
	if req.CatalogID.Uint64() == 0 { //未发布 创建草稿
		catalogID, _ = utils.GetUniqueID()
	} else { //已创建 暂存
		catalogID = req.CatalogID.Uint64()
		oldCatalog, err = d.catalogRepo.Get(ctx, catalogID)
		if err != nil {
			return nil, err
		}
		_, isPublish = constant.PublishedMap[oldCatalog.PublishStatus]
		if isPublish { //暂存创建编辑草稿副本直接使用DraftID
			changeFlag = true
			if oldCatalog.DraftID == 0 { //发布 创建草稿副本
				catalogID, _ = utils.GetUniqueID()
			} else { //发布 草稿副本暂存草稿副本
				catalogID = oldCatalog.DraftID
			}
		}
	}
	addResources, err := d.verifyDataResource(ctx, req.SourceDepartmentID, req.MountResources, changeFlag)
	if err != nil {
		return nil, err
	}
	req.MountResources = append(req.MountResources, addResources...)

	// region catalogCategory 填充
	catalogCategory, esObjects, esCateInfos, err := d.genCatalogCategory(ctx, catalogID, req.DepartmentID, req.InfoSystemID, req.SubjectID, req.CategoryNodeIds, false)
	if err != nil {
		return nil, err
	}
	//endregion

	openSSZD, err := d.configurationCenterDriven.GetGlobalSwitch(ctx, constant.SSZDOpenKey)
	if err != nil {
		return nil, errorcode.Desc(common_errorcode.ConfigurationServiceInternalError)
	}
	if openSSZD {
		log.WithContext(ctx).Infof("sszd open", zap.Bool("sszd", openSSZD))
	}

	// 填充字段信息
	catalogColumn, columnUnshared, err := d.genCatalogColumnDraft(ctx, catalogID, req.Columns, openSSZD)
	if err != nil {
		return nil, err
	}

	dataCatalog, err := d.genCatalogDraft(ctx, userInfo, catalogID, req, openSSZD)
	if err != nil {
		return nil, err
	}
	dataCatalog.ColumnUnshared = columnUnshared

	esResource, apiParams, modelResource := d.genMountResources(ctx, catalogID, req.MountResources, openSSZD)

	//region 生成编码规则
	if req.CatalogID.Uint64() == 0 {
		codeList, err := d.configurationCenterDriven.Generate(ctx, configuration_center.GenerateCodeIdDataCatalog, 1)
		if err != nil {
			return nil, err
		}
		if codeList != nil && len(codeList.Entries) != 0 {
			dataCatalog.Code = codeList.Entries[0]
		} else {
			return nil, errorcode.Desc(common_errorcode.GenerateCodeError)
		}
	}
	//endregion

	/* tips
	未发布，暂存取名草稿catalog，只有草稿catalog，draft_id为空
	发布，暂存取名草稿副本catalog，包含发布catalog和草稿副本catalog两个，发布catalog的draft_id为草稿副本catalog的id
	草稿catalog可以变为发布catalog，草稿副本catalog只能查询和保存的时候被删除
	*/
	var push bool
	switch {
	case req.CatalogID.Uint64() == 0:
		//未发布 创建草稿
		err = d.catalogRepo.CreateTransaction(ctx, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn)
		push = true
	case isPublish:
		//发布 创建草稿副本
		if oldCatalog.DraftID == 0 {
			err = d.catalogRepo.CreateDraftCopyTransaction(ctx, oldCatalog.ID, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn, openSSZD)
		} else { //发布 草稿副本暂存草稿副本
			dataCatalog.DraftID = constant.DraftFlag
			err = d.catalogRepo.SaveDraftCopyTransaction(ctx, oldCatalog.ID, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn, openSSZD)
		}
	default: //未发布 草稿暂存草稿
		err = d.catalogRepo.SaveTransaction(ctx, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn, openSSZD)
		push = true
	}
	if err != nil {
		if errors.Is(err, catalog_repo.NameRepeat) {
			return nil, errorcode.Desc(errorcode.CatalogNameRepeat)
		}
		if errors.Is(err, catalog_repo.DataResourceNotExist) {
			return nil, errorcode.Desc(errorcode.DataResourceNotExist)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	if push {
		catalogPub, err := d.catalogRepo.Get(ctx, dataCatalog.ID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get catalog info by catalogID: %d, err info: %v", dataCatalog.ID, err.Error())
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		err = d.es.PubToES(ctx, catalogPub, esResource, esObjects, esCateInfos, catalogColumn) //创建推送
		if err != nil {
			return nil, err
		}
	}

	return &data_resource_catalog.IDResp{
		ID: util.CE(req.CatalogID.Uint64() == 0,
			strconv.FormatUint(catalogID, 10),
			req.CatalogID.String()).(string),
	}, nil
}

func (d *DataResourceCatalogDomain) verifyDataResource(ctx context.Context, sourceDepartmentID string, resources []*data_resource_catalog.MountResource, changeFlag bool) (addResources []*data_resource_catalog.MountResource, err error) {
	var mountViewCount int
	mountViewIds := make(map[string]bool)
	resourceIDs := make([]string, len(resources))
	for i, re := range resources {
		switch re.ResourceType {
		case constant.MountView:
			mountViewCount++
			if mountViewCount > 1 {
				return addResources, errorcode.Detail(errorcode.PublicInvalidParameter, "mount_resources.resource_type  1：逻辑视图  只能挂载一个逻辑视图")
			}
			mountViewIds[re.ResourceID] = true
			//if _, err = d.dataViewDriven.GetDataViewDetails(ctx, resources.ResourceID[0]); err != nil {
			//	return err
			//}

		case constant.MountAPI:
			//for _, resourceID := range resources.ResourceID {
			//	if _, err = d.applicationServiceDriven.InternalGetServiceDetail(ctx, resourceID); err != nil {
			//		return err
			//	}
			//}

		case constant.MountFile:
			//fileResourceId, err := strconv.ParseUint(resources.ResourceID[0], 10, 64)
			//if err != nil {
			//	panic(err)
			//}
			//if _, err = d.fileResourceRepo.GetById(ctx, fileResourceId); err != nil {
			//	return err
			//}
		default:
			return addResources, errorcode.Detail(errorcode.PublicInvalidParameter, "mount_resources.resource_type must 1：逻辑视图 2：接口 3:文件资源 ")
		}
		resourceIDs[i] = re.ResourceID
	}
	dataResources, err := d.dataResourceRepo.GetByResourceIds(ctx, resourceIDs, 0, nil)
	if err != nil {
		return addResources, err
	}
	/*	if len(dataResources) != len(resources) {
		return addResources, errorcode.Detail(errorcode.PublicInvalidParameter, "mount_resources.resource_type  资源校验失败,资源已挂载")
	}*/
	if changeFlag && mountViewCount > 0 { //逻辑视图不能更换
		var mountViewCountO int
		for _, resource := range dataResources {
			if resource.Type == constant.MountView {
				mountViewCountO++
				if !mountViewIds[resource.ResourceId] {
					return addResources, errorcode.Detail(errorcode.PublicInvalidParameter, "mount_resources.resource_type 逻辑视图不能更换")
				}
			}
		}
		if mountViewCount != mountViewCountO {
			return addResources, errorcode.Detail(errorcode.PublicInvalidParameter, "mount_resources.resource_type 逻辑视图不能更换")
		}
	}
	addResources = make([]*data_resource_catalog.MountResource, 0)
	for _, resource := range dataResources {
		if resource.DepartmentId != "" && resource.Type == constant.MountView && resource.DepartmentId != sourceDepartmentID {
			return addResources, errorcode.Detail(errorcode.PublicInvalidParameter, "数据资源来源部门id不正确 ")
		}
		if resource.Type == constant.MountView && resource.InterfaceCount > 0 {
			viewInterfaces, err := d.dataResourceRepo.GetViewInterface(ctx, resource.ResourceId, false)
			if err != nil {
				return nil, err
			}
			for _, viewInterface := range viewInterfaces {
				addResources = append(addResources, &data_resource_catalog.MountResource{
					ResourceType: constant.MountAPI,
					ResourceID:   viewInterface.ResourceId,
				})
			}

		}
	}

	return addResources, nil
}
func (d *DataResourceCatalogDomain) genMountResources(ctx context.Context, catalogID uint64, resources []*data_resource_catalog.MountResource, openSSZD bool) (mountResources []*es.MountResources, apiParams []*model.TApi, dataResource []*model.TDataResource) {
	esMountResourceMap := make(map[string][]string)
	for _, resource := range resources {
		var t string
		switch resource.ResourceType {
		case constant.MountView:
			t = "data_view"
		case constant.MountAPI:
			t = "interface_svc"
		case constant.MountFile:
			t = "file"
		case constant.MountIndicator:
			t = "indicator"
		}
		if _, exist := esMountResourceMap[t]; !exist {
			esMountResourceMap[t] = make([]string, 0)
		}
		esMountResourceMap[t] = append(esMountResourceMap[t], resource.ResourceID)
		dataResource = append(dataResource, &model.TDataResource{
			ResourceId:     resource.ResourceID,
			Type:           resource.ResourceType,
			RequestFormat:  resource.RequestFormat,
			ResponseFormat: resource.ResponseFormat,
			CatalogID:      catalogID,
			SchedulingPlan: resource.SchedulingPlan,
			Interval:       resource.Interval,
			Time:           resource.Time,
		})

		if openSSZD && resource.ResourceType == constant.MountAPI {
			//apiParams = make([]*model.TApi, len(resource.RequestBody)+len(resource.ResponseBody))
			for _, body := range resource.RequestBody {
				//apiParams[i] = &model.TApi{
				apiParams = append(apiParams, &model.TApi{
					CatalogID:  catalogID,
					BodyType:   constant.BodyTypeReq,
					ParamType:  body.Type,
					Name:       body.Name,
					IsArray:    body.IsArray,
					HasContent: body.HasContent,
				})
			}
			for _, body := range resource.ResponseBody {
				//apiParams[len(resource.RequestBody)+i] = &model.TApi{
				apiParams = append(apiParams, &model.TApi{
					CatalogID:  catalogID,
					BodyType:   constant.BodyTypeRes,
					ParamType:  body.Type,
					Name:       body.Name,
					IsArray:    body.IsArray,
					HasContent: body.HasContent,
				})
			}
		}
	}
	for k, v := range esMountResourceMap {
		mountResources = append(mountResources, &es.MountResources{Type: k, IDs: v})
	}
	return
}

func (d *DataResourceCatalogDomain) genCatalogDraft(ctx context.Context, userInfo *middleware.User, catalogID uint64, req *data_resource_catalog.SaveDataCatalogDraftReqBody, openSSZD bool) (*model.TDataCatalog, error) {
	if req.SourceDepartmentID != "" {
		departmentRes, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{req.SourceDepartmentID})
		if err != nil {
			return nil, err
		}
		if len(departmentRes.Departments) != 1 || departmentRes.Departments[0].ID != req.SourceDepartmentID || departmentRes.Departments[0].DeletedAt != 0 {
			return nil, errorcode.Detail(errorcode.DataCatalogDepartmentNotFound, "source_department_id")
		}
	}
	if req.DataClassify != "" {
		if err := d.VerifyDataClassification(ctx, req.DataClassify); err != nil {
			return nil, err
		}
	}
	var businessMatterIDS string
	if len(req.BusinessMatters) != 0 {
		matters, err := d.configurationCenterDriven.GetBusinessMatters(ctx, req.BusinessMatters)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
		}
		if len(matters) != len(req.BusinessMatters) {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "business_matters error")
		}
		businessMatterIDS = strings.Join(req.BusinessMatters, ",")
	}
	dataCatalog := &model.TDataCatalog{
		ID:                  catalogID,
		Title:               req.Name,
		GroupID:             0,
		GroupName:           "",
		ThemeID:             0,
		ThemeName:           "",
		ForwardVersionID:    0,
		Description:         req.Description,
		DataRange:           req.DataRange,
		UpdateCycle:         req.UpdateCycle,
		SharedType:          req.SharedType,
		SharedCondition:     req.SharedCondition,
		OpenType:            req.OpenType,
		OpenCondition:       req.OpenCondition,
		SharedMode:          req.SharedMode,
		PhysicalDeletion:    req.PhysicalDeletion,
		SyncMechanism:       req.SyncMechanism,
		SyncFrequency:       req.SyncFrequency,
		DepartmentID:        req.DepartmentID,
		CreatorUID:          userInfo.ID,
		UpdaterUID:          userInfo.ID,
		Source:              0,
		TableType:           0,
		CurrentVersion:      nil,
		PublishFlag:         req.PublishFlag,
		DataKindFlag:        nil,
		LabelFlag:           nil,
		SrcEventFlag:        nil,
		RelEventFlag:        nil,
		SystemFlag:          nil,
		RelCatalogFlag:      nil,
		IsCanceled:          nil,
		AppSceneClassify:    req.AppSceneClassify,
		SourceDepartmentID:  req.SourceDepartmentID,
		DataRelatedMatters:  req.DataRelatedMatters,
		BusinessMatters:     businessMatterIDS,
		DataClassify:        req.DataClassify,
		TimeRange:           req.TimeRange,
		OperationAuthorized: req.OperationAuthorized,
		IsImport:            req.IsImport,
	}
	for _, resource := range req.MountResources {
		switch resource.ResourceType {
		case constant.MountView:
			dataCatalog.ViewCount++
		case constant.MountAPI:
			dataCatalog.ApiCount++
		case constant.MountFile:
			dataCatalog.FileCount++
		case constant.MountIndicator:
		}
	}
	if openSSZD {
		dataCatalog.OtherUpdateCycle = util.CE(req.UpdateCycle == 8, req.OtherUpdateCycle, "").(string)
		dataCatalog.OthersAppSceneClassify = util.CE(req.AppSceneClassify != nil && *req.AppSceneClassify == 4, req.OtherAppSceneClassify, "").(string)
		dataCatalog.DataDomain = req.DataDomain
		dataCatalog.DataLevel = req.DataLevel
		dataCatalog.TimeRange = req.TimeRange
		dataCatalog.ProviderChannel = req.ProviderChannel
		dataCatalog.AdministrativeCode = req.AdministrativeCode
		dataCatalog.CentralDepartmentCode = req.CentralDepartmentCode
		dataCatalog.ProcessingLevel = req.ProcessingLevel
		dataCatalog.CatalogTag = req.CatalogTag
		dataCatalog.IsElectronicProof = req.IsElectronicProof
	}
	return dataCatalog, nil
}

func (d *DataResourceCatalogDomain) VerifyDataClassification(ctx context.Context, dataClassificationId string) error {
	dataClassifyDictItems, err := d.configurationCenterDriven.GetGradeLabel(ctx, nil)
	if err != nil {
		return err
	}
	dataClassifyDictItemMap := make(map[string]string)
	recursionIDName(dataClassifyDictItems.GradeLabel, dataClassifyDictItemMap)
	if _, exist := dataClassifyDictItemMap[dataClassificationId]; !exist {
		return errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("validation failed: %v", "数据分级不正确"))
	}
	return nil
}
func (d *DataResourceCatalogDomain) genCatalog(ctx context.Context, userInfo *middleware.User, catalogID uint64, req *data_resource_catalog.SaveDataCatalogReqBody, openSSZD bool) (*model.TDataCatalog, error) {
	if req.SourceDepartmentID != "" {
		departmentRes, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{req.SourceDepartmentID})
		if err != nil {
			return nil, err
		}
		if len(departmentRes.Departments) != 1 || departmentRes.Departments[0].ID != req.SourceDepartmentID || departmentRes.Departments[0].DeletedAt != 0 {
			return nil, errorcode.Detail(errorcode.DataCatalogDepartmentNotFound, "source_department_id")
		}
	}
	if req.DataClassify != "" {
		if err := d.VerifyDataClassification(ctx, req.DataClassify); err != nil {
			return nil, err
		}
	}
	var businessMatterIDS string
	if len(req.BusinessMatters) != 0 {
		matters, err := d.configurationCenterDriven.GetBusinessMatters(ctx, req.BusinessMatters)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
		}
		if len(matters) != len(req.BusinessMatters) {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "business_matters error")
		}
		businessMatterIDS = strings.Join(req.BusinessMatters, ",")
	}
	dataCatalog := &model.TDataCatalog{
		ID:                  catalogID,
		Title:               req.Name,
		GroupID:             0,
		GroupName:           "",
		ThemeID:             0,
		ThemeName:           "",
		ForwardVersionID:    0,
		Description:         req.Description,
		DataRange:           req.DataRange,
		UpdateCycle:         req.UpdateCycle,
		SharedType:          req.SharedType,
		SharedCondition:     req.SharedCondition,
		OpenType:            req.OpenType,
		OpenCondition:       req.OpenCondition,
		SharedMode:          req.SharedMode,
		PhysicalDeletion:    req.PhysicalDeletion,
		SyncMechanism:       req.SyncMechanism,
		SyncFrequency:       req.SyncFrequency,
		DepartmentID:        req.DepartmentID,
		CreatorUID:          userInfo.ID,
		UpdaterUID:          userInfo.ID,
		Source:              0,
		TableType:           0,
		CurrentVersion:      nil,
		PublishFlag:         req.PublishFlag,
		DataKindFlag:        nil,
		LabelFlag:           nil,
		SrcEventFlag:        nil,
		RelEventFlag:        nil,
		SystemFlag:          nil,
		RelCatalogFlag:      nil,
		IsCanceled:          nil,
		AppSceneClassify:    req.AppSceneClassify,
		SourceDepartmentID:  req.SourceDepartmentID,
		DataRelatedMatters:  req.DataRelatedMatters,
		BusinessMatters:     businessMatterIDS,
		DataClassify:        req.DataClassify,
		TimeRange:           req.TimeRange,
		OperationAuthorized: req.OperationAuthorized,
	}
	for _, resource := range req.MountResources {
		switch resource.ResourceType {
		case constant.MountView:
			dataCatalog.ViewCount++
		case constant.MountAPI:
			dataCatalog.ApiCount++
		case constant.MountFile:
			dataCatalog.FileCount++
		case constant.MountIndicator:
		}
	}

	if openSSZD {
		if req.UpdateCycle == 8 && req.OtherUpdateCycle == "" {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "other_update_cycle required")
		}
		if (req.AppSceneClassify != nil && *req.AppSceneClassify == 4) && req.OtherAppSceneClassify == "" {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "other_app_scene_classify required")
		}
		dataCatalog.OtherUpdateCycle = req.OtherUpdateCycle
		dataCatalog.OthersAppSceneClassify = req.OtherAppSceneClassify
		dataCatalog.DataDomain = req.DataDomain
		dataCatalog.DataLevel = req.DataLevel
		dataCatalog.TimeRange = req.TimeRange
		dataCatalog.ProviderChannel = req.ProviderChannel
		dataCatalog.AdministrativeCode = req.AdministrativeCode
		dataCatalog.CentralDepartmentCode = req.CentralDepartmentCode
		dataCatalog.ProcessingLevel = req.ProcessingLevel
		dataCatalog.CatalogTag = req.CatalogTag
		dataCatalog.IsElectronicProof = req.IsElectronicProof
	}
	return dataCatalog, nil
}

func (d *DataResourceCatalogDomain) genCatalogColumnDraft(ctx context.Context, catalogId uint64, columns []*data_resource_catalog.ColumnInfoDraft, openSSZD bool) ([]*model.TDataCatalogColumn, bool, error) {
	var columnUnshared bool
	catalogColumn := make([]*model.TDataCatalogColumn, 0)
	for i, column := range columns {
		columnTmp := &model.TDataCatalogColumn{
			ID:            column.ID.Uint64(),
			CatalogID:     catalogId,
			TechnicalName: column.TechnicalName,
			BusinessName:  column.BusinessName,
			SourceID:      column.SourceID,
			DataFormat:    column.DataFormat,
			Ranges:        column.DataRange,
			SharedType:    column.SharedType,
			OpenType:      column.OpenType,
			NullFlag:      nil,
			Description:   "",
			AIDescription: "",
			//SharedCondition: column.SharedCondition,
			OpenCondition: column.OpenCondition,
			StandardCode: sql.NullString{
				String: column.StandardCode,
				Valid:  true,
			},
			CodeTableID: sql.NullString{
				String: column.CodeTableID,
				Valid:  true,
			},
			SourceSystem: column.SourceSystem,
			Index:        i,
		}
		columnTmp.DataLength, columnTmp.DataPrecision = data_resource_catalog.DataLengthPrecisionProc(column)
		if column.TimestampFlag != nil {
			columnTmp.TimestampFlag = sql.NullInt16{
				Int16: *column.TimestampFlag,
				Valid: true,
			}
		}
		if column.PrimaryFlag != nil {
			columnTmp.PrimaryFlag = sql.NullInt16{
				Int16: *column.PrimaryFlag,
				Valid: true,
			}
		}
		if column.ClassifiedFlag != nil {
			columnTmp.ClassifiedFlag = sql.NullInt16{
				Int16: *column.ClassifiedFlag,
				Valid: true,
			}
		}
		if column.SensitiveFlag != nil {
			columnTmp.SensitiveFlag = sql.NullInt16{
				Int16: *column.SensitiveFlag,
				Valid: true,
			}
		}
		if openSSZD {
			columnTmp.SourceSystem = column.SourceSystem
			columnTmp.SourceSystemLevel = column.SourceSystemLevel
			//columnTmp.InfoItemLevel = column.InfoItemLevel
		}
		catalogColumn = append(catalogColumn, columnTmp)
		if column.SharedType == 3 {
			columnUnshared = true
		}
	}

	//region 验证码表和数据标准
	CodeTableIDs := make([]string, 0)
	StandardCodes := make([]string, 0)
	for _, column := range columns {
		if column.CodeTableID != "" {
			CodeTableIDs = append(CodeTableIDs, column.CodeTableID)
		}
		if column.StandardCode != "" {
			StandardCodes = append(StandardCodes, column.StandardCode)
		}
	}
	if err := d.VerifyStandard(ctx, CodeTableIDs, StandardCodes); err != nil {
		return nil, false, err
	}
	//endregion
	return catalogColumn, columnUnshared, nil
}
func (d *DataResourceCatalogDomain) VerifyStandard(ctx context.Context, CodeTableIDs []string, StandardCodes []string) error {
	CodeTableIDs = util.DuplicateStringRemoval(CodeTableIDs)
	StandardCodes = util.DuplicateStringRemoval(StandardCodes)
	if len(CodeTableIDs) != 0 {
		log.WithContext(ctx).Infof("verify CodeTableIDs :%+v", CodeTableIDs)
		CodeTables, err := d.standardDriven.GetStandardDict(ctx, CodeTableIDs)
		if err != nil {
			return err
		} else if len(CodeTables) != len(CodeTableIDs) {
			return errorcode.Desc(errorcode.CodeTableIDsVerifyFail)
		}
		for _, codeTables := range CodeTables {
			if codeTables.Deleted == true {
				return errorcode.Desc(errorcode.CodeTableIDsVerifyFail)
			}
		}
	}
	if len(StandardCodes) != 0 {
		log.WithContext(ctx).Infof("verify StandardCodes :%+v", StandardCodes)
		Standards, err := d.standardDriven.GetDataElementDetailByCode(ctx, StandardCodes...)
		if err != nil {
			return err
		} else if len(Standards) != len(StandardCodes) {
			return errorcode.Desc(errorcode.StandardCodesVerifyFail)
		}
		for _, standard := range Standards {
			if standard.Deleted == true {
				return errorcode.Desc(errorcode.StandardCodesVerifyFail)
			}
		}
	}
	return nil
}
func (d *DataResourceCatalogDomain) genCatalogColumn(ctx context.Context, catalogId uint64, columns []*data_resource_catalog.ColumnInfo, openSSZD bool) ([]*model.TDataCatalogColumn, bool, error) {
	/*	viewFields, err := d.dataViewDriven.GetDataViewField(ctx, req.MountResources.ResourceID)
		if err != nil {
			return nil, err
		}
		viewFieldMap := make(map[string]bool, len(viewFields.FieldsRes))
		for _, viewField := range viewFields.FieldsRes {
			viewFieldMap[viewField.ID] = true
		}*/
	var columnUnshared bool
	catalogColumn := make([]*model.TDataCatalogColumn, 0)
	for i, column := range columns {
		columnTmp := &model.TDataCatalogColumn{
			ID:            column.ID.Uint64(),
			CatalogID:     catalogId,
			TechnicalName: column.TechnicalName,
			BusinessName:  column.BusinessName,
			SourceID:      column.SourceID,
			DataFormat:    column.DataFormat,
			Ranges:        column.DataRange,
			SharedType:    column.SharedType,
			OpenType:      column.OpenType,
			NullFlag:      nil,
			Description:   "",
			AIDescription: "",
			//SharedCondition: column.SharedCondition,
			OpenCondition: column.OpenCondition,
			StandardCode: sql.NullString{
				String: column.StandardCode,
				Valid:  true,
			},
			CodeTableID: sql.NullString{
				String: column.CodeTableID,
				Valid:  true,
			},
			SourceSystem: column.SourceSystem,
			Index:        i,
		}
		if !openSSZD && column.SharedType == 0 {
			return nil, false, errorcode.Detail(errorcode.PublicInvalidParameter, "shared_type为必填字段")
		}
		columnTmp.DataLength, columnTmp.DataPrecision = data_resource_catalog.DataLengthPrecisionProc(column)
		if column.TimestampFlag != nil {
			columnTmp.TimestampFlag = sql.NullInt16{
				Int16: *column.TimestampFlag,
				Valid: true,
			}
		}
		if column.PrimaryFlag != nil {
			columnTmp.PrimaryFlag = sql.NullInt16{
				Int16: *column.PrimaryFlag,
				Valid: true,
			}
		}
		if column.ClassifiedFlag != nil {
			columnTmp.ClassifiedFlag = sql.NullInt16{
				Int16: *column.ClassifiedFlag,
				Valid: true,
			}
		}
		if column.SensitiveFlag != nil {
			columnTmp.SensitiveFlag = sql.NullInt16{
				Int16: *column.SensitiveFlag,
				Valid: true,
			}
		}
		if openSSZD {
			columnTmp.SourceSystem = column.SourceSystem
			columnTmp.SourceSystemLevel = column.SourceSystemLevel
			//columnTmp.InfoItemLevel = column.InfoItemLevel
		}
		catalogColumn = append(catalogColumn, columnTmp)
		if column.SharedType == 3 {
			columnUnshared = true
		}
	}

	//region 验证码表和数据标准
	CodeTableIDs := make([]string, 0)
	StandardCodes := make([]string, 0)
	for _, column := range columns {
		if column.CodeTableID != "" {
			CodeTableIDs = append(CodeTableIDs, column.CodeTableID)
		}
		if column.StandardCode != "" {
			StandardCodes = append(StandardCodes, column.StandardCode)
		}
	}
	if err := d.VerifyStandard(ctx, CodeTableIDs, StandardCodes); err != nil {
		return nil, false, err
	}
	//endregion
	return catalogColumn, columnUnshared, nil
}
func (d *DataResourceCatalogDomain) genCatalogCategory(ctx context.Context, catalogId uint64, departmentID string, infoSystemID string, subjectIDs []string, categoryNodes []string, verify bool) ([]*model.TDataCatalogCategory, []*es.BusinessObject, []*es.CateInfo, error) {
	var departmentCateUsing, infoSystemCateUsing bool

	categoryList, err := d.categoryRepo.GetCategoryByIDs(ctx, []string{constant.InfoSystemCateId, constant.DepartmentCateId})
	if err != nil {
		return nil, nil, nil, err
	}
	for _, category := range categoryList {
		if category.CategoryID == constant.DepartmentCateId && category.Using == 1 {
			if category.Required == 1 && departmentID == "" && verify {
				//return nil, nil, nil, errorcode.Detail(errorcode.PublicInvalidParameter, "department_id is required")
			}
			departmentCateUsing = true
		}

		if category.CategoryID == constant.InfoSystemCateId && category.Using == 1 {
			if category.Required == 1 && infoSystemID == "" && verify {
				//return nil, nil, nil, errorcode.Detail(errorcode.PublicInvalidParameter, "info_system_id is required") 临时不校验
			}
			infoSystemCateUsing = true
		}
	}

	catalogCategory := make([]*model.TDataCatalogCategory, 0)
	objects := make([]*es.BusinessObject, 0)
	cateInfos := make([]*es.CateInfo, 0)
	if departmentCateUsing && departmentID != "" {
		departmentRes, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{departmentID})
		if err != nil {
			return nil, nil, nil, err
		}
		if len(departmentRes.Departments) != 1 || departmentRes.Departments[0].ID != departmentID || departmentRes.Departments[0].DeletedAt != 0 {
			return nil, nil, nil, errorcode.Desc(errorcode.DataCatalogDepartmentNotFound)
		}
		catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
			CategoryID:   departmentID,
			CategoryType: constant.CategoryTypeDepartment,
			CatalogID:    catalogId,
		})
		cateInfos = append(cateInfos, &es.CateInfo{
			CateId:   constant.DepartmentCateId,
			NodeId:   departmentID,
			NodeName: departmentRes.Departments[0].Name,
			NodePath: departmentRes.Departments[0].Path,
		})
	}
	if infoSystemCateUsing && infoSystemID != "" {
		infoSystemRes, err := d.configurationCenterDriven.GetInfoSystemsPrecision(ctx, []string{infoSystemID}, nil)
		if err != nil {
			return nil, nil, nil, err
		}
		if len(infoSystemRes) != 1 || infoSystemRes[0].ID != infoSystemID {
			return nil, nil, nil, errorcode.Desc(errorcode.DataCatalogInfoSystemNotFound)
		}
		catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
			CategoryID:   infoSystemID,
			CategoryType: constant.CategoryTypeInfoSystem,
			CatalogID:    catalogId,
		})
		cateInfos = append(cateInfos, &es.CateInfo{
			CateId:   constant.InfoSystemCateId,
			NodeId:   infoSystemID,
			NodeName: infoSystemRes[0].Name,
		})
	}
	if len(subjectIDs) != 0 {
		subjectIDs, contains := reduceOtherSubject(subjectIDs)
		if len(subjectIDs) != 0 {
			dataSubjects, err := d.dataSubjectDriven.GetDataSubjectByID(ctx, subjectIDs)
			if err != nil {
				return nil, nil, nil, err
			}
			if len(dataSubjects.Objects) != len(subjectIDs) {
				return nil, nil, nil, errorcode.Desc(errorcode.DataCatalogSubjectNotFound)
			}
			for _, subject := range dataSubjects.Objects {
				catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
					CategoryID:   subject.ID,
					CategoryType: constant.CategoryTypeSubject,
					CatalogID:    catalogId,
				})
				objects = append(objects, &es.BusinessObject{
					ID:     subject.ID,
					Name:   subject.Name,
					Path:   subject.PathName,
					PathID: subject.PathID,
				})
			}
		}
		if contains {
			catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
				CategoryID:   constant.OtherSubject,
				CategoryType: constant.CategoryTypeSubject,
				CatalogID:    catalogId,
			})
			objects = append(objects, &es.BusinessObject{
				ID:   constant.OtherSubject,
				Name: constant.OtherName,
				Path: constant.OtherName,
			})
		}
	}
	if len(categoryNodes) != 0 {
		categoryList, err := d.categoryRepo.GetCategoryAndNodeByNodeID(ctx, categoryNodes)
		if err != nil {
			return nil, nil, nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		// TODO: category_node_ext 数据同步后恢复校验
		// if len(categoryList) != len(categoryNodes) {
		// 	return nil, nil, nil, errorcode.Desc(errorcode.CategoryNodeIdNotFound)
		// }
		for _, item := range categoryList {
			catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
				CategoryID:   item.CategoryNodeID,
				CategoryType: constant.CategoryTypeCustom,
				CatalogID:    catalogId,
			})
			cateInfos = append(cateInfos, &es.CateInfo{
				CateId:   item.CategoryID,
				NodeId:   item.CategoryNodeID,
				NodeName: item.CategoryNode,
			})
		}
	}
	return catalogCategory, objects, cateInfos, nil
}
func (d *DataResourceCatalogDomain) genInfoSystemSubjectCategory(ctx context.Context, catalogId uint64, infoSystemID string, subjectIDs []string) ([]*model.TDataCatalogCategory, error) {
	var infoSystemCateUsing bool
	categoryList, err := d.categoryRepo.GetCategoryByIDs(ctx, []string{constant.InfoSystemCateId})
	if err != nil {
		return nil, err
	}
	for _, c := range categoryList {
		if c.CategoryID == constant.InfoSystemCateId && c.Using == 1 {
			infoSystemCateUsing = true
		}
	}
	catalogCategory := make([]*model.TDataCatalogCategory, 0)
	if infoSystemCateUsing && infoSystemID != "" {
		infoSystemRes, err := d.configurationCenterDriven.GetInfoSystemsPrecision(ctx, []string{infoSystemID}, nil)
		if err != nil {
			return nil, err
		}
		if len(infoSystemRes) != 1 || infoSystemRes[0].ID != infoSystemID {
			//return nil, errorcode.Desc(errorcode.DataCatalogInfoSystemNotFound)
		}
		catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
			CategoryID:   infoSystemID,
			CategoryType: constant.CategoryTypeInfoSystem,
			CatalogID:    catalogId,
		})
	}
	if len(subjectIDs) != 0 {
		subjectIDs, contains := reduceOtherSubject(subjectIDs)
		if len(subjectIDs) != 0 {
			dataSubjects, err := d.dataSubjectDriven.GetDataSubjectByID(ctx, subjectIDs)
			if err != nil {
				return nil, err
			}
			if len(dataSubjects.Objects) != len(subjectIDs) {
				return nil, errorcode.Desc(errorcode.DataCatalogSubjectNotFound)
			}
			for _, subject := range dataSubjects.Objects {
				catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
					CategoryID:   subject.ID,
					CategoryType: constant.CategoryTypeSubject,
					CatalogID:    catalogId,
				})
			}
		}
		if contains {
			catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
				CategoryID:   constant.OtherSubject,
				CategoryType: constant.CategoryTypeSubject,
				CatalogID:    catalogId,
			})
		}
	}
	return catalogCategory, nil
}
func (d *DataResourceCatalogDomain) genCustomCatalogCategory(ctx context.Context, catalogId uint64, categoryNodes []string) ([]*model.TDataCatalogCategory, error) {
	catalogCategory := make([]*model.TDataCatalogCategory, 0)
	if len(categoryNodes) != 0 {
		categoryList, err := d.categoryRepo.GetCategoryAndNodeByNodeID(ctx, categoryNodes)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		// TODO: category_node_ext 数据同步后恢复校验
		// if len(categoryList) != len(categoryNodes) {
		// 	return nil, errorcode.Desc(errorcode.CategoryNodeIdNotFound)
		// }
		for _, item := range categoryList {
			catalogCategory = append(catalogCategory, &model.TDataCatalogCategory{
				CategoryID:   item.CategoryNodeID,
				CategoryType: constant.CategoryTypeCustom,
				CatalogID:    catalogId,
			})
		}
	}
	return catalogCategory, nil
}
func (d *DataResourceCatalogDomain) UpdateDataCatalog(ctx context.Context, catalog *model.TDataCatalog, categoryNodeIds []string, infoSystemID string, subjectIDs []string) error {
	tx := d.catalogRepo.Db().Begin()
	catalog.UpdatedAt = time.Now()
	if err := d.catalogRepo.Update(ctx, catalog, tx); err != nil {
		tx.Rollback()
		return err
	}
	/*
		catalogCategory, err := d.genCustomCatalogCategory(ctx, catalog.ID, categoryNodeIds)
		if err != nil {
			tx.Rollback()
			return err
		}*/
	catalogCategory, err := d.genInfoSystemSubjectCategory(ctx, catalog.ID, infoSystemID, subjectIDs)
	if err != nil {
		tx.Rollback()
		return err
	}
	err = d.categoryRepo.UpdateInfoSystemSubjectCategory(ctx, catalog.ID, catalogCategory, tx)
	if err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()
	return nil
}
func reduceOtherSubject(ids []string) ([]string, bool) {
	res := make([]string, 0)
	contains := false
	for _, id := range ids {
		if id == constant.OtherSubject {
			contains = true
			continue
		}
		res = append(res, id)
	}
	return res, contains
}
func (d *DataResourceCatalogDomain) SaveDataCatalog(ctx context.Context, req *data_resource_catalog.SaveDataCatalogReqBody) (resp *data_resource_catalog.IDResp, err error) {
	userInfo := request.GetUserInfo(ctx)
	if req.UpdateOnly && req.CatalogID.Uint64() != 0 { //直接更新，不审核草稿
		var businessMatterIDS string
		if len(req.BusinessMatters) != 0 {
			matters, err := d.configurationCenterDriven.GetBusinessMatters(ctx, req.BusinessMatters)
			if err != nil {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err.Error())
			}
			if len(matters) != len(req.BusinessMatters) {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "business_matters error")
			}
			businessMatterIDS = strings.Join(req.BusinessMatters, ",")
		}
		if err = d.UpdateDataCatalog(ctx, &model.TDataCatalog{
			ID:                 req.CatalogID.Uint64(),
			AppSceneClassify:   req.AppSceneClassify,
			DataRelatedMatters: req.DataRelatedMatters,
			Description:        req.Description,
			SharedType:         req.SharedType,
			OpenType:           req.OpenType,
			PhysicalDeletion:   req.PhysicalDeletion,
			SyncMechanism:      req.SyncMechanism,
			SyncFrequency:      req.SyncFrequency,
			UpdaterUID:         userInfo.ID,
			BusinessMatters:    businessMatterIDS,
			//szd
			DataDomain:            req.DataDomain,            // 数据所属领域
			DataLevel:             req.DataLevel,             // 数据所在层级
			TimeRange:             req.TimeRange,             // 数据时间范围
			ProviderChannel:       req.ProviderChannel,       // 提供渠道
			AdministrativeCode:    req.AdministrativeCode,    // 行政区划代码
			CentralDepartmentCode: req.CentralDepartmentCode, // 中央业务指导部门代码
			ProcessingLevel:       req.ProcessingLevel,       // 数据加工程度
			CatalogTag:            req.CatalogTag,            // 目录 标签
			IsElectronicProof:     req.IsElectronicProof,     // 是否电子证明编码
			OperationAuthorized:   req.OperationAuthorized,
			DepartmentID:          req.DepartmentID,
		}, req.CategoryNodeIds, req.InfoSystemID, req.SubjectID); err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		return &data_resource_catalog.IDResp{ID: req.CatalogID.String()}, nil
	}
	/*dirDepart, err := d.departmentDomain.UserInMainDepart(ctx, req.DepartmentID)
	if err != nil || !dirDepart {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "department_id not main depart")
	}*/

	var catalogID uint64
	var isPublish bool
	var changeFlag bool
	var oldCatalog *model.TDataCatalog
	if req.CatalogID.Uint64() == 0 { //未创建 新建
		catalogID, _ = utils.GetUniqueID()
	} else { //已创建 暂存
		catalogID = req.CatalogID.Uint64()
		oldCatalog, err = d.catalogRepo.Get(ctx, catalogID)
		if err != nil {
			return nil, err
		}
		_, isPublish = constant.PublishedMap[oldCatalog.PublishStatus]
		if isPublish { //保存 创建编辑草稿副本直接使用DraftID
			changeFlag = true
			if oldCatalog.DraftID == 0 { //发布 创建草稿副本
				catalogID, _ = utils.GetUniqueID()
			} else { //发布 草稿副本暂存草稿副本
				catalogID = oldCatalog.DraftID
			}
		}
	}
	if err = data_resource_catalog.CheckColumnValid(req.Columns); err != nil {
		return nil, err
	}

	addResources, err := d.verifyDataResource(ctx, req.SourceDepartmentID, req.MountResources, changeFlag)
	if err != nil {
		return nil, err
	}
	req.MountResources = append(req.MountResources, addResources...)

	// region catalogCategory 填充
	catalogCategory, esObjects, esCateInfos, err := d.genCatalogCategory(ctx, catalogID, req.DepartmentID, req.InfoSystemID, req.SubjectID, req.CategoryNodeIds, true)
	if err != nil {
		return nil, err
	}
	//endregion

	openSSZD, err := d.configurationCenterDriven.GetGlobalSwitch(ctx, constant.SSZDOpenKey)
	if err != nil {
		return nil, errorcode.Desc(common_errorcode.ConfigurationServiceInternalError)
	}
	if openSSZD {
		log.WithContext(ctx).Infof("sszd open", zap.Bool("sszd", openSSZD))
	}
	// 填充字段信息
	catalogColumn, columnUnshared, err := d.genCatalogColumn(ctx, catalogID, req.Columns, openSSZD)
	if err != nil {
		return nil, err
	}

	dataCatalog, err := d.genCatalog(ctx, userInfo, catalogID, req, openSSZD)
	if err != nil {
		return nil, err
	}
	dataCatalog.ColumnUnshared = columnUnshared

	//region 生成编码规则
	if req.CatalogID.Uint64() == 0 {
		codeList, err := d.configurationCenterDriven.Generate(ctx, configuration_center.GenerateCodeIdDataCatalog, 1)
		if err != nil {
			return nil, err
		}
		if codeList != nil && len(codeList.Entries) != 0 {
			dataCatalog.Code = codeList.Entries[0]
		} else {
			return nil, errorcode.Desc(common_errorcode.GenerateCodeError)
		}
	}
	//endregion

	//不予开放时，对应开放目录调整为未开放状态和未审核状态
	if req.OpenType == 3 {
		openCatalog, err := d.openCatalogRepo.GetByCatalogId(ctx, catalogID)
		if err != nil {
			return nil, err
		}
		if openCatalog.ID > 0 && openCatalog.OpenStatus == constant.OpenStatusOpened {
			openCatalog.OpenStatus = constant.OpenStatusNotOpen
			openCatalog.AuditState = constant.AuditStatusUnaudited
			openCatalog.UpdatedAt = time.Now()
			openCatalog.UpdaterUID = userInfo.ID
			if err = d.openCatalogRepo.Save(ctx, openCatalog); err != nil {
				return nil, err
			}
		}
	}

	esResource, apiParams, modelResource := d.genMountResources(ctx, catalogID, req.MountResources, openSSZD)

	var push bool
	switch {
	case req.CatalogID.Uint64() == 0: //未发布，发布保存
		err = d.catalogRepo.CreateTransaction(ctx, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn)
		push = true
	case isPublish:
		//发布 创建草稿副本
		if oldCatalog.DraftID == 0 {
			err = d.catalogRepo.CreateDraftCopyTransaction(ctx, oldCatalog.ID, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn, openSSZD)
		} else { //发布 草稿副本暂存草稿副本
			dataCatalog.DraftID = constant.DraftFlag
			err = d.catalogRepo.SaveDraftCopyTransaction(ctx, oldCatalog.ID, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn, openSSZD)
		}
		/*//已发布有草稿副本删除草稿副本后保存(无审核情况,废弃)
		err = d.catalogRepo.DeleteDraftCopyTransaction(ctx, oldCatalog.DraftID, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn, openSSZD)*/
	default: //未发布无草稿副本直接保存
		err = d.catalogRepo.SaveTransaction(ctx, dataCatalog, apiParams, modelResource, catalogCategory, catalogColumn, openSSZD)
		push = true
	}
	if err != nil {
		if err.Error() == "数据资源目录不存在" {
			return nil, errorcode.Desc(errorcode.DataCatalogNotFound)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	if push {
		catalogPub, err := d.catalogRepo.Get(ctx, dataCatalog.ID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get catalog info by catalogID: %d, err info: %v", dataCatalog.ID, err.Error())
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		err = d.es.PubToES(ctx, catalogPub, esResource, esObjects, esCateInfos, catalogColumn) //修改推送
		if err != nil {
			return nil, err
		}
	}
	return &data_resource_catalog.IDResp{
		ID: util.CE(req.CatalogID.Uint64() == 0,
			strconv.FormatUint(catalogID, 10),
			req.CatalogID.String()).(string),
	}, nil

}

func (d *DataResourceCatalogDomain) GetDataCatalogList(ctx context.Context, req *data_resource_catalog.GetDataCatalogList) (*data_resource_catalog.DataCatalogRes, error) {
	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId {
		req.SubDepartmentIDs2 = []string{req.DepartmentID}
		departmentList, err := d.configurationCenterDriven.GetChildDepartments(ctx, req.DepartmentID)
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			util.SliceAdd(&req.SubDepartmentIDs2, entry.ID)
		}
	}
	if req.UserDepartment || req.MyDepartmentResource {
		var err error
		req.SubDepartmentIDs, err = d.departmentDomain.GetMainDepart(ctx)
		if err != nil {
			return nil, err
		}
		if req.DepartmentID != "" {
			req.SubDepartmentIDs = append(req.SubDepartmentIDs, req.DepartmentID)
		}
	}
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId {
		req.SubSubjectIDs = []string{req.SubjectID}
		if req.SubjectID != constant.OtherSubject {
			subjectList, err := d.dataSubjectDriven.GetSubjectList(ctx, req.SubjectID, "subject_domain_group,subject_domain,business_object,business_activity,logic_entity")
			if err != nil {
				return nil, err
			}
			for _, entry := range subjectList.Entries {
				util.SliceAdd(&req.SubSubjectIDs, entry.Id)
			}
		}
	}
	if req.CategoryNodeId != "" && req.CategoryNodeId != constant.UnallocatedId {
		ids, err := d.collectCategoryNodeIDs(ctx, req.CategoryNodeId)
		if err != nil {
			return nil, err
		}
		req.CategoryNodeIDs = ids
	}
	totalCount, catalogs, err := d.catalogRepo.GetCatalogList(ctx, req)
	if err != nil {
		return nil, err
	}
	departIds := make([]string, 0)
	catalogIds := make([]uint64, len(catalogs))
	for i, catalog := range catalogs {
		departIds = append(departIds, catalog.DepartmentID)
		departIds = append(departIds, catalog.SourceDepartmentID)
		catalogIds[i] = catalog.ID
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	//赋值挂载数据资源
	dataResources, err := d.dataResourceRepo.GetByCatalogIds(ctx, catalogIds...)
	if err != nil {
		return nil, err
	}
	resourceMap := GenResourceMap(dataResources)

	comprehensions, err := d.dataComprehensionRepo.GetByCatalogIds(ctx, catalogIds)
	if err != nil {
		return nil, err
	}
	comprehensionStatusMap := make(map[uint64]int8)
	for _, comprehension := range comprehensions {
		comprehensionStatusMap[comprehension.CatalogID] = comprehension.Status
	}

	var applyDepartmentNumMap map[uint64]int64
	var favoritesNumMap map[string]int64
	if req.MyDepartmentResource {
		applyDepartmentNum, err := d.catalogRepo.GetApplyDepartmentNum(ctx, catalogIds)
		if err != nil {
			return nil, err
		}
		applyDepartmentNumMap = make(map[uint64]int64)
		for _, res := range applyDepartmentNum {
			applyDepartmentNumMap[res.ID] = res.Count
		}

		// 批量查询收藏数量：根据数据资源目录ID查询 t_my_favorite 表
		// 查询条件：res_id=当前数据资源ID，res_type=1 (RES_TYPE_DATA_CATALOG)
		catalogIDStrings := make([]string, len(catalogIds))
		for i, id := range catalogIds {
			catalogIDStrings[i] = strconv.FormatUint(id, 10)
		}
		favoritesNumMap, err = d.myFavoriteRepo.CountByResIDs(nil, ctx, catalogIDStrings, my_favorite.RES_TYPE_DATA_CATALOG)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get favorites count by catalog ids, err: %v", err)
			// 如果查询失败，使用空map，避免影响其他功能
			favoritesNumMap = make(map[string]int64)
		}
	}
	//赋值生成返回值
	res := make([]*data_resource_catalog.DataCatalog, len(catalogs))
	for i, catalog := range catalogs {
		res[i] = &data_resource_catalog.DataCatalog{
			ID:                   strconv.FormatUint(catalog.ID, 10),
			Name:                 catalog.Title,
			Code:                 catalog.Code,
			Resource:             resourceMap[catalog.ID],
			DepartmentId:         catalog.DepartmentID,
			Department:           departmentNameMap[catalog.DepartmentID],
			DepartmentPath:       departmentPathMap[catalog.DepartmentID],
			SourceDepartmentId:   catalog.SourceDepartmentID,
			SourceDepartment:     departmentNameMap[catalog.SourceDepartmentID],
			SourceDepartmentPath: departmentPathMap[catalog.SourceDepartmentID],
			PublishStatus:        catalog.PublishStatus,
			OnlineStatus:         catalog.OnlineStatus,
			UpdatedAt:            catalog.UpdatedAt.UnixMilli(),
			PublishFlag:          *catalog.PublishFlag,
			AuditAdvice:          catalog.AuditAdvice,
			SharedType:           catalog.SharedType,
			DraftID:              strconv.FormatUint(catalog.DraftID, 10),
			ReportStatus:         util.CE(comprehensionStatusMap[catalog.ID] > 0, comprehensionStatusMap[catalog.ID], int8(1)).(int8),
			ApplyNum:             catalog.ApplyNum,
			OnlineTime:           GetUnixMilli(catalog.OnlineTime),
			IsImport:             catalog.IsImport,
		}
		if req.MyDepartmentResource {
			res[i].ApplyDepartmentNum = applyDepartmentNumMap[catalog.ID]
			// 从查询结果中获取收藏数量，如果不存在则默认为0
			catalogIDStr := strconv.FormatUint(catalog.ID, 10)
			if count, exists := favoritesNumMap[catalogIDStr]; exists {
				res[i].FavoritesNum = count
			} else {
				res[i].FavoritesNum = 0
			}
		}
		if req.SubjectShow {
			category, err := d.catalogRepo.GetCategoryByCatalogId(ctx, catalog.ID)
			if err != nil {
				return nil, err
			}
			subjectIds := make([]string, 0)
			for _, c := range category {
				if c.CategoryType == constant.CategoryTypeSubject {
					subjectIds = append(subjectIds, c.CategoryID)
				}
			}
			subjectIds = util.DuplicateStringRemoval(subjectIds)
			if len(subjectIds) != 0 {
				subjectInfos, _ := d.dataSubjectDriven.GetDataSubjectByID(ctx, subjectIds)
				res[i].SubjectInfo = make([]*common_model.SubjectInfo, len(subjectInfos.Objects))
				for j, subjectInfo := range subjectInfos.Objects {
					res[i].SubjectInfo[j] = &common_model.SubjectInfo{
						SubjectID:   subjectInfo.ID,
						SubjectName: subjectInfo.Name,
						SubjectPath: subjectInfo.PathName,
					}
				}
				if util.Contains(subjectIds, constant.OtherSubject) {
					res[i].SubjectInfo = append(res[i].SubjectInfo, &common_model.SubjectInfo{
						SubjectID:   constant.OtherSubject,
						SubjectName: constant.OtherName,
						SubjectPath: constant.OtherName,
					})
				}
			}
		}
		if req.ExploreShow {
			for _, dataResource := range dataResources {
				if catalog.ID == dataResource.CatalogID && dataResource.Type == 1 {
					report, _ := d.dataViewDriven.GetExploreReport(ctx, dataResource.ResourceId, true)
					if report != nil {
						var score float64
						count := 0
						completenessScore := float64(100)
						if report.Overview.CompletenessScore != nil {
							completenessScore, _ = decimal.NewFromFloat((200 + *report.Overview.CompletenessScore*100) / float64(3)).Round(2).Float64()
						}
						res[i].CompletenessScore = &completenessScore
						if report.Overview.AccuracyScore != nil {
							score += *report.Overview.AccuracyScore * 100
							count++
						}
						if report.Overview.UniquenessScore != nil {
							score += *report.Overview.UniquenessScore * 100
							count++
						}
						if report.Overview.StandardizationScore != nil {
							score += *report.Overview.StandardizationScore * 100
							count++
						}
						timelinessScore := float64(100)
						res[i].TimelinessScore = &timelinessScore
						if count > 0 {
							accuracyScore, _ := decimal.NewFromFloat(score / float64(count)).Round(2).Float64()
							res[i].AccuracyScore = &accuracyScore
						}
					}
				}
			}

		}
		if req.StatusShow {
			catalogMountFormInfo, _ := d.GetCatalogMountFormInfo(ctx, catalog.ID)
			if catalogMountFormInfo != nil && catalogMountFormInfo.FormId != "" {
				res[i].CatalogTaskStatusResp, _ = d.taskDriven.GetCatalogTaskStatus(ctx, catalogMountFormInfo.FormId, catalogMountFormInfo.FormName, catalogMountFormInfo.CatalogID)
			}
		}
	}
	return &data_resource_catalog.DataCatalogRes{
		Entries:    res,
		TotalCount: totalCount,
	}, nil
}
func GenResourceMap(dataResources []*model.TDataResource) map[uint64][]*data_resource_catalog.Resource {
	//赋值挂载数据资源
	resourceMap := make(map[uint64][]*data_resource_catalog.Resource)
	for _, dataResource := range dataResources {
		if _, exist := resourceMap[dataResource.CatalogID]; !exist {
			resourceMap[dataResource.CatalogID] = make([]*data_resource_catalog.Resource, 0)
		}
		var exist bool
		for i, resourceRes := range resourceMap[dataResource.CatalogID] {
			if resourceRes.ResourceType == dataResource.Type { //存在则数量加1
				exist = true
				resourceMap[dataResource.CatalogID][i].ResourceCount++
			}
		}
		if !exist { //不存在则初始化
			resourceMap[dataResource.CatalogID] = append(resourceMap[dataResource.CatalogID], &data_resource_catalog.Resource{
				ResourceType:  dataResource.Type,
				ResourceCount: 1,
			})
		}
	}
	return resourceMap
}
func (d *DataResourceCatalogDomain) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
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
func (d *DataResourceCatalogDomain) FrontendGetDataCatalogDetail(ctx context.Context, catalogID uint64) (*data_resource_catalog.FrontendCatalogDetail, error) {
	detail, err := d.GetDataCatalogDetail(ctx, catalogID)
	if err != nil {
		return nil, err
	}
	// 赋值预览量，申请数量
	statsInfos, err := d.statsRepo.Get(nil, ctx, detail.Code)
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog: %v preview count, err: %v", catalogID, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	res := &data_resource_catalog.FrontendCatalogDetail{
		CatalogDetailRes: detail,
	}
	if len(statsInfos) > 0 {
		// 表中code是唯一键，故len(statsInfos)有值长度必为1
		res.PreviewCount = int64(statsInfos[0].PreviewNum)
	}
	uInfo := request.GetUserInfo(ctx)
	favorites, err := d.myFavoriteRepo.FilterFavoredRIDSV1(nil, ctx, uInfo.ID, []string{fmt.Sprint(catalogID)}, my_favorite.RES_TYPE_DATA_CATALOG)
	if err != nil {
		log.WithContext(ctx).Errorf("d.myFavoriteRepo.FilterFavoredRIDS err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(favorites) > 0 {
		res.IsFavored = true
		res.FavorID = favorites[0].ID
	}
	return res, nil
}

func (d *DataResourceCatalogDomain) collectCategoryNodeIDs(ctx context.Context, nodeID string) ([]string, error) {
	// 按当前节点 ID 递归拿到「当前节点 + 所有子节点」的 category_node_id 列表。
	// 内部的分支逻辑（先通过 nodeID 反查 category_id，再 ListTree，然后递归子节点）。
	ids, err := common.GetSubCategoryNodeIDList(ctx, d.categoryRepo, "", nodeID)
	if err != nil {
		return nil, err
	}
	return ids, nil
}
func (d *DataResourceCatalogDomain) GetDataCatalogDetail(ctx context.Context, catalogID uint64) (*data_resource_catalog.CatalogDetailRes, error) {
	dataCatalog, err := d.catalogRepo.Get(ctx, catalogID)
	if err != nil {
		return nil, err
	}
	/*dataResources, err := d.dataResourceRepo.GetByCatalogId(ctx, catalogID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(dataResources) == 0 {
		return nil, errorcode.Desc(errorcode.DataResourceNotExist)
	}*/
	//查询数据理解报告
	comprehensionStatus := int32(constant.NoComprehensionReport)
	comprehensionDetail, err := d.dataComprehensionRepo.GetStatus(ctx, catalogID)
	if err == nil {
		comprehensionStatus = int32(comprehensionDetail.Status)
	}

	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval([]string{dataCatalog.SourceDepartmentID, dataCatalog.DepartmentID}))
	if err != nil {
		return nil, err
	}
	res := &data_resource_catalog.CatalogDetailRes{
		Name:                 dataCatalog.Title,
		Code:                 dataCatalog.Code,
		SourceDepartment:     departmentNameMap[dataCatalog.SourceDepartmentID],
		SourceDepartmentPath: departmentPathMap[dataCatalog.SourceDepartmentID],
		SourceDepartmentID:   dataCatalog.SourceDepartmentID,
		DepartmentInfo: common_model.DepartmentInfo{
			DepartmentID:   dataCatalog.DepartmentID,
			Department:     departmentNameMap[dataCatalog.DepartmentID],
			DepartmentPath: departmentPathMap[dataCatalog.DepartmentID],
		},
		//ResourceType:          dataCatalog.Type,
		AppSceneClassify:      dataCatalog.AppSceneClassify,
		OtherAppSceneClassify: util.CE(dataCatalog.AppSceneClassify != nil && *dataCatalog.AppSceneClassify == 4, dataCatalog.OthersAppSceneClassify, "").(string),
		DataRelatedMatters:    dataCatalog.DataRelatedMatters,
		DataRange:             dataCatalog.DataRange,
		UpdateCycle:           dataCatalog.UpdateCycle,
		OtherUpdateCycle:      util.CE(dataCatalog.UpdateCycle == 8, dataCatalog.OtherUpdateCycle, "").(string),
		DataClassify:          dataCatalog.DataClassify,
		Description:           dataCatalog.Description,
		SharedOpenInfo: data_resource_catalog.SharedOpenInfo{
			SharedType:      dataCatalog.SharedType,
			SharedCondition: dataCatalog.SharedCondition,
			OpenType:        dataCatalog.OpenType,
			OpenCondition:   dataCatalog.OpenCondition,
			SharedMode:      dataCatalog.SharedMode,
		},
		//MountResources: &data_resource_catalog.MountResource{
		//	ResourceType: dataCatalog.Time,
		//	ResourceID:   dataResources[0].ResourceId,
		//},
		MoreInfo: data_resource_catalog.MoreInfo{
			PhysicalDeletion:    dataCatalog.PhysicalDeletion,
			SyncMechanism:       dataCatalog.SyncMechanism,
			SyncFrequency:       dataCatalog.SyncFrequency,
			PublishFlag:         dataCatalog.PublishFlag,
			OperationAuthorized: dataCatalog.OperationAuthorized,
		},
		ComprehensionStatus: comprehensionStatus,
		PublishStatus:       dataCatalog.PublishStatus,
		PublishAt:           GetUnixMilli(dataCatalog.PublishedAt),
		OnlineStatus:        dataCatalog.OnlineStatus,
		OnlineTime:          GetUnixMilli(dataCatalog.OnlineTime),
		AuditAdvice:         dataCatalog.AuditAdvice,
		CreatedAt:           dataCatalog.CreatedAt.UnixMilli(),
		UpdatedAt:           dataCatalog.UpdatedAt.UnixMilli(),
		DraftID:             strconv.FormatUint(dataCatalog.DraftID, 10),
		TimeRange:           dataCatalog.TimeRange,
		ApplyNum:            dataCatalog.ApplyNum,
	}
	if dataCatalog.BusinessMatters != "" {
		res.BusinessMatters, err = d.configurationCenterDriven.GetBusinessMatters(ctx, strings.Split(dataCatalog.BusinessMatters, ","))
		if err != nil {
			log.WithContext(ctx).Error("GetDataCatalogDetail configurationCenterDriven.GetBusinessMatters", zap.Error(err))
		}
	}
	openSSZD, err := d.configurationCenterDriven.GetGlobalSwitch(ctx, constant.SSZDOpenKey)
	if err != nil {
		return nil, errorcode.Desc(common_errorcode.ConfigurationServiceInternalError)
	}
	if openSSZD {
		res.ReportInfo = data_resource_catalog.ReportInfo{
			DataDomain:            dataCatalog.DataDomain,
			DataLevel:             dataCatalog.DataLevel,
			TimeRange:             dataCatalog.TimeRange,
			ProviderChannel:       dataCatalog.ProviderChannel,
			AdministrativeCode:    dataCatalog.AdministrativeCode,
			CentralDepartmentCode: dataCatalog.CentralDepartmentCode,
			ProcessingLevel:       dataCatalog.ProcessingLevel,
			CatalogTag:            dataCatalog.CatalogTag,
			IsElectronicProof:     dataCatalog.IsElectronicProof,
		}
	}
	category, err := d.catalogRepo.GetCategoryByCatalogId(ctx, catalogID)
	if err != nil {
		return nil, err
	}
	subjectIds := make([]string, 0)
	categoryIds := make([]string, 0)
	for _, c := range category {
		switch c.CategoryType {
		case constant.CategoryTypeDepartment:
			if res.DepartmentID == "" {
				departments, err := d.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{c.CategoryID})
				if err != nil {
					return nil, err
				}
				department := &configuration_center.DepartmentInternal{}
				if len(departments.Departments) > 0 {
					department = departments.Departments[0]
				}
				res.DepartmentInfo = common_model.DepartmentInfo{
					DepartmentID:   c.CategoryID,
					Department:     department.Name,
					DepartmentPath: department.Path,
				}
			}
		case constant.CategoryTypeInfoSystem:
			infoSystems, err := d.configurationCenterDriven.GetInfoSystemsPrecision(ctx, []string{c.CategoryID}, nil)
			if err != nil {
				return nil, err
			}
			infoSystem := &configuration_center.GetInfoSystemByIdsRes{}
			if len(infoSystems) > 0 {
				infoSystem = infoSystems[0]
			}
			res.InfoSystemInfo = common_model.InfoSystemInfo{
				InfoSystemID: c.CategoryID,
				InfoSystem:   infoSystem.Name,
			}
		case constant.CategoryTypeSubject:
			subjectIds = append(subjectIds, c.CategoryID)
		case constant.CategoryTypeCustom:
			categoryIds = append(categoryIds, c.CategoryID)

		}
	}

	categoryIds = util.DuplicateStringRemoval(categoryIds)
	if len(categoryIds) != 0 {
		res.CategoryInfos, err = d.categoryRepo.GetCategoryAndNodeByNodeID(ctx, categoryIds)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	}

	subjectIds = util.DuplicateStringRemoval(subjectIds)
	if len(subjectIds) != 0 {
		subjectInfos, _ := d.dataSubjectDriven.GetDataSubjectByID(ctx, subjectIds)
		res.SubjectInfo = make([]*common_model.SubjectInfo, len(subjectInfos.Objects))
		for i, subjectInfo := range subjectInfos.Objects {
			res.SubjectInfo[i] = &common_model.SubjectInfo{
				SubjectID:   subjectInfo.ID,
				SubjectName: subjectInfo.Name,
				SubjectPath: subjectInfo.PathName,
			}
		}
		if util.Contains(subjectIds, constant.OtherSubject) {
			res.SubjectInfo = append(res.SubjectInfo, &common_model.SubjectInfo{
				SubjectID:   constant.OtherSubject,
				SubjectName: constant.OtherName,
				SubjectPath: constant.OtherName,
			})
		}
	}

	return res, nil
}
func GetUnixMilli(t *time.Time) int64 {
	if t != nil {
		return t.UnixMilli()
	}
	return 0
}
func (d *DataResourceCatalogDomain) GetDataCatalogColumnsByViewID(ctx context.Context, id string) ([]*data_resource_catalog.ColumnInfo, error) {
	columns, err := d.columnRepo.GetByResourceID(ctx, id)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	columnInfos := make([]*data_resource_catalog.ColumnInfo, len(columns))
	for i, column := range columns {
		columnInfos[i] = &data_resource_catalog.ColumnInfo{
			IDOmitempty: data_resource_catalog.IDOmitempty{
				ID: models.ModelID(strconv.FormatUint(column.ID, 10)),
			},
			BusinessName:  column.BusinessName,
			TechnicalName: column.TechnicalName,
			SourceID:      column.SourceID,
			StandardCode:  column.StandardCode.String,
			CodeTableID:   column.CodeTableID.String,
			DataFormat:    column.DataFormat,
			DataLength:    column.DataLength,
			DataPrecision: column.DataPrecision,
			DataRange:     column.Ranges,
			SharedType:    column.SharedType,
			//SharedCondition: column.SharedCondition,
			OpenType:      column.OpenType,
			OpenCondition: column.OpenCondition,
			Index:         column.Index,
		}
		if column.ClassifiedFlag.Valid {
			columnInfos[i].ClassifiedFlag = &column.ClassifiedFlag.Int16
		}
		if column.SensitiveFlag.Valid {
			columnInfos[i].SensitiveFlag = &column.SensitiveFlag.Int16
		}
		if column.TimestampFlag.Valid {
			columnInfos[i].TimestampFlag = &column.TimestampFlag.Int16
		}
		if column.PrimaryFlag.Valid {
			columnInfos[i].PrimaryFlag = &column.PrimaryFlag.Int16
		}
	}
	return columnInfos, nil
}

func (d *DataResourceCatalogDomain) GetDataCatalogColumns(ctx context.Context, req data_resource_catalog.CatalogColumnPageInfo) (*data_resource_catalog.GetDataCatalogColumnsRes, error) {
	catalog, err := d.catalogRepo.Get(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	total, columns, err := d.columnRepo.GetByPage(ctx, req)
	if err != nil {
		return nil, err
	}
	CodeTableIDs := make([]string, 0)
	StandardCodes := make([]string, 0)
	columnSourceIDs := make([]string, 0)
	for _, column := range columns {
		if column.CodeTableID.String != "" {
			CodeTableIDs = append(CodeTableIDs, column.CodeTableID.String)
		}
		if column.StandardCode.String != "" {
			StandardCodes = append(StandardCodes, column.StandardCode.String)
		}
		if column.SourceID != "" {
			columnSourceIDs = append(columnSourceIDs, column.SourceID)
		}
	}
	CodeTableIDs = util.DuplicateStringRemoval(CodeTableIDs)
	StandardCodes = util.DuplicateStringRemoval(StandardCodes)

	codeTableMap := make(map[string]standardization.DictResp)
	if len(CodeTableIDs) != 0 {
		log.WithContext(ctx).Infof("verify CodeTableIDs :%+v", CodeTableIDs)
		if codeTableMap, err = d.standardDriven.GetStandardDict(ctx, CodeTableIDs); err != nil {
			return nil, err
		}
	}
	standardCodesMap := make(map[string]*standardization.DataResp)
	if len(StandardCodes) != 0 {
		log.WithContext(ctx).Infof("verify StandardCodes :%+v", StandardCodes)
		Standards, err := d.standardDriven.GetDataElementDetailByCode(ctx, StandardCodes...)
		if err != nil {
			return nil, err
		}
		for _, preDict := range Standards {
			standardCodesMap[preDict.Code] = preDict
		}
	}
	//获取来源字段名称
	columnSourceMap := make(map[string]*data_resource_catalog.ColumnSourceName)
	if len(columnSourceIDs) != 0 {
		dataResource, err := d.dataResourceRepo.GetByCatalogId(ctx, catalog.ID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		if catalog.ViewCount == 1 {
			for _, resource := range dataResource {
				if resource.Type == constant.MountView {
					viewFields, err := d.dataViewDriven.GetDataViewFieldByInternal(ctx, resource.ResourceId)
					if err != nil {
						return nil, err
					}
					for _, viewField := range viewFields.FieldsRes {
						columnSourceMap[viewField.ID] = &data_resource_catalog.ColumnSourceName{
							BusinessName:  viewField.BusinessName,
							TechnicalName: viewField.TechnicalName,
							OriginalName:  viewField.OriginalName,
						}
					}
				}
			}
		}
	}

	openSSZD, err := d.configurationCenterDriven.GetGlobalSwitch(ctx, constant.SSZDOpenKey)
	if err != nil {
		return nil, errorcode.Desc(common_errorcode.ConfigurationServiceInternalError)
	}

	classifyMap := make(map[string]*configuration_center.GradeLabel)
	dataClassifyDictItems, err := d.configurationCenterDriven.GetGradeLabel(ctx, nil)
	if err != nil {
		log.WithContext(ctx).Error("AutoClassification GetGradeLabel error", zap.Error(err))
	} else {
		recursion(dataClassifyDictItems.GradeLabel, classifyMap)
	}

	columnInfos := make([]*data_resource_catalog.ColumnInfoRes, len(columns))
	var sourceIDs []string
	for i, column := range columns {
		columnInfos[i] = &data_resource_catalog.ColumnInfoRes{
			ColumnInfo: data_resource_catalog.ColumnInfo{
				IDOmitempty: data_resource_catalog.IDOmitempty{
					ID: models.ModelID(strconv.FormatUint(column.ID, 10)),
				},
				BusinessName:  column.BusinessName,
				TechnicalName: column.TechnicalName,
				SourceID:      column.SourceID,
				StandardCode:  column.StandardCode.String,
				CodeTableID:   column.CodeTableID.String,
				DataFormat:    column.DataFormat,
				DataLength:    column.DataLength,
				DataPrecision: column.DataPrecision,
				DataRange:     column.Ranges,
				SharedType:    column.SharedType,
				//SharedCondition: column.SharedCondition,
				OpenType:      column.OpenType,
				OpenCondition: column.OpenCondition,
				Index:         column.Index,
				ColumnReportInfo: data_resource_catalog.ColumnReportInfo{
					SourceSystem:  column.SourceSystem,
					InfoItemLevel: d.AutoClassification(ctx, column, classifyMap),
				},
			},
		}
		if column.ClassifiedFlag.Valid {
			columnInfos[i].ClassifiedFlag = &column.ClassifiedFlag.Int16
		}
		if column.SensitiveFlag.Valid {
			columnInfos[i].SensitiveFlag = &column.SensitiveFlag.Int16
		}
		if column.TimestampFlag.Valid {
			columnInfos[i].TimestampFlag = &column.TimestampFlag.Int16
		}
		if column.PrimaryFlag.Valid {
			columnInfos[i].PrimaryFlag = &column.PrimaryFlag.Int16
		}
		if column.StandardCode.String != "" {
			standardInfo := standardCodesMap[column.StandardCode.String]
			columnInfos[i].StandardCode = standardInfo.Code
			columnInfos[i].Standard = standardInfo.NameCn
			columnInfos[i].StandardType = standardInfo.DataType
			columnInfos[i].StandardTypeName = standardInfo.DataTypeName
			columnInfos[i].StandardStatus = util.CE(standardInfo.Deleted, "deleted", standardInfo.State).(string)
			if standardInfo.DictID != "" {
				columnInfos[i].CodeTableID = standardInfo.DictID
				columnInfos[i].CodeTable = standardInfo.DictNameCN
				columnInfos[i].CodeTableStatus = util.CE(standardInfo.DictDeleted, "deleted", standardInfo.DictState).(string)
			}
		}
		if column.CodeTableID.String != "" && columnInfos[i].CodeTable == "" { //使用非标准带的码表
			if value, ok := codeTableMap[column.CodeTableID.String]; ok {
				columnInfos[i].CodeTable = value.NameZh
				columnInfos[i].CodeTableStatus = util.CE(value.Deleted, "deleted", value.State).(string)
			}
		}
		if column.SourceID != "" {
			columnInfos[i].SourceName = columnSourceMap[column.SourceID]
		}
		if openSSZD {
			if sourceIDs == nil {
				sourceIDs = make([]string, 0)
			}
			columnInfos[i].SourceID = column.SourceID
			columnInfos[i].SourceSystemLevel = column.SourceSystemLevel
			if column.SourceID != "" {
				sourceIDs = append(sourceIDs, column.SourceID)
			}
		}
	}
	if req.ReportShow && openSSZD && len(sourceIDs) > 0 {
		reportInfo, err := d.dataViewDriven.GetLogicViewReportInfo(ctx, &data_view.GetLogicViewReportInfoBody{
			FieldIds: util.DuplicateStringRemoval(sourceIDs),
		})
		if err != nil {
			return nil, err
		}
		for i := 0; i < len(columnInfos); i++ {
			if catalog.ViewCount > 0 {
				columnInfos[i].SourceTechnicalName = reportInfo.ReportInfos[columnInfos[i].SourceID].FieldTechnicalName
				columnInfos[i].SourceSystemId = reportInfo.ReportInfos[columnInfos[i].SourceID].DatasourceId
				columnInfos[i].SourceSystemSchema = reportInfo.ReportInfos[columnInfos[i].SourceID].DatasourceSchema
			}
			if catalog.ApiCount > 0 {
				columnInfos[i].SourceTechnicalName = "" //todo
			}
		}

	}
	sort.Sort(data_resource_catalog.ByIndex(columnInfos))
	return &data_resource_catalog.GetDataCatalogColumnsRes{
		Columns:    columnInfos,
		TotalCount: total,
	}, nil
}

func recursionNameID(label []*configuration_center.GradeLabel, classifyMap map[string]string) {
	for _, dict := range label {
		if dict.NodeType == 1 {
			classifyMap[dict.Name] = dict.ID
		}
		if len(dict.Children) > 0 {
			recursionNameID(dict.Children, classifyMap)
		}
	}
}
func recursionIDName(label []*configuration_center.GradeLabel, classifyMap map[string]string) {
	for _, dict := range label {
		if dict.NodeType == 1 {
			classifyMap[dict.ID] = dict.Name
		}
		if len(dict.Children) > 0 {
			recursionIDName(dict.Children, classifyMap)
		}
	}
}
func recursion(label []*configuration_center.GradeLabel, classifyMap map[string]*configuration_center.GradeLabel) {
	for _, dict := range label {
		if dict.NodeType == 1 {
			judgment(dict, classifyMap)
		}
		if len(dict.Children) > 0 {
			recursion(dict.Children, classifyMap)
		}
	}
}
func judgment(dict *configuration_center.GradeLabel, classifyMap map[string]*configuration_center.GradeLabel) {
	sensitive := toS(dict.SensitiveAttri)
	secret := toS(dict.SecretAttri)
	share := toS(dict.ShareCondition)
	if va, exist := classifyMap[sensitive+secret+share]; !exist || va.SortWeight < dict.SortWeight {
		classifyMap[sensitive+secret+share] = dict
	}
}
func (d *DataResourceCatalogDomain) AutoClassification(ctx context.Context, column *model.TDataCatalogColumn, classifyMap map[string]*configuration_center.GradeLabel) (classification string) {
	if va, exist := classifyMap[toSensitive(column)]; exist {
		return va.Name
	}
	return
}

func toSensitive(column *model.TDataCatalogColumn) string {
	var sensitive string
	switch column.SensitiveFlag.Int16 {
	case 1:
		sensitive = "sensitive"
	case 0:
		sensitive = "insensitive"
	}
	return sensitive + toClassified(column)
}
func toClassified(column *model.TDataCatalogColumn) string {
	var classified string
	switch column.ClassifiedFlag.Int16 {
	case 1:
		classified = "secret"
	case 0:
		classified = "non-secret"
	}
	return classified + toShared(column.SharedType)
}
func toShared(sharedType int8) string {
	switch sharedType {
	case 1:
		return "unconditional_share"
	case 2:
		return "conditional_share"
	case 3:
		return "no_share"
	}
	return ""
}
func toS(p *string) string {
	if p != nil {
		return *p
	}
	return ""
}
func (d *DataResourceCatalogDomain) GetDataCatalogMountList(ctx context.Context, catalogID uint64) (*data_resource_catalog.GetDataCatalogMountListRes, error) {
	catalog, err := d.catalogRepo.Get(ctx, catalogID)
	if err != nil {
		return nil, err
	}
	var dataResource []*model.TDataResource
	if catalog.DraftID == constant.DraftFlag {
		dataResource, err = d.dataResourceRepo.GetByDraftCatalogId(ctx, catalogID)
	} else {
		dataResource, err = d.dataResourceRepo.GetByCatalogId(ctx, catalogID)
	}
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	openSSZD, err := d.configurationCenterDriven.GetGlobalSwitch(ctx, constant.SSZDOpenKey)
	if err != nil {
		return nil, errorcode.Desc(common_errorcode.ConfigurationServiceInternalError)
	}

	departmentIds := make([]string, 0)
	mountResource := make([]*data_resource_catalog.MountResourceRes, 0)
	for _, r := range dataResource {
		if r.Type != constant.MountAPI {
			if departmentIds != nil {
				departmentIds = append(departmentIds, r.DepartmentId)
			}
			mountResourceTmp := &data_resource_catalog.MountResourceRes{
				ResourceType: r.Type,
				ResourceID:   r.ResourceId,
				Name:         r.Name,
				Code:         r.Code,
				DepartmentId: r.DepartmentId,
				PublishAt:    r.PublishAt.UnixMilli(),
				Status:       r.Status,
			}
			if r.InterfaceCount > 0 {
				viewInterface, err := d.dataResourceRepo.GetViewInterface(ctx, r.ResourceId, false)
				if err != nil {
					return nil, err
				}
				mountResourceTmp.Children = lo.Map(viewInterface, func(item *model.TDataResource, _ int) *data_resource_catalog.MountResourceRes {
					departmentIds = append(departmentIds, item.DepartmentId)
					return &data_resource_catalog.MountResourceRes{
						ResourceType: item.Type,
						ResourceID:   item.ResourceId,
						Name:         item.Name,
						Code:         item.Code,
						DepartmentId: item.DepartmentId,
						PublishAt:    item.PublishAt.UnixMilli(),
						Status:       item.Status,
					}
				})
			}
			if openSSZD {
				mountResourceTmp.SchedulingInfo = data_resource_catalog.SchedulingInfo{
					SchedulingPlan: r.SchedulingPlan,
					Interval:       r.Interval,
					Time:           r.Time,
				}
				mountResourceTmp.RequestFormat = r.RequestFormat
				mountResourceTmp.ResponseFormat = r.ResponseFormat
				apiBodys, err := d.dataResourceRepo.GetApiBody(ctx, catalogID)
				if err != nil {
					return nil, err
				}
				for _, apiBody := range apiBodys {
					mountResourceTmp.RequestBody = make([]*data_resource_catalog.Body, 0)
					mountResourceTmp.ResponseBody = make([]*data_resource_catalog.Body, 0)
					if apiBody.BodyType == constant.BodyTypeReq {
						mountResourceTmp.RequestBody = append(mountResourceTmp.RequestBody, &data_resource_catalog.Body{
							HasContent: apiBody.HasContent,
							ID:         apiBody.ID,
							IsArray:    apiBody.IsArray,
							Name:       apiBody.Name,
							Type:       apiBody.ParamType,
						})

					}
					if apiBody.BodyType == constant.BodyTypeRes {
						mountResourceTmp.ResponseBody = append(mountResourceTmp.ResponseBody, &data_resource_catalog.Body{
							HasContent: apiBody.HasContent,
							ID:         apiBody.ID,
							IsArray:    apiBody.IsArray,
							Name:       apiBody.Name,
							Type:       apiBody.ParamType,
						})

					}
				}
			}
			mountResource = append(mountResource, mountResourceTmp)
		}

	}
	nameMap, pathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departmentIds))

	for i, r := range mountResource {
		mountResource[i].Department = nameMap[r.DepartmentId]
		mountResource[i].DepartmentPath = pathMap[r.DepartmentId]
		if len(r.Children) > 0 {
			for _, child := range mountResource[i].Children {
				child.Department = nameMap[child.DepartmentId]
				child.DepartmentPath = pathMap[child.DepartmentId]
			}
		}

	}
	return &data_resource_catalog.GetDataCatalogMountListRes{
		MountResource: mountResource,
	}, nil
}
func (d *DataResourceCatalogDomain) GetResourceCatalogList(ctx context.Context, req *data_resource_catalog.GetResourceCatalogListReq) (*data_resource_catalog.GetResourceCatalogListRes, error) {
	resource, err := d.dataResourceRepo.GetByResourceIds(ctx, req.ResourceIDs, 0, nil)
	if err != nil {
		return nil, err
	}
	res := make([]*data_resource_catalog.ResourceCatalog, len(resource))
	for i, dataResource := range resource {
		res[i] = &data_resource_catalog.ResourceCatalog{
			Resource: &data_resource.DataResource{
				ResourceId:   dataResource.ResourceId,
				Name:         dataResource.Name,
				Code:         dataResource.Code,
				ResourceType: dataResource.Type,
				DepartmentID: dataResource.DepartmentId,
				SubjectID:    dataResource.SubjectId,
				PublishAt:    dataResource.PublishAt.UnixMilli(),
				CatalogID:    strconv.FormatUint(dataResource.CatalogID, 10),
				Children:     nil,
			},
		}
		if req.CatalogInfoShow && dataResource.CatalogID != 0 {
			catalogModel, err := d.catalogRepo.Get(ctx, dataResource.CatalogID)
			if err != nil {
				return nil, err
			}
			res[i].Catalog = &data_resource_catalog.DataCatalog{
				ID:            strconv.FormatUint(catalogModel.ID, 10),
				Name:          catalogModel.Title,
				Code:          catalogModel.Code,
				Department:    catalogModel.DepartmentID,
				PublishStatus: catalogModel.PublishStatus,
				OnlineStatus:  catalogModel.OnlineStatus,
				UpdatedAt:     catalogModel.UpdatedAt.UnixMilli(),
				PublishFlag:   *catalogModel.PublishFlag,
				AuditAdvice:   catalogModel.AuditAdvice,
				SharedType:    catalogModel.SharedType,
				DraftID:       strconv.FormatUint(catalogModel.DraftID, 10),
			}
			if catalogModel.PublishedAt != nil {
				res[i].Catalog.PublishedAt = catalogModel.PublishedAt.UnixMilli()
			}
		}
	}
	return &data_resource_catalog.GetResourceCatalogListRes{ResourceCatalogs: res}, nil
}
func (d *DataResourceCatalogDomain) GetDataCatalogRelation(ctx context.Context, catalogID uint64) (*data_resource_catalog.GetDataCatalogRelationRes, error) {
	catalog, err := d.catalogRepo.Get(ctx, catalogID)
	if err != nil {
		return nil, err
	}
	dataResource, err := d.dataResourceRepo.GetByCatalogId(ctx, catalogID)
	if err != nil {
		return nil, err
	}
	if len(dataResource) != 1 {
		return nil, errorcode.Desc(errorcode.DataResourceNotExist)
	}
	var entries []*data_application_service.ServicesGetByDataViewId
	var viewCatalog *data_resource_catalog.DataCatalogWithMount
	switch dataResource[0].Type {
	case constant.MountView:
		viewCatalog = &data_resource_catalog.DataCatalogWithMount{
			CatalogID:    catalog.ID,
			CatalogName:  catalog.Title,
			ResourceID:   dataResource[0].ResourceId,
			ResourceName: dataResource[0].Name,
		}
		services, err := d.applicationServiceDriven.GetDataViewServices(ctx, dataResource[0].ResourceId)
		if err != nil {
			return nil, err
		}
		entries = services.Entries
	case constant.MountAPI:
		services := &data_application_service.GetServicesDataViewRes{}
		services, err = d.applicationServiceDriven.GetServicesDataView(ctx, dataResource[0].ResourceId)
		if err != nil {
			return nil, err
		}
		entries = services.Entries

		apiFromViewResource := &model.TDataResource{}
		apiFromViewResource, err = d.dataResourceRepo.GetByResourceId(ctx, services.DataViewId)
		if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		viewCatalog = &data_resource_catalog.DataCatalogWithMount{
			ResourceID:   apiFromViewResource.ResourceId,
			ResourceName: apiFromViewResource.Name,
		}
		apiFromViewCatalog, err := d.catalogRepo.Get(ctx, apiFromViewResource.CatalogID)
		if err == nil {
			viewCatalog.CatalogID = apiFromViewCatalog.ID
			viewCatalog.CatalogName = apiFromViewCatalog.Title
		}
		if err != nil && err.Error() != "数据资源目录不存在" {
			return nil, err
		}
	case constant.MountIndicator:
		return nil, errorcode.Desc(errorcode.DataResourceTypeNotSupport)
	default:
		return nil, errorcode.Desc(errorcode.DataResourceTypeNotSupport)
	}
	serviceId := make([]string, len(entries))
	for i, service := range entries {
		serviceId[i] = service.ServiceID
	}
	relations, err := d.dataResourceRepo.GetResourceAndCatalog(ctx, serviceId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return &data_resource_catalog.GetDataCatalogRelationRes{
		Api:  relations,
		View: viewCatalog,
	}, nil
}
func (d *DataResourceCatalogDomain) DeleteDataCatalog(ctx context.Context, catalogID uint64) error {
	_, err := d.catalogRepo.Get(ctx, catalogID)
	if err != nil {
		return err
	}
	err = d.catalogRepo.DeleteTransaction(ctx, catalogID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.DataCatalogNotFound, err.Error())
		}
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	err = d.es.DeletePubES(ctx, strconv.FormatUint(catalogID, 10))
	if err != nil {
		return err
	}
	return nil
}
func (d *DataResourceCatalogDomain) CheckRepeat(ctx context.Context, catalogID uint64, name string) (bool, error) {
	return d.catalogRepo.CheckRepeat(ctx, catalogID, name)
}

func (d *DataResourceCatalogDomain) CreateESIndex(ctx context.Context) {
	log.WithContext(ctx).Infof("start create es index")
	return
}

func (d *DataResourceCatalogDomain) CreateAuditInstance(ctx context.Context, req *data_resource_catalog.CreateAuditInstanceReq) error {
	// 校验目录状态判断是否允许发起当前类型审核
	catalog, err := d.catalogRepo.Get(ctx, req.CatalogID.Uint64())
	if err != nil {
		return err
	}

	bOpAllow := false
	switch req.AuditType.AuditType {
	case constant.AuditTypePublish:
		bOpAllow = (catalog.PublishStatus == constant.PublishStatusUnPublished ||
			catalog.PublishStatus == constant.PublishStatusPubReject ||
			catalog.PublishStatus == constant.PublishStatusChReject) &&
			catalog.OnlineStatus == constant.LineStatusNotLine
	case constant.AuditTypeChange:
		bOpAllow = (catalog.PublishStatus == constant.PublishStatusPublished || catalog.PublishStatus == constant.PublishStatusChReject) && //已发布、变更审核未通过可以变更
			!(catalog.OnlineStatus == constant.LineStatusUpAuditing || catalog.OnlineStatus == constant.LineStatusDownAuditing) //上线审核中、下线审核中不可以变更
	case constant.AuditTypeOnline:
		bOpAllow = (catalog.OnlineStatus == constant.LineStatusNotLine ||
			catalog.OnlineStatus == constant.LineStatusOffLine ||
			catalog.OnlineStatus == constant.LineStatusDownAuto ||
			catalog.OnlineStatus == constant.LineStatusUpReject) && (catalog.PublishStatus == constant.PublishStatusPublished ||
			catalog.PublishStatus == constant.PublishStatusPubReject ||
			catalog.PublishStatus == constant.PublishStatusChReject)
	case constant.AuditTypeOffline:
		bOpAllow = (catalog.OnlineStatus == constant.LineStatusOnLine ||
			catalog.OnlineStatus == constant.LineStatusDownReject) && (catalog.PublishStatus == constant.PublishStatusPublished ||
			catalog.PublishStatus == constant.PublishStatusPubReject ||
			catalog.PublishStatus == constant.PublishStatusChReject)
	}

	if !bOpAllow {
		log.WithContext(ctx).Errorf("audit apply (type: %s) not allowed", req.AuditType.AuditType)
		return errorcode.Desc(errorcode.PublicAuditApplyNotAllowedError)
	}

	//检查是否有绑定的审核流程
	process, err := d.configurationCenterDriven.GetProcessBindByAuditType(ctx, &configuration_center.GetProcessBindByAuditTypeReq{AuditType: req.AuditType.AuditType})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to check audit process info (type: %s), err: %v", req.AuditType.AuditType, err)
		return err
	}
	isAuditProcessExist := util.CE(process.ProcDefKey != "", true, false).(bool)

	t := time.Now()
	catalog.AuditType = req.AuditType.AuditType
	catalog.IsIndexed = 1

	if !isAuditProcessExist {
		catalog.AuditState = constant.AuditStatusPass
	} else {
		catalog.AuditState = constant.AuditStatusAuditing
		catalog.ProcDefKey = process.ProcDefKey
		catalog.AuditApplySN, err = utils.GetUniqueID()
		if err != nil {
			return errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
	}

	switch req.AuditType.AuditType {
	case constant.AuditTypePublish:
		switch isAuditProcessExist {
		case false: //发布 没有绑定审核流程 报错 没有可用的审核流程
			catalog.PublishStatus = constant.PublishStatusPublished
			catalog.PublishedAt = &t
		case true: //发布 有绑定审核流程 发起审核 不能直接通过
			catalog.PublishStatus = constant.PublishStatusPubAuditing
		}
	case constant.AuditTypeChange:
		if catalog.DraftID != 0 {
			draftCatalog, err := d.catalogRepo.Get(ctx, catalog.DraftID)
			if err != nil {
				log.WithContext(ctx).Error("CreateAuditInstance AuditTypeChange catalogRepo.Get catalog.DraftID error", zap.Error(err))
			}
			catalog.Title = draftCatalog.Title
		}
		switch isAuditProcessExist {
		case false: //发布 没有绑定审核流程 报错 没有可用的审核流程
			catalog.PublishStatus = constant.PublishStatusPublished
			catalog.PublishedAt = &t
		case true: //发布 有绑定审核流程 发起审核 不能直接通过
			catalog.PublishStatus = constant.PublishStatusChAuditing
		}
	case constant.AuditTypeOnline:
		switch isAuditProcessExist {
		case false: //上线 没有绑定上线审核流程 直接通过
			// if catalog.ViewCount > 0 {
			// 	comprehension, err := d.dataComprehensionRepo.GetCatalogId(ctx, catalog.ID)
			// 	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			// 		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
			// 	}
			// 	if comprehension != nil && comprehension.Status != data_comprehension_domain.Comprehended {
			// 		if err = d.dataComprehensionRepo.Update(ctx, &model.DataComprehensionDetail{
			// 			CatalogID: catalog.ID,
			// 			Status:    data_comprehension_domain.Comprehended,
			// 		}); err != nil {
			// 			return err
			// 		}
			// 	}
			// }
			catalog.OnlineStatus = constant.LineStatusOnLine
			catalog.OnlineTime = &t
		case true: //上线 有绑定审核流程 发起审核 不能直接通过
			// if catalog.ViewCount > 0 {
			// 	comprehension, err := d.dataComprehensionRepo.GetCatalogId(ctx, catalog.ID)
			// 	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			// 		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
			// 	}
			// 	if comprehension != nil && comprehension.Status != data_comprehension_domain.Comprehended {
			// 		if err = d.dataComprehensionRepo.Update(ctx, &model.DataComprehensionDetail{
			// 			CatalogID: catalog.ID,
			// 			Status:    data_comprehension_domain.Auditing,
			// 		}); err != nil {
			// 			return err
			// 		}
			// 	}
			// }
			if catalog.OnlineStatus == constant.LineStatusOffLine {
				catalog.OnlineStatus = constant.LineStatusOfflineUpAuditing
			} else {
				catalog.OnlineStatus = constant.LineStatusUpAuditing
			}
		}
	case constant.AuditTypeOffline:
		switch isAuditProcessExist {
		case false: //下线 没有绑定下线审核流程 直接通过
			catalog.OnlineStatus = constant.LineStatusOffLine
		case true: //下线 有绑定审核流程 发起审核 不能直接通过
			catalog.OnlineStatus = constant.LineStatusDownAuditing
		}
	}

	tx := d.catalogRepo.Db().WithContext(ctx).Begin()

	if req.AuditType.AuditType == constant.AuditTypeChange && !isAuditProcessExist {
		if err = d.catalogRepo.ModifyDC(ctx, catalog, tx); err != nil {
			tx.Rollback()
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	} else {
		err = d.catalogRepo.AuditApplyUpdate(ctx, catalog, tx)
		if err != nil {
			tx.Rollback()
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	}

	if err = d.CreateAuditLog(ctx, catalog,
		req.AuditType.AuditType,
		util.CE(isAuditProcessExist, constant.AuditStatusAuditing, constant.AuditStatusPass).(int)); err != nil {
		return err
	}

	uInfo := request.GetUserInfo(ctx)
	if isAuditProcessExist {
		msg := &wf_common.AuditApplyMsg{}
		msg.Process.ApplyID = common.GenAuditApplyID(catalog.ID, catalog.AuditApplySN)
		msg.Process.AuditType = process.AuditType
		msg.Process.UserID = uInfo.ID
		msg.Process.UserName = uInfo.Name
		msg.Process.ProcDefKey = process.ProcDefKey
		msg.Data = map[string]any{
			"id":             fmt.Sprint(catalog.ID),
			"code":           catalog.Code,
			"title":          catalog.Title,
			"submitter":      uInfo.ID,
			"submit_time":    t.UnixMilli(),
			"submitter_name": uInfo.Name,
		}
		msg.Workflow.TopCsf = 5
		msg.Workflow.AbstractInfo.Icon = common.AUDIT_ICON_BASE64
		msg.Workflow.AbstractInfo.Text = "目录名称：" + catalog.Title
		msg.Workflow.Webhooks = []wf_common.Webhook{
			{
				Webhook:     settings.GetConfig().DepServicesConf.DataCatalogHost + "/api/internal/data-catalog/v1/audits/" + msg.Process.ApplyID + "/auditors?auditGroupType=2",
				StrategyTag: common.OWNER_AUDIT_STRATEGY_TAG,
			},
		}
		err = d.wf.AuditApply(msg)
		if err != nil {
			tx.Rollback()
			return errorcode.Detail(errorcode.PublicAuditApplyFailedError, err.Error())
		}
	}
	err = tx.Commit().Error
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	mountResources, esObjects, esCateInfos, columns, err := d.GenEsEntity(ctx, catalog.ID)
	if err != nil {
		return err
	}
	catalogModel, err := d.catalogRepo.Get(ctx, catalog.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog info by catalogID: %d, err info: %v", catalog.ID, err.Error())
		return err
	}
	if err = d.es.PubToES(ctx, catalogModel, mountResources, esObjects, esCateInfos, columns); err != nil { //创建审核推送
		return err
	}
	return nil
}

func (d *DataResourceCatalogDomain) CreateAuditLog(ctx context.Context, dataCatalog *model.TDataCatalog, auditType string, auditState int, tx ...*gorm.DB) (err error) {
	auditLogType := make([]int8, 0)
	switch {
	case dataCatalog.ViewCount > 0:
		auditLogType = append(auditLogType, constant.MountView)
	case dataCatalog.ApiCount > 0:
		auditLogType = append(auditLogType, constant.MountAPI)
	case dataCatalog.FileCount > 0:
		auditLogType = append(auditLogType, constant.MountFile)
	}
	if len(auditLogType) == 0 {
		return nil
	}
	auditLog := make([]*model.AuditLog, 0)
	now := time.Now()
	for _, at := range auditLogType {
		auditLog = append(auditLog, &model.AuditLog{
			CatalogID:         dataCatalog.ID,
			AuditType:         auditType,
			AuditState:        auditState,
			AuditTime:         now,
			AuditResourceType: at,
		})
	}
	if err = d.catalogRepo.CreateAuditLog(ctx, auditLog, tx...); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *DataResourceCatalogDomain) GenEsEntity(ctx context.Context, catalogID uint64) ([]*es.MountResources, []*es.BusinessObject, []*es.CateInfo, []*model.TDataCatalogColumn, error) {
	category, err := d.catalogRepo.GetCategoryByCatalogId(ctx, catalogID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	var departmentID, infoSystemID string
	subjectIDs := make([]string, 0)
	categoryNodes := make([]string, 0)
	for _, catalogCategory := range category {
		switch catalogCategory.CategoryType {
		case constant.CategoryTypeDepartment:
			departmentID = catalogCategory.CategoryID
		case constant.CategoryTypeInfoSystem:
			infoSystemID = catalogCategory.CategoryID
		case constant.CategoryTypeSubject:
			subjectIDs = append(subjectIDs, catalogCategory.CategoryID)
		case constant.CategoryTypeCustom:
			categoryNodes = append(categoryNodes, catalogCategory.CategoryID)
		}
	}

	dataResources, err := d.dataResourceRepo.GetByCatalogId(ctx, catalogID)
	if err != nil {
		return nil, nil, nil, nil, err
	}
	if len(dataResources) == 0 {
		return nil, nil, nil, nil, errorcode.Desc(errorcode.DataResourceNotExist)
	}

	esMountResourceMap := make(map[string][]string)
	for _, resource := range dataResources {
		var t string
		switch resource.Type {
		case constant.MountView:
			t = "data_view"
		case constant.MountAPI:
			t = "interface_svc"
		case constant.MountFile:
			t = "file"
		case constant.MountIndicator:
			t = "indicator"
		}
		if _, exist := esMountResourceMap[t]; !exist {
			esMountResourceMap[t] = make([]string, 0)
		}
		esMountResourceMap[t] = append(esMountResourceMap[t], resource.ResourceId)
	}
	mountResources := make([]*es.MountResources, 0)
	for k, v := range esMountResourceMap {
		mountResources = append(mountResources, &es.MountResources{Type: k, IDs: v})
	}

	_, esObjects, esCateInfos, err := d.genCatalogCategory(ctx, catalogID, departmentID, infoSystemID, subjectIDs, categoryNodes, false)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	columns, err := d.columnRepo.Get(nil, ctx, catalogID)
	if err != nil {
		return nil, nil, nil, nil, err
	}

	return mountResources, esObjects, esCateInfos, columns, nil
}

func (d *DataResourceCatalogDomain) AuditResult(ctx context.Context, auditType string, msg *wf_common.AuditResultMsg) error {
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

	now := time.Now()
	alterInfo := map[string]interface{}{"updated_at": &util.Time{Time: now}}
	catalogUpdate := &model.TDataCatalog{ID: catalogID, UpdatedAt: now}
	openCatalogUnOpen := false
	var auditState int
	switch msg.Result {
	case common.AUDIT_RESULT_PASS:
		alterInfo["audit_state"] = constant.AuditStatusPass
		alterInfo["audit_advice"] = ""
		switch auditType {
		case constant.AuditTypeOnline:
			// if comprehension, err := d.dataComprehensionRepo.GetCatalogId(ctx, catalogID); err == nil {
			// 	if comprehension.Status != data_comprehension_domain.Comprehended {
			// 		if err = d.dataComprehensionRepo.Update(ctx, &model.DataComprehensionDetail{
			// 			CatalogID: catalogID,
			// 			Status:    data_comprehension_domain.Comprehended,
			// 		}); err != nil {
			// 			return err
			// 		}
			// 	}
			// } else {
			// 	log.WithContext(ctx).Errorf("AuditTypeOnline AUDIT_RESULT_PASS %s, err: %v", msg.ApplyID, err)
			// }
			alterInfo["online_status"] = constant.LineStatusOnLine
			alterInfo["is_indexed"] = 0
			alterInfo["online_time"] = alterInfo["updated_at"]
		case constant.AuditTypeOffline:
			alterInfo["online_status"] = constant.LineStatusOffLine
			alterInfo["is_indexed"] = 0
			alterInfo["is_canceled"] = 0
			openCatalogUnOpen = true
		case constant.AuditTypePublish:
			alterInfo["publish_status"] = constant.PublishStatusPublished
			alterInfo["published_at"] = alterInfo["updated_at"]
		case constant.AuditTypeChange:
			catalogUpdate.PublishStatus = constant.PublishStatusPublished
			catalogUpdate.PublishedAt = &now
			alterInfo["publish_status"] = constant.PublishStatusPublished
			alterInfo["published_at"] = alterInfo["updated_at"]
		}
		auditState = constant.AuditStatusPass
	case common.AUDIT_RESULT_REJECT:
		alterInfo["audit_state"] = constant.AuditStatusReject
		switch auditType {
		case constant.AuditTypeOnline:
			catalog, err := d.catalogRepo.Get(ctx, catalogID)
			if err != nil {
				log.WithContext(ctx).Errorf("AuditTypeOnline AUDIT_RESULT_REJECT %s, err: %v", msg.ApplyID, err)
				return err
			}
			if catalog.OnlineStatus == constant.LineStatusOfflineUpAuditing {
				alterInfo["online_status"] = constant.LineStatusOfflineUpReject
			} else if catalog.OnlineStatus == constant.LineStatusUpAuditing {
				alterInfo["online_status"] = constant.LineStatusUpReject
			}
		case constant.AuditTypeOffline:
			alterInfo["online_status"] = constant.LineStatusDownReject
		case constant.AuditTypePublish:
			alterInfo["publish_status"] = constant.PublishStatusPubReject
		case constant.AuditTypeChange:
			catalogUpdate.PublishStatus = constant.PublishStatusChReject
			alterInfo["publish_status"] = constant.PublishStatusChReject
		}
		auditState = constant.AuditStatusReject
	case common.AUDIT_RESULT_UNDONE:
		alterInfo["audit_state"] = constant.AuditStatusUndone
		switch auditType {
		case constant.AuditTypeOnline:
			alterInfo["online_status"] = constant.LineStatusNotLine
		case constant.AuditTypeOffline:
			alterInfo["online_status"] = constant.LineStatusOnLine
		case constant.AuditTypePublish:
			alterInfo["publish_status"] = constant.PublishStatusUnPublished
		case constant.AuditTypeChange:
			catalogUpdate.PublishStatus = constant.PublishStatusPublished
			alterInfo["publish_status"] = constant.PublishStatusPublished
		}
		auditState = constant.AuditStatusUndone
	default:
		log.WithContext(ctx).Warnf("unknown audit result type: %s, ignore it", msg.Result)
		return nil
	}

	if msg.Result == common.AUDIT_RESULT_PASS && auditType == constant.AuditTypeChange {
		err = d.catalogRepo.ModifyTransaction(ctx, catalogUpdate)
		if err != nil {
			log.WithContext(ctx).Errorf("[mq] Audit failed ModifyTransaction, err info: %v", err.Error())
			return err
		}
	} else {
		_, err = d.oldCatalogRepo.AuditResultUpdate(nil, ctx, auditType, catalogID, applySN, alterInfo)
		if err != nil {
			log.WithContext(ctx).Errorf("[mq] Audit failed toAuditResultUpdate, err info: %v", err.Error())
			return err
		}
	}

	//下线时，对应开放目录调整为未开放状态和未审核状态
	if openCatalogUnOpen {
		openCatalog, err := d.openCatalogRepo.GetByCatalogId(ctx, catalogID)
		if err != nil {
			log.WithContext(ctx).Errorf("[mq] Audit failed toAuditResultUpdate, err info: %v", err.Error())
			return err
		}
		if openCatalog.ID > 0 && openCatalog.OpenStatus == constant.OpenStatusOpened {
			openCatalog.OpenStatus = constant.OpenStatusNotOpen
			openCatalog.AuditState = constant.AuditStatusUnaudited
			openCatalog.UpdatedAt = time.Now()
			userInfo := request.GetUserInfo(ctx)
			openCatalog.UpdaterUID = userInfo.ID
			if err = d.openCatalogRepo.Save(ctx, openCatalog); err != nil {
				log.WithContext(ctx).Errorf("[mq] Audit failed toAuditResultUpdate, err info: %v", err.Error())
				return err
			}
		}
	}

	catalogModel, err := d.catalogRepo.Get(ctx, catalogID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog info by catalogID: %d, err info: %v", catalogID, err.Error())
		return err
	}
	if err = d.CreateAuditLog(ctx, catalogModel,
		auditType,
		auditState); err != nil {
		log.Error("DataResourceCatalogDomain CreateAuditLog failed,err:", zap.Error(err))
	}
	mountResources, esObjects, esCateInfos, columns, err := d.GenEsEntity(ctx, catalogID)
	if err != nil {
		log.Error("DataResourceCatalogDomain GenEsEntity failed,err:", zap.Error(err))
	}
	err = d.es.PubToES(ctx, catalogModel, mountResources, esObjects, esCateInfos, columns) //接收审核推送
	if err != nil {
		log.Error("DataResourceCatalogDomain PubToES failed,err:", zap.Error(err))
	}
	return nil
}

// PushCatalogToEs 全量推送到es
func (d *DataResourceCatalogDomain) PushCatalogToEs(ctx context.Context, req *data_resource_catalog.PushCatalogToEsReq) error {
	catalogs, err := d.catalogRepo.GetAllCatalog(ctx, req)
	if err != nil {
		log.Error("DataResourceCatalogDomain GetAllCatalog failed,err:", zap.Error(err))
		return err
	}
	for _, c := range catalogs {
		mountResources, esObjects, esCateInfos, columns, err := d.GenEsEntity(ctx, c.ID)
		if err != nil {
			log.Error("DataResourceCatalogDomain PubToES failed,err:", zap.Error(err))
			continue
		}
		err = d.es.PubToES(ctx, c, mountResources, esObjects, esCateInfos, columns) //全量推送到es
		if err != nil {
			log.Error("DataResourceCatalogDomain PubToES failed,err:", zap.Error(err))
			return err
		}
	}
	return nil
}

func (d *DataResourceCatalogDomain) GetBriefList(ctx context.Context, catalogIdStr string) (datas []*model.TDataCatalog, err error) {
	catalogIdStrs := strings.Split(catalogIdStr, ",")
	ids := make([]uint64, 0)
	for _, idStr := range catalogIdStrs {
		id, _ := strconv.ParseUint(idStr, 10, 64)
		if id > 0 {
			ids = append(ids, id)
		}
	}
	datas, err = d.catalogRepo.ListCatalogsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}

	return datas, nil
}

func (d *DataResourceCatalogDomain) TotalOverview(ctx context.Context, req *data_resource_catalog.TotalOverviewReq) (res *data_resource_catalog.TotalOverviewRes, err error) {

	catalogCount, err := d.catalogRepo.Count(ctx)
	if err != nil {
		return nil, err
	}

	// 获取部门提供目录统计
	departmentCount, err := d.catalogRepo.DepartmentCount(ctx)
	if err != nil {
		return nil, err
	}
	departmentIDs := make([]string, 0)
	for _, department := range departmentCount {
		if department.DepartmentId != "" {
			departmentIDs = append(departmentIDs, department.DepartmentId)
		}
	}
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departmentIDs))
	if err != nil {
		return nil, err
	}
	departmentCountRes := make([]*data_resource_catalog.DepartmentCount, 0)

	for _, department := range departmentCount {
		departmentCountRes = append(departmentCountRes, &data_resource_catalog.DepartmentCount{
			DepartmentId:   department.DepartmentId,
			DepartmentName: departmentNameMap[department.DepartmentId],
			DepartmentPath: departmentPathMap[department.DepartmentId],
			Count:          department.Count,
		})
	}
	// end

	dataResourceCount, err := d.dataResourceRepo.Count(ctx)
	if err != nil {
		return nil, err
	}

	feedbackCount, err := d.catalogFeedbackRepo.OverviewCount(ctx)
	if err != nil {
		return nil, err
	}
	res = &data_resource_catalog.TotalOverviewRes{
		DataCatalogCount: data_resource_catalog.DataCatalogCount{
			CatalogCount:                catalogCount.CatalogCount,
			UnPublishCatalogCount:       catalogCount.CatalogCount - catalogCount.PublishedCatalogCount,
			PublishCatalogCount:         catalogCount.PublishedCatalogCount,
			NotlineCatalogCount:         catalogCount.NotLineCatalogCount,
			OnlineCatalogCount:          catalogCount.OnLineCatalogCount,
			OfflineCatalogCount:         catalogCount.OffLineCatalogCount,
			PublishAuditingCatalogCount: catalogCount.PublishAuditingCatalogCount,
			PublishPassCatalogCount:     catalogCount.PublishPassCatalogCount,
			PublishRejectCatalogCount:   catalogCount.PublishRejectCatalogCount,
			OnlineAuditingCatalogCount:  catalogCount.OnlineAuditingCatalogCount,
			OnlinePassCatalogCount:      catalogCount.OnlinePassCatalogCount,
			OnlineRejectCatalogCount:    catalogCount.OnlineRejectCatalogCount,
			OfflineAuditingCatalogCount: catalogCount.OfflineAuditingCatalogCount,
			OfflinePassCatalogCount:     catalogCount.OfflinePassCatalogCount,
			OfflineRejectCatalogCount:   catalogCount.OfflineRejectCatalogCount,
		},
		DataResourceCount: data_resource_catalog.DataResourceCount{
			ResourceCount:     dataResourceCount.ViewCount + dataResourceCount.ApiCount + dataResourceCount.FileCount + dataResourceCount.ManualFormCount,
			ViewCount:         dataResourceCount.ViewCount,
			ApiCount:          dataResourceCount.ApiCount,
			FileCount:         dataResourceCount.FileCount,
			ManualFormCount:   dataResourceCount.ManualFormCount,
			ResourceMount:     dataResourceCount.ViewMount + dataResourceCount.ApiMount + dataResourceCount.FileMount + dataResourceCount.ManualFormMount,
			ViewMount:         dataResourceCount.ViewMount,
			ApiMount:          dataResourceCount.ApiMount,
			FileMount:         dataResourceCount.FileMount,
			ManualFormMount:   dataResourceCount.ManualFormMount,
			ResourceUnMount:   0, //下方计算
			ViewUnMount:       dataResourceCount.ViewCount - dataResourceCount.ViewMount,
			ApiUnMount:        dataResourceCount.ApiCount - dataResourceCount.ApiMount,
			FileUnMount:       dataResourceCount.FileCount - dataResourceCount.FileMount,
			ManualFormUnMount: dataResourceCount.ManualFormCount - dataResourceCount.ManualFormMount,
		},
		DepartmentCounts: departmentCountRes,
		CatalogShareConditional: data_resource_catalog.CatalogShareConditional{
			UnconditionalShared: catalogCount.UnconditionalShared,
			ConditionalShared:   catalogCount.ConditionalShared,
			NotShared:           catalogCount.NotShared,
		},
		CatalogUsingCount: data_resource_catalog.CatalogUsingCount{
			SupplyAndDemandConnection: 9,
			SharingApplication:        3,
			DataAnalysis:              5,
		},
		CatalogFeedbackCount: data_resource_catalog.CatalogFeedbackCount{
			CatalogFeedbackStatistics: feedbackCount.DirInfoError,
			DataQualityIssues:         feedbackCount.DataQualityIssue,
			ResourceCatalogMismatch:   feedbackCount.ResourceMismatch,
			InterfaceIssues:           feedbackCount.InterfaceIssue,
			Other:                     feedbackCount.Other,
		},
	}
	res.ResourceUnMount = res.ResourceCount - res.ResourceMount
	return res, nil

}
func (d *DataResourceCatalogDomain) StatisticsOverview(ctx context.Context, req *data_resource_catalog.StatisticsOverviewReq) (res *data_resource_catalog.StatisticsOverviewRes, err error) {
	r := &catalog_repo.AuditLogCountReq{
		Time: req.Type,
	}
	var start, end *time.Time
	start, err = util.TimeParseReliable(req.Start)
	if err != nil {
		return
	}
	end, err = util.TimeParseReliable(req.End)
	if err != nil {
		return
	}

	switch req.Type {
	case "year": // 年
		if start != nil && end != nil {
			if end.Year()-start.Year() > 12 {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "年度时间范围不能超过12个年度")
			}
			r.Start = *start
			r.End = *end
		} else {
			r.End = time.Now()
			r.Start = r.End.AddDate(-12, 0, 0)
		}
		r.Time = "year(audit_time)"
		r.CreatedAtTime = "year(f.created_at)"
	case "quarter": // 季度
		if start != nil && end != nil {
			year1, month1, _ := start.Date()
			year2, month2, _ := end.Date()
			quarters := (year2-year1)*4 + (int(month2)-1)/3 - (int(month1)-1)/3
			//if end.Sub(*start) > time.Hour*24*30*3*8 {
			if quarters > 8 {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "季度时间范围不能超过8个季度")
			}
			r.Start = *start
			r.End = *end
		} else {
			r.End = time.Now()
			r.Start = r.End.AddDate(0, -3*8, 0)
		}
		r.Time = "CONCAT(year(audit_time),'Q', quarter(audit_time))"
		r.CreatedAtTime = "CONCAT(year(f.created_at),'Q', quarter(f.created_at))"
	case "month": // 月
		if start != nil && end != nil {
			year1, month1, _ := start.Date()
			year2, month2, _ := end.Date()
			months := (year2-year1)*12 + int(month2-month1)
			//if end.Sub(*start) > time.Hour*24*30*36 {
			if months > 36 {
				return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "月度时间范围不能超过36个月")
			}
			r.Start = *start
			r.End = *end
		} else {
			r.End = time.Now()
			r.Start = r.End.AddDate(0, -12, 0)
		}
		r.Time = "DATE_FORMAT(audit_time,'%Y-%m')"
		r.CreatedAtTime = "DATE_FORMAT(f.created_at,'%Y-%m')"
	}
	auditLogCounts, err := d.catalogRepo.AuditLogCount(ctx, r)
	if err != nil {
		res.Err = AddErr(res.Err, err)
	}
	res = &data_resource_catalog.StatisticsOverviewRes{
		CatalogCount: &data_resource_catalog.CatalogCount{
			Auditing: &data_resource_catalog.AuditTypeCount{
				Publish: make([]*data_resource_catalog.Count, 0),
				Online:  make([]*data_resource_catalog.Count, 0),
				Offline: make([]*data_resource_catalog.Count, 0),
			},
			Pass: &data_resource_catalog.AuditTypeCount{
				Publish: make([]*data_resource_catalog.Count, 0),
				Online:  make([]*data_resource_catalog.Count, 0),
				Offline: make([]*data_resource_catalog.Count, 0),
			},
			Reject: &data_resource_catalog.AuditTypeCount{
				Publish: make([]*data_resource_catalog.Count, 0),
				Online:  make([]*data_resource_catalog.Count, 0),
				Offline: make([]*data_resource_catalog.Count, 0),
			},
		},
	}
	for _, auditLogCount := range auditLogCounts {
		switch auditLogCount.AuditState {
		case constant.AuditStatusAuditing:
			d.switchAuditType(auditLogCount, res.CatalogCount.Auditing)
		case constant.AuditStatusPass:
			d.switchAuditType(auditLogCount, res.CatalogCount.Pass)
		case constant.AuditStatusReject:
			d.switchAuditType(auditLogCount, res.CatalogCount.Reject)
		}

	}
	//feedbackCount := make([]*data_resource_catalog.Count, 0)
	res.FeedbackCount, err = d.catalogFeedbackRepo.FilterByTimeCount(ctx, r)
	if err != nil {
		res.Err = AddErr(res.Err, err)
	}
	return res, nil

}
func AddErr(errs []error, err error) []error {
	if len(errs) == 0 {
		errs = []error{err}
	}
	errs = append(errs, err)
	return errs
}
func (d *DataResourceCatalogDomain) switchAuditType(auditLogCount *catalog_repo.AuditLogCountRes, auditing *data_resource_catalog.AuditTypeCount) {
	switch auditLogCount.AuditType {
	case constant.AuditTypePublish:
		auditing.Publish = append(auditing.Publish, &data_resource_catalog.Count{
			Count: auditLogCount.Count,
			Dive:  auditLogCount.Dive,
			Type:  auditLogCount.AuditResourceType,
		})
	case constant.AuditTypeOnline:
		auditing.Online = append(auditing.Online, &data_resource_catalog.Count{
			Count: auditLogCount.Count,
			Dive:  auditLogCount.Dive,
			Type:  auditLogCount.AuditResourceType,
		})
	case constant.AuditTypeOffline:
		auditing.Offline = append(auditing.Offline, &data_resource_catalog.Count{
			Count: auditLogCount.Count,
			Dive:  auditLogCount.Dive,
			Type:  auditLogCount.AuditResourceType,
		})
	}
}

func (d *DataResourceCatalogDomain) GetColumnListByIds(ctx context.Context, req *data_resource_catalog.GetColumnListByIdsReq) (*data_resource_catalog.GetColumnListByIdsResp, error) {
	columns, err := d.columnRepo.GetByIDs(ctx, req.IDs)
	if err != nil {
		return nil, err
	}
	columnInfos := make([]*data_resource_catalog.ColumnNameInfo, len(columns))
	for i, column := range columns {
		columnInfos[i] = &data_resource_catalog.ColumnNameInfo{
			ID:            column.ID,
			BusinessName:  column.BusinessName,
			TechnicalName: column.TechnicalName,
		}
	}
	return &data_resource_catalog.GetColumnListByIdsResp{Columns: columnInfos}, nil
}

func (d *DataResourceCatalogDomain) GetDataCatalogTask(ctx context.Context, catalogID uint64) (*data_resource_catalog.GetDataCatalogTaskResp, error) {
	// todo 根据目录id获取目录下挂接的库表
	resp := &data_resource_catalog.GetDataCatalogTaskResp{}
	var err error
	resp.CatalogMountFormInfo, err = d.GetCatalogMountFormInfo(ctx, catalogID)
	if resp.CatalogMountFormInfo == nil || resp.FormId == "" {
		return nil, nil
	}
	resp.SourceType, resp.FormName, err = d.GetSourceTypeAndFormName(ctx, resp.FormId)
	if err != nil {
		return nil, err
	}
	catalogTask, err := d.taskDriven.GetCatalogTask(ctx, resp.FormId, resp.FormName, resp.CatalogID)
	if err != nil {
		return nil, err
	}
	resp.DataAggregation = catalogTask.DataAggregation
	resp.Processing = catalogTask.Processing
	resp.DataComprehension = catalogTask.DataComprehension
	return resp, nil
}

// 获取数据源来源
func (d *DataResourceCatalogDomain) GetSourceTypeAndFormName(ctx context.Context, formId string) (sourceType, formName string, err error) {
	formViewInfo, err := d.dataViewDriven.GetDataViewDetails(ctx, formId)
	if err != nil {
		return sourceType, formName, err
	}
	formName = formViewInfo.TechnicalName
	// 获取数据源来源
	datasourceInfo, err := d.configurationCenterDriven.GetDataSourcePrecision(ctx, []string{formViewInfo.DatasourceID})
	if err != nil {
		log.WithContext(ctx).Warnf("query view datasource error %v", err.Error())
	}
	if len(datasourceInfo) > 0 {
		sourceType = enum.ToString[data_resource_catalog.SourceType](datasourceInfo[0].SourceType)
	}
	return
}

// 获取目录挂接的库表
func (d *DataResourceCatalogDomain) GetCatalogMountFormInfo(ctx context.Context, catalogID uint64) (resp *data_resource_catalog.CatalogMountFormInfo, err error) {
	resp = &data_resource_catalog.CatalogMountFormInfo{}
	catalogModel, err := d.catalogRepo.Get(ctx, catalogID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get catalog info by catalogID: %d, err info: %v", catalogID, err.Error())
		return
	}
	resp.CatalogID = strconv.FormatUint(catalogID, 10)
	resp.CatalogName = catalogModel.Title
	resp.Code = catalogModel.Code
	dataResources, err := d.dataResourceRepo.GetByCatalogId(ctx, catalogID)
	if err != nil {
		return
	}
	if len(dataResources) == 0 {
		return nil, nil
	}
	for _, dataResource := range dataResources {
		if dataResource.Type == constant.MountView {
			resp.FormId = dataResource.ResourceId
			resp.FormName = dataResource.Name
		}
	}
	return
}

func (d *DataResourceCatalogDomain) UpdateApplyNum(ctx context.Context, req *data_resource_catalog.EsIndexApplyNumUpdateMsg) error {
	for i := range req.Body {
		if req.Body[i].ResType != "catalog" {
			continue
		}
		for _, cID := range req.Body[i].ResIDs {
			catalogID, err := strconv.ParseUint(cID, 10, 64)
			if err != nil {
				return err
			}
			if err = d.catalogRepo.UpdateApplyNum(ctx, catalogID); err != nil {
				return err
			}
			// 保存数据目录申请明细
			d.CreateDataCatalogApply(ctx, catalogID, 1)
			/*if err = d.CreateDataCatalogApply(ctx, catalogID, 1); err != nil {
				return err
			}*/
			dataCatalog, err := d.catalogRepo.Get(ctx, catalogID)
			if err != nil {
				return err
			}
			if err = d.es.PubApplyNumToES(ctx, catalogID, dataCatalog.ApplyNum); err != nil {
				return err
			}
		}
	}
	return nil
}

func (d *DataResourceCatalogDomain) UpdateApplyNumComplete(ctx context.Context, req *data_resource_catalog.EsIndexApplyNumUpdateMsg) error {
	for i := range req.Body {
		// 打印req.Body[i].ResType值
		if req.Body[i].ResType != "catalog" {
			// api logic
			updatedAtStr := time.UnixMilli(req.UpdatedAt).Format("2006-01-02")
			for _, cID := range req.Body[i].ResIDs {
				// 保存更新数据接口申请明细
				err := d.CreateDataInterfaceApply(ctx, cID, 1, updatedAtStr)
				if err != nil {
					log.Error("DataResourceCatalogDomain CreateDataInterfaceApply failed,err:", zap.Error(err))
					return err
				}
			}
			// save data interface apply aggregate
			log.Info("DataResourceCatalogDomain save data interface apply aggregate")
			err := d.catalogRepo.AggregateInterfaceApplyData(ctx)
			if err != nil {
				log.Error("DataResourceCatalogDomain AggregateInterfaceApplyData failed,err:", zap.Error(err))
				return err
			}
		} else {
			//catalog logic
			for _, cID := range req.Body[i].ResIDs {
				log.Info("DataResourceCatalogDomain update catalog apply num")
				catalogID, err := strconv.ParseUint(cID, 10, 64)
				log.Infof("DataResourceCatalogDomain update catalog apply num,catalogID:%d", catalogID)
				if err != nil {
					return err
				}
				if err = d.catalogRepo.UpdateApplyNum(ctx, catalogID); err != nil {
					return err
				}
				// 保存数据目录申请明细
				if err = d.CreateDataCatalogApply(ctx, catalogID, 1); err != nil {
					return err
				}
				dataCatalog, err := d.catalogRepo.Get(ctx, catalogID)
				if err != nil {
					return err
				}
				mountResources, esObjects, esCateInfos, columns, err := d.GenEsEntity(ctx, catalogID)
				if err != nil {
					log.Error("DataResourceCatalogDomain GenEsEntity failed,err:", zap.Error(err))
					return err
				}
				if err = d.es.PubToES(ctx, dataCatalog, mountResources, esObjects, esCateInfos, columns); err != nil { // 申请量
					return err
				}
			}
		}
	}
	return nil
}

func (d *DataResourceCatalogDomain) CreateDataCatalogApply(ctx context.Context, catalogID uint64, applyNum int32) error {
	id, err := utils.GetUniqueID()
	if err != nil {
		return err
	}
	targetReq := &model.TDataCatalogApply{
		CatalogID:  int64(catalogID),
		ApplyNum:   applyNum,
		CreateTime: time.Now().Format("2006-01-02 15:04:05"),
		ID:         int64(id),
	}
	return d.catalogRepo.CreateDataCatalogApply(ctx, targetReq)
}

func (d *DataResourceCatalogDomain) CreateDataInterfaceApply(ctx context.Context, catalogID string, applyNum int32, bizDate string) error {
	count1, _ := d.catalogRepo.GetInterfaceEntity(ctx, catalogID, bizDate)
	if count1 > 0 {
		// 存在更新
		log.Info("DataResourceCatalogDomain UpdateInterfaceApplyNum exist")
		return d.catalogRepo.UpdateInterfaceApplyNum(ctx, catalogID, bizDate)
	} else {
		log.Info("DataResourceCatalogDomain SaveInterfaceApplyNum not exist")
		id, err := utils.GetUniqueID()
		if err != nil {
			return err
		}
		targetReq := &model.TDataInterfaceApply{
			InterfaceID: catalogID,
			ApplyNum:    applyNum,
			BizDate:     bizDate,
			ID:          int64(id),
		}
		return d.catalogRepo.SaveInterfaceApplyNum(ctx, targetReq)
	}

}

func (d *DataResourceCatalogDomain) GetSampleData(ctx context.Context, req *data_resource_catalog.CatalogIDRequired) (*data_resource_catalog.GetSampleDataRes, error) {
	_, err := d.catalogRepo.Get(ctx, req.CatalogID.Uint64())
	if err != nil {
		return nil, err
	}
	dataCatalogColumns, err := d.columnRepo.Get(nil, ctx, req.CatalogID.Uint64())
	if err != nil {
		return nil, err
	}
	dataResources, err := d.dataResourceRepo.GetByCatalogId(ctx, req.CatalogID.Uint64())
	if err != nil {
		return nil, err
	}
	var logicView *data_view.GetFieldsRes
	for _, resource := range dataResources {
		if resource.Type == constant.MountView {
			if logicView, err = d.dataViewDriven.GetDataViewField(ctx, resource.ResourceId); err != nil {
				return nil, err
			}
		}
	}
	if logicView == nil {
		return nil, errorcode.Desc(errorcode.DataSourceNotFound)
	}

	SampleDataRes, err := d.dataViewDriven.GetSampleData(ctx, logicView.ID)
	if err != nil {
		return nil, err
	}
	res := &data_resource_catalog.GetSampleDataRes{
		FetchDataRes: &virtual_engine.FetchDataRes{
			TotalCount: SampleDataRes.TotalCount,
			Columns:    SampleDataRes.Columns,
			Data:       SampleDataRes.Data,
		},
		Type: SampleDataRes.Type,
	}
	if SampleDataRes.Type == constant.Synthetic {
		return res, nil
	}

	//脱敏
	classified := make(map[string]bool)
	sensitive := make(map[string]bool)
	for _, column := range dataCatalogColumns {
		if column.ClassifiedFlag.Int16 == 1 {
			classified[column.TechnicalName] = true
		} else if column.SensitiveFlag.Int16 == 1 {
			sensitive[column.TechnicalName] = true
		}
	}
	for i, column := range res.Columns {
		if classified[column.Name] == true {
			for j, _ := range res.Data {
				res.Data[j][i] = "**********"
			}
		}
		if sensitive[column.Name] == true {
			for j, _ := range res.Data {
				res.Data[j][i] = MaskHalfString(fmt.Sprintf("%v", res.Data[j][i]))
			}
		}
	}
	return res, nil
}

// MaskHalfString 将字符串的一半字符替换为 * 号（支持中文）
func MaskHalfString(input string) string {
	runes := []rune(input)
	length := len(runes)
	half := length / 2

	maskedRunes := append(runes[:half], make([]rune, length-half)...)
	for i := range maskedRunes[half:] {
		maskedRunes[half+i] = '*'
	}

	return string(maskedRunes)
}

func (d *DataResourceCatalogDomain) DataGetOverview(ctx context.Context, req *data_resource_catalog.DataGetOverviewReq) (res *data_resource_catalog.DataGetOverviewRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
	}
	subjectMap := make(map[string][]any)
	res = d.catalogRepo.DataGetOverview(ctx, req)
	for _, group := range res.CatalogSubjectGroup {
		if _, exist := subjectMap[group.SubjectID]; !exist {
			subjectMap[group.SubjectID] = make([]any, 4)
			subjectMap[group.SubjectID][0] = group.SubjectName
			subjectMap[group.SubjectID][1] = group.Count
		} else {
			subjectMap[group.SubjectID][1] = group.Count
		}
	}
	for _, group := range res.ViewSubjectGroup {
		if _, exist := subjectMap[group.SubjectID]; !exist {
			subjectMap[group.SubjectID] = make([]any, 4)
			subjectMap[group.SubjectID][0] = group.SubjectName
			subjectMap[group.SubjectID][2] = group.Count
		} else {
			subjectMap[group.SubjectID][2] = group.Count
		}
	}
	for _, group := range res.CatalogDepartSubjectGroup {
		if _, exist := subjectMap[group.SubjectID]; !exist {
			subjectMap[group.SubjectID] = make([]any, 4)
			subjectMap[group.SubjectID][0] = group.SubjectName
			subjectMap[group.SubjectID][3] = group.Count
		} else {
			subjectMap[group.SubjectID][3] = group.Count
		}
	}
	res.SubjectGroup = make([][]any, 4)
	for i := 0; i < 4; i++ {
		res.SubjectGroup[i] = make([]any, len(subjectMap))
	}
	var count int
	for _, value := range subjectMap {
		res.SubjectGroup[0][count] = value[0]
		res.SubjectGroup[1][count] = value[1]
		res.SubjectGroup[2][count] = value[2]
		res.SubjectGroup[3][count] = value[3]
		count++
	}

	return
}

func (d *DataResourceCatalogDomain) DataGetDepartmentDetail(ctx context.Context, req *data_resource_catalog.DataGetDepartmentDetailReq) (res *data_resource_catalog.DataGetDepartmentDetailRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
	}
	if len(req.DepartmentID) > 0 {
		req.SubDepartmentIDs = append(req.SubDepartmentIDs, util.DuplicateStringRemoval(req.DepartmentID)...)
	}
	var departIds []string
	res, departIds = d.catalogRepo.DataGetDepartmentDetail(ctx, req)

	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	for _, e := range res.Entries {
		e.DepartmentName = departmentNameMap[e.DepartmentID]
		e.DepartmentPath = departmentPathMap[e.DepartmentID]
	}
	return

}

func (d *DataResourceCatalogDomain) DataGetAggregationOverview(ctx context.Context, req *data_resource_catalog.DataGetDepartmentDetailReq) (res *data_resource_catalog.DataGetAggregationOverviewRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
	}
	return d.catalogRepo.DataGetAggregationOverview(ctx, req)
}

// DataAssetsOverview 数据资产概览统计
func (d *DataResourceCatalogDomain) DataAssetsOverview(ctx context.Context, req *data_resource_catalog.DataAssetsOverviewReq) (res *data_resource_catalog.DataAssetsOverviewRes, err error) {
	return d.catalogRepo.DataAssetsOverview(ctx, req)
}

// DataAssetsDetail 数据资产部门详情统计
func (d *DataResourceCatalogDomain) DataAssetsDetail(ctx context.Context, req *data_resource_catalog.DataAssetsDetailReq) (res *data_resource_catalog.DataAssetsDetailRes, err error) {
	// 获取统计数据
	res, err = d.catalogRepo.DataAssetsDetail(ctx, req)
	if err != nil {
		return nil, err
	}

	// 收集有效的UUID格式的部门ID（用于查询配置中心）
	// 注意：配置中心只接受UUID格式，非UUID格式（如雪花ID）会导致参数验证失败
	departmentIDs := make([]string, 0)
	uuidPattern := regexp.MustCompile(`^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$`)

	for _, entry := range res.Entries {
		// 只收集UUID格式的部门ID，排除全0 UUID
		if entry.DepartmentID != "" &&
			entry.DepartmentID != "00000000-0000-0000-0000-000000000000" &&
			uuidPattern.MatchString(entry.DepartmentID) {
			departmentIDs = append(departmentIDs, entry.DepartmentID)
		}
	}

	// 如果有UUID格式的部门ID，查询配置中心获取名称
	if len(departmentIDs) > 0 {
		departmentNameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departmentIDs))
		if err != nil {
			return nil, err
		}

		// 更新所有部门名称
		for _, entry := range res.Entries {
			if entry.DepartmentID == "00000000-0000-0000-0000-000000000000" {
				// 全0的UUID显示为"无"
				entry.DepartmentName = "无"
			} else if uuidPattern.MatchString(entry.DepartmentID) && entry.DepartmentName == entry.DepartmentID {
				// UUID格式：只有当名称等于ID时（说明是Repository层设置的默认值），才尝试覆盖
				if name, exists := departmentNameMap[entry.DepartmentID]; exists && name != "" {
					// 如果配置中心查询成功且名称不为空，使用查询到的名称
					entry.DepartmentName = name
				}
				// 否则保持原样（名称仍等于ID，后续会被过滤）
			}
			// 非UUID格式（雪花ID等）或已有真实名称的，保持不变（后续会被过滤）
		}
	} else {
		// 如果没有UUID格式的部门ID需要查询，处理特殊值
		for _, entry := range res.Entries {
			if entry.DepartmentID == "00000000-0000-0000-0000-000000000000" {
				entry.DepartmentName = "无"
			}
		}
	}

	// 按部门名称去重合并（与概览接口保持一致）
	// 概览接口统计的是不重复的部门名称数量，所以明细也应该按名称去重
	nameToEntry := make(map[string]*data_resource_catalog.DataAssetsDetailEntry)
	for _, entry := range res.Entries {
		// 过滤条件：
		// 1. 部门名称为"无"的数据（部门ID为全0 UUID）
		// 2. 部门名称为空的数据
		// 3. 部门名称等于部门ID的数据（说明配置中心查询失败，部门可能已删除或不存在）
		if entry.DepartmentName == "无" ||
			entry.DepartmentName == "" ||
			entry.DepartmentName == entry.DepartmentID {
			continue
		}

		if existing, exists := nameToEntry[entry.DepartmentName]; exists {
			// 如果部门名称已存在，合并统计数据
			existing.InfoResourceCount += entry.InfoResourceCount
			existing.DataResourceCount += entry.DataResourceCount
			existing.DatabaseTableCount += entry.DatabaseTableCount
			existing.APICount += entry.APICount
			existing.FileCount += entry.FileCount
		} else {
			// 新的部门名称，添加到map中
			nameToEntry[entry.DepartmentName] = entry
		}
	}

	// 转换为切片
	allMergedEntries := make([]*data_resource_catalog.DataAssetsDetailEntry, 0, len(nameToEntry))
	for _, entry := range nameToEntry {
		allMergedEntries = append(allMergedEntries, entry)
	}

	// 排序：按部门名称排序，确保每次查询顺序一致（解决分页数据不固定问题）
	sort.Slice(allMergedEntries, func(i, j int) bool {
		return allMergedEntries[i].DepartmentName < allMergedEntries[j].DepartmentName
	})

	// 设置总数（去重且过滤后的数量）
	res.TotalCount = int64(len(allMergedEntries))

	// 分页处理（在Domain层进行）
	if req.Limit != nil && *req.Limit > 0 {
		offset := 0
		if req.Offset != nil && *req.Offset > 1 {
			offset = (*req.Offset - 1) * *req.Limit
		}

		// 边界检查
		if offset >= len(allMergedEntries) {
			res.Entries = make([]*data_resource_catalog.DataAssetsDetailEntry, 0)
		} else {
			end := offset + *req.Limit
			if end > len(allMergedEntries) {
				end = len(allMergedEntries)
			}
			res.Entries = allMergedEntries[offset:end]
		}
	} else {
		// 不分页，返回所有数据
		res.Entries = allMergedEntries
	}

	return res, nil
}

// DataUnderstandOverview 数据资产部门详情统计
func (d *DataResourceCatalogDomain) DataUnderstandOverview(ctx context.Context, req *data_resource_catalog.DataUnderstandOverviewReq) (res *data_resource_catalog.DataUnderstandOverviewRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
	}
	res = d.catalogRepo.DataUnderstandOverview(ctx, req)

	tmp := []string{"信用信息", "金融信息", "医疗健康", "城市交通", "文化旅游", "行政执法", "党的建设"}
	for _, t := range tmp {
		if _, exist := res.CatalogDomainGroup[t]; !exist {
			res.CatalogDomainGroup[t] = 0
		}
		if _, exist := res.ViewDomainGroup[t]; !exist {
			res.ViewDomainGroup[t] = 0
		}
		if _, exist := res.SubjectDomainGroup[t]; !exist {
			res.SubjectDomainGroup[t] = 0
		}
	}
	return

}

// DataUnderstandDepartTopOverview 数据理解概览-部门完成率top30
func (d *DataResourceCatalogDomain) DataUnderstandDepartTopOverview(ctx context.Context, req *data_resource_catalog.DataUnderstandDepartTopOverviewReq) (res *data_resource_catalog.DataUnderstandDepartTopOverviewRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
	}
	if len(req.DepartmentID) > 0 {
		if req.SubDepartmentIDs == nil {
			req.SubDepartmentIDs = make([]string, 0)
		}
		for _, departmentId := range req.DepartmentID {
			util.SliceAdd(&req.SubDepartmentIDs, departmentId)
			departmentList, err := d.configurationCenterDriven.GetChildDepartments(ctx, departmentId)
			if err != nil {
				return nil, err
			}
			for _, entry := range departmentList.Entries {
				util.SliceAdd(&req.SubDepartmentIDs, entry.ID)
			}
		}
	}
	if req.MyDepartment || len(req.DepartmentID) > 0 {
		req.SubDepartmentIDs = util.DuplicateStringRemoval(req.SubDepartmentIDs)
	}
	res = &data_resource_catalog.DataUnderstandDepartTopOverviewRes{}
	res.Entries, res.TotalCount, err = d.catalogRepo.DataUnderstandDepartTopOverview(ctx, req)
	return
}

// DataUnderstandDomainOverview 数据资产部门详情统计
func (d *DataResourceCatalogDomain) DataUnderstandDomainOverview(ctx context.Context, req *data_resource_catalog.DataUnderstandDomainOverviewReq) (res *data_resource_catalog.DataUnderstandDomainOverviewRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
	}
	res, err = d.catalogRepo.DataUnderstandDomainOverview(ctx, req)
	if err != nil {
		return nil, err
	}

	catalogIDs := make([]uint64, 0)
	depIDs := make([]string, 0)
	for _, v := range res.CatalogInfo {
		for _, ca := range v {
			catalogIDs = append(catalogIDs, ca.ID)
			depIDs = append(depIDs, ca.DepartmentID)
		}
	}
	dataResources, err := d.dataResourceRepo.GetByCatalogIds(ctx, catalogIDs...)
	if err != nil {
		return nil, err
	}
	viewIDs := make([]string, 0)
	catalogIDVResourceIDMaps := make(map[uint64]string)
	for _, dataResource := range dataResources {
		if dataResource.Type == constant.MountView {
			viewIDs = append(viewIDs, dataResource.ResourceId)
			catalogIDVResourceIDMaps[dataResource.CatalogID] = dataResource.ResourceId
		}
	}
	//获取报告
	reports, err := d.catalogRepo.GetReportByViewIds(ctx, viewIDs...)
	if err != nil {
		return nil, err
	}
	reportMap := GenReportMap(reports)
	nameMap, _, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(depIDs))
	if err != nil {
		return nil, err
	}

	for k, v := range res.CatalogInfo {
		for i, ca := range v {
			if _, exist := catalogIDVResourceIDMaps[ca.ID]; exist {
				res.CatalogInfo[k][i].CompletenessScore = reportMap[catalogIDVResourceIDMaps[ca.ID]].CompletenessScore
				res.CatalogInfo[k][i].AccuracyScore = reportMap[catalogIDVResourceIDMaps[ca.ID]].AccuracyScore
			}
			res.CatalogInfo[k][i].DepartmentName = nameMap[ca.DepartmentID]
		}
	}
	return
}

// DataUnderstandTaskDetailOverview 理解任务详情
func (d *DataResourceCatalogDomain) DataUnderstandTaskDetailOverview(ctx context.Context, req *data_resource_catalog.DataUnderstandTaskDetailOverviewReq) (res *data_resource_catalog.DataUnderstandTaskDetailOverviewRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
	}

	req.StartTime, err = util.TimeParseReliable(req.Start)
	if err != nil {
		return
	}
	req.EndTime, err = util.TimeParseReliable(req.End)
	if err != nil {
		return
	}

	return d.catalogRepo.DataUnderstandTaskDetailOverview(ctx, req)

}

// DataUnderstandDepartDetailOverview 数据资产部门详情统计
func (d *DataResourceCatalogDomain) DataUnderstandDepartDetailOverview(ctx context.Context, req *data_resource_catalog.DataUnderstandDepartDetailOverviewReq) (res *data_resource_catalog.DataUnderstandDepartDetailOverviewRes, err error) {
	if req.MyDepartment {
		req.SubDepartmentIDs, err = d.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errorcode.Desc(errorcode.MyDepartmentNotExistError)
		}
		if len(req.DepartmentID) > 0 { //筛选本部门中的部门
			myDepartmentMap := make(map[string]bool)
			for _, id := range req.SubDepartmentIDs {
				myDepartmentMap[id] = true
			}
			subDepartmentIDs := make([]string, 0)
			for _, departmentID := range req.DepartmentID {
				if myDepartmentMap[departmentID] {
					subDepartmentIDs = append(subDepartmentIDs, departmentID)
				}
			}
			req.SubDepartmentIDs = subDepartmentIDs
		}
	}
	if !req.MyDepartment && len(req.DepartmentID) > 0 {
		if req.SubDepartmentIDs == nil {
			req.SubDepartmentIDs = make([]string, 0)
		}
		for _, departmentId := range req.DepartmentID {
			util.SliceAdd(&req.SubDepartmentIDs, departmentId)
			departmentList, err := d.configurationCenterDriven.GetChildDepartments(ctx, departmentId)
			if err != nil {
				return nil, err
			}
			for _, entry := range departmentList.Entries {
				util.SliceAdd(&req.SubDepartmentIDs, entry.ID)
			}
		}
	}
	res = &data_resource_catalog.DataUnderstandDepartDetailOverviewRes{}
	res.Entries, res.TotalCount, err = d.catalogRepo.DataUnderstandDepartDetailOverview(ctx, req)

	catalogIDs := make([]uint64, 0)
	for _, entry := range res.Entries {
		catalogIDs = append(catalogIDs, entry.ID)
	}
	dataResources, err := d.dataResourceRepo.GetByCatalogIds(ctx, catalogIDs...)
	if err != nil {
		return nil, err
	}
	viewIDs := make([]string, 0)
	catalogIDVResourceIDMaps := make(map[uint64]string)
	for _, dataResource := range dataResources {
		if dataResource.Type == constant.MountView {
			viewIDs = append(viewIDs, dataResource.ResourceId)
			catalogIDVResourceIDMaps[dataResource.CatalogID] = dataResource.ResourceId
		}
	}
	//获取报告
	reports, err := d.catalogRepo.GetReportByViewIds(ctx, viewIDs...)
	if err != nil {
		return nil, err
	}
	reportMap := GenReportMap(reports)

	for i := 0; i < len(res.Entries); i++ {
		if _, exist := catalogIDVResourceIDMaps[res.Entries[i].ID]; exist {
			res.Entries[i].CompletenessScore = reportMap[catalogIDVResourceIDMaps[res.Entries[i].ID]].CompletenessScore
			res.Entries[i].AccuracyScore = reportMap[catalogIDVResourceIDMaps[res.Entries[i].ID]].AccuracyScore
		}
	}
	return

}

type Report struct {
	CompletenessScore *float64 `json:"completeness_score"` //完整性维度评分，缺省为NULL
	TimelinessScore   *float64 `json:"timeliness_score"`   //及时性评分，缺省为NULL
	AccuracyScore     *float64 `json:"accuracy_score"`     //准确性维度评分，缺省为NULL
}

func GenReportMap(reports []*catalog_repo.Report) map[string]Report {
	//赋值挂载数据资源
	reportMap := make(map[string]Report)
	for _, report := range reports {
		if _, exist := reportMap[*report.TableID]; !exist {
			reportMap[*report.TableID] = Report{
				CompletenessScore: report.TotalCompleteness,
				AccuracyScore:     report.TotalAccuracy,
			}
		}
	}
	return reportMap
}
