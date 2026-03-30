package impl

import (
	"context"
	"sort"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/points_management"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type PointsEventImpl struct {
	db *db.Data
}

func NewPointsEventImplRepo(db *db.Data) points_management.PointsEventRepo {
	return &PointsEventImpl{db: db}
}

func (r *PointsEventImpl) Create(ctx context.Context, pointEvent *model.PointsEvent) error {
	return r.db.DB.WithContext(ctx).Create(pointEvent).Error
}

func (r *PointsEventImpl) PersionalPointsList(ctx context.Context, userID string, limit *int) (int64, []*model.PointsEvent, error) {
	var total int64
	db := r.db.DB.WithContext(ctx).Model(&model.PointsEvent{}).
		Where("points_event.points_object_id = ?", userID)
	err := db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	models := make([]*model.PointsEvent, 0)
	query := db.Order("points_event.created_at DESC")
	if limit != nil {
		query = query.Limit(*limit)
	}
	err = query.Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil
}

func (r *PointsEventImpl) DepartmentPointsList(ctx context.Context, departmentID string, limit *int) (int64, []*model.PointsEvent, error) {
	var total int64
	db := r.db.DB.WithContext(ctx).Model(&model.PointsEventTopDepartment{}).
		Joins("LEFT JOIN points_event ON points_event.point_event_id = points_event_top_department.points_event_id").
		Where("points_event_top_department.department_path LIKE ?", "%"+departmentID+"%")
	err := db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	models := make([]*model.PointsEvent, 0)
	query := db.
		Select("points_event.*").
		Order("points_event.created_at DESC")
	if limit != nil {
		query = query.Limit(*limit)
	}
	err = query.Scan(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil
}

func (r *PointsEventImpl) DepartmentTotalPoints(ctx context.Context, departmentID string) (int64, error) {
	var totalPoints int64
	err := r.db.DB.WithContext(ctx).Model(&model.PointsEventTopDepartment{}).
		Select("COALESCE(SUM(points_event.points_value), 0)").
		Joins("LEFT JOIN points_event ON points_event.point_event_id = points_event_top_department.points_event_id").
		Where("points_event_top_department.department_id = ?", departmentID).
		Scan(&totalPoints).Error
	if err != nil {
		return 0, err
	}
	return totalPoints, nil
}

func (r *PointsEventImpl) PersonalTotalPoints(ctx context.Context, userID string) (int64, error) {
	var totalPoints int64
	err := r.db.DB.WithContext(ctx).Model(&model.PointsEvent{}).
		Where("points_object_id = ?", userID).
		Select("COALESCE(SUM(points_value), 0)").
		Scan(&totalPoints).Error
	if err != nil {
		return 0, err
	}
	return totalPoints, nil
}

func (r *PointsEventImpl) DepartmentPointsTop(ctx context.Context, year string, top int) ([]points_management.DepartmentPointsRank, error) {
	var ranks []points_management.DepartmentPointsRank
	err := r.db.DB.WithContext(ctx).Model(&model.PointsEventTopDepartment{}).
		Select("points_event_top_department.department_id as id, points_event_top_department.department_name as name, COALESCE(SUM(points_event.points_value), 0) as points").
		Joins("LEFT JOIN points_event ON points_event.point_event_id = points_event_top_department.points_event_id").
		Where("YEAR(points_event.created_at) = ?", year).
		Group("points_event_top_department.department_id").
		Order("points DESC").
		Limit(top).
		Scan(&ranks).Error
	if err != nil {
		return nil, err
	}
	return ranks, nil
}

func (r *PointsEventImpl) PointsEventGroupByCode(ctx context.Context, year string) ([]points_management.DepartmentPointsRank, error) {
	var ranks []points_management.DepartmentPointsRank
	err := r.db.DB.WithContext(ctx).Model(&model.PointsEvent{}).
		Select("business_module as id, COALESCE(SUM(points_value), 0) as points").
		Where("YEAR(created_at) = ?", year).
		Group("business_module").
		Order("points DESC").
		Scan(&ranks).Error
	if err != nil {
		return nil, err
	}
	return ranks, nil
}

func (r *PointsEventImpl) PointsEventGroupByCodeAndMonth(ctx context.Context, year string) (map[string]interface{}, error) {
	type Result struct {
		Month  string
		Code   string
		Points int64
	}
	var results []Result

	err := r.db.DB.WithContext(ctx).Model(&model.PointsEvent{}).
		Select("DATE_FORMAT(created_at, '%Y-%m') as Month, business_module as Code, COALESCE(SUM(points_value), 0) as Points").
		Where("YEAR(created_at) = ?", year).
		Group("Month, business_module").
		Order("Month, business_module").
		Scan(&results).Error
	if err != nil {
		return nil, err
	}

	// Format response
	response := map[string]interface{}{
		"columns": []string{
			"date",
			"dir_feedback",
			"share_request_feedback",
			"data_connect_task",
			"requirements_request",
			"share_request",
		},
		"data": [][]interface{}{},
	}

	// Group by month
	monthMap := make(map[string]map[string]int64)
	var months []string
	for _, r := range results {
		if _, exists := monthMap[r.Month]; !exists {
			monthMap[r.Month] = make(map[string]int64)
			months = append(months, r.Month)
		}
		monthMap[r.Month][r.Code] = r.Points
	}

	// Sort months in descending order
	sort.Strings(months)

	// Build data rows in sorted order
	for _, month := range months {
		row := []interface{}{
			month,
			monthMap[month]["dir_feedback"],
			monthMap[month]["share_request_feedback"],
			monthMap[month]["data_connect_task"],
			monthMap[month]["requirements_request"],
			monthMap[month]["share_request"],
		}
		response["data"] = append(response["data"].([][]interface{}), row)
	}

	return response, nil
}

func (r *PointsEventImpl) BatchCreateTopDepartment(ctx context.Context, topDepartments []*model.PointsEventTopDepartment) error {
	if len(topDepartments) == 0 {
		return nil
	}

	err := r.db.DB.WithContext(ctx).Create(&topDepartments).Error
	if err != nil {
		return err
	}

	return nil
}
