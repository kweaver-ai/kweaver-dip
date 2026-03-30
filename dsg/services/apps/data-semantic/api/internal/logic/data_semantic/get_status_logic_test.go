// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/model/form_view"

	"github.com/stretchr/testify/assert"
)

func TestGetStatusLogic_GetStatus(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		Config: testConfig,
		DB:     testDB,
	}
	logic := NewGetStatusLogic(ctx, svcCtx)

	// 测试用例 1: 正常查询 (需要数据库)
	t.Run("正常查询-状态未理解", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetStatusReq{
			Id: "test-form-view-id",
		}

		resp, err := logic.GetStatus(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int8(0), resp.UnderstandStatus)
	})

	// 测试用例 2: 空ID
	t.Run("空ID参数验证", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetStatusReq{
			Id: "",
		}

		resp, err := logic.GetStatus(req)

		// 数据库查询会返回错误，这是预期的行为
		assert.Error(t, err)
		assert.Nil(t, resp)
	})

	// 测试用例 3: 状态待确认
	t.Run("状态待确认", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetStatusReq{
			Id: "test-form-view-id-pending",
		}

		resp, err := logic.GetStatus(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, form_view.StatusPendingConfirm, resp.UnderstandStatus)
	})

	// 测试用例 4: 状态已完成
	t.Run("状态已完成", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetStatusReq{
			Id: "test-form-view-id-completed",
		}

		resp, err := logic.GetStatus(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, form_view.StatusCompleted, resp.UnderstandStatus)
	})
}
