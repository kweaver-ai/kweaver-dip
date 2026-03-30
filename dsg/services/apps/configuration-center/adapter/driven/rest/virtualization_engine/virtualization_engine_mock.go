package virtualization_engine

import (
	"context"
	"net/http"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
)

type VirtualizationEngineMock struct {
	protocol      string
	baseURL       string
	RawHttpClient *http.Client
}

func NewVirtualizationEngineMock(rawHttpClient *http.Client) DrivenVirtualizationEngine {
	return &VirtualizationEngineMock{
		protocol:      settings.ConfigInstance.Config.DepServices.VirtualizationEngineProtocol,
		baseURL:       settings.ConfigInstance.Config.DepServices.VirtualizationEngineHost,
		RawHttpClient: rawHttpClient,
	}
}

func (v *VirtualizationEngineMock) GetDataSource(ctx context.Context) (*GetDataSourceRes, error) {
	return &GetDataSourceRes{
		Msg:  "",
		Code: "",
		Data: nil,
	}, nil
}

func (v *VirtualizationEngineMock) CreateDataSource(ctx context.Context, req *CreateDataSourceReq) (bool, error) {
	return true, nil

}

func (v *VirtualizationEngineMock) ModifyDataSource(ctx context.Context, req *ModifyDataSourceReq) (bool, error) {
	return true, nil
}

func (v *VirtualizationEngineMock) DeleteDataSource(ctx context.Context, req *DeleteDataSourceReq) (bool, error) {
	return true, nil

}

// GetConnectors implements DrivenVirtualizationEngine.
func (v *VirtualizationEngineMock) GetConnectors(ctx context.Context) (result *GetConnectorsRes, err error) {
	return
}

// GetConnectorConfig implements DrivenVirtualizationEngine.
func (v *VirtualizationEngineMock) GetConnectorConfig(ctx context.Context, name string) (result *ConnectorConfig, err error) {
	return
}
