package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	configuration_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1/frontend"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/api/meta/v1/frontend"
)

func convertModelIntoV1_MetadataWithOperator(in *model.User, updatedName string, out *frontend.MetadataWithOperator) {
	out.ID = in.ID
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.UpdatedBy = frontend.ReferenceWithName{
		ID:   in.UpdatedBy,
		Name: updatedName,
	}
}

func convertModelToV1_MetadataWithOperator(in *model.User, updatedName string) (out *frontend.MetadataWithOperator) {
	if in == nil {
		return
	}
	out = &frontend.MetadataWithOperator{}
	convertModelIntoV1_MetadataWithOperator(in, updatedName, out)
	return
}

func convertModelIntoV1_UserSpec(in *model.User, out *configuration_center_v1.UserSpec) {
	out.Name = in.Name
	out.DisplayName = in.Name
	out.LoginName = in.LoginName
	out.Scope = configuration_center_v1.Scope(in.Scope)
	out.UserType = configuration_center_v1.UserType(in.UserType)
	out.PhoneNumber = in.PhoneNumber
	out.MailAddress = in.MailAddress
	out.Status = configuration_center_v1.UserStatus(in.Status)
	out.Registered = in.IsRegistered
	out.RegisteredAt = in.RegisterAt
	out.ThirdServiceID = in.ThirdServiceId
	out.ThirdUserId = in.ThirdUserId
	out.Sex = in.Sex
}

func convertModelToV1_UserSpec(in *model.User) (out *configuration_center_v1.UserSpec) {
	if in == nil {
		return
	}
	out = &configuration_center_v1.UserSpec{}
	convertModelIntoV1_UserSpec(in, out)
	return
}

func convertModelIntoV1_Role(in *model.SystemRole, out *configuration_center_v1.Role) {
	out.ID = in.ID
	out.Name = in.Name
	out.Color = in.Color
	out.Icon = in.Icon
	out.Description = in.Description
	if in.Type == "" {
		out.Type = configuration_center_v1.RoleTypeInternal
	} else {
		out.Type = configuration_center_v1.RoleType(in.Type)
	}
	out.Scope = configuration_center_v1.Scope(in.Scope)
	out.System = int(in.System)
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.CreatedBy = in.CreatedBy
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.UpdatedBy = in.UpdatedBy
}

func convertModelToV1_Role(in *model.SystemRole) (out *configuration_center_v1.Role) {
	if in == nil {
		return
	}
	out = &configuration_center_v1.Role{}
	convertModelIntoV1_Role(in, out)
	return
}

func ConvertModelToV1_Roles(in []*model.SystemRole) (out []configuration_center_v1.Role) {
	if in == nil {
		return
	}
	out = make([]configuration_center_v1.Role, len(in))
	for i := range in {
		out[i] = *convertModelToV1_Role(in[i])
	}
	return out
}

func convertModelIntoV1_ScopedPermission(in *model.Permission, scope string, out *configuration_center_v1.ScopedPermission) {
	out.Scope = configuration_center_v1.Scope(scope)
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.Name = in.Name
	out.Category = configuration_center_v1.PermissionCategory(in.Category)
	out.Description = in.Description
}
func ConvertModelToV1_ScopedPermissions(in []*model.Permission, scope string) (out []configuration_center_v1.ScopedPermission) {
	if in == nil {
		return
	}
	out = make([]configuration_center_v1.ScopedPermission, len(in))
	for i := range in {
		convertModelIntoV1_ScopedPermission(in[i], scope, &out[i])
	}
	return out
}

func convertModelIntoV1_RoleGroup(in *model.RoleGroup, roles []*model.SystemRole, out *configuration_center_v1_frontend.RoleGroup) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.Name = in.Name
	out.Description = in.Description
	out.Roles = ConvertModelToV1_Roles(roles)
}

func convertModelToV1_RoleGroup(in *model.RoleGroup, roles []*model.SystemRole) (out *configuration_center_v1_frontend.RoleGroup) {
	if in == nil {
		return
	}
	out = &configuration_center_v1_frontend.RoleGroup{}
	convertModelIntoV1_RoleGroup(in, roles, out)
	return
}
