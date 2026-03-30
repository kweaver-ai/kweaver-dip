package impl

import (
	"context"
	"strings"
	"time"

	"github.com/google/uuid"
	entity "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/statistics"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/statistics"
	usecase "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/statistics"
	_ "gorm.io/gorm"
)

func NewRepo(data *db.Data) usecase.Repo {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r repo) GetOverviewStatistics(ctx context.Context) (*domain.Statistics, error) {
	var statistics []*domain.Statistics
	result := r.data.DB.WithContext(ctx).Table("statistics_overview").Scan(&statistics)
	if result.Error != nil {
		return nil, result.Error
	}
	return statistics[0], nil
}

func (r repo) GetServiceStatistics(ctx context.Context, ids string) ([]*domain.Service, error) {
	var statistics []*domain.Service

	// 使用原生 SQL 构造两个子查询并用 UNION ALL 合并
	sql := `
	SELECT 
		type,
		catalog,
		SUM(quantity) AS quantity,
		business_time,
		MAX(week) AS week,  
		MAX(create_time) AS create_time
	FROM (
		SELECT * FROM (
			(SELECT * FROM statistics_service WHERE type = '1' AND catalog = '1' ORDER BY business_time DESC LIMIT 4)
			UNION ALL
			(SELECT * FROM statistics_service WHERE type = '1' AND catalog = '2' ORDER BY business_time DESC LIMIT 4)
			UNION ALL
			(SELECT * FROM statistics_service WHERE type = '2' AND catalog = '1' ORDER BY business_time DESC LIMIT 4)
			UNION ALL
			(SELECT * FROM statistics_service WHERE type = '2' AND catalog = '2' ORDER BY business_time DESC LIMIT 4)
		) AS t
	) AS combined
	GROUP BY type, catalog, business_time, week
	HAVING type = ?
	ORDER BY business_time DESC
`

	err := r.data.DB.WithContext(ctx).
		Raw(sql, ids).
		Scan(&statistics).Error

	if err != nil {
		return nil, err
	}

	return statistics, nil
}

func (r repo) SaveStatistics(ctx context.Context) error {
	tx := r.data.DB.WithContext(ctx)

	// Step 1: 获取目录类上线量数据
	var onlineStats []*domain.Service
	if err := tx.Raw(`
		SELECT 
    '1' AS type,
    COUNT(1) AS quantity,
    DATE_FORMAT(audit_time, '%Y-%m') AS business_time,
    WEEK(audit_time, 1) - WEEK(DATE_FORMAT(audit_time, '%Y-%m-01'), 1) + 1 AS week,
    '2' AS catalog
   FROM audit_log al
   WHERE audit_type = 'af-data-catalog-online'
  AND audit_state = 2
  AND audit_resource_type = 1
  GROUP BY DATE_FORMAT(audit_time, '%Y-%m'), WEEK(audit_time, 1) - WEEK(DATE_FORMAT(audit_time, '%Y-%m-01'), 1) + 1
	`).Scan(&onlineStats).Error; err != nil {
		return err
	}

	// Step 2: 获取目录类申请量数据
	var applyStats []*domain.Service
	if err := tx.Raw(`
		SELECT 
    '1' AS type,
    SUM(apply_num) AS quantity,
    DATE_FORMAT(create_time, '%Y-%m') AS business_time,
    WEEK(create_time, 1) - WEEK(DATE_FORMAT(create_time, '%Y-%m-01'), 1) + 1 AS week,
    '1' AS catalog
  FROM t_data_catalog_apply
  GROUP BY DATE_FORMAT(create_time, '%Y-%m'), WEEK(create_time, 1) - WEEK(DATE_FORMAT(create_time, '%Y-%m-01'), 1) + 1
	`).Scan(&applyStats).Error; err != nil {
		return err
	}

	// Step 3: 获取接口类上线量数据
	var interfaceOnlineStats []*domain.Service
	if err := tx.Raw(`
		SELECT 
    '2' AS type,
    SUM(online_count) AS quantity,
    DATE_FORMAT(record_date, '%Y-%m') AS business_time,
    WEEK(record_date, 1) - WEEK(DATE_FORMAT(record_date, '%Y-%m-01'), 1) + 1 AS week,
    '2' AS catalog
   FROM data_application_service.service_daily_record sdr
   GROUP BY DATE_FORMAT(record_date, '%Y-%m'), WEEK(record_date, 1) - WEEK(DATE_FORMAT(record_date, '%Y-%m-01'), 1) + 1
	`).Scan(&interfaceOnlineStats).Error; err != nil {
		return err
	}

	// Step 4: 获取接口类申请量数据
	var interfaceApplyStats []*domain.Service
	if err := tx.Raw(`
		SELECT 
    '2' AS type,
    SUM(apply_num) AS quantity,
    DATE_FORMAT(biz_date, '%Y-%m') AS business_time,
    WEEK(biz_date) - WEEK(DATE_FORMAT(biz_date, '%Y-%m-01')) + 1 AS week,
    '1' AS catalog
    FROM t_data_interface_apply sdr
    GROUP BY DATE_FORMAT(biz_date, '%Y-%m'), WEEK(biz_date) - WEEK(DATE_FORMAT(biz_date, '%Y-%m-01')) + 1
	`).Scan(&interfaceApplyStats).Error; err != nil {
		return err
	}

	// Step 5: 生成 UUID 和创建时间
	now := time.Now()
	for i := range onlineStats {
		onlineStats[i].ID = uuid.New().String()
		onlineStats[i].CreateTime = now.Format("2006-01-02 15:04:05")
	}
	for i := range applyStats {
		applyStats[i].ID = uuid.New().String()
		applyStats[i].CreateTime = now.Format("2006-01-02 15:04:05")
	}
	for i := range interfaceOnlineStats {
		interfaceOnlineStats[i].ID = uuid.New().String()
		interfaceOnlineStats[i].CreateTime = now.Format("2006-01-02 15:04:05")
	}
	for i := range interfaceApplyStats {
		interfaceApplyStats[i].ID = uuid.New().String()
		interfaceApplyStats[i].CreateTime = now.Format("2006-01-02 15:04:05")
	}

	// Step 6: 删除已有重复数据
	allRecords := append(append(append(onlineStats, applyStats...), interfaceOnlineStats...), interfaceApplyStats...)
	if err := r.DeleteExistingRecords(ctx, allRecords); err != nil {
		return err
	}

	// Step 7: 批量插入所有数据
	if len(onlineStats) > 0 {
		if err := tx.Create(onlineStats).Error; err != nil {
			return err
		}
	}
	if len(applyStats) > 0 {
		if err := tx.Create(applyStats).Error; err != nil {
			return err
		}
	}
	if len(interfaceOnlineStats) > 0 {
		if err := tx.Create(interfaceOnlineStats).Error; err != nil {
			return err
		}
	}
	if len(interfaceApplyStats) > 0 {
		if err := tx.Create(interfaceApplyStats).Error; err != nil {
			return err
		}
	}

	return nil
}

func (r repo) DeleteExistingRecords(ctx context.Context, records []*domain.Service) error {
	tx := r.data.DB.WithContext(ctx)
	if len(records) == 0 {
		return nil
	}

	type Key struct {
		Type         int8   `gorm:"column:type"`
		BusinessTime string `gorm:"column:business_time"`
		Week         int32  `gorm:"column:week"`
		Catalog      string `gorm:"column:catalog"`
	}

	var conditions []string
	var args []interface{}

	for _, record := range records {
		conditions = append(conditions, "(type = ? AND business_time = ? AND week = ? AND catalog = ?)")
		args = append(args, record.Type, record.BusinessTime, record.Week, record.Catalog)
	}

	whereClause := " WHERE " + strings.Join(conditions, " OR ")

	sql := "DELETE FROM statistics_service" + whereClause

	if err := tx.Exec(sql, args...).Error; err != nil {
		return err
	}

	return nil
}

func (r repo) UpdateStatistics(ctx context.Context, req *entity.OverviewResp) error {
	return r.data.DB.WithContext(ctx).
		Model(&entity.OverviewResp{}).
		Where("id = ?", req.ID).
		Updates(req).Error
}
