package info_resource_catalog

import (
	"strconv"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"gorm.io/gorm"
)

// 查询信息资源目录关联类目节点
func (repo *infoResourceCatalogRepo) selectInfoResourceCatalogCategoryNodes(tx *gorm.DB, catalogID int64) (po []*domain.InfoResourceCatalogCategoryNodePO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
		f_id,
		f_category_node_id,
		f_category_cate_id,
		f_info_resource_catalog_id
	FROM af_data_catalog.t_info_resource_catalog_category_node WHERE f_info_resource_catalog_id = ?;`
	rows, err := Raw(tx, sqlStr, strconv.FormatInt(catalogID, 10)).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.InfoResourceCatalogCategoryNodePO, 0)
	for rows.Next() {
		item := new(domain.InfoResourceCatalogCategoryNodePO)
		err = rows.Scan(
			&item.ID,
			&item.CategoryNodeID,
			&item.CategoryCateID,
			&item.InfoResourceCatalogID,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询信息资源目录下属信息项
func (repo *infoResourceCatalogRepo) selectInfoResourceCatalogColumns(tx *gorm.DB, catalogID int64) (po []*domain.InfoResourceCatalogColumnPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
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
	FROM af_data_catalog.t_info_resource_catalog_column WHERE f_info_resource_catalog_id = ?;`
	rows, err := Raw(tx, sqlStr, strconv.FormatInt(catalogID, 10)).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.InfoResourceCatalogColumnPO, 0)
	for rows.Next() {
		item := new(domain.InfoResourceCatalogColumnPO)
		err = rows.Scan(
			&item.ID,
			&item.Name,
			&item.DataType,
			&item.DataLength,
			&item.DataRange,
			&item.IsSensitive,
			&item.IsSecret,
			&item.IsIncremental,
			&item.IsPrimaryKey,
			&item.IsLocalGenerated,
			&item.IsStandardized,
			&item.InfoResourceCatalogID,
			&item.Order,
			&item.FieldNameEN,
			&item.FieldNameCN,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询信息资源目录详情
func (repo *infoResourceCatalogRepo) selectInfoResourceCatalogByID(tx *gorm.DB, id int64) (po *domain.InfoResourceCatalogPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
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
		COALESCE(label_ids, '') AS label_ids
	FROM af_data_catalog.t_info_resource_catalog WHERE f_id = ? AND f_delete_at = 0;`
	row := Raw(tx, sqlStr, strconv.FormatInt(id, 10)).Row() // [/]
	// [解析查询结果]
	po = new(domain.InfoResourceCatalogPO)
	err = row.Scan(
		&po.ID,
		&po.Name,
		&po.Code,
		&po.DataRange,
		&po.UpdateCycle,
		&po.OfficeBusinessResponsibility,
		&po.Description,
		&po.SharedType,
		&po.SharedMessage,
		&po.SharedMode,
		&po.OpenType,
		&po.OpenCondition,
		&po.PublishStatus,
		&po.PublishAt,
		&po.OnlineStatus,
		&po.OnlineAt,
		&po.UpdateAt,
		&po.DeleteAt,
		&po.AuditID,
		&po.AuditMsg,
		&po.CurrentVersion,
		&po.AlterUID,
		&po.AlterName,
		&po.AlterAt,
		&po.PreID,
		&po.NextID,
		&po.AlterAuditMsg,
		&po.LabelIds,
	) // [/]
	return
}

// 查询信息资源目录来源信息
func (repo *infoResourceCatalogRepo) selectInfoResourceCatalogSourceInfoByID(tx *gorm.DB, id int64) (po *domain.InfoResourceCatalogSourceInfoPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
		f_id,
		f_business_form_id,
		f_business_form_name,
		f_department_id,
		f_department_name
	FROM af_data_catalog.t_info_resource_catalog_source_info WHERE f_id = ?;`
	row := Raw(tx, sqlStr, strconv.FormatInt(id, 10)).Row() // [/]
	// [解析查询结果]
	po = new(domain.InfoResourceCatalogSourceInfoPO)
	err = row.Scan(
		&po.ID,
		&po.BusinessFormID,
		&po.BusinessFormName,
		&po.DepartmentID,
		&po.DepartmentName,
	) // [/]
	return
}

// 查询信息资源目录来源/关联业务场景
func (repo *infoResourceCatalogRepo) selectInfoResourceCatalogBusinessScenes(tx *gorm.DB, catalogID int64) (po []*domain.BusinessScenePO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
		f_id,
		f_type,
		f_value,
		f_related_type,
		f_info_resource_catalog_id
	FROM af_data_catalog.t_business_scene WHERE f_info_resource_catalog_id = ?;`
	rows, err := Raw(tx, sqlStr, strconv.FormatInt(catalogID, 10)).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.BusinessScenePO, 0)
	for rows.Next() {
		item := new(domain.BusinessScenePO)
		err = rows.Scan(
			&item.ID,
			&item.Type,
			&item.Value,
			&item.RelatedType,
			&item.InfoResourceCatalogID,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}
