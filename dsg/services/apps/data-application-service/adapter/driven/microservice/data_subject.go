package microservice

import (
	"context"
	"errors"
	"fmt"
	"strconv"

	"github.com/imroc/req/v2"
	jsoniter "github.com/json-iterator/go"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DataSubjectGetRes struct {
	Id          string `json:"id"`
	Name        string `json:"name"`
	Description string `json:"description"`
	Type        string `json:"type"`
	PathId      string `json:"path_id"`
	PathName    string `json:"path_name"`
	Owners      struct {
		UserId   string `json:"user_id"`
		UserName string `json:"user_name"`
	} `json:"owners"`
}

type DataSubjectListRes struct {
	Entries    []DataSubject `json:"entries"`
	TotalCount int           `json:"total_count"`
}

type DataSubject struct {
	Id               string   `json:"id"`
	Name             string   `json:"name"`
	Description      string   `json:"description"`
	Type             string   `json:"type"`
	PathId           string   `json:"path_id"`
	PathName         string   `json:"path_name"`
	Owners           []string `json:"owners"`
	CreatedBy        string   `json:"created_by"`
	CreatedAt        int64    `json:"created_at"`
	UpdatedBy        string   `json:"updated_by"`
	UpdatedAt        int64    `json:"updated_at"`
	ChildCount       int      `json:"child_count"`
	SecondChildCount int      `json:"second_child_count"`
}

type DataSubjectRepo interface {
	// DataSubjectGet 主题域详情
	DataSubjectGet(ctx context.Context, id string) (res *DataSubjectGetRes, err error)
	// DataSubjectList 主题域列表
	DataSubjectList(ctx context.Context, parentId, subjectType string) (res *DataSubjectListRes, err error)
}

type dataSubjectRepo struct {
	httpclient util.HTTPClient
}

func NewDataSubjectRepo(httpclient util.HTTPClient) DataSubjectRepo {
	return &dataSubjectRepo{
		httpclient: httpclient,
	}
}

func (u *dataSubjectRepo) DataSubjectGet(ctx context.Context, id string) (res *DataSubjectGetRes, err error) {
	urlStr := fmt.Sprintf("%s/api/internal/data-subject/v1/subject-domain?id=%s", settings.Instance.Services.DataSubject, id)
	response, err := u.httpclient.Get(ctx, urlStr, nil)
	if err != nil {
		log.WithContext(ctx).Error("GetConfigValue", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	//req.DevMode()
	// resp, err := req.SetContext(ctx).
	// 	// SetBearerAuthToken(util.GetToken(ctx)).
	// 	SetQueryParam("id", id).
	// 	// Get(settings.Instance.Services.DataSubject + "/api/data-subject/v1/subject-domain")
	// 	Get(settings.Instance.Services.DataSubject + "/api/internal/data-subject/v1/subject-domain")
	// if err != nil {
	// 	log.WithContext(ctx).Error("DataSubjectGet", zap.Error(err))
	// 	return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	// }
	// if resp.StatusCode != 200 {
	// 	log.WithContext(ctx).Error("DataSubjectGet", zap.Error(errors.New(resp.String())))
	// 	return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	// }
	res = &DataSubjectGetRes{}
	// err = resp.UnmarshalJson(&res)
	err = jsoniter.Unmarshal(response, &res)
	if err != nil {
		log.WithContext(ctx).Error("DataSubjectGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}

func (u *dataSubjectRepo) DataSubjectList(ctx context.Context, parentId, subjectType string) (res *DataSubjectListRes, err error) {
	res = &DataSubjectListRes{}
	// 至少获取一次，如果已经获取到的主题域数量小于总数，则继续获取
	for offset := 1; offset == 1 || len(res.Entries) < res.TotalCount; offset++ {
		pageRes, err := u.GetSubjectListWithOffset(ctx, parentId, subjectType, offset)
		if err != nil {
			return nil, err
		}
		res.Entries, res.TotalCount = append(res.Entries, pageRes.Entries...), pageRes.TotalCount
	}

	return res, nil
}

func (u *dataSubjectRepo) GetSubjectListWithOffset(ctx context.Context, parentId, subjectType string, offset int) (res *DataSubjectListRes, err error) {
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParam("parent_id", parentId).
		SetQueryParam("is_all", "true").
		SetQueryParam("need_count", "true").
		SetQueryParam("type", subjectType).
		SetQueryParam("offset", strconv.Itoa(offset)).
		Get(settings.Instance.Services.DataSubject + "/api/data-subject/v1/subject-domains")
	if err != nil {
		log.WithContext(ctx).Error("DataSubjectList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataSubjectList", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &DataSubjectListRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataSubjectList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	return
}
