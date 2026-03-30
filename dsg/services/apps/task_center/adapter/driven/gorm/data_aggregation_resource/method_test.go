package data_aggregation_resource

import (
	"fmt"
	"os"
	"testing"

	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/require"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
	"gorm.io/plugin/soft_delete"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

func messageFromMsgAndArgs(msgAndArgs ...any) string {
	if len(msgAndArgs) == 0 || msgAndArgs == nil {
		return ""
	}
	if len(msgAndArgs) == 1 {
		msg := msgAndArgs[0]
		if msgAsStr, ok := msg.(string); ok {
			return msgAsStr
		}
		return fmt.Sprintf("%+v", msg)
	}
	if len(msgAndArgs) > 1 {
		return fmt.Sprintf(msgAndArgs[0].(string), msgAndArgs[1:]...)
	}
	return ""
}

func prepareDataAggregationResources(t *testing.T, tx *gorm.DB, records []model.DataAggregationResource) {
	require.NoError(t, tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Unscoped().Model(&model.DataAggregationResource{}).Delete(nil).Error)
	if records == nil {
		return
	}
	require.NoError(t, tx.Create(records).Error)
}

func emptyTable(t *testing.T, tx *gorm.DB, name string) {
	require.NoError(t, tx.Session(&gorm.Session{AllowGlobalUpdate: true}).Table(name).Delete(nil).Error)
}

// dataAggregationResourceForAsserting 代表用于断言的 DataAggregationResource
type dataAggregationResourceForAsserting struct{}

// 验证归集资源
func assertDataAggregationResource(t *testing.T, want, got *model.DataAggregationResource) bool {
	t.Helper()
	if want == nil || got == nil {
		return assert.Equal(t, want == nil, got == nil)
	}

	// UpdateAt 与时间有关，在找到合适的方法测试前先不验证
	var conditions = []bool{
		assert.Equal(t, want.ID, got.ID),
		assert.Equal(t, want.DataViewID, got.DataViewID),
		assert.Equal(t, want.DataAggregationInventoryID, got.DataAggregationInventoryID),
		assert.Equal(t, want.WorkOrderID, got.WorkOrderID),
		assert.Equal(t, want.CollectionMethod, got.CollectionMethod),
		assert.Equal(t, want.SyncFrequency, got.SyncFrequency),
		assert.Equal(t, want.BusinessFormID, got.BusinessFormID),
		assert.Equal(t, want.TargetDatasourceID, got.TargetDatasourceID),
		assert.Equal(t, want.DataTableName, got.DataTableName),
		assert.Equal(t, want.DeletedAt, got.DeletedAt),
	}
	return lo.Reduce(conditions, func(agg bool, item bool, _ int) bool { return agg && item }, true)
}

// 验证归集资源列表
func assertDataAggregationResources(t *testing.T, want, got []model.DataAggregationResource) bool {
	t.Helper()
	if want == nil || got == nil {
		return assert.Equal(t, want == nil, got == nil)
	}

	var conditions []bool
	// 检查长度
	conditions = append(conditions, assert.Equal(t, len(want), len(got), "length"))
	// 检查每个归集资源
	for i := 0; i < len(want) && i < len(got); i++ {
		conditions = append(conditions, assertDataAggregationResource(t, &want[i], &got[i]))
	}
	return lo.Reduce(conditions, func(agg bool, item bool, _ int) bool { return agg && item }, true)

}

func TestListByDataAggregationInventoryID(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	require.NoError(t, err)

	// 准备测试数据，退出时清理
	given := []model.DataAggregationResource{
		{ID: "00000000-0000-0000-0000-111111111111", DataAggregationInventoryID: "00000000-0000-1111-0000-111111111111"},
		{ID: "00000000-0000-0000-1111-111111111111", DataAggregationInventoryID: "00000000-0000-1111-0000-111111111111"},
		{ID: "00000000-0000-0000-2222-111111111111", DataAggregationInventoryID: "00000000-0000-1111-0000-111111111111"},
		{ID: "00000000-0000-0000-3333-111111111111", DataAggregationInventoryID: "00000000-0000-1111-1111-111111111111"},
		{ID: "00000000-0000-0000-4444-111111111111", DataAggregationInventoryID: "00000000-0000-1111-1111-111111111111", DeletedAt: soft_delete.DeletedAt(100)},
		{ID: "00000000-0000-0000-5555-111111111111", DataAggregationInventoryID: "00000000-0000-1111-1111-111111111111"},
	}
	prepareDataAggregationResources(t, db, given)
	defer emptyTable(t, db, model.TableNameDataAggregationResources)

	tests := []struct {
		name    string
		id      string
		want    []model.DataAggregationResource
		wantErr require.ErrorAssertionFunc
	}{
		{
			name: "success",
			id:   "00000000-0000-1111-0000-111111111111",
			want: []model.DataAggregationResource{
				{ID: "00000000-0000-0000-0000-111111111111", DataAggregationInventoryID: "00000000-0000-1111-0000-111111111111"},
				{ID: "00000000-0000-0000-1111-111111111111", DataAggregationInventoryID: "00000000-0000-1111-0000-111111111111"},
				{ID: "00000000-0000-0000-2222-111111111111", DataAggregationInventoryID: "00000000-0000-1111-0000-111111111111"},
			},
			wantErr: require.NoError,
		},
		{
			name: "except deleted",
			id:   "00000000-0000-1111-1111-111111111111",
			want: []model.DataAggregationResource{
				{ID: "00000000-0000-0000-3333-111111111111", DataAggregationInventoryID: "00000000-0000-1111-1111-111111111111"},
				{ID: "00000000-0000-0000-5555-111111111111", DataAggregationInventoryID: "00000000-0000-1111-1111-111111111111"},
			},
			wantErr: require.NoError,
		},
		{
			name:    "none",
			id:      "00000000-0000-1111-ffff-111111111111",
			want:    []model.DataAggregationResource{},
			wantErr: require.NoError,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ListByDataAggregationInventoryID(db, tt.id)
			tt.wantErr(t, err)
			assertDataAggregationResources(t, tt.want, got)
		})
	}
}

func TestListByWorkOrderID(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	require.NoError(t, err)

	// 准备测试数据，退出时清理
	given := []model.DataAggregationResource{
		{ID: "00000000-0000-0000-0000-111111111111", WorkOrderID: "00000000-0000-1111-0000-111111111111"},
		{ID: "00000000-0000-0000-1111-111111111111", WorkOrderID: "00000000-0000-1111-0000-111111111111"},
		{ID: "00000000-0000-0000-2222-111111111111", WorkOrderID: "00000000-0000-1111-0000-111111111111"},
		{ID: "00000000-0000-0000-3333-111111111111", WorkOrderID: "00000000-0000-1111-1111-111111111111"},
		{ID: "00000000-0000-0000-4444-111111111111", WorkOrderID: "00000000-0000-1111-1111-111111111111", DeletedAt: soft_delete.DeletedAt(100)},
		{ID: "00000000-0000-0000-5555-111111111111", WorkOrderID: "00000000-0000-1111-1111-111111111111"},
	}
	prepareDataAggregationResources(t, db, given)
	defer emptyTable(t, db, model.TableNameDataAggregationResources)

	tests := []struct {
		name    string
		id      string
		want    []model.DataAggregationResource
		wantErr require.ErrorAssertionFunc
	}{
		{
			name: "success",
			id:   "00000000-0000-1111-0000-111111111111",
			want: []model.DataAggregationResource{
				{ID: "00000000-0000-0000-0000-111111111111", WorkOrderID: "00000000-0000-1111-0000-111111111111"},
				{ID: "00000000-0000-0000-1111-111111111111", WorkOrderID: "00000000-0000-1111-0000-111111111111"},
				{ID: "00000000-0000-0000-2222-111111111111", WorkOrderID: "00000000-0000-1111-0000-111111111111"},
			},
			wantErr: require.NoError,
		},
		{
			name: "except deleted",
			id:   "00000000-0000-1111-1111-111111111111",
			want: []model.DataAggregationResource{
				{ID: "00000000-0000-0000-3333-111111111111", WorkOrderID: "00000000-0000-1111-1111-111111111111"},
				{ID: "00000000-0000-0000-5555-111111111111", WorkOrderID: "00000000-0000-1111-1111-111111111111"},
			},
			wantErr: require.NoError,
		},
		{
			name:    "none",
			id:      "00000000-0000-1111-ffff-111111111111",
			want:    []model.DataAggregationResource{},
			wantErr: require.NoError,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got, err := ListByWorkOrderID(db, tt.id)
			tt.wantErr(t, err)
			assertDataAggregationResources(t, tt.want, got)
		})
	}
}
