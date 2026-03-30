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
)

func TestGet(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	if err != nil {
		t.Skip(err)
	}

	repo := &CodeGenerationRuleRepo{db: db}

	result, err := repo.Get(context.TODO(), uuid.MustParse("274723a5-e740-11ee-a45f-be98116cf99f"))
	if assert.NoError(t, err) {
		j, err := json.MarshalIndent(result, "", "  ")
		if err != nil {
			t.Fatal(err)
		}
		t.Logf("code generation rule: %s", j)

		assert.NotZero(t, result.SnowflakeID)
		assert.NotZero(t, result.ID)
		assert.NotZero(t, result.CreatedAt)
		assert.NotZero(t, result.UpdatedAt)
	}

}
