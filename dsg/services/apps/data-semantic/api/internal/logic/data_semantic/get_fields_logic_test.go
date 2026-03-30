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

func TestGetFieldsLogic_GetFields(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		Config: testConfig,
		DB:     testDB,
	}
	logic := NewGetFieldsLogic(ctx, svcCtx)

	// 测试用例 1: 状态 0 (未理解) - 返回空字段列表
	t.Run("状态0-未理解返回空数据", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetFieldsReq{
			Id:             "test-form-view-id-status0",
			Keyword:        nil,
			OnlyIncomplete: nil,
		}

		resp, err := logic.GetFields(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Empty(t, resp.Fields)
	})

	// 测试用例 2: 状态 2 (待确认) - 从临时表查询
	t.Run("状态2-从临时表查询", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetFieldsReq{
			Id:             "test-form-view-id-status2",
			Keyword:        nil,
			OnlyIncomplete: nil,
		}

		resp, err := logic.GetFields(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.NotNil(t, resp.TableBusinessName)
	})

	// 测试用例 3: 状态 3 (已完成) - 从正式表查询
	t.Run("状态3-从正式表查询", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetFieldsReq{
			Id:             "test-form-view-id-status3",
			Keyword:        nil,
			OnlyIncomplete: nil,
		}

		resp, err := logic.GetFields(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		// 正式表无版本号
	})

	// 测试用例 4: 关键词过滤
	t.Run("关键词过滤", func(t *testing.T) {
		t.Skip("需要数据库连接")

		keyword := "name"
		req := &types.GetFieldsReq{
			Id:             "test-form-view-id-status2",
			Keyword:        &keyword,
			OnlyIncomplete: nil,
		}

		resp, err := logic.GetFields(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		// 验证返回的字段包含关键词
		for _, f := range resp.Fields {
			matched := false
			if keyword != "" {
				// 检查 field_tech_name 或 field_business_name 是否包含关键词
				matched = containsIgnoreCase(f.FieldTechName, keyword)
				if f.FieldBusinessName != nil {
					matched = matched || containsIgnoreCase(*f.FieldBusinessName, keyword)
				}
			}
			assert.True(t, matched, "字段 %s 应该包含关键词 %s", f.FieldTechName, keyword)
		}
	})

	// 测试用例 5: 只查询未补全字段
	t.Run("只查询未补全字段", func(t *testing.T) {
		t.Skip("需要数据库连接")

		onlyIncomplete := true
		req := &types.GetFieldsReq{
			Id:             "test-form-view-id-status2",
			Keyword:        nil,
			OnlyIncomplete: &onlyIncomplete,
		}

		resp, err := logic.GetFields(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		// 验证返回的字段都是未补全的 (field_business_name 为空 或 field_role 为空)
		for _, f := range resp.Fields {
			isIncomplete := f.FieldBusinessName == nil || f.FieldRole == nil
			assert.True(t, isIncomplete, "字段 %s 应该是未补全状态", f.FieldTechName)
		}
	})

	// 测试用例 6: 空ID参数验证
	t.Run("空ID参数验证", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.GetFieldsReq{
			Id:             "",
			Keyword:        nil,
			OnlyIncomplete: nil,
		}

		resp, err := logic.GetFields(req)

		// 数据库查询会返回错误，这是预期的行为
		assert.Error(t, err)
		assert.Nil(t, resp)
	})

	// 测试用例 7: 同时使用关键词和未补全过滤
	t.Run("组合过滤-关键词+未补全", func(t *testing.T) {
		t.Skip("需要数据库连接")

		keyword := "test"
		onlyIncomplete := true
		req := &types.GetFieldsReq{
			Id:             "test-form-view-id-status2",
			Keyword:        &keyword,
			OnlyIncomplete: &onlyIncomplete,
		}

		resp, err := logic.GetFields(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		// 验证返回的字段同时满足两个条件
		for _, f := range resp.Fields {
			isIncomplete := f.FieldBusinessName == nil || f.FieldRole == nil
			matched := containsIgnoreCase(f.FieldTechName, keyword)
			if f.FieldBusinessName != nil {
				matched = matched || containsIgnoreCase(*f.FieldBusinessName, keyword)
			}
			assert.True(t, isIncomplete && matched, "字段 %s 应该同时满足未补全和包含关键词", f.FieldTechName)
		}
	})
}

// containsIgnoreCase 忽略大小写的字符串包含检查
func containsIgnoreCase(s, substr string) bool {
	return len(s) >= len(substr) && (s == substr ||
		len(s) > len(substr) && containsIgnoreCaseHelper(s, substr))
}

func containsIgnoreCaseHelper(s, substr string) bool {
	for i := 0; i <= len(s)-len(substr); i++ {
		match := true
		for j := 0; j < len(substr); j++ {
			if toLower(s[i+j]) != toLower(substr[j]) {
				match = false
				break
			}
		}
		if match {
			return true
		}
	}
	return false
}

func toLower(c byte) byte {
	if c >= 'A' && c <= 'Z' {
		return c + ('a' - 'A')
	}
	return c
}
