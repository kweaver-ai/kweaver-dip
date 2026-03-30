package user_management

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func GetUserInfoByUserID2(ctx context.Context, token string, userID models.UserID) (*request.UserInfo, error) {
	return GetUserInfoByUserID(ctx, token, userID.String())
}

func GetUserInfoByUserID(ctx context.Context, token, userID string) (*request.UserInfo, error) {
	uInfo, _, err := getUserInfoByUserID(ctx, token, userID)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get user info, err: %v", err)
		return nil, err
	}

	//if len(uInfo.OrgInfos) == 0 {
	//	log.WithContext(ctx).Errorf("用户未关联部门")
	//	return nil, errors.New("用户未关联部门")
	//}

	return uInfo, nil
}

type user struct {
	Name  string   `json:"name"`
	Roles []string `json:"roles"`
	Deps  [][]struct {
		ID   string `json:"id"`
		Name string `json:"name"`
	} `json:"parent_deps"`
}

func getUserInfoByUserID(ctx context.Context, token, userID string) (uInfo *request.UserInfo, isNormalUser bool, err error) {
	fields := "name,roles,parent_deps"
	target := fmt.Sprintf("%s/api/user-management/v1/users/%s/%s", settings.GetConfig().DepServicesConf.UserMgmPrivateHost, userID, fields)
	header := http.Header{
		"Authorization": []string{token},
	}
	buf, err := util.DoHttpGet(ctx, target, header, nil)
	if err != nil {
		log.WithContext(ctx).Error("getUserInfoByUserID failed", zap.Error(err), zap.String("url", target))
		return nil, false, err
	}

	var users []user
	if err = json.Unmarshal(buf, &users); err != nil {
		log.WithContext(ctx).Error("getUserInfoByUserID failed", zap.Error(err), zap.String("url", target))
		return nil, false, err
	}

	if len(users) < 1 {
		log.WithContext(ctx).Error("getUserInfoByUserID failed, no user info fetched", zap.Error(err), zap.String("url", target))
		return nil, false, errors.New("no user info fetched")
	}

	for _, x := range users[0].Roles {
		if x == "normal_user" {
			isNormalUser = true
			break
		}
	}

	uInfo = new(request.UserInfo)
	uInfo.Uid = userID
	uInfo.UserName = users[0].Name
	uInfo.OrgInfos = make([]*request.DepInfo, 0)
	for i := range users[0].Deps {
		if len(users[0].Deps[i]) > 0 {
			uInfo.OrgInfos = append(uInfo.OrgInfos,
				&request.DepInfo{
					OrgCode: users[0].Deps[i][len(users[0].Deps[i])-1].ID,
					OrgName: users[0].Deps[i][len(users[0].Deps[i])-1].Name,
				})
		}
	}
	return
}
