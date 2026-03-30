package impl

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	gorm_driver_mysql "gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

func TestCreate(t *testing.T) {
	t.Skip("passed")

	db, err := gorm.Open(gorm_driver_mysql.Open(os.Getenv("TEST_DSN")))
	if err != nil {
		t.Skip(err)
	}

	repo := &CodeGenerationRuleRepo{db: db}

	rule := &model.CodeGenerationRule{
		Name: "API",
		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
			Type:                 model.CodeGenerationRuleTypeApi,
			Prefix:               "API",
			PrefixEnabled:        true,
			RuleCode:             model.CodeGenerationRuleRuleCodeYYYYMMDD,
			RuleCodeEnabled:      true,
			CodeSeparator:        model.CodeGenerationRuleCodeSeparatorSlash,
			CodeSeparatorEnabled: true,
			DigitalCodeType:      model.CodeGenerationRuleDigitalCodeTypeSequence,
			DigitalCodeWidth:     6,
			DigitalCodeStarting:  1,
			DigitalCodeEnding:    999999,
		},
	}

	result, err := repo.Create(context.TODO(), rule)
	if assert.NoError(t, err) {
		j, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("code generation rule: %s", j)

		assert.NotZero(t, rule.SnowflakeID)
		assert.NotZero(t, rule.ID)
		assert.NotZero(t, rule.CreatedAt)
		assert.NotZero(t, rule.UpdatedAt)
	}
}
