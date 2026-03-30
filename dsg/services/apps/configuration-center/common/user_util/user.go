package user_util

import (
	"context"
	"runtime"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func ObtainUserInfo(c *gin.Context) (*model.User, error) {
	//获取用户信息
	value, exists := c.Get(interception.InfoName)
	if !exists {
		log.WithContext(c.Request.Context()).Error("ObtainUserInfo Get TokenIntrospectInfo not exist")
		return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
	}
	//tokenIntrospectInfo, ok := value.(hydra.TokenIntrospectInfo)
	user, ok := value.(*model.User)
	if !ok {
		pc, _, line, _ := runtime.Caller(1)
		log.WithContext(c.Request.Context()).Error("transfer hydra TokenIntrospectInfo error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
		return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
	}
	return user, nil
}

func GetUserInfo(ctx context.Context) (*model.User, error) {
	//获取用户信息
	value := ctx.Value(interception.InfoName)
	if value == nil {
		log.WithContext(ctx).Error("GetUserInfo Get TokenIntrospectInfo not exist")
		return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
	}
	user, ok := value.(*middleware.User)
	if ok {
		return &model.User{
			ID:   user.ID,
			Name: user.Name,
		}, nil
	}
	modelUser, ok := value.(*model.User)
	if ok {
		return modelUser, nil
	}
	pc, _, line, _ := runtime.Caller(1)
	log.WithContext(ctx).Error("GetUserInfo transfer User error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
	return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
}

func ObtainToken(c *gin.Context) (string, error) {
	value, exists := c.Get(interception.Token)
	if !exists {
		log.WithContext(c.Request.Context()).Error("ObtainToken Get TokenIntrospectInfo not exist")
		return "", errorcode.Desc(errorcode.GetTokenEmpty)
	}
	token, ok := value.(string)
	if !ok {
		pc, _, line, _ := runtime.Caller(1)
		log.WithContext(c.Request.Context()).Error("transfer string  error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
		return "", errorcode.Desc(errorcode.GetTokenEmpty)
	}
	if len(token) == 0 {
		log.WithContext(c.Request.Context()).Error("ObtainToken Get token len 0")
		return "", errorcode.Desc(errorcode.GetTokenEmpty)
	}
	return token, nil
}
func ObtainUserInfoAndToken(c *gin.Context) (*model.User, string, error) {
	user, err := ObtainUserInfo(c)
	if err != nil {
		return nil, "", err
	}
	token, err := ObtainToken(c)
	if err != nil {
		return nil, "", err
	}
	return user, token, nil
}
