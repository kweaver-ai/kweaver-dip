package work_order_task

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"strings"

	taskRepo "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"

	"github.com/IBM/sarama"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	gorm_work_order "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
)

type domain struct {
	repo       work_order_task.Repository
	aggregator aggregator
	taskRepo   taskRepo.Repo
	Datasource af_configuration.DatasourceInterface
	dvDriven   data_view.Driven
	ccDriven   configuration_center.Driven
	dcDriven   data_catalog.Driven
	// 数据库 af_tasks.work_order
	workOrder gorm_work_order.Repo
	// Kafka Producer
	producer sarama.SyncProducer
}

func New(
	repo work_order_task.Repository,
	database database.DatabaseInterface,
	workOrder gorm_work_order.Repo,
	kafka sarama.Client,
	taskRepo taskRepo.Repo,
	dvDriven data_view.Driven,
	ccDriven configuration_center.Driven,
	dcDriven data_catalog.Driven,
) (Domain, error) {
	p, err := sarama.NewSyncProducerFromClient(kafka)
	if err != nil {
		return nil, err
	}
	return &domain{
		repo: repo,
		aggregator: aggregator{
			workOrder: database.AFTasks().WorkOrders(),
			object:    database.AFConfiguration().Objects(),
		},
		workOrder:  workOrder,
		Datasource: database.AFConfiguration().Datasources(),
		producer:   p,
		taskRepo:   taskRepo,
		dvDriven:   dvDriven,
		ccDriven:   ccDriven,
		dcDriven:   dcDriven,
	}, nil
}

// 创建工单任务
func (d *domain) Create(ctx context.Context, task *task_center_v1.WorkOrderTask) error {
	if err := d.verify(task); err != nil {
		return errorcode.Detail(errorcode.WorkOrderInvalidParameter, err.Error())
	}
	return d.repo.Create(ctx, convertV1ToModel_WorkOrderTask(task))
}
func (d domain) verify(task *task_center_v1.WorkOrderTask) error {
	workOrder, err := work_order_task.GetWorkOrder(d.repo.Db(), task.WorkOrderID)
	if err != nil {
		return err
	}
	switch workOrder.Type {
	// 数据理解
	case work_order.WorkOrderTypeDataComprehension.Integer.Int32():
		if task.DataComprehension == nil ||
			notNil(task.DataAggregation) || notNil(task.DataFusion) || notNil(task.DataQuality) || notNil(task.DataQualityAudit) {
			return fmt.Errorf("DataComprehension is required")
		}
	// 数据归集
	case work_order.WorkOrderTypeDataAggregation.Integer.Int32():
		if task.DataAggregation == nil ||
			notNil(task.DataComprehension) || notNil(task.DataFusion) || notNil(task.DataQuality) || notNil(task.DataQualityAudit) {
			return fmt.Errorf("DataAggregation is required")
		}
	// 数据融合
	case work_order.WorkOrderTypeDataFusion.Integer.Int32():
		if task.DataFusion == nil ||
			notNil(task.DataAggregation) || notNil(task.DataComprehension) || notNil(task.DataQuality) || notNil(task.DataQualityAudit) {
			return fmt.Errorf("DataFusion is required")
		}

	// 数据质量
	case work_order.WorkOrderTypeDataQuality.Integer.Int32():
		if task.DataQuality == nil ||
			notNil(task.DataComprehension) || notNil(task.DataAggregation) || notNil(task.DataFusion) || notNil(task.DataQualityAudit) {
			return fmt.Errorf("DataQuality is required")
		}

	// 数据质量稽核
	case work_order.WorkOrderTypeDataQualityAudit.Integer.Int32():
		if len(task.DataQualityAudit) == 0 ||
			notNil(task.DataComprehension) || notNil(task.DataAggregation) || notNil(task.DataFusion) || notNil(task.DataQuality) {
			return fmt.Errorf("DataQualityAudit is required")
		}

	default:
		return fmt.Errorf("unsupported work order type: %v", workOrder.Type)
	}
	return nil
}
func notNil(req any) bool {
	if req != nil {
		return false
	}
	return true
}

// 获取工单任务
func (d *domain) Get(ctx context.Context, id string) (*task_center_v1.WorkOrderTask, error) {
	got, err := d.repo.Get(ctx, id)
	if errors.Is(err, work_order_task.ErrNotFound) {
		return nil, errorcode.Desc(errorcode.PublicResourceNotFound)
	} else if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}
	return convertModelToV1_WorkOrderTask(got), nil
}

// 更新工单任务
func (d *domain) Update(ctx context.Context, task *task_center_v1.WorkOrderTask) error {
	if err := d.verify(task); err != nil {
		return errorcode.Detail(errorcode.WorkOrderInvalidParameter, err)
	}
	workOrderTask, err := d.repo.Get(ctx, task.ID)
	if err != nil {
		return err
	}
	if len(workOrderTask.WorkOrderTaskTypedDetail.DataQualityAudit) > 0 {
		detail := make([]*task_center_v1.WorkOrderTaskDetailQualityAuditDetail, len(task.DataQualityAudit))
		convertV1IntoModel_QualityAuditDetail(task.DataQualityAudit, workOrderTask.WorkOrderTaskTypedDetail.DataQualityAudit, workOrderTask.ID, detail)
		task.DataQualityAudit = detail
	}

	// 更新数据库记录
	if err := d.repo.Update(ctx, convertV1ToModel_WorkOrderTask(task)); err != nil {
		if errors.Is(err, work_order_task.ErrNotFound) {
			err = errorcode.Desc(errorcode.PublicResourceNotFound)
		}
		return err
	}

	// 虽然所有的更新都应该发消息，但是供需对接只希望处理已完成的归集工单任务，
	// 所以只有更新归集工单任务状态为已完成时才发送消息。
	// if task.Status != task_center_v1.WorkOrderTaskCompleted {
	// 	return nil
	// }
	// if o, err := d.workOrder.GetById(ctx, task.WorkOrderID); err != nil {
	// 	return err
	// } else if o.Type != work_order.WorkOrderTypeDataAggregation.Integer.Int32() {
	// 	return nil
	// }

	// // 创建 Kafka 消息的 Value
	// event := &meta_v1.WatchEvent[task_center_v1.WorkOrderTask]{Type: meta_v1.Modified}
	// for i, dataAggregation := range task.DataAggregation {
	// 	dataBaseId := ""
	// 	if s, err := d.Datasource.GetByHuaAoId(ctx, dataAggregation.Source.DatasourceID); err != nil {
	// 		return err
	// 	} else {
	// 		dataBaseId = s.ID
	// 	}
	// 	task.DataAggregation[i].Source.DatasourceID = dataBaseId
	// 	if s, err := d.Datasource.GetByHuaAoId(ctx, dataAggregation.Target.DatasourceID); err != nil {
	// 		return err
	// 	} else {
	// 		dataBaseId = s.ID
	// 	}
	// 	task.DataAggregation[i].Target.DatasourceID = dataBaseId

	// }
	// task.DeepCopyInto(&event.Resource)
	// v, err := json.Marshal(event)
	// if err != nil {
	// 	return err
	// }
	// // 发送消息：工单任务被更新
	// log.Info("send event message", zap.Any("event", event))
	// if p, o, err := d.producer.SendMessage(&sarama.ProducerMessage{
	// 	// TODO: 根据 *task_center_v1.WorkOrderTask{} 得到 Kafka Topic，而不是硬编码
	// 	Topic: "af.task-center.v1.work-order-tasks",
	// 	Key:   sarama.StringEncoder(task.ID),
	// 	Value: sarama.ByteEncoder(v),
	// }); err != nil {
	// 	// 只记录 WARN 日志，先不处理发送消息失败的情况
	// 	log.Warn("send event message fail", zap.Error(err), zap.Any("event", event))
	// } else {
	// 	log.Debug("send event message", zap.Int32("partition", p), zap.Int64("offset", o))
	// }

	return nil
}

// 获取工单任务列表
func (d *domain) List(ctx context.Context, opts *task_center_v1.WorkOrderTaskListOptions) (*task_center_v1.WorkOrderTaskList, error) {
	tasks, count, err := d.repo.ListByWorkOrderID(ctx, opts.WorkOrderID, opts.Limit, (opts.Offset-1)*opts.Limit)
	if err != nil {
		return nil, errorcode.NewPublicDatabaseError(err)
	}

	return &task_center_v1.WorkOrderTaskList{
		Entries:    convertModelToV1_WorkOrderTasks(tasks),
		TotalCount: int(count),
	}, nil
}

// 批量创建工单任务
func (d *domain) BatchCreate(ctx context.Context, list *task_center_v1.WorkOrderTaskList) error {
	// TODO：检查工单任务所引用的用户、部门、数据元是否存在
	return d.repo.BatchCreate(ctx, convertV1ToModel_WorkOrderTasks(list.Entries))
}

// 批量更新工单任务
func (d *domain) BatchUpdate(ctx context.Context, list *task_center_v1.WorkOrderTaskList) error {
	// TODO：检查工单任务所引用的用户、部门、数据元是否存在

	return d.repo.BatchUpdate(ctx, convertV1ToModel_WorkOrderTasks(list.Entries))
}

func (d *domain) CatalogTaskStatus(ctx context.Context, req *CatalogTaskStatusReq) (*CatalogTaskStatusResp, error) {
	resp := &CatalogTaskStatusResp{}
	dataAggregationTasks, err := d.repo.GetDataAggregationTasks(ctx, req.FormName)
	if err != nil {
		return nil, err
	}
	resp.DataAggregationStatus = string(d.getStatus(dataAggregationTasks))
	dataQualityAuditTasks, err := d.repo.GetDataQualityAuditTasks(ctx, req.FormName)
	if err != nil {
		return nil, err
	}
	pStatus := make([]task_center_v1.WorkOrderTaskStatus, 0)
	dataQualityAuditStatus := d.getStatus(dataQualityAuditTasks)
	if dataQualityAuditStatus != "" {
		pStatus = append(pStatus, dataQualityAuditStatus)
	}
	dataFusionTasks, err := d.repo.GetDataFusionTasks(ctx, req.FormName)
	if err != nil {
		return nil, err
	}
	dataFusionStatus := d.getStatus(dataFusionTasks)
	if dataFusionStatus != "" {
		pStatus = append(pStatus, dataFusionStatus)
	}
	resp.DataProcessingStatus = string(d.getProcessingStatus(pStatus))
	comprehensionTask, err := d.taskRepo.GetLatestComprehensionTask(ctx, req.CatalogId)
	if err != nil {
		return nil, err
	}
	if comprehensionTask != nil {
		switch comprehensionTask.Status {
		case constant.CommonStatusReady.Integer.Int8():
			resp.DataComprehensionStatus = "Ready"
		case constant.CommonStatusOngoing.Integer.Int8():
			resp.DataComprehensionStatus = "Running"
		case constant.CommonStatusCompleted.Integer.Int8():
			resp.DataComprehensionStatus = "Completed"
		}
	}
	return resp, nil
}

func (d *domain) getStatus(tasks []*model.WorkOrderTask) (status task_center_v1.WorkOrderTaskStatus) {
	if len(tasks) > 0 {
		status = task_center_v1.WorkOrderTaskCompleted
		for _, task := range tasks {
			switch task.Status {
			case model.WorkOrderTaskStatus(task_center_v1.WorkOrderTaskFailed):
				return task_center_v1.WorkOrderTaskFailed
			case model.WorkOrderTaskStatus(task_center_v1.WorkOrderTaskRunning):
				status = task_center_v1.WorkOrderTaskRunning
			}
		}
	}
	return status
}

func (d *domain) getProcessingStatus(pStatus []task_center_v1.WorkOrderTaskStatus) (processingStatus task_center_v1.WorkOrderTaskStatus) {
	if len(pStatus) > 0 {
		processingStatus = task_center_v1.WorkOrderTaskCompleted
		for _, status := range pStatus {
			switch status {
			case task_center_v1.WorkOrderTaskFailed:
				return task_center_v1.WorkOrderTaskFailed
			case task_center_v1.WorkOrderTaskRunning:
				processingStatus = task_center_v1.WorkOrderTaskRunning
			}
		}
	}
	return processingStatus
}

func (d *domain) CatalogTask(ctx context.Context, req *CatalogTaskReq) (*CatalogTaskResp, error) {
	// 数据归集任务
	dataAggregation, err := d.getDataAggregation(ctx, req)
	// 加工
	processing, err := d.getProcessing(ctx, req)
	if err != nil {
		return nil, err
	}
	// 数据理解任务
	var dataComprehension *DataComprehension
	comprehensionTask, err := d.taskRepo.GetLatestComprehensionTask(ctx, req.CatalogId)
	if err != nil {
		return nil, err
	}
	if comprehensionTask != nil {
		dataComprehension = &DataComprehension{}
		switch comprehensionTask.Status {
		case constant.CommonStatusReady.Integer.Int8():
			dataComprehension.DataComprehensionStatus = "Ready"
		case constant.CommonStatusOngoing.Integer.Int8():
			dataComprehension.DataComprehensionStatus = "Running"
		case constant.CommonStatusCompleted.Integer.Int8():
			dataComprehension.DataComprehensionStatus = "Completed"
		}
		dataComprehension.TotalCount = 1
		dataComprehensionDetail, _ := d.dcDriven.GetComprehensionDetail(ctx, req.CatalogId, "")
		if dataComprehensionDetail != nil {
			dataComprehension.DataComprehensionReportStatus = dataComprehensionDetail.Status
			dataComprehension.ReportUpdatedAt = dataComprehensionDetail.UpdatedAt
			dataComprehension.AuditAdvice = dataComprehensionDetail.AuditAdvice
		}
	}
	return &CatalogTaskResp{dataAggregation, processing, dataComprehension}, nil
}

func (d *domain) getSourceInfo(ctx context.Context, formId string) (*SourceInfo, error) {
	sourceInfo := &SourceInfo{SourceFormID: formId}
	viewRes, err := d.dvDriven.GetDataViewField(ctx, formId)
	if err != nil {
		return nil, err
	}
	sourceInfo.SourceFormName = viewRes.TechnicalName
	dataSourceInfos, err := d.ccDriven.GetDataSourcePrecision(ctx, []string{viewRes.DatasourceId})
	if err != nil {
		return nil, err
	}
	if len(dataSourceInfos) > 0 {
		sourceInfo.SourceType = enum.ToString[SourceType](dataSourceInfos[0].SourceType)
	}
	return sourceInfo, nil
}

func (d *domain) getSourceInfos(ctx context.Context, formIds []string) ([]*SourceInfo, error) {
	resp := make([]*SourceInfo, 0)
	for _, formId := range formIds {
		sourceInfo, err := d.getSourceInfo(ctx, formId)
		if err != nil {
			return nil, err
		}
		resp = append(resp, sourceInfo)
	}
	return resp, nil
}
func (d *domain) getDataAggregation(ctx context.Context, req *CatalogTaskReq) (dataAggregation *DataAggregation, err error) {
	// 数据归集任务
	dataAggregationTasks, err := d.repo.GetDataAggregationTasks(ctx, req.FormName)
	if err != nil {
		return nil, err
	}
	if len(dataAggregationTasks) > 0 {
		dataAggregation = &DataAggregation{}
		dataAggregation.TotalCount = int64(len(dataAggregationTasks))
		for _, dataAggregationTask := range dataAggregationTasks {
			switch dataAggregationTask.Status {
			case model.WorkOrderTaskStatus(task_center_v1.WorkOrderTaskFailed):
				dataAggregation.FailedCount++
			case model.WorkOrderTaskStatus(task_center_v1.WorkOrderTaskRunning):
				dataAggregation.RunningCount++
			case model.WorkOrderTaskStatus(task_center_v1.WorkOrderTaskCompleted):
				dataAggregation.CompletedCount++
			}
		}
		dataAggregation.DataAggregationStatus = string(d.getStatus(dataAggregationTasks))
		details, err := d.repo.GetDataAggregationDetails(ctx, req.FormName)
		if err != nil {
			return nil, err
		}
		dataAggregation.DataAggregationSourceInfo, err = d.getDataAggregationSourceInfos(ctx, details)
	}
	return dataAggregation, nil
}

func (d *domain) getProcessing(ctx context.Context, req *CatalogTaskReq) (*Processing, error) {
	processing := &Processing{}
	// 质量检测任务

	dataQualityAuditTasks, err := d.repo.GetDataQualityAuditTasks(ctx, req.FormName)
	if err != nil {
		return nil, err
	}
	var dataQualityAudit *DataQualityAudit
	if len(dataQualityAuditTasks) > 0 {
		dataQualityAudit = &DataQualityAudit{}
		dataQualityAudit.DataQualityAuditStatus = string(d.getStatus(dataQualityAuditTasks))
		var thirdParty bool
		cfg := &settings.ConfigInstance.Callback
		if cfg.Enabled {
			thirdParty = true
		}
		report, _ := d.dvDriven.GetExploreReport(ctx, req.FormId, thirdParty)
		if report != nil {
			dataQualityAudit.ReportUpdatedAt = report.ExploreTime
		}
	}

	// 数据融合任务
	var dataFusion *DataFusion
	dataFusionTasks, err := d.repo.GetDataFusionTasks(ctx, req.FormName)
	if err != nil {
		return nil, err
	}

	if len(dataFusionTasks) > 0 {
		dataFusion = &DataFusion{}
		catalogIds, fields, err := d.workOrder.GetFusionWorkOrderRelationCatalog(ctx, dataFusionTasks[0].WorkOrderID)
		if err != nil {
			return nil, err
		}
		if len(catalogIds) > 0 {
			ids := make([]string, 0)
			catalogIdMap := make(map[uint64]bool)
			for _, catalogId := range catalogIds {
				if _, exist := catalogIdMap[*catalogId]; !exist {
					catalogIdMap[*catalogId] = true
					ids = append(ids, strconv.FormatUint(*catalogId, 10))
				}
			}
			dataFusion.DataFusionSourceForm, err = d.getDataCatalogMountForm(ctx, ids)
			if err != nil {
				return nil, err
			}
		}
		if len(fields) > 0 {
			dataFusion.DataFusionSourceField = fields
		}
		dataFusion.DataFusionStatus = string(d.getStatus(dataFusionTasks))
	}
	processing.TotalCount = int64(len(dataQualityAuditTasks) + len(dataFusionTasks))
	processing.DataQualityAudit = dataQualityAudit
	processing.DataFusion = dataFusion
	return processing, nil
}

func (d *domain) getDataCatalogMountForm(ctx context.Context, catalogIds []string) ([]*DataFusionSourceForm, error) {
	resp := make([]*DataFusionSourceForm, 0)
	for _, catalogId := range catalogIds {
		dataFusionInfo := &DataFusionSourceForm{}
		resource, err := d.dcDriven.GetDataCatalogMountList(ctx, catalogId)
		if err != nil {
			return nil, err
		}
		if resource != nil {
			for _, r := range resource.MountResource {
				if r.ResourceType == 1 {
					dataFusionInfo.SourceInfo, err = d.getSourceInfo(ctx, r.ResourceID)
					if err != nil {
						return nil, err
					}
					dataFusionInfo.DataAggregationSourceInfo, dataFusionInfo.DataAggregationStatus, err = d.getDataAggregationTask(ctx, dataFusionInfo.SourceFormName)
					if err != nil {
						return nil, err
					}
					resp = append(resp, dataFusionInfo)
				}
			}
		}
	}
	return resp, nil
}

func (d *domain) getDataAggregationSourceInfos(ctx context.Context, details []*model.WorkOrderDataAggregationDetail) ([]*SourceInfo, error) {
	sourceInfos := make([]*SourceInfo, 0)
	formNameMap := make(map[string]bool)
	for _, detail := range details {
		key := fmt.Sprintf("%s-%s", detail.Source.DatasourceID, detail.Source.TableName)
		if _, exist := formNameMap[key]; !exist {
			formNameMap[key] = true
			sourceInfo := &SourceInfo{
				SourceFormName: detail.Source.TableName,
				SourceType:     "records",
			}
			sourceInfos = append(sourceInfos, sourceInfo)
		}
	}
	return sourceInfos, nil
}

func (d *domain) getDataAggregationTask(ctx context.Context, formName string) ([]*SourceInfo, string, error) {
	var status string
	dataAggregationTasks, err := d.repo.GetDataAggregationTasks(ctx, formName)
	if err != nil {
		return nil, status, err
	}
	status = string(d.getStatus(dataAggregationTasks))
	details, err := d.repo.GetDataAggregationDetails(ctx, formName)
	if err != nil {
		return nil, status, err
	}
	sourceInfo, err := d.getDataAggregationSourceInfos(ctx, details)
	return sourceInfo, status, err
}

func (d *domain) GetDataAggregationTask(ctx context.Context, req *DataAggregationTaskReq) (*DataAggregationTaskResp, error) {
	dataAggregationTaskInfos := make([]*DataAggregationTaskInfo, 0)
	if len(req.FormNames) > 0 {
		names := strings.Split(req.FormNames, ",")
		details, err := d.repo.GetByFormNames(ctx, names)
		if err != nil {
			return nil, err
		}
		nameCountMap := make(map[string]int)
		idNameMap := make(map[string]string)
		taskIds := make([]string, 0)
		for _, detail := range details {
			if _, exist := nameCountMap[detail.Target.TableName]; !exist {
				taskIds = append(taskIds, detail.ID)
				nameCountMap[detail.Target.TableName] = detail.Count
				idNameMap[detail.ID] = detail.Target.TableName
			}
		}
		tasks, err := d.repo.GetTaskByIds(ctx, taskIds)
		if err != nil {
			return nil, err
		}
		for _, task := range tasks {
			dataAggregationTaskInfo := &DataAggregationTaskInfo{
				FormName:    idNameMap[task.ID],
				WorkOrderId: task.WorkOrderID,
				Status:      string(task.Status),
				CreatedAt:   task.CreatedAt.UnixMilli(),
				UpdatedAt:   task.UpdatedAt.UnixMilli(),
			}
			dataAggregationTaskInfo.Count = nameCountMap[dataAggregationTaskInfo.FormName]
			dataAggregationTaskInfos = append(dataAggregationTaskInfos, dataAggregationTaskInfo)
		}
	}
	return &DataAggregationTaskResp{Entries: dataAggregationTaskInfos}, nil
}
