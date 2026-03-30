package callbacks

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	"github.com/kweaver-ai/idrm-go-common/callback"
)

// NewDataPushCallback 数据推送回调接口的客户端
func NewDataPushCallback() (callback.Interface, func(), error) {
	cfg := &settings.GetConfig().Callback

	if !cfg.Enabled {
		return &callback.Hollow{}, func() {}, nil
	}

	// 创建 grpc 客户端
	c, err := grpc.NewClient(settings.GetConfig().Callback.Address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, func() {}, err
	}

	return callback.New(c), func() { c.Close() }, nil
}
