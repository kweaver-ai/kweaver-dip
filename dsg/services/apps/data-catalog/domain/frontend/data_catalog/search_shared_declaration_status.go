package data_catalog

import (
	"context"

	demand_management_v1 "github.com/kweaver-ai/idrm-go-common/api/demand_management/v1"
)

// updateDataCatalogSearchRespSharedDeclarationStatuses 从服务 demand-management
// 获取数据目录的共享申请状态，更新搜索结果 dataCatalogSearchResp 的
// SharedDeclarationStatus
func (d *DataCatalogDomain) updateDataCatalogSearchRespSharedDeclarationStatus(ctx context.Context, respSlice []DataCatalogSearchResp) error {
	// create request
	req := &demand_management_v1.SharedDeclarationStatusReq{}
	for _, item := range respSlice {
		req.CatalogIDs = append(req.CatalogIDs, item.ID)
	}

	// send request
	resp, err := d.sharedDeclaration.Status(ctx, req)
	if err != nil {
		return err
	}

	// update respSlice[].SharedDeclarationStatus
	for i := range respSlice {
		for _, r := range resp {
			if r.CatalogID != respSlice[i].ID {
				continue
			}
			respSlice[i].SharedDeclarationStatus = r.Status
		}
	}

	return nil
}
