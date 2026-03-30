package scan_record

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

type ScanRecordRepo interface {
	GetByDatasourceId(ctx context.Context, datasourceId string) (scanRecord []*model.ScanRecord, err error)
	GetByTaskIds(ctx context.Context, taskIds []string) (scanRecord []*model.ScanRecord, err error)
	GetByDatasourceIdAndScanner(ctx context.Context, datasourceId string, scanner string) (scanRecord []*model.ScanRecord, err error)
	Create(ctx context.Context, scanRecord *model.ScanRecord) error
	Update(ctx context.Context, scanRecord *model.ScanRecord) error
	DeleteByDataSourceId(ctx context.Context, datasourceId string) error
}
