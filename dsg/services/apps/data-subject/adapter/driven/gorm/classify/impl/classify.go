package impl

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/models/request"

	"github.com/kweaver-ai/idrm-go-common/errorcode"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/classify"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"gorm.io/gorm"
)

type RepoImpl struct {
	db *gorm.DB
}

func NewRepoImpl(db *gorm.DB) classify.Repo {
	return &RepoImpl{db: db}
}

func (r RepoImpl) QueryGroupClassify(ctx context.Context, isOperator, openHierarchy bool, rootId ...string) (models []classify.SubjectClassify, err error) {
	groupID := ""
	if len(rootId) > 0 {
		groupID = rootId[0]
	}

	db := r.db.WithContext(ctx).Table(new(model.SubjectDomain).TableName())
	var sql string
	switch {
	case !openHierarchy && groupID != "":
		sql = "select sd.id, sd.name, substring(sd.path_id, 1,36) as root_id, sd.`path` as path_name,sd.path_id,fvf.classified_num from  " +
			"  	(select fvf0.id, fvf0.form_view_id,count(fvf0.subject_id) as classified_num, fvf0.subject_id   " +
			"        from af_main.form_view_field fvf0 join af_main.form_view fv  on fv.id=fvf0.form_view_id " +
			"  		 where fvf0.deleted_at=0 "
		if !isOperator {
			sql += " and fv.online_status='online' "
		}
		sql += " and fvf0.subject_id is not null and fvf0.subject_id !='' group by fvf0.subject_id ) fvf  " +
			" 	join af_main.subject_domain sd  " +
			" 	on sd.id = fvf.subject_id " +
			" 	where sd.deleted_at=0 and sd.path_id like '%s' "
		sql = fmt.Sprintf(sql, "%"+groupID+"%")
	case !openHierarchy && groupID == "":
		sql = "select sd.id, sd.name, substring(sd.path_id, 1,36) as root_id, sd.`path` as path_name,sd.path_id, sum(fvf.classified_num) classified_num from  " +
			"  	(select fvf0.id, fvf0.form_view_id,count(fvf0.subject_id) as classified_num, fvf0.subject_id " +
			"        from af_main.form_view_field fvf0 join af_main.form_view fv  on fv.id=fvf0.form_view_id " +
			"  		where fvf0.deleted_at=0 "
		if !isOperator {
			sql += " and fv.online_status='online' "
		}
		sql += " and fvf0.subject_id is not null and fvf0.subject_id !='' group by fvf0.subject_id ) fvf  " +
			" 	join af_main.subject_domain sd  " +
			" 	on sd.id = fvf.subject_id " +
			" 	where sd.deleted_at=0  group by root_id"
	case openHierarchy && groupID != "":
		sql = "select sd.id, sd.name, substring(sd.path_id, 1,36) as root_id, sd.`path` as path_name, sd.path_id, fvf.classified_num, sd.label_id from  " +
			"  	(select fvf0.id, fvf0.form_view_id,count(fvf0.subject_id) as classified_num, fvf0.subject_id  " +
			"        from af_main.form_view_field fvf0 join af_main.form_view fv  on fv.id=fvf0.form_view_id " +
			"  		where fvf0.deleted_at=0  "
		if !isOperator {
			sql += " and fv.online_status='online' "
		}
		sql += "  and fvf0.subject_id is not null and fvf0.subject_id !='' group by fvf0.subject_id) fvf  " +
			" 	right join af_main.subject_domain sd  " +
			" 	on sd.id = fvf.subject_id " +
			" 	where sd.deleted_at=0  and sd.path_id like '%s' "
		sql = fmt.Sprintf(sql, "%"+groupID+"%")
	case openHierarchy && groupID == "":
		sql = "select sd.id, sd.name, substring(sd.path_id, 1,36) as root_id, sd.`path` as path_name,sd.path_id,fvf.classified_num,sd.label_id from  " +
			"  	(select fvf0.id, fvf0.form_view_id,count(fvf0.subject_id) as classified_num, fvf0.subject_id " +
			"        from af_main.form_view_field fvf0 join af_main.form_view fv on fv.id=fvf0.form_view_id " +
			"  		where fvf0.deleted_at=0 "
		if !isOperator {
			sql += " and fv.online_status='online' "
		}
		sql += " and fvf0.subject_id is not null and fvf0.subject_id !='' group by fvf0.subject_id) fvf  " +
			" 	join af_main.subject_domain sd  " +
			" 	on sd.id = fvf.subject_id" +
			" 	where sd.deleted_at=0"
	}
	err = db.Raw(sql).Scan(&models).Error
	if err != nil {
		return models, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return models, nil
}

// QueryGroupClassifyViews 逻辑视图分页
func (r RepoImpl) QueryGroupClassifyViews(ctx context.Context, subjectID string, isOperator bool, page request.PageInfo) (total int64, formViewField []*classify.FormViewSubjectField, err error) {
	//查询总的视图数量
	totalSQL := "select  count(distinct(fv.form_view_id)) as total from af_main.form_view_field fvf " +
		" join af_main.form_view fv on fvf.form_view_id=fv.id " +
		" join af_main.subject_domain sd on sd.id=fvf.subject_id " +
		" where fv.deleted_at=0  and fvf.deleted_at=0 and sd.path_id like  "
	totalSQL = totalSQL + "'%" + subjectID + "%'"
	if !isOperator {
		totalSQL += " and fv.`online_status`='online' "
	}
	err = r.db.WithContext(ctx).Raw(totalSQL).Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	//分页查询
	sql := "select fv.id as view_id, fv.technical_name as view_technical_name, " +
		" fv.type as view_type, fv.business_name as view_business_name, " +
		" d.`schema`, d.catalog_name from af_main.form_view_field fvf " +
		" join af_main.form_view fv on fvf.form_view_id=fv.id " +
		" join af_main.subject_domain sd on sd.id=fvf.subject_id " +
		" left join af_main.datasource d  on d.id= fv.datasource_id " +
		" where fv.deleted_at=0  and fvf.deleted_at=0 and sd.path_id like "
	sql = sql + "'%" + subjectID + "%'"
	if !isOperator {
		sql += " and fv.`online_status`='online' "
	}
	sql += " group by fv.id " //添加分组，保证唯一
	sql = fmt.Sprintf("%s order by fv.%s %s", sql, page.Sort, page.Direction)
	sql = fmt.Sprintf("%s limit %d offset %d", sql, page.Limit, (page.Offset-1)*page.Limit)
	err = r.db.WithContext(ctx).Raw(sql).Scan(&formViewField).Error
	return
}

func (r RepoImpl) QueryGroupClassifyFields(ctx context.Context, subjectID string, formViewID string, isOperator bool, page request.PageInfo) (total int64, formViewField []*classify.FormViewSubjectField, err error) {
	//查询总的数量
	totalSQL := "select  count(distinct(fvf.id)) as total from af_main.form_view_field fvf " +
		" join af_main.form_view fv on fvf.form_view_id=fv.id " +
		" join af_main.subject_domain sd on sd.id=fvf.subject_id " +
		" where fv.deleted_at=0  and fvf.deleted_at=0 and sd.path_id like "
	totalSQL = totalSQL + "'%" + subjectID + "%'"
	if !isOperator {
		totalSQL += " and fv.`online_status`='online' "
	}
	// 视图字段为空，查询是视图分页，
	totalSQL = fmt.Sprintf("%s and fv.id = '%s' ", totalSQL, formViewID)

	err = r.db.WithContext(ctx).Raw(totalSQL).Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	//分页查询
	sql := "select fvf.*, fv.technical_name as view_technical_name, fv.business_name as view_business_name, " +
		"  fv.type as view_type, fv.id as view_id, sd.name as subject_name, " +
		"  sd.path_id as path_id, sd.path as path_name, sd.label_id, " +
		" d.`schema`, d.catalog_name from af_main.form_view_field fvf " +
		" join af_main.form_view fv on fvf.form_view_id=fv.id " +
		" join af_main.subject_domain sd on sd.id=fvf.subject_id " +
		" left join af_main.datasource d  on d.id= fv.datasource_id " +
		" where fv.deleted_at=0  and fvf.deleted_at=0 and sd.path_id like "
	sql = sql + "'%" + subjectID + "%'"
	// 视图字段为空，查询是视图分页，
	sql = fmt.Sprintf(" %s and fv.id = '%s' ", sql, formViewID)
	if !isOperator {
		sql += " and fv.`online_status`='online' "
	}
	sql = fmt.Sprintf("%s order by fv.%s %s", sql, page.Sort, page.Direction)
	sql = fmt.Sprintf("%s limit %d offset %d", sql, page.Limit, (page.Offset-1)*page.Limit)
	err = r.db.WithContext(ctx).Raw(sql).Scan(&formViewField).Error
	return
}
