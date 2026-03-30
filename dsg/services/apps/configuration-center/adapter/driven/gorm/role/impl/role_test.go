package impl

import (
	"context"
	"fmt"
	"log"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-common/access_control"
)

func get() *gorm.DB {
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
	return DB
}

func Test_roleRepo_GetUserRole(t *testing.T) {
	userRoles, err := NewRoleRepo(get()).GetUserRole(context.TODO(), "1")
	if err != nil {
		t.Error(err)
	}
	for _, userRole := range userRoles {
		t.Log(userRole)
	}
}

func get2() *gorm.DB {
	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
		"root",
		"***",
		"10.4.132.226",
		3330,
		"af_configuration")))
	if err != nil {
		log.Println("open mysql failed,err:", err)
		return nil
	}
	return DB
}
func Test_roleRepo_UserInRole(t *testing.T) {
	exist, err := NewRoleRepo(get2()).UserInRole(context.TODO(), access_control.DataAcquisitionEngineer, "1368ebcc-0e4b-11ee-ae34-7a4a343cdf26")
	if err != nil {
		t.Error(err)
	}
	t.Log(exist)

}

func Test_roleRepo_GetUserRoleIDs(t *testing.T) {
	// testdata
	const (
		dsn    = "username:password@tcp(localhost:3306)/af_configuration?charset=utf8mb4&parseTime=True&loc=Local"
		userID = "41646000-5329-11ef-9021-629b89708d2f"
	)

	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		t.Skip(err)
	}

	repo := &roleRepo{q: query.Use(db.Debug())}

	roleIDs, err := repo.GetUserRoleIDs(context.Background(), userID)
	if err != nil {
		t.Fatal(err)
	}
	for i, id := range roleIDs {
		t.Logf("roleIDs[%d]: %s", i, id)
	}
}
