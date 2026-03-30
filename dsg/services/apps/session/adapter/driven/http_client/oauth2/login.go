package oauth2

import (
	"context"
	"encoding/base64"
	"errors"
	"fmt"
	"net/http"
	"net/url"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client"
	"github.com/kweaver-ai/dsg/services/apps/session/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type oauth2 struct {
	//hydraURL           string
	hydraSVCURL string
	//hydraPrivateURL    string
	hydraPrivateSVCURL string
	httpClient         http_client.HTTPClient
}

func NewOauth2(httpClient http_client.HTTPClient) DrivenOauth2 {
	return &oauth2{
		//hydraURL:           fmt.Sprintf("https://%s:%s", "10.4.132.246", "443"),
		hydraSVCURL: settings.ConfigInstance.Config.DepServices.HydraPublic,
		//hydraPrivateURL:    fmt.Sprintf("https://%s:%s", "10.4.132.246", "9080"),
		hydraPrivateSVCURL: settings.ConfigInstance.Config.DepServices.HydraAdmin,
		httpClient:         httpClient,
	}
}

func (o *oauth2) Code2Token(ctx context.Context, code string, accessUrl string) (*Code2TokenRes, error) {
	payload := fmt.Sprintf(
		"grant_type=authorization_code&"+
			"code=%s&"+
			"redirect_uri=%s",
		code,
		url.PathEscape(fmt.Sprintf("%s/af/api/session/v1/login/callback", accessUrl)))
	return o.ApplyToken(ctx, payload)
}
func (o *oauth2) RefreshToken(ctx context.Context, refreshToken string) (*Code2TokenRes, error) {
	payload := fmt.Sprintf("grant_type=refresh_token&refresh_token=%s", refreshToken)
	log.Infof("RefreshToken payload %v", payload)
	return o.ApplyToken(ctx, payload)
}
func (o *oauth2) ApplyToken(ctx context.Context, payload string) (*Code2TokenRes, error) {

	//	log.Infof("Code2Token body %v", payload)
	respCode, respParam, err := o.httpClient.Post(ctx, fmt.Sprintf("%s/oauth2/token", o.hydraSVCURL), o.getHeader(), []byte(payload))
	if err != nil {
		log.WithContext(ctx).Error("code2Token httpClient Post", zap.Error(err))
		return nil, err
	}
	if respCode != http.StatusOK {
		log.WithContext(ctx).Error("code2Token httpClient Post", zap.Error(errors.New("respCode not ok")))
		return nil, errors.New("respCode not ok")
	}
	//log.Infof("code:%v,param:%v", respCode, respParam)
	return &Code2TokenRes{
		AccessToken:  respParam.(map[string]interface{})["access_token"].(string),
		IdToken:      respParam.(map[string]interface{})["id_token"].(string),
		ExpiresIn:    respParam.(map[string]interface{})["expires_in"].(float64),
		RefreshToken: respParam.(map[string]interface{})["refresh_token"].(string),
		TokenType:    respParam.(map[string]interface{})["token_type"].(string),
		Scope:        respParam.(map[string]interface{})["scope"].(string),
	}, nil
}
func (o *oauth2) Code2TokenRaw(code string) (*Code2TokenRes, error) {
	/*	payload := strings.NewReader(
			fmt.Sprintf(
				"grant_type=authorization_code&"+
					"code=%s"+
					"redirect_uri=%s",
				code,
				url.PathEscape("https://10.4.132.246:443/api/session/v1/login/callback")))
		req, err := http.NewRequest("POST",
			fmt.Sprintf("%s/oauth2/token", o.hydraURL),
			payload)
		if err != nil {
			log.WithContext(ctx).Error("code2TokenRaw NewRequest ", zap.Error(err))
			return nil, err
		}
		req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
		req.Header.Set("Cache-Control", "no-cache")
		req.SetBasicAuth(settings.ConfigInstance.Config.Oauth.OauthClientID, settings.ConfigInstance.Config.Oauth.OauthClientSecret)
		resp, err := o.rawHttpClient.Do(req)
		if err != nil {
			log.WithContext(ctx).Error("code2TokenRaw Do ", zap.Error(err))
			return nil, err
		}
		defer resp.Body.Close()
		body, err := ioutil.ReadAll(resp.Body)
		if (resp.StatusCode < http.StatusOK) || (resp.StatusCode >= http.StatusMultipleChoices) {
			log.WithContext(ctx).Error("code2TokenRaw body ReadAll ", zap.String("body", string(body)))
			return nil, errors.New(string(body))
		}
		respParam := make(map[string]interface{})
		err = jsoniter.Unmarshal(body, &respParam)
		if err != nil {
			log.WithContext(ctx).Error("code2TokenRaw jsoniter.Unmarshal respParam", zap.Error(err))
			return nil, err
		}
		return &Code2TokenRes{
			AccessToken:  respParam["access_token"].(string),
			IdToken:      respParam["id_token"].(string),
			ExpiresIn:    respParam["expires_in"].(float64),
			RefreshToken: respParam["refresh_token"].(string),
			TokenType:    respParam["token_type"].(string),
			Scope:        respParam["scope"].(string),
		}, nil*/
	return nil, nil
}

func (o *oauth2) Token2Userid(ctx context.Context, accessToken string) (string, error) {
	/*	bodyInfo := map[string]interface{}{
		"token": accessToken,
	}*/
	payload := fmt.Sprintf("token=%s", accessToken)
	respCode, respParam, err := o.httpClient.Post(ctx, fmt.Sprintf("%s/oauth2/introspect", o.hydraPrivateSVCURL), o.getHeader(), []byte(payload))
	if err != nil {
		log.WithContext(ctx).Error("token2Userid httpClient Post", zap.Error(err))
		return "", err
	}
	if respCode != http.StatusOK {
		log.WithContext(ctx).Error("token2Userid httpClient Post", zap.Error(errors.New("respCode not ok")))
		return "", errors.New("respCode not ok")
	}
	return respParam.(map[string]interface{})["sub"].(string), nil
}

func (o *oauth2) encodeAuthorization() string {
	urlComponent := fmt.Sprintf("%s:%s", url.PathEscape(settings.ConfigInstance.Config.Oauth.OauthClientID), url.PathEscape(settings.ConfigInstance.Config.Oauth.OauthClientSecret))
	//log.Infof("urlComponent：%s", urlComponent)
	auth := fmt.Sprintf("Basic %s", base64.StdEncoding.EncodeToString([]byte(urlComponent)))
	//log.Infof("auth：%s", auth)
	return auth
}
func (o *oauth2) getHeader() map[string]string {
	return map[string]string{
		"cache-control": "no-cache",
		"Content-Type":  "application/x-www-form-urlencoded",
		"Authorization": o.encodeAuthorization(),
	}
}
