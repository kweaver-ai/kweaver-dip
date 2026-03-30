package gorm

import (
	"context"
	"errors"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"

	"github.com/google/uuid"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util/sets"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
)

type IndicatorDimensionalRuleInterface interface {
	// 创建
	Create(ctx context.Context, rule *model.IndicatorDimensionalRule) (*model.IndicatorDimensionalRule, error)
	// 删除
	Delete(ctx context.Context, id string) (*model.IndicatorDimensionalRule, error)
	// 更新 Spec
	UpdateSpec(ctx context.Context, id string, spec *model.IndicatorDimensionalRuleSpec) (*model.IndicatorDimensionalRule, error)
	// 获取一个
	Get(ctx context.Context, id string) (*model.IndicatorDimensionalRule, error)
	// 获取列表
	List(ctx context.Context, opts *model.IndicatorDimensionalRuleListOptions) (*model.IndicatorDimensionalRuleList, error)
	// 获取所有规则的 ID
	ListID(ctx context.Context, opts *model.IndicatorDimensionalRuleListOptions) ([]string, error)
	//检查同一个逻辑视图下行列规则名称是否重复
	IsRepeat(ctx context.Context, subView *model.IndicatorDimensionalRule) error
	ListRuleID(ctx context.Context, ruleID ...string) (ds []*model.IndicatorDimensionalRule, err error)
	ListRulesByIndicatorID(ctx context.Context, indicatorID ...string) (ds []*model.IndicatorDimensionalRule, err error)
}

type IndicatorDimensionalRuleInterfaceRepository struct {
	DB *gorm.DB
}

func NewIndicatorDimensionalRuleInterfaceRepository(db *gorm.DB) IndicatorDimensionalRuleInterface {
	return &IndicatorDimensionalRuleInterfaceRepository{
		DB: db,
	}
}

// 创建
func (r *IndicatorDimensionalRuleInterfaceRepository) Create(ctx context.Context, rule *model.IndicatorDimensionalRule) (*model.IndicatorDimensionalRule, error) {
	var result model.IndicatorDimensionalRule
	if err := r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&model.IndicatorDimensionalRule{}).Create(rule).Error; err != nil {
			return err
		}
		// MariaDB 10.4 不支持 INSERT...RETURNING... 所以创建后根据 ID 查询
		if err := tx.Model(&model.IndicatorDimensionalRule{}).
			Where(&model.Metadata{ID: rule.ID}).
			Take(&result).Error; err != nil {
			return err
		}
		// 创建指标维度规则的字段
		result.Spec.Fields = rule.Spec.Fields
		if err := reconcileIndicatorDimensionalRuleFields(tx, result.ID, result.Spec.Fields); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return &result, nil
}

// CheckRepeat implements sub_view.SubViewRepo.
// 同一个视图下的授权规则不能一样
func (r *IndicatorDimensionalRuleInterfaceRepository) checkRepeat(ctx context.Context, rule *model.IndicatorDimensionalRule) (bool, error) {
	tx := r.DB.WithContext(ctx).Debug()
	err := tx.Where("indicator_id=? and name=? and id !=?  and deleted_at=0 ",
		rule.Spec.IndicatorID, rule.Spec.Name, rule.ID).Take(&model.IndicatorDimensionalRule{}).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return true, err
	}
	return true, nil
}

// IsRepeat implements sub_view.SubViewRepo.
func (r *IndicatorDimensionalRuleInterfaceRepository) IsRepeat(ctx context.Context, rule *model.IndicatorDimensionalRule) error {
	isRepeat, err := r.checkRepeat(ctx, rule)
	if err != nil {
		return errorcode.PublicDatabaseErr.Err()
	}
	if isRepeat {
		return errorcode.IndicatorRuleNameRepeatError.Err()
	}
	return nil
}

// 删除
func (r *IndicatorDimensionalRuleInterfaceRepository) Delete(ctx context.Context, id string) (*model.IndicatorDimensionalRule, error) {
	var result model.IndicatorDimensionalRule
	if err := r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 删除前获取指标维度规则
		if err := tx.Model(&model.IndicatorDimensionalRule{}).
			Where(&model.Metadata{ID: id}).
			Take(&result).Error; err != nil {
			return err
		}
		// 删除前获取指标维度规则字段
		if err := tx.Model(&model.IndicatorDimensionalRuleField{}).
			Where(&model.IndicatorDimensionalRuleField{RuleID: id}).
			Find(&result.Spec.Fields).Error; err != nil {
			return err
		}
		if len(result.Spec.Fields) == 0 {
			result.Spec.Fields = nil
		}
		// 删除指标维度规则的字段
		if err := reconcileIndicatorDimensionalRuleFields(tx, id, nil); err != nil {
			return err
		}
		// 删除指标维度规则
		if err := tx.Model(&model.IndicatorDimensionalRule{}).
			Where(&model.Metadata{ID: id}).
			Delete(nil).Error; err != nil {
			return err
		}
		return nil
	}); errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	return &result, nil
}

// 更新 Spec
func (r *IndicatorDimensionalRuleInterfaceRepository) UpdateSpec(ctx context.Context, id string, spec *model.IndicatorDimensionalRuleSpec) (*model.IndicatorDimensionalRule, error) {
	var result model.IndicatorDimensionalRule
	if err := r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 更新指标维度
		if tx := tx.Model(&model.IndicatorDimensionalRule{}).
			Where(&model.Metadata{ID: id}).
			Updates(spec); tx.Error != nil {
			return tx.Error
		}
		// MariaDB 10.4 不支持 UPDATE...RETURNING... 所以更新后根据 ID 查询
		if err := tx.Model(&model.IndicatorDimensionalRule{}).
			Where(&model.Metadata{ID: id}).
			Take(&result).Error; err != nil {
			return err
		}
		result.Spec.Fields = spec.Fields
		// 更新指标维度字段
		if err := reconcileIndicatorDimensionalRuleFields(tx, id, result.Spec.Fields); err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}
	return &result, nil
}

// 获取一个
func (r *IndicatorDimensionalRuleInterfaceRepository) Get(ctx context.Context, id string) (*model.IndicatorDimensionalRule, error) {
	var result model.IndicatorDimensionalRule
	r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 查询 IndicatorDimensionalRule
		if err := tx.Model(&model.IndicatorDimensionalRule{}).
			Where(&model.Metadata{ID: id}).
			Take(&result).Error; err != nil {
			return err
		}
		// 查询 IndicatorDimensionalRuleField
		if err := tx.Model(&model.IndicatorDimensionalRuleField{}).
			Where(&model.IndicatorDimensionalRuleField{RuleID: id}).
			Find(&result.Spec.Fields).Error; err != nil {
			return err
		}
		if len(result.Spec.Fields) == 0 {
			result.Spec.Fields = nil
		}
		return nil
	})
	return &result, nil
}

// 获取列表
func (r *IndicatorDimensionalRuleInterfaceRepository) List(ctx context.Context, opts *model.IndicatorDimensionalRuleListOptions) (*model.IndicatorDimensionalRuleList, error) {
	var result model.IndicatorDimensionalRuleList
	r.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 用来查询 IndicatorDimensionalRule 的 gorm.DB
		txRule := tx.Model(&model.IndicatorDimensionalRule{}).Where(&model.IndicatorDimensionalRuleSpec{IndicatorID: opts.IndicatorID})

		// 查询总数量
		if err := txRule.Count(&result.TotalCount).Error; err != nil {
			return err
		}

		if opts.Limit > 0 {
			txRule = txRule.Limit(opts.Limit)
			if opts.Offset > 0 {
				txRule.Offset(opts.Offset)
			}
		}

		// 查询 IndicatorDimensionalRule
		if err := txRule.Find(&result.Entries).Error; err != nil {
			return err
		}
		if len(result.Entries) == 0 {
			result.Entries = nil
		}

		// 查询 IndicatorDimensionalRuleField
		for i, r := range result.Entries {
			if err := tx.Model(&model.IndicatorDimensionalRuleField{}).
				Where(&model.IndicatorDimensionalRuleField{RuleID: r.ID}).
				Find(&result.Entries[i].Spec.Fields).Error; err != nil {
				return err
			}
			if len(result.Entries[i].Spec.Fields) == 0 {
				result.Entries[i].Spec.Fields = nil
			}
		}
		return nil
	})
	return &result, nil
}

// ListRuleID 获取规则 ID 列表
func (r *IndicatorDimensionalRuleInterfaceRepository) ListRuleID(ctx context.Context, ruleID ...string) (ds []*model.IndicatorDimensionalRule, err error) {
	if err = r.DB.WithContext(ctx).
		Model(&model.IndicatorDimensionalRule{}).
		Where("id in ?", ruleID).
		Find(&ds).Error; err != nil {
		return nil, err
	}
	return ds, nil
}

// ListRuleID 获取规则 ID 列表
func (r *IndicatorDimensionalRuleInterfaceRepository) ListRulesByIndicatorID(ctx context.Context, indicatorID ...string) (ds []*model.IndicatorDimensionalRule, err error) {
	if err = r.DB.WithContext(ctx).
		Model(&model.IndicatorDimensionalRule{}).
		Where("indicator_id in ?", indicatorID).
		Find(&ds).Error; err != nil {
		return nil, err
	}
	return ds, nil
}

// 获取规则 ID 列表
func (r *IndicatorDimensionalRuleInterfaceRepository) ListID(ctx context.Context, opts *model.IndicatorDimensionalRuleListOptions) ([]string, error) {
	var uuids []string
	if err := r.DB.WithContext(ctx).Debug().
		Model(&model.IndicatorDimensionalRule{}).
		Where(&model.IndicatorDimensionalRuleSpec{IndicatorID: opts.IndicatorID}).
		Select("id").
		Scan(&uuids).Error; err != nil {
		return nil, err
	}
	return uuids, nil
}

func reconcileIndicatorDimensionalRuleFields(tx *gorm.DB, ruleID string, specs []model.IndicatorDimensionalRuleFieldSpec) error {
	// 已经存在的指标维度字段列表
	var actual []model.IndicatorDimensionalRuleField
	// 查询已经存在的
	if err := tx.Where(&model.IndicatorDimensionalRuleField{RuleID: ruleID}).Find(&actual).Error; err != nil {
		return err
	}

	// 需要创建的指标维度字段列表
	var missing = missingFields(ruleID, actual, specs)
	// 需要更新的指标维度字段列表
	var outdated = outdatedFields(actual, specs)
	// 需要删除的指标维度字段列表
	var redundant = redundantFields(actual, specs)

	// 创建缺少的
	if len(missing) > 0 {
		if err := tx.Create(missing).Error; err != nil {
			return err
		}
	}

	// 更新与期望不一致的
	for _, f := range outdated {
		if err := tx.Updates(f).Error; err != nil {
			return err
		}
	}

	// 删除多余的
	if len(redundant) > 0 {
		var values []any
		for _, f := range redundant {
			values = append(values, f.ID)
		}
		if err := tx.Where(clause.IN{Column: "id", Values: values}).Delete(&model.IndicatorDimensionalRuleField{}).Error; err != nil {
			return err
		}
	}

	return nil
}

// 返回 actual 相对 specs 缺少的 Field。actual{1,2,3}, specs{2,3,4} -> result{4}
func missingFields(ruleID string, actual []model.IndicatorDimensionalRuleField, specs []model.IndicatorDimensionalRuleFieldSpec) (result []model.IndicatorDimensionalRuleField) {
	actualFieldIDs := sets.New[string]()
	for _, f := range actual {
		actualFieldIDs.Insert(f.Spec.FieldID)
	}

	for _, s := range specs {
		if actualFieldIDs.Has(s.FieldID) {
			continue
		}
		result = append(result, model.IndicatorDimensionalRuleField{
			Metadata: model.Metadata{ID: uuid.Must(uuid.NewV7()).String()},
			RuleID:   ruleID,
			Spec:     s,
		})
	}
	return
}

// 返回 FieldID 同时存在于 actual 和 specs，但其他部分不同的。actual{1,2,3}, specs{2,3,4} -> result{2,3}
func outdatedFields(actual []model.IndicatorDimensionalRuleField, specs []model.IndicatorDimensionalRuleFieldSpec) (result []model.IndicatorDimensionalRuleField) {
	for _, f := range actual {
		for _, s := range specs {
			// 比较 FieldID 相同的
			if s.FieldID != f.Spec.FieldID {
				continue
			}

			// 判断是否发生改变
			var updated bool
			updated = updated || f.Spec.Name != s.Name
			updated = updated || f.Spec.NameEn != s.NameEn
			updated = updated || f.Spec.DataType != s.DataType

			// 跳过未改变的
			if !updated {
				continue
			}

			// 记录发生改变的
			result = append(result, model.IndicatorDimensionalRuleField{
				Metadata: f.Metadata,
				RuleID:   f.RuleID,
				Spec:     s,
			})
		}
	}
	return
}

// 返回 actual 相对 specs 多余的 Field。actual{1,2,3}, specs{2,3,4} -> result{1}
func redundantFields(actual []model.IndicatorDimensionalRuleField, specs []model.IndicatorDimensionalRuleFieldSpec) (result []model.IndicatorDimensionalRuleField) {
	fieldIDs := sets.New[string]()
	for _, s := range specs {
		fieldIDs.Insert(s.FieldID)
	}

	for _, f := range actual {
		if fieldIDs.Has(f.Spec.FieldID) {
			continue
		}
		result = append(result, f)
	}
	return
}
