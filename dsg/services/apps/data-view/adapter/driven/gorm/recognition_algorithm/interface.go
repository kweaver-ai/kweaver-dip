package recognition_algorithm

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/recognition_algorithm"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"gorm.io/gorm"
)

// RecognitionAlgorithmRepo 是识别算法表的仓储接口
// 提供对识别算法数据的数据库操作

type RecognitionAlgorithmRepo interface {
	// Db 返回数据库操作对象
	Db() *gorm.DB

	// GetById 根据主键获取识别算法记录
	GetById(ctx context.Context, id string, tx ...*gorm.DB) (*model.RecognitionAlgorithm, error)

	// GetByIds 根据主键列表获取识别算法记录
	GetByIds(ctx context.Context, ids []string, tx ...*gorm.DB) ([]*model.RecognitionAlgorithm, error)

	// Create 创建新的识别算法记录
	Create(ctx context.Context, algo *model.RecognitionAlgorithm) (string, error)

	// Update 更新识别算法记录
	Update(ctx context.Context, algo *model.RecognitionAlgorithm) error

	// UpdateStatus 更新识别算法状态
	UpdateStatus(ctx context.Context, id string, status int32) error

	// Delete 删除识别算法记录
	Delete(ctx context.Context, id string) error

	// DeleteBatch 批量删除识别算法记录
	DeleteBatch(ctx context.Context, ids []string) error

	// PageList 分页获取识别算法记录
	PageList(ctx context.Context, req *recognition_algorithm.PageListRecognitionAlgorithmReq) (total int64, recognitionAlgorithms []*model.RecognitionAlgorithm, err error)

	// GetInnerType 获取识别算法内置类型
	GetInnerType(ctx context.Context, innerType string) ([]*model.RecognitionAlgorithm, error)

	// DuplicateCheck 检查识别算法是否存在
	DuplicateCheck(ctx context.Context, name string, id string) (bool, error)
}
