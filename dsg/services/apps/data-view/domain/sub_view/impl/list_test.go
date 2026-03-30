package impl

import (
	"context"
	"testing"

	"github.com/google/uuid"

	gorm_sub_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/sub_view"
)

func TestList(t *testing.T) {
	db := mustGormDB(t)

	ctx := context.Background()

	c := &subViewUseCase{subViewRepo: gorm_sub_view.NewSubViewRepo(db)}

	got, err := c.List(ctx, sub_view.ListOptions{LogicViewID: uuid.MustParse("6da4391c-d87e-4f6b-bf8f-417c1c0b3cf4"), Limit: 2, Offset: 3})
	if err != nil {
		t.Fatalf("error: %#v", err)
	}

	for _, sv := range got.Entries {
		t.Logf("name: %q, logicView: %v", sv.Name, sv.LogicViewID)
	}
	t.Logf("total_count=%v", got.TotalCount)
}
