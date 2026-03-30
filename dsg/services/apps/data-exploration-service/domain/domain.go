package domain

import (
	"github.com/google/wire"
	common "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/common/impl"
	explorationServer "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	exploration "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl"
	explorationTools "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/tools"
	explorationV2 "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/v2"
	task_config "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/task_config/impl"
)

// Set is biz providers.
var Set = wire.NewSet(
	explorationTools.NewEngineSource,
	exploration.NewExplorationDomain,
	explorationServer.NewServer,
	task_config.NewTaskConfigDomain,
	common.NewCommonDomain,
	explorationV2.NewExplorationDomain,
)
