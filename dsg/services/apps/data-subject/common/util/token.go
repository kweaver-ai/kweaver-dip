package util

import (
	"bytes"
	"context"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"net/http"

	my_config "github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func GetToken(ctx context.Context, conf *my_config.Bootstrap) (string, error) {
	clientID, clientSecret, err := getClientInfo(ctx, conf)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to getClientInfo, err: %v", err)
		return "", err
	}
	token, err := RequestToken(ctx, conf, clientID, clientSecret)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to RequestToken, err: %v", err)
		return "", err
	}
	return token, nil
}

func RequestToken(ctx context.Context, conf *my_config.Bootstrap, clientID, clientSecret string) (string, error) {
	info := clientID + ":" + clientSecret
	base64 := "Basic " + base64.StdEncoding.EncodeToString([]byte(info))
	header := http.Header{
		"Authorization": []string{base64},
		"Content-Type":  []string{"application/x-www-form-urlencoded"}}
	params := "grant_type=client_credentials&scope=all"

	buf, err := DoHttpPost(ctx, "http://hydra-public:4444/oauth2/token", header, bytes.NewReader([]byte(params)))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get token err: %v", err)
		return "", err
	}
	var resp struct {
		AccessToken string `json:"access_token"`
	}
	if err = json.Unmarshal(buf, &resp); err != nil {
		log.WithContext(ctx).Errorf("Unmarshal failed. err: %v", err)
		return "", err
	}
	return resp.AccessToken, err
}

func getClientInfo(ctx context.Context, conf *my_config.Bootstrap) (string, string, error) {
	clientID, clientSecret, err := GetClientInfo(ctx, conf)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to getClientInfo, err: %v", err)
		return "", "", err
	}
	return clientID, clientSecret, err
}

func GetClientInfo(ctx context.Context, conf *my_config.Bootstrap) (string, string, error) {
	params := map[string]any{
		"client_name":    "client",
		"grant_types":    []string{"client_credentials"},
		"response_types": []string{"token"},
		"scope":          "all",
	}
	buf, err := json.Marshal(params)
	if err != nil {
		log.WithContext(ctx).Errorf("Marshal failed. err: %v", err)
		return "", "", err
	}

	buf, err = DoHttpPost(ctx, fmt.Sprintf("http://%s/admin/clients", conf.DepServices.HydraAdmin), nil, bytes.NewReader(buf))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get client_id, err: %v", err)
		return "", "", err
	}

	var clientInfo struct {
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
	}
	if err = json.Unmarshal(buf, &clientInfo); err != nil {
		log.WithContext(ctx).Errorf("Unmarshal failed. err: %v", err)
		return "", "", err
	}
	return clientInfo.ClientID, clientInfo.ClientSecret, nil
}
