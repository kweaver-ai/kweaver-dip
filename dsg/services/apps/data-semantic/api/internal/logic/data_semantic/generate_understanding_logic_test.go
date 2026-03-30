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

func TestGenerateUnderstandingLogic_GenerateUnderstanding(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:       testDB,
		Redis:    testRedis,
		AIClient: testAIClient, // 使用 Mock AI 客户端
	}

	// 获取测试用 form_view ID
	testIds, err := getTestFormViewIds(ctx)
	if err != nil {
		t.Skipf("无法获取测试数据: %v", err)
	}

	// 如果没有找到测试数据，跳过测试
	if len(testIds) == 0 {
		t.Skip("数据库中没有测试数据")
	}

	logic := NewGenerateUnderstandingLogic(ctx, svcCtx)

	// 测试用例 1: 状态 0 (未理解) - 允许生成
	t.Run("状态0-未理解允许生成", func(t *testing.T) {
		id, ok := testIds["status0"]
		if !ok {
			t.Skip("没有找到状态0的测试数据")
		}

		req := &types.GenerateUnderstandingReq{
			Id: id,
		}

		resp, err := logic.GenerateUnderstanding(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, form_view.StatusUnderstanding, resp.UnderstandStatus)
	})

	// 测试用例 2: 状态 3 (已完成) - 允许重新生成
	t.Run("状态3-已完成允许重新生成", func(t *testing.T) {
		id, ok := testIds["status3"]
		if !ok {
			t.Skip("没有找到状态3的测试数据")
		}

		req := &types.GenerateUnderstandingReq{
			Id: id,
		}

		resp, err := logic.GenerateUnderstanding(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, form_view.StatusUnderstanding, resp.UnderstandStatus)
	})

	// 测试用例 3: 状态 1 (理解中) - 不允许生成
	t.Run("状态1-理解中不允许生成", func(t *testing.T) {
		id, ok := testIds["status1"]
		if !ok {
			t.Skip("没有找到状态1的测试数据")
		}

		req := &types.GenerateUnderstandingReq{
			Id: id,
		}

		resp, err := logic.GenerateUnderstanding(req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "当前状态不允许生成")
	})

	// 测试用例 4: 状态 2 (待确认) - 不允许生成
	t.Run("状态2-待确认不允许生成", func(t *testing.T) {
		id, ok := testIds["status2"]
		if !ok {
			t.Skip("没有找到状态2的测试数据")
		}

		req := &types.GenerateUnderstandingReq{
			Id: id,
		}

		resp, err := logic.GenerateUnderstanding(req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "当前状态不允许生成")
	})

	// 测试用例 5: 状态 4 (已发布) - 不允许生成
	t.Run("状态4-已发布不允许生成", func(t *testing.T) {
		id, ok := testIds["status4"]
		if !ok {
			t.Skip("没有找到状态4的测试数据")
		}

		req := &types.GenerateUnderstandingReq{
			Id: id,
		}

		resp, err := logic.GenerateUnderstanding(req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "当前状态不允许生成")
	})

	// 测试用例 6: 空ID参数验证
	t.Run("空ID参数验证", func(t *testing.T) {
		req := &types.GenerateUnderstandingReq{
			Id: "",
		}

		resp, err := logic.GenerateUnderstanding(req)

		// 数据库查询会返回错误，这是预期的行为
		assert.Error(t, err)
		assert.Nil(t, resp)
	})

	// 测试用例 7: 部分字段理解 - 传入 fields 参数
	t.Run("部分字段理解-传入fields参数", func(t *testing.T) {
		id, ok := testIds["status0"]
		if !ok {
			t.Skip("没有找到状态0的测试数据")
		}

		fieldRole1 := int8(1) // 业务主键
		fieldRole2 := int8(2) // 关联标识

		req := &types.GenerateUnderstandingReq{
			Id: id,
			Fields: []types.FieldSelection{
				{
					FormViewFieldId:   "field-id-1",
					FieldTechName:     "id",
					FieldType:         "BIGINT",
					FieldBusinessName: stringPtr("用户ID"),
					FieldRole:         &fieldRole1,
					FieldDescription:  stringPtr("用户唯一标识"),
				},
				{
					FormViewFieldId:   "field-id-2",
					FieldTechName:     "email",
					FieldType:         "VARCHAR",
					FieldBusinessName: stringPtr("邮箱"),
					FieldRole:         &fieldRole2,
					FieldDescription:  stringPtr("用户邮箱地址"),
				},
			},
		}

		resp, err := logic.GenerateUnderstanding(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, form_view.StatusUnderstanding, resp.UnderstandStatus)
	})

	// 测试用例 8: 部分字段理解 - fields 为空数组（按全部字段处理）
	t.Run("部分字段理解-fields为空数组", func(t *testing.T) {
		id, ok := testIds["status0"]
		if !ok {
			t.Skip("没有找到状态0的测试数据")
		}

		req := &types.GenerateUnderstandingReq{
			Id:     id,
			Fields: []types.FieldSelection{},
		}

		resp, err := logic.GenerateUnderstanding(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, form_view.StatusUnderstanding, resp.UnderstandStatus)
	})
}

// stringPtr 返回字符串指针的辅助函数
func stringPtr(s string) *string {
	return &s
}
