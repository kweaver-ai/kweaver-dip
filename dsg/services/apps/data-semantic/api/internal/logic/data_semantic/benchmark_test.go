// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
)

// BenchmarkGetStatus 查询状态接口性能基准测试
// SC-01: 单次查询响应时间 < 10ms
func BenchmarkGetStatus(b *testing.B) {
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:     testDB,
	}
	logic := NewGetStatusLogic(ctx, svcCtx)
	req := &types.GetStatusReq{
		Id: "benchmark-form-view-id",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = logic.GetStatus(req)
	}
}

// BenchmarkGetFields 查询字段语义接口性能基准测试
// SC-02: 单次查询响应时间 < 50ms
func BenchmarkGetFields(b *testing.B) {
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:     testDB,
	}
	logic := NewGetFieldsLogic(ctx, svcCtx)
	req := &types.GetFieldsReq{
		Id: "benchmark-form-view-id",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = logic.GetFields(req)
	}
}

// BenchmarkGetBusinessObjects 查询业务对象接口性能基准测试
func BenchmarkGetBusinessObjects(b *testing.B) {
	ctx := context.Background()
	svcCtx := &svc.ServiceContext{
		DB:     testDB,
	}
	logic := NewGetBusinessObjectsLogic(ctx, svcCtx)
	req := &types.GetBusinessObjectsReq{
		Id: "benchmark-form-view-id",
	}

	b.ResetTimer()
	for i := 0; i < b.N; i++ {
		_, _ = logic.GetBusinessObjects(req)
	}
}
