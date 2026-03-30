package liyue_registrations

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type LiyueRegistrationsRepo interface {
	GetLiyueRegistration(ctx context.Context, id string) (*model.LiyueRegistration, error)
	GetLiyueRegistrations(ctx context.Context, id string) ([]*model.LiyueRegistrationUser, error)
}
