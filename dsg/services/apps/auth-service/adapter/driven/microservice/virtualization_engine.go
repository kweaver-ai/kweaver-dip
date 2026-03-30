package microservice

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"path"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/rest/ginx"
)

// VirtualizationEngineRepo 定义虚拟化引擎接口
type VirtualizationEngineRepo interface {
	// 获取逻辑视图的数据，与逻辑视图、行列规则授权无关
	Fetch(ctx context.Context, sql string) (*dto.VirtualizationEngineViewData, error)
}

type virtualizationEngineRepo struct {
	// API Endpoint
	base *url.URL
	// HTTP Client
	client *http.Client
}

func NewVirtualizationEngineRepo(c *http.Client) (VirtualizationEngineRepo, error) {
	base, err := url.Parse(settings.Instance.Services.VirtualEngine)
	if err != nil {
		return nil, err
	}
	base.Path = path.Join(base.Path, "api", "virtual_engine_service", "v1")
	return &virtualizationEngineRepo{
		base:   base,
		client: c,
	}, nil
}

// Fetch implements VirtualizationEngineRepo.
func (r *virtualizationEngineRepo) Fetch(ctx context.Context, sql string) (*dto.VirtualizationEngineViewData, error) {
	base := *r.base
	base.Path = path.Join(base.Path, "fetch")

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, base.String(), bytes.NewBufferString(sql))
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("create http request fail: %v", err))
	}

	// 虚拟化引擎需要 Header "X-Presto-User"，但不关心具体的值
	req.Header.Set("X-Presto-User", "admin")

	resp, err := r.client.Do(req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, fmt.Sprintf("send http request fail: %v", err))
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		// 结构化错误
		var he ginx.HttpError
		if err := json.Unmarshal(responseBody, &he); err != nil {
			// 服务端返回的时非结构化错误
			return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
				"status": resp.Status,
				"body":   responseBody,
			})
		}
		return nil, ConvertUpstreamError(&he)
	}

	var data dto.VirtualizationEngineViewData
	if err := json.Unmarshal(responseBody, &data); err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, map[string]any{
			"message": fmt.Sprintf("unmarshal response body to %T fail", data),
			"error":   err.Error(),
		})
	}

	return &data, nil
}

var _ VirtualizationEngineRepo = &virtualizationEngineRepo{}
