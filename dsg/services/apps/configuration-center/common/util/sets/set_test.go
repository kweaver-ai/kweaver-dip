package sets

import (
	"testing"

	"github.com/google/uuid"
)

func TestLogUUIDSet(t *testing.T) {
	var uuids = New(
		uuid.New(),
		uuid.New(),
		uuid.New(),
		uuid.New(),
	)
	t.Logf("numberSet: %v", uuids.UnsortedList())
}
