package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"errors"
	"io"
	"net/http"
	"net/url"
	"path"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/configuration_center"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Client struct {
	// API endpoint
	base *url.URL
	host string

	// HTTP Client
	client *http.Client
}

var _ configuration_center.ConfigurationCenterDrivenNG = &Client{}

// NewConfigurationCenterDrivenNG 创建 configuration-center 客户，创建失败则 panic。
func NewConfigurationCenterDrivenNG(bootstrap *config.Bootstrap, httpClient *http.Client) configuration_center.ConfigurationCenterDrivenNG {
	cfg := &Config{Host: bootstrap.DepServices.ConfigurationCenterHost}
	client, err := NewClientWithHTTPClient(cfg, httpClient)
	if err != nil {
		panic(err)
	}
	return client
}

// NewClient 创建 configuration-center 客户端
func NewClient(cfg *Config) (*Client, error) {
	httpClient, err := NewHTTPClient(cfg)
	if err != nil {
		return nil, err
	}
	return NewClientWithHTTPClient(cfg, httpClient)
}

const defaultAPIPath = "/api/configuration-center/v1"

// NewClientWithHTTPClient 创建使用指定 http.Client 的 configuration-center 客户端
func NewClientWithHTTPClient(cfg *Config, client *http.Client) (*Client, error) {
	base, err := url.Parse(cfg.Host)
	if err != nil {
		return nil, err
	}

	base.Path = cfg.APIPath
	if base.Path == "" {
		base.Path = defaultAPIPath
	}

	return &Client{
		base:   base,
		host:   cfg.Host,
		client: client,
	}, nil
}

// NewHTTPClient 创建 http.Client
func NewHTTPClient(cfg *Config) (*http.Client, error) {
	tr, err := NewRoundTripper(cfg)
	if err != nil {
		return nil, err
	}

	return &http.Client{Transport: tr}, nil
}

type GenerateRequest struct {
	Count int `json:"count,omitempty"`
}

// Generate implements configuration_center.ConfigurationCenterDrivenNG.
func (c *Client) Generate(ctx context.Context, id uuid.UUID, count int) (*configuration_center.CodeList, error) {
	if count == 0 {
		return &configuration_center.CodeList{TotalCount: 0}, nil
	}

	list, err := c.generate(ctx, id, count)
	return list, WrapError(my_errorcode.CodeGenerationFailure, err)
}

// generate 返回非结构化的错误
func (c *Client) generate(ctx context.Context, id uuid.UUID, count int) (*configuration_center.CodeList, error) {
	log := log.WithContext(ctx)

	gr := &GenerateRequest{Count: count}
	requestBodyJSON, err := json.Marshal(gr)
	if err != nil {
		return nil, err
	}
	url := c.host + "/api/internal/configuration-center/v1/code-generation-rules/" + id.String() + "/generation"
	log.Info("request", zap.ByteString("body", requestBodyJSON), zap.String("url", url))
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(requestBodyJSON))
	if err != nil {
		return nil, err
	}

	// 设置认证信息
	req.Header.Set("Authorization", util.ObtainToken(ctx))

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	responseBodyJSON, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	log.Info("response", zap.Int("statusCode", resp.StatusCode), zap.ByteString("body", responseBodyJSON))

	switch resp.StatusCode {
	case http.StatusOK:
		list := &configuration_center.CodeList{}
		if err := json.Unmarshal(responseBodyJSON, list); err != nil {
			return nil, err
		}
		return list, nil
	default:
		var re ResponseError
		if err := json.Unmarshal(responseBodyJSON, &re); err != nil || re.Code == "" {
			return nil, errors.New(string(responseBodyJSON))
		}
		return nil, &re
	}
}

// 获取业务更新时间黑名单
func (c *Client) GetTimestampBlacklist(ctx context.Context) ([]string, error) {
	log := log.WithContext(ctx)
	var u url.URL = *c.base
	u.Path = path.Join(u.Path, "timestamp-blacklist")
	u.Path = strings.Replace(u.Path, "/configuration-center/", "/internal/configuration-center/", -1)
	req, err := http.NewRequestWithContext(ctx, http.MethodGet, u.String(), nil)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.GetTimestampBlacklistError, err.Error())
	}

	resp, err := c.client.Do(req)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.GetTimestampBlacklistError, err.Error())
	}
	defer resp.Body.Close()

	responseBody, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.GetTimestampBlacklistError, err.Error())
	}

	log.Info("response", zap.Int("statusCode", resp.StatusCode), zap.ByteString("body", responseBody))

	switch resp.StatusCode {
	case http.StatusOK:
		var list []string
		if err := json.Unmarshal(responseBody, &list); err != nil {
			return nil, errorcode.Detail(my_errorcode.GetTimestampBlacklistError, err.Error())
		}
		return list, nil
	default:
		var re ResponseError
		if err := json.Unmarshal(responseBody, &re); err != nil || re.Code == "" {
			return nil, errors.New(string(responseBody))
		}
		return nil, errorcode.Detail(my_errorcode.GetTimestampBlacklistError, &re)
	}
}