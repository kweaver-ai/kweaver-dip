package scope

import (
	"encoding/json"

	"gorm.io/gorm"
)

type Function struct {
	Description any
	Underlying  func(*gorm.DB) *gorm.DB `json:"-"`
}

// Scope implements Scope.
func (s *Function) Scope(tx *gorm.DB) *gorm.DB {
	return s.Underlying(tx)
}

func (s *Function) MarshalJSON() ([]byte, error) {
	if s == nil {
		return []byte("null"), nil
	}
	return json.Marshal(s.Description)
}

var _ Scope = &Function{}
