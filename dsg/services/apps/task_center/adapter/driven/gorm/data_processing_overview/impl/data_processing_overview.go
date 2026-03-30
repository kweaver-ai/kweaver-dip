package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/go-kratos/kratos/v2/log"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_processing_overview"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/data_processing_overview"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type ProcessingOverviewRepo struct {
	data *db.Data
}

func NewProcessinOverviewRepo(data *db.Data) data_processing_overview.DataProcessingOverviewRepo {
	return &ProcessingOverviewRepo{data: data}
}

func (d *ProcessingOverviewRepo) GetOverview(ctx context.Context, req *domain.GetOverviewReq) (*domain.ProcessingGetOverviewRes, error) {
	var err error
	res := &domain.ProcessingGetOverviewRes{}
	// todo 工单合并成一条语句（select type, status, count(1) from af_tasks.work_order where type in (4, 6) and   deleted_at =0 group by type, status;）
	// 质量检测工单数量:
	sql := `
		select count(1) from af_tasks.work_order where type = 6 and deleted_at =0 %s;
	`
	myDepartment := `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DataQualityAuditWorkOrderCount ", &res.DataQualityAuditWorkOrderCount)
	// 数据融合工单数量
	sql = `
		select count(1) from af_tasks.work_order where type = 4 and deleted_at =0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DataFusionWorkOrderCount ", &res.DataFusionWorkOrderCount)
	// 数据处理工单数量
	res.WorkOrderCount = res.DataQualityAuditWorkOrderCount + res.DataFusionWorkOrderCount

	// 已完成质量检测工单
	sql = `
		select count(1) from af_tasks.work_order where type = 6 and status = 4 and deleted_at =0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "FinishedDataQualityAuditWorkOrderCount ", &res.FinishedDataQualityAuditWorkOrderCount)
	// 已完成数据融合工单
	sql = `
		select count(1) from af_tasks.work_order where type = 4 and status = 4 and deleted_at =0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "FinishedDataFusionWorkOrderCount ", &res.FinishedDataFusionWorkOrderCount)
	// 已完成工单数量
	res.FinishedWorkOrderCount = res.FinishedDataQualityAuditWorkOrderCount + res.FinishedDataFusionWorkOrderCount

	// 进行中质量检测工单数量
	sql = `
		select count(1) from af_tasks.work_order where type = 6 and status = 3 and deleted_at =0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "OngoingDataQualityAuditWorkOrderCount ", &res.OngoingDataQualityAuditWorkOrderCount)
	// 进行中数据融合工单数量
	sql = `
		select count(1) from af_tasks.work_order where type = 4 and status = 3 and deleted_at =0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "FinishedDataFusionWorkOrderCount ", &res.OngoingdDataFusionWorkOrderCount)
	// 进行中工单数量
	res.OngoingWorkOrderCount = res.OngoingDataQualityAuditWorkOrderCount + res.OngoingdDataFusionWorkOrderCount

	// 未派发融合工单数量
	sql = `
		select count(1) from af_tasks.work_order where type = 6 and (status = 1 or status = 2 ) and deleted_at =0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "UnassignedDataQualityAuditWorkOrderCount ", &res.UnassignedDataQualityAuditWorkOrderCount)
	// 未派发质量检测工单数量
	sql = `
		select count(1) from af_tasks.work_order where type = 4 and (status = 1 or status = 2 ) and deleted_at =0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "UnassignedDataFusionWorkOrderCount ", &res.UnassignedDataFusionWorkOrderCount)
	// 未派发工单数量
	res.UnassignedWorkOrderCount = res.UnassignedDataQualityAuditWorkOrderCount + res.UnassignedDataFusionWorkOrderCount

	// 来源表部门数量
	sql = `
		select  count(distinct(c.department_id)) from af_tasks.t_fusion_field a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		inner join af_data_catalog.t_data_catalog  c on a.catalog_id = c.id
		where a.deleted_at is NULL and a.id != "" and b.deleted_at =0 and b.type = 4 %s;
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "SourceTableDepartmentCount ", &res.SourceTableDepartmentCount)
	// 来源表数量
	sql = `
		select count(distinct(c.id)) from af_tasks.t_fusion_field a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		inner join af_data_catalog.t_data_catalog  c on a.catalog_id = c.id
		where a.deleted_at is NULL and a.id != "" and b.deleted_at =0 and b.type = 4 %s;
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "SourceTableCount ", &res.SourceTableCount)

	// 加工任务数量
	sql = `
		select count(b.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.deleted_at =0 %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "WorkOrderTaskCount ", &res.WorkOrderTaskCount)

	// 成果表部门数量
	sql = `
		select count(distinct(a.department_id)) from af_main.form_view a
		inner join af_tasks.work_order_data_fusion_details b on a.original_name = b.data_table
		inner join af_configuration.datasource c on b.datasource_id = c.hua_ao_id and a.datasource_id = c.id
		inner join af_tasks.work_order_tasks d on b.id = d.id
		inner join af_tasks.work_order e on d.work_order_id = e.work_order_id
		where a.deleted_at = 0 
		and d.status = "Completed" and e.type = 4 %s;
	`
	myDepartment = `and e.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "TargetTableDepartmentCount ", &res.TargetTableDepartmentCount)

	// 成果表数量数量
	sql = `
		select count(distinct(a.id)) from af_main.form_view a
		inner join af_tasks.work_order_data_fusion_details b on a.original_name = b.data_table
		inner join af_configuration.datasource c on b.datasource_id = c.hua_ao_id and a.datasource_id = c.id
		inner join af_tasks.work_order_tasks d on b.id = d.id
		inner join af_tasks.work_order e on d.work_order_id = e.work_order_id
		where a.deleted_at = 0 
		and d.status = "Completed" and e.type = 4 %s;
	`
	myDepartment = `and e.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "TargetTableCount ", &res.TargetTableCount)

	// 应检测部门：
	sql = `
		select count(distinct(department_id)) from af_main.form_view  
		where department_id is not null and department_id != '' and deleted_at = 0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "TableDepartmentCount ", &res.TableDepartmentCount)
	// 应检测表数量:
	sql = `
		select count(distinct(id)) from af_main.form_view  
		where deleted_at = 0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "TableCount ", &res.TableCount)

	// 已检测表：
	sql = `
		select count(distinct(id)) from af_main.form_view a
		inner join af_data_exploration.t_third_party_report c on a.id = c.f_table_id and c.f_status = 3 
		where deleted_at = 0 %s;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "QualitiedTableCount ", &res.QualitiedTableCount)

	// 已整改表：
	sql = `
		select count(distinct(a.id)) from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		inner join af_tasks.work_order c on a.id = c.source_id
		where a.deleted_at = 0
		and b.f_status = 3
		and b.f_latest =1
		AND (b.f_total_completeness is NUll or b.f_total_completeness = 1)
		AND (b.f_total_standardization is NUll or b.f_total_standardization = 1)
		AND (b.f_total_uniqueness is NUll or b.f_total_uniqueness = 1)
		AND (b.f_total_accuracy is NUll or b.f_total_accuracy = 1)
		AND (b.f_total_consistency is NUll or b.f_total_consistency = 1)
		and c.type = 5 and c.status = 4 and c.deleted_at =0 %s;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ProcessedTableCount ", &res.ProcessedTableCount)

	// 问题表数量:
	sql = `
		select count(distinct(a.id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		where b.f_status = 3
		and b.f_latest = 1
		and ((b.f_total_completeness is NOT NUll AND b.f_total_completeness != 1) 
		OR (b.f_total_standardization is NOT NUll AND b.f_total_standardization != 1) 
		OR (b.f_total_uniqueness is NOT NUll AND b.f_total_uniqueness != 1) 
		OR (b.f_total_accuracy is NOT NUll AND b.f_total_accuracy != 1) 
		OR (b.f_total_consistency is NOT NUll AND b.f_total_consistency != 1))
		AND a.deleted_at = 0 %s;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "QuestionTableCount ", &res.QuestionTableCount)

	// 已响应表：
	sql = `
		select count(distinct(a.id)) as count from af_main.form_view a
		inner join af_tasks.work_order c on a.id = c.source_id
		where a.deleted_at = 0 
		and c.type = 5 and c.status = 2 and c.deleted_at =0 %s;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "StartProcessTableCount ", &res.StartProcessTableCount)

	// 整改中的表：
	sql = `
		select  count(distinct(a.id)) as count from af_main.form_view a
		inner join af_tasks.work_order c on a.id = c.source_id
		where a.deleted_at = 0  
		and c.type = 5 and c.status = 3 and c.deleted_at =0 %s;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ProcessingTableCount ", &res.ProcessingTableCount)

	// 未整改表：
	sql = `
		select count(distinct(a.id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		inner join af_tasks.work_order c on a.id = c.source_id 
		where b.f_status = 3
		and b.f_latest = 1
		and ((b.f_total_completeness is NOT NUll AND b.f_total_completeness !=1) 
		OR (b.f_total_standardization is NOT NUll AND b.f_total_standardization != 1) 
		OR (b.f_total_uniqueness is NOT NUll AND b.f_total_uniqueness != 1) 
		OR (b.f_total_accuracy is NOT NUll AND b.f_total_accuracy != 1) 
		OR (b.f_total_consistency is NOT NUll AND b.f_total_consistency != 1))
		AND a.deleted_at = 0
		AND c.type = 5 AND (c.status =2 or c.status =3)  AND c.deleted_at =0  %s;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "NotProcessTableCount ", &res.NotProcessTableCount)
	res.NotProcessTableCount = res.QuestionTableCount - res.NotProcessTableCount
	return res, err
}

func (d *ProcessingOverviewRepo) GetResultsTableCatalog(ctx context.Context, req *domain.GetCatalogListsReq) (list []*data_processing_overview.TDataCatalog, total int64, err error) {
	db := d.data.DB.WithContext(ctx)
	viewSql := `
		select distinct(a.id) from af_main.form_view a
		inner join af_tasks.work_order_data_fusion_details b on a.original_name = b.data_table
		inner join af_configuration.datasource c on b.datasource_id = c.hua_ao_id and a.datasource_id = c.id
		inner join af_tasks.work_order_tasks d on b.id = d.id
		inner join af_tasks.work_order e on d.work_order_id = e.work_order_id
		where a.deleted_at = 0 
		and d.status = "Completed" and e.type = 4 %s
	`
	if req.MyDepartment && len(req.SubDepartmentIDs) > 0 {
		whereDepartment := "and e.department_id in ?"
		viewSql = fmt.Sprintf(viewSql, whereDepartment)
	} else {
		viewSql = fmt.Sprintf(viewSql, "")
	}

	sql := "select a.id, a.title as name ,a.department_id,a.sync_mechanism,a.updated_at, b.name as department, " +
		"d.resource_id as view_id  " +
		"from af_data_catalog.t_data_catalog a " +
		"left join af_configuration.object b on a.department_id=b.id " +
		"left join af_data_catalog.t_data_resource d on a.id=d.catalog_id " +
		"inner join (%s) as resutltViewIds on resutltViewIds.id = d.resource_id "

	countSql := "select count(distinct(a.id)) from af_data_catalog.t_data_catalog as a left join af_data_catalog.t_data_resource d on a.id=d.catalog_id " +
		"inner join (%s) as resutltViewIds on resutltViewIds.id = d.resource_id "

	where := "where d.type = 1"
	if req.SubjectId != "" {
		sql = sql + "left join af_data_catalog.t_data_catalog_category c on a.id=c.catalog_id and c.category_type = 3"
		countSql = countSql + "left join af_data_catalog.t_data_catalog_category c on a.id=c.catalog_id and c.category_type = 3"
		sql = fmt.Sprintf(sql, viewSql)
		countSql = fmt.Sprintf(countSql, viewSql)
		catalogs := fmt.Sprintf("c.category_id = '%s'", req.SubjectId)
		where = fmt.Sprintf("%s and %s", where, catalogs)
	} else {
		sql = fmt.Sprintf(sql, viewSql)
		countSql = fmt.Sprintf(countSql, viewSql)
	}

	if req.MyDepartment && len(req.SubDepartmentIDs) > 0 {
		err = db.Raw(fmt.Sprintf("%s %s", countSql, where), req.SubDepartmentIDs).Debug().Scan(&total).Error
	} else {
		err = db.Raw(fmt.Sprintf("%s %s", countSql, where)).Debug().Scan(&total).Error
	}

	if err != nil {
		return nil, 0, err
	}

	if total > 0 {
		limitWhere := fmt.Sprintf("limit %v offset %v", int(req.Limit), int(req.Limit*(req.Offset-1)))
		if req.MyDepartment && len(req.SubDepartmentIDs) > 0 {
			err = db.Raw(fmt.Sprintf("%s %s %s", sql, where, limitWhere), req.SubDepartmentIDs).Debug().Scan(&list).Error
		} else {
			err = db.Raw(fmt.Sprintf("%s %s %s", sql, where, limitWhere)).Debug().Scan(&list).Error
		}
		if err != nil {
			return nil, 0, err
		}
		return list, total, nil
	}

	return nil, 0, nil
}

func (d *ProcessingOverviewRepo) GetTargetTable(ctx context.Context, req *domain.GetOverviewReq) (*domain.TargetTableDetail, error) {
	// var err error
	res := &domain.TargetTableDetail{}
	// 任务总数:
	sql := `
		select count(b.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.deleted_at =0 %s
	`
	myDepartment := `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "WorkOrderTaskCount ", &res.WorkOrderTaskCount)

	// 数据分析任务总数
	sql = `
		select count(b.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.source_type=7  and b.deleted_at =0 %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "StandaloneTaskCount ", &res.StandaloneTaskCount)

	// 处理计划任务总数
	sql = `
		select count(b.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.source_type=1 and b.deleted_at =0 %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "PlanTaskCount ", &res.PlanTaskCount)

	// 日常任务总数
	sql = `
		select count(b.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.source_type=3 and b.deleted_at =0 %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DataAnalysisTaskCount ", &res.DataAnalysisTaskCount)

	return res, nil

}
func (d *ProcessingOverviewRepo) GetProcessTask(ctx context.Context, req *domain.GetOverviewReq) (*domain.ProcessTaskDetail, error) {
	// var err error
	res := &domain.ProcessTaskDetail{}
	// 任务总数
	sql := `
		select count(a.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.deleted_at =0 %s
	`
	myDepartment := `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "WorkOrderTaskCount ", &res.WorkOrderTaskCount)
	// 已完成任务总数
	sql = `
		select count(a.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.deleted_at =0 and a.status = "Completed" %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "CompletedCount ", &res.CompletedCount)
	// 进行中任务总数
	sql = `
		select count(a.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.deleted_at =0 and a.status = "Running" %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "RunningTaskCount ", &res.RunningTaskCount)
	// 异常总数
	sql = `
		select count(a.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.deleted_at =0 and a.status = "Failed" %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "FailedTaskCount ", &res.FailedTaskCount)

	// 数据分析任务总数
	sql = `
		select count(a.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.source_type=4  and b.deleted_at =0 %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "StandaloneTaskCount ", &res.StandaloneTaskCount)

	// 处理计划任务总数
	sql = `
		select count(a.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.source_type=1 and b.deleted_at =0 %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "PlanTaskCount ", &res.PlanTaskCount)

	// 日常任务总数
	sql = `
		select count(a.id)  from  af_tasks.work_order_tasks a 
		inner join af_tasks.work_order b on a.work_order_id = b.work_order_id
		where b.type = 4 and b.source_type=3 and b.deleted_at =0 %s
	`
	myDepartment = `and b.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "DataAnalysisTaskCount ", &res.DataAnalysisTaskCount)

	return res, nil
}

func (d *ProcessingOverviewRepo) GetByCatalogIds(ctx context.Context, catalogId ...uint64) (dataResource []*data_processing_overview.TDataResource, err error) {
	err = d.data.DB.WithContext(ctx).Table("af_data_catalog.t_data_resource").Where("catalog_id in ?", catalogId).Find(&dataResource).Error
	return
}

func (d *ProcessingOverviewRepo) GetReportByviewIds(ctx context.Context, viewId ...string) (report []*data_processing_overview.Report, err error) {
	err = d.data.DB.WithContext(ctx).Table("af_data_exploration.t_report").Where("f_table_id in ? and f_latest =1 and f_status = 3", viewId).Find(&report).Error
	return
}

func (d *ProcessingOverviewRepo) GetQualityTableDepartment(ctx context.Context, req *domain.GetQualityTableDepartmentReq) (*domain.GetQualityTableDepartmentResp, []string) {
	res := &domain.GetQualityTableDepartmentResp{
		Entries: make([]*domain.QualityTableDepartmentLists, 0),
		Errors:  make([]string, 0),
	}
	tmp := make(map[string]*domain.QualityTableDepartmentLists, 0)

	// 应检测表:
	tables := make([]*domain.DCount, 0)
	sql := `
		select department_id, count(distinct(id)) as count from af_main.form_view  
		where datasource_id in (select id from af_configuration.datasource where (source_type in (1,2))) 
		and department_id is not null and department_id != '' and deleted_at = 0 %s
		group by department_id;
	`
	myDepartment := `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "TableCount ", &tables)
	for _, t := range tables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityTableDepartmentLists{}
		}
		tmp[t.DepartmentID].TableCount = t.Count
	}

	// 已检测表:
	qualitiedTables := make([]*domain.DCount, 0)
	sql = `
		select department_id, count(distinct(id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report c on a.id = c.f_table_id and c.f_status = 3 
		where a.department_id is not null and a.department_id != '' and a.deleted_at = 0 %s
		group by a.department_id;
	`
	myDepartment = `and department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "QualitiedTableCount ", &qualitiedTables)
	for _, t := range qualitiedTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityTableDepartmentLists{}
		}
		tmp[t.DepartmentID].QualitiedTableCount = t.Count
	}

	// 已整改表:
	processedTables := make([]*domain.DCount, 0)
	sql = `
		select a.department_id, count(distinct(a.id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		inner join af_tasks.work_order c on a.id = c.source_id
		where a.deleted_at = 0 and a.department_id is not null and a.department_id != ''
		and b.f_status = 3
		and b.f_latest =1
		AND (b.f_total_completeness is NUll or b.f_total_completeness = 1)
		AND (b.f_total_standardization is NUll or b.f_total_standardization = 1)
		AND (b.f_total_uniqueness is NUll or b.f_total_uniqueness = 1)
		AND (b.f_total_accuracy is NUll or b.f_total_accuracy = 1)
		AND (b.f_total_consistency is NUll or b.f_total_consistency = 1)
		and c.type = 5 and c.status = 4 and c.deleted_at =0 %s
		group by a.department_id;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ProcessedTableCount ", &processedTables)
	for _, t := range processedTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityTableDepartmentLists{}
		}
		tmp[t.DepartmentID].ProcessedTableCount = t.Count
	}

	// 问题表数量:
	questionTables := make([]*domain.DCount, 0)
	sql = `
		select a.department_id, count(distinct(a.id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		where b.f_status = 3
		and b.f_latest = 1
		and ((b.f_total_completeness is NOT NUll AND b.f_total_completeness != 1)
		OR (b.f_total_standardization is NOT NUll AND b.f_total_standardization != 1)
		OR (b.f_total_uniqueness is NOT NUll AND b.f_total_uniqueness != 1)
		OR (b.f_total_accuracy is NOT NUll AND b.f_total_accuracy != 1)
		OR (b.f_total_consistency is NOT NUll AND b.f_total_consistency != 1))
		AND a.deleted_at = 0 and a.department_id is not null and a.department_id != '' %s
		group by a.department_id;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "QuestionTableCount ", &questionTables)
	for _, t := range questionTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityTableDepartmentLists{}
		}
		tmp[t.DepartmentID].QuestionTableCount = t.Count
	}

	// 已响应表：
	startProcessTables := make([]*domain.DCount, 0)
	sql = `
		select a.department_id, count(distinct(a.id)) as count from af_main.form_view a
		inner join af_tasks.work_order c on a.id = c.source_id
		where a.deleted_at = 0 and a.department_id is not null and a.department_id != ''
		and c.type = 5 and c.status = 2 and c.deleted_at =0 %s
		group by a.department_id;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "StartProcessTableCount ", &startProcessTables)
	for _, t := range startProcessTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityTableDepartmentLists{}
		}
		tmp[t.DepartmentID].StartProcessTableCount = t.Count
	}

	// 整改中的表：
	processingTables := make([]*domain.DCount, 0)
	sql = `
		select a.department_id, count(distinct(a.id)) as count from af_main.form_view a
		inner join af_tasks.work_order c on a.id = c.source_id
		where a.deleted_at = 0 and a.department_id is not null and a.department_id != ''
		and c.type = 5 and c.status = 3 and c.deleted_at =0 %s
		group by a.department_id;
		`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "ProcessingTableCount ", &processingTables)
	for _, t := range processingTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityTableDepartmentLists{}
		}
		tmp[t.DepartmentID].ProcessingTableCount = t.Count
	}

	// 未整改表：
	notProcessTables := make([]*domain.DCount, 0)
	sql = `
		select  a.department_id, count(distinct(a.id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		inner join af_tasks.work_order c on a.id = c.source_id
		where b.f_status = 3
		and b.f_latest = 1 
		and ((b.f_total_completeness is NOT NUll AND b.f_total_completeness != 1)
		OR (b.f_total_standardization is NOT NUll AND b.f_total_standardization != 1)
		OR (b.f_total_uniqueness is NOT NUll AND b.f_total_uniqueness != 1)
		OR (b.f_total_accuracy is NOT NUll AND b.f_total_accuracy != 1)
		OR (b.f_total_consistency is NOT NUll AND b.f_total_consistency != 1))
		AND a.deleted_at = 0 and a.department_id is not null and a.department_id != ''
		AND c.type = 5 AND (c.status =2 or c.status =3)  AND c.deleted_at =0  %s
		group by a.department_id;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "NotProcessTableCount ", &notProcessTables)
	for _, t := range notProcessTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityTableDepartmentLists{}
		}
		tmp[t.DepartmentID].NotProcessTableCount = tmp[t.DepartmentID].QuestionTableCount - t.Count
	}

	for depID, _ := range tmp {
		res.Entries = append(res.Entries, &domain.QualityTableDepartmentLists{
			DepartmentID:           depID,
			TableCount:             tmp[depID].TableCount,
			QualitiedTableCount:    tmp[depID].QualitiedTableCount,
			ProcessedTableCount:    tmp[depID].ProcessedTableCount,
			QuestionTableCount:     tmp[depID].QuestionTableCount,
			StartProcessTableCount: tmp[depID].StartProcessTableCount,
			ProcessingTableCount:   tmp[depID].ProcessingTableCount,
			NotProcessTableCount:   tmp[depID].NotProcessTableCount,
		})
	}

	return res, mapKeys(tmp)
}

func (d *ProcessingOverviewRepo) GetDepartmentQualityProcess(ctx context.Context, req *domain.GetDepartmentQualityProcessReq) (*domain.GetDepartmentQualityProcessResp, []string) {
	res := &domain.GetDepartmentQualityProcessResp{
		Entries: make([]*domain.QualityStatusByDepartment, 0),
		Errors:  make([]string, 0),
	}
	tmp := make(map[string]*domain.QualityStatusByDepartment, 0)

	// 已整改表:
	processedTables := make([]*domain.DCount, 0)
	sql := `
		select a.department_id, count(distinct(a.id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		inner join af_tasks.work_order c on a.id = c.source_id
		where a.deleted_at = 0 and a.department_id is not null and a.department_id != ''
		and b.f_status = 3
		and b.f_latest =1
		AND (b.f_total_completeness is NUll or b.f_total_completeness = 1)
		AND (b.f_total_standardization is NUll or b.f_total_standardization = 1)
		AND (b.f_total_uniqueness is NUll or b.f_total_uniqueness = 1)
		AND (b.f_total_accuracy is NUll or b.f_total_accuracy = 1)
		AND (b.f_total_consistency is NUll or b.f_total_consistency = 1)
		and c.type = 5 and c.status = 4 and c.deleted_at =0 %s
		group by a.department_id;
	`
	myDepartment := `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "processedTables ", &processedTables)
	for _, t := range processedTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityStatusByDepartment{}
		}
		tmp[t.DepartmentID].ProcessedTableCount = t.Count
	}

	// 待整改表(问题表):
	questionTables := make([]*domain.DCount, 0)
	sql = `
		select a.department_id, count(distinct(a.id)) as count from af_main.form_view a
		inner join af_data_exploration.t_third_party_report b on a.id = b.f_table_id
		where b.f_status = 3
		and b.f_latest = 1
		and ((b.f_total_completeness is NOT NUll AND b.f_total_completeness != 1)
		OR (b.f_total_standardization is NOT NUll AND b.f_total_standardization != 1)
		OR (b.f_total_uniqueness is NOT NUll AND b.f_total_uniqueness != 1)
		OR (b.f_total_accuracy is NOT NUll AND b.f_total_accuracy != 1)
		OR (b.f_total_consistency is NOT NUll AND b.f_total_consistency != 1))
		AND a.deleted_at = 0 and a.department_id is not null and a.department_id != '' %s
		group by a.department_id;
	`
	myDepartment = `and a.department_id in ?`
	d.RawScan(ctx, &res.Errors, req.MD, sql, myDepartment, "table ", &questionTables)
	for _, t := range questionTables {
		if _, exist := tmp[t.DepartmentID]; !exist {
			tmp[t.DepartmentID] = &domain.QualityStatusByDepartment{}
		}
		tmp[t.DepartmentID].QuestionTableCount = t.Count
	}

	for depID, _ := range tmp {
		res.Entries = append(res.Entries, &domain.QualityStatusByDepartment{
			DepartmentID:        depID,
			QuestionTableCount:  tmp[depID].QuestionTableCount,
			ProcessedTableCount: tmp[depID].ProcessedTableCount,
			QualityRate:         fmt.Sprintf("%f", 100.0*(float32(tmp[depID].ProcessedTableCount)/float32((tmp[depID].QuestionTableCount+tmp[depID].ProcessedTableCount)))),
		})
	}
	return res, mapKeys(tmp)
}

func mapKeys[K comparable, V any](m map[K]V) []K {
	keys := make([]K, 0, len(m))
	for k := range m {
		keys = append(keys, k)
	}
	return keys
}

func (d *ProcessingOverviewRepo) RawScan(ctx context.Context, errs *[]string, md domain.MD, sql string, myDepartmentWhere string, msg string, dest interface{}) {
	if md.MyDepartment {
		sql = fmt.Sprintf(sql, myDepartmentWhere)
	} else {
		sql = fmt.Sprintf(sql, "")
	}
	var err error
	if md.MyDepartment {
		if err = d.data.DB.WithContext(ctx).Raw(sql, md.SubDepartmentIDs).Scan(dest).Error; err != nil {
			*errs = append(*errs, msg+err.Error())
		}
	} else {
		if err = d.data.DB.WithContext(ctx).Raw(sql).Scan(dest).Error; err != nil {
			*errs = append(*errs, msg+err.Error())
		}
	}
}

func (d *ProcessingOverviewRepo) GetDepartmentByIds(ctx context.Context, departmentIds ...string) (departments []*data_processing_overview.Object, err error) {
	err = d.data.DB.WithContext(ctx).Table("af_configuration.object").Where("id in ?", departmentIds).Find(&departments).Error
	return
}

func (d *ProcessingOverviewRepo) GetAllDepartmentIds(ctx context.Context) (departmentIds []string, err error) {
	err = d.data.DB.WithContext(ctx).Select("id").Table("af_configuration.object").Find(&departmentIds).Error
	return
}

func (d *ProcessingOverviewRepo) CreateQualityOverview(ctx context.Context, workOrderQualityOverviews []*model.WorkOrderQualityOverview) (err error) {
	err = d.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		// 删除数据
		if err := tx.Where("true").Delete(&model.WorkOrderQualityOverview{}).Error; err != nil {
			return err
		}
		// 创建数据
		if err = tx.CreateInBatches(&workOrderQualityOverviews, 1000).Error; err != nil {
			return err
		}
		return nil
	})
	return err
}

func (d *ProcessingOverviewRepo) CetQualityOverview(ctx context.Context) (overview *model.WorkOrderQualityOverview, err error) {
	result := d.data.DB.WithContext(ctx).Take(&overview, "department_id!=?", "00000000-0000-0000-0000-000000000000")
	if result.Error != nil {
		return nil, err
	}
	return
}

func (d *ProcessingOverviewRepo) CheckSyncQualityOverview(ctx context.Context) (err error) {
	err = d.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		workOrderQualityOverview := &model.WorkOrderQualityOverview{}
		result := tx.Take(&workOrderQualityOverview, "department_id=?", "00000000-0000-0000-0000-000000000000")
		if result.Error != nil {
			if !errors.Is(result.Error, gorm.ErrRecordNotFound) {
				return result.Error
			}
			if errors.Is(result.Error, gorm.ErrRecordNotFound) {
				workOrderQualityOverview = &model.WorkOrderQualityOverview{
					DepartmentId: "00000000-0000-0000-0000-000000000000",
				}
				if err = tx.Create(workOrderQualityOverview).Error; err != nil {
					return err
				}
				return nil
			}

		}
		log.Info("Creating")
		return errors.New("Creating")
	})
	return err
}

func (d *ProcessingOverviewRepo) CetQualityOverviewList(ctx context.Context, params *domain.GetQualityTableDepartmentReq) (int64, []*model.WorkOrderQualityOverviewAndDepartmentName, error) {

	limit := params.Limit
	offset := limit * (params.Offset - 1)

	Db := d.data.DB.Debug().WithContext(ctx).Table("af_tasks.work_order_quality_overview a").Select("a.*, b.name as department_name").
		Joins("join af_configuration.object b on a.department_id = b.id")
	if params.Keyword != "" {
		Db = Db.Where("b.name like ?", "%"+util.KeywordEscape(util.XssEscape(params.Keyword))+"%")
	}
	if params.MyDepartment {
		if len(params.SubDepartmentIDs) > 0 {
			Db = Db.Where("a.department_id in ?", params.SubDepartmentIDs)
		}
	}
	var total int64
	err := Db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	models := make([]*model.WorkOrderQualityOverviewAndDepartmentName, 0)
	// 使用同一个Db实例，继续添加分页和排序条件
	err = Db.Limit(int(limit)).Offset(int(offset)).Order(fmt.Sprintf("%s %s", params.Sort, params.Direction)).Find(&models).Error
	// err = Db.Limit(int(limit)).Offset(int(offset)).Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil

}

func (d *ProcessingOverviewRepo) GetDepartmentQualityProcessList(ctx context.Context, params *domain.GetQualityTableDepartmentReq) (int64, []*model.WorkOrderQualityOverviewAndDepartmentName, error) {

	limit := params.Limit
	offset := limit * (params.Offset - 1)

	Db := d.data.DB.Debug().WithContext(ctx).Table("af_tasks.work_order_quality_overview a").Select("a.*, b.name as department_name").
		Joins("join af_configuration.object b on a.department_id = b.id")
	Db = Db.Where(" a.processed_table_count != 0 or a.question_table_count !=0")
	if params.Keyword != "" {
		Db = Db.Where("b.name like ?", "%"+util.KeywordEscape(util.XssEscape(params.Keyword))+"%")
	}
	if params.MyDepartment {
		if len(params.SubDepartmentIDs) > 0 {
			Db = Db.Where("a.department_id in ?", params.SubDepartmentIDs)
		}
	}
	var total int64
	err := Db.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}

	models := make([]*model.WorkOrderQualityOverviewAndDepartmentName, 0)
	// 使用同一个Db实例，继续添加分页和排序条件
	// err = Db.Limit(int(limit)).Offset(int(offset)).Order(fmt.Sprintf("%s %s", params.Sort, params.Direction)).Find(&models).Error
	err = Db.Limit(int(limit)).Offset(int(offset)).Find(&models).Error
	if err != nil {
		return 0, nil, err
	}
	return total, models, nil

}
