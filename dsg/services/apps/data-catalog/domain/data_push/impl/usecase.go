package impl

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/jinzhu/copier"
	configuration_center_local "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/configuration_center"
	localDataView "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/task_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_push"
	data_resource_repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/callback"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_sync"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	task_center2 "github.com/kweaver-ai/idrm-go-common/rest/task_center"
	"github.com/kweaver-ai/idrm-go-common/rest/virtual_engine"
	wf_rest "github.com/kweaver-ai/idrm-go-common/rest/workflow"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

type useCase struct {
	db               *gorm.DB
	Operation        *OperationMachine
	StatusManager    *StatusManagement
	repo             data_push.Repo
	wf               workflow.WorkflowInterface
	wfDriven         wf_rest.WorkflowDriven
	ccDriven         configuration_center.Driven
	dataSyncDriven   data_sync.Driven
	dataResourceRepo data_resource_repo.DataResourceRepo
	dataViewDriven   data_view.Driven
	virtualEngine    virtual_engine.Driven
	bgDriven         business_grooming.Driven
	catalogRepo      data_catalog.RepoOp
	taskDriven       task_center2.Driven
	taskCenterDriven task_center.Driven
	producer         kafkax.Producer
	localDataView    localDataView.Repo
	callback         callback.Interface
	cfgRepo          configuration_center_local.Repo
}

func NewUseCase(
	db *gorm.DB,
	repo data_push.Repo,
	wf workflow.WorkflowInterface,
	wfDriven wf_rest.WorkflowDriven,
	ccDriven configuration_center.Driven,
	dataSync data_sync.Driven,
	dataResourceRepo data_resource_repo.DataResourceRepo,
	dataViewDriven data_view.Driven,
	virtualEngine virtual_engine.Driven,
	bgDriven business_grooming.Driven,
	catalogRepo data_catalog.RepoOp,
	taskDriven task_center2.Driven,
	taskCenterDriven task_center.Driven,
	producer kafkax.Producer,
	localDataView localDataView.Repo,
	callback callback.Interface,
	cfgRepo configuration_center_local.Repo,
) domain.UseCase {
	u := &useCase{
		db:               db,
		repo:             repo,
		wf:               wf,
		wfDriven:         wfDriven,
		ccDriven:         ccDriven,
		dataSyncDriven:   dataSync,
		dataResourceRepo: dataResourceRepo,
		dataViewDriven:   dataViewDriven,
		virtualEngine:    virtualEngine,
		bgDriven:         bgDriven,
		catalogRepo:      catalogRepo,
		taskDriven:       taskDriven,
		taskCenterDriven: taskCenterDriven,
		producer:         producer,
		localDataView:    localDataView,
		callback:         callback,
		cfgRepo:          cfgRepo,
	}
	u.RegisterWorkflowHandler()
	//初始操作管理器
	u.Operation = u.NewOperationMachine()
	//初始化操作
	u.StatusManager = u.NewStatusManagement(callback, cfgRepo)
	go u.StatusManager.Run()
	return u
}

func (u *useCase) Begin() *gorm.DB {
	return u.db.Begin()
}

func End(tx *gorm.DB, err error) {
	if err != nil {
		tx.Rollback()
	} else {
		tx.Commit()
	}
}

func (u *useCase) Create(ctx context.Context, req *domain.CreateReq) (*response.IDNameResp, error) {
	//生成本地推送模型参数
	collectingModel, err := u.newCreateCollectingModel(ctx, req)
	if err != nil {
		log.WithContext(ctx).Errorf("newCollectingModel err: %v", err.Error())
		return nil, err
	}
	// 去掉crontab表达式中的前后空格
	req.CrontabExpr = strings.TrimSpace(req.CrontabExpr)
	if err = checkCrontab(req.CrontabExpr); err != nil {
		return nil, err
	}
	dataPush := collectingModel.PushData

	// 通过configuration_center中的GetUserByIds获取用户信息，设置第三方用户ID
	if dataPush.CreatorUID != "" {
		users, err := u.cfgRepo.GetUserByIds(ctx, dataPush.CreatorUID)
		if err != nil {
			log.WithContext(ctx).Warnf("Get user third_user_id failed for user %s: %v", dataPush.CreatorUID, err)
		} else if len(users) > 0 && users[0].ThirdUserId != "" {
			dataPush.ThirdUserId = users[0].ThirdUserId
		}
		res, err := u.ccDriven.GetDepartmentsByUserID(ctx, dataPush.CreatorUID)
		var deptId string

		if err != nil {
			log.WithContext(ctx).Warnf("Get user dept_id failed for user %s: %v", dataPush.CreatorUID, err)
		} else if len(res) > 0 && res[0].ID != "" {
			deptId = res[0].ID
		}

		if deptId != "" {
			dept, err := u.cfgRepo.GetDepartmentById(ctx, deptId)
			if err != nil {
				log.WithContext(ctx).Warnf("Get department by id failed for user %s: %v", dataPush.CreatorUID, err)
			} else if dept != nil && dept.ThirdDeptId != "" {
				dataPush.ThirdDeptId = dept.ThirdDeptId
			}
		}
	}

	// 如果是未开始状态，开启走下流程
	if dataPush.PushStatus == constant.DataPushStatusWaiting.Integer.Int32() {
		if err = u.Operation.RunWithWorkflow(ctx, dataPush); err != nil {
			return nil, err
		}
	}
	//保存
	if err = u.repo.Insert(ctx, dataPush, collectingModel.TargetFieldsInfo); err != nil {
		log.WithContext(ctx).Errorf("Insert SyncModel err: %v", err.Error())
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return &response.IDNameResp{ID: models.NewModelID(dataPush.ID), Name: dataPush.Name}, nil
}

func (u *useCase) Update(ctx context.Context, req *domain.UpdateReq) (*response.IDNameResp, error) {
	//生成完整参数
	collectingModel, err := u.newUpdateCollectingModel(ctx, req)
	if err != nil {
		log.WithContext(ctx).Errorf("newCollectingModel err: %v", err.Error())
		return nil, err
	}
	// 去掉crontab表达式中的前后空格
	req.CrontabExpr = strings.TrimSpace(req.CrontabExpr)
	if err = checkCrontab(req.CrontabExpr); err != nil {
		return nil, err
	}

	dataPush := collectingModel.PushData

	// 通过configuration_center中的GetUserByIds获取用户信息，设置第三方用户ID
	if dataPush.CreatorUID != "" {
		users, err := u.cfgRepo.GetUserByIds(ctx, dataPush.CreatorUID)
		if err != nil {
			log.WithContext(ctx).Warnf("Get user third_user_id failed for user %s: %v", dataPush.CreatorUID, err)
		} else if len(users) > 0 && users[0].ThirdUserId != "" {
			dataPush.ThirdUserId = users[0].ThirdUserId
		}
		res, err := u.ccDriven.GetDepartmentsByUserID(ctx, dataPush.CreatorUID)
		var deptId string

		if err != nil {
			log.WithContext(ctx).Warnf("Get user dept_id failed for user %s: %v", dataPush.CreatorUID, err)
		} else if len(res) > 0 && res[0].ID != "" {
			deptId = res[0].ID
		}

		if deptId != "" {
			dept, err := u.cfgRepo.GetDepartmentById(ctx, deptId)
			if err != nil {
				log.WithContext(ctx).Warnf("Get department by id failed for user %s: %v", dataPush.CreatorUID, err)
			} else if dept != nil && dept.ThirdDeptId != "" {
				dataPush.ThirdDeptId = dept.ThirdDeptId
			}
		}
	}

	// 如果不是草稿态，开启走下流程
	if collectingModel.PushData.PushStatus >= constant.DataPushStatusWaiting.Integer.Int32() {
		if err = u.Operation.RunWithWorkflow(ctx, collectingModel.PushData); err != nil {
			return nil, err
		}
	}
	//更新数据库
	if err = u.repo.Update(ctx, collectingModel.PushData, collectingModel.TargetFieldsInfo); err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return &response.IDNameResp{ID: models.NewModelID(collectingModel.PushData.ID), Name: collectingModel.PushData.Name}, nil
}

// BatchUpdateStatus 批量更新推送的状态，将状态更新为未开始，并走审核流程等
func (u *useCase) BatchUpdateStatus(ctx context.Context, req *domain.BatchUpdateStatusReq) ([]uint64, error) {
	updateSuccess := make([]uint64, 0)
	for _, mid := range req.ModelID {
		pushData, err := u.repo.Get(ctx, mid)
		if err != nil {
			log.WithContext(ctx).Errorf("update: %v BatchUpdateStatus err: %v", mid, err.Error())
			continue
		}
		//设置未发布操作，自动发布
		pushData.Operation = constant.DataPushOperationPublish.Integer.Int32()
		pushData.PushStatus = constant.DataPushStatusWaiting.Integer.Int32()
		if err = u.Operation.RunWithWorkflow(ctx, pushData); err != nil {
			return nil, err
		}
		//更新数据库
		if err = u.repo.Update(ctx, pushData, nil); err != nil {
			log.WithContext(ctx).Errorf("update: %v err: %v", mid, err.Error())
			continue
		}
		updateSuccess = append(updateSuccess, mid)
	}
	return updateSuccess, nil
}

func (u *useCase) List(ctx context.Context, req *domain.ListPageReq) (*response.PageResult[domain.DataPushModelObject], error) {
	u.queryListDepartmentPathInfo(ctx, req)
	total, ds, err := u.repo.Query(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	objects := make([]*domain.DataPushModelObject, 0, len(ds))
	for _, d := range ds {
		obj := &domain.DataPushModelObject{}
		copier.Copy(obj, d)
		//责任人
		obj.ID = fmt.Sprintf("%v", d.ID)
		responsiblePersonInfo := u.queryUserInfo(ctx, d.ResponsiblePersonID)
		obj.ResponsiblePersonID = responsiblePersonInfo.Uid
		obj.ResponsiblePersonName = responsiblePersonInfo.UserName
		//最近一次执行时间
		obj.RecentExecute, obj.RecentExecuteStatus = u.queryLastTaskExecuteTime(ctx, d.ID)
		//下次执行时间, 只有未开始和进行中的状态才可能有
		SetNextExecuteTime(obj)
		obj.CreateTime = d.CreatedAt.UnixMilli()
		objects = append(objects, obj)
	}
	return &response.PageResult[domain.DataPushModelObject]{
		TotalCount: total,
		Entries:    objects,
	}, nil
}

func (u *useCase) QuerySandboxPushCount(ctx context.Context, req *domain.QuerySandboxPushReq) (*domain.QuerySandboxPushResp, error) {
	pairs, err := u.repo.QuerySandboxCount(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	res := make(map[string]int)
	for _, p := range pairs {
		ids := strings.Split(p, ",")
		if len(ids) != 2 {
			continue
		}
		res[ids[1]] += 1
	}
	return &domain.QuerySandboxPushResp{Res: res}, nil
}

func (u *useCase) ListSchedule(ctx context.Context, req *domain.ListPageReq) (*response.PageResult[domain.DataPushScheduleObject], error) {
	//查询沙箱信息
	if err := u.queryUserSandboxInfo(ctx, req); err != nil {
		log.Errorf("queryUserSandboxInfo error %v", err.Error())
		return nil, err
	}
	u.queryListDepartmentPathInfo(ctx, req)
	status := []string{
		strconv.Itoa(constant.DataPushStatusStarting.Integer.Int()),
		strconv.Itoa(constant.DataPushStatusGoing.Integer.Int()),
		strconv.Itoa(constant.DataPushStatusStopped.Integer.Int()),
		strconv.Itoa(constant.DataPushStatusEnd.Integer.Int()),
	}
	req.Status = strings.Join(status, ",")
	total, ds, err := u.repo.Query(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//查询目录信息
	catalogIDSlice := lo.Times(len(ds), func(index int) uint64 {
		return ds[index].SourceCatalogID
	})
	catalogTitleDict, err := u.getCatalogDict(ctx, catalogIDSlice)
	if err != nil {
		log.Warnf("getCatalogDict error %v", err.Error())
		err = nil
	}
	objects := make([]*domain.DataPushScheduleObject, 0, len(ds))
	for _, d := range ds {
		obj := &domain.DataPushScheduleObject{}
		copier.Copy(obj, d)
		//责任人
		obj.ID = fmt.Sprintf("%v", d.ID)
		responsiblePersonInfo := u.queryUserInfo(ctx, d.ResponsiblePersonID)
		obj.ResponsiblePersonID = responsiblePersonInfo.Uid
		obj.ResponsiblePersonName = responsiblePersonInfo.UserName
		lastExecuteInfo, err := u.queryLastTaskExecuteInfo(ctx, d.ID)
		if err != nil {
			log.WithContext(ctx).Warnf("queryLastTaskExecuteInfo ID %v, err: %v", d.ID, err.Error())
		}
		if lastExecuteInfo != nil {
			copier.Copy(obj, lastExecuteInfo)
			obj.SyncCount, _ = strconv.ParseInt(lastExecuteInfo.SyncCount, 10, 64)
			obj.SyncSuccessCount = obj.SyncCount
			obj.SyncTime, _ = strconv.ParseInt(lastExecuteInfo.SyncTime, 10, 64)
			obj.ErrorMessage = lastExecuteInfo.ErrorMessage
		}

		// 智能状态判断：针对schedule接口的特殊逻辑
		obj.PushStatus = u.getSmartPushStatus(ctx, d)

		//添加沙箱空间日志信息
		obj.CreatorID = d.CreatorUID
		obj.CreatorName = d.CreatorName
		obj.TargetTableName = d.TargetTableName
		obj.PushError = d.PushError
		obj.DataCatalogName = catalogTitleDict[d.SourceCatalogID]
		if req.WithSandboxInfo {
			obj.SandboxProjectName = req.AuthedSandboxDict[d.TargetSandboxID]
		}
		objects = append(objects, obj)
	}
	return &response.PageResult[domain.DataPushScheduleObject]{
		TotalCount: total,
		Entries:    objects,
	}, nil
}

func (u *useCase) Get(ctx context.Context, id uint64) (*domain.DataPushModelDetail, error) {
	dataPush, err := u.repo.Get(ctx, id)
	if err != nil {
		return nil, err
	}
	//查字段
	dataPushFields, err := u.repo.GetFields(ctx, dataPush.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	taskExecutestart := time.Now()
	detail := &domain.DataPushModelDetail{}
	copier.Copy(&detail, &dataPush)
	detail.ID = models.NewModelID(dataPush.ID)
	detail.PushStatus = dataPush.PushStatus
	detail.RecentExecute, detail.RecentExecuteStatus = u.queryLastTaskExecuteTime(ctx, dataPush.ID)
	SetDetailNextExecuteTime(detail)
	taskExecuteend := time.Now()
	taskExecutediff := taskExecuteend.Sub(taskExecutestart)
	log.Infof("queryLastTaskExecuteTime时间差: %d ms", taskExecutediff.Milliseconds())
	//来源信息
	detail.SourceDetail = &domain.SourceDetail{
		TableID:   dataPush.SourceTableID,
		CatalogID: fmt.Sprintf("%v", dataPush.SourceCatalogID),
	}
	querySourceDetailstart := time.Now()
	sourceDetail, err := u.querySourceDetail(ctx, dataPush)
	if err != nil {
		return nil, err
	}
	querySourceDetailend := time.Now()
	querySourceDetaildiff := querySourceDetailend.Sub(querySourceDetailstart)
	log.Infof("querySourceDetail时间差: %d ms", querySourceDetaildiff.Milliseconds())
	detail.SourceDetail = sourceDetail
	querySyncModelFieldsstart := time.Now()
	//查询同步模型字段
	syncModelFields, err := u.querySyncModelFields(ctx, dataPush, dataPushFields)
	if err != nil {
		return nil, err
	}
	querySyncModelFieldsend := time.Now()
	querySyncModelFieldsdiff := querySyncModelFieldsend.Sub(querySyncModelFieldsstart)
	log.Infof("querySyncModelFields时间差: %d ms", querySyncModelFieldsdiff.Milliseconds())
	detail.SyncModelFields = syncModelFields
	//目标信息
	detail.TargetDetail = &domain.TargetDetail{
		TableName:    dataPush.TargetTableName,
		DatasourceID: dataPush.TargetDatasourceUUID,
	}
	detail.TargetDetail.TargetTableExists = dataPush.TargetTableExists > 0
	queryTargetDetailstart := time.Now()
	if targetDetail, err := u.queryTargetDetail(ctx, dataPush); err != nil {
		return nil, err
	} else {
		detail.TargetDetail = targetDetail
	}
	queryTargetDetailend := time.Now()
	queryTargetDetaildiff := queryTargetDetailend.Sub(queryTargetDetailstart)
	log.Infof("queryTargetDetail时间差: %d ms", queryTargetDetaildiff.Milliseconds())
	//解析是否有草稿调度计划
	detail.ScheduleDraft = domain.ParserScheduleBody(dataPush.DraftSchedule.String)
	//更新下用户信息
	responsiblePersonInfo := u.queryUserInfo(ctx, dataPush.ResponsiblePersonID)
	detail.ResponsiblePersonName = responsiblePersonInfo.UserName
	creatorInfo := u.queryUserInfo(ctx, dataPush.CreatorUID)
	detail.CreatorUID = creatorInfo.Uid
	detail.CreatorName = creatorInfo.UserName
	updaterInfo := u.queryUserInfo(ctx, dataPush.UpdaterUID)
	detail.UpdaterUID = updaterInfo.Uid
	detail.UpdaterName = updaterInfo.UserName
	detail.CreatedAt = dataPush.CreatedAt.UnixMilli()
	detail.UpdatedAt = dataPush.UpdatedAt.UnixMilli()
	return detail, nil
}

func (u *useCase) Delete(ctx context.Context, id uint64) error {
	dataPush, err := u.repo.Get(ctx, id)
	if err != nil {
		return err
	}
	tx := u.Begin()
	defer func() {
		End(tx, err)
	}()
	//删除同步模型给
	if err = u.repo.Delete(ctx, tx, id); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//如果是已经发布了模型，才去海豚调度删除下
	if dataPush.PushStatus >= constant.DataPushStatusStarting.Integer.Int32() {
		if err = u.DeleteSyncModel(ctx, dataPush); err != nil {
			return errorcode.Detail(errorcode.DataSyncStopError, err.Error())
		}
	}
	return nil
}

func (u *useCase) History(ctx context.Context, req *domain.TaskExecuteHistoryReq) (*domain.LocalPageResult[domain.TaskLogInfo], error) {
	dataPush, err := u.repo.Get(ctx, req.ModelUUID.Uint64())
	if err != nil {
		return nil, err
	}
	//GoCommon base service 功能还不算完善，不能copy，所以这么办
	historyReq := &data_sync.TaskLogReq{
		Offset:          *req.Offset,
		Limit:           *req.Limit,
		Direction:       *req.Direction,
		Sort:            *req.Sort,
		Step:            req.Step,
		ScheduleExecute: req.ScheduleExecute,
		Status:          req.Status,
		ModelUUID:       req.ModelUUID.String(),
	}
	logResp, err := u.dataSyncDriven.QueryTaskHistory(ctx, historyReq)
	if err != nil {
		log.Errorf("QueryTaskHistory %v", err.Error())
		return nil, errorcode.Detail(errorcode.DataSyncHistoryError, err.Error())
	}
	logs := make([]*domain.TaskLogInfo, 0, len(logResp.TotalList))
	copier.Copy(&logs, logResp.TotalList)
	return &domain.LocalPageResult[domain.TaskLogInfo]{
		ID:          fmt.Sprintf("%v", dataPush.ID),
		Name:        dataPush.Name,
		NextExecute: GetNextExecuteTime(dataPush, logs),
		TotalCount:  logResp.Total,
		Entries:     logs,
	}, nil
}

func (u *useCase) Execute(ctx context.Context, id uint64) error {
	dataPush, err := u.repo.Get(ctx, id)
	if err != nil {
		return err
	}
	//审核中的不能立即执行
	if dataPush.AuditState == constant.AuditStatusAuditing {
		return errorcode.Detail(errorcode.DataSyncAuditingExecuteError, err.Error())
	}
	modelID := fmt.Sprintf("%v", id)
	if err := u.dataSyncDriven.Run(ctx, modelID); err != nil {
		log.WithContext(ctx).Errorf("任务执行失败%v", err.Error())
		return errorcode.Detail(errorcode.DataSyncExecuteError, err.Error())
	}
	// 移除手动执行时的状态更新，保持数据库状态不变
	// 这样List接口返回的状态不会因手动执行而改变
	// 只有ListSchedule会通过getSmartPushStatus展示真实执行状态
	return nil
}

func (u *useCase) ScheduleCheck(req *domain.ScheduleCheckReq) (string, error) {
	//校验调度时间
	if _, err := time.Parse(constant.LOCAL_TIME_FORMAT, req.ScheduleTime); err != nil {
		return "", errorcode.Desc(errorcode.DataSyncInvalidTimeFormat)
	}
	// 去掉crontab表达式中的前后空格
	req.CrontabExpr = strings.TrimSpace(req.CrontabExpr)
	if err := checkCrontab(req.CrontabExpr); err != nil {
		return "", err
	}
	//检查crontab 表达式
	nextTime := time.UnixMilli(NextExecute5(req.CrontabExpr))
	return nextTime.Format(constant.LOCAL_TIME_FORMAT), nil
}

// Schedule 修改调度时间, 这个也是要审核的
func (u *useCase) Schedule(ctx context.Context, req *domain.SchedulePlanReq) error {
	dataPush, err := u.repo.Get(ctx, req.ID.Uint64())
	if err != nil {
		return err
	}
	// 去掉crontab表达式中的前后空格
	req.CrontabExpr = strings.TrimSpace(req.CrontabExpr)
	if err = checkCrontab(req.CrontabExpr); err != nil {
		return err
	}
	req.SaveAsDraft(dataPush)

	// 如果是一次性任务且是草稿模式，清空crontab_expr
	if req.ScheduleType == constant.ScheduleTypeOnce.String && req.IsDraft {
		dataPush.CrontabExpr = ""
	}

	//审核中的无法修改调度模型
	if dataPush.AuditState == constant.AuditStatusAuditing {
		return errorcode.Desc(errorcode.DataSyncAuditingExecuteError)
	}
	// 如果不是草，开启走下流程
	if !req.IsDraft {
		//如果是已停用，那么就是启用审核，其余状态是变更审核
		if dataPush.PushStatus == constant.DataPushStatusStopped.Integer.Int32() {
			dataPush.Operation = constant.DataPushOperationRestart.Integer.Int32()
		} else {
			dataPush.Operation = constant.DataPushOperationChange.Integer.Int32()
		}
		if err = u.Operation.RunWithWorkflow(ctx, dataPush); err != nil {
			return err
		}
	}
	if err = u.repo.UpdateSchedule(ctx, dataPush); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

// Switch 开关
func (u *useCase) Switch(ctx context.Context, req *domain.SwitchReq) error {
	dataPush, err := u.repo.Get(ctx, req.ID.Uint64())
	if err != nil {
		return err
	}
	//审核中的无法修改调度模型
	if dataPush.AuditState == constant.AuditStatusAuditing {
		return errorcode.Desc(errorcode.DataSyncAuditingExecuteError)
	}
	//执行
	dataPush.Operation = req.Operation
	if err = u.Operation.RunWithWorkflow(ctx, dataPush); err != nil {
		return err
	}
	if err = u.repo.Update(ctx, dataPush, nil); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

// Overview  推送概览
func (u *useCase) Overview(ctx context.Context, req *domain.OverviewReq) (*domain.OverviewResp, error) {
	if req.StartTime == nil || req.EndTime == nil {
		startTime := time.Now().AddDate(-1, 0, 0).UnixMilli()
		req.StartTime = &startTime
		endTime := time.Now().UnixMilli()
		req.EndTime = &endTime
	}
	statistics, err := u.repo.Overview(ctx, req)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return statistics, nil
}

// AnnualStatistics   年度统计
func (u *useCase) AnnualStatistics(ctx context.Context) ([]*domain.AnnualStatisticItem, error) {
	results, err := u.repo.AnnualStatistics(ctx)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return results, nil
}

func (u *useCase) AuditList(ctx context.Context, req *domain.AuditListReq) (resp *response.PageResult[domain.AuditListItem], err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	auditTypes := []string{constant.AuditTypeDataPushAudit}
	audits, err := u.wfDriven.GetAuditList(ctx, wf_rest.WorkflowListType(req.Target), auditTypes, *req.Offset, *req.Limit)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetAuditList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	resp = &response.PageResult[domain.AuditListItem]{
		TotalCount: audits.TotalCount,
		Entries:    make([]*domain.AuditListItem, 0),
	}
	if len(audits.Entries) <= 0 {
		return resp, nil
	}
	for i := range audits.Entries {
		auditItem := audits.Entries[i]
		customData := auditItem.ApplyDetail.DecodeData()
		operation, _ := strconv.Atoi(fmt.Sprintf("%v", customData["operation"]))
		data := &domain.AuditListItem{
			DataPushID:   fmt.Sprintf("%v", customData["id"]),
			DataPushName: fmt.Sprintf("%v", customData["name"]),
			AuditCommonInfo: domain.AuditCommonInfo{
				ApplyCode:      auditItem.ApplyDetail.Process.ApplyID,
				AuditType:      auditItem.BizType,
				AuditStatus:    auditItem.AuditStatus,
				AuditTime:      fmt.Sprintf("%v", customData["audit_time"]),
				AuditOperation: operation,
				ApplierID:      auditItem.ApplyDetail.Process.UserID,
				ProcInstID:     auditItem.ID,
				ApplierName:    auditItem.ApplyDetail.Process.UserName,
				ApplyTime:      auditItem.ApplyTime,
			},
		}
		resp.Entries = append(resp.Entries, data)
	}
	return resp, nil
}

func (u *useCase) Revocation(ctx context.Context, req *domain.CommonIDReq) (err error) {
	ctx, _ = trace.StartInternalSpan(ctx)
	defer trace.EndSpan(ctx, err)

	//1. 检查没有没有取消记录，不可重复取消
	dataPush, err := u.repo.Get(ctx, req.ID.Uint64())
	if err != nil {
		return err
	}
	//只有审核中的能撤销，其他的情况无法撤销
	if dataPush.AuditState != constant.AuditStatusAuditing {
		return errorcode.Desc(errorcode.DataPushInvalidRevocation)
	}
	//2. 调用workflow取消审核
	msg := wf_common.GenNormalCancelMsg(dataPush.ApplyID)
	if err = u.wf.AuditCancel(msg); err != nil {
		return errorcode.Detail(errorcode.DataPushRevocationFailed, err.Error())
	}
	//3. 更新状态
	dataPush.AuditState = constant.DataPushAuditStatusRevocation.Integer.Int32()
	if err = u.repo.Update(ctx, dataPush, nil); err != nil {
		return errorcode.Detail(errorcode.DataPushRevocationFailed, err.Error())
	}
	return nil
}

func (u *useCase) LatestExecute(ctx context.Context, mid uint64) (*domain.TaskLogInfo, error) {
	historyReq := &data_sync.TaskLogReq{
		Offset:    1,
		Limit:     10,
		Direction: "desc",
		Sort:      "start_time",
		Step:      "INSERT",
		ModelUUID: fmt.Sprintf("%v", mid),
	}
	logResp, err := u.dataSyncDriven.QueryTaskHistory(ctx, historyReq)
	if err != nil {
		return nil, errorcode.Detail(errorcode.DataSyncHistoryError, err.Error())
	}
	logs := make([]*domain.TaskLogInfo, 0, len(logResp.TotalList))
	copier.Copy(&logs, logResp.TotalList)
	for _, l := range logs {
		if l.EndTime != "" {
			return l, nil
		}
	}
	return nil, fmt.Errorf("no finished log")
}

func (u *useCase) UpdateStatus(ctx context.Context, data *model.TDataPushModel) error {
	err := u.repo.UpdateStatus(ctx, data)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	// 如果状态是已结束，则更新增量数据推送的增量时间
	// if data.PushStatus == constant.DataPushStatusEnd.Integer.Int32() {
	// 	log.WithContext(ctx).Infof("UpdateStatus: %v", data)
	// 	//拼接sql，查询本次增量推送完成时增量字段的最大值
	// 	commonModel, err := u.NewCommonModel(ctx, data)
	// 	if err != nil {
	// 		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	// 	}
	// 	sql := commonModel.getMaxIncrementValueSQL()
	// 	maxIncrementValue, err := u.queryMaxIncrementValue(ctx, sql)
	// 	if err != nil {
	// 		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	// 	}
	// 	// 尝试将maxIncrementValue转换为时间戳
	// 	incrementTimestamp, err := strconv.ParseInt(maxIncrementValue, 10, 64)
	// 	if err != nil {
	// 		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	// 	}
	// 	data.IncrementTimestamp = incrementTimestamp
	// 	// 更新推送模型
	// 	err = u.UpdateSyncModel(ctx, data)
	// 	if err != nil {
	// 		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	// 	}

	// 	if err := u.repo.Update(ctx, data, nil); err != nil {
	// 		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	// 	}
	// }
	return nil
}

func (u *useCase) QueryUnFinished(ctx context.Context) ([]*model.TDataPushModel, error) {
	objs, err := u.repo.QueryUnFinished(ctx)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return objs, nil
}

// getSmartPushStatus 智能判断推送状态：结合数据库状态和执行记录
func (u *useCase) getSmartPushStatus(ctx context.Context, dataPush *model.TDataPushModel) int32 {
	// 检查是否有执行记录
	executeLog, err := u.LatestExecute(ctx, dataPush.ID)
	if err != nil {
		return dataPush.PushStatus // 没有执行记录，保持原状态
	}

	// 一次性任务的智能判断
	if dataPush.ScheduleType == constant.ScheduleTypeOnce.String {
		// 如果是进行中状态，检查是否已完成
		if dataPush.PushStatus == constant.DataPushStatusGoing.Integer.Int32() {
			// 一次性任务：有end_time且状态为SUCCESS/FAILURE就认为已完成
			if executeLog.EndTime != "" &&
				(executeLog.Status == "SUCCESS" || executeLog.Status == "FAILURE") {
				return constant.DataPushStatusEnd.Integer.Int32()
			}
		}
		// 如果是未开始状态，但有执行记录，显示为进行中
		if dataPush.PushStatus == constant.DataPushStatusStarting.Integer.Int32() {
			return constant.DataPushStatusGoing.Integer.Int32()
		}
	}

	// 周期性任务的智能判断
	if dataPush.ScheduleType == constant.ScheduleTypePeriod.String {
		// 如果是未开始状态，但有执行记录，显示为进行中
		if dataPush.PushStatus == constant.DataPushStatusStarting.Integer.Int32() {
			return constant.DataPushStatusGoing.Integer.Int32()
		}
		// 周期性任务通常不会因为单次执行而变为已结束状态
		// 保持数据库中的状态（进行中、已停用等）
	}

	return dataPush.PushStatus
}
