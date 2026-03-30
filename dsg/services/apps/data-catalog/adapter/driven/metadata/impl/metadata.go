package impl

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/metadata"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"

	"fmt"
)

type MetadataRepo struct {
	client httpclient.HTTPClient
}

func NewMetadataRepo(client httpclient.HTTPClient) metadata.Repo {
	return &MetadataRepo{client: client}
}

func (r *MetadataRepo) GetDataSource(ctx context.Context, dataSourceID string) (*metadata.DataSourceInfo, error) {

	url := fmt.Sprintf("%s/api/metadata-manage/v1/datasource/%s", settings.GetConfig().MetaDataMgmHost, dataSourceID)

	//headers := map[string]string{
	//	"Content-Time":  "application/json",
	//	"Authorization": ctx.Value(interception.Token).(string),
	//}

	response, err := r.client.Get(ctx, url, nil)
	if err != nil {
		return nil, err
	}

	resp := metadata.GetDataSourceResp{}
	bytes, _ := json.Marshal(response)
	_ = json.Unmarshal(bytes, &resp)
	return resp.Data, nil

}

func (r *MetadataRepo) GetTableFieldsList(ctx context.Context, req []*metadata.GetTableFieldsListReq) (*metadata.GetTableFieldsListResp, error) {
	url := fmt.Sprintf("%s/api/metadata-manage/v1/datasource/table/list", settings.GetConfig().MetaDataMgmHost)
	headers := map[string]string{
		"Content-Time": "application/json",
	}
	_, response, err := r.client.Post(ctx, url, headers, req)
	if err != nil {
		return nil, err
	}

	resp := &metadata.GetTableFieldsListResp{}
	bytes, _ := json.Marshal(response)
	_ = json.Unmarshal(bytes, &resp)
	return resp, nil
}
