package constant

import (
	"strconv"

	"github.com/kweaver-ai/idrm-go-frame/core/enum"

	domain_work_order "github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
)

// ValidTaskType 校验是否时合法的任务类型
func ValidTaskType(reqType string, tType int32) bool {
	//新建标准任务只需要检查是否配置了标准化任务即可
	if reqType == TaskTypeFieldStandard.String {
		//return 0 != (tType & TaskTypeStandardization.Integer.Int32())
		return 0 != tType
	}
	return 0 != (tType & enum.ToInteger[TaskType](reqType).Int32())
}

// GetTaskRelationLevel 判断独立任务的关联等级, 根据页面的交互得出的等级
// GetTaskRelationLevel 判断独立任务的关联等级, 根据页面的交互得出的等级
func GetTaskRelationLevel(taskType string) TaskRelationLevel {
	switch taskType {
	//普通任务，新建业务模型&数据模型任务，数据表视图同步，不需要关联其他数据
	case TaskTypeNormal.String, TaskTypeSyncDataView.String:
		return TaskRelationEmpty
		//建模任务，指标任务，新建标准任务，需要关联到业务模型&数据模型， 新建标准任务的父任务是标准化任务，页面上不用关联，使用的是标准化任务的业务模型&数据模型
	// 新增建模任务：需要关联流程
	case TaskTypeNewMainBusiness.String, TaskTypeDataMainBusiness.String, TaskTypeBusinessDiagnosis.String:
		return TaskRelationDomain
	//case TaskTypeModeling.String, TaskTypeIndicator.String, TaskTypeFieldStandard.String:
	case TaskTypeFieldStandard.String:
		return TaskRelationEmpty
		//标准化任务，数据采集，数据加工任务关联到具体的表
	//case TaskTypeStandardization.String, TaskTypeDataCollecting.String, TaskTypeDataProcessing.String:
	case TaskTypeDataCollecting.String, TaskTypeDataProcessing.String:
		return TaskRelationBusinessForm
		//数据理解关联到数据资源编目
	case TaskTypeDataComprehension.String:
		return TaskRelationDataCatalog
	case TaskTypeIndicatorProcessing.String:
		return TaskRelationBusinessIndicator
	// 主干业务，不需要关联其他数据
	case TaskTypeMainBusiness.String:
		return TaskRelationEmpty
	// 标准新建任务，关联到标准文件
	case TaskTypeStandardization.String:
		return TaskRelationStandardizationFile

	default:
		return TaskRelationInvalid
	}
}

func TaskTypeStringArrToInt(ss []string) int32 {
	var res int32 = 0
	for _, s := range ss {
		res += enum.ToInteger[TaskType](s).Int32()
	}

	return res
}

func WorkOrderTypeStringArrToString(ss []string) string {
	var res string
	for _, s := range ss {
		res += strconv.Itoa(int(enum.ToInteger[domain_work_order.WorkOrderType](s).Int32()))
	}
	return res
}

func TaskTypeStringArrToIntArr(ss []string) []int32 {
	res := make([]int32, 0)
	for _, s := range ss {
		res = append(res, enum.ToInteger[TaskType](s).Int32())
	}
	return res
}

func IdsType(taskType string) string {
	taskRelationLevel := GetTaskRelationLevel(taskType)
	switch taskRelationLevel {
	case TaskRelationBusinessForm:
		return RelationDataTypeBusinessFromId.String
	case TaskRelationMainBusiness:
		return RelationDataTypeBusinessModelId.String
	case TaskRelationDataCatalog:
		return RelationDataTypeCatalogId.String
	case TaskRelationDomain:
		return RelationDataTypeDomainId.String
	case TaskRelationBusinessIndicator:
		return RelationDataBusinessIndicator.String
	case TaskRelationStandardizationFile:
		return RelationFileId.String
	}
	return ""
}

func IdsTypeByTask(taskType int32) string {
	switch taskType {
	case TaskTypeNewMainBusiness.Integer.Int32():
		return RelationDataTypeBusinessModelId.String
	}
	return ""
}

func NeedCheck(taskType string) bool {
	return IdsType(taskType) != ""
}
