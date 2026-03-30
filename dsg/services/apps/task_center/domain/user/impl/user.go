package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"

	"errors"
	"strconv"

	"github.com/kweaver-ai/idrm-go-common/access_control"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"

	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	IUserR "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	IUser "github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type User struct {
	userRepo IUserR.IUserRepo
	userMgm  user_management.DrivenUserMgnt
	cc       configuration_center.Call
}

func NewUser(userRepo IUserR.IUserRepo, userMgm user_management.DrivenUserMgnt, cc configuration_center.Call) IUser.IUser {
	return &User{
		userRepo: userRepo,
		userMgm:  userMgm,
		cc:       cc,
	}
}
func (u *User) GetNameByUserId(ctx context.Context, userId string) string { //not find res empty string ,log out err
	if userId == "" {
		log.WithContext(ctx).Error("userId is empty str")
		return ""
	}
	user, err := u.userRepo.GetByUserIdSimple(ctx, userId) //not find service user table data error
	if err != nil {
		log.WithContext(ctx).Error("GetNameById", zap.Error(err), zap.String("userId", userId))
		return ""
	}
	return user.Name
}
func (u *User) GetByUserId(ctx context.Context, userId string) (*model.User, error) {
	if userId == "" {
		log.WithContext(ctx).Error("userId is empty str ")
		return &model.User{}, nil
	}
	user, err := u.userRepo.GetByUserIdSimple(ctx, userId)
	if err != nil {
		log.WithContext(ctx).Error("error info", zap.Error(err))
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			user, err := u.getUserDriver(ctx, userId)
			if err != nil {
				return nil, err
			}
			return user, nil
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	if user.Status == int32(constant.UserDelete) {
		return nil, errorcode.Desc(errorcode.UserIdNotExistError)
	}
	return user, nil
}
func (u *User) GetByUserIds(ctx context.Context, userIds []string) ([]*model.User, error) {
	users, err := u.userRepo.GetByUserIds(ctx, userIds)
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return users, nil
}
func (u *User) getUserDriver(ctx context.Context, userId string) (m *model.User, err error) {
	name, _, _, err := u.userMgm.GetUserNameByUserID(ctx, userId)
	if err != nil {
		log.WithContext(ctx).Error("userMgm GetUserNameByUserID err", zap.Error(err))
		return nil, errorcode.Detail(errorcode.UserMgmCallError, err.Error())
	}
	m = &model.User{
		ID:   userId,
		Name: name,
	}
	_, err = u.userRepo.Insert(ctx, m)
	if err != nil {
		log.WithContext(ctx).Error("GetByUserId Insert err", zap.Error(err))
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return m, nil
}
func (u *User) UpdateUserNameMQ(ctx context.Context, userId string, name string) {
	affected, err := u.userRepo.UpdateUserName(ctx, &model.User{
		ID:   userId,
		Name: name,
	}, []string{"name"})
	if err != nil {
		log.WithContext(ctx).Error("UpdateUserNameNSQ Database Error", zap.Error(err))
	}
	if affected == 0 {
		log.WithContext(ctx).Error("UpdateUserNameNSQ affected zero")
	}
	return
}

func (u *User) CreateUserMQ(ctx context.Context, userId string, name, userType string) {
	tempType, err := strconv.ParseInt(userType, 10, 32)
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ Insert Error", zap.Error(err))
	}
	affected, err := u.userRepo.Insert(ctx, &model.User{
		ID:       userId,
		Name:     name,
		UserType: int32(tempType),
	})
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ Insert Error", zap.Error(err))
	}
	if affected == 0 {
		log.WithContext(ctx).Error("CreateUserNSQ affected zero")
	}
	return
}
func (u *User) DeleteUserNSQ(ctx context.Context, userId string) {
	err := u.userRepo.Update(ctx, &model.User{
		ID:     userId,
		Status: int32(constant.UserDelete),
	})
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ Insert Error", zap.Error(err))
	}
	return
}
func (u *User) GetAll(ctx context.Context, req IUser.GetUserReq) ([]*model.User, error) {
	if req.TaskType == "" {
		users, err := u.userRepo.GetAll(ctx)
		if err != nil {
			log.WithContext(ctx).Error("GetAllUser  GetAll DataBaseError Error", zap.Error(err))
			return nil, errorcode.Desc(errorcode.UserDataBaseError)
		}
		return users, nil
	} else {
		roleIds := make([]string, 0)
		arr := strings.Split(req.TaskType, ",")
		for i := 0; i < len(arr); i++ {
			arr[i] = strings.TrimSpace(arr[i])
			roleIds = append(roleIds, tc_task.TaskToRole(ctx, arr[i])...) //todo 这里后续修改为查询配置中心任务类型有哪些角色
		}
		//查询角色下用户
		roleInfos, err := configuration_center.GetRolesInfo(ctx, roleIds)
		if err != nil {
			log.WithContext(ctx).Error("GetAll ", zap.Error(err))
			return nil, err
		}
		userIdsMap := make(map[string]int)
		userIds := make([]string, 0)
		for _, roleInfo := range roleInfos {
			for _, uid := range roleInfo.UserIds {
				userIdsMap[uid] = 1
				userIds = append(userIds, uid)
			}
		}
		//用户id去重
		userIdsUnique := util.SliceUnique(userIds)

		users, err := u.userRepo.ListUserByIDs(ctx, userIdsUnique...)
		if err != nil {
			log.WithContext(ctx).Error("GetAllUser  GetAll DataBaseError Error", zap.Error(err))
			return nil, errorcode.Desc(errorcode.UserDataBaseError)
		}
		return users, nil
	}
}
func (u *User) GetProjectMgmRoleUsers(ctx context.Context) ([]*configuration_center.User, error) {
	users, err := u.cc.GetRoleUsers(ctx, access_control.TCDataButler, configuration_center.UserRolePageInfo{})
	if err != nil {
		log.WithContext(ctx).Error("GetAllUser  GetAll DataBaseError Error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.UserDataBaseError)
	}
	return users, nil
}

func (u *User) GetProjectMgmUsers(ctx context.Context, req configuration_center.UserReq) ([]*configuration_center.User, error) {
	const projectMgm = "a9aea8b6-8961-49b4-92ea-453ce2408470"
	users, err := u.cc.GetProjectMgmUsers(ctx, projectMgm, req.ThirdUserId, req.Keyword)
	if err != nil {
		log.WithContext(ctx).Error("GetProjectMgmUsers  GetAll DataBaseError Error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.UserDataBaseError)
	}
	return users, nil
}
