package sharemanagement

import (
	"context"
	"sync"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift_gen/sharemgnt"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/tclient"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var (
	shmOnce sync.Once
	d       *driven
)

type ShareMgnDriven interface {
	GetUserByID(ctx context.Context, userID string) (userInfo *Visitor, err error)
	GetUserInfoDepartment(ctx context.Context, departmentId string) (userIds []string)
	GetUserCountDepartment(ctx context.Context, departmentId string) (count int64)
	RoleAdd(ctx context.Context, roleInfo *sharemgnt.NcTRoleInfo) (success string)
	RoleSetMember(ctx context.Context, userId string, roleId string, memberInfo *sharemgnt.NcTRoleMemberInfo) (err error)
	RoleGetMember(ctx context.Context, userId string, roleId string) (res []*sharemgnt.NcTRoleMemberInfo, err error)
	RoleDeleteMember(ctx context.Context, userId string, roleId string, memberId string) (err error)
	GetAllUser(ctx context.Context) (users []*sharemgnt.NcTUsrmGetUserInfo, err error)
}

type driven struct {
	Host string
	Port int
}

func NewDriven() ShareMgnDriven {
	shmOnce.Do(func() {
		d = &driven{
			Host: settings.ConfigInstance.Config.DepServices.ShareMgnIp,
			Port: settings.ConfigInstance.Config.DepServices.ShareMgnPort,
		}
	})
	return d
}
func NewDriven2(ip string, port int) ShareMgnDriven {
	return &driven{
		Host: ip,
		Port: port,
	}
}

func (s *driven) GetUserByID(ctx context.Context, userID string) (userInfo *Visitor, err error) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	userInfo = &Visitor{}
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, sharemgnt.NCT_SHAREMGNT_PORT)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】NewTClient: %v", err)
		return
	}

	defer transport.Close()
	tUserInfo, err := shareMgntClient.Usrm_GetUserInfo(context.Background(), userID)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】GetUserByID: %v", err)
		return
	}
	userInfo.ID = tUserInfo.ID
	userInfo.Name = *tUserInfo.User.DisplayName
	userInfo.CsfLevel = float64(*tUserInfo.User.CsfLevel)
	userInfo.Email = *tUserInfo.User.Email
	return
}

// GetUserInfoDepartment 获取部门下所有用户信息
func (d *driven) GetUserInfoDepartment(ctx context.Context, departmentId string) (userIds []string) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, d.Port)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】GetDepartmentOfUsers NewTClient(: %v", err)
		return
	}
	defer transport.Close()
	count := d.GetUserCountDepartment(ctx, departmentId)
	userInfos, err := shareMgntClient.Usrm_GetDepartmentOfUsers(context.Background(), departmentId, 0, int32(count))
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】GetDepartmentOfUsers: %v", err)
		return
	}
	for _, userInfo := range userInfos {
		userIds = append(userIds, userInfo.ID)
	}
	return
}

// GetUserCountDepartment  获取部门下用户数量
func (d *driven) GetUserCountDepartment(ctx context.Context, departmentId string) (count int64) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, d.Port)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】GetDepartmentOfUsersCount NewTClient: %v", err)
		return
	}
	defer transport.Close()
	count, err = shareMgntClient.Usrm_GetDepartmentOfUsersCount(context.Background(), departmentId)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】GetDepartmentOfUsersCount: %v", err)
		return
	}
	return
}

// RoleAdd  添加角色
func (d *driven) RoleAdd(ctx context.Context, roleInfo *sharemgnt.NcTRoleInfo) (success string) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, d.Port)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleAdd NewTClient: %v", err)
		return
	}
	defer transport.Close()
	success, err = shareMgntClient.UsrRolem_Add(context.Background(), roleInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleAdd: %v", err)
		return
	}
	return
}

// RoleSetMember  角色添加用户
func (d *driven) RoleSetMember(ctx context.Context, userId string, roleId string, memberInfo *sharemgnt.NcTRoleMemberInfo) (err error) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, d.Port)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleSetMember NewTClient: %v", err)
		return
	}
	defer transport.Close()
	err = shareMgntClient.UsrRolem_SetMember(context.Background(), userId, roleId, memberInfo)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleSetMember: %v", err)
		return
	}
	return
}

// RoleGetMember  角色查询用户
func (d *driven) RoleGetMember(ctx context.Context, userId string, roleId string) (res []*sharemgnt.NcTRoleMemberInfo, err error) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, d.Port)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleGetMember NewTClient: %v", err)
		return
	}
	defer transport.Close()
	res, err = shareMgntClient.UsrRolem_GetMember(context.Background(), userId, roleId)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleGetMember: %v", err)
		return
	}
	return
}

// RoleDeleteMember  角色删除用户
func (d *driven) RoleDeleteMember(ctx context.Context, userId string, roleId string, memberId string) (err error) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, d.Port)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleDeleteMember NewTClient: %v", err)
		return
	}
	defer transport.Close()
	err = shareMgntClient.UsrRolem_DeleteMember(context.Background(), userId, roleId, memberId)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】RoleDeleteMember: %v", err)
		return
	}
	return
}

func (s *driven) GetAllUser(ctx context.Context) (users []*sharemgnt.NcTUsrmGetUserInfo, err error) {
	var shareMgntClient *sharemgnt.NcTShareMgntClient
	transport, err := tclient.NewTClient(sharemgnt.NewNcTShareMgntClientFactory, &shareMgntClient, d.Host, sharemgnt.NCT_SHAREMGNT_PORT)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】NewTClient: %v", err)
		return
	}

	defer transport.Close()
	users, err = shareMgntClient.Usrm_GetAllUsers(ctx, 0, -1)
	if err != nil {
		log.WithContext(ctx).Errorf("【ShareManagement thrift driven】GetUserByID: %v", err)
		return
	}
	return
}
