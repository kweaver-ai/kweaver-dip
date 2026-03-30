package impl

import (
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"reflect"
	"strconv"
)

//
//type ResourceUnit struct {
//	Index access_control.Resource
//	Value int32
//}
//type ResourceNoReflect struct {
//	businessDomain               ResourceUnit //业务域
//	businessModel                ResourceUnit //主干业务
//	businessForm                 ResourceUnit //业务表
//	businessFlowchart            ResourceUnit //流程图
//	businessIndicator            ResourceUnit //指标
//	unpublishedBusinessModel     ResourceUnit //任务下主干业务
//	unpublishedBusinessForm      ResourceUnit //任务下业务表
//	unpublishedBusinessFlowchart ResourceUnit //任务下流程图
//	unpublishedBusinessIndicator ResourceUnit //任务下指标
//	project                      ResourceUnit //项目
//	task                         ResourceUnit //任务
//	operationLog                 ResourceUnit //操作日志
//	flowchart                    ResourceUnit //流水线
//	role                         ResourceUnit //角色
//	businessStructure            ResourceUnit //业务架构
//
//	businessStandard         ResourceUnit //业务标准
//	businessKnowledgeNetwork ResourceUnit //业务知识网络
//	dataAcquisition          ResourceUnit //数据采集
//	dataConnection           ResourceUnit //数据连接
//	metadata                 ResourceUnit //元数据管理
//	dataSecurity             ResourceUnit //数据安全
//	dataQuality              ResourceUnit //数据质量
//	dataProcessing           ResourceUnit //数据加工
//	dataUnderstand           ResourceUnit //数据理解
//}
//
//func NewResource() *ResourceNoReflect {
//	return &ResourceNoReflect{
//		businessDomain:           ResourceUnit{Index: access_control.BusinessDomain},
//		businessModel:            ResourceUnit{Index: access_control.BusinessModel},
//		businessForm:             ResourceUnit{Index: access_control.BusinessForm},
//		businessFlowchart:        ResourceUnit{Index: access_control.BusinessFlowchart},
//		businessIndicator:        ResourceUnit{Index: access_control.BusinessIndicator},
//		project:                  ResourceUnit{Index: access_control.Project},
//		task:                     ResourceUnit{Index: access_control.Task},
//		operationLog:             ResourceUnit{Index: access_control.OperationLog},
//		flowchart:                ResourceUnit{Index: access_control.Flowchart},
//		role:                     ResourceUnit{Index: access_control.Role},
//		businessStructure:        ResourceUnit{Index: access_control.BusinessStructure},
//		businessStandard:         ResourceUnit{Index: access_control.BusinessStandard},
//		businessKnowledgeNetwork: ResourceUnit{Index: access_control.BusinessKnowledgeNetwork},
//		dataAcquisition:          ResourceUnit{Index: access_control.DataAcquisition},
//		dataConnection:           ResourceUnit{Index: access_control.DataConnection},
//		metadata:                 ResourceUnit{Index: access_control.Metadata},
//		dataSecurity:             ResourceUnit{Index: access_control.DataSecurity},
//		dataQuality:              ResourceUnit{Index: access_control.DataQuality},
//		dataProcessing:           ResourceUnit{Index: access_control.DataProcessing},
//		dataUnderstand:           ResourceUnit{Index: access_control.DataUnderstand},
//	}
//}
//
//func (r ResourceNoReflect) SetValue(index access_control.Resource, value int32) {
//	if r.businessModel.Index == index {
//		r.businessModel.Value = value
//	}
//	//Too much trouble
//}

type Resource struct {
	BusinessDomain               int32 `type:"1"`  //业务域
	BusinessModel                int32 `type:"2"`  //主干业务
	BusinessForm                 int32 `type:"3"`  //业务表
	BusinessFlowchart            int32 `type:"4"`  //流程图
	BusinessIndicator            int32 `type:"5"`  //指标
	UnpublishedBusinessModel     int32 `type:"6"`  //任务下主干业务
	UnpublishedBusinessForm      int32 `type:"7"`  //任务下业务表
	UnpublishedBusinessFlowchart int32 `type:"8"`  //任务下流程图
	UnpublishedBusinessIndicator int32 `type:"9"`  //任务下指标
	Project                      int32 `type:"10"` //项目
	Task                         int32 `type:"11"` //任务
	OperationLog                 int32 `type:"12"` //操作日志
	Flowchart                    int32 `type:"13"` //流水线
	Role                         int32 `type:"14"` //角色
	BusinessStructure            int32 `type:"15"` //业务架构

	BusinessStandard         int32 `type:"16"` //业务标准
	BusinessKnowledgeNetwork int32 `type:"17"` //业务知识网络
	DataAcquisition          int32 `type:"18"` //数据采集
	DataConnection           int32 `type:"19"` //数据连接
	Metadata                 int32 `type:"20"` //元数据管理
	DataSecurity             int32 `type:"21"` //数据安全
	DataQuality              int32 `type:"22"` //数据质量
	DataProcessing           int32 `type:"23"` //数据加工
	DataUnderstand           int32 `type:"24"` //数据理解
}

func (r *Resource) SetValue(tag access_control.Resource, value int32) {
	rt := reflect.TypeOf(*r)
	for k := 0; k < rt.NumField(); k++ {
		if rt.Field(k).Tag.Get("type") == strconv.Itoa(int(tag)) {
			reflect.ValueOf(r).Elem().FieldByName(rt.Field(k).Name).SetInt(int64(value))
			return
		}
	}
}

func (r *Resource) NormalBusinessDomain() int32 {
	return r.BusinessDomain
}
func (r *Resource) NormalBusinessStructure() int32 {
	return r.BusinessStructure
}
func (r *Resource) NormalBusinessModel() int32 {
	if access_control.GET_ACCESS.Exist(r.BusinessDomain) || access_control.GET_ACCESS.Exist(r.BusinessStructure) {
		return r.BusinessModel
	}
	return access_control.NONE.ToInt32()
}
func (r *Resource) NormalBusinessForm() int32 {
	if (access_control.GET_ACCESS.Exist(r.BusinessDomain) ||
		access_control.GET_ACCESS.Exist(r.BusinessStructure)) &&
		access_control.GET_ACCESS.Exist(r.BusinessModel) {
		return r.BusinessForm
	}
	return access_control.NONE.ToInt32()
}
func (r *Resource) NormalBusinessFlowchart() int32 {
	if (access_control.GET_ACCESS.Exist(r.BusinessDomain) ||
		access_control.GET_ACCESS.Exist(r.BusinessStructure)) &&
		access_control.GET_ACCESS.Exist(r.BusinessModel) {
		return r.BusinessFlowchart
	}
	return access_control.NONE.ToInt32()
}
func (r *Resource) NormalBusinessIndicator() int32 {
	if (access_control.GET_ACCESS.Exist(r.BusinessDomain) ||
		access_control.GET_ACCESS.Exist(r.BusinessStructure)) &&
		access_control.GET_ACCESS.Exist(r.BusinessModel) {
		return r.BusinessIndicator
	}
	return access_control.NONE.ToInt32()
}
func (r *Resource) NormalBusinessReport() int32 {
	if (access_control.GET_ACCESS.Exist(r.BusinessDomain) ||
		access_control.GET_ACCESS.Exist(r.BusinessStructure)) &&
		access_control.GET_ACCESS.Exist(r.BusinessModel) {
		return r.BusinessForm
	}
	return access_control.NONE.ToInt32()
}
func (r *Resource) NormalProject() int32 {
	res := r.Project
	if access_control.PUT_ACCESS.Exist(r.Project) &&
		(!access_control.GET_ACCESS.Exist(r.Flowchart) || !access_control.GET_ACCESS.Exist(r.Role)) {
		res = access_control.PUT_ACCESS.Reduce(res)
	}
	if access_control.POST_ACCESS.Exist(r.Project) &&
		(!access_control.GET_ACCESS.Exist(r.Flowchart) || !access_control.GET_ACCESS.Exist(r.Role)) {
		res = access_control.POST_ACCESS.Reduce(res)
	}
	return res
}
func (r *Resource) NormalPipelineKanban() int32 {
	if access_control.GET_ACCESS.Exist(r.Role) && access_control.GET_ACCESS.Exist(r.Project) {
		return access_control.GET_ACCESS.ToInt32()
	}
	return access_control.NONE.ToInt32()
}
func (r *Resource) NormalTaskKanban() int32 {
	if access_control.GET_ACCESS.Exist(r.Task) && access_control.GET_ACCESS.Exist(r.Project) {
		return access_control.GET_ACCESS.ToInt32()
	}
	return access_control.NONE.ToInt32()
}
func (r *Resource) NormalTask() int32 {
	res := r.Task
	if access_control.POST_ACCESS.Exist(r.Task) &&
		(!access_control.GET_ACCESS.Exist(r.BusinessDomain) || !access_control.GET_ACCESS.Exist(r.BusinessModel)) {
		res = access_control.POST_ACCESS.Reduce(res)
	}
	if !access_control.GET_ACCESS.Exist(r.Project) {
		return access_control.NONE.ToInt32()
	}
	return res
}

//func (r *Resource) NormalBusinessModelingTask() int32 {
//	if access_control.GET_ACCESS.ExistBatch(r.Project, r.Role, r.Task, r.BusinessDomain) {
//
//	}
//	return access_control.NONE.ToInt32()
//}
//func (r *Resource) NormalBusinessStandardizationTask() int32 {
//	return access_control.NONE.ToInt32()
//}
//func (r *Resource) NormalBusinessIndicatorTask() int32 {
//	return access_control.NONE.ToInt32()
//}

func (r *Resource) NormalPipeline() int32 {
	res := r.Flowchart
	if access_control.PUT_ACCESS.Exist(r.Flowchart) && !access_control.GET_ACCESS.Exist(r.Role) && !access_control.POST_ACCESS.Exist(r.Flowchart) {
		res = access_control.PUT_ACCESS.Reduce(res)
	}
	if access_control.POST_ACCESS.Exist(r.Flowchart) && !access_control.GET_ACCESS.Exist(r.Role) {
		res = access_control.POST_ACCESS.Reduce(res)
	}
	return res
}
func (r *Resource) NormalRole() int32 {
	return r.Role
}
func (r *Resource) NormalBusinessStandard() int32 {
	return r.BusinessStandard
}
func (r *Resource) NormalBusinessKnowledgeNetwork() int32 {
	return r.BusinessKnowledgeNetwork
}
func (r *Resource) NormalDataAcquisition() int32 {
	return r.DataAcquisition
}
func (r *Resource) NormalDataConnect() int32 {
	return r.DataConnection
}
func (r *Resource) NormalMetadata() int32 {
	return r.Metadata
}
func (r *Resource) NormalDataSecurity() int32 {
	return r.DataSecurity
}
func (r *Resource) NormalDataQuality() int32 {
	return r.DataQuality
}
func (r *Resource) NormalDataProcessing() int32 {
	return r.DataProcessing
}
func (r *Resource) NormalDataUnderstand() int32 {
	return r.DataUnderstand
}
func (r *Resource) TaskBusinessModel() int32 {
	return r.UnpublishedBusinessModel
}
func (r *Resource) TaskBusinessForm() int32 {
	return r.UnpublishedBusinessModel
}
func (r *Resource) TaskBusinessFlowchart() int32 {
	return r.UnpublishedBusinessFlowchart
}
func (r *Resource) TaskBusinessIndicator() int32 {
	return r.UnpublishedBusinessIndicator
}
