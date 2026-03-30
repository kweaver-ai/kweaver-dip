package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/permission"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) permission.Repo {
	return &repo{db: db}
}

func (r *repo) GetById(ctx context.Context, id string) (*model.Permission, error) {
	var p *model.Permission
	err := r.db.WithContext(ctx).Model(&model.Permission{}).Where("id = ?", id).Find(&p).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errorcode.Desc(errorcode.PermissionNotExist)
	} else if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return p, err
}

func (r *repo) GetList(ctx context.Context) ([]model.Permission, int64, error) {
	var models []model.Permission
	var count int64
	err := r.db.WithContext(ctx).Model(&model.Permission{}).Count(&count).Error
	if err != nil {
		return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}

	err = r.db.WithContext(ctx).Model(&model.Permission{}).Find(&models).Error
	if err != nil {
		return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return models, count, err
}

func (r *repo) GetByIds(ctx context.Context, ids []string) ([]*model.Permission, error) {
	var permissions []*model.Permission
	err := r.db.WithContext(ctx).Model(&model.Permission{}).Where("id in ?", ids).Find(&permissions).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return permissions, err
}

func (r *repo) Create(ctx context.Context, permissions []*model.Permission) error {
	return r.db.WithContext(ctx).Model(&model.Permission{}).Create(&permissions).Error
}

func (r *repo) QueryUserListByPermissionIds(ctx context.Context, permissionType int8, ids []string, keyword string, thirdUserId string) (resp []*model.User, err error) {
	if permissionType == 1 {
		if keyword != "" {
			keyword = "%" + util.KeywordEscape(keyword) + "%"
			keyword = " and (u.name like '" + keyword + "' or login_name like '" + keyword + "')"
		}
		if thirdUserId != "" {
			thirdUserId = " and u.f_third_user_id = '" + thirdUserId + "'"
		}
		sql := fmt.Sprintf("select u.* from `user` u,role_permission_bindings rp,user_role_bindings ur where u.id = ur.user_id and ur.role_id=rp.role_id "+
			"and rp.permission_id IN (?) and u.status=1 %s %s  UNION select  u.* from `user` u,user_role_group_bindings urg,role_group_role_bindings rgrb,role_permission_bindings rpb "+
			"where u.id = urg.user_id and urg.role_group_id=rgrb.role_group_id and rgrb.role_id=rpb.role_id and rpb.permission_id IN (?) and u.status=1 %s %s "+
			" UNION select  u.* from `user` u,user_permission_bindings up where u.id=up.user_id and up.permission_id IN (?)  and u.status=1 %s %s",
			keyword, thirdUserId, keyword, thirdUserId, keyword, thirdUserId)
		//err = r.db.WithContext(ctx).Debug().Raw("select u.* from user u,role_permission_bindings rp,user_role_bindings ur where u.id = ur.user_id and ur.role_id=rp.role_id and rp.permission_id IN (?) and u.status=1 ? ? "+
		//	"UNION select  u.* from user u,user_role_group_bindings urg,role_group_role_bindings rgrb,role_permission_bindings rpb 	where u.id = urg.user_id and urg.role_group_id=rgrb.role_group_id and rgrb.role_id=rpb.role_id and rpb.permission_id IN (?) and u.status=1 ? ?"+
		//	" UNION select  u.* from user u,user_permission_bindings up where u.id=up.user_id and up.permission_id IN (?)  and u.status=1 ",
		//	ids,ids, ids).Scan(&resp).Error
		err = r.db.WithContext(ctx).Debug().Raw(sql, ids, ids, ids).Scan(&resp).Error
		return resp, err
	} else {
		// 构建IN条件参数占位符
		placeholders := make([]string, len(ids))
		args := make([]interface{}, len(ids))
		for i, id := range ids {
			placeholders[i] = "?"
			args[i] = id
		}

		// 构建完整的SQL查询
		sql := fmt.Sprintf(" SELECT u.* FROM `user` u, role_permission_bindings rp, user_role_bindings ur WHERE u.id = ur.user_id AND ur.role_id = rp.role_id AND rp.permission_id IN (%s)"+
			"AND u.status = 1 GROUP BY u.id HAVING COUNT(DISTINCT rp.permission_id) = %d UNION SELECT u.* FROM `user` u, user_role_group_bindings urg,"+
			"role_group_role_bindings rgrb, role_permission_bindings rpb WHERE u.id = urg.user_id AND urg.role_group_id = rgrb.role_group_id AND rgrb.role_id = rpb.role_id"+
			" AND rpb.permission_id IN (%s) AND u.status = 1 GROUP BY u.id HAVING COUNT(DISTINCT rpb.permission_id) = %d UNION SELECT u.* FROM `user` u, "+
			"user_permission_bindings up WHERE u.id = up.user_id AND up.permission_id IN (%s) AND u.status = 1 GROUP BY u.id HAVING COUNT(DISTINCT up.permission_id) = %d",
			strings.Join(placeholders, ","), len(ids), strings.Join(placeholders, ","), len(ids), strings.Join(placeholders, ","), len(ids))

		// 合并所有参数（每个IN条件需要相同的参数集）
		allArgs := append(append(args, args...), args...)
		err := r.db.WithContext(ctx).Debug().Raw(sql, allArgs...).Scan(&resp).Error
		return resp, err
	}
}

func (r *repo) GetUserPermissionScopeList(ctx context.Context, uid string) (resp []*model.UserPermissionScope, err error) {
	err = r.db.WithContext(ctx).Raw("select u.id,u.name,sr.scope,rp.permission_id from `user` u,role_permission_bindings rp,user_role_bindings ur,system_role sr where u.id = ur.user_id and sr.id=ur.role_id  and ur.role_id=rp.role_id and u.status=1 "+
		" and u.id=? UNION select u.id,u.name,sr.scope,rpb.permission_id from `user` u,user_role_group_bindings urg,role_group_role_bindings rgrb,role_permission_bindings rpb,system_role sr where u.id = urg.user_id and urg.role_group_id=rgrb.role_group_id and rgrb.role_id=rpb.role_id and sr.id=rgrb.role_id and u.status=1"+
		" and  u.id=? UNION select  u.id,u.name,u.scope,up.permission_id from `user` u,user_permission_bindings up where u.id=up.user_id and u.status=1 "+
		" and  u.id=?", uid, uid, uid).Scan(&resp).Error
	return resp, err
}

func (r *repo) GetUserManagerAuditPermissionCount(ctx context.Context, uid string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Raw("SELECT COUNT(0) FROM (select rp.permission_id from `user` u,role_permission_bindings rp,user_role_bindings ur,system_role sr "+
		" where u.id = ur.user_id and sr.id=ur.role_id  and ur.role_id=rp.role_id and u.status=1 and rp.permission_id='9070e117-273b-4c70-8b93-1aecdee05b28' "+
		" and u.id=? UNION select rpb.permission_id from `user` u,user_role_group_bindings urg,role_group_role_bindings rgrb,role_permission_bindings rpb,system_role sr "+
		" where u.id = urg.user_id and urg.role_group_id=rgrb.role_group_id and rgrb.role_id=rpb.role_id and sr.id=rgrb.role_id and u.status=1 "+
		" and rpb.permission_id='9070e117-273b-4c70-8b93-1aecdee05b28'  and  u.id=? UNION select  up.permission_id from `user` u,user_permission_bindings up "+
		" where u.id=up.user_id and u.status=1 and up.permission_id='9070e117-273b-4c70-8b93-1aecdee05b28' and  u.id=? ) AS combined_permissions", uid, uid, uid).Count(&count).Error
	return count, err
}

func (r *repo) GetUserCheckPermissionCount(ctx context.Context, permissionId, uid string) (int64, error) {
	var count int64
	err := r.db.WithContext(ctx).Raw("SELECT COUNT(0) FROM (select rp.permission_id from `user` u,role_permission_bindings rp,user_role_bindings ur,system_role sr "+
		" where u.id = ur.user_id and sr.id=ur.role_id  and ur.role_id=rp.role_id and u.status=1 and rp.permission_id=? "+
		" and u.id=? UNION select rpb.permission_id from `user` u,user_role_group_bindings urg,role_group_role_bindings rgrb,role_permission_bindings rpb,system_role sr "+
		" where u.id = urg.user_id and urg.role_group_id=rgrb.role_group_id and rgrb.role_id=rpb.role_id and sr.id=rgrb.role_id and u.status=1 "+
		" and rpb.permission_id=?  and  u.id=? UNION select  up.permission_id from `user` u,user_permission_bindings up "+
		" where u.id=up.user_id and u.status=1 and up.permission_id=? and  u.id=? ) AS combined_permissions", permissionId, uid, permissionId, uid, permissionId, uid).Count(&count).Error
	return count, err
}
