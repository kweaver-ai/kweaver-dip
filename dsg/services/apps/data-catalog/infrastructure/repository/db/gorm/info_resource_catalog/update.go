package info_resource_catalog

import (
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"gorm.io/gorm"
)

// 更新信息资源目录
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalog(tx *gorm.DB, po *domain.InfoResourceCatalogPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog SET
		f_name = ?,
		f_data_range = ?,
		f_update_cycle = ?,
		f_office_business_responsibility = ?,
		f_description = ?,
		f_shared_type = ?,
		f_shared_message = ?,
		f_shared_mode = ?,
		f_open_type = ?,
		f_open_condition = ?,
		f_publish_status = ?,
		f_update_at = ?,
		f_audit_id = ?,
		f_current_version = ?,
		f_alter_uid = ?,
		f_alter_name = ?,
		f_alter_at = ?,
		f_pre_id = ?,
		f_next_id = ?,
		f_alter_audit_msg = ?,
		label_ids = ?
	WHERE f_id = ?;`
	return Exec(tx, sqlStr,
		po.Name,
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
		po.UpdateAt,
		po.AuditID,
		po.CurrentVersion,
		po.AlterUID,
		po.AlterName,
		po.AlterAt,
		po.PreID,
		po.NextID,
		po.AlterAuditMsg,
		po.LabelIds,
		po.ID,
	).Error
}

// 更新信息资源目录（审核场景，防止审核意见覆盖）
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogForAudit(tx *gorm.DB, po *domain.InfoResourceCatalogPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog SET
		f_name = ?,
		f_data_range = ?,
		f_update_cycle = ?,
		f_office_business_responsibility = ?,
		f_description = ?,
		f_shared_type = ?,
		f_shared_message = ?,
		f_shared_mode = ?,
		f_open_type = ?,
		f_open_condition = ?,
		f_publish_status = ?,
		f_update_at = ?,
		f_audit_id = ?,
		f_current_version = ?,
		f_alter_uid = ?,
		f_alter_name = ?,
		f_alter_at = ?,
		f_pre_id = ?,
		f_next_id = ?
	WHERE f_id = ?;`
	return Exec(tx, sqlStr,
		po.Name,
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
		po.UpdateAt,
		po.AuditID,
		po.CurrentVersion,
		po.AlterUID,
		po.AlterName,
		po.AlterAt,
		po.PreID,
		po.NextID,
		po.ID,
	).Error
}

// 更新信息资源目录关联项
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogRelatedItem(tx *gorm.DB, po *domain.InfoResourceCatalogRelatedItemPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog_related_item SET
		f_related_item_name = ?,
		f_related_item_data_type = ?
	WHERE f_id = ?;`
	return Exec(tx, sqlStr,
		po.RelatedItemName,
		po.RelatedItemDataType,
		po.ID,
	).Error
}

// 批量更新信息资源目录关联项名称
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogRelatedItemNames(tx *gorm.DB, po *domain.InfoResourceCatalogRelatedItemPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog_related_item SET
		f_related_item_name = ?,
		f_related_item_data_type = ?
	WHERE f_related_item_id = ? AND f_relation_type = ?;`
	return Exec(tx, sqlStr,
		po.RelatedItemName,
		po.RelatedItemDataType,
		po.RelatedItemID,
		po.RelationType,
	).Error
}

// 更新信息资源目录下属信息项
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogColumn(tx *gorm.DB, po *domain.InfoResourceCatalogColumnPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog_column SET
		f_name = ?,
		f_data_type = ?,
		f_data_length = ?,
		f_data_range = ?,
		f_is_sensitive = ?,
		f_is_secret = ?,
		f_is_incremental = ?,
		f_is_primary_key = ?,
		f_is_local_generated = ?,
		f_is_standardized = ?,
		f_order = ?,
		f_field_name_en = ?,
		f_field_name_cn = ?
	WHERE f_id = ?;`
	return Exec(tx, sqlStr,
		po.Name,
		po.DataType,
		po.DataLength,
		po.DataRange,
		po.IsSensitive,
		po.IsSecret,
		po.IsIncremental,
		po.IsPrimaryKey,
		po.IsLocalGenerated,
		po.IsStandardized,
		po.Order,
		po.FieldNameEN,
		po.FieldNameCN,
		po.ID,
	).Error
}

// 更新信息资源目录指定字段
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogFields(tx *gorm.DB, po *domain.InfoResourceCatalogPO, fields []string) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog SET [fields] WHERE f_id = ?;`
	template, values := buildSetParams(po, fields)
	render(&sqlStr, map[string]string{
		"[fields]": template,
	})
	values = append(values, po.ID)
	return Exec(tx, sqlStr, values...).Error
}

// 更新信息资源目录来源部门名称
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogSourceDepartmentNames(tx *gorm.DB, po *domain.InfoResourceCatalogSourceInfoPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog_source_info SET
		f_department_name = ?
	WHERE f_department_id = ?;`
	return Exec(tx, sqlStr,
		po.DepartmentName,
		po.DepartmentID,
	).Error
}

// 更新信息资源目录下属信息项关联代码集名称
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogColumnRelatedCodeSetNames(tx *gorm.DB, po *domain.InfoResourceCatalogColumnRelatedInfoPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog_column_related_info SET
		f_code_set_name = ?
	WHERE f_code_set_id = ?;`
	return Exec(tx, sqlStr,
		po.CodeSetName,
		po.CodeSetID,
	).Error
}

// 更新信息资源目录下属信息项关联数据元名称
func (repo *infoResourceCatalogRepo) updateInfoResourceCatalogColumnRelatedDataReferNames(tx *gorm.DB, po *domain.InfoResourceCatalogColumnRelatedInfoPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog_column_related_info SET
		f_data_refer_name = ?
	WHERE f_data_refer_id = ?;`
	return Exec(tx, sqlStr,
		po.DataReferName,
		po.DataReferID,
	).Error
}

// 批量更新匹配查询条件的信息资源目录指定字段
func (repo *infoResourceCatalogRepo) batchUpdateInfoResourceCatalog(tx *gorm.DB, where string, values []any, updates map[string]any) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog SET [fields] [where];`
	template, params := buildSetParamsFromMap(&domain.InfoResourceCatalog{}, updates)
	render(&sqlStr, map[string]string{
		"[fields]": template,
		"[where]":  where,
	})
	values = append(params, values...)
	return Exec(tx, sqlStr, values...).Error
}

// 更新未编目业务表
func (repo *infoResourceCatalogRepo) updateBusinessFormNotCataloged(tx *gorm.DB, po *domain.BusinessFormNotCatalogedPO) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_business_form_not_cataloged SET
		f_name = ?,
		f_description = ?,
		f_info_system_id = ?,
		f_department_id = ?,
		f_business_domain_id = ?,
		f_business_model_id = ?,
		f_update_at = ?
	WHERE f_id = ?;`
	return Exec(tx, sqlStr,
		po.Name,
		po.Description,
		po.InfoSystemID,
		po.DepartmentID,
		po.BusinessDomainID,
		po.BusinessModelID,
		po.UpdateAt,
		po.ID,
	).Error
}
