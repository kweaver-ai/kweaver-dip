package tc_task

//import (
//	"context"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task/impl"
//	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
//	"fmt"
//	"gorm.io/driver/mysql"
//	"gorm.io/gorm"
//	"log"
//	"testing"
//)
//
//func get() Repo {
//	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
//		"root",
//		"123456",
//		"10.4.68.64",
//		3306,
//		"af_tasks")))
//	if err != nil {
//		log.Println("open mysql failed,err:", err)
//		return nil
//	}
//	return impl.NewTaskRepo(&db.Data{DB: DB})
//}
//func TestTaskRepo_GetTaskSupportRole(t1 *testing.T) {
//	gotRoleId, err := get().GetTaskSupportRole(context.TODO(), "16fa6683-1cfd-44ef-9846-ed1f5bb61a5b", "")
//	t1.Log(err)
//	t1.Log(gotRoleId)
//}
//
//func TestTaskRepo_GetSupportUserIdsFromProjectByRoleId(t1 *testing.T) {
//	gotMember, err := get().GetSupportUserIdsFromProjectByRoleId(context.TODO(), "3c86b2ff-97e0-4d8b-a904-c8a01fc444fd", "6e169dd5-0873-46a3-8242-50ff73e3020d")
//	t1.Log(err)
//	for _, member := range gotMember {
//		t1.Log(member)
//	}
//	t1.Log(gotMember)
//}
//
//func TestTaskRepo_GetProjectSupportUserIds(t1 *testing.T) {
//	gotRoleIds, err := get().GetProjectSupportUserIds(context.TODO(), "6e169dd5-0873-46a3-8242-50ff73e3020d")
//	t1.Log(err)
//	for _, member := range gotRoleIds {
//		t1.Log(member)
//	}
//}
//
//func TestTaskRepo_GetSupportRole(t1 *testing.T) {
//	gotRoleId, err := get().GetSupportRole(context.TODO(), "1fe7e791-14a3-44f5-ad0c-462449598c1e", "56efb357-7953-4582-8375-9e87c3f469d0", "ad4476bc-dd35-472f-9c18-669348edde20")
//	t1.Log(err)
//	t1.Log(gotRoleId)
//
//}
//
//func TestTaskRepo_GetAllTaskExecutors(t1 *testing.T) {
//	gotUserIds, err := get().GetAllTaskExecutors(context.TODO(), "319f4156-1f1a-4678-9df1-9c711a0ce369")
//	t1.Log(err)
//	t1.Log(gotUserIds)
//}
