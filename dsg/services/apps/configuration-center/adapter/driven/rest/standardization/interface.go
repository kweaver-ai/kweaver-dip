package standardization

import "context"

type Standardization interface {
	DeleteLabelIds(ctx context.Context, ids string) (bool, error)
}
