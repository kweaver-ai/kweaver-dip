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

	driven_code "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule/impl"
	driven_user "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user/impl"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

func TestPatch(t *testing.T) {
	dsn := os.Getenv("TEST_DSN")
	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		t.Skip(err)
	}

	uc := &UseCase{
		codeRepo: driven_code.NewCodeGenerationRuleRepo(db),
		userRepo: driven_user.NewUserRepo(db),
	}

	rule := &domain.CodeGenerationRule{
		CodeGenerationRule: model.CodeGenerationRule{
			ID: uuid.MustParse("bf799b6c-e743-11ee-a45f-be98116cf99f"),
			CodeGenerationRuleSpec: model.CodeGenerationRuleSpec{
				Type:                 model.CodeGenerationRuleTypeDataCatalog,
				Prefix:               "DC",
				PrefixEnabled:        false,
				RuleCode:             "yyyymmdd",
				RuleCodeEnabled:      false,
				CodeSeparator:        "-",
				CodeSeparatorEnabled: false,
				DigitalCodeType:      "Sequence",
				DigitalCodeWidth:     5,
				DigitalCodeStarting:  11,
				DigitalCodeEnding:    99999,
			},
			CodeGenerationRuleStatus: model.CodeGenerationRuleStatus{
				UpdaterID: uuid.MustParse("1c752ca4-e29d-11ee-914b-ce766b456ce9"),
			},
		},
	}

	result, err := uc.Patch(context.TODO(), rule)
	if assert.NoError(t, err) {
		j, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("code generation rule: %s", j)
	}
}
