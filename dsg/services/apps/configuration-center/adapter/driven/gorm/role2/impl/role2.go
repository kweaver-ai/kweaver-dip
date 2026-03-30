package impl

import (
	"context"
	"net/url"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) role2.Repo {
	return &repo{db: db}
}

func (r repo) Update(ctx context.Context, role *model.SystemRole) error {
	return r.db.WithContext(ctx).Model(&model.SystemRole{}).Where("id=?", role.ID).Updates(map[string]interface{}{
		"name":        role.Name,
		"description": role.Description,
		"updated_at":  role.UpdatedAt,
		"updated_by":  role.UpdatedBy,
	}).Error
}

func (r repo) QueryList(ctx context.Context, params *url.Values) (roles []*model.SystemRole, count int64, err error) {
	Db := r.db.WithContext(ctx).Model(&model.SystemRole{})
	if keyword := params.Get("keyword"); keyword != "" {
		Db = Db.Where("name LIKE ?", "%"+common.KeywordEscape(keyword)+"%")
	}
	if roleType := params.Get("type"); roleType != "" {
		if roleType == string(configuration_center_v1.RoleTypeInternal) {
			Db = Db.Where("type = ? or type is null", roleType)
		} else {
			Db = Db.Where("type = ?", roleType)
		}
	}
	if roleGroupId := params.Get("role_group_id"); roleGroupId != "" {
		var roleIds []string
		err = r.db.WithContext(ctx).Model(&model.RoleGroupRoleBinding{}).Select("role_id").Where("role_group_id = ?", roleGroupId).Find(&roleIds).Error
		if err != nil {
			return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
		}
		Db = Db.Where("id in ?", roleIds)
	}
	if userIds := params.Get("user_ids"); userIds != "" {
		var roleIds []string
		err = r.db.WithContext(ctx).Model(&model.UserRoleBinding{}).Select("role_id").Where("user_id in ?", strings.Split(userIds, ",")).Find(&roleIds).Error
		if err != nil {
			return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
		}
		Db = Db.Where("id in ?", roleIds)
	}
	err = Db.Count(&count).Error
	if err != nil {
		return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}

	// 排序
	if sort := params.Get("sort"); sort != "" {
		order := "desc"
		if direction := params.Get("direction"); direction != "" {
			order = direction
		}
		Db = Db.Order(sort + " " + order)
	}

	// 分页
	page := 1
	offset := params.Get("offset")
	if offset != "" {
		page, _ = strconv.Atoi(offset)
	}
	pageSize := 0
	if limit := params.Get("limit"); limit != "" {
		pageSize, _ = strconv.Atoi(limit)
	}
	if pageSize > 0 {
		Db = Db.Offset((page - 1) * pageSize).Limit(pageSize)
	}
	err = Db.Find(&roles).Error
	if err != nil {
		return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return
}

func (r repo) IsUserAssociated(ctx context.Context, uid string) (bool, error) {
	var count int64
	sql := "SELECT COUNT(u.id) AS user_count FROM user u WHERE u.status = 1 " +
		"AND u.id = ?  AND ( EXISTS ( SELECT 1 FROM user_role_bindings ur " +
		" JOIN system_role sr ON ur.role_id = sr.id  WHERE ur.user_id = u.id AND sr.type != 'Internal' ) " +
		" OR EXISTS ( SELECT 1 FROM user_role_group_bindings urq JOIN role_group_role_bindings rqrb ON urq.role_group_id = rqrb.role_group_id " +
		" JOIN system_role sr ON rqrb.role_id = sr.id   WHERE urq.user_id = u.id AND sr.type != 'Internal' ) OR " +
		" NOT EXISTS (SELECT 1 FROM user_role_bindings ur WHERE ur.user_id = u.id) AND " +
		" NOT EXISTS (SELECT 1 FROM user_role_group_bindings urq WHERE urq.user_id = u.id))"
	err := r.db.WithContext(ctx).Raw(sql, uid).Count(&count).Error
	return count > 0, err
}
