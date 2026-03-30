package validation

import (
	"fmt"
	"strings"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/validation/field"
)

func TestValidateLogicViewAuthorizingRequestCreate(t *testing.T) {
	type args struct {
		req *dto.LogicViewAuthorizingRequest
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "合法",
			args: args{
				req: &dto.LogicViewAuthorizingRequest{
					Spec: dto.LogicViewAuthorizingRequestSpec{
						ID: "0190716f-d7ea-7bc0-bd8b-758dead5524d",
						Policies: []dto.SubjectPolicy{
							{
								SubjectType: dto.SubjectUser,
								SubjectID:   "0190716f-d7ea-7bc4-aa3d-4e464c3c51c4",
								Actions: []dto.Action{
									dto.ActionRead,
								},
							},
						},
						RequesterID: "0190716f-d7ea-7bc7-85de-974a9fbbc350",
						Reason:      "随便一个理由",
						Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
					},
				},
			},
		},
		{
			name: "不合法的 spec",
			args: args{
				req: &dto.LogicViewAuthorizingRequest{
					Spec: dto.LogicViewAuthorizingRequestSpec{
						ID: "01907170-0e00-744b-8366-ded38ec32ac4",
						Policies: []dto.SubjectPolicy{
							{
								SubjectType: dto.SubjectUser,
								SubjectID:   "01907170-0e00-7450-93ca-11d32465e090",
								Actions: []dto.Action{
									dto.ActionRead,
									dto.ActionRead,
								},
							},
						},
						RequesterID: "01907170-0e00-7454-863c-325b7ea2b91b",
						Reason:      "另一个理由",
						Usage:       dto.LogicViewAuthorizingRequestDemandManagement,
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeDuplicate,
					Field:    "spec.policies[0].actions[1]",
					BadValue: dto.ActionRead,
					Detail:   "",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateLogicViewAuthorizingRequestCreate(tt.args.req)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestValidateLogicViewAuthorizingRequestUpdate(t *testing.T) {
	type args struct {
		req *dto.LogicViewAuthorizingRequest
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "合法",
			args: args{
				req: &dto.LogicViewAuthorizingRequest{
					ID: "01907175-bb5e-76ad-a778-929dfb5fe071",
					Spec: dto.LogicViewAuthorizingRequestSpec{
						ID: "01907175-bb5e-76b1-b225-30cf3963934b",
						Policies: []dto.SubjectPolicy{
							{
								SubjectType: dto.SubjectUser,
								SubjectID:   "01907175-bb5e-76b4-ae32-271f08d30244",
								Actions: []dto.Action{
									dto.ActionRead,
								},
							},
						},
						RequesterID: "01907175-bb5e-76b6-a823-49ee48210ddb",
						Reason:      "随便一个理由",
					},
				},
			},
		},
		{
			name: "不合法的 ID",
			args: args{
				req: &dto.LogicViewAuthorizingRequest{
					ID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Spec: dto.LogicViewAuthorizingRequestSpec{
						ID: "01907173-5600-7dcd-93e3-0ee996041d16",
						Policies: []dto.SubjectPolicy{
							{
								SubjectType: dto.SubjectUser,
								SubjectID:   "01907173-5600-7dd1-9a30-3fefa52913f1",
								Actions: []dto.Action{
									dto.ActionRead,
								},
							},
						},
						RequesterID: "01907173-5600-7dd4-bd09-ae0f351b598a",
						Reason:      "随便一个理由",
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "id",
					BadValue: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Detail:   "id 必须是一个有效的 uuid",
				},
			},
		},
		{
			name: "不合法的 Spec",
			args: args{
				req: &dto.LogicViewAuthorizingRequest{
					ID: "01907174-4ccb-7eb0-90e4-2c092d480ded",
					Spec: dto.LogicViewAuthorizingRequestSpec{
						ID: "01907174-4ccb-7eb4-9a95-bf1c02084d00",
						Policies: []dto.SubjectPolicy{
							{
								SubjectType: dto.SubjectUser,
								SubjectID:   "01907174-4ccb-7eb7-a844-e2b44c97c17a",
								Actions: []dto.Action{
									dto.ActionRead,
								},
							},
						},
						Suspend:     true,
						RequesterID: "01907174-4ccb-7eba-86bd-84cb3ad25dfb",
						Reason:      "另一个理由",
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "spec.suspend",
					BadValue: true,
					Detail:   "only support changing to false",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateLogicViewAuthorizingRequestUpdate(tt.args.req)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestValidateLogicViewAuthorizingRequestCreateBatch(t *testing.T) {
	type args struct {
		req *dto.LogicViewAuthorizingRequestList
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "合法",
			args: args{
				req: &dto.LogicViewAuthorizingRequestList{
					Items: []dto.LogicViewAuthorizingRequest{
						{
							Spec: dto.LogicViewAuthorizingRequestSpec{
								ID: "0190717b-f25c-7341-a354-481a13e2567b",
								Policies: []dto.SubjectPolicy{
									{
										SubjectType: dto.SubjectUser,
										SubjectID:   "0190717b-f25c-7345-a92e-32a8a3163e8f",
										Actions: []dto.Action{
											dto.ActionRead,
										},
									},
								},
								RequesterID: "0190717b-f25c-7348-bce5-73c676c0200b",
								Reason:      "理由",
								Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
							},
						},
						{
							Spec: dto.LogicViewAuthorizingRequestSpec{
								ID: "0190717c-2b38-7905-b37e-9d6aca0b463d",
								SubViews: []dto.SubViewAuthorizingRequestSpec{
									{
										ID: "0190717c-2b38-790a-bf01-848e242b5309",
										Policies: []dto.SubjectPolicy{
											{
												SubjectType: dto.SubjectUser,
												SubjectID:   "0190717c-2b38-790d-b8bb-d7b0ab6f62e2",
												Actions: []dto.Action{
													dto.ActionRead,
												},
											},
										},
									},
								},
								RequesterID: "0190717c-2b38-7910-8dcd-10787822f63b",
								Reason:      "理由",
								Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
							},
						},
						{
							Spec: dto.LogicViewAuthorizingRequestSpec{
								ID: "0190717c-5f4c-7e36-9266-e5c28ed79ccf",
								SubViews: []dto.SubViewAuthorizingRequestSpec{
									{
										Spec: &dto.SubViewSpec{
											Name:        "东区数据",
											LogicViewID: "0190717c-5f4c-7e36-9266-e5c28ed79ccf",
											Detail:      "{}",
										},
										Policies: []dto.SubjectPolicy{
											{
												SubjectType: dto.SubjectUser,
												SubjectID:   "0190717c-5f4c-7e3b-84d0-779c053126ef",
												Actions: []dto.Action{
													dto.ActionRead,
												},
											},
										},
									},
								},
								RequesterID: "0190717c-5f4c-7e3e-a0af-ae95e7629f74",
								Reason:      "理由",
								Usage:       dto.LogicViewAuthorizingRequestDemandManagement,
							},
						},
					},
				},
			},
		},
		{
			name: "不合法",
			args: args{
				req: &dto.LogicViewAuthorizingRequestList{
					Items: []dto.LogicViewAuthorizingRequest{
						{
							Spec: dto.LogicViewAuthorizingRequestSpec{
								ID: "0190717b-f25c-7341-a354-481a13e2567b",
								Policies: []dto.SubjectPolicy{
									{
										SubjectType: dto.SubjectUser,
										SubjectID:   "0190717b-f25c-7345-a92e-32a8a3163e8f",
										Actions: []dto.Action{
											dto.ActionRead,
										},
									},
								},
								RequesterID: "0190717b-f25c-7348-bce5-73c676c0200b",
								Reason:      "理由",
								Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
							},
						},
						{
							Spec: dto.LogicViewAuthorizingRequestSpec{
								ID: "0190717c-2b38-7905-b37e-9d6aca0b463d",
								SubViews: []dto.SubViewAuthorizingRequestSpec{
									{
										ID: "0190717c-2b38-790a-bf01-848e242b5309",
										Policies: []dto.SubjectPolicy{
											{
												SubjectType: dto.SubjectUser,
												SubjectID:   "0190717c-2b38-790d-b8bb-d7b0ab6f62e2",
												Actions: []dto.Action{
													dto.ActionRead,
												},
											},
										},
									},
								},
								RequesterID: "0190717c-2b38-7910-8dcd-10787822f63b",
								Reason:      "理由",
								Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
							},
						},
						{
							Spec: dto.LogicViewAuthorizingRequestSpec{
								ID: "0190717c-5f4c-7e36-9266-e5c28ed79ccf",
								SubViews: []dto.SubViewAuthorizingRequestSpec{
									{
										Spec: &dto.SubViewSpec{
											Name:        "东区数据",
											LogicViewID: "0190717c-5f4c-7e36-9266-e5c28ed79ccf",
											Detail:      "{}",
										},
										Policies: []dto.SubjectPolicy{
											{
												SubjectType: dto.SubjectUser,
												SubjectID:   "0190717c-5f4c-7e3b-84d0-779c053126ef",
												Actions: []dto.Action{
													dto.ActionRead,
												},
											},
										},
									},
								},
								RequesterID: "0190717c-5f4c-7e3e-a0af-ae95e7629f74",
								Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
							},
						},
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "items[2].spec.reason",
					BadValue: "",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateLogicViewAuthorizingRequestCreateBatch(tt.args.req)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestValidateLogicViewAuthorizingRequestUpdateBatch(t *testing.T) {
	type args struct {
		req *dto.LogicViewAuthorizingRequestList
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "合法",
			args: args{
				req: &dto.LogicViewAuthorizingRequestList{
					Items: []dto.LogicViewAuthorizingRequest{
						{
							ID: "01907180-e2b5-725f-8b24-d1c3740c143c",
							Spec: dto.LogicViewAuthorizingRequestSpec{
								Suspend: false,
							},
						},
						{
							ID: "01907180-e2b5-7262-b88b-a6de31e9ea4f",
							Spec: dto.LogicViewAuthorizingRequestSpec{
								Suspend: false,
							},
						},
						{
							ID: "01907180-e2b5-7266-b412-a249737ddd29",
							Spec: dto.LogicViewAuthorizingRequestSpec{
								Suspend: false,
							},
						},
					},
				},
			},
		},
		{
			name: "不合法",
			args: args{
				req: &dto.LogicViewAuthorizingRequestList{
					Items: []dto.LogicViewAuthorizingRequest{
						{
							ID: "01907181-f913-7757-8e75-f72f4d1a86c6",
							Spec: dto.LogicViewAuthorizingRequestSpec{
								Suspend: true,
							},
						},
						{
							ID: "01907181-f913-775c-8063-a9742d916b11",
							Spec: dto.LogicViewAuthorizingRequestSpec{
								Suspend: true,
							},
						},
						{
							ID: "01907181-f913-7761-a75f-06444e5ed986",
							Spec: dto.LogicViewAuthorizingRequestSpec{
								Suspend: true,
							},
						},
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "items[0].spec.suspend",
					BadValue: true,
					Detail:   "only support changing to false",
				},
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "items[1].spec.suspend",
					BadValue: true,
					Detail:   "only support changing to false",
				},
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "items[2].spec.suspend",
					BadValue: true,
					Detail:   "only support changing to false",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateLogicViewAuthorizingRequestUpdateBatch(tt.args.req)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_validateLogicViewAuthorizingRequestSpecCreate(t *testing.T) {
	// fldPath 仅用于在错误中标识出错的字段，与验证逻辑关系不大，可以不做详细验证
	var fldPath = field.NewPath("a", "b")
	type args struct {
		spec *dto.LogicViewAuthorizingRequestSpec
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "申请逻辑视图整表",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "01906dc4-bc4f-719d-9a8c-402959a697db",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01906dc4-bc4f-71a1-a01e-d7e95c2b5732",
							Actions: []dto.Action{
								dto.ActionRead,
								dto.ActionDownload,
							},
						},
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01906dc4-bc4f-71a5-9534-fbc90dcf9d2f",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
					RequesterID: "01906dc4-bc4f-71a9-9ebe-644354a03118",
					Reason:      "随便一个理由",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
		},
		{
			name: "申请已存在的行列规则",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "01906dc6-65fc-7979-a1df-e7f9928e5c06",
					SubViews: []dto.SubViewAuthorizingRequestSpec{
						{
							ID: "01906dc6-65fc-797e-aa56-0f9903b75d9b",
							Policies: []dto.SubjectPolicy{
								{
									SubjectType: dto.SubjectUser,
									SubjectID:   "01906dc6-65fc-7981-a2ef-347aae53a3d8",
									Actions: []dto.Action{
										dto.ActionRead,
										dto.ActionDownload,
									},
								},
								{
									SubjectType: dto.SubjectUser,
									SubjectID:   "01906dc6-65fc-7984-80f0-0a86a3a37bf7",
									Actions: []dto.Action{
										dto.ActionRead,
									},
								},
							},
						},
					},
					RequesterID: "01906dc6-65fc-7989-b40f-378202933a8c",
					Reason:      "再编一个理由",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
		},
		{
			name: "申请新的行列规则",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "01906dc8-26ac-708f-986d-d8d49d14075b",
					SubViews: []dto.SubViewAuthorizingRequestSpec{
						{
							Spec: &dto.SubViewSpec{
								Name:        "东区数据",
								LogicViewID: "01906dc8-26ac-708f-986d-d8d49d14075b",
								Detail:      "{}",
							},
							Policies: []dto.SubjectPolicy{
								{
									SubjectType: dto.SubjectUser,
									SubjectID:   "01906dc8-26ac-7093-b837-4ca51482592d",
									Actions: []dto.Action{
										dto.ActionRead,
										dto.ActionDownload,
									},
								},
								{
									SubjectType: dto.SubjectUser,
									SubjectID:   "01906dc8-26ac-7096-b0be-bb04a1c445f4",
									Actions: []dto.Action{
										dto.ActionRead,
									},
								},
							},
						},
					},
					RequesterID: "01906dc8-26ac-709a-8e1f-3b7b786691e9",
					Reason:      "编不出来理由了",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
		},
		{
			name: "缺少逻辑视图 ID",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01906dc8-26ac-709a-8e1f-3b7b786691e9",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
					RequesterID: "01906dca-0eef-7597-93be-5460d94ce6a2",
					Reason:      "没有理由",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.id",
					BadValue: "",
				},
			},
		},
		{
			name: "未申请逻辑视图或行列规则",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID:          "01907114-3ad1-7bb1-beca-39d4f0c4d7ff",
					RequesterID: "01907114-3ad1-7bb5-be32-82647d44ec6a",
					Reason:      "申请理由",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b",
					BadValue: "",
					Detail:   "either .policies or .sub_views is required",
				},
			},
		},
		{
			name: "同时申请逻辑视图和行列规则",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "0190711c-63fc-73e7-a259-b2de3ded4a56",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "0190711c-63fc-73ee-9d42-1f63d93ed95d",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
					SubViews: []dto.SubViewAuthorizingRequestSpec{
						{
							ID: "0190711c-63fc-73f1-85c3-e26a45dd2a83",
							Policies: []dto.SubjectPolicy{
								{
									SubjectType: dto.SubjectUser,
									SubjectID:   "0190711c-63fc-73f3-bfe7-29194ddaa036",
									Actions: []dto.Action{
										dto.ActionRead,
									},
								},
							},
						},
					},
					RequesterID: "0190711c-63fc-73f7-93fb-fe62e690e503",
					Reason:      "同时申请",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b",
					BadValue: "",
					Detail:   ".policies and .sub_views are mutually exclusive",
				},
			},
		},
		{
			name: "申请多个行列规则",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "0190711f-50fa-7bc1-bbe9-88c0da160633",
					SubViews: []dto.SubViewAuthorizingRequestSpec{
						{
							ID: "0190711f-50fa-7bd1-bb77-0b6f2982ca81",
							Policies: []dto.SubjectPolicy{
								{
									SubjectType: dto.SubjectUser,
									SubjectID:   "0190711f-50fa-7bd4-ad14-c264d323fdfc",
									Actions: []dto.Action{
										dto.ActionRead,
									},
								},
							},
						},
						{
							ID: "0190711f-50fa-7bd7-9a49-40d926650aaa",
							Policies: []dto.SubjectPolicy{
								{
									SubjectType: dto.SubjectUser,
									SubjectID:   "0190711f-50fa-7bda-94c0-b8d23bd69f13",
									Actions: []dto.Action{
										dto.ActionRead,
									},
								},
							},
						},
					},
					RequesterID: "0190711f-50fa-7bde-bec8-e146ed462191",
					Reason:      "申请多个行列规则",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeTooMany,
					Field:    "a.b.sub_views",
					BadValue: 2,
					Detail:   "must have at most 1 items",
				},
			},
		},
		{
			name: "缺少申请者 ID",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "01907125-d5cf-72c1-91e7-8bbbedef83e8",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01907125-d5cf-72c5-8f57-349bf2c9883c",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
					Reason: "缺少申请者 ID",
					Usage:  dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.requester_id",
					BadValue: "",
				},
			},
		},
		{
			name: "缺少申请理由",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "01907127-1426-714a-9955-dfe4f8015e44",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01907127-1426-714f-8ee1-d90cb47943a4",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
					Suspend:     false,
					RequesterID: "01907127-1426-7154-b8cc-75a971cb9259",
					Usage:       dto.LogicViewAuthorizingRequestAuthorizingRequest,
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.reason",
					BadValue: "",
				},
			},
		},
		{
			name: "缺少用途",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "01909b20-0b15-7946-868d-e955c9fb42ed",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01909b20-0b15-794b-914a-20e029504b25",
							Actions: []dto.Action{
								dto.ActionRead,
								dto.ActionDownload,
							},
						},
					},
					RequesterID: "01909b20-0b15-794e-948c-4d71215c1c43",
					Reason:      "理由",
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.usage",
					BadValue: "",
				},
			},
		},
		{
			name: "不支持的用途",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					ID: "01909b21-453c-741a-8aaf-508b310d0266",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01909b21-453c-7420-8ccd-84d14dc980aa",
							Actions: []dto.Action{
								dto.ActionRead,
								dto.ActionDownload,
							},
						},
					},
					RequesterID: "01909b21-453c-7424-b3af-7e9667c50376",
					Reason:      "理由",
					Usage:       dto.LogicViewAuthorizingRequestUsage("Hello"),
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeNotSupported,
					Field:    "a.b.usage",
					BadValue: dto.LogicViewAuthorizingRequestUsage("Hello"),
					Detail:   `a.b.usage 必须是 AuthorizingRequest, DemandManagement 中的一个`,
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validateLogicViewAuthorizingRequestSpecCreate(tt.args.spec, fldPath)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_validateLogicViewAuthorizingRequestSpecUpdate(t *testing.T) {
	// fldPath 仅用于在错误中标识出错的字段，与验证逻辑关系不大，可以不做详细验证
	var fldPath = field.NewPath("a", "b")
	type args struct {
		spec *dto.LogicViewAuthorizingRequestSpec
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "更新 suspend 为 true",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					Suspend: true,
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b.suspend",
					BadValue: true,
					Detail:   "only support changing to false",
				},
			},
		},
		{
			name: "更新 suspend 为 false",
			args: args{
				spec: &dto.LogicViewAuthorizingRequestSpec{
					Suspend: false,
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validateLogicViewAuthorizingRequestSpecUpdate(tt.args.spec, fldPath)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_validateSubViewAuthorizingRequestSpec(t *testing.T) {
	// fldPath 仅用于在错误中标识出错的字段，与验证逻辑关系不大，可以不做详细验证
	var fldPath = field.NewPath("a", "b")
	type args struct {
		spec *dto.SubViewAuthorizingRequestSpec
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "引用的逻辑视图",
			args: args{
				spec: &dto.SubViewAuthorizingRequestSpec{
					ID: "01907135-4f5e-7c6a-ba02-a9c6a3023154",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01907135-4f5e-7c6e-9ea6-8de17465e860",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
				},
			},
		},
		{
			name: "创建新的行列规则",
			args: args{
				spec: &dto.SubViewAuthorizingRequestSpec{
					Spec: &dto.SubViewSpec{
						Name:        "东区数据",
						LogicViewID: "01907137-131d-771d-968e-4dbb5d96d711",
						Detail:      "{}",
					},
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01907137-131d-7725-b318-8e6e03496124",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
				},
			},
		},
		{
			name: "既引用已存在的行列规则，也创建新的行列规则",
			args: args{
				spec: &dto.SubViewAuthorizingRequestSpec{
					ID: "01907138-ecca-79cc-8201-8a40bfbe940c",
					Spec: &dto.SubViewSpec{
						Name:        "东区数据",
						LogicViewID: "01907138-ecca-79d5-86b2-1355913b1fe5",
						Detail:      "{}",
					},
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "01907138-ecca-79da-98d8-1f71ec09751b",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b",
					BadValue: "",
					Detail:   ".id and .spec are mutually exclusive",
				},
			},
		},
		{
			name: "既未引用已存在的行列规则，也未创建新的行列规则",
			args: args{
				spec: &dto.SubViewAuthorizingRequestSpec{
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "0190713a-1959-7f26-8a60-de832e5668df",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b",
					BadValue: "",
					Detail:   "either .id or .spec is required",
				},
			},
		},
		{
			name: "引用的逻辑视图 ID 不是 UUID",
			args: args{
				spec: &dto.SubViewAuthorizingRequestSpec{
					ID: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "0190713b-6b17-7db1-8cf7-f63ce1737ae0",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b.id",
					BadValue: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Detail:   "a.b.id 必须是一个有效的 uuid",
				},
			},
		},
		{
			name: "新的行列规则格式错误",
			args: args{
				spec: &dto.SubViewAuthorizingRequestSpec{
					Spec: &dto.SubViewSpec{
						LogicViewID: "0190713c-aaac-786e-bcdb-c15758f5f61e",
						Detail:      "{}",
					},
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "0190713c-aaac-7874-857c-7b54501bc369",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.spec.name",
					BadValue: "",
				},
			},
		},
		{
			name: "权限格式错误",
			args: args{
				spec: &dto.SubViewAuthorizingRequestSpec{
					ID: "0190713e-4c23-7808-8d24-5bf58c37d88e",
					Policies: []dto.SubjectPolicy{
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "0190713e-4c23-780e-87a2-82e6da9c88b5",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
						{
							SubjectType: dto.SubjectUser,
							SubjectID:   "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
							Actions: []dto.Action{
								dto.ActionRead,
							},
						},
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b.policies[1].subject_id",
					BadValue: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Detail:   "a.b.policies[1].subject_id 必须是一个有效的 uuid",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validateSubViewAuthorizingRequestSpec(tt.args.spec, fldPath)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_validateSubjectPolicy(t *testing.T) {
	// fldPath 仅用于在错误中标识出错的字段，与验证逻辑关系不大，可以不做详细验证
	var fldPath = field.NewPath("a", "b")
	type args struct {
		spec *dto.SubjectPolicy
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "为用户申请读取和下载",
			args: args{
				spec: &dto.SubjectPolicy{
					SubjectType: dto.SubjectUser,
					SubjectID:   "01907145-bcf1-7361-aabb-c61c9a4a4d7c",
					Actions: []dto.Action{
						dto.ActionRead,
						dto.ActionDownload,
					},
				},
			},
		},
		{
			name: "为用户申请读取和下载",
			args: args{
				spec: &dto.SubjectPolicy{
					SubjectType: dto.SubjectAPP,
					SubjectID:   "0191d4c9-208a-7f37-b411-b384dc49d517",
					Actions: []dto.Action{
						dto.ActionRead,
						dto.ActionDownload,
					},
				},
			},
		},
		{
			name: "缺少操作者类型",
			args: args{
				spec: &dto.SubjectPolicy{
					SubjectID: "01907165-6608-77ea-ab01-4c81b63204ad",
					Actions: []dto.Action{
						dto.ActionRead,
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    "a.b.subject_type",
					BadValue: "",
				},
			},
		},
		{
			name: "不支持的操作者类型",
			args: args{
				spec: &dto.SubjectPolicy{
					SubjectType: dto.SubjectRole,
					SubjectID:   "01907145-bcf1-7366-86e3-bc9daa6c27ee",
					Actions: []dto.Action{
						dto.ActionRead,
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeNotSupported,
					Field:    "a.b.subject_type",
					BadValue: dto.SubjectType("role"),
					Detail:   `a.b.subject_type 必须是 app, user 中的一个`,
				},
			},
		},
		{
			name: "操作者 ID 不是 UUID",
			args: args{
				spec: &dto.SubjectPolicy{
					SubjectType: dto.SubjectUser,
					SubjectID:   "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Actions: []dto.Action{
						dto.ActionRead,
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "a.b.subject_id",
					BadValue: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Detail:   "a.b.subject_id 必须是一个有效的 uuid",
				},
			},
		},
		{
			name: "不支持的动作类型",
			args: args{
				spec: &dto.SubjectPolicy{
					SubjectType: dto.SubjectUser,
					SubjectID:   "01907147-bc95-73e1-85af-eb0b49e64b88",
					Actions: []dto.Action{
						dto.ActionRead,
						"review",
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeNotSupported,
					Field:    "a.b.actions[1]",
					BadValue: dto.Action("review"),
					Detail:   `a.b.actions[1] 必须是 download, read 中的一个`,
				},
			},
		},
		{
			name: "重复的动作类型",
			args: args{
				spec: &dto.SubjectPolicy{
					SubjectType: dto.SubjectUser,
					SubjectID:   "01907147-bc95-73e1-85af-eb0b49e64b88",
					Actions: []dto.Action{
						dto.ActionRead,
						dto.ActionRead,
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeDuplicate,
					Field:    "a.b.actions[1]",
					BadValue: dto.ActionRead,
					Detail:   "",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validateSubjectPolicy(tt.args.spec, fldPath)
			assert.Equal(t, tt.want, got)
		})
	}
}

func TestValidateListLogicViewAuthorizingRequestOptions(t *testing.T) {
	type args struct {
		opts *dto.ListLogicViewAuthorizingRequestOptions
	}
	tests := []struct {
		name string
		args args
		want field.ErrorList
	}{
		{
			name: "指定单个 ID",
			args: args{
				opts: &dto.ListLogicViewAuthorizingRequestOptions{
					IDs: []string{
						"01907169-93f7-765c-9088-bad0517a49fb",
					},
				},
			},
		},
		{
			name: "指定多个 ID",
			args: args{
				opts: &dto.ListLogicViewAuthorizingRequestOptions{
					IDs: []string{
						"01907169-93f7-7660-97a3-adfa867dbd5d",
						"01907169-93f7-7663-aa87-d0053d77c664",
						"01907169-93f7-7665-99f2-b21571dd61c1",
					},
				},
			},
		},
		{
			name: "指定 ID 不是 UUID",
			args: args{
				opts: &dto.ListLogicViewAuthorizingRequestOptions{
					IDs: []string{
						"01907169-93f7-7668-bfb2-fe099bfc350b",
						"01907169-93f7-766b-b249-dee6c2124f79",
						"xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					},
				},
			},
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeInvalid,
					Field:    "id[2]",
					BadValue: "xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx",
					Detail:   "id[2] 必须是一个有效的 uuid",
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := ValidateListLogicViewAuthorizingRequestOptions(tt.args.opts)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_validateRequiredUTF8EncodedStringWithMaxLength(t *testing.T) {
	// fldPath 仅用于在错误中标识出错的字段，与验证逻辑关系不大，可以不做详细验证
	var fldPath = field.NewPath("a", "b")
	tests := []struct {
		name      string
		s         string
		maxLength int
		want      field.ErrorList
	}{
		{
			name: "空",
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeRequired,
					Field:    fldPath.String(),
					BadValue: "",
				},
			},
		},
		{
			name:      "英文",
			s:         strings.Repeat("a", 12450),
			maxLength: 12450,
		},
		{
			name:      "英文 超过长度限制",
			s:         strings.Repeat("a", 114514),
			maxLength: 12450,
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeTooLong,
					Field:    fldPath.String(),
					BadValue: strings.Repeat("a", 114514),
					Detail:   fmt.Sprintf("%s 长度必须不超过 %d", fldPath, 12450),
				},
			},
		},
		{
			name:      "中文",
			s:         strings.Repeat("寄", 12450),
			maxLength: 12450,
		},
		{
			name:      "中文 超过长度限制",
			s:         strings.Repeat("寄", 114514),
			maxLength: 12450,
			want: field.ErrorList{
				{
					Type:     field.ErrorTypeTooLong,
					Field:    fldPath.String(),
					BadValue: strings.Repeat("寄", 114514),
					Detail:   fmt.Sprintf("%s 长度必须不超过 %d", fldPath, 12450),
				},
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := validateRequiredUTF8EncodedStringWithMaxLength(tt.s, tt.maxLength, fldPath)
			assert.Equal(t, tt.want, got)
		})
	}
}
