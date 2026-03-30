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

func TestSaveSemanticInfoLogic_SaveSemanticInfo(t *testing.T) {
	// 创建测试上下文
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		Config: testConfig,
		DB:     testDB,
	}
	logic := NewSaveSemanticInfoLogic(ctx, svcCtx)

	// 测试用例 1: 保存库表信息
	t.Run("保存库表信息", func(t *testing.T) {
		t.Skip("需要数据库连接")

		tableBusinessName := "测试业务表"
		tableDescription := "测试表描述"

		req := &types.SaveSemanticInfoReq{
			Id: "test-form-view-id-status2",
			TableData: &types.SaveSemanticInfoTableData{
				Id:                "test-table-info-id",
				TableBusinessName: &tableBusinessName,
				TableDescription:  &tableDescription,
			},
			FieldData: nil,
		}

		resp, err := logic.SaveSemanticInfo(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int32(0), resp.Code)
	})

	// 测试用例 2: 保存字段信息
	t.Run("保存字段信息", func(t *testing.T) {
		t.Skip("需要数据库连接")

		fieldBusinessName := "测试字段"
		fieldRole := int8(1) // 业务主键
		fieldDescription := "测试字段描述"

		req := &types.SaveSemanticInfoReq{
			Id:        "test-form-view-id-status2",
			TableData: nil,
			FieldData: &types.SaveSemanticInfoFieldData{
				Id:                "test-field-info-id",
				FieldBusinessName: &fieldBusinessName,
				FieldRole:         &fieldRole,
				FieldDescription:  &fieldDescription,
			},
		}

		resp, err := logic.SaveSemanticInfo(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int32(0), resp.Code)
	})

	// 测试用例 3: 同时保存库表和字段信息
	t.Run("同时保存库表和字段信息", func(t *testing.T) {
		t.Skip("需要数据库连接")

		tableBusinessName := "测试业务表2"
		fieldBusinessName := "测试字段2"
		fieldRole := int8(2) // 关联标识

		req := &types.SaveSemanticInfoReq{
			Id: "test-form-view-id-status2",
			TableData: &types.SaveSemanticInfoTableData{
				Id:                "test-table-info-id-2",
				TableBusinessName: &tableBusinessName,
				TableDescription:  nil,
			},
			FieldData: &types.SaveSemanticInfoFieldData{
				Id:                "test-field-info-id-2",
				FieldBusinessName: &fieldBusinessName,
				FieldRole:         &fieldRole,
				FieldDescription:  nil,
			},
		}

		resp, err := logic.SaveSemanticInfo(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int32(0), resp.Code)
	})

	// 测试用例 4: 空数据
	t.Run("空数据", func(t *testing.T) {
		t.Skip("需要数据库连接")

		req := &types.SaveSemanticInfoReq{
			Id:        "test-form-view-id-status2",
			TableData: nil,
			FieldData: nil,
		}

		resp, err := logic.SaveSemanticInfo(req)

		assert.NoError(t, err)
		assert.NotNil(t, resp)
		assert.Equal(t, int32(0), resp.Code)
	})

	// 测试用例 5: 状态不是待确认 - 应该返回错误
	t.Run("状态不是待确认返回错误", func(t *testing.T) {
		t.Skip("需要数据库连接")

		tableBusinessName := "测试业务表"

		req := &types.SaveSemanticInfoReq{
			Id: "test-form-view-id-status0", // 状态 0 未理解
			TableData: &types.SaveSemanticInfoTableData{
				Id:                "test-table-info-id",
				TableBusinessName: &tableBusinessName,
			},
		}

		resp, err := logic.SaveSemanticInfo(req)

		assert.Error(t, err)
		assert.Nil(t, resp)
		assert.Contains(t, err.Error(), "当前状态不允许编辑")
		assert.Contains(t, err.Error(), "仅状态 2 (待确认) 可编辑")
	})

	// 测试用例 6: 字段角色范围验证
	t.Run("字段角色超出范围", func(t *testing.T) {
		t.Skip("需要数据库连接")

		fieldRole := int8(9) // 超出范围 (1-8)

		req := &types.SaveSemanticInfoReq{
			Id: "test-form-view-id-status2",
			FieldData: &types.SaveSemanticInfoFieldData{
				Id:        "test-field-info-id",
				FieldRole: &fieldRole,
			},
		}

		resp, err := logic.SaveSemanticInfo(req)

		// 参数校验由 Handler 层处理，这里应该返回参数验证错误
		assert.Error(t, err)
		assert.Nil(t, resp)
	})
}
