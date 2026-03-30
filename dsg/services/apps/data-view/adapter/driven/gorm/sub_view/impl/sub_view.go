package impl

import (
	"gorm.io/gorm"

	gorm_sub_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/sub_view"
)

type subViewRepo struct {
	db *gorm.DB
}

func NewSubViewRepo(db *gorm.DB) gorm_sub_view.SubViewRepo { return &subViewRepo{db: db} }
