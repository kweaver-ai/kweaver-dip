package completion

import "github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"

// CompleteLogicViewAuthorizingRequestSpec 补全 LogicViewAuthorizingRequestSpec
func CompleteLogicViewAuthorizingRequestSpec(spec *dto.LogicViewAuthorizingRequestSpec, requesterID string) {
	// 补全 RequesterID
	if spec.RequesterID == "" && requesterID != "" {
		spec.RequesterID = requesterID
	}

	// 补全 Usage
	if spec.Usage == "" {
		spec.Usage = dto.LogicViewAuthorizingRequestAuthorizingRequest
	}

	// 补全 SubViewSpec.LogicViewID
	for i := range spec.SubViews {
		if spec.SubViews[i].Spec == nil || spec.SubViews[i].Spec.LogicViewID != "" {
			continue
		}
		spec.SubViews[i].Spec.LogicViewID = spec.ID
	}
}
