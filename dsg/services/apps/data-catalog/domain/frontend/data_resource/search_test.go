package data_resource

import (
	"context"
	"testing"

	"github.com/stretchr/testify/assert"
	"go.uber.org/mock/gomock"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service/mock"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
)

func Test_dataResourceDomain_dataResourceHasPermissionIDs(t *testing.T) {
	type underlying struct {
		// args
		ctx  any
		opts auth_service.GetObjectsOptions
		// return
		list *auth_service.ObjectWithPermissionsList
		err  error
	}
	type args struct {
		ctx    context.Context
		filter Filter
	}
	tests := []struct {
		name       string
		args       args
		underlying underlying
		want       []string
		assertErr  assert.ErrorAssertionFunc
	}{
		{
			name: "获取所有有权限的数据资源",
			args: args{
				ctx: context.WithValue(context.Background(), interception.InfoName, &middleware.User{ID: "ffd81438-e676-42db-b08c-016e40bd3335"}),
			},
			underlying: underlying{
				ctx: gomock.Any(),
				opts: auth_service.GetObjectsOptions{
					SubjectType: auth_service.SubjectTypeUser,
					SubjectID:   "ffd81438-e676-42db-b08c-016e40bd3335",
					ObjectTypes: []auth_service.ObjectType{
						auth_service.ObjectTypeAPI,
						auth_service.ObjectTypeDataView,
					},
				},
				list: &auth_service.ObjectWithPermissionsList{
					Entries: []auth_service.ObjectWithPermissions{
						// 拥有 read & download 权限的 DataView
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "ac211336-180d-4440-bbc3-dfd4ba36db65",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionDownload,
									Effect: auth_service.PolicyEffectAllow,
								},
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// 仅拥有 read 权限的 DataView
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "ac211336-180d-4440-bbc3-dfd4ba36db65",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// 拥有 read 权限的 API
						{
							ObjectType: auth_service.ObjectTypeAPI,
							ObjectID:   "b6acc25b-5783-4d7c-8291-c23906ce6984",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
					},
					TotalCount: 3,
				},
			},
			want: []string{
				"ac211336-180d-4440-bbc3-dfd4ba36db65",
				"b6acc25b-5783-4d7c-8291-c23906ce6984",
			},
			assertErr: assert.NoError,
		},
		{
			name: "指定资源 ID",
			args: args{
				ctx: context.WithValue(context.Background(), interception.InfoName, &middleware.User{ID: "77641be2-e6aa-49c8-a7ea-a9b3b13b7193"}),
				filter: Filter{
					IDs: []string{
						"21a73422-339f-4871-bded-988df24494d9",
						"0603f8de-2804-4021-9a4e-b58a7ec5bf32",
						"e15d57bd-fe89-463b-bfea-a248c7d023ca",
					},
				},
			},
			underlying: underlying{
				ctx: gomock.Any(),
				opts: auth_service.GetObjectsOptions{
					SubjectType: auth_service.SubjectTypeUser,
					SubjectID:   "77641be2-e6aa-49c8-a7ea-a9b3b13b7193",
					ObjectTypes: []auth_service.ObjectType{
						auth_service.ObjectTypeAPI,
						auth_service.ObjectTypeDataView,
					},
				},
				list: &auth_service.ObjectWithPermissionsList{
					Entries: []auth_service.ObjectWithPermissions{
						// filter.IDs 中指定，且有权限
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "21a73422-339f-4871-bded-988df24494d9",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
								{
									Action: auth_service.PolicyActionDownload,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// filter.IDs 中指定，且有权限
						{
							ObjectType: auth_service.ObjectTypeAPI,
							ObjectID:   "0603f8de-2804-4021-9a4e-b58a7ec5bf32",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// filter.IDs 中指定，但没有权限
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "e15d57bd-fe89-463b-bfea-a248c7d023ca",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// filter.IDs 中未指定，但有权限
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "82632bcb-db30-4c53-b320-1d5822bad811",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
								{
									Action: auth_service.PolicyActionDownload,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// filter.IDs 中未指定，且没有权限
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "685e5680-6cf2-4d12-b246-2e21804e5c32",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
					},
					TotalCount: 5,
				},
			},
			want: []string{
				"0603f8de-2804-4021-9a4e-b58a7ec5bf32",
				"21a73422-339f-4871-bded-988df24494d9",
			},
			assertErr: assert.NoError,
		},
		{
			name: "指定资源类型",
			args: args{
				ctx:    context.WithValue(context.Background(), interception.InfoName, &middleware.User{ID: "0696e0e6-178c-48c0-bddf-00d871997da7"}),
				filter: Filter{Type: DataResourceTypeDataView},
			},
			underlying: underlying{
				ctx: gomock.Any(),
				opts: auth_service.GetObjectsOptions{
					SubjectType: auth_service.SubjectTypeUser,
					SubjectID:   "0696e0e6-178c-48c0-bddf-00d871997da7",
					ObjectTypes: []auth_service.ObjectType{auth_service.ObjectTypeDataView},
				},
				list: &auth_service.ObjectWithPermissionsList{
					Entries: []auth_service.ObjectWithPermissions{
						// 指定的类型，有权限
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "4eb2bf31-5df4-4ee9-955f-d9e62221e26f",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
								{
									Action: auth_service.PolicyActionDownload,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// 指定的类型，无权限
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "73d6317b-1952-4267-99ab-751bc5e025b4",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// 未指定的类型，有权限
						{
							ObjectType: auth_service.ObjectTypeAPI,
							ObjectID:   "df61ad0c-4d07-4585-8624-c57f8ea54509",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// TODO: 未指定的类型，无权限
					},
					TotalCount: 3,
				},
				err: nil,
			},
			want:      []string{"4eb2bf31-5df4-4ee9-955f-d9e62221e26f"},
			assertErr: assert.NoError,
		},
		{
			name: "当前用户未拥有任何资源的权限",
			args: args{
				ctx: context.WithValue(context.Background(), interception.InfoName, &middleware.User{ID: "0696e0e6-178c-48c0-bddf-00d871997da7"}),
			},
			underlying: underlying{
				ctx: gomock.Any(),
				opts: auth_service.GetObjectsOptions{
					SubjectType: auth_service.SubjectTypeUser,
					SubjectID:   "0696e0e6-178c-48c0-bddf-00d871997da7",
					ObjectTypes: []auth_service.ObjectType{
						auth_service.ObjectTypeAPI,
						auth_service.ObjectTypeDataView,
					},
				},
				list: &auth_service.ObjectWithPermissionsList{},
			},
			assertErr: assert.NoError,
		},
		{
			name: "当前用户未拥有指定的资源的对应权限",
			args: args{
				ctx:    context.WithValue(context.Background(), interception.InfoName, &middleware.User{ID: "6ee1ee3c-bd86-4708-b3ab-c219c5ec80c6"}),
				filter: Filter{IDs: []string{}},
			},
			underlying: underlying{
				ctx: gomock.Any(),
				opts: auth_service.GetObjectsOptions{
					SubjectType: auth_service.SubjectTypeUser,
					SubjectID:   "6ee1ee3c-bd86-4708-b3ab-c219c5ec80c6",
					ObjectTypes: []auth_service.ObjectType{
						auth_service.ObjectTypeAPI,
						auth_service.ObjectTypeDataView,
					},
				},
				list: &auth_service.ObjectWithPermissionsList{
					Entries: []auth_service.ObjectWithPermissions{
						// 缺少 download 权限的 DateView
						{
							ObjectType: auth_service.ObjectTypeDataView,
							ObjectID:   "0947e8cc-31fa-11ef-a52d-005056b4b3fc",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionRead,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
						// 缺少 read 权限的 API
						{
							ObjectType: auth_service.ObjectTypeAPI,
							ObjectID:   "0c621582-31fa-11ef-8a47-005056b4b3fc",
							Permissions: []auth_service.PermissionV2{
								{
									Action: auth_service.PolicyActionDownload,
									Effect: auth_service.PolicyEffectAllow,
								},
							},
						},
					},
					TotalCount: 2,
				},
				err: nil,
			},
			assertErr: assert.NoError,
		},
		// TODO: 获取当前用户拥有任意权限的数据资源
		// {
		// 	name: "获取当前用户拥有任意权限的数据资源",
		// },
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			ctrl := gomock.NewController(t)

			mockAuthServiceRepo := mock.NewMockRepo(ctrl)
			mockAuthServiceRepo.
				EXPECT().
				GetSubjectObjects(tt.underlying.ctx, tt.underlying.opts).
				Return(tt.underlying.list, tt.underlying.err).
				AnyTimes()

			d := &dataResourceDomain{asRepo: mockAuthServiceRepo}

			got, err := d.dataResourceHasPermissionIDs(tt.args.ctx, tt.args.filter)

			assert.Equal(t, tt.want, got)
			tt.assertErr(t, err)
		})
	}
}
