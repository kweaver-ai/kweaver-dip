package impl

import (
	"context"
	"encoding/json"
	"strconv"
	"time"

	repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/third_party_report"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"

	task_repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/task_config"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/redis_lock"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/tools"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/task_config"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
)

const (
	autoRefreshTime       = 1 * time.Second
	defaultExploreVersion = int32(1)
)

type TaskConfigDomainImpl struct {
	data               *db.Data
	repo               repo.Repo
	taskRepo           task_repo.Repo
	dc                 exploration.Domain
	mtx                *redis_lock.Mutex
	engineSource       tools.EngineSource
	thirdPartyTaskRepo third_party_report.Repo
	explorationDomain  exploration.Domain
}

func NewTaskConfigDomain(
	data *db.Data,
	repo repo.Repo,
	taskRepo task_repo.Repo,
	mtx *redis_lock.Mutex,
	engineSource tools.EngineSource,
	thirdPartyTaskRepo third_party_report.Repo,
	explorationDomain exploration.Domain,
) task_config.Domain {

	return &TaskConfigDomainImpl{
		data:               data,
		repo:               repo,
		taskRepo:           taskRepo,
		mtx:                mtx,
		engineSource:       engineSource,
		thirdPartyTaskRepo: thirdPartyTaskRepo,
		explorationDomain:  explorationDomain,
	}
}

// CreateTaskConfig 创建探查任务配置
func (t *TaskConfigDomainImpl) CreateTaskConfig(ctx context.Context, req *task_config.TaskConfigReq) (result *task_config.TaskConfigResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	uInfo := &models.UserInfo{
		Uid:      req.UserId,
		UserName: req.UserName,
	}
	ctx = context.WithValue(ctx, interception.InfoName, &middleware.User{
		ID:       uInfo.Uid,
		Name:     uInfo.UserName,
		UserType: interception.TokenTypeUser,
	})
	taskId, err := utils.GetUniqueID()
	if err != nil {
		return nil, err
	}
	id, err := utils.GetUniqueID()
	if err != nil {
		return nil, err
	}

	b, err := json.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", req, err)
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)

	}
	queryParams := string(b)
	now := time.Now()
	taskEntity := &model.TaskConfig{
		ID:             id,
		TaskName:       util.ValueToPtr(req.TaskName),
		TaskDesc:       util.ValueToPtr(req.TaskDesc),
		TaskID:         taskId,
		Version:        util.ValueToPtr(defaultExploreVersion),
		VersionState:   util.ValueToPtr(constant.YES),
		QueryParams:    &queryParams,
		ExploreType:    &req.ExploreType,
		Table:          &req.Table,
		TableID:        &req.TableId,
		Schema:         &req.Schema,
		VeCatalog:      &req.VeCatalog,
		TotalSample:    &req.TotalSample,
		ExecStatus:     util.ValueToPtr(constant.Explore_Status_Undo),
		Enabled:        &req.TaskEnabled,
		CreatedAt:      &now,
		CreatedByUID:   &uInfo.Uid,
		CreatedByUname: &uInfo.UserName,
		UpdatedAt:      &now,
		UpdatedByUID:   &uInfo.Uid,
		UpdatedByUname: &uInfo.UserName,
		DvTaskID:       &req.DvTaskId,
	}

	if err = t.taskRepo.Create(nil, ctx, taskEntity); err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	return &task_config.TaskConfigResp{
		TaskId:  strconv.FormatUint(taskEntity.TaskID, 10),
		Version: *taskEntity.Version,
	}, nil
}

// UpdateTaskConfig 更新探查任务配置
func (t *TaskConfigDomainImpl) UpdateTaskConfig(ctx context.Context, req *task_config.TaskConfigUpdateReq) (result *task_config.TaskConfigResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	uInfo := &models.UserInfo{
		Uid:      req.UserId,
		UserName: req.UserName,
	}
	ctx = context.WithValue(ctx, interception.InfoName, &middleware.User{
		ID:       req.UserId,
		Name:     req.UserName,
		UserType: interception.TokenTypeUser,
	})
	taskId := req.TaskId.Uint64()
	id, err := utils.GetUniqueID()
	if err != nil {
		return nil, err
	}

	b, err := json.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", req, err)
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)

	}
	queryParams := string(b)
	now := time.Now()

	locker, err := t.mtx.ObtainLocker(ctx, strconv.FormatUint(taskId, 10), autoRefreshTime)
	if err != nil {
		return nil, errorcode.Detail(errorcode.OpConflictError, ctx.Err())
	}
	defer t.mtx.Release(ctx, locker)

	tx := t.data.DB.WithContext(ctx).Begin()
	latestTaskConfig, err := t.taskRepo.GetLatestByTaskId(tx, ctx, taskId)
	if latestTaskConfig == nil || err != nil {
		tx.Rollback()
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, err)
	}
	newVersion := *latestTaskConfig.Version + 1
	taskEntity := &model.TaskConfig{
		ID:             id,
		TaskID:         taskId,
		TaskName:       util.ValueToPtr(req.TaskName),
		TaskDesc:       util.ValueToPtr(req.TaskDesc),
		Version:        &newVersion,
		VersionState:   util.ValueToPtr(constant.YES),
		QueryParams:    &queryParams,
		ExploreType:    &req.ExploreType,
		Table:          &req.Table,
		TableID:        &req.TableId,
		Schema:         &req.Schema,
		VeCatalog:      &req.VeCatalog,
		TotalSample:    &req.TotalSample,
		ExecStatus:     util.ValueToPtr(constant.Explore_Status_Undo),
		Enabled:        &req.TaskEnabled,
		UpdatedAt:      &now,
		UpdatedByUID:   &uInfo.Uid,
		UpdatedByUname: &uInfo.UserName,
		CreatedAt:      &now,
		CreatedByUID:   &uInfo.Uid,
		CreatedByUname: &uInfo.UserName,
		DvTaskID:       &req.DvTaskId,
	}
	err = t.taskRepo.UpdateVersionState(tx, ctx, taskId)
	if err != nil {
		tx.Rollback()
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if err = t.taskRepo.Create(tx, ctx, taskEntity); err != nil {
		tx.Rollback()
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	tx.Commit()
	return &task_config.TaskConfigResp{
		TaskId:  strconv.FormatUint(taskEntity.TaskID, 10),
		Version: *taskEntity.Version,
	}, err
}

// DeleteTaskConfig 删除探查任务配置
func (t *TaskConfigDomainImpl) DeleteTaskConfig(ctx context.Context, req *task_config.TaskConfigDeleteReq) (result *task_config.TaskConfigResp, err error) {
	now := time.Now()
	uInfo := models.GetUserInfo(ctx)
	taskEntity := model.TaskConfig{
		TaskID:         req.TaskId.Uint64(),
		DeletedAt:      &now,
		DeletedByUID:   &uInfo.ID,
		DeletedByUname: &uInfo.Name,
	}
	latestTaskConfig, err := t.taskRepo.GetLatestByTaskId(nil, ctx, req.TaskId.Uint64())
	if latestTaskConfig == nil || err != nil {
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, err)
	}
	err = t.taskRepo.SoftDelete(nil, ctx, &taskEntity)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	} else {
		result = &task_config.TaskConfigResp{
			TaskId:  strconv.FormatUint(req.TaskId.Uint64(), 10),
			Version: 0,
		}
	}
	return result, err
}

// GetTaskConfigByTaskVersion 获取探查任务配置,可按版本获取
func (t *TaskConfigDomainImpl) GetTaskConfigByTaskVersion(ctx context.Context, req *task_config.TaskConfigDetailReq) (result *task_config.TaskConfigRespDetail, err error) {
	var entity *model.TaskConfig

	if req.Version == 0 {
		entity, err = t.taskRepo.GetLatestByTaskId(nil, ctx, req.TaskId.Uint64())
	} else {
		entity, err = t.taskRepo.GetByTaskIdAndVersion(nil, ctx, req.TaskId.Uint64(), req.Version)
	}
	if entity == nil || err != nil {
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, err)
	}

	if err = json.Unmarshal([]byte(*entity.QueryParams), &result); err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}

	if entity.ExecAt != nil {
		result.ExecAt = util.ValueToPtr(entity.ExecAt.UnixMilli())
	}

	result.TaskId = strconv.FormatUint(req.TaskId.Uint64(), 10)
	result.Version = entity.Version
	result.ExecStatus = entity.ExecStatus
	result.CreatedAt = util.ValueToPtr(entity.CreatedAt.UnixMilli())
	result.CreatedByUname = entity.CreatedByUname
	result.CreatedByUID = entity.CreatedByUID
	result.UpdatedAt = util.ValueToPtr(entity.UpdatedAt.UnixMilli())
	result.UpdatedByUID = entity.UpdatedByUID
	result.UpdatedByUname = entity.UpdatedByUname

	return result, err
}

// GetTaskConfigList 分页获取探查配置列表，探查配置版本为最新版
func (t *TaskConfigDomainImpl) GetTaskConfigList(ctx context.Context, req *task_config.TaskConfigListReq) (result *task_config.TaskConfigListRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	models, total, err := t.taskRepo.ListByPage(ctx, &req.PageInfo, &req.TableId)
	if err != nil {
		return result, err
	}
	return task_config.NewListRespParam(ctx, models, total)
}

func (t *TaskConfigDomainImpl) GetTaskStatus(ctx context.Context, req *task_config.TaskStatusReq) (result *task_config.TaskStatusRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	var taskConfigs []*model.Report
	var total int64
	if req.DvTaskId != "" {
		taskConfigs, total, err = t.repo.ListByDvTaskId(ctx, req.DvTaskId)
	} else if req.VeCatalog != "" && req.Schema != "" {
		taskConfigs, total, err = t.repo.ListByCatalogSchema(ctx, req.VeCatalog, req.Schema)
	}
	if err != nil {
		return result, err
	}
	return task_config.NewListTaskRespParam(ctx, taskConfigs, total)
}

func (t *TaskConfigDomainImpl) GetTableTaskStatus(ctx context.Context, req *task_config.TableTaskStatusReq) (result *task_config.TaskStatusRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	var taskConfigs []*model.Report
	var total int64
	taskConfigs, total, err = t.repo.ListByTableIds(ctx, req.TableIds)
	if err != nil {
		return result, err
	}
	return task_config.NewListTaskRespParam(ctx, taskConfigs, total)
}

func (t *TaskConfigDomainImpl) CreateThirdPartyTaskConfig(ctx context.Context, req *task_config.ThirdPartyTaskConfigReq) (result *task_config.TaskConfigResp, err error) {
	log.WithContext(ctx).Info("CreateThirdPartyTaskConfig start")
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	// 查询报告版本
	report, err := t.thirdPartyTaskRepo.GetLatestByTableId(nil, ctx, req.TableId)
	if err != nil {
		return nil, err
	}
	var taskId uint64
	var taskVersion int32
	if report != nil {
		taskId = report.TaskID
		taskVersion = *report.TaskVersion + 1
		report.Latest = 0
	} else {
		taskId, err = utils.GetUniqueID()
		if err != nil {
			return nil, err
		}
		taskVersion = defaultExploreVersion
	}

	b, err := json.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", req, err)
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, err)

	}
	queryParams := string(b)
	now := time.Now()
	taskEntity := model.ThirdPartyReport{
		TaskID:         taskId,
		TaskVersion:    &taskVersion,
		QueryParams:    &queryParams,
		ExploreType:    &req.ExploreType,
		Table:          &req.Table,
		TableID:        &req.TableId,
		Schema:         &req.Schema,
		VeCatalog:      &req.VeCatalog,
		TotalSample:    &req.TotalSample,
		Status:         util.ValueToPtr(constant.Explore_Status_Undo),
		Latest:         1,
		CreatedAt:      &now,
		CreatedByUID:   &req.UserId,
		CreatedByUname: &req.UserName,
		WorkOrderID:    &req.WorkOrderId,
	}
	err = t.thirdPartyTaskRepo.Create(nil, ctx, &taskEntity)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if report != nil {
		report.Latest = 0
		err = t.thirdPartyTaskRepo.Update(nil, ctx, report)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
	}
	result = &task_config.TaskConfigResp{
		TaskId:  strconv.FormatUint(taskId, 10),
		Version: taskVersion,
	}
	log.WithContext(ctx).Info("CreateThirdPartyTaskConfig end")
	return result, err
}
