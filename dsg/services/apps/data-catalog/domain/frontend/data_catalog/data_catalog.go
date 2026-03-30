package data_catalog

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/basic_search"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/cognitive_assistant"
	cc "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common_usecase"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	catalog_flow "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_audit_flow_bind"
	catalog_column "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_column"
	download_apply "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_download_apply"
	catalog_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_info"
	catalog_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_mount_resource"
	stats_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_stats_info"
	dataComprehension "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	user_catalog_rel "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/user_data_catalog_rel"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/user_data_catalog_stats_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	goCommon_auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	demand_management_v1 "github.com/kweaver-ai/idrm-go-common/rest/demand_management/v1"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

const (
	FUNC_CALL_FROM_LIST_GET = iota + 1
	FUNC_CALL_FROM_TOP_DATA_GET
)

type DataCatalogDomain struct {
	cataRepo                  catalog.RepoOp
	infoRepo                  catalog_info.RepoOp
	colRepo                   catalog_column.RepoOp
	resourceMountRepo         catalog_resource.RepoOp
	cphRepo                   dataComprehension.RepoOp
	data                      *db.Data
	flowRepo                  catalog_flow.RepoOp
	daRepo                    download_apply.RepoOp
	siRepo                    stats_info.RepoOp
	ucrRepo                   user_catalog_rel.RepoOp
	commonUseCase             *common_usecase.CommonUseCase
	userCataRepo              user_data_catalog_stats_info.RepoOp
	as                        auth_service.Repo
	bsRepo                    basic_search.Repo
	cc                        cc.Repo
	cogCli                    cognitive_assistant.CogAssistant
	auth                      auth.Repo
	authService               auth_service.DrivenAuthService
	wf                        workflow.WorkflowInterface
	configurationCenterDriven configuration_center.Driven
	dataSubjectDriven         data_subject.Driven
	categoryRepo              category.Repo
	myFavoriteRepo            my_favorite.Repo
	// 微服务 auth-service/v1 客户端
	authServiceV1 goCommon_auth_service.AuthServiceV1Interface
	// 微服务 demand-management/v1 客户端 SharedDeclarationInterface
	sharedDeclaration demand_management_v1.SharedDeclarationInterface
	dataView          data_view.Driven
	dataResourceRepo  repo.DataResourceRepo
}

func NewDataCatalogDomain(
	data *db.Data,
	cata catalog.RepoOp,
	cataInfo catalog_info.RepoOp,
	cataCol catalog_column.RepoOp,
	cphRepo dataComprehension.RepoOp,
	cataRes catalog_resource.RepoOp,
	flowRepo catalog_flow.RepoOp,
	daRepo download_apply.RepoOp,
	siRepo stats_info.RepoOp,
	ucrRepo user_catalog_rel.RepoOp,
	commonUseCase *common_usecase.CommonUseCase,
	userCataRepo user_data_catalog_stats_info.RepoOp,
	as auth_service.Repo,
	bsRepo basic_search.Repo,
	cc cc.Repo,
	cogCli cognitive_assistant.CogAssistant,
	auth auth.Repo,
	authService auth_service.DrivenAuthService,
	wf workflow.WorkflowInterface,
	configurationCenterDriven configuration_center.Driven,
	dataSubjectDriven data_subject.Driven,
	categoryRepo category.Repo,
	myFavoriteRepo my_favorite.Repo,
	// 微服务 auth-service/v1 客户端
	authServiceV1 goCommon_auth_service.AuthServiceV1Interface,
	// 微服务 demand-management/v1 客户端
	demandManagementV1 demand_management_v1.DemandManagementV1Interface,
	dataView data_view.Driven,
	dataResourceRepo repo.DataResourceRepo,
) *DataCatalogDomain {
	return &DataCatalogDomain{
		cataRepo:                  cata,
		infoRepo:                  cataInfo,
		colRepo:                   cataCol,
		cphRepo:                   cphRepo,
		data:                      data,
		resourceMountRepo:         cataRes,
		flowRepo:                  flowRepo,
		daRepo:                    daRepo,
		siRepo:                    siRepo,
		ucrRepo:                   ucrRepo,
		commonUseCase:             commonUseCase,
		userCataRepo:              userCataRepo,
		as:                        as,
		bsRepo:                    bsRepo,
		cc:                        cc,
		cogCli:                    cogCli,
		auth:                      auth,
		authService:               authService,
		wf:                        wf,
		configurationCenterDriven: configurationCenterDriven,
		dataSubjectDriven:         dataSubjectDriven,
		categoryRepo:              categoryRepo,
		myFavoriteRepo:            myFavoriteRepo,
		// 微服务 auth-service/v1 客户端
		authServiceV1: authServiceV1,
		// 微服务 demand-management/v1 客户端 SharedDeclarationInterface
		sharedDeclaration: demandManagementV1.SharedDeclaration(),
		dataView:          dataView,
		dataResourceRepo:  dataResourceRepo,
	}
}

/*
func (d *DataCatalogDomain) genBusinessObjectRetData(ctx context.Context, funcCallSource int, datas []*catalog.BusinessObjectListItem, retDatas []*BusinessObjectItem) error {
	var (
		err            error
		ids            = make([]uint64, len(datas))
		codes          = make([]string, len(datas))
		code2ObjMap    = make(map[string]*BusinessObjectItem, len(datas))
		id2ObjMap      = make(map[uint64]*BusinessObjectItem, len(datas))
		val            []int
		isExisted      bool
		orgcode2IdxMap = map[string][]int{}
		uid2IdxMap     = map[string][]int{}
		orgcodes       = make([]string, 0, len(datas))
		uids           = make([]string, 0, len(datas))
	)
	for i := range datas {
		retDatas[i] = &BusinessObjectItem{
			ID:          datas[i].ID,
			Name:        datas[i].Name,
			Description: datas[i].Description,
			SystemID:    datas[i].SystemID,
			SystemName:  datas[i].SystemName,
			Orgcode:     datas[i].Orgcode,
			Orgname:     datas[i].Orgname,
			UpdatedAt:   datas[i].UpdatedAt.UnixMilli(),

			ApplyNum:   datas[i].ApplyNum,
			PreviewNum: datas[i].PreviewNum,
			OwnerID:    datas[i].OwnerID,
			OwnerName:  datas[i].OwnerName,
		}
		ids[i] = datas[i].ID
		codes[i] = datas[i].Code
		code2ObjMap[datas[i].Code] = retDatas[i]
		id2ObjMap[datas[i].ID] = retDatas[i]

		if val, isExisted = orgcode2IdxMap[datas[i].Orgcode]; isExisted {
			val = append(val, i)
		} else {
			val = []int{i}
			orgcodes = append(orgcodes, datas[i].Orgcode)
		}
		orgcode2IdxMap[datas[i].Orgcode] = val

		if val, isExisted = uid2IdxMap[datas[i].OwnerID]; isExisted {
			val = append(val, i)
		} else {
			val = []int{i}
			uids = append(uids, datas[i].OwnerID)
		}
		uid2IdxMap[datas[i].OwnerID] = val
	}

	if len(orgcodes) > 0 {
		var deptInfos []*common.DeptEntryInfo
		if deptInfos, err = common.GetDepartmentInfoByDeptIDs(ctx, strings.Join(orgcodes, ",")); err != nil {
			return err
		}
		for j := range deptInfos {
			for k := range orgcode2IdxMap[deptInfos[j].ID] {
				retDatas[orgcode2IdxMap[deptInfos[j].ID][k]].Orgname = deptInfos[j].Name
			}
		}
		deptInfos = nil
		orgcodes = nil
		orgcode2IdxMap = nil
	}

	if len(uids) > 0 {
		var uInfos []*common.UserIDNameRes
		if uInfos, err = common.GetUserNameByUserIDs(ctx, uids); err != nil {
			return err
		}
		for j := range uInfos {
			for k := range uid2IdxMap[uInfos[j].ID] {
				retDatas[uid2IdxMap[uInfos[j].ID][k]].OwnerName = uInfos[j].Name
			}
		}
		uInfos = nil
		uids = nil
		uid2IdxMap = nil
	}

	if funcCallSource == FUNC_CALL_FROM_TOP_DATA_GET && len(ids) > 0 {
		var systems []*model.TDataCatalogInfo
		if systems, err = d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_RELATED_SYSTEM}, ids); err == nil {
			for i := range systems {
				id2ObjMap[systems[i].CatalogID].SystemID = systems[i].InfoKey
				id2ObjMap[systems[i].CatalogID].SystemName = systems[i].InfoValue
			}
			systems = nil
		} else {
			log.WithContext(ctx).Errorf("failed to get system into for catalog list from db, err: %v", err)
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}
	ids = nil
	id2ObjMap = nil

	var res []*model.TDataCatalogResourceMount
	if res, err = d.resourceMountRepo.GetByCodes(nil, ctx, codes, common.RES_TYPE_TABLE); err == nil {
		var idx int
		codeMap := map[string]bool{}
		tid2CodeMap := map[string]string{}
		ids := make([]string, len(datas))
		for i := range res {
			if !codeMap[res[i].Code] {
				tid2CodeMap[res[i].ResID] = res[i].Code
				codeMap[res[i].Code] = true
				ids[idx] = res[i].ResID
				idx++
			}
		}
		codeMap = nil
		if idx > 0 {
			//if tInfos, err := common.GetTableInfo(ctx, ids[0:idx]); err == nil {
			//	for i := range tInfos {
			//		pObj := code2ObjMap[tid2CodeMap[tInfos[i].ID]]
			//		pObj.DataSourceID = tInfos[i].DataSourceID
			//		pObj.DataSourceName = tInfos[i].DataSourceName
			//		pObj.SchemaID = tInfos[i].SchemaID
			//		pObj.SchemaName = tInfos[i].SchemaName
			//	}
			//} else {
			//	log.WithContext(ctx).Errorf("failed to get mounted table info from metadata for catalog list from db, err: %v", err)
			//	return errorcode.Detail(errorcode.PublicInternalError, err)
			//}
		}
		tid2CodeMap = nil
		code2ObjMap = nil
	} else {
		log.WithContext(ctx).Errorf("failed to get mounted table for catalog list from db, err: %v", err)
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}
*/

func (d *DataCatalogDomain) GetCommonDetail(ctx context.Context, catalogID uint64) (*DataCatalogDetailCommonResp, error) {
	catalog, err := d.cataRepo.GetDetail(nil, ctx, catalogID, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
	}

	if err = common.CatalogPropertyCheckV1(catalog); err != nil {
		return nil, err
	}

	//if _, err = d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_LABEL, common.INFO_TYPE_RELATED_SYSTEM}, []uint64{catalogID}); err == nil {
	//	resData, err = d.resourceMountRepo.Get(nil, ctx, catalog.Code, 0)
	//}
	if catalog == nil {
		log.WithContext(ctx).Errorf("catalog: %v not existed", catalogID)
		return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
	}

	retData := &DataCatalogDetailCommonResp{
		ID:          catalog.ID,
		Name:        catalog.Title,
		Code:        catalog.Code,
		Description: catalog.Description,
	}

	resourceMounts, err := d.resourceMountRepo.Get(nil, ctx, catalog.Code, 0)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(resourceMounts) == 0 {
		return nil, errorcode.Detail(errorcode.DataSourceNotFound, "挂接资源不存在")
	}
	retData.Mounts = resourceMounts // 挂接资源

	// 赋值预览量，申请数量
	statsInfos, err := d.siRepo.Get(nil, ctx, catalog.Code)
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog: %v preview count, err: %v", catalogID, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if len(statsInfos) > 0 {
		// 表中code是唯一键，故len(statsInfos)有值长度必为1
		retData.PreviewCount = int64(statsInfos[0].PreviewNum)
		retData.ApplyCount = int64(statsInfos[0].ApplyNum)
	}

	//// 赋值下载权限
	//accessResult, expireTime, err := d.commonUseCase.GetDownloadAccessResult(ctx, catalog.Orgcode, catalog.Code)
	//if err != nil {
	//	// err已经返回是自定义的错误
	//	return nil, err
	//}
	//retData.DownloadAccessResult = accessResult
	//
	//// 赋值过期时间
	//if expireTime != nil {
	//	retData.DownloadAccessExpireTime = expireTime.UnixMilli() // 时间戳为毫秒
	//}

	retData.ComprehensionStatus = 1
	if comprehensionData, err := d.cphRepo.GetBrief(ctx, catalogID); err != nil {
		log.WithContext(ctx).Error(err.Error())
	} else {
		retData.ComprehensionStatus = comprehensionData.Status
	}

	return retData, nil
}

func (d *DataCatalogDomain) GetDetailBasicInfo(ctx context.Context, catalogID uint64) (*DataCatalogDetailBasicInfoResp, error) {
	var (
		infoData          []*model.TDataCatalogInfo
		resData           []*model.TDataCatalogResourceMount
		businessObjectIDs []string
	)

	catalog, err := d.cataRepo.GetDetail(nil, ctx, catalogID, nil)
	if err == nil && catalog != nil {
		if err = common.CatalogPropertyCheckV1(catalog); err != nil {
			return nil, err
		}

		if infoData, err = d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_LABEL, common.INFO_TYPE_RELATED_SYSTEM, common.INFO_TYPE_BUSINESS_DOMAIN}, []uint64{catalogID}); err == nil {
			resData, err = d.resourceMountRepo.Get(nil, ctx, catalog.Code, 0)
		}
	}

	if err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}

	if catalog == nil {
		log.WithContext(ctx).Errorf("catalog: %v not existed", catalogID)
		return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
	}

	if len(resData) < 1 {
		errStr := fmt.Sprintf("no table res, catalog code: %v", catalog.Code)
		log.WithContext(ctx).Warn(errStr)
		return nil, errorcode.Detail(errorcode.DataSourceNotFound, errors.New(errStr))
	}

	retData := &DataCatalogDetailBasicInfoResp{
		ID:   catalog.ID,
		Name: catalog.Title,
		//Description: catalog.Description,
		Code: catalog.Code,
		//DataKind:    common.DatakindToArray(catalog.DataKind),
		Infos:       nil,
		UpdateCycle: catalog.UpdateCycle,
		//Orgcode:     catalog.Orgcode,
		//Orgname:     catalog.Orgname,
		//OwnerID:         catalog.OwnerId,
		//OwnerName:       catalog.OwnerName,
		PublishedAt:     catalog.PublishedAt,
		SharedMode:      catalog.SharedMode,
		SharedType:      catalog.SharedType,
		SharedCondition: catalog.SharedCondition,
		OpenType:        catalog.OpenType,
		OpenCondition:   catalog.OpenCondition,
		//State:           catalog.State,
		Source: catalog.Source,
		//CreatedAt:   catalog.CreatedAt.UnixMilli(),
		//UpdatedAt:   catalog.UpdatedAt.UnixMilli(),
	}

	if resData[0].ResID != "" {
		retData.FormViewID = resData[0].ResID
	}

	/*	var deptInfos []*common.DeptEntryInfo
		if deptInfos, err = common.GetDepartmentInfoByDeptIDs(ctx, retData.Orgcode); err != nil {
			return nil, err
		}
		if len(deptInfos) > 0 {
			retData.Orgname = deptInfos[0].Name
		}*/

	updateInfoDataSlice(ctx, catalogID, infoData)

	var info *response.InfoItem
	var preType int8
	for i := range infoData {
		if info == nil || infoData[i].InfoType != preType {
			preType = infoData[i].InfoType
			if info != nil {
				retData.Infos = append(retData.Infos, info)
			}
			entry := &response.InfoBase{
				InfoKey:   infoData[i].InfoKey,
				InfoValue: infoData[i].InfoValue,
			}
			info = &response.InfoItem{
				InfoType: infoData[i].InfoType,
				Entries:  []*response.InfoBase{entry},
			}
		} else {
			info.Entries = append(info.Entries,
				&response.InfoBase{
					InfoKey:   infoData[i].InfoKey,
					InfoValue: infoData[i].InfoValue,
				})
		}

		if infoData[i].InfoType == common.INFO_TYPE_BUSINESS_DOMAIN {
			businessObjectIDs = append(businessObjectIDs, infoData[i].InfoKey)
		}

		if i == len(infoData)-1 {
			retData.Infos = append(retData.Infos, info)
		}
	}

	if len(businessObjectIDs) > 0 {
		retData.BusinessObjectPath, err = common.GetPathByBusinessDomainID(ctx, businessObjectIDs)
		if err != nil {
			log.WithContext(ctx).Errorf("get business object path for catalog: %v failed, err: %v", catalogID, err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
	}

	//var ti []*common.TableInfo
	//ti, err = common.GetTableInfo(ctx, []uint64{resData[0].ResID})
	//if err != nil {
	//	log.WithContext(ctx).Errorf("get catalog: %v mounted table: %v failed, err: %v", catalogID, resData[0].ResID, err)
	//	return nil, errorcode.Detail(errorcode.DataSourceRequestErr, err)
	//}
	//if len(ti) < 1 {
	//	errStr := fmt.Sprintf("no table info, table res id: %v", resData[0].ResID)
	//	log.WithContext(ctx).Error(errStr)
	//	return nil, errorcode.Detail(errorcode.DataSourceNotFound, errors.New(errStr))
	//}
	//retData.RowCount = ti[0].RowNum
	//retData.DataSourceID = ti[0].DataSourceID
	//retData.DataSourceName = ti[0].DataSourceName
	//retData.SchemaID = ti[0].SchemaID
	//retData.SchemaName = ti[0].SchemaName

	// 从元数据平台取值创建和更新时间
	//retData.CreatedAt = ti[0].CreateTime
	//retData.UpdatedAt = ti[0].UpdateTime

	//添加是否有编目理解字段
	result := genTempData(retData)
	return result, nil
}

func (d *DataCatalogDomain) GetCatalogColumnList(ctx context.Context, catalogID uint64, req *request.CatalogColumnsQueryReq) ([]*ColumnListItem, int64, error) {
	catalog, err := d.cataRepo.GetDetail(nil, ctx, catalogID, nil)
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, 0, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, 0, errorcode.Detail(errorcode.PublicInternalError, err)
		}
	}

	if err = common.CatalogPropertyCheckV1(catalog); err != nil {
		return nil, 0, err
	}

	var (
		columns    []*model.TDataCatalogColumn
		totalCount int64
	)
	if columns, totalCount, err = d.colRepo.GetList(nil, ctx, catalogID, req.Keyword, &req.PageBaseInfo); err != nil {
		return nil, 0, err
	}

	items := make([]*ColumnListItem, len(columns))
	for i := range columns {
		items[i] = &ColumnListItem{
			ID:            columns[i].ID,
			TechnicalName: columns[i].TechnicalName,
			BusinessName:  columns[i].BusinessName,
			DataFormat:    columns[i].DataFormat,
			DataLength:    columns[i].DataLength,
			DataPrecision: columns[i].DataPrecision,
			AIDescription: columns[i].AIDescription,
			PrimaryFlag:   columns[i].PrimaryFlag.Int16,
		}
	}
	return items, totalCount, nil
}

func genTempData(input *DataCatalogDetailBasicInfoResp) *DataCatalogDetailBasicInfoResp {
	//if input.DataSourceID != "" {
	if input.ID%2 > 0 {
		input.Certificated = true
	}

	switch input.ID % 4 {
	case 0:
		input.CompletionRatio = 70
		input.ScoreCount = 4
		//input.ApplyCount = 12
	case 1:
		input.CompletionRatio = 75
		input.ScoreCount = 6
		//input.ApplyCount = 21
	case 2:
		input.CompletionRatio = 80
		input.ScoreCount = 4
		//input.ApplyCount = 15
	case 3:
		input.CompletionRatio = 85
		input.ScoreCount = 9
		//input.ApplyCount = 27
	}
	//}

	return input
}

func (d *DataCatalogDomain) GetDetailV2(ctx context.Context, catalogID uint64) (*CatalogDetailResp, error) {
	var (
		infoData []*model.TDataCatalogInfo
		resData  []*model.TDataCatalogResourceMount
		colData  []*model.TDataCatalogColumn
	)

	catalog, err := d.cataRepo.GetDetail(nil, ctx, catalogID, nil)
	if err == nil && catalog != nil {
		if err = common.CatalogPropertyCheckV1(catalog); err != nil {
			return nil, err
		}

		if infoData, err = d.infoRepo.Get(nil, ctx, nil, []uint64{catalogID}); err == nil {
			if resData, err = d.resourceMountRepo.Get(nil, ctx, catalog.Code, 0); err == nil {
				colData, err = d.colRepo.Get(nil, ctx, catalogID)
			}
		}
	}

	if err != nil {
		log.WithContext(ctx).Errorf("get detail for catalog: %v failed, err: %v", catalogID, err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
		} else {
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}
	}

	if catalog == nil {
		log.WithContext(ctx).Errorf("catalog: %v not existed", catalogID)
		return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "资源不存在")
	}

	categoryPaths := make([]*common.TreeBase, 0)
	if catalog.GroupID > 0 {
		categoryPaths, err = common.GetCategoryPath(ctx, strconv.FormatUint(catalog.GroupID, 10))
		if err != nil {
			log.WithContext(ctx).Errorf("failed to request tree node of category, err: %v", err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}

		if len(categoryPaths) > 0 {
			catalog.GroupName = categoryPaths[len(categoryPaths)-1].Name
		}
	}

	retData := &CatalogDetailResp{
		ID:               catalog.ID,
		Code:             catalog.Code,
		Title:            catalog.Title,
		GroupID:          catalog.GroupID,
		GroupName:        catalog.GroupName,
		ThemeID:          catalog.ThemeID,
		ThemeName:        catalog.ThemeName,
		ForwardVersionID: catalog.ForwardVersionID,
		Description:      catalog.Description,
		DataRange:        catalog.DataRange,
		UpdateCycle:      catalog.UpdateCycle,
		//DataKind:         catalog.DataKind,
		SharedType:       catalog.SharedType,
		SharedCondition:  catalog.SharedCondition,
		OpenType:         catalog.OpenType,
		OpenCondition:    catalog.OpenCondition,
		SharedMode:       catalog.SharedMode,
		PhysicalDeletion: catalog.PhysicalDeletion,
		SyncMechanism:    catalog.SyncMechanism,
		SyncFrequency:    catalog.SyncFrequency,
		TableCount:       catalog.ViewCount,
		FileCount:        catalog.ApiCount,
		//State:            catalog.State,
		FlowNodeID:   catalog.FlowNodeID,
		FlowNodeName: catalog.FlowNodeName,
		//FlowType:         catalog.FlowType,
		FlowID:      catalog.FlowID,
		FlowName:    catalog.FlowName,
		FlowVersion: catalog.FlowVersion,
		Orgcode:     catalog.DepartmentID,
		//Orgname:     catalog.DepartmentName,
		CreatedAt:  catalog.CreatedAt.UnixMilli(),
		CreatorUID: catalog.CreatorUID,
		//CreatorName:      catalog.CreatorName, todo
		UpdatedAt:  catalog.UpdatedAt.UnixMilli(),
		UpdaterUID: catalog.UpdaterUID,
		//UpdaterName:    catalog.UpdaterName, todo
		Source:         catalog.Source,
		TableType:      catalog.TableType,
		CurrentVersion: catalog.CurrentVersion,
		PublishFlag:    catalog.PublishFlag,
		DataKindFlag:   catalog.DataKindFlag,
		LabelFlag:      catalog.LabelFlag,
		SrcEventFlag:   catalog.SrcEventFlag,
		RelEventFlag:   catalog.RelEventFlag,
		SystemFlag:     catalog.SystemFlag,
		RelCatalogFlag: catalog.RelCatalogFlag,
		PublishedAt:    0,
		IsIndexed:      catalog.IsIndexed,
		AuditState:     catalog.AuditState,
		GroupPath:      categoryPaths,
		Infos:          make([]*response.InfoItem, 0),
		MountResources: make([]*MountResourceItem, 0),
		Columns:        colData,
		OwnerID:        catalog.OwnerId,
		OwnerName:      catalog.OwnerName,
	}

	var deptInfos []*common.DeptEntryInfo
	if deptInfos, err = common.GetDepartmentInfoByDeptIDs(ctx, retData.Orgcode); err != nil {
		return nil, err
	}
	if len(deptInfos) > 0 {
		retData.Orgname = deptInfos[0].Name
	}

	if catalog.PublishedAt != nil {
		retData.PublishedAt = catalog.PublishedAt.UnixMilli()
	}

	var info *response.InfoItem
	var preType int8
	for i := range infoData {
		if info == nil || infoData[i].InfoType != preType {
			preType = infoData[i].InfoType
			if info != nil {
				retData.Infos = append(retData.Infos, info)
			}
			entry := &response.InfoBase{
				InfoKey:   infoData[i].InfoKey,
				InfoValue: infoData[i].InfoValue,
			}
			info = &response.InfoItem{
				InfoType: infoData[i].InfoType,
				Entries:  []*response.InfoBase{entry},
			}
		} else {
			info.Entries = append(info.Entries,
				&response.InfoBase{
					InfoKey:   infoData[i].InfoKey,
					InfoValue: infoData[i].InfoValue,
				})
		}

		if i == len(infoData)-1 {
			retData.Infos = append(retData.Infos, info)
		}
	}

	preType = 0
	var res *MountResourceItem
	for i := range resData {
		if res == nil || resData[i].ResType != preType {
			preType = resData[i].ResType
			if res != nil {
				retData.MountResources = append(retData.MountResources, res)
			}
			entry := &MountResourceBase{
				ResID:   resData[i].ResID,
				ResName: resData[i].ResName,
			}
			res = &MountResourceItem{
				ResType: resData[i].ResType,
				Entries: []*MountResourceBase{entry},
			}
		} else {
			res.Entries = append(res.Entries,
				&MountResourceBase{
					ResID:   resData[i].ResID,
					ResName: resData[i].ResName,
				})
		}

		if i == len(resData)-1 {
			retData.MountResources = append(retData.MountResources, res)
		}
	}
	return retData, nil
}

// updateInfoDataSlice 更新信息系统名称
func updateInfoDataSlice(ctx context.Context, catalogID uint64, infoData []*model.TDataCatalogInfo) {
	var infoKeys []string
	for i := range infoData {
		if infoData[i].InfoType == common.INFO_TYPE_RELATED_SYSTEM {
			infoKeys = append(infoKeys, infoData[i].InfoKey)
		}
	}
	if len(infoKeys) <= 0 {
		return
	}
	infos, err := common.GetInfoSystemsPrecision(ctx, infoKeys...)
	if err != nil {
		log.WithContext(ctx).Warnf("get info system %v for catalog: %v failed, err: %v", strings.Join(infoKeys, ","), catalogID, err)
		return
	}
	infosDict := make(map[string]*common.GetInfoSystemByIdsRes)
	for j := range infos {
		key := fmt.Sprintf("%v", infos[j].ID)
		infosDict[key] = infos[j]
	}
	for i := range infoData {
		if infoData[i].InfoType != common.INFO_TYPE_RELATED_SYSTEM {
			continue
		}
		key := fmt.Sprintf("%v", infoData[i].InfoKey)
		info, ok := infosDict[key]
		if !ok {
			continue
		}
		if info.Name != "" {
			infoData[i].InfoValue = info.Name
		}
	}
}
