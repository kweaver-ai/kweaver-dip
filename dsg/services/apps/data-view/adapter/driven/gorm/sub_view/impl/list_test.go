package impl

import (
	"context"
	"testing"

	"github.com/google/uuid"

	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
)

func TestList(t *testing.T) {
	repo := &subViewRepo{db: mustGormDB(t)}
	subViews, count, err := repo.List(context.Background(), sub_view.ListOptions{Limit: 10, Offset: 2})
	if err != nil {
		t.Fatal(err)
	}

	logAsJSONPretty(t, "subViews", subViews)
	t.Logf("count: %v, len(subViews): %v", count, len(subViews))
}

func TestListID(t *testing.T) {
	repo := &subViewRepo{db: mustGormDB(t).Debug()}

	var logicViewID uuid.UUID
	logicViewID = uuid.MustParse("8ca93810-4f0b-420b-8a27-b85da2e9a28d")
	logicViewID = uuid.Nil

	subViewIDs, err := repo.ListID(context.Background(), logicViewID)
	if err != nil {
		t.Error(err)
		return
	}
	for _, id := range subViewIDs {
		t.Logf("subViewID=%q", id)
	}
	t.Logf("found %d sub view id(s)", len(subViewIDs))
}
