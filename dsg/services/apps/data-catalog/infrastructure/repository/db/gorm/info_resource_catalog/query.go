package info_resource_catalog

import (
	"strings"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"gorm.io/gorm"
)

// 查询信息资源目录列表
func (repo *infoResourceCatalogRepo) queryInfoResourceCatalog(tx *gorm.DB, where, join, orderBy string, offset, limit int, values []any) (po []*domain.InfoResourceCatalogPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ ` SELECT DISTINCT
		c.f_id,
		c.f_name,
		c.f_code,
		c.f_data_range,
		c.f_update_cycle,
		c.f_office_business_responsibility,
		c.f_description,
		c.f_shared_type,
		c.f_shared_message,
		c.f_shared_mode,
		c.f_open_type,
		c.f_open_condition,
		c.f_publish_status,
		c.f_publish_at,
		c.f_online_status,
		c.f_online_at,
		c.f_update_at,
		c.f_delete_at,
		c.f_audit_id,
		c.f_audit_msg,
		c.f_current_version,
		c.f_alter_uid,
		c.f_alter_name,
		c.f_alter_at,
		c.f_pre_id,
		c.f_next_id,
		c.f_alter_audit_msg,
		COALESCE(c.label_ids, '') AS label_ids
	FROM af_data_catalog.t_info_resource_catalog AS c [join] [where] [orderBy] [paging];`
	paging, pagingParams := buildPagingParams(offset, limit)
	render(&sqlStr, map[string]string{
		"[join]":    join,
		"[where]":   where,
		"[orderBy]": orderBy,
		"[paging]":  paging,
	})
	values = append(values, pagingParams...)
	rows, err := Raw(tx, sqlStr, values...).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.InfoResourceCatalogPO, 0)
	for rows.Next() {
		item := new(domain.InfoResourceCatalogPO)
		err = rows.Scan(
			&item.ID,
			&item.Name,
			&item.Code,
			&item.DataRange,
			&item.UpdateCycle,
			&item.OfficeBusinessResponsibility,
			&item.Description,
			&item.SharedType,
			&item.SharedMessage,
			&item.SharedMode,
			&item.OpenType,
			&item.OpenCondition,
			&item.PublishStatus,
			&item.PublishAt,
			&item.OnlineStatus,
			&item.OnlineAt,
			&item.UpdateAt,
			&item.DeleteAt,
			&item.AuditID,
			&item.AuditMsg,
			&item.CurrentVersion,
			&item.AlterUID,
			&item.AlterName,
			&item.AlterAt,
			&item.PreID,
			&item.NextID,
			&item.AlterAuditMsg,
			&item.LabelIds,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询信息资源目录列表
func (repo *infoResourceCatalogRepo) queryInfoResourceCatalogByMultiJoins(tx *gorm.DB, where string, join []string, orderBy string, offset, limit int, values []any) (po []*domain.InfoResourceCatalogPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ ` SELECT DISTINCT
		c.f_id,
		c.f_name,
		c.f_code,
		c.f_data_range,
		c.f_update_cycle,
		c.f_office_business_responsibility,
		c.f_description,
		c.f_shared_type,
		c.f_shared_message,
		c.f_shared_mode,
		c.f_open_type,
		c.f_open_condition,
		c.f_publish_status,
		c.f_publish_at,
		c.f_online_status,
		c.f_online_at,
		c.f_update_at,
		c.f_delete_at,
		c.f_audit_id,
		c.f_audit_msg,
		c.f_current_version,
		c.f_alter_uid,
		c.f_alter_name,
		c.f_alter_at,
		c.f_pre_id,
		c.f_next_id,
		c.f_alter_audit_msg,
		COALESCE(c.label_ids, '') AS label_ids
	FROM af_data_catalog.t_info_resource_catalog AS c [join] [where] [orderBy] [paging];`
	paging, pagingParams := buildPagingParams(offset, limit)
	render(&sqlStr, map[string]string{
		"[join]":    strings.Join(join, " "),
		"[where]":   where,
		"[orderBy]": orderBy,
		"[paging]":  paging,
	})
	values = append(values, pagingParams...)
	rows, err := Raw(tx, sqlStr, values...).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.InfoResourceCatalogPO, 0)
	for rows.Next() {
		item := new(domain.InfoResourceCatalogPO)
		err = rows.Scan(
			&item.ID,
			&item.Name,
			&item.Code,
			&item.DataRange,
			&item.UpdateCycle,
			&item.OfficeBusinessResponsibility,
			&item.Description,
			&item.SharedType,
			&item.SharedMessage,
			&item.SharedMode,
			&item.OpenType,
			&item.OpenCondition,
			&item.PublishStatus,
			&item.PublishAt,
			&item.OnlineStatus,
			&item.OnlineAt,
			&item.UpdateAt,
			&item.DeleteAt,
			&item.AuditID,
			&item.AuditMsg,
			&item.CurrentVersion,
			&item.AlterUID,
			&item.AlterName,
			&item.AlterAt,
			&item.PreID,
			&item.NextID,
			&item.AlterAuditMsg,
			&item.LabelIds,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询信息资源目录关联项
func (repo *infoResourceCatalogRepo) queryInfoResourceCatalogRelatedItems(tx *gorm.DB, where string, offset, limit int, values []any) (po []*domain.InfoResourceCatalogRelatedItemPO, err error) {
	// [组装分页参数]
	paging, pagingParams := buildPagingParams(offset, limit)
	values = append(values, pagingParams...) // [/]
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
		f_id,
		f_info_resource_catalog_id,
		f_related_item_id,
		f_related_item_name,
		f_related_item_data_type,
		f_relation_type
	FROM af_data_catalog.t_info_resource_catalog_related_item [where] [paging];`
	render(&sqlStr, map[string]string{
		"[where]":  where,
		"[paging]": paging,
	})
	rows, err := Raw(tx, sqlStr, values...).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.InfoResourceCatalogRelatedItemPO, 0)
	for rows.Next() {
		item := new(domain.InfoResourceCatalogRelatedItemPO)
		err = rows.Scan(
			&item.ID,
			&item.InfoResourceCatalogID,
			&item.RelatedItemID,
			&item.RelatedItemName,
			&item.RelatedItemDataType,
			&item.RelationType,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询未编目业务表
func (repo *infoResourceCatalogRepo) queryBusinessFormNotCataloged(tx *gorm.DB, where, orderBy string, offset, limit int, values []any) (po []*domain.BusinessFormNotCatalogedPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
		f_id,
		f_name,
		f_description,
		f_info_system_id,
		f_department_id,
		f_business_domain_id,
		f_update_at
	FROM af_data_catalog.t_business_form_not_cataloged [where] [orderBy] [paging];`
	paging, pagingParams := buildPagingParams(offset, limit)
	render(&sqlStr, map[string]string{
		"[where]":   where,
		"[orderBy]": orderBy,
		"[paging]":  paging,
	})
	values = append(values, pagingParams...)
	rows, err := Raw(tx, sqlStr, values...).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.BusinessFormNotCatalogedPO, 0)
	for rows.Next() {
		item := new(domain.BusinessFormNotCatalogedPO)
		err = rows.Scan(
			&item.ID,
			&item.Name,
			&item.Description,
			&item.InfoSystemID,
			&item.DepartmentID,
			&item.BusinessDomainID,
			&item.UpdateAt,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询信息项
func (repo *infoResourceCatalogRepo) queryInfoResourceCatalogColumns(tx *gorm.DB, where string, offset, limit int, values []any) (po []*domain.InfoResourceCatalogColumnPO, err error) {
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
	FROM af_data_catalog.t_info_resource_catalog_column [where] [paging];`
	paging, pagingParams := buildPagingParams(offset, limit)
	render(&sqlStr, map[string]string{
		"[where]":  where,
		"[paging]": paging,
	})
	values = append(values, pagingParams...)
	rows, err := Raw(tx, sqlStr, values...).Rows()
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

// 查询信息项关联信息
func (repo *infoResourceCatalogRepo) queryInfoResourceCatalogColumnRelatedInfo(tx *gorm.DB, where string, offset, limit int, values []any) (po []*domain.InfoResourceCatalogColumnRelatedInfoPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
		f_id,
		f_data_refer_id,
		f_data_refer_name,
		f_code_set_id,
		f_code_set_name
	FROM af_data_catalog.t_info_resource_catalog_column_related_info [where] [paging];`
	paging, pagingParams := buildPagingParams(offset, limit)
	render(&sqlStr, map[string]string{
		"[where]":  where,
		"[paging]": paging,
	})
	values = append(values, pagingParams...)
	rows, err := Raw(tx, sqlStr, values...).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.InfoResourceCatalogColumnRelatedInfoPO, 0)
	for rows.Next() {
		item := new(domain.InfoResourceCatalogColumnRelatedInfoPO)
		err = rows.Scan(
			&item.ID,
			&item.DataReferID,
			&item.DataReferName,
			&item.CodeSetID,
			&item.CodeSetName,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询信息资源目录来源信息
func (repo *infoResourceCatalogRepo) queryInfoResourceCatalogSourceInfo(tx *gorm.DB, where string, values []any) (po []*domain.InfoResourceCatalogSourceInfoPO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT 
		f_id,
		f_business_form_id,
		f_business_form_name,
		f_department_id,
		f_department_name
	FROM af_data_catalog.t_info_resource_catalog_source_info [where];`
	render(&sqlStr, map[string]string{
		"[where]": where,
	})
	rows, err := Raw(tx, sqlStr, values...).Rows()
	if err != nil {
		return
	}
	defer rows.Close() // [/]
	// [解析查询结果]
	po = make([]*domain.InfoResourceCatalogSourceInfoPO, 0)
	for rows.Next() {
		item := new(domain.InfoResourceCatalogSourceInfoPO)
		err = rows.Scan(
			&item.ID,
			&item.BusinessFormID,
			&item.BusinessFormName,
			&item.DepartmentID,
			&item.DepartmentName,
		)
		if err != nil {
			return
		}
		po = append(po, item)
	}
	err = rows.Err() // [/]
	return
}

// 查询信息资源目录关联类目节点
func (repo *infoResourceCatalogRepo) queryInfoResourceCatalogCategoryNodes(tx *gorm.DB, where string, values []any) (po []*domain.InfoResourceCatalogCategoryNodePO, err error) {
	// [执行SQL查询]
	sqlStr := /*sql*/ `SELECT
		f_id,
		f_category_node_id,
		f_category_cate_id,
		f_info_resource_catalog_id
	FROM af_data_catalog.t_info_resource_catalog_category_node [where];`
	render(&sqlStr, map[string]string{
		"[where]": where,
	})
	rows, err := Raw(tx, sqlStr, values...).Rows()
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
