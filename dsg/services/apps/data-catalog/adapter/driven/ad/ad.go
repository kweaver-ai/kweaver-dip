package ad

import (
	"bytes"
	"context"
	"crypto/hmac"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io/ioutil"
	"net/http"
	"strconv"
	"strings"
	"sync"
	"sync/atomic"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type AD interface {
	Services(ctx context.Context, serviceId string, content any) (*CustomSearchResp, error)
}

const (
	accountTypeEmail    = "email"
	accountTypeUsername = "username"
)

type ad struct {
	baseUrl     string
	accountType string
	user        string
	password    string

	httpClient *http.Client
	mtx        sync.Mutex
	appIdCache atomic.Value
}

func NewAD(httpClient *http.Client) AD {
	cfg := settings.GetConfig().AnyDataConf
	return &ad{
		baseUrl:     cfg.URL,
		accountType: cfg.AccountType,
		user:        cfg.User,
		password:    cfg.Password,
		httpClient:  httpClient,
	}
}

func (a *ad) appId(ctx context.Context) (string, error) {
	url := a.baseUrl + "/api/rbac/v1/user/appId"
	body := map[string]any{
		"isRefresh": 0,
		"password":  a.password,
	}
	switch a.accountType {
	case accountTypeEmail:
		body["email"] = a.user

	case accountTypeUsername:
		body["username"] = a.user

	default:
		log.WithContext(ctx).Errorf("unsupported ad account type: %s", a.accountType)
		return "", fmt.Errorf("unsupported account type: %s", a.accountType)
	}

	b, err := json.Marshal(body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to marshal body, body: %v, err: %v", body, err)
		return "", fmt.Errorf("failed to json.Marshal body, body: %v, err: %w", body, err)
	}
	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, bytes.NewReader(b))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to build appid req, err: %v", err)
		return "", errorcode.Detail(errorcode.PublicInternalError, err)
	}
	req.Header.Add("type", a.accountType)
	resp, err := a.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get appid from ad, err: %v", err)
		return "", errorcode.Detail(errorcode.PublicInternalError, err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post ad, url: %s, err: %v", req.URL.String(), err)
		return "", errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.WithContext(ctx).Errorf("failed to send req in post ad, url: %s, resp: %s", req.URL.String(), b)
		return "", errorcode.Detail(errorcode.PublicInternalError, string(b))
	}
	if resp.StatusCode >= http.StatusBadRequest {
		log.WithContext(ctx).Errorf("failed to send req in post ad, url: %s, resp: %s", req.URL.String(), b)
		return "", errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	ret := make(map[string]string)
	if err = json.Unmarshal(b, &ret); err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post ad, url: %s, err: %v", req.URL.String(), err)
		return "", errorcode.Detail(errorcode.PublicInternalError, err)
	}

	return ret["res"], nil
}

func (a *ad) getAppId(ctx context.Context) (string, error) {
	val := a.appIdCache.Load()
	if val != nil {
		return val.(string), nil
	}

	a.mtx.Lock()
	defer a.mtx.Unlock()

	val = a.appIdCache.Load()
	if val != nil {
		return val.(string), nil
	}

	appId, err := a.appId(ctx)
	if err != nil {
		return "", err
	}

	a.appIdCache.Store(appId)
	return appId, nil
}

func (a *ad) getAppKey(reqParams, timestamp, appid string) string {
	hmacInst := hmac.New(sha256.New, []byte(appid))
	sha := sha256.New()
	sha.Write([]byte(timestamp))
	timestamp16str := hex.EncodeToString(sha.Sum(nil))
	sha.Reset()
	sha.Write([]byte(reqParams))
	reqParams16str := hex.EncodeToString(sha.Sum(nil))
	hmacInst.Write([]byte(timestamp16str))
	hmacInst.Write([]byte(reqParams16str))
	return base64.StdEncoding.EncodeToString([]byte(hex.EncodeToString(hmacInst.Sum(nil))))
}

type CustomSearchResp struct {
	Res []struct {
		VerticesParsedList []struct {
			Vid        string   `json:"vid"`
			Tags       []string `json:"tags"`
			Properties []struct {
				Tag   string `json:"tag"`
				Props []struct {
					Name  string `json:"name"`
					Alias string `json:"alias"`
					Value string `json:"value"`
					Type  string `json:"type"`
				} `json:"props"`
			} `json:"properties"`
			Type            string `json:"type"`
			Color           string `json:"color"`
			Alias           string `json:"alias"`
			DefaultProperty struct {
				N string `json:"n"`
				A string `json:"a"`
				V string `json:"v"`
			} `json:"default_property"`
			Icon string `json:"icon"`
		} `json:"vertices_parsed_list"`
		Statement string `json:"statement"`
	} `json:"res"`
}

func (a *ad) Services(ctx context.Context, serviceId string, content any) (*CustomSearchResp, error) {
	url := a.baseUrl + "/api/cognitive-service/v1/open/custom-search/services/" + serviceId
	b, _ := json.Marshal(content)
	body := string(b)
	appId, err := a.getAppId(ctx)
	if err != nil {
		return nil, err
	}
	timestamp := strconv.FormatInt(time.Now().Unix(), 10)
	appKey := a.getAppKey(body, timestamp, appId)

	req, err := http.NewRequestWithContext(ctx, http.MethodPost, url, strings.NewReader(body))
	if err != nil {
		log.WithContext(ctx).Errorf("failed to build services req, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	req.Header.Set("appid", appId)
	req.Header.Set("timestamp", timestamp)
	req.Header.Set("appkey", appKey)

	resp, err := a.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to request services from ad, err: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	defer func() {
		_ = resp.Body.Close()
	}()

	b, err = ioutil.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post ad, url: %s, err: %v", req.URL.String(), err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	if resp.StatusCode >= http.StatusInternalServerError {
		log.WithContext(ctx).Errorf("failed to send req in post ad, url: %s, resp: %s", req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}
	if resp.StatusCode >= http.StatusBadRequest {
		log.WithContext(ctx).Errorf("failed to send req in post ad, url: %s, resp: %s", req.URL.String(), b)
		return nil, errorcode.Detail(errorcode.PublicInternalError, string(b))
	}

	var ret CustomSearchResp
	if err = json.Unmarshal(b, &ret); err != nil {
		log.WithContext(ctx).Errorf("failed to read resp data in post ad, url: %s, err: %v", req.URL.String(), err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	return &ret, nil
}
