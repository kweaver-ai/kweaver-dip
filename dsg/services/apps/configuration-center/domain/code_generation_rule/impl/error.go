package impl

import (
	"errors"

	repository "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/code_generation_rule"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/code_generation_rule"
)

// wrapError 返回 common/errorcode 定义的 error
func wrapError(err error) error {
	switch {
	case errors.Is(err, repository.ErrNotFound):
		return domain.ErrNotFound
	default:
		return err
	}
}
