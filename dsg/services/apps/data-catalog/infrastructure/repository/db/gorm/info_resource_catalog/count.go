package info_resource_catalog

import (
	"strings"

	"gorm.io/gorm"
)

// 计数信息资源目录
func (repo *infoResourceCatalogRepo) countInfoResourceCatalog(tx *gorm.DB, where, join string, values []any) (count int, err error) {
	sqlStr := /*sql*/ `SELECT COUNT(DISTINCT(c.f_id)) FROM af_data_catalog.t_info_resource_catalog AS c [join] [where];`
	render(&sqlStr, map[string]string{
		"[where]": where,
		"[join]":  join,
	})
	err = Raw(tx, sqlStr, values...).Scan(&count).Error
	return
}

func (repo *infoResourceCatalogRepo) countInfoResourceCatalogByMultiJoins(tx *gorm.DB, where string, join []string, values []any) (count int, err error) {
	sqlStr := /*sql*/ `SELECT COUNT(DISTINCT(c.f_id)) FROM af_data_catalog.t_info_resource_catalog AS c [join] [where];`
	render(&sqlStr, map[string]string{
		"[where]": where,
		"[join]":  strings.Join(join, " "),
	})
	err = Raw(tx, sqlStr, values...).Scan(&count).Error
	return
}

// 计数未编目业务表
func (repo *infoResourceCatalogRepo) countBusinessFormNotCataloged(tx *gorm.DB, where string, values []any) (count int, err error) {
	sqlStr := /*sql*/ `SELECT COUNT(*) FROM af_data_catalog.t_business_form_not_cataloged [where];`
	render(&sqlStr, map[string]string{
		"[where]": where,
	})
	err = Raw(tx, sqlStr, values...).Scan(&count).Error
	return
}

// 计数信息资源目录关联项
func (repo *infoResourceCatalogRepo) countInfoResourceCatalogRelatedItems(tx *gorm.DB, where string, values []any) (count int, err error) {
	sqlStr := /*sql*/ `SELECT COUNT(*) FROM af_data_catalog.t_info_resource_catalog_related_item [where];`
	render(&sqlStr, map[string]string{
		"[where]": where,
	})
	err = Raw(tx, sqlStr, values...).Scan(&count).Error
	return
}

// 计数信息项
func (repo *infoResourceCatalogRepo) countInfoResourceCatalogColumns(tx *gorm.DB, where string, values []any) (count int, err error) {
	sqlStr := /*sql*/ `SELECT COUNT(*) FROM af_data_catalog.t_info_resource_catalog_column [where];`
	render(&sqlStr, map[string]string{
		"[where]": where,
	})
	err = Raw(tx, sqlStr, values...).Scan(&count).Error
	return
}
