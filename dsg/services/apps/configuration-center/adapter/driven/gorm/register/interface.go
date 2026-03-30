package register

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/register"
)

type UseCase interface {
	RegisterUser(ctx context.Context, req *domain.RegisterReq) error
	GetRegisterInfo(ctx context.Context, req *domain.ListUserReq) ([]*domain.RegisterReq, int64, error)
	GetUserList(ctx context.Context, req *domain.ListReq) ([]*domain.User, int64, error)
	// 获取用户详情
	GetUserInfo(ctx context.Context, req *domain.IDPath) (*domain.RegisterReq, error)
	// 用户唯一性检测
	UserUnique(ctx context.Context, req *domain.UserUniqueReq) (bool, error)
	OrganizationRegister(ctx context.Context, req *domain.LiyueRegisterReq) error
	OrganizationUpdate(ctx context.Context, req *domain.LiyueRegisterReq) error
	OrganizationDelete(ctx context.Context, id string) error
	OrganizationList(ctx context.Context, req *domain.ListReq) ([]*domain.OrganizationRegisterReq, int64, error)
	IsOrganizationRegistered(ctx context.Context, id string) (bool, error)
	//机构唯一性检测
	IsOrganizationUnique(ctx context.Context, req *domain.OrganizationUniqueReq) (bool, error)
	//根据机构id获取机构信息
	GetOrganizationInfo(ctx context.Context, id string) (*domain.LiyueRegisterReq, error)
}
