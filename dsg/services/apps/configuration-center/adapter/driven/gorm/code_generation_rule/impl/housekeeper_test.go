package impl

import (
	"os"
	"testing"

	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func TestDelete(t *testing.T) {
	db, err := gorm.Open(mysql.Open(os.Getenv("TEST_DSN")))
	if err != nil {
		t.Skip(err)
	}

	count, err := DeleteAlreadySoftDeletedSequenceCodeGenerationStatuses(db, 1)
	if err != nil {
		t.Fatal(err)
	}
	t.Log("count", count)
}
