package impl

import (
	"context"
	"fmt"
	"sort"
	"strconv"
	"strings"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_sync"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/demand_management"
	"github.com/kweaver-ai/idrm-go-common/rest/virtual_engine"
	wf_rest "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	//wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	//"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	//"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	//"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	//"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/cognitive_service_system"
	cognitive_service_system_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/cognitive_service_system"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_push"
	data_resource_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
	//"time"
)

type cognitiveServiceSystemDomainImpl struct {
	db                         *gorm.DB
	repo                       data_push.Repo
	wf                         workflow.WorkflowInterface
	wfDriven                   wf_rest.WorkflowDriven
	ccDriven                   configuration_center.Driven
	dataSyncDriven             data_sync.Driven
	dataResourceRepo           data_resource_repo.DataResourceRepo
	dataViewDriven             data_view.Driven
	virtualEngine              virtual_engine.Driven
	bgDriven                   business_grooming.Driven
	catalogRepo                data_catalog.RepoOp
	cognitiveServiceSystemRepo cognitive_service_system_repo.Repo
	dmDriven                   demand_management.Driven
	authRepo                   auth_service.Repo
	authorizationDriven        authorization.Driven
}

func NewCognitiveServiceSystemDomain(
	db *gorm.DB,
	repo data_push.Repo,
	wf workflow.WorkflowInterface,
	ccDriven configuration_center.Driven,
	dataSync data_sync.Driven,
	dataResourceRepo data_resource_repo.DataResourceRepo,
	dataViewDriven data_view.Driven,
	virtualEngine virtual_engine.Driven,
	bgDriven business_grooming.Driven,
	catalogRepo data_catalog.RepoOp,
	cognitiveServiceSystemRepo cognitive_service_system_repo.Repo,
	dmDriven demand_management.Driven,
	authRepo auth_service.Repo,
	authorizationDriven authorization.Driven,
) domain.CognitiveServiceSystemDomain {
	u := &cognitiveServiceSystemDomainImpl{
		db:                         db,
		repo:                       repo,
		wf:                         wf,
		ccDriven:                   ccDriven,
		dataSyncDriven:             dataSync,
		dataResourceRepo:           dataResourceRepo,
		dataViewDriven:             dataViewDriven,
		virtualEngine:              virtualEngine,
		bgDriven:                   bgDriven,
		catalogRepo:                catalogRepo,
		cognitiveServiceSystemRepo: cognitiveServiceSystemRepo,
		dmDriven:                   dmDriven,
		authRepo:                   authRepo,
		authorizationDriven:        authorizationDriven,
	}
	//u.RegisterWorkflowHandler()
	//u.Operation = u.NewOperationMachine()
	return u
}

func (u *cognitiveServiceSystemDomainImpl) Begin() *gorm.DB {
	return u.db.Begin()
}

func End(tx *gorm.DB, err error) {
	if err != nil {
		tx.Rollback()
	} else {
		tx.Commit()
	}
}

// 检查是否在用户部门以及子部门下面
func (u *cognitiveServiceSystemDomainImpl) CheckIfInUserDepartments(ctx context.Context, userDepartments []*configuration_center.DepartmentObject, departmentId string) (ifIn bool, err error) {

	for _, department := range userDepartments {
		if department.ID == departmentId {
			return true, nil
		}

		// 获取子目录
		nReq := configuration_center.QueryPageReqParam{
			ID:     department.ID,
			Limit:  0,
			Offset: 1,
		}
		subDepartmentList, err := u.ccDriven.GetDepartmentList(ctx, nReq)
		if err != nil {
			return false, err
		}

		for _, subDepartment := range subDepartmentList.Entries {
			if subDepartment.ID == departmentId {
				return true, nil
			}
		}
	}
	return false, nil

}

type ByPathID []*configuration_center.SummaryInfo

// Len 实现 sort.Interface 接口的 Len 方法
func (a ByPathID) Len() int { return len(a) }

// Swap 实现 sort.Interface 接口的 Swap 方法
func (a ByPathID) Swap(i, j int) { a[i], a[j] = a[j], a[i] }

// Less 实现 sort.Interface 接口的 Less 方法，按 Age 字段排序
func (a ByPathID) Less(i, j int) bool { return a[i].PathID < a[j].PathID }

type ByDataCatalogID []*domain.SingleCatalogInfoEntry

// Len 实现 sort.Interface 接口的 Len 方法
func (a ByDataCatalogID) Len() int { return len(a) }

// Swap 实现 sort.Interface 接口的 Swap 方法
func (a ByDataCatalogID) Swap(i, j int) { a[i], a[j] = a[j], a[i] }

// Less 实现 sort.Interface 接口的 Less 方法，按 Age 字段排序
func (a ByDataCatalogID) Less(i, j int) bool { return a[i].Name < a[j].Name }

func (u *cognitiveServiceSystemDomainImpl) GetSingleCatalogInfo(ctx context.Context, req *domain.GetSingleCatalogInfoReq) (*domain.GetSingleCatalogInfoRes, error) {
	//is, err := u.ccDriven.HasRoles(ctx, access_control.TCDataOperationEngineer, access_control.TCDataDevelopmentEngineer)
	//if err != nil {
	//	return nil, err
	//}
	uInfo := request.GetUserInfo(ctx)
	rs, err := u.authorizationDriven.HasInnerBusinessRoles(ctx, uInfo.ID)
	if err != nil {
		return nil, err
	}
	is := len(rs) > 0

	res := domain.GetSingleCatalogInfoRes{}
	res.Entries = []*domain.SingleCatalogInfoEntry{}
	if req.Type == "department" {
		departments, err := u.ccDriven.GetDepartmentsByUserID(ctx, uInfo.ID)
		if err != nil {
			return nil, err
		}
		departmentMap := map[string]*domain.SingleCatalogInfoEntry{}
		departmentList := []*domain.SingleCatalogInfoEntry{}
		for _, department := range departments {

			entity := domain.SingleCatalogInfoEntry{
				ID:               department.ID,
				Name:             department.Name,
				Type:             "department",
				Expand:           department.Expand,
				Children:         []*domain.SingleCatalogInfoEntry{},
				DepartmentPath:   department.Name,
				DepartmentPathId: department.ID,
			}

			if req.Keywords == "" {
				res.Entries = append(res.Entries, &entity)
			}

			departmentMap[department.ID] = &entity
			departmentList = append(departmentList, &entity)

			// 获取子目录
			nReq := configuration_center.QueryPageReqParam{
				ID:     entity.ID,
				Limit:  0,
				Offset: 1,
			}
			subDepartmentList, err := u.ccDriven.GetDepartmentList(ctx, nReq)
			if err != nil {
				return nil, err
			}

			if subDepartmentList.TotalCount > 0 {
				entity.Expand = true
			}

			// 重排序
			sort.Sort(ByPathID(subDepartmentList.Entries))

			for _, subDepartment := range subDepartmentList.Entries {

				subEntity := domain.SingleCatalogInfoEntry{
					ID:       subDepartment.ID,
					Name:     subDepartment.Name,
					Type:     "department",
					Expand:   subDepartment.Expand,
					Children: []*domain.SingleCatalogInfoEntry{},
					//DepartmentPath: departmentPath,
				}
				pathIDs := strings.Split(subDepartment.PathID, "/")
				parentId := pathIDs[len(pathIDs)-2]

				departmentMap[subEntity.ID] = &subEntity
				departmentList = append(departmentList, &subEntity)

				parentEntity := departmentMap[parentId]
				if parentEntity != nil {
					log.WithContext(ctx).Infof("SingleCatalog search department %s parentId %s not exist", subEntity.ID, parentId)
					departmentPath := fmt.Sprintf("%s/%s", parentEntity.DepartmentPath, subDepartment.Name)
					departmentPathId := fmt.Sprintf("%s/%s", parentEntity.DepartmentPathId, subDepartment.ID)
					subEntity.DepartmentPath = departmentPath
					subEntity.DepartmentPathId = departmentPathId
				}

				parentEntity.Children = append(parentEntity.Children, &subEntity)
			}

		}

		for _, entity := range departmentList {
			dataList, err := u.catalogRepo.GetListByOrgCode(nil, ctx, entity.ID)
			if err != nil {
				return nil, err
			}

			// 获取数据目录
			for _, data := range dataList {
				if !is && (data.OnlineStatus != "online" && data.OnlineStatus != "down-auditing" && data.OnlineStatus != "down-reject") {
					continue
				}
				dataResource, err := u.dataResourceRepo.GetByCatalogId(ctx, data.ID)
				if err != nil {
					return nil, err
				}
				if dataResource[0].Type != 1 {
					continue
				}

				formViewId := dataResource[0].ResourceId
				formViewInfo, err := u.dataViewDriven.GetDataViewDetails(ctx, formViewId)
				if err != nil {
					return nil, err
				}
				// 判断是否excel
				if formViewInfo.Sheet != "" {
					continue
				}

				dID := strconv.FormatUint(data.ID, 10)
				subEntity := domain.SingleCatalogInfoEntry{
					ID:               dID,
					Name:             data.Title,
					Type:             "data_catalog",
					ResourceType:     1,
					ResourceId:       formViewId,
					Expand:           false,
					DepartmentPath:   entity.DepartmentPath,
					DepartmentPathId: entity.DepartmentPathId,
				}
				if req.Keywords != "" && strings.Contains(strings.ToLower(data.Title), strings.ToLower(req.Keywords)) {
					res.Entries = append(res.Entries, &subEntity)
				}

				entity.Children = append(entity.Children, &subEntity)
				entity.Expand = true

			}
		}

	} else {
		req := demand_management.UserShareApplyResourceReq{
			Type:   1,
			UserId: uInfo.ID,
		}
		resp, err := u.dmDriven.GetUserShareApplyResource(ctx, &req)
		if err != nil {
			return nil, err
		}

		for _, entity := range resp.Entries {
			catalogId, err := strconv.ParseUint(entity.ResId, 10, 64)
			entityInfo, err := u.catalogRepo.Get(nil, ctx, catalogId)
			if err != nil {
				continue
			}
			if !is && (entityInfo.OnlineStatus != "online" && entityInfo.OnlineStatus != "down-auditing" && entityInfo.OnlineStatus != "down-reject") {
				continue
			}
			dataResource, err := u.dataResourceRepo.GetByCatalogId(ctx, entityInfo.ID)
			if err != nil {
				return nil, err
			}
			if dataResource[0].Type != 1 {
				continue
			}

			formViewId := dataResource[0].ResourceId
			formViewInfo, err := u.dataViewDriven.GetDataViewDetails(ctx, formViewId)
			if err != nil {
				return nil, err
			}
			// 判断是否excel
			if formViewInfo.Sheet != "" {
				continue
			}

			//dID := strconv.FormatUint(data.ID, 10)
			subEntity := domain.SingleCatalogInfoEntry{
				ID:               entity.ResId,
				Name:             entityInfo.Title,
				Type:             "data_catalog",
				ResourceType:     1,
				ResourceId:       formViewId,
				Expand:           false,
				DepartmentPath:   "",
				DepartmentPathId: "",
			}

			res.Entries = append(res.Entries, &subEntity)
		}

		// 重排序
		sort.Sort(ByDataCatalogID(res.Entries))

	}

	return &res, nil
}

func (u *cognitiveServiceSystemDomainImpl) SearchSingleCatalog(ctx context.Context, req *domain.SearchSingleCatalogReq) (*domain.SearchSingleCatalogRes, error) {
	num, err := strconv.ParseUint(req.DataCatalogId, 10, 64)
	dataResource, err := u.dataResourceRepo.GetByCatalogId(ctx, num)
	if err != nil {
		return nil, err
	}

	formViewId := dataResource[0].ResourceId

	newReq := data_view.DataPreviewReq{
		FormViewId:  formViewId,
		Fields:      req.Fields,
		Limit:       &req.Limit,
		Offset:      &req.Offset,
		Configs:     req.Configs,
		Direction:   req.Direction,
		SortFieldId: req.SortFieldId,
		IfCount:     1,
	}
	nRes, err := u.dataViewDriven.GetDataPreview(ctx, &newReq)
	if err != nil {
		return nil, err
	}

	if req.SearchType == "submit" {
		uInfo := request.GetUserInfo(ctx)
		data := model.TDataCatalogSearchHistory{
			ID:             uuid.New().String(),
			DataCatalogID:  num,
			Fields:         strings.Join(req.Fields, ","),
			FieldsDetails:  req.FieldsDetails,
			Configs:        req.Configs,
			Type:           req.Type,
			DepartmentPath: req.DepartmentPathId,
			CreatedByUID:   uInfo.ID,
			UpdatedByUID:   uInfo.ID,
			TotalCount:     nRes.TotalCount,
		}
		err = u.cognitiveServiceSystemRepo.CreateSingleCatalogHistory(ctx, &data)
		if err != nil {
			return nil, err
		}
	}

	res := domain.SearchSingleCatalogRes{
		DataPreviewResp: *nRes,
	}

	return &res, nil
}
func (u *cognitiveServiceSystemDomainImpl) CreateSingleCatalogTemplate(ctx context.Context, req *domain.CreateSingleCatalogTemplateReq) (*domain.CreateSingleCatalogTemplateRes, error) {

	uInfo := request.GetUserInfo(ctx)

	nameUnique, err := u.cognitiveServiceSystemRepo.CheckTemplateNameUnique(ctx, req.Name, uInfo.ID)
	if err != nil {
		return nil, err
	}
	if nameUnique {
		return nil, errorcode.Detail(errorcode.TemplateNameRepeat, "模板名字已经存在")
	}
	num, err := strconv.ParseUint(req.DataCatalogId, 10, 64)
	if err != nil {
		return nil, err
	}
	singleCatalogTemplateStruct := model.TDataCatalogSearchTemplate{
		ID:             uuid.New().String(),
		DataCatalogID:  num,
		Name:           req.Name,
		Description:    req.Description,
		Fields:         strings.Join(req.Fields, ","),
		FieldsDetails:  req.FieldsDetails,
		Configs:        req.Configs,
		Type:           req.Type,
		DepartmentPath: req.DepartmentPathId,
		CreatedByUID:   uInfo.ID,
		UpdatedByUID:   uInfo.ID,
	}

	err = u.cognitiveServiceSystemRepo.CreateSingleCatalogTemplate(ctx, &singleCatalogTemplateStruct)
	if err != nil {
		return nil, err
	}

	res := domain.CreateSingleCatalogTemplateRes{}
	return &res, nil
}

func (u *cognitiveServiceSystemDomainImpl) GetCatalogDepartmentStatus(ctx context.Context, templateDepartmentPath string, catalogDepartmentId string, userDepartments []*configuration_center.DepartmentObject, isDevOpe bool) (errorType int, err error) {
	errorType = 0
	departmentPathId := templateDepartmentPath
	departmentPathIdList := strings.Split(departmentPathId, "/")
	departmentId := catalogDepartmentId
	parentDep := departmentPathIdList[0]
	if parentDep != userDepartments[0].ID {
		if departmentId != departmentPathIdList[len(departmentPathIdList)-1] {
			errorType = 3
		} else {
			var checkIn bool
			checkIn, err = u.CheckIfInUserDepartments(ctx, userDepartments, departmentId)
			if err != nil {
				return -1, err
			}
			if !checkIn {
				errorType = 4
			}
		}

	}
	if departmentId != departmentPathIdList[len(departmentPathIdList)-1] {
		if isDevOpe {
			var checkIn bool
			checkIn, err = u.CheckIfInUserDepartments(ctx, userDepartments, departmentId)
			if err != nil {
				return -1, err
			}
			if !checkIn {
				errorType = 3
			} else {
				errorType = 0
			}
		} else {
			errorType = 3
		}
	}
	return errorType, nil
}
func (u *cognitiveServiceSystemDomainImpl) GetSingleCatalogTemplateList(ctx context.Context, req *domain.GetSingleCatalogTemplateListReq) (*domain.GetSingleCatalogTemplateListRes, error) {
	//is, err := u.ccDriven.HasRoles(ctx, access_control.TCDataOperationEngineer, access_control.TCDataDevelopmentEngineer)
	//if err != nil {
	//	return nil, err
	//}
	uInfo := request.GetUserInfo(ctx)
	rs, err := u.authorizationDriven.HasInnerBusinessRoles(ctx, uInfo.ID)
	if err != nil {
		return nil, err
	}
	is := len(rs) > 0

	totalCounts, entities, err := u.cognitiveServiceSystemRepo.GetSingleCatalogTemplateListByCondition(ctx, req, uInfo.ID)
	if err != nil {
		return nil, err
	}

	userDepartments, err := u.ccDriven.GetDepartmentsByUserID(ctx, uInfo.ID)

	if err != nil {
		return nil, err
	}

	datasourceRes := make([]*domain.SingleCatalogTemplate, len(entities))
	for i, entity := range entities {
		num, err := strconv.ParseUint(entity.DataCatalogId, 10, 64)
		dataRes, err := u.catalogRepo.Get(nil, ctx, num)
		errorType := 0
		if err != nil {
			errorType = 2
		}
		if !is {

			if dataRes.OnlineStatus != string(common.DROS_ONLINE) &&
				dataRes.OnlineStatus != string(common.DROS_DOWN_AUDITING) &&
				dataRes.OnlineStatus != string(common.DROS_DOWN_REJECT) {
				errorType = 2
			}

		}
		sourceType := entity.Type

		if errorType == 0 {
			// 查看权限
			if sourceType == "department" {
				errorType, err = u.GetCatalogDepartmentStatus(ctx, entity.TDepartmentPath, entity.DDepartmentId, userDepartments, is)
				if err != nil {
					return nil, err
				}

			} else {
				userShareReq := demand_management.UserShareApplyResourceReq{
					Type:          1,
					UserId:        uInfo.ID,
					DataCatalogId: entity.DataCatalogId,
				}
				userShareResp, err := u.dmDriven.GetUserShareApplyResource(ctx, &userShareReq)
				if err != nil {
					return nil, err
				}

				if len(userShareResp.Entries) == 0 {
					errorType = 1
				}

			}

		}

		data := domain.SingleCatalogTemplate{
			//WhiteListPolicyID:  source.WhitePolicyID,
			ID:              entity.ID,
			Name:            entity.Name,
			DataCatalogId:   entity.DataCatalogId,
			DataCatalogName: entity.DataCatalogName,
			Description:     entity.Description,

			UpdatedAt: entity.UpdatedAt.UnixMilli(),
			ErrorType: errorType,
		}

		datasourceRes[i] = &data
	}
	return &domain.GetSingleCatalogTemplateListRes{
		Entries:    datasourceRes,
		TotalCount: totalCounts,
	}, nil
}
func (u *cognitiveServiceSystemDomainImpl) GetSingleCatalogTemplateDetails(ctx context.Context, req *domain.GetSingleCatalogTemplateDetailsReq) (*domain.GetSingleCatalogTemplateDetailsRes, error) {
	entity, err := u.cognitiveServiceSystemRepo.GetSingleCatalogTemplateDetail(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	idStr := strconv.FormatUint(entity.DataCatalogID, 10)
	dataCatalogInfo, err := u.catalogRepo.GetDetail(nil, ctx, entity.DataCatalogID, []string{})
	if err != nil {
		return nil, err
	}

	dataResource, err := u.dataResourceRepo.GetByCatalogId(ctx, entity.DataCatalogID)
	if err != nil {
		return nil, err
	}

	formViewId := dataResource[0].ResourceId
	res := &domain.GetSingleCatalogTemplateDetailsRes{
		//WhiteListPolicyID: sources.WhitePolicyID,
		ID:               entity.ID,
		Name:             entity.Name,
		Description:      entity.Description,
		DataCatalogId:    idStr,
		DataCatalogName:  dataCatalogInfo.Title,
		ResourceId:       formViewId,
		ResourceType:     1,
		Configs:          entity.Configs,
		Fields:           strings.Split(entity.Fields, ","),
		FieldsDetails:    entity.FieldsDetails,
		Type:             entity.Type,
		DepartmentPathId: entity.DepartmentPath,
		CreatedAt:        entity.CreatedAt.UnixMilli(),
		UpdatedAt:        entity.UpdatedAt.UnixMilli(),
	}

	return res, nil

}
func (u *cognitiveServiceSystemDomainImpl) UpdateSingleCatalogTemplate(ctx context.Context, req *domain.UpdateSingleCatalogTemplateReq) (*domain.UpdateSingleCatalogTemplateRes, error) {
	userInfo := request.GetUserInfo(ctx)
	num, err := strconv.ParseUint(req.DataCatalogId, 10, 64)
	if err != nil {
		return nil, err
	}
	singleCatalogTemplateStruct := model.TDataCatalogSearchTemplate{
		ID:             req.ID,
		DataCatalogID:  num,
		Name:           req.Name,
		Description:    req.Description,
		Fields:         strings.Join(req.Fields, ","),
		FieldsDetails:  req.FieldsDetails,
		Configs:        req.Configs,
		Type:           req.Type,
		DepartmentPath: req.DepartmentPathId,
		CreatedByUID:   userInfo.ID,
		UpdatedByUID:   userInfo.ID,
	}

	err = u.cognitiveServiceSystemRepo.UpdateSingleCatalogTemplate(ctx, &singleCatalogTemplateStruct)
	if err != nil {
		return nil, err
	}

	res := domain.UpdateSingleCatalogTemplateRes{}
	return &res, nil
}
func (u *cognitiveServiceSystemDomainImpl) DeleteSingleCatalogTemplate(ctx context.Context, req *domain.DeleteSingleCatalogTemplateReq) (*domain.DeleteSingleCatalogTemplateRes, error) {
	userInfo := request.GetUserInfo(ctx)

	err := u.cognitiveServiceSystemRepo.DeleteSingleCatalogTemplate(ctx, req.ID, userInfo.ID)
	if err != nil {
		return nil, err
	}

	res := domain.DeleteSingleCatalogTemplateRes{}
	return &res, nil
}

func (u *cognitiveServiceSystemDomainImpl) GetSingleCatalogHistoryList(ctx context.Context, req *domain.GetSingleCatalogHistoryListReq) (*domain.GetSingleCatalogHistoryListRes, error) {
	uInfo := request.GetUserInfo(ctx)
	totalCounts, entities, err := u.cognitiveServiceSystemRepo.GetSingleCatalogHistoryListByCondition(ctx, req, uInfo.ID)
	if err != nil {
		return nil, err
	}

	//is, err := u.ccDriven.HasRoles(ctx, access_control.TCDataOperationEngineer, access_control.TCDataDevelopmentEngineer)
	//if err != nil {
	//	return nil, err
	//}
	rs, err := u.authorizationDriven.HasInnerBusinessRoles(ctx, uInfo.ID)
	if err != nil {
		return nil, err
	}
	is := len(rs) > 0

	userDepartments, err := u.ccDriven.GetDepartmentsByUserID(ctx, uInfo.ID)

	if err != nil {
		return nil, err
	}

	datasourceRes := make([]*domain.SingleCatalogHistory, len(entities))
	for i, entity := range entities {
		num, err := strconv.ParseUint(entity.DataCatalogId, 10, 64)
		dataRes, err := u.catalogRepo.Get(nil, ctx, num)
		errorType := 0
		if err != nil {
			errorType = 2
		}
		if !is {
			if dataRes.OnlineStatus != string(common.DROS_ONLINE) &&
				dataRes.OnlineStatus != string(common.DROS_DOWN_AUDITING) &&
				dataRes.OnlineStatus != string(common.DROS_DOWN_REJECT) {
				errorType = 2
			}
		}
		sourceType := entity.Type

		if errorType == 0 {
			if sourceType == "department" {

				errorType, err = u.GetCatalogDepartmentStatus(ctx, entity.TDepartmentPath, entity.DDepartmentId, userDepartments, is)
				if err != nil {
					return nil, err
				}

			} else {
				userShareReq := demand_management.UserShareApplyResourceReq{
					Type:          1,
					UserId:        uInfo.ID,
					DataCatalogId: entity.DataCatalogId,
				}
				userShareResp, err := u.dmDriven.GetUserShareApplyResource(ctx, &userShareReq)
				if err != nil {
					return nil, err
				}

				if len(userShareResp.Entries) == 0 {
					errorType = 1
				}
			}
		}

		data := domain.SingleCatalogHistory{
			//WhiteListPolicyID:  source.WhitePolicyID,
			ID:              entity.ID,
			DataCatalogId:   entity.DataCatalogId,
			DataCatalogName: entity.DataCatalogName,

			SearchAt:    entity.SearchAt.UnixMilli(),
			SearchCount: entity.TotalCount,
			ErrorType:   errorType,
		}

		datasourceRes[i] = &data
	}
	return &domain.GetSingleCatalogHistoryListRes{
		Entries:    datasourceRes,
		TotalCount: totalCounts,
	}, nil
}
func (u *cognitiveServiceSystemDomainImpl) GetSingleCatalogHistoryDetails(ctx context.Context, req *domain.GetSingleCatalogHistoryDetailsReq) (*domain.GetSingleCatalogHistoryDetailsRes, error) {
	entity, err := u.cognitiveServiceSystemRepo.GetSingleCatalogHistoryDetail(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	idStr := strconv.FormatUint(entity.DataCatalogID, 10)
	dataCatalogInfo, err := u.catalogRepo.GetDetail(nil, ctx, entity.DataCatalogID, []string{})
	if err != nil {
		return nil, err
	}

	dataResource, err := u.dataResourceRepo.GetByCatalogId(ctx, entity.DataCatalogID)
	if err != nil {
		return nil, err
	}

	formViewId := dataResource[0].ResourceId

	res := &domain.GetSingleCatalogHistoryDetailsRes{
		ID:               entity.ID,
		DataCatalogId:    idStr,
		DataCatalogName:  dataCatalogInfo.Title,
		ResourceId:       formViewId,
		ResourceType:     1,
		Configs:          entity.Configs,
		Fields:           strings.Split(entity.Fields, ","),
		FieldsDetails:    entity.FieldsDetails,
		Type:             entity.Type,
		DepartmentPathId: entity.DepartmentPath,
		SearchAt:         entity.CreatedAt.UnixMilli(),
	}

	return res, nil
}

func (u *cognitiveServiceSystemDomainImpl) GetSingleCatalogTemplateNameUnique(ctx context.Context, req *domain.GetSingleCatalogTemplateNameUniqueReq) (*domain.GetSingleCatalogTemplateNameUniqueRes, error) {
	uInfo := request.GetUserInfo(ctx)
	checkRes, err := u.cognitiveServiceSystemRepo.CheckTemplateNameUnique(ctx, req.Name, uInfo.ID)
	if err != nil {
		return nil, err
	}
	resp := &domain.GetSingleCatalogTemplateNameUniqueRes{
		IsRepeated: checkRes,
	}

	return resp, nil
}
