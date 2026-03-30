package impl

import (
	"context"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
)

func TestCount(t *testing.T) {
	var dsn = os.Getenv("TEST_DSN")

	db, err := gorm.Open(mysql.Open(dsn))
	if err != nil {
		t.Skip(err)
	}

	repo := &CodeGenerationRuleRepo{db: db}

	result, err := repo.Count(context.TODO(), code_generation_rule.ListOptions{Prefix: "SJST"})
	if assert.NoError(t, err) {
		assert.Equal(t, 1, result)
	}
}
