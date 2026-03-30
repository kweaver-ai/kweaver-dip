package microservice

import (
	"context"
	"errors"
	"net/http"
	"time"

	"github.com/hashicorp/golang-lru/v2/expirable"
	"github.com/imroc/req/v3"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 缓存配置
const (
	// 缓存大小
	cacheSize = 1 << 16
	// 缓存过期事件
	cacheTTL = time.Second
)

type UserManagementRepo interface {
	GetUserById(ctx context.Context, userId string) (userInfo *dto.UserInfo, err error)
	GetUserByIdV1(ctx context.Context, userId string) (userInfo *dto.UserInfo, err error)
}

type userManagementRepo struct {
	// UserInfo 的缓存
	cache *expirable.LRU[string, *dto.UserInfo]
}

func NewUserManagementRepo() UserManagementRepo {
	return &userManagementRepo{cache: expirable.NewLRU[string, *dto.UserInfo](cacheSize, nil, cacheTTL)}
}

func (u *userManagementRepo) GetUserById(ctx context.Context, userId string) (res *dto.UserInfo, err error) {
	// 先尝试从缓存中获取
	if v, ok := u.cache.Get(userId); ok {
		return v.DeepCopy(), nil
	}

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
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("GetUserById", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	var getUserByIdRes []*dto.UserInfo
	err = resp.UnmarshalJson(&getUserByIdRes)
	if err != nil {
		log.WithContext(ctx).Error("GetUserById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	if len(getUserByIdRes) < 1 {
		log.WithContext(ctx).Error("GetUserById 未获取到用户信息")
		return nil, errorcode.Detail(errorcode.InternalError, "未获取到用户信息")
	}

	res = getUserByIdRes[0]

	// 更新缓存
	u.cache.Add(res.Id, res.DeepCopy())

	return res, nil
}

func (u *userManagementRepo) GetUserByIdV1(ctx context.Context, userId string) (res *dto.UserInfo, err error) {
	// 先尝试从缓存中获取
	if v, ok := u.cache.Get(userId); ok {
		return v.DeepCopy(), nil
	}

	params := map[string]string{
		"userId": userId,
		"fields": "name,roles,parent_deps",
	}

	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetPathParams(params).
		Get(settings.Instance.Services.UserManagement + "/api/user-management/v1/users/{userId}/{fields}")
	if err != nil {
		log.WithContext(ctx).Error("GetUserById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	if resp.StatusCode != http.StatusOK && resp.StatusCode != http.StatusNotFound {
		log.WithContext(ctx).Error("GetUserById", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	if resp.StatusCode == http.StatusNotFound {
		log.WithContext(ctx).Error("GetUserById", zap.Error(errors.New(resp.String())))
		return res, nil
	}

	var getUserByIdRes []*dto.UserInfo
	err = resp.UnmarshalJson(&getUserByIdRes)
	if err != nil {
		log.WithContext(ctx).Error("GetUserById", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err)
	}

	if len(getUserByIdRes) >= 1 {
		res = getUserByIdRes[0]
	}

	// 更新缓存
	u.cache.Add(res.Id, res.DeepCopy())

	return res, nil
}
