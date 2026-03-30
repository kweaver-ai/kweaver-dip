package microservice

import (
	"context"
	"errors"

	"github.com/imroc/req/v3"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
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

type DataSubjectRepo interface {
	// DataSubjectGet 主题域详情
	DataSubjectGet(ctx context.Context, id string) (res *DataSubjectGetRes, err error)
}

type dataSubjectRepo struct{}

func NewDataSubjectRepo() DataSubjectRepo {
	return &dataSubjectRepo{}
}

func (u *dataSubjectRepo) DataSubjectGet(ctx context.Context, id string) (res *DataSubjectGetRes, err error) {
	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		SetQueryParam("id", id).
		Get(settings.Instance.Services.DataSubject + "/api/data-subject/v1/subject-domain")
	if err != nil {
		log.WithContext(ctx).Error("DataSubjectGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataSubjectGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &DataSubjectGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataSubjectGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}
