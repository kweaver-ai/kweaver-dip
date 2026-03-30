package impl

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	model_overview "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_processing_overview"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/workflow"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/user_util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	"gorm.io/gorm"

	domain_overview "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_overview"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
)

type DataProcessingOverview struct {
	overviewPlanRepo model_overview.DataProcessingOverviewRepo
	userDomain       user.IUser
	wf               wf_go.WorkflowInterface
	wfRest           workflow.WorkflowInterface
	ccDriven         configuration_center.Driven
}

func NewDataProcessingOverview(
	overviewPlanRepo model_overview.DataProcessingOverviewRepo,
	userDomain user.IUser,
	wf wf_go.WorkflowInterface,
	wfRest workflow.WorkflowInterface,
	ccDriven configuration_center.Driven,
) domain_overview.DataProcessingOverview {
	d := &DataProcessingOverview{
		overviewPlanRepo: overviewPlanRepo,
		userDomain:       userDomain,
		wf:               wf,
		wfRest:           wfRest,
		ccDriven:         ccDriven,
	}

	return d
}

func (d *DataProcessingOverview) GetOverview(ctx context.Context, req *domain_overview.GetOverviewReq) (*domain_overview.ProcessingGetOverviewRes, error) {
	go d.Sync(ctx)

	var err error
	if req.MyDepartment {
		req.SubDepartmentIDs, err = user_util.GetDepart(ctx, d.ccDriven)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errors.New("no department")
		}
	}

	res, err := d.overviewPlanRepo.GetOverview(ctx, req)
	if err != nil {
		return nil, err
	}

	bb, err := d.GetDepartmentQualityProcess(ctx, &domain_overview.GetQualityTableDepartmentReq{MD: req.MD})
	if err != nil {
		return nil, err
	}
	aa := []*domain_overview.QualityStatusByDepartment{}
	i := 0
	for _, v := range bb.Entries {
		if i >= 10 {
			break
		}
		aa = append(aa, &domain_overview.QualityStatusByDepartment{
			DepartmentName:      v.DepartmentName,
			QuestionTableCount:  v.QuestionTableCount,
			ProcessedTableCount: v.ProcessedTableCount,
			QualityRate:         v.QualityRate,
		})
		i++
	}

	res.QualityStatusByDepartment = aa
	return res, nil
}

func (d *DataProcessingOverview) GetResultsTableCatalog(ctx context.Context, req *domain_overview.GetCatalogListsReq) (*domain_overview.CatalogListsResp, error) {
	var err error
	if req.MyDepartment {
		req.SubDepartmentIDs, err = user_util.GetDepart(ctx, d.ccDriven)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errors.New("no department")
		}
	}

	catalogs, taotal, err := d.overviewPlanRepo.GetResultsTableCatalog(ctx, req)
	if err != nil {
		return nil, err
	}

	catalogIds := make([]uint64, len(catalogs))
	viewIds := make([]string, len(catalogs))
	for i, catalog := range catalogs {
		catalogIds[i] = catalog.ID
		viewIds[i] = catalog.ViewId
	}
	//赋值挂载数据资源
	dataResources, err := d.overviewPlanRepo.GetByCatalogIds(ctx, catalogIds...)
	if err != nil {
		return nil, err
	}
	resourceMap := GenResourceMap(dataResources)

	//获取报告
	reports, err := d.overviewPlanRepo.GetReportByviewIds(ctx, viewIds...)
	if err != nil {
		return nil, err
	}
	reportMap := GenReportMap(reports)

	resp := &domain_overview.CatalogListsResp{}
	resp.TotalCount = taotal
	resp.Entries = make([]*domain_overview.CatalogList, 0)
	for _, catalog := range catalogs {
		resp.Entries = append(resp.Entries, &domain_overview.CatalogList{
			Name:              catalog.Name,
			Resource:          resourceMap[catalog.ID],
			Department:        catalog.Department,
			CompletenessScore: reportMap[catalog.ViewId].CompletenessScore,
			TimelinessScore:   nil,
			AccuracyScore:     reportMap[catalog.ViewId].AccuracyScore,
			SyncMechanism:     catalog.SyncMechanism,
			UpdatedAt:         catalog.UpdatedAt.UnixMilli(),
		})
	}
	return resp, nil
}

func (d *DataProcessingOverview) GetQualityTableDepartment(ctx context.Context, req *domain_overview.GetQualityTableDepartmentReq) (*domain_overview.GetQualityTableDepartmentResp, error) {
	var err error
	if req.MyDepartment {
		req.SubDepartmentIDs, err = user_util.GetDepart(ctx, d.ccDriven)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errors.New("no department")
		}
	}

	taotal, workOrderQualityOverviews, err := d.overviewPlanRepo.CetQualityOverviewList(ctx, req)
	if err != nil {
		return nil, err
	}

	departmentIds := make([]string, len(workOrderQualityOverviews))
	for i, workOrderQualityOverview := range workOrderQualityOverviews {
		departmentIds[i] = workOrderQualityOverview.DepartmentId
	}

	//获取所属部门map
	departmentInfos, err := d.overviewPlanRepo.GetDepartmentByIds(ctx, departmentIds...)
	if err != nil {
		return nil, err
	}

	nameMap := make(map[string]string)
	pathMap := make(map[string]string)
	for _, departmentInfo := range departmentInfos {
		nameMap[departmentInfo.ID] = departmentInfo.Name
		pathMap[departmentInfo.ID] = departmentInfo.Path
	}

	resp := &domain_overview.GetQualityTableDepartmentResp{}
	resp.TotalCount = taotal
	resp.Entries = make([]*domain_overview.QualityTableDepartmentLists, 0)
	for _, workOrderQualityOverview := range workOrderQualityOverviews {
		resp.Entries = append(resp.Entries, &domain_overview.QualityTableDepartmentLists{
			DepartmentID:           workOrderQualityOverview.DepartmentId,
			DepartmentName:         nameMap[workOrderQualityOverview.DepartmentId],
			TableCount:             uint(workOrderQualityOverview.TableCount),
			QualitiedTableCount:    uint(workOrderQualityOverview.QualitiedTableCount),
			ProcessedTableCount:    uint(workOrderQualityOverview.ProcessedTableCount),
			QuestionTableCount:     uint(workOrderQualityOverview.QuestionTableCount),
			StartProcessTableCount: uint(workOrderQualityOverview.StartProcessTableCount),
			ProcessingTableCount:   uint(workOrderQualityOverview.ProcessingTableCount),
			NotProcessTableCount:   uint(workOrderQualityOverview.NotProcessTableCount),
		})
	}
	return resp, nil

}

func (d *DataProcessingOverview) GetDepartmentQualityProcess(ctx context.Context, req *domain_overview.GetQualityTableDepartmentReq) (*domain_overview.GetDepartmentQualityProcessResp, error) {
	var err error
	if req.MyDepartment {
		req.SubDepartmentIDs, err = user_util.GetDepart(ctx, d.ccDriven)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errors.New("no department")
		}
	}

	total, workOrderQualityOverviews, err := d.overviewPlanRepo.GetDepartmentQualityProcessList(ctx, req)
	if err != nil {
		return nil, err
	}

	departmentIds := make([]string, len(workOrderQualityOverviews))
	for i, workOrderQualityOverview := range workOrderQualityOverviews {
		departmentIds[i] = workOrderQualityOverview.DepartmentId
	}

	// //获取所属部门map
	// departmentInfos, err := d.overviewPlanRepo.GetDepartmentByIds(ctx, departmentIds...)
	// if err != nil {
	// 	return nil, err
	// }

	// nameMap := make(map[string]string)
	// pathMap := make(map[string]string)
	// for _, departmentInfo := range departmentInfos {
	// 	nameMap[departmentInfo.ID] = departmentInfo.Name
	// 	pathMap[departmentInfo.ID] = departmentInfo.Path
	// }

	resp := &domain_overview.GetDepartmentQualityProcessResp{}
	resp.TotalCount = total
	resp.Entries = make([]*domain_overview.QualityStatusByDepartment, 0)
	for _, workOrderQualityOverview := range workOrderQualityOverviews {
		resp.Entries = append(resp.Entries, &domain_overview.QualityStatusByDepartment{
			DepartmentID:        workOrderQualityOverview.DepartmentId,
			DepartmentName:      workOrderQualityOverview.DepartmentName,
			ProcessedTableCount: uint(workOrderQualityOverview.ProcessedTableCount),
			QuestionTableCount:  uint(workOrderQualityOverview.QuestionTableCount),
			QualityRate:         workOrderQualityOverview.QualityRate,
		})
	}
	return resp, nil

}

func (d *DataProcessingOverview) GetTargetTable(ctx context.Context, req *domain_overview.GetOverviewReq) (*domain_overview.TargetTableDetail, error) {
	var err error
	if req.MyDepartment {
		req.SubDepartmentIDs, err = user_util.GetDepart(ctx, d.ccDriven)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errors.New("no department")
		}
	}

	res, err := d.overviewPlanRepo.GetTargetTable(ctx, req)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func (d *DataProcessingOverview) GetProcessTask(ctx context.Context, req *domain_overview.GetOverviewReq) (*domain_overview.ProcessTaskDetail, error) {
	var err error
	if req.MyDepartment {
		req.SubDepartmentIDs, err = user_util.GetDepart(ctx, d.ccDriven)
		if err != nil {
			return nil, err
		}
		if len(req.SubDepartmentIDs) == 0 {
			return nil, errors.New("no department")
		}
	}

	res, err := d.overviewPlanRepo.GetProcessTask(ctx, req)
	if err != nil {
		return nil, err
	}
	return res, nil
}

func GenReportMap(reports []*model_overview.Report) map[string]domain_overview.Report {
	//赋值挂载数据资源
	reportMap := make(map[string]domain_overview.Report)
	for _, report := range reports {
		if _, exist := reportMap[*report.TableID]; !exist {
			reportMap[*report.TableID] = domain_overview.Report{
				CompletenessScore: report.TotalCompleteness,
				AccuracyScore:     report.TotalAccuracy,
			}
		}
	}
	return reportMap
}

func GenResourceMap(dataResources []*model_overview.TDataResource) map[uint64][]*domain_overview.Resource {
	//赋值挂载数据资源
	resourceMap := make(map[uint64][]*domain_overview.Resource)
	for _, dataResource := range dataResources {
		if _, exist := resourceMap[dataResource.CatalogID]; !exist {
			resourceMap[dataResource.CatalogID] = make([]*domain_overview.Resource, 0)
		}
		var exist bool
		for i, resourceRes := range resourceMap[dataResource.CatalogID] {
			if resourceRes.ResourceType == dataResource.Type { //存在则数量加1
				exist = true
				resourceMap[dataResource.CatalogID][i].ResourceCount++
			}
		}
		if !exist { //不存在则初始化
			resourceMap[dataResource.CatalogID] = append(resourceMap[dataResource.CatalogID], &domain_overview.Resource{
				ResourceType:  dataResource.Type,
				ResourceCount: 1,
			})
		}
	}
	return resourceMap
}

func (d *DataProcessingOverview) SyncOverview(ctx context.Context) (err error) {
	resp, _ := d.overviewPlanRepo.GetQualityTableDepartment(ctx, &domain_overview.GetQualityTableDepartmentReq{})
	workOrderQualityOverviews := make([]*model.WorkOrderQualityOverview, 0)
	for _, v := range resp.Entries {
		qualityRate := ""
		if v.QuestionTableCount+v.ProcessedTableCount != 0 {
			qualityRate = fmt.Sprintf("%f", 100.0*(float32(v.ProcessedTableCount)/float32((v.QuestionTableCount+v.ProcessedTableCount))))
		}
		workOrderQualityOverview := &model.WorkOrderQualityOverview{
			DepartmentId:           v.DepartmentID,
			TableCount:             uint64(v.TableCount),
			QualitiedTableCount:    uint64(v.QualitiedTableCount),
			ProcessedTableCount:    uint64(v.ProcessedTableCount),
			QuestionTableCount:     uint64(v.QuestionTableCount),
			StartProcessTableCount: uint64(v.StartProcessTableCount),
			ProcessingTableCount:   uint64(v.ProcessingTableCount),
			NotProcessTableCount:   uint64(v.NotProcessTableCount),
			QualityRate:            qualityRate,
		}
		workOrderQualityOverviews = append(workOrderQualityOverviews, workOrderQualityOverview)
	}

	err = d.overviewPlanRepo.CreateQualityOverview(ctx, workOrderQualityOverviews)
	if err != nil {
		return err
	}

	return nil
}

func (d *DataProcessingOverview) Sync(ctx context.Context) error {
	overview, err := d.overviewPlanRepo.CetQualityOverview(ctx)
	if err != nil && !errors.Is(err, gorm.ErrRecordNotFound) {
		return err
	}
	if overview != nil {
		now := time.Now()
		diff := now.Sub(overview.CreatedAt)
		if diff < 1*time.Hour {
			log.Info("time is not out")
			return errors.New("time is not out")
		}
	}

	err = d.overviewPlanRepo.CheckSyncQualityOverview(ctx)
	if err != nil {
		return err
	}

	d.SyncOverview(ctx)
	return nil
}
