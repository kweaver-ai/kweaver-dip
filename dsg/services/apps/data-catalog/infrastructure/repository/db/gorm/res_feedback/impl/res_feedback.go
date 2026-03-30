package impl

import (
	"context"
	"fmt"
	"log"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/res_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/res_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) res_feedback.Repo {
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

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.TResFeedback) error {
	return r.do(tx, ctx).Model(&model.TResFeedback{}).Create(m).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.TResFeedback, status []int) (bool, error) {
	d := r.do(tx, ctx).Model(&model.TResFeedback{}).Where("id = ?", m.ID)
	if len(status) > 0 {
		d = d.Where("status in ?", status)
	}
	d = d.Save(m)
	return d.RowsAffected > 0, d.Error
}

func (r *repo) GetByID(tx *gorm.DB, ctx context.Context, ids []uint64) ([]*model.TResFeedback, error) {
	var datas []*model.TResFeedback
	d := r.do(tx, ctx).
		Model(&model.TResFeedback{}).
		Where("id in ?", ids).
		Find(&datas)
	return datas, d.Error
}

func (r *repo) GetCount(tx *gorm.DB, ctx context.Context, uid string) (*res_feedback.CountInfo, error) {
	var data *res_feedback.CountInfo
	d := r.do(tx, ctx).Model(&model.TResFeedback{})

	// 添加用户过滤条件
	/*if len(uid) > 0 {
		d = d.Where("created_by = ?", uid)
	}*/

	d = d.Select(`count(1) as total_num, 
				sum(case when status = 1 then 1 else 0 end) as pending_num, 
				sum(case when status = 9 then 1 else 0 end) as replied_num`).
		Take(&data)
	return data, d.Error
}

const (
	dataViewSQL = `SELECT a.id AS id, a.res_id AS res_id, a.feedback_type AS feedback_type, a.feedback_desc AS feedback_desc, a.status AS status, 
					a.created_at AS created_at, a.created_by AS created_by, a.replied_at AS replied_at, b.uniform_catalog_code AS res_code, b.business_name AS res_title, 
					b.department_id AS org_code, a.res_type,b.online_status as in_online 
				FROM 
					(SELECT id, res_id, feedback_type, feedback_desc, status, created_at, created_by, replied_at,res_type 
					 FROM t_res_feedback 
					 WHERE %s) AS a 
				INNER JOIN 
					(SELECT id, uniform_catalog_code , business_name, department_id,online_status 
					 FROM af_main.form_view 
					 WHERE id COLLATE utf8mb4_unicode_ci IN (SELECT DISTINCT res_id COLLATE utf8mb4_unicode_ci
								  FROM t_res_feedback 
								  WHERE %s) AND %s) AS b 
				ON a.res_id COLLATE utf8mb4_unicode_ci = b.id  COLLATE utf8mb4_unicode_ci
				%s 
				%s`
	interfaceSvcSQL = `SELECT a.id AS id, a.res_id AS res_id, a.feedback_type AS feedback_type, a.feedback_desc AS feedback_desc, a.status AS status, 
					a.created_at AS created_at, a.created_by AS created_by, a.replied_at AS replied_at, b.code AS res_code, b.title AS res_title, 
					b.department_id AS org_code,a.res_type,b.status as in_online  
				FROM 
					(SELECT id, res_id, feedback_type, feedback_desc, status, created_at, created_by, replied_at ,res_type
					 FROM t_res_feedback 
					 WHERE %s) AS a 
				INNER JOIN 
					(SELECT service_id as id, service_code AS code, service_name AS title, department_id,status
						FROM (
							SELECT service_id, service_code, service_name,department_id,status
							FROM data_application_service.service
							GROUP BY service_id
						) AS distinct_service 
					 WHERE service_id IN (SELECT DISTINCT res_id COLLATE utf8mb4_unicode_ci
								  FROM t_res_feedback 
								  WHERE %s) AND %s) AS b 
				ON a.res_id  = b.id 
				%s 
				%s`
	// indicatorListSQL = `
	// SELECT
	// 	a.id AS id, a.res_id AS res_id, a.feedback_type AS feedback_type, a.feedback_desc AS feedback_desc, a.status AS status,
	// 	a.created_at AS created_at, a.created_by AS created_by, a.replied_at AS replied_at, a.res_code AS res_code,
	// 	a.res_title AS res_title, a.org_code AS org_code, a.res_type
	// FROM
	// 	(SELECT id, res_id, feedback_type, feedback_desc, status, created_at, created_by, replied_at, res_type,
	// 		res_code, res_title, org_code
	// 	 FROM t_res_feedback
	// 	 WHERE %s) AS a
	// WHERE 1=1%s
	// %s
	// %s`
	// // 新增：支持在JOIN后添加WHERE条件的indicator SQL模板
	// indicatorListSQLWithWhere = `
	// SELECT
	// 	a.id AS id, a.res_id AS res_id, a.feedback_type AS feedback_type, a.feedback_desc AS feedback_desc, a.status AS status,
	// 	a.created_at AS created_at, a.created_by AS created_by, a.replied_at AS replied_at, a.res_code AS res_code,
	// 	a.res_title AS res_title, a.org_code AS org_code, a.res_type
	// FROM
	// 	(SELECT id, res_id, feedback_type, feedback_desc, status, created_at, created_by, replied_at, res_type,
	// 		res_code, res_title, org_code
	// 	 FROM t_res_feedback
	// 	 WHERE %s) AS a
	// WHERE 1=1%s
	// %s
	// %s`
	// 通用SQL：查询所有类型的资源反馈数据
	allTypesSQL = `
	SELECT 
		a.id AS id, a.res_id AS res_id, a.feedback_type AS feedback_type, a.feedback_desc AS feedback_desc, a.status AS status, 
		a.created_at AS created_at, a.created_by AS created_by, a.replied_at AS replied_at, 
		COALESCE(dv.uniform_catalog_code, svc.service_code) AS res_code,
		COALESCE(dv.business_name, svc.service_name) AS res_title,
		COALESCE(dv.department_id, svc.department_id) AS org_code,
		a.res_type
	FROM 
		(SELECT id, res_id, feedback_type, feedback_desc, status, created_at, created_by, replied_at, res_type
		 FROM t_res_feedback 
		 WHERE %s) AS a 
	LEFT JOIN af_main.form_view AS dv ON a.res_id COLLATE utf8mb4_unicode_ci = dv.id COLLATE utf8mb4_unicode_ci
	LEFT JOIN data_application_service.service AS svc ON a.res_id = svc.service_id
	WHERE (dv.id IS NOT NULL OR svc.service_id IS NOT NULL)%s
	%s 
	%s`
	// 新增：支持在WHERE条件中添加indicator_type条件的通用SQL模板
	allTypesSQLWithWhere = `
	SELECT 
		a.id AS id, a.res_id AS res_id, a.feedback_type AS feedback_type, a.feedback_desc AS feedback_desc, a.status AS status, 
		a.created_at AS created_at, a.created_by AS created_by, a.replied_at AS replied_at, 
		COALESCE(dv.uniform_catalog_code, svc.service_code) AS res_code,
		COALESCE(dv.business_name, svc.service_name) AS res_title,
		COALESCE(dv.department_id, svc.department_id) AS org_code,
		a.res_type
	FROM 
		(SELECT id, res_id, feedback_type, feedback_desc, status, created_at, created_by, replied_at, res_type
		 FROM t_res_feedback 
		 WHERE %s) AS a 
	LEFT JOIN af_main.form_view AS dv ON a.res_id COLLATE utf8mb4_unicode_ci = dv.id COLLATE utf8mb4_unicode_ci
	LEFT JOIN (
		SELECT service_id, service_code, service_name, department_id
		FROM data_application_service.service group by service_id
	) AS svc ON a.res_id = svc.service_id
	WHERE (dv.id IS NOT NULL OR svc.service_id IS NOT NULL)%s
	%s 
	%s`
)

func (r *repo) GetList(tx *gorm.DB, ctx context.Context, uid string, id uint64, params map[string]any, resType string) (int64, []*res_feedback.CatalogFeedbackDetail, error) {
	var (
		err        error
		totalCount int64
		datas      []*res_feedback.CatalogFeedbackDetail
	)

	fOption, cOption, order, limit := "1=1", "1=1", "", ""
	d := r.do(tx, ctx)
	if id > 0 {
		fOption += fmt.Sprintf(" AND id = %d", id)
	}

	var sql string
	// 优先使用 resType 参数，如果为空则使用 params 中的 res_type
	currentResType := resType
	if currentResType == "" && params != nil && params["res_type"] != nil {
		if resTypeStr, ok := params["res_type"].(string); ok {
			currentResType = resTypeStr
		}
	}

	// 根据resType决定是否添加用户过滤条件
	// 当resType为空时，查询所有用户的反馈（管理员权限）
	// 当resType不为空时，只查询当前用户的反馈（用户权限）
	if currentResType != "" && len(uid) > 0 {
		fOption += fmt.Sprintf(" AND created_by = '%s'", util.KeywordEscape(uid))
		log.Printf("添加用户过滤条件: uid=%s, currentResType=%s", uid, currentResType)
	} else if currentResType == "" {
		log.Printf("resType为空，不添加用户过滤条件，查询所有用户的反馈")
	}

	// 处理indicator_type条件 - 从fOption中移除，单独处理
	// var indicatorTypeCondition string
	// if params != nil && params["indicator_type"] != nil {
	// 	indicatorTypeCondition = fmt.Sprintf(" AND indicator_type = '%s'", util.KeywordEscape(fmt.Sprint(params["indicator_type"])))
	// }

	if params != nil {
		if params["feedback_type"] != nil {
			if feedbackTypeStr, ok := params["feedback_type"].(string); ok {
				fOption += fmt.Sprintf(" AND feedback_type = '%s'", util.KeywordEscape(feedbackTypeStr))
			}
		}
		if params["status"] != nil {
			fOption += fmt.Sprintf(" AND status = %s", util.KeywordEscape(fmt.Sprint(params["status"])))
		}

		if params != nil && params["create_begin_time"] != nil {
			if beginTimeStr, ok := params["create_begin_time"].(string); ok {
				fOption += fmt.Sprintf(" AND created_at >= '%s'", util.KeywordEscape(beginTimeStr))
			}
		}

		if params != nil && params["create_end_time"] != nil {
			if endTimeStr, ok := params["create_end_time"].(string); ok {
				fOption += fmt.Sprintf(" AND created_at <= '%s'", util.KeywordEscape(endTimeStr))
			}
		}
		// 移除indicator_type条件，因为t_res_feedback表中没有这个字段
		// if params != nil && params["indicator_type"] != nil {
		// 	fOption += fmt.Sprintf(" AND indicator_type = '%s'", util.KeywordEscape(fmt.Sprint(params["indicator_type"])))
		// }

		if params != nil && params["keyword"] != nil {
			if keywordStr, ok := params["keyword"].(string); ok {
				kw := "%" + util.KeywordEscape(keywordStr) + "%"
				// 根据资源类型使用不同的字段名进行关键字查询
				switch currentResType {
				case S_RES_TYPE_DATA_VIEW:
					// af_main.form_view 表: uniform_catalog_code, business_name
					cOption += fmt.Sprintf(" AND (uniform_catalog_code LIKE '%s' or business_name LIKE '%s')", kw, kw)
				case S_RES_TYPE_INTERFACE_SVC:
					// data_application_service.service 表: service_code, service_name
					cOption += fmt.Sprintf(" AND (service_code LIKE '%s' or service_name LIKE '%s')", kw, kw)
				// case S_RES_TYPE_INDICATOR:
				// 	// 指标类型查询
				// 	cOption += fmt.Sprintf(" AND (res_code LIKE '%s' or res_title LIKE '%s')", kw, kw)
				case "":
					// 当 resType 为空时，在通用SQL中通过 WHERE 条件进行关键字查询
					// 这里不设置 cOption，而是在通用SQL的 WHERE 条件中处理
					log.Printf("关键字查询将在通用SQL中处理: %s", keywordStr)
				default:
					// 默认使用通用的字段名
					cOption += fmt.Sprintf(" AND (code LIKE '%s' or title LIKE '%s')", kw, kw)
				}
			}
		}

		if params != nil && params["res_type"] != nil {
			if resTypeStr, ok := params["res_type"].(string); ok {
				fOption += fmt.Sprintf(" AND res_type = %d", domain.ResType2Enum(resTypeStr))
			}
		}

		// 处理排序逻辑
		if params["sort"] != nil && params["direction"] != nil {
			if sortStr, ok := params["sort"].(string); ok {
				if directionStr, ok := params["direction"].(string); ok {
					// 映射排序字段到实际的数据库字段
					orderField := getOrderField(sortStr, currentResType)
					if orderField != "" {
						order = fmt.Sprintf(" ORDER BY %s %s", orderField, directionStr)
					}
				}
			}
		}

		// 如果没有指定排序，使用默认排序：优先按回复时间倒序，然后按创建时间倒序
		if order == "" {
			order = " ORDER BY a.replied_at DESC, a.created_at DESC"
		}

		if params["offset"] != nil && params["limit"] != nil {
			if limitInt, ok := params["limit"].(int); ok {
				if offsetInt, ok := params["offset"].(int); ok {
					limit = fmt.Sprintf("LIMIT %d OFFSET %d", limitInt, (offsetInt-1)*limitInt)
				}
			}
		}
	}

	// 生成SQL
	if currentResType != "" {
		switch currentResType {
		case S_RES_TYPE_DATA_VIEW:
			sql = fmt.Sprintf(dataViewSQL, fOption, fOption, cOption, order, limit)
		case S_RES_TYPE_INTERFACE_SVC:
			sql = fmt.Sprintf(interfaceSvcSQL, fOption, fOption, cOption, order, limit)
			// case S_RES_TYPE_INDICATOR:
			// 	// 对于indicator类型，将indicator_type条件添加到JOIN后的WHERE条件中
			// 	indicatorWhereClause := ""
			// 	if indicatorTypeCondition != "" {
			// 		indicatorWhereClause = indicatorTypeCondition
			// 	}
			// 	sql = fmt.Sprintf(indicatorListSQLWithWhere, fOption, fOption, cOption, indicatorWhereClause, order, limit)
		}
	} else {
		// 当 resType 为空时，使用通用SQL查询所有类型的反馈
		// 处理关键字查询：在通用SQL中添加关键字搜索条件
		keywordCondition := ""
		if params != nil && params["keyword"] != nil {
			if keywordStr, ok := params["keyword"].(string); ok {
				kw := "%" + util.KeywordEscape(keywordStr) + "%"
				keywordCondition = fmt.Sprintf(" AND (dv.uniform_catalog_code LIKE '%s' OR dv.business_name LIKE '%s' OR svc.service_code LIKE '%s' OR svc.service_name LIKE '%s')",
					kw, kw, kw, kw)
			}
		}
		// 对于通用SQL，将indicator_type条件添加到WHERE条件中
		// indicatorWhereClause := ""
		// if indicatorTypeCondition != "" {
		// 	indicatorWhereClause = indicatorTypeCondition
		// }
		sql = fmt.Sprintf(allTypesSQLWithWhere, fOption, keywordCondition, order, limit)
	}

	// 调试：打印查询参数
	log.Printf("----------------------->查询参数: resType=%s, currentResType=%s", resType, currentResType)

	// 先计算总数（不带分页）
	countSQL := ""
	if currentResType != "" {
		switch currentResType {
		case S_RES_TYPE_DATA_VIEW:
			countSQL = fmt.Sprintf(dataViewSQL, fOption, fOption, cOption, order, "")
		case S_RES_TYPE_INTERFACE_SVC:
			countSQL = fmt.Sprintf(interfaceSvcSQL, fOption, fOption, cOption, order, "")
			// case S_RES_TYPE_INDICATOR:
			// 	// 对于indicator类型，将indicator_type条件添加到JOIN后的WHERE条件中
			// 	indicatorWhereClause := ""
			// 	if indicatorTypeCondition != "" {
			// 		indicatorWhereClause = indicatorTypeCondition
			// 	}
			// 	countSQL = fmt.Sprintf(indicatorListSQLWithWhere, fOption, fOption, cOption, indicatorWhereClause, order, "")
		}
	} else {
		// 当 resType 为空时，使用通用SQL查询所有类型的反馈
		keywordCondition := ""
		if params != nil && params["keyword"] != nil {
			if keywordStr, ok := params["keyword"].(string); ok {
				kw := "%" + util.KeywordEscape(keywordStr) + "%"
				keywordCondition = fmt.Sprintf(" AND (dv.uniform_catalog_code LIKE '%s' OR dv.business_name LIKE '%s' OR svc.service_code LIKE '%s' OR svc.service_name LIKE '%s')",
					kw, kw, kw, kw)
			}
		}
		// 对于通用SQL，将indicator_type条件添加到WHERE条件中
		// indicatorWhereClause := ""
		// if indicatorTypeCondition != "" {
		// 	indicatorWhereClause = indicatorTypeCondition
		// }
		countSQL = fmt.Sprintf(allTypesSQLWithWhere, fOption, keywordCondition, order, "")
	}

	// 计算总数
	if countSQL != "" {
		log.Println("----------------------->countSQL:", countSQL)
		d = d.Raw("SELECT COUNT(1) FROM (" + countSQL + ") AS c")
		err = d.Scan(&totalCount).Error
		if err != nil {
			goto EXIT
		}
		log.Printf("----------------------->总数: %d", totalCount)
	}

	// 查询数据（带分页）
	if sql != "" {
		log.Println("----------------------->dataSQL:", sql)
		d = d.Raw(sql).
			Scan(&datas)
		err = d.Error
	}
EXIT:
	return totalCount, datas, err
}

type FeedbackCount struct {
	FeedbackType string `json:"feedback_type"`
	Count        int64  `json:"count"`
}

const (
	S_RES_TYPE_DATA_VIEW     = "data-view"     // 数据视图
	S_RES_TYPE_INTERFACE_SVC = "interface-svc" // 接口服务
	S_RES_TYPE_INDICATOR     = "indicator"     // 指标
)

// getOrderField 映射排序字段到实际的数据库字段
func getOrderField(sortField string, resType string) string {
	switch sortField {
	case "created_at":
		return "a.created_at"
	case "replied_at":
		return "a.replied_at"
	case "res_title":
		// 根据资源类型返回不同的字段名
		switch resType {
		case S_RES_TYPE_DATA_VIEW:
			return "b.business_name"
		case S_RES_TYPE_INTERFACE_SVC, S_RES_TYPE_INDICATOR:
			return "b.title"
		case "":
			// 当 resType 为空时，使用通用SQL中的字段名
			return "COALESCE(dv.business_name, svc.service_name)"
		default:
			return "b.title"
		}
	case "res_code":
		// 根据资源类型返回不同的字段名
		switch resType {
		case S_RES_TYPE_DATA_VIEW:
			return "b.uniform_catalog_code"
		case S_RES_TYPE_INTERFACE_SVC:
			return "b.code"
		case S_RES_TYPE_INDICATOR:
			return "b.code"
		case "":
			// 当 resType 为空时，使用通用SQL中的字段名
			return "COALESCE(dv.uniform_catalog_code, svc.service_code)"
		default:
			return "b.code"
		}
	case "status":
		return "a.status"
	case "feedback_type":
		return "a.feedback_type"
	case "id":
		return "a.id"
	default:
		return ""
	}
}
