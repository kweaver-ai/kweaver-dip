package microservice

import (
	"testing"
)

func Test_dataViewRepo_DataViewGet(t *testing.T) {
	// testdata
	var dataViewID = loadRequiredEnv(t, "TEST_DATA_VIEW_ID")

	repo := &dataViewRepo{}

	dataView, err := repo.DataViewGet(getTestContextWithToken(t), dataViewID)
	if err != nil {
		t.Fatal(err)
	}

	logAsJSON(t, "data view", dataView, true)
}
