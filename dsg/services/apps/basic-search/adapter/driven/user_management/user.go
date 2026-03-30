package user_management

import (
	"encoding/json"
	"fmt"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func GetUserInfoByUserID2(token string, userID models.UserID) (*request.UserInfo, error) {
	return GetUserInfoByUserID(token, userID.String())
}

func GetUserInfoByUserID(token, userID string) (*request.UserInfo, error) {
	uInfo, _, err := getUserInfoByUserID(token, userID)
	if err != nil {
		return nil, err
	}

	uInfo.OrgInfos = []*request.DepInfo{
		&settings.GetConfig().DepInfo,
	}

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

func getUserInfoByUserID(token, userID string) (uInfo *request.UserInfo, isNormalUser bool, err error) {
	fields := "name,roles,parent_deps"
	target := fmt.Sprintf("%s/api/user-management/v1/users/%s/%s", settings.GetConfig().DepServicesConf.UserMgmPrivateHost, userID, fields)
	header := http.Header{
		"Authorization": []string{token},
	}
	buf, err := util.DoHttpGet(target, header, nil)
	if err != nil {
		log.Error("getUserInfoByUserID failed", zap.Error(err), zap.String("url", target))
		return nil, false, err
	}

	var u user
	if err = json.Unmarshal(buf, &u); err != nil {
		log.Error("getUserInfoByUserID failed", zap.Error(err), zap.String("url", target))
		return nil, false, err
	}

	for _, x := range u.Roles {
		if x == "normal_user" {
			isNormalUser = true
			break
		}
	}

	uInfo = new(request.UserInfo)
	uInfo.Uid = userID
	uInfo.UserName = u.Name
	uInfo.OrgInfos = make([]*request.DepInfo, 0)
	for i := range u.Deps {
		if len(u.Deps[i]) > 0 {
			uInfo.OrgInfos = append(uInfo.OrgInfos,
				&request.DepInfo{
					OrgCode: u.Deps[i][len(u.Deps[i])-1].ID,
					OrgName: u.Deps[i][len(u.Deps[i])-1].Name,
				})
		}
	}
	return
}
