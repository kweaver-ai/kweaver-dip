// Package business_object_temp 业务对象临时表Model测试
package business_object_temp

import (
	"context"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// 测试数据库连接字符串
const testDSN = "root:root123456@tcp(localhost:3306)/data-semantic?parseTime=true"

// TestBusinessObjectTempModel_Insert 测试插入记录
func TestBusinessObjectTempModel_Insert(t *testing.T) {
	// 跳过集成测试（需要数据库）
	
	conn := sqlx.NewMysql(testDSN)

	model := NewBusinessObjectTempModelSqlx(conn)

	data := &BusinessObjectTemp{
		Id:         "test-id",
		FormViewId: "test-form-view-id",
		Version:    InitialVersion,
		ObjectName: "测试业务对象",
	}

	result, err := model.Insert(context.Background(), data)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestBusinessObjectTempModel_FindOneByFormViewAndVersion 测试根据form_view_id和version查询
func TestBusinessObjectTempModel_FindOneByFormViewAndVersion(t *testing.T) {
	
	conn := sqlx.NewMysql(testDSN)

	model := NewBusinessObjectTempModelSqlx(conn)

	result, err := model.FindByFormViewAndVersion(context.Background(), "test-form-view-id", InitialVersion)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestBusinessObjectTempModel_FindOneById 测试根据id查询
func TestBusinessObjectTempModel_FindOneById(t *testing.T) {
	
	conn := sqlx.NewMysql(testDSN)

	model := NewBusinessObjectTempModelSqlx(conn)

	result, err := model.FindOneById(context.Background(), "test-id")
	assert.NoError(t, err)
	assert.NotNil(t, result)
}
