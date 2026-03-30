package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func TestMain(m *testing.M) {
	// Initialize the logger, otherwise logging will panic.
	log.InitLogger(zapx.LogConfigs{}, &common.TelemetryConf{})
	m.Run()
}

func Test(t *testing.T) {

	intMap := make(map[int32]int32, 0)
	intMap[-1] = 15
	intMap[-2] = 5

	scopeMap := make(map[string]int32, 0)

	t.Skip("Scope.String() is undefined")
	// for scope, value := range intMap {
	// 	scopeMap[access_control.Scope(scope).String()] = value
	// }

	//var transfer ScopeTransfer
	var te ScopeTransfer
	marshal, err := json.Marshal(scopeMap)
	if err != nil {
		fmt.Println(err)
	}
	err = json.Unmarshal(marshal, &te)
	if err != nil {
		fmt.Println(err)
	}
	fmt.Println(te.BusinessDomainScope)
	fmt.Println(te.BusinessStructureScope)
	fmt.Println(te.BusinessModelScope)

}

func TestUser_GetUser(t *testing.T) {
	type args struct {
		userID string
		opts   user.GetUserOptions
	}
	type drivenResponse struct {
		userInfos []user_management.UserInfoV2
		err       error
	}
	tests := []struct {
		name           string
		args           args
		drivenResponse drivenResponse
		want           *user.User
		assertErr      assert.ErrorAssertionFunc
	}{
		{
			name: "get name",
			args: args{
				userID: "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				opts: user.GetUserOptions{
					Fields: []user.UserField{
						user.UserFieldName,
					},
				},
			},
			drivenResponse: drivenResponse{
				userInfos: []user_management.UserInfoV2{
					{
						ID:   "8455927c-1197-11ef-b3c3-7ab5ba133de2",
						Name: "Remilia Scarlet",
					},
				},
			},
			want: &user.User{
				ID:   "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				Name: "Remilia Scarlet",
			},
			assertErr: assert.NoError,
		},
		{
			name: "get parent_deps",
			args: args{
				userID: "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				opts: user.GetUserOptions{
					Fields: []user.UserField{
						user.UserFieldParentDeps,
					},
				},
			},
			drivenResponse: drivenResponse{
				userInfos: []user_management.UserInfoV2{
					{
						ID: "8455927c-1197-11ef-b3c3-7ab5ba133de2",
						ParentDeps: []user_management.DepartmentPath{
							{
								{
									ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
									Name: "AF研发线",
									Type: "department",
								},
								{
									ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
									Name: "数据资源运营研发部",
									Type: "department",
								},
								{
									ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
									Name: "数据资源管理开发组",
									Type: "department",
								},
							},
						},
					},
				},
			},
			want: &user.User{
				ID: "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				ParentDeps: []user.DepartmentPath{
					{
						{
							ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
							Name: "AF研发线",
						},
						{
							ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
							Name: "数据资源运营研发部",
						},
						{
							ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
							Name: "数据资源管理开发组",
						},
					},
				},
			},
			assertErr: assert.NoError,
		},
		{
			name: "get name and parent_deps",
			args: args{
				userID: "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				opts: user.GetUserOptions{
					Fields: []user.UserField{
						user.UserFieldName,
						user.UserFieldParentDeps,
					},
				},
			},
			drivenResponse: drivenResponse{
				userInfos: []user_management.UserInfoV2{
					{
						ID:   "8455927c-1197-11ef-b3c3-7ab5ba133de2",
						Name: "Remilia Scarlet",
						ParentDeps: []user_management.DepartmentPath{
							{
								{
									ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
									Name: "AF研发线",
									Type: "department",
								},
								{
									ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
									Name: "数据资源运营研发部",
									Type: "department",
								},
								{
									ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
									Name: "数据资源管理开发组",
									Type: "department",
								},
							},
						},
					},
				},
			},
			want: &user.User{
				ID:   "8455927c-1197-11ef-b3c3-7ab5ba133de2",
				Name: "Remilia Scarlet",
				ParentDeps: []user.DepartmentPath{
					{
						{
							ID:   "076cf984-020c-11ef-bdb6-7ab5ba133de2",
							Name: "AF研发线",
						},
						{
							ID:   "0dc4af48-020c-11ef-bdb6-7ab5ba133de2",
							Name: "数据资源运营研发部",
						},
						{
							ID:   "78d39772-0d01-11ef-bdb6-7ab5ba133de2",
							Name: "数据资源管理开发组",
						},
					},
				},
			},
			assertErr: assert.NoError,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			d := newFakeDrivenUserManagement(tt.drivenResponse.userInfos, tt.drivenResponse.err)

			u := &User{userMgm: d}

			got, err := u.GetUser(context.Background(), tt.args.userID, tt.args.opts)

			// assert return values
			assert.Equal(t, tt.want, got, "user")
			tt.assertErr(t, err, "error")

			// assert user-management driven args
			assert.Equal(t, []string{tt.args.userID}, d.calledUserIDs, "user-management: args: userIDs")
			assert.Equal(t, userManagementUserInfoFieldsFromUserFields(tt.args.opts.Fields), d.calledUserInfoFields, "user-management: args: userInfoFields")
		})
	}
}
