package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type businessStructureRepo struct {
	q *query.Query
}

func NewBusinessStructureRepo(q *query.Query) business_structure.Repo {
	return &businessStructureRepo{q: q}
}

func (b *businessStructureRepo) GetObjByID(ctx context.Context, id string) (obj *model.Object, err error) {
	do := b.q.Object.WithContext(ctx)
	obj, err = do.Where(b.q.Object.ID.Eq(id)).First()
	if err != nil {
		return nil, err
	}
	return obj, nil
}

func (b *businessStructureRepo) GetObjectsByIDs(ctx context.Context, ids []string) (objects []*model.Object, err error) {
	do := b.q.Object.WithContext(ctx)
	objects, err = do.Where(b.q.Object.ID.In(ids...)).Find()
	if err != nil {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return
}

/*
func (b *businessStructureRepo) GetChildObjectByID(ctx context.Context, upper string) (obj []*model.Object, err error) {
	do := b.q.Object.WithContext(ctx)
	//obj, err = do.Where(b.q.Object.PathID.Like("%" + upper + "%")).Where(b.q.Object.PathID.Length().Eq(37*depth - 1)).Find()
	if upper == "" {
		obj, err = do.Where(b.q.Object.PathID.Like("%")).Where(b.q.Object.PathID.NotLike("%/%")).Find()
	} else {
		obj, err = do.Where(b.q.Object.PathID.Like("%" + upper + "/%")).Where(b.q.Object.PathID.NotLike("%" + upper + "/%/%")).Find()
	}
	if err != nil {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return obj, nil
}
*/

func (b *businessStructureRepo) CreateIfNotExist(ctx context.Context, object *model.Object) (id string, err error) {
	err = b.q.Transaction(func(tx *query.Query) error {
		if object.ID != "" {
			existObj, err := b.GetObjByID(ctx, object.ID)
			if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
				return err
			}
			if existObj != nil {
				return nil
			}
		}
		if err = tx.Object.WithContext(ctx).Create(object); err != nil {
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return nil
	})
	return object.ID, err
}

func (b *businessStructureRepo) Create(ctx context.Context, object *model.Object) (id string, err error) {
	err = b.q.Transaction(func(tx *query.Query) error {
		if err = tx.Object.WithContext(ctx).Create(object); err != nil {
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return nil
	})
	return object.ID, err
}
func (b *businessStructureRepo) Update(ctx context.Context, id, name, attr string, objs []*model.Object) (err error) {
	return b.q.Transaction(func(tx *query.Query) error {
		do := tx.Object.WithContext(ctx)
		if name != "" {
			if attr == "" {
				// 名称非空，仅更新名称
				for _, obj := range objs {
					// 更新path
					_, err := do.Updates(obj)
					if err != nil {
						return err
					}
				}
				_, err = do.Where(b.q.Object.ID.Eq(id)).Update(b.q.Object.Name, name)
			} else {
				// 名称，attr都更新
				for _, obj := range objs {
					// 更新path
					_, err := do.Updates(obj)
					if err != nil {
						return err
					}
				}
				_, err = do.Where(b.q.Object.ID.Eq(id)).Select(b.q.Object.Attribute, b.q.Object.Name).Updates(&model.Object{Name: name, Attribute: attr})
			}
		} else {
			// 都为空，报错
			if attr == "" {
				return errorcode.Desc(errorcode.PublicDatabaseError)
			} else {
				// 仅更新attr
				_, err = do.Where(b.q.Object.ID.Eq(id)).Update(b.q.Object.Attribute, attr)
			}
		}
		return err
	})
}
func (b *businessStructureRepo) UpdateAttr(ctx context.Context, id, attr string) error {
	do := b.q.Object.WithContext(ctx)
	res, err := do.Where(b.q.Object.ID.Eq(id)).Update(b.q.Object.Attribute, attr)
	if err != nil {
		log.WithContext(ctx).Error("failed to update object attributes to db", zap.String("object id", id), zap.String("object attribute", attr), zap.Error(err))
		return err
	}
	if res.Error != nil {
		log.WithContext(ctx).Error("failed to update object attributes to db", zap.String("object id", id), zap.String("object attribute", attr), zap.Error(res.Error))
		return res.Error
	}
	return nil
}

func (b *businessStructureRepo) UpdateRegister(ctx context.Context, objs *model.Object) error {
	do := b.q.Object.WithContext(ctx)
	res, err := do.Where(b.q.Object.ID.Eq(objs.ID)).Updates(objs)
	if res.Error != nil {
		log.WithContext(ctx).Error("failed to update object attributes to db", zap.String("object id", objs.ID), zap.Error(res.Error))
		return res.Error
	}
	if err != nil {
		log.WithContext(ctx).Error("failed to update object name to db", zap.String("object id", objs.ID), zap.String("object name", objs.Name), zap.Error(err))
	}
	return err
}
func (b *businessStructureRepo) GetUniqueTag(ctx context.Context, tag string) (bool, error) {
	var exists bool
	objectDo := b.q.Object
	err := objectDo.WithContext(ctx).
		UnderlyingDB().
		Raw("SELECT EXISTS(SELECT 1 FROM `object` WHERE dept_tag = ?) AS `exists`", tag).
		Scan(&exists).Error

	if err != nil {
		return false, err
	}

	return exists, nil
}
func (b *businessStructureRepo) UpdatePath(ctx context.Context, id, name string, objs []*model.Object) (err error) {
	return b.q.Transaction(func(tx *query.Query) error {
		do := tx.Object.WithContext(ctx)
		for _, obj := range objs {
			// 更新path
			_, err = do.Updates(obj)
			if err != nil {
				return err
			}
		}
		if name != "" {
			_, err = do.Where(b.q.Object.ID.Eq(id)).Update(b.q.Object.Name, name)
		}
		return err
	})
}

/*
func (b *businessStructureRepo) Delete(ctx context.Context, ids []string) (models []*model.Object, err error) {
	var objects []*model.Object
	err = b.q.Transaction(func(tx *query.Query) error {
		objects, err = tx.Object.WithContext(ctx).Where(b.q.Object.ID.In(ids...)).Find()
		for _, object := range objects {
			models = append(models, object)
		}
		for _, id := range ids {
			id = "%" + id + "%"
			_, err = tx.Object.WithContext(ctx).Where(b.q.Object.PathID.Like(id)).Delete()
			if err != nil {
				return errorcode.Desc(errorcode.PublicDatabaseError)
			}
		}
		return nil
	})
	if err != nil {
		return nil, err
	}
	return models, nil
}
*/

func (b *businessStructureRepo) GetObject(ctx context.Context, id string) (detail *domain.ObjectVo, err error) {
	objectDo := b.q.Object
	err = objectDo.WithContext(ctx).UnderlyingDB().
		Raw("SELECT object.*, t_object_subtype.subtype,t_object_subtype.main_dept_type, l.liyue_id AS user_ids FROM object LEFT JOIN t_object_subtype ON object.id = t_object_subtype.id LEFT JOIN liyue_registrations l ON object.id COLLATE utf8mb4_unicode_ci = l.liyue_id COLLATE utf8mb4_unicode_ci WHERE object.id = ?", id).Find(&detail).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object form db", zap.String("object id", id), zap.Error(err))
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.BusinessStructureObjectRecordNotFoundError, err)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if detail.ID == "" {
		return nil, errorcode.Detail(errorcode.BusinessStructureObjectRecordNotFoundError, err)
	}

	return detail, nil
}

func (b *businessStructureRepo) GetObjectType(ctx context.Context, id string, typ int32) (detail *domain.ObjectVo, err error) {
	objectDo := b.q.Object

	// 构建 JOIN 类型和 WHERE 条件
	var joinType string
	var whereCondition string
	var params []interface{}

	if typ > 0 {
		joinType = "INNER"
		whereCondition = "WHERE l.liyue_id = ? AND l.type = ?"
		params = append(params, id, typ)
	} else {
		joinType = "LEFT"
		whereCondition = "WHERE `object`.id = ?"
		params = append(params, id)
	}

	// 拼接完整 SQL
	sql := fmt.Sprintf(`
		SELECT object.*, t_object_subtype.subtype,t_object_subtype.main_dept_type, l.user_id AS user_ids 
		FROM object 
		LEFT JOIN t_object_subtype ON object.id = t_object_subtype.id 
		%s JOIN liyue_registrations l ON object.id COLLATE utf8mb4_unicode_ci = l.liyue_id COLLATE utf8mb4_unicode_ci
		%s
	`, joinType, whereCondition)

	err = objectDo.WithContext(ctx).UnderlyingDB().
		Raw(sql, params...).
		Scan(&detail).Error

	if err != nil {
		log.WithContext(ctx).Error("failed to get object form db", zap.String("object id", id), zap.Error(err))
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.BusinessStructureObjectRecordNotFoundError, err)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	/*if detail.ID == "" {
		return nil, errorcode.Detail(errorcode.BusinessStructureObjectRecordNotFoundError, err)
	}*/

	return detail, nil
}

func (b *businessStructureRepo) ListByPaging(ctx context.Context, query *domain.QueryPageReqParam) (models []*domain.ObjectVo, total int64, err error) {
	objectDo := b.q.Object
	do := objectDo.WithContext(ctx)
	//var joinType string
	//if query.Registered != 0 {
	//	// 如果 IsRegister 有值，则使用 INNER JOIN
	//	joinType = "inner"
	//} else {
	//	// 否则保持 LEFT JOIN
	//	joinType = "left"
	//}

	sql := fmt.Sprintf(`select object.*,t_object_subtype.subtype,t_object_subtype.main_dept_type  from object  left join t_object_subtype on object.id = t_object_subtype.id  `)
	//%s join (
	//	SELECT liyue_id, user_id, id,
	//		   ROW_NUMBER() OVER (PARTITION BY liyue_id ORDER BY id DESC) as rn
	//	FROM liyue_registrations
	//) lr on object.id COLLATE utf8mb4_unicode_ci = lr.liyue_id COLLATE utf8mb4_unicode_ci
	//   AND lr.rn = 1`, joinType)

	tmp := ""
	countSql := ""
	if len(query.ID) > 0 {
		object, err := objectDo.WithContext(ctx).Where(objectDo.ID.Eq(query.ID)).First()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.WithContext(ctx).Error("specified object id not found", zap.Error(err), zap.String("id", query.ID))
			return nil, 0, errorcode.Detail(errorcode.BusinessStructureObjectNotFound, query.ID)
		}
		if err != nil {
			log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
			return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if !query.IsAll {
			tmp = fmt.Sprintf("where object.path_id like \"%s\" and object.path_id not like \"%s\" ", object.PathID+"/%", object.PathID+"/%/%")
		} else {
			tmp = fmt.Sprintf("where object.path_id like \"%s\" ", object.PathID+"/%")
		}
	} else {
		if !query.IsAll && query.Source != "register" {
			tmp = fmt.Sprintf("where object.type = 1 ")
		}
	}

	if query.IDs != "" {
		ids := strings.Split(query.IDs, ",")
		tmp = fmt.Sprintf(` where object.id in ('%s') `, strings.Join(ids, "','"))
	}

	if len(query.Keyword) > 0 {
		query.Keyword = "%" + common.KeywordEscape(query.Keyword) + "%"
		if len(tmp) > 0 {
			tmp = fmt.Sprintf("%s and object.name like \"%s\" ", tmp, query.Keyword)
		} else {
			tmp = fmt.Sprintf("where object.name like \"%s\" ", query.Keyword)
		}
	}
	if query.ThirdDeptId != "" {
		if len(tmp) > 0 {
			tmp = fmt.Sprintf("%s and and f_third_dept_id = %q ", tmp, common.KeywordEscape(query.ThirdDeptId))
		} else {
			tmp = fmt.Sprintf("where f_third_dept_id = %q ", common.KeywordEscape(query.ThirdDeptId))
		}
	}

	if query.Names != "" {
		names := strings.Split(query.Names, ",")
		tmp = fmt.Sprintf("where object.name in ('%v') ", strings.Join(names, "','"))
	}

	if query.Type != "" {
		arr := strings.Split(query.Type, ",")
		if len(tmp) > 0 {
			if len(arr) == 1 {
				tmp = fmt.Sprintf("%s and object.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[0]))
			} else {
				for i := range arr {
					if i == 0 {
						tmp = fmt.Sprintf("%s and (object.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[i]))
					} else {
						tmp = fmt.Sprintf("%s or object.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[i]))
					}
				}
				tmp += ")"
			}
		} else {
			if len(arr) == 1 {
				tmp = fmt.Sprintf("%s where object.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[0]))
			} else {
				for i := range arr {
					if i == 0 {
						tmp = fmt.Sprintf("%s where (object.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[i]))
					} else {
						tmp = fmt.Sprintf("%s or object.type = %d", tmp, constant.ObjectTypeStringToInt(arr[i]))
					}
				}
				tmp += ")"
			}
		}
	}

	if len(tmp) > 0 {
		tmp = fmt.Sprintf("%s and object.deleted_at = 0", tmp)
	} else {
		tmp = fmt.Sprintf("where object.deleted_at = 0")
	}

	if query.Subtype > 0 {
		tmp = fmt.Sprintf("%s and t_object_subtype.subtype = %d ", tmp, query.Subtype)
	}

	tmp = fmt.Sprintf("%s and t_object_subtype.deleted_at is null", tmp)

	if query.Registered != 0 {
		tmp = fmt.Sprintf("%s and object.is_register = %d ", tmp, query.Registered)
	}

	countSql = fmt.Sprintf(`select count(object.id) 
		from object  left join t_object_subtype on object.id = t_object_subtype.id %s `, tmp)
	//%s join (
	//	SELECT liyue_id, user_id, id,
	//		   ROW_NUMBER() OVER (PARTITION BY liyue_id ORDER BY id DESC) as rn
	//	FROM liyue_registrations
	//) lr on object.id COLLATE utf8mb4_unicode_ci = lr.liyue_id COLLATE utf8mb4_unicode_ci
	//   AND lr.rn = 1 %s`, joinType, tmp)
	err = do.UnderlyingDB().Raw(countSql).Count(&total).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if query.Sort == "name" {
		sql = fmt.Sprintf("%s %s order by object.type, name %s", sql, tmp, query.Direction)
	} else {
		sql = fmt.Sprintf("%s %s order by %s %s", sql, tmp, query.Sort, query.Direction)
	}

	if query.Limit > 0 {
		query.Offset = query.Limit * (query.Offset - 1)
		sql = fmt.Sprintf("%s limit %d offset %d", sql, query.Limit, query.Offset)
	}

	err = do.UnderlyingDB().Raw(sql).Scan(&models).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, total, nil
}

func (b *businessStructureRepo) ListOrgByPaging(ctx context.Context, query *domain.QueryOrgPageReqParam) (models []*domain.ObjectVo, total int64, err error) {
	objectDo := b.q.Object
	do := objectDo.WithContext(ctx)
	var joinType string
	if query.Registered != 0 {
		// 如果 IsRegister 有值，则使用 INNER JOIN
		joinType = "inner"
	} else {
		// 否则保持 LEFT JOIN
		joinType = "left"
	}

	sql := fmt.Sprintf(`select object.*,t_object_subtype.subtype,t_object_subtype.main_dept_type, lr.user_id AS user_ids, lr.id as org_id 
		from object 
		left join t_object_subtype on object.id = t_object_subtype.id 
		%s join (
			SELECT liyue_id, user_id, id, 
				   ROW_NUMBER() OVER (PARTITION BY liyue_id ORDER BY id DESC) as rn 
			FROM liyue_registrations
		) lr on object.id COLLATE utf8mb4_unicode_ci = lr.liyue_id COLLATE utf8mb4_unicode_ci 
		   AND lr.rn = 1`, joinType)

	tmp := ""
	countSql := ""
	if len(query.ID) > 0 {
		object, err := objectDo.WithContext(ctx).Where(objectDo.ID.Eq(query.ID)).First()
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.WithContext(ctx).Error("specified object id not found", zap.Error(err), zap.String("id", query.ID))
			return nil, 0, errorcode.Detail(errorcode.BusinessStructureObjectNotFound, query.ID)
		}
		if err != nil {
			log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
			return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if !query.IsAll {
			tmp = fmt.Sprintf("where `object`.path_id like '%s' and `object`.path_id not like '%s' ", object.PathID+"/%", object.PathID+"/%/%")
		} else {
			tmp = fmt.Sprintf("where `object`.path_id like '%s' ", object.PathID+"/%")
		}
	} else {
		if !query.IsAll && query.Source != "register" {
			tmp = fmt.Sprintf("where `object`.type = 1 ")
		}
	}

	if query.IDs != "" {
		ids := strings.Split(query.IDs, ",")
		tmp = fmt.Sprintf(" where `object`.id in ('%s') ", strings.Join(ids, "','"))
	}

	if len(query.Keyword) > 0 {
		query.Keyword = "%" + common.KeywordEscape(query.Keyword) + "%"
		if len(tmp) > 0 {
			tmp = fmt.Sprintf("%s and `object`.name like '%s' ", tmp, query.Keyword)
		} else {
			tmp = fmt.Sprintf("where `object`.name like '%s' ", query.Keyword)
		}
	}
	if query.ThirdDeptId != "" {
		if len(tmp) > 0 {
			tmp = fmt.Sprintf("%s and and f_third_dept_id = %q ", tmp, common.KeywordEscape(query.ThirdDeptId))
		} else {
			tmp = fmt.Sprintf("where f_third_dept_id = %q ", common.KeywordEscape(query.ThirdDeptId))
		}
	}

	if query.Names != "" {
		names := strings.Split(query.Names, ",")
		tmp = fmt.Sprintf("where `object`.name in ('%v') ", strings.Join(names, "','"))
	}

	if query.Type != "" {
		arr := strings.Split(query.Type, ",")
		if len(tmp) > 0 {
			if len(arr) == 1 {
				tmp = fmt.Sprintf("%s and `object`.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[0]))
			} else {
				for i := range arr {
					if i == 0 {
						tmp = fmt.Sprintf("%s and (`object`.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[i]))
					} else {
						tmp = fmt.Sprintf("%s or `object`.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[i]))
					}
				}
				tmp += ")"
			}
		} else {
			if len(arr) == 1 {
				tmp = fmt.Sprintf("%s where `object`.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[0]))
			} else {
				for i := range arr {
					if i == 0 {
						tmp = fmt.Sprintf("%s where (`object`.type = %d ", tmp, constant.ObjectTypeStringToInt(arr[i]))
					} else {
						tmp = fmt.Sprintf("%s or `object`.type = %d", tmp, constant.ObjectTypeStringToInt(arr[i]))
					}
				}
				tmp += ")"
			}
		}
	}

	if len(tmp) > 0 {
		tmp = fmt.Sprintf("%s and `object`.deleted_at = 0", tmp)
	} else {
		tmp = fmt.Sprintf("where `object`.deleted_at = 0")
	}

	if query.Subtype > 0 {
		tmp = fmt.Sprintf("%s and t_object_subtype.subtype = %d ", tmp, query.Subtype)
	}

	tmp = fmt.Sprintf("%s and t_object_subtype.deleted_at is null", tmp)

	if query.Registered != 0 {
		tmp = fmt.Sprintf("%s and `object`.is_register = %d ", tmp, query.Registered)
	}

	countSql = fmt.Sprintf(" select count(DISTINCT `object`.id)   "+
		" from `object`    "+
		" left join t_object_subtype on `object`.id = t_object_subtype.id    "+
		" %s join (   "+
		" 	SELECT liyue_id, user_id, id,    "+
		" 		   ROW_NUMBER() OVER (PARTITION BY liyue_id ORDER BY id DESC) as rn    "+
		" 	FROM liyue_registrations   "+
		" ) lr on `object`.id = lr.liyue_id   "+
		"    AND lr.rn = 1 %s   ", joinType, tmp)
	err = do.UnderlyingDB().Raw(countSql).Count(&total).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if query.Sort == "name" {
		sql = fmt.Sprintf("%s %s order by object.type, name %s", sql, tmp, query.Direction)
	} else {
		sql = fmt.Sprintf("%s %s order by %s %s", sql, tmp, query.Sort, query.Direction)
	}

	if query.Limit > 0 {
		query.Offset = query.Limit * (query.Offset - 1)
		sql = fmt.Sprintf("%s limit %d offset %d", sql, query.Limit, query.Offset)
	}

	err = do.UnderlyingDB().Raw(sql).Scan(&models).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return models, total, nil
}
func (b *businessStructureRepo) UpdateAttribute(ctx context.Context, id, attr string) error {
	objectDo := b.q.Object
	_, err := objectDo.WithContext(ctx).Where(objectDo.ID.Eq(id)).Update(objectDo.Attribute, attr)
	if err != nil {
		log.WithContext(ctx).Error("failed to update object attributes to db", zap.String("object id", id), zap.String("object attribute", attr), zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (b *businessStructureRepo) GetObjByPathID(ctx context.Context, id string) (objects []*model.Object, err error) {
	//objectDo := b.q.Object
	//objects, err = objectDo.WithContext(ctx).Where(objectDo.PathID.Like("%" + id + "%")).Find()
	//if err != nil {
	//	return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	//}
	//return objects, nil
	objectDo := b.q.Object

	object, err := objectDo.WithContext(ctx).Where(objectDo.ID.Eq(id)).First()
	if err != nil {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}

	objects, err = objectDo.WithContext(ctx).Where(objectDo.PathID.Like(object.PathID + "%")).Find()
	if err != nil {
		return nil, errorcode.Desc(errorcode.PublicDatabaseError)
	}

	return objects, nil
}

func (b *businessStructureRepo) UpdateObjectName(ctx context.Context, id, name, path string) error {
	objectDo := b.q.Object
	_, err := objectDo.WithContext(ctx).Where(b.q.Object.ID.Eq(id)).Select(b.q.Object.Name, b.q.Object.Path).Updates(&model.Object{Name: name, Path: path})
	if err != nil {
		log.WithContext(ctx).Error("failed to update object name to db", zap.String("object id", id), zap.String("object name", name), zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (b *businessStructureRepo) DeleteObject(ctx context.Context, id string) error {
	err := b.q.Transaction(func(tx *query.Query) error {
		id = "%" + id + "%"
		_, err := tx.Object.WithContext(ctx).Where(tx.Object.PathID.Like(id)).Where(tx.Object.Type.Lt(5)).Delete()
		if err != nil {
			log.WithContext(ctx).Error("删除type < 5的记录 DeleteObject info error", zap.Error(err))
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		// 查询type = 5的记录
		var mainBusinesses []*model.Object
		err = tx.Object.WithContext(ctx).Where(tx.Object.PathID.Like(id)).Where(tx.Object.Type.Eq(5)).Scan(&mainBusinesses)
		if err != nil {
			log.WithContext(ctx).Error("查询type = 5的记录 DeleteObject info error", zap.Error(err))
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		for _, mainBusiness := range mainBusinesses {
			_, err = tx.Object.WithContext(ctx).Select(tx.Object.PathID, tx.Object.Path).Where(tx.Object.ID.Eq(mainBusiness.ID)).Updates(&model.Object{PathID: mainBusiness.ID, Path: mainBusiness.Name})
			if err != nil {
				log.WithContext(ctx).Error("更新记录type = 5的记录 DeleteObject info error", zap.Error(err))
			}
		}
		return nil
	})
	if err != nil {
		log.WithContext(ctx).Error("DeleteObject info error", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (b *businessStructureRepo) DeleteObject2(ctx context.Context, id string) error {
	id = "%" + id + "%"
	_, err := b.q.Object.WithContext(ctx).Where(b.q.Object.PathID.Like(id)).Delete()
	if err != nil {
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

func (b *businessStructureRepo) Expand(ctx context.Context, id string, objType []int32) (bool, error) {
	id = id + "/%"
	count, err := b.q.Object.WithContext(ctx).Where(b.q.Object.PathID.Like(id), b.q.Object.Type.In(objType...)).Count()
	if err != nil {
		//log.WithContext(ctx).Error("failed to get child object from db", zap.String("object path id", id), zap.Error(err))
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return count > 0, nil
}

func (b *businessStructureRepo) GetDepartmentPrecision(ctx context.Context, ids []string) ([]*model.Object, error) {
	res := make([]*model.Object, 0)
	err := b.q.Object.WithContext(ctx).UnderlyingDB().WithContext(ctx).Table(model.TableNameObject).Unscoped().Where("id in ?", ids).Scan(&res).Error
	if err != nil {
		return res, err
	}
	return res, nil
}

func (b *businessStructureRepo) GetObjectByDepartName(ctx context.Context, Paths []string) (resp *CommonRest.GetDepartmentByPathRes, err error) {
	var resultMap = make(map[string]*CommonRest.DepartmentInternal)
	var Objects []*model.Object
	tx := b.q.Object.WithContext(ctx).UnderlyingDB().WithContext(ctx).Table(model.TableNameObject).
		Unscoped().
		Where("type in ?", []int{1, 2}).
		Where("path in ?", Paths).
		Scan(&Objects)
	if tx.Error != nil {
		return nil, err
	}
	for _, object := range Objects {
		resultMap[object.Path] = &CommonRest.DepartmentInternal{
			ID:          object.ID,
			Name:        object.Name,
			PathID:      object.PathID,
			Path:        object.Path,
			Type:        object.Type,
			DeletedAt:   int32(object.DeletedAt),
			ThirdDeptId: object.ThirdDeptId,
		}
	}
	resp = &CommonRest.GetDepartmentByPathRes{
		Departments: resultMap,
	}
	return
}

func (b *businessStructureRepo) GetObjIds(ctx context.Context) (objIds []string, err error) {
	d := b.q.Object.WithContext(ctx).UnderlyingDB().
		Select("id").
		Where("deleted_at = 0").
		Find(&objIds)
	return objIds, d.Error
}

func (b *businessStructureRepo) UpdateStructure(ctx context.Context, id, name, pathId, path string) error {
	objectDo := b.q.Object
	_, err := objectDo.WithContext(ctx).
		Where(b.q.Object.ID.Eq(id)).
		Select(b.q.Object.Name, b.q.Object.PathID, b.q.Object.Path).
		Updates(&model.Object{Name: name, PathID: pathId, Path: path})
	if err != nil {
		log.WithContext(ctx).Error("failed to Update structure to db",
			zap.String("object id", id),
			zap.String("object name", name), zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (b *businessStructureRepo) BatchDelete(ctx context.Context, ids []string) error {
	err := b.q.Object.WithContext(ctx).UnderlyingDB().
		Table(model.TableNameObject).
		Where("id in ?", ids).
		Update("deleted_at", 1).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to batch delete object", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return nil
}

func (b *businessStructureRepo) GetAllObjects(ctx context.Context) (objs []*model.Object, err error) {
	d := b.q.Object.WithContext(ctx).UnderlyingDB().
		Select("*").
		Where("deleted_at = 0").
		Find(&objs)
	return objs, d.Error
}

func (b *businessStructureRepo) FirstLevelDepartment1(ctx context.Context) (res []*domain.FirstLevelDepartmentRes, err error) {
	err = b.q.Object.WithContext(ctx).UnderlyingDB().
		Raw("SELECT o.id,o.`name`,o.path_id,o.path FROM `object`  o LEFT JOIN t_object_subtype s on  o.id=s.id WHERE  o.deleted_at=0 and  type=2 and  LENGTH(path_id)=73 and ( s.subtype=2 or s.id is null)").
		Scan(&res).Error
	return
}

func (b *businessStructureRepo) GetSecondLevelNotDepart(ctx context.Context) (res []string, err error) {
	err = b.q.Object.WithContext(ctx).UnderlyingDB().
		Raw("SELECT o.path_id FROM `object` o INNER JOIN t_object_subtype s on  o.id=s.id WHERE o.deleted_at=0 and type=2 and  LENGTH(path_id)=73  and subtype!=2").
		Scan(&res).Error
	return
}
func (b *businessStructureRepo) FirstLevelDepartment2(ctx context.Context, pathID string) (res []*domain.FirstLevelDepartmentRes, err error) {
	err = b.q.Object.WithContext(ctx).UnderlyingDB().
		Raw(fmt.Sprintf("SELECT o.id,o.`name`,o.path_id,o.path from  `object` o LEFT JOIN t_object_subtype s on  o.id=s.id  where o.deleted_at=0 and path_id LIKE '%s%%'  and (s.subtype=2 or s.id is null)", pathID)).
		Scan(&res).Error
	return
}

func (b *businessStructureRepo) GetDepartmentByIdOrThirdId(ctx context.Context, id string) (detail *domain.ObjectVo, err error) {
	objectDo := b.q.Object
	rawSQL := "select `object`.*,t_object_subtype.subtype from `object` left join t_object_subtype on `object`.id = t_object_subtype.id where `object`.id = ? or `object`.f_third_dept_id = ?"
	err = objectDo.WithContext(ctx).UnderlyingDB().
		Raw(rawSQL, id, id).
		Find(&detail).Error
	if err != nil {
		log.WithContext(ctx).Error("failed to get object form db", zap.String("object id", id), zap.Error(err))
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.BusinessStructureObjectRecordNotFoundError, err)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if detail.ID == "" {
		return nil, errorcode.Detail(errorcode.BusinessStructureObjectRecordNotFoundError, err)
	}

	return detail, nil
}
