package my

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common_usecase"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	catalog_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_info"
	catalog_resource "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_mount_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my"
)

type Domain struct {
	data          *db.Data
	myRepo        my.RepoOp
	infoRepo      catalog_info.RepoOp
	commonUseCase *common_usecase.CommonUseCase
	resRepo       catalog_resource.RepoOp
	authService   auth_service.DrivenAuthService
}

func NewMyDomain(
	data *db.Data,
	myRepo my.RepoOp,
	infoRepo catalog_info.RepoOp,
	commonUseCase *common_usecase.CommonUseCase,
	cataRes catalog_resource.RepoOp,
	authService auth_service.DrivenAuthService) *Domain {
	return &Domain{
		data:          data,
		myRepo:        myRepo,
		infoRepo:      infoRepo,
		commonUseCase: commonUseCase,
		resRepo:       cataRes,
		authService:   authService,
	}
}

func (d *Domain) GetMyApplyList(tx *gorm.DB, ctx context.Context, req *my.AssetApplyListReqParam) ([]*my.AssetApplyListRespItem, int64, error) {

	return d.myRepo.GetMyApplyList(tx, ctx, req)
}

func (d *Domain) GetApplyDetail(tx *gorm.DB, ctx context.Context, applyId uint64) (*my.AssetApplyDetailResp, error) {
	downloadApplyModel, err := d.myRepo.GetDownloadApplyModel(tx, ctx, applyId)
	if err != nil {
		return nil, err
	}
	// 申请表相关字段赋值
	assetApplyDetailModel := &my.AssetApplyDetailResp{
		Id:             downloadApplyModel.ID,
		ApplySn:        downloadApplyModel.AuditApplySN,
		UserId:         downloadApplyModel.UID,
		ApplyCreatedAt: downloadApplyModel.CreatedAt,
		ApplyDays:      downloadApplyModel.ApplyDays,
		ApplyState:     downloadApplyModel.State,
		ApplyReason:    downloadApplyModel.ApplyReason,
		AuditType:      downloadApplyModel.AuditType,
		AssetCode:      downloadApplyModel.Code,
	}

	// 申请部门字段赋值
	uInfo := request.GetUserInfo(ctx)
	assetApplyDetailModel.OrgInfos = uInfo.OrgInfos

	dataCatalogModel, err := d.myRepo.GetDataCatalogModelWithCode(tx, ctx, downloadApplyModel.Code)
	if err != nil {
		return nil, err
	}
	// 申请表相关字段赋值
	assetApplyDetailModel.AssetCode = dataCatalogModel.Code
	assetApplyDetailModel.AssetName = dataCatalogModel.Title
	assetApplyDetailModel.AssetOrgcode = dataCatalogModel.DepartmentID
	//assetApplyDetailModel.AssetOrgname = dataCatalogModel.DepartmentName
	assetApplyDetailModel.UpdateCycle = dataCatalogModel.UpdateCycle
	//assetApplyDetailModel.AssetState = dataCatalogModel.State

	infoData, err := d.infoRepo.Get(nil, ctx, []int8{common.INFO_TYPE_LABEL, common.INFO_TYPE_RELATED_SYSTEM}, []uint64{dataCatalogModel.ID})
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	var info *response.InfoItem
	var preType int8
	// 信息系统字段赋值
	for i := range infoData {
		if info == nil || infoData[i].InfoType != preType {
			preType = infoData[i].InfoType
			if info != nil {
				assetApplyDetailModel.Infos = append(assetApplyDetailModel.Infos, info)
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
			assetApplyDetailModel.Infos = append(assetApplyDetailModel.Infos, info)
		}
	}

	return assetApplyDetailModel, nil
}

/*
func (d *Domain) GetAvailableAssetList(tx *gorm.DB, ctx context.Context, req *my.AvailableAssetListReqParam) ([]*my.AvailableAssetListRespItem, int64, error) {
	availableItems, err := d.authService.GetPolicyAvailableAssets(ctx)
	if err != nil {
		return nil, 0, err
	}

	// 设置目录id对应权限数组的map
	catalogId2PermissionMap := make(map[string][]*auth_service.Permission)
	var assetIDs []uint64
	for i := range availableItems {
		item := availableItems[i]
		uintId, err := strconv.ParseUint(item.ObjectId, 10, 64)
		if err != nil {
			log.WithContext(ctx).Errorf("ParseUint failed, Id is %v, err is: %v", item.ObjectId, err)
			return nil, 0, errorcode.Detail(errorcode.AuthAvailableAssetsError, "strconv.ParseUint失败")
		}
		catalogId2PermissionMap[item.ObjectId] = item.Permissions
		assetIDs = append(assetIDs, uintId)
	}

	assetList, totalCount, err := d.myRepo.GetAvailableAssetList(tx, ctx, req, assetIDs)
	if len(assetList) > 0 {
		// 设置目录code对应数据目录信息的map
		catalogCode2AssetMap := make(map[string]*my.AvailableAssetListRespItem)
		// 注意：这里只能用下面形式的遍历，确保catalogCode2AssetMap里面的值是引用的值
		for i := range assetList {
			asset := assetList[i]
			catalogCode2AssetMap[asset.AssetCode] = asset
		}

		// 根据数据目录的codes返回目录挂接资源表
		catalogCodes := lo.Keys(catalogCode2AssetMap)
		ress, err := d.resRepo.GetByCodes(nil, ctx, catalogCodes, common.RES_TYPE_TABLE)
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get data catalog res, catalog code: %v, err: %v", catalogCodes, err)
			return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}

		if len(ress) < 1 {
			errStr := fmt.Sprintf("no table res, catalog code: %v", catalogCodes)
			log.WithContext(ctx).Warn(errStr)
			return nil, 0, errorcode.Detail(errorcode.DataSourceNotFound, errors.New(errStr))
		}

		// 设置目录挂接资源表对应目录code的map
		resID2CatalogCodeMap := make(map[uint64]string)
		for _, res := range ress {
			resID2CatalogCodeMap[res.ResID] = res.Code
		}

		// 从目录挂接资源表中挂接的元数据表ID返回元数据表的信息
		metaTableIds := lo.Keys(resID2CatalogCodeMap)
		metaTableInfos, err := common.GetTableInfo(ctx, metaTableIds)
		if err != nil {
			log.WithContext(ctx).Errorf("get catalog mounted table: %v failed, err: %v", metaTableIds, err)
			return nil, 0, errorcode.Detail(errorcode.DataSourceRequestErr, err)
		}
		if len(metaTableInfos) < 1 {
			errStr := fmt.Sprintf("no table info, table res id: %v", metaTableIds)
			log.WithContext(ctx).Error(errStr)
			return nil, 0, errorcode.Detail(errorcode.DataSourceNotFound, errors.New(errStr))
		}

		for _, metaTableInfo := range metaTableInfos {
			catalogCode := resID2CatalogCodeMap[metaTableInfo.ID]
			// myAsset即为返回列表每一项的引用
			myAsset := catalogCode2AssetMap[catalogCode]

			// 赋值相关元数据信息项
			myAsset.VirtualCatalogName = common.GetDataSourceCatalogName(ctx, metaTableInfo.AdvancedParams)
			myAsset.DataSourceType = metaTableInfo.DataSourceType
			myAsset.DataSourceTypeName = metaTableInfo.DataSourceTypeName
			myAsset.DataSourceId = metaTableInfo.DataSourceID
			myAsset.DataSourceName = metaTableInfo.DataSourceName
			myAsset.SchemaId = metaTableInfo.SchemaID
			myAsset.SchemaName = metaTableInfo.SchemaName
			myAsset.TableId = metaTableInfo.ID
			myAsset.TableName = metaTableInfo.Name

			myAsset.Permissions = catalogId2PermissionMap[myAsset.Id]
			//// 赋值下载权限
			//accessResult, expireTime, err := d.commonUseCase.GetDownloadAccessResult(ctx, myAsset.Orgcode, myAsset.AssetCode)
			//if err != nil {
			//	// err已经返回是自定义的错误
			//	return nil, 0, err
			//}
			//myAsset.DownloadAccessResult = accessResult

			//// 赋值过期时间
			//if expireTime != nil {
			//	myAsset.DownloadAccessExpireTime = expireTime.UnixMilli() // 时间戳为毫秒
			//}
		}

	}

	return assetList, totalCount, err
}

func (d *Domain) GetAvailableAssetDetail(tx *gorm.DB, ctx context.Context, assetID uint64) (*my.AvailableAssetListRespItem, error) {
	assetModel, err := d.myRepo.GetDataCatalogModelWithID(tx, ctx, assetID)

	availableAsset := &my.AvailableAssetListRespItem{
		Id:          fmt.Sprint(assetModel.ID),
		AssetCode:   assetModel.Code,
		AssetName:   assetModel.Title,
		Orgcode:     assetModel.Orgcode,
		Orgname:     assetModel.Orgname,
		OwnerId:     assetModel.OwnerId,
		OwnerName:   assetModel.OwnerName,
		Description: assetModel.Description,
		PublishedAt: assetModel.PublishedAt,
	}

	ress, err := d.resRepo.Get(nil, ctx, assetModel.Code, common.RES_TYPE_TABLE)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get data catalog res, catalog code: %v, err: %v", assetModel.Code, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(ress) < 1 {
		errStr := fmt.Sprintf("no table res, catalog code: %v", assetModel.Code)
		log.WithContext(ctx).Warn(errStr)
		return nil, errorcode.Detail(errorcode.DataSourceNotFound, errors.New(errStr))
	}

	metaTableInfos, err := common.GetTableInfo(ctx, []uint64{ress[0].ResID})
	if err != nil {
		log.WithContext(ctx).Errorf("get catalog: %v mounted table: %v failed, err: %v", assetModel.ID, ress[0].ResID, err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if len(metaTableInfos) < 1 {
		log.WithContext(ctx).Errorf("get catalog: %v mounted table: %v failed, err: table not existed", assetModel.ID, ress[0].ResID)
		return nil, errorcode.Detail(errorcode.DataSourceNotFound, "挂接资源不存在")
	}
	// 赋值相关元数据信息项
	metaTableInfo := metaTableInfos[0]
	availableAsset.VirtualCatalogName = common.GetDataSourceCatalogName(ctx, metaTableInfo.AdvancedParams)
	availableAsset.DataSourceType = metaTableInfo.DataSourceType
	availableAsset.DataSourceTypeName = metaTableInfo.DataSourceTypeName
	availableAsset.DataSourceId = metaTableInfo.DataSourceID
	availableAsset.DataSourceName = metaTableInfo.DataSourceName
	availableAsset.SchemaId = metaTableInfo.SchemaID
	availableAsset.SchemaName = metaTableInfo.SchemaName
	availableAsset.TableId = metaTableInfo.ID
	availableAsset.TableName = metaTableInfo.Name

	//// 赋值下载权限
	//accessResult, expireTime, err := d.commonUseCase.GetDownloadAccessResult(ctx, assetModel.Orgcode, assetModel.Code)
	//if err != nil {
	//	// err已经返回是自定义的错误
	//	return nil, err
	//}
	//availableAsset.DownloadAccessResult = accessResult
	//
	//// 赋值过期时间
	//if expireTime != nil {
	//	availableAsset.DownloadAccessExpireTime = expireTime.UnixMilli() // 时间戳为毫秒
	//}

	return availableAsset, nil
}
*/
