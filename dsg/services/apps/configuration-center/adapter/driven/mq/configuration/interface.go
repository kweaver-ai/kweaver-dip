package configuration

import "context"

type ConfigurationHandle interface {
	SetBusinessDomainLevel(ctx context.Context, payload *BusinessDomainLevelMessage) error
}

const (
	BusinessDomainTopic = "af.configuration-center.business-domain-level"
)

type BusinessDomainLevelMessage struct {
	Level []string `json:"level"`
}
