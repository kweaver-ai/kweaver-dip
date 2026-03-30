package impl

import (
	"context"
	"encoding/json"
	"math/rand"
	"testing"
	"time"

	"github.com/google/uuid"
	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agcodes"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
)

func TestCreate(t *testing.T) {
	repo := &subViewRepo{db: mustGormDB(t)}

	want := &model.SubView{
		Name:        "测试 " + time.Now().Format("0511 1515"),
		LogicViewID: uuid.New(),
		Detail:      `{"a":0}`,
	}

	got, err := repo.Create(context.Background(), want)
	if err != nil {
		coder := agerrors.Code(err)
		if coder == agcodes.CodeNil {
			t.Fatal(err)
		}
		errJSON, err := json.Marshal(map[string]any{
			"code":        coder.GetErrorCode(),
			"description": coder.GetDescription(),
			"details":     coder.GetErrorDetails(),
		})
		if err != nil {
			t.Fatal(err)
		}
		t.Fatalf("struct error: %s", errJSON)
	}

	logAsJSON(t, "SubView", got)

	assert.NotZero(t, got.ID, "id")
	assert.Equal(t, want.Name, got.Name, "name")
	assert.Equal(t, want.LogicViewID, got.LogicViewID, "logicViewID")
	assert.Equal(t, want.Detail, got.Detail, "detail")
}

const (
	alphabet       = "abcdefghijklmnopqrstuvwxyz"
	number         = "0123456789"
	alphabetNumber = alphabet + number
)

func generateRandomString(n int) string {
	result := make([]byte, n)
	for i := range result {
		p := rand.Intn(len(alphabetNumber))
		result[i] = alphabetNumber[p]
	}

	return string(result)
}

func TestUUID(t *testing.T) {
	for i := 0; i < 16; i++ {
		id, err := uuid.NewV7()
		if err != nil {
			t.Fatal(err)
		}
		t.Log(id)
	}
}
