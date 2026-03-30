package settings

import "github.com/google/wire"

var Set = wire.NewSet(
	WorkflowMQConf,
)
