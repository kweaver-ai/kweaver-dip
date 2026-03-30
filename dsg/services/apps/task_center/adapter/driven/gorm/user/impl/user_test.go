package impl

import (
	"context"
	"fmt"
	"log"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func get() *db.Data {
	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
		"root",
		"123456",
		"10.4.68.64",
		3306,
		"af_configuration")))
	if err != nil {
		log.Println("open mysql failed,err:", err)
		return nil
	}
	return &db.Data{
		DB: DB,
	}
}
func TestUserRepo_GetAll(t *testing.T) {
	all, err := NewUserRepo(get()).GetAll(context.Background())
	if err != nil {
		t.Error(err)
		return
	}
	t.Log(all)

}

func get2() *db.Data {
	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
		"username",
		"password",
		"ip",
		8888,
		"dbname")))
	if err != nil {
		log.Println("open mysql failed,err:", err)
		return nil
	}
	return &db.Data{
		DB: DB,
	}
}
func TestUserRepo_ListUserByIDs(t *testing.T) {
	all, err := NewUserRepo(get2()).ListUserByIDs(context.Background(), []string{
		"02f34bfc-69b0-4959-80fd-f835c071c345",
		"43962cc3-8b77-43f7-a05f-117b60cdfa4c",
		"78fc618f-6bdb-42fd-b547-913677d7ffae",
		"8afa8462-d9d9-11ed-8dc4-126404968f38",
		"a5e341a4-2bef-4034-866d-ba83e60e66b1",
		"cfb5436e-f2f0-11ed-952f-8ab178223021",
	}...)
	if err != nil {
		t.Error(err)
		return
	}
	for _, user := range all {
		t.Log(user)
	}

}
