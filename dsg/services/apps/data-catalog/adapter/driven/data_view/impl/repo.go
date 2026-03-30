package impl

import (
	"github.com/kweaver-ai/idrm-go-frame/core/utils/httpclient"
)

type DVDrivenRepo struct {
	client httpclient.HTTPClient
}

func NewDVDrivenRepo(client httpclient.HTTPClient) *DVDrivenRepo {
	return &DVDrivenRepo{client: client}
}
