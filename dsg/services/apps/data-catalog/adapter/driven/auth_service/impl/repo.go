package impl

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/auth_service"
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

type ASDrivenRepo struct {
	client httpclient.HTTPClient
}

func NewASDrivenRepo(client httpclient.HTTPClient) auth_service.Repo {
	return &ASDrivenRepo{client: client}
}
