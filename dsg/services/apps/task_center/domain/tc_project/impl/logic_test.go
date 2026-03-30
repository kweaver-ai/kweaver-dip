package impl

import (
	"encoding/json"
	"net/http"
	"regexp"
	"testing"

	"github.com/jarcoal/httpmock"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_project"
	"github.com/stretchr/testify/assert"
)

var (
	piplineInfo = tc_project.PipeLineInfo{
		Id:      util.NewUUID(),
		Version: util.NewUUID(),
		Name:    "测试使用",
		Content: `{"name":"task"}`,
		Nodes: []tc_project.FlowNodeInfo{
			{
				NodeStartMode:   constant.AllNodeCompletion.ToString(),
				NodeID:          util.NewUUID(),
				NodeName:        "测试节点1",
				NodeUnitID:      util.NewUUID(),
				PrevNodeIds:     []string{util.NewUUID(), util.NewUUID()},
				PrevNodeUnitIds: []string{util.NewUUID(), util.NewUUID()},
				Stage: tc_project.FlowNodeStage{
					StageID:     util.NewUUID(),
					StageUnitID: util.NewUUID(),
					StageName:   "stage1",
					StageOrder:  int32(1),
				},
				TaskConfig: tc_project.NodeTaskConfig{
					CompletionMode: "auto",
					ExecRole: tc_project.TaskExecRole{
						Id:   "09095468-122a-4c6a-8bd3-0c2e438782de",
						Name: "业务运营人员",
					},
				},
			},
			{
				NodeStartMode:   constant.AllNodeCompletion.ToString(),
				NodeID:          util.NewUUID(),
				NodeName:        "测试节点2",
				NodeUnitID:      util.NewUUID(),
				PrevNodeIds:     []string{util.NewUUID(), util.NewUUID()},
				PrevNodeUnitIds: []string{util.NewUUID(), util.NewUUID()},
				Stage: tc_project.FlowNodeStage{
					StageID:     util.NewUUID(),
					StageUnitID: util.NewUUID(),
					StageName:   "stage2",
					StageOrder:  int32(2),
				},
				TaskConfig: tc_project.NodeTaskConfig{
					CompletionMode: "auto",
					ExecRole: tc_project.TaskExecRole{
						Id:   "09095468-122a-4c6a-8bd3-0c2e438782de",
						Name: "业务运营人员",
					},
				},
			},
		},
	}
)

func TestGenRoleGroup(t *testing.T) {
	//existsRoleId := "3c86b2ff-97e0-4d8b-a904-c8a01fc444fd"
	//assert.True(t, len(genRoleGroup([]string{existsRoleId})) == 1)

	//emptyRoleId := "3c86b2ff-97e0-4d8b-a904-c8a01fc444fe"
	//assert.True(t, len(genRoleGroup([]string{emptyRoleId})) == 0)
}

func TestGenFlowInfo(t *testing.T) {
	flowInfo, err := GenFlowInfo(&piplineInfo)
	assert.Nil(t, err)
	assert.True(t, len(flowInfo) == 2)
}

func TestGenFlowView(t *testing.T) {
	view, err := GenFlowView(&piplineInfo)
	assert.Nil(t, err)
	assert.NotNil(t, view)
}

func TestGetRemotePipelineInfo(t *testing.T) {
	httpmock.Activate()
	defer httpmock.DeactivateAndReset()

	bts, _ := json.Marshal(piplineInfo)
	reg, _ := regexp.Compile("/api/configuration-center/v1/flowchart-configurations")
	httpmock.RegisterRegexpResponder("GET", reg, httpmock.NewStringResponder(http.StatusOK, string(bts)))

	//flowID := util.NewUUID()
	//flowVersion := util.NewUUID()
	//datas, err := GetRemotePipelineInfo(flowID, flowVersion)
	//assert.Nil(t, err)
	//assert.NotEmpty(t, datas)
}
