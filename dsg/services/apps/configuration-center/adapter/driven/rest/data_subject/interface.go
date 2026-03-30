package data_subject

import "context"

type DataSubject interface {
	DeleteLabelIds(ctx context.Context, ids string) (bool, error)
}
