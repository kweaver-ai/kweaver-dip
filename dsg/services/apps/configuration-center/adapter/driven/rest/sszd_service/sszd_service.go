package sszd_service

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"go.uber.org/zap"
)

var (
	d *driven
)

type driven struct {
	httpClient *http.Client
}

func NewSszdService(httpClient *http.Client) SszdService {
	return &driven{
		httpClient: httpClient,
	}
}

func (d *driven) CreateProvinceApp(ctx context.Context, appReq *AppReq) (appResp *CreateProvinceAppResp, err error) {
	errorMsg := "SszdServiceDriven CreateProvinceApp"
	// url := fmt.Sprintf("http://%s/api/sszd-service/v1/province-app", settings.ConfigInstance.Config.DepServices.BusinessGroomingHost)
	url := fmt.Sprintf("http://%s/api/internal/sszd-service/v1/province-app", "sszd-service:8280")

	jsonReq, err := jsoniter.Marshal(appReq)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
	}
	log.Infof("url:%s \n %+v", url, string(jsonReq))

	req, err := http.NewRequest(http.MethodPost, url, bytes.NewReader(jsonReq))
	// req.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	if err != nil {
		return nil, err
	}
	resp, err := d.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("CreateProvinceApp failed", zap.Error(err), zap.String("url", url))
		return nil, err
	}

	// 延时关闭
	defer resp.Body.Close()

	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf(errorMsg+"io.ReadAll error, %v", err)
		return nil, errorcode.Detail(errorcode.EscalateError, err)
	}
	if resp.StatusCode == http.StatusOK {
		appResp = &CreateProvinceAppResp{}
		err = jsoniter.Unmarshal(body, appResp)
		if err != nil {
			log.WithContext(ctx).Error("CreateProvinceAppGet", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.EscalateError, err.Error())
		}
		return appResp, nil
	} else {
		log.Error(errorMsg+"http status error", zap.String("status", resp.Status))
		log.Error(errorMsg+"http body error", zap.String("body", util.BytesToString(body)))
		return nil, errorcode.Detail(my_errorcode.EscalateError, util.BytesToString(body))
	}
}

func (d *driven) UpdateProvinceApp(ctx context.Context, id uint64, appReq *AppReq) (appResp *IDResp, err error) {
	errorMsg := "SszdServiceDriven UpdateProvinceApp"
	// url := fmt.Sprintf("http://%s/api/sszd-service/v1/province-app", settings.ConfigInstance.Config.DepServices.BusinessGroomingHost)
	url := fmt.Sprintf("http://%s/api/internal/sszd-service/v1/province-app/%d", "sszd-service:8280", id)

	jsonReq, err := jsoniter.Marshal(appReq)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DrivenCreateDataSourceFailed, err.Error())
	}
	log.Infof("url:%s \n %+v", url, string(jsonReq))

	req, err := http.NewRequest(http.MethodPut, url, bytes.NewReader(jsonReq))
	// req.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	// req.Header.Set("Authorization", aa)

	if err != nil {
		return nil, err
	}
	resp, err := d.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("CheckMainBusinessRepeat failed", zap.Error(err), zap.String("url", url))
		return nil, err
	}

	// 延时关闭
	defer resp.Body.Close()

	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Errorf(errorMsg+"io.ReadAll error, %v", err)
		return nil, errorcode.Detail(errorcode.EscalateError, err)
	}

	if resp.StatusCode == http.StatusOK {
		appResp = &IDResp{}
		err = jsoniter.Unmarshal(body, appResp)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg, zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.EscalateError, err.Error())
		}
		return appResp, nil
	} else {
		log.Error(errorMsg+"http status error", zap.String("status", resp.Status))
		log.Error(errorMsg+"http body error", zap.String("body", util.BytesToString(body)))
		return nil, errorcode.Detail(my_errorcode.EscalateError, util.BytesToString(body))
	}
}

func (d *driven) GetProvinceAppByID(ctx context.Context, id uint64) (*AppInfo, error) {
	errorMsg := "SszdServiceDriven GetProvinceAppByID"
	// url := fmt.Sprintf("http://%s/api/sszd-service/v1/province-app", settings.ConfigInstance.Config.DepServices.BusinessGroomingHost)
	url := fmt.Sprintf("http://%s/api/sszd-service/v1/province-app/%d", "sszd-service:8280", id)
	req, err := http.NewRequest(http.MethodGet, url, nil)
	req.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	if err != nil {
		return nil, err
	}
	resp, err := d.httpClient.Do(req)
	if err != nil {
		log.WithContext(ctx).Error("CheckMainBusinessRepeat failed", zap.Error(err), zap.String("url", url))
		return nil, err
	}

	// 延时关闭
	defer resp.Body.Close()

	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	fmt.Println(body)

	if resp.StatusCode == http.StatusOK {
		appResp := &AppInfo{}
		err = jsoniter.Unmarshal(body, appResp)
		if err != nil {
			log.WithContext(ctx).Error("ProcessDefinitionGet", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.WorkflowGETProcessError, err.Error())
		}

		return appResp, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.WorkflowGETProcessError, err.Error())
				// return nil, errorcode.Detail(errorcode.GetDataViewDetailsError, err.Error())
			}
			// log.Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			// return nil, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
			return nil, errorcode.Detail(my_errorcode.WorkflowGETProcessError, err.Error())
		} else {
			log.Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return nil, errorcode.Detail(my_errorcode.WorkflowGETProcessError, err.Error())
			// return nil, errorcode.Desc(errorcode.GetDataViewDetailsError, errors.New("http status error: "+resp.Status))
		}
	}
}
