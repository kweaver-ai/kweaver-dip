package impl

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func TestDelete(t *testing.T) {
	repo := &subViewRepo{db: mustGormDB(t)}
	if err := repo.Delete(context.Background(), uuid.MustParse("00001111-2222-3333-4444-555566667777")); err != nil {
		t.Fatal(err)
	}
}
