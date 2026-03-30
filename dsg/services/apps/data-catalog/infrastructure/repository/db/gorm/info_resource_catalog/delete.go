package info_resource_catalog

import (
	"time"

	"gorm.io/gorm"
)

// 删除指定信息资源目录关联项
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogRelatedItems(tx *gorm.DB, ids []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_related_item WHERE f_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(ids), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(ids)...).Error
}

// 根据信息资源目录ID删除指定信息资源目录关联项
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogRelatedItemsByCatalogIDs(tx *gorm.DB, catalogIDs []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_related_item 
						WHERE f_info_resource_catalog_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(catalogIDs), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(catalogIDs)...).Error
}

// 删除信息资源目录关联类目节点
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogCategoryNodes(tx *gorm.DB, ids []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_category_node WHERE f_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(ids), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(ids)...).Error
}

// 根据信息资源目录ID删除信息资源目录关联类目节点
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogCategoryNodesByCatalogIDs(tx *gorm.DB, catalogIDs []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_category_node WHERE f_info_resource_catalog_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(catalogIDs), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(catalogIDs)...).Error
}

// 删除业务场景
func (repo *infoResourceCatalogRepo) deleteBusinessScenes(tx *gorm.DB, catalogID int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_business_scene WHERE f_info_resource_catalog_id = ?;`
	return Exec(tx, sqlStr, catalogID).Error
}

// 删除业务场景
func (repo *infoResourceCatalogRepo) deleteBusinessScenesByCatalogIDs(tx *gorm.DB, catalogIDs []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_business_scene WHERE f_info_resource_catalog_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(catalogIDs), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(catalogIDs)...).Error
}

// 删除信息资源目录下属信息项
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogColumns(tx *gorm.DB, ids []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_column WHERE f_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(ids), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(ids)...).Error
}

// 根据信息资源目录ID删除信息资源目录下属信息项
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogColumnsByCatalogIDs(tx *gorm.DB, catalogIDs []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_column WHERE f_info_resource_catalog_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(catalogIDs), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(catalogIDs)...).Error
}

// 删除信息项关联信息
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogColumnRelatedInfos(tx *gorm.DB, ids []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_column_related_info WHERE f_id IN [values];`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(ids), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(ids)...).Error
}

// 根据信息资源目录ID删除信息项关联信息
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogColumnRelatedInfosByCatalogIDs(tx *gorm.DB, catalogIDs []int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_column_related_info 
						WHERE f_id IN (SELECT f_id FROM af_data_catalog.t_info_resource_catalog_column 
										WHERE f_info_resource_catalog_id IN [values]);`
	render(&sqlStr, map[string]string{
		"[values]": buildPlaceholders(len(catalogIDs), 1),
	})
	return Exec(tx, sqlStr, idsToParamValues(catalogIDs)...).Error
}

// 删除指定信息资源目录，采用软删除
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalog(tx *gorm.DB, id int64) (err error) {
	sqlStr := /*sql*/ `UPDATE af_data_catalog.t_info_resource_catalog SET f_delete_at = ? WHERE f_id = ?;`
	return Exec(tx, sqlStr, time.Now().UnixMilli(), id).Error
}

// 删除指定信息资源目录变更版本
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogForAlter(tx *gorm.DB, id int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog WHERE f_id = ? AND f_current_version = false;`
	return Exec(tx, sqlStr, id).Error
}

// 删除指定未编目业务表
func (repo *infoResourceCatalogRepo) deleteBusinessFormNotCataloged(tx *gorm.DB, id string) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_business_form_not_cataloged WHERE f_id = ?;`
	return Exec(tx, sqlStr, id).Error
}

// 删除指定信息资源目录来源信息
func (repo *infoResourceCatalogRepo) deleteInfoResourceCatalogSourceInfo(tx *gorm.DB, id int64) (err error) {
	sqlStr := /*sql*/ `DELETE FROM af_data_catalog.t_info_resource_catalog_source_info WHERE f_id = ?;`
	return Exec(tx, sqlStr, id).Error
}

// 根据业务模型删除未编目的业务表
func (repo *infoResourceCatalogRepo) deleteBusinessFormNotCatalogedByBusinessModel(tx *gorm.DB, modelID string) (err error) {
	sqlStr := `DELETE FROM af_data_catalog.t_business_form_not_cataloged WHERE f_business_model_id = ?;`
	return Exec(tx, sqlStr, modelID).Error
}
