package impl

import (
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util/slices"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
)

func Test_orderByIsAuthorized(t *testing.T) {
	type args struct {
		authorizedSubViews map[string]bool
	}
	tests := []struct {
		name               string
		subViews           []sub_view.SubView
		authorizedSubViews map[string]bool
		// subViews[:index] 未被授权，subViews[index:] 被授权
		index int
	}{
		{
			name: "都未被授权",
			subViews: []sub_view.SubView{
				{ID: uuid.MustParse("00000000-0000-0000-0000-000000000000")},
				{ID: uuid.MustParse("00000000-0000-0000-1111-000000000000")},
				{ID: uuid.MustParse("00000000-0000-0000-2222-000000000000")},
			},
			authorizedSubViews: map[string]bool{},
			index:              3,
		},
		{
			name: "都被授权",
			subViews: []sub_view.SubView{
				{ID: uuid.MustParse("00000000-0000-0000-0000-000000000000")},
				{ID: uuid.MustParse("00000000-0000-0000-1111-000000000000")},
				{ID: uuid.MustParse("00000000-0000-0000-2222-000000000000")},
			},
			authorizedSubViews: map[string]bool{
				"00000000-0000-0000-0000-000000000000": true,
				"00000000-0000-0000-1111-000000000000": true,
				"00000000-0000-0000-2222-000000000000": true,
			},
		},
		{
			name: "部分被授权",
			subViews: []sub_view.SubView{
				{ID: uuid.MustParse("00000000-0000-0000-0000-000000000000")},
				{ID: uuid.MustParse("00000000-0000-0000-1111-000000000000")},
				{ID: uuid.MustParse("00000000-0000-0000-2222-000000000000")},
				{ID: uuid.MustParse("00000000-0000-0000-3333-000000000000")},
			},
			authorizedSubViews: map[string]bool{
				"00000000-0000-0000-0000-000000000000": true,
				"00000000-0000-0000-2222-000000000000": true,
			},
			index: 2,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			cmp := orderByIsAuthorized(tt.authorizedSubViews)
			slices.SortFunc(tt.subViews, cmp)
			for i, sv := range tt.subViews[:tt.index] {
				assert.False(t, tt.authorizedSubViews[sv.ID.String()], "subView[%d] should be unauthorized", i)
			}
			for i, sv := range tt.subViews[tt.index:] {
				assert.True(t, tt.authorizedSubViews[sv.ID.String()], "subView[%d] should be authorized", i+tt.index)
			}
		})
	}
}

func Test_newAuthorizedSubViewsForEnforceResponses(t *testing.T) {
	// testdata
	const (
		userID0 = "00000000-0000-0000-0000-000000000000"
		userID1 = "00000000-0000-0000-1111-000000000000"

		subViewID0 = "00000000-0000-1111-0000-000000000000"
	)
	type args struct {
		responses []auth_service.EnforceResponse
		userID    string
		actions   []string
	}
	tests := []struct {
		name string
		args args
		want map[string]bool
	}{
		{
			name: "符合要求",
			args: args{
				responses: []auth_service.EnforceResponse{
					{
						EnforceRequest: auth_service.EnforceRequest{
							SubjectType: auth_service.SubjectTypeUser,
							SubjectID:   userID0,
							ObjectType:  auth_service.ObjectTypeSubView,
							ObjectID:    subViewID0,
							Action:      auth_service.Action_Read,
						},
						Effect: auth_service.Effect_Allow,
					},
				},
				userID: userID0,
				actions: []string{
					auth_service.Action_Read,
				},
			},
			want: map[string]bool{
				subViewID0: true,
			},
		},
		{
			name: "忽略操作者类型不是用户",
			args: args{
				responses: []auth_service.EnforceResponse{
					{
						EnforceRequest: auth_service.EnforceRequest{
							SubjectType: auth_service.SubjectTypeRole,
							SubjectID:   userID0,
							ObjectType:  auth_service.ObjectTypeSubView,
							ObjectID:    subViewID0,
							Action:      auth_service.Action_Read,
						},
						Effect: auth_service.Effect_Allow,
					},
				},
				userID: userID0,
				actions: []string{
					auth_service.Action_Read,
				},
			},
		},
		{
			name: "忽略操作者类型不是指定用户",
			args: args{
				responses: []auth_service.EnforceResponse{
					{
						EnforceRequest: auth_service.EnforceRequest{
							SubjectType: auth_service.SubjectTypeUser,
							SubjectID:   userID1,
							ObjectType:  auth_service.ObjectTypeSubView,
							ObjectID:    subViewID0,
							Action:      auth_service.Action_Read,
						},
						Effect: auth_service.Effect_Allow,
					},
				},
				userID: userID0,
				actions: []string{
					auth_service.Action_Read,
				},
			},
		},
		{
			name: "忽略资源类型不是子视图",
			args: args{
				responses: []auth_service.EnforceResponse{
					{
						EnforceRequest: auth_service.EnforceRequest{
							SubjectType: auth_service.SubjectTypeUser,
							SubjectID:   userID0,
							ObjectType:  auth_service.ObjectTypeDataView,
							ObjectID:    subViewID0,
							Action:      auth_service.Action_Read,
						},
						Effect: auth_service.Effect_Allow,
					},
				},
				userID: userID0,
				actions: []string{
					auth_service.Action_Read,
				},
			},
		},
		{
			name: "忽略未包含指定动作",
			args: args{
				responses: []auth_service.EnforceResponse{
					{
						EnforceRequest: auth_service.EnforceRequest{
							SubjectType: auth_service.SubjectTypeUser,
							SubjectID:   userID0,
							ObjectType:  auth_service.ObjectTypeSubView,
							ObjectID:    subViewID0,
							Action:      auth_service.Action_Download,
						},
						Effect: auth_service.Effect_Allow,
					},
				},
				userID: userID0,
				actions: []string{
					auth_service.Action_Read,
				},
			},
		},
		{
			name: "忽略未被允许",
			args: args{
				responses: []auth_service.EnforceResponse{
					{
						EnforceRequest: auth_service.EnforceRequest{
							SubjectType: auth_service.SubjectTypeUser,
							SubjectID:   userID0,
							ObjectType:  auth_service.ObjectTypeSubView,
							ObjectID:    subViewID0,
							Action:      auth_service.Action_Read,
						},
						Effect: auth_service.Effect_Deny,
					},
				},
				userID: userID0,
				actions: []string{
					auth_service.Action_Read,
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := newAuthorizedSubViewsForEnforceResponses(tt.args.responses, tt.args.userID, tt.args.actions)
			assert.Equal(t, tt.want, got)
		})
	}
}
