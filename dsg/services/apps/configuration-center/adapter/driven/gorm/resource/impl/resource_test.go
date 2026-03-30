package impl

import (
	"context"
	"fmt"
	"log"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
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

func Test_resourceRepo_InsertScope(t *testing.T) {
	//roleid := "033a0ef3-f98f-4498-a8b8-1d6266f500a3" //系统管理员
	//roleid := "09095468-122a-4c6a-8bd3-0c2e438782de" //项目管理员
	//roleid := "2927b1fb-df1b-451c-9519-4ba6aa46a226" //业务管理员
	//roleid := "3c86b2ff-97e0-4d8b-a904-c8a01fc444fd" //业务运营工程师
	//roleid := "56ce508f-1e1c-4bf6-ba63-1dcbbf980d10" //标准管理工程师
	//roleid := "84f8e148-5571-48c3-9b78-bdd2eecb382d" //数据质量工程师
	//roleid := "9d42f240-b4ad-45e8-ab8b-8727899d3445" //数据采集工程师
	//roleid := "c7752d11-7aef-4163-a7ba-27f5cf717b8e" //数据加工工程师
	roleid := "d173ed4c-d4f2-44bb-8a75-646d13e195a2" //指标工程师
	resources := make([]*model.Resource, 0)
	for _, scope := range GetScope() {
		resources = append(resources, &model.Resource{
			RoleID:  roleid,
			Type:    scope.ToInt32(),
			SubType: 0,
			//Value:   AllPermission(),
			//Value: 5,
			Value: access_control.GET_ACCESS.ToInt32(),
		})
	}
	err := NewResourceRepo(get()).InsertResource(context.TODO(), resources)
	if err != nil {
		t.Error(err)
	}
}

func GetScope() []access_control.Scope {
	return []access_control.Scope{
		access_control.ProjectScope,
	}
}

func Test_resourceRepo_InsertResource(t *testing.T) {
	//roleid := "033a0ef3-f98f-4498-a8b8-1d6266f500a3" //系统管理员
	//roleid := "09095468-122a-4c6a-8bd3-0c2e438782de" //项目管理员
	//roleid := "2927b1fb-df1b-451c-9519-4ba6aa46a226" //业务运营管理员
	//roleid := "3c86b2ff-97e0-4d8b-a904-c8a01fc444fd" //业务运营工程师
	//roleid := "56ce508f-1e1c-4bf6-ba63-1dcbbf980d10" //标准管理工程师
	//roleid := "84f8e148-5571-48c3-9b78-bdd2eecb382d" //数据质量工程师
	//roleid := "9d42f240-b4ad-45e8-ab8b-8727899d3445" //数据采集工程师
	//roleid := "c7752d11-7aef-4163-a7ba-27f5cf717b8e" //数据加工工程师
	roleid := "d173ed4c-d4f2-44bb-8a75-646d13e195a2" //指标工程师
	resources := make([]*model.Resource, 0)
	for _, resource := range GetResource() {
		resources = append(resources, &model.Resource{
			RoleID:  roleid,
			Type:    resource.ToInt32(),
			SubType: 0,
			//Value:   AllPermission(),
			//Value: 5,
			//Value: access_control.GET_ACCESS.ToInt32(),
		})
	}
	err := NewResourceRepo(get()).InsertResource(context.TODO(), resources)
	if err != nil {
		t.Error(err)
	}
}

func GetResource() []access_control.Resource {
	return []access_control.Resource{
		access_control.Task,
	}
}
func GetBusinessGrooming() []access_control.Resource {
	return []access_control.Resource{
		access_control.BusinessDomain,
		access_control.BusinessModel,
		access_control.BusinessForm,
		access_control.BusinessFlowchart,
		access_control.BusinessIndicator,
	}
}
func AllPermission() int32 {
	return (access_control.GET_ACCESS |
		access_control.POST_ACCESS |
		access_control.PUT_ACCESS |
		access_control.DELETE_ACCESS).ToInt32()
}
func Test_resourceRepo_InsertResource2(t *testing.T) {
	fmt.Println(1 | 2 | 1 | 3 | 4)
}
