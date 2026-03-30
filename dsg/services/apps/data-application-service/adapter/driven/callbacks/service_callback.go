package callbacks

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-common/callback"
)

// NewDataApplicationServiceCallback 数据应用服务回调接口的客户端
func NewDataApplicationServiceCallback() (callback.Interface, func(), error) {
	cfg := &settings.Instance.Callback

	if !cfg.Enabled {
		return &callback.Hollow{}, func() {}, nil
	}

	// 创建 grpc 客户端
	c, err := grpc.NewClient(settings.Instance.Callback.Address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, func() {}, err
	}

	return callback.New(c), func() { c.Close() }, nil
}
