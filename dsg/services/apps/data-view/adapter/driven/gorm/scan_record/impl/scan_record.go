package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/scan_record"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

type scanRecordRepo struct {
	db *gorm.DB
}

func NewScanRecordRepo(db *gorm.DB) scan_record.ScanRecordRepo {
	return &scanRecordRepo{db: db}
}

func (r *scanRecordRepo) GetByDatasourceId(ctx context.Context, datasourceId string) (scanRecord []*model.ScanRecord, err error) {
	err = r.db.WithContext(ctx).Where("datasource_id=?", datasourceId).Find(&scanRecord).Error
	return
}

func (r *scanRecordRepo) GetByTaskIds(ctx context.Context, taskIds []string) (scanRecord []*model.ScanRecord, err error) {
	err = r.db.WithContext(ctx).Where("scanner in ?", taskIds).Find(&scanRecord).Error
	return
}
func (r *scanRecordRepo) GetByDatasourceIdAndScanner(ctx context.Context, datasourceId string, taskId string) (scanRecord []*model.ScanRecord, err error) {
	if taskId == "" {
		taskId = constant.ManagementScanner
	}
	err = r.db.WithContext(ctx).Where("datasource_id=? and scanner=?", datasourceId, taskId).Find(&scanRecord).Error
	return
}

func (r *scanRecordRepo) Create(ctx context.Context, scanRecord *model.ScanRecord) error {
	return r.db.WithContext(ctx).Create(scanRecord).Error
}
func (r *scanRecordRepo) Update(ctx context.Context, scanRecord *model.ScanRecord) error {
	scanRecord.ScanTime = time.Now()
	return r.db.WithContext(ctx).Where("id=?", scanRecord.ID).Updates(scanRecord).Error
}
func (r *scanRecordRepo) DeleteByDataSourceId(ctx context.Context, datasourceId string) error {
	return r.db.WithContext(ctx).Where("datasource_id=? ", datasourceId).Delete(&model.ScanRecord{}).Error
}
