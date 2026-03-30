package impl

import (
	"context"

	repo "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/form_subject_relation"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"gorm.io/gorm"
)

type formBusinessObjectRelationRepoImpl struct {
	db *gorm.DB
}

func NewRepoImpl(db *gorm.DB) repo.Repo {
	return &formBusinessObjectRelationRepoImpl{db: db}
}

func (f *formBusinessObjectRelationRepoImpl) Get(c context.Context, fid string) (subjects []*model.SubjectDomainWithRelation, err error) {
	subjectSQL := "select distinct(r.business_object_id) from af_main.form_business_object_relation r where r.form_id =? "
	var businessObjectIDSlice []string
	err = f.db.WithContext(c).Raw(subjectSQL, fid).Scan(&businessObjectIDSlice).Error
	if err != nil {
		return nil, err
	}

	if len(businessObjectIDSlice) <= 0 {
		return subjects, nil
	}
	//查询所有的业务对象
	sql := "select  fbor.form_id,fbor.field_id as related_field_id," +
		"fbor.form_id as related_form_id,sd.related_object_id," +
		"sd.*  from  (select substring(s.path_id, 75,36) as  " +
		"related_object_id, s.* from  af_main.subject_domain s where type>=3) sd  " +
		"left join af_main.form_business_object_relation fbor on  sd.id=fbor.attribute_id " +
		"where  sd.related_object_id in (?) and sd.deleted_at=0 and  " +
		"(fbor.form_id=? or fbor.form_id is null ) order by sd.domain_id asc"
	err = f.db.WithContext(c).Raw(sql, businessObjectIDSlice, fid).Scan(&subjects).Error
	return subjects, err
}

func (f *formBusinessObjectRelationRepoImpl) Update(c context.Context, formId string, relations []*model.FormBusinessObjectRelation) error {
	err := f.db.WithContext(c).Transaction(func(tx *gorm.DB) error {
		//删除所有
		if err := tx.Where("form_id=?", formId).Delete(&model.FormBusinessObjectRelation{}).Error; err != nil {
			return err
		}
		if len(relations) <= 0 {
			return nil
		}
		//插入所有
		return tx.Create(relations).Error
	})
	return err
}

func (f *formBusinessObjectRelationRepoImpl) Remove(c context.Context, formId ...string) error {
	err := f.db.WithContext(c).Where("form_id in ?", formId).Delete(&model.FormBusinessObjectRelation{}).Error
	return err
}

func (f *formBusinessObjectRelationRepoImpl) GetFormEntities(c context.Context, fid string) (businessObjectIDSlice []string, err error) {
	subjectSQL := "select distinct(logical_entity_id) from form_business_object_relation fbor  where fbor.form_id = ?"
	err = f.db.WithContext(c).Raw(subjectSQL, fid).Scan(&businessObjectIDSlice).Error
	return
}
