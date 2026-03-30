package user_management

import (
	"context"
	"errors"
	"fmt"
	"strings"
	"sync"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/http_client"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/mitchellh/mapstructure"
	"go.uber.org/zap"
)

type orgNameIDInfo struct {
	UserIDs      map[string]string
	DepartIDs    map[string]string
	ContactorIDs map[string]string
	GroupIDs     map[string]string
}

type orgIDInfo struct {
	UserIDs      []string
	DepartIDs    []string
	ContactorIDs []string
	GroupIDs     []string
}

var (
	usermgntOnce sync.Once
	usermgnt     *usermgntSvc
)

type usermgntSvc struct {
	baseURL      string
	httpClient   http_client.HTTPClient
	httpClientEx http_client.HTTPClient
	//mqClient     msqclient.ProtonMSQClient
	roleTypeMap map[string]RoleType
}

// NewUserMgnt 创建UserMgnt服务处理对象
func NewUserMgnt(httpClient http_client.HTTPClient) DrivenUserMgnt {
	usermgntOnce.Do(func() {
		//var timeout time.Duration = 60
		roleTypeMap := map[string]RoleType{
			"super_admin": SuperAdmin,
			"sys_admin":   SystemAdmin,
			"audit_admin": AuditAdmin,
			"sec_admin":   SecurityAdmin,
			"org_manager": OrganizationAdmin,
			"org_audit":   OrganizationAudit,
			"normal_user": NormalUser,
		}
		usermgnt = &usermgntSvc{
			baseURL:      fmt.Sprintf("http://%s/api/user-management", settings.GetConfig().DepServicesConf.UserMgmPrivateHost),
			httpClient:   httpClient,
			httpClientEx: httpClient,
			//mqClient:     msqclient.NewProtonMSQClient(config.MQHost, config.MQPort, config.MQLookupdHost, config.MQLookupdPort, config.MQConnectorType),
			roleTypeMap: roleTypeMap,
		}
	})

	return usermgnt
}

// GetAccessorIDsByUserID 获取指定用户的访问令牌
func (u *usermgntSvc) GetAccessorIDsByUserID(ctx context.Context, userID string) (accessorIDs []string, err error) {
	target := fmt.Sprintf("%s/v1/users/%s/accessor_ids", u.baseURL, userID)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetAccessorIdsByUserID failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetAccessorIdsByUserID failed", zap.Error(err), zap.String("target", target))
		return
	}

	accessorArr := respParam.([]interface{})
	for _, v := range accessorArr {
		accessorIDs = append(accessorIDs, v.(string))
	}

	return
}

// GetUserNameByUserID 通过用户id获取用户名
func (u *usermgntSvc) GetUserNameByUserID(ctx context.Context, userID string) (name string, isNormalUser bool, err error) {
	fields := "roles,name"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, fields)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetUserNameByUserID failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetUserNameByUserID failed", zap.Error(err), zap.String("url", target))
		return "", false, err
	}
	info := respParam.([]interface{})[0]
	name = info.(map[string]interface{})["name"].(string)
	roles := info.(map[string]interface{})["roles"].([]interface{})
	for _, x := range roles {
		if x.(string) == "normal_user" {
			isNormalUser = true
			break
		}
	}
	return
}

// GetUserRolesByUserID 通过用户id获取角色
func (u *usermgntSvc) GetUserRolesByUserID(ctx context.Context, userID string) (roleTypes []RoleType, err error) {
	fields := "roles"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, fields)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetUserRolesByUserID failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetUserRolesByUserID failed", zap.Error(err), zap.String("url", target))
		return
	}
	info := respParam.([]interface{})[0]
	rolesParam := info.(map[string]interface{})["roles"].([]interface{})
	for _, val := range rolesParam {
		roleType, ok := u.roleTypeMap[val.(string)]
		if !ok {
			err = errors.New("role type conversion error")
			return
		}
		roleTypes = append(roleTypes, roleType)
	}
	return
}

// 获取部门所有用户ID
func (u *usermgntSvc) GetDepAllUsers(ctx context.Context, depID string) (userIDs []string, err error) {
	fields := "all_user_ids"
	target := fmt.Sprintf("%s/v1/departments/%s/%s", u.baseURL, depID, fields)
	respParam, err := u.httpClientEx.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetDepartmentAllUser failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetDepartmentAllUser failed", zap.Error(err), zap.String("url", target))
		return userIDs, err
	}
	result := respParam.(map[string]interface{})["all_user_ids"].([]interface{})
	for _, x := range result {
		userIDs = append(userIDs, x.(string))
	}
	return
}

func (u *usermgntSvc) GetDepAllUserInfos(ctx context.Context, depID string) (userInfos []UserInfo, err error) {
	fields := "all_users"
	target := fmt.Sprintf("%s/v1/departments/%s/%s", u.baseURL, depID, fields)
	respParam, err := u.httpClientEx.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetDepAllUserInfos failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetDepAllUserInfos failed", zap.Error(err), zap.String("url", target))
		return userInfos, err
	}
	result := respParam.([]interface{})
	userInfos = make([]UserInfo, 0, len(result))
	for i := range result {
		info := result[i].(map[string]interface{})
		userInfo := UserInfo{
			UserType:   AccessorUser,
			ID:         info["id"].(string),
			Account:    info["account"].(string),
			VisionName: info["name"].(string),
			Email:      info["email"].(string),
			Telephone:  info["telephone"].(string),
			ThirdAttr:  info["third_attr"].(string),
			ThirdID:    info["third_id"].(string),
		}
		userInfos = append(userInfos, userInfo)
	}
	return
}

func (u *usermgntSvc) GetGroupMembers(ctx context.Context, groupID string) (userIDs, depIDs []string, err error) {
	tmpInfo := map[string]interface{}{
		"method":    "GET",
		"group_ids": []string{groupID},
	}

	target := fmt.Sprintf("%v/v1/group-members", u.baseURL)
	_, respParam, err := u.httpClient.Post(ctx, target, nil, tmpInfo)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetGroupMembers failed: %v, url: %v", err, target)
		log.WithContext(ctx).Error("GetGroupMembers failed", zap.Error(err), zap.String("url", target))
		return
	}
	userInfos := respParam.(map[string]interface{})["user_ids"].([]interface{})
	for _, x := range userInfos {
		userIDs = append(userIDs, x.(string))
	}
	depInfos := respParam.(map[string]interface{})["department_ids"].([]interface{})
	for _, x := range depInfos {
		depIDs = append(depIDs, x.(string))
	}
	return
}

func (u *usermgntSvc) getOrgNameIDInfo(ctx context.Context, orgInfo *orgIDInfo) (orgNameInfo orgNameIDInfo, err error) {
	tmpInfo := map[string]interface{}{
		"method":         "GET",
		"user_ids":       orgInfo.UserIDs,
		"department_ids": orgInfo.DepartIDs,
		"contactor_ids":  orgInfo.ContactorIDs,
		"group_ids":      orgInfo.GroupIDs,
	}
	target := fmt.Sprintf("%v/v1/names", u.baseURL)
	_, respParam, err := u.httpClient.Post(ctx, target, nil, tmpInfo)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("getOrgNameIDInfo failed: %v, url: %v", err, target)
		log.WithContext(ctx).Error("getOrgNameIDInfo failed", zap.Error(err), zap.String("url", target))
		return
	}

	userNameInfos := respParam.(map[string]interface{})["user_names"].([]interface{})
	orgNameInfo.UserIDs = make(map[string]string)
	for _, x := range userNameInfos {
		id := x.(map[string]interface{})["id"].(string)
		name := x.(map[string]interface{})["name"].(string)
		orgNameInfo.UserIDs[id] = name
	}
	orgNameInfo.DepartIDs = make(map[string]string)
	departNameInfos := respParam.(map[string]interface{})["department_names"].([]interface{})
	for _, x := range departNameInfos {
		id := x.(map[string]interface{})["id"].(string)
		name := x.(map[string]interface{})["name"].(string)
		orgNameInfo.DepartIDs[id] = name
	}
	orgNameInfo.ContactorIDs = make(map[string]string)
	conatctorNameInfos := respParam.(map[string]interface{})["contactor_names"].([]interface{})
	for _, x := range conatctorNameInfos {
		id := x.(map[string]interface{})["id"].(string)
		name := x.(map[string]interface{})["name"].(string)
		orgNameInfo.ContactorIDs[id] = name
	}
	orgNameInfo.GroupIDs = make(map[string]string)
	groupNameInfos := respParam.(map[string]interface{})["group_names"].([]interface{})
	for _, x := range groupNameInfos {
		id := x.(map[string]interface{})["id"].(string)
		name := x.(map[string]interface{})["name"].(string)
		orgNameInfo.GroupIDs[id] = name
	}
	return
}

func (u *usermgntSvc) GetNameByAccessorIDs(ctx context.Context, accessorIDs map[string]AccessorType) (accessorNames map[string]string, err error) {
	var orgInfo orgIDInfo
	orgInfo.UserIDs = make([]string, 0)
	orgInfo.DepartIDs = make([]string, 0)
	orgInfo.ContactorIDs = make([]string, 0)
	orgInfo.GroupIDs = make([]string, 0)
	for accessorID, accessorType := range accessorIDs {
		if accessorType == AccessorUser {
			orgInfo.UserIDs = append(orgInfo.UserIDs, accessorID)
		} else if accessorType == AccessorDepartment {
			orgInfo.DepartIDs = append(orgInfo.DepartIDs, accessorID)
		} else if accessorType == AccessorContactor {
			orgInfo.ContactorIDs = append(orgInfo.ContactorIDs, accessorID)
		} else if accessorType == AccessorGroup {
			orgInfo.GroupIDs = append(orgInfo.GroupIDs, accessorID)
		}
	}

	orgNameInfo, err := u.getOrgNameIDInfo(ctx, &orgInfo)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetNameByAccessorID err:%v", err)
		log.WithContext(ctx).Error("GetNameByAccessorID err", zap.Error(err))
	}
	accessorNames = make(map[string]string)
	for accessorID, accessorType := range accessorIDs {
		if accessorType == AccessorUser {
			if value, ok := orgNameInfo.UserIDs[accessorID]; ok {
				accessorNames[accessorID] = value
			}
		} else if accessorType == AccessorDepartment {
			if value, ok := orgNameInfo.DepartIDs[accessorID]; ok {
				accessorNames[accessorID] = value
			}
		} else if accessorType == AccessorContactor {
			if value, ok := orgNameInfo.ContactorIDs[accessorID]; ok {
				accessorNames[accessorID] = value
			}
		} else if accessorType == AccessorGroup {
			if value, ok := orgNameInfo.GroupIDs[accessorID]; ok {
				accessorNames[accessorID] = value
			}
		}
	}
	return
}

//func (u *usermgntSvc) SetAnonymous(info *ASharedLinkInfo) (err error) {
//	// 组装 消息体
//	body := map[string]interface{}{}
//	topic := "core.anonymity.set"
//	body["id"] = info.ID
//	body["password"] = info.Password
//	body["limited_times"] = info.LimitedTimes
//	body["expires_at"] = rest.TimeStampToString(info.ExpiresAtStamp)
//	body["type"] = common.RouteAnonymityAuth
//	// 发送消息
//	var data []byte
//	data, err = jsoniter.Marshal(body)
//	if err != nil {
//		u.log.WithContext(ctx).Errorln(err)
//		return err
//	}
//	err = u.mqClient.Pub(topic, data)
//	if err != nil {
//		u.log.WithContext(ctx).Errorln(err)
//		return err
//	}
//	return nil
//}

//func (u *usermgntSvc) DeleteAnonymous(anonymousIDs []string) (err error) {
//	// 组装 消息体
//	body := map[string]interface{}{}
//	topic := "core.anonymity.delete"
//	body["ids"] = anonymousIDs
//	// 发送消息
//	var data []byte
//	data, err = jsoniter.Marshal(body)
//	if err != nil {
//		u.log.WithContext(ctx).Errorln(err)
//		return err
//	}
//	err = u.mqClient.Pub(topic, data)
//	if err != nil {
//		u.log.WithContext(ctx).Errorln(err)
//		return err
//	}
//	return nil
//}

// GetAppInfo 获取应用账户信息
func (u *usermgntSvc) GetAppInfo(ctx context.Context, appID string) (info AppInfo, err error) {
	target := fmt.Sprintf("%s/v1/apps/%s", u.baseURL, appID)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetAppInfo failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetAppInfo failed", zap.Error(err), zap.String("url", target))
		return
	}
	info.ID = appID
	info.Name = respParam.(map[string]interface{})["name"].(string)
	return
}

// GetDepIDsByUserID 获取用户所属部门ID
func (u *usermgntSvc) GetDepIDsByUserID(ctx context.Context, userID string) (pathIDs []string, err error) {
	fields := "department_ids"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, fields)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetDepIDsByUserID failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetDepIDsByUserID failed", zap.Error(err), zap.String("url", target))
		return
	}
	pathIDsTmp := respParam.([]interface{})
	pathIDs = make([]string, 0, len(pathIDsTmp))
	for i := 0; i < len(pathIDsTmp); i++ {
		pathIDs = append(pathIDs, pathIDsTmp[i].(string))
	}

	return
}

func (u *usermgntSvc) GetUserInfoByID(ctx context.Context, userID string) (userInfo UserInfo, err error) {
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, "groups")
	resp, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetUserInfoByID failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetUserInfoByID failed", zap.Error(err), zap.String("url", target))
		return UserInfo{}, err
	}

	info := resp.([]interface{})[0]
	err = mapstructure.Decode(info, &userInfo)
	if err != nil {
		return UserInfo{}, err
	}

	userInfo.ID = userID
	userInfo.UserType = AccessorUser

	return userInfo, nil
}

// BatchGetUserInfoByID 批量获取用户的基础信息
func (u *usermgntSvc) BatchGetUserInfoByID(ctx context.Context, userIDs []string) (userInfoMap map[string]UserInfo, err error) {
	userInfoMap = make(map[string]UserInfo)
	var userIDsStr string
	if len(userIDs) == 0 {
		return
	}
	for i, userID := range userIDs {
		userIDsStr += userID
		if i != len(userIDs)-1 {
			userIDsStr += ","
		}
	}
	fields := "account,name,csf_level,frozen,roles,email,telephone,third_attr,third_id"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userIDsStr, fields)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("BatchGetUserInfoByID failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("BatchGetUserInfoByID failed", zap.Error(err), zap.String("url", target))

		return
	}
	infos := respParam.([]interface{})
	for i := range infos {
		info := infos[i].(map[string]interface{})
		userInfo, errTmp := u.convertUserInfo(info)
		if errTmp != nil {
			return userInfoMap, errTmp
		}
		userInfo.ID = info["id"].(string)
		userInfo.UserType = AccessorUser
		userInfoMap[userInfo.ID] = userInfo
	}
	return
}

func (u *usermgntSvc) convertUserInfo(info map[string]interface{}) (userInfo UserInfo, err error) {
	userInfo = UserInfo{
		Account:    info["account"].(string),
		VisionName: info["name"].(string),
		CsfLevel:   int(info["csf_level"].(float64)),
		Frozen:     info["frozen"].(bool),
		Roles:      make(map[RoleType]bool),
		Email:      info["email"].(string),
		Telephone:  info["telephone"].(string),
		ThirdAttr:  info["third_attr"].(string),
		ThirdID:    info["third_id"].(string),
	}
	roles := info["roles"].([]interface{})
	for _, val := range roles {
		roleType, ok := u.roleTypeMap[val.(string)]
		if !ok {
			err = errors.New("role type conversion error")
			return
		}
		userInfo.Roles[roleType] = true
	}
	return
}

// GetAccessorIDsByDepartID 获取部门访问令牌
func (u *usermgntSvc) GetAccessorIDsByDepartID(ctx context.Context, depID string) (accessorIDs []string, err error) {
	target := fmt.Sprintf("%s/v1/departments/%s/accessor_ids", u.baseURL, depID)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetAccessorIDsByDepartID failed:%v, url:%v", err, target)
		log.WithContext(ctx).Error("GetAccessorIDsByDepartID failed", zap.Error(err), zap.String("url", target))
		return
	}
	result := respParam.([]interface{})
	for _, x := range result {
		accessorIDs = append(accessorIDs, x.(string))
	}
	return
}

// GetUserParentDepartments 获取用户所在的组织结构, 返回结果外围数组的每个元素都是[]Department类型
// 一个[]Department代表组织结构部门链路，用于描述从根组织到用户直属部门的单个链路
// 一个[][]Department类型代表多个组织结构部门链路，用于描述从根组织到用户直属部门的多个链路(用户直属于多个部门)
func (u *usermgntSvc) GetUserParentDepartments(ctx context.Context, userID string) (parentDeps [][]Department, err error) {
	endPoint := ContactStr(u.baseURL, "/v1/users/", userID, "/parent_deps")
	respParam, err := u.httpClient.Get(ctx, endPoint, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetUserParentDepartments failed:%v, url:%v", err, endPoint)
		log.WithContext(ctx).Error("GetUserParentDepartments failed", zap.Error(err), zap.String("url", endPoint))
		return nil, err
	}
	info := respParam.([]interface{})[0]
	err = mapstructure.Decode(info.(map[string]interface{})["parent_deps"], &parentDeps)
	if err != nil {
		return nil, err
	}

	return parentDeps, nil
}

// ContactStr 连接字符串
func ContactStr(strSlice ...string) string {
	var result strings.Builder
	for _, v := range strSlice {
		result.WriteString(v)
	}
	return result.String()
}
