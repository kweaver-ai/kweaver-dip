package tc_flow_info

import (
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type TcFlowConfig struct {
	Id        string     `json:"id"  binding:"required"`         //流水线UUID
	Name      string     `json:"name"  binding:"required"`       //流水线名称
	Nodes     NodeConfig `json:"nodes"  binding:"required"`      //流水线节点
	VersionId string     `json:"version_id"  binding:"required"` //流水线版本
}

type NodeConfig struct {
	Id              string      `json:"id"  binding:"required"`                  //节点ID
	UnitId          string      `json:"unit_id"  binding:"required"`             //节点前端ID
	Name            string      `json:"name"  binding:"required"`                //节点名称
	Task            TaskConfig  `json:"task"  binding:"required"`                //  任务配置
	CompletionMode  string      `json:"completion_mode"  binding:"required"`     // 节点完成方式
	StartMode       string      `json:"start_mode"  binding:"required"`          //节点启动方式
	PreNodeIds      []string    `json:"pre_node_ids"  binding:"required"`        //前序节点数组
	PrevNodeUnitIds []string    `json:"prev_node_unit_ids"   binding:"required"` //后续节点数组
	Stage           StageConfig `json:"stage"`                                   //阶段配置
}

type StageConfig struct {
	Id     string `json:"id" binding:"required"`       //阶段ID
	Name   string `json:"name" binding:"required"`     //阶段名称
	UnitId string `json:"unit_id"  binding:"required"` //阶段前端ID
}

type TaskConfig struct {
	CompletionMode string   `json:"completion_mode"  binding:"required"` //任务完成条件
	ExecRole       []string `json:"exec_role"  binding:"required"`       //任务执行角色
	ExecTool       []string `json:"exec_tool"`                           //任务执行工具
}

func (t TcFlowConfig) GenFlowInfo() *model.TcFlowInfo {
	return &model.TcFlowInfo{
		FlowID:             t.Id,
		FlowName:           t.Name,
		FlowVersion:        t.VersionId,
		NodeCompletionMode: t.Nodes.CompletionMode,
		NodeStartMode:      t.Nodes.StartMode,
		NodeID:             t.Nodes.Id,
		NodeUnitID:         t.Nodes.UnitId,
		NodeName:           t.Nodes.Name,
		PrevNodeIds:        strings.Join(t.Nodes.PreNodeIds, ","),
		PrevNodeUnitIds:    strings.Join(t.Nodes.PrevNodeUnitIds, ","),
		TaskCompletionMode: t.Nodes.Task.CompletionMode,
		//TaskExecRole:       strings.Join(t.Nodes.Task.ExecRole, ","),
		//TaskExecTools: strings.Join(t.Nodes.Task.ExecTool, ","),	//TODO
		StageID:     t.Nodes.Stage.Id,
		StageName:   t.Nodes.Stage.Name,
		StageUnitID: t.Nodes.Stage.UnitId,
	}
}
