package impl

import (
	"context"
	"encoding/json"
	"os"
	"testing"

	"github.com/google/uuid"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func TestGenerate(t *testing.T) {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})

	host := os.Getenv("TEST_CONFIGURATION_CENTER_HOST")
	if host == "" {
		t.Skip("TEST_CONFIGURATION_CENTER_HOST is empty")
	}

	cfg := &Config{Host: host}
	t.Logf("config: %#v", cfg)

	client, err := NewClient(cfg)
	if err != nil {
		t.Fatal(err)
	}

	t.Logf("client.base: %#v", client.base)

	id := uuid.MustParse("13daf448-d9c4-11ee-81aa-005056b4b3fc")

	list, err := client.Generate(context.TODO(), id, 10)
	if err != nil {
		t.Fatal(err)
	}

	j, err := json.MarshalIndent(list, "", "  ")
	if err != nil {
		t.Fatal(err)
	}
	t.Logf("list: %s", j)
}
