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

func TestSubmitUnderstandingLogic_SubmitUnderstanding(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:     testDB,
	}
	logic := NewSubmitUnderstandingLogic(ctx, svcCtx)

	// 测试用例 1: 正常提交确认 (使用状态为 2 的真实数据)
	t.Run("正常提交确认", func(t *testing.T) {
		req := &types.SubmitUnderstandingReq{
			Id: "c9525b9c-6b9d-42dd-a7f7-e73f0876e735", // 状态为 2 (待确认)
		}

		resp, err := logic.SubmitUnderstanding(req)

		assert.NoError(t, err, "提交确认应该成功")
		assert.NotNil(t, resp, "响应不应为 nil")
		assert.True(t, resp.Success, "Success 应该为 true")
	})

	// 测试用例 2: 状态校验失败 (状态为 0，不允许提交)
	t.Run("状态校验失败-状态0不允许提交", func(t *testing.T) {
		req := &types.SubmitUnderstandingReq{
			Id: "test-form-view-id", // 状态为 0
		}

		resp, err := logic.SubmitUnderstanding(req)

		assert.Error(t, err, "状态 0 不应该允许提交")
		assert.Nil(t, resp, "错误时响应应该为 nil")
	})

	// 测试用例 3: 不存在的ID
	t.Run("不存在的ID", func(t *testing.T) {
		req := &types.SubmitUnderstandingReq{
			Id: "non-existent-id-12345",
		}

		resp, err := logic.SubmitUnderstanding(req)

		assert.Error(t, err, "不存在的 ID 应该返回错误")
		assert.Nil(t, resp, "错误时响应应该为 nil")
	})

	// 测试用例 4: 空ID参数验证
	t.Run("空ID参数验证", func(t *testing.T) {
		req := &types.SubmitUnderstandingReq{
			Id: "",
		}

		resp, err := logic.SubmitUnderstanding(req)

		// 参数验证由 Handler 层处理，Logic 层会返回查询失败错误
		assert.Error(t, err, "空 ID 应该返回错误")
		assert.Nil(t, resp, "错误时响应应该为 nil")
	})
}
