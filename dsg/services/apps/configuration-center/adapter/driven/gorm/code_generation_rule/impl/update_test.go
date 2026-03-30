package impl

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

func TestUpdate(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	if err != nil {
		t.Skip(err)
	}

	repo := &CodeGenerationRuleRepo{db: db}

	rule := &model.CodeGenerationRule{
		ID: uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc"),
		CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
			Type:                 model.CodeGenerationRuleTypeApi,
			Prefix:               "SJ",
			PrefixEnabled:        false,
			RuleCode:             "MMDD",
			RuleCodeEnabled:      false,
			CodeSeparator:        model.CodeGenerationRuleCodeSeparatorHyphen,
			CodeSeparatorEnabled: false,
			DigitalCodeType:      "DIGITAL_CODE_TYPE",
			DigitalCodeWidth:     5,
			DigitalCodeStarting:  111,
			DigitalCodeEnding:    88888,
		},
		CodeGenerationRuleStatus: model.CodeGenerationRuleStatus{
			UpdaterID: uuid.New(),
		},
	}

	result, err := repo.Update(context.TODO(), rule)
	if assert.NoError(t, err) {
		j, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("code generation rule: %s", j)
		assert.Greater(t, result.UpdatedAt, result.CreatedAt)
	}
}

func TestUpdateRaw(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	if err != nil {
		t.Skip(err)
	}

	db = db.Debug()

	rule := &model.CodeGenerationRule{ID: uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")}
	if err := db.First(rule).Error; err != nil {
		t.Fatal(err)
	}
	LogJSON(t, "original rule", rule)

	rule.PrefixEnabled = false
	rule.CodeSeparatorEnabled = false
	rule.RuleCodeEnabled = false
	if err := db.Save(rule).Error; err != nil {
		t.Fatal(err)
	}

	rule = &model.CodeGenerationRule{ID: uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")}
	if err := db.First(rule).Error; err != nil {
		t.Fatal(err)
	}
	LogJSON(t, "modified rule", rule)
}

func LogJSON(t *testing.T, name string, value any) {
	t.Helper()
	j, err := json.MarshalIndent(value, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("%s: %s", name, j)
}
