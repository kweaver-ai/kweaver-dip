package main

import (
	"context"
	"fmt"

	sharemanagement "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift/sharemgnt"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift_gen/sharemgnt"
)

func main() {
	//d := sharemanagement.NewDriven2("sharemgnt.anyshare.svc.cluster.local", 9600)
	d := sharemanagement.NewDriven2("10.98.21.167", 9600)
	uid := "8afa8462-d9d9-11ed-8dc4-126404968f38"
	GetRoleMember(d)

	if err := d.RoleDeleteMember(context.Background(), sharemgnt.NCT_USER_ADMIN, sharemgnt.NCT_SYSTEM_ROLE_SUPPER, uid); err != nil {
		fmt.Println("RoleDeleteMember " + err.Error())
	}

	GetRoleMember(d)

	err := d.RoleSetMember(context.Background(), sharemgnt.NCT_USER_ADMIN, sharemgnt.NCT_SYSTEM_ROLE_SUPPER, &sharemgnt.NcTRoleMemberInfo{
		UserId:          uid,
		DisplayName:     "",
		DepartmentIds:   []string{},
		DepartmentNames: []string{},
		ManageDeptInfo: &sharemgnt.NcTManageDeptInfo{
			DepartmentIds:      []string{},
			DepartmentNames:    []string{},
			LimitUserSpaceSize: -1,
			LimitDocSpaceSize:  -1,
		},
	})
	if err != nil {
		fmt.Println(err.Error())
	}

	GetRoleMember(d)

}

func GetRoleMember(d sharemanagement.ShareMgnDriven) {
	members, err := d.RoleGetMember(context.Background(), sharemgnt.NCT_USER_ADMIN, sharemgnt.NCT_SYSTEM_ROLE_SUPPER)
	if err != nil {
		fmt.Println("RoleGetMember " + err.Error())
		return
	}
	for _, member := range members {
		fmt.Println(member.UserId, member.DisplayName)
	}
	fmt.Println("-------- ")
}
