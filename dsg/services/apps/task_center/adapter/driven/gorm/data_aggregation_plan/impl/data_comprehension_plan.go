package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain_aggregation_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_aggregation_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

// var _ user.IUserRepo = (*UserRepo)(nil)

type AggregationPlanRepo struct {
	data *db.Data
}

func NewAggregationPlanRepo(data *db.Data) data_aggregation_plan.DataAggregatioPlanRepo {
	return &AggregationPlanRepo{data: data}
}

func (c *AggregationPlanRepo) Create(ctx context.Context, plan *model.DataAggregationPlan) error {
	result := c.data.DB.Debug().WithContext(ctx).Create(plan)
	return result.Error
}

func (c *AggregationPlanRepo) Delete(ctx context.Context, id string) error {
	Db := c.data.DB.WithContext(ctx).Debug()
	err := Db.Where("id=?", id).Delete(&model.DataAggregationPlan{}).Error
	return err
}

func (c *AggregationPlanRepo) Update(ctx context.Context, plan *model.DataAggregationPlan) error {
	result := c.data.DB.Debug().WithContext(ctx).Where("id=?", plan.ID).Updates(plan)
	return result.Error
}

func (c *AggregationPlanRepo) GetById(ctx context.Context, id string) (plan *model.DataAggregationPlan, err error) {
	result := c.data.DB.WithContext(ctx).Take(&plan, "id=?", id)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(errorcode.PlanIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}

func (c *AggregationPlanRepo) GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataAggregationPlan, error) {
	if len(ids) < 1 {
		log.WithContext(ctx).Warn("plan ids is empty")
		return nil, nil
	}
	res := make([]*model.DataAggregationPlan, 0)
	result := c.data.DB.WithContext(ctx).Where("data_aggregation_plan_id in ?", ids).Find(&res, ids)
	return res, result.Error
}

func (c *AggregationPlanRepo) List(ctx context.Context, params domain_aggregation_plan.AggregationPlanQueryParam) (int64, []*model.DataAggregationPlan, error) {
	limit := params.Limit
	offset := limit * (params.Offset - 1)

	Db := c.data.DB.Debug().WithContext(ctx).Model(&model.DataAggregationPlan{})
	if params.Keyword != "" {
		Db = Db.Where("name like ?", "%"+util.KeywordEscape(util.XssEscape(params.Keyword))+"%")
	}
	if params.FinishedAt != 0 {
		Db = Db.Where(" started_at <= ?", params.FinishedAt)
	}
	if params.StartedAt != 0 {
		Db = Db.Where(" (finished_at >= ? or finished_at = 0) ", params.StartedAt)
	}
	if params.Priority != "" {
		Db = Db.Where(" priority = ?", params.Priority)
	}
	if params.Audit_status != "" {
		Db = Db.Where(" audit_status = ?", AuditStatus2Int(params.Audit_status))
	}
	if params.Status != "" {
		Db = Db.Where(" status = ?", domain_aggregation_plan.Str2Status2(params.Status))
	}
	// 添加用户ID过滤条件
	if params.UserID != "" {
		Db = Db.Where("responsible_uid = ?", params.UserID)
	}

	var total int64
	err := Db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	models := make([]*model.DataAggregationPlan, 0)
	// 使用同一个Db实例，继续添加分页和排序条件
	err = Db.Limit(int(limit)).Offset(int(offset)).Order(fmt.Sprintf("%s %s, data_aggregation_plan_id asc", params.Sort, params.Direction)).Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil
}

func (c *AggregationPlanRepo) CheckNameRepeat(ctx context.Context, id, name string) (bool, error) {
	var nameList []string
	tx := c.data.DB.WithContext(ctx).Model(&model.DataAggregationPlan{})
	tx.Distinct("name")
	tx.Where("name = ?", name)
	if id != "" {
		tx.Where("id != ?", id)
	}
	result := tx.Find(&nameList)
	if result.Error != nil {
		return false, result.Error
	}
	count := len(nameList)
	if count != 0 {
		return true, nil
	}
	return false, nil
}

func Declaration2Str2Status(s string) (status int) {
	switch s {
	case "to_declaration":
		status = 1
	case "declarationed":
		status = 2
	}
	return status
}

func AuditStatus2Int(status string) (s int) {
	switch status {
	case "auditing":
		s = domain_aggregation_plan.Auditing
	case "undo":
		s = domain_aggregation_plan.Undo
	case "reject":
		s = domain_aggregation_plan.Reject
	case "pass":
		s = domain_aggregation_plan.Pass
	}
	return s
}
