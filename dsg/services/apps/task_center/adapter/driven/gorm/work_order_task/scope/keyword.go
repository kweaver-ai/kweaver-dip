package scope

import (
	"gorm.io/gorm"
	"gorm.io/gorm/clause"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
)

type Keyword struct {
	Columns []string `json:"columns,omitempty"`
	Value   string   `json:"value,omitempty"`
}

// Scope implements Scope.
func (s *Keyword) Scope(tx *gorm.DB) *gorm.DB {
	var expressions []clause.Expression
	for i, c := range s.Columns {
		if i == 0 {
			tx = tx.Where(clause.Like{
				Column: clause.Column{
					Table: model.TableNameWorkOrderTasks,
					Name:  c,
				},
				Value: "%" + util.KeywordEscape(s.Value) + "%",
			})
		} else {
			tx = tx.Or(clause.Like{
				Column: clause.Column{
					Table: model.TableNameWorkOrderTasks,
					Name:  c,
				},
				Value: "%" + util.KeywordEscape(s.Value) + "%",
			})
		}
	}

	return tx.Where(clause.Or(expressions...))
}

var _ Scope = &Keyword{}
