package user_management

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"
	"net/url"
	"path"
	"strings"
	"sync"

	jsoniter "github.com/json-iterator/go"
	"github.com/mitchellh/mapstructure"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
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
	baseURL      string
	publicURL    string
	httpClient   httpclient.HTTPClient
	httpClientEx httpclient.HTTPClient
	//mqClient     msqclient.ProtonMSQClient
	roleTypeMap map[string]RoleType
}

// NewUserMgnt 创建UserMgnt服务处理对象
func NewUserMgnt(httpClient httpclient.HTTPClient) DrivenUserMgnt {
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
			baseURL:      fmt.Sprintf("http://%s/api/user-management", settings.ConfigInstance.Config.DepServices.UserMgmPrivate),
			publicURL:    fmt.Sprintf("http://%s", settings.ConfigInstance.Config.DepServices.UserMgmPublic),
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
func (u *usermgntSvc) GetDirectDepAllUserInfos(ctx context.Context, depID string) (userIds []string, err error) {
	fields := "member_ids"
	target := fmt.Sprintf("%s/v1/departments/%s/%s", u.baseURL, depID, fields)
	respParam, err := u.httpClientEx.Get(ctx, target, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetDirectDepAllUserInfos failed", zap.Error(err), zap.String("url", target))
		return userIds, err
	}
	userIdsInterface := respParam.(map[string]interface{})["user_ids"].([]interface{})
	for _, id := range userIdsInterface {
		userIds = append(userIds, id.(string))
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

// GetDepIDsByUserID 获取用户所属（直属）部门ID
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

// GetUserDeptAndParentDepartments 获取用户所属（直属）部门和父部门
func (u *usermgntSvc) GetUserDeptAndParentDepartments(ctx context.Context, userID string) (parentDeps [][]Department, err error) {
	fields := "parent_deps"
	target := fmt.Sprintf("%s/v1/users/%s/%s", u.baseURL, userID, fields)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetUserDeptAndParentDepartments failed", zap.Error(err), zap.String("url", target))
		return
	}
	info := respParam.([]interface{})[0]
	err = mapstructure.Decode(info.(map[string]interface{})["parent_deps"], &parentDeps)
	if err != nil {
		return nil, err
	}
	return parentDeps, nil
}

func (u *usermgntSvc) BatchGetUserParentDepartments(ctx context.Context, userIDs []string) (parentDeps map[string][][]Department, err error) {
	endPoint := ContactStr(u.baseURL, "/v1/users/", strings.Join(userIDs, ","), "/parent_deps")
	respParam, err := u.httpClient.Get(ctx, endPoint, nil)
	if err != nil {
		//u.log.WithContext(ctx).Errorf("GetUserParentDepartments failed:%v, url:%v", err, endPoint)
		log.WithContext(ctx).Error("GetUserParentDepartments failed", zap.Error(err), zap.String("url", endPoint))
		return nil, err
	}

	parentDeps = make(map[string][][]Department)
	infos := respParam.([]interface{})
	for i := range infos {
		var deps [][]Department
		info := infos[i].(map[string]interface{})
		err = mapstructure.Decode(info["parent_deps"], &deps)
		if err != nil {
			return nil, err
		}
		parentDeps[info["id"].(string)] = deps
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

func (u *usermgntSvc) GetDepartments(ctx context.Context, level int) (departmentInfos []*DepartmentInfo, err error) {
	target := fmt.Sprintf("%s/v1/departments?level=%d", u.baseURL, level)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetDepartments failed", zap.Error(err), zap.String("url", target))
		return
	}
	infos := respParam.([]interface{})
	for i := range infos {
		tmp := infos[i].(map[string]interface{})
		departmentInfo := &DepartmentInfo{
			ID:      tmp["id"].(string),
			Name:    tmp["name"].(string),
			ThirdId: tmp["third_id"].(string),
		}
		departmentInfos = append(departmentInfos, departmentInfo)
	}
	return
}

func (u *usermgntSvc) GetDepartmentParentInfo(ctx context.Context, ids, fields string) (departmentParentInfos []*DepartmentParentInfo, err error) {
	target := fmt.Sprintf("%s/v1/departments/%s/%s", u.baseURL, ids, fields)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	//target := fmt.Sprintf("%s/user-management/v1/batch-get-department-info", u.baseURL)
	//tmpInfo := map[string]interface{}{
	//	"department_ids": ids,
	//	"fields":         fields,
	//}
	//_, respParam, err := u.httpClient.Post(ctx, target, nil, tmpInfo)
	if err != nil {
		log.WithContext(ctx).Error("GetDepartmentParentInfo failed", zap.Error(err), zap.String("url", target))
		return
	}
	infos := respParam.([]interface{})
	for i := range infos {
		departmentInfo := infos[i].(map[string]interface{})
		info := new(DepartmentParentInfo)
		info.ID = departmentInfo["department_id"].(string)
		info.Name = departmentInfo["name"].(string)
		info.ThirdId = departmentInfo["third_id"].(string)
		parents := departmentInfo["parent_deps"].([]interface{})
		parentInfos := make([]DepartmentInfo, 0)
		if len(parents) > 0 {
			for j := range parents {
				parent := parents[j].(map[string]interface{})
				parentInfos = append(parentInfos, DepartmentInfo{
					ID:      parent["id"].(string),
					Name:    parent["name"].(string),
					ThirdId: departmentInfo["third_id"].(string),
				})
			}
			info.ParentDep = parentInfos
		} else {
			info.ParentDep = []DepartmentInfo{}
		}
		departmentParentInfos = append(departmentParentInfos, info)
	}
	return
}

func (u *usermgntSvc) GetDepartmentInfo(ctx context.Context, departmentIds []string, fields string) (res []*DepartmentInfo, err error) {
	if len(departmentIds) == 0 {
		return []*DepartmentInfo{}, nil
	}
	var departmentId string
	for _, id := range departmentIds {
		departmentId = departmentId + id + ","
	}
	departmentId = strings.TrimRight(departmentId, ",")

	target := fmt.Sprintf("%s/v1/departments/%s/%s", u.baseURL, departmentId, fields)
	respParam, err := u.httpClient.Get(ctx, target, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetDepartmentInfo failed", zap.Error(err), zap.String("url", target))
		return
	}
	a := respParam.([]byte)
	_ = a
	infos := respParam.([]interface{})
	for i := range infos {
		departmentInfo := infos[i].(map[string]interface{})
		info := new(DepartmentInfo)
		info.ID = departmentInfo["department_id"].(string)
		info.Name = departmentInfo["name"].(string)
		res = append(res, info)
	}
	return
}

// 获取多个用户信息，支持获取指定字段。
func (u *usermgntSvc) GetUserInfos(ctx context.Context, userIDs []string, fields []UserInfoField) ([]UserInfoV2, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	log := log.WithContext(ctx)

	// prepare api endpoint
	base, err := url.Parse(u.baseURL)
	span.RecordError(err)
	if err != nil {
		msg := "parse user-management base url fail"
		log.Error(msg, zap.Error(err), zap.String("baseURL", u.baseURL))
		return nil, errorcode.WithDetail(errorcode.PublicInternalError, map[string]any{
			"message": msg,
			"baseURL": u.baseURL,
			"err":     err.Error(),
		})
	}

	// prepare path parameters
	base.Path = path.Join(base.Path, "v1/users", pathParameterUserIDsFrom(userIDs), pathParameterFieldsFrom(fields))

	// send request
	resp, err := u.httpClient.Get(ctx, base.String(), nil)
	span.RecordError(err)
	if err != nil {
		msg := "invoke http api fail"
		log.Error(msg, zap.Error(err), zap.String("method", http.MethodGet), zap.Stringer("endpoint", base))
		return nil, errorcode.WithDetail(errorcode.DrivenUserManagementError, map[string]any{
			"message":  msg,
			"method":   http.MethodGet,
			"endpoint": base,
			"err":      err.Error(),
		})
	}

	// decode response body
	var userInfos []UserInfoV2
	if err := decodeResponseParam(&userInfos, resp); err != nil {
		span.RecordError(err)
		msg := "decode http response body fail"
		log.Error(msg, zap.Error(err), zap.Any("response", resp))
		return nil, errorcode.WithDetail(errorcode.PublicInternalError, map[string]any{
			"message":  msg,
			"response": resp,
			"err":      err.Error(),
		})
	}

	return userInfos, nil
}

// pathParameterUserIDsFrom 返回 path 参数 user_id
func pathParameterUserIDsFrom(userIDs []string) string { return strings.Join(userIDs, ",") }

// pathParameterFieldsFrom 返回 path 参数 fields
func pathParameterFieldsFrom(fields []UserInfoField) string {
	var fieldStrings []string
	for _, f := range fields {
		fieldStrings = append(fieldStrings, string(f))
	}
	return strings.Join(fieldStrings, ",")
}

// decodeResponseParam 以 json 序列化、反序列化 respParam
func decodeResponseParam[T any](target T, respParam any) error {
	b, err := json.Marshal(respParam)
	if err != nil {
		return err
	}
	return json.Unmarshal(b, target)
}

func (u *usermgntSvc) GetApps(ctx context.Context) (*BB, error) {
	errorMsg := "DrivenConfigurationCenter GetLabelByName"
	target := fmt.Sprintf("%s/api/user-management/v1/apps", u.publicURL)
	header := make(map[string]string)
	header["Authorization"] = ctx.Value(interception.Token).(string)
	respParam, err := u.httpClient.Get(ctx, target, header)
	if err != nil {
		log.WithContext(ctx).Error("GetDepartmentInfo failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}
	body, err := jsoniter.Marshal(respParam)
	if err != nil {
		log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
		return nil, nil
	}
	var res *BB
	err = jsoniter.Unmarshal(body, &res)
	if err != nil {
		log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
		return nil, nil
	}
	return res, nil
}

func (u *usermgntSvc) CreateApps(ctx context.Context, name, password string) (*CC, error) {
	errorMsg := "DrivenConfigurationCenter GetLabelByName"
	target := fmt.Sprintf("%s/api/user-management/v1/apps", u.publicURL)
	header := make(map[string]string)
	header["Authorization"] = ctx.Value(interception.Token).(string)

	tmpInfo := map[string]interface{}{
		"name":     name,
		"password": password,
	}

	statusCode, respParam, err := u.httpClient.Post(ctx, target, header, tmpInfo)
	if err != nil {
		log.WithContext(ctx).Error("GetDepartmentInfo failed", zap.Error(err), zap.String("url", target))
		return nil, err
	}
	if statusCode == http.StatusCreated {
		body, err := jsoniter.Marshal(respParam)
		if err != nil {
			log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, nil
		}
		var res *CC
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, nil
		}
		return res, nil

	}
	return nil, nil
}

func (u *usermgntSvc) UpdateApps(ctx context.Context, id, name, password string) error {
	// errorMsg := "DrivenConfigurationCenter GetLabelByName"
	target := fmt.Sprintf("%s/api/user-management/v1/apps/%s/name", u.publicURL, id)

	tmpInfo := map[string]interface{}{
		"name":     name,
		"password": password,
	}
	if password != "" {
		target = fmt.Sprintf("%s/api/user-management/v1/apps/%s/name,password", u.publicURL, id)
	}

	header := make(map[string]string)
	header["Authorization"] = ctx.Value(interception.Token).(string)

	statusCode, _, err := u.httpClient.Put(ctx, target, header, tmpInfo)
	if err != nil {
		// log.WithContext(ctx).Error("GetDepartmentInfo failed", zap.Error(err), zap.String("url", target))
		return err
	}
	if statusCode == http.StatusNoContent {
		return nil
	}
	return nil
}

func (u *usermgntSvc) DeleteApps(ctx context.Context, id string) error {
	// errorMsg := "DrivenConfigurationCenter GetLabelByName"
	target := fmt.Sprintf("%s/api/user-management/v1/apps/%s", u.publicURL, id)
	header := make(map[string]string)
	header["Authorization"] = ctx.Value(interception.Token).(string)

	_, err := u.httpClient.Delete(ctx, target, header)
	if err != nil {
		// log.WithContext(ctx).Error("GetDepartmentInfo failed", zap.Error(err), zap.String("url", target))
		return err
	}
	return nil
}
