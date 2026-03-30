package user

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type IUser interface {
	GetNameByUserId(ctx context.Context, userId string) string
	GetByUserId(ctx context.Context, userId string) (*model.User, error)
	GetByUserIds(ctx context.Context, userIds []string) ([]*model.User, error)
	UpdateUserNameMQ(ctx context.Context, userId string, name string)
	CreateUserMQ(ctx context.Context, userId string, name, userType string)
	DeleteUserNSQ(ctx context.Context, userId string)
	GetAll(ctx context.Context, req GetUserReq) ([]*model.User, error)
	GetProjectMgmRoleUsers(ctx context.Context) ([]*configuration_center.User, error)
	GetProjectMgmUsers(ctx context.Context, req configuration_center.UserReq) ([]*configuration_center.User, error)
}
type GetUserReq struct {
	TaskType string `json:"task_type" form:"task_type" uri:"task_type" binding:"omitempty,verifyMultiTaskType" example:"normal"` // 任务类型，枚举值
}
