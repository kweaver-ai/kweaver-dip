package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

const (
	//GetRemoteDomainInfoURL http://127.0.0.1:8123/api/business-grooming/v1/business-domain/10
	GetRemoteDomainInfoURL = "http://%s/api/business-grooming/v1/domain/nodes/%v"

	GetRemoteDomainInfosURL = "http://%s/api/internal/business-grooming/v1/domain/nodes?id=%s"

	//GetRemoteBusinessModelInfoURL http://127.0.0.1:8123/api/business-grooming/v1/main-businesses/10
	GetRemoteBusinessModelInfoURL = "http://%s/api/business-grooming/v1/business-models/%s"

	//QueryFormWithModelURL http://127.0.0.1:8123/api/business-grooming/v1/internal/relation/data/check
	QueryFormWithModelURL = "http://%s/api/business-grooming/v1/internal/business-model/%s/forms?form_ids=%s"

	GetBusinessIndicatorURL = "http://%s/api/business-grooming/v1/business-indicator/%s"

	GetRemoteDomainTaskInfoURL = "http://%s/api/business-grooming/v1/domain/task/%v"
	GetRemoteProcessInfoURL    = "http://%s/api/business-grooming/v1/domain/nodes/process"

	GetRemoteDiagnosisInfoURL = "http://%s/api/business-grooming/v1/business-diagnosis"

	GetRemoteModelInfoURL = "http://%s/api/internal/business-grooming/v1/domain/nodes/%s"

	UpdateBusinessDiagnosisTaskStausURL = "http://%s/api/internal/business-grooming/v1/business-diagnosis/task/%s/status"
)

type BusinessGroomingCall struct {
	client  *http.Client
	baseURL string
}

func NewBusinessGroomingCall(client *http.Client) business_grooming.Call {
	return &BusinessGroomingCall{
		client:  client,
		baseURL: settings.ConfigInstance.DepServices.BGHost,
	}
}

func (b *BusinessGroomingCall) GetRemoteDomainInfo(ctx context.Context, domainId string) (*business_grooming.BusinessDomainInfo, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	//发起请求
	urlStr := fmt.Sprintf(GetRemoteDomainInfoURL, b.baseURL, domainId)
	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request = request.WithContext(ctx)
	request.Header.Set("Authorization", token)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectGroomingUrlError, err.Error())
	}
	defer resp.Body.Close()
	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	//根据状态码判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return new(business_grooming.BusinessDomainInfo), errorcode.Desc(errorcode.TaskDomainNotExist)
		}
	}
	// 把请求到的数据Unmarshal到res中
	res := new(business_grooming.BusinessDomainInfo)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func (b *BusinessGroomingCall) GetRemoteDomainInfos(ctx context.Context, domainIds ...string) ([]*business_grooming.BusinessDomainInfo, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	//发起请求
	urlStr := fmt.Sprintf(GetRemoteDomainInfosURL, b.baseURL, strings.Join(domainIds, ","))
	fmt.Println(urlStr)

	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request = request.WithContext(ctx)
	request.Header.Set("Authorization", token)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectGroomingUrlError, err.Error())
	}
	defer resp.Body.Close()
	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	//根据状态码判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return []*business_grooming.BusinessDomainInfo{}, errorcode.Desc(errorcode.TaskDomainNotExist)
		}
	}
	// 把请求到的数据Unmarshal到res中
	res := make([]*business_grooming.BusinessDomainInfo, 0)
	if err = json.Unmarshal(body, &res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func (b *BusinessGroomingCall) GetRemoteBusinessModelInfo(ctx context.Context, businessModelId string) (*business_grooming.BriefModelInfo, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	urlStr := fmt.Sprintf(GetRemoteBusinessModelInfoURL, b.baseURL, businessModelId)
	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", token)
	request = request.WithContext(ctx)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
	}
	defer resp.Body.Close()
	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	log.WithContext(ctx).Info(string(body))
	//根据状态码判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound { // URL错误
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return nil, errorcode.Desc(errorcode.TaskMainBusinessNotExist)
		}
	}
	//获取业务模型&数据模型数据
	res := new(business_grooming.BriefModelInfo)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func (b *BusinessGroomingCall) QueryFormInfoWithModel(ctx context.Context, businessModelId string, formIds ...string) (*business_grooming.RelationDataList, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	urlStr := fmt.Sprintf(QueryFormWithModelURL, b.baseURL, businessModelId, strings.Join(formIds, ","))
	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", token)
	request.WithContext(ctx)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectGroomingUrlError, err.Error())
	}
	defer resp.Body.Close()
	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	//判断返回状态
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound { // URL错误
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusUnauthorized {
			return nil, errorcode.Desc(errorcode.TokenAuditFailed)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			res := new(response.ErrorResponse)
			if err = json.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(err.Error())
				return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
			}
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return nil, ErrorCodeTransfer(res)
		}
	}
	//获取业务模型&数据模型数据
	res := new(business_grooming.RelationDataList)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func ErrorCodeTransfer(res *response.ErrorResponse) error {
	switch {
	case strings.Contains(res.Code, "ModelNotExist"):
		return errorcode.Desc(errorcode.TaskMainBusinessNotExist)
	case strings.Contains(res.Code, "InvalidIdExists"):
		return errorcode.Desc(errorcode.RelationDataInvalidIdExists)
	case strings.Contains(res.Code, "InvalidParameter"):
		return errorcode.Detail(errorcode.TaskInvalidParameter, res.Detail)
	}
	return errorcode.Desc(errorcode.TaskRelationDataInvalid)
}

// GetBusinessModelsTree 业务域
func (b *BusinessGroomingCall) GetBusinessIndicator(ctx context.Context, businessIndicatorID string) (*business_grooming.BusinessIndicator, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	urlStr := fmt.Sprintf(GetBusinessIndicatorURL, b.baseURL, businessIndicatorID)
	request, _ := http.NewRequest("GET", urlStr, nil)
	request.Header.Set("Authorization", token)
	request.WithContext(ctx)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectGroomingUrlError, err.Error())
	}
	defer resp.Body.Close()
	// 返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	//判断返回状态
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound { // URL错误
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusUnauthorized {
			return nil, errorcode.Desc(errorcode.TokenAuditFailed)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			res := new(response.ErrorResponse)
			if err = json.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(err.Error())
				return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
			}
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return nil, ErrorCodeTransfer(res)
		}
	}
	//获取业务模型&数据模型数据
	res := new(business_grooming.BusinessIndicator)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func (b *BusinessGroomingCall) GetRemoteProcessInfo(ctx context.Context, taskId string) (*business_grooming.BusinessDomainInfos, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	//发起请求
	urlStr := fmt.Sprintf(GetRemoteProcessInfoURL, b.baseURL) + "?task_id=" + taskId + "&status=all"
	fmt.Println(urlStr)
	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request = request.WithContext(ctx)
	request.Header.Set("Authorization", token)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectGroomingUrlError, err.Error())
	}
	defer resp.Body.Close()
	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	fmt.Println(string(body))
	//根据状态码判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return new(business_grooming.BusinessDomainInfos), errorcode.Desc(errorcode.TaskDomainNotExist)
		}
	}
	// 把请求到的数据Unmarshal到res中
	res := new(business_grooming.BusinessDomainInfos)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func (b *BusinessGroomingCall) GetRemoteDiagnosisInfo(ctx context.Context, taskId string) (*business_grooming.DiagnosisInfos, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	//发起请求
	urlStr := fmt.Sprintf(GetRemoteDiagnosisInfoURL, b.baseURL) + "?task_id=" + taskId
	fmt.Println(urlStr)
	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request = request.WithContext(ctx)
	request.Header.Set("Authorization", token)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectGroomingUrlError, err.Error())
	}
	defer resp.Body.Close()
	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	fmt.Println(string(body))
	//根据状态码判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return new(business_grooming.DiagnosisInfos), errorcode.Desc(errorcode.TaskDomainNotExist)
		}
	}
	// 把请求到的数据Unmarshal到res中
	res := new(business_grooming.DiagnosisInfos)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func (b *BusinessGroomingCall) GetRemoteModelInfo(ctx context.Context, processId string) (*business_grooming.NodeResp, error) {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	token, err := user_util.ObtainToken(ctx)
	if err != nil {
		return nil, err
	}
	//发起请求
	urlStr := fmt.Sprintf(GetRemoteModelInfoURL, b.baseURL, processId)
	fmt.Println(urlStr)
	request, _ := http.NewRequest(http.MethodGet, urlStr, nil)
	request = request.WithContext(ctx)
	request.Header.Set("Authorization", token)
	resp, err := b.client.Do(request)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.ProjectGroomingUrlError, err.Error())
	}
	defer resp.Body.Close()
	//返回的结果resp.Body
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	fmt.Println(string(body))
	//根据状态码判断
	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusNotFound {
			return nil, errorcode.Desc(errorcode.ProjectGroomingUrlError)
		} else if resp.StatusCode == http.StatusForbidden {
			return nil, errorcode.Detail(errorcode.GetGlossaryError, "http.StatusForbidden")
		} else {
			log.WithContext(ctx).Info("response:", zap.Any("body", string(body)))
			return new(business_grooming.NodeResp), errorcode.Desc(errorcode.TaskDomainNotExist)
		}
	}
	// 把请求到的数据Unmarshal到res中
	res := new(business_grooming.NodeResp)
	if err = json.Unmarshal(body, res); err != nil {
		log.WithContext(ctx).Error(err.Error(), zap.String("body", string(body)))
		return nil, errorcode.Detail(errorcode.ProjectGroomingDataError, err.Error())
	}
	log.WithContext(ctx).Infof("%#v", res)
	return res, nil
}

func (b *BusinessGroomingCall) UpdateBusinessDiagnosisTaskStaus(ctx context.Context, taskId string) error {
	ctx = util.StartSpan(ctx)
	defer util.End(ctx)

	urlStr := fmt.Sprintf(UpdateBusinessDiagnosisTaskStausURL, b.baseURL, taskId)

	status := struct {
		Status int `json:"status"`
	}{
		Status: 3,
	}

	jsonStatus, _ := json.Marshal(status)
	log.WithContext(ctx).Info(string(jsonStatus))
	req, err := http.NewRequest(http.MethodPut, urlStr, bytes.NewReader(jsonStatus))
	if err != nil {
		return err
	}
	req.Header.Set("Content-Type", "application/json")
	resp, err := b.client.Do(req)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return err
	}
	defer func() {
		if resp != nil {
			closeErr := resp.Body.Close()
			if closeErr != nil {
				log.WithContext(ctx).Error(closeErr.Error())
			}
		}
	}()

	body, err := io.ReadAll(resp.Body)
	// res := CsCommonResp{}
	if resp.StatusCode != http.StatusOK {
		log.WithContext(ctx).Error("Cs Middleware error: ", zap.Int("status code", resp.StatusCode), zap.String("body", string(body)))
		if resp.StatusCode == http.StatusNotFound {
			return errorcode.Detail(errorcode.InternalError, err)
		}
		// err = json.Unmarshal(body, &res)
		// if err != nil {
		// 	log.WithContext(ctx).Error(err.Error())
		// 	return errorcode.Detail(errorcode.InternalError, err)
		// }
		// return agerrors.NewCode(agcodes.New(res.Code, res.Description, "", res.Solution, res.Detail, ""))
	}
	return nil
}
