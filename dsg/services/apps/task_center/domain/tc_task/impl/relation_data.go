package impl

import (
	"context"
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/tc_task"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (t *TaskUserCase) fixRelationData(ctx context.Context, detail *domain.TaskDetailModel) (err error) {
	switch {
	case detail.TaskType == constant.TaskTypeIndicatorProcessing.String:
		return t.indicatorTaskRelationData(ctx, detail)
	case detail.TaskType == constant.TaskTypeDataCollecting.String:
		return t.dataCollectingTask(ctx, detail)
	case detail.TaskType == constant.TaskTypeBusinessDiagnosis.String:
		return t.dataMainBusinessTask(ctx, detail)
	case detail.TaskType == constant.TaskTypeNewMainBusiness.String:
		return t.newModelTask(ctx, detail)
	case detail.TaskType == constant.TaskTypeDataMainBusiness.String:
		return t.newModelTask(ctx, detail)
	case detail.TaskType == constant.TaskTypeFieldStandard.String:
		return t.fieldStandTask(ctx, detail)
	case detail.TaskType == constant.TaskTypeDataComprehensionWorkOrder.String:
		return t.cmprehensionWorkOrderask(ctx, detail)
	case detail.TaskType == constant.TaskTypeStandardization.String:
		return t.dataStandardFilesTask(ctx, detail)
	}

	return nil
}

// indicatorTaskRelationData  处理指标数据
func (t *TaskUserCase) indicatorTaskRelationData(ctx context.Context, detail *domain.TaskDetailModel) error {
	//项目内的指标任务不带数据
	if detail.ProjectId != "" {
		return nil
	}
	// 获取关联数据信息
	relationData, err := t.relationDataRepo.GetByTaskId(ctx, detail.Id)
	if err != nil {
		log.WithContext(ctx).Errorf("query task %v relation data error %v", detail.Id, err.Error())
		return nil
	}
	if len(relationData) <= 0 {
		return nil
	}
	dataSlice := make([]*business_grooming.RelationDataInfo, 0)
	for _, data := range relationData {
		brief, err := business_grooming.Service.GetBusinessIndicator(ctx, data)
		if err != nil {
			detail.ConfigStatus = constant.TaskConfigStatusBusinessIndicatorDeleted.String
			log.WithContext(ctx).Errorf("task %v query indicator %v error %v", detail.Id, data, err.Error())
		} else {
			preData := business_grooming.RelationDataInfo{
				Id:   data,
				Name: brief.Name,
			}
			dataSlice = append(dataSlice, &preData)
		}
	}
	detail.Data = dataSlice
	return nil
}

func (t *TaskUserCase) dataCollectingTask(ctx context.Context, detail *domain.TaskDetailModel) error {
	relationData, err := t.relationDataRepo.GetByTaskId(ctx, detail.Id)
	if err != nil {
		log.WithContext(ctx).Errorf("task %v query relation data error %v", detail.Id, err.Error())
		return nil
	}
	if len(relationData) <= 0 {
		return nil
	}

	brief, err := business_grooming.Service.QueryFormInfoWithModel(ctx, detail.BusinessModelID, relationData...)
	if err != nil {
		log.WithContext(ctx).Errorf("task %v query form info error %v", detail.Id, err.Error())
		return nil
	}
	detail.Data = brief.Data
	return nil
}

func (t *TaskUserCase) newModelTask(ctx context.Context, detail *domain.TaskDetailModel) error {
	if detail.DomainId == "" {
		return nil
	}
	_, err := business_grooming.GetRemoteDomainInfo(ctx, detail.DomainId)
	if err != nil {
		detail.ConfigStatus = constant.TaskConfigStatusBusinessDomainDeleted.String
		log.WithContext(ctx).Errorf("task %v query domain info error %v", detail.Id, err.Error())
	}
	return nil
}

// fieldStandTask 新建指标任务，补充下父任务关联的业务模型
func (t *TaskUserCase) fieldStandTask(ctx context.Context, detail *domain.TaskDetailModel) error {
	if detail.ParentTaskId == "" {
		return nil
	}
	relationData, err := t.relationDataRepo.GetDetailByTaskId(ctx, detail.ParentTaskId)
	if err != nil {
		log.WithContext(ctx).Errorf("task %v query relation data error %v", detail.ParentTaskId, err.Error())
		return nil
	}
	if relationData.BusinessModelId == "" {
		return nil
	}
	domainInfo, err := business_grooming.GetRemoteDomainInfo(ctx, relationData.BusinessModelId)
	if err != nil {
		log.WithContext(ctx).Errorf("task %v query domain info error %v", detail.Id, err.Error())
		return nil
	}
	detail.BusinessModelID = domainInfo.ModelID
	detail.BusinessModelName = domainInfo.ModelName
	return nil
}

func (t *TaskUserCase) cmprehensionWorkOrderask(ctx context.Context, detail *domain.TaskDetailModel) error {
	relationData, err := t.relationDataRepo.GetByTaskId(ctx, detail.Id)
	if err != nil {
		log.WithContext(ctx).Errorf("task %v query relation data error %v", detail.Id, err.Error())
		return nil
	}
	if len(relationData) <= 0 {
		return nil
	}
	catalogInfos, err := t.dataCatalog.GetCatalogInfos(ctx, relationData...)
	if err != nil {
		return err
	}
	dataSlice := make([]*business_grooming.RelationDataInfo, 0)
	for _, catalogInfo := range catalogInfos {

		preData := business_grooming.RelationDataInfo{
			Id:   strconv.FormatUint(catalogInfo.ID, 10),
			Name: catalogInfo.Title,
		}
		dataSlice = append(dataSlice, &preData)
	}

	detail.Data = dataSlice
	return nil
}

func (t *TaskUserCase) dataMainBusinessTask(ctx context.Context, detail *domain.TaskDetailModel) error {
	relationData, err := t.relationDataRepo.GetByTaskId(ctx, detail.Id)
	if err != nil {
		log.WithContext(ctx).Errorf("task %v query relation data error %v", detail.Id, err.Error())
		return nil
	}
	if len(relationData) <= 0 {
		return nil
	}

	domainInfos, err := business_grooming.Service.GetRemoteDomainInfos(ctx, relationData...)
	if err != nil {
		return err
	}
	dataSlice := make([]*business_grooming.RelationDataInfo, 0)
	for _, domainInfo := range domainInfos {
		preData := business_grooming.RelationDataInfo{
			Id:   domainInfo.DomainID,
			Name: domainInfo.Name,
		}
		dataSlice = append(dataSlice, &preData)
	}

	detail.Data = dataSlice
	return nil
}
func (t *TaskUserCase) dataStandardFilesTask(ctx context.Context, detail *domain.TaskDetailModel) error {
	relationData, err := t.relationDataRepo.GetByTaskId(ctx, detail.Id)
	if err != nil {
		log.WithContext(ctx).Errorf("task %v query relation data error %v", detail.Id, err.Error())
		return nil
	}
	if len(relationData) <= 0 {
		return nil
	}

	fileInfos, err := t.standardizationDrivern.GetStandardFiles(ctx, relationData...)
	if err != nil {
		return err
	}
	dataSlice := make([]*business_grooming.RelationDataInfo, 0)
	for _, fileInfo := range fileInfos {
		preData := business_grooming.RelationDataInfo{
			Id:   fileInfo.ID,
			Name: fileInfo.Name,
		}
		dataSlice = append(dataSlice, &preData)
	}

	detail.Data = dataSlice
	return nil
}
