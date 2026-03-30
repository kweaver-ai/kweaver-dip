package impl

import (
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

//
//var (
//	project_info = &model.TcProject{
//		ID:           "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//		Name:         "项目180",
//		Description:  sql.NullString{Valid: true, String: "描述8"},
//		Image:        "26b5339e-92f8-46f1-b240-87c550f5c215",
//		FlowID:       "1fe7e791-14a3-44f5-ad0c-462449598c1e",
//		FlowVersion:  "56efb357-7953-4582-8375-9e87c3f469d0",
//		Status:       1,
//		Priority:     1,
//		OwnerID:      "37a051c9-07cf-4786-8f8e-6b287bd0f6c7",
//		Deadline:     sql.NullInt64{Int64: int64(1871724800), Valid: true},
//		CreatedByUID: "37a051c9-07cf-4786-8f8e-6b287bd0f6c7",
//		CreatedAt:    time.Unix(1671751864, 0),
//		UpdatedByUID: "37a051c9-07cf-4786-8f8e-6b287bd0f6c7",
//		UpdatedAt:    time.Unix(1671751864, 0),
//	}
//	members = []*model.TcMember{
//		{
//			ObjID:  "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//			RoleID: "3c86b2ff-97e0-4d8b-a904-c8a01fc444fd",
//			UserID: "37a051c9-07cf-4786-8f8e-6b287bd0f6c7",
//		},
//		{
//			ObjID:  "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//			RoleID: "3c86b2ff-97e0-4d8b-a904-c8a01fc444fd",
//			UserID: "b5d1e1d1-fb73-49c7-a82c-9864830944f0",
//		},
//	}
//	flowInfo = tc_project.PipeLineInfo{
//		Id:      "82133b8f-47ed-4785-a890-d46a7bce0bf5",
//		Version: "76dc26c8-eb22-4174-bee0-887e1d03826c",
//		Name:    "测试使用",
//		Nodes: []tc_project.FlowNodeInfo{
//			{TaskConfig: tc_project.NodeTaskConfig{
//				ExecRole: tc_project.TaskExecRole{
//					Id:   "09095468-122a-4c6a-8bd3-0c2e438782de",
//					Name: "业务运营人员",
//				},
//			}},
//			{TaskConfig: tc_project.NodeTaskConfig{
//				ExecRole: tc_project.TaskExecRole{
//					Id:   "80723e9b-b7ee-487b-bc66-7244f995f41f",
//					Name: "数据局",
//				},
//			}},
//		},
//	}
//	tcProjects = []model.TcProject{
//		{
//			ID:           "c3fc581a-aa41-45c1-9191-82a93b6f1d8a",
//			Name:         "项目24467",
//			Description:  sql.NullString{Valid: true, String: "项目24467"},
//			Image:        "26b5339e-92f8-46f1-b240-87c550f5c215",
//			FlowID:       "1fe7e791-14a3-44f5-ad0c-462449598c1e",
//			FlowVersion:  "56efb357-7953-4582-8375-9e87c3f469d0",
//			Status:       1,
//			Priority:     3,
//			OwnerID:      "37a051c9-07cf-4786-8f8e-6b287bd0f6c7",
//			Deadline:     sql.NullInt64{Int64: int64(1871724800), Valid: true},
//			CreatedByUID: "4db10c8e-def6-444a-9eab-54f6fc17d79a",
//			CreatedAt:    time.Unix(1672192892, 0),
//			UpdatedByUID: "4db10c8e-def6-444a-9eab-54f6fc17d79a",
//			UpdatedAt:    time.Unix(1672192892, 0),
//		},
//		{
//			ID:           "a99df78e-6ace-4ba7-ab6b-c736957e82fe",
//			Name:         "项目2447",
//			Description:  sql.NullString{Valid: true, String: "项目2447"},
//			Image:        "26b5339e-92f8-46f1-b240-87c550f5c215",
//			FlowID:       "1fe7e791-14a3-44f5-ad0c-462449598c1e",
//			FlowVersion:  "56efb357-7953-4582-8375-9e87c3f469d0",
//			Status:       2,
//			Priority:     3,
//			OwnerID:      "78fc618f-6bdb-42fd-b547-913677d7ffae",
//			Deadline:     sql.NullInt64{Int64: int64(1871724800), Valid: true},
//			CreatedByUID: "4db10c8e-def6-444a-9eab-54f6fc17d79a",
//			CreatedAt:    time.Unix(1672191239, 0),
//			UpdatedByUID: "4db10c8e-def6-444a-9eab-54f6fc17d79a",
//			UpdatedAt:    time.Unix(1672227239, 0),
//		},
//	}
//)
//
//type MockProjectUserCase struct {
//	project *impl5.MockProjectRepo
//	oss     *impl3.MockOssRepo
//	member  *impl4.MockMemberRepo
//}
//
//func NewMockProjectUserCase(t1 *testing.T) *MockProjectUserCase {
//	ctl := gomock.NewController(t1)
//	return &MockProjectUserCase{
//		project: impl5.NewMockProjectRepo(ctl),
//		oss:     impl3.NewMockOssRepo(ctl),
//		member:  impl4.NewMockMemberRepo(ctl),
//	}
//}
//
////func (m *MockProjectUserCase) New() *ProjectUserCase {
////	return NewProjectUserCase(m.project, m.oss, m.member)
////}
//
//func mockHttp(method, urlReg string, status int, body string) {
//	httpmock.Activate()
//	reg, _ := regexp.Compile(urlReg)
//	httpmock.RegisterRegexpResponder(method, reg, httpmock.NewStringResponder(status, body))
//}
//
////TestCreateProject_QueryError query error
//func TestCreateProject_QueryError(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, errors.New("query error"))
//
//	err := m.New().Create(context.TODO(), &tc_project.ProjectReqModel{})
//	assert.NotNil(t1, err)
//}
//
////TestCreateProject_ProjectNameExists project name exists
//func TestCreateProject_ProjectNameExists(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil)
//
//	err := m.New().Create(context.TODO(), &tc_project.ProjectReqModel{})
//	assert.NotNil(t1, err)
//}
//
////TestCreateProject_ImageCheckFailed1  project name exists
//func TestCreateProject_ImageCheckFailed1(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
//	m.oss.EXPECT().Get(gomock.Any(), gomock.Any()).Return(nil, errors.New("image uuid not exists"))
//
//	reqData := &tc_project.ProjectReqModel{Image: "123456"}
//	err := m.New().Create(context.TODO(), reqData)
//	assert.NotNil(t1, err)
//
//}
//
////TestCreateProject_ImageCheckFailed2   image address check fail case 1
//func TestCreateProject_ImageCheckFailed2(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
//	m.oss.EXPECT().Get(gomock.Any(), gomock.Any()).Return(nil, gorm.ErrRecordNotFound)
//
//	reqData := &tc_project.ProjectReqModel{Image: "123456"}
//	err := m.New().Create(context.TODO(), reqData)
//	assert.NotNil(t1, err)
//}
//
//func TestCreateProject_QueryFlowInfoError(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
//	m.oss.EXPECT().Get(gomock.Any(), gomock.Any()).Return(nil, nil)
//	mockHttp(http.MethodGet, "/api/configuration-center/v1/flowchart-configurations", http.StatusInternalServerError, "")
//
//	defer httpmock.DeactivateAndReset()
//
//	reqData := &tc_project.ProjectReqModel{Image: "12345"}
//	err := m.New().Create(context.TODO(), reqData)
//	assert.NotNil(t1, err)
//}
//
//func TestCreateProject_InsertError(t1 *testing.T) {
//	//init user case
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
//	m.oss.EXPECT().Get(gomock.Any(), gomock.Any()).Return(nil, nil)
//	m.project.EXPECT().Insert(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(errors.New("insert error"))
//
//	bts, _ := json.Marshal(piplineInfo)
//	mockHttp(http.MethodGet, "/api/configuration-center/v1/flowchart-configurations", http.StatusOK, string(bts))
//
//	defer httpmock.DeactivateAndReset()
//
//	reqData := &tc_project.ProjectReqModel{
//		Name:         "测试项目",
//		Description:  "测试流水线",
//		Image:        "12345",
//		FlowID:       util.NewUUID(),
//		FlowVersion:  util.NewUUID(),
//		Priority:     constant.PriorityToString(constant.PriorityCommon.ToInt8()),
//		OwnerID:      util.NewUUID(),
//		Deadline:     time.Now().Add(time.Duration(time.Second * 1000)).Unix(),
//		CreatedByUID: util.NewUUID(),
//		Members: []tc_project.ProjectMember{{
//			UserId: util.NewUUID(),
//			Roles:  []string{util.NewUUID()},
//		}},
//	}
//	err := m.New().Create(context.TODO(), reqData)
//	assert.NotNil(t1, err)
//}
//
//func TestCreateProject_ok(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
//	m.oss.EXPECT().Get(gomock.Any(), gomock.Any()).Return(nil, nil)
//	m.project.EXPECT().Insert(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
//
//	bts, _ := json.Marshal(piplineInfo)
//	mockHttp(http.MethodGet, "/api/configuration-center/v1/flowchart-configurations", http.StatusOK, string(bts))
//
//	defer httpmock.DeactivateAndReset()
//
//	reqData := &tc_project.ProjectReqModel{
//		Name:         "测试项目",
//		Description:  "测试流水线",
//		Image:        "12345",
//		FlowID:       util.NewUUID(),
//		FlowVersion:  util.NewUUID(),
//		Priority:     constant.PriorityToString(constant.PriorityCommon.ToInt8()),
//		OwnerID:      util.NewUUID(),
//		Deadline:     time.Now().Add(time.Duration(time.Second * 1000)).Unix(),
//		CreatedByUID: util.NewUUID(),
//		Members: []tc_project.ProjectMember{{
//			UserId: util.NewUUID(),
//			Roles:  []string{util.NewUUID()},
//		}},
//	}
//	err := m.New().Create(context.TODO(), reqData)
//	assert.Nil(t1, err)
//}
//
//func TestUpdateProject_GetError(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	m.project.EXPECT().Get(gomock.Any(), gomock.Any()).Return(nil, errors.New("query error"))
//
//	reqData := &tc_project.ProjectEditModel{ID: util.NewUUID()}
//	err := m.New().Update(context.TODO(), reqData)
//	assert.NotNil(t1, err)
//}
//
//func TestUpdateProject_ok(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	reqData := &tc_project.ProjectEditModel{
//		ID:           util.NewUUID(),
//		Name:         "测试项目",
//		Description:  "测试流水线",
//		Image:        "12345",
//		Priority:     constant.PriorityToString(constant.PriorityCommon.ToInt8()),
//		OwnerID:      util.NewUUID(),
//		Deadline:     time.Now().Add(time.Duration(time.Second * 1000)).Unix(),
//		CreatedByUID: util.NewUUID(),
//		UpdatedByUID: util.NewUUID(),
//		Members: []tc_project.ProjectMember{{
//			UserId: util.NewUUID(),
//			Roles:  []string{util.NewUUID()},
//		}},
//	}
//
//	oldData := &model.TcProject{
//		ID:           reqData.ID,
//		Name:         "测试项目",
//		Description:  sql.NullString{String: "测试流水线"},
//		Image:        util.NewUUID(),
//		FlowID:       util.NewUUID(),
//		FlowVersion:  util.NewUUID(),
//		Status:       constant.StatusOngoing.ToInt8(),
//		Priority:     constant.PriorityCommon.ToInt8(),
//		OwnerID:      util.NewUUID(),
//		Deadline:     sql.NullInt64{Int64: time.Now().Add(time.Duration(time.Second * 1000)).Unix()},
//		CreatedByUID: util.NewUUID(),
//		CreatedAt:    time.Now(),
//		UpdatedByUID: util.NewUUID(),
//		UpdatedAt:    time.Now(),
//	}
//
//	m.project.EXPECT().Get(gomock.Any(), gomock.Any()).Return(oldData, nil)
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil)
//	m.oss.EXPECT().Get(gomock.Any(), gomock.Any()).Return(nil, nil)
//	m.project.EXPECT().Update(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil)
//
//	bts, _ := json.Marshal(piplineInfo)
//	mockHttp(http.MethodGet, "/api/configuration-center/v1/flowchart-configurations", http.StatusOK, string(bts))
//
//	err := m.New().Update(context.TODO(), reqData)
//	assert.Nil(t1, err)
//}
//
//func TestProjectQuery(t1 *testing.T) {
//	m := NewMockProjectUserCase(t1)
//
//	//mock setting
//	m.project.EXPECT().Get(gomock.Any(), gomock.Any()).Return(project_info, nil).AnyTimes()
//	m.member.EXPECT().Query(gomock.Any(), gomock.Any(), gomock.Any()).Return(members, nil).AnyTimes()
//
//	projectId := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	detail, err := m.New().GetDetail(context.TODO(), projectId)
//	assert.Nil(t1, err)
//	assert.NotNil(t1, detail)
//}
//
//func TestProjectCheckRepeat(t *testing.T) {
//	m := NewMockProjectUserCase(t)
//
//	//mock setting
//	m.project.EXPECT().CheckRepeat(gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil).AnyTimes()
//
//	req := tc_project.ProjectNameRepeatReq{
//		Id:   "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//		Name: "aaa",
//	}
//	err := m.New().CheckRepeat(context.TODO(), req)
//	assert.NotNil(t, err)
//}
//
//func TestGetProjectCandidate(t *testing.T) {
//	m := NewMockProjectUserCase(t)
//
//	//mock setting
//	roles := []string{"3c86b2ff-97e0-4d8b-a904-c8a01fc444fd", "80723e9b-b7ee-487b-bc66-7244f995f41f"}
//	m.project.EXPECT().TaskRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return(roles, nil).AnyTimes()
//	m.project.EXPECT().CheckTaskRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return(true, nil).AnyTimes()
//
//	httpmock.Activate()
//
//	bts, _ := json.Marshal(piplineInfo)
//	mockHttp(http.MethodGet, "/api/configuration-center/v1/flowchart-configurations", http.StatusOK, string(bts))
//
//	defer httpmock.DeactivateAndReset()
//
//	params := &tc_project.FlowIdModel{
//		FlowID:      "1fe7e791-14a3-44f5-ad0c-462449598c1e",
//		FlowVersion: "56efb357-7953-4582-8375-9e87c3f469d0",
//	}
//
//	datas, err := m.New().GetProjectCandidate(context.TODO(), params)
//	assert.Nil(t, err)
//	assert.NotEmpty(t, datas)
//
//	m.project.EXPECT().CheckTaskRoles(gomock.Any(), gomock.Any(), gomock.Any()).Return(false, nil).AnyTimes()
//	datas, err = m.New().GetProjectCandidate(context.TODO(), params)
//	assert.Nil(t, err)
//	assert.NotEmpty(t, datas)
//
//}
//
//func TestQueryProjectC(t *testing.T) {
//	m := NewMockProjectUserCase(t)
//
//	m.project.EXPECT().QueryProjects(gomock.Any(), gomock.Any()).Return(tcProjects, int64(2), nil).AnyTimes()
//
//	params := &tc_project.ProjectCardQueryReq{
//		Offset:    1,
//		Limit:     10,
//		Direction: "dest",
//		Sort:      "updated_at",
//		Name:      "",
//		Status:    "ready",
//	}
//
//	resp, err := m.New().QueryProjects(context.TODO(), params)
//	assert.Nil(t, err)
//	assert.NotNil(t, resp)
//}
//
//func TestGetFlowView(t *testing.T) {
//	m := NewMockProjectUserCase(t)
//
//	projectInfo := &model.TcProject{
//		FlowID:      "c8faf3fd-4690-41dc-9694-2f5fd3c7abd0",
//		FlowVersion: "0f1633bf-206d-4fae-9661-7c3adf675792",
//	}
//	flowInfo := &model.TcFlowView{Content: `{"name":"task"}`}
//
//	m.project.EXPECT().Get(gomock.Any(), gomock.Any()).Return(projectInfo, nil)
//	m.project.EXPECT().GetFlowView(gomock.Any(), gomock.Any(), gomock.Any()).Return(flowInfo, nil)
//
//	pid := "63fa4708-0e1c-484b-8eab-4a72928cb6b9"
//	view, err := m.New().GetFlowView(context.TODO(), pid)
//	assert.Nil(t, err)
//	assert.NotNil(t, view)
//}
//
//func TestProjectUserCase_GetFlowView(t *testing.T) {
//	ctl := gomock.NewController(t)
//	defer ctl.Finish()
//
//	type fields struct {
//		project *impl5.MockProjectRepo
//		oss     *impl3.MockOssRepo
//		member  *impl4.MockMemberRepo
//	}
//	type args struct {
//		ctx         context.Context
//		pid         string
//		projectInfo *model.TcProject
//		flowInfo    *model.TcFlowView
//	}
//	type TestCase struct {
//		name    string
//		fields  fields
//		args    args
//		mocks   func(f fields, args args)
//		want    *tc_project.FlowchartView
//		wantErr assert.ErrorAssertionFunc
//	}
//
//	tests := []TestCase{
//		{name: "test case 1",
//			fields: fields{
//				project: impl5.NewMockProjectRepo(ctl),
//				oss:     impl3.NewMockOssRepo(ctl),
//				member:  impl4.NewMockMemberRepo(ctl),
//			},
//			args: args{
//				ctx: context.TODO(),
//				pid: util.NewUUID(),
//				projectInfo: &model.TcProject{
//					FlowID:      "c8faf3fd-4690-41dc-9694-2f5fd3c7abd0",
//					FlowVersion: "0f1633bf-206d-4fae-9661-7c3adf675792",
//				},
//				flowInfo: &model.TcFlowView{Content: `{"name":"task"}`},
//			},
//			mocks: func(f fields, args args) {
//				f.project.EXPECT().Get(gomock.Any(), gomock.Any()).Return(args.projectInfo, nil)
//				f.project.EXPECT().GetFlowView(gomock.Any(), gomock.Any(), gomock.Any()).Return(args.flowInfo, nil)
//			},
//			want:    &tc_project.FlowchartView{Content: `{"name":"task"}`},
//			wantErr: assert.NoError,
//		},
//	}
//	for _, tt := range tests {
//		t.Run(tt.name, func(t *testing.T) {
//			tt.mocks(tt.fields, tt.args)
//			p := &ProjectUserCase{
//				//repo:    tt.fields.project,
//				ossRepo: tt.fields.oss,
//				//member:  tt.fields.member,
//			}
//			got, err := p.GetFlowView(tt.args.ctx, tt.args.pid)
//			if !tt.wantErr(t, err, fmt.Sprintf("GetFlowView(%v, %v)", tt.args.ctx, tt.args.pid)) {
//				return
//			}
//			assert.Equalf(t, tt.want, got, "GetFlowView(%v, %v)", tt.args.ctx, tt.args.pid)
//		})
//	}
//}
//
//func TestProjectUserCase_DeleteMemberByUsedRoleUserProject(t *testing.T) {
//	p := &ProjectUserCase{
//		flowInfoRepo: impl2.NewFlowInfoRepo(get()),
//		repo:         impl5.NewProjectRepo(get()),
//		member:       tc_member_repo.NewMemberRepo(get()),
//	}
//	err := p.DeleteMemberByUsedRoleUserProject(context.Background(), "r1", "e1")
//	if err != nil {
//		t.Error(err)
//	}
//}
//func get() *db.Data {
//	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
//		"root",
//		"123456",
//		"10.4.68.64",
//		3306,
//		"af_tasks2")))
//	if err != nil {
//		log.Println("open mysql failed,err:", err)
//		return nil
//	}
//	return &db.Data{
//		DB: DB,
//	}
//}

func Test_checkProjectWorkitemsNeedSync(t *testing.T) {
	type args struct {
		in *model.ProjectWorkitems
	}
	tests := []struct {
		name string
		args args
		want bool
	}{
		{
			name: "task",
			args: args{
				in: &model.ProjectWorkitems{
					Type: "task",
				},
			},
			want: false,
		},
		{
			name: "data comprehension work order",
			args: args{
				in: &model.ProjectWorkitems{
					Type:    "work_order",
					SubType: work_order.WorkOrderTypeDataComprehension.Integer.Int32(),
				},
			},
			want: false,
		},
		{
			name: "synced non data comprehension work order",
			args: args{
				in: &model.ProjectWorkitems{
					Type:    "work_order",
					SubType: work_order.WorkOrderTypeDataAggregation.Integer.Int32(),
					Synced:  true,
				},
			},
			want: false,
		},
		{
			name: "unsynced non data comprehension work order",
			args: args{
				in: &model.ProjectWorkitems{
					Type:    "work_order",
					SubType: work_order.WorkOrderTypeDataAggregation.Integer.Int32(),
				},
			},
			want: true,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if got := checkProjectWorkitemsNeedSync(tt.args.in); got != tt.want {
				t.Errorf("checkProjectWorkitemsNeedSync() = %v, want %v", got, tt.want)
			}
		})
	}
}
