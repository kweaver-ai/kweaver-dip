package demand_management

import (
	"net/http"
	"net/url"
	"path"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	demand_management_v1 "github.com/kweaver-ai/idrm-go-common/rest/demand_management/v1"
)

func New(config *settings.Config, client *http.Client) (*demand_management_v1.DemandManagementV1Client, error) {
	base, err := url.Parse(config.DepServicesConf.DemandManagementHost)
	if err != nil {
		return nil, err
	}
	base.Path = path.Join(base.Path, "api", "demand-management", "v1")

	return demand_management_v1.New(base, client), nil
}
