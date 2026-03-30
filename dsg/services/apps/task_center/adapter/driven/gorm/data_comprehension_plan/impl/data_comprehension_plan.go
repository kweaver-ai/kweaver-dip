package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_comprehension_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain_comprehension_plan "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_comprehension_plan"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

// var _ user.IUserRepo = (*UserRepo)(nil)

type ComprehensionPlanRepo struct {
	data *db.Data
}

func NewComprehensionPlanRepo(data *db.Data) data_comprehension_plan.DataComprehensionPlanRepo {
	return &ComprehensionPlanRepo{data: data}
}

func (c *ComprehensionPlanRepo) Create(ctx context.Context, plan *model.DataComprehensionPlan) error {
	result := c.data.DB.Debug().WithContext(ctx).Create(plan)
	return result.Error
}

func (c *ComprehensionPlanRepo) Delete(ctx context.Context, id string) error {
	Db := c.data.DB.WithContext(ctx).Debug()
	err := Db.Where("id=?", id).Delete(&model.DataComprehensionPlan{}).Error
	return err
}

func (c *ComprehensionPlanRepo) Update(ctx context.Context, plan *model.DataComprehensionPlan) error {
	result := c.data.DB.Debug().WithContext(ctx).Where("id=?", plan.ID).Updates(plan)
	return result.Error
}

func (c *ComprehensionPlanRepo) GetById(ctx context.Context, id string) (plan *model.DataComprehensionPlan, err error) {
	result := c.data.DB.WithContext(ctx).Take(&plan, "id=?", id)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(errorcode.PlanIdNotExistError)
		}
		return nil, errorcode.Detail(errorcode.UserDataBaseError, result.Error.Error())
	}
	return
}

func (c *ComprehensionPlanRepo) List(ctx context.Context, params domain_comprehension_plan.ComprehensionPlanQueryParam) (int64, []*model.DataComprehensionPlan, error) {
	limit := params.Limit
	offset := limit * (params.Offset - 1)

	Db := c.data.DB.Debug().WithContext(ctx).Model(&model.DataComprehensionPlan{})
	if params.Keyword != "" {
		Db = Db.Where("name like ?", "%"+util.KeywordEscape(util.XssEscape(params.Keyword))+"%")
	}
	if params.FinishedAt != 0 {
		Db = Db.Where(" started_at <= ?", params.FinishedAt)
	}
	if params.StartedAt != 0 {
		Db = Db.Where(" (finished_at >= ? or finished_at = 0) ", params.StartedAt)
	}
	if params.Audit_status != "" {
		Db = Db.Where(" audit_status = ?", AuditStatus2Int(params.Audit_status))
	}
	if params.Status != "" {
		Db = Db.Where(" status = ?", domain_comprehension_plan.Str2Status2(params.Status))
	}

	var total int64
	err := Db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	models := make([]*model.DataComprehensionPlan, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))
	err = Db.Order(fmt.Sprintf("%s %s, data_comprehension_plan_id asc", params.Sort, params.Direction)).Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil
}

func (c *ComprehensionPlanRepo) CheckNameRepeat(ctx context.Context, id, name string) (bool, error) {
	var nameList []string
	tx := c.data.DB.WithContext(ctx).Model(&model.DataComprehensionPlan{})
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

func (c *ComprehensionPlanRepo) GetByUniqueIDs(ctx context.Context, ids []uint64) ([]*model.DataComprehensionPlan, error) {
	if len(ids) < 1 {
		log.WithContext(ctx).Warn("plan ids is empty")
		return nil, nil
	}
	res := make([]*model.DataComprehensionPlan, 0)
	result := c.data.DB.WithContext(ctx).Where("data_comprehension_plan_id in ?", ids).Find(&res, ids)
	return res, result.Error
}

func AuditStatus2Int(status string) (s int) {
	switch status {
	case "auditing":
		s = domain_comprehension_plan.Auditing
	case "undo":
		s = domain_comprehension_plan.Undo
	case "reject":
		s = domain_comprehension_plan.Reject
	case "pass":
		s = domain_comprehension_plan.Pass
	}
	return s
}
