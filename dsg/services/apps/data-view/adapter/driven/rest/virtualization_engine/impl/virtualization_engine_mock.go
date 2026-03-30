package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
)

type VirtualizationEngineMock struct {
}

func (v *VirtualizationEngineMock) CreateExcelView(ctx context.Context, req *virtualization_engine.CreateExcelViewReq) (*virtualization_engine.CreateExcelViewRes, error) {
	//TODO implement me
	panic("implement me")
}

func (v *VirtualizationEngineMock) DeleteExcelView(ctx context.Context, req *virtualization_engine.DeleteExcelViewReq) (*virtualization_engine.DeleteExcelViewRes, error) {
	//TODO implement me
	panic("implement me")
}

func NewVirtualizationEngineMock() *VirtualizationEngineMock {
	return &VirtualizationEngineMock{}
}

func (v *VirtualizationEngineMock) GetView(ctx context.Context, req *virtualization_engine.GetViewReq) (*virtualization_engine.GetViewRes, error) {
	return &virtualization_engine.GetViewRes{}, nil
}

func (v *VirtualizationEngineMock) CreateView(ctx context.Context, req *virtualization_engine.CreateViewReq) error {
	return nil
}

func (v *VirtualizationEngineMock) DeleteView(ctx context.Context, req *virtualization_engine.DeleteViewReq) error {
	return nil
}

func (v *VirtualizationEngineMock) ModifyView(ctx context.Context, req *virtualization_engine.ModifyViewReq) error {
	return nil

}

func (v *VirtualizationEngineMock) CreateViewSource(ctx context.Context, req *virtualization_engine.CreateViewSourceReq) ([]*virtualization_engine.CreateViewSourceRes, error) {
	return []*virtualization_engine.CreateViewSourceRes{{}}, nil
}

func (v *VirtualizationEngineMock) DeleteDataSource(ctx context.Context, req *virtualization_engine.DeleteDataSourceReq) error {
	return nil
}

func (v *VirtualizationEngineMock) FetchData(ctx context.Context, statement string) (*virtualization_engine.FetchDataRes, error) {
	return nil, nil
}

func (v *VirtualizationEngineMock) GetConnectors(ctx context.Context) (result *virtualization_engine.GetConnectorsRes, err error) {
	return nil, nil
}

func (v *VirtualizationEngineMock) StreamDataFetch(ctx context.Context, urlStr string, statement string) (*virtualization_engine.StreamFetchResp, error) {
	return nil, nil
}

func (v *VirtualizationEngineMock) StreamDataDownload(ctx context.Context, urlStr string,
	req *virtualization_engine.StreamDownloadReq) (*virtualization_engine.StreamFetchResp, error) {
	return nil, nil
}
