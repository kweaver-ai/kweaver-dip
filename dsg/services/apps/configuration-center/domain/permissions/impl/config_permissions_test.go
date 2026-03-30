package impl

import (
	"context"
	"fmt"
	"log"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/resource/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

func TestDumpResource(t *testing.T) {

	resource := []*model.Resource{
		{Type: 1, Value: 1},
		{Type: 1, Value: 8},
		{Type: 2, Value: 2},
	}
	for _, r := range DumpResource(resource) {
		t.Logf("%+v", r)
	}
}

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

func TestPermissions_AddTCSystemMgmPermissions(t *testing.T) {

	p := &Permissions{
		resourceRepo: impl.NewResourceRepo(get()),
	}
	t.Log(p.AddTCSystemMgmPermissions(context.Background()))
	t.Log(p.AddTCDataOperationEngineerPermissions(context.Background()))
	t.Log(p.AddTCDataDevelopmentEngineerPermissions(context.Background()))
	t.Log(p.AddTCDataOwnerPermissions(context.Background()))
	t.Log(p.AddTCDataButlerPermissions(context.Background()))
	t.Log(p.AddTCNormalPermissions(context.Background()))
}

func TestAllPermission(t *testing.T) {
	const want int32 = 15
	assert.Equal(t, want, AllPermission())
}
