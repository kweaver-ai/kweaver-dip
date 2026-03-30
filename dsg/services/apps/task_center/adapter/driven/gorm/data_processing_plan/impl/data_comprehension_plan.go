package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_processing_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain_processing_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

// var _ user.IUserRepo = (*UserRepo)(nil)

type ProcessingPlanRepo struct {
	data *db.Data
}

func NewProcessinPlanRepo(data *db.Data) data_processing_plan.DataProcessingPlanRepo {
	return &ProcessingPlanRepo{data: data}
}

func (c *ProcessingPlanRepo) Create(ctx context.Context, plan *model.DataProcessingPlan) error {
	result := c.data.DB.Debug().WithContext(ctx).Create(plan)
	return result.Error
}

func (c *ProcessingPlanRepo) Delete(ctx context.Context, id string) error {
	Db := c.data.DB.WithContext(ctx).Debug()
	err := Db.Where("id=?", id).Delete(&model.DataProcessingPlan{}).Error
	return err
}

func (c *ProcessingPlanRepo) Update(ctx context.Context, plan *model.DataProcessingPlan) error {
	result := c.data.DB.Debug().WithContext(ctx).Where("id=?", plan.ID).Updates(plan)
	return result.Error
}

func (c *ProcessingPlanRepo) GetById(ctx context.Context, id string) (plan *model.DataProcessingPlan, err error) {
	result := c.data.DB.WithContext(ctx).Take(&plan, "id=?", id)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(errorcode.PlanIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}

func (c *ProcessingPlanRepo) GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataProcessingPlan, error) {
	if len(ids) < 1 {
		log.WithContext(ctx).Warn("plan ids is empty")
		return nil, nil
	}
	res := make([]*model.DataProcessingPlan, 0)
	result := c.data.DB.WithContext(ctx).Where("data_processing_plan_id in ?", ids).Find(&res, ids)
	return res, result.Error
}

func (c *ProcessingPlanRepo) List(ctx context.Context, params domain_processing_plan.ProcessingPlanQueryParam) (int64, []*model.DataProcessingPlan, error) {
	limit := params.Limit
	offset := limit * (params.Offset - 1)

	Db := c.data.DB.Debug().WithContext(ctx).Model(&model.DataProcessingPlan{})
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
		Db = Db.Where(" status = ?", domain_processing_plan.Str2Status2(params.Status))
	}

	var total int64
	err := Db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	models := make([]*model.DataProcessingPlan, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))
	err = Db.Order(fmt.Sprintf("%s %s, data_processing_plan_id asc", params.Sort, params.Direction)).Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil

}

func (c *ProcessingPlanRepo) CheckNameRepeat(ctx context.Context, id, name string) (bool, error) {
	var nameList []string
	tx := c.data.DB.WithContext(ctx).Model(&model.DataProcessingPlan{})
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

func AuditStatus2Int(status string) (s int) {
	switch status {
	case "auditing":
		s = domain_processing_plan.Auditing
	case "undo":
		s = domain_processing_plan.Undo
	case "reject":
		s = domain_processing_plan.Reject
	case "pass":
		s = domain_processing_plan.Pass
	}
	return s
}
