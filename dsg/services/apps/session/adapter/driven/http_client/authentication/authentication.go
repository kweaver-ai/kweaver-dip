package authentication

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/session/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type Authentication struct {
	baseURL string
	client  *http.Client
}

func NewAuthentication(client *http.Client) Driven {
	return &Authentication{baseURL: "", client: client}
}
func (c *Authentication) SSO(ctx context.Context, accessUrl string, req *SSOReq) (*SSORes, error) {
	errorMsg := "Authentication Driven SSO "
	url := fmt.Sprintf("%s/api/authentication/v1/sso", accessUrl)
	jsonReq, err := jsoniter.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+" json.Marshal error", zap.Error(err))
		return nil, err
	}
	log.Infof(errorMsg+" req:%s \n ", string(jsonReq))

	request, _ := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonReq))
	request.Header.Set("Content-Type", "application/json")

	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, err
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, err

	}
	log.Infof(errorMsg+" body:%s \n ", body)
	if resp.StatusCode != http.StatusOK {
		return nil, errorcode.Detail(errorcode.AuthenticationDrivenSSOError, string(body))
	}

	res := SSORes{}
	if err = jsoniter.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
		return nil, err
	}
	return &res, nil
}
