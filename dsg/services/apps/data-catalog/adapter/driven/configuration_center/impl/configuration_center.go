package impl

import (
	"context"
	"encoding/json"
	"strconv"

	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

type CCDrivenRepo struct {
	client httpclient.HTTPClient
}

func NewCCDrivenRepo(client httpclient.HTTPClient) configuration_center.Repo {
	return &CCDrivenRepo{client: client}
}

func (r *CCDrivenRepo) GetSubOrgCodes(ctx context.Context, req *configuration_center.GetSubOrgCodesReq) (*configuration_center.GetSubOrgCodesResp, error) {
	// orgCode := "b0bb6b38-1bd0-11ee-9c77-7e012cca65e7"
	url := settings.GetConfig().ConfigCenterHost + "/api/configuration-center/v1/objects/internal?" + "id=" + req.OrgCode + "&type=department,organization&limit=0"
	resp, err := r.client.Get(ctx, url, map[string]string{"Content-Time": "application/json"})
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get sub deps from cc, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	res := &struct {
		Entries []struct {
			ID string `json:"id"`
		} `json:"entries"`
		TotalCount int64 `json:"total_count"`
	}{}

	// bytes, _ := json.Marshal(resp)
	err = json.Unmarshal(lo.T2(json.Marshal(resp)).A, &res)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to json.Unmarshal bytes to res, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	var orgCodes []string
	if res != nil {
		for _, entry := range res.Entries {
			orgCodes = append(orgCodes, entry.ID)
		}
	}

	return &configuration_center.GetSubOrgCodesResp{Codes: orgCodes}, nil
}

func (r *CCDrivenRepo) GetAlgServerConf(ctx context.Context, name string) (resp []*configuration_center.GetAlgServerConfResp, err error) {
	ccAddr := settings.GetConfig().ConfigCenterHost
	url := ccAddr + "/api/configuration-center/v1/third_party_addr?name=" + name

	headers := map[string]string{
		"Content-Time": "application/json",
	}

	// 安全地获取Authorization token
	if token := ctx.Value(interception.Token); token != nil {
		if tokenStr, ok := token.(string); ok {
			headers["Authorization"] = tokenStr
		}
	}

	response, err := r.client.Get(ctx, url, headers)
	if err != nil {
		return nil, err
	}

	bytes, _ := json.Marshal(response)
	_ = json.Unmarshal(bytes, &resp)
	return resp, nil
}

func (r *CCDrivenRepo) GetInfoSysName(ctx context.Context, ids []string) (resp map[string]string, err error) {
	ccAddr := settings.GetConfig().ConfigCenterHost
	url := ccAddr + "/api/configuration-center/v1/datasource/system-info"

	headers := map[string]string{
		"Content-Time": "application/json",
	}

	// 安全地获取Authorization token
	if token := ctx.Value(interception.Token); token != nil {
		if tokenStr, ok := token.(string); ok {
			headers["Authorization"] = tokenStr
		}
	}

	idsInt := make([]int, 0, len(ids))
	for _, id := range ids {
		idsInt = append(idsInt, lo.T2(strconv.Atoi(id)).A)
	}
	reqBody := map[string][]int{
		"ids": idsInt,
	}
	_, response, err := r.client.Post(ctx, url, headers, reqBody)
	if err != nil {
		return nil, err
	}

	bytes, _ := json.Marshal(response)
	var infos configuration_center.GetInfoSysNameResp
	_ = json.Unmarshal(bytes, &infos)

	resp = make(map[string]string, len(infos))
	for _, info := range infos {
		resp[info.DataSourceID] = info.InfoSystemName
	}
	return resp, nil
}

func (r *CCDrivenRepo) GetInfoSysList(ctx context.Context) (infos *configuration_center.GetInfoSysListResp, err error) {
	ccAddr := settings.GetConfig().ConfigCenterHost
	url := ccAddr + "/api/configuration-center/v1/info-system"

	headers := map[string]string{
		"Content-Time": "application/json",
	}

	// 安全地获取Authorization token
	if token := ctx.Value(interception.Token); token != nil {
		if tokenStr, ok := token.(string); ok {
			headers["Authorization"] = tokenStr
		}
	}

	response, err := r.client.Get(ctx, url, headers)
	if err != nil {
		return nil, err
	}
	bytes, _ := json.Marshal(response)
	_ = json.Unmarshal(bytes, &infos)
	return infos, nil
}

func (r *CCDrivenRepo) GetUserByIds(ctx context.Context, ids string) ([]*configuration_center.GetUserByIdsResp, error) {
	ccAddr := settings.GetConfig().ConfigCenterHost
	url := ccAddr + "/api/internal/configuration-center/v1/users/" + ids

	headers := map[string]string{
		"Content-Time": "application/json",
	}

	// 安全地获取Authorization token
	if token := ctx.Value(interception.Token); token != nil {
		if tokenStr, ok := token.(string); ok {
			headers["Authorization"] = tokenStr
		}
	}

	response, err := r.client.Get(ctx, url, headers)
	if err != nil {
		return nil, err
	}

	bytes, _ := json.Marshal(response)
	var users []*configuration_center.GetUserByIdsResp
	_ = json.Unmarshal(bytes, &users)

	return users, nil
}

//根据configurationCenterInternalRouter.GET("/objects/department/:id", r.BusinessStructureApi.GetDepartmentByIdOrThirdId)，实现GetDepartmentById，格式参考configuration_center中其他方法的实现

func (r *CCDrivenRepo) GetDepartmentById(ctx context.Context, id string) (*configuration_center.GetDepartmentByIdResp, error) {
	ccAddr := settings.GetConfig().ConfigCenterHost
	url := ccAddr + "/api/internal/configuration-center/v1/objects/department/" + id

	headers := map[string]string{
		"Content-Type": "application/json",
	}

	// 安全地获取Authorization token
	if token := ctx.Value(interception.Token); token != nil {
		if tokenStr, ok := token.(string); ok {
			headers["Authorization"] = tokenStr
		}
	}

	response, err := r.client.Get(ctx, url, headers)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get department by id from cc, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	bytes, _ := json.Marshal(response)
	var department *configuration_center.GetDepartmentByIdResp
	err = json.Unmarshal(bytes, &department)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to json.Unmarshal bytes to department, err info: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	return department, nil
}
