package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/api/meta/v1/frontend"
)

func convertV1IntoModel_Role(in *configuration_center_v1.Role, out *model.SystemRole) {
	out.ID = in.ID
	out.Name = in.Name
	out.Color = in.Color
	out.Icon = in.Icon
	out.Description = in.Description
	if in.Type == "" {
		out.Type = string(configuration_center_v1.RoleTypeCustom)
	} else {
		out.Type = string(in.Type)
	}
	out.Scope = string(in.Scope)
	out.System = int32(in.System)
	out.CreatedAt = in.CreatedAt.Time
	out.CreatedBy = in.CreatedBy
	out.UpdatedAt = in.UpdatedAt.Time
	out.UpdatedBy = in.UpdatedBy
}

func convertV1ToModel_Role(in *configuration_center_v1.Role) (out *model.SystemRole) {
	if in == nil {
		return
	}
	out = &model.SystemRole{}
	convertV1IntoModel_Role(in, out)
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

func convertModelIntoV1_Permission(in *model.Permission, out *configuration_center_v1.Permission) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.Name = in.Name
	out.Category = configuration_center_v1.PermissionCategory(in.Category)
	out.Description = in.Description
}
func ConvertModelToV1_Permissions(in []*model.Permission) (out []configuration_center_v1.Permission) {
	if in == nil {
		return
	}
	out = make([]configuration_center_v1.Permission, len(in))
	for i := range in {
		convertModelIntoV1_Permission(in[i], &out[i])
	}
	return out
}

func convertModelIntoV1_MetadataWithOperator(in *model.SystemRole, createdName, updatedName string, out *frontend.MetadataWithOperator) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.CreatedBy = frontend.ReferenceWithName{
		ID:   in.CreatedBy,
		Name: createdName,
	}
	out.UpdatedBy = frontend.ReferenceWithName{
		ID:   in.UpdatedBy,
		Name: updatedName,
	}
}

func convertModelToV1_MetadataWithOperator(in *model.SystemRole, createdName, updatedName string) (out *frontend.MetadataWithOperator) {
	if in == nil {
		return
	}
	out = &frontend.MetadataWithOperator{}
	convertModelIntoV1_MetadataWithOperator(in, createdName, updatedName, out)
	return
}

func convertModelIntoV1_RoleSpec(in *model.SystemRole, out *configuration_center_v1.RoleSpec) {
	out.Name = in.Name
	if in.Type == "" {
		out.Type = configuration_center_v1.RoleTypeInternal
	} else {
		out.Type = configuration_center_v1.RoleType(in.Type)
	}
	out.Description = in.Description
	out.Color = in.Color
	out.Scope = configuration_center_v1.Scope(in.Scope)
	out.Icon = in.Icon
}

func convertModelToV1_RoleSpec(in *model.SystemRole) (out *configuration_center_v1.RoleSpec) {
	if in == nil {
		return
	}
	out = &configuration_center_v1.RoleSpec{}
	convertModelIntoV1_RoleSpec(in, out)
	return
}
