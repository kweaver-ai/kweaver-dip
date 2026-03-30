package impl

import (
	"context"
	"encoding/json"
	"io/ioutil"
	"net/http"

	cc "github.com/kweaver-ai/dsg/services/apps/basic-search/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/basic-search/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

type Repo struct {
	httpclient httpclient.HTTPClient
}

func NewRepo(client httpclient.HTTPClient) cc.Repo {
	return &Repo{httpclient: client}
}

func (r *Repo) GetSubOrgCodes(ctx context.Context, req *cc.GetSubOrgCodesReq) (*cc.GetSubOrgCodesResp, error) {
	// orgCode := "b0bb6b38-1bd0-11ee-9c77-7e012cca65e7"
	url := settings.GetConfig().ConfigCenterHost + "/api/configuration-center/v1/objects/internal?" + "id=" + req.OrgCode + "&type=department,organization&limit=0"
	//resp, err := r.httpclient.Get(url, map[string]string{"Content-Type": "application/json"})
	//if err != nil {
	//	log.Errorf("failed to get sub deps from cc, err info: %v", err.Error())
	//	return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	//}
	ccRequest, _ := http.NewRequestWithContext(ctx, http.MethodGet, url, http.NoBody)
	ccRequest.Header.Add("Content-Type", "application/json")
	data, err := trace.NewOtelHttpClient().Do(ccRequest)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get sub deps from cc, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	resp, _ := ioutil.ReadAll(data.Body)
	defer data.Body.Close()

	res := &struct {
		Entries []struct {
			ID string `json:"id"`
		} `json:"entries"`
		TotalCount int64 `json:"total_count"`
	}{}

	if err = json.Unmarshal(resp, &res); err != nil {
		log.WithContext(ctx).Errorf("failed to json.Unmarshal bytes to res, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	var orgCodes []string
	if res != nil && len(res.Entries) > 0 {
		for _, entry := range res.Entries {
			orgCodes = append(orgCodes, entry.ID)
		}
	}

	return &cc.GetSubOrgCodesResp{Codes: orgCodes}, nil
}
