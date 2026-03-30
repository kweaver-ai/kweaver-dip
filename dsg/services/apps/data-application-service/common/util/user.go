package util

import (
	"context"
	"runtime"
	"strconv"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
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
		log.WithContext(ctx).Error("ObtainUserInfo Get TokenIntrospectInfo not exist")
		return nil, errorcode.Desc(errorcode.GetUserInfoFailure)
	}
	//tokenIntrospectInfo, ok := value.(hydra.TokenIntrospectInfo)
	user, ok := value.(*middleware.User)
	if !ok {
		pc, _, line, _ := runtime.Caller(1)
		log.WithContext(ctx).Error("transfer hydra TokenIntrospectInfo error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
		return nil, errorcode.Desc(errorcode.GetUserInfoFailure)
	}
	return user, nil
}

func GetDepart(ctx context.Context, ccDriven configuration_center.Driven) ([]string, error) {
	userInfo, err := GetUserInfo(ctx)
	if err != nil {
		log.WithContext(ctx).Error("ServiceList GetUserInfo failed", zap.Error(err))
		return nil, err
	}

	userDepartment, err := ccDriven.GetDepartmentsByUserID(ctx, userInfo.ID)
	if err != nil {
		return nil, err
	}
	subDepartmentIDs := make([]string, 0)
	for _, department := range userDepartment {
		subDepartmentIDs = append(subDepartmentIDs, department.ID)
		departmentList, err := ccDriven.GetChildDepartments(ctx, department.ID)
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			if entry.ID != "" {
				subDepartmentIDs = append(subDepartmentIDs, entry.ID)
			}
		}
	}
	return subDepartmentIDs, nil
}
