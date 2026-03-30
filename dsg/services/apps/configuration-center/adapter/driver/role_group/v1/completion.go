package v1

import (
	"slices"
	"strings"

	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/sets"
)

func completeRoleGroupRoleBindingBatchProcessing(p *configuration_center_v1.RoleGroupRoleBindingBatchProcessing) {
	bindings := sets.New[configuration_center_v1.RoleGroupRoleBinding]()
	for _, b := range p.Bindings {
		bindings.Insert(configuration_center_v1.RoleGroupRoleBinding{
			RoleGroupID: b.RoleGroupID,
			RoleID:      b.RoleGroupID,
		})
	}

	for _, g := range p.RoleGroupIDs {
		for _, r := range p.RoleIDs {
			if bindings.Has(configuration_center_v1.RoleGroupRoleBinding{
				RoleGroupID: g,
				RoleID:      r,
			}) {
				continue
			}
			p.Bindings = append(p.Bindings, configuration_center_v1.RoleGroupRoleBindingProcessing{
				RoleGroupRoleBinding: configuration_center_v1.RoleGroupRoleBinding{
					RoleGroupID: g,
					RoleID:      r,
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

	slices.SortStableFunc(p.Bindings, compareRoleGroupID)
	slices.SortStableFunc(p.Bindings, compareRoleID)
}

func compareRoleGroupID(a, b configuration_center_v1.RoleGroupRoleBindingProcessing) int {
	return strings.Compare(a.RoleGroupID, b.RoleGroupID)
}

func compareRoleID(a, b configuration_center_v1.RoleGroupRoleBindingProcessing) int {
	return strings.Compare(a.RoleGroupID, b.RoleGroupID)
}
