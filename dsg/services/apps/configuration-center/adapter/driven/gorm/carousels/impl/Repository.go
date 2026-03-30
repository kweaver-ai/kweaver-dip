package impl

// infrastructure/persistence/carousels/repository.go

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/carousels"
	_ "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/carousels"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/carousels"
	"gorm.io/gorm"
)

type Repository struct {
	db *gorm.DB
}

func NewRepository(db *gorm.DB) carousels.IRepository {
	return &Repository{db: db}
}

func (r *Repository) Create(ctx context.Context, carouselCase *domain.CarouselCase) error {
	return r.db.WithContext(ctx).Create(carouselCase).Error
}

func (r *Repository) GetByID(ctx context.Context, id string) (*carousels.CarouselCase, error) {
	var carousel carousels.CarouselCase
	err := r.db.WithContext(ctx).Where("id = ?", id).First(&carousel).Error
	if err != nil {
		return nil, err
	}
	return &carousel, nil
}

func (r *Repository) Get(ctx context.Context, opts *domain.CarouselCase) ([]*domain.CarouselCase, error) {
	var carousels []*domain.CarouselCase
	result := r.db.WithContext(ctx).Find(&carousels)
	return carousels, result.Error
}

// GetWithPagination 获取分页数据
func (r *Repository) GetWithPagination(ctx context.Context, opts *domain.CarouselCase, offset int, limit int, id string) ([]*domain.CarouselCase, int64, error) {
	var carousels []*domain.CarouselCase
	var total int64

	query := r.db.WithContext(ctx)

	// 获取符合条件的总记录数
	if id == "" {
		err := query.Model(&domain.CarouselCase{}).Count(&total).Error
		if err != nil {
			return nil, 0, err
		}
	} else {
		var count int64
		err := query.Model(&domain.CarouselCase{}).Where("id = ?", id).Count(&count).Error
		if err != nil {
			return nil, 0, err
		}
		total = count
	}

	offset = limit * (offset - 1)
	// 获取分页数据
	// 1. 首先按照 sort_order 排序
	// 2. 然后按照创建时间排序
	query = query.Where("type = ?", "0").
		Order("sort_order ASC").
		Order("created_at ASC")

	err := query.Offset(offset).Limit(limit).Find(&carousels).Error
	if err != nil {
		return nil, 0, err
	}

	return carousels, total, nil
}

func (r *Repository) GetByApplicationExampleID(ctx context.Context, applicationExampleID string) ([]*carousels.CarouselCase, error) {
	var carousels []*carousels.CarouselCase
	err := r.db.WithContext(ctx).Where("id = ?", applicationExampleID).Find(&carousels).Error
	if err != nil {
		return nil, err
	}
	return carousels, nil
}

func (r *Repository) Delete(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Where("id = ?", id).Delete(&carousels.CarouselCase{}).Error
}
func (r *Repository) Update(ctx context.Context, carouselCase *domain.CarouselCase) error {
	return r.db.WithContext(ctx).Where("id = ?", carouselCase.ID).Updates(carouselCase).Error
}

// GetByCaseName 获取案例名称
func (s *Repository) GetByCaseName(ctx context.Context, opts *domain.ListCaseReq) ([]*domain.CarouselCaseWithCaseName, error) {
	var carousels []*domain.CarouselCaseWithCaseName

	// 构建基础 SQL
	query := `
		SELECT a.* ,b.name as CaseName 
		FROM af_configuration.t_carousel_case a 
		INNER JOIN af_main.t_sszd_application_example b 
		ON a.application_example_id = b.id`

	// 动态添加 WHERE 条件
	var args []interface{}
	whereClauses := []string{"a.type IN ('1','2')"}

	if opts.Name != "" {
		whereClauses = append(whereClauses, "b.name LIKE ?")
		args = append(args, "%"+opts.Name+"%")
	}

	// 拼接 WHERE 条件
	if len(whereClauses) > 0 {
		query += " WHERE " + strings.Join(whereClauses, " AND ")
	}

	limit := opts.Limit
	offset := limit * (opts.Offset - 1)

	// 添加排序和分页
	// 1. 首先按照 sort_order 排序
	// 2. 然后按照创建时间排序
	query += ` ORDER BY 
		a.sort_order ASC,
		a.created_at ASC 
		LIMIT ? OFFSET ?`
	args = append(args, limit, offset)

	// 执行原生 SQL 查询并扫描结果
	result := s.db.WithContext(ctx).Raw(query, args...).Scan(&carousels)
	return carousels, result.Error
}

func (s *Repository) GetCount(ctx context.Context) (int64, error) {
	var count int64
	err := s.db.WithContext(ctx).Model(&domain.CarouselCase{}).Where("type = ?", "0").Count(&count).Error
	return count, err
}

func (s *Repository) UpdateInterval(ctx context.Context, opts *domain.IntervalSeconds) error {
	error := s.db.WithContext(ctx).Model(&domain.CarouselCase{}).Where("type = ?", "0").Update("interval_seconds", opts.IntervalSeconds).Error
	return error
}

// UpdateSort 更新排序
func (s *Repository) UpdateSort(ctx context.Context, req *domain.UpdateSortReq) error {
	tx := s.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}

	var allRecords []domain.CarouselCase

	// 去除type参数前后的单引号
	typeStr := strings.Trim(req.Type, "'")

	// 解析type参数，支持逗号分隔的多个type值
	types := strings.Split(typeStr, ",")

	// 清理每个type值前后的空格和引号
	for i, t := range types {
		types[i] = strings.Trim(t, " '")
	}

	var err error
	if len(types) == 1 {
		// 单个type值使用等值查询
		err = tx.Where("type = ?", types[0]).Order("sort_order ASC, created_at ASC").Find(&allRecords).Error
	} else {
		// 多个type值使用IN查询
		err = tx.Where("type IN ?", types).Order("sort_order ASC, created_at ASC").Find(&allRecords).Error
	}

	if err != nil {
		tx.Rollback()
		return err
	}

	// 找到当前记录的位置
	currentIndex := -1
	for i, record := range allRecords {
		if record.ID == req.ID {
			currentIndex = i
			break
		}
	}
	if currentIndex == -1 {
		tx.Rollback()
		return fmt.Errorf("record not found")
	}

	// 计算目标位置（基于1的索引转换为基于0的索引）
	targetIndex := req.SortOrder - 1
	if targetIndex < 0 {
		targetIndex = 0
	}
	if targetIndex >= len(allRecords) {
		targetIndex = len(allRecords) - 1
	}

	// 如果目标位置就是当前位置，不需要移动
	if currentIndex == targetIndex {
		return tx.Commit().Error
	}

	// 创建新的排序数组
	newOrder := make([]domain.CarouselCase, len(allRecords))

	// 复制当前记录
	currentRecord := allRecords[currentIndex]

	// 重新排列数组 - 修复后的逻辑
	if currentIndex < targetIndex {
		// 向下移动
		// 1. 复制当前位置之前的元素
		copy(newOrder[:currentIndex], allRecords[:currentIndex])
		// 2. 复制当前位置到目标位置之间的元素（向前移动一位）
		copy(newOrder[currentIndex:targetIndex], allRecords[currentIndex+1:targetIndex+1])
		// 3. 将当前元素放到目标位置
		newOrder[targetIndex] = currentRecord
		// 4. 复制目标位置之后的元素
		copy(newOrder[targetIndex+1:], allRecords[targetIndex+1:])
	} else {
		// 向上移动
		// 1. 复制目标位置之前的元素
		copy(newOrder[:targetIndex], allRecords[:targetIndex])
		// 2. 将当前元素放到目标位置
		newOrder[targetIndex] = currentRecord
		// 3. 复制目标位置到当前位置之间的元素（向后移动一位）
		copy(newOrder[targetIndex+1:currentIndex+1], allRecords[targetIndex:currentIndex])
		// 4. 复制当前位置之后的元素
		copy(newOrder[currentIndex+1:], allRecords[currentIndex+1:])
	}

	// 更新数据库中的排序值
	for i, record := range newOrder {
		newSortOrder := i + 1
		if record.SortOrder != newSortOrder {
			if err := tx.Model(&domain.CarouselCase{}).Where("id = ?", record.ID).Update("sort_order", newSortOrder).Error; err != nil {
				tx.Rollback()
				return err
			}
		}
	}

	return tx.Commit().Error
}

// UpdateTop 更新置顶状态
func (s *Repository) UpdateTop(ctx context.Context, req *domain.IDResp) error {
	// 开启事务
	tx := s.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// 获取当前记录
	var currentRecord domain.CarouselCase
	if err := tx.Where("id = ?", req.ID).First(&currentRecord).Error; err != nil {
		tx.Rollback()
		return err
	}

	// 如果当前记录已经是置顶状态，则取消置顶
	if currentRecord.IsTop == "0" {
		// 获取所有非置顶记录的最小 sort_order
		var minSortOrder int
		if err := tx.Model(&domain.CarouselCase{}).
			Where("is_top != ?", "0").
			Select("MIN(sort_order)").
			Scan(&minSortOrder).Error; err != nil {
			tx.Rollback()
			return err
		}

		// 如果找不到非置顶记录，使用默认值 1000
		if minSortOrder == 0 {
			minSortOrder = 1000
		}

		// 更新记录为非置顶状态，并将 sort_order 设置为非置顶记录的最小值
		if err := tx.Model(&domain.CarouselCase{}).
			Where("id = ?", req.ID).
			Updates(map[string]interface{}{
				"is_top":     "1",
				"sort_order": minSortOrder,
			}).Error; err != nil {
			tx.Rollback()
			return err
		}
	} else {
		// 置顶操作：将记录设置为置顶状态，并将 sort_order 设置为一个固定的较小值
		// 使用 0 作为置顶记录的 sort_order，确保它始终排在最前面
		if err := tx.Model(&domain.CarouselCase{}).
			Where("id = ?", req.ID).
			Updates(map[string]interface{}{
				"is_top":     "0",
				"sort_order": 0, // 使用 0 作为置顶记录的 sort_order
			}).Error; err != nil {
			tx.Rollback()
			return err
		}
	}

	// 提交事务
	return tx.Commit().Error
}

func (s *Repository) CountByType(ctx context.Context, types string) (int64, error) {
	var count int64
	error := s.db.WithContext(ctx).Model(&domain.CarouselCase{}).Where("type = ?", types).Count(&count).Error
	return count, error
}

// UpdateOtherSortOrders 更新其他图片的排序，确保它们的排序值大于置顶图片
func (s *Repository) UpdateOtherSortOrders(ctx context.Context, topID string) error {
	// 开启事务
	tx := s.db.WithContext(ctx).Begin()
	if tx.Error != nil {
		return tx.Error
	}

	// 更新所有非置顶图片的排序值，使其大于置顶图片
	err := tx.Model(&domain.CarouselCase{}).
		Where("id != ? AND is_top != ?", topID, "0").
		Update("sort_order", gorm.Expr("sort_order + ?", 1000)).Error
	if err != nil {
		tx.Rollback()
		return err
	}

	// 提交事务
	return tx.Commit().Error
}
