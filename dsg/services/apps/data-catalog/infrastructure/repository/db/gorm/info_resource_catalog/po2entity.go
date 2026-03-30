package info_resource_catalog

import (
	"strconv"
	"strings"
	"time"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// 构建信息资源目录业务实体
func (repo *infoResourceCatalogRepo) buildInfoResourceCatalogEntity(
	catalog *domain.InfoResourceCatalogPO,
	sourceInfo *domain.InfoResourceCatalogSourceInfoPO,
	relatedItems []*domain.InfoResourceCatalogRelatedItemPO,
	categoryNodes []*domain.InfoResourceCatalogCategoryNodePO,
	businessScenes []*domain.BusinessScenePO,
	columns []*domain.InfoItem,
) (entity *domain.InfoResourceCatalog, err error) {
	int8ToBool := util.IntToBool[int8]()

	// [构建主实体]
	entity = &domain.InfoResourceCatalog{
		// [加载基本信息]
		ID:                           strconv.FormatInt(catalog.ID, 10),
		Name:                         catalog.Name,
		Code:                         catalog.Code,
		OfficeBusinessResponsibility: catalog.OfficeBusinessResponsibility,
		Description:                  catalog.Description,
		SharedMessage:                catalog.SharedMessage,
		OpenCondition:                catalog.OpenCondition, // [/]
		// [加载枚举项]
		DataRange:     *enum.Get[domain.EnumDataRange](catalog.DataRange),
		UpdateCycle:   *enum.Get[domain.EnumUpdateCycle](catalog.UpdateCycle),
		SharedType:    *enum.Get[domain.EnumSharedType](catalog.SharedType),
		SharedMode:    *enum.Get[domain.EnumSharedMode](catalog.SharedMode),
		OpenType:      *enum.Get[domain.EnumOpenType](catalog.OpenType),
		PublishStatus: *enum.Get[domain.EnumPublishStatus](catalog.PublishStatus),
		OnlineStatus:  *enum.Get[domain.EnumOnlineStatus](catalog.OnlineStatus), // [/]
		// [初始化关联项列表]
		BelongBusinessProcessList:      arraylist.Of[*domain.BusinessEntity](),
		CategoryNodeList:               arraylist.Of[*domain.CategoryNode](),
		RelatedInfoSystemList:          arraylist.Of[*domain.BusinessEntity](),
		RelatedDataResourceCatalogList: arraylist.Of[*domain.BusinessEntity](),
		SourceBusinessSceneList:        arraylist.Of[*domain.BusinessScene](),
		RelatedBusinessSceneList:       arraylist.Of[*domain.BusinessScene](),
		RelatedInfoClassList:           arraylist.Of[*domain.BusinessEntity](),
		RelatedInfoItemList:            arraylist.Of[*domain.BusinessEntity](), // [/]
		// [加载时间戳]
		PublishAt: time.UnixMilli(catalog.PublishAt),
		OnlineAt:  time.UnixMilli(catalog.OnlineAt),
		UpdateAt:  time.UnixMilli(catalog.UpdateAt),
		DeleteAt:  time.UnixMilli(catalog.DeleteAt), // [/]
		Columns:   columns,
		// [加载审核信息]
		AuditInfo: &domain.AuditInfo{
			ID:  catalog.AuditID,
			Msg: catalog.AuditMsg,
		}, // [/]
		// [变更相关冗余信息]
		CurrentVersion: int8ToBool[catalog.CurrentVersion],
		AlterUID:       catalog.AlterUID,
		AlterName:      catalog.AlterName,
		AlterAt:        time.UnixMilli(catalog.AlterAt),
		PreID:          strconv.FormatInt(catalog.PreID, 10),
		NextID:         strconv.FormatInt(catalog.NextID, 10),
		AlterAuditMsg:  catalog.AlterAuditMsg,
	} // [/]
	if catalog.LabelIds != "" {
		entity.LabelIds = strings.Split(catalog.LabelIds, ",")
	}
	// [加载来源信息]
	if sourceInfo != nil {
		entity.SourceBusinessForm = repo.buildBusinessEntity(sourceInfo.BusinessFormID, sourceInfo.BusinessFormName, "")
		entity.SourceDepartment = repo.buildBusinessEntity(sourceInfo.DepartmentID, sourceInfo.DepartmentName, "")
	} // [/]
	// [添加关联项]
	for _, item := range relatedItems {
		itemEntity := repo.buildBusinessEntity(item.RelatedItemID, item.RelatedItemName, item.RelatedItemDataType)
		switch item.RelationType {
		case domain.BelongDepartment:
			entity.BelongDepartment = itemEntity
		case domain.BelongOffice:
			entity.BelongOffice = itemEntity
		case domain.BelongBusinessProcess:
			entity.BelongBusinessProcessList.Push(itemEntity)
		case domain.RelatedInfoSystem:
			entity.RelatedInfoSystemList.Push(itemEntity)
		case domain.RelatedDataResourceCatalog:
			entity.RelatedDataResourceCatalogList.Push(itemEntity)
		case domain.RelatedInfoClass:
			entity.RelatedInfoClassList.Push(itemEntity)
		case domain.RelatedInfoItem:
			entity.RelatedInfoItemList.Push(itemEntity)
		}
	} // [/]
	// [添加关联类目节点]
	for _, node := range categoryNodes {
		entity.CategoryNodeList.Push(repo.buildCategoryNodeEntity(node))
	} // [/]
	// [添加业务场景]
	for _, scene := range businessScenes {
		sceneValue := repo.buildBusinessSceneValue(scene)
		switch scene.RelatedType {
		case domain.SourceBusinessScene:
			entity.SourceBusinessSceneList.Push(sceneValue)
		case domain.RelatedBusinessScene:
			entity.RelatedBusinessSceneList.Push(sceneValue)
		}
	} // [/]
	return
}

// 构建业务实体
func (repo *infoResourceCatalogRepo) buildBusinessEntity(id, name, dataType string) (entity *domain.BusinessEntity) {
	return &domain.BusinessEntity{
		ID:       id,
		Name:     name,
		DataType: dataType,
	}
}

// 构建业务场景值
func (repo *infoResourceCatalogRepo) buildBusinessSceneValue(po *domain.BusinessScenePO) (value *domain.BusinessScene) {
	return &domain.BusinessScene{
		Type:  *enum.Get[domain.EnumBusinessSceneType](po.Type),
		Value: po.Value,
	}
}

// 构建业务表实体
func (repo *infoResourceCatalogRepo) buildBusinessFormEntity(po *domain.BusinessFormNotCatalogedPO) (entity *domain.BusinessFormCopy) {
	return &domain.BusinessFormCopy{
		ID:          po.ID,
		Name:        po.Name,
		Description: po.Description,
		Department:  repo.buildBusinessEntity(po.DepartmentID, "", ""),
		UpdateAt:    time.UnixMilli(po.UpdateAt),
	}
}

// 构建类目节点实体
func (repo *infoResourceCatalogRepo) buildCategoryNodeEntity(po *domain.InfoResourceCatalogCategoryNodePO) (entity *domain.CategoryNode) {
	return &domain.CategoryNode{
		NodeID: po.CategoryNodeID,
		CateID: po.CategoryCateID,
	}
}

// 构建信息项实体
func (repo *infoResourceCatalogRepo) buildInfoItemEntity(baseInfo *domain.InfoResourceCatalogColumnPO, relatedInfo *domain.InfoResourceCatalogColumnRelatedInfoPO, belongCatalog *domain.InfoResourceCatalog) (entity *domain.InfoItem) {
	int8ToBool := util.IntToBool[int8]()
	int8ToBoolPtr := func(x int8) *bool {
		if x == -1 {
			return nil
		}
		value := int8ToBool[x]
		return &value
	}
	if belongCatalog == nil {
		belongCatalog = &domain.InfoResourceCatalog{
			ID: strconv.FormatInt(baseInfo.InfoResourceCatalogID, 10),
		}
	}
	return &domain.InfoItem{
		ID:               strconv.FormatInt(baseInfo.ID, 10),
		Name:             baseInfo.Name,
		FieldNameEN:      baseInfo.FieldNameEN,
		FieldNameCN:      baseInfo.FieldNameCN,
		RelatedDataRefer: repo.buildBusinessEntity(strconv.FormatInt(relatedInfo.DataReferID, 10), relatedInfo.DataReferName, ""),
		RelatedCodeSet:   repo.buildBusinessEntity(strconv.FormatInt(relatedInfo.CodeSetID, 10), relatedInfo.CodeSetName, ""),
		DataType:         *enum.Get[domain.EnumDataType](baseInfo.DataType),
		DataLength:       uint16(baseInfo.DataLength),
		DataRange:        baseInfo.DataRange,
		IsSensitive:      int8ToBoolPtr(baseInfo.IsSensitive),
		IsSecret:         int8ToBoolPtr(baseInfo.IsSecret),
		IsPrimaryKey:     int8ToBool[baseInfo.IsPrimaryKey],
		IsIncremental:    int8ToBool[baseInfo.IsIncremental],
		IsLocalGenerated: int8ToBool[baseInfo.IsLocalGenerated],
		IsStandardized:   int8ToBool[baseInfo.IsStandardized],
		Parent:           belongCatalog,
	}
}
