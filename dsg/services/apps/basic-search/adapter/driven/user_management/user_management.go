// Package user_management 当前微服务依赖的其他服务
package user_management

import (
	"context"
	"errors"
	"fmt"
	"sync"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
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
	baseURL    string
	httpClient httpclient.HTTPClient
	//mqClient    msqclient.ProtonMSQClient
	roleTypeMap map[string]RoleType
}

// NewUserMgnt 创建UserMgnt服务处理对象
func NewUserMgnt(httpClient httpclient.HTTPClient) DrivenUserMgnt {
	usermgntOnce.Do(func() {
		//config := common.SvcConfig
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
			baseURL:    fmt.Sprintf("http://%s/api/user-management", settings.GetConfig().DepServicesConf.UserMgmPrivateHost),
			httpClient: httpClient,
			//mqClient:    msqclient.NewProtonMSQClient(config.MQHost, config.MQPort, config.MQLookupdHost, config.MQLookupdPort, config.MQConnectorType),
			roleTypeMap: roleTypeMap,
		}
	})

	return usermgnt
}

// GetAccessorIDsByUserID 获取指定用户的访问令牌
func (u *usermgntSvc) GetAccessorIDsByUserID(userID string) (accessorIDs []string, err error) {
	target := fmt.Sprintf("%s/v1/users/%s/accessor_ids", u.baseURL, userID)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		//u.log.Errorf("GetAccessorIdsByUserID failed:%v, url:%v", err, target)
		log.Error("GetAccessorIdsByUserID failed", zap.Error(err), zap.String("target", target))
		return
	}

	accessorArr := respParam.([]interface{})
	for _, v := range accessorArr {
		accessorIDs = append(accessorIDs, v.(string))
	}

	return
}

// GetUserInfoByUserID 通过用户id获取用户名
func (u *usermgntSvc) GetUserInfoByUserID(userID string) (name string, isNormalUser bool, err error) {
	fields := "name,roles,parent_deps"
	target := fmt.Sprintf("%s/v1/users/%s/%s", fmt.Sprintf("http://%s/api/user-management", settings.GetConfig().DepServicesConf.UserMgmPrivateHost), userID, fields)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		log.Error("GetUserInfoByUserID failed", zap.Error(err), zap.String("url", target))
		return "", false, err
	}
	name = respParam.(map[string]interface{})["name"].(string)
	roles := respParam.(map[string]interface{})["roles"].([]interface{})
	for _, x := range roles {
		if x.(string) == "normal_user" {
			isNormalUser = true
			break
		}
	}
	return
}

// GetUserNameByUserID 通过用户id获取用户名
func (u *usermgntSvc) GetUserNameByUserID(userID string) (name string, isNormalUser bool, err error) {
	fields := "roles,name"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, fields)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		//u.log.Errorf("GetUserNameByUserID failed:%v, url:%v", err, target)
		log.Error("GetUserNameByUserID failed", zap.Error(err), zap.String("url", target))
		return "", false, err
	}
	name = respParam.(map[string]interface{})["name"].(string)
	roles := respParam.(map[string]interface{})["roles"].([]interface{})
	for _, x := range roles {
		if x.(string) == "normal_user" {
			isNormalUser = true
			break
		}
	}
	return
}

// GetUserRolesByUserID 通过用户id获取用户名
func (u *usermgntSvc) GetUserRolesByUserID(userID string) (roleTypes []RoleType, err error) {
	fields := "roles"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, fields)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		//u.log.Errorf("GetUserRolesByUserID failed:%v, url:%v", err, target)
		log.Error("GetUserRolesByUserID failed", zap.Error(err), zap.String("url", target))
		return
	}
	rolesParam := respParam.(map[string]interface{})["roles"].([]interface{})
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

// GetDepAllUsers 获取部门所有用户ID
func (u *usermgntSvc) GetDepAllUsers(depID string) (userIDs []string, err error) {
	fields := "all_user_ids"
	target := fmt.Sprintf("%s/v1/departments/%s/%s", u.baseURL, depID, fields)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		//u.log.Errorf("GetDepartmentAllUser failed:%v, url:%v", err, target)
		log.Error("GetDepartmentAllUser failed", zap.Error(err), zap.String("url", target))
		return userIDs, err
	}
	result := respParam.(map[string]interface{})["all_user_ids"].([]interface{})
	for _, x := range result {
		userIDs = append(userIDs, x.(string))
	}
	return
}

func (u *usermgntSvc) GetGroupMembers(groupID string) (userIDs, depIDs []string, err error) {
	tmpInfo := map[string]interface{}{
		"method":    "GET",
		"group_ids": []string{groupID},
	}

	target := fmt.Sprintf("%v/v1/group-members", u.baseURL)
	_, respParam, err := u.httpClient.Post(context.TODO(), target, nil, tmpInfo)
	if err != nil {
		//u.log.Errorf("GetGroupMembers failed: %v, url: %v", err, target)
		log.Error("GetGroupMembers failed", zap.Error(err), zap.String("url", target))
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

func (u *usermgntSvc) getOrgNameIDInfo(orgInfo *orgIDInfo) (orgNameInfo orgNameIDInfo, err error) {
	tmpInfo := map[string]interface{}{
		"method":         "GET",
		"user_ids":       orgInfo.UserIDs,
		"department_ids": orgInfo.DepartIDs,
		"contactor_ids":  orgInfo.ContactorIDs,
		"group_ids":      orgInfo.GroupIDs,
	}
	target := fmt.Sprintf("%v/v1/names", u.baseURL)
	_, respParam, err := u.httpClient.Post(context.TODO(), target, nil, tmpInfo)
	if err != nil {
		//u.log.Errorf("getOrgNameIDInfo failed: %v, url: %v", err, target)
		log.Error("getOrgNameIDInfo failed", zap.Error(err), zap.String("url", target))
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

func (u *usermgntSvc) GetNameByAccessorIDs(accessorIDs map[string]AccessorType) (accessorNames map[string]string, err error) {
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

	orgNameInfo, err := u.getOrgNameIDInfo(&orgInfo)
	if err != nil {
		//u.log.Errorf("GetNameByAccessorID err:%v", err)
		log.Error("GetNameByAccessorID err", zap.Error(err))
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

/*
// TimeStampToString 纳秒时间戳转RFC3339格式的字符串
func TimeStampToString(t int64) string {
	const num int64 = 1e9
	return time.Unix(t/num, 0).Format(time.RFC3339)
}
const (
	// RouteAnonymityAuth 文档匿名用户
	RouteAnonymityAuth = "document"

	// RouteRealnameLinkAccess 文档实名共享链接
	RouteRealnameLinkAccess = "document.realname"
)
func (u *usermgntSvc) SetAnonymous(info *httpclient.ASharedLinkInfo) (err error) {
	// 组装 消息体
	body := map[string]interface{}{}
	topic := "core.anonymity.set"
	body["id"] = info.ID
	body["password"] = info.Password
	body["limited_times"] = info.LimitedTimes
	body["expires_at"] = TimeStampToString(info.ExpiresAtStamp)
	body["type"] = RouteAnonymityAuth
	// 发送消息
	var data []byte
	data, err = jsoniter.Marshal(body)
	if err != nil {
		//u.log.Errorln(err)
		log.Error("SetAnonymous  jsoniter.Marshal err", zap.Error(err))
		return err
	}
	err = u.mqClient.Pub(topic, data)
	if err != nil {
		//u.log.Errorln(err)
		log.Error("SetAnonymous  mqClient Pub err", zap.Error(err))
		return err
	}
	return nil
}

func (u *usermgntSvc) DeleteAnonymous(anonymousIDs []string) (err error) {
	// 组装 消息体
	body := map[string]interface{}{}
	topic := "core.anonymity.delete"
	body["ids"] = anonymousIDs
	// 发送消息
	var data []byte
	data, err = jsoniter.Marshal(body)
	if err != nil {
		//u.log.Errorln(err)
		log.Error("DeleteAnonymous  jsoniter.Marshal err", zap.Error(err))
		return err
	}
	err = u.mqClient.Pub(topic, data)
	if err != nil {
		//u.log.Errorln(err)
		log.Error("DeleteAnonymous  mqClient Pub err", zap.Error(err))
		return err
	}
	return nil
}*/

// GetAppInfo 获取应用账户信息
func (u *usermgntSvc) GetAppInfo(appID string) (info AppInfo, err error) {
	target := fmt.Sprintf("%s/v1/apps/%s", u.baseURL, appID)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		//u.log.Errorf("GetAppInfo failed:%v, url:%v", err, target)
		log.Error("GetAppInfo failed", zap.Error(err), zap.String("url", target))
		return
	}
	info.ID = appID
	info.Name = respParam.(map[string]interface{})["name"].(string)
	return
}

// GetDepIDsByUserID 获取用户所属部门ID
func (u *usermgntSvc) GetDepIDsByUserID(userID string) (pathIDs []string, err error) {
	fields := "department_ids"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, fields)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		//u.log.Errorf("GetDepIDsByUserID failed:%v, url:%v", err, target)
		log.Error("GetDepIDsByUserID failed", zap.Error(err), zap.String("url", target))
		return
	}
	pathIDsTmp := respParam.([]interface{})
	pathIDs = make([]string, 0, len(pathIDsTmp))
	for i := 0; i < len(pathIDsTmp); i++ {
		pathIDs = append(pathIDs, pathIDsTmp[i].(string))
	}

	return
}

// BatchGetUserInfoByID 批量获取用户的基础信息
func (u *usermgntSvc) BatchGetUserInfoByID(userIDs []string) (userInfoMap map[string]UserInfo, err error) {
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
	fields := "account,name,csf_level,frozen,authenticated,roles,email,telephone,third_attr,third_id"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userIDsStr, fields)
	respParam, err := u.httpClient.Get(context.TODO(), target, nil)
	if err != nil {
		//u.log.Errorf("BatchGetUserInfoByID failed:%v, url:%v", err, target)
		log.Error("BatchGetUserInfoByID failed", zap.Error(err), zap.String("url", target))

		return
	}
	userInfoMap = make(map[string]UserInfo)
	if len(userIDs) == 1 {
		info := respParam.(map[string]interface{})
		userInfo, errTmp := u.convertUserInfo(info)
		if errTmp != nil {
			return userInfoMap, errTmp
		}
		userInfo.ID = userIDs[0]
		userInfoMap[userInfo.ID] = userInfo
	} else {
		infos := respParam.([]interface{})
		for i := range infos {
			info := infos[i].(map[string]interface{})
			userInfo, errTmp := u.convertUserInfo(info)
			if errTmp != nil {
				return userInfoMap, errTmp
			}
			userInfo.ID = info["id"].(string)
			userInfoMap[userInfo.ID] = userInfo
		}
	}
	return
}

func (u *usermgntSvc) convertUserInfo(info map[string]interface{}) (userInfo UserInfo, err error) {
	userInfo = UserInfo{
		Account:       info["account"].(string),
		VisionName:    info["name"].(string),
		CsfLevel:      int(info["csf_level"].(float64)),
		Frozen:        info["frozen"].(bool),
		Authenticated: info["authenticated"].(bool),
		Roles:         make(map[RoleType]bool),
		Email:         info["email"].(string),
		Telephone:     info["telephone"].(string),
		ThirdAttr:     info["third_attr"].(string),
		ThirdID:       info["third_id"].(string),
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
