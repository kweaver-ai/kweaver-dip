// domain/carousels/interface.go
package carousels

import (
	"context"
	_ "mime/multipart"

	//导入D:\go_workplace\configuration-center\domain\carousels\interface.go这个类
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/carousels"
)

type CarouselCase struct {
	ID                   string `json:"id"`
	ApplicationExampleID string `json:"application_example_id"`
	UserID               string `json:"user_id"`
	FileName             string `json:"file_name"`
	FilePath             string `json:"file_path"`
	FileType             string `json:"file_type"`
	CreatedAt            string `json:"created_at"`
	UpdatedAt            string `json:"updated_at"`
	State                string `json:"state"`
	Type                 string `json:"type"`
}

type IRepository interface {
	Create(ctx context.Context, carouselCase *domain.CarouselCase) error
	GetByID(ctx context.Context, id string) (*CarouselCase, error)
	GetCount(ctx context.Context) (int64, error)
	GetByApplicationExampleID(ctx context.Context, applicationExampleID string) ([]*CarouselCase, error)
	Delete(ctx context.Context, id string) error
	Update(ctx context.Context, carouselCase *domain.CarouselCase) error
	// Get 获取所有数据
	Get(ctx context.Context, opts *domain.CarouselCase) ([]*domain.CarouselCase, error)
	// GetWithPagination 获取分页数据
	GetWithPagination(ctx context.Context, opts *domain.CarouselCase, offset int, limit int, id string) ([]*domain.CarouselCase, int64, error)
	GetByCaseName(ctx context.Context, opts *domain.ListCaseReq) ([]*domain.CarouselCaseWithCaseName, error)
	UpdateInterval(ctx context.Context, opts *domain.IntervalSeconds) error
	UpdateTop(ctx context.Context, req *domain.IDResp) error
	CountByType(ctx context.Context, types string) (int64, error)
	// UpdateSort 更新排序
	UpdateSort(ctx context.Context, req *domain.UpdateSortReq) error
}
