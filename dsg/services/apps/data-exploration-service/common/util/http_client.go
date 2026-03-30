package util

import (
	"bytes"
	"crypto/tls"
	"encoding/base64"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/pkg/errors"
	"go.uber.org/zap"
)

var client *http.Client = &http.Client{
	CheckRedirect: func(req *http.Request, via []*http.Request) error {
		return http.ErrUseLastResponse
	},
	Transport: &http.Transport{
		TLSClientConfig:       &tls.Config{InsecureSkipVerify: true},
		MaxIdleConnsPerHost:   100,
		MaxIdleConns:          100,
		IdleConnTimeout:       90 * time.Second,
		TLSHandshakeTimeout:   10 * time.Second,
		ExpectContinueTimeout: 1 * time.Second,
	},
	Timeout: 10 * time.Second,
}

func DoHttpGet(strUrl string, header http.Header, vals url.Values) ([]byte, error) {
	if vals != nil {
		strUrl = fmt.Sprintf("%s?%s", strUrl, vals.Encode())
	}

	req, err := http.NewRequest(http.MethodGet, strUrl, nil)
	if err != nil {
		return nil, err
	}

	if header != nil {
		req.Header = header
	}

	resp, err := client.Do(req)
	if err != nil {
		return nil, err
	}

	var buf []byte
	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.Error("DoHttpGet", zap.Error(closeErr))

		}
	}()
	buf, err = io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, errors.New(BytesToString(buf))
	}

	return buf, nil
}

func DoHttpPost(strUrl string, header http.Header, body io.Reader) ([]byte, error) {
	return doHttp(http.MethodPost, strUrl, header, nil, body)
}

func doHttp(method, strUrl string, header http.Header, vals url.Values, body io.Reader) ([]byte, error) {
	statusCode, buf, err := getResponse(method, strUrl, header, vals, body)
	if err != nil {
		return nil, err
	}

	if statusCode != http.StatusOK {
		if statusCode == http.StatusCreated {
			return buf, nil
		}
		return nil, errors.New(BytesToString(buf))
	}

	return buf, nil
}

func getResponse(method, strUrl string, header http.Header, vals url.Values, body io.Reader) (int, []byte, error) {
	if vals != nil {
		strUrl = fmt.Sprintf("%s?%s", strUrl, vals.Encode())
	}

	req, err := http.NewRequest(method, strUrl, body)
	if err != nil {
		return 0, nil, err
	}

	if header != nil {
		req.Header = header
	}

	resp, err := client.Do(req)
	if err != nil {
		return 0, nil, err
	}

	var buf []byte
	defer func() {
		closeErr := resp.Body.Close()
		if closeErr != nil {
			log.Error("DoHttp"+method, zap.Error(closeErr))

		}
	}()
	buf, err = io.ReadAll(resp.Body)
	if err != nil {
		return 0, nil, err
	}

	return resp.StatusCode, buf, nil
}

func GetClientInfo() (string, string, error) {
	params := map[string]any{
		"client_name":    "client",
		"grant_types":    []string{"client_credentials"},
		"response_types": []string{"token"},
		"scope":          "all",
	}
	buf, err := json.Marshal(params)
	if err != nil {
		log.Errorf("Marshal failed. err: %v", err)
		return "", "", err
	}

	buf, err = DoHttpPost(settings.GetConfig().OAuth.HydraAdmin+"/admin/clients", nil, bytes.NewReader(buf))
	if err != nil {
		log.Errorf("failed to get client_id, err: %v", err)
		return "", "", err
	}

	var clientInfo struct {
		ClientID     string `json:"client_id"`
		ClientSecret string `json:"client_secret"`
	}
	if err = json.Unmarshal(buf, &clientInfo); err != nil {
		log.Errorf("Unmarshal failed. err: %v", err)
		return "", "", err
	}
	return clientInfo.ClientID, clientInfo.ClientSecret, nil
}

func RequestToken(clientID, clientSecret string) (string, error) {
	info := clientID + ":" + clientSecret
	base64 := "Basic " + base64.StdEncoding.EncodeToString([]byte(info))
	header := http.Header{
		"Authorization": []string{base64},
		"Content-Type":  []string{"application/x-www-form-urlencoded"}}
	params := "grant_type=client_credentials&scope=all"
	buf, err := DoHttpPost(settings.GetConfig().OAuth.HydraPublic+"/oauth2/token", header, bytes.NewReader([]byte(params)))
	if err != nil {
		log.Errorf("failed to get token err: %v", err)
		return "", err
	}
	var resp struct {
		AccessToken string `json:"access_token"`
	}
	if err = json.Unmarshal(buf, &resp); err != nil {
		log.Errorf("Unmarshal failed. err: %v", err)
		return "", err
	}
	return resp.AccessToken, err
}
