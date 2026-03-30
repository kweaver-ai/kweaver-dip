package impl

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	driven "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule/impl"
)

func TestExistenceCheckPrefix(t *testing.T) {
	dsn := os.Getenv("TEST_DSN")
	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		t.Skip(err)
	}

	uc := &UseCase{
		codeRepo: driven.NewCodeGenerationRuleRepo(db),
	}

	result, err := uc.ExistenceCheckPrefix(context.TODO(), "SJST")
	if assert.NoError(t, err) {
		assert.True(t, result)
	}
}
