package impl

import (
	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/common_model"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

func (d *infoResourceCatalogDomain) buildInfoResourceCatalogEntity(
	id, code string,
	params *info_resource_catalog.InfoResourceCatalogEditableAttrs,
	sourceInfo *info_resource_catalog.SourceInfoVO,
	columns []*info_resource_catalog.InfoItem,
	categoryNodes []*common_model.CategoryInfo,
	auditInfo *info_resource_catalog.AuditInfo,
) (entity *info_resource_catalog.InfoResourceCatalog) {
	entity = &info_resource_catalog.InfoResourceCatalog{
		ID:               id,
		Name:             params.Name,
		Code:             code,
		DataRange:        *enum.Get[info_resource_catalog.EnumDataRange](params.DataRange),
		UpdateCycle:      *enum.Get[info_resource_catalog.EnumUpdateCycle](params.UpdateCycle),
		Description:      params.Description,
		CategoryNodeList: d.buildCateInfoVO(categoryNodes),
		SharedType:       *enum.Get[info_resource_catalog.EnumSharedType](params.SharedOpenInfo.SharedType),
		SharedMessage:    params.SharedOpenInfo.SharedMessage,
		SharedMode:       *enum.Get[info_resource_catalog.EnumSharedMode](params.SharedOpenInfo.SharedMode),
		OpenType:         *enum.Get[info_resource_catalog.EnumOpenType](params.SharedOpenInfo.OpenType),
		OpenCondition:    params.SharedOpenInfo.OpenCondition,
		Columns:          columns,
	}
	// [添加关联信息]
	if params.RelationInfo != nil {
		relationInfo := params.RelationInfo
		entity.RelatedInfoSystemList = relationInfo.InfoSystems
		entity.RelatedDataResourceCatalogList = relationInfo.DataResourceCatalogs
		entity.RelatedInfoClassList = relationInfo.InfoResourceCatalogs
		entity.RelatedInfoItemList = relationInfo.InfoItems
		entity.SourceBusinessSceneList = functools.Map(d.buildBusinessSceneEntity, relationInfo.SourceBusinessScenes)
		entity.RelatedBusinessSceneList = functools.Map(d.buildBusinessSceneEntity, relationInfo.RelatedBusinessScenes)
	} // [/]
	// [添加所属信息]
	if params.BelongInfo != nil {
		belongInfo := params.BelongInfo
		if belongInfo.Department != nil {
			entity.BelongDepartment = belongInfo.Department
		}
		if belongInfo.Office != nil {
			office := belongInfo.Office
			entity.BelongOffice = &info_resource_catalog.BusinessEntity{
				ID:   office.ID,
				Name: office.Name,
			}
			entity.OfficeBusinessResponsibility = office.BusinessResponsibility
		}
		entity.BelongBusinessProcessList = belongInfo.BusinessProcess
	} // [/]
	// [添加来源信息]
	if sourceInfo != nil {
		entity.SourceBusinessForm = sourceInfo.BusinessForm
		entity.SourceDepartment = sourceInfo.Department
	} // [/]
	// [给信息项挂载所属信息资源目录]
	for _, column := range columns {
		column.Parent = entity
	} // [/]
	// [添加审核信息]
	if auditInfo == nil {
		auditInfo = &info_resource_catalog.AuditInfo{
			ID:  0,
			Msg: "",
		}
		entity.AuditInfo = auditInfo
	} // [/]
	return
}

func (d *infoResourceCatalogDomain) buildInfoResourceCatalogColumnsEntity(vo []*info_resource_catalog.InfoItemObject) (entity []*info_resource_catalog.InfoItem) {
	entity = make([]*info_resource_catalog.InfoItem, len(vo))
	for i, item := range vo {
		entity[i] = &info_resource_catalog.InfoItem{
			ID:               item.ID,
			Name:             item.Name,
			FieldNameEN:      item.FieldNameEN,
			FieldNameCN:      item.FieldNameCN,
			RelatedDataRefer: item.DataRefer,
			RelatedCodeSet:   item.CodeSet,
			DataType:         *enum.Get[info_resource_catalog.EnumDataType](item.Metadata.DataType),
			DataLength:       uint16(item.Metadata.DataLength),
			DataRange:        item.Metadata.DataRange,
			IsSensitive:      item.IsSensitive,
			IsSecret:         item.IsSecret,
			IsPrimaryKey:     item.IsPrimaryKey,
			IsIncremental:    item.IsIncremental,
			IsLocalGenerated: item.IsLocalGenerated,
			IsStandardized:   item.IsStandardized,
		}
	}
	return
}

func (d *infoResourceCatalogDomain) buildBusinessSceneEntity(vo *info_resource_catalog.BusinessSceneVO) *info_resource_catalog.BusinessScene {
	return &info_resource_catalog.BusinessScene{
		Type:  *enum.Get[info_resource_catalog.EnumBusinessSceneType](vo.Type),
		Value: vo.Value,
	}
}
