package impl

import (
	"bytes"
	"context"
	"fmt"
	"io"
	"net/http"
	"strings"

	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	data_subject "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	my_config "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DataSubject struct {
	baseURL string
	client  *http.Client
}

func NewDataSubject(conf *my_config.Bootstrap, rawHttpClient *http.Client) data_subject.DrivenDataSubject {
	return &DataSubject{baseURL: conf.DepServices.DataSubjectHost, client: rawHttpClient}
}
func (c *DataSubject) GetsObjectById(ctx context.Context, id string) (*data_subject.GetObjectResp, error) {
	errorMsg := "DrivenDataSubject GetsObjectById "
	urlStr := fmt.Sprintf("%s/api/internal/data-subject/v1/subject-domain?id=%s", c.baseURL, id)

	log.Infof(errorMsg+"%s", urlStr)

	request, err := http.NewRequest(http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
	}
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
	}

	var res *data_subject.GetObjectResp
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
		}
		return res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return nil, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return nil, errorcode.Desc(my_errorcode.GetsObjectByIdError)
		}
	}
}
func (c *DataSubject) GetObjectPrecision(ctx context.Context, ids []string) (*data_subject.GetObjectPrecisionRes, error) {
	errorMsg := "DrivenDataSubject GetObjectPrecision "

	urlStr := fmt.Sprintf("%s/api/internal/data-subject/v1/subject-domain/precision", c.baseURL)
	params := make([]string, 0, len(ids))
	for _, id := range ids {
		params = append(params, "object_id="+id)
	}
	if len(params) > 0 {
		urlStr = urlStr + "?" + strings.Join(params, "&")
	}

	log.Infof(errorMsg+"%s", urlStr)

	request, err := http.NewRequest(http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetObjectPrecisionError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetObjectPrecisionError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetObjectPrecisionError, err.Error())
	}

	var res *data_subject.GetObjectPrecisionRes
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetObjectPrecisionError, err.Error())
		}
		return res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.GetObjectPrecisionError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return nil, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return nil, errorcode.Desc(my_errorcode.GetObjectPrecisionError)
		}
	}
}

func (c *DataSubject) GetSubjectList(ctx context.Context, parentId, subjectType string) (*data_subject.DataSubjectListRes, error) {
	var res = &data_subject.DataSubjectListRes{}

	// 至少获取一次，如果已经获取到的主题域数量小于总数，则继续获取
	for offset := 1; offset == 1 || len(res.Entries) < res.TotalCount; offset++ {
		pageRes, err := c.GetSubjectListWithOffset(ctx, parentId, subjectType, offset)
		if err != nil {
			return nil, err
		}
		res.Entries, res.TotalCount = append(res.Entries, pageRes.Entries...), pageRes.TotalCount
	}

	return res, nil
}

func (c *DataSubject) GetSubjectListWithOffset(ctx context.Context, parentId, subjectType string, offset int) (*data_subject.DataSubjectListRes, error) {
	errorMsg := "DrivenDataSubject GetSubjectList "

	urlStr := fmt.Sprintf("%s/api/data-subject/v1/subject-domains?parent_id=%s&type=%s&is_all=true&need_count=true&offset=%d", c.baseURL, parentId, subjectType, offset)

	log.Infof(errorMsg+"%s", urlStr)

	request, err := http.NewRequest(http.MethodGet, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetSubjectListError, err.Error())
	}
	request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetSubjectListError, err.Error())
	}
	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetSubjectListError, err.Error())
	}

	if resp.StatusCode != http.StatusOK {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.GetSubjectListError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return nil, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return nil, errorcode.Desc(my_errorcode.GetSubjectListError)
		}
	}
	var res *data_subject.DataSubjectListRes
	err = jsoniter.Unmarshal(body, &res)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetSubjectListError, err.Error())
	}
	return res, nil
}

func (c *DataSubject) GetAttributeByIds(ctx context.Context, ids []string) (*data_subject.GetAttributRes, error) {
	type ReqParam struct {
		Ids []string `json:"ids"`
	}
	reqParams := ReqParam{
		Ids: ids,
	}
	errorMsg := "DrivenDataSubject GetAttributeByIds "
	urlStr := fmt.Sprintf("%s/api/internal/data-subject/v1/subject-domain/attributes", c.baseURL)
	log.Infof(errorMsg+"%s", urlStr)

	buf, err := jsoniter.Marshal(reqParams)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+" jsoniter.Marshal error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.PublicInternalServerError, err.Error())
	}
	log.Infof(errorMsg+" url:%s \n %+v", urlStr, reqParams)

	request, err := http.NewRequestWithContext(ctx, http.MethodPost, urlStr, bytes.NewBuffer(buf))

	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"http.NewRequest", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
	}
	// request.Header.Set("Authorization", ctx.Value(interception.Token).(string))
	resp, err := c.client.Do(request.WithContext(ctx))
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"client.Do error", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
	}

	defer resp.Body.Close()
	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.WithContext(ctx).Error(errorMsg+"io.ReadAll", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
	}

	var res *data_subject.GetAttributRes
	if resp.StatusCode == http.StatusOK {
		err = jsoniter.Unmarshal(body, &res)
		if err != nil {
			log.WithContext(ctx).Error(errorMsg+" json.Unmarshal error", zap.Error(err))
			return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
		}
		return res, nil
	} else {
		if resp.StatusCode == http.StatusBadRequest || resp.StatusCode == http.StatusInternalServerError || resp.StatusCode == http.StatusUnauthorized || resp.StatusCode == http.StatusForbidden {
			res := new(errorcode.ErrorCodeFullInfo)
			if err = jsoniter.Unmarshal(body, res); err != nil {
				log.WithContext(ctx).Error(errorMsg+"400 error jsoniter.Unmarshal", zap.Error(err))
				return nil, errorcode.Detail(my_errorcode.GetsObjectByIdError, err.Error())
			}
			log.WithContext(ctx).Error(errorMsg+"400 error", zap.String("code", res.Code), zap.String("description", res.Description))
			return nil, errorcode.New(res.Code, res.Description, res.Cause, res.Solution, res.Detail, "")
		} else {
			log.WithContext(ctx).Error(errorMsg+"http status error", zap.String("status", resp.Status))
			return nil, errorcode.Desc(my_errorcode.GetsObjectByIdError)
		}
	}
}
