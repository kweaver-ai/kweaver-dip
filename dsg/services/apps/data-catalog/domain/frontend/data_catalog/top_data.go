package data_catalog

/*
import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (d *DataCatalogDomain) GetTopData(ctx context.Context, req *ReqTopDataParams) ([]*BusinessObjectItem, error) {
	datas, err := d.cataRepo.GetTopList(nil, ctx, req.TopNum, req.Dimension)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to get top %v data (dimension: %v) list from db, err: %v",
			req.TopNum, req.Dimension, err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	retDatas := make([]*BusinessObjectItem, len(datas))
	if len(datas) > 0 {
		if err = d.genBusinessObjectRetData(ctx, FUNC_CALL_FROM_TOP_DATA_GET, datas, retDatas); err != nil {
			return nil, err
		}
	}

	return retDatas, nil
}
*/
