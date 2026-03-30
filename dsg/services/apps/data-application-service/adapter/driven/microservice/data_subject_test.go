package microservice

import (
	"context"
	"encoding/json"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-common/interception"
)

func Test_dataSubjectRepo_DataSubjectList(t *testing.T) {
	ctx := getTestContextWithToken(t)

	repo := &dataSubjectRepo{}

	res, err := repo.DataSubjectList(ctx, "", "subject_domain_group,subject_domain")
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("total count: %d", res.TotalCount)
	for _, s := range res.Entries {
		t.Logf("data subject: id=%s, name=%s", s.Id, s.Name)
	}
}

func TestDataSubjectGet(t *testing.T) {
	// testdata
	var (
		host        = loadRequiredEnv(t, "TEST_HOST")
		bearerToken = loadRequiredEnv(t, "TEST_BEARER_TOKEN")
		id          = loadRequiredEnv(t, "TEST_ID")
	)

	ctx := context.WithValue(context.Background(), interception.Token, bearerToken)

	repo := &dataSubjectRepo{}

	settings.Instance.Services.DataSubject = host

	res, err := repo.DataSubjectGet(ctx, id)
	if err != nil {
		t.Fatal(err)
	}

	if resJSON, err := json.MarshalIndent(res, "", "  "); err != nil {
		t.Fatal(err)
	} else {
		t.Logf("DataSubject: %s", resJSON)
	}
}
