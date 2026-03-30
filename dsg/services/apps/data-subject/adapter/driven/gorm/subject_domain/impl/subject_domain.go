package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"time"

	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/data_subject"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/subject_domain"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type subjectDomainRepo struct {
	db *gorm.DB
}

func NewSubjectDomainRepo(db *gorm.DB) subject_domain.SubjectDomainRepo {
	return &subjectDomainRepo{db: db}
}

func (s *subjectDomainRepo) List(ctx context.Context, parentID string, isAll bool, query request.PageInfoWithKeyword, objectType string, needCount bool) (models []*model.SubjectDomain, total int64, err error) {
	do := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain)
	sql := "select * from subject_domain "
	tmp := ""
	countSql := ""
	if parentID != "" {
		var parent *model.SubjectDomain
		err := s.db.WithContext(ctx).Where("id = ?", parentID).First(&parent).Error
		if err != nil {
			log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
			return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if !isAll {
			tmp = fmt.Sprintf("where path_id like \"%s\" and path_id not like \"%s\" ", parent.PathID+"/%", parent.PathID+"/%/%")
		} else {
			tmp = fmt.Sprintf("where path_id like \"%s\" ", parent.PathID+"/%")
		}
	} else {
		if !isAll {
			tmp = fmt.Sprintf("where type = %d ", constant.SubjectDomainGroup)
		}
	}
	if query.Keyword != "" {
		query.Keyword = "%" + util.KeywordEscape(query.Keyword) + "%"
		if len(tmp) > 0 {
			tmp = fmt.Sprintf("%s and name like \"%s\" ", tmp, query.Keyword)
		} else {
			tmp = fmt.Sprintf("where name like \"%s\" ", query.Keyword)
		}
	}
	if objectType != "" && isAll {
		arr := strings.Split(objectType, ",")
		if len(tmp) > 0 {
			if len(arr) == 1 {
				tmp = fmt.Sprintf("%s and type = %d ", tmp, constant.SubjectDomainObjectStringToInt(arr[0]))
			} else {
				for i := range arr {
					if i == 0 {
						tmp = fmt.Sprintf("%s and (type = %d ", tmp, constant.SubjectDomainObjectStringToInt(arr[i]))
					} else {
						tmp = fmt.Sprintf("%s or type = %d ", tmp, constant.SubjectDomainObjectStringToInt(arr[i]))
					}
				}
				tmp += ")"
			}
		} else {
			if len(arr) == 1 {
				tmp = fmt.Sprintf("%s where type = %d ", tmp, constant.SubjectDomainObjectStringToInt(arr[0]))
			} else {
				for i := range arr {
					if i == 0 {
						tmp = fmt.Sprintf("%s where (type = %d ", tmp, constant.SubjectDomainObjectStringToInt(arr[i]))
					} else {
						tmp = fmt.Sprintf("%s or type = %d", tmp, constant.SubjectDomainObjectStringToInt(arr[i]))
					}
				}
				tmp += ")"
			}
		}
	}
	if len(tmp) > 0 {
		tmp = fmt.Sprintf("%s and deleted_at = 0", tmp)
	} else {
		tmp = fmt.Sprintf("where deleted_at = 0")
	}
	if needCount {
		countSql = fmt.Sprintf("select count(*) from subject_domain %s", tmp)
		err = do.Raw(countSql).Count(&total).Error
		if err != nil {
			log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
			return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	}
	if query.Sort == "" || query.Sort == "name" {
		sql = fmt.Sprintf("%s %s order by name %s", sql, tmp, query.Direction)
	} else {
		sql = fmt.Sprintf("%s %s order by %s %s", sql, tmp, query.Sort, query.Direction)
	}
	if query.Limit > 0 {
		query.Offset = query.Limit * (query.Offset - 1)
		sql = fmt.Sprintf("%s limit %d offset %d", sql, query.Limit, query.Offset)
	}

	err = do.Raw(sql).Scan(&models).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return models, total, nil
}

func (s *subjectDomainRepo) GroupHasChild(ctx context.Context) (models map[string]bool, err error) {
	db := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain)
	raw := `select ss.root_id, ss.plen from (select SUBSTRING(sd.path_id,1,36) as root_id, LENGTH(sd.path_id) as 
    	plen from af_main.subject_domain sd  where sd.deleted_at=0 having plen>36 ) ss  group by ss.root_id`
	datas := make([]model.HasChildModel, 0)
	err = db.Raw(raw).Scan(&datas).Error
	if err != nil {
		return nil, err
	}
	models = make(map[string]bool)
	for _, data := range datas {
		models[data.RootID] = true
	}
	return models, nil
}

func (s *subjectDomainRepo) ListChild(ctx context.Context, parentID string, secondChild bool) (models []*model.SubjectDomain, err error) {
	do := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain)
	sql := "select * from subject_domain "
	tmp := ""
	if parentID != "" {
		var parent *model.SubjectDomain
		err := s.db.WithContext(ctx).Where("id = ?", parentID).First(&parent).Error
		if err != nil {
			log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if secondChild {
			tmp = fmt.Sprintf("where path_id like \"%s\" and (type = %d or type = %d)", parent.PathID+"/%/%/%", constant.LogicEntity, constant.Attribute)
		} else {
			tmp = fmt.Sprintf("where path_id like \"%s\" and path_id not like \"%s\" ", parent.PathID+"/%/%", parent.PathID+"/%/%/%")
		}
	} else {
		tmp = fmt.Sprintf("where type = %d ", constant.SubjectDomain)
	}
	sql = fmt.Sprintf("%s %s and deleted_at = 0 order by path_id asc", sql, tmp)

	err = do.Raw(sql).Scan(&models).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return models, nil
}

func (s *subjectDomainRepo) GetObjectAndChildByIDSlice(ctx context.Context, ids ...string) (objects []*model.SubjectDomainWithRelation, err error) {
	rawSQL := "select sd.*, substring(sd.path_id, 75,36) as `related_object_id` from af_main.subject_domain sd  " +
		" having `related_object_id` in (?)"
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Raw(rawSQL, ids).Scan(&objects).Error
	return objects, nil
}

func (s *subjectDomainRepo) GetObjectByID(ctx context.Context, id string) (object *model.SubjectDomain, err error) {
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("id = ?", id).First(&object).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object form db", zap.String("object id", id), zap.Error(err))
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(my_errorcode.ObjectNotExist, err.Error())
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return object, nil
}
func (s *subjectDomainRepo) GetObjectByIDNative(ctx context.Context, id string) (object *model.SubjectDomain, err error) {
	if err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("id = ?", id).First(&object).Error; err != nil {
		log.WithContext(ctx).Error("failed to get object form db", zap.String("object id", id), zap.Error(err))
	}
	return
}

func (s *subjectDomainRepo) GetBusinessObjectByIDS(ctx context.Context, ids []string) ([]*model.SubjectDomain, error) {
	objects := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("id IN ? and (type = ? or type = ?)", ids, constant.BusinessObject, constant.BusinessActivity).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}

func (s *subjectDomainRepo) GetBusinessObjectAndLogicEntityByIDS(ctx context.Context, ids []string) ([]*model.SubjectDomain, error) {
	objects := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("id IN ? and (type = ? or type = ? or type = ?)", ids, constant.BusinessObject, constant.BusinessActivity, constant.LogicEntity).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}

func (s *subjectDomainRepo) GetObjectsByParentID(ctx context.Context, pathID string, objectType int8) (objects []*model.SubjectDomain, err error) {
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ? and type = ?", pathID+"/%", objectType).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}

// GetByParentID 获取自身及所有下属子节点
func (s *subjectDomainRepo) GetByParentID(ctx context.Context, pathID string) (objects []*model.SubjectDomain, err error) {
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ?", pathID+"%").Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}

func (s *subjectDomainRepo) Insert(ctx context.Context, m *model.SubjectDomain) error {
	err1 := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		has, err := nameExistCheck(tx, util.GetParentID(m.PathID), m.ID, m.Name)
		if err != nil {
			return err
		}
		if has {
			return errorcode.Desc(my_errorcode.NameRepeat)
		}
		return tx.Table(model.TableNameSubjectDomain).Debug().Create(m).Error
	})
	if err1 == nil {
		return nil
	}
	if errorcode.IsErrorCode(err1) {
		return err1
	}
	log.WithContext(ctx).Errorf("failed to access database while insert, err info: %v", err1.Error())
	return errorcode.Detail(errorcode.PublicDatabaseError, err1.Error())
}

func (s *subjectDomainRepo) InsertBatch(ctx context.Context, subjectDomains []*model.SubjectDomain) error {
	return s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).CreateInBatches(subjectDomains, len(subjectDomains)).Error
}

func (s *subjectDomainRepo) Delete(ctx context.Context, pathID string) error {
	var objects []*model.SubjectDomain
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ?", pathID+"%").Delete(&objects).Error
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (s *subjectDomainRepo) Update(ctx context.Context, m *model.SubjectDomain, objects []*model.SubjectDomain) error {
	if err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Select("name", "description", "type", "owners", "updated_by_uid").Where("`id`=?", m.ID).Updates(m).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err.Error())
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	for _, obj := range objects {
		if err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("`id`=?", obj.ID).Update("path", obj.Path).Error; err != nil {
			log.WithContext(ctx).Errorf("failed to access db, err: %v", err.Error())
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
	}
	return nil
}

func nameExistCheck(tx *gorm.DB, parentId, id, name string) (bool, error) {
	do := tx.Table(model.TableNameSubjectDomain).Where("name = ?", name)
	var objects []*model.SubjectDomain
	if id != "" {
		do = do.Where("id != ?", id)
	}
	if parentId == "" {
		do = do.Where("path_id like ? and path_id not like ?", "%", "%/%")
	} else {
		path1 := "%" + parentId + "/%"
		path2 := "%" + parentId + "/%/%"
		do = do.Where("path_id like ? and path_id not like ?", path1, path2)
	}
	if err := do.Find(&objects).Error; err != nil {
		return false, err
	}
	return len(objects) > 0, nil
}

func (s *subjectDomainRepo) NameExistCheck(ctx context.Context, parentId, id, name string) (has bool, err error) {
	err1 := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		has, err = nameExistCheck(tx, parentId, id, name)
		return err
	})
	if err1 != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err.Error())
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return has, nil
}

func (s *subjectDomainRepo) GetDeleteEntityID(ctx context.Context, pathID string, updateID []string) ([]*data_view.MoveDelete, error) {
	dbEntity := make([]*model.SubjectDomain, 0)
	if err := s.db.Table(model.TableNameSubjectDomain).Where("path_id like ? and type = ? and id not in ?",
		pathID+"/%", constant.LogicEntity, updateID).Unscoped().Find(&dbEntity).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return util.Gen(dbEntity, func(domain *model.SubjectDomain) *data_view.MoveDelete {
		return &data_view.MoveDelete{
			SubjectDomainID: domain.PathID[37:73],
			LogicEntityID:   domain.ID,
		}
	}), nil
}

func (s *subjectDomainRepo) GetBatchDeleteEntityID(ctx context.Context, objectID []string, updateID []string) ([]*data_view.MoveDelete, error) {
	if len(objectID) <= 0 {
		return []*data_view.MoveDelete{}, nil
	}

	db := s.db.WithContext(ctx).Model(new(model.SubjectDomain))
	condition := ""
	for i, objID := range objectID {
		condition += fmt.Sprintf(" path_id like '%s' ", "%"+objID+"%")
		if i < len(objectID)-1 {
			// condition += condition + " or "
			condition = condition + " or "
		}
	}
	dbEntity := make([]*model.SubjectDomain, 0)
	if err := db.Where(condition).Where(" type = ? and id not in ? ", constant.LogicEntity,
		updateID).Unscoped().Find(&dbEntity).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access db, err: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return util.Gen(dbEntity, func(domain *model.SubjectDomain) *data_view.MoveDelete {
		return &data_view.MoveDelete{
			SubjectDomainID: domain.PathID[37:73],
			LogicEntityID:   domain.ID,
		}
	}), nil
}

func (s *subjectDomainRepo) UpdateBusinessObject(ctx context.Context, pathID, refID, updatedBy string, entities []*model.SubjectDomain, attrs []*model.SubjectDomain) error {
	var attributes []*model.SubjectDomain
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ? and type = ?", pathID+"/%", constant.Attribute).Find(&attributes).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	addAttrs := make([]*model.SubjectDomain, 0)
	updateAttrs := make([]*model.SubjectDomain, 0)
	idSet := map[string]struct{}{}
	for _, attr := range attributes {
		if _, ok := idSet[attr.ID]; !ok {
			idSet[attr.ID] = struct{}{}
		}
	}
	for _, attr := range attrs {
		_, ok := idSet[attr.ID]
		if ok {
			updateAttrs = append(updateAttrs, attr)
			delete(idSet, attr.ID)
		} else {
			addAttrs = append(addAttrs, attr)
		}
	}
	ids := make([]string, 0)
	for id := range idSet {
		ids = append(ids, id)
	}
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		logicEntities := make([]*model.SubjectDomain, 0)
		if err = tx.Table(model.TableNameSubjectDomain).Where("path_id like ? and type = ?", pathID+"/%", constant.LogicEntity).Unscoped().Delete(&logicEntities).Error; err != nil {
			return err
		}
		if err = tx.Table(model.TableNameSubjectDomain).CreateInBatches(entities, 100).Error; err != nil {
			return err
		}
		if len(ids) > 0 {
			// 删除属性
			attrs := make([]*model.SubjectDomain, 0)
			err = tx.Table(model.TableNameSubjectDomain).Where("id IN ?", ids).Unscoped().Delete(&attrs).Error
		}
		if len(updateAttrs) > 0 {

			// 更新属性
			for _, attr := range updateAttrs {
				if err := tx.Table(model.TableNameSubjectDomain).Debug().Select("name", "path_id", "path", "unique", "standard_id", "updated_by_uid", "label_id").Where("id = ?", attr.ID).Updates(&attr).Error; err != nil {
					return err
				}
			}
		}
		if len(addAttrs) > 0 {
			// 新建属性
			if err := tx.Table(model.TableNameSubjectDomain).Debug().CreateInBatches(addAttrs, 100).Error; err != nil {
				return err
			}
		}
		// 更新业务对象/业务活动引用的对象
		if err := tx.Table(model.TableNameSubjectDomain).Where("path_id=?", pathID).Debug().UpdateColumns(map[string]interface{}{
			"ref_id":         refID,
			"updated_by_uid": updatedBy,
			"updated_at":     time.Now(),
		}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}
func (s *subjectDomainRepo) BatchUpdateBusinessObject(ctx context.Context, formEntitiesID, objectIds []string, updatedBy string, entities []*model.SubjectDomain, deleteAttrs []string, updateAttrs []*model.SubjectDomain, addAttrs []*model.SubjectDomain) error {
	if err := s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		logicEntities := make([]*model.SubjectDomain, 0)
		if err = tx.Table(model.TableNameSubjectDomain).Where("type = ? and substring(path_id,75,36) in ? and id in ?",
			constant.LogicEntity, objectIds, formEntitiesID).Unscoped().Delete(&logicEntities).Error; err != nil {
			return err
		}

		if err = tx.Table(model.TableNameSubjectDomain).CreateInBatches(entities, len(entities)).Error; err != nil {
			return err
		}

		if len(deleteAttrs) > 0 {
			// 删除属性
			attrs := make([]*model.SubjectDomain, 0)
			err = tx.Table(model.TableNameSubjectDomain).Where("id IN ?", deleteAttrs).Unscoped().Delete(&attrs).Error
		}
		if len(updateAttrs) > 0 {
			// 更新属性
			for _, attr := range updateAttrs {
				if err := tx.Table(model.TableNameSubjectDomain).Select("name", "path_id", "path", "unique", "standard_id", "updated_by_uid", "label_id").Where("id = ? ", attr.ID).Updates(&attr).Error; err != nil {
					return err
				}
			}
		}
		if len(addAttrs) > 0 {
			// 新建属性
			if err := tx.Table(model.TableNameSubjectDomain).CreateInBatches(addAttrs, 100).Error; err != nil {
				return err
			}
		}
		// 更新业务对象/业务活动引用的对象
		if err := tx.Table(model.TableNameSubjectDomain).Where("id in ?", objectIds).UpdateColumns(map[string]interface{}{
			"updated_by_uid": updatedBy,
			"updated_at":     time.Now(),
		}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (s *subjectDomainRepo) CreateOrUpdateBusinessObject(ctx context.Context, isNew bool, businessObject *model.SubjectDomain, updatedBy string, entities, attrs []*model.SubjectDomain) error {
	var attributes []*model.SubjectDomain
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ? and type = ?", businessObject.PathID+"/%", constant.Attribute).Find(&attributes).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	addAttrs := make([]*model.SubjectDomain, 0)
	updateAttrs := make([]*model.SubjectDomain, 0)
	idSet := map[string]struct{}{}
	for _, attr := range attributes {
		if _, ok := idSet[attr.ID]; !ok {
			idSet[attr.ID] = struct{}{}
		}
	}
	for _, attr := range attrs {
		_, ok := idSet[attr.ID]
		if ok {
			updateAttrs = append(updateAttrs, attr)
			delete(idSet, attr.ID)
		} else {
			addAttrs = append(addAttrs, attr)
		}
	}
	ids := make([]string, 0)
	for id := range idSet {
		ids = append(ids, id)
	}
	if err = s.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if isNew {
			if err := tx.Table(model.TableNameSubjectDomain).Create(businessObject).Error; err != nil {
				return err
			}
		}
		logicEntities := make([]*model.SubjectDomain, 0)
		if err = tx.Table(model.TableNameSubjectDomain).Where("path_id like ? and type = ?", businessObject.PathID+"/%", constant.LogicEntity).Unscoped().Delete(&logicEntities).Error; err != nil {
			return err
		}
		if err := tx.Table(model.TableNameSubjectDomain).CreateInBatches(entities, 100).Error; err != nil {
			return err
		}
		if len(ids) > 0 {
			// 删除属性
			attrs := make([]*model.SubjectDomain, 0)
			err = tx.Table(model.TableNameSubjectDomain).Where("id IN ?", ids).Unscoped().Delete(&attrs).Error
		}
		if len(updateAttrs) > 0 {
			// 更新属性
			for _, attr := range updateAttrs {
				if err := tx.Table(model.TableNameSubjectDomain).Select("name", "path_id", "path", "unique", "standard_id", "updated_by_uid").Where("id = ?", attr.ID).Updates(&attr).Error; err != nil {
					return err
				}
			}
		}
		if len(addAttrs) > 0 {
			// 新建属性
			if err := tx.Table(model.TableNameSubjectDomain).CreateInBatches(addAttrs, 100).Error; err != nil {
				return err
			}
		}
		// 更新业务对象/业务活动引用的对象
		if err := tx.Table(model.TableNameSubjectDomain).Where("path_id=?", businessObject.PathID).UpdateColumns(map[string]interface{}{
			"updated_by_uid": updatedBy,
			"updated_at":     time.Now(),
		}).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (s *subjectDomainRepo) GetByBusinessObjectId(ctx context.Context, objectId string) ([]*model.SubjectDomain, error) {
	res := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ?", "%"+objectId+"%").Find(&res).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return res, nil
}

func (s *subjectDomainRepo) GetLevelCount(ctx context.Context, parentID string) (count *model.SubjectDomainCount, groupCount []*subject_domain.SubjectDomainGroupCount, err error) {
	var path string
	if parentID == "" {
		sql := "SELECT id,`name`,count FROM subject_domain JOIN (SELECT  SUBSTR(path_id,1,36) group_id,COUNT(1) count FROM subject_domain WHERE type=5 AND deleted_at = 0 GROUP BY SUBSTR(path_id,1,36)) s ON s.group_id=id WHERE deleted_at = 0 "
		if err = s.db.WithContext(ctx).Raw(sql).Scan(&groupCount).Error; err != nil {
			log.WithContext(ctx).Errorf("failed to groupCount database, err info: %v", err.Error())
			return
		}
		path = "%"
	} else {
		path = "%" + parentID + "/%"
	}
	sql := "select count(case when `type`=1 then null end) level_business_domain, " +
		"count(case when `type`=2 then null end) level_subject_domain, " +
		"count(case when (`type`=3 or `type`=4) then null end) level_business_object, " +
		"count(case when `type`=3 then null end) level_business_obj, " +
		"count(case when `type`=4 then null end) level_business_act, " +
		"count(case when `type`=5 then null end) level_logic_entities, " +
		"count(case when `type`=6 then null end) level_attributes " +
		"from subject_domain sd  where sd.deleted_at=0 and sd.path_id like ? ;"
	counts := make([]*model.SubjectDomainCount, 0)
	err = s.db.WithContext(ctx).Raw(sql, path).Scan(&counts).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
	}
	if len(counts) > 0 {
		count = counts[0]
	}
	return count, groupCount, err
}

func (s *subjectDomainRepo) GetFormAttributeByObject(ctx context.Context, id string, logicalEntityID []string) (attributeIds []string, err error) {
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Select("id").
		Where("path_id like ? and type = ?", "%"+id+"/%", constant.Attribute).
		Where("substr(path_id ,112, 36) in ?", logicalEntityID).Find(&attributeIds).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return attributeIds, nil
}

func (s *subjectDomainRepo) GetAttributeByObject(ctx context.Context, id string) ([]string, error) {
	AttributeIds := make([]string, 0)
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Select("id").Where("path_id like ? and type = ?", "%"+id+"/%", constant.Attribute).Find(&AttributeIds).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return AttributeIds, nil
}

func (s *subjectDomainRepo) GetAttributeByID(ctx context.Context, id string) ([]*model.SubjectDomain, error) {
	attributes := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ? and type = ?",
		"%"+id+"%", constant.Attribute).Find(&attributes).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, err
	}
	return attributes, nil
}

func (s *subjectDomainRepo) GetSpecialChildByID(ctx context.Context, id string, childType int8) (child []*model.SubjectDomain, err error) {
	db := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain)
	err = db.Select("id").Where("path_id like ? and type = ?", "%"+id+"/%", childType).Find(&child).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return child, nil
}

func (s *subjectDomainRepo) GetBusinessObjectInfoByNames(ctx context.Context, names []string) ([]*model.SubjectDomain, error) {
	objects := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where(fmt.Sprintf("`name` in ('%s') and (type = ? or type = ?)", strings.Join(names, "','")), constant.BusinessObject, constant.BusinessActivity).Find(&objects).Error
	return objects, err
}

func (s *subjectDomainRepo) GetDeletedSubjectDomains(ctx context.Context) (ids []string, err error) {
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Select("id").Where("type = ? and deleted_at > 0", constant.SubjectDomain).Unscoped().Find(&ids).Error
	return ids, err
}

var AttributesHadBind = errors.New("AttributesHadBind")

func (s *subjectDomainRepo) GetObjectByIDS(ctx context.Context, ids []string, objectType int8) ([]*model.SubjectDomain, error) {
	objects := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Where("id IN ? and type = ?", ids, objectType).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}
func (s *subjectDomainRepo) NameExist(ctx context.Context, parentId string, name []string) error {
	objects := make([]*model.SubjectDomain, 0)
	path1 := "%" + parentId + "/%"
	path2 := "%" + parentId + "/%/%"
	err := s.db.WithContext(ctx).Where("path_id like ? and path_id not like ? and name IN ? ", path1, path2, name).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(objects) > 0 {
		return errorcode.Desc(my_errorcode.NameRepeat)
	}
	return nil

}
func (s *subjectDomainRepo) GetByIDS(ctx context.Context, ids []string) ([]*model.SubjectDomain, error) {
	objects := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Where("id IN ? ", ids).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}

// GetRootRelation  查询所有节点和他的根节点
func (s *subjectDomainRepo) GetRootRelation(ctx context.Context) (map[string]string, error) {
	objects := make([]*model.SubjectDomainSimple, 0)
	results := make(map[string]string)
	db := s.db.WithContext(ctx)
	raw := "select sd.id, sd.path_id, substring(sd.path_id, 1, 36) as root_id from af_main.subject_domain sd where sd.deleted_at=0"
	if err := db.Raw(raw).Scan(&objects).Error; err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return results, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	for _, obj := range objects {
		results[obj.ID] = obj.RootID
	}
	return results, nil
}

// GetSubjectByPathName 根据业务对象路径查询业务对象
func (s *subjectDomainRepo) GetSubjectByPathName(ctx context.Context, paths []string) (resultMap map[string]*CommonRest.DataSubjectInternal, err error) {
	objects := make([]*model.SubjectDomain, 0)
	resultMap = make(map[string]*CommonRest.DataSubjectInternal)
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path IN ? ", paths).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return resultMap, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	for _, object := range objects {
		resultMap[object.Path] = &CommonRest.DataSubjectInternal{
			DomainID:    object.DomainID,
			ID:          object.ID,
			Name:        object.Name,
			Description: object.Description,
			PathID:      object.PathID,
			Path:        object.Path,
			Type:        object.Type,
			Owners:      util.CE(len(object.Owners) > 0, object.Owners[0], "").(string),
		}
	}
	return
}

func (s *subjectDomainRepo) DeleteLabels(ctx context.Context, labelIDS []string) error {
	err := s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Debug().Where("label_id in  ?", labelIDS).Update("label_id", "").Error
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (s *subjectDomainRepo) GetAttribute(ctx context.Context, id, parent_id, keyword string, recommendAttributes []string) ([]*model.SubjectDomain, error) {
	whereSql := fmt.Sprintf("type = %d", constant.Attribute)

	if id != "" {
		whereSql = fmt.Sprintf("%s and id = \"%s\" ", whereSql, id)
	}
	if parent_id != "" {
		whereSql = fmt.Sprintf("%s and path_id like \"%s\" ", whereSql, "%"+parent_id+"/%")
	}
	if keyword != "" {
		keyword = "%" + util.KeywordEscape(keyword) + "%"
		whereSql = fmt.Sprintf("%s and name like \"%s\" ", whereSql, keyword)
	}

	var orderSql string
	if recommendAttributes != nil {
		var sql string
		for _, recommendAttribute := range recommendAttributes {
			if sql == "" {
				sql = fmt.Sprintf("\"%s\"", recommendAttribute)
			} else {
				sql = fmt.Sprintf("%s,\"%s\" ", sql, recommendAttribute)
			}

		}
		orderSql = fmt.Sprintf("Field(id, %s ) desc", sql)
	}

	attributes := make([]*model.SubjectDomain, 0)
	err := s.db.WithContext(ctx).Debug().Where(whereSql).Order(orderSql).Find(&attributes).Error

	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return attributes, nil
}

// GetSubOrTopByID 如果ID是空，获取所有顶层的业务域分组，如果不是空，获取该节点下的所有子节点
func (s *subjectDomainRepo) GetSubOrTopByID(ctx context.Context, id string) (objects []*model.SubjectDomain, err error) {
	if id != "" {
		err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("path_id like ?", id+"%").Find(&objects).Error
	} else {
		err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Where("type=?", constant.SubjectDomainGroup).Find(&objects).Error
	}
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}

func (s *subjectDomainRepo) GetAttribuitByPath(ctx context.Context, path string) (*model.SubjectDomain, error) {
	var subjectDomain *model.SubjectDomain
	if err := s.db.WithContext(ctx).Where("path=?", path).Take(&subjectDomain).Error; err != nil {
		fmt.Println(err)
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		} else {
			return nil, err
		}
	}
	return subjectDomain, nil
}

func (s *subjectDomainRepo) ImportSubDomainsBatch(ctx context.Context, subjectDomains []*model.SubjectDomain) error {
	return s.db.Transaction(func(tx *gorm.DB) error {
		for _, subjectDomain := range subjectDomains {
			var parentPath string
			path := subjectDomain.Path
			if !strings.Contains(path, "/") {
				parentPath = subjectDomain.Path
			} else {
				parentPath = path[:len(path)-len(subjectDomain.Name)-1]
			}
			var parentSubjectDomain *model.SubjectDomain
			if err := tx.WithContext(ctx).Where("path=?", parentPath).Take(&parentSubjectDomain).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					// 数据库不存在什么都不做
				} else {
					return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
				}
			}
			// 创建
			var existSubjectDomain *model.SubjectDomain
			if err := tx.WithContext(ctx).Where("path=?", subjectDomain.Path).Take(&existSubjectDomain).Error; err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					if parentSubjectDomain != nil && parentSubjectDomain.PathID != "" {
						subjectDomain.PathID = parentSubjectDomain.PathID + "/" + subjectDomain.ID
					}
					if err := tx.WithContext(ctx).Debug().Create(subjectDomain).Error; err != nil {
						return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
					}
					continue
				} else {
					return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
				}
			}

			// 更新
			if subjectDomain.Path == existSubjectDomain.Path {
				// existSubjectDomain.Name = subjectDomain.Name
				// existSubjectDomain.Description = subjectDomain.Description
				// existSubjectDomain.Path = subjectDomain.Path
				// existSubjectDomain.Owners = subjectDomain.Owners
				// existSubjectDomain.UpdatedByUID = subjectDomain.UpdatedByUID
				// existSubjectDomain.Unique = subjectDomain.Unique
				// if err := tx.WithContext(ctx).Debug().Updates(&existSubjectDomain).Error; err != nil {
				// 	log.WithContext(ctx).Errorf("failed to access db, err: %v", err.Error())
				// 	return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
				// }

				if err := tx.WithContext(ctx).Select(
					"name",
					"path",
					"unique",
					// "standard_id",
					"description",
					"owner",
					"label_id",
					"updated_by_uid",
				).Where("id = ?", existSubjectDomain.ID).Updates(&subjectDomain).Error; err != nil {
					log.WithContext(ctx).Errorf("failed to access db, err: %v", err.Error())
					return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
				}
			}
		}
		return nil
	})
}

func (s *subjectDomainRepo) GetObjectsByLogicEntityID(ctx context.Context, id string) (objects []*model.SubjectDomain, err error) {
	object := &model.SubjectDomain{}
	err = s.db.WithContext(ctx).Table(model.TableNameSubjectDomain).Debug().Where("id = ?", id).First(object).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object form db", zap.String("object id", id), zap.Error(err))
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(my_errorcode.BusinessObjectNotExist, err.Error())
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	err = s.db.WithContext(ctx).Debug().Table(model.TableNameSubjectDomain).Where("path_id like ? or id in ?", object.PathID+"/%", strings.Split(object.PathID, "/")).Find(&objects).Error
	if err != nil {
		log.WithContext(ctx).Errorf("failed to access database, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objects, nil
}
