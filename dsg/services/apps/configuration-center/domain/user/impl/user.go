package impl

import (
	"context"
	"errors"
	"fmt"
	"net/url"
	"path"
	"sort"
	"strconv"
	"strings"
	"sync"
	"time"

	object_subtype "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/object_subtype"
	configuration_center_v1_frontend "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1/frontend"
	"github.com/kweaver-ai/idrm-go-common/rest/authorization"
	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift_gen/sharemgnt"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/permission"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_group_role_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role_permission_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_permission_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_role_binding"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user_role_group_binding"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"

	"github.com/jinzhu/copier"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/resource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role"
	IUserR "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user2"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	sharemanagement "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/thrift/sharemgnt"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	configurationCaseDomain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/configuration"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/access_control"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	configuration_center_v2 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v2"
	"github.com/kweaver-ai/idrm-go-common/built_in"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type User struct {
	userRepo                  IUserR.IUserRepo
	userMgm                   user_management.DrivenUserMgnt
	roleRepo                  role.Repo
	resourceRepo              resource.Repo
	configurationRepo         configuration.Repo
	configurationCase         configurationCaseDomain.ConfigurationCase
	sharemanagement           sharemanagement.ShareMgnDriven
	userPermissionBindingRepo user_permission_binding.Repo
	userRoleBindingRepo       user_role_binding.Repo
	userRoleGroupBindingRepo  user_role_group_binding.Repo
	rolePermissionBindingRepo role_permission_binding.Repo
	roleGroupRoleBinding      role_group_role_binding.Repo
	roleGroupRepo             role_group.Repo
	permissionRepo            permission.Repo
	ccDriven                  configuration_center.Driven
	role2Repo                 role2.Repo
	businessStructureRepo     business_structure.Repo
	objectSubtypeRepo         object_subtype.Repo
	authorizationDriven       authorization.Driven
}

func NewUser(
	userRepo IUserR.IUserRepo,
	userMgm user_management.DrivenUserMgnt,
	roleRepo role.Repo,
	resourceRepo resource.Repo,
	configurationRepo configuration.Repo,
	configurationCase configurationCaseDomain.ConfigurationCase,
	sharemanagement sharemanagement.ShareMgnDriven,
	userPermissionBindingRepo user_permission_binding.Repo,
	userRoleBindingRepo user_role_binding.Repo,
	userRoleGroupBindingRepo user_role_group_binding.Repo,
	rolePermissionBindingRepo role_permission_binding.Repo,
	roleGroupRoleBinding role_group_role_binding.Repo,
	roleGroupRepo role_group.Repo,
	permissionRepo permission.Repo,
	ccDriven configuration_center.Driven,
	role2Repo role2.Repo,
	businessStructureRepo business_structure.Repo,
	authorizationDriven authorization.Driven,
	objectSubtypeRepo object_subtype.Repo,
) user.UseCase {
	return &User{
		userRepo:                  userRepo,
		userMgm:                   userMgm,
		roleRepo:                  roleRepo,
		resourceRepo:              resourceRepo,
		configurationRepo:         configurationRepo,
		configurationCase:         configurationCase,
		sharemanagement:           sharemanagement,
		userPermissionBindingRepo: userPermissionBindingRepo,
		userRoleBindingRepo:       userRoleBindingRepo,
		userRoleGroupBindingRepo:  userRoleGroupBindingRepo,
		rolePermissionBindingRepo: rolePermissionBindingRepo,
		roleGroupRoleBinding:      roleGroupRoleBinding,
		roleGroupRepo:             roleGroupRepo,
		permissionRepo:            permissionRepo,
		ccDriven:                  ccDriven,
		role2Repo:                 role2Repo,
		businessStructureRepo:     businessStructureRepo,
		objectSubtypeRepo:         objectSubtypeRepo,
		authorizationDriven:       authorizationDriven,
	}
}

func (u *User) GetByUserId(ctx context.Context, userId string) (*model.User, error) {
	u.UserApply()
	if userId == "" {
		log.WithContext(ctx).Error("userId is empty str ")
		return nil, nil
	}
	user, err := u.userRepo.GetByUserIdSimple(ctx, userId)
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			user, err := u.getUserDriver(ctx, userId)
			if err != nil {
				return nil, err
			}
			return user, nil
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return user, nil
}

func (u *User) GetByUserIds(ctx context.Context, uids []string) ([]*model.User, error) {
	u.UserApply()
	if len(uids) == 0 {
		log.WithContext(ctx).Error("userId is empty str ")
		return nil, nil
	}
	uids = util.DuplicateStringRemoval(uids)
	users, err := u.userRepo.GetByUserIds(ctx, uids)
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	if len(users) == len(uids) {
		return users, nil
	}
	users, _, err = u.getUsersDriver(ctx, uids)
	if err != nil {
		return nil, err
	}

	return users, nil
}

func (u *User) GetByUserNameMap(ctx context.Context, uids []string) (map[string]string, error) {
	u.UserApply()
	if len(uids) == 0 {
		log.WithContext(ctx).Error("userId is empty str ")
		return nil, nil
	}
	uids = util.DuplicateStringRemoval(uids)
	users, err := u.userRepo.GetByUserIds(ctx, uids)
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	if len(users) == len(uids) {
		userNameMap := make(map[string]string)
		for _, user := range users {
			userNameMap[user.ID] = user.Name
		}
		return userNameMap, nil
	}
	_, userNameMap, err := u.getUsersDriver(ctx, uids)
	if err != nil {
		return nil, err
	}
	return userNameMap, nil
}
func (u *User) GetByUserIdNotNil(ctx context.Context, userId string) (*model.User, error) {
	u.UserApply()
	res, err := u.GetByUserId(ctx, userId)
	if err != nil {
		return &model.User{}, err
	}
	return res, nil
}
func (u *User) GetUserNameNoErr(ctx context.Context, userId string) string {
	u.UserApply()
	res, err := u.GetByUserId(ctx, userId)
	if err != nil || res == nil {
		return ""
	}
	return res.Name
}
func (u *User) getUserDriver(ctx context.Context, userId string) (m *model.User, err error) {
	name, _, err := u.userMgm.GetUserNameByUserID(ctx, userId)
	if err != nil {
		log.WithContext(ctx).Error("userMgm GetUserNameByUserID err", zap.Error(err))
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	infoMap, err := u.userMgm.BatchGetUserInfoByID(ctx, []string{userId})
	if err != nil {
		log.WithContext(ctx).Error("getUserDriver userMgm BatchGetUserInfoByID Error", zap.Error(err))
	}

	m = &model.User{
		ID:        userId,
		Name:      name,
		Status:    int32(configuration_center.UserNormal),
		UpdatedAt: time.Now(),
	}
	if info, exist := infoMap[userId]; exist {
		m.PhoneNumber = info.Telephone
		m.MailAddress = info.Email
		m.LoginName = info.Account
		m.ThirdUserId = info.ThirdID
	}
	_, err = u.userRepo.Insert(ctx, m)
	if err != nil {
		log.WithContext(ctx).Error("GetByUserId Insert err", zap.Error(err))
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return m, nil
}
func (u *User) getUsersDriver(ctx context.Context, uids []string) (m []*model.User, userNameMap map[string]string, err error) {
	userInfoMap, err := u.userMgm.BatchGetUserInfoByID(ctx, uids)
	if err != nil {
		log.WithContext(ctx).Error("userMgm BatchGetUserInfoByID err", zap.Error(err))
		return nil, nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	userNameMap = make(map[string]string)
	insertTime := time.Now()
	for _, userInfo := range userInfoMap {
		m = append(m, &model.User{
			ID:          userInfo.ID,
			Name:        userInfo.VisionName,
			Status:      int32(configuration_center.UserNormal),
			PhoneNumber: userInfo.Telephone,
			MailAddress: userInfo.Email,
			LoginName:   userInfo.Account,
			UpdatedAt:   insertTime,
			ThirdUserId: userInfo.ThirdID,
		})
		userNameMap[userInfo.ID] = userInfo.VisionName
	}
	if err = u.userRepo.InsertNotExist(ctx, m); err != nil {
		log.WithContext(ctx).Error("GetByUserId InsertNotExist err", zap.Error(err))
		return nil, nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return m, userNameMap, nil
}
func (u *User) UpdateUserNameNSQ(ctx context.Context, userId string, name string) {
	u.UserApply()
	infoMap, err := u.userMgm.BatchGetUserInfoByID(ctx, []string{userId})
	if err != nil {
		log.WithContext(ctx).Error("UpdateUserNameNSQ userMgm BatchGetUserInfoByID Error", zap.Error(err))
	}

	m := &model.User{
		ID:        userId,
		Name:      name,
		UpdatedAt: time.Now(),
	}
	if info, exist := infoMap[userId]; exist {
		m.PhoneNumber = info.Telephone
		m.MailAddress = info.Email
		m.LoginName = info.Account
	}
	affected, err := u.userRepo.UpdateUserName(ctx, m, []string{"name", "phone_number", "mail_address", "login_name", "updated_at"})
	if err != nil {
		log.WithContext(ctx).Error("UpdateUserNameNSQ Database Error", zap.Error(err))
	}
	if affected == 0 {
		log.WithContext(ctx).Error("UpdateUserNameNSQ affected zero")
	}
	return
}
func (u *User) UpdateUserName(ctx context.Context, userId string, name string) error {
	u.UserApply()
	infoMap, err := u.userMgm.BatchGetUserInfoByID(ctx, []string{userId})
	if err != nil {
		log.WithContext(ctx).Error("UpdateUserName userMgm BatchGetUserInfoByID Error", zap.Error(err))
	}

	m := &model.User{
		ID:        userId,
		Name:      name,
		UpdatedAt: time.Now(),
	}
	if info, exist := infoMap[userId]; exist {
		m.PhoneNumber = info.Telephone
		m.MailAddress = info.Email
		m.LoginName = info.Account
	}
	affected, err := u.userRepo.UpdateUserName(ctx, m, []string{"name", "phone_number", "mail_address", "login_name", "updated_at"})
	if err != nil {
		log.WithContext(ctx).Error("UpdateUserNameNSQ Database Error", zap.Error(err))
		return err
	}
	if affected == 0 {
		log.WithContext(ctx).Error("UpdateUserNameNSQ affected zero")
	}
	return nil
}

func (u *User) UpdateUserMobileMail(ctx context.Context, userId string, mobile string, mail string) {

	m := &model.User{
		ID:          userId,
		PhoneNumber: mobile,
		MailAddress: mail,
		UpdatedAt:   time.Now(),
	}

	affected, err := u.userRepo.UpdateUserMobileMail(ctx, m, []string{"phone_number", "mail_address", "updated_at"})
	if err != nil {
		log.WithContext(ctx).Error("UpdateUserMobileMail Database Error", zap.Error(err))
		return
	}
	if affected == 0 {
		log.WithContext(ctx).Error("UpdateUserMobileMail affected zero")
	}
	return
}
func (u *User) CreateUserNSQ(ctx context.Context, userId, name, userType string) {
	u.UserApply()
	tempType, err := strconv.ParseInt(userType, 10, 32)
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ Insert Error", zap.Error(err))
	}

	infoMap, err := u.userMgm.BatchGetUserInfoByID(ctx, []string{userId})
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ userMgm BatchGetUserInfoByID Error", zap.Error(err))
	}

	m := &model.User{
		ID:        userId,
		Name:      name,
		UserType:  int32(tempType),
		Status:    int32(configuration_center.UserNormal),
		UpdatedAt: time.Now(),
	}
	if info, exist := infoMap[userId]; exist {
		m.PhoneNumber = info.Telephone
		m.MailAddress = info.Email
		m.LoginName = info.Account
		m.ThirdUserId = info.ThirdID
	}

	affected, err := u.userRepo.Insert(ctx, m)
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ Insert Error", zap.Error(err))
	}
	if affected == 0 {
		log.WithContext(ctx).Error("CreateUserNSQ affected zero")
	}
	return
}
func (u *User) CreateUser(ctx context.Context, userId, name, userType string) error {
	u.UserApply()
	tempType, err := strconv.ParseInt(userType, 10, 32)
	if err != nil {
		log.WithContext(ctx).Error("CreateUser Insert Error", zap.Error(err))
		return err
	}

	infoMap, err := u.userMgm.BatchGetUserInfoByID(ctx, []string{userId})
	if err != nil {
		log.WithContext(ctx).Error("CreateUser userMgm BatchGetUserInfoByID Error", zap.Error(err))
	}

	m := &model.User{
		ID:        userId,
		Name:      name,
		UserType:  int32(tempType),
		Status:    int32(configuration_center.UserNormal),
		UpdatedAt: time.Now(),
	}
	if info, exist := infoMap[userId]; exist {
		m.PhoneNumber = info.Telephone
		m.MailAddress = info.Email
		m.LoginName = info.Account
		m.ThirdUserId = info.ThirdID
	}

	affected, err := u.userRepo.Insert(ctx, m)
	if err != nil {
		log.WithContext(ctx).Error("CreateUser Insert Error", zap.Error(err))
		return err
	}
	if affected == 0 {
		log.WithContext(ctx).Error("CreateUser affected zero")
	}
	return nil
}
func (u *User) GetUserRoles(ctx context.Context, uid string) ([]*model.SystemRole, error) {
	u.UserApply()
	if uid == "" {
		userInfo, err := user_util.GetUserInfo(ctx)
		if err != nil {
			return nil, err
		}
		uid = userInfo.ID
	}
	roles, err := u.userRepo.GetUserRoles(ctx, uid)
	if err != nil {
		log.WithContext(ctx).Error("GetUserRoles GetUserRoles Database Error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.UserDataBaseError)
	}
	//	if userInfo.Name == "af_admin" {
	if uid == built_in.NCT_USER_ADMIN {
		var tmp *model.SystemRole
		//switch *providerType {
		//case constant.CS:
		//	tmp, err = u.roleRepo.Get(ctx, access_control.SystemMgm)
		//case constant.TC:
		//	tmp, err = u.roleRepo.Get(ctx, access_control.TCSystemMgm)
		//}
		tmp, err = u.roleRepo.Get(ctx, access_control.TCSystemMgm)
		if err != nil {
			log.WithContext(ctx).Error("GetUserRoles roleRepo Get Database Error", zap.Error(err))
			return nil, errorcode.Desc(errorcode.UserDataBaseError)
		}
		roles = append(roles, tmp)
	}
	//去重
	var set = map[interface{}]bool{}
	rolesUnique := make([]*model.SystemRole, 0)
	for _, r := range roles {
		if !set[r.ID] {
			rolesUnique = append(rolesUnique, r)
			set[r.ID] = true
		}
	}
	//排序
	sort.Slice(rolesUnique, func(i, j int) bool {
		a, _ := util.UTF82GBK(rolesUnique[i].Name)
		b, _ := util.UTF82GBK(rolesUnique[j].Name)
		bLen := len(b)
		for idx, chr := range a {
			if idx > bLen-1 {
				return false
			}
			if chr != b[idx] {
				return chr < b[idx]
			}
		}
		return true
	})
	return rolesUnique, nil
}

func (u *User) GetUserRoleFilterByProvider(ctx context.Context, uid string) ([]string, error) {
	userRoles, err := u.roleRepo.GetUserRole(ctx, uid) //所有角色
	if err != nil {
		log.WithContext(ctx).Error("GetUserRoleFilterByProvider GetUserRole DataBaseError", zap.Error(err))
		return nil, errorcode.Desc(errorcode.UserDataBaseError)
	}

	roleIds := make([]string, 0)
	if uid == built_in.NCT_USER_ADMIN {
		roleIds = append(roleIds, access_control.TCSystemMgm)
	}

	providerRoles, err := u.roleRepo.GetRolesByProvider(ctx)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	providerRoleMap := make(map[string]struct{})
	for _, providerRole := range providerRoles {
		providerRoleMap[providerRole.ID] = struct{}{}
	}
	for _, userRole := range userRoles {
		//筛选provider的角色
		if _, ok := providerRoleMap[userRole.RoleID]; ok {
			roleIds = append(roleIds, userRole.RoleID)
		}
	}
	return roleIds, nil
}
func (u *User) AccessControl(ctx context.Context) (*access_control.ScopeTransfer, []string, error) {
	u.UserApply()
	userInfo := ctx.Value(interception.InfoName).(*model.User)
	roleIds, err := u.GetUserRoleFilterByProvider(ctx, userInfo.ID)
	if err != nil {
		return nil, nil, err
	}
	scopes, err := u.resourceRepo.GetScope(ctx, roleIds)
	if err != nil {
		log.WithContext(ctx).Error("Get AccessControl GetScope DataBaseError", zap.Error(err))
		return nil, nil, errorcode.Desc(errorcode.UserDataBaseError)
	}
	scopeMap := make(map[int32]int32, 0)
	for _, r := range scopes {
		if r.SubType == 0 {
			//scopeSlice[r.Type] = scopeSlice[r.Type] + r.Value
			//scopeSlice[r.Type] = u.BitAdd(ctx, scopeSlice[r.Type], r.Value)
			//scopeSlice[r.Type] = scopeSlice[r.Type] | r.Value
			scopeMap[r.Type] = scopeMap[r.Type] | r.Value //按位与运算
		} else {
			//scopeSlice[r.SubType] = scopeSlice[r.SubType] + r.Value
			//scopeSlice[r.SubType] = u.BitAdd(ctx, scopeSlice[r.SubType], r.Value)
			//scopeSlice[r.SubType] = scopeSlice[r.SubType] | r.Value
			scopeMap[r.SubType] = scopeMap[r.SubType] | r.Value //按位与运算
		}
	}
	var scopeTransfer access_control.ScopeTransfer
	for k, v := range scopeMap {
		scopeTransfer.SetValue(access_control.Scope(k), v)
	}
	//数据资产全景 特殊处理
	usingType, err := u.configurationCase.GetDataUsingType(ctx)
	if err != nil {
		return nil, nil, err
	}
	if usingType.Using == constant.DataDirectoryMode {
		var count int
		for _, roleId := range roleIds {
			if _, exists := roleMap[roleId]; exists {
				count++
			}
		}
		// TODO 更新go-common后此处报错，还有什么用吗
		//if len(roleIds) == count { //用户所有角色都为不能看到资产全景的角色
		//	scopeTransfer.DataAssetOverviewScope = 0
		//}
	}

	return &scopeTransfer, roleIds, nil
}

var roleMap = map[string]struct{}{access_control.TCNormal: {}, access_control.TCDataOwner: {}, access_control.TCDataButler: {}, access_control.TCSystemMgm: {}}

func (u *User) AccessControlNoReflect(ctx context.Context) (*ScopeTransfer, error) {
	userInfo := ctx.Value(interception.InfoName).(*model.User)
	roleIds, err := u.GetUserRoleFilterByProvider(ctx, userInfo.ID)
	if err != nil {
		return nil, err
	}
	scopes, err := u.resourceRepo.GetScope(ctx, roleIds)
	if err != nil {
		log.WithContext(ctx).Error("Get AccessControl GetScope DataBaseError", zap.Error(err))
		return nil, errorcode.Desc(errorcode.UserDataBaseError)
	}
	scopeMap := make(map[int32]int32, 0)
	for _, r := range scopes {
		if r.SubType == 0 {
			scopeMap[r.Type] = scopeMap[r.Type] | r.Value //按位与运算
		} else {
			scopeMap[r.SubType] = scopeMap[r.SubType] | r.Value //按位与运算
		}
	}
	//scopeNameMap := make(map[string]int32, 0)
	//for scope, value := range scopeMap {
	//	scopeNameMap[access_control.Scope(scope).String()] = value
	//}
	var st ScopeTransfer
	marshal, err := jsoniter.Marshal(scopeMap)
	if err != nil {
		fmt.Println(err)
	}
	err = jsoniter.Unmarshal(marshal, &st)
	if err != nil {
		fmt.Println(err)
	}

	return &st, nil
}

type ScopeTransfer struct {
	BusinessDomainScope           int32 //业务域
	BusinessStructureScope        int32 //业务架构
	BusinessModelScope            int32 //主干业务
	BusinessFormScope             int32 //业务表
	BusinessFlowchartScope        int32 //业务流程图
	BusinessIndicatorScope        int32 //指标
	ProjectScope                  int32 //项目列表
	PipelineKanbanScope           int32 //流水线看板
	TaskKanbanScope               int32 //任务看板
	TaskScope                     int32 //任务列表
	PipelineScope                 int32 //流水线
	RoleScope                     int32 //角色
	BusinessStandardScope         int32 //业务标准
	BusinessKnowledgeNetworkScope int32 //业务知识网络
	DataAcquisitionScope          int32 //数据采集
	DataConnectScope              int32 //数据连接
	MetadataScope                 int32 //元数据管理
	DataSecurityScope             int32 //数据安全
	DataQualityScope              int32 //数据质量
	DataProcessingScope           int32 //数据加工
	DataUnderstandScope           int32 //数据理解
	TaskBusinessModel             int32 //任务下主干业务
	TaskBusinessForm              int32 //任务下业务表
	TaskBusinessFlowchart         int32 //任务下业务流程图
	TaskBusinessIndicator         int32 //任务下指标
	NewStandardScope              int32 //新建标准
	TaskNewStandardScope          int32 //任务下新建标准
}

func (u *User) BitAdd(original, cumulative int32) int32 {
	res := original
	if access_control.GET_ACCESS.Exist(cumulative) {
		res = access_control.GET_ACCESS.Add(res)
	}
	if access_control.POST_ACCESS.Exist(cumulative) {
		res = access_control.POST_ACCESS.Add(res)
	}
	if access_control.PUT_ACCESS.Exist(cumulative) {
		res = access_control.PUT_ACCESS.Add(res)
	}
	if access_control.DELETE_ACCESS.Exist(cumulative) {
		res = access_control.DELETE_ACCESS.Add(res)
	}
	return res
}
func (u *User) AddAccessControl(ctx context.Context) error {
	u.UserApply()
	err := u.resourceRepo.InsertResource(ctx, []*model.Resource{{
		RoleID:  "",
		Type:    0,
		SubType: 0,
		Value:   0,
	}})
	if err != nil {
		log.WithContext(ctx).Error("AddAccessControl DataBaseError", zap.Error(err))
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}

// tokenTypeFromContext 从 context 获取 token type
//
// TODO: 使用 interception 或 GoCommon 中的函数替代这个
func tokenTypeFromContext(ctx context.Context) (int, error) {
	v := ctx.Value(interception.TokenTypeClient)
	if v == nil {
		return 0, errors.New("token type not found")
	}

	tokenType, ok := v.(int)
	if !ok {
		return 0, errors.New("unexpected type")
	}

	return tokenType, nil
}

func (u *User) HasAccessPermission(ctx context.Context, uid string, accessType access_control.AccessType, resource access_control.Resource) (bool, error) {
	u.UserApply()
	// 判断 token type，如果是 clientID 生成的 token 则认为有权限
	if t, err := tokenTypeFromContext(ctx); err == nil && t == interception.TokenTypeClient {
		return true, nil
	}

	log.Info("HasAccessPermission", zap.String("uid", uid), zap.String("token uid", ctx.Value(interception.InfoName).(*model.User).ID))
	if uid == "" && ctx.Value(interception.TokenType).(int) == interception.TokenTypeClient {
		return false, errorcode.Desc(errorcode.AccessControlClientTokenMustHasUserId)
	}
	if uid == "" {
		if m, exist := ctx.Value(interception.InfoName).(*model.User); exist {
			uid = m.ID
		}
	}
	// TODO 数据权限改好后，这块要替换
	return true, nil

	// 非内置角色则有权限，用户没授权角色也认为也有权限（数据权限改好后，这块要替换）
	//userAssociated, err := u.role2Repo.IsUserAssociated(ctx, uid)
	//if err != nil {
	//	return false, err
	//}
	//if userAssociated == true {
	//	return true, nil
	//}

	// 内置角色继续保留原有逻辑
	roleIds, err := u.GetUserRoleFilterByProvider(ctx, uid)
	if err != nil {
		return false, err
	}
	if len(roleIds) == 0 {
		log.WithContext(ctx).Errorf("user %s has no role to access %v !", uid, resource)
		return false, nil
	}
	var getResource []*model.Resource
	//if resource.IsSubResource() {
	//	getResource, err = u.resourceRepo.GetResourceByType(ctx, rids, 0, resource.ToInt32())
	//} else {
	//	getResource, err = u.resourceRepo.GetResourceByType(ctx, rids, resource.ToInt32(), 0)
	//}
	getResource, err = u.resourceRepo.GetResourceByType(ctx, roleIds, resource.ToInt32(), 0)

	if err != nil {
		log.WithContext(ctx).Error("HasAccessPermission DataBaseError", zap.Error(err))
		return false, errorcode.Desc(errorcode.PublicDatabaseError)
	}

	for _, r := range getResource {
		if exist := accessType.Exist(r.Value); exist {
			return true, nil
		}
	}
	return false, nil
}
func (u *User) HasManageAccessPermission(ctx context.Context) (bool, error) {
	u.UserApply()
	userInfo := ctx.Value(interception.InfoName).(*model.User)
	roleIds, err := u.GetUserRoleFilterByProvider(ctx, userInfo.ID)
	if err != nil {
		return false, err
	}
	if len(roleIds) == 0 {
		log.WithContext(ctx).Errorf("user %s has no role", userInfo.Name)
		return false, nil
	}
	var getResource []*model.Resource

	getResource, err = u.resourceRepo.GetScope(ctx, roleIds)
	if err != nil {
		log.WithContext(ctx).Error("HasManageAccessPermission DataBaseError", zap.Error(err))
		return false, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	for _, r := range getResource {
		if _, exist := access_control.ManageScopeSet[access_control.Scope(r.Type)]; exist {
			return true, nil
		}
	}
	return false, nil
}

// GetUserDepart 获取用户所有部门
func (u *User) GetUserDepart(ctx context.Context) ([]*user.Depart, error) {
	u.UserApply()
	userInfo := ctx.Value(interception.InfoName).(*model.User)

	departmentIds, err := u.userMgm.GetDepIDsByUserID(ctx, userInfo.ID)
	if err != nil {
		log.WithContext(ctx).Error("GetUserDepart DrivenUserManagementError GetDepIDsByUserID", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}
	info, err := u.userMgm.GetDepartmentInfo(ctx, departmentIds, "name")
	if err != nil {
		log.WithContext(ctx).Error("GetUserDepart DrivenUserManagementError GetDepartmentInfo", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}
	res := make([]*user.Depart, 0)

	if err = copier.Copy(&res, info); err != nil {
		log.WithContext(ctx).Error("GetUserDepart copier Copy", zap.Error(err))
		return nil, err
	}
	return res, nil
}

// GetUserDirectDepart 获取用户直属部门
func (u *User) GetUserDirectDepart(ctx context.Context) ([]*user.Depart, error) {
	u.UserApply()
	userInfo := ctx.Value(interception.InfoName).(*model.User)
	return u.getUserDirectDepart(ctx, userInfo.ID)
}
func (u *User) GetUserIdDirectDepart(ctx context.Context, uid string) ([]*user.Depart, error) {
	u.UserApply()
	return u.getUserDirectDepart(ctx, uid)
}

// GetUserDirectDepart 获取用户直属部门
func (u *User) getUserDirectDepart(ctx context.Context, uid string) ([]*user.Depart, error) {
	departments, err := u.userMgm.GetUserParentDepartments(ctx, uid)
	if err != nil {
		log.WithContext(ctx).Error("GetUserDirectDepart DrivenUserManagementError GetUserParentDepartments", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}

	res := make([]*user.Depart, 0)
	for _, department := range departments {
		var pa, pathId string
		for i := 0; i < len(department)-1; i++ {
			pa = pa + department[i].Name + "/"
			pathId = pathId + department[i].ID + "/"
		}
		res = append(res, &user.Depart{
			ID:     department[len(department)-1].ID,
			Name:   department[len(department)-1].Name,
			Path:   pa,
			PathID: pathId,
		})
	}
	return res, nil
}

// GetUserByDepartAndRole 获取用户列表 ，部门 角色筛选
func (u *User) GetUserByDepartAndRole(ctx context.Context, req *user.GetUserByDepartAndRoleReq) ([]*user.User, error) {
	u.UserApply()
	departUserMap := make(map[string]string)
	departUsers, err := u.userMgm.GetDepAllUserInfos(ctx, req.DepartId)
	if err != nil {
		if strings.Contains(err.Error(), "404019001") {
			return nil, errorcode.Detail(errorcode.DrivenUserManagementDepartIdNotExist, err.Error())
		}
		log.WithContext(ctx).Error("GetUserByDepartAndRole DrivenUserManagementError GetDepAllUserInfos", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}
	for _, departUser := range departUsers {
		departUserMap[departUser.ID] = departUser.VisionName
	}
	roleUsers, err := u.roleRepo.GetRolesUsers(ctx, req.RoleId)
	if err != nil {
		log.WithContext(ctx).Error("GetUserByDepartAndRole GetRolesUsers DataBaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}

	resUser := make([]*user.User, 0)
	for _, roleUser := range roleUsers {
		if name, exist := departUserMap[roleUser.UserID]; exist && (req.UserId == "" || req.UserId == roleUser.UserID) {
			resUser = append(resUser, &user.User{
				ID:   roleUser.UserID,
				Name: name,
			})
		}
	}
	return resUser, nil
}

// GetUserByDirectDepartAndRole 获取用户列表 ，直属部门 角色筛选
func (u *User) GetUserByDirectDepartAndRole(ctx context.Context, req *user.GetUserByDepartAndRoleReq) ([]*user.User, error) {
	u.UserApply()
	departUserIds, err := u.userMgm.GetDirectDepAllUserInfos(ctx, req.DepartId)
	if err != nil {
		if strings.Contains(err.Error(), "404019001") || strings.Contains(err.Error(), "数据不存在") || strings.Contains(err.Error(), "record") {
			return nil, errorcode.Detail(errorcode.DrivenUserManagementDepartIdNotExist, err.Error())
		}
		log.WithContext(ctx).Error("GetUserByDepartAndRole DrivenUserManagementError GetDepAllUserInfos", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}
	departUserInfoMap, err := u.userMgm.BatchGetUserInfoByID(ctx, departUserIds)
	if err != nil {
		log.WithContext(ctx).Error("GetUserByDepartAndRole DrivenUserManagementError GetDepAllUserInfos", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}
	roleUsers, err := u.authorizationDriven.ListRoleTotalMembers(ctx, req.RoleId)
	if err != nil {
		log.WithContext(ctx).Error("authorizationDriven ListRoleTotalMembers error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}

	resUser := make([]*user.User, 0)
	for _, roleUser := range roleUsers {
		if departUserInfo, exist := departUserInfoMap[roleUser.ID]; exist && (req.UserId == "" || req.UserId == roleUser.ID) {
			resUser = append(resUser, &user.User{
				ID:   roleUser.ID,
				Name: departUserInfo.VisionName,
			})
		}
	}
	return resUser, nil
}
func (u *User) GetDepartUsers(ctx context.Context, req *user.GetDepartUsersReq) ([]*user.GetDepartUsersRespItem, error) {
	u.UserApply()
	isDepartInNeed := false
	if len(req.IsDepartInNeed) > 0 {
		isDepartInNeed, _ = strconv.ParseBool(req.IsDepartInNeed)
	}

	departUserIds, err := u.userMgm.GetDirectDepAllUserInfos(ctx, req.DepartId)
	if err != nil {
		if strings.Contains(err.Error(), "404019001") || strings.Contains(err.Error(), "数据不存在") || strings.Contains(err.Error(), "record") {
			return nil, errorcode.Detail(errorcode.DrivenUserManagementDepartIdNotExist, err.Error())
		}
		log.WithContext(ctx).Error("GetUserByDepartAndRole DrivenUserManagementError GetDepAllUserInfos", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}
	users, err := u.userRepo.GetByUserIds(ctx, util.DuplicateStringRemoval(departUserIds))
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}

	uids := make([]string, 0, len(users))
	resp := make([]*user.GetDepartUsersRespItem, 0, len(users))
	for i := range users {
		usersRoleName, err := u.userRepo.GetUsersRoleName(ctx, users[i].ID)
		if err != nil {
			return nil, err
		}
		u := &user.GetDepartUsersRespItem{
			User:       *users[i],
			ParentDeps: make([][]user.DepartV1, 0),
			Roles:      usersRoleName,
		}
		resp = append(resp, u)
		uids = append(uids, users[i].ID)
	}

	if isDepartInNeed && len(uids) > 0 {
		userDeps, err := u.userMgm.BatchGetUserParentDepartments(ctx, uids)
		if err != nil {
			log.WithContext(ctx).Error("GetUserDepart DrivenUserManagementError GetUserParentDepartments", zap.Error(err))
			return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
		}

		var (
			uds       [][]user_management.Department
			isExisted bool
		)
		for i := range resp {
			if uds, isExisted = userDeps[resp[i].ID]; isExisted {
				resp[i].ParentDeps = make([][]user.DepartV1, len(uds))
				for j := range uds {
					resp[i].ParentDeps[j] = make([]user.DepartV1, len(uds[j]))
					for k := range uds[j] {
						resp[i].ParentDeps[j][k].ID = uds[j][k].ID
						resp[i].ParentDeps[j][k].Name = uds[j][k].Name
					}
				}
			}
		}
	}

	return resp, nil
}

func (u *User) GetDepartAndUsersPage(ctx context.Context, req *user.DepartAndUserReq) ([]*user.DepartAndUserResp, error) {
	u.UserApply()
	//res, err := u.userRepo.GetDepartAndUsersPage(ctx, req)
	res, err := u.userRepo.GetUsersPageTemp(ctx, req) //临时只查用户，后续需求换为上面注释函数，该函数可删除
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	resp := make([]*user.DepartAndUserResp, 0, len(res))
	for _, re := range res {
		if re.Type == "user" {
			dar := &user.DepartAndUserResp{
				DepartAndUserRes: *re,
			}
			//if re.ID == built_in.NCT_USER_ADMIN || re.ID == built_in.NCT_USER_AUDIT || re.ID == built_in.NCT_USER_SYSTEM || re.ID == built_in.NCT_USER_SECURIT {
			//	continue
			//}
			parentDeps, err := u.userMgm.GetUserParentDepartments(ctx, re.ID)
			if err != nil {
				log.WithContext(ctx).Error("GetUserDepart DrivenUserManagementError GetUserParentDepartments", zap.Error(err))
				return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
			}

			dar.ParentDeps = make([][]user.DepartV1, len(parentDeps))
			for i := range parentDeps {
				dar.ParentDeps[i] = make([]user.DepartV1, len(parentDeps[i]))
				for j := range parentDeps[i] {
					dar.ParentDeps[i][j].ID = parentDeps[i][j].ID
					dar.ParentDeps[i][j].Name = parentDeps[i][j].Name
				}
			}
			usersRoleName, err := u.userRepo.GetUsersRoleName(ctx, re.ID)
			if err != nil {
				return nil, err
			}
			dar.Roles = usersRoleName
			resp = append(resp, dar)
			// departmentIds, err := u.userMgm.GetDepIDsByUserID(ctx, re.ID)
			// if err != nil {
			// 	log.WithContext(ctx).Error("GetUserDepart DrivenUserManagementError GetDepIDsByUserID", zap.Error(err))
			// 	return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
			// }
			// userDepartInfos, err := u.userMgm.GetDepartmentInfo(ctx, departmentIds, "name")
			// if err != nil {
			// 	log.WithContext(ctx).Error("GetUserDepart DrivenUserManagementError GetDepartmentInfo", zap.Error(err))
			// 	return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
			// }
			// for _, userDepartInfo := range userDepartInfos {
			// 	re.Path = re.Path + userDepartInfo.Name + "、"
			// }
			// if len(userDepartInfos) > 0 {
			// 	re.Path = strings.TrimSuffix(re.Path, "、")
			// } else {
			// 	re.Path = "未分配"
			// }
		}
	}
	return resp, nil
}
func (u *User) DeleteUserNSQ(ctx context.Context, userId string) {
	u.UserApply()
	err := u.userRepo.Update(ctx, &model.User{
		ID:        userId,
		Status:    int32(configuration_center.UserDelete),
		UpdatedAt: time.Now(),
	})
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ Insert Error", zap.Error(err))
	}
	return
}
func (u *User) DeleteUser(ctx context.Context, userId string) error {
	u.UserApply()
	err := u.userRepo.Update(ctx, &model.User{
		ID:        userId,
		Status:    int32(configuration_center.UserDelete),
		UpdatedAt: time.Now(),
	})
	if err != nil {
		log.WithContext(ctx).Error("CreateUserNSQ Insert Error", zap.Error(err))
		return err
	}
	return nil
}

// GetUser 获取指定用户
func (u *User) GetUser(ctx context.Context, userID string, opts user.GetUserOptions) (*user.User, error) {
	u.UserApply()
	users, err := u.GetUsers(ctx, []string{userID}, opts)
	if err != nil {
		return nil, err
	}

	for _, u := range users {
		if u.ID == userID {
			return &u, nil
		}
	}

	// TODO: 返回结构化错误
	return nil, errors.New("not found")
}

// GetUser 获取指定用户部门
func (u *User) GetUserDeparts(ctx context.Context, userID string, opts user.GetUserOptions) ([]*user.Department, error) {
	u.UserApply()
	users, err := u.GetUsers(ctx, []string{userID}, opts)
	if err != nil {
		return nil, err
	}

	for _, u := range users {
		if u.ID == userID {
			return auditDepartmentsFromUserParentDept(u.ParentDeps), nil
		}
	}
	return nil, errors.New("not found")
}

func auditDepartmentsFromUserParentDept(userParentDeps []user.DepartmentPath) (auditDepartments []*user.Department) {
	for _, userParentDep := range userParentDeps {
		var ids, names []string
		for _, d := range userParentDep {
			ids, names = append(ids, d.ID), append(names, d.Name)
		}

		auditDepartment := &user.Department{
			ID:   path.Join(ids...),
			Name: path.Join(names...),
		}

		auditDepartments = append(auditDepartments, auditDepartment)
	}
	return
}

// GetUsers 获取指定的多个用户
func (u *User) GetUsers(ctx context.Context, userIDs []string, opts user.GetUserOptions) ([]user.User, error) {
	infos, err := u.userMgm.GetUserInfos(ctx, userIDs, userManagementUserInfoFieldsFromUserFields(opts.Fields))
	if err != nil {
		return nil, err
	}

	var users []user.User
	for _, u := range infos {
		users = append(users, userFromUserManagementUserInfo(&u))
	}
	return users, nil
}

// userManagementUserInfoFieldsFromUserFields converts []user.UserField to []user_manager.UserInfoField
func userManagementUserInfoFieldsFromUserFields(fields []user.UserField) (result []user_management.UserInfoField) {
	for _, f := range fields {
		result = append(result, user_management.UserInfoField(f))
	}
	return
}

func userFromUserManagementUserInfo(u *user_management.UserInfoV2) user.User {
	return user.User{
		ID:         u.ID,
		Name:       u.Name,
		ParentDeps: departmentPathsFromUserManagementDepartmentPaths(u.ParentDeps),
	}
}

// departmentPathsFromUserManagementDepartmentPaths converts []user_management.DepartmentPath to []user.Department
func departmentPathsFromUserManagementDepartmentPaths(paths []user_management.DepartmentPath) (result []user.DepartmentPath) {
	for _, p := range paths {
		result = append(result, departmentPathFromUserManagementDepartmentPath(p))
	}
	return result
}

// departmentPathFromUserManagementDepartmentPath converts user_management.DepartmentPath to []user.Department
func departmentPathFromUserManagementDepartmentPath(path user_management.DepartmentPath) (result user.DepartmentPath) {
	for _, d := range path {
		result = append(result, departmentFromUserManagementDepartment(&d))
	}
	return result
}

// departmentFromUserManagementDepartment converts user_management.Department to user.Department
func departmentFromUserManagementDepartment(department *user_management.Department) user.Department {
	return user.Department{ID: department.ID, Name: department.Name}
}
func (u *User) GetUserByIds(ctx context.Context, ids string) ([]*model.User, error) {
	u.UserApply()
	userIds := strings.Split(ids, ",")
	res, err := u.userRepo.GetByUserIds(ctx, userIds)
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return res, nil
}

func (u *User) QueryUserByIds(ctx context.Context, ids []string) ([]*model.User, error) {
	res, err := u.userRepo.GetByUserIds(ctx, ids)
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return res, nil
}

func (u *User) CheckUserExist(ctx context.Context, userId string) error {
	u.UserApply()
	if userId == "" {
		log.WithContext(ctx).Error("userId is empty str ")
		return nil
	}
	_, err := u.userRepo.GetByUserIdSimple(ctx, userId)
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return errorcode.Detail(errorcode.UIdNotExistError, err.Error())
		}
		return errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	return nil
}

func (u *User) GetUserDetail(ctx context.Context, userId string) (*user.UserRespItem, error) {
	u.UserApply()
	userModel, err := u.userRepo.GetByUserId(ctx, userId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}
	if userModel.Status != 1 {
		return nil, errorcode.Desc(errorcode.UserIdNotExistError)
	}

	usersRoles, err := u.authorizationDriven.ListUserRoles(ctx, userModel.ID)
	if err != nil {
		return nil, err
	}
	resp := &user.UserRespItem{
		UserInfo: user.UserInfo{
			ID:          userModel.ID,
			Name:        userModel.Name,
			Status:      userModel.Status,
			UserType:    userModel.UserType,
			PhoneNumber: userModel.PhoneNumber,
			MailAddress: userModel.MailAddress,
			LoginName:   userModel.LoginName,
			UpdatedAt:   userModel.UpdatedAt.UnixMilli(),
			ThirdUserId: userModel.ThirdUserId,
		},
		ParentDeps: make([][]user.DepartV1, 0),
		Roles: lo.Map(usersRoles, func(item *authorization.RoleMetaInfo, index int) *user.Role {
			return &user.Role{
				ID:   item.ID,
				Name: item.Name,
			}
		}),
	}

	userDeps, err := u.userMgm.BatchGetUserParentDepartments(ctx, []string{userModel.ID})
	if err != nil {
		log.WithContext(ctx).Error("GetUserDetail DrivenUserManagementError BatchGetUserParentDepartments", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}
	//查询下三方部门ID
	userDeptSlice := userDeps[resp.ID]
	objectIDSlice := lo.FlatMap(userDeptSlice, func(items []user_management.Department, index int) []string {
		return lo.Times(len(items), func(j int) string {
			return items[j].ID
		})
	})
	objectSlice, err := u.businessStructureRepo.GetObjectsByIDs(ctx, lo.Uniq(objectIDSlice))
	if err != nil {
		log.WithContext(ctx).Error("GetUserDetail DrivenUserManagementError GetObjectsByIDs", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	objectDict := lo.SliceToMap(objectSlice, func(item *model.Object) (string, *model.Object) {
		return item.ID, item
	})

	var (
		uds       [][]user_management.Department
		isExisted bool
	)
	if uds, isExisted = userDeps[resp.ID]; isExisted {
		resp.ParentDeps = make([][]user.DepartV1, len(uds))
		for j := range uds {
			resp.ParentDeps[j] = make([]user.DepartV1, len(uds[j]))
			for k := range uds[j] {
				resp.ParentDeps[j][k].ID = uds[j][k].ID
				resp.ParentDeps[j][k].Name = uds[j][k].Name
				resp.ParentDeps[j][k].ThirdDeptId = objectDict[uds[j][k].ID].ThirdDeptId
			}
		}
	}

	return resp, nil
}

func (u *User) GetUserList(ctx context.Context, req *user.GetUserListReq) (*user.ListResp, error) {
	u.UserApply()
	isDepartInNeed := false
	if len(req.IsDepartInNeed) > 0 {
		isDepartInNeed, _ = strconv.ParseBool(req.IsDepartInNeed)
	}

	departUserIds := make([]string, 0)
	if req.DepartId != "" {
		userIds := make([]string, 0)
		var err error
		if req.DepartId == constant.UnallocatedId {
			userIds = u.sharemanagement.GetUserInfoDepartment(ctx, "-1")
		} else {
			userIds, err = u.userMgm.GetDirectDepAllUserInfos(ctx, req.DepartId)
			if err != nil {
				if strings.Contains(err.Error(), "404019001") || strings.Contains(err.Error(), "数据不存在") || strings.Contains(err.Error(), "record") {
					return nil, errorcode.Detail(errorcode.DrivenUserManagementDepartIdNotExist, err.Error())
				}
				log.WithContext(ctx).Error("GetUserList DrivenUserManagementError GetDirectDepAllUserInfos", zap.Error(err))
				return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
			}
		}
		departUserIds = util.DuplicateStringRemoval(userIds)
	}
	excludeUserIds := []string{built_in.NCT_USER_ADMIN, built_in.NCT_USER_AUDIT, built_in.NCT_USER_SYSTEM, built_in.NCT_USER_SECURIT}
	totalCount, users, err := u.userRepo.GetUserList(ctx, req, departUserIds, excludeUserIds)
	if err != nil {
		return nil, errorcode.Detail(errorcode.UserDataBaseError, err.Error())
	}

	uids := make([]string, 0, len(users))
	resp := make([]*user.UserRespItem, 0, len(users))
	for i := range users {
		userRoles, err := u.authorizationDriven.ListUserRoles(ctx, users[i].ID)
		if err != nil {
			return nil, err
		}
		u := &user.UserRespItem{
			UserInfo: user.UserInfo{
				ID:          users[i].ID,
				Name:        users[i].Name,
				Status:      users[i].Status,
				UserType:    users[i].UserType,
				PhoneNumber: users[i].PhoneNumber,
				MailAddress: users[i].MailAddress,
				LoginName:   users[i].LoginName,
				UpdatedAt:   users[i].UpdatedAt.UnixMilli(),
				ThirdUserId: users[i].ThirdUserId,
			},
			ParentDeps: make([][]user.DepartV1, 0),
			Roles: lo.Map(userRoles, func(item *authorization.RoleMetaInfo, index int) *user.Role {
				return &user.Role{
					ID:   item.ID,
					Name: item.Name,
				}
			}),
		}
		resp = append(resp, u)
		uids = append(uids, users[i].ID)
	}

	if isDepartInNeed && len(uids) > 0 {
		userDeps, err := u.userMgm.BatchGetUserParentDepartments(ctx, uids)
		if err != nil {
			log.WithContext(ctx).Error("GetUserList DrivenUserManagementError BatchGetUserParentDepartments", zap.Error(err))
			return nil, errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
		}

		var (
			uds       [][]user_management.Department
			isExisted bool
		)
		for i := range resp {
			if uds, isExisted = userDeps[resp[i].ID]; isExisted {
				resp[i].ParentDeps = make([][]user.DepartV1, len(uds))
				for j := range uds {
					resp[i].ParentDeps[j] = make([]user.DepartV1, len(uds[j]))
					for k := range uds[j] {
						resp[i].ParentDeps[j][k].ID = uds[j][k].ID
						resp[i].ParentDeps[j][k].Name = uds[j][k].Name
					}
				}
			}
		}
	}

	return &user.ListResp{Entries: resp, TotalCount: totalCount}, nil
}

var once = sync.Once{}

func (u *User) UserApply() {
	once.Do(func() {
		go u.RetryUserApply()
	})
}

// RetryUserApply 更新用户消息
func (u *User) RetryUserApply() {

	//已同步的用户
	dbUsers, err := u.userRepo.GetAll(context.Background())
	if err != nil {
		log.Error("UserApply userRepo.GetAll Error", zap.Error(err))
		return
	}
	dbUserMap := make(map[string]*model.User, len(dbUsers))
	for _, dbUser := range dbUsers {
		dbUserMap[dbUser.ID] = dbUser
	}

	//proton用户
	userInfos, err := u.sharemanagement.GetAllUser(context.Background())
	if err != nil {
		log.Error("UserApply sharemgnt.GetAllUser Error", zap.Error(err))
		return
	}
	userInfoMap := make(map[string]*model.User)
	t := time.Now()
	tempType, err := strconv.ParseInt(string(constant.RealName), 10, 32)
	if err != nil {
		log.WithContext(context.Background()).Error("UserApply strconv.ParseInt Error", zap.Error(err))
	}
	for _, userInfo := range userInfos {
		userInfoMap[userInfo.ID] = &model.User{
			ID:          userInfo.ID,
			Name:        *userInfo.User.DisplayName,
			Status:      int32(configuration_center.UserNormal),
			UserType:    int32(tempType),
			PhoneNumber: *userInfo.User.TelNumber,
			MailAddress: *userInfo.User.Email,
			LoginName:   userInfo.User.LoginName,
			UpdatedAt:   t,
		}
	}

	//新建用户
	addUsers := make([]*model.User, 0)
	for userId, userInfo := range userInfoMap {
		if _, ok := dbUserMap[userId]; !ok {
			addUsers = append(addUsers, userInfo)
		}
	}
	if len(addUsers) > 0 {
		err := u.userRepo.InsertBatch(context.Background(), addUsers)
		if err != nil {
			log.Error("UserApply userRepo.InsertBatch Error", zap.Error(err))
			return
		}
	}

	for _, dbUser := range dbUsers {
		if userInfo, ok := userInfoMap[dbUser.ID]; ok {
			//更新用户
			if userInfo.LoginName != dbUser.LoginName || userInfo.Name != dbUser.Name || userInfo.MailAddress != dbUser.MailAddress || userInfo.PhoneNumber != dbUser.PhoneNumber {
				dbUser.LoginName = userInfo.LoginName
				dbUser.Name = userInfo.Name
				dbUser.MailAddress = userInfo.MailAddress
				dbUser.PhoneNumber = userInfo.PhoneNumber
				dbUser.UpdatedAt = t
				affected, err := u.userRepo.UpdateUserName(context.Background(), dbUser, []string{"name", "phone_number", "mail_address", "login_name", "updated_at"})
				if err != nil {
					log.Error("UserApply userRepo.UpdateUserName Error", zap.Error(err))
					return
				}
				if affected == 0 {
					log.Error("UserApply userRepo.UpdateUserName affected zero")
					return
				}
			}
		} else {
			// 内置admin不允许删除
			if dbUser.ID == "266c6a42-6131-4d62-8f39-853e7093701c" {
				continue
			}
			//删除用户
			err := u.DeleteUser(context.Background(), dbUser.ID)
			if err != nil {
				log.Error("UserApply DeleteUser Error", zap.String("userID", dbUser.ID))
				return
			}
		}
	}
	log.Info("UserApply finished")
}

// UpdateScopeAndPermissions 更新指定用户的权限
func (u *User) UpdateScopeAndPermissions(ctx context.Context, id string, sap *configuration_center_v1.ScopeAndPermissions) error {
	userInfo, err := u.userRepo.GetByUserId(ctx, id)
	if err != nil {
		return err
	}
	userInfo.UpdatedAt = time.Now()
	userInfo.UpdatedBy = ctx.Value(interception.InfoName).(*model.User).ID
	userInfo.Scope = string(sap.Scope)
	userPermissions, err := u.userPermissionBindingRepo.GetByUserId(ctx, id)
	if err != nil {
		return err
	}
	adds := make([]*model.UserPermissionBinding, 0)
	deletes := make([]string, 0)
	for _, permission := range sap.Permissions {
		found := false
		for _, userPermission := range userPermissions {
			if permission.String() == userPermission.PermissionID {
				found = true
				break
			}
		}
		if !found {
			adds = append(adds, &model.UserPermissionBinding{UserID: id, PermissionID: permission.String()})
		}
	}
	for _, userPermission := range userPermissions {
		found := false
		for _, p := range sap.Permissions {
			if userPermission.PermissionID == p.String() {
				found = true
				break
			}
		}
		if !found {
			deletes = append(deletes, userPermission.ID)
		}
	}
	return u.userPermissionBindingRepo.Update(ctx, userInfo, adds, deletes)
}

// GetScopeAndPermissions 获取指定用户的权限
func (u *User) GetScopeAndPermissions(ctx context.Context, id string) (*configuration_center_v1.ScopeAndPermissions, error) {
	userInfo, err := u.userRepo.GetByUserId(ctx, id)
	if err != nil {
		return nil, err
	}
	userPermissionBindings, err := u.userPermissionBindingRepo.GetByUserId(ctx, id)
	if err != nil {
		return nil, err
	}
	permissions := make([]uuid.UUID, 0)
	for _, b := range userPermissionBindings {
		permissionId, err := uuid.Parse(b.PermissionID)
		if err != nil {
			return nil, err
		}
		permissions = append(permissions, permissionId)
	}
	return &configuration_center_v1.ScopeAndPermissions{
		Scope:       configuration_center_v1.Scope(userInfo.Scope),
		Permissions: permissions,
	}, nil
}

// UserRoleOrRoleGroupBindingBatchProcessing 更新用户角色或角色组绑定，批处理
func (u *User) UserRoleOrRoleGroupBindingBatchProcessing(ctx context.Context, p *configuration_center_v1.UserRoleOrRoleGroupBindingBatchProcessing) error {
	updatedBy := ctx.Value(interception.InfoName).(*model.User).ID
	addRoleBindings := make([]*model.UserRoleBinding, 0)
	deleteRoleBindings := make([]string, 0)
	addRoleGroupBindings := make([]*model.UserRoleGroupBinding, 0)
	deleteRoleGroupBindings := make([]string, 0)
	userIdMap := make(map[string]int)
	userIds := make([]string, 0)
	var err error
	for _, b := range p.Bindings {
		var userRoleBinding *model.UserRoleBinding
		if b.RoleID != "" {
			userRoleBinding, err = u.userRoleBindingRepo.Get(ctx, b.UserID, b.RoleID)
			if err != nil {
				return err
			}
		}
		var userRoleGroupBinding *model.UserRoleGroupBinding
		if b.RoleGroupID != "" {
			userRoleGroupBinding, err = u.userRoleGroupBindingRepo.Get(ctx, b.UserID, b.RoleGroupID)
			if err != nil {
				return err
			}
		}
		switch b.State {
		case meta_v1.ProcessingStatePresent:
			if b.RoleID != "" && userRoleBinding == nil {
				addRoleBindings = append(addRoleBindings, &model.UserRoleBinding{
					UserID: b.UserID,
					RoleID: b.RoleID,
				})
			} else if b.RoleGroupID != "" && userRoleGroupBinding == nil {
				addRoleGroupBindings = append(addRoleGroupBindings, &model.UserRoleGroupBinding{
					UserID:      b.UserID,
					RoleGroupID: b.RoleGroupID,
				})
			}
		case meta_v1.ProcessingStateAbsent:
			if b.RoleID != "" && userRoleBinding != nil {
				deleteRoleBindings = append(deleteRoleBindings, userRoleBinding.ID)
			} else if b.RoleGroupID != "" && userRoleGroupBinding != nil {
				deleteRoleGroupBindings = append(deleteRoleGroupBindings, userRoleGroupBinding.ID)
			}
		}
		if _, exist := userIdMap[b.UserID]; !exist {
			userIdMap[b.UserID] = 1
		}
	}
	for id, _ := range userIdMap {
		userIds = append(userIds, id)
	}
	// 兼容处理：更新表 user_role，记录用户和内置角色的关系
	{
		var present, absent []model.UserRole
		for _, b := range p.Bindings {
			// 跳过非用户、角色绑定
			if b.RoleID == "" {
				continue
			}

			// 跳过非内置角色
			r, err := u.roleRepo.Get(ctx, b.RoleID)
			if err != nil {
				return err
			}
			if r.Type != string(configuration_center_v1.RoleTypeInternal) {
				continue
			}

			switch b.State {
			case meta_v1.ProcessingStatePresent:
				present = append(present, model.UserRole{UserID: b.UserID, RoleID: b.RoleID})
			case meta_v1.ProcessingStateAbsent:
				absent = append(present, model.UserRole{UserID: b.UserID, RoleID: b.RoleID})
			default:
				return fmt.Errorf("invalid user role or role group binding state: %v", b.State)
			}
		}
		if err := u.roleRepo.ReconcileUserRoles(ctx, present, absent); err != nil {
			return err
		}
	}

	return u.userRoleBindingRepo.Update(ctx, userIds, updatedBy, addRoleBindings, addRoleGroupBindings, deleteRoleBindings, deleteRoleGroupBindings)
}

func (u *User) getUserInfo(ctx context.Context, userInfo *model.User) (*configuration_center_v2.User, error) {
	// 获取更新人姓名
	updatedInfo := &model.User{}
	var err error
	if userInfo.UpdatedBy != "" {
		updatedInfo, err = u.userRepo.GetByUserId(ctx, userInfo.UpdatedBy)
		if err != nil {
			return nil, err
		}
	}

	// 获取用户部门信息
	departments, err := u.ccDriven.GetDepartmentsByUserID(ctx, userInfo.ID)
	if err != nil {
		log.WithContext(ctx).Errorf("ccDriven GetDepartmentsByUserID failed: %v", err)
		return nil, err
	}
	departmentInfos := make([]configuration_center_v1_frontend.DepartmentInfo, 0)
	if len(departments) > 0 {
		for _, department := range departments {
			departmentInfos = append(departmentInfos, configuration_center_v1_frontend.DepartmentInfo{
				PathID: department.PathID + department.ID,
				Path:   department.Path + department.Name,
			})
		}
	}
	// 获取用户角色信息
	roleInfos, err := u.authorizationDriven.ListUserRoles(ctx, userInfo.ID)
	if err != nil {
		return nil, err
	}
	return &configuration_center_v2.User{
		MetadataWithOperator: *convertModelToV1_MetadataWithOperator(userInfo, updatedInfo.Name),
		UserSpec:             *convertModelToV1_UserSpec(userInfo),
		ParentDeps:           departmentInfos,
		Roles: lo.Times(len(roleInfos), func(index int) configuration_center_v2.Role {
			return configuration_center_v2.Role{
				ID:          roleInfos[index].ID,
				Name:        roleInfos[index].Name,
				Description: roleInfos[index].Description,
			}
		}),
	}, nil
}

// FrontGet 获取指定用户及其相关数据
func (u *User) FrontGet(ctx context.Context, id string) (*configuration_center_v2.User, error) {
	userInfo, err := u.userRepo.GetByUserId(ctx, id)
	if err != nil {
		return nil, err
	}
	return u.getUserInfo(ctx, userInfo)
}

// FrontList 获取用户列表及其相关数据
func (u *User) FrontList(ctx context.Context, opts *configuration_center_v1.UserListOptions) (*configuration_center_v2.UserList, error) {
	// 保持原有逻辑，不包含子部门查询
	return u.FrontListWithSubDepartments(ctx, opts, false)
}

// FrontListWithSubDepartments 获取用户列表及其相关数据，支持子部门查询
func (u *User) FrontListWithSubDepartments(ctx context.Context, opts *configuration_center_v1.UserListOptions, includeSubDepartments bool) (*configuration_center_v2.UserList, error) {
	entries := make([]configuration_center_v2.User, 0)
	got := &url.Values{}
	err := configuration_center_v1.Convert_V1_UserListOptions_To_url_Values(opts, got)
	if err != nil {
		return nil, err
	}
	userIds := make([]string, 0)
	if opts.DepartmentID != "" {
		if includeSubDepartments {
			// 获取当前部门及所有子部门的用户
			userIds = u.getUsersFromDepartmentAndSubDepartments(ctx, opts.DepartmentID)
		} else {
			// 只获取当前部门的用户（原有逻辑）
			userIds = u.sharemanagement.GetUserInfoDepartment(ctx, opts.DepartmentID)
		}

		if len(userIds) == 0 {
			return &configuration_center_v2.UserList{
				Entries:    entries,
				TotalCount: 0,
			}, nil
		}
	}
	userInfos, count, err := u.userRepo.QueryList(ctx, *got, userIds, opts.Registered)
	if err != nil {
		return nil, err
	}
	for _, userInfo := range userInfos {
		frontUser, err := u.getUserInfo(ctx, userInfo)
		if err != nil {
			return nil, err
		}
		entries = append(entries, *frontUser)
	}
	return &configuration_center_v2.UserList{
		Entries:    entries,
		TotalCount: int(count),
	}, nil
}

// getUsersFromDepartmentAndSubDepartments 获取部门及子部门的所有用户
func (u *User) getUsersFromDepartmentAndSubDepartments(ctx context.Context, departmentId string) []string {
	// 1. 获取当前部门的用户
	userIds := u.sharemanagement.GetUserInfoDepartment(ctx, departmentId)

	// 2. 获取所有子部门
	subDepartmentIds := u.getSubDepartmentIds(ctx, departmentId)

	// 3. 获取子部门的用户
	for _, subDeptId := range subDepartmentIds {
		subUserIds := u.sharemanagement.GetUserInfoDepartment(ctx, subDeptId)
		userIds = append(userIds, subUserIds...)
	}

	// 4. 去重
	return util.DuplicateStringRemoval(userIds)
}

// getSubDepartmentIds 获取所有子部门ID
func (u *User) getSubDepartmentIds(ctx context.Context, departmentId string) []string {
	// 使用业务结构服务获取子部门
	objects, err := u.businessStructureRepo.GetObjByPathID(ctx, departmentId)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get sub departments: %v", err)
		return nil
	}

	var subDepartmentIds []string
	for _, obj := range objects {
		if obj.ID != departmentId { // 排除当前部门
			subDepartmentIds = append(subDepartmentIds, obj.ID)
		}
	}

	return subDepartmentIds
}

// 同步有管理审核策略权限的用戶到proton登录管理台和AS审核策略
func (u *User) SyncUserAuditToProton(ctx context.Context, userIds []string) {
	for _, userId := range userIds {
		count, _ := u.permissionRepo.GetUserManagerAuditPermissionCount(ctx, userId)
		log.WithContext(ctx).Infof("syncUserAuditToProton count : %v ,userId:%v", count, userId)
		if count > 0 {
			//设置超级管理员
			if err := u.sharemanagement.RoleSetMember(ctx, sharemgnt.NCT_USER_ADMIN, sharemgnt.NCT_SYSTEM_ROLE_SUPPER, &sharemgnt.NcTRoleMemberInfo{
				UserId:          userId,
				DisplayName:     "",
				DepartmentIds:   []string{},
				DepartmentNames: []string{},
				ManageDeptInfo: &sharemgnt.NcTManageDeptInfo{
					DepartmentIds:      []string{},
					DepartmentNames:    []string{},
					LimitUserSpaceSize: -1,
					LimitDocSpaceSize:  -1,
				},
			}); err != nil {
				log.WithContext(ctx).Error("syncUserAuditToProton AddMember error", zap.Error(err), zap.String("uid", userId))
			}
		} else {
			err := u.sharemanagement.RoleDeleteMember(ctx, sharemgnt.NCT_USER_ADMIN, sharemgnt.NCT_SYSTEM_ROLE_SUPPER, userId)
			if err != nil {
				log.WithContext(ctx).Error("syncUserAuditToProton DeleteMember error", zap.Error(err), zap.String("uid", userId))
			}
		}
	}
}

func (u *User) ListUserNames(ctx context.Context) ([]model.UserWithName, error) {
	return u.userRepo.ListUserNames(ctx)
}

func (u *User) GetUserIdByMainDeptIds(ctx context.Context, userId string) ([]string, error) {
	mainDeptId, err := u.GetUserDefaultMainDeptId(ctx, userId)
	if err != nil {
		return nil, err
	}
	returnDeptIds := make([]string, 0) // 返回部门ID
	if mainDeptId == "" {
		return []string{}, nil
	}
	returnDeptIds = append(returnDeptIds, mainDeptId)
	// 查询选中部门的所有子部门
	pathIDs, err := u.businessStructureRepo.GetObjByPathID(ctx, mainDeptId)
	if err != nil {
		return nil, err
	}
	//截取当前部门厚的部门ID并去重
	for _, object := range pathIDs {
		splitObjectIds := util.SplitAfterDelimiter(object.PathID, mainDeptId, "/")
		if splitObjectIds != nil && len(splitObjectIds) > 0 {
			for _, objectId := range splitObjectIds {
				returnDeptIds = append(returnDeptIds, objectId)
			}
		}
	}

	// 去重和空值
	return util.RemoveEmptyAndDuplicates(returnDeptIds), nil
}

func (u *User) GetFrontendUserMainDept(ctx context.Context, userId string) (*model.Object, error) {
	mainDeptId, err := u.GetUserDefaultMainDeptId(ctx, userId)
	if err != nil {
		return nil, err
	}
	return u.businessStructureRepo.GetObjByID(ctx, mainDeptId)
}

func (u *User) GetUserDefaultMainDeptId(ctx context.Context, userId string) (string, error) {
	//查询直属部门ID及父部门
	departmentList, err := u.userMgm.GetUserDeptAndParentDepartments(ctx, userId)
	if err != nil {
		log.WithContext(ctx).Error("GetUserDepart DrivenUserManagementError GetUserDeptAndParentDepartments", zap.Error(err))
		return "", errorcode.Detail(errorcode.DrivenUserManagementError, err.Error())
	}

	currDeptIds := make([]string, 0) //当前计算后的部门
	/**
	  先最后看用户是否跨部门，再判断当前部门是否有主部门，最后父部门是否都有主部门; 返回当前部门及子部门合集并去重
	*/
	//if len(departmentList) == 1 {
	firstDeptList := departmentList[0]
	magerDeptIds := make([]string, 0) //合并部门ID
	for j := 0; j < len(firstDeptList); j++ {
		dept := firstDeptList[j]
		magerDeptIds = append(magerDeptIds, dept.ID)
	}
	//查询部门是否有主部门，都没有主部门取最近部门
	mainDeptIds, err := u.objectSubtypeRepo.GetMainDeptByObjectIds(ctx, magerDeptIds)
	if err != nil {
		return "", err
	}
	//沒有主部门取直属部门
	if mainDeptIds == nil || len(mainDeptIds) == 0 {
		currDeptIds = append(currDeptIds, magerDeptIds[len(magerDeptIds)-1])
	} else {
		// 有主部门或者多级主部门取最近主部门（从下向上取）
		positions := util.FindTargetInSourceOrder(magerDeptIds, mainDeptIds)
		currDeptIds = append(currDeptIds, magerDeptIds[positions[len(positions)-1]])
	}
	//} else {
	// TODO xx环境一个用户只有一个部门，计算合并多个部门中是否有相同的部门，分叉部门中是否有主部门，如果节点有主部门

	//}
	return currDeptIds[0], nil
}
