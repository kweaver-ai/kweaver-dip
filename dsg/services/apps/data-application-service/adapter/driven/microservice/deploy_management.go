package microservice

import (
	"context"
	"errors"

	"github.com/imroc/req/v2"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type DrivenDeployMgm interface {
	GetHost(ctx context.Context) (*GetHostRes, error)
}

type GetHostRes struct {
	Host   string `json:"host"`
	Port   string `json:"port"`
	Scheme string `json:"scheme"`
}

type deployMgm struct{}

func NewDeployMgm() DrivenDeployMgm {
	return &deployMgm{}
}

func (d *deployMgm) GetHost(ctx context.Context) (*GetHostRes, error) {
	resp, err := req.SetContext(ctx).
		Get("http://deploy-service:9703/api/deploy-manager/v1/access-addr/app")
	if err != nil {
		log.WithContext(ctx).Error("GetHost", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	if resp.StatusCode != 200 {
		log.WithContext(ctx).Error("GetHost", zap.Error(errors.New(resp.String())))
		return nil, errorcode.Detail(errorcode.PublicInternalError, resp.String())
	}

	res := &GetHostRes{}
	if err := resp.UnmarshalJson(&res); err != nil {
		log.WithContext(ctx).Error("GetHost", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}

	return res, nil
}
