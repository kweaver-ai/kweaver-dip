package user

import (
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
)

func completeUserListOptions(opts *configuration_center_v1.UserListOptions) {
	if opts.Sort == "" {
		opts.Sort = "updated_at"
	}
	if opts.Direction == "" {
		opts.Direction = meta_v1.Descending
	}
}

func completeUserRoleOrRoleGroupBindingBatchProcessing(p *configuration_center_v1.UserRoleOrRoleGroupBindingBatchProcessing) {
	bindings := sets.New[configuration_center_v1.UserRoleOrRoleGroupBinding]()
	for _, b := range p.Bindings {
		bindings.Insert(configuration_center_v1.UserRoleOrRoleGroupBinding{
			UserID:      b.UserID,
			RoleID:      b.RoleGroupID,
			RoleGroupID: b.RoleGroupID,
		})
	}

	for _, u := range p.UserIDs {
		for _, r := range p.RoleIDs {
			if bindings.Has(configuration_center_v1.UserRoleOrRoleGroupBinding{
				UserID: u,
				RoleID: r,
			}) {
				continue
			}
			p.Bindings = append(p.Bindings, configuration_center_v1.UserRoleOrRoleGroupBindingProcessing{
				UserRoleOrRoleGroupBinding: configuration_center_v1.UserRoleOrRoleGroupBinding{
					UserID: u,
					RoleID: r,
				},
				State: p.State,
			})
		}
	}

	for _, u := range p.UserIDs {
		for _, g := range p.RoleGroupIDs {
			if bindings.Has(configuration_center_v1.UserRoleOrRoleGroupBinding{
				UserID:      u,
				RoleGroupID: g,
			}) {
				continue
			}
			p.Bindings = append(p.Bindings, configuration_center_v1.UserRoleOrRoleGroupBindingProcessing{
				UserRoleOrRoleGroupBinding: configuration_center_v1.UserRoleOrRoleGroupBinding{
					UserID:      u,
					RoleGroupID: g,
				},
				State: p.State,
			})
		}
	}

	for i := range p.Bindings {
		if p.Bindings[i].State != "" {
			continue
		}
		p.Bindings[i].State = p.State
	}
}
