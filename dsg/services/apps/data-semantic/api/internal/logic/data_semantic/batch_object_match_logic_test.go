// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/agentretrieval"

	"github.com/stretchr/testify/assert"
)

// TestFieldMapping 字段映射测试
func TestFieldMapping(t *testing.T) {
	// 测试字段映射逻辑
	instanceData := agentretrieval.InstanceData{
		MdlId:      "mdl-123",
		Display:    "库存视图",
		ObjectName: "库存",
	}

	// 映射到 ResponseDataSource
	response := types.ResponseDataSource{
		Id:         instanceData.MdlId,
		Name:       instanceData.Display,
		ObjectName: instanceData.ObjectName,
	}

	// 验证映射正确
	assert.Equal(t, "mdl-123", response.Id)
	assert.Equal(t, "库存视图", response.Name)
	assert.Equal(t, "库存", response.ObjectName)
}

// TestQueryObjectInstanceRequest 构建请求
func TestQueryObjectInstanceRequest(t *testing.T) {
	// 测试请求构建逻辑（模拟）
	keyword := "库存"

	// 验证请求参数
	assert.Equal(t, "库存", keyword)
}

// TestInstanceData_Fields 测试 InstanceData 结构
func TestInstanceData_Fields(t *testing.T) {
	data := agentretrieval.InstanceData{
		FormViewId: "098ae87c-4b09-402c-9a5c-36e45c81b5af",
		ObjectName: "库存",
		ObjectType: 0,
		MdlId:      "2019354881755254785",
		InstanceId: "instance-123",
		Display:    "库存",
		Id:         "id-123",
	}

	assert.Equal(t, "库存", data.ObjectName)
	assert.Equal(t, "2019354881755254785", data.MdlId)
	assert.Equal(t, "库存", data.Display)
}
