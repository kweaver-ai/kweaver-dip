package impl

import (
	"strconv"

	"github.com/biocrosscoder/flex/typed/collections/dict"
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
)

func (d *infoResourceCatalogDomain) buildBelongInfoVO(catalog *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.BelongInfoVO {
	vo := &info_resource_catalog.BelongInfoVO{
		Department:      &info_resource_catalog.BusinessEntity{},
		Office:          &info_resource_catalog.OfficeVO{},
		BusinessProcess: catalog.BelongBusinessProcessList,
	}
	if catalog.BelongDepartment != nil {
		vo.Department = catalog.BelongDepartment
	}
	if catalog.BelongOffice != nil {
		vo.Office.ID = catalog.BelongOffice.ID
		vo.Office.Name = catalog.BelongOffice.Name
		vo.Office.BusinessResponsibility = catalog.OfficeBusinessResponsibility
	}
	return vo
}

func (d *infoResourceCatalogDomain) extractCategoryNodeIDs(categoryNodes []*info_resource_catalog.CategoryNode) []string {
	return functools.Map(func(x *info_resource_catalog.CategoryNode) string {
		return x.NodeID
	}, categoryNodes)
}

func (d *infoResourceCatalogDomain) buildRelationInfoVO(catalog *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.RelationInfoVO {
	emptyList := make([]*info_resource_catalog.BusinessEntity, 0)
	vo := &info_resource_catalog.RelationInfoVO{
		InfoSystems:           emptyList,
		DataResourceCatalogs:  emptyList,
		InfoResourceCatalogs:  emptyList,
		InfoItems:             emptyList,
		RelatedBusinessScenes: functools.Map(d.buildBusinessSceneVO, catalog.RelatedBusinessSceneList),
		SourceBusinessScenes:  functools.Map(d.buildBusinessSceneVO, catalog.SourceBusinessSceneList),
	}
	if catalog.RelatedInfoSystemList != nil {
		vo.InfoSystems = catalog.RelatedInfoSystemList
	}
	if catalog.RelatedDataResourceCatalogList != nil {
		vo.DataResourceCatalogs = catalog.RelatedDataResourceCatalogList
	}
	if catalog.RelatedInfoClassList != nil {
		vo.InfoResourceCatalogs = catalog.RelatedInfoClassList
	}
	if catalog.RelatedInfoItemList != nil {
		vo.InfoItems = catalog.RelatedInfoItemList
	}
	return vo
}

func (d *infoResourceCatalogDomain) buildSharedOpenInfoVO(catalog *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.SharedOpenInfoVO {
	return &info_resource_catalog.SharedOpenInfoVO{
		SharedType:    catalog.SharedType.String,
		SharedMessage: catalog.SharedMessage,
		SharedMode:    catalog.SharedMode.String,
		OpenType:      catalog.OpenType.String,
		OpenCondition: catalog.OpenCondition,
	}
}

func (d *infoResourceCatalogDomain) buildSourceInfoVO(catalog *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.SourceInfoVO {
	return &info_resource_catalog.SourceInfoVO{
		BusinessForm: catalog.SourceBusinessForm,
		Department:   catalog.SourceDepartment,
	}
}

func (d *infoResourceCatalogDomain) buildInfoResourceCatalogStatusVO(catalog *info_resource_catalog.InfoResourceCatalog) *info_resource_catalog.InfoResourceCatalogStatusVO {
	return &info_resource_catalog.InfoResourceCatalogStatusVO{
		Publish: catalog.PublishStatus.String,
		Online:  catalog.OnlineStatus.String,
	}
}

func (d *infoResourceCatalogDomain) buildRelatedItemsVO(items map[info_resource_catalog.EnumObjectType][]*info_resource_catalog.BusinessEntity) (vo []*info_resource_catalog.RelatedItemVO) {
	vo = make([]*info_resource_catalog.RelatedItemVO, 0)
	for k, v := range items {
		for _, item := range v {
			vo = append(vo, &info_resource_catalog.RelatedItemVO{
				ID:       item.ID,
				Name:     item.Name,
				DataType: item.DataType,
				Type:     k,
			})
		}
	}
	return
}

func (d *infoResourceCatalogDomain) buildListCommonItem(
	entity *info_resource_catalog.InfoResourceCatalog,
	departmentMap dict.Dict[string, *configuration_center.DepartmentInternal],
	dataCatalogMap dict.Dict[string, []*model.TDataCatalog],
) (item *info_resource_catalog.InfoResourceCatalogListAttrs) {
	// [构建基础信息]
	item = &info_resource_catalog.InfoResourceCatalogListAttrs{
		ID:   entity.ID,
		Name: entity.Name,
		Code: entity.Code,
	} // [/]
	// [添加部门名称和路径]
	if department := departmentMap.Get(entity.ID); department != nil {
		item.Department = department.Name
		item.DepartmentPath = department.Path
	} // [/]
	// [添加关联数据资源目录]
	item.RelatedDataResourceCatalogs = functools.Map(func(x *model.TDataCatalog) *info_resource_catalog.BusinessEntity {
		return &info_resource_catalog.BusinessEntity{
			ID:   strconv.FormatUint(x.ID, 10),
			Name: x.Title,
		}
	}, dataCatalogMap.Get(item.ID)) // [/]
	return
}

func (d *infoResourceCatalogDomain) buildInfoResourceCatalogDetail(catalog *info_resource_catalog.InfoResourceCatalog, categoryNodes []*common_model.CategoryInfo, belongDepartmentPath string) *info_resource_catalog.InfoResourceCatalogDetail {

	// [组装值对象]
	detail := &info_resource_catalog.InfoResourceCatalogDetail{
		Name:           catalog.Name,
		Code:           catalog.Code,
		SourceInfo:     d.buildSourceInfoVO(catalog),
		BelongInfo:     d.buildBelongInfoVO(catalog),
		DataRange:      catalog.DataRange.String,
		UpdateCycle:    catalog.UpdateCycle.String,
		Description:    catalog.Description,
		CateInfo:       d.buildCateInfoVO(categoryNodes),
		RelationInfo:   d.buildRelationInfoVO(catalog),
		SharedOpenInfo: d.buildSharedOpenInfoVO(catalog),
		LabelIds:       catalog.LabelIds,
	} // [/]
	// [给所属部门对应类目节点补齐路径]
	for _, node := range detail.CateInfo {
		if node.CateID == constant.DepartmentCateId && node.NodeID == detail.BelongInfo.Department.ID {
			node.NodePath = belongDepartmentPath
			break
		}
	} // [/]
	return detail
}

func (d *infoResourceCatalogDomain) buildCateInfoVO(categoryNodes []*common_model.CategoryInfo) []*info_resource_catalog.CategoryNode {
	return functools.Map(func(x *common_model.CategoryInfo) *info_resource_catalog.CategoryNode {
		return &info_resource_catalog.CategoryNode{
			CateID:   x.CategoryID,
			NodeID:   x.CategoryNodeID,
			NodeName: x.CategoryNode,
		}
	}, categoryNodes)
}

func (d *infoResourceCatalogDomain) buildBusinessSceneVO(entity *info_resource_catalog.BusinessScene) (vo *info_resource_catalog.BusinessSceneVO) {
	return &info_resource_catalog.BusinessSceneVO{
		Type:  entity.Type.String,
		Value: entity.Value,
	}
}
