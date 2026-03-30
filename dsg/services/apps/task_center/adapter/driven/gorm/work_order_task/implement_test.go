package work_order_task

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task/scope"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

// func Test_repository_Create(t *testing.T) {
// 	ctx := context.Background()

// 	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
// 	require.NoError(t, err)

// 	given := struct {
// 		tasks []model.WorkOrderTask
// 		// details []model.WorkOrderDataAggregationDetail
// 	}{}
// 	// 准备测试数据
// 	prepareWorkOrderTasks(t, db, given.tasks)
// 	// 退出时清理
// 	defer emptyTable(t, db, model.TableNameWorkOrderTasks)

// 	r := &repository{
// 		db: db.Debug(),
// 	}

// 	got, err := r.Create(ctx, &model.WorkOrderTask{
// 		ID:          "00000000-0000-0000-0000-111111111111",
// 		CreatedAt:   time.Now(),
// 		UpdatedAt:   time.Now(),
// 		Name:        "NAME",
// 		WorkOrderID: "00000000-0000-1111-0000-111111111111",
// 		Status:      model.WorkOrderTaskRunning,
// 		Reason:      "REASON",
// 		Link:        "https://example.org",
// 		WorkOrderTaskTypedDetail: model.WorkOrderTaskTypedDetail{
// 			DataAggregationInventory: &model.WorkOrderDataAggregationDetail{
// 				ID:             "00000000-0000-0000-0000-111111111111",
// 				DepartmentID:   "00000000-0000-2222-0000-111111111111",
// 				DepartmentPath: "/department/path",
// 				TargetID:       "00000000-0000-333-0000-111111111111",
// 				TargetName:     "TARGET NAME",
// 			},
// 		},
// 	})
// 	require.NoError(t, err)

// 	gotJSON, err := json.MarshalIndent(got, "", "  ")
// 	require.NoError(t, err)

// 	t.Logf("got: %s", gotJSON)
// }

func TestList(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	require.NoError(t, err)

	r := repository{db: db.Debug()}

	tasks, total, err := r.List(context.TODO(), ListOptions{
		Limit:  1,
		Offset: 2,
		OrderBy: []OrderByColumn{
			{
				Column:     "created_at",
				Descending: true,
			},
		},
		Scopes: []scope.Scope{
			scope.WorkOrderType(task_center_v1.WorkOrderDataAggregation),
		},
	})
	require.NoError(t, err)
	t.Log("total", total)
	for _, item := range tasks {
		t.Log(item)
	}
}
