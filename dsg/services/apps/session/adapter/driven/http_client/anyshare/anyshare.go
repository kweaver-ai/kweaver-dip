package anyshare

import (
	"context"
	"fmt"
	"io/ioutil"
	"net/http"
	"os"
	"strings"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type Anyshare struct {
	baseURL string
	client  *http.Client
}

func NewAnyshare(client *http.Client) DrivenAnyshare {
	return &Anyshare{baseURL: os.Getenv("ANYSHARE_HOST"), client: client}
}

func (c *Anyshare) CheckAnyshareHostValid() bool {
	return len(c.baseURL) > 0
}

func (c *Anyshare) GetUserInfoByASToken(ctx context.Context, asToken string) (bool, *UserInfo, error) {
	target := fmt.Sprintf("%s/api/eacp/v1/user/get", c.baseURL)
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, target, http.NoBody)
	if err != nil {
		log.WithContext(ctx).Error("GetUserInfoByASToken new req failed", zap.Error(err), zap.String("url", target))
		return false, nil, err
	}

	if !strings.HasPrefix(strings.ToLower(asToken), "bearer ") {
		asToken = "Bearer " + asToken
	}
	req.Header.Add("Authorization", asToken)
	resp, err := c.client.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("GetUserInfoByASToken do req failed", zap.Error(err), zap.String("url", target))
		return false, nil, err
	}

	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.WithContext(ctx).Error("http resp body close", zap.Error(closeErr))

		}
	}()
	resBody, err := ioutil.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error("GetUserInfoByASToken read resp body failed", zap.Error(err), zap.String("url", target))
		return false, nil, err
	}

	if resp.StatusCode != http.StatusOK {
		isTokenExpiredOrInvalid := false
		httpErr := http_client.HTTPError{}
		err = jsoniter.Unmarshal(resBody, &httpErr)
		if err != nil {
			// Unmarshal失败时转成内部错误, body为空Unmarshal失败
			err = fmt.Errorf("code:%v,header:%v,body:%v", resp.StatusCode, resp.Header, string(resBody))
		} else {
			// code为401001001时token已过期或无效
			if httpErr.Code == 401001001 {
				isTokenExpiredOrInvalid = true
			}
			err = http_client.ExHTTPError{
				Body:   resBody,
				Status: resp.StatusCode,
			}
		}
		log.WithContext(ctx).Error("GetUserInfoByASToken do req failed", zap.Error(err), zap.String("url", target))
		return isTokenExpiredOrInvalid, nil, err
	}

	r := new(UserInfo)
	err = jsoniter.Unmarshal(resBody, r)
	if err != nil {
		log.WithContext(ctx).Error("GetUserInfoByASToken unmarshal resp body failed", zap.Error(err), zap.String("url", target))
		return false, nil, err
	}

	return false, r, nil
}
