package af_main

import (
	"context"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type SubjectDomainGetter interface {
	SubjectDomain() SubjectDomainInterface
}
type SubjectDomainInterface interface {
	Get(ctx context.Context, id string) (*model.SubjectDomain, error)
}

type subjectDomains struct {
	db *gorm.DB
}

func newSubjectDomains(db *gorm.DB) *subjectDomains { return &subjectDomains{db: db} }

// Get 根据 ID 返回主题域
func (c *subjectDomains) Get(ctx context.Context, id string) (*model.SubjectDomain, error) {
	result := &model.SubjectDomain{ID: id}
	if err := c.db.WithContext(ctx).Take(result).Error; err != nil {
		return nil, err
	}
	return result, nil
}
