package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	catalog_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"

	DVDrivenRepo "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	common_util "github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type DataResourceDomain struct {
	dataResourceRepo          repo.DataResourceRepo
	configurationCenterDriven configuration_center.Driven
	dataApplicationDriven     data_application_service.Driven
	dataViewDriven            data_view.Driven
	dataSubjectDriven         data_subject.Driven
	dvDrivenRepo              DVDrivenRepo.Repo
	es                        es.ESRepo
	catalogRepo               catalog_repo.DataResourceCatalogRepo
	catalogDomain             data_resource_catalog.DataResourceCatalogInternal
}

func NewDataResourceDomain(
	dataResourceRepo repo.DataResourceRepo,
	configurationCenterDriven configuration_center.Driven,
	dataApplicationDriven data_application_service.Driven,
	dataViewDriven data_view.Driven,
	dataSubjectDriven data_subject.Driven,
	dvDrivenRepo DVDrivenRepo.Repo,
	es es.ESRepo,
	catalogRepo catalog_repo.DataResourceCatalogRepo,
	catalogDomain data_resource_catalog.DataResourceCatalogInternal,
) *DataResourceDomain {
	return &DataResourceDomain{
		dataResourceRepo:          dataResourceRepo,
		configurationCenterDriven: configurationCenterDriven,
		dataApplicationDriven:     dataApplicationDriven,
		dataViewDriven:            dataViewDriven,
		dataSubjectDriven:         dataSubjectDriven,
		dvDrivenRepo:              dvDrivenRepo,
		es:                        es,
		catalogRepo:               catalogRepo,
		catalogDomain:             catalogDomain,
	}
}
func (d *DataResourceDomain) GetCount(ctx context.Context, req *domain.GetCountReq) (*domain.GetCountRes, error) {
	if req.UserDepartment {
		userInfo, err := common_util.GetUserInfo(ctx)
		if err != nil {
			return nil, err
		}
		req.MyDepartmentIDs, err = d.configurationCenterDriven.GetMainDepartIdsByUserID(ctx, userInfo.ID)
		if err != nil {
			return nil, err
		}
	}
	res, err := d.dataResourceRepo.GetCount(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return res, nil
}
func (d *DataResourceDomain) GetDataResourceList(ctx context.Context, req *domain.DataResourceInfoReq) (*domain.DataResourceRes, error) {
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
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId {
		req.SubSubjectIDs = []string{req.SubjectID}
		subjectList, err := d.dataSubjectDriven.GetSubjectList(ctx, req.SubjectID, "subject_domain,business_object,business_activity,logic_entity")
		if err != nil {
			return nil, err
		}
		for _, entry := range subjectList.Entries {
			req.SubSubjectIDs = append(req.SubSubjectIDs, entry.Id)
		}
	}
	if req.InfoSystemID != nil || req.DataSourceSourceType != "" || req.DatasourceType != "" || req.DatasourceId != "" {
		formViewList, err := d.dvDrivenRepo.GetDataViewList(ctx, DVDrivenRepo.PageListFormViewReqQueryParam{
			InfoSystemID:         req.InfoSystemID,
			DataSourceSourceType: req.DataSourceSourceType,
			DatasourceType:       req.DatasourceType,
			DatasourceId:         req.DatasourceId,
		})
		if err != nil {
			return nil, err
		}
		req.FormViewIDS = formViewList.GetFormViewIDS()
	}
	totalCount, dataResources, err := d.dataResourceRepo.GetDataResourceList(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	departIds := make([]string, 0)
	subjectIds := make([]string, 0)
	data := make([]*domain.DataResource, len(dataResources))
	for i, dataResource := range dataResources {
		departIds = append(departIds, dataResource.DepartmentId)
		subjectIds = append(subjectIds, dataResource.SubjectId)
		data[i] = &domain.DataResource{
			ResourceId:   dataResource.ResourceId,
			Name:         dataResource.Name,
			Code:         dataResource.Code,
			ResourceType: dataResource.Type,
			DepartmentID: dataResource.DepartmentId,
			SubjectID:    dataResource.SubjectId,
			PublishAt:    dataResource.PublishAt.UnixMilli(),
			CatalogID:    strconv.FormatUint(dataResource.CatalogID, 10),
		}
		if dataResource.InterfaceCount > 0 {
			viewInterface, err := d.dataResourceRepo.GetViewInterface(ctx, dataResource.ResourceId, false)
			if err != nil {
				return nil, err
			}
			data[i].Children = lo.Map(viewInterface, func(item *model.TDataResource, _ int) *domain.DataResource {
				return &domain.DataResource{
					ResourceId:   item.ResourceId,
					Name:         item.Name,
					Code:         item.Code,
					ResourceType: item.Type,
					DepartmentID: item.DepartmentId,
					SubjectID:    item.SubjectId,
					PublishAt:    item.PublishAt.UnixMilli(),
				}
			})
			departIds = append(departIds, lo.Map(data[i].Children, func(item *domain.DataResource, _ int) string { return item.DepartmentID })...)
			subjectIds = append(subjectIds, lo.Map(data[i].Children, func(item *domain.DataResource, _ int) string { return item.SubjectID })...)
		}
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}
	//获取所属主题map
	subjectNameMap, subjectPathIdMap, subjectPathMap, err := d.GetSubjectNameAndPathMap(ctx, util.DuplicateStringRemoval(subjectIds))
	if err != nil {
		return nil, err
	}

	for i, dataResource := range dataResources {
		data[i].Department = departmentNameMap[dataResource.DepartmentId]
		data[i].DepartmentPath = departmentPathMap[dataResource.DepartmentId]
		data[i].Subject = subjectNameMap[dataResource.SubjectId]
		data[i].SubjectPathId = subjectPathIdMap[dataResource.SubjectId]
		data[i].SubjectPath = subjectPathMap[dataResource.SubjectId]
		if dataResource.InterfaceCount > 0 {
			for _, child := range data[i].Children {
				child.Department = departmentNameMap[child.DepartmentID]
				child.DepartmentPath = departmentPathMap[child.DepartmentID]
				child.Subject = subjectNameMap[child.SubjectID]
				child.SubjectPathId = subjectPathIdMap[child.SubjectID]
				child.SubjectPath = subjectPathMap[child.SubjectID]
			}
		}
	}
	return &domain.DataResourceRes{
		Entries:    data,
		TotalCount: totalCount,
	}, nil
}

func (d *DataResourceDomain) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
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
func (d *DataResourceDomain) GetSubjectNameAndPathMap(ctx context.Context, subjectIds []string) (nameMap map[string]string, pathIdMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathIdMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(subjectIds) == 0 {
		return
	}
	subjectInfos, err := d.dataSubjectDriven.GetDataSubjectByID(ctx, subjectIds)
	if err != nil {
		return
	}
	for _, object := range subjectInfos.Objects {
		nameMap[object.ID] = object.Name
		pathIdMap[object.ID] = object.PathID
		pathMap[object.ID] = object.PathName
	}
	return nameMap, pathIdMap, pathMap, nil
}
func (d *DataResourceDomain) EntityChange(ctx context.Context, req domain.Content) (err error) {
	dataResources := make([]*model.TDataResource, 0)
	deleteResourceIds := make([]string, 0)
	switch req.TableName {
	case domain.TableNameFormView:
		for _, entity := range req.Entities {
			marshal, err := json.Marshal(entity)
			if err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameFormView json.Marshal", zap.Error(err))
				return err
			}
			var view *domain.ViewEntities
			if err = json.Unmarshal(marshal, &view); err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameFormView json.Unmarshal", zap.Error(err))
				return err
			}
			if req.Type == domain.ContentTypeDelete {
				deleteResourceIds = append(deleteResourceIds, view.ID)
				continue
			}
			if view.PublishAt == nil { //未发布
				return nil
			}
			dataResource := &model.TDataResource{
				Code: view.Code,
				//DepartmentId: view.DepartmentId.String,
				ResourceId: view.ID,
				Name:       view.Name,
				Type:       domain.ResourceTypeView,
				Status:     constant.ReSourceTypeNormal,
			}
			if view.PublishAt != nil {
				dataResource.PublishAt = view.PublishAt
			}
			dataResources = append(dataResources, dataResource)
		}

	case domain.TableNameService:
		for _, entity := range req.Entities {
			marshal, err := json.Marshal(entity)
			if err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameService json.Marshal", zap.Error(err))
				return err
			}
			var api *domain.ApiEntities
			if err = json.Unmarshal(marshal, &api); err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameService json.Unmarshal", zap.Error(err))
				return err
			}
			if req.Type == domain.ContentTypeDelete {
				deleteResourceIds = append(deleteResourceIds, api.ServiceID)
				continue
			}
			if _, exist := constant.UnPublishedMap[api.PublishStatus]; exist { //未发布
				return nil
			}
			dataResource := &model.TDataResource{
				Code:         api.ServiceCode,
				DepartmentId: api.DepartmentID,
				ResourceId:   api.ServiceID,
				Name:         api.ServiceName,
				Type:         domain.ResourceTypeService,
				Status:       constant.ReSourceTypeNormal,
			}
			if api.PublishTime != nil {
				dataResource.PublishAt = api.PublishTime
			}
			dataResources = append(dataResources, dataResource)

		}

	}
	if err = d.OperationHandler(ctx, req.Type, dataResources, deleteResourceIds, nil, nil); err != nil {
		log.Errorf("[mq]EntityChange dataResourceRepo   msg (%s) failed: %v", req.Entities, err.Error())
		return err
	}
	return nil
}

func (d *DataResourceDomain) ReliabilityEntityChange(ctx context.Context, req domain.Content) (err error) {
	dataResources := make([]*model.TDataResource, 0)
	deleteResourceIds := make([]string, 0)
	createInterfaceView := make([]string, 0)
	deleteInterfaceView := make([]string, 0)
	switch req.TableName {
	case domain.TableNameFormView:
		for _, entity := range req.Entities {
			marshal, err := json.Marshal(entity)
			if err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameFormView json.Marshal", zap.Error(err))
				return err
			}
			var view *domain.ViewEntities
			if err = json.Unmarshal(marshal, &view); err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameFormView json.Unmarshal", zap.Error(err))
				return err
			}
			if req.Type == domain.ContentTypeDelete {
				deleteResourceIds = append(deleteResourceIds, view.ID)
				continue
			}
			//Reliability
			time.Sleep(time.Second)
			viewDetails, err := d.dataViewDriven.GetDataViewDetails(ctx, view.ID)
			if err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange dataViewDriven GetDataViewDetails", zap.Error(err))
				return err
			}

			if viewDetails.PublishAt == 0 { //未发布
				return nil
			}
			dataResource := &model.TDataResource{
				ResourceId:   view.ID,
				Name:         viewDetails.BusinessName,
				Code:         viewDetails.UniformCatalogCode,
				Type:         domain.ResourceTypeView,
				DepartmentId: viewDetails.DepartmentID,
				SubjectId:    viewDetails.SubjectID,
				PublishAt:    util.MilliToTime(viewDetails.PublishAt),
				Status:       constant.ReSourceTypeNormal,
			}
			dataResources = append(dataResources, dataResource)
		}

	case domain.TableNameService:
		for _, entity := range req.Entities {
			marshal, err := json.Marshal(entity)
			if err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameService json.Marshal", zap.Error(err))
				return err
			}
			var api *domain.ApiEntities
			if err = json.Unmarshal(marshal, &api); err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange TableNameService json.Unmarshal", zap.Error(err))
				return err
			}
			if api.AuditStatus == "auditing" {
				continue //审核中不处理
			}
			if api.DeleteTime != 0 && api.IsChanged == "1" {
				continue //变更删除不处理
			}
			if req.Type == domain.ContentTypeDelete || api.DeleteTime != 0 {
				req.Type = domain.ContentTypeDelete
				deleteResourceIds = append(deleteResourceIds, api.ServiceID)
				continue
			}
			if api.ServiceID == "" {
				return nil
			}
			if req.Type == domain.ContentTypeUpdate && api.PublishStatus != constant.PublishStatusPublished { //
				return nil
			}
			//Reliability
			service, err := d.dataApplicationDriven.InternalGetServiceDetail(ctx, api.ServiceID)
			if err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange dataApplicationDriven GetService", zap.Error(err))
				return err
			}
			if service.ServiceInfo.PublishStatus != constant.PublishStatusPublished {
				return nil
			}
			if service.ServiceParam.DataViewId != "" { //service.ServiceInfo.ServiceType == "service_generate"
				switch req.Type {
				case domain.ContentTypeInsert:
					createInterfaceView = append(createInterfaceView, service.ServiceParam.DataViewId)
				case domain.ContentTypeDelete:
					deleteInterfaceView = append(deleteInterfaceView, service.ServiceParam.DataViewId)
				}
			}
			dataResource := &model.TDataResource{
				ResourceId:   service.ServiceInfo.ServiceID,
				Name:         service.ServiceInfo.ServiceName,
				Code:         service.ServiceInfo.ServiceCode,
				Type:         domain.ResourceTypeService,
				ViewId:       service.ServiceParam.DataViewId,
				DepartmentId: service.ServiceInfo.Department.Id,
				SubjectId:    service.ServiceInfo.SubjectDomainId,
				PublishAt:    util.TimeParse(service.ServiceInfo.PublishTime),
				Status:       constant.ReSourceTypeNormal,
			}
			dataResources = append(dataResources, dataResource)

		}

	}
	if err = d.OperationHandler(ctx, req.Type, dataResources, deleteResourceIds, createInterfaceView, deleteInterfaceView); err != nil {
		log.Errorf("[mq]EntityChange dataResourceRepo   msg (%s) failed: %v", req.Entities, err.Error())
		return err
	}
	return nil
}
func (d *DataResourceDomain) OperationHandler(ctx context.Context, reqType string, dataResources []*model.TDataResource, deleteResourceIds []string, createInterfaceView []string, deleteInterfaceView []string) (err error) {
	switch reqType {
	case domain.ContentTypeInsert:
		err = d.dataResourceRepo.CreateInBatches(ctx, dataResources)
	case domain.ContentTypeUpdate:
		for _, dataResource := range dataResources {
			orgResource, err := d.dataResourceRepo.GetByResourceId(ctx, dataResource.ResourceId)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					err = d.dataResourceRepo.Create(ctx, dataResource)
					return nil
				}
				log.WithContext(ctx).Error("[mq] EntityChange ContentTypeUpdate GetByResourceId or Create database error", zap.Error(err))
				return err
			}
			dataResource.ID = orgResource.ID
			err = d.dataResourceRepo.SyncViewSelect(ctx, dataResource)
		}
	case domain.ContentTypeDelete:
		for _, deleteResourceId := range deleteResourceIds {
			if err = d.dataResourceRepo.DeleteTransaction(ctx, deleteResourceId); err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange ContentTypeDelete DeleteTransaction error", zap.Error(err))
				return err
			}
		}
		for _, interfaceView := range deleteInterfaceView {
			if err = d.dataResourceRepo.UpdateInterfaceCount(ctx, interfaceView, -1); err != nil {
				log.WithContext(ctx).Error("[mq] EntityChange ContentTypeDelete UpdateInterfaceCount -1 error", zap.Error(err))
				return err
			}
		}
	}
	for _, interfaceView := range createInterfaceView {
		if err = d.dataResourceRepo.UpdateInterfaceCount(ctx, interfaceView, 1); err != nil {
			log.WithContext(ctx).Error("[mq] EntityChange ContentTypeDelete UpdateInterfaceCount +1 error", zap.Error(err))
			return err
		}
	}
	return
}

func (d *DataResourceDomain) InterfaceCatalog(ctx context.Context, data domain.InterfaceCatalog) (err error) {
	/*	service, err := d.dataApplicationDriven.InternalGetServiceDetail(ctx, data.ServiceID)
		if err != nil {
			log.WithContext(ctx).Error("[mq] EntityChange dataApplicationDriven GetService", zap.Error(err))
			return err
		}*/
	if data.DataViewId != "" { //service.ServiceInfo.ServiceType == "service_generate"
		switch data.Type {
		case domain.Create:
			if err = d.dataResourceRepo.UpdateInterfaceCount(ctx, data.DataViewId, 1); err != nil {
				log.WithContext(ctx).Error("[mq] InterfaceCatalog  UpdateInterfaceCount +1 error", zap.Error(err))
				return err
			}
			_ = d.UpdateCatalogMountToES(ctx, data.DataViewId)
		case domain.Delete:
			if err = d.dataResourceRepo.UpdateInterfaceCount(ctx, data.DataViewId, -1); err != nil {
				log.WithContext(ctx).Error("[mq] InterfaceCatalog  UpdateInterfaceCount -1 error", zap.Error(err))
				return err
			}
			_ = d.UpdateCatalogMountToES(ctx, data.DataViewId)
		}
	}
	dataResource := &model.TDataResource{
		ResourceId:   data.ServiceID,
		Name:         data.ServiceName,
		Code:         data.ServiceCode,
		Type:         domain.ResourceTypeService,
		ViewId:       data.DataViewId,
		DepartmentId: data.DepartmentId,
		SubjectId:    data.SubjectDomainId,
		PublishAt:    util.TimeParse(data.PublishTime),
		Status:       constant.ReSourceTypeNormal,
	}

	switch data.Type {
	case domain.Create:
		orgResource, err := d.dataResourceRepo.GetByResourceId(ctx, dataResource.ResourceId)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				err = d.dataResourceRepo.Create(ctx, dataResource)
				return nil
			}
			log.WithContext(ctx).Error("[mq] InterfaceCatalog Create GetByResourceId database error", zap.Error(err))
			return err
		}
		dataResource.ID = orgResource.ID
		err = d.dataResourceRepo.Update(ctx, dataResource)
	case domain.Update:
		orgResource, err := d.dataResourceRepo.GetByResourceId(ctx, dataResource.ResourceId)
		if err != nil {
			log.WithContext(ctx).Error("[mq] InterfaceCatalog Update GetByResourceId database error", zap.Error(err))
			return err
		}
		dataResource.ID = orgResource.ID
		err = d.dataResourceRepo.Update(ctx, dataResource)

	case domain.Delete:
		if err = d.dataResourceRepo.DeleteTransaction(ctx, data.ServiceID); err != nil {
			log.WithContext(ctx).Error("[mq] InterfaceCatalog  DeleteTransaction error", zap.Error(err))
			return err
		}
	}
	return nil
}
func (d *DataResourceDomain) UpdateCatalogMountToES(ctx context.Context, viewID string) error {
	dataResource, err := d.dataResourceRepo.GetByResourceId(ctx, viewID)
	if err != nil {
		return err
	}
	if dataResource != nil && dataResource.CatalogID != 0 {
		catalogID := dataResource.CatalogID
		catalogModel, err := d.catalogRepo.Get(ctx, catalogID)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get catalog info by catalogID: %d, err info: %v", catalogID, err.Error())
			return err
		}
		mountResources, esObjects, esCateInfos, columns, err := d.catalogDomain.GenEsEntity(ctx, catalogID) //视图下接口变更
		if err != nil {
			log.Error("DataResourceCatalogDomain GenEsEntity failed,err:", zap.Error(err))
			return err
		}
		err = d.es.PubToES(ctx, catalogModel, mountResources, esObjects, esCateInfos, columns) //接收审核推送
		if err != nil {
			log.Error("DataResourceCatalogDomain PubToES failed,err:", zap.Error(err))
			return err
		}
	}
	return nil
}
func (d *DataResourceDomain) QueryDataCatalogResourceList(ctx context.Context, req *domain.DataCatalogResourceListReq) (*response.PageResult[domain.DataCatalogResourceListObject], error) {
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId {
		req.SubSubjectIDs = []string{req.SubjectID}
		subjectList, err := d.dataSubjectDriven.GetSubjectList(ctx, req.SubjectID, "subject_domain_group,subject_domain,business_object,business_activity,logic_entity")
		if err != nil {
			return nil, err
		}
		for _, entry := range subjectList.Entries {
			util.SliceAdd(&req.SubSubjectIDs, entry.Id)
		}
	}
	totalCount, dataResources, err := d.dataResourceRepo.QueryDataCatalogResourceList(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	departIds := make([]string, 0)
	viewIds := make([]string, 0)
	for _, dataResource := range dataResources {
		departIds = append(departIds, dataResource.DepartmentId)
		viewIds = append(viewIds, dataResource.ResourceId)
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := d.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		log.WithContext(ctx).Warnf("query department error %v", err.Error())
	}
	//获取视图信息
	viewInfos, err := d.dataViewDriven.GetDataViewBasic(ctx, viewIds)
	if err != nil {
		log.WithContext(ctx).Warnf("query view error %v", err.Error())
		return nil, err
	}
	viewInfoDict := lo.SliceToMap(viewInfos, func(item *data_view.ViewBasicInfo) (string, data_view.ViewBasicInfo) {
		return item.Id, *item
	})
	//获取数据库类型
	dsids := make([]string, 0)
	for _, viewInfo := range viewInfos {
		if viewInfo.DatasourceId != "" {
			dsids = append(dsids, viewInfo.DatasourceId)
		}
	}
	dsids = lo.Uniq(dsids)
	datasourceInfo, err := d.configurationCenterDriven.GetDataSourcePrecision(ctx, dsids)
	if err != nil {
		log.WithContext(ctx).Warnf("query view datasource error %v", err.Error())
	}
	datasourceInfoDict := lo.SliceToMap(datasourceInfo, func(item *configuration_center.DataSourcesPrecision) (string, configuration_center.DataSourcesPrecision) {
		return item.ID, *item
	})

	data := make([]*domain.DataCatalogResourceListObject, len(dataResources))
	for i, dataResource := range dataResources {
		data[i] = &domain.DataCatalogResourceListObject{
			ResourceId:     dataResource.ResourceId,
			Code:           dataResource.Code,
			Department:     departmentNameMap[dataResource.DepartmentId],
			DepartmentPath: departmentPathMap[dataResource.DepartmentId],
			ResourceName:   dataResource.Name,
			TechnicalName:  viewInfoDict[dataResource.ResourceId].TechnicalName,
			PublishAt:      dataResource.PublishAt.UnixMilli(),
			ResourceType:   dataResource.Type,
			CatalogName:    dataResource.CatalogName,
			DatasourceID:   viewInfoDict[dataResource.ResourceId].DatasourceId,
			CatalogID:      fmt.Sprintf("%v", dataResource.CatalogID),
		}
		if data[i].DatasourceID == "" {
			continue
		}
		//补上数据库类型
		data[i].DatasourceType = datasourceInfoDict[data[i].DatasourceID].TypeName
	}
	return &response.PageResult[domain.DataCatalogResourceListObject]{
		TotalCount: totalCount,
		Entries:    data,
	}, nil
}
