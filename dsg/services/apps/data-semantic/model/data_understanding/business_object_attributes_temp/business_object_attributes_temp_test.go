// Package business_object_attributes_temp 业务对象属性临时表Model测试
package business_object_attributes_temp

import (
	"context"
	"testing"

	_ "github.com/go-sql-driver/mysql"
	"github.com/stretchr/testify/assert"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// 测试数据库连接字符串
const testDSN = "root:root123456@tcp(localhost:3306)/data-semantic?parseTime=true"

// TestBusinessObjectAttributesTempModel_Insert 测试插入记录
func TestBusinessObjectAttributesTempModel_Insert(t *testing.T) {
	conn := sqlx.NewMysql(testDSN)

	model := NewBusinessObjectAttributesTempModelSqlx(conn)

	data := &BusinessObjectAttributesTemp{
		Id:               "test-attr-id",
		FormViewId:       "test-form-view-id",
		BusinessObjectId: "test-object-id",
		Version:          10,
		FormViewFieldId:  "test-field-id",
		AttrName:         "测试属性",
	}

	result, err := model.Insert(context.Background(), data)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestBusinessObjectAttributesTempModel_FindByBusinessObjectId 测试根据business_object_id查询属性列表
func TestBusinessObjectAttributesTempModel_FindByBusinessObjectId(t *testing.T) {
	conn := sqlx.NewMysql(testDSN)

	model := NewBusinessObjectAttributesTempModelSqlx(conn)

	result, err := model.FindByBusinessObjectId(context.Background(), "test-object-id")
	assert.NoError(t, err)
	assert.NotNil(t, result)
}

// TestBusinessObjectAttributesTempModel_FindByFormViewAndVersion 测试根据form_view_id和version查询所有属性
func TestBusinessObjectAttributesTempModel_FindByFormViewAndVersion(t *testing.T) {
	conn := sqlx.NewMysql(testDSN)

	model := NewBusinessObjectAttributesTempModelSqlx(conn)

	result, err := model.FindByFormViewAndVersion(context.Background(), "test-form-view-id", 10)
	assert.NoError(t, err)
	assert.NotNil(t, result)
}
