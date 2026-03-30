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

func TestMoveAttributeLogic_MoveAttribute(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:     testDB,
	}
	logic := NewMoveAttributeLogic(ctx, svcCtx)

	// 测试用例 1: 正常移动属性
	t.Run("正常移动属性", func(t *testing.T) {
		req := &types.MoveAttributeReq{
			Id:               "test-form-view-id",
			AttributeId:      "test-attribute-id",
			TargetObjectUuid: "target-object-id",
		}

		resp, err := logic.MoveAttribute(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, "test-attribute-id", resp.AttributeId)
		assert.Equal(t, "target-object-id", resp.BusinessObjectId)
	})

	// 测试用例 2: 空attribute_id
	t.Run("空attribute_id", func(t *testing.T) {
		req := &types.MoveAttributeReq{
			Id:               "test-form-view-id",
			AttributeId:      "",
			TargetObjectUuid: "target-object-id",
		}

		resp, err := logic.MoveAttribute(req)

		// 参数验证由 Handler 层处理，这里应该返回错误或默认值
		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 3: 空target_object_uuid
	t.Run("空target_object_uuid", func(t *testing.T) {
		req := &types.MoveAttributeReq{
			Id:               "test-form-view-id",
			AttributeId:      "test-attribute-id",
			TargetObjectUuid: "",
		}

		resp, err := logic.MoveAttribute(req)

		// 参数验证由 Handler 层处理，这里应该返回错误或默认值
		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 4: 移动到同一个对象
	t.Run("移动到同一个对象", func(t *testing.T) {
		req := &types.MoveAttributeReq{
			Id:               "test-form-view-id",
			AttributeId:      "test-attribute-id",
			TargetObjectUuid: "test-attribute-id", // 使用相同的ID
		}

		resp, err := logic.MoveAttribute(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})
}
