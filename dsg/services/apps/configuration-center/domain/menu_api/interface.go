package menu_api

import "context"

type UseCase interface {
	Upsert(ctx context.Context, rs []*MenuApiRelation) error
	GetServiceApis(ctx context.Context, serviceName string) ([]string, error)
}

type MenuApiRelation struct {
	Aid    string   `json:"aid"`
	Action string   `json:"action"`
	Keys   []string `json:"keys"`
}

type MenuApiRelationDetail struct {
	Aid    string   `json:"aid"`
	Action string   `json:"action"`
	Keys   []string `json:"keys"`
}
