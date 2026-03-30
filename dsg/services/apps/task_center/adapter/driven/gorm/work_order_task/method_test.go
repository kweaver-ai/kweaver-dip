package work_order_task

import (
	"os"
	"testing"
	"time"

	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

func prepareWorkOrderTasks(t *testing.T, tx *gorm.DB, tasks []model.WorkOrderTask) {
	// 删除已存在的记录
	require.NoError(t, tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Model(&model.WorkOrderTask{}).Delete(nil).Error)
	if len(tasks) == 0 {
		return
	}
	// 创建记录
	require.NoError(t, tx.Create(tasks).Error)
}

func emptyTable(t *testing.T, tx *gorm.DB, name string) {
	require.NoError(t, tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Table(name).Delete(nil).Error)
}

func TestCreate(t *testing.T) {
	now := time.Date(2025, 4, 7, 13, 41, 0, 0, time.Local)

	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	require.NoError(t, err)

	tests := []struct {
		name    string
		given   []model.WorkOrderTask
		task    *model.WorkOrderTask
		want    []model.WorkOrderTask
		wantErr require.ErrorAssertionFunc
	}{
		{
			name: "success",
			task: &model.WorkOrderTask{
				ID:          "00000000-0000-0000-0000-111111111111",
				CreatedAt:   now,
				UpdatedAt:   now,
				Name:        "NAME",
				WorkOrderID: "11111111-0000-0000-0000-111111111111",
				Status:      model.WorkOrderTaskRunning,
				Reason:      "REASON",
				Link:        "https://example.org",
			},
			wantErr: require.NoError,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 准备测试数据
			prepareWorkOrderTasks(t, db, tt.given)
			// 退出时清理测试数据
			defer emptyTable(t, db, model.TableNameWorkOrderTasks)
			// 创建工单任务
			tt.wantErr(t, Create(db.Debug(), tt.task))
			// TODO: 检查数据库记录
		})
	}
}
func TestGet(t *testing.T) {
	now := time.Date(2025, 4, 7, 13, 41, 0, 0, time.Local)

	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	require.NoError(t, err)

	tests := []struct {
		name    string
		given   []model.WorkOrderTask
		id      string
		want    *model.WorkOrderTask
		wantErr require.ErrorAssertionFunc
	}{
		{
			name: "success",
			given: []model.WorkOrderTask{
				{
					ID:          "00000000-0000-0000-0000-111111111111",
					CreatedAt:   now,
					UpdatedAt:   now,
					Name:        "NAME",
					WorkOrderID: "11111111-0000-0000-0000-111111111111",
					Status:      model.WorkOrderTaskRunning,
					Reason:      "REASON",
					Link:        "https://example.org",
				},
			},
			id: "00000000-0000-0000-0000-111111111111",
			want: &model.WorkOrderTask{
				ID:          "00000000-0000-0000-0000-111111111111",
				CreatedAt:   now,
				UpdatedAt:   now,
				Name:        "NAME",
				WorkOrderID: "11111111-0000-0000-0000-111111111111",
				Status:      model.WorkOrderTaskRunning,
				Reason:      "REASON",
				Link:        "https://example.org",
			},
			wantErr: require.NoError,
		},
		{
			name: "not found",
			id:   "00000000-0000-0000-0000-111111111111",
			wantErr: func(tt require.TestingT, err error, msgAndArgs ...any) {
				require.ErrorIs(tt, err, ErrNotFound, msgAndArgs...)
			},
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			// 准备测试数据
			prepareWorkOrderTasks(t, db, tt.given)
			// 退出时清理测试数据
			defer emptyTable(t, db, model.TableNameWorkOrderTasks)
			// 获取工单任务
			got, err := Get(db, tt.id)
			tt.wantErr(t, err)
			assert.Equal(t, tt.want, got)
		})
	}
}
