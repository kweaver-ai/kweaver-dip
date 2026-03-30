package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/idrm-go-common/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type CatalogService struct {
	baseURL       string
	RawHttpClient *http.Client
}

func NewCatalogServiceCall(rawHttpClient *http.Client) data_catalog.Call {
	return &CatalogService{baseURL: settings.ConfigInstance.DepServices.CSHost, RawHttpClient: rawHttpClient}
}

var client = trace.NewOtelHttpClient()

// GetCatalogInfos 获取业务表对应的数据资源目录
func (c *CatalogService) GetCatalogInfos(ctx context.Context, catalogIds ...string) ([]*data_catalog.CatalogInfo, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}

	url := fmt.Sprintf("http://%s/api/internal/data-catalog/v1/data-catalog/brief?catalog_ids=%s", c.baseURL, strings.Join(catalogIds, ","))
	request, _ := http.NewRequest(http.MethodGet, url, nil)
	request.Header.Set("Authorization", token)
	resp, err := client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Desc(errorcode.TaskDataCatalogUrlError)
	}
	//延时关闭
	defer resp.Body.Close()

	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	log.WithContext(ctx).Info(string(body))
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.TaskDataCatalogUrlError)
		} else {
			return nil, errorcode.Desc(errorcode.TaskDataCatalogQueryError)
		}
	}
	res := make([]*data_catalog.CatalogInfo, 0)
	if err := json.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.TaskDataCatalogJsonError, err.Error())
	}
	return res, nil
}
