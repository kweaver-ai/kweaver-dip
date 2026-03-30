package impl

import (
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"reflect"
	"strconv"
)

type Scope struct {
	NormalBusinessDomain           int32 `type:"-1" json:"business_domain"`                //业务域
	NormalBusinessStructure        int32 `type:"-2" json:"enterprise_architecture"`        //业务架构
	NormalBusinessModel            int32 `type:"-3" json:"business_model"`                 //主干业务
	NormalBusinessForm             int32 `type:"-4" json:"business_form"`                  //业务表
	NormalBusinessFlowchart        int32 `type:"-5" json:"business_flowchart"`             //业务流程图
	NormalBusinessIndicator        int32 `type:"-6" json:"business_indicator"`             //指标
	NormalBusinessReport           int32 `type:"-7" json:"business_report"`                //业务诊断
	NormalProject                  int32 `type:"-8" json:"project"`                        //项目列表
	NormalPipelineKanban           int32 `type:"-9" json:"pipeline_kanban"`                //流水线看板
	NormalTaskKanban               int32 `type:"-10" json:"task_Kanban"`                   //任务看板
	NormalTask                     int32 `type:"-11" json:"task"`                          //任务列表
	NormalPipeline                 int32 `type:"-12" json:"pipeline"`                      //流水线
	NormalRole                     int32 `type:"-13" json:"role"`                          //角色
	NormalBusinessStandard         int32 `type:"-14" json:"business_standard"`             //业务标准
	NormalBusinessKnowledgeNetwork int32 `type:"-15" json:"business_knowledge_network"`    //业务知识网络
	NormalDataAcquisition          int32 `type:"-16" json:"data_acquisition"`              //数据采集
	NormalDataConnect              int32 `type:"-17" json:"data_connection"`               //数据连接
	NormalMetadata                 int32 `type:"-18" json:"metadata"`                      //元数据管理
	NormalDataSecurity             int32 `type:"-19" json:"data_security"`                 //数据安全
	NormalDataQuality              int32 `type:"-20" json:"data_quality"`                  //数据质量
	NormalDataProcessing           int32 `type:"-21" json:"data_processing"`               //数据加工
	NormalDataUnderstand           int32 `type:"-22" json:"data_understand"`               //数据理解
	BusinessModelingTask           int32 `type:"-23" json:"business_modeling_task"`        //业务建模任务
	BusinessStandardizationTask    int32 `type:"-24" json:"business_standardization_task"` //业务标准化任务
	BusinessIndicatorTask          int32 `type:"-25" json:"business_indicator_task"`       //业务指标梳理任务
	TaskBusinessModel              int32 `type:"-26" json:"task.business_model"`           //主干业务
	TaskBusinessForm               int32 `type:"-27" json:"task.business_form"`            //业务表
	TaskBusinessFlowchart          int32 `type:"-28" json:"task.business_flowchart"`       //业务流程图
	TaskBusinessIndicator          int32 `type:"-29" json:"task.business_indicator"`       //指标
	NormalNewStandard              int32 `type:"-30" json:"new_standard"`                  //新建标准
	TaskNewStandard                int32 `type:"-31" json:"task.new_standard"`             //新建标准
}

func (r *Scope) SetValue(tag access_control.Scope, value int32) {
	rt := reflect.TypeOf(*r)
	for k := 0; k < rt.NumField(); k++ {
		if rt.Field(k).Tag.Get("type") == strconv.Itoa(int(tag)) {
			reflect.ValueOf(r).Elem().FieldByName(rt.Field(k).Name).SetInt(int64(value))
			return
		}
	}
}
