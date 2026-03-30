package infrastructure

import (
	"github.com/google/wire"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
)

var Set = wire.NewSet(
	db.NewData,
)
