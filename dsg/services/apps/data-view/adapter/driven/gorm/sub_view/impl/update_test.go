package impl

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
)

func TestUpdate(t *testing.T) {
	ctx := context.Background()

	repo := &subViewRepo{db: mustGormDB(t)}

	v := &model.SubView{
		ID:          uuid.MustParse("018f6682-11e8-73cf-adf8-e91966f94cb9"),
		Name:        "测试 0511 1537",
		LogicViewID: uuid.MustParse("0b3cce9b-bc96-4eba-a5d9-000000000000"),
		Detail:      `{"c":2}`,
	}

	v, err := repo.Update(ctx, v)
	if err != nil {
		t.Fatalf("error: %#v", err)
	}

	logAsJSON(t, "sub view", v)
}
