package impl

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/stretchr/testify/assert"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestList(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	if err != nil {
		t.Skip(err)
	}

	repo := &CodeGenerationRuleRepo{db: db}

	result, err := repo.List(context.TODO())
	if assert.NoError(t, err) {
		j, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("code generation rules: %s", j)
		assert.Len(t, result, 2)
	}
}
