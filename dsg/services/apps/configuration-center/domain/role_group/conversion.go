package role_group

import (
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/api/meta/v1/frontend"
)

func convert_Pointer_time_Time_To_Pointer_meta_v1_Time(in **time.Time, out **meta_v1.Time) error {
	if *in == nil {
		return nil
	}
	t := meta_v1.NewTime(**in)
	*out = &t
	return nil
}

func convert_model_Metadata_To_meta_v1_Metadata(in *model.Metadata, out *meta_v1.Metadata) error {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	if err := convert_Pointer_time_Time_To_Pointer_meta_v1_Time(&in.DeletedAt, &out.DeletedAt); err != nil {
		return err
	}
	return nil
}

func convertV1IntoModel_RoleGroup(in *configuration_center_v1.RoleGroup, out *model.RoleGroup) {
	out.ID = in.ID
	out.CreatedAt = in.CreatedAt.Time
	out.UpdatedAt = in.UpdatedAt.Time
	out.Name = in.Name
	out.Description = in.Description
}

func convertV1ToModel_RoleGroup(in *configuration_center_v1.RoleGroup) (out *model.RoleGroup) {
	if in == nil {
		return
	}
	out = &model.RoleGroup{}
	convertV1IntoModel_RoleGroup(in, out)
	return
}

func convertModelIntoV1_RoleGroup(in *model.RoleGroup, out *configuration_center_v1.RoleGroup) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.Name = in.Name
	out.Description = in.Description
}

func convertModelToV1_RoleGroup(in *model.RoleGroup) (out *configuration_center_v1.RoleGroup) {
	if in == nil {
		return
	}
	out = &configuration_center_v1.RoleGroup{}
	convertModelIntoV1_RoleGroup(in, out)
	return
}

func convertModelToV1_RoleGroups(in []model.RoleGroup) (out []configuration_center_v1.RoleGroup) {
	if in == nil {
		return
	}
	out = make([]configuration_center_v1.RoleGroup, len(in))
	for i := range in {
		convertModelIntoV1_RoleGroup(&in[i], &out[i])
	}
	return
}

func convertModelIntoV1_Role(in *model.SystemRole, out *configuration_center_v1.Role) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.CreatedBy = in.CreatedBy
	out.UpdatedBy = in.UpdatedBy
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

func convertModelToV1_Roles(in []*model.SystemRole) (out []configuration_center_v1.Role) {
	if in == nil {
		return
	}
	out = make([]configuration_center_v1.Role, len(in))
	for i := range in {
		convertModelIntoV1_Role(in[i], &out[i])
	}
	return
}

func convertModelIntoV1_MetadataWithOperator(in *model.RoleGroup, createdName, updatedName string, out *frontend.MetadataWithOperator) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.CreatedBy = frontend.ReferenceWithName{
		Name: createdName,
	}
	out.UpdatedBy = frontend.ReferenceWithName{
		Name: updatedName,
	}
}

func convertModelToV1_MetadataWithOperator(in *model.RoleGroup, createdName, updatedName string) (out *frontend.MetadataWithOperator) {
	if in == nil {
		return
	}
	out = &frontend.MetadataWithOperator{}
	convertModelIntoV1_MetadataWithOperator(in, createdName, updatedName, out)
	return
}

func convertModelIntoV1_RoleGroupSpec(in *model.RoleGroup, out *configuration_center_v1.RoleGroupSpec) {
	out.Name = in.Name
	out.Description = in.Description
}

func convertModelToV1_RoleGroupSpec(in *model.RoleGroup) (out *configuration_center_v1.RoleGroupSpec) {
	if in == nil {
		return
	}
	out = &configuration_center_v1.RoleGroupSpec{}
	convertModelIntoV1_RoleGroupSpec(in, out)
	return
}
