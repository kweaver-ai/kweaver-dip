package es_common

import "time"

// domain下有重复定义
type TimeRange struct {
	StartTime *time.Time // 开始时间
	EndTime   *time.Time // 结束时间
}

type Order struct {
	Direction string
	Sort      string
}

// 基础搜索支持对数据目录信息项和数据资源字段的搜索
type Field struct {
	FieldNameZH    string `json:"field_name_zh"`
	RawFieldNameZH string `json:"raw_field_name_zh"`
	FieldNameEN    string `json:"field_name_en"`
	RawFieldNameEN string `json:"raw_field_name_en"`
	Hit            bool
}

// 搜索接口入参中类目筛选项的数据结构
type CateInfoR struct {
	CateID  string   `json:"cate_id"`
	NodeIdS []string `json:"node_ids"`
}

// 自定义类目, 包括组织结构和信息系统, 不包括主题分类
type CateInfo struct {
	CateID   string `json:"cate_id"`
	NodeID   string `json:"node_id"`
	NodeName string `json:"node_name"`
	NodePath string `json:"node_path"`
}

// 挂接资源,支持挂接多个同类型的资源
type MountDataResources struct {
	DataResourcesType string   `json:"data_resources_type"`
	DataResourcesIdS  []string `json:"data_resources_ids"`
}

// 存在6级分类, 类型：1：主题域分组，2：主题域，3：业务对象，4：业务活动，5：逻辑实体，6：属性
// 各个层级统一数据结构
type BusinessObjectEntity struct {
	ID     string `json:"id" binding:"omitempty,uuid"` // 业务对象id
	Name   string `json:"name"`                        // 业务对象名称
	Path   string `json:"path"`                        // 业务对象路径
	PathID string `json:"path_id"`                     // 业务对象路径 ID
}

//type BusinessProcess struct {
//	BusinessProcessId     string `json:"business_process_id" binding:"omitempty,uuid"` // 业务流程uuid
//	BusinessProcessName   string `json:"business_process_name"`                        // 业务流程名称
//	BusinessProcessPath   string `json:"business_process_path"`                        // 业务流程路径名称
//	BusinessProcessPathId string `json:"business_process_path_id"`                     // 业务流程路径id
//}

// 2.0.0.10因为消息体的字段名称是id和name, 修改BusinessProcess，适配MQ
type BusinessProcess struct {
	BusinessProcessId     string `json:"id" binding:"omitempty,uuid"` // 业务流程uuid
	BusinessProcessName   string `json:"name"`                        // 业务流程名称
	BusinessProcessPath   string `json:"business_process_path"`       // 业务流程路径名称
	BusinessProcessPathId string `json:"business_process_path_id"`    // 业务流程路径id
}

//"business_process":[
//	{
//        "business_process_id":"36cdd2af-7856-48c3-beb7-a258ca6c92ea",
//        "business_process_name":"业务流程2-1",
//		"business_process_path":"业务分组/业务域2/业务域1-1/业务流程2/业务流程2-1",
//		"business_process_path_id":"1c4030da-8f6b-4477-a58b-3b026136e42f/11f6c38a-441c-4975-abe4-09d7a355f1e2/c5db033a-00c1-470c-96e9-3b5ae0e7698b/33fd0a77-7ec5-47cc-acf1-a955d098a3d8/36cdd2af-7856-48c3-beb7-a258ca6c92ea"
//    },
//    {
//        "business_process_id":"a6faef88-f8cf-40f4-bc43-239b62708133",
//        "business_process_name":"业务流程1",
//		"business_process_path":"业务分组/业务域2/业务域1-2/业务流程1",
//		"business_process_path_id":"1c4030da-8f6b-4477-a58b-3b026136e42f/11f6c38a-441c-4975-abe4-09d7a355f1e2/02d8e14a-6fde-4e35-aad9-1b9504b7d50d/a6faef88-f8cf-40f4-bc43-239b62708133"
//    }
//]

// 对资源的引用
type Reference struct {
	// 资源 ID
	ID string `json:"id,omitempty"`
	// 资源名称
	Name string `json:"name,omitempty"`
}
