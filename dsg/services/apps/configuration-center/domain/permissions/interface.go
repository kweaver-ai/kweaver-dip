package permissions

import (
	"context"
)

type UseCase interface {
	AddPermissions(ctx context.Context) error
	InitTCPermissions(ctx context.Context) (err error)
}
