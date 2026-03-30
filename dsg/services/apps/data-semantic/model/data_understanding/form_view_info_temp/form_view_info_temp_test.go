// Package form_view_info_temp 库表信息临时表Model测试
package form_view_info_temp

import (
	"context"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// 测试数据库连接字符串
const testDSN = "root:root123456@tcp(localhost:3306)/data-semantic?parseTime=true"

// TestFormViewInfoTempModel_Insert 测试插入记录
func TestFormViewInfoTempModel_Insert(t *testing.T) {
	// 跳过集成测试（需要数据库）
	
	conn := sqlx.NewMysql(testDSN)

	model := NewFormViewInfoTempModelSqlx(conn)

	data := &FormViewInfoTemp{
		Id:                "test-id",
		FormViewId:        "test-form-view-id",
		Version:           InitialVersion,
		TableBusinessName: stringPtr("测试业务表"),
		TableDescription:  stringPtr("测试描述"),
	}

	result, err := model.Insert(context.Background(), data)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestFormViewInfoTempModel_FindLatestByFormViewId 测试查询最新版本
func TestFormViewInfoTempModel_FindLatestByFormViewId(t *testing.T) {
	
	conn := sqlx.NewMysql(testDSN)

	model := NewFormViewInfoTempModelSqlx(conn)

	result, err := model.FindLatestByFormViewId(context.Background(), "test-form-view-id")
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// 辅助函数：字符串指针
func stringPtr(s string) *string {
	return &s
}
