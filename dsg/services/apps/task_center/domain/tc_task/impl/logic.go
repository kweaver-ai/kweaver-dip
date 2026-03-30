package impl

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	gConfiguration_center "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

func (t *TaskUserCase) CheckTaskReq(ctx context.Context, taskReq *domain.TaskCreateReqModel) error {
	//新建指标任务迁移到标准化平台，此处不再需要校验是否有父任务
	//项目内任务，检查新建标准任务的父任务
	//if taskReq.TaskType == constant.TaskTypeFieldStandard.String {
	//	if taskReq.ParentTaskId == "" {
	//		return errorcode.Desc(errorcode.ParentTaskIdEmpty)
	//	}
	//	//检查新建标准任务的ID是否存在
	//	parentTask, err := t.taskRepo.GetTaskBriefById(ctx, taskReq.ParentTaskId)
	//	if err != nil || parentTask.ID == "" {
	//		return errorcode.Desc(errorcode.ParentTaskIdEmpty)
	//	}
	//	//只能关联业务表标准化任务
	//	//if parentTask.TaskType != constant.TaskTypeStandardization.Integer.Int32() {
	//	//	return errorcode.Desc(errorcode.ParentTaskMustMatched)
	//	//}
	//	//使用父节点的stagId
	//	taskReq.StageId = parentTask.StageID
	//	taskReq.BusinessModelID = parentTask.BusinessModelID
	//	//taskReq.SubjectDomainId = parentTask.SubjectDomainId
	//}

	//建模任务，流程id domain_id不可为空
	if (taskReq.TaskType == constant.TaskTypeNewMainBusiness.String || taskReq.TaskType == constant.TaskTypeDataMainBusiness.String) &&
		taskReq.DomainID == "" {
		return errorcode.Desc(errorcode.DomainIdEmpty)
	}
	// 指标开发任务,业务指标列表不能为空
	if taskReq.TaskType == constant.TaskTypeIndicatorProcessing.String {
		if len(taskReq.Data) == 0 {
			return errorcode.Desc(errorcode.TaskDataIndicatorEmpty)
		}
	}

	//如果是独立任务，检查下业务域和业务模型&数据模型，和业务表、数据表
	if taskReq.ProjectId == "" {
		taskRelationLevel := constant.GetTaskRelationLevel(taskReq.TaskType)
		switch taskRelationLevel {
		case constant.TaskRelationMainBusiness:
			if taskReq.BusinessModelID == "" {
				return errorcode.Desc(errorcode.TaskMainBusinessNotEmpty)
			}
			//指标任务，新建业务模型&数据模型任务等只需要关联到主干业务
			//modelInfo, err := business_grooming.GetRemoteBusinessModelInfo(ctx, taskReq.BusinessModelID)
			//if err != nil {
			//	return err
			//}
			//补足业务域
			//taskReq.SubjectDomainId = modelInfo.SubjectDomainID
		case constant.TaskRelationBusinessForm:
			if taskReq.BusinessModelID == "" {
				return errorcode.Desc(errorcode.TaskMainBusinessNotEmpty)
			}
			//标准化任务，采集加工任务，必须关联到具体的表
			if len(taskReq.Data) <= 0 {
				return errorcode.Desc(errorcode.TaskRelationDataEmpty)
			}
			//modelInfo, err := business_grooming.CheckFormIdBrief(ctx, taskReq.BusinessModelID, taskReq.Data...)
			//if err != nil {
			//	return err
			//}
			//补足业务域
			//taskReq.SubjectDomainId = modelInfo.SubjectDomainID
		case constant.TaskRelationDataCatalog:
			//数据理解任务，必须关联到具体的表
			if len(taskReq.Data) <= 0 {
				return errorcode.Desc(errorcode.TaskRelationDataEmpty)
			}
			//检查数据资源目录
			if err := data_catalog.CheckCatalogInfo(ctx, taskReq.Data...); err != nil {
				return err
			}
		}
	}
	return nil
}

// CheckTaskTypeDependencies 编辑的过程中，检查任务的依赖服务
func (t *TaskUserCase) CheckTaskTypeDependencies(ctx context.Context, task *model.TcTask, taskReq *domain.TaskUpdateReqModel) error {
	if task.ProjectID == "" {
		taskType := enum.ToString[constant.TaskType](task.TaskType)
		taskRelationLevel := constant.GetTaskRelationLevel(taskType)
		switch taskRelationLevel {
		case constant.TaskRelationEmpty:
			//如果是新建业务建模和数据建模完成任务，检查业务建模和数据建模是否存在和已发布
			if (task.TaskType == constant.TaskTypeNewMainBusiness.Integer.Int32() || task.TaskType == constant.TaskTypeDataMainBusiness.Integer.Int32()) && domain.IsFinishTask(task.Status, taskReq.Status) {
				businessModelID, err := t.relationDataRepo.GetTaskMainBusiness(ctx, task.ID, "")
				if err != nil || businessModelID == "" {
					return errorcode.Desc(errorcode.TaskMainBusinessNotDeleted)
				}
				if _, err := business_grooming.GetRemoteBusinessModelInfo(ctx, businessModelID); err != nil {
					return err
				} else {
					// TODO 判断审核是否通过，未通过返回异常
				}
			}
		case constant.TaskRelationMainBusiness:
			if task.BusinessModelID == "" {
				return errorcode.Desc(errorcode.TaskMainBusinessNotDeleted)
			}
			//指标任务，等只需要关联到业务建模和数据建模
			if _, err := business_grooming.GetRemoteBusinessModelInfo(ctx, task.BusinessModelID); err != nil {
				return err
			} else {
				// 完成状态且审核通过
				if taskReq.Status == constant.CommonStatusCompleted.String {
					// TODO 判断审核是否通过，未通过返回异常
				}
			}
		case constant.TaskRelationBusinessForm:
			if task.BusinessModelID == "" {
				return errorcode.Desc(errorcode.TaskMainBusinessNotDeleted)
			}
			//未编辑业务建模和数据建模
			if !(taskReq.BusinessModelID != "" && taskReq.BusinessModelID != task.BusinessModelID) {
				//没有传关联数据，检查下业务建模和数据建模即可
				if taskReq.Data == nil {
					if _, err := business_grooming.GetRemoteBusinessModelInfo(ctx, task.BusinessModelID); err != nil {
						return err
					} else {
						// 完成状态且审核通过
						if taskReq.Status == constant.CommonStatusCompleted.String {
							// TODO 判断审核是否通过，未通过返回异常
						}
					}
					return nil
				}
				//传了空数组，报错
				if taskReq.Data != nil && len(taskReq.Data) <= 0 {
					return errorcode.Desc(errorcode.TaskRelationDataEmpty)
				}
				//检查传入的formId是否合法
				if _, err := business_grooming.CheckFormIdBrief(ctx, task.BusinessModelID, taskReq.Data...); err != nil {
					return err
				}
				return nil
			}
			//编辑了业务建模和数据建模
			if taskReq.BusinessModelID != "" && taskReq.BusinessModelID != task.BusinessModelID {
				//没有传关联数据，检查下业务建模和数据建模即可
				if _, err := business_grooming.GetRemoteBusinessModelInfo(ctx, taskReq.BusinessModelID); err != nil {
					return err
				} else {
					// 完成状态且审核通过
					if taskReq.Status == constant.CommonStatusCompleted.String {
						// TODO 判断审核是否通过，未通过返回异常
					}
				}
				//更新情况下，至少关联一条数据
				if taskReq.Data != nil && len(taskReq.Data) <= 0 {
					return errorcode.Desc(errorcode.TaskRelationDataEmpty)
				}
				//检查传入的formId是否合法
				if _, err := business_grooming.CheckFormIdBrief(ctx, taskReq.BusinessModelID, taskReq.Data...); err != nil {
					return err
				}
			}
		case constant.TaskRelationDataCatalog:
			if taskReq.Status == constant.CommonStatusCompleted.String && task.Status == constant.CommonStatusOngoing.Integer.Int8() {
				//去数据库查询关联的编目
				ids, err := t.relationDataRepo.GetByTaskId(ctx, task.ID)
				if err != nil {
					if errors.Is(err, gorm.ErrRecordNotFound) {
						return errorcode.Desc(errorcode.TaskRecordNotFoundError)
					}
					return errorcode.Detail(errorcode.TaskDatabaseError, err.Error())
				}
				if len(ids) <= 0 {
					return errorcode.Desc(errorcode.TaskRelationDataEmpty)
				}
				//检查数据理解任务是否都完成
				if err := data_catalog.CheckCatalogStatus(ctx, ids...); err != nil {
					return err
				}
				return nil
			}
			//只是修改名称，改改状态，不检查数据
			if taskReq.Data != nil {
				//数据理解任务，必须关联到具体的表
				if len(taskReq.Data) <= 0 {
					return errorcode.Desc(errorcode.TaskRelationDataEmpty)
				}
				//检查数据资源目录是否存在
				if err := data_catalog.CheckCatalogInfo(ctx, taskReq.Data...); err != nil {
					return err
				}
			}

			// 完成主干业务校验
			// case constant.TaskRelationDomain:
			// 	if taskReq.Status == constant.CommonStatusCompleted.String && taskReq.DomainID == "" {
			// 		// 调用主干业务任务接口
			// 		if info, err := business_grooming.GetRemoteDomainInfo(ctx, task.BusinessModelID); err != nil {
			// 			return err
			// 		} else {
			// 			// 完成状态且审核通过
			// 			if "published" != info.AuditStatus {
			// 				// 判断审核是否通过，未通过返回异常
			// 				return errorcode.Desc(errorcode.TaskDataCompletedAuditStatusError)
			// 			}
			// 		}
			// 	}
		}
	}
	//新建标准任务不检查其父级任务
	return nil
}

// CheckSubTaskStatus  //检查子任务是否都完成
func (t *TaskUserCase) CheckSubTaskStatus(ctx context.Context, taskId string) error {
	finishedNum, err := t.taskRepo.QueryStandardSubTaskStatus(ctx, taskId, []int8{constant.CommonStatusReady.Integer.Int8(), constant.CommonStatusOngoing.Integer.Int8()})
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.TaskTaskNotFound)
		}
		log.WithContext(ctx).Error("CheckSubTaskStatus", zap.Error(err))
		return errorcode.Desc(errorcode.TaskDatabaseError)
	}
	if finishedNum > 0 {
		return errorcode.Desc(errorcode.SubTaskMustFinished)
	}
	return nil
}

// GetNewMainBusinessID 获取新建业务模型&数据模型任务的ID
func (t *TaskUserCase) GetNewMainBusinessID(ctx context.Context, brief *model.TcTask) string {
	if brief.TaskType != constant.TaskTypeNewMainBusiness.Integer.Int32() && brief.TaskType != constant.TaskTypeDataMainBusiness.Integer.Int32() {
		return ""
	}
	modelId := ""
	//查询项目绑定的业务模型ID&数据模型ID
	if brief.ProjectID != "" {
		ids, err := t.relationDataRepo.GetByProjectId(ctx, brief.ProjectID)
		if err != nil {
			log.WithContext(ctx).Error("find project relation data error", zap.Error(err))
		}
		if len(ids) <= 0 {
			return ""
		}
		modelId = ids[0]
	} else {
		ids, err := t.relationDataRepo.GetByTaskId(ctx, brief.ID)
		if err != nil {
			log.WithContext(ctx).Error("find task relation data error", zap.Error(err))
		}
		if len(ids) <= 0 {
			return ""
		}
		modelId = ids[0]
	}
	//查询得到业务模型ID和数据模型ID
	modelInfo, err := business_grooming.GetRemoteBusinessModelInfo(ctx, modelId)
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return ""
	}
	return modelInfo.MainBusinessId
}

func NewTaskDeletedMsg(nodeID, token string, taskType int32) kafkax.RawMessage {
	modelType := "business"
	if taskType == constant.TaskTypeDataMainBusiness.Integer.Int32() {
		modelType = "data"
	}
	header := kafkax.NewRawMessage()
	msg := kafkax.NewRawMessage()
	payload := kafkax.NewRawMessage()
	payload["business_model_id"] = nodeID
	payload["model_type"] = modelType
	payload["token"] = token
	msg["payload"] = payload
	msg["header"] = header
	return msg
}

// checkCompletedDependencies 编辑的 Ongoing->Completed 过程中，检查任务的依赖服务
func (t *TaskUserCase) checkCompletedDependencies(ctx context.Context, task *model.TcTask, taskReq *domain.TaskUpdateReqModel) error {
	// 检查业务建模诊断任务、主干业务梳理任务、业务建模任务、数据建模任务完成依赖
	switch task.TaskType {
	// 如果任务是业务建模诊断任务，
	// 此处先检查有没有诊断审核流程, 如果有再检查诊断任务是否完成发布
	case constant.TaskTypeBusinessDiagnosis.Integer.Int32():
		var bIsAuditNeeded bool
		auditBindInfo, err := t.ccDriven.GetProcessBindByAuditType(ctx, &gConfiguration_center.GetProcessBindByAuditTypeReq{AuditType: workflow.AF_BG_PUBLISH_BUSINESS_DIAGNOSIS})
		if err != nil {
			return err
		}
		if len(auditBindInfo.ID) > 0 && auditBindInfo.ProcDefKey != "" {
			bIsAuditNeeded = true
		}
		// 如果任务是业务建模诊断任务，检查诊断任务是否完成发布
		if bIsAuditNeeded && task.TaskType == constant.TaskTypeBusinessDiagnosis.Integer.Int32() {
			brief, err := business_grooming.Service.GetRemoteDiagnosisInfo(ctx, taskReq.Id)
			if err != nil {
				return err
			}
			for _, entry := range brief.Entries {
				if entry.AuditStatus != "published" {
					return errorcode.Desc(errorcode.TaskDataCompletedAuditStatusError)
				}
			}
		}
	// 如果任务是主干业务梳理任务，检查主干业务是否发布
	case constant.TaskTypeMainBusiness.Integer.Int32():
		brief, err := business_grooming.Service.GetRemoteProcessInfo(ctx, taskReq.Id)
		if err != nil {
			return err
		}
		for _, entry := range brief.Entries {
			if entry.PublishedStatus != "published" {
				return errorcode.Desc(errorcode.TaskDataCompletedAuditStatusError)
			}
		}
		// 如果任务是业务建模任务或者数据建模任务，检查模型是否发布
		// case constant.TaskTypeNewMainBusiness.Integer.Int32(), constant.TaskTypeDataMainBusiness.Integer.Int32():
		// 	brief, err := business_grooming.Service.GetRemoteModelInfo(ctx, task.BusinessModelID)
		// 	if err != nil {
		// 		return err
		// 	}
		// 	if brief.ModelPublishedStatus != "published" {
		// 		return errorcode.Desc(errorcode.TaskDataCompletedAuditStatusError)
		// 	}
	}
	return nil
}
