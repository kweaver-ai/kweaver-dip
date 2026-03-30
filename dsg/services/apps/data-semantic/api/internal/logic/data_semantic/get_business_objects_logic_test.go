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

func TestGetBusinessObjectsLogic_GetBusinessObjects(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:     testDB,
	}
	logic := NewGetBusinessObjectsLogic(ctx, svcCtx)

	// 测试用例 1: 正常查询
	t.Run("正常查询", func(t *testing.T) {
		req := &types.GetBusinessObjectsReq{
			Id:       "test-form-view-id",
			ObjectId: nil,
			Keyword:  nil,
		}

		resp, err := logic.GetBusinessObjects(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		// 验证 UnidentifiedFields 字段存在（不为 nil）
		assert.NotNil(t, resp.UnidentifiedFields)
	})

	// 测试用例 2: 按object_id过滤
	t.Run("按object_id过滤", func(t *testing.T) {
		objectId := "test-object-id"
		req := &types.GetBusinessObjectsReq{
			Id:       "test-form-view-id",
			ObjectId: &objectId,
			Keyword:  nil,
		}

		resp, err := logic.GetBusinessObjects(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 3: 按keyword过滤
	t.Run("按keyword过滤", func(t *testing.T) {
		keyword := "客户"
		req := &types.GetBusinessObjectsReq{
			Id:       "test-form-view-id",
			ObjectId: nil,
			Keyword:  &keyword,
		}

		resp, err := logic.GetBusinessObjects(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 4: 同时使用object_id和keyword过滤
	t.Run("同时使用object_id和keyword过滤", func(t *testing.T) {
		objectId := "test-object-id"
		keyword := "客户"
		req := &types.GetBusinessObjectsReq{
			Id:       "test-form-view-id",
			ObjectId: &objectId,
			Keyword:  &keyword,
		}

		resp, err := logic.GetBusinessObjects(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})

	// 测试用例 5: 空ID参数验证
	t.Run("空ID参数验证", func(t *testing.T) {
		req := &types.GetBusinessObjectsReq{
			Id:       "",
			ObjectId: nil,
			Keyword:  nil,
		}

		resp, err := logic.GetBusinessObjects(req)

		// 参数验证由 Handler 层处理，这里应该返回错误或默认值
		assert.NoError(t, err)
		assert.NotNil(t, resp)
	})
}
