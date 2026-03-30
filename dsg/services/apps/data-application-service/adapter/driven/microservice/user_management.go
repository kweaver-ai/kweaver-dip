package microservice

import (
	"context"

	"github.com/imroc/req/v2"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type UserManagementRepo interface {
	GetUserById(ctx context.Context, userId string) (userInfo *dto.UserInfo, err error)
	GetAppsById(ctx context.Context, userId string) (res *dto.AppsInfo, err error)
	GetDepIDsByUserID(ctx context.Context, userID string) (departmentIDs []string, err error)
}

type userManagementRepo struct {
}

func NewUserManagementRepo() UserManagementRepo {
	return &userManagementRepo{}
}

func (u *userManagementRepo) GetUserById(ctx context.Context, userId string) (res *dto.UserInfo, err error) {
	params := map[string]string{
		"userId": userId,
		"fields": "name,roles,parent_deps",
	}

	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetPathParams(params).
		Get(settings.Instance.Services.UserManagement + "/api/user-management/v1/users/{userId}/{fields}")
	if err != nil {
		log.WithContext(ctx).Error("GetUserById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	// 检查 response，返回结构化错误
	if err := checkUserManagementGetUserByIdResponse(ctx, resp); err != nil {
		return nil, err
	}

	var getUserByIdRes []*dto.UserInfo
	err = resp.UnmarshalJson(&getUserByIdRes)
	if err != nil {
		log.WithContext(ctx).Error("GetUserById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if len(getUserByIdRes) < 1 {
		log.WithContext(ctx).Error("GetUserById 未获取到用户信息")
		return nil, errorcode.Detail(errorcode.InternalError, "未获取到用户信息")
	}

	res = getUserByIdRes[0]

	return res, nil
}

func (u *userManagementRepo) GetAppsById(ctx context.Context, userId string) (res *dto.AppsInfo, err error) {
	// params := map[string]string{
	// 	"userId": userId,
	// }

	//req.DevMode()
	resp, err := req.SetContext(ctx).
		// SetBearerAuthToken(util.GetToken(ctx)).
		// SetPathParams(params).
		Get(settings.Instance.Services.UserManagement + "/api/user-management/v1/apps/" + userId)
	if err != nil {
		log.WithContext(ctx).Error("GetAppsById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	// 检查 response，返回结构化错误
	if err := checkUserManagementGetUserByIdResponse(ctx, resp); err != nil {
		return nil, err
	}

	var getAppsByIdRes *dto.AppsInfo
	err = resp.UnmarshalJson(&getAppsByIdRes)
	if err != nil {
		log.WithContext(ctx).Error("GetAppsById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if getAppsByIdRes == nil {
		log.WithContext(ctx).Error("GetAppsById 未获取到用户信息")
		return nil, errorcode.Detail(errorcode.InternalError, "未获取到用户信息")
	}

	res = getAppsByIdRes

	return res, nil
}

func (u *userManagementRepo) GetDepIDsByUserID(ctx context.Context, userID string) (departmentIDs []string, err error) {
	params := map[string]string{
		"userId": userID,
		"fields": "department_ids",
	}

	resp, err := req.SetContext(ctx).
		// SetBearerAuthToken(util.GetToken(ctx)).
		SetPathParams(params).
		Get(settings.Instance.Services.UserManagement + "/api/user-management/v1/users/{userId}/{fields}")
	if err != nil {
		log.WithContext(ctx).Error("GetDepIDsByUserID", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	// 检查 response，返回结构化错误
	if err := checkUserManagementGetUserByIdResponse(ctx, resp); err != nil {
		return nil, err
	}

	var depIDs []string
	err = resp.UnmarshalJson(&depIDs)
	if err != nil {
		log.WithContext(ctx).Error("GetDepIDsByUserID", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return depIDs, nil
}

// user-management 错误码
const (
	userManagementUsersNotExisting userManagementErrorCode = 404019001
)

// userManagementError 代表 user-management 服务端返回的错误
type userManagementError struct {
	// 原因
	Cause string `json:"cause,omitempty"`
	// 错误码
	Code userManagementErrorCode `json:"code,omitempty"`
	// 信息
	Message string `json:"message,omitempty"`
	// 详情
	Detail userManagementErrorDetail `json:"detail,omitempty"`
}

type userManagementErrorCode int

// userManagementErrorDetail 代表 user-management 服务端返回的错误详情
type userManagementErrorDetail struct {
	// ID 列表
	IDs []string
}

// 检查 GetUserById 的 response，返回结构化错误
func checkUserManagementGetUserByIdResponse(ctx context.Context, resp *req.Response) error {
	if resp.IsSuccess() {
		return nil
	}

	log.WithContext(ctx).Error("GetUserById", zap.String("status", resp.Status), zap.Any("response", resp.Result()))

	ume := &userManagementError{}
	if err := resp.UnmarshalJson(ume); err == nil && ume.Code == userManagementUsersNotExisting {
		if len(ume.Detail.IDs) == 1 {
			return &UserNotFoundError{ID: ume.Detail.IDs[0]}
		}
		return &UsersNotFoundError{IDs: ume.Detail.IDs}
	}

	return errorcode.Detail(errorcode.InternalError, resp.String())
}
