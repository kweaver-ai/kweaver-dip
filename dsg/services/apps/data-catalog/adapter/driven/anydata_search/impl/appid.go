package impl

//import (
//	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
//	"encoding/base64"
//	"encoding/json"
//)
//
//func (r *AnyDataSearchRepo) getAppID() (string, error) {
//
//	conf := settings.GetConfig()
//
//	payload := map[string]any{
//		"email":     conf.Email,
//		"password":  base64.StdEncoding.EncodeToString([]byte(conf.ADKgConf.Password)),
//		"isRefresh": 0,
//	}
//	bts, _ := json.Marshal(payload)
//
//	appidUrl := conf.AnyDataAlgServer + "/api/rbac/v1/user/appId"
//
//	_, response, err := r.client.Post(appidUrl, map[string]string{"type": "email"}, bts)
//	if err != nil {
//		return "", err
//	}
//
//	var info = struct {
//		Result string `json:"res"`
//	}{}
//	resp, _ := json.Marshal(response)
//	_ = json.Unmarshal(resp, &info)
//	return info.Result, nil
//}
