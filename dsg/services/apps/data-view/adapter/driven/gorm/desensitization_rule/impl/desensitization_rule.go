package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/desensitization_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
	//"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	//"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	//"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type desensitizationRuleRepo struct {
	db *gorm.DB
}

func NewDesensitizationRuleRepo(db *gorm.DB) desensitization_rule.DesensitizationRuleRepo {
	return &desensitizationRuleRepo{db: db}
}

func (r *desensitizationRuleRepo) GetByID(ctx context.Context, id string) (desensitizationRule *model.DesensitizationRule, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameDesensitizationRule).Where("deleted_at = 0").Where("id = ?", id).First(&desensitizationRule).Error
	return
}

func (r *desensitizationRuleRepo) GetByIds(ctx context.Context, ids []string) (desensitizationRules []*model.DesensitizationRule, err error) {
	var db *gorm.DB
	db = r.db.WithContext(ctx).Table(model.TableNameDesensitizationRule).Where("deleted_at = 0")
	db = db.Where("id in ?", ids)
	err = db.Find(&desensitizationRules).Error
	return
}
func (d *desensitizationRuleRepo) GetDesensitizationRuleList(ctx context.Context) (desensitizationRule []*model.DesensitizationRule, err error) {
	err = d.db.WithContext(ctx).Table(model.TableNameDesensitizationRule).Find(&desensitizationRule).Error
	return
}

func (d *desensitizationRuleRepo) GetDesensitizationRuleListByCondition(ctx context.Context, req *form_view.GetDesensitizationRuleListReq) (total int64, desensitizationRule []*model.DesensitizationRule, err error) {
	var db *gorm.DB
	db = d.db.WithContext(ctx).Table("desensitization_rule d").Where("d.deleted_at=0") //deleted_at=0

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("d.name like ?", keyword)
	}

	err = db.Count(&total).Error
	if err != nil {
		return total, desensitizationRule, err
	}

	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}

	db = db.Order(fmt.Sprintf(" %s %s ", req.Sort, req.Direction))

	err = db.Find(&desensitizationRule).Error
	return total, desensitizationRule, err
}

func (d *desensitizationRuleRepo) GetDesensitizationRuleDetail(ctx context.Context, id string) (desensitizationRule *model.DesensitizationRule, err error) {
	err = d.db.WithContext(ctx).Table(model.TableNameDesensitizationRule).Where("id =? and deleted_at=0", id).Take(&desensitizationRule).Error
	return
}

func (d *desensitizationRuleRepo) CreateDesensitizationRule(ctx context.Context, desensitizationRule *model.DesensitizationRule) error {
	return d.db.WithContext(ctx).Create(desensitizationRule).Error

}

func (d *desensitizationRuleRepo) UpdateDesensitizationRule(ctx context.Context, desensitizationRule *model.DesensitizationRule) error {
	return d.db.WithContext(ctx).Table(model.TableNameDesensitizationRule).Where("id=?", desensitizationRule.ID).Updates(desensitizationRule).Error
}

func (d *desensitizationRuleRepo) DeleteDesensitizationRule(ctx context.Context, id string, userid string) error {
	return d.db.WithContext(ctx).Where("id=?", id).Updates(model.DesensitizationRule{UpdatedByUID: userid, DeletedAt: 1}).Error // int32(time.Now().UnixMilli())
}

func (d *desensitizationRuleRepo) GetDesensitizationRuleListByIDs(ctx context.Context, ids []string) (desensitizationRule []*model.DesensitizationRule, err error) {
	err = d.db.WithContext(ctx).Table(model.TableNameDesensitizationRule).Where("id in ? ", ids).Find(&desensitizationRule).Error
	return
}

func (d *desensitizationRuleRepo) GetDesensitizationRuleListWithRelatePolicy(ctx context.Context, ids []string) (result []*model.DesensitizationRuleRelate, err error) {
	//err = d.db.WithContext(ctx).Table(model.TableNameDesensitizationRule).Where("id in ? ", ids).Find(&desensitizationRule).Error
	//return
	var db *gorm.DB
	db = d.db.WithContext(ctx).Table("desensitization_rule d").
		Select("d.id as desensitization_rule_id, d.name as desensitization_rule_name, d.description as description, dpf.data_privacy_policy_id as privacy_policy_id, dp.form_view_id as form_view_id").
		Joins("JOIN data_privacy_policy_field dpf ON dpf.desensitization_rule_id = d.id").
		Joins("JOIN data_privacy_policy dp ON dpf.data_privacy_policy_id = dp.id").
		Where("d.id in ?", ids).
		Where("d.deleted_at=0").
		Where("dpf.deleted_at=0").
		Where("dp.deleted_at=0").
		Scan(&result)
	err = db.Find(&result).Error
	return result, err
}
