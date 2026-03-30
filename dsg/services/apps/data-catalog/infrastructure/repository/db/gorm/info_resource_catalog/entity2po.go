package info_resource_catalog

import (
	"strconv"
	"strings"

	"github.com/samber/lo"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/util"
)

const autoIncrementID = 0

// 构建信息资源目录PO
func (repo *infoResourceCatalogRepo) buildInfoResourceCatalogPO(catalog *domain.InfoResourceCatalog) (po *domain.InfoResourceCatalogPO, err error) {
	var id, preID, nextID int64
	// [解析ID]
	id, err = strconv.ParseInt(catalog.ID, 10, 64)
	if err != nil {
		return
	} // [/]
	if len(catalog.PreID) > 0 {
		preID, err = strconv.ParseInt(catalog.PreID, 10, 64)
		if err != nil {
			return
		}
	}
	if len(catalog.NextID) > 0 {
		nextID, err = strconv.ParseInt(catalog.NextID, 10, 64)
		if err != nil {
			return
		}
	}

	boolToInt8 := util.BoolToInt[int8]()
	po = &domain.InfoResourceCatalogPO{
		ID:                           id,
		Name:                         catalog.Name,
		Code:                         catalog.Code,
		DataRange:                    catalog.DataRange.Integer.Int8(),
		UpdateCycle:                  catalog.UpdateCycle.Integer.Int8(),
		OfficeBusinessResponsibility: catalog.OfficeBusinessResponsibility,
		Description:                  catalog.Description,
		SharedType:                   catalog.SharedType.Integer.Int8(),
		SharedMessage:                catalog.SharedMessage,
		SharedMode:                   catalog.SharedMode.Integer.Int8(),
		OpenType:                     catalog.OpenType.Integer.Int8(),
		OpenCondition:                catalog.OpenCondition,
		PublishStatus:                catalog.PublishStatus.Integer.Int8(),
		PublishAt:                    catalog.PublishAt.UnixMilli(),
		OnlineStatus:                 catalog.OnlineStatus.Integer.Int8(),
		OnlineAt:                     catalog.OnlineAt.UnixMilli(),
		UpdateAt:                     catalog.UpdateAt.UnixMilli(),
		DeleteAt:                     catalog.DeleteAt.UnixMilli(),
		AuditID:                      catalog.AuditInfo.ID,
		AuditMsg:                     catalog.AuditInfo.Msg,
		CurrentVersion:               boolToInt8[catalog.CurrentVersion],
		AlterUID:                     catalog.AlterUID,
		AlterName:                    catalog.AlterName,
		AlterAt:                      catalog.AlterAt.UnixMilli(),
		PreID:                        preID,
		NextID:                       nextID,
		AlterAuditMsg:                catalog.AlterAuditMsg,
		LabelIds:                     strings.Join(catalog.LabelIds, ","),
	}
	return
}

// 构建信息资源目录来源信息PO
func (repo *infoResourceCatalogRepo) buildInfoResourceCatalogSourceInfoPO(catalog *domain.InfoResourceCatalog) (po *domain.InfoResourceCatalogSourceInfoPO, err error) {
	// [解析ID]
	id, err := strconv.ParseInt(catalog.ID, 10, 64)
	if err != nil {
		return
	} // [/]
	po = &domain.InfoResourceCatalogSourceInfoPO{
		ID:               id,
		BusinessFormID:   catalog.SourceBusinessForm.ID,
		BusinessFormName: catalog.SourceBusinessForm.Name,
		DepartmentID:     catalog.SourceDepartment.ID,
		DepartmentName:   catalog.SourceDepartment.Name,
	}
	return
}

// 构建信息资源目录关联项PO
func (repo *infoResourceCatalogRepo) buildInfoResourceCatalogRelatedItemPOs(catalog *domain.InfoResourceCatalog) (po []*domain.InfoResourceCatalogRelatedItemPO, err error) {
	// [准备工作]
	catalogID, err := strconv.ParseInt(catalog.ID, 10, 64)
	if err != nil {
		return
	}
	po = make([]*domain.InfoResourceCatalogRelatedItemPO, 0) // [/]
	// [处理所属部门]
	if catalog.BelongDepartment != nil && catalog.BelongDepartment.ID != "" {
		po = append(po, &domain.InfoResourceCatalogRelatedItemPO{
			ID:                    autoIncrementID,
			InfoResourceCatalogID: catalogID,
			RelatedItemID:         catalog.BelongDepartment.ID,
			RelatedItemName:       catalog.BelongDepartment.Name,
			RelationType:          domain.BelongDepartment,
		})
	} // [/]
	// [处理所属处室]
	if catalog.BelongOffice != nil && catalog.BelongOffice.ID != "" {
		po = append(po, &domain.InfoResourceCatalogRelatedItemPO{
			ID:                    autoIncrementID,
			InfoResourceCatalogID: catalogID,
			RelatedItemID:         catalog.BelongOffice.ID,
			RelatedItemName:       catalog.BelongOffice.Name,
			RelationType:          domain.BelongOffice,
		})
	} // [/]
	// [处理关联业务流程]
	for _, bizProcess := range catalog.BelongBusinessProcessList {
		po = append(po, &domain.InfoResourceCatalogRelatedItemPO{
			ID:                    autoIncrementID,
			InfoResourceCatalogID: catalogID,
			RelatedItemID:         bizProcess.ID,
			RelatedItemName:       bizProcess.Name,
			RelationType:          domain.BelongBusinessProcess,
		})
	} // [/]
	// [处理关联信息系统]
	for _, infoSystem := range catalog.RelatedInfoSystemList {
		po = append(po, &domain.InfoResourceCatalogRelatedItemPO{
			ID:                    autoIncrementID,
			InfoResourceCatalogID: catalogID,
			RelatedItemID:         infoSystem.ID,
			RelatedItemName:       infoSystem.Name,
			RelationType:          domain.RelatedInfoSystem,
		})
	} // [/]
	// [处理关联数据资源目录]
	for _, dataResourceCatalog := range catalog.RelatedDataResourceCatalogList {
		po = append(po, &domain.InfoResourceCatalogRelatedItemPO{
			ID:                    autoIncrementID,
			InfoResourceCatalogID: catalogID,
			RelatedItemID:         dataResourceCatalog.ID,
			RelatedItemName:       dataResourceCatalog.Name,
			RelationType:          domain.RelatedDataResourceCatalog,
		})
	} // [/]
	// [处理关联信息类]
	for _, infoClass := range catalog.RelatedInfoClassList {
		po = append(po, &domain.InfoResourceCatalogRelatedItemPO{
			ID:                    autoIncrementID,
			InfoResourceCatalogID: catalogID,
			RelatedItemID:         infoClass.ID,
			RelatedItemName:       infoClass.Name,
			RelationType:          domain.RelatedInfoClass,
		})
	} // [/]
	// [处理关联信息项]
	for _, infoItem := range catalog.RelatedInfoItemList {
		po = append(po, &domain.InfoResourceCatalogRelatedItemPO{
			ID:                    autoIncrementID,
			InfoResourceCatalogID: catalogID,
			RelatedItemID:         infoItem.ID,
			RelatedItemName:       infoItem.Name,
			RelatedItemDataType:   infoItem.DataType,
			RelationType:          domain.RelatedInfoItem,
		})
	} // [/]
	return
}

// 构建信息资源目录类目节点PO
func (repo *infoResourceCatalogRepo) buildInfoResourceCatalogCategoryNodePOs(catalog *domain.InfoResourceCatalog) (po []*domain.InfoResourceCatalogCategoryNodePO, err error) {
	// [准备工作]
	catalogID, err := strconv.ParseInt(catalog.ID, 10, 64)
	if err != nil {
		return
	}
	po = make([]*domain.InfoResourceCatalogCategoryNodePO, 0) // [/]
	// [处理类目节点]
	for _, node := range catalog.CategoryNodeList {
		po = append(po, &domain.InfoResourceCatalogCategoryNodePO{
			ID:                    autoIncrementID,
			CategoryNodeID:        node.NodeID,
			CategoryCateID:        node.CateID,
			InfoResourceCatalogID: catalogID,
		})
	} // [/]
	return
}

// 构建业务场景PO
func (repo *infoResourceCatalogRepo) buildBusinessScenePOs(catalog *domain.InfoResourceCatalog) (po []*domain.BusinessScenePO, err error) {
	// [准备工作]
	catalogID, err := strconv.ParseInt(catalog.ID, 10, 64)
	if err != nil {
		return
	}
	po = make([]*domain.BusinessScenePO, 0) // [/]
	// [处理来源业务场景]
	for _, scene := range catalog.SourceBusinessSceneList {
		po = append(po, &domain.BusinessScenePO{
			ID:                    autoIncrementID,
			Type:                  scene.Type.Integer.Int8(),
			Value:                 scene.Value,
			InfoResourceCatalogID: catalogID,
			RelatedType:           domain.SourceBusinessScene,
		})
	} // [/]
	// [处理关联业务场景]
	for _, scene := range catalog.RelatedBusinessSceneList {
		po = append(po, &domain.BusinessScenePO{
			ID:                    autoIncrementID,
			Type:                  scene.Type.Integer.Int8(),
			Value:                 scene.Value,
			InfoResourceCatalogID: catalogID,
			RelatedType:           domain.RelatedBusinessScene,
		})
	} // [/]
	return
}

// 构建信息资源目录下属信息项PO
func (repo *infoResourceCatalogRepo) buildInfoResourceCatalogColumnPOs(catalog *domain.InfoResourceCatalog) (po []*domain.InfoResourceCatalogColumnPO, err error) {
	// [准备工作]
	catalogID, err := strconv.ParseInt(catalog.ID, 10, 64)
	if err != nil {
		return
	}
	po = make([]*domain.InfoResourceCatalogColumnPO, len(catalog.Columns))
	boolToInt8 := util.BoolToInt[int8]()
	boolPtrToInt8 := func(x *bool) int8 {
		if x == nil {
			return -1
		}
		return boolToInt8[*x]
	} // [/]
	// [处理信息项]
	for i, item := range catalog.Columns {
		var itemID int64
		itemID, err = strconv.ParseInt(item.ID, 10, 64)
		if err != nil {
			return
		}
		po[i] = &domain.InfoResourceCatalogColumnPO{
			ID:                    itemID,
			Name:                  item.Name,
			FieldNameEN:           item.FieldNameEN,
			FieldNameCN:           item.FieldNameCN,
			DataType:              item.DataType.Integer.Int8(),
			DataLength:            int64(item.DataLength),
			DataRange:             item.DataRange,
			IsSensitive:           boolPtrToInt8(item.IsSensitive),
			IsSecret:              boolPtrToInt8(item.IsSecret),
			IsIncremental:         boolToInt8[item.IsIncremental],
			IsPrimaryKey:          boolToInt8[item.IsPrimaryKey],
			IsLocalGenerated:      boolToInt8[item.IsLocalGenerated],
			IsStandardized:        boolToInt8[item.IsStandardized],
			InfoResourceCatalogID: catalogID,
			Order:                 int16(i),
		}
	} // [/]
	return
}

// 构建信息资源目录信息项关联信息PO
func (repo *infoResourceCatalogRepo) buildInfoResourceCatalogColumnRelatedInfoPOs(catalog *domain.InfoResourceCatalog) (po []*domain.InfoResourceCatalogColumnRelatedInfoPO, err error) {
	po = make([]*domain.InfoResourceCatalogColumnRelatedInfoPO, 0)
	for _, item := range catalog.Columns {
		// [解析信息项ID]
		var itemID int64
		itemID, err = strconv.ParseInt(item.ID, 10, 64)
		if err != nil {
			return
		} // [/]
		// [解析关联代码集ID]
		var codeSetID int64
		codeSetID, err = strconv.ParseInt(item.RelatedCodeSet.ID, 10, 64)
		if err != nil {
			return
		} // [/]
		// [解析关联数据元ID]
		var dataReferID int64
		dataReferID, err = strconv.ParseInt(item.RelatedDataRefer.ID, 10, 64)
		if err != nil {
			return
		} // [/]
		po = append(po, &domain.InfoResourceCatalogColumnRelatedInfoPO{
			ID:            itemID,
			CodeSetID:     codeSetID,
			CodeSetName:   item.RelatedCodeSet.Name,
			DataReferID:   dataReferID,
			DataReferName: item.RelatedDataRefer.Name,
		})
	} // [/]
	return
}

// 构建未编目业务表PO
func (repo *infoResourceCatalogRepo) buildBusinessFormNotCatalogedPO(bizForm *domain.BusinessFormCopy) *domain.BusinessFormNotCatalogedPO {
	return &domain.BusinessFormNotCatalogedPO{
		ID:           bizForm.ID,
		Name:         bizForm.Name,
		DepartmentID: bizForm.Department.ID,
		UpdateAt:     bizForm.UpdateAt.UnixMilli(),
	}
}

// 从详情信息构建未编目业务表PO
func (repo *infoResourceCatalogRepo) buildBusinessFormNotCatalogedPOFromDetail(bizForm *business_grooming.BusinessFormDetail) *domain.BusinessFormNotCatalogedPO {
	return &domain.BusinessFormNotCatalogedPO{
		ID:   bizForm.ID,
		Name: bizForm.Name,
		InfoSystemID: strings.Join(lo.Times(len(bizForm.RelatedInfoSystems), func(index int) string {
			return bizForm.RelatedInfoSystems[index].ID
		}), ","),
		Description:      bizForm.Description,
		DepartmentID:     bizForm.DepartmentID,
		BusinessModelID:  bizForm.ModelID,
		UpdateAt:         bizForm.UpdateAt,
		BusinessDomainID: bizForm.BusinessDomainID,
	}
}
