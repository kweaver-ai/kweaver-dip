package data_aggregation_inventory

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

// v1 -> model

func convertDataAggregationInventory_V1IntoModel(in *task_center_v1.DataAggregationInventory, out *model.DataAggregationInventory) {
	out.ID = in.ID
	out.Code = in.Code
	out.Name = in.Name
	out.CreationMethod = convertDataAggregationInventoryCreationMethod_V1ToModel(in.CreationMethod)
	out.DepartmentID = in.DepartmentID
	out.ApplyID = in.ApplyID
	out.Status = convertDataAggregationInventoryStatus_V1ToModel(in.Status)
	out.CreatedAt = in.CreatedAt.Time
	out.CreatorID = in.CreatorID
	out.RequesterID = in.RequesterID

	if !in.RequestedAt.IsZero() {
		out.RequestedAt = ptr.To(in.RequestedAt.Time)
	}
	if in.Resources != nil {
		out.Resources = make([]model.DataAggregationResource, len(in.Resources))
		for i := range in.Resources {
			out.Resources[i].DataAggregationInventoryID = in.ID
			convertDataAggregationResource_V1IntoModel(&in.Resources[i], &out.Resources[i])
		}
	}
}

func convertDataAggregationInventory_V1ToModel(in *task_center_v1.DataAggregationInventory) (out *model.DataAggregationInventory) {
	out = &model.DataAggregationInventory{}
	convertDataAggregationInventory_V1IntoModel(in, out)
	return
}

func convertDataAggregationInventoryCreationMethod_V1IntoModel(in *task_center_v1.DataAggregationInventoryCreationMethod, out *model.DataAggregationInventoryCreationMethod) {
	switch *in {
	// 直接创建
	case task_center_v1.DataAggregationInventoryCreationRaw:
		*out = model.DataAggregationInventoryCreationRaw
	// 通过工单创建
	case task_center_v1.DataAggregationInventoryCreationWorkOrder:
		*out = model.DataAggregationInventoryCreationWorkOrder
	default:
	}
}
func convertDataAggregationInventoryCreationMethod_V1ToModel(in task_center_v1.DataAggregationInventoryCreationMethod) (out model.DataAggregationInventoryCreationMethod) {
	convertDataAggregationInventoryCreationMethod_V1IntoModel(&in, &out)
	return
}

func convertDataAggregationInventoryStatus_V1IntoModel(in *task_center_v1.DataAggregationInventoryStatus, out *model.DataAggregationInventoryStatus) {
	switch *in {
	// 草稿，未发起审核
	case task_center_v1.DataAggregationInventoryDraft:
		*out = model.DataAggregationInventoryDraft
	// 审核中
	case task_center_v1.DataAggregationInventoryAuditing:
		*out = model.DataAggregationInventoryAuditing
	// 被拒绝
	case task_center_v1.DataAggregationInventoryReject:
		*out = model.DataAggregationInventoryReject
	// 已完成，直接创建的数据归集清单被批准、或通过工单创建的数据归集清单。
	case task_center_v1.DataAggregationInventoryCompleted:
		*out = model.DataAggregationInventoryCompleted
	default:
	}
}
func convertDataAggregationInventoryStatus_V1ToModel(in task_center_v1.DataAggregationInventoryStatus) (out model.DataAggregationInventoryStatus) {
	convertDataAggregationInventoryStatus_V1IntoModel(&in, &out)
	return
}

func convertDataAggregationResource_V1IntoModel(in *task_center_v1.DataAggregationResource, out *model.DataAggregationResource) {
	out.DataViewID = in.DataViewID
	out.CollectionMethod = convertDataAggregationResourceCollectionMethod_V1ToModel(in.CollectionMethod)
	out.SyncFrequency = convertDataAggregationResourceSyncFrequency_V1ToModel(in.SyncFrequency)
	out.BusinessFormID = in.BusinessFormID
	out.TargetDatasourceID = in.TargetDatasourceID
}
func convertDataAggregationResource_V1ToModel(in *task_center_v1.DataAggregationResource) (out *model.DataAggregationResource) {
	out = &model.DataAggregationResource{}
	convertDataAggregationResource_V1IntoModel(in, out)
	return
}

func convertDataAggregationResources_V1IntoModel(in []task_center_v1.DataAggregationResource, out []model.DataAggregationResource) {
	for i := 0; i < len(in) && i < len(out); i++ {
		convertDataAggregationResource_V1IntoModel(&in[i], &out[i])
	}
}
func convertDataAggregationResources_V1ToModel(in []task_center_v1.DataAggregationResource) (out []model.DataAggregationResource) {
	out = make([]model.DataAggregationResource, len(in))
	convertDataAggregationResources_V1IntoModel(in, out)
	return
}

func convertDataAggregationResourceCollectionMethod_V1IntoModel(in *task_center_v1.DataAggregationResourceCollectionMethod, out *model.DataAggregationResourceCollectionMethod) {
	switch *in {
	// 全量
	case task_center_v1.DataAggregationResourceCollectionFull:
		*out = model.DataAggregationResourceCollectionFull
	// 增量
	case task_center_v1.DataAggregationResourceCollectionIncrement:
		*out = model.DataAggregationResourceCollectionIncrement
	default:
	}
}
func convertDataAggregationResourceCollectionMethod_V1ToModel(in task_center_v1.DataAggregationResourceCollectionMethod) (out model.DataAggregationResourceCollectionMethod) {
	convertDataAggregationResourceCollectionMethod_V1IntoModel(&in, &out)
	return
}
func ConvertDataAggregationResourceCollectionMethod_V1ToModel(in task_center_v1.DataAggregationResourceCollectionMethod) (out model.DataAggregationResourceCollectionMethod) {
	return convertDataAggregationResourceCollectionMethod_V1ToModel(in)
}

func convertDataAggregationResourceSyncFrequency_V1IntoModel(in *task_center_v1.DataAggregationResourceSyncFrequency, out *model.DataAggregationResourceSyncFrequency) {
	switch *in {
	// 每分钟
	case task_center_v1.DataAggregationResourceSyncFrequencyPerMinute:
		*out = model.DataAggregationResourceSyncFrequencyPerMinute
	// 每小时
	case task_center_v1.DataAggregationResourceSyncFrequencyPerHour:
		*out = model.DataAggregationResourceSyncFrequencyPerHour
	// 每天
	case task_center_v1.DataAggregationResourceSyncFrequencyPerDay:
		*out = model.DataAggregationResourceSyncFrequencyPerDay
	// 每周
	case task_center_v1.DataAggregationResourceSyncFrequencyPerWeek:
		*out = model.DataAggregationResourceSyncFrequencyPerWeek
	// 每月
	case task_center_v1.DataAggregationResourceSyncFrequencyPerMonth:
		*out = model.DataAggregationResourceSyncFrequencyPerMonth
	// 每年
	case task_center_v1.DataAggregationResourceSyncFrequencyPerYear:
		*out = model.DataAggregationResourceSyncFrequencyPerYear
	default:
	}
}
func convertDataAggregationResourceSyncFrequency_V1ToModel(in task_center_v1.DataAggregationResourceSyncFrequency) (out model.DataAggregationResourceSyncFrequency) {
	convertDataAggregationResourceSyncFrequency_V1IntoModel(&in, &out)
	return
}
func ConvertDataAggregationResourceSyncFrequency_V1ToModel(in task_center_v1.DataAggregationResourceSyncFrequency) (out model.DataAggregationResourceSyncFrequency) {
	return convertDataAggregationResourceSyncFrequency_V1ToModel(in)
}

// model -> v1

func convertDataAggregationInventory_ModelIntoV1(in *model.DataAggregationInventory, out *task_center_v1.DataAggregationInventory) {
	out.ID = in.ID
	out.Code = in.Code
	out.Name = in.Name
	out.CreationMethod = convertDataAggregationInventoryCreationMethod_ModelToV1(in.CreationMethod)
	out.DepartmentID = in.DepartmentID
	out.ApplyID = in.ApplyID
	out.Status = convertDataAggregationInventoryStatus_ModelToV1(in.Status)
	out.CreatedAt = meta_v1.NewTime(in.CreatedAt)
	out.CreatorID = in.CreatorID
	out.RequesterID = in.RequesterID

	if in.RequestedAt != nil {
		out.RequestedAt = ptr.To(meta_v1.NewTime(*in.RequestedAt))
	}

	// out.Resources = in.Resources
	if in.Resources != nil {
		out.Resources = make([]task_center_v1.DataAggregationResource, len(in.Resources))
		for i := range in.Resources {
			convertDataAggregationResource_ModelIntoV1(&in.Resources[i], &out.Resources[i])
		}
	}
}

func convertDataAggregationInventory_ModelToV1(in *model.DataAggregationInventory) (out *task_center_v1.DataAggregationInventory) {
	out = &task_center_v1.DataAggregationInventory{}
	convertDataAggregationInventory_ModelIntoV1(in, out)
	return
}

func convertDataAggregationInventories_ModelIntoV1(in []model.DataAggregationInventory, out []task_center_v1.DataAggregationInventory) {
	for i := 0; i < len(in) && i < len(out); i++ {
		convertDataAggregationInventory_ModelIntoV1(&in[i], &out[i])
	}
}

func convertDataAggregationInventories_ModelToV1(in []model.DataAggregationInventory) (out []task_center_v1.DataAggregationInventory) {
	out = make([]task_center_v1.DataAggregationInventory, len(in))
	convertDataAggregationInventories_ModelIntoV1(in, out)
	return
}

func convertDataAggregationInventoryCreationMethod_ModelIntoV1(in *model.DataAggregationInventoryCreationMethod, out *task_center_v1.DataAggregationInventoryCreationMethod) {
	switch *in {
	// 直接创建
	case model.DataAggregationInventoryCreationRaw:
		*out = task_center_v1.DataAggregationInventoryCreationRaw
	// 通过工单创建
	case model.DataAggregationInventoryCreationWorkOrder:
		*out = task_center_v1.DataAggregationInventoryCreationWorkOrder
	default:
	}
}
func convertDataAggregationInventoryCreationMethod_ModelToV1(in model.DataAggregationInventoryCreationMethod) (out task_center_v1.DataAggregationInventoryCreationMethod) {
	convertDataAggregationInventoryCreationMethod_ModelIntoV1(&in, &out)
	return
}

func convertDataAggregationInventoryStatus_ModelIntoV1(in *model.DataAggregationInventoryStatus, out *task_center_v1.DataAggregationInventoryStatus) {
	switch *in {
	// 草稿，未发起审核
	case model.DataAggregationInventoryDraft:
		*out = task_center_v1.DataAggregationInventoryDraft
	// 审核中
	case model.DataAggregationInventoryAuditing:
		*out = task_center_v1.DataAggregationInventoryAuditing
	// 被拒绝
	case model.DataAggregationInventoryReject:
		*out = task_center_v1.DataAggregationInventoryReject
	// 已完成，直接创建的数据归集清单被批准、或通过工单创建的数据归集清单。
	case model.DataAggregationInventoryCompleted:
		*out = task_center_v1.DataAggregationInventoryCompleted
	default:
	}
}
func convertDataAggregationInventoryStatus_ModelToV1(in model.DataAggregationInventoryStatus) (out task_center_v1.DataAggregationInventoryStatus) {
	convertDataAggregationInventoryStatus_ModelIntoV1(&in, &out)
	return
}

func convertDataAggregationResource_ModelIntoV1(in *model.DataAggregationResource, out *task_center_v1.DataAggregationResource) {
	out.DataViewID = in.DataViewID
	out.CollectionMethod = convertDataAggregationResourceCollectionMethod_ModelToV1(in.CollectionMethod)
	out.SyncFrequency = convertDataAggregationResourceSyncFrequency_ModelToV1(in.SyncFrequency)
	out.BusinessFormID = in.BusinessFormID
	out.TargetDatasourceID = in.TargetDatasourceID
}
func convertDataAggregationResource_ModelToV1(in *model.DataAggregationResource) (out *task_center_v1.DataAggregationResource) {
	out = &task_center_v1.DataAggregationResource{}
	convertDataAggregationResource_ModelIntoV1(in, out)
	return
}

func convertDataAggregationResourceCollectionMethod_ModelIntoV1(in *model.DataAggregationResourceCollectionMethod, out *task_center_v1.DataAggregationResourceCollectionMethod) {
	switch *in {
	// 全量
	case model.DataAggregationResourceCollectionFull:
		*out = task_center_v1.DataAggregationResourceCollectionFull
	// 增量
	case model.DataAggregationResourceCollectionIncrement:
		*out = task_center_v1.DataAggregationResourceCollectionIncrement
	default:
	}
}
func convertDataAggregationResourceCollectionMethod_ModelToV1(in model.DataAggregationResourceCollectionMethod) (out task_center_v1.DataAggregationResourceCollectionMethod) {
	convertDataAggregationResourceCollectionMethod_ModelIntoV1(&in, &out)
	return
}

func convertDataAggregationResourceSyncFrequency_ModelIntoV1(in *model.DataAggregationResourceSyncFrequency, out *task_center_v1.DataAggregationResourceSyncFrequency) {
	switch *in {
	// 每分钟
	case model.DataAggregationResourceSyncFrequencyPerMinute:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerMinute
	// 每小时
	case model.DataAggregationResourceSyncFrequencyPerHour:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerHour
	// 每天
	case model.DataAggregationResourceSyncFrequencyPerDay:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerDay
	// 每周
	case model.DataAggregationResourceSyncFrequencyPerWeek:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerWeek
	// 每月
	case model.DataAggregationResourceSyncFrequencyPerMonth:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerMonth
	// 每年
	case model.DataAggregationResourceSyncFrequencyPerYear:
		*out = task_center_v1.DataAggregationResourceSyncFrequencyPerYear
	default:
	}
}
func convertDataAggregationResourceSyncFrequency_ModelToV1(in model.DataAggregationResourceSyncFrequency) (out task_center_v1.DataAggregationResourceSyncFrequency) {
	convertDataAggregationResourceSyncFrequency_ModelIntoV1(&in, &out)
	return
}
