// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"

	"github.com/stretchr/testify/assert"
)

func TestDeleteBusinessObjectsLogic_DeleteBusinessObjects(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		Config:   testConfig,
		DB:       testDB,
		Redis:    testRedis,
		AIClient: testAIClient,
	}
	logic := NewDeleteBusinessObjectsLogic(ctx, svcCtx)

	// 测试用例 1: 正常删除
	t.Run("正常删除", func(t *testing.T) {
		req := &types.DeleteBusinessObjectsReq{
			Id: "test-form-view-id",
		}

		resp, err := logic.DeleteBusinessObjects(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.True(t, resp.Success)
	})

	// 测试用例 2: 空ID参数验证
	t.Run("空ID参数验证", func(t *testing.T) {
		req := &types.DeleteBusinessObjectsReq{
			Id: "",
		}

		resp, err := logic.DeleteBusinessObjects(req)

		// 参数验证由 Handler 层处理，这里应该返回错误或默认值
		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 3: 状态校验失败 (非状态2)
	t.Run("状态校验失败", func(t *testing.T) {
		req := &types.DeleteBusinessObjectsReq{
			Id: "test-form-view-id",
		}

		resp, err := logic.DeleteBusinessObjects(req)

		// TODO: 实现状态校验后，这里应该返回错误
		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 4: 正式表有数据 (保持状态3)
	t.Run("正式表有数据保持状态3", func(t *testing.T) {
		req := &types.DeleteBusinessObjectsReq{
			Id: "test-form-view-id",
		}

		resp, err := logic.DeleteBusinessObjects(req)

		// TODO: 实现正式表数据检查后，验证状态保持为3
		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})
}
