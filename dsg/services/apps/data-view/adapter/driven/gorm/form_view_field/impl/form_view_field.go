package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type formViewFieldRepo struct {
	db *gorm.DB
}

func NewFormViewFieldRepo(db *gorm.DB) form_view_field.FormViewFieldRepo {
	return &formViewFieldRepo{db: db}
}

func (r *formViewFieldRepo) GetFormViewFieldList(ctx context.Context, formViewId string) (formViewField []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormViewField).Where("form_view_id=?", formViewId).Find(&formViewField).Error
	return
}

func (r *formViewFieldRepo) GetFormViewFields(ctx context.Context, formViewId string) (formViewField []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormViewField).Where("form_view_id=? and status <> ?", formViewId, constant.FormViewFieldDelete.Integer.Int32()).Find(&formViewField).Error
	return
}

func (r *formViewFieldRepo) GetFormViewRelatedFieldList(ctx context.Context, isOperator bool, subjectId ...string) (formViewField []*model.FormViewSubjectField, err error) {
	sql := "select fvf.*, fv.technical_name as view_technical_name, fv.business_name as view_business_name, fv.type as form_view_type," +
		" d.`schema`, d.catalog_name, d.data_view_source  from af_main.form_view_field fvf " +
		" join af_main.form_view fv on fvf.form_view_id=fv.id " +
		" left join af_main.datasource d on d.id= fv.datasource_id " +
		" where fv.deleted_at=0  and fvf.deleted_at=0 and fvf.subject_id in ? "
	if !isOperator {
		sql += fmt.Sprintf(" and online_status='%s' ", constant.LineStatusOnLine)
	}
	err = r.db.WithContext(ctx).Raw(sql, subjectId).Scan(&formViewField).Error
	return
}
func (r *formViewFieldRepo) GetFieldsByFormViewIds(ctx context.Context, formViewIds []string) (formViewField []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormViewField).Where("form_view_id in ?", formViewIds).Find(&formViewField).Error
	return
}

func (r *formViewFieldRepo) GetFormViewFieldListBusinessNameEmpty(ctx context.Context, formViewId string) (formViewField []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormViewField).Where("form_view_id=? AND business_name ='' and deleted_at=0", formViewId).Find(&formViewField).Error
	return
}

func (r *formViewFieldRepo) GetFields(ctx context.Context, req *domain.GetFieldsReq) (formViewField []*model.FormViewField, err error) {
	tx := r.db.WithContext(ctx).Table(model.TableNameFormViewField)
	if req.Keyword != "" {
		keyword := req.Keyword
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		tx.Where("technical_name like ? or business_name like ?", keyword, keyword)
	}
	err = tx.Where("form_view_id=? and deleted_at=0", req.ID).Find(&formViewField).Error
	return
}
func (r *formViewFieldRepo) GetField(ctx context.Context, id string) (formViewField *model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Where("id=? and deleted_at=0", id).Take(&formViewField).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.FormViewFieldIDNotExist)
		}
		log.WithContext(ctx).Error("formViewRepo GetById DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return
}
func (r *formViewFieldRepo) GetMultiViewField(ctx context.Context, viewIds []string) (formViewField []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Where("form_view_id in ?", viewIds).Find(&formViewField).Error
	if err != nil {
		log.WithContext(ctx).Error("formViewRepo GetMultiViewField DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return
}

func (r *formViewFieldRepo) FieldNameExist(ctx context.Context, formID string, fieldID string, name string) (bool, error) {
	var formView *model.FormViewField
	err := r.db.WithContext(ctx).Where("business_name=? and form_view_id=? and id<>? and deleted_at=0",
		name, formID, fieldID).Take(&formView).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return true, err
	}
	return true, nil
}

// DataSourceTables  查询数据源下表的详情， 二层数组第一个元素是数据源ID，第二个是表的技术名称
func (r *formViewFieldRepo) DataSourceTables(ctx context.Context, reqs [][]string) (formViews []*model.LineageFieldInfo, err error) {
	db := r.db.WithContext(ctx)
	sql := "select fv.datasource_id,  " +
		"fv.business_name as view_business_name,  " +
		"fv.technical_name  as view_technical_name,  " +
		"fvf.*  " +
		"from form_view fv join form_view_field fvf on fv.id=fvf.form_view_id  "
	conditions := make([]string, 0)
	for i := range reqs {
		if len(reqs[i]) < 2 {
			continue
		}
		conditions = append(conditions, fmt.Sprintf(" (fv.datasource_id='%s' and fv.technical_name='%s') ", reqs[i][0], reqs[i][1]))
	}
	if len(conditions) > 0 {
		sql = sql + "where " + strings.Join(conditions, " and ")
	}
	err = db.Raw(sql).Scan(&formViews).Error
	return formViews, err
}

func (r *formViewFieldRepo) UpdateBusinessTimestamp(ctx context.Context, viewId, fieldId string) error {
	resErr := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var formViewField []*model.FormViewField
		err := tx.Table(model.TableNameFormViewField).Where("form_view_id=? and business_timestamp = 1", viewId).Find(&formViewField).Error
		if err != nil {
			return err
		}
		if len(formViewField) > 0 {
			if err = tx.Table(model.TableNameFormViewField).Where("form_view_id = ? and business_timestamp = 1", viewId).UpdateColumn("business_timestamp", 0).Error; err != nil {
				return err
			}
			if formViewField[0].ID == fieldId {
				return nil
			}
		}
		if err = tx.Table(model.TableNameFormViewField).Where("form_view_id = ? and id = ?", viewId, fieldId).UpdateColumn("business_timestamp", 1).Error; err != nil {
			return err
		}
		return nil
	})
	if resErr != nil {
		log.WithContext(ctx).Error("【formViewFieldRepo】UpdateTransaction ", zap.Error(resErr))
		return resErr
	}
	return resErr
}

func (r *formViewFieldRepo) GetBusinessTimestamp(ctx context.Context, viewId string) (formViewField []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Model(&model.FormViewField{}).Where("form_view_id=? and business_timestamp = 1", viewId).Find(&formViewField).Error
	if err != nil {
		return nil, err
	}
	return formViewField, nil
}

func (r *formViewFieldRepo) GetFieldsForDataClassify(ctx context.Context, formViewId string) (formViewFields []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).
		Table(model.TableNameFormViewField).
		Where("form_view_id = ? and (classify_type != 2 or classify_type is null or (classify_type = 2 and (subject_id is null or subject_id = '')))", formViewId).
		Find(&formViewFields).Error
	return
}

func (r *formViewFieldRepo) GetFieldsForDataGrade(ctx context.Context, formViewId string) (formViewFields []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).
		Table(model.TableNameFormViewField).
		Where("form_view_id = ? and (classify_type != 2 or classify_type is null or (classify_type = 2 and (subject_id is null or subject_id = '')))", formViewId).
		Where("grade_type != 2 or grade_type is null or grade_type = 2").
		Find(&formViewFields).Error
	return
}

func (r *formViewFieldRepo) BatchUpdateFieldSuject(ctx context.Context, fields []*model.FormViewField) (err error) {
	var d *gorm.DB
	m := map[string]any{}
	for i := range fields {
		m["classify_type"] = fields[i].ClassifyType
		m["subject_id"] = fields[i].SubjectID
		m["match_score"] = fields[i].MatchScore
		d = r.db.WithContext(ctx).
			Model(&model.FormViewField{}).
			Where("id = ? and (classify_type != 2 or classify_type is null or (classify_type = 2 and (subject_id is null or subject_id = '')))", fields[i].ID).
			Updates(m)
		if d.Error != nil {
			return d.Error
		}
	}
	return nil
}

func (r *formViewFieldRepo) BatchUpdateFieldGrade(ctx context.Context, fields []*model.FormViewField) (err error) {
	var d *gorm.DB
	m := map[string]any{}
	for i := range fields {
		m["grade_type"] = fields[i].GradeType
		m["grade_id"] = fields[i].GradeID
		d = r.db.WithContext(ctx).
			Model(&model.FormViewField{}).
			Where("id = ? and (classify_type != 2 or classify_type is null or (classify_type = 2 and (subject_id is null or subject_id = ''))) and (grade_type != 2 or grade_type is null or grade_type = 2)", fields[i].ID).
			Updates(m)
		if d.Error != nil {
			return d.Error
		}
	}
	return nil
}

func (r *formViewFieldRepo) GetViewIdByFieldCodeTableId(ctx context.Context, codeTableIds []string) (viewIds []string, err error) {
	err = r.db.WithContext(ctx).Select("DISTINCT form_view_id").Model(&model.FormViewField{}).Where("code_table_id in ?", codeTableIds).Find(&viewIds).Error
	if err != nil {
		return nil, err
	}
	return viewIds, nil
}
func (r *formViewFieldRepo) GetViewIdByFieldStandardCode(ctx context.Context, StandardCodes []string) (viewIds []string, err error) {
	err = r.db.WithContext(ctx).Select("DISTINCT form_view_id").Model(&model.FormViewField{}).Where("standard_code in ?", StandardCodes).Find(&viewIds).Error

	if err != nil {
		return nil, err
	}
	return viewIds, nil
}
func (r *formViewFieldRepo) GetByIds(ctx context.Context, ids []string) (formViewFields []*model.FormViewField, err error) {
	err = r.db.WithContext(ctx).Where("id in ?", ids).Where("deleted_at = 0").Find(&formViewFields).Error
	return
}

func (r *formViewFieldRepo) GroupBySubjectId(ctx context.Context) ([]*model.FormViewFieldGroup, error) {
	var groups []*model.FormViewFieldGroup

	// 使用原生SQL进行分组统计，处理subject_id为null或空字符串的情况
	err := r.db.WithContext(ctx).Raw(`
		SELECT 
			CASE 
				WHEN subject_id IS NULL OR subject_id = '' THEN '未分类'
				ELSE subject_id 
			END as subject_id,
			COUNT(*) as count
		FROM form_view_field
		WHERE deleted_at = 0
		GROUP BY 
			CASE 
				WHEN subject_id IS NULL OR subject_id = '' THEN '未分类'
				ELSE subject_id 
			END
	`).Scan(&groups).Error

	if err != nil {
		return nil, err
	}

	return groups, nil
}

func (r *formViewFieldRepo) ViewFieldCount(ctx context.Context, ids []string) (count []*form_view_field.ViewFieldCount, err error) {
	sql := `
		SELECT form_view_id,count(form_view_field_id) count FROM af_main.form_view_field where deleted_at = 0 and form_view_id in ?  group by form_view_id  
	`
	if err = r.db.WithContext(ctx).Raw(sql, ids).Scan(&count).Error; err != nil {
		return
	}
	return
}
