package settings

import (
	"encoding/json"
	"os"
	"path/filepath"
	"testing"

	"github.com/stretchr/testify/assert"

	"github.com/kweaver-ai/idrm-go-common/rest/anyrobot"
)

func TestUnmarshalAnyRobotConf(t *testing.T) {
	want := &AnyRobotConf{
		Enabled: true,
		Config: anyrobot.Config{
			Server: "https://anyrobot.example.org",
		},
		DataViewID: "12450",
	}

	data, err := os.ReadFile(filepath.Join("testdata", "anyrobot-conf.json"))
	if err != nil {
		t.Fatal(err)
	}

	got := &AnyRobotConf{}
	assert.NoError(t, json.Unmarshal(data, got))
	assert.Equal(t, want, got)
}
