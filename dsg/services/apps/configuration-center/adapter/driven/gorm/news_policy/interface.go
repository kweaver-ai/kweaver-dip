package news_policy

import (
	"context"
	"time"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/news_policy"
)

type CmsContent struct {
	ID          string     `gorm:"column:id;primaryKey"`
	Title       string     `gorm:"column:title"`
	Summary     string     `gorm:"column:summary"`
	Content     string     `gorm:"column:content"`
	Type        int        `gorm:"column:type"`
	Status      int        `gorm:"column:status"`
	PublishTime *time.Time `gorm:"column:publish_time"`
	CreatorID   int64      `gorm:"column:creator_id"`
	CreateTime  time.Time  `gorm:"column:create_time"`
	UpdateTime  time.Time  `gorm:"column:update_time"`
	IsDeleted   int        `gorm:"column:is_deleted"`
}

type CmsContentImage struct {
	ID         int64     `gorm:"column:id;primaryKey;autoIncrement"`
	ContentID  string    `gorm:"column:content_id"`
	ImageUrl   string    `gorm:"column:image_url"`
	IsCover    int       `gorm:"column:is_cover"`
	CreateTime time.Time `gorm:"column:create_time"`
}

type UseCase interface {
	Create(ctx context.Context, content domain.CmsContent) error
	Update(ctx context.Context, id string, content domain.CmsContent) error
	Delete(id string) error
	List(req *domain.ListReq) ([]*domain.CmsContent, int64, error)
	GetByID(id string) (*domain.CmsContent, error)
	SaveImages(contentID string, urls []string) error
	ListImages(contentID string) ([]*domain.CmsContentImage, error)
	GetNewsPolicy(ctx context.Context, req *domain.NewsDetailsReq) (*domain.CmsContent, error)
	UpdatePolicyStatus(ctx context.Context, req *domain.UpdatePolicyPath) error

	GetHelpDocumentList(ctx context.Context, req *domain.ListHelpDocumentReq) ([]*domain.HelpDocument, int64, error)
	CreateHelpDocument(ctx context.Context, req *domain.HelpDocument) error
	UpdateHelpDocument(ctx context.Context, req *domain.HelpDocument) error
	DeleteHelpDocument(ctx context.Context, id string) error
	GetHelpDocumentDetail(ctx context.Context, req *domain.GetHelpDocumentReq) (*domain.HelpDocument, error)
	GetHelpDocumentById(ctx context.Context, id string) (*domain.HelpDocument, error)
	UpdateHelpDocumentStatus(ctx context.Context, req *domain.UpdateHelpDocumentPath) error
}
