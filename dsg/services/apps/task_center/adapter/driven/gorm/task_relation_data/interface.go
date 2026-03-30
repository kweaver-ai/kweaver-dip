package task_relations_data

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/relation_data"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type Repo interface {
	TransactionUpsert(ctx context.Context, tx *gorm.DB, r *model.TaskRelationsData) error
	Upsert(ctx context.Context, r *model.TaskRelationsData) error
	Query(ctx context.Context, args *domain.RelationDataQueryModel) ([]*model.TaskRelationsData, error)
	Delete(ctx context.Context, taskId, projectId string) error
	GetByTaskId(ctx context.Context, taskId string) ([]string, error)
	GetDetailByTaskId(ctx context.Context, taskId string) (*domain.TaskRelationsDataDetail, error)
	GetProjectModelId(ctx context.Context, projectId string) (string, error)
	GetProjectProcessId(ctx context.Context, projectId string, taskID []string) ([]string, error)
	GetTaskProcessId(ctx context.Context, taskIDSlice ...string) ([]string, error)
	GetByProjectId(ctx context.Context, projectId string) ([]string, error)
	GetByProjectTask(ctx context.Context, taskId, projectId string) ([]string, error)
	GetTaskMainBusiness(ctx context.Context, taskId, projectId string) (string, error)
	GetTaskIds(ctx context.Context, businessModelId string, relationId string) (taskIds []string, err error)
	GetRelationTask(ctx context.Context, businessModelId string, relationId string) (row *model.TaskRelationsData, err error)
	IncrementalInsert(ctx context.Context, r *domain.RelationDataIncrementalModel) error
	IncrementalDelete(ctx context.Context, r *domain.RelationDataIncrementalModel) error
}

type IncrementalInsert func(ctx context.Context, tx *gorm.DB, r *domain.RelationDataIncrementalModel) error
type IncrementalDelete func(ctx context.Context, tx *gorm.DB, r *domain.RelationDataIncrementalModel) error
