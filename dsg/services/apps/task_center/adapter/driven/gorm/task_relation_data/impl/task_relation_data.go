package impl

import (
	"context"
	"errors"

	repo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/task_relation_data"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/relation_data"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

var _ repo.Repo = new(TaskRelationDataRepo)

type TaskRelationDataRepo struct {
	data *db.Data
}

func NewRepo(data *db.Data) repo.Repo {
	return &TaskRelationDataRepo{data: data}
}

func (t *TaskRelationDataRepo) TransactionUpsert(ctx context.Context, tx *gorm.DB, r *model.TaskRelationsData) error {
	columns := make([]clause.Column, 0)
	columns = append(columns, clause.Column{Name: "task_id"})
	columns = append(columns, clause.Column{Name: "deleted_at"})
	//添加更新
	updateColumns := make([]string, 0)
	updateColumns = append(updateColumns, "data", "updated_by_uid", "updated_at")
	if r.ProjectID != "" {
		updateColumns = append(updateColumns, "project_id")
	}
	if err := tx.WithContext(ctx).Debug().Clauses(
		clause.OnConflict{
			Columns:   columns,
			DoUpdates: clause.AssignmentColumns(updateColumns),
		}).Create(&r).Error; err != nil {
		return err
	}
	return nil
}

func (t *TaskRelationDataRepo) Upsert(ctx context.Context, r *model.TaskRelationsData) error {
	err := t.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return t.TransactionUpsert(ctx, tx, r)
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error("Upsert relationData transaction error", zap.Error(err))
		return errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	return nil
}

func (t *TaskRelationDataRepo) Query(ctx context.Context, args *domain.RelationDataQueryModel) ([]*model.TaskRelationsData, error) {
	findBin := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData))
	if args.TaskID != "" {
		findBin = findBin.Where("task_id=?", args.TaskID)
	}
	if args.ProjectID != "" {
		findBin = findBin.Where("project_id=?", args.ProjectID)
	}
	relations := make([]*model.TaskRelationsData, 0)
	if err := findBin.Find(&relations).Error; err != nil {
		return relations, err
	}
	return relations, nil
}

func (t *TaskRelationDataRepo) Delete(ctx context.Context, taskId, projectId string) error {
	deleteBin := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData))
	if taskId != "" {
		deleteBin = deleteBin.Where("task_id=?", taskId)
	}
	if projectId != "" {
		deleteBin = deleteBin.Where("project_id=?", projectId)
	}
	if err := deleteBin.Delete(new(model.TaskRelationsData)).Error; err != nil {
		return err
	}
	return nil
}

func (t *TaskRelationDataRepo) GetByTaskId(ctx context.Context, taskId string) ([]string, error) {
	relation := new(model.TaskRelationsData)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Where("task_id=?", taskId).First(&relation).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return []string{}, nil
		}
		return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	relationDataModel, err := domain.ParseData(relation.Data)
	if err != nil {
		return nil, err
	}
	return relationDataModel.Ids, nil
}

func (t *TaskRelationDataRepo) GetDetailByTaskId(ctx context.Context, taskId string) (*domain.TaskRelationsDataDetail, error) {
	relation := new(model.TaskRelationsData)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Where("task_id=?", taskId).First(&relation).Error; err != nil {
		return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	relationDataModel, err := domain.ParseData(relation.Data)
	if err != nil {
		return nil, err
	}
	return domain.GenTaskRelationsDataDetail(relation, relationDataModel), nil
}

func (t *TaskRelationDataRepo) GetRowsByProjectId(ctx context.Context, projectId string) ([]*domain.TaskRelationsDataDetail, error) {
	relations := make([]*model.TaskRelationsData, 0)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Where("project_id=?", projectId).First(&relations).Error; err != nil {
		return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	relationDetails := make([]*domain.TaskRelationsDataDetail, 0)
	for _, relation := range relations {
		relationDataModel, err := domain.ParseData(relation.Data)
		if err != nil {
			return nil, err
		}
		relationDetails = append(relationDetails, domain.GenTaskRelationsDataDetail(relation, relationDataModel))
	}
	return relationDetails, nil
}

func (t *TaskRelationDataRepo) GetByProjectId(ctx context.Context, projectId string) ([]string, error) {
	relations := make([]*model.TaskRelationsData, 0)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Where("project_id=?", projectId).Find(&relations).Error; err != nil {
		return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	ids := make([]string, 0)
	for _, relation := range relations {
		relationDataModel, err := domain.ParseData(relation.Data)
		if err != nil {
			return nil, err
		}
		ids = append(ids, relationDataModel.Ids...)
	}
	return ids, nil
}

func (t *TaskRelationDataRepo) GetProjectModelId(ctx context.Context, projectId string) (string, error) {
	relations := make([]*model.TaskRelationsData, 0)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Where("project_id=?", projectId).Find(&relations).Error; err != nil {
		return "", errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	ids := make([]string, 0)
	for _, relation := range relations {
		relationDataModel, err := domain.ParseData(relation.Data)
		if err != nil {
			return "", err
		}
		if relationDataModel.IdsType != constant.RelationDataTypeBusinessModelId.String {
			continue
		}
		ids = append(ids, relationDataModel.Ids...)
	}
	if len(ids) <= 0 {
		return "", nil
	}
	return ids[0], nil
}

// GetTaskProcessId   获取任务关联的业务流程数据
func (t *TaskRelationDataRepo) GetTaskProcessId(ctx context.Context, taskIDSlice ...string) ([]string, error) {
	relations := make([]*model.TaskRelationsData, 0)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Where("task_id in ?", taskIDSlice).Find(&relations).Error; err != nil {
		return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	ids := make([]string, 0)
	for _, relation := range relations {
		relationDataModel, err := domain.ParseData(relation.Data)
		if err != nil {
			return nil, err
		}
		if len(relationDataModel.Ids) > 0 {
			ids = append(ids, relationDataModel.Ids...)
		}
		if relation.BusinessModelId != "" {
			ids = append(ids, relation.BusinessModelId)
		}
	}
	return ids, nil
}

// GetProjectProcessId 为删除项目而用的，其他功能使用注意返回数据
func (t *TaskRelationDataRepo) GetProjectProcessId(ctx context.Context, projectId string, taskID []string) ([]string, error) {
	relations := make([]*model.TaskRelationsData, 0)
	if err := t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Where("project_id=? and task_id in ? ", projectId, taskID).Find(&relations).Error; err != nil {
		return nil, errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	ids := make([]string, 0)
	for _, relation := range relations {
		relationDataModel, err := domain.ParseData(relation.Data)
		if err != nil {
			return nil, err
		}
		if len(relationDataModel.Ids) > 0 {
			ids = append(ids, relationDataModel.Ids...)
		}
		if relation.BusinessModelId != "" {
			ids = append(ids, relation.BusinessModelId)
		}
	}
	return ids, nil
}

func (t *TaskRelationDataRepo) GetTaskMainBusiness(ctx context.Context, taskId, projectId string) (id string, err error) {
	ids := make([]string, 0)
	if taskId != "" {
		ids, err = t.GetByTaskId(ctx, taskId)
	}
	if projectId != "" {
		ids, err = t.GetByProjectId(ctx, projectId)
	}
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return "", err
	}
	if len(ids) <= 0 {
		return "", nil
	}
	return ids[0], nil
}

func (t *TaskRelationDataRepo) GetByProjectTask(ctx context.Context, taskId, projectId string) ([]string, error) {
	if taskId != "" {
		return t.GetByTaskId(ctx, taskId)
	}
	if projectId != "" {
		return t.GetByProjectId(ctx, projectId)
	}
	return []string{}, nil
}

// GetTaskIds 根据输入的关联数据ID，查询涉及的任务
func (t *TaskRelationDataRepo) GetTaskIds(ctx context.Context, businessModelId string, relationId string) (taskIds []string, err error) {
	err = t.data.DB.WithContext(ctx).Model(new(model.TaskRelationsData)).Select("task_id").Where("business_model_id=? and data like ? ",
		businessModelId, "%"+relationId+"%").Scan(&taskIds).Error
	return
}

// GetRelationTask 根据输入的关联数据ID，查询涉及的任务
func (t *TaskRelationDataRepo) GetRelationTask(ctx context.Context, businessModelId string, relationId string) (row *model.TaskRelationsData, err error) {
	err = t.data.DB.WithContext(ctx).Where("business_model_id=? and data like ? ", businessModelId, "%"+relationId+"%").First(&row).Error
	if err != nil {
		err = errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	return
}

func (t *TaskRelationDataRepo) IncrementalInsert(ctx context.Context, r *domain.RelationDataIncrementalModel) error {
	//获取原有的
	ids, err := t.GetByTaskId(ctx, r.TaskID)
	if err != nil {
		return errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	sourceDict := make(map[string]int)
	for _, id := range ids {
		sourceDict[id] = 1
	}
	for _, id := range r.Ids {
		if _, ok := sourceDict[id]; !ok {
			sourceDict[id] = 1
			ids = append(ids, id)
		}
	}
	r.Ids = ids
	return t.Upsert(ctx, r.NewRelationData())
}

func (t *TaskRelationDataRepo) IncrementalDelete(ctx context.Context, r *domain.RelationDataIncrementalModel) error {
	//获取原有的
	relationDataRows, err := t.GetRowsByProjectId(ctx, r.ProjectID)
	if err != nil {
		return errorcode.Detail(errorcode.RelationDataDatabaseError, err.Error())
	}
	//合并
	delId := r.Ids[0]
	has := false
	for _, detail := range relationDataRows {
		for i, id := range detail.Data.Ids {
			if id == delId {
				has = true
				if i == 0 {
					r.Ids = detail.Data.Ids[i+1:]
				} else {
					r.Ids = append(detail.Data.Ids[:i], detail.Data.Ids[i+1:]...)
				}
			}
			break
		}
	}
	if !has {
		return nil
	}
	if len(r.Ids) <= 0 {
		return t.Delete(ctx, r.TaskID, "")
	}
	return t.Upsert(ctx, r.NewRelationData())
}
