package impl

import (
	"context"
	"testing"

	"github.com/google/uuid"
)

func TestGet(t *testing.T) {
	r := &subViewRepo{db: mustGormDB(t)}

	v, err := r.Get(context.Background(), uuid.MustParse("018f6682-11e8-73cf-adf8-e91966f94cb9"))
	if err != nil {
		t.Fatal(err)
	}

	logAsJSONPretty(t, "sub view", v)
}

func TestGetLogicViewID(t *testing.T) {
	r := &subViewRepo{db: mustGormDB(t).Debug()}

	id, err := r.GetLogicViewID(context.Background(), uuid.MustParse("0191e002-d9eb-72ed-b849-2654512796ca"))
	if err != nil {
		t.Error(err)
		return
	}

	t.Logf("logicViewID=%q", id)
}
