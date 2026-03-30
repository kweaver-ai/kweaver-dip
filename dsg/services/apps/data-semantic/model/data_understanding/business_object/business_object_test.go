// Package business_object 业务对象正式表Model测试
package business_object

import (
	"testing"

	_ "github.com/go-sql-driver/mysql"
)

func TestBusinessObjectModel_Insert(t *testing.T) {
	// TODO: 实现插入测试
	// tx := testDB.Beginx()
	// defer tx.Rollback()
	// model := NewBusinessObjectModel(tx)
	// data := &BusinessObject{
	//     Id:         "test-id",
	//     ObjectName: "测试业务对象",
	//     ObjectType: 0,
	//     FormViewId: "test-form-view-id",
	//     Status:     1,
	// }
	// result, err := model.Insert(context.Background(), data)
	// assert.NoError(t, err)
	// assert.NotNil(t, result)
}

func TestBusinessObjectModel_FindByFormViewId(t *testing.T) {
	// TODO: 实现查询测试
}

func TestBusinessObjectModel_FindOneById(t *testing.T) {
	// TODO: 实现单条查询测试
}

func TestBusinessObjectModel_Update(t *testing.T) {
	// TODO: 实现更新测试
}

func TestBusinessObjectModel_Delete(t *testing.T) {
	// TODO: 实现删除测试
}
