package impl

import (
	"context"
	"errors"

	repo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/task_relation_data"
	taskRepo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/relation_data"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"gorm.io/gorm"
)

type RelationDataUseCase struct {
	relationDataRepo repo.Repo
	taskRepo         taskRepo.Repo
}

func NewUseCase(relationDataRepo repo.Repo, taskRepo taskRepo.Repo) domain.UserCase {
	return &RelationDataUseCase{
		relationDataRepo: relationDataRepo,
		taskRepo:         taskRepo,
	}
}

// Upsert insert if not exists otherwise update
func (r *RelationDataUseCase) Upsert(ctx context.Context, rs *domain.RelationDataIncrementalModel) error {
	taskInfo, err := r.taskRepo.GetTaskInfoById(ctx, rs.TaskID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Detail(errorcode.TaskRecordNotFoundError, err.Error())
		}
		return errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
	}
	rs.TaskType = enum.ToString[constant.TaskType](taskInfo.TaskType)
	rs.ProjectID = taskInfo.ProjectID
	rs.IdsType = constant.IdsTypeByTask(taskInfo.TaskType)
	if rs.IdsType == constant.RelationDataTypeBusinessFromId.String && rs.BusinessModelId == "" {
		return errorcode.Desc(errorcode.RelatedMainBusinessShouldNotEmpty)
	}
	if rs.Cover {
		if err := r.relationDataRepo.Upsert(ctx, rs.NewRelationData()); err != nil {
			return errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
		}
		return nil
	}
	if err := r.relationDataRepo.IncrementalInsert(ctx, rs); err != nil {
		return err
	}
	return nil
}

func (r *RelationDataUseCase) QueryRelations(ctx context.Context, args *domain.RelationDataQueryModel) ([]*domain.RelationDataItem, error) {
	if args.TaskID != "" {
		if _, err := r.taskRepo.GetTaskBriefById(ctx, args.TaskID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errorcode.Desc(errorcode.TaskRecordNotFoundError)
			}
			return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
		}
	}
	if args.ProjectID != "" {
		if _, err := r.taskRepo.GetProject(ctx, args.ProjectID); err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil, errorcode.Desc(errorcode.ProjectRecordNotFoundError)
			}
			return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
		}
	}

	relations, err := r.relationDataRepo.Query(ctx, args)
	if err != nil {
		return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	if len(relations) <= 0 {
		return make([]*domain.RelationDataItem, 0), nil
	}
	items := make([]*domain.RelationDataItem, 0)
	for _, relation := range relations {
		content, err := domain.ParseData(relation.Data)
		if err != nil {
			return nil, err
		}
		item := &domain.RelationDataItem{
			BusinessModelID: relation.BusinessModelId,
			TaskID:          relation.TaskID,
			ProjectID:       relation.ProjectID,
			IdsType:         content.IdsType,
			Ids:             content.Ids,
		}
		items = append(items, item)
	}
	return items, nil
}
