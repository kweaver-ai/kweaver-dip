package callback

import (
	"google.golang.org/grpc"
	"google.golang.org/grpc/credentials/insecure"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/idrm-go-common/callback"
)

// New 返回回调接口的客户端
func New() (callback.Interface, func(), error) {
	cfg := &settings.ConfigInstance.Callback

	if !cfg.Enabled {
		return &callback.Hollow{}, func() {}, nil
	}

	// 创建 grpc 客户端
	c, err := grpc.NewClient(settings.ConfigInstance.Callback.Address, grpc.WithTransportCredentials(insecure.NewCredentials()))
	if err != nil {
		return nil, func() {}, err
	}

	return callback.New(c), func() { c.Close() }, nil
}
