package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/my_favorite"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) my_favorite.Repo {
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

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.TMyFavorite) error {
	return r.do(tx, ctx).
		Model(&model.TMyFavorite{}).
		Create(m).
		Error
}

func (r *repo) Delete(tx *gorm.DB, ctx context.Context, uid string, id uint64) (bool, error) {
	mf := &model.TMyFavorite{}
	d := r.do(tx, ctx).
		Model(mf).
		Where("id = ? AND created_by = ?", id, uid).
		Delete(mf)
	return d.RowsAffected > 0, d.Error
}

const (
	dataCatalogListSQL = `
	SELECT 
		a.id AS id, a.res_id AS res_id, a.res_type as res_type, 
		a.created_at AS created_at, b.code AS res_code, 
		b.title AS res_name 
	FROM 
		(SELECT id, res_id, res_type, created_at  
			FROM t_my_favorite 
			WHERE %s) AS a 
	INNER JOIN 
		(SELECT id, code, title  
			FROM t_data_catalog 
			WHERE id IN (SELECT DISTINCT res_id 
						FROM t_my_favorite 
						WHERE %s) AND %s) AS b 
	ON a.res_id = b.id 
	%s 
	%s 
	%s`
	infoCatalogListSQL = `
	SELECT 
		a.id AS id, a.res_id AS res_id, a.res_type as res_type, 
		a.created_at AS created_at, b.code AS res_code, 
		b.title AS res_name 
	FROM 
		(SELECT id, res_id, res_type, created_at  
			FROM t_my_favorite 
			WHERE %s) AS a 
	INNER JOIN 
		(SELECT f_id AS id, f_code AS code, f_name AS title   
			FROM t_info_resource_catalog 
			WHERE f_id IN (SELECT DISTINCT res_id 
						FROM t_my_favorite 
						WHERE %s) AND %s) AS b 
	ON a.res_id = b.id 
	%s 
	%s 
	%s`
	elecCatalogListSQL = `
	SELECT 
		a.id AS id, a.res_id AS res_id, a.res_type as res_type, 
		a.created_at AS created_at, b.code AS res_code, 
		b.title AS res_name 
	FROM 
		(SELECT id, res_id, res_type, created_at  
			FROM t_my_favorite 
			WHERE %s) AS a 
	INNER JOIN 
		(SELECT elec_licence_id AS id, licence_basic_code AS code, licence_name AS title 
			FROM elec_licence 
			WHERE elec_licence_id IN (SELECT DISTINCT res_id 
						FROM t_my_favorite 
						WHERE %s) AND %s) AS b 
	ON a.res_id = b.id 
	%s 
	%s 
	%s`
	dataViewListSQL = `
	SELECT 
		a.id AS id, a.res_id AS res_id, a.res_type as res_type, 
		a.created_at AS created_at, b.code AS res_code, 
		b.title AS res_name 
	FROM 
		(SELECT id, res_id, res_type, created_at  
			FROM t_my_favorite 
			WHERE %s) AS a 
	INNER JOIN 
		(SELECT  id, uniform_catalog_code AS code, business_name AS title,datasource_id,type
			FROM af_main.form_view 
			WHERE id COLLATE utf8mb4_unicode_ci IN (SELECT DISTINCT res_id COLLATE utf8mb4_unicode_ci
						FROM t_my_favorite 
						WHERE %s) AND %s) AS b 
	ON a.res_id COLLATE utf8mb4_unicode_ci = b.id COLLATE utf8mb4_unicode_ci

	%s 
	%s 
	%s`
	interfaceSvcListSQL = `
	SELECT 
		a.id AS id, a.res_id AS res_id, a.res_type as res_type, 
		a.created_at AS created_at, b.code AS res_code, 
		b.title AS res_name
	FROM 
		(SELECT id, res_id, res_type, created_at  
			FROM t_my_favorite 
			WHERE %s) AS a 
	INNER JOIN 
		(SELECT service_id as id, service_code AS code, service_name AS title
			FROM (
				SELECT service_id, service_code, service_name
				FROM data_application_service.service
				GROUP BY service_id
			) AS distinct_service 
			WHERE service_id IN (SELECT DISTINCT res_id COLLATE utf8mb4_unicode_ci
						FROM t_my_favorite 
						WHERE %s) AND %s) AS b 
	ON a.res_id COLLATE utf8mb4_unicode_ci = b.id COLLATE utf8mb4_unicode_ci
	%s 
	%s 
	%s`

	// indicatorListSQL = `
	// SELECT
	// 	a.id AS id, a.res_id AS res_id, a.res_type as res_type,
	// 	a.created_at AS created_at, b.code AS res_code,
	// 	b.title AS res_name
	// FROM
	// 	(SELECT id, res_id, res_type, created_at
	// 		FROM t_my_favorite
	// 		WHERE %s) AS a
	// INNER JOIN
	// 	(SELECT  id as id, code AS code, name AS title
	// 		FROM af_data_model.t_technical_indicator
	// 		WHERE id  IN (SELECT DISTINCT res_id COLLATE utf8mb4_unicode_ci
	// 					FROM t_my_favorite
	// 					WHERE %s) AND %s) AS b
	// ON a.res_id = b.id
	// %s
	// %s
	// %s`
	order = `ORDER BY created_at DESC`
)

// buildSQL 构建SQL查询，避免使用fmt.Sprintf导致的格式化冲突
func buildSQL(template, fOption1, fOption2, cOption, order, limit string) string {
	// 完全避免使用fmt.Sprintf，使用字符串替换
	result := template
	// 按顺序替换每个%s占位符
	parts := strings.Split(result, "%s")
	if len(parts) != 6 {
		// 如果分割后不是6部分，说明%s数量不对，添加调试信息
		fmt.Printf("buildSQL error: expected 6 parts, got %d\n", len(parts))
		fmt.Printf("template: %s\n", template)
		return template
	}
	// 重新组装SQL
	result = parts[0] + fOption1 + parts[1] + fOption2 + parts[2] + cOption + parts[3] + order + parts[4] + limit + parts[5]
	// 添加调试信息
	if result == "" {
		fmt.Printf("buildSQL warning: result is empty\n")
		fmt.Printf("parts[0]: '%s'\n", parts[0])
		fmt.Printf("fOption1: '%s'\n", fOption1)
		fmt.Printf("parts[1]: '%s'\n", parts[1])
		fmt.Printf("fOption2: '%s'\n", fOption2)
		fmt.Printf("parts[2]: '%s'\n", parts[2])
		fmt.Printf("cOption: '%s'\n", cOption)
		fmt.Printf("parts[3]: '%s'\n", parts[3])
		fmt.Printf("order: '%s'\n", order)
		fmt.Printf("parts[4]: '%s'\n", parts[4])
		fmt.Printf("limit: '%s'\n", limit)
		fmt.Printf("parts[5]: '%s'\n", parts[5])
	}
	return result
}

/*
	func (r *repo) GetList(tx *gorm.DB, ctx context.Context, resType my_favorite.ResType, uid string, params map[string]any) (int64, []*my_favorite.FavorDetail, error) {
		var (
			err        error
			totalCount int64
			datas      []*my_favorite.FavorDetail
			listSQL    string
		)

		fOption, cOption, limit := "1=1", "1=1", ""
		d := r.do(tx, ctx)
		if len(uid) > 0 {
			fOption += " AND created_by = '" + util.KeywordEscape(uid) + "'"
		}
		switch resType {
		case my_favorite.RES_TYPE_DATA_CATALOG:
			listSQL = dataCatalogListSQL
			fOption += " AND res_type = 1"
		case my_favorite.RES_TYPE_INFO_CATALOG:
			listSQL = infoCatalogListSQL
			fOption += " AND res_type = 2"
		case my_favorite.RES_TYPE_ELEC_CATALOG:
			listSQL = elecCatalogListSQL
			fOption += " AND res_type = 3"
		}
		if params != nil {
			if params["keyword"] != nil {
				kw := "%" + util.KeywordEscape(params["keyword"].(string)) + "%"
				switch resType {
				case my_favorite.RES_TYPE_DATA_CATALOG:
					cOption += " AND (code LIKE '" + kw + "' or title LIKE '" + kw + "')"
				case my_favorite.RES_TYPE_INFO_CATALOG:
					cOption += " AND (f_code LIKE '" + kw + "' or f_name LIKE '" + kw + "')"
				case my_favorite.RES_TYPE_ELEC_CATALOG:
					cOption += " AND (licence_basic_code LIKE '" + kw + "' or licence_name LIKE '" + kw + "')"
				}
			}
			// 然后设置limit用于实际查询
			if params["offset"] != nil && params["limit"] != nil {
				limit = fmt.Sprintf("LIMIT %d OFFSET %d", params["limit"].(int), (params["offset"].(int)-1)*params["limit"].(int))
			}
		}

		// 如果没有设置limit，设置默认值：每页10条，第1页
		if limit == "" {
			limit = "LIMIT 10 OFFSET 0"
		}

		// 先计算总数，此时limit为空
		countSQL := buildSQL(listSQL, fOption, fOption, cOption, order, "")
		d = d.Raw("SELECT COUNT(1) FROM (" + countSQL + ") AS c")
		err = d.Scan(&totalCount).Error
		if err != nil {
			return totalCount, datas, err
		}

		// 然后执行实际查询
		querySQL := buildSQL(listSQL, fOption, fOption, cOption, order, limit)
		d = d.Raw(querySQL).Scan(&datas)
		err = d.Error
		return totalCount, datas, err
	}
*/
func (r *repo) GetList(tx *gorm.DB, ctx context.Context, resType my_favorite.ResType, uid string, params map[string]any) (int64, []*my_favorite.FavorDetail, error) {
	var (
		err                 error
		totalCount          int64
		datas               []*my_favorite.FavorDetail
		listSQL             string
		departmentCondition = ""
		orderClause         = " ORDER BY res_name DESC " // 默认排序
	)

	fOption, cOption, limit := "1=1", "1=1", ""
	d := r.do(tx, ctx)
	if len(uid) > 0 {
		fOption += fmt.Sprintf(" AND created_by = '%s'", util.KeywordEscape(uid))
	}

	// 处理排序参数
	if params != nil {
		if params["sort"] != nil && params["direction"] != nil {
			sortField := params["sort"].(string)
			direction := params["direction"].(string)

			// 验证排序方向
			if direction != "asc" && direction != "desc" {
				direction = "desc" // 默认降序
			}

			// 根据资源类型和排序字段构建排序语句
			orderClause = r.buildOrderClause(resType, sortField, direction)
		}
	}

	switch resType {
	case my_favorite.RES_TYPE_DATA_CATALOG:
		listSQL = dataCatalogListSQL
		fOption += " AND res_type = 1"
	case my_favorite.RES_TYPE_INFO_CATALOG:
		listSQL = infoCatalogListSQL
		fOption += " AND res_type = 2"
	case my_favorite.RES_TYPE_ELEC_CATALOG:
		listSQL = elecCatalogListSQL
		fOption += " AND res_type = 3"
	case my_favorite.RES_TYPE_DATA_VIEW:
		listSQL = dataViewListSQL
		fOption += " AND res_type = 4"
	case my_favorite.RES_TYPE_INTERFACE_SVC:
		listSQL = interfaceSvcListSQL
		fOption += " AND res_type = 5"
		// case my_favorite.RES_TYPE_INDICATOR:
		// 	listSQL = indicatorListSQL
		// 	fOption += " AND res_type = 6"
	}

	if params != nil {
		if params["keyword"] != nil {
			kw := "%" + util.KeywordEscape(params["keyword"].(string)) + "%"
			switch resType {
			case my_favorite.RES_TYPE_DATA_CATALOG:
				cOption += fmt.Sprintf(" AND (code LIKE '%s' or title LIKE '%s')", kw, kw)
			case my_favorite.RES_TYPE_INFO_CATALOG:
				cOption += fmt.Sprintf(" AND (f_code LIKE '%s' or f_name LIKE '%s')", kw, kw)
			case my_favorite.RES_TYPE_ELEC_CATALOG:
				cOption += fmt.Sprintf(" AND (licence_basic_code LIKE '%s' or licence_name LIKE '%s')", kw, kw)
			case my_favorite.RES_TYPE_DATA_VIEW:
				cOption += fmt.Sprintf(" AND (uniform_catalog_code LIKE '%s' or business_name LIKE '%s')", kw, kw)
			case my_favorite.RES_TYPE_INTERFACE_SVC:
				cOption += fmt.Sprintf(" AND (service_code LIKE '%s' or service_name LIKE '%s')", kw, kw)
			case my_favorite.RES_TYPE_INDICATOR:
				cOption += fmt.Sprintf(" AND (code LIKE '%s' or name LIKE '%s')", kw, kw)
			}
		}

		// 查询条件缺失indicatorType类型处理，这块只有res_type为6的时候，才处理indicatorType类型
		if params["indicator_type"] != nil {
			indicatorType := params["indicator_type"].(string)
			cOption += fmt.Sprintf(" AND indicator_type = '%s'", util.KeywordEscape(indicatorType))
		}

		// 移除SQL层面的department_id过滤，改为在Domain层处理
		// 这样可以保持数据一致性，避免双重过滤导致的问题

		// 设置分页限制
		if params["offset"] != nil && params["limit"] != nil {
			limit = fmt.Sprintf("LIMIT %d OFFSET %d", params["limit"].(int), (params["offset"].(int)-1)*params["limit"].(int))
		}
	}

	// 构建查询SQL（用于数据查询）
	dataSQL := fmt.Sprintf(listSQL, fOption, fOption, cOption, departmentCondition, orderClause, limit)

	// 构建计数SQL（不包含分页限制）
	countSQL := fmt.Sprintf(listSQL, fOption, fOption, cOption, departmentCondition, orderClause, "")

	// 先计算总数（不包含分页限制）
	log.Infof("----------------------->计数SQL: countSQL=%s", countSQL)
	d = r.do(tx, ctx).Raw("SELECT COUNT(1) FROM (" + countSQL + ") AS c")
	err = d.Scan(&totalCount).Error
	if err != nil {
		log.Errorf("计算总数失败: %v", err)
		return 0, nil, err
	}

	// 再查询数据（包含分页限制）
	log.Infof("----------------------->数据查询SQL: dataSQL=%s", dataSQL)
	d = r.do(tx, ctx).Raw(dataSQL).Scan(&datas)
	err = d.Error

	return totalCount, datas, err
}

func (r *repo) buildOrderClause(resType my_favorite.ResType, sortField, direction string) string {
	// 验证排序字段的合法性
	validSortFields := map[string]map[string]bool{
		"res_name":   {"data-catalog": true, "info-catalog": true, "elec-licence-catalog": true, "data-view": true, "interface-svc": true, "indicator": true},
		"res_code":   {"data-catalog": true, "info-catalog": true, "elec-licence-catalog": true, "data-view": true, "interface-svc": true, "indicator": true},
		"created_at": {"data-catalog": true, "info-catalog": true, "elec-licence-catalog": true, "data-view": true, "interface-svc": true, "indicator": true},
		"updated_at": {"data-catalog": true, "info-catalog": true, "elec-licence-catalog": true, "data-view": true, "interface-svc": true, "indicator": true},
		"online_at":  {"data-catalog": true, "info-catalog": true, "elec-licence-catalog": true, "data-view": true, "interface-svc": true, "indicator": true},
	}

	// 检查排序字段是否有效
	if validFields, exists := validSortFields[sortField]; !exists {
		sortField = "res_name" // 默认按资源名称排序
	} else {
		// 根据资源类型检查字段是否支持
		resTypeStr := r.getResTypeString(resType)
		if !validFields[resTypeStr] {
			sortField = "res_name" // 如果不支持，使用默认排序
		}
	}

	// 构建排序语句
	switch sortField {
	case "res_name":
		return fmt.Sprintf(" ORDER BY res_name %s ", strings.ToUpper(direction))
	case "res_code":
		return fmt.Sprintf(" ORDER BY res_code %s ", strings.ToUpper(direction))
	case "created_at":
		return fmt.Sprintf(" ORDER BY created_at %s ", strings.ToUpper(direction))
	case "updated_at":
		return fmt.Sprintf(" ORDER BY updated_at %s ", strings.ToUpper(direction))
	case "online_at":
		// 对于online_at排序，由于SQL查询中没有online_at字段，返回默认排序
		// 实际的online_at排序将在应用层处理
		return fmt.Sprintf(" ORDER BY res_name %s ", strings.ToUpper(direction))
	default:
		return fmt.Sprintf(" ORDER BY res_name %s ", strings.ToUpper(direction))
	}
}

// getResTypeString 获取资源类型的字符串表示
func (r *repo) getResTypeString(resType my_favorite.ResType) string {
	switch resType {
	case my_favorite.RES_TYPE_DATA_CATALOG:
		return "data-catalog"
	case my_favorite.RES_TYPE_INFO_CATALOG:
		return "info-catalog"
	case my_favorite.RES_TYPE_ELEC_CATALOG:
		return "elec-licence-catalog"
	case my_favorite.RES_TYPE_DATA_VIEW:
		return "data-view"
	case my_favorite.RES_TYPE_INTERFACE_SVC:
		return "interface-svc"
	case my_favorite.RES_TYPE_INDICATOR:
		return "indicator"
	default:
		return "data-catalog"
	}
}

func (r *repo) CheckIsFavored(tx *gorm.DB, ctx context.Context, uid, resID string, resType my_favorite.ResType) (bool, error) {
	count := 0
	d := r.do(tx, ctx).
		Model(&model.TMyFavorite{}).
		Select("count(1)").
		Where("created_by = ? and res_type = ? and res_id = ?", uid, resType, resID).
		Take(&count)
	return count > 0, d.Error
}

func (r *repo) FilterFavoredRIDSV1(tx *gorm.DB, ctx context.Context, uid string, resIDs []string, resType my_favorite.ResType) ([]*my_favorite.FavorIDBase, error) {
	var favoredRIDs []*my_favorite.FavorIDBase
	d := r.do(tx, ctx).
		Model(&model.TMyFavorite{}).
		Select("id, res_id, res_type").
		Where("created_by = ? and res_type = ? and res_id in ?", uid, resType, resIDs).
		Find(&favoredRIDs)
	return favoredRIDs, d.Error
}

func (r *repo) FilterFavoredRIDSV2(tx *gorm.DB, ctx context.Context, uid string, params []*my_favorite.FilterFavoredRIDSParams) ([]*my_favorite.FavorIDBase, error) {
	var (
		favoredRIDs []*my_favorite.FavorIDBase
		option      *gorm.DB
	)

	d := r.do(tx, ctx).
		Model(&model.TMyFavorite{}).
		Select("id, res_id, res_type").
		Where("created_by = ?", uid)
	for i := range params {
		if i == 0 {
			option = r.do(tx, ctx).Where("res_type = ? and res_id in ?", params[i].ResType, params[i].ResIDs)
			continue
		}
		option = option.Or("res_type = ? and res_id in ?", params[i].ResType, params[i].ResIDs)
	}
	d = d.Where(option).Find(&favoredRIDs)
	return favoredRIDs, d.Error
}

// CountByResIDs 批量统计指定资源ID列表的收藏数量
// 查询条件：res_id IN (resIDs) AND res_type = resType
// 返回 map[resID]count，key为资源ID，value为该资源的收藏数量
func (r *repo) CountByResIDs(tx *gorm.DB, ctx context.Context, resIDs []string, resType my_favorite.ResType) (map[string]int64, error) {
	if len(resIDs) == 0 {
		return make(map[string]int64), nil
	}

	var results []my_favorite.FavoriteCountResult
	d := r.do(tx, ctx).
		Model(&model.TMyFavorite{}).
		Select("res_id, COUNT(1) as count").
		Where("res_type = ? AND res_id IN ?", resType, resIDs).
		Group("res_id").
		Find(&results)

	if d.Error != nil {
		return nil, d.Error
	}

	// 构建返回 map
	countMap := make(map[string]int64, len(results))
	for _, result := range results {
		countMap[result.ResID] = result.Count
	}

	// 对于没有收藏记录的资源ID，设置计数为0
	for _, resID := range resIDs {
		if _, exists := countMap[resID]; !exists {
			countMap[resID] = 0
		}
	}

	return countMap, nil
}
