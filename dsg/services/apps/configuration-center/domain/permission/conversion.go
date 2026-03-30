package permission

import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
)

func convertModelIntoV1_Permission(in *model.Permission, out *configuration_center_v1.Permission) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.Name = in.Name
	out.Category = configuration_center_v1.PermissionCategory(in.Category)
	out.Description = in.Description
}

func convertModelToV1_Permission(in *model.Permission) (out *configuration_center_v1.Permission) {
	if in == nil {
		return
	}
	out = &configuration_center_v1.Permission{}
	convertModelIntoV1_Permission(in, out)
	return
}

func convertModelToV1_Permissions(in []model.Permission) (out []configuration_center_v1.Permission) {
	if in == nil {
		return
	}
	out = make([]configuration_center_v1.Permission, len(in))
	for i := range in {
		convertModelIntoV1_Permission(&in[i], &out[i])
	}
	return
}
