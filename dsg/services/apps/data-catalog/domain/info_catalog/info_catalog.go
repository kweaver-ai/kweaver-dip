package info_catalog

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/category"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/basic_bigdata_service"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/xuri/excelize/v2"
)

type InfoCatalogDomain struct {
	repo                      *info_catalog.InfoCatalogRepo
	basicBigdataService       basic_bigdata_service.Driven
	categoryTreeRepo          category.TreeRepo
	configurationCenterDriven configuration_center.Driven
}

func NewInfoCatalogDomain(repo *info_catalog.InfoCatalogRepo, basicBigdataService basic_bigdata_service.Driven, categoryTreeRepo category.TreeRepo, configurationCenterDriven configuration_center.Driven) *InfoCatalogDomain {
	return &InfoCatalogDomain{
		repo:                      repo,
		basicBigdataService:       basicBigdataService,
		categoryTreeRepo:          categoryTreeRepo,
		configurationCenterDriven: configurationCenterDriven,
	}
}
func Joint(a string, b string) string {
	if b == "" {
		return a
	}
	if a == "" {
		a += b
	} else {
		a += ";" + b
	}
	return a
}

func (domain InfoCatalogDomain) ExportInfoCatalog(ctx *gin.Context, req *ExportInfoCatalogReq) (*excelize.File, error) {
	file, err := excelize.OpenFile("cmd/server/static/info_catalog.xlsx")
	if err != nil {
		return nil, errors.New("OpenTemplateFileError")
	}
	defer func(file *excelize.File) {
		_ = file.Close()
	}(file)
	catalogIDs := make([]uint64, len(req.CatalogIDs))
	for i, catalogID := range req.CatalogIDs {
		uintId, err := strconv.ParseUint(catalogID, 10, 64)
		if err == nil {
			catalogIDs[i] = uintId
		}
	}

	infoCatalogs, err := domain.repo.GetCatalogWithByCatalogIds(ctx, catalogIDs)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	infoCatalogArrys := make([][]any, len(infoCatalogs))
	for i, infoCatalog := range infoCatalogs {
		relatedItems, err := domain.repo.GetCatalogRelatedItemByCatalogId(ctx, infoCatalog.FID)
		if err != nil {
			return nil, err
		}
		var departmentID string
		var officeID string
		var businessObject string
		var dataCatalog string
		var infoSystem string
		var infoClass string
		var catalogColumn string
		for _, relatedItem := range relatedItems {
			switch info_resource_catalog.InfoResourceCatalogRelatedItemRelationTypeEnum(relatedItem.FRelationType) {
			case info_resource_catalog.BelongDepartment:
				departmentID = relatedItem.FRelatedItemID
			case info_resource_catalog.BelongOffice:
				officeID = relatedItem.FRelatedItemID
			case info_resource_catalog.BelongBusinessProcess:
				businessObject = Joint(businessObject, relatedItem.FRelatedItemName)
			case info_resource_catalog.RelatedInfoSystem:
				infoSystem = Joint(infoSystem, relatedItem.FRelatedItemName)
			case info_resource_catalog.RelatedDataResourceCatalog:
				dataCatalog = Joint(dataCatalog, relatedItem.FRelatedItemName)
			case info_resource_catalog.RelatedInfoClass:
				infoClass = Joint(infoClass, relatedItem.FRelatedItemName)
			case info_resource_catalog.RelatedInfoItem:
				catalogColumn = Joint(catalogColumn, relatedItem.FRelatedItemName)
			}

		}

		businessScenes, err := domain.repo.GetTBusinessSceneByCatalogId(ctx, infoCatalog.FID)
		if err != nil {
			return nil, err
		}
		_, pathMap, err := domain.GetDepartmentNameAndPathMap(ctx, []string{infoCatalog.FDepartmentID, departmentID, officeID})
		if err != nil {
			return nil, err
		}

		var sourceBusinessScene, relatedBusinessScene string
		for _, businessScene := range businessScenes {
			switch info_resource_catalog.BusinessSceneRelatedTypeEnum(businessScene.FRelatedType) {
			case info_resource_catalog.SourceBusinessScene:
				sourceBusinessScene = Joint(sourceBusinessScene, enum.Get[info_resource_catalog.EnumBusinessSceneType](businessScene.FType).Display+"/"+businessScene.FValue)
			case info_resource_catalog.RelatedBusinessScene:
				relatedBusinessScene = Joint(relatedBusinessScene, enum.Get[info_resource_catalog.EnumBusinessSceneType](businessScene.FType).Display+"/"+businessScene.FValue)
			}
		}

		var resourceLabel string
		if infoCatalog.LabelIds != "" {
			labels, err := domain.basicBigdataService.GetLabelByIds(ctx, strings.Split(infoCatalog.LabelIds, ","))
			if err != nil {
				return nil, err
			}
			for _, label := range labels.LabelResp {
				resourceLabel = Joint(resourceLabel, label.Path)
			}
		}

		categoryIds, err := domain.repo.GetCategoryIdByCatalogId(ctx, infoCatalog.FID)
		if err != nil {
			return nil, err
		}

		var categoryTmp string
		for _, id := range categoryIds {
			nodePath := domain.GetPath(ctx, id.FCategoryNodeID)
			categoryTmp = Joint(categoryTmp, nodePath)
		}

		infoCatalogArrys[i] = []any{
			infoCatalog.FName,
			pathMap[infoCatalog.FDepartmentID], //信息资源来源部门
			pathMap[departmentID],              //所属部门
			pathMap[officeID],                  //所属处室
			businessObject,                     //所属主干业务
			enum.Get[info_resource_catalog.EnumDataRange](infoCatalog.FDataRange).Display,     //数据范围
			enum.Get[info_resource_catalog.EnumUpdateCycle](infoCatalog.FUpdateCycle).Display, //更新周期
			resourceLabel, //资源标签
			infoCatalog.FOfficeBusinessResponsibility, //处室业务职责
			infoCatalog.FDescription,
			categoryTmp,          //资源属性分类
			dataCatalog,          //关联数据资源目录
			infoSystem,           //关联信息系统
			sourceBusinessScene,  //来源业务场景
			relatedBusinessScene, //关联业务场景
			infoClass,            //关联信息类
			catalogColumn,        //关联信息项
			enum.Get[info_resource_catalog.EnumSharedType](infoCatalog.FSharedType).Display, //共享属性
			infoCatalog.FSharedMessage, //共享条件/不予共享依据
			enum.Get[info_resource_catalog.EnumSharedMode](infoCatalog.FSharedMode).Display, //共享方式
			enum.Get[info_resource_catalog.EnumOpenType](infoCatalog.FOpenType).Display,     //开放属性
			infoCatalog.FOpenCondition, //开放条件
		}
	}

	for i := 0; i < len(infoCatalogArrys); i++ {
		if err = file.SetSheetRow(file.GetSheetList()[0], fmt.Sprintf("A%d", i+2), &infoCatalogArrys[i]); err != nil {
			log.WithContext(ctx).Errorf("WriteFiller failed value: %v, err: %v", infoCatalogArrys[i], err)
			return nil, err
		}
	}

	var offset = 2
	for _, infoCatalog := range infoCatalogs {
		columns, err := domain.repo.GetColumnAllInfoByCatalogId(ctx, infoCatalog.FID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		for _, column := range columns {
			c := []any{
				infoCatalog.FName,
				column.FName,
				column.FFieldNameCn,
				column.FDataReferName,
				column.FCodeSetName,
				enum.Get[info_resource_catalog.EnumDataType](column.FDataType).Display,
				column.FDataLength,
				column.FDataRange,
				toSensitive(column.FIsSensitive),
				toSecret(column.FIsSecret),
				toBool(column.FIsPrimaryKey),
				toBool(column.FIsIncremental),
				toBool(column.FIsLocalGenerated),
				toBool(column.FIsStandardized),
			}
			if err = file.SetSheetRow(file.GetSheetList()[1], fmt.Sprintf("A%d", offset), &c); err != nil {
				log.WithContext(ctx).Errorf("WriteFiller failed value: %v, err: %v", c, err)
				return nil, err
			}
			offset++
		}

	}

	return file, nil
}

func (domain InfoCatalogDomain) GetPath(ctx *gin.Context, id string) string {
	categoryNode, err := domain.categoryTreeRepo.GetNodeInfoById(ctx, id)
	if err != nil {
		return ""
	}
	var par string
	if categoryNode.ParentID != "" {
		par = domain.GetPath(ctx, categoryNode.ParentID)
	}
	return par + "/" + categoryNode.Name
}

func (domain InfoCatalogDomain) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	departmentIds = util.DuplicateStringRemoval(departmentIds)
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := domain.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
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
