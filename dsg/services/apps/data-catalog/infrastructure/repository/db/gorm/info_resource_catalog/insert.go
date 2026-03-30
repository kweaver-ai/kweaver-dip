package info_resource_catalog

import (
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"gorm.io/gorm"
)

// 插入信息资源目录
func (repo *infoResourceCatalogRepo) insertInfoResourceCatalog(tx *gorm.DB, po *domain.InfoResourceCatalogPO) (err error) {
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_info_resource_catalog (
		f_id,
		f_name,
		f_code,
		f_data_range,
		f_update_cycle,
		f_office_business_responsibility,
		f_description,
		f_shared_type,
		f_shared_message,
		f_shared_mode,
		f_open_type,
		f_open_condition,
		f_publish_status,
		f_publish_at,
		f_online_status,
		f_online_at,
		f_update_at,
		f_delete_at,
		f_audit_id,
		f_audit_msg,
		f_current_version,
		f_alter_uid,
		f_alter_name,
		f_alter_at,
		f_pre_id,
		f_next_id,
		f_alter_audit_msg,
        label_ids
	) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?);`
	return Exec(tx, sqlStr,
		po.ID,
		po.Name,
		po.Code,
		po.DataRange,
		po.UpdateCycle,
		po.OfficeBusinessResponsibility,
		po.Description,
		po.SharedType,
		po.SharedMessage,
		po.SharedMode,
		po.OpenType,
		po.OpenCondition,
		po.PublishStatus,
		po.PublishAt,
		po.OnlineStatus,
		po.OnlineAt,
		po.UpdateAt,
		po.DeleteAt,
		po.AuditID,
		po.AuditMsg,
		po.CurrentVersion,
		po.AlterUID,
		po.AlterName,
		po.AlterAt,
		po.PreID,
		po.NextID,
		po.AlterAuditMsg,
		po.LabelIds,
	).Error
}

// 插入信息资源目录来源信息
func (repo *infoResourceCatalogRepo) insertInfoResourceCatalogSourceInfo(tx *gorm.DB, po *domain.InfoResourceCatalogSourceInfoPO) (err error) {
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_info_resource_catalog_source_info (
		f_id,
		f_business_form_id,
		f_business_form_name,
		f_department_id,
		f_department_name
	) VALUES (?,?,?,?,?);`
	return Exec(tx, sqlStr,
		po.ID,
		po.BusinessFormID,
		po.BusinessFormName,
		po.DepartmentID,
		po.DepartmentName,
	).Error
}

// 插入信息资源目录关联项（由于达梦不允许自增列插入0值，所以这里插入语句不包含自增主键）
func (repo *infoResourceCatalogRepo) insertInfoResourceCatalogRelatedItems(tx *gorm.DB, po []*domain.InfoResourceCatalogRelatedItemPO) (err error) {
	// [构建SQL语句]
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_info_resource_catalog_related_item (
		f_info_resource_catalog_id,
		f_related_item_id,
		f_related_item_name,
		f_related_item_data_type,
		f_relation_type
	) VALUES [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(5, len(po)),
	}) // [/]
	// [生成参数列表]
	poToFields := func(x *domain.InfoResourceCatalogRelatedItemPO) []any {
		return []any{
			x.InfoResourceCatalogID,
			x.RelatedItemID,
			x.RelatedItemName,
			x.RelatedItemDataType,
			x.RelationType,
		}
	}
	values, err := buildParamValues(poToFields, po)
	if err != nil {
		return
	} // [/]
	return Exec(tx, sqlStr, values...).Error
}

// 插入信息资源目录类目节点（由于达梦不允许自增列插入0值，所以这里插入语句不包含自增主键）
func (repo *infoResourceCatalogRepo) insertInfoResourceCatalogCategoryNodes(tx *gorm.DB, po []*domain.InfoResourceCatalogCategoryNodePO) (err error) {
	// [构建SQL语句]
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_info_resource_catalog_category_node (
		f_info_resource_catalog_id,
		f_category_node_id,
		f_category_cate_id
	) VALUES [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(3, len(po)),
	}) // [/]
	// [生成参数列表]
	poToFields := func(x *domain.InfoResourceCatalogCategoryNodePO) []any {
		return []any{
			x.InfoResourceCatalogID,
			x.CategoryNodeID,
			x.CategoryCateID,
		}
	}
	values, err := buildParamValues(poToFields, po)
	if err != nil {
		return
	} // [/]
	return Exec(tx, sqlStr, values...).Error
}

// 插入业务场景（由于达梦不允许自增列插入0值，所以这里插入语句不包含自增主键）
func (repo *infoResourceCatalogRepo) insertInfoResourceCatalogBusinessScenes(tx *gorm.DB, po []*domain.BusinessScenePO) (err error) {
	// [构建SQL语句]
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_business_scene (
		f_type,
		f_value,
		f_info_resource_catalog_id,
		f_related_type
	) VALUES [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(4, len(po)),
	}) // [/]
	// [生成参数列表]
	poToFields := func(x *domain.BusinessScenePO) []any {
		return []any{
			x.Type,
			x.Value,
			x.InfoResourceCatalogID,
			x.RelatedType,
		}
	}
	values, err := buildParamValues(poToFields, po)
	if err != nil {
		return
	} // [/]
	return Exec(tx, sqlStr, values...).Error
}

// 插入信息资源目录下属信息项
func (repo *infoResourceCatalogRepo) insertInfoResourceCatalogColumns(tx *gorm.DB, po []*domain.InfoResourceCatalogColumnPO) (err error) {
	// [构建SQL语句]
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_info_resource_catalog_column (
		f_id,
		f_name,
		f_data_type,
		f_data_length,
		f_data_range,
		f_is_sensitive,
		f_is_secret,
		f_is_incremental,
		f_is_primary_key,
		f_is_local_generated,
		f_is_standardized,
		f_info_resource_catalog_id,
		f_order,
		f_field_name_en,
		f_field_name_cn
	) VALUES [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(15, len(po)),
	}) // [/]
	// [生成参数列表]
	poToFields := func(x *domain.InfoResourceCatalogColumnPO) []any {
		return []any{
			x.ID,
			x.Name,
			x.DataType,
			x.DataLength,
			x.DataRange,
			x.IsSensitive,
			x.IsSecret,
			x.IsIncremental,
			x.IsPrimaryKey,
			x.IsLocalGenerated,
			x.IsStandardized,
			x.InfoResourceCatalogID,
			x.Order,
			x.FieldNameEN,
			x.FieldNameCN,
		}
	}
	values, err := buildParamValues(poToFields, po)
	if err != nil {
		return
	} // [/]
	return Exec(tx, sqlStr, values...).Error
}

// 插入信息资源目录下属信息项关联信息
func (repo *infoResourceCatalogRepo) insertInfoResourceCatalogColumnRelatedInfos(tx *gorm.DB, po []*domain.InfoResourceCatalogColumnRelatedInfoPO) (err error) {
	// [构建SQL语句]
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_info_resource_catalog_column_related_info (
		f_id,
		f_code_set_id,
		f_code_set_name,
		f_data_refer_id,
		f_data_refer_name
	) VALUES [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(5, len(po)),
	}) // [/]
	// [生成参数列表]
	poToFields := func(x *domain.InfoResourceCatalogColumnRelatedInfoPO) []any {
		return []any{
			x.ID,
			x.CodeSetID,
			x.CodeSetName,
			x.DataReferID,
			x.DataReferName,
		}
	}
	values, err := buildParamValues(poToFields, po)
	if err != nil {
		return
	} // [/]
	return Exec(tx, sqlStr, values...).Error
}

// 插入未编目业务表
func (repo *infoResourceCatalogRepo) insertBusinessFormNotCataloged(tx *gorm.DB, po []*domain.BusinessFormNotCatalogedPO) (err error) {
	// [构建SQL语句]
	sqlStr := /*sql*/ `INSERT INTO af_data_catalog.t_business_form_not_cataloged (
		f_id,
		f_name,
    	f_description,
        f_info_system_id,
		f_department_id,
		f_update_at,
        f_business_model_id,                                               
        f_business_domain_id
	) VALUES [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(8, len(po)),
	}) // [/]
	// [生成参数列表]
	poToFields := func(x *domain.BusinessFormNotCatalogedPO) []any {
		return []any{
			x.ID,
			x.Name,
			x.Description,
			x.InfoSystemID,
			x.DepartmentID,
			x.UpdateAt,
			x.BusinessModelID,
			x.BusinessDomainID,
		}
	}
	values, err := buildParamValues(poToFields, po)
	if err != nil {
		return
	} // [/]
	return Exec(tx, sqlStr, values...).Error
}
