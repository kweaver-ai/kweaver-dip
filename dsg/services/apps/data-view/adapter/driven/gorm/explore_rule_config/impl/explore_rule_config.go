package impl

import (
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/explore_rule_config"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"errors"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"strings"
)

func NewExploreRuleConfigRepo(db *gorm.DB) explore_rule_config.ExploreRuleConfigRepo {
	return &exploreRuleConfigRepo{db: db}
}

type exploreRuleConfigRepo struct {
	db *gorm.DB
}

func (r *exploreRuleConfigRepo) GetTemplateRules(ctx context.Context) (exploreRules []*model.ExploreRuleConfig, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("template_id is not null and rule_id is null and deleted_at = 0").Find(&exploreRules).Error
	if err != nil {
		log.WithContext(ctx).Error("exploreRuleConfigRepo Get DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreRuleDatabaseError, err.Error())
	}
	return
}

func (r *exploreRuleConfigRepo) Create(ctx context.Context, m *model.ExploreRuleConfig) (id string, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Create(m).Error
	if err != nil {
		return "", err
	}
	return m.RuleID, nil
}

func (r *exploreRuleConfigRepo) BatchCreate(ctx context.Context, m []*model.ExploreRuleConfig) error {
	return r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).CreateInBatches(m, 1000).Error
}

func (r *exploreRuleConfigRepo) GetByRuleId(ctx context.Context, ruleId string) (exploreRule *model.ExploreRuleConfig, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id =? and deleted_at = 0", ruleId).Take(&exploreRule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.RuleIdNotExist)
		}
		log.WithContext(ctx).Error("exploreRuleConfigRepo GetByRuleId DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreRuleDatabaseError, err.Error())
	}
	return
}

func (r *exploreRuleConfigRepo) Update(ctx context.Context, m *model.ExploreRuleConfig) error {
	return r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id =? and deleted_at = 0", m.RuleID).Save(m).Error
}

func (r *exploreRuleConfigRepo) UpdateStatus(ctx context.Context, ids []string, enable bool) error {
	status := 0
	if enable {
		status = 1
	}
	return r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id in ? and deleted_at = 0", ids).UpdateColumn("enable", status).Error
}

func (r *exploreRuleConfigRepo) Delete(ctx context.Context, ruleId string) error {
	return r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id =?", ruleId).Delete(&model.ExploreRuleConfig{}).Error
}

func (r *exploreRuleConfigRepo) GetList(ctx context.Context, req *explore_task.GetRuleListReqQuery) (exploreRules []*model.ExploreRuleConfig, err error) {
	d := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id is not null")
	if req.FieldId != "" {
		d = d.Where("field_id = ?", req.FieldId)
	} else if req.FormViewId != "" {
		d = d.Where("form_view_id = ?", req.FormViewId)
	} else {
		return
	}
	if req.RuleLevel != "" {
		d = d.Where("rule_level = ?", enum.ToInteger[explore_task.RuleLevel](req.RuleLevel).Int32())
	}
	if req.Dimension != "" {
		d = d.Where("dimension = ?", enum.ToInteger[explore_task.Dimension](req.Dimension).Int32())
	}
	if req.Enable != nil {
		status := 0
		if *req.Enable {
			status = 1
		}
		d = d.Where("enable = ?", status)
	}
	if req.Keyword != "" {
		if strings.Contains(req.Keyword, "_") {
			req.Keyword = strings.Replace(req.Keyword, "_", "\\_", -1)
		}
		req.Keyword = "%" + req.Keyword + "%"
		d.Where("rule_name like ?", req.Keyword)
	}
	err = d.Where("deleted_at = 0").Find(&exploreRules).Error
	return
}

func (r *exploreRuleConfigRepo) CheckRuleNameRepeat(ctx context.Context, formViewId, ruleId, name string) (bool, error) {
	var exploreRule *model.ExploreRuleConfig
	var err error
	db := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("form_view_id = ? and ((rule_name = ? and deleted_at = 0) or (template_id is not null and rule_name = ? and deleted_at = 0))", formViewId, name, name)
	if ruleId != "" {
		err = db.Where("rule_id <> ? ", ruleId).Take(&exploreRule).Error
	} else {
		err = db.Take(&exploreRule).Error
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *exploreRuleConfigRepo) NameRepeat(ctx context.Context, formViewId, filedId, ruleId, name string) (bool, error) {
	var exploreRule *model.ExploreRuleConfig
	var err error
	db := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{})
	if filedId != "" {
		db = db.Where("field_id = ? and rule_name = ? and deleted_at = 0", filedId, name)
	} else if formViewId != "" {
		db = db.Where("form_view_id = ? and rule_name = ? and deleted_at = 0", formViewId, name)
	}

	if ruleId != "" {
		err = db.Where("rule_id <> ? ", ruleId).Take(&exploreRule).Error
	} else {
		err = db.Take(&exploreRule).Error
	}

	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}

func (r *exploreRuleConfigRepo) GetByTemplateId(ctx context.Context, templateId string) (exploreRule *model.ExploreRuleConfig, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("template_id =? and deleted_at = 0", templateId).Take(&exploreRule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.TemplateIdNotExist)
		}
		log.WithContext(ctx).Error("exploreRuleConfigRepo GetByTemplateId DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.ExploreRuleDatabaseError, err.Error())
	}
	return
}

func (r *exploreRuleConfigRepo) HasTemplateRule(ctx context.Context, ids []string) (bool, error) {
	var exploreRules []*model.ExploreRuleConfig
	err := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("template_id is not null and template_id in ? and deleted_at = 0", ids).Find(&exploreRules).Error
	if err != nil {
		return false, err
	}
	if len(exploreRules) > 0 {
		return true, err
	}
	return false, nil
}

func (r *exploreRuleConfigRepo) GetByFieldId(ctx context.Context, fieldId string) ([]*model.ExploreRuleConfig, error) {
	var exploreRules []*model.ExploreRuleConfig
	err := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("field_id = ? and deleted_at = 0", fieldId).Find(&exploreRules).Error
	return exploreRules, err
}

func (r *exploreRuleConfigRepo) GetByFieldIds(ctx context.Context, fieldIds []string) ([]*model.ExploreRuleConfig, error) {
	var exploreRules []*model.ExploreRuleConfig
	if len(fieldIds) == 0 {
		return exploreRules, nil
	}
	err := r.db.WithContext(ctx).
		Model(&model.ExploreRuleConfig{}).
		Where("field_id in ? and deleted_at = 0", fieldIds).
		Find(&exploreRules).Error
	return exploreRules, err
}

func (r *exploreRuleConfigRepo) GetRulesByFormViewIds(ctx context.Context, ids []string) ([]*model.ExploreRuleConfig, error) {
	var exploreRules []*model.ExploreRuleConfig
	err := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id is not null and form_view_id in ? and enable = 1 and deleted_at = 0", ids).Find(&exploreRules).Error
	return exploreRules, err
}

func (r *exploreRuleConfigRepo) GetEnabledRules(ctx context.Context, formViewId string) ([]*model.ExploreRuleConfig, error) {
	var exploreRules []*model.ExploreRuleConfig
	err := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id is not null and form_view_id = ? and enable = 1 and deleted_at = 0", formViewId).Find(&exploreRules).Error
	return exploreRules, err
}

func (r *exploreRuleConfigRepo) CheckRuleByTemplateId(ctx context.Context, templateId, formViewId, fieldId string) (bool, error) {
	var exploreRules []*model.ExploreRuleConfig
	d := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("template_id =? and form_view_id =? and deleted_at = 0", templateId, formViewId)
	if fieldId != "" {
		d = d.Where("field_id =?", fieldId)
	}
	err := d.Find(&exploreRules).Error
	if err != nil {
		return false, err
	}
	if len(exploreRules) > 0 {
		return true, err
	}
	return false, nil
}

func (r *exploreRuleConfigRepo) GetConfiguredViewsByFormViewIds(ctx context.Context, formViewIds []string) (total int64, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Distinct("form_view_id").Where("rule_id is not null and form_view_id in ? and enable = 1 and deleted_at = 0", formViewIds).Count(&total).Error
	if err != nil {
		log.WithContext(ctx).Error("exploreRuleConfigRepo GetConfiguredViewsByFormViewIds DatabaseError", zap.Error(err))
		return total, err
	}
	return total, nil
}

func (r *exploreRuleConfigRepo) GetRulesByFormViewIdAndLevel(ctx context.Context, id string, ruleLevel int32) (exploreRules []*model.ExploreRuleConfig, err error) {
	err = r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("rule_id is not null and form_view_id = ? and rule_level = ? and deleted_at = 0", id, ruleLevel).Find(&exploreRules).Error
	return exploreRules, err
}

func (r *exploreRuleConfigRepo) CheckSysRuleNameRepeat(ctx context.Context, name string) (bool, error) {
	var exploreRule *model.ExploreRuleConfig
	var err error
	db := r.db.WithContext(ctx).Model(&model.ExploreRuleConfig{}).Where("template_id is not null and rule_id is null and rule_name = ? and deleted_at = 0", name)

	err = db.Take(&exploreRule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
