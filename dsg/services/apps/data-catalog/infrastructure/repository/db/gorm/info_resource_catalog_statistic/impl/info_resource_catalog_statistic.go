package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/info_resource_catalog_statistic"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) info_resource_catalog_statistic.Repo {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}

const (
	catalogStatisticsSQL = `
	SELECT 
		COALESCE(SUM(1),0) AS total_num, 
		COALESCE(SUM(CASE WHEN f_publish_status IN (0,1,3) THEN 1 ELSE 0 END),0) AS unpublish_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) THEN 1 ELSE 0 END),0) AS publish_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (0,1,3,5,7,8) THEN 1 ELSE 0 END),0) AS notonline_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (2,4,6) THEN 1 ELSE 0 END),0) AS online_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (5,7,8) THEN 1 ELSE 0 END),0) AS offline_num,

		COALESCE(SUM(CASE WHEN f_publish_status = 1 THEN 1 ELSE 0 END),0) AS publish_auditing_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) THEN 1 ELSE 0 END),0) AS publish_pass_num,
		COALESCE(SUM(CASE WHEN f_publish_status = 3 THEN 1 ELSE 0 END),0) AS publish_reject_num,
		
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (1,7) THEN 1 ELSE 0 END),0) AS online_auditing_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (2,4,6) THEN 1 ELSE 0 END),0) AS online_pass_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (3,8) THEN 1 ELSE 0 END),0) AS online_reject_num,
		
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status = 4 THEN 1 ELSE 0 END),0) AS offline_auditing_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status IN (5,7,8) THEN 1 ELSE 0 END),0) AS offline_pass_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_online_status = 6 THEN 1 ELSE 0 END),0) AS offline_reject_num 
	FROM t_info_resource_catalog 
	WHERE f_current_version = TRUE AND f_delete_at = 0;
	`
	uncatalogedBusiFormNumSQL = `SELECT COUNT(1) AS uncataloged_num FROM t_business_form_not_cataloged;`
	catalogedBusiFormNumSQL   = `
	SELECT 
		COALESCE(SUM(1),0) AS cataloged_num, 
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) THEN 1 ELSE 0 END),0) AS publish_num
	FROM t_info_resource_catalog 
	WHERE f_current_version = TRUE AND f_delete_at = 0;
	`
	businessFormStatisticsSQL = `
	SELECT 
		r.department_id AS department_id, SUM(1) AS total_num, SUM(r.publish_flag) AS publish_num, ROUND(SUM(r.publish_flag)*100/SUM(1),1) AS rate
	FROM 
		(
			(SELECT f_department_id AS department_id, 0 AS publish_flag, 0 AS catalog_flag 
			FROM t_business_form_not_cataloged 
			WHERE f_department_id IS NOT NULL AND f_department_id != '')
			UNION ALL  
			(SELECT b.department_id AS department_id, a.publish_flag AS publish_flag, a.catalog_flag AS catalog_flag
			FROM (SELECT f_id, CASE WHEN f_publish_status IN (2,4,5) THEN 1 ELSE 0 END AS publish_flag, 1 AS catalog_flag 
						FROM t_info_resource_catalog 
						WHERE f_current_version = TRUE AND f_delete_at = 0) AS a
				INNER JOIN (SELECT f_id, f_business_form_id AS business_form_id, f_department_id AS department_id 
									FROM t_info_resource_catalog_source_info 
									WHERE f_department_id IS NOT NULL AND f_department_id != '') AS b ON a.f_id = b.f_id)
		) AS r
	GROUP BY r.department_id
	HAVING rate > 0
	ORDER BY rate DESC, total_num DESC;
	`
	deptCatalogStatisticsSQL = `
	SELECT 
		b.department_id AS department_id, SUM(1) AS total_num, SUM(a.publish_flag) AS publish_num, ROUND(SUM(a.publish_flag)*100/SUM(1),1) AS rate
	FROM (SELECT f_id, CASE WHEN f_publish_status IN (2,4,5) THEN 1 ELSE 0 END AS publish_flag 
			FROM t_info_resource_catalog 
			WHERE f_current_version = TRUE AND f_delete_at = 0) AS a
		INNER JOIN (SELECT f_info_resource_catalog_id, f_category_node_id AS department_id 
						FROM t_info_resource_catalog_category_node 
						WHERE f_category_cate_id = '00000000-0000-0000-0000-000000000001') AS b ON a.f_id = b.f_info_resource_catalog_id 
	GROUP BY b.department_id
	ORDER BY rate DESC, total_num DESC;
	`
	shareStatisticsSQL = `
	SELECT 
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_shared_type = 0 THEN 1 ELSE 0 END),0) AS none_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_shared_type = 1 THEN 1 ELSE 0 END),0) AS all_num,
		COALESCE(SUM(CASE WHEN f_publish_status IN (2,4,5) AND f_shared_type = 2 THEN 1 ELSE 0 END),0) AS partial_num
	FROM t_info_resource_catalog 
	WHERE f_current_version = TRUE AND f_delete_at = 0;
	`
)

func (r *repo) GetCatalogStatistics(tx *gorm.DB, ctx context.Context) (*info_resource_catalog_statistic.CatalogStatistics, error) {
	var data info_resource_catalog_statistic.CatalogStatistics
	d := r.do(tx, ctx).Raw(catalogStatisticsSQL).Scan(&data)
	return &data, d.Error
}

func (r *repo) GetUncatalogedBusiFormNum(tx *gorm.DB, ctx context.Context) (int, error) {
	var num int
	d := r.do(tx, ctx).Raw(uncatalogedBusiFormNumSQL).Scan(&num)
	return num, d.Error
}

func (r *repo) GetCatalogedBusiFormNum(tx *gorm.DB, ctx context.Context) (*info_resource_catalog_statistic.CatalogedBusiFormInfo, error) {
	var data info_resource_catalog_statistic.CatalogedBusiFormInfo
	d := r.do(tx, ctx).Raw(catalogedBusiFormNumSQL).Scan(&data)
	return &data, d.Error
}

func (r *repo) GetBusinessFormStatistics(tx *gorm.DB, ctx context.Context) ([]*info_resource_catalog_statistic.BusinessFormStatistics, error) {
	var datas []*info_resource_catalog_statistic.BusinessFormStatistics
	d := r.do(tx, ctx).Raw(businessFormStatisticsSQL).Scan(&datas)
	return datas, d.Error
}

func (r *repo) GetDeptCatalogStatistics(tx *gorm.DB, ctx context.Context) ([]*info_resource_catalog_statistic.DeptCatalogStatistics, error) {
	var datas []*info_resource_catalog_statistic.DeptCatalogStatistics
	d := r.do(tx, ctx).Raw(deptCatalogStatisticsSQL).Scan(&datas)
	return datas, d.Error
}

func (r *repo) GetShareStatistics(tx *gorm.DB, ctx context.Context) (*info_resource_catalog_statistic.ShareStatistics, error) {
	var data info_resource_catalog_statistic.ShareStatistics
	d := r.do(tx, ctx).Raw(shareStatisticsSQL).Scan(&data)
	return &data, d.Error
}
