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

func TestSaveBusinessObjectsLogic_SaveBusinessObjects(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:     testDB,
	}
	logic := NewSaveBusinessObjectsLogic(ctx, svcCtx)

	// 测试用例 1: 更新业务对象名称
	t.Run("更新业务对象名称", func(t *testing.T) {
		req := &types.SaveBusinessObjectsReq{
			Type: "object",
			Id:   "test-object-id",
			Name: "更新后的业务对象名称",
		}

		resp, err := logic.SaveBusinessObjects(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int32(0), resp.Code)
	})

	// 测试用例 2: 更新属性名称
	t.Run("更新属性名称", func(t *testing.T) {
		req := &types.SaveBusinessObjectsReq{
			Type: "attribute",
			Id:   "test-attribute-id",
			Name: "更新后的属性名称",
		}

		resp, err := logic.SaveBusinessObjects(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int32(0), resp.Code)
	})

	// 测试用例 3: 空名称
	t.Run("空名称", func(t *testing.T) {
		req := &types.SaveBusinessObjectsReq{
			Type: "object",
			Id:   "test-object-id",
			Name: "",
		}

		resp, err := logic.SaveBusinessObjects(req)

		// 参数验证由 Handler 层处理，这里应该返回错误或默认值
		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 4: 无效的type (handler层会拦截，但测试兜底逻辑)
	t.Run("无效的type", func(t *testing.T) {
		req := &types.SaveBusinessObjectsReq{
			Type: "invalid",
			Id:   "test-object-id",
			Name: "测试名称",
		}

		resp, err := logic.SaveBusinessObjects(req)

		// type 应该由 handler 层校验，但这里不做任何操作也返回成功
		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int32(0), resp.Code)
	})
}
