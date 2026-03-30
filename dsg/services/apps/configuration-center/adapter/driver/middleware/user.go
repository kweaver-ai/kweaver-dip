package middleware

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/interception"
)

var (
	ErrNotExist       = errors.New("value does not exist")
	ErrUnexpectedType = errors.New("unexpected value type for context key")
)

func UserFromContext(ctx context.Context) (*model.User, error) {
	v := ctx.Value(interception.InfoName)
	if v == nil {
		return nil, ErrNotExist
	}

	u, ok := v.(*model.User)
	if !ok {
		return nil, ErrUnexpectedType
	}

	return u, nil
}

func UserFromContextOrEmpty(ctx context.Context) *model.User {
	u, err := UserFromContext(ctx)
	if err != nil {
		u = &model.User{}
	}
	return u
}
