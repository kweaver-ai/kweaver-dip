package sets

import (
	"testing"

	"github.com/google/uuid"

	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func TestLogUUIDSet(t *testing.T) {
	log.InitLogger(zapx.LogConfigs{}, &telemetry.Config{})

	var uuids = New(
		uuid.New(),
		uuid.New(),
		uuid.New(),
		uuid.New(),
	)
	t.Logf("numberSet: %v", uuids.UnsortedList())
}
