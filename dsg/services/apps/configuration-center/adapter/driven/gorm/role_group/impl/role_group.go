package impl

import (
	"context"
	"errors"
	"net/url"
	"strconv"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) role_group.Repo {
	return &repo{db: db}
}

func (r *repo) Create(ctx context.Context, roleGroup *model.RoleGroup) error {
	return r.db.Model(&model.RoleGroup{}).WithContext(ctx).Create(roleGroup).Error
}

func (r *repo) Update(ctx context.Context, roleGroup *model.RoleGroup) error {
	return r.db.Model(&model.RoleGroup{}).WithContext(ctx).Where("id=?", roleGroup.ID).Updates(map[string]interface{}{
		"name":        roleGroup.Name,
		"description": roleGroup.Description,
		"updated_at":  roleGroup.UpdatedAt,
	}).Error
}

func (r *repo) Delete(ctx context.Context, id string) error {
	return r.db.Model(&model.RoleGroup{}).WithContext(ctx).Where("id=?", id).Delete(&model.RoleGroup{}).Error
}

func (r *repo) GetById(ctx context.Context, id string) (*model.RoleGroup, error) {
	var roleGroup *model.RoleGroup
	err := r.db.WithContext(ctx).Model(&model.RoleGroup{}).Where("id = ?", id).Find(&roleGroup).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errorcode.Desc(errorcode.RoleGroupNotExist)
	} else if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return roleGroup, err
}

func (r *repo) QueryList(ctx context.Context, params url.Values) (roleGroups []model.RoleGroup, count int64, err error) {
	Db := r.db.WithContext(ctx).Model(&model.RoleGroup{})
	if keyword := params.Get("keyword"); keyword != "" {
		Db = Db.Where("name like ?", "%"+util.KeywordEscape(keyword)+"%")
	}
	if userIds := params.Get("user_ids"); userIds != "" {
		var roleGroupIds []string
		err = r.db.WithContext(ctx).Model(&model.UserRoleGroupBinding{}).Select("role_group_id").Where("user_id in ?", strings.Split(userIds, ",")).Find(&roleGroupIds).Error
		if err != nil {
			return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
		}
		Db = Db.Where("id in ?", roleGroupIds)
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
	err = Db.Find(&roleGroups).Error
	if err != nil {
		return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return
}

func (r *repo) CheckName(ctx context.Context, id, name string) (ok bool, err error) {
	var count int64
	Db := r.db.WithContext(ctx).Model(&model.RoleGroup{}).Where("name = ? ", name)
	if id != "" {
		Db = Db.Where("id <> ?", id)
	}
	err = Db.Count(&count).Error
	ok = count > 0
	return
}

func (r *repo) GetByIds(ctx context.Context, ids []string) ([]*model.RoleGroup, error) {
	var roleGroups []*model.RoleGroup
	err := r.db.WithContext(ctx).Model(&model.RoleGroup{}).Where("id in ?", ids).Find(&roleGroups).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return roleGroups, nil
}
