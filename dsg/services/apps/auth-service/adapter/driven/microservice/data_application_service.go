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

type DataApplicationServiceGetRes struct {
	ServiceInfo struct {
		ServiceID   string `json:"service_id"`
		ServiceName string `json:"service_name"`
		// Deprecated: use Owners.OwnerID
		OwnerId string `json:"owner_id"`
		// Deprecated: use Owners.OwnerName``
		OwnerName string                        `json:"owner_name"`
		Owners    []DataApplicationServiceOwner `json:"owners,omitempty"`
	} `json:"service_info"`
}

type DataApplicationServiceOwner struct {
	OwnerID   string `json:"owner_id"`
	OwnerName string `json:"owner_name"`
}

type DataApplicationServiceRepo interface {
	// DataApplicationServiceGet 接口详情
	DataApplicationServiceGet(ctx context.Context, id string) (res *DataApplicationServiceGetRes, err error)
}

type dataApplicationServiceRepo struct{}

func NewDataApplicationServiceRepo() DataApplicationServiceRepo {
	return &dataApplicationServiceRepo{}
}

func (u *dataApplicationServiceRepo) DataApplicationServiceGet(ctx context.Context, id string) (res *DataApplicationServiceGetRes, err error) {
	//req.DevMode()
	resp, err := req.SetContext(ctx).
		SetBearerAuthToken(util.GetToken(ctx)).
		Get(settings.Instance.Services.DataApplicationService + "/api/internal/data-application-service/v1/services/" + id)
	if err != nil {
		log.WithContext(ctx).Error("DataApplicationServiceGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}
	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("DataApplicationServiceGet", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.InternalError, resp.String())
	}

	res = &DataApplicationServiceGetRes{}
	err = resp.UnmarshalJson(&res)
	if err != nil {
		log.WithContext(ctx).Error("DataApplicationServiceGet", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return
}
