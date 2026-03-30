package impl

import (
	"context"
	"strconv"
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/task_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
	utilGoCommon "github.com/kweaver-ai/idrm-go-common/util"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"
)

func (c *ComprehensionDomainImpl) TemplateNameExist(ctx context.Context, req *domain.TemplateNameExistReq) error {
	if err := c.templateRepo.NameExist(ctx, req.ID, req.Name); err != nil {
		return err
	}
	return nil
}
func (c *ComprehensionDomainImpl) CreateTemplate(ctx context.Context, req *domain.TemplateReq, tx ...*gorm.DB) (string, error) {
	if err := c.templateRepo.NameExist(ctx, "", req.Name); err != nil {
		return "", err
	}
	userInfo, err := utilGoCommon.GetUserInfo(ctx)
	if err != nil {
		return "", err
	}
	id := uuid.NewString()
	var db *gorm.DB
	if len(tx) != 0 {
		db = tx[0]
	}
	err = c.templateRepo.Create(ctx, &model.TDataComprehensionTemplate{
		ID:                        id,
		Name:                      req.Name,
		Description:               req.Description,
		BusinessObject:            *req.TemplateConfig.BusinessObject,
		TimeRange:                 *req.TemplateConfig.TimeRange,
		TimeFieldComprehension:    *req.TemplateConfig.TimeFieldComprehension,
		SpatialRange:              *req.TemplateConfig.SpatialRange,
		SpatialFieldComprehension: *req.TemplateConfig.SpatialFieldComprehension,
		BusinessSpecialDimension:  *req.TemplateConfig.BusinessSpecialDimension,
		CompoundExpression:        *req.TemplateConfig.CompoundExpression,
		ServiceRange:              *req.TemplateConfig.ServiceRange,
		ServiceAreas:              *req.TemplateConfig.ServiceAreas,
		FrontSupport:              *req.TemplateConfig.FrontSupport,
		NegativeSupport:           *req.TemplateConfig.NegativeSupport,
		ProtectControl:            *req.TemplateConfig.ProtectControl,
		PromotePush:               *req.TemplateConfig.PromotePush,
		CreatedUID:                userInfo.ID,
		UpdatedUID:                userInfo.ID,
	}, db)
	if err != nil {
		return "", errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return id, nil
}

func (c *ComprehensionDomainImpl) UpdateTemplate(ctx context.Context, req *domain.UpdateTemplateReq) (err error) {
	templateRelation, err := c.taskCenterDriven.GetComprehensionTemplateRelation(ctx, &task_center.GetComprehensionTemplateRelationReq{TemplateIds: []string{req.ID}})
	if err != nil {
		return errorcode.Detail(errorcode.DrivenGetComprehensionTemplateRelationFailed, err.Error())
	}
	userInfo, err := utilGoCommon.GetUserInfo(ctx)
	if err != nil {
		return err
	}
	if len(templateRelation.TemplateIds) > 0 {
		tx := c.templateRepo.Db()
		if err = c.templateRepo.Delete(ctx, &model.TDataComprehensionTemplate{
			ID:         req.ID,
			DeletedAt:  soft_delete.DeletedAt(time.Now().UnixMilli()),
			DeletedUID: userInfo.ID,
		}, tx); err != nil {
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		if _, err = c.CreateTemplate(ctx, &req.TemplateReq, tx); err != nil {
			return err
		}
	}
	err = c.templateRepo.Update(ctx, &model.TDataComprehensionTemplate{
		ID:                        req.ID,
		Name:                      req.Name,
		Description:               req.Description,
		BusinessObject:            *req.TemplateConfig.BusinessObject,
		TimeRange:                 *req.TemplateConfig.TimeRange,
		TimeFieldComprehension:    *req.TemplateConfig.TimeFieldComprehension,
		SpatialRange:              *req.TemplateConfig.SpatialRange,
		SpatialFieldComprehension: *req.TemplateConfig.SpatialFieldComprehension,
		BusinessSpecialDimension:  *req.TemplateConfig.BusinessSpecialDimension,
		CompoundExpression:        *req.TemplateConfig.CompoundExpression,
		ServiceRange:              *req.TemplateConfig.ServiceRange,
		ServiceAreas:              *req.TemplateConfig.ServiceAreas,
		FrontSupport:              *req.TemplateConfig.FrontSupport,
		NegativeSupport:           *req.TemplateConfig.NegativeSupport,
		ProtectControl:            *req.TemplateConfig.ProtectControl,
		PromotePush:               *req.TemplateConfig.PromotePush,
		UpdatedAt:                 time.Now(),
		UpdatedUID:                userInfo.ID,
	})
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (c *ComprehensionDomainImpl) GetTemplateList(ctx context.Context, req *domain.GetTemplateListReq) (*domain.GetTemplateListRes, error) {
	total, list, err := c.templateRepo.PageList(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	templateIDs := make([]string, len(list))
	userId := make([]string, len(list))
	for i, template := range list {
		templateIDs[i] = template.ID
		userId[i] = template.UpdatedUID

	}
	//batch query templateRelation
	templateRelation, err := c.taskCenterDriven.GetComprehensionTemplateRelation(ctx, &task_center.GetComprehensionTemplateRelationReq{TemplateIds: templateIDs, Status: []int{1, 2}})
	if err != nil {
		return nil, errorcode.Detail(errorcode.DrivenGetComprehensionTemplateRelationFailed, err.Error())
	}
	templateRelationMap := make(map[string]bool)
	for _, t := range templateRelation.TemplateIds {
		templateRelationMap[t] = true
	}
	userIdNameMap, err := c.GetUserMap(ctx, userId)
	if err != nil {
		return nil, err
	}

	res := make([]*domain.TemplateListRes, len(list))
	for i, template := range list {
		res[i] = &domain.TemplateListRes{
			ID:          template.ID,
			Name:        template.Name,
			Description: template.Description,
			UpdatedAt:   template.UpdatedAt.UnixMilli(),
			UpdatedUID:  template.UpdatedUID,
			UpdatedUser: userIdNameMap[template.UpdatedUID],
			RelationTag: templateRelationMap[template.ID],
		}
	}
	return &domain.GetTemplateListRes{
		Entries:    res,
		TotalCount: total,
	}, nil
}
func (c *ComprehensionDomainImpl) GetUserMap(ctx context.Context, userId []string) (map[string]string, error) {
	userIdNameMap := make(map[string]string)
	userId = util.DuplicateStringRemoval(userId)
	if len(userId) != 0 {
		users, err := c.configurationCenterCommonDriven.GetUsers(ctx, userId)
		if err != nil {
			return nil, errorcode.Detail(errorcode.GetUserInfoFailed, err.Error())
		}
		for _, u := range users {
			userIdNameMap[u.ID] = u.Name
		}
	}
	return userIdNameMap, nil
}
func (c *ComprehensionDomainImpl) GetTemplateDetail(ctx context.Context, req *domain.GetTemplateDetailReq) (res *domain.GetTemplateDetailRes, err error) {
	comprehensionTemplate, err := c.templateRepo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &domain.GetTemplateDetailRes{
		TemplateReq: domain.TemplateReq{
			Name:        comprehensionTemplate.Name,
			Description: comprehensionTemplate.Description,
			TemplateConfig: domain.TemplateConfig{
				BusinessObject:            &comprehensionTemplate.BusinessObject,
				TimeRange:                 &comprehensionTemplate.TimeRange,
				TimeFieldComprehension:    &comprehensionTemplate.TimeFieldComprehension,
				SpatialRange:              &comprehensionTemplate.SpatialRange,
				SpatialFieldComprehension: &comprehensionTemplate.SpatialFieldComprehension,
				BusinessSpecialDimension:  &comprehensionTemplate.BusinessSpecialDimension,
				CompoundExpression:        &comprehensionTemplate.CompoundExpression,
				ServiceRange:              &comprehensionTemplate.ServiceRange,
				ServiceAreas:              &comprehensionTemplate.ServiceAreas,
				FrontSupport:              &comprehensionTemplate.FrontSupport,
				NegativeSupport:           &comprehensionTemplate.NegativeSupport,
				ProtectControl:            &comprehensionTemplate.ProtectControl,
				PromotePush:               &comprehensionTemplate.PromotePush,
			},
		},
	}, nil
}

func (c *ComprehensionDomainImpl) GetTemplateConfig(ctx context.Context, templateID string) (*domain.Configuration, error) {
	if templateID != "" {
		template, err := c.templateRepo.GetById(ctx, templateID)
		if err != nil {
			return nil, err
		}
		return domain.WireConfig(template), nil
	}
	return &domain.Configuration{
		Note:            domain.WireDefaultConfig().Note,
		DimensionConfig: domain.WireDefaultConfig().DimensionConfig,
		Choices:         nil,
	}, nil
}
func (c *ComprehensionDomainImpl) DeleteTemplate(ctx context.Context, req *domain.IDRequired) (err error) {
	userInfo, err := utilGoCommon.GetUserInfo(ctx)
	if err != nil {
		return err
	}
	templateRelation, err := c.taskCenterDriven.GetComprehensionTemplateRelation(ctx, &task_center.GetComprehensionTemplateRelationReq{TemplateIds: []string{req.ID}, Status: []int{1, 2}})
	if err != nil {
		return errorcode.Detail(errorcode.DrivenGetComprehensionTemplateRelationFailed, err.Error())
	}
	if len(templateRelation.TemplateIds) != 0 {
		return errorcode.Desc(errorcode.DataComprehensionTemplateBindRunningTask)
	}
	err = c.templateRepo.Delete(ctx, &model.TDataComprehensionTemplate{
		ID:         req.ID,
		DeletedAt:  soft_delete.DeletedAt(time.Now().UnixMilli()),
		DeletedUID: userInfo.ID,
	})
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (c *ComprehensionDomainImpl) GetTaskCatalogList(ctx context.Context, req *domain.GetTaskCatalogListReq) (res *domain.GetTaskCatalogListRes, err error) {
	taskDetail, err := c.taskCenterCommonDriven.GetTaskDetailById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	catalogIds := make([]uint64, len(taskDetail.DataCatalogID))
	for i, catalogId := range taskDetail.DataCatalogID {
		catalogIds[i], err = strconv.ParseUint(catalogId, 10, 64)
		if err != nil {
			return nil, err
		}
	}
	catalogs, err := c.catalogRepo.GetDetailByIds(nil, ctx, nil, catalogIds...)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	dataResources, err := c.dataResourceRepo.GetByCatalogIds(ctx, catalogIds...)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	dataResourceMap := make(map[uint64]string)
	for _, resource := range dataResources {
		dataResourceMap[resource.CatalogID] = resource.Name
	}
	comprehensionDetails, err := c.repo.GetByCatalogIds(ctx, catalogIds)
	//comprehensionDetails, err := c.repo.GetByTaskId(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	comprehensionDetailMap := make(map[uint64]*model.DataComprehensionDetail)
	for _, comprehensionDetail := range comprehensionDetails {
		comprehensionDetailMap[comprehensionDetail.CatalogID] = comprehensionDetail
	}

	catalogList := make([]*domain.CatalogList, len(catalogs))
	for i, catalog := range catalogs {
		catalogList[i] = &domain.CatalogList{
			CatalogID:          strconv.FormatUint(catalog.ID, 10),
			CatalogName:        catalog.Title,
			CatalogDescription: catalog.Description,
			ViewName:           dataResourceMap[catalog.ID],
		}
		if detail, exist := comprehensionDetailMap[catalog.ID]; exist {
			catalogList[i].ReportStatus = detail.Status
			catalogList[i].ComprehensionCreateUser = detail.CreatorName
			catalogList[i].ComprehensionUpdateTime = detail.UpdatedAt.UnixMilli()
		} else {
			catalogList[i].ReportStatus = 1
		}
	}
	return &domain.GetTaskCatalogListRes{
		CatalogList: catalogList,
		TemplateID:  taskDetail.DataComprehensionTemplateID,
	}, nil
}

//func (c *ComprehensionDomainImpl) GetTaskCatalogList(ctx context.Context, req *domain.GetTaskCatalogListReq) (*domain.GetTaskCatalogListRes, error) {
//	taskDetail, err := c.taskCenterCommonDriven.GetTaskDetailById(ctx, req.ID)
//	if err != nil {
//		return nil, err
//	}
//	return c.GetDataComprehensionList(ctx, taskDetail.DataCatalogID, taskDetail.DataComprehensionTemplateID)
//}

func (c *ComprehensionDomainImpl) GetReportList(ctx context.Context, req *domain.GetReportListReq) (*domain.GetReportListRes, error) {
	if ctx.Value(interception.PermissionScope) == constant.CurrentDepartment || (req.CurrentDepartment != nil && *req.CurrentDepartment) {
		subDepartmentIDs, err := c.departmentDomain.GetDepart(ctx)
		if err != nil {
			return nil, err
		}
		req.SubDepartmentIDs = util.DuplicateStringRemoval(subDepartmentIDs)
	} else if req.DepartmentID != "" {
		req.SubDepartmentIDs = []string{req.DepartmentID}
		departmentList, err := c.configurationCenterCommonDriven.GetChildDepartments(ctx, req.DepartmentID)
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			util.SliceAdd(&req.SubDepartmentIDs, entry.ID)
		}
	}
	total, list, err := c.repo.ListByPage(ctx, req)
	if err != nil {
		return nil, err
	}
	catalogIDs := make([]uint64, len(list))
	userId := make([]string, len(list))
	departIds := make([]string, 0)
	for i, report := range list {
		catalogIDs[i] = report.CatalogID
		userId[i] = report.CreatorUID
		if report.DepartmentID != "" {
			departIds = append(departIds, report.DepartmentID)
		}
	}

	userIdNameMap, err := c.GetUserMap(ctx, userId)
	if err != nil {
		return nil, err
	}
	dataCatalogs, err := c.catalogRepo.GetDetailByIds(nil, ctx, nil, catalogIDs...)
	if err != nil {
		return nil, err
	}
	dataCatalogMap := make(map[uint64]string)
	for _, dataCatalog := range dataCatalogs {
		dataCatalogMap[dataCatalog.ID] = dataCatalog.Title
	}
	//获取所属部门map
	departmentNameMap, departmentPathMap, err := c.GetDepartmentNameAndPathMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}

	reportList := make([]*domain.ReportList, len(list))
	for i, report := range list {
		reportList[i] = &domain.ReportList{
			CatalogId:      strconv.FormatUint(report.CatalogID, 10),
			CatalogName:    dataCatalogMap[report.CatalogID],
			TemplateID:     report.TemplateID,
			TaskId:         report.TaskId,
			CreatedUID:     report.CreatorUID,
			CreatedUser:    userIdNameMap[report.CreatorUID],
			UpdatedAt:      report.UpdatedAt.UnixMilli(),
			DepartmentId:   report.DepartmentID,
			Department:     departmentNameMap[report.DepartmentID],
			DepartmentPath: departmentPathMap[report.DepartmentID],
		}
	}
	return &domain.GetReportListRes{
		Entries:    reportList,
		TotalCount: total,
	}, nil
}
func (c *ComprehensionDomainImpl) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := c.configurationCenterCommonDriven.GetDepartmentPrecision(ctx, departmentIds)
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
func (c *ComprehensionDomainImpl) GetCatalogList(ctx context.Context, req *domain.GetCatalogListReq) (*domain.GetCatalogListRes, error) {
	total, catalog, err := c.repo.GetCatalog(ctx, req)
	if err != nil {
		return nil, err
	}
	return &domain.GetCatalogListRes{
		Entries:    catalog,
		TotalCount: total,
	}, nil
}
