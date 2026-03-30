package impl

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"strconv"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"

	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var _ user2.IUserRepo = (*UserRepo)(nil)

type UserRepo struct {
	DB *gorm.DB
}

func NewUserRepo(db *gorm.DB) user2.IUserRepo {
	return &UserRepo{DB: db}
}

func (u *UserRepo) Insert(ctx context.Context, user *model.User) (int64, error) {
	result := u.DB.WithContext(ctx).Create(user)
	return result.RowsAffected, result.Error
}
func (u *UserRepo) InsertBatch(ctx context.Context, user []*model.User) error {
	return u.DB.WithContext(ctx).CreateInBatches(user, common.DefaultBatchSize).Error
}
func (u *UserRepo) InsertNotExist(ctx context.Context, users []*model.User) error {
	return u.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		for _, user := range users {
			errIn := tx.Take(&user, "id=?", user.ID).Error
			if is := errors.Is(errIn, gorm.ErrRecordNotFound); is {
				if err := tx.Create(user).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}
func (u *UserRepo) GetByUserId(ctx context.Context, userId string) (user *model.User, err error) {
	result := u.DB.WithContext(ctx).Take(&user, "id=?", userId)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(errorcode.UserIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}
func (u *UserRepo) GetByUserIds(ctx context.Context, uids []string) (users []*model.User, err error) {
	err = u.DB.WithContext(ctx).Where("id in ?", uids).Find(&users).Error
	return
}
func (u *UserRepo) GetByUserIdSimple(ctx context.Context, userId string) (user *model.User, err error) {
	err = u.DB.WithContext(ctx).Take(&user, "id=?", userId).Error
	return
}
func (u *UserRepo) UpdateUserName(ctx context.Context, user *model.User, updateKyes []string) (int64, error) {
	result := u.DB.WithContext(ctx).Where("id=?", user.ID).Select(updateKyes).Updates(user)
	return result.RowsAffected, result.Error
}

func (u *UserRepo) UpdateUserMobileMail(ctx context.Context, user *model.User, updateKyes []string) (int64, error) {
	result := u.DB.WithContext(ctx).Where("id=?", user.ID).Select(updateKyes).Updates(user)
	return result.RowsAffected, result.Error
}

func (u *UserRepo) ListUserByIDs(ctx context.Context, uIds ...string) ([]*model.User, error) {
	if len(uIds) < 1 {
		log.Warn("user ids is empty")
		return nil, nil
	}
	res := make([]*model.User, 0)
	result := u.DB.WithContext(ctx).Find(&res, uIds)
	return res, result.Error
}

func (u *UserRepo) GetAll(ctx context.Context) ([]*model.User, error) {
	res := make([]*model.User, 0)
	result := u.DB.WithContext(ctx).Where("status=? and user_type = 1", int32(configuration_center.UserNormal)).Find(&res)
	return res, result.Error
}

func (u *UserRepo) GetUserRoles(ctx context.Context, uid string) (res []*model.SystemRole, err error) {
	err = u.DB.WithContext(ctx).Unscoped().
		Select("r.*").
		Table(model.TableNameSystemRole+" r").
		Joins("join user_role_bindings u  ON u.role_id=r.id").
		Where("u.user_id=? and r.deleted_at = 0", uid).Find(&res).Error
	return
}

func (u *UserRepo) GetRoleExistUserByIds(ctx context.Context, uid []string) (res []*model.User, err error) {
	db := u.DB.WithContext(ctx).
		Select("distinct u.*").
		Table("`user` u ").
		Joins("INNER JOIN user_role_bindings r ON  u.id=r.user_id ").
		Where("u.id in ?", uid)
	return gormx.RawScan[*model.User](db)
}
func (u *UserRepo) GetDepartAndUsersPage(ctx context.Context, req *user.DepartAndUserReq) (res []*user.DepartAndUserRes, err error) {
	//sql := fmt.Sprintf("SELECT id,name,type,path  FROM(SELECT id,name,CASE type WHEN 1 THEN 'organization' WHEN 2 THEN 'department' ELSE  'err' END type,path  from object WHERE deleted_at =0 UNION SELECT u.id,u.name,'user' type ,'' path  from `user` u INNER JOIN user_roles r ON  u.id=r.user_id WHERE status= %d) as new WHERE name LIKE  \"%s\" LIMIT %d OFFSET %d",
	//	int32(configuration_center.UserNormal),
	//	"%"+req.Keyword+"%",
	//	req.Limit,
	//	req.Limit*(req.Offset-1),
	//)
	sql := fmt.Sprintf("SELECT id,name,type,path  FROM(SELECT id,name,CASE type WHEN 1 THEN 'organization' WHEN 2 THEN 'department' ELSE  'err' END type,path  from object WHERE deleted_at =0 UNION SELECT u.id,u.name,'user' type ,'' path  from `user` u WHERE   user_type=1 and status= %d ) as new WHERE name LIKE  \"%s\" LIMIT %d OFFSET %d",
		int32(configuration_center.UserNormal),
		"%"+req.Keyword+"%",
		req.Limit,
		req.Limit*(req.Offset-1),
	)
	err = u.DB.WithContext(ctx).Raw(sql).Scan(&res).Error
	return
}
func (u *UserRepo) GetUsersPageTemp(ctx context.Context, req *user.DepartAndUserReq) (res []*user.DepartAndUserRes, err error) {
	//sql := fmt.Sprintf("SELECT distinct u.id,u.name,'user' type ,'' path  from `user` u INNER JOIN user_role_bindings r ON u.id = r.user_id  WHERE status=%d  and name LIKE  \"%s\" LIMIT %d OFFSET %d",
	//	int32(configuration_center.UserNormal),
	//	"%"+req.Keyword+"%",
	//	req.Limit,
	//	req.Limit*(req.Offset-1),
	//)
	sql := fmt.Sprintf("SELECT distinct u.id,u.name,'user' type ,'' path  from `user` u  WHERE status=%d and user_type=1  and name LIKE  \"%s\" LIMIT %d OFFSET %d",
		int32(configuration_center.UserNormal),
		"%"+req.Keyword+"%",
		req.Limit,
		req.Limit*(req.Offset-1),
	)
	err = u.DB.WithContext(ctx).Raw(sql).Scan(&res).Error
	return
}
func (u *UserRepo) GetUsersRoleName(ctx context.Context, uid string) (res []*user.Role, err error) {
	err = u.DB.WithContext(ctx).Raw("SELECT distinct s.id,s.`name`  from  user_role_bindings r  INNER JOIN system_role s on s.id=r.role_id  WHERE r.user_id=?", uid).Scan(&res).Error
	return
}

func (u *UserRepo) Update(ctx context.Context, user *model.User) error {
	return u.DB.WithContext(ctx).Where("id=?", user.ID).Updates(user).Error
}

func (u *UserRepo) GetUserList(ctx context.Context, req *user.GetUserListReq, departUserIds []string, excludeUserIds []string) (count int64, res []*model.User, err error) {
	res = make([]*model.User, 0)
	tx := u.DB.WithContext(ctx).
		Table("`user` u ")

	isIncludeUnassignedRoles := false
	if len(req.IsIncludeUnassignedRoles) > 0 {
		isIncludeUnassignedRoles, _ = strconv.ParseBool(req.IsIncludeUnassignedRoles)
	}
	if !isIncludeUnassignedRoles {
		tx = tx.Joins("INNER JOIN user_roles r ON u.id=r.user_id ")
	}

	tx = tx.Where("u.status=? and u.user_type = 1 and u.id not in ?", int32(configuration_center.UserNormal), excludeUserIds)

	if req.Keyword != "" {
		keyword := "%" + util.KeywordEscape(req.Keyword) + "%"
		tx = tx.Where("u.name like ? or u.phone_number like ? or u.login_name like ?", keyword, keyword, keyword)
	}
	if req.DepartId != "" {
		tx = tx.Where("u.id in ?", departUserIds)
	}

	if len(req.UserID) > 0 {
		tx = tx.Where("u.id in ? ", req.UserID)
	}

	if req.Sort == "name" {
		tx = tx.Order(fmt.Sprintf(" u.`name` %s,u.id asc", req.Direction))
	} else {
		tx = tx.Order(fmt.Sprintf("u.%s %s,u.id asc", req.Sort, req.Direction))
	}

	count, err = gormx.RawCount(tx.Distinct("u.id"))
	if tx.Error != nil {
		log.WithContext(ctx).Error("List", zap.Error(tx.Error))
		return 0, nil, tx.Error
	}

	limit := req.Limit
	offset := limit * (req.Offset - 1)
	if limit > 0 {
		tx = tx.Limit(limit).Offset(offset)
	}
	tx = tx.Distinct("u.*")

	res, err = gormx.RawScan[*model.User](tx)
	return count, res, err
}

func (u *UserRepo) QueryList(ctx context.Context, params url.Values, userIds []string, register int32) (users []*model.User, count int64, err error) {
	Db := u.DB.WithContext(ctx).Model(&model.User{})
	if keyword := params.Get("keyword"); keyword != "" {
		keyword = "%" + util.KeywordEscape(keyword) + "%"
		Db = Db.Where("name like ? or login_name like ?", keyword, keyword)
	}
	if len(userIds) > 0 {
		Db = Db.Where("id in  ?", userIds)
	}
	if register != 0 {
		Db = Db.Where("is_registered = ?", register)
	}
	// 只查询“用户”，排除“应用账户”等其他类型的用户
	Db = Db.Where(&model.User{UserType: 1, Status: 1})
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
	err = Db.Find(&users).Error
	if err != nil {
		return nil, 0, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return
}

func (u *UserRepo) ListUserNames(ctx context.Context) ([]model.UserWithName, error) {
	var result []model.UserWithName
	tx := u.DB.WithContext(ctx).
		Model(model.User{}).
		Find(&result)
	if tx.Error != nil || tx.RowsAffected == 0 {
		return nil, tx.Error
	}
	return result, nil
}
