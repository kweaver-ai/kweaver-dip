package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/settings"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/statistics"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/statistics"
	service "github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type UseCase struct {
	data           *db.Data
	repo           repo.Repo
	dataViewDriven data_view.Driven
	catalog        catalog.DataResourceCatalogRepo
	service        service.Driven
}

func NewUseCase(data *db.Data, repo2 repo.Repo, dataViewDriven data_view.Driven, repo catalog.DataResourceCatalogRepo, service service.Driven) domain.UseCase {
	return &UseCase{
		data,
		repo2,
		dataViewDriven,
		repo,
		service,
	}
}

func NewUseCaseImpl(data *db.Data, repo2 repo.Repo, dataViewDriven data_view.Driven) *UseCase {
	return &UseCase{
		data:           data,
		repo:           repo2,
		dataViewDriven: dataViewDriven,
	}
}

// D:\go_workplace\data-catalog\domain\statistics\impl\statistics_count.go

func (uc *UseCase) GetOverviewStatistics(ctx context.Context) (*domain.OverviewResp, error) {
	log.Info("--------------enter GetOverviewStatistics---------------------------")
	stats, err := uc.repo.GetOverviewStatistics(ctx)
	if err != nil {
		return nil, err
	}
	// 转换为对外暴露的 Resp 结构体
	return &domain.OverviewResp{
		ID:                stats.ID,
		TotalDataCount:    stats.TotalDataCount,
		TotalTableCount:   stats.TotalTableCount,
		ServiceUsageCount: stats.ServiceUsageCount,
		SharedDataCount:   stats.SharedDataCount,
		UpdateTime:        stats.UpdateTime,
	}, nil
}

func (uc *UseCase) GetServiceStatistics(ctx context.Context, id string) ([]*domain.ServiceResp, error) {
	log.Info("--------------enter GetServiceStatistics---------------------------")
	list, err := uc.repo.GetServiceStatistics(ctx, id)
	if err != nil {
		return nil, err
	}
	var resps []*domain.ServiceResp
	for _, item := range list {
		resps = append(resps, &domain.ServiceResp{
			ID:           item.ID,
			Type:         item.Type,
			Quantity:     item.Quantity,
			BusinessTime: item.BusinessTime,
			CreateTime:   item.CreateTime,
			Week:         item.Week,
			Catalog:      item.Catalog,
		})
	}
	return resps, nil
}

func (uc *UseCase) SaveStatistics(ctx context.Context) error {
	return uc.repo.SaveStatistics(ctx)
}

func (uc *UseCase) SyncTableCount(ctx context.Context) error {
	//departmentId := "9060f92a-3c6c-11f0-9815-12b58a7f919c"
	departmentId := settings.GetConfig().DepartmentID
	log.WithContext(ctx).Infof("SyncTableCount departmentId: %s", departmentId)
	count, err := uc.dataViewDriven.GetTableCount(ctx, departmentId)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.dataViewDriven.GetTableCount failed: %v", err)
	}
	log.WithContext(ctx).Infof("uc.dataViewDriven.GetTableCount: %d", count)
	err = uc.repo.UpdateStatistics(ctx, &domain.OverviewResp{
		TotalTableCount: count,
		UpdateTime:      time.Now().Format("2006-01-02 15:04:05"),
		ID:              "1",
	})
	return err
}

func (uc *UseCase) GetDataInterface(ctx context.Context) ([]*domain.TDataInterfaceApply, error) {
	log.Debug("--------------enter GetDataInterface---------------------------")

	interfaces, err := uc.catalog.GetInterfaceAggregateRank(ctx)
	if err != nil {
		return nil, err
	}

	// 直接转换类型
	result := make([]*domain.TDataInterfaceApply, 0, len(interfaces))
	for _, item := range interfaces {
		if item != nil {
			result = append(result, &domain.TDataInterfaceApply{
				InterfaceName: item.ServiceName,
				ApplyNum:      item.ApplyNum,
			})
		}
	}

	return result, nil

	//if len(interfaces) == 0 {
	//	return []*domain.TDataInterfaceApply{}, nil
	//}
	//
	//// 预分配数据结构
	//interfaceIds := make([]string, 0, len(interfaces))
	//result := make([]*domain.TDataInterfaceApply, 0, len(interfaces))
	//
	//// 单次遍历提取ID并构建基础结果
	//for _, item := range interfaces {
	//	if item == nil || item.InterfaceID == "" {
	//		continue
	//	}
	//
	//	interfaceIds = append(interfaceIds, item.InterfaceID)
	//	result = append(result, &domain.TDataInterfaceApply{
	//		InterfaceName: item.InterfaceID,
	//		ApplyNum:      item.ApplyNum,
	//	})
	//}
	//
	//if len(interfaceIds) == 0 {
	//	return result, nil
	//}
	//
	///** services, err := uc.service.InternalGetServicesByIDs(ctx, interfaceIds)
	//if err != nil {
	//	log.Errorf("Failed to get services by IDs: %v", err)
	//	return result, nil
	//}**/
	//// 调用服务获取service_name
	//start := time.Now()
	//services, err := uc.service.InternalGetServicesByIDs(ctx, interfaceIds)
	//duration := time.Since(start)
	//
	//// 记录更详细的性能信息
	//log.WithContext(ctx).Infof("Performance - InternalGetServicesByIDs: duration=%v, request_count=%d, response_count=%d, error=%v",
	//	duration,
	//	len(interfaceIds),
	//	func() int {
	//		if services != nil && services.Entries != nil {
	//			return len(services.Entries)
	//		}
	//		return 0
	//	}(),
	//	err,
	//)
	//
	//if err != nil {
	//	log.WithContext(ctx).Errorf("Failed to get services by IDs: %v", err)
	//	return nil, err
	//}
	//
	//// 构建服务映射
	//serviceMap := make(map[string]string, len(services.Entries))
	//for _, svc := range services.Entries {
	//	if svc != nil && svc.ServiceInfo.ServiceID != "" {
	//		serviceMap[svc.ServiceInfo.ServiceID] = svc.ServiceInfo.ServiceName
	//	}
	//}
	//
	//// 更新接口名称
	//for i, item := range interfaces {
	//	if item == nil || item.InterfaceID == "" {
	//		continue
	//	}
	//
	//	if serviceName, exists := serviceMap[item.InterfaceID]; exists && serviceName != "" {
	//		result[i].InterfaceName = serviceName
	//	}
	//}
	//
	//log.Debugf("GetDataInterface: processed %d interfaces", len(result))
	//return result, nil
}
