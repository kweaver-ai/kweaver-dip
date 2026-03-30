package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/department_explore_report"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

func NewDepartmentExploreReportRepo(db *gorm.DB) department_explore_report.DepartmentExploreReportRepo {
	return &departmentExploreReportRepo{db: db}
}

type departmentExploreReportRepo struct {
	db *gorm.DB
}

func (r *departmentExploreReportRepo) Update(ctx context.Context, departments []*model.DepartmentExploreReport) error {
	return r.db.Transaction(func(tx *gorm.DB) error {
		// 获取当前所有记录
		var exist []*model.DepartmentExploreReport
		if err := tx.Find(&exist).Error; err != nil {
			return err
		}

		// 创建查找映射
		existMap := make(map[string]*model.DepartmentExploreReport)
		for _, p := range exist {
			existMap[p.DepartmentID] = p
		}

		departmentMap := make(map[string]*model.DepartmentExploreReport)
		for _, p := range departments {
			departmentMap[p.DepartmentID] = p
		}

		// 处理更新和新增
		for departmentId, report := range departmentMap {
			if existReport, exists := existMap[departmentId]; exists {
				// 更新现有记录
				report.ID = existReport.ID // 保持相同ID
				if err := tx.Save(&report).Error; err != nil {
					return err
				}
			} else {
				// 新增记录
				if err := tx.Create(&report).Error; err != nil {
					return err
				}
			}
		}

		// 处理删除
		for departmentId, report := range existMap {
			if _, exists := departmentMap[departmentId]; !exists {
				// 删除不存在的记录
				if err := tx.Delete(&report).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
}

func (r *departmentExploreReportRepo) GetList(ctx context.Context, limit, offset int, sort, direction string, departmentId string) (total int64, tasks []*model.DepartmentExploreReport, err error) {
	d := r.db.WithContext(ctx).Table(model.TableNameDepartmentExploreReport)
	if departmentId != "" {
		departmentIds := strings.Split(departmentId, ",")
		d = d.Where("department_id in ?", departmentIds)
	}
	err = d.Count(&total).Error
	if err != nil {
		return total, tasks, err
	}
	offset = limit * (offset - 1)
	if limit > 0 {
		d = d.Limit(limit).Offset(offset)
	}
	d = d.Order(fmt.Sprintf("%s %s", sort, direction)).Find(&tasks)
	return total, tasks, err
}
