package util

import (
	"context"
	"runtime"
	"strconv"

	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func GetUserInfo(ctx context.Context) (*middleware.User, error) {
	//获取用户信息
	value := ctx.Value(interception.InfoName)
	if value == nil {
		log.WithContext(ctx).Error("ObtainUserInfo Get TokenIntrospectInfo not exist")
		return nil, errorcode.Desc(my_errorcode.GetUserInfoFailedInterior)
	}
	user, ok := value.(*middleware.User)
	if !ok {
		pc, _, line, _ := runtime.Caller(1)
		log.WithContext(ctx).Error("transfer hydra TokenIntrospectInfo error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
		return nil, errorcode.Desc(my_errorcode.GetUserInfoFailedInterior)
	}
	return user, nil
}
