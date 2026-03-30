package user_util

import (
	"context"
	"runtime"
	"strconv"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

var userDomain user.IUser

func InitUserDomain(ud user.IUser) {
	userDomain = ud
}

func ObtainUserInfo(c context.Context) (*middleware.User, error) {
	//获取用户信息
	value := c.Value(interception.InfoName)
	if value == nil {
		log.Error("ObtainUserInfo Get TokenIntrospectInfo not exist")
		return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
	}
	//tokenIntrospectInfo, ok := value.(hydra.TokenIntrospectInfo)
	user, ok := value.(*middleware.User)
	if !ok {
		pc, _, line, _ := runtime.Caller(1)
		log.Error("transfer hydra TokenIntrospectInfo error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
		return nil, errorcode.Desc(errorcode.GetUserInfoFailedInterior)
	}
	return user, nil
}
func ObtainToken(c context.Context) (string, error) {
	value := c.Value(interception.Token)
	if value == nil {
		log.Error("ObtainToken Get TokenIntrospectInfo not exist")
		return "", errorcode.Desc(errorcode.GetTokenEmpty)
	}
	token, ok := value.(string)
	if !ok {
		pc, _, line, _ := runtime.Caller(1)
		log.Error("transfer string  error" + runtime.FuncForPC(pc).Name() + " | " + strconv.Itoa(line))
		return "", errorcode.Desc(errorcode.GetTokenEmpty)
	}
	if len(token) == 0 {
		log.Error("ObtainToken Get token len 0")
		return "", errorcode.Desc(errorcode.GetTokenEmpty)
	}
	return token, nil
}
func ObtainUserInfoAndToken(c *gin.Context) (*middleware.User, string, error) {
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

// GetNameByUserId 查询用户的姓名
func GetNameByUserId(ctx context.Context, userId string) string {
	return userDomain.GetNameByUserId(ctx, userId)
}

// 获取当前用户部门及其子部门
func GetDepart(ctx context.Context, ccDriven configuration_center.Driven) ([]string, error) {
	userInfo, err := ObtainUserInfo(ctx)
	if err != nil {
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
