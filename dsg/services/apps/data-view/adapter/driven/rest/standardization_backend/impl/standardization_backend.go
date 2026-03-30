package impl

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	standardizationbackend "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/standardization_backend"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"
)

type StandardizationBackend struct {
	baseURL string
	client  *http.Client
}

func NewStandardizationBackend(conf *my_config.Bootstrap, httpClient *http.Client) standardizationbackend.DrivenStandardizationRepo {
	return &StandardizationBackend{
		baseURL: conf.DepServices.StandardizationBackendHost,
		client:  httpClient,
	}
}

func (s *StandardizationBackend) GetDataElementDetail(ctx context.Context, id string) (data standardizationbackend.DataResp, err error) {
	errorMsg := "DrivenStandardizationRepo GetDataElementDetail "
	urlStr := fmt.Sprintf("%s/api/standardization/v1/dataelement/internal/detail?type=2&value=%s", s.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest error", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDataElementError, err.Error())
	}
	resp, err := s.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDataElementError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDataElementError, err.Error())
	}
	var standardDetail standardizationbackend.StandardDetailResp
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &standardDetail)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return data, errorcode.Detail(my_errorcode.GetStandardDataElementError, err.Error())
		}
		return standardDetail.Data, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return data, errorcode.Detail(my_errorcode.GetStandardDataElementError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return data, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return data, errorcode.Desc(my_errorcode.GetStandardDataElementError)
		}
	}
}

func (s *StandardizationBackend) GetStandardDict(ctx context.Context, ids []string) (data map[string]standardizationbackend.DictResp, err error) {
	errorMsg := "DrivenStandardizationRepo GetStandardDict "
	urlStr := fmt.Sprintf("%s/api/standardization/v1/dataelement/dict/internal/queryByIds", s.baseURL)
	bodyReq := map[string][]string{
		"ids": ids,
	}
	jsonReq, err := jsoniter.Marshal(bodyReq)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+" jsoniter.Marshal error", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	log.WithContext(ctx).Infof("errorMsg :%s,urlStr :%s,jsonReq :%s,", errorMsg, urlStr, jsonReq)
	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewReader(jsonReq))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest error", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	request.Header.Set("Content-Type", "application/json")
	resp, err := s.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	var standardDetail standardizationbackend.StandardDictResp
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &standardDetail)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
		}
		data = make(map[string]standardizationbackend.DictResp)
		// standardDetail to map[string]standardizationbackend.DictResp
		for _, preDict := range standardDetail.Data {
			data[preDict.ID] = preDict
		}
		return
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return data, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return data, errorcode.Desc(my_errorcode.GetStandardDictError)
		}
	}
}

func (s *StandardizationBackend) GetStandardDictById(ctx context.Context, id string) (data map[string]string, description string, err error) {
	errorMsg := "DrivenStandardizationRepo GetDataElementDetail "
	urlStr := fmt.Sprintf("%s/api/standardization/v1/dataelement/dict/internal/enum/getList?dict_id=%s", s.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest error", zap.Error(err))
		return data, description, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	resp, err := s.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return data, description, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return data, description, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	var standardDetail standardizationbackend.StandardDictDetailResp
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &standardDetail)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return data, description, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
		}
		data = make(map[string]string)
		for _, preDict := range standardDetail.Data {
			data[preDict.Code] = preDict.Value
		}
		description = standardDetail.Description
		return
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return data, description, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return data, description, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return data, description, errorcode.Desc(my_errorcode.GetStandardDictError)
		}
	}
}

func (s *StandardizationBackend) GetStandardByIds(ctx context.Context, ids []string) (data map[string]string, err error) {
	errorMsg := "DrivenStandardizationRepo GetStandardByIds "

	urlStr := fmt.Sprintf("%s/api/standardization/v1/dataelement/internal/query/list?ids=%s", s.baseURL, strings.Join(ids, ","))
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest error", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	resp, err := s.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
	}
	var res standardizationbackend.GetStandardByIdsRes
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
		}
		data = make(map[string]string)
		for _, preDict := range res.Data {
			data[preDict.Code] = preDict.NameCn
		}
		return
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return data, errorcode.Detail(my_errorcode.GetStandardDictError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return data, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return data, errorcode.Desc(my_errorcode.GetStandardDictError)
		}
	}
}

func (s *StandardizationBackend) GetRuleByStandardId(ctx context.Context, id string) (*standardizationbackend.RuleDetailResp, error) {
	var err error
	errorMsg := "DrivenStandardizationRepo GetDataElementDetail "
	urlStr := fmt.Sprintf("%s/api/standardization/v1/rule/internal/getDetailByDataCode/%s", s.baseURL, id)
	request, err := http.NewRequestWithContext(ctx, http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetStandardRuleError, err.Error())
	}
	resp, err := s.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetStandardRuleError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetStandardRuleError, err.Error())
	}
	var standardDetail standardizationbackend.StandardRuleResp
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &standardDetail)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetStandardRuleError, err.Error())
		}
		return standardDetail.Data, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.GetStandardRuleError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return nil, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return nil, errorcode.Desc(my_errorcode.GetStandardRuleError)
		}
	}
}
