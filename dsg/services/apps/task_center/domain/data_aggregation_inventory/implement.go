package data_aggregation_inventory

import (
	"context"
	"fmt"
	"time"

	"github.com/google/uuid"
	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	data_aggregation_inventory "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/data_aggregation_inventory"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_business"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/database/af_main"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/user"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/work_order"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	meta_v1 "github.com/kweaver-ai/idrm-go-common/api/meta/v1"
	task_center_v1 "github.com/kweaver-ai/idrm-go-common/api/task_center/v1"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	doc_audit_rest_v1 "github.com/kweaver-ai/idrm-go-common/rest/doc_audit_rest/v1"
	"github.com/kweaver-ai/idrm-go-common/util/ptr"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type domain struct {
	// 数据表 af_business.business_form_standard
	BusinessFormStandard af_business.BusinessFormStandardInterface
	// 数据表 af_business.user
	BusinessUser af_business.UserInterface
	// 数据表 af_business.business_model
	BusinessModel af_business.BusinessModelInterface
	// 数据表 af_business.domain
	BusinessDomain af_business.DomainInterface
	// 数据表 af_configuration.datasource
	Datasource af_configuration.DatasourceInterface
	// 数据表 af_configuration.objects
	Department af_configuration.ObjectInterface
	// 数据表 af_configuration.info_system
	InfoSystem af_configuration.InfoSystemInterface
	// 数据表 af_main.form_view
	FormView af_main.FormViewInterface

	// 数据库 data_aggregation_inventory
	dataAggregationInventory data_aggregation_inventory.Repository
	// 数据库 work order
	workOrder work_order.Repo
	// 数据库 user
	user user.IUserRepo

	// 微服务 business-grooming
	businessGrooming business_grooming.Call
	// 微服务 configuration-center 的 AccessControlService
	accessControlService configuration_center.AccessControlService
	// 微服务 configuration-center 的 DepartmentService
	departmentService configuration_center.DepartmentService
	// 微服务 doc-audit-rest 的 biz
	biz doc_audit_rest_v1.BizInterface
	// workflow
	workflow workflow.WorkflowInterface
	//数据源服务
	dataSourceDriven configuration_center.DataSourceService
}

// Ensure domain implements the Domain interface.
var _ Domain = (*domain)(nil)

func New(
	// 数据库
	database database.DatabaseInterface,
	// 数据库 data_aggregation_inventory
	dataAggregationInventory data_aggregation_inventory.Repository,
	// 数据库 user
	user user.IUserRepo,
	// 微服务 doc-audit-rest
	docAuditREST doc_audit_rest_v1.DocAuditRestV1Interface,
	// 数据库 work order
	workOrder work_order.Repo,
	// 微服务 business-grooming
	businessGrooming business_grooming.Call,
	// 微服务 configuration-center
	configurationCenter configuration_center.Driven,
	// workflow
	workflow workflow.WorkflowInterface,
) Domain {
	d := &domain{
		// 数据表 af_business.business_form_standard
		BusinessFormStandard: database.AFBusiness().BusinessFormStandard(),
		// 数据表 af_business.user
		BusinessUser: database.AFBusiness().User(),
		// 数据表 af_business.business_model
		BusinessModel: database.AFBusiness().BusinessModel(),
		// 数据表 af_business.domain
		BusinessDomain: database.AFBusiness().Domain(),
		// 数据表 af_configuration.datasource
		Datasource: database.AFConfiguration().Datasources(),
		// 数据表 af_configuration.objects
		Department: database.AFConfiguration().Objects(),
		// 数据表 af_configuration.info_system
		InfoSystem: database.AFConfiguration().InfoSystems(),
		// 数据表 af_main.form_view
		FormView: database.AFMain().FormViews(),
		// 数据库 data_aggregation_inventory
		dataAggregationInventory: dataAggregationInventory,
		// 微服务 doc-audit-rest 的 biz
		biz: docAuditREST.DocAudit().Biz(),
		// 数据库 work order
		workOrder: workOrder,
		// 数据库 user
		user: user,
		// 微服务 business-grooming
		businessGrooming: businessGrooming,
		// 微服务 configuration-center 的 AccessControlService
		accessControlService: configurationCenter,
		// 微服务 configuration-center 的 DepartmentService
		departmentService: configurationCenter,
		// workflow
		workflow: workflow,
		//数据源信息
		dataSourceDriven: configurationCenter,
	}
	d.registerConsumeHandlers(workflow)
	return d
}

// Create implements Domain.
func (d *domain) Create(ctx context.Context, inventory *task_center_v1.DataAggregationInventory) (*task_center_v1.DataAggregationInventory, error) {
	// 生成元数据
	inventory.ID = uuid.Must(uuid.NewV7()).String()
	inventory.Code = fmt.Sprintf("归集清单%s%03d", time.Now().Format("20060102150405"), time.Now().Nanosecond()/1e6)
	inventory.CreatedAt = meta_v1.Now()
	if inventory.Status == "" {
		inventory.Status = task_center_v1.DataAggregationInventoryAuditing
	}
	if inventory.Status == task_center_v1.DataAggregationInventoryAuditing {
		if inventory.ApplyID == "" {
			inventory.ApplyID = uuid.Must(uuid.NewV7()).String()
		}
		inventory.RequestedAt = ptr.To(meta_v1.Now())
	}
	// 存入数据库
	if err := d.dataAggregationInventory.Create(ctx, inventory); err != nil {
		// TODO: 区分错误
		return nil, err
	}

	if inventory.Status != task_center_v1.DataAggregationInventoryAuditing {
		return inventory, nil
	}

	// 发起审核
	if err := d.produceAuditApplyMsg(ctx, inventory); err != nil {
		log.Warn("produce audit apply message for data aggregation inventory fail", zap.Error(err), zap.Any("inventory", inventory))
		if inventory, err = d.dataAggregationInventory.Update(ctx, inventory.ID, func(inventory *task_center_v1.DataAggregationInventory) error {
			inventory.Status = task_center_v1.DataAggregationInventoryCompleted
			return nil
		}); err != nil {
			return nil, err
		}
	}

	return inventory, nil
}

// Delete implements Domain.
func (d *domain) Delete(ctx context.Context, id string) error {
	err := d.dataAggregationInventory.Delete(ctx, id)
	if err != nil {
		// TODO: 区分错误
		return err
	}
	return nil
}

// Update implements Domain.
func (d *domain) Update(ctx context.Context, inventory *task_center_v1.DataAggregationInventory) (*task_center_v1.DataAggregationInventory, error) {
	// 生成元数据
	if inventory.Status == task_center_v1.DataAggregationInventoryAuditing {
		if inventory.ApplyID == "" {
			inventory.ApplyID = uuid.Must(uuid.NewV7()).String()
		}
		inventory.RequestedAt = ptr.To(meta_v1.Now())
	}
	// 更新部份字段
	inventory, err := d.dataAggregationInventory.Update(ctx, inventory.ID, func(actual *task_center_v1.DataAggregationInventory) error {
		// TODO: actual 判断限制更新范围，例如：不可以更新审核中的资源
		actual.Name = inventory.Name
		actual.CreationMethod = inventory.CreationMethod
		actual.DepartmentID = inventory.DepartmentID
		actual.Resources = inventory.Resources
		actual.ApplyID = inventory.ApplyID
		actual.WorkOrderID = inventory.WorkOrderID
		actual.WorkOrderIDs = inventory.WorkOrderIDs
		actual.Status = inventory.Status
		actual.RequesterID = inventory.RequesterID
		actual.RequestedAt = inventory.RequestedAt
		return nil
	})

	if err != nil {
		// TODO: 区分错误
		return nil, err
	}

	if inventory.Status != task_center_v1.DataAggregationInventoryAuditing {
		return inventory, nil
	}

	// 发起审核
	if err := d.produceAuditApplyMsg(ctx, inventory); err != nil {
		log.Warn("produce audit apply message for data aggregation inventory fail", zap.Error(err), zap.Any("inventory", inventory))
		if inventory, err = d.dataAggregationInventory.Update(ctx, inventory.ID, func(inventory *task_center_v1.DataAggregationInventory) error {
			inventory.Status = task_center_v1.DataAggregationInventoryCompleted
			return nil
		}); err != nil {
			return nil, err
		}
	}

	return inventory, nil
}

// Get implements Domain.
func (d *domain) Get(ctx context.Context, id string) (*task_center_v1.AggregatedDataAggregationInventory, error) {
	inventory, err := d.dataAggregationInventory.Get(ctx, id)
	if err != nil {
		// TODO: 区分错误
		return nil, err
	}
	return d.aggregateDataAggregationInventory(ctx, inventory), nil
}

// List implements Domain.
func (d *domain) List(ctx context.Context, opts *task_center_v1.DataAggregationInventoryListOptions) (*task_center_v1.AggregatedDataAggregationInventoryList, error) {
	list, err := d.dataAggregationInventory.List(ctx, opts)
	if err != nil {
		// TODO: 区分错误
		return nil, err
	}
	return d.aggregateDataAggregationInventoryList(ctx, list), nil
}

// BatchGetDataTable implements Domain.
func (d *domain) BatchGetDataTable(ctx context.Context, ids []string) ([]*task_center_v1.BusinessFormDataTableItem, error) {
	results := make([]*task_center_v1.BusinessFormDataTableItem, 0)
	resourceSlice, err := d.dataAggregationInventory.QueryDataTable(ctx, ids)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(resourceSlice) <= 0 {
		return results, nil
	}
	//查询配置中心，获取数据源信息
	dsSlice := lo.Times[string](len(resourceSlice), func(index int) string {
		return resourceSlice[index].TargetDatasourceID
	})
	dsSlice = lo.Uniq(dsSlice)
	if len(dsSlice) <= 0 {
		return results, nil
	}
	datasourceSlice, err := d.dataSourceDriven.GetDataSourcePrecision(ctx, dsSlice)
	if err != nil {
		return nil, err
	}
	if len(datasourceSlice) <= 0 {
		return results, nil
	}
	datasourceDict := lo.SliceToMap(datasourceSlice, func(item *configuration_center.DataSourcesPrecision) (string, *configuration_center.DataSourcesPrecision) {
		return item.ID, item
	})
	//组装结果
	workOrderID := resourceSlice[0].WorkOrderID
	results = make([]*task_center_v1.BusinessFormDataTableItem, 0)
	for _, sourceInfo := range resourceSlice {
		datasourceInfo, ok := datasourceDict[sourceInfo.TargetDatasourceID]
		if !ok {
			continue
		}
		//只查询最近一次更新的，同一个工地那ID的物化表
		if sourceInfo.WorkOrderID != workOrderID {
			continue
		}
		results = append(results, &task_center_v1.BusinessFormDataTableItem{
			DataTableName:      sourceInfo.DataTableName,
			TargetDataSourceID: sourceInfo.TargetDatasourceID,
			TargetCatalogName:  datasourceInfo.CatalogName,
			TargetSchema:       datasourceInfo.Schema,
			BusinessFormID:     sourceInfo.BusinessFormID,
		})
	}
	return results, nil
}

// 检查归集清单名称是否存在
func (d *domain) CheckName(ctx context.Context, name, id string) (bool, error) {
	return d.dataAggregationInventory.CheckName(ctx, name, id)
}
