package data_aggregation_inventory

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_business"
	doc_audit_rest_v1 "github.com/kweaver-ai/idrm-go-common/api/doc_audit_rest/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 聚合 DataAggregationInventory 所引用的资源
func (d *domain) aggregateDataAggregationInventoryInto(ctx context.Context, in *task_center_v1.DataAggregationInventory, out *task_center_v1.AggregatedDataAggregationInventory) {
	out.ID = in.ID
	out.Code = in.Code
	out.Name = in.Name
	out.CreationMethod = in.CreationMethod
	out.DepartmentPath = d.aggregateDepartmentPath(ctx, in.DepartmentID)
	out.BusinessForms = d.aggregateBusinessForms(ctx, businessFormIDsFromDataAggregationResources(in.Resources))
	out.Resources = d.aggregateDataAggregationResources(ctx, in.Resources)
	out.ResourcesCount = len(out.Resources)
	out.DocAudit = d.aggregateDocAuditVO(ctx, in.ApplyID)
	out.Status = in.Status
	out.CreatedAt = in.CreatedAt
	out.CreatorName = d.aggregateUserName(ctx, in.CreatorID)
	out.RequestedAt = in.RequestedAt
	out.RequesterName = d.aggregateUserName(ctx, in.RequesterID)

	// 聚合关联这个归集清单的归集工单
	out.WorkOrderNames = d.aggregateWorkOrderNames(ctx, in.ID)
	if len(out.WorkOrderNames) > 0 {
		out.WorkOrderName = out.WorkOrderNames[0]
	}

	if in.Status == task_center_v1.DataAggregationInventoryAuditing && len(in.ApplyID) > 0 {
		out.AuditApplyID = in.ApplyID
	}
}

// 聚合 DataAggregationInventory 所引用的资源
func (d *domain) aggregateDataAggregationInventory(ctx context.Context, in *task_center_v1.DataAggregationInventory) (out *task_center_v1.AggregatedDataAggregationInventory) {
	if in == nil {
		return
	}
	out = &task_center_v1.AggregatedDataAggregationInventory{}
	d.aggregateDataAggregationInventoryInto(ctx, in, out)
	return
}

// 聚合 DataAggregationInventory 所引用的资源
func (d *domain) aggregateDataAggregationInventoryList(ctx context.Context, in *task_center_v1.DataAggregationInventoryList) (out *task_center_v1.AggregatedDataAggregationInventoryList) {
	if in == nil {
		return
	}

	out = &task_center_v1.AggregatedDataAggregationInventoryList{
		TotalCount: in.TotalCount,
	}

	if in.Entries != nil {
		out.Entries = make([]task_center_v1.AggregatedDataAggregationInventory, len(in.Entries))
		for i := range in.Entries {
			d.aggregateDataAggregationInventoryInto(ctx, &in.Entries[i], &out.Entries[i])
		}
	}

	return
}

// 聚合部门路径
func (d *domain) aggregateDepartmentPath(ctx context.Context, id string) (path string) {
	if id == "" {
		return
	}
	department, err := d.Department.Get(ctx, id)
	if err != nil {
		log.Warn("get department fail", zap.Error(err), zap.String("id", id))
		return
	}
	return department.Path
}

// 聚合 BusinessForm
func (d domain) aggregateBusinessFormInto(ctx context.Context, id string, out *task_center_v1.AggregatedBusinessFormReference) {
	out.ID = id
	// 获取业务表
	f, err := d.BusinessFormStandard.Get(ctx, id)
	if err != nil {
		log.Warn("get business form standard fail", zap.Error(err), zap.String("id", id))
		return
	}
	out.Name = f.Name
	out.Description = f.Description
	out.UpdatedAt = meta_v1.NewTime(f.UpdatedAt)

	// 获取更新人
	u, err := d.BusinessUser.Get(ctx, f.UpdatedByUID)
	if err != nil {
		log.Warn("get business form standard updater fail", zap.Error(err), zap.Int("id", f.UpdatedByUID))
		u = &af_business.User{}
	}
	out.UpdaterName = u.Name

	// 获取信息系统
	out.InfoSystemNames = d.aggregateInfoSystemNames(ctx, f.SourceSystem)

	// 获取业务模型
	m, err := d.BusinessModel.Get(ctx, f.BusinessModelID)
	if err != nil {
		log.Warn("get business model fail", zap.Error(err), zap.String("id", f.BusinessModelID))
		return
	}
	out.BusinessModelName = m.Name

	// 获取业务域
	bd, err := d.BusinessDomain.Get(ctx, m.BusinessDomainID)
	if err != nil {
		log.Warn("get business domain fail", zap.Error(err), zap.String("id", m.BusinessDomainID))
		return
	}

	// 获取部门
	out.DepartmentPath = d.aggregateDepartmentPath(ctx, bd.DepartmentID)
}
func (d *domain) AggregateBusinessFormInto(ctx context.Context, id string, out *task_center_v1.AggregatedBusinessFormReference) {
	d.aggregateBusinessFormInto(ctx, id, out)
}

// 聚合 BusinessForm
func (d *domain) aggregateBusinessForms(ctx context.Context, ids []string) (out []task_center_v1.AggregatedBusinessFormReference) {
	if ids == nil {
		return
	}
	out = make([]task_center_v1.AggregatedBusinessFormReference, len(ids))
	for i, id := range ids {
		d.aggregateBusinessFormInto(ctx, id, &out[i])
	}
	return
}
func (d *domain) AggregateBusinessForms(ctx context.Context, ids []string) (out []task_center_v1.AggregatedBusinessFormReference) {
	return d.aggregateBusinessForms(ctx, ids)
}

func (d *domain) aggregatedDataAggregationResourceInto(ctx context.Context, in *task_center_v1.DataAggregationResource, out *task_center_v1.AggregatedDataAggregationResource) {
	out.DataViewID = in.DataViewID
	out.CollectionMethod = in.CollectionMethod
	out.SyncFrequency = in.SyncFrequency
	out.TargetDatasourceID = in.TargetDatasourceID

	// 获取逻辑视图
	v, err := d.FormView.Get(ctx, in.DataViewID)
	if err != nil {
		log.Warn("get data view fail", zap.Error(err), zap.String("id", in.DataViewID))
		return
	}
	out.BusinessName = v.BusinessName
	out.TechnicalName = v.TechnicalName

	// 获取部门
	out.DepartmentPath = d.aggregateDepartmentPath(ctx, v.DepartmentID)

	// 获取数据源
	if s, err := d.Datasource.Get(ctx, v.DatasourceID); err != nil {
		log.Warn("get datasource fail", zap.Error(err), zap.String("id", v.DatasourceID))
	} else {
		out.DatasourceID = s.ID
		out.DatasourceName = s.Name
		out.DatasourceType = s.TypeName
	}

	// 获取目标数据源
	if s, err := d.Datasource.Get(ctx, in.TargetDatasourceID); err != nil {
		log.Warn("get target datasource fail", zap.Error(err), zap.String("id", in.TargetDatasourceID))
	} else {
		out.TargetDatasourceName = s.Name
		out.DatabaseName = s.DatabaseName
	}

	// 价值评估状态，存在探查任务即认为已评估
	out.ValueAssessmentStatus = v.ExploreJobID != ""
}
func (d *domain) aggregateDataAggregationResources(ctx context.Context, in []task_center_v1.DataAggregationResource) (out []task_center_v1.AggregatedDataAggregationResource) {
	if in == nil {
		return
	}
	out = make([]task_center_v1.AggregatedDataAggregationResource, len(in))
	for i := range in {
		d.aggregatedDataAggregationResourceInto(ctx, &in[i], &out[i])
	}
	return
}

func (d *domain) aggregateWorkOrderName(ctx context.Context, id string) (out string) {
	if id == "" {
		return
	}
	o, err := d.workOrder.GetById(ctx, id)
	if err != nil {
		log.Warn("get work order fail", zap.Error(err), zap.String("id", id))
		return
	}
	return o.Name
}

// 聚合关联指定归集清单的工单名称，输入归集清单 ID，输出归集工单名称列表
func (d *domain) aggregateWorkOrderNames(ctx context.Context, id string) []string {
	out, err := d.workOrder.GetNamesByDataAggregationInventoryID(ctx, id)
	if err != nil {
		log.Warn("get work order names of data aggregation inventory fail", zap.String("id", id))
	}
	return out
}

func (d *domain) aggregateDocAuditVO(ctx context.Context, applyID string) (out *doc_audit_rest_v1.Apply) {
	if applyID == "" {
		return nil
	}
	out, err := d.biz.Get(ctx, applyID)
	if err != nil {
		log.Warn("get biz fail", zap.Error(err), zap.String("applyID", applyID))
		return
	}
	return out
}

func (d *domain) aggregateInfoSystemName(ctx context.Context, id string) (out string) {
	s, err := d.InfoSystem.Get(ctx, id)
	if err != nil {
		log.Warn("get info system fail", zap.Error(err), zap.String("id", id))
		return
	}
	return s.Name
}
func (d *domain) aggregateInfoSystemNames(ctx context.Context, in []string) (out []string) {
	for _, id := range in {
		out = append(out, d.aggregateInfoSystemName(ctx, id))
	}
	return
}
func (d *domain) aggregateUserName(ctx context.Context, id string) (out string) {
	if id == "" {
		return
	}
	u, err := d.user.GetByUserId(ctx, id)
	if err != nil {
		log.Warn("get user fail", zap.Error(err), zap.String("id", id))
		return
	}
	return u.Name
}

func businessFormIDsFromDataAggregationResources(resources []task_center_v1.DataAggregationResource) (ids []string) {
	for _, r := range resources {
		if r.BusinessFormID == "" {
			continue
		}
		ids = append(ids, r.BusinessFormID)
	}
	return
}

// func first[T any](s []T) (out T) {
// 	if len(s) > 0 {
// 		return s[0]
// 	}
// 	return
// }
