package impl

import (
	"context"
	"errors"
	"fmt"
	"math"

	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
	"k8s.io/utils/clock"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// 条件为真时返回指定值，否则返回空
func fn[T any](condition bool, value T) (result T) {
	if condition {
		result = value
	}
	return
}

var Clock clock.Clock = &clock.RealClock{}

func (r *CodeGenerationRuleRepo) Generate(ctx context.Context, id uuid.UUID, count int) ([]string, error) {
	log := log.WithContext(ctx)
	tx := r.db.WithContext(ctx).Debug()

	// 指定编码规则、前缀、规则码、分隔符、数字码宽度的顺序码生成状态
	var status *model.SequenceCodeGenerationStatus
	// 更新序码生成状态
	if err := tx.Transaction(func(tx *gorm.DB) error {
		// 获取编码生成规则
		var rule = &model.CodeGenerationRule{ID: id}
		if err := tx.First(rule).Error; errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("code generation rule is not found", zap.Stringer("id", id))
			return errorcode.Desc(errorcode.CodeGenerationRuleNotFound)
		} else if err != nil {
			log.Error("get code generation rule fail", zap.Error(err), zap.Stringer("id", id))
			return errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
		}

		// 获取指定编码规则、前缀、规则码、分隔符、数字码宽度的顺序码生成状态
		status = &model.SequenceCodeGenerationStatus{
			RuleID:           id,
			Prefix:           fn(rule.PrefixEnabled, rule.Prefix),
			RuleCode:         fn(rule.RuleCodeEnabled, generateRuleCode()),
			CodeSeparator:    fn(rule.CodeSeparatorEnabled, rule.CodeSeparator),
			DigitalCodeWidth: rule.DigitalCodeWidth,
		}

		// 代表是否找到指定编码规则、前缀、规则码、分隔符、数字码宽度的顺序码生成状态
		var found bool

		// 因为 gorm.DB.Where 忽略零值（0, false, ""），所以使用 map[string]any 作为过滤条件
		var condition = map[string]any{
			"rule_id":            status.RuleID,
			"prefix":             status.Prefix,
			"rule_code":          status.RuleCode,
			"code_separator":     status.CodeSeparator,
			"digital_code_width": status.DigitalCodeWidth,
		}

		log.Info("get sequence code generation status", zap.Any("condition", condition))
		if err := tx.Where(condition).Clauses(clause.Locking{Strength: "UPDATE"}).First(status).Error; err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
			log.Error("get sequence code generation status", zap.Error(err), zap.Any("condition", condition))
			return errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
		} else {
			found = err == nil
		}

		// 此次生成的数字码的起始值
		var starting = rule.DigitalCodeStarting
		// 处理顺序码生成状态的方式：创建还是更新
		var (
			processName = "create"
			processFunc = tx.Create
		)

		// 如果找到指定编码规则、前缀、规则码、分隔符、数字码宽度的顺序码生成状态
		if found {
			// max(数字码起始值，上一次生成的数字码的最大值 + 1)
			starting = int(math.Max(float64(rule.DigitalCodeStarting), float64(status.DigitalCode+1)))
			// 找到指定条件的生成状态则更新
			processName, processFunc = "update", tx.Updates
		}

		// 此次生成的数字码的终止值
		if status.DigitalCode = starting + count - 1; status.DigitalCode > rule.DigitalCodeEnding {
			return errorcode.Desc(errorcode.CodeGenerationRuleExceedEnding, rule.DigitalCodeEnding)
		}

		log.Info("process sequence code generation status", zap.String("processName", processName), zap.Any("object", status))
		if err := processFunc(status).Error; err != nil {
			return errorcode.Detail(errorcode.ConfigurationDataBaseError, err)
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return generateCodes(status, count), nil
}

func generateCodes(status *model.SequenceCodeGenerationStatus, count int) (codes []string) {
	for i := status.DigitalCode - count + 1; i <= status.DigitalCode; i++ {
		codes = append(codes, fmt.Sprintf("%s%s%s%0*d", status.Prefix, status.RuleCode, status.CodeSeparator, status.DigitalCodeWidth, i))
	}
	return
}

func generateRuleCode() string {
	return Clock.Now().Local().Format("20060102")
}
