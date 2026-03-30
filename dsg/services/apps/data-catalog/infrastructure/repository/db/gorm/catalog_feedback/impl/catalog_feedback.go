package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	data_resource_catalog_domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/catalog_feedback"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

func NewRepo(data *db.Data) catalog_feedback.Repo {
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

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.TCatalogFeedback) error {
	return r.do(tx, ctx).Model(&model.TCatalogFeedback{}).Create(m).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.TCatalogFeedback, status []int) (bool, error) {
	d := r.do(tx, ctx).Model(&model.TCatalogFeedback{}).Where("id = ?", m.ID)
	if len(status) > 0 {
		d = d.Where("status in ?", status)
	}
	d = d.Save(m)
	return d.RowsAffected > 0, d.Error
}

func (r *repo) GetByID(tx *gorm.DB, ctx context.Context, ids []uint64) ([]*model.TCatalogFeedback, error) {
	var datas []*model.TCatalogFeedback
	d := r.do(tx, ctx).
		Model(&model.TCatalogFeedback{}).
		Where("id in ?", ids).
		Find(&datas)
	return datas, d.Error
}

func (r *repo) GetCount(tx *gorm.DB, ctx context.Context) (*catalog_feedback.CountInfo, error) {
	var data *catalog_feedback.CountInfo
	d := r.do(tx, ctx).
		Model(&model.TCatalogFeedback{}).
		Select(`count(1) as total_num, 
				sum(case when status = 1 then 1 else 0 end) as pending_num, 
				sum(case when status = 9 then 1 else 0 end) as replied_num`).
		Take(&data)
	return data, d.Error
}

const (
	listSQL = `SELECT a.id AS id, a.catalog_id AS catalog_id, a.feedback_type AS feedback_type, a.feedback_desc AS feedback_desc, a.status AS status, 
					a.created_at AS created_at, a.created_by AS created_by, a.replied_at AS replied_at, b.code AS catalog_code, b.title AS catalog_title, 
					b.department_id AS org_code  
				FROM 
					(SELECT id, catalog_id, feedback_type, feedback_desc, status, created_at, created_by, replied_at 
					 FROM t_catalog_feedback 
					 WHERE %s) AS a 
				INNER JOIN 
					(SELECT id, code, title, department_id 
					 FROM t_data_catalog 
					 WHERE id IN (SELECT DISTINCT catalog_id 
								  FROM t_catalog_feedback 
								  WHERE %s) AND %s) AS b 
				ON a.catalog_id = b.id 
				%s 
				%s`
)

func (r *repo) GetList(tx *gorm.DB, ctx context.Context, uid string, id uint64, params map[string]any) (int64, []*catalog_feedback.CatalogFeedbackDetail, error) {
	var (
		err        error
		totalCount int64
		datas      []*catalog_feedback.CatalogFeedbackDetail
	)

	fOption, cOption, order, limit := "1=1", "1=1", "", ""
	d := r.do(tx, ctx)
	if id > 0 {
		fOption += fmt.Sprintf(" AND id = %d", id)
	}
	if len(uid) > 0 {
		fOption += fmt.Sprintf(" AND created_by = '%s'", util.KeywordEscape(uid))
	}
	if params != nil {
		if params["feedback_type"] != nil {
			fOption += fmt.Sprintf(" AND feedback_type = '%s'", util.KeywordEscape(params["feedback_type"].(string)))
		}
		if params["status"] != nil {
			fOption += fmt.Sprintf(" AND status = %s", util.KeywordEscape(fmt.Sprint(params["status"])))
		}

		if params["create_begin_time"] != nil {
			fOption += fmt.Sprintf(" AND created_at >= '%s'", util.KeywordEscape(params["create_begin_time"].(string)))
		}

		if params["create_end_time"] != nil {
			fOption += fmt.Sprintf(" AND created_at <= '%s'", util.KeywordEscape(params["create_end_time"].(string)))
		}

		if params["keyword"] != nil {
			kw := "%" + util.KeywordEscape(params["keyword"].(string)) + "%"
			cOption += fmt.Sprintf(" AND (code LIKE '%s' or title LIKE '%s')", kw, kw)
		}

		d = d.Raw("SELECT COUNT(1) FROM (" + fmt.Sprintf(listSQL, fOption, fOption, cOption, order, limit) + ") AS c")
		err = d.Scan(&totalCount).Error
		if err != nil {
			goto EXIT
		}
		if params["sort"] != nil && params["direction"] != nil {
			order = fmt.Sprintf(" ORDER BY %s %s", params["sort"].(string), params["direction"].(string))
		}
		if params["offset"] != nil && params["limit"] != nil {
			limit = fmt.Sprintf("LIMIT %d OFFSET %d", params["limit"].(int), (params["offset"].(int)-1)*params["limit"].(int))
		}
	}
	d = d.Raw(fmt.Sprintf(listSQL, fOption, fOption, cOption, order, limit)).
		Scan(&datas)
	err = d.Error
EXIT:
	return totalCount, datas, err
}

type FeedbackCount struct {
	FeedbackType string `json:"feedback_type"`
	Count        int64  `json:"count"`
}

func (r *repo) OverviewCount(ctx context.Context) (res catalog_feedback.OverviewCount, err error) {
	feedbackCounts := make([]*FeedbackCount, 0)
	err = r.data.DB.WithContext(ctx).Select("feedback_type", "count(feedback_type) count").Table("t_catalog_feedback").Group("feedback_type").Find(&feedbackCounts).Error
	if err != nil {
		return
	}
	for _, feedbackCount := range feedbackCounts {
		switch feedbackCount.FeedbackType {
		case constant.FeedbackDirInfoError:
			res.DirInfoError = feedbackCount.Count
		case constant.FeedbackDataQualityIssue:
			res.DataQualityIssue = feedbackCount.Count
		case constant.FeedbackResourceMismatch:
			res.ResourceMismatch = feedbackCount.Count
		case constant.FeedbackInterfaceIssue:
			res.InterfaceIssue = feedbackCount.Count
		case constant.FeedbackOther:
			res.Other = feedbackCount.Count
		}
	}
	return
}

func (r *repo) FilterByTimeCount(ctx context.Context, req *data_resource_catalog.AuditLogCountReq) (res []*data_resource_catalog_domain.Count, err error) {
	err = r.data.DB.WithContext(ctx).Table("t_catalog_feedback f").
		Joins("inner join t_data_catalog c on f.catalog_id=c.id").
		Select(fmt.Sprintf("%s dive,count(f.catalog_id) count , c.type", req.CreatedAtTime)).
		Where(" f.created_at > ? and f.created_at < ?", req.Start, req.End).
		Group(fmt.Sprintf("c.type,%s", req.CreatedAtTime)).
		Find(&res).Error
	if err != nil {
		return
	}
	return
}
