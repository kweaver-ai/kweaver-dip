package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/template_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func NewTemplateRuleRepo(db *gorm.DB) template_rule.TemplateRuleRepo {
	return &templateRuleRepo{db: db}
}

type templateRuleRepo struct {
	db *gorm.DB
}

func (r *templateRuleRepo) Create(ctx context.Context, m *model.TemplateRule) (id string, err error) {
	err = r.db.WithContext(ctx).Model(&model.TemplateRule{}).Create(m).Error
	if err != nil {
		return "", err
	}
	return m.RuleID, nil
}

func (r *templateRuleRepo) GetByRuleId(ctx context.Context, ruleId string) (exploreRule *model.TemplateRule, err error) {
	err = r.db.WithContext(ctx).Model(&model.TemplateRule{}).Where("rule_id =? and deleted_at = 0", ruleId).Take(&exploreRule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.RuleIdNotExist)
		}
		log.WithContext(ctx).Error("templateRuleRepo GetByRuleId DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(errorcode.DatabaseError, err.Error())
	}
	return
}

func (r *templateRuleRepo) Update(ctx context.Context, m *model.TemplateRule) error {
	return r.db.WithContext(ctx).Model(&model.TemplateRule{}).Where("rule_id =? and deleted_at = 0", m.RuleID).Save(m).Error
}

func (r *templateRuleRepo) UpdateStatus(ctx context.Context, id string, enable bool) error {
	status := 0
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if enable {
			status = 1
			var exploreRule *model.TemplateRule
			err := tx.Model(&model.TemplateRule{}).Where("rule_id = ? and deleted_at = 0", id).Take(&exploreRule).Error
			if err != nil {
				return err
			}
			err = tx.Model(&model.TemplateRule{}).Where("dimension_type = ? and enable = 1 and deleted_at = 0", exploreRule.DimensionType).UpdateColumn("enable", 0).Error
			if err != nil {
				return err
			}
		}
		err := tx.Model(&model.TemplateRule{}).Where("rule_id = ? and deleted_at = 0", id).UpdateColumn("enable", status).Error
		if err != nil {
			return err
		}
		return nil
	})
}

func (r *templateRuleRepo) Delete(ctx context.Context, ruleId string) error {
	return r.db.WithContext(ctx).Model(&model.TemplateRule{}).Where("rule_id =?", ruleId).Delete(&model.TemplateRule{}).Error
}

func (r *templateRuleRepo) GetList(ctx context.Context, req *explore_rule.GetTemplateRuleListReq) (templateRules []*model.TemplateRule, err error) {
	d := r.db.WithContext(ctx).Model(&model.TemplateRule{})
	if req.RuleLevel != "" {
		d = d.Where("rule_level = ?", enum.ToInteger[explore_rule.RuleLevel](req.RuleLevel).Int32())
	}
	if req.Dimension != "" {
		d = d.Where("dimension = ?", enum.ToInteger[explore_rule.Dimension](req.Dimension).Int32())
	}
	if req.DimensionType != "" {
		d = d.Where("dimension_type = ?", enum.ToInteger[explore_rule.DimensionType](req.DimensionType).Int32())
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
	err = d.Where("deleted_at = 0").Order(fmt.Sprintf("%s %s", req.Sort, req.Direction)).Find(&templateRules).Error
	return
}

func (r *templateRuleRepo) GetInternalRules(ctx context.Context) (templateRules []*model.TemplateRule, err error) {
	err = r.db.WithContext(ctx).Model(&model.TemplateRule{}).Where("source = 1").Find(&templateRules).Error
	return
}

func (r *templateRuleRepo) NameRepeat(ctx context.Context, ruleId, name string) (bool, error) {
	var exploreRule *model.TemplateRule
	var err error
	db := r.db.WithContext(ctx).Model(&model.TemplateRule{}).Where("rule_name = ? and deleted_at = 0", name)
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

func (r *templateRuleRepo) CheckSysRuleNameRepeat(ctx context.Context, name string) (bool, error) {
	var exploreRule *model.TemplateRule
	var err error
	db := r.db.WithContext(ctx).Model(&model.TemplateRule{}).Where("source = 1 and rule_name = ? and deleted_at = 0", name)

	err = db.Take(&exploreRule).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, err
	}
	return true, nil
}
