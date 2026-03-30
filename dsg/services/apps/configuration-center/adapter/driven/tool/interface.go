package tool

import "context"

type Tool struct {
	ID    string
	Name  string
}

type Repo interface {
	List(ctx context.Context) ([]*Tool, error)
	Get(ctx context.Context, id string) (*Tool, error)
}
