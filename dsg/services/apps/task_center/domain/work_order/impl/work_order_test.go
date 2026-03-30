package impl

import (
	"testing"
	"time"

	"github.com/samber/lo"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

func Test_auditTypeForWorkOrderType(t *testing.T) {
	tests := []struct {
		name string
		in   int32
		want string
	}{
		{
			name: "默认值",
			want: workflow.AF_TASKS_DATA_COMPREHENSION_WORK_ORDER,
		},
		{
			name: "数据理解",
			in:   domain.WorkOrderTypeDataComprehension.Integer.Int32(),
			want: workflow.AF_TASKS_DATA_COMPREHENSION_WORK_ORDER,
		},
		{
			name: "数据归集",
			in:   domain.WorkOrderTypeDataAggregation.Integer.Int32(),
			want: workflow.AF_TASKS_DATA_AGGREGATION_WORK_ORDER,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := auditTypeForWorkOrderType(tt.in)
			assert.Equal(t, tt.want, got)
		})
	}
}

func Test_checkUpdate(t *testing.T) {
	type args struct {
		workOrder *model.WorkOrder
		req       *domain.WorkOrderUpdateReq
	}
	tests := []struct {
		name      string
		args      args
		assertErr assert.ErrorAssertionFunc
	}{
		{
			name: "归集工单",
			args: args{
				workOrder: &model.WorkOrder{Type: domain.WorkOrderTypeDataAggregation.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{},
			},
			assertErr: assert.NoError,
		},
		{
			name: "未发起审核",
			args: args{
				workOrder: &model.WorkOrder{AuditStatus: domain.AuditStatusNone.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{},
			},
			assertErr: assert.NoError,
		},
		{
			name: "被拒绝",
			args: args{
				workOrder: &model.WorkOrder{AuditStatus: domain.AuditStatusReject.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{},
			},
			assertErr: assert.NoError,
		},
		{
			name: "已撤回",
			args: args{
				workOrder: &model.WorkOrder{AuditStatus: domain.AuditStatusUndone.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{},
			},
			assertErr: assert.NoError,
		},
		{
			name: "修改名称",
			args: args{
				workOrder: &model.WorkOrder{Name: "a", AuditStatus: domain.AuditStatusAuditing.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{Name: "b"},
			},
			assertErr: assert.Error,
		},
		{
			name: "修改优先级",
			args: args{
				workOrder: &model.WorkOrder{Priority: constant.CommonPriorityCommon.Integer.Int32(), AuditStatus: domain.AuditStatusAuditing.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{Priority: constant.CommonStatusEmergent.String},
			},
			assertErr: assert.Error,
		},
		{
			name: "修改截止日期",
			args: args{
				workOrder: &model.WorkOrder{FinishedAt: ptr.To(time.Date(1453, 5, 29, 0, 0, 0, 0, time.UTC)), AuditStatus: domain.AuditStatusAuditing.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{FinishedAt: time.Date(2025, 3, 10, 0, 0, 0, 0, time.UTC).Unix()},
			},
			assertErr: assert.Error,
		},
		{
			name: "新增截止日期",
			args: args{
				workOrder: &model.WorkOrder{FinishedAt: nil, AuditStatus: domain.AuditStatusAuditing.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{FinishedAt: time.Date(2025, 3, 10, 0, 0, 0, 0, time.UTC).Unix()},
			},
			assertErr: assert.Error,
		},
		{
			name: "修改数据资源目录",
			args: args{
				workOrder: &model.WorkOrder{CatalogIds: "a,b", AuditStatus: domain.AuditStatusAuditing.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{CatalogIds: []string{"a", "c"}},
			},
			assertErr: assert.Error,
		},
		{
			name: "修改描述",
			args: args{
				workOrder: &model.WorkOrder{Description: "a", AuditStatus: domain.AuditStatusAuditing.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{Description: "b"},
			},
			assertErr: assert.Error,
		},
		{
			name: "修改备注",
			args: args{
				workOrder: &model.WorkOrder{Remark: "a", AuditStatus: domain.AuditStatusAuditing.Integer.Int32()},
				req:       &domain.WorkOrderUpdateReq{Remark: "b"},
			},
			assertErr: assert.Error,
		},
		{
			name: "转派 无截止日期",
			args: args{
				workOrder: &model.WorkOrder{
					ID:                         557561651834926313,
					WorkOrderID:                "b19ba424-1df3-43cd-92a1-8033b3e7b415",
					Name:                       "123123123",
					Code:                       "gd1741862241985",
					Type:                       3,
					Status:                     2,
					Draft:                      ptr.To(false),
					ResponsibleUID:             "93c3270e-d9f3-11ef-80d6-6238c1ff10ce",
					Priority:                   constant.CommonPriorityCommon.Integer.Int32(),
					FinishedAt:                 nil,
					CatalogIds:                 "",
					DataAggregationInventoryID: "",
					BusinessForms:              nil,
					Description:                "1231231",
					Remark:                     "",
					ProcessingInstructions:     "",
					AuditID:                    ptr.To(uint64(557561651868480745)),
					AuditStatus:                domain.AuditStatusPass.Integer.Int32(),
					AuditDescription:           "",
					SourceType:                 domain.WorkOrderSourceTypeStandalone.Integer.Int32(),
					SourceID:                   "",
					SourceIDs:                  nil,
					CreatedByUID:               "93c3270e-d9f3-11ef-80d6-6238c1ff10ce",
					CreatedAt:                  lo.Must(time.Parse(time.RFC3339, "2025-03-13T18:37:21.985+08:00")),
					UpdatedByUID:               "93c3270e-d9f3-11ef-80d6-6238c1ff10ce",
					UpdatedAt:                  lo.Must(time.Parse(time.RFC3339, "2025-03-13T18:37:36.904+08:00")),
					AcceptanceAt:               ptr.To(lo.Must(time.Parse(time.RFC3339, "2025-03-13T18:37:21.985+08:00"))),
					DeletedAt:                  0,
				},
				req: &domain.WorkOrderUpdateReq{
					ResponsibleUID: ptr.To("8ca13f64-ff06-11ef-bbe0-ba020467f4e3"),
				},
			},
			assertErr: assert.NoError,
		},
		{
			name: "转派 有截止日期",
			args: args{
				workOrder: &model.WorkOrder{
					ID:                         558235239458073856,
					WorkOrderID:                "9c7ef419-96ee-46a8-9daa-f6327fddbd43",
					Name:                       "02工单",
					Code:                       "gd1742263731492",
					Type:                       3,
					Status:                     2,
					Draft:                      ptr.To(false),
					ResponsibleUID:             "8a518570-fe5c-11ef-a946-92c83e195385",
					Priority:                   3,
					FinishedAt:                 ptr.To(lo.Must(time.Parse(time.RFC3339, "2025-03-20T00:00:00+08:00"))),
					CatalogIds:                 "",
					DataAggregationInventoryID: "",
					BusinessForms:              nil,
					Description:                "水水水水水水水水水水水水水水水水水水水",
					Remark:                     "",
					ProcessingInstructions:     "",
					AuditID:                    ptr.To(uint64(558235239508405504)),
					AuditStatus:                4,
					AuditDescription:           "",
					SourceType:                 3,
					SourceID:                   "",
					SourceIDs:                  nil,
					CreatedByUID:               "78cd874a-fe5c-11ef-8d73-92c83e195385",
					CreatedAt:                  lo.Must(time.Parse(time.RFC3339, "2025-03-18T10:08:51.492+08:00")),
					UpdatedByUID:               "78cd874a-fe5c-11ef-8d73-92c83e195385",
					UpdatedAt:                  lo.Must(time.Parse(time.RFC3339, "2025-03-18T10:09:12.823+08:00")),
					AcceptanceAt:               ptr.To(lo.Must(time.Parse(time.RFC3339, "2025-03-18T10:08:51.492+08:00"))),
					DeletedAt:                  0,
				},
				req: &domain.WorkOrderUpdateReq{
					Name:                   "",
					ResponsibleUID:         ptr.To("78cd874a-fe5c-11ef-8d73-92c83e195385"),
					Priority:               "",
					FinishedAt:             0,
					CatalogIds:             nil,
					Description:            "",
					Remark:                 "",
					SourceType:             "",
					SourceId:               "",
					SourceIds:              nil,
					ProcessingInstructions: "",
					FormViews:              nil,
					Draft:                  false,
				},
			},
			assertErr: assert.NoError,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := checkUpdate(tt.args.workOrder, tt.args.req)
			tt.assertErr(t, got)
		})
	}
}
