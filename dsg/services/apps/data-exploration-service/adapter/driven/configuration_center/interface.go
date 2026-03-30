package configuration_center

import (
	"context"

	"github.com/kweaver-ai/idrm-go-common/access_control"
)

type DrivenConfigurationCenter interface {
	HasAccessPermission(ctx context.Context, accessType access_control.AccessType, resource access_control.Resource) (bool, error)
}
