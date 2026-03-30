package tc_task

//
//import (
//	"context"
//	impl2 "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_flow_info/impl"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task/impl"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
//	tc_task2 "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task/impl"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/interface/mock"
//	"fmt"
//	"github.com/golang/mock/gomock"
//	"github.com/stretchr/testify/assert"
//	"gorm.io/driver/mysql"
//	"gorm.io/gorm"
//	"log"
//	"testing"
//)
//
//var (
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
//	taskInfo = []*model.TaskInfo{
//		{
//			ID:           "ea213af4-2309-4715-9b4e-40928620a8c4",
//			Name:         "ewqweq122",
//			ProjectID:    "da22dcfb-f2ee-4d12-abc9-cdd8034d4c13",
//			ProjectName:  "AAAA",
//			StageID:      "",
//			NodeID:       "2d553178-e47c-48fe-af2d-3b31a6e0cf98",
//			Status:       1,
//			Deadline:     0,
//			Priority:     1,
//			ExecutorID:   "644f99ba-386c-42f2-ab37-603e2e8b5928",
//			RoleID:       "09095468-122a-4c6a-8bd3-0c2e438782de",
//			Description:  "",
//			UpdatedByUID: "37a051c9-07cf-4786-8f8e-6b287bd0f6c7",
//		},
//		{
//			ID:           "15f93bf8-233f-43d4-8511-e7e8bfae1318",
//			Name:         "321321321",
//			ProjectID:    "da22dcfb-f2ee-4d12-abc9-cdd8034d4c13",
//			ProjectName:  "巨昭项目",
//			StageID:      "",
//			NodeID:       "2d553178-e47c-48fe-af2d-3b31a6e0cf98",
//			Status:       1,
//			Deadline:     0,
//			Priority:     2,
//			ExecutorID:   "644f99ba-386c-42f2-ab37-603e2e8b5928",
//			RoleID:       "09095468-122a-4c6a-8bd3-0c2e438782de",
//			Description:  "",
//			UpdatedByUID: "b5d1e1d1-fb73-49c7-a82c-9864830944f0",
//		},
//	}
//	flowInfo = []*model.TcFlowInfo{
//		{
//			StageUnitID: "4bed20e3-e92e-45af-932c-57319702676b",
//			StageName:   "阶段1",
//			NodeUnitID:  "4534c663-2bf6-4063-966d-8747c79d2360",
//			NodeName:    "任务1",
//		},
//		{
//			StageUnitID: "48a9bf91-ac91-4e11-8175-7247e0ffdcaf",
//			StageName:   "阶段2",
//			NodeUnitID:  "06d96092-67fd-46a9-a42b-528c1c156b7a",
//			NodeName:    "任务2",
//		},
//	}
//	tasks = []*model.TcTask{
//		{
//			NodeID: "4534c663-2bf6-4063-966d-8747c79d2360",
//			Status: int8(constant.StatusCompleted),
//		},
//		{
//			NodeID: "06d96092-67fd-46a9-a42b-528c1c156b7a",
//			Status: constant.CommonStatusReady.Integer.Int8(),
//		},
//	}
//)
//
//func TestTaskUserCase_Create(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	flowInfoRepo := mock.NewMockFlowInfoRepo(ctl)
//	taskRepo.EXPECT().GetProject(gomock.Any(), gomock.Any()).Return(&model.TcProject{
//		ID: "bd7bce98-40fb-4de5-b124-9846f2523ad3"}, nil).AnyTimes()
//	flowInfoRepo.EXPECT().GetByNodeId(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, nil).AnyTimes()
//	taskRepo.EXPECT().GetSupportRole(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return("3c86b2ff-97e0-4d8b-a904-c8a01fc444fd", nil).AnyTimes()
//	taskRepo.EXPECT().GetSupportUserIdsFromProjectByRoleId(gomock.Any(), gomock.Any(), gomock.Any()).Return(members, nil).AnyTimes()
//	flowInfoRepo.EXPECT().GetNodes(gomock.Any(), gomock.Any(), gomock.Any()).Return(flowInfo, nil).AnyTimes()
//	taskRepo.EXPECT().Insert(gomock.Any(), gomock.Any()).Return(nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo:     taskRepo,
//		flowInfoRepo: flowInfoRepo,
//	}
//
//	pid := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	params := &TaskCreateReqModel{
//		Id:         "0026b19f-3baa-40e8-a4c5-0e14543c1f6f",
//		Name:       "aaa",
//		StageId:    "4bed20e3-e92e-45af-932c-57319702676b",
//		NodeId:     "4534c663-2bf6-4063-966d-8747c79d2360",
//		ExecutorId: "37a051c9-07cf-4786-8f8e-6b287bd0f6c7",
//	}
//	err := t.Create(context.TODO(), pid, params)
//
//	assert.Nil(t1, err)
//}
//
//func TestTaskUserCase_UpdateTask(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	flowInfoRepo := mock.NewMockFlowInfoRepo(ctl)
//	taskRepo.EXPECT().GetProject(gomock.Any(), gomock.Any()).Return(&model.TcProject{
//		ID: "bd7bce98-40fb-4de5-b124-9846f2523ad3"}, nil).AnyTimes()
//	taskRepo.EXPECT().GetTaskByTaskId(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, nil).AnyTimes()
//	taskRepo.EXPECT().GetSupportRole(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return("3c86b2ff-97e0-4d8b-a904-c8a01fc444fd", nil).AnyTimes()
//	taskRepo.EXPECT().GetSupportUserIdsFromProjectByRoleId(gomock.Any(), gomock.Any(), gomock.Any()).Return(members, nil).AnyTimes()
//
//	t := &tc_task2.TaskUserCase{
//		taskRepo:     taskRepo,
//		flowInfoRepo: flowInfoRepo,
//	}
//	eid := "37a051c9-07cf-4786-8f8e-6b287bd0f6c7"
//	uri := &TaskPathModel{
//		PId: "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//		Id:  "ea213af4-2309-4715-9b4e-40928620a8c4",
//	}
//	params := &TaskUpdateReqModel{
//		Name:       "aaa",
//		ExecutorId: &eid,
//	}
//	err := t.UpdateTask(context.TODO(), uri, params)
//
//	assert.Nil(t1, err)
//}
//
//func TestTaskUserCase_CheckExecutorId(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().GetSupportRole(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return("3c86b2ff-97e0-4d8b-a904-c8a01fc444fd", nil).AnyTimes()
//	taskRepo.EXPECT().GetSupportUserIdsFromProjectByRoleId(gomock.Any(), gomock.Any(), gomock.Any()).Return(members, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//	pid := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	fid := "1fe7e791-14a3-44f5-ad0c-462449598c1e"
//	flowVersion := "56efb357-7953-4582-8375-9e87c3f469d0"
//	nid := "ad4476bc-dd35-472f-9c18-669348edde20"
//	executorId := "37a051c9-07cf-4786-8f8e-6b287bd0f6c7"
//	err := t.CheckExecutorId(context.TODO(), pid, fid, flowVersion, nid, executorId)
//	assert.Nil(t1, err)
//}
//
//func TestTaskUserCase_CanBeOpening(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//
//	flowInfoRepo := mock.NewMockFlowInfoRepo(ctl)
//	flowInfoRepo.EXPECT().GetById(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(&model.TcFlowInfo{
//		NodeStartMode: constant.AnyNodeStart.ToString(),
//	}, nil).AnyTimes()
//	flowInfoRepo.EXPECT().GetByIds(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return([]*model.TcFlowInfo{{}}, nil).AnyTimes()
//	taskRepo.EXPECT().GetTaskByNodeId(gomock.Any(), gomock.Any(), gomock.Any()).Return(tasks, nil).AnyTimes()
//
//	t := &tc_task2.TaskUserCase{
//		taskRepo:     taskRepo,
//		flowInfoRepo: flowInfoRepo,
//	}
//
//	task := &model.TcTask{
//		Name: "aa",
//	}
//	err := t.CanBeOpening(context.TODO(), task)
//	assert.Nil(t1, err)
//}
//
//func TestTaskUserCase_CanBeOpeningv2(t1 *testing.T) {
//	tests := []struct {
//		name    string
//		wantCan bool
//		wantErr bool
//	}{
//		{
//			name:    "1",
//			wantCan: true,
//			wantErr: false,
//		},
//	}
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().GetTaskByNodeId(gomock.Any(), gomock.Any(), gomock.Any()).Return([]*model.TcTask{{
//		Status: int8(constant.StatusCompleted),
//	}, {
//		Status: constant.CommonStatusReady.Integer.Int8(),
//	}, {
//		Status: constant.CommonStatusReady.Integer.Int8(),
//	}}, nil).AnyTimes()
//
//	flowInfoRepo := mock.NewMockFlowInfoRepo(ctl)
//	flowInfoRepo.EXPECT().GetById(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(&model.TcFlowInfo{
//		NodeStartMode: constant.AnyNodeStart.ToString(),
//	}, nil).AnyTimes()
//	flowInfoRepo.EXPECT().GetByIds(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return([]*model.TcFlowInfo{{}}, nil).AnyTimes()
//
//	for _, tt := range tests {
//		t1.Run(tt.name, func(t1 *testing.T) {
//			t := &tc_task2.TaskUserCase{
//				taskRepo:     taskRepo,
//				flowInfoRepo: flowInfoRepo,
//			}
//			err := t.CanBeOpeningV2(context.TODO(), &model.TcTask{})
//			if (err != nil) != tt.wantErr {
//				t1.Errorf("CanBeOpening() error = %v, wantErr %v", err, tt.wantErr)
//				return
//			}
//		})
//	}
//}
//
//func TestTaskUserCase_ProjectExist(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().ExistProject(gomock.Any(), gomock.Any()).Return(nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	projectId := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	err := t.ProjectExist(context.TODO(), projectId)
//
//	assert.Nil(t1, err)
//}
//
//func TestTaskUserCase_GetProject(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().GetProject(gomock.Any(), gomock.Any()).Return(&model.TcProject{
//		ID: "bd7bce98-40fb-4de5-b124-9846f2523ad3"}, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	projectId := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	detail, err := t.GetProject(context.TODO(), projectId)
//	if err != nil {
//		t1.Errorf("get project error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, detail)
//}
//
//func TestTaskUserCase_FlowNodeExist(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	flowInfoRepo := mock.NewMockFlowInfoRepo(ctl)
//	flowInfoRepo.EXPECT().GetByNodeId(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		flowInfoRepo: flowInfoRepo,
//	}
//	fid := "1fe7e791-14a3-44f5-ad0c-462449598c1e"
//	flowVersion := "56efb357-7953-4582-8375-9e87c3f469d0"
//	nid := "ad4476bc-dd35-472f-9c18-669348edde20"
//	err := t.FlowNodeExist(context.TODO(), fid, flowVersion, nid)
//
//	assert.Nil(t1, err)
//}
//
//func TestTaskUserCase_TaskExist(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().GetTaskByTaskId(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	pid := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	id := "0026b19f-3baa-40e8-a4c5-0e14543c1f6f"
//	err := t.TaskExist(context.TODO(), pid, id)
//	assert.Nil(t1, err)
//}
//
//func TestTaskUserCase_GetTask(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().GetTaskByTaskId(gomock.Any(), gomock.Any(), gomock.Any()).Return(&model.TcTask{
//		ID: "0026b19f-3baa-40e8-a4c5-0e14543c1f6f"}, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	pid := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	id := "0026b19f-3baa-40e8-a4c5-0e14543c1f6f"
//	detail, err := t.GetTask(context.TODO(), pid, id)
//	if err != nil {
//		t1.Errorf("get task error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, detail)
//}
//
//func TestTaskUserCase_GetTaskExecutors(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().GetAllTaskExecutors(gomock.Any(), gomock.Any()).Return([]string{
//		"730e952c-2d64-4ab6-82c8-649ebe4c2956",
//		"1933b9c0-5719-4a6c-8125-bbf7da3bdd46",
//	}, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	param := TaskUserId{
//		UId: "0026b19f-3baa-40e8-a4c5-0e14543c1f6f",
//	}
//	detail, err := t.GetTaskExecutors(context.TODO(), param)
//	if err != nil {
//		t1.Errorf("get task executors error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, detail)
//}
//
//func TestTaskUserCase_GetTaskMember(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().ExistProject(gomock.Any(), gomock.Any()).Return(nil).AnyTimes()
//	taskRepo.EXPECT().GetTaskSupportRole(gomock.Any(), gomock.Any(), gomock.Any()).Return("3c86b2ff-97e0-4d8b-a904-c8a01fc444fd", nil).AnyTimes()
//	taskRepo.EXPECT().GetSupportUserIdsFromProjectByRoleId(gomock.Any(), gomock.Any(), gomock.Any()).Return(members, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	params := TaskPathNodeId{
//		PId: "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//		NId: "0026b19f-3baa-40e8-a4c5-0e14543c1f6f",
//	}
//	res, err := t.GetTaskMember(context.TODO(), params)
//	if err != nil {
//		t1.Errorf("get task member error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, res)
//}
//
//func TestTaskUserCase_GetDetail(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().ExistProject(gomock.Any(), gomock.Any()).Return(nil).AnyTimes()
//	taskRepo.EXPECT().GetTaskByTaskId(gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, nil).AnyTimes()
//	taskRepo.EXPECT().GetTask(gomock.Any(), gomock.Any()).Return(&model.TaskDetail{
//		ID: "0026b19f-3baa-40e8-a4c5-0e14543c1f6f",
//	}, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	pid := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	id := "0026b19f-3baa-40e8-a4c5-0e14543c1f6f"
//	detail, err := t.GetDetail(context.TODO(), pid, id)
//	if err != nil {
//		t1.Errorf("get task error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, detail)
//}
//
//func TestTaskUserCase_ListTasks(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	flowInfoRepo := mock.NewMockFlowInfoRepo(ctl)
//	taskRepo.EXPECT().Count(gomock.Any()).Return(int64(3), int64(4), nil).AnyTimes()
//	taskRepo.EXPECT().GetProject(gomock.Any(), gomock.Any()).Return(&model.TcProject{
//		ID: "bd7bce98-40fb-4de5-b124-9846f2523ad3"}, nil).AnyTimes()
//	flowInfoRepo.EXPECT().GetByNodeId(gomock.Any(), gomock.Any(), gomock.Any(), gomock.Any()).Return(nil, nil).AnyTimes()
//	taskRepo.EXPECT().GetTasks(gomock.Any(), gomock.Any()).Return(taskInfo, int64(2), nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo:     taskRepo,
//		flowInfoRepo: flowInfoRepo,
//	}
//	params := TaskQueryParam{
//		ProjectId: "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//		NodeId:    "0026b19f-3baa-40e8-a4c5-0e14543c1f6f",
//	}
//	userId := "4e230111-4bbe-4d48-a9fa-5278c680a749"
//	res, err := t.ListTasks(context.TODO(), params, userId)
//	if err != nil {
//		t1.Errorf("get tasks error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, res)
//}
//
//func TestTaskUserCase_GetNodes(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().GetProject(gomock.Any(), gomock.Any()).Return(&model.TcProject{
//		ID: "bd7bce98-40fb-4de5-b124-9846f2523ad3"}, nil).AnyTimes()
//	taskRepo.EXPECT().GetNodeInfo(gomock.Any(), gomock.Any(), gomock.Any()).Return(flowInfo, int64(2), nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//	pid := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	res, count, err := t.GetNodes(context.TODO(), pid)
//	if err != nil {
//		t1.Errorf("get stages error %v", err)
//		return
//	}
//	assert.Equal(t1, int64(2), count)
//	assert.NotEmpty(t1, res)
//}
//
//func TestTaskUserCase_GetRateInfo(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	flowInfoRepo := mock.NewMockFlowInfoRepo(ctl)
//	taskRepo.EXPECT().GetProject(gomock.Any(), gomock.Any()).Return(&model.TcProject{
//		ID: "bd7bce98-40fb-4de5-b124-9846f2523ad3"}, nil).AnyTimes()
//	flowInfoRepo.EXPECT().GetNodes(gomock.Any(), gomock.Any(), gomock.Any()).Return(flowInfo, nil).AnyTimes()
//	taskRepo.EXPECT().GetStatusInfo(gomock.Any(), gomock.Any()).Return(tasks, nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo:     taskRepo,
//		flowInfoRepo: flowInfoRepo,
//	}
//	pid := "bd7bce98-40fb-4de5-b124-9846f2523ad3"
//	res, err := t.GetRateInfo(context.TODO(), pid)
//	if err != nil {
//		t1.Errorf("get rate info error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, res)
//}
//
//func TestTaskUserCase_DeleteTask(t1 *testing.T) {
//	ctl := gomock.NewController(t1)
//	defer ctl.Finish()
//	taskRepo := mock.NewMockTaskRepo(ctl)
//	taskRepo.EXPECT().ExistProject(gomock.Any(), gomock.Any()).Return(nil).AnyTimes()
//	taskRepo.EXPECT().GetTaskByTaskId(gomock.Any(), gomock.Any(), gomock.Any()).Return(&model.TcTask{
//		Name:   "aaa",
//		Status: 1,
//	}, nil).AnyTimes()
//	taskRepo.EXPECT().Delete(gomock.Any(), gomock.Any()).Return(nil).AnyTimes()
//	t := &tc_task2.TaskUserCase{
//		taskRepo: taskRepo,
//	}
//
//	param := TaskPathModel{
//		PId: "bd7bce98-40fb-4de5-b124-9846f2523ad3",
//		Id:  "ea213af4-2309-4715-9b4e-40928620a8c4",
//	}
//	name, err := t.DeleteTask(context.TODO(), param)
//
//	if err != nil {
//		t1.Errorf("delete task error %v", err)
//		return
//	}
//	assert.NotEmpty(t1, name)
//}
//
//func TestTaskUserCase_DeleteTaskExecutorsUseRole(t1 *testing.T) {
//	t := tc_task2.NewTaskUserCase(impl.NewTaskRepo(get()), nil)
//	err := t.DeleteTaskExecutorsUseRole(context.Background(), "r1", "e1")
//	if err != nil {
//		t1.Error(err)
//	}
//}
//func TestTaskUserCase_DeleteTaskExecutorsUseRoleV2(t1 *testing.T) {
//	t := tc_task2.NewTaskUserCase(impl.NewTaskRepo(get()), impl2.NewFlowInfoRepo(get()))
//	err := t.DeleteTaskExecutorsUseRoleV2(context.Background(), "r1", "e1")
//	if err != nil {
//		t1.Error(err)
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
