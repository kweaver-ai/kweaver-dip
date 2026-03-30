package driver

import (
	"github.com/google/wire"
	subject_domain "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driver/subject_domain/v1"
	middleware "github.com/kweaver-ai/idrm-go-common/middleware/v1"
)

var Set = wire.NewSet(
	NewRouter,
	NewHttpEngine,
	middleware.NewMiddleware,
	subject_domain.NewBusinessDomainService,
)
