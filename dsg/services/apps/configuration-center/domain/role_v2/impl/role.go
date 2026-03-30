package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/role_v2"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/kweaver-ai/idrm-go-common/rest/base"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/samber/lo"
)

type roleUseCase struct {
	authDriven authorization.Driven
}

func NewRoleUseCase(
	authDriven authorization.Driven,
) domain.UseCase {
	return &roleUseCase{
		authDriven: authDriven,
	}
}

// Detail 查询详情，包一下接口，后面用不到就删除了吧
func (r *roleUseCase) Detail(ctx context.Context, rid string) (*authorization.RoleDetail, error) {
	roleInfo, err := r.authDriven.GetRole(ctx, rid)
	if err != nil {
		return nil, err
	}
	return roleInfo, nil
}

func (r *roleUseCase) Query(ctx context.Context, args *domain.ListArgs) (res *base.PageResult[authorization.RoleDetail], err error) {
	defer af_trace.CloseSpan(af_trace.OpenSpan(&ctx), err)

	queryArgs := &authorization.RoleListArgs{
		Offset:  *args.Offset,
		Limit:   *args.Limit,
		Keyword: args.Keyword,
		Source:  args.Source,
	}
	rolePageResult, err := r.authDriven.ListRoles(ctx, queryArgs)
	if err != nil {
		return nil, err
	}
	return rolePageResult, nil
}

// RoleUsers Get Role detail with userId info
func (r *roleUseCase) RoleUsers(ctx context.Context, args *domain.UserRolePageArgs) (res *base.PageResult[authorization.MemberInfo], err error) {
	defer af_trace.CloseSpan(af_trace.OpenSpan(&ctx), err)

	queryArgs := &authorization.RoleMemberArgs{
		ID:      *args.RId,
		Keyword: args.Keyword,
		Offset:  *args.Offset,
		Limit:   *args.Limit,
	}
	roleMembers, err := r.authDriven.ListRoleMembers(ctx, queryArgs)
	if err != nil {
		return nil, err
	}
	return roleMembers, nil
}

// UserRoles 获取用户角色, TODO 需要ISF提供接口支持
func (r *roleUseCase) UserRoles(ctx context.Context) (roles []*authorization.RoleMetaInfo, err error) {
	//uid, err := util.GetUserInfo(ctx)
	//if err != nil {
	//	return nil, err
	//}
	queryArgs := &authorization.RoleListArgs{}
	rolePageResult, err := r.authDriven.ListRoles(ctx, queryArgs)
	if err != nil {
		return nil, err
	}
	return lo.Times(len(rolePageResult.Entries), func(index int) *authorization.RoleMetaInfo {
		return &rolePageResult.Entries[index].RoleMetaInfo
	}), nil
}
