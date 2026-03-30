package work_order_task

import (
	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

// TODO: Refactor
func convertV1IntoModel_WorkOrderTask(in *task_center_v1.WorkOrderTask, out *model.WorkOrderTask) {
	out.ID = in.ID
	out.ThirdPartyID = in.ThirdPartyID
	out.CreatedAt = in.CreatedAt.Time
	out.UpdatedAt = in.UpdatedAt.Time
	out.Name = in.Name
	out.WorkOrderID = in.WorkOrderID
	out.Status = model.WorkOrderTaskStatus(in.Status)
	out.Reason = in.Reason
	out.Link = in.Link
	// 工单详情
	convertV1IntoModel_WorkOrderTaskTypedDetail(&in.WorkOrderTaskTypedDetail, in.ID, &out.WorkOrderTaskTypedDetail)
}

func convertV1IntoModel_WorkOrderTaskTypedDetail(in *task_center_v1.WorkOrderTaskTypedDetail, id string, out *model.WorkOrderTaskTypedDetail) {
	// 数据归集工单的任务详情
	if in.DataAggregation != nil {
		convertV1IntoModel_Slice_WorkOrderTaskDetailAggregationInventoryDetail(&in.DataAggregation, id, &out.DataAggregation)
		return
	}
	// 数据理解工单的任务详情
	if in.DataComprehension != nil {
		out.DataComprehension = &model.WorkOrderDataComprehensionDetail{}
		convertV1IntoModel_WorkOrderTaskDetailComprehensionDetail(in.DataComprehension, id, out.DataComprehension)
		return
	}
	// 数据融合工单的任务详情
	if in.DataFusion != nil {
		out.DataFusion = new(model.WorkOrderDataFusionDetail)
		convertV1IntoModel_WorkOrderTaskDetailFusionDetail(in.DataFusion, id, out.DataFusion)
		return
	}
	// 数据质量工单的任务详情
	if in.DataQuality != nil {
		out.DataQuality = new(model.WorkOrderDataQualityDetail)
		convertV1IntoModel_WorkOrderTaskDetailQualityDetail(in.DataQuality, id, out.DataQuality)
		return
	}
	// 数据质量稽查工单的任务详情
	if in.DataQualityAudit != nil {
		out.DataQualityAudit = make([]*model.WorkOrderDataQualityAuditDetail, len(in.DataQualityAudit))
		convertV1IntoModel_WorkOrderTaskDetailQualityAuditDetail(in.DataQualityAudit, id, out.DataQualityAudit)
		return
	}
}

// 数据归集工单的任务详情
func convertV1IntoModel_Slice_WorkOrderTaskDetailAggregationInventoryDetail(in *[]task_center_v1.WorkOrderTaskDetailAggregationDetail, id string, out *[]model.WorkOrderDataAggregationDetail) {
	for _, d := range *in {
		dd := model.WorkOrderDataAggregationDetail{}
		convertV1IntoModel_WorkOrderTaskDetailAggregationInventoryDetail(&d, id, &dd)
		*out = append(*out, dd)
	}
}

// 数据归集工单的任务详情
func convertV1IntoModel_WorkOrderTaskDetailAggregationInventoryDetail(in *task_center_v1.WorkOrderTaskDetailAggregationDetail, id string, out *model.WorkOrderDataAggregationDetail) {
	out.ID = id
	out.DepartmentID = in.DepartmentID
	convertV1IntoModel_WorkOrderTaskDetailAggregationTableReference(&in.Source, &out.Source)
	convertV1IntoModel_WorkOrderTaskDetailAggregationTableReference(&in.Target, &out.Target)
	out.Count = in.Count
}

// 数据归集工单的任务详情
func convertV1IntoModel_WorkOrderTaskDetailAggregationTableReference(in *task_center_v1.WorkOrderTaskDetailAggregationTableReference, out *model.WorkOrderTaskDetailAggregationTableReference) {
	out.DatasourceID = in.DatasourceID
	out.TableName = in.TableName
}

// 数据理解工单的任务详情
func convertV1IntoModel_WorkOrderTaskDetailComprehensionDetail(in *task_center_v1.WorkOrderTaskDetailComprehensionDetail, id string, out *model.WorkOrderDataComprehensionDetail) {
}

// 数据融合工单的任务详情
func convertV1IntoModel_WorkOrderTaskDetailFusionDetail(in *task_center_v1.WorkOrderTaskDetailFusionDetail, id string, out *model.WorkOrderDataFusionDetail) {
	out.ID = id
	out.DatasourceID = in.DatasourceID
	out.DatasourceName = in.DatasourceName
	out.DataTable = in.DataTable
}

// 数据质量工单的任务详情
func convertV1IntoModel_WorkOrderTaskDetailQualityDetail(in *task_center_v1.WorkOrderTaskDetailQualityDetail, id string, out *model.WorkOrderDataQualityDetail) {
}

// 数据质量稽查工单的任务详情
func convertV1IntoModel_WorkOrderTaskDetailQualityAuditDetail(in []*task_center_v1.WorkOrderTaskDetailQualityAuditDetail, id string, out []*model.WorkOrderDataQualityAuditDetail) {
	for i, detail := range in {
		if detail.ID == "" {
			detail.ID = uuid.New().String()
		}
		out[i] = &model.WorkOrderDataQualityAuditDetail{
			ID:              detail.ID,
			WorkOrderID:     id,
			DatasourceID:    detail.DatasourceID,
			DatasourceName:  detail.DatasourceName,
			DataTable:       detail.DataTable,
			DetectionScheme: detail.DetectionScheme,
			Status:          string(detail.Status),
			Reason:          detail.Reason,
			Link:            detail.Link,
		}
	}
}

func convertV1ToModel_WorkOrderTask(in *task_center_v1.WorkOrderTask) (out *model.WorkOrderTask) {
	if in == nil {
		return
	}
	out = &model.WorkOrderTask{}
	convertV1IntoModel_WorkOrderTask(in, out)
	return
}

func convertV1ToModel_WorkOrderTasks(in []task_center_v1.WorkOrderTask) (out []model.WorkOrderTask) {
	if in == nil {
		return
	}
	out = make([]model.WorkOrderTask, len(in))
	for i := range in {
		convertV1IntoModel_WorkOrderTask(&in[i], &out[i])
	}
	return out
}

// TODO: Refactor
func convertModelIntoV1_WorkOrderTask(in *model.WorkOrderTask, out *task_center_v1.WorkOrderTask) {
	out.ID = in.ID
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.UpdatedAt = meta_v1.NewTime(in.UpdatedAt)
	out.Name = in.Name
	out.ThirdPartyID = in.ThirdPartyID
	out.WorkOrderID = in.WorkOrderID
	out.Status = task_center_v1.WorkOrderTaskStatus(in.Status)
	out.Reason = in.Reason
	out.Link = in.Link
	// 工单详情
	convertModelIntoV1_WorkOrderTaskTypedDetail(&in.WorkOrderTaskTypedDetail, &out.WorkOrderTaskTypedDetail)
}

func convertModelIntoV1_WorkOrderTaskTypedDetail(in *model.WorkOrderTaskTypedDetail, out *task_center_v1.WorkOrderTaskTypedDetail) {
	// 数据归集工单的任务详情
	if in.DataAggregation != nil {
		convertModelIntoV1_Slice_WorkOrderTaskDetailAggregationInventoryDetail(&in.DataAggregation, &out.DataAggregation)
		return
	}
	// 数据理解工单的任务详情
	if in.DataComprehension != nil {
		out.DataComprehension = new(task_center_v1.WorkOrderTaskDetailComprehensionDetail)
		convertModelIntoV1_WorkOrderTaskDetailComprehensionDetail(in.DataComprehension, out.DataComprehension)
		return
	}
	// 数据融合工单的任务详情
	if in.DataFusion != nil {
		out.DataFusion = new(task_center_v1.WorkOrderTaskDetailFusionDetail)
		convertModelIntoV1_WorkOrderTaskDetailFusionDetail(in.DataFusion, out.DataFusion)
		return
	}
	// 数据质量工单的任务详情
	if in.DataQuality != nil {
		out.DataQuality = new(task_center_v1.WorkOrderTaskDetailQualityDetail)
		convertModelIntoV1_WorkOrderTaskDetailQualityDetail(in.DataQuality, out.DataQuality)
		return
	}
	// 数据质量稽查工单的任务详情
	if in.DataQualityAudit != nil {
		out.DataQualityAudit = make([]*task_center_v1.WorkOrderTaskDetailQualityAuditDetail, len(in.DataQualityAudit))
		convertModelIntoV1_WorkOrderTaskDetailQualityAuditDetail(in.DataQualityAudit, out.DataQualityAudit)
		return
	}
}

func convertModelIntoV1_Slice_WorkOrderTaskDetailAggregationInventoryDetail(in *[]model.WorkOrderDataAggregationDetail, out *[]task_center_v1.WorkOrderTaskDetailAggregationDetail) {
	for _, d := range *in {
		dd := task_center_v1.WorkOrderTaskDetailAggregationDetail{}
		convertModelIntoV1_WorkOrderTaskDetailAggregationInventoryDetail(&d, &dd)
		*out = append(*out, dd)
	}
}

// 数据归集工单的任务详情
func convertModelIntoV1_WorkOrderTaskDetailAggregationInventoryDetail(in *model.WorkOrderDataAggregationDetail, out *task_center_v1.WorkOrderTaskDetailAggregationDetail) {
	out.DepartmentID = in.DepartmentID
	convertModelIntoV1_WorkOrderTaskDetailAggregationTableReference(&in.Source, &out.Source)
	convertModelIntoV1_WorkOrderTaskDetailAggregationTableReference(&in.Target, &out.Target)
	out.Count = in.Count
}

func convertModelIntoV1_WorkOrderTaskDetailAggregationTableReference(in *model.WorkOrderTaskDetailAggregationTableReference, out *task_center_v1.WorkOrderTaskDetailAggregationTableReference) {
	out.DatasourceID = in.DatasourceID
	out.TableName = in.TableName
}

// 数据理解工单的任务详情
func convertModelIntoV1_WorkOrderTaskDetailComprehensionDetail(in *model.WorkOrderDataComprehensionDetail, out *task_center_v1.WorkOrderTaskDetailComprehensionDetail) {
}

// 数据融合工单的任务详情
func convertModelIntoV1_WorkOrderTaskDetailFusionDetail(in *model.WorkOrderDataFusionDetail, out *task_center_v1.WorkOrderTaskDetailFusionDetail) {
	out.DatasourceID = in.DatasourceID
	out.DatasourceName = in.DatasourceName
	out.DataTable = in.DataTable
}

// 数据质量工单的任务详情
func convertModelIntoV1_WorkOrderTaskDetailQualityDetail(in *model.WorkOrderDataQualityDetail, out *task_center_v1.WorkOrderTaskDetailQualityDetail) {
}

// 数据质量稽查工单的任务详情
func convertModelIntoV1_WorkOrderTaskDetailQualityAuditDetail(in []*model.WorkOrderDataQualityAuditDetail, out []*task_center_v1.WorkOrderTaskDetailQualityAuditDetail) {
	for i, detail := range in {
		out[i] = &task_center_v1.WorkOrderTaskDetailQualityAuditDetail{
			ID:              detail.ID,
			WorkOrderID:     detail.WorkOrderID,
			DatasourceID:    detail.DatasourceID,
			DatasourceName:  detail.DatasourceName,
			DataTable:       detail.DataTable,
			DetectionScheme: detail.DetectionScheme,
			Status:          task_center_v1.WorkOrderTaskStatus(detail.Status),
			Reason:          detail.Reason,
			Link:            detail.Link,
		}
	}

}

func convertModelToV1_WorkOrderTask(in *model.WorkOrderTask) (out *task_center_v1.WorkOrderTask) {
	if in == nil {
		return
	}
	out = &task_center_v1.WorkOrderTask{}
	convertModelIntoV1_WorkOrderTask(in, out)
	return
}

func convertModelToV1_WorkOrderTasks(in []model.WorkOrderTask) (out []task_center_v1.WorkOrderTask) {
	if in == nil {
		return
	}
	out = make([]task_center_v1.WorkOrderTask, len(in))
	for i := range in {
		convertModelIntoV1_WorkOrderTask(&in[i], &out[i])
	}
	return
}

// 数据质量稽查工单的任务详情
func convertV1IntoModel_QualityAuditDetail(in []*task_center_v1.WorkOrderTaskDetailQualityAuditDetail, tasks []*model.WorkOrderDataQualityAuditDetail, id string, out []*task_center_v1.WorkOrderTaskDetailQualityAuditDetail) {
	for i, detail := range in {
		for _, task := range tasks {
			if task.DatasourceID == detail.DatasourceID && task.DataTable == detail.DataTable {
				out[i] = &task_center_v1.WorkOrderTaskDetailQualityAuditDetail{
					ID:              task.ID,
					WorkOrderID:     id,
					DatasourceID:    detail.DatasourceID,
					DatasourceName:  detail.DatasourceName,
					DataTable:       detail.DataTable,
					DetectionScheme: detail.DetectionScheme,
					Status:          detail.Status,
					Reason:          detail.Reason,
					Link:            detail.Link,
				}
			}
		}
	}
}
