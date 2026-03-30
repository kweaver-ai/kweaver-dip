package initialization

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client"
	deploy_management "github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/deploy_manager"
	"github.com/kweaver-ai/dsg/services/apps/session/common/constant"
)

func Init() error {
	//host, err := deploy_management.NewDeployMgm(http_client.NewHTTPClient()).GetHost()
	host, err := deploy_management.NewDeployMgm(http_client.NewOtelHTTPClient()).GetHost(context.Background())
	if err != nil {
		return err
	}
	constant.AccessIP = host.Host
	constant.AccessPort = host.Port
	fmt.Println(constant.AccessIP)
	fmt.Println(constant.AccessPort)
	return nil
}
