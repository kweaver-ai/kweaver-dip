package completion

import (
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
)

func TestCompleteLogicViewAuthorizingRequestSpec(t *testing.T) {
	type args struct {
		spec        *dto.LogicViewAuthorizingRequestSpec
		requesterID string
	}
	tests := []struct {
		name        string
		spec        *dto.LogicViewAuthorizingRequestSpec
		requesterID string
		want        *dto.LogicViewAuthorizingRequestSpec
	}{
		{
			name: "不需要补全",
			spec: &dto.LogicViewAuthorizingRequestSpec{
				ID:          "00000000-0000-0000-0000-000000000000",
				RequesterID: "00000000-0000-0000-1111-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{
							LogicViewID: "00000000-0000-0000-2222-000000000000",
						},
					},
				},
				Usage: dto.LogicViewAuthorizingRequestDemandManagement,
			},
			requesterID: "00000000-0000-0000-3333-000000000000",
			want: &dto.LogicViewAuthorizingRequestSpec{
				ID:          "00000000-0000-0000-0000-000000000000",
				RequesterID: "00000000-0000-0000-1111-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{
							LogicViewID: "00000000-0000-0000-2222-000000000000",
						},
					},
				},
				Usage: dto.LogicViewAuthorizingRequestDemandManagement,
			},
		},
		{
			name: "补全 RequesterID",
			spec: &dto.LogicViewAuthorizingRequestSpec{
				ID: "00000000-0000-0000-0000-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{
							LogicViewID: "00000000-0000-0000-1111-000000000000",
						},
					},
				},
				Usage: dto.LogicViewAuthorizingRequestAuthorizingRequest,
			},
			requesterID: "00000000-0000-0000-2222-000000000000",
			want: &dto.LogicViewAuthorizingRequestSpec{
				ID:          "00000000-0000-0000-0000-000000000000",
				RequesterID: "00000000-0000-0000-2222-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{
							LogicViewID: "00000000-0000-0000-1111-000000000000",
						},
					},
				},
				Usage: dto.LogicViewAuthorizingRequestAuthorizingRequest,
			},
		},
		{
			name: "补全 SubViewSpec.LogicViewID",
			spec: &dto.LogicViewAuthorizingRequestSpec{
				ID:          "00000000-0000-0000-0000-000000000000",
				RequesterID: "00000000-0000-0000-1111-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{},
					},
				},
				Usage: dto.LogicViewAuthorizingRequestAuthorizingRequest,
			},
			requesterID: "00000000-0000-0000-2222-000000000000",
			want: &dto.LogicViewAuthorizingRequestSpec{
				ID:          "00000000-0000-0000-0000-000000000000",
				RequesterID: "00000000-0000-0000-1111-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{
							LogicViewID: "00000000-0000-0000-0000-000000000000",
						},
					},
				},
				Usage: dto.LogicViewAuthorizingRequestAuthorizingRequest,
			},
		},
		{
			name: "补全 LogicViewAuthorizingRequestUsage",
			spec: &dto.LogicViewAuthorizingRequestSpec{
				ID:          "00000000-0000-0000-0000-000000000000",
				RequesterID: "00000000-0000-0000-1111-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{
							LogicViewID: "00000000-0000-0000-2222-000000000000",
						},
					},
				},
			},
			requesterID: "00000000-0000-0000-3333-000000000000",
			want: &dto.LogicViewAuthorizingRequestSpec{
				ID:          "00000000-0000-0000-0000-000000000000",
				RequesterID: "00000000-0000-0000-1111-000000000000",
				SubViews: []dto.SubViewAuthorizingRequestSpec{
					{
						Spec: &dto.SubViewSpec{
							LogicViewID: "00000000-0000-0000-2222-000000000000",
						},
					},
				},
				Usage: dto.LogicViewAuthorizingRequestAuthorizingRequest,
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			CompleteLogicViewAuthorizingRequestSpec(tt.spec, tt.requesterID)
			assert.Equal(t, tt.want, tt.spec)
		})
	}
}
