package front_end_processor

import (
	"context"
	_ "embed"
	"fmt"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"

	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	configuration_center_v1 "github.com/kweaver-ai/idrm-go-common/api/configuration-center/v1"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
)

type repository struct {
	db gorm.DB
}

var _ Repository = (*repository)(nil)

func NewRepository(db *gorm.DB) Repository { return &repository{db: *db} }

// Create implements Repository.
func (r *repository) Create(ctx context.Context, p *configuration_center_v1.FrontEndProcessor) error {
	tx := r.db.WithContext(ctx).Save(convertFrontEndProcessorV1ToModel(p))
	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

// CreateList implements Repository.
func (r *repository) CreateList(ctx context.Context, ps []*configuration_center_v1.FrontEnd) error {
	for _, pd := range ps {
		// 保存 FrontEnd 记录（显式忽略关联，避免 GORM 自动保存 LibraryList 导致重复插入）
		pd.CreatedAt = time.Now().Format("2006-01-02 15:04:05.000")
		pd.UpdatedAt = time.Now().Format("2006-01-02 15:04:05.000")
		pd.Status = "Receipt"
		tx := r.db.WithContext(ctx).Omit("LibraryList").Save(pd)
		if tx.Error != nil {
			return tx.Error
		}

		// 保存 FrontEndLibrary 记录
		if pd.LibraryList != nil {
			for _, library := range pd.LibraryList {
				library.FrontEndID = pd.FrontEndID
				// 若外部未传 ID，这里统一生成，确保不会出现空 ID 的记录
				if strings.TrimSpace(library.ID) == "" {
					library.ID = uuid.Must(uuid.NewV7()).String()
				}
				library.FrontEndItemID = pd.ID
				library.CreatedAt = time.Now().Format("2006-01-02 15:04:05.000")
				library.UpdatedAt = time.Now().Format("2006-01-02 15:04:05.000")
				// 仅手动保存库记录，避免重复
				tx := r.db.WithContext(ctx).Save(library)
				if tx.Error != nil {
					return tx.Error
				}
			}
		}
	}

	return nil
}

// Update implements Repository.
func (r *repository) Update(ctx context.Context, p *configuration_center_v1.FrontEndProcessor) error {
	tx := r.db.WithContext(ctx).Save(convertFrontEndProcessorV1ToModel(p))
	// TODO: 区分冲突
	return tx.Error
}

func (r *repository) UpdateStatusAndUpdatedAt(ctx context.Context, id string, status string) error {
	updateData := map[string]interface{}{
		"status":     status,
		"updated_at": time.Now().Format("2006-01-02 15:04:05.000"),
	}

	tx := r.db.WithContext(ctx).
		Table("front_end_processors"). // 替换为实际表名
		Where("id = ?", id).
		Updates(updateData)

	if tx.Error != nil {
		return tx.Error
	}

	if tx.RowsAffected == 0 {
		return gorm.ErrRecordNotFound // 可选：返回 ID 不存在错误
	}

	return nil
}

// UpdateList implements Repository.
func (r *repository) UpdateList(ctx context.Context, ps []*configuration_center_v1.FrontEnd, id string) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	if ps != nil {
		// 删除已存在的 FrontEnd 列表
		if err := tx.Where("front_end_id = ?", id).Delete(&configuration_center_v1.FrontEnd{}).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	for _, pd := range ps {
		// 更新 FrontEnd 记录（显式忽略关联，避免自动保存 LibraryList）
		pd.ID = uuid.Must(uuid.NewV7()).String()
		pd.FrontEndID = id
		// 获取 UTC 时间
		utcNow := time.Now().UTC()
		beijingTime := utcNow.Add(8 * time.Hour)
		pd.CreatedAt = beijingTime.Format("2006-01-02 15:04:05.000")
		pd.UpdatedAt = beijingTime.Format("2006-01-02 15:04:05.000")
		if err := tx.Omit("LibraryList").Save(pd).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 处理 FrontEndLibrary 记录
		if pd.LibraryList != nil {
			// 先删除已存在的 LibraryList
			if err := tx.Where("front_end_item_id = ?", pd.ID).Delete(&configuration_center_v1.FrontEndLibrary{}).Error; err != nil {
				tx.Rollback()
				return err
			}

			// 插入新的 LibraryList
			for _, library := range pd.LibraryList {
				library.FrontEndID = id
				if strings.TrimSpace(library.ID) == "" {
					library.ID = uuid.Must(uuid.NewV7()).String()
				}
				library.FrontEndItemID = pd.ID
				// 获取 UTC 时间
				utcNow := time.Now().UTC()
				beijingTime := utcNow.Add(8 * time.Hour)
				library.CreatedAt = beijingTime.Format("2006-01-02 15:04:05.000")
				library.UpdatedAt = beijingTime.Format("2006-01-02 15:04:05.000")
				if err := tx.Save(&library).Error; err != nil {
					tx.Rollback()
					return err
				}
			}
		}
	}

	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

// AllocateNodeNew implements Repository.
func (r *repository) AllocateNodeNew(ctx context.Context, ps *configuration_center_v1.FrontEndProcessorAllocationRequest, id string) error {
	tx := r.db.WithContext(ctx).Begin()
	defer func() {
		if r := recover(); r != nil {
			tx.Rollback()
		}
	}()

	for _, p := range ps.Allocation {
		p.UpdatedAt = time.Now().Format("2006-01-02 15:04:05.000")
		p.Status = "Receipt"
		p.FrontEndID = id
		// 校验IP是否使用
		if p.IP != "" {
			exist, err := r.GetFrontItemIP(ctx, p.IP)
			if err != nil {
				tx.Rollback()
				return err
			}
			if exist {
				return errorcode.Desc(errorcode.FrontIPExist)
			}
		}
		if err := tx.Where("id = ?", p.ID).Updates(&p).Error; err != nil {
			tx.Rollback()
			return err
		}

		if p.LibraryList != nil {
			// ✅ 新增逻辑：检查当前 LibraryList 中是否有重复的 Name，并提示具体哪个名字重复了
			nameIndices := make(map[string][]int)
			for idx, library := range p.LibraryList {
				nameIndices[library.Name] = append(nameIndices[library.Name], idx)
			}

			var duplicateNames []string
			for name, indices := range nameIndices {
				if len(indices) > 1 {
					duplicateNames = append(duplicateNames, fmt.Sprintf("名称 %q 出现于索引 %v", name, indices))
				}
			}

			if len(duplicateNames) > 0 {
				tx.Rollback()
				//errMsg := strings.Join(duplicateNames, "; ")
				return errorcode.Desc(errorcode.FrontNameFound)
			}
			for _, library := range p.LibraryList {
				library.FrontEndID = id
				library.UpdatedAt = time.Now().Format("2006-01-02 15:04:05.000")
				// 校验名称是否存在
				exist, err := r.GetFrontEndLibraryName(ctx, library.Name, id)
				if err != nil {
					tx.Rollback()
					return err
				}
				if exist {
					return errorcode.Desc(errorcode.FrontNameFound)
				}
				if err := tx.Where("id = ?", library.ID).Updates(&library).Error; err != nil {
					tx.Rollback()
					return err
				}
			}
		}
	}

	// ✅ 添加事务提交
	if err := tx.Commit().Error; err != nil {
		return err
	}

	return nil
}

// Delete implements Repository.
func (r *repository) Delete(ctx context.Context, id string) error {
	tx := r.db.WithContext(ctx).Delete(&model.FrontEndProcessor{ID: id})
	// TODO: 区分 id 不存在
	return tx.Error
	// 删除 FrontEndLibrary 记录
	if err := tx.Where("front_end_id = ?", id).Delete(&configuration_center_v1.FrontEndLibrary{}).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 删除 FrontEnd 记录
	if err := tx.Where("front_end_id = ?", id).Delete(&configuration_center_v1.FrontEnd{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	return nil
}

// Get implements Repository.
func (r *repository) Get(ctx context.Context, id string) (*configuration_center_v1.FrontEndProcessor, error) {
	var record = model.FrontEndProcessorV2{FrontEndProcessorMetadata: model.FrontEndProcessorMetadata{ID: id}}
	tx := r.db.WithContext(ctx).Take(&record)
	if tx.Error != nil {
		return nil, tx.Error
	}
	return convertFrontEndProcessorModelToV1(&record), nil
}

// GetByApplyID implements Repository.
func (r *repository) GetByApplyID(ctx context.Context, id string) (*configuration_center_v1.FrontEndProcessor, error) {
	var record model.FrontEndProcessorV2
	tx := r.db.WithContext(ctx).Where(&configuration_center_v1.FrontEndProcessorStatus{ApplyID: id}).Take(&record)
	if tx.Error != nil {
		return nil, tx.Error
	}
	return convertFrontEndProcessorDetailNodeModelToV1(&record), nil
}

// List implements Repository.
func (r *repository) List(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorListOptions) (*configuration_center_v1.FrontEndProcessorList, error) {
	tx := r.db.WithContext(ctx).Model(&model.FrontEndProcessorV2{})

	if len(opts.Phases) != 0 {
		tx = tx.Where("phase in ?", convertFrontEndProcessorPhasesV1ToModel(opts.Phases))
	}
	if len(opts.DepartmentIDs) != 0 {
		tx = tx.Where("department_id in ?", opts.DepartmentIDs)
	}
	if !opts.RequestTimestampStart.IsZero() {
		tx = tx.Where("request_timestamp >= ?", opts.RequestTimestampStart.Time)
	}
	if !opts.RequestTimestampEnd.IsZero() {
		tx = tx.Where("request_timestamp <= ?", opts.RequestTimestampEnd.Time)
	}
	if opts.OrderID != "" && opts.NodeIP == "" {
		tx = tx.Where("order_id LIKE ?", "%"+replacerFoo.Replace(opts.OrderID)+"%")
	}
	if opts.OrderID == "" && opts.NodeIP != "" {
		tx = tx.Where("node_ip LIKE ?", "%"+replacerFoo.Replace(opts.NodeIP)+"%")
	}
	if opts.OrderID != "" && opts.NodeIP != "" {
		tx = tx.Where("order_id LIKE ? OR node_ip LIKE ?", "%"+replacerFoo.Replace(opts.OrderID)+"%", "%"+replacerFoo.Replace(opts.NodeIP)+"%")
	}
	if opts.ApplyType != "" {
		tx = tx.Where("apply_type = ?", opts.ApplyType)
	}
	//获取当前用户id
	/*userid := middleware.UserFromContextOrEmpty(ctx).ID
	tx = tx.Where("creator_id = ?", userid)*/

	var count int64
	if tx = tx.Count(&count); tx.Error != nil {
		return nil, tx.Error
	}

	if opts.Sort != "" {
		tx = tx.Order(clause.OrderByColumn{Column: clause.Column{Name: opts.Sort}, Desc: opts.Direction == meta_v1.Descending})
	}
	if opts.Limit != 0 {
		tx = tx.Limit(opts.Limit)
	}

	var records []model.FrontEndProcessorV2
	if tx = tx.Find(&records); tx.Error != nil {
		return nil, tx.Error
	}

	return &configuration_center_v1.FrontEndProcessorList{
		Entries:    convertFrontEndProcessorsModelToV1(records),
		TotalCount: int(count),
	}, nil
}

// ResetPhase implements Repository.
func (r *repository) ResetPhase(ctx context.Context) error {
	tx := r.db.WithContext(ctx).
		Model(&model.FrontEndProcessorV2{}).
		Where(model.FrontEndProcessorStatus{Phase: ptr.To(model.FrontEndProcessorAuditing)}).
		Updates(&model.FrontEndProcessorStatus{Phase: ptr.To(model.FrontEndProcessorPending)})
	return tx.Error
}

var (
	//go:embed overview_creation_timestamp_group_by_year_month.sql
	sql_overview_creation_timestamp_group_by_year_month string

	//go:embed overview_reclaim_timestamp_group_by_year_month.sql
	sql_overview_reclaim_timestamp_group_by_year_month string

	//go:embed overview_departments_top15.sql
	sql_overview_departments_top15 string
)

// Overview implements Repository.
func (r *repository) Overview(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorsOverviewGetOptions) (*configuration_center_v1.FrontEndProcessorsOverview, error) {
	// 统计 allocatedCount
	var allocatedCount int64
	if err := r.db.WithContext(ctx).
		Model(&model.FrontEndProcessor{}).
		// 在 opts.End 之前分配
		Where(clause.Lt{Column: "allocation_timestamp", Value: opts.End.Time}, clause.IN{Column: "phase", Values: []interface{}{model.FrontEndProcessorAllocated, model.FrontEndProcessorInCompleted}}).
		Count(&allocatedCount).Error; err != nil {
		return nil, err
	}
	// 统计 inUseCount
	var inUseCount int64
	/*if err := r.db.WithContext(ctx).
		Model(&model.FrontEndProcessor{}).
		// 被删除的前置机也要被纳入统计
		Unscoped().
		Where(clause.And(
			// 在 opts.End 之前签收
			clause.Lt{Column: "receipt_timestamp", Value: opts.End.Time},
			// 未回收，或在 opts.End 之后回收
			clause.Or(clause.Eq{Column: "reclaim_timestamp"}, clause.Gte{Column: "reclaim_timestamp", Value: opts.End.Time}),
		)).
		Count(&inUseCount).Error; err != nil {
		return nil, err
	}*/
	if err := r.db.WithContext(ctx).
		Model(&model.FrontEndItem{}).
		// 被删除的前置机也要被纳入统计
		Unscoped().
		// status 状态为使用中,并且判断实际小于opts.end
		Where(clause.Lt{Column: "updated_at", Value: opts.End.Time}, clause.Eq{Column: "status", Value: "InUse"}).
		Count(&inUseCount).Error; err != nil {
		return nil, err
	}

	// 统计 reclaimedCount
	var reclaimedCount int64
	/*if err := r.db.WithContext(ctx).
		Model(&model.FrontEndProcessor{}).
		// 在 opts.End 之前回收
		Where(clause.Lt{Column: "reclaim_timestamp", Value: opts.End.Time}).
		Count(&reclaimedCount).
		Error; err != nil {
		return nil, err
	}*/
	if err := r.db.WithContext(ctx).
		Model(&model.FrontEndItem{}).
		// state 状态为已回收
		Where(clause.Lt{Column: "updated_at", Value: opts.End.Time}, clause.Eq{Column: "status", Value: configuration_center_v1.FrontEndProcessorReclaimed}).
		Count(&reclaimedCount).
		Error; err != nil {
		return nil, err
	}

	// 统计 totalCount
	var totalCount int64
	if err := r.db.WithContext(ctx).
		Model(&model.FrontEndProcessor{}).
		// 被删除的前置机也要被纳入统计
		Unscoped().
		// 在 opts.End 之前创建
		Where(clause.Lt{Column: "creation_timestamp", Value: opts.End.Time}).
		Count(&totalCount).
		Error; err != nil {
		return nil, err
	}

	// TODO: Use clock instead time.Now
	now := time.Now()
	timeEnd := time.Date(now.Year(), now.Month()+1, 1, 0, 0, 0, 0, now.Location())
	timeStart := timeEnd.AddDate(-1, 0, 0)

	// 统计最近一年，每月新增前置机数量
	var creationTimestampsGroupByMonth []countWithYearMonth
	if tx := r.db.WithContext(ctx).Raw(sql_overview_creation_timestamp_group_by_year_month, timeStart, timeEnd).Scan(&creationTimestampsGroupByMonth); tx.Error != nil {
		return nil, tx.Error
	}
	var lastYearInUse []int
	for t := timeStart; t.Before(timeEnd); t = t.AddDate(0, 1, 0) {
		var c int
		for _, tt := range creationTimestampsGroupByMonth {
			if tt.Year != t.Year() || tt.Month != t.Month() {
				continue
			}
			c = tt.Count
			break
		}
		lastYearInUse = append(lastYearInUse, c)
	}

	// 统计最近一年，每个月回收的前置机
	var reclaimTimestampsGroupByMonth []countWithYearMonth
	if tx := r.db.WithContext(ctx).Raw(sql_overview_reclaim_timestamp_group_by_year_month, timeStart, timeEnd).Scan(&reclaimTimestampsGroupByMonth); tx.Error != nil {
		return nil, tx.Error
	}
	var lastYearReclaimed []int
	for t := timeStart; t.Before(timeEnd); t = t.AddDate(0, 1, 0) {
		var c int
		for _, tt := range reclaimTimestampsGroupByMonth {
			if tt.Year != t.Year() || tt.Month != t.Month() {
				continue
			}
			c = tt.Count
			break
		}
		lastYearReclaimed = append(lastYearReclaimed, c)
	}

	// 统计拥有的前置机数量最多的 15 个部门
	var departments []configuration_center_v1.DepartmentNameFrontEndProcessorCount
	if tx := r.db.WithContext(ctx).Raw(sql_overview_departments_top15).Scan(&departments); tx.Error != nil {
		return nil, tx.Error
	}

	return &configuration_center_v1.FrontEndProcessorsOverview{
		AllocatedCount:    int(allocatedCount),
		InUseCount:        int(inUseCount),
		ReclaimedCount:    int(reclaimedCount),
		TotalCount:        int(totalCount),
		LastYearInUse:     lastYearInUse,
		LastYearReclaimed: lastYearReclaimed,
		DepartmentsTOP15:  departments,
	}, nil
}

// GetFrontEndsByFrontEndProcessorID implements Repository.
func (r *repository) GetFrontEndsByFrontEndProcessorID(ctx context.Context, frontEndProcessorID string) ([]*configuration_center_v1.FrontEnd, error) {
	var frontEnds []*configuration_center_v1.FrontEnd
	tx := r.db.WithContext(ctx).Unscoped().Where("front_end_id = ?", frontEndProcessorID).Find(&frontEnds)
	if tx.Error != nil {
		return nil, tx.Error
	}
	return frontEnds, nil
}

// GetFrontEndLibrariesByFrontEndID implements Repository.
func (r *repository) GetFrontEndLibrariesByFrontEndID(ctx context.Context, frontEndID string, frontEndItemID string) ([]*configuration_center_v1.FrontEndLibrary, error) {
	var frontEndLibraries []*configuration_center_v1.FrontEndLibrary
	tx := r.db.WithContext(ctx).Unscoped().Where("front_end_id = ? and front_end_item_id = ?", frontEndID, frontEndItemID).Find(&frontEndLibraries)
	if tx.Error != nil {
		return nil, tx.Error
	}
	return frontEndLibraries, nil
}

// 重置所有 Phase =  Auditing 状态的 FrontEndProcessor 至 Pending
func (r *repository) ResetAllPhase(ctx context.Context) error {
	tx := r.db.WithContext(ctx).
		Model(&model.FrontEndProcessorV2{}).
		Where(model.FrontEndProcessorStatus{Phase: ptr.To(model.FrontEndProcessorAuditing)}).
		Updates(&model.FrontEndProcessorStatus{Phase: ptr.To(model.FrontEndProcessorPending)})
	return tx.Error
}

// 根据id获取前置机申请详情
func (r *repository) GetByID(ctx context.Context, id string) (*configuration_center_v1.FrontEndProcessor, error) {
	var record model.FrontEndProcessorV2
	if tx := r.db.WithContext(ctx).Where("id = ?", id).First(&record); tx.Error != nil {
		return nil, tx.Error
	}

	return convertFrontEndProcessorModelToV1(&record), nil
}

type countWithYearMonth struct {
	Count int        `json:"count,omitempty"`
	Year  int        `json:"year,omitempty"`
	Month time.Month `json:"month,omitempty"`
}

var replacerFoo = strings.NewReplacer(
	`\`, `\\`,
	`_`, `\_`,
	`%`, `\%`,
	`'`, `\'`,
)

func (r *repository) GetApplyList(ctx context.Context, opts *configuration_center_v1.FrontEndProcessorItemListOptions) (*configuration_center_v1.FrontEndProcessorItemList, error) {
	var items []*configuration_center_v1.FrontEndProcessorItem

	// 构建基础查询
	db := r.db.WithContext(ctx).
		Table("front_end_item AS fei").
		Select("fei.*, fep.department_address, fep.department_id, fep.allocation_timestamp, fep.receipt_timestamp, fep.reclaim_timestamp, lib.type,fep.creator_id ").
		Joins("LEFT JOIN front_end_processors AS fep ON fei.front_end_id = fep.id").
		Joins("LEFT JOIN front_end_library AS lib ON lib.front_end_item_id = fei.id")

	// 动态添加 WHERE 条件
	if opts.NodeIP != "" || opts.Keyword != "" {
		db = db.Where("fei.node_ip like ?", "%"+replacerFoo.Replace(opts.NodeIP)+"%")
	}

	if opts.NodeName != "" {
		db = db.Where("fei.node_name LIKE ?", "%"+replacerFoo.Replace(opts.NodeName)+"%")
	}

	if opts.Status != "" {
		// 支持多状态查询
		statuses := strings.Split(opts.Status, ",")
		db = db.Where("fei.status IN ?", statuses)
	}

	if opts.AdministratorPhone != "" {
		db = db.Where("fei.administrator_phone LIKE ?", "%"+replacerFoo.Replace(opts.AdministratorPhone))
	}

	if opts.AdministratorName != "" {
		db = db.Where("fei.administrator_email LIKE ?", "%"+replacerFoo.Replace(opts.AdministratorName))
	}

	if opts.DepartmentID != "" {
		db = db.Where("fep.department_id = ? ", opts.DepartmentID)
	}

	//获取当前用户id
	/*userid := middleware.UserFromContextOrEmpty(ctx).ID
	db = db.Where("fep.creator_id = ?", userid)*/

	// 打印最终生成的 SQL（含参数替换后的真实 SQL）
	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Scan(&items)
	})
	r.db.Logger.Info(ctx, "Generated SQL: %v", sql)

	// 执行查询
	if tx := db.Scan(&items); tx.Error != nil {
		return nil, tx.Error
	}

	return &configuration_center_v1.FrontEndProcessorItemList{
		Items: items,
		Total: int(db.RowsAffected),
	}, nil
}

// UpdateRequest implements Repository.
func (r *repository) UpdateRequest(ctx context.Context, id string, status string) error {
	updateData := map[string]interface{}{
		"status":     status,
		"updated_at": time.Now().Format("2006-01-02 15:04:05.000"),
	}

	tx := r.db.WithContext(ctx).Table("front_end_item").
		Where("front_end_id = ?", id).
		Updates(updateData)

	if tx.Error != nil {
		return tx.Error
	}
	return nil
}

func (r *repository) GetFrontItemIP(ctx context.Context, IP string) (bool, error) {
	var count int64
	tx := r.db.WithContext(ctx).Table("front_end_item").
		Where("node_ip = ? and status = ?", IP, "InUse").
		Count(&count)
	return count > 0, tx.Error
}

func (r *repository) GetFrontEndLibraryName(ctx context.Context, name string, frontEndID string) (bool, error) {
	var count int64
	tx := r.db.WithContext(ctx).Table("front_end_library").
		Where("name = ? and front_end_id = ?", name, frontEndID).
		Count(&count)
	return count > 0, tx.Error
}
