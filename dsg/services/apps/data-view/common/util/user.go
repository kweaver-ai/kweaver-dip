package util

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"runtime"
	"strconv"
)

func ObtainToken(c context.Context) string {
	value := c.Value(interception.Token)
	if value == nil {
		return ""
	}
	token, ok := value.(string)
	if !ok {
		return ""
	}
	return token
}
func GetUserInfo(ctx context.Context) (*middleware.User, error) {
	//获取用户信息
	value := ctx.Value(interception.InfoName)
	if value == nil {
		log.WithContext(ctx).Warn("ObtainUserInfo Get TokenIntrospectInfo not exist")
		return nil, errorcode.Desc(my_errorcode.GetUserInfoFailedInterior)
	}
	//tokenIntrospectInfo, ok := value.(hydra.TokenIntrospectInfo)
	user, ok := value.(*middleware.User)
	if !ok {
		pc, _, line, _ := runtime.Caller(1)
		log.WithContext(ctx).Warn("transfer hydra TokenIntrospectInfo error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
		return nil, errorcode.Desc(my_errorcode.GetUserInfoFailedInterior)
	}
	return user, nil
}
