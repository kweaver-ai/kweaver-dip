package user

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1/frontend"
)

type fakeUseCase struct {
	// GetUser: args
	calledGetUserArgs *fakeUseCaseGetUserArgs
	// GetUser: return values
	user *domain.User

	err error
}

// GetScopeAndPermissions implements user.UseCase.
func (f *fakeUseCase) GetScopeAndPermissions(ctx context.Context, id string) (*v1.ScopeAndPermissions, error) {
	panic("unimplemented")
}

// FrontGet implements user.UseCase.
func (f *fakeUseCase) FrontGet(ctx context.Context, id string) (*frontend.User, error) {
	panic("unimplemented")
}

// FrontList implements user.UseCase.
func (f *fakeUseCase) FrontList(ctx context.Context, opts *v1.UserListOptions) (*frontend.UserList, error) {
	panic("unimplemented")
}

// UpdateScopeAndPermissions implements user.UseCase.
func (f *fakeUseCase) UpdateScopeAndPermissions(ctx context.Context, id string, sap *v1.ScopeAndPermissions) error {
	panic("unimplemented")
}

// UserRoleOrRoleGroupBindingBatchProcessing implements user.UseCase.
func (f *fakeUseCase) UserRoleOrRoleGroupBindingBatchProcessing(ctx context.Context, p *v1.UserRoleOrRoleGroupBindingBatchProcessing) error {
	panic("unimplemented")
}

// AccessControl implements user.UseCase.
func (f *fakeUseCase) AccessControl(ctx context.Context) (*access_control.ScopeTransfer, []string, error) {
	panic("unimplemented")
}

// AddAccessControl implements user.UseCase.
func (f *fakeUseCase) AddAccessControl(ctx context.Context) error {
	panic("unimplemented")
}

// CheckUserExist implements user.UseCase.
func (f *fakeUseCase) CheckUserExist(ctx context.Context, userId string) error {
	panic("unimplemented")
}

// CreateUser implements user.UseCase.
func (f *fakeUseCase) CreateUser(ctx context.Context, userId string, name string, userType string) error {
	panic("unimplemented")
}

// CreateUserNSQ implements user.UseCase.
func (f *fakeUseCase) CreateUserNSQ(ctx context.Context, userId string, name string, userType string) {
	panic("unimplemented")
}

// DeleteUser implements user.UseCase.
func (f *fakeUseCase) DeleteUser(ctx context.Context, userId string) error {
	panic("unimplemented")
}

// DeleteUserNSQ implements user.UseCase.
func (f *fakeUseCase) DeleteUserNSQ(ctx context.Context, userId string) {
	panic("unimplemented")
}

// GetByUserId implements user.UseCase.
func (f *fakeUseCase) GetByUserId(ctx context.Context, userId string) (*model.User, error) {
	panic("unimplemented")
}

// GetByUserIdNotNil implements user.UseCase.
func (f *fakeUseCase) GetByUserIdNotNil(ctx context.Context, userId string) (*model.User, error) {
	panic("unimplemented")
}

// GetByUserIds implements user.UseCase.
func (f *fakeUseCase) GetByUserIds(ctx context.Context, uids []string) ([]*model.User, error) {
	panic("unimplemented")
}

// GetByUserNameMap implements user.UseCase.
func (f *fakeUseCase) GetByUserNameMap(ctx context.Context, uids []string) (map[string]string, error) {
	panic("unimplemented")
}

// GetDepartAndUsersPage implements user.UseCase.
func (f *fakeUseCase) GetDepartAndUsersPage(ctx context.Context, req *domain.DepartAndUserReq) ([]*domain.DepartAndUserResp, error) {
	panic("unimplemented")
}

// GetDepartUsers implements user.UseCase.
func (f *fakeUseCase) GetDepartUsers(ctx context.Context, req *domain.GetDepartUsersReq) ([]*domain.GetDepartUsersRespItem, error) {
	panic("unimplemented")
}

// GetUser implements user.UseCase.
func (f *fakeUseCase) GetUser(ctx context.Context, userID string, opts domain.GetUserOptions) (*domain.User, error) {
	f.calledGetUserArgs = &fakeUseCaseGetUserArgs{userID: userID, opts: opts}
	if f.err != nil {
		return nil, f.err
	}
	return f.user, nil
}

// GetUserByDepartAndRole implements user.UseCase.
func (f *fakeUseCase) GetUserByDepartAndRole(ctx context.Context, req *domain.GetUserByDepartAndRoleReq) ([]*domain.User, error) {
	panic("unimplemented")
}

// GetUserByDirectDepartAndRole implements user.UseCase.
func (f *fakeUseCase) GetUserByDirectDepartAndRole(ctx context.Context, req *domain.GetUserByDepartAndRoleReq) ([]*domain.User, error) {
	panic("unimplemented")
}

// GetUserByIds implements user.UseCase.
func (f *fakeUseCase) GetUserByIds(ctx context.Context, ids string) ([]*model.User, error) {
	panic("unimplemented")
}

// GetUserDepart implements user.UseCase.
func (f *fakeUseCase) GetUserDepart(ctx context.Context) ([]*domain.Depart, error) {
	panic("unimplemented")
}

// GetUserDeparts implements user.UseCase.
func (f *fakeUseCase) GetUserDeparts(ctx context.Context, userID string, opts domain.GetUserOptions) ([]*domain.Department, error) {
	panic("unimplemented")
}

// GetUserDetail implements user.UseCase.
func (f *fakeUseCase) GetUserDetail(ctx context.Context, userId string) (*domain.UserRespItem, error) {
	panic("unimplemented")
}

// GetUserDirectDepart implements user.UseCase.
func (f *fakeUseCase) GetUserDirectDepart(ctx context.Context) ([]*domain.Depart, error) {
	panic("unimplemented")
}

// GetUserIdDirectDepart implements user.UseCase.
func (f *fakeUseCase) GetUserIdDirectDepart(ctx context.Context, uid string) ([]*domain.Depart, error) {
	panic("unimplemented")
}

// GetUserList implements user.UseCase.
func (f *fakeUseCase) GetUserList(ctx context.Context, req *domain.GetUserListReq) (*domain.ListResp, error) {
	panic("unimplemented")
}

// GetUserNameNoErr implements user.UseCase.
func (f *fakeUseCase) GetUserNameNoErr(ctx context.Context, userId string) string {
	panic("unimplemented")
}

// GetUserRoles implements user.UseCase.
func (f *fakeUseCase) GetUserRoles(ctx context.Context, uid string) ([]*model.SystemRole, error) {
	panic("unimplemented")
}

// HasAccessPermission implements user.UseCase.
func (f *fakeUseCase) HasAccessPermission(ctx context.Context, uid string, accessType access_control.AccessType, resource access_control.Resource) (bool, error) {
	panic("unimplemented")
}

// HasManageAccessPermission implements user.UseCase.
func (f *fakeUseCase) HasManageAccessPermission(ctx context.Context) (bool, error) {
	panic("unimplemented")
}

// UpdateUserName implements user.UseCase.
func (f *fakeUseCase) UpdateUserName(ctx context.Context, userId string, name string) error {
	panic("unimplemented")
}

// UpdateUserNameNSQ implements user.UseCase.
func (f *fakeUseCase) UpdateUserNameNSQ(ctx context.Context, userId string, name string) {
	panic("unimplemented")
}

func newFakeUseCase(user *domain.User, err error) *fakeUseCase {
	return &fakeUseCase{
		user: user,
		err:  err,
	}
}

// GetUser implements user.UseCase.
// func (f *fakeUseCase) GetUser(ctx context.Context, userID string, opts domain.GetUserOptions) (*domain.User, error) {
// 	f.calledGetUserArgs = &fakeUseCaseGetUserArgs{userID: userID, opts: opts}
// 	if f.err != nil {
// 		return nil, f.err
// 	}
// 	return f.user, nil
// }

var _ domain.UseCase = &fakeUseCase{}

type fakeUseCaseGetUserArgs struct {
	userID string
	opts   domain.GetUserOptions
}
