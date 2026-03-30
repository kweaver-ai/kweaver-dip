package impl

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	driven_code "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule/impl"
	driven_user "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/user/impl"
)

func TestList(t *testing.T) {
	dsn := os.Getenv("TEST_DSN")
	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		t.Skip(err)
	}

	uc := &UseCase{
		codeRepo: driven_code.NewCodeGenerationRuleRepo(db),
		userRepo: driven_user.NewUserRepo(db),
	}

	result, err := uc.List(context.TODO())
	if assert.NoError(t, err) {
		j, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("code generation rules: %s", j)
	}
}
