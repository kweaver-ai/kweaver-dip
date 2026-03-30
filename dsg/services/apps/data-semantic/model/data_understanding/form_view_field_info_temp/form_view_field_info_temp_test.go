// Package form_view_field_info_temp 库表字段信息临时表Model测试
package form_view_field_info_temp

import (
	"context"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// 测试数据库连接字符串
const testDSN = "root:root123456@tcp(localhost:3306)/data-semantic?parseTime=true"

// TestFormViewFieldInfoTempModel_Insert 测试插入记录
func TestFormViewFieldInfoTempModel_Insert(t *testing.T) {

	conn := sqlx.NewMysql(testDSN)

	model := NewFormViewFieldInfoTempModelSqlx(conn)

	role := int8(FieldRoleBusinessKey)
	data := &FormViewFieldInfoTemp{
		Id:                "test-id",
		FormViewId:        "test-form-view-id",
		FormViewFieldId:   "test-field-id",
		Version:           10,
		FieldBusinessName: stringPtr("测试字段"),
		FieldRole:         &role,
		FieldDescription:  stringPtr("测试字段描述"),
	}

	result, err := model.Insert(context.Background(), data)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestFormViewFieldInfoTempModel_FindOneByFormFieldId 测试根据form_view_field_id查询
func TestFormViewFieldInfoTempModel_FindOneByFormFieldId(t *testing.T) {
	t.Skip("需要数据库连接")

	conn := sqlx.NewMysql(testDSN)

	model := NewFormViewFieldInfoTempModelSqlx(conn)

	result, err := model.FindOneByFormFieldId(context.Background(), "test-field-id")
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// 辅助函数：字符串指针
func stringPtr(s string) *string {
	return &s
}
