package gorm

import (
	"context"

	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	configuration_center "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type GatewayCollectionLogRepo interface {
	// List 获取第三方网关采集日志列表
	List(ctx context.Context, req *dto.GatewayCollectionLogReq) (res []*dto.GatewayCollectionLog, totalCount int64, err error)
}

type gatewayCollectionLogRepo struct {
	data                      *db.Data
	configurationCenterRepo   microservice.ConfigurationCenterRepo
	configurationCenterDriven configuration_center.Driven
}

func NewGatewayCollectionLogRepo(
	data *db.Data,
	configurationCenterRepo microservice.ConfigurationCenterRepo,
	configurationCenterDriven configuration_center.Driven,
) GatewayCollectionLogRepo {
	return &gatewayCollectionLogRepo{
		data:                      data,
		configurationCenterRepo:   configurationCenterRepo,
		configurationCenterDriven: configurationCenterDriven,
	}
}

func (r *gatewayCollectionLogRepo) List(ctx context.Context, req *dto.GatewayCollectionLogReq) (res []*dto.GatewayCollectionLog, totalCount int64, err error) {
	base := r.data.DB.WithContext(ctx).Model(&model.GatewayCollectionLog{})

	// 过滤条件
	if req.SvcID != "" {
		base = base.Where("svc_id = ?", req.SvcID)
	}
	if req.Keyword != "" {
		base = base.Where("svc_name LIKE ?", EscapeLike("%", req.Keyword, "%"))
	}
	if req.SvcBelongDeptID != "" {
		if req.SvcBelongDeptID == "00000000-0000-0000-0000-000000000000" {
			base = base.Where("svc_belong_dept_id IS NULL OR svc_belong_dept_id = ''")
		} else {
			base = base.Where("svc_belong_dept_id = ?", req.SvcBelongDeptID)
		}
	}
	if req.InvokeSvcDeptID != "" {
		if req.InvokeSvcDeptID == "00000000-0000-0000-0000-000000000000" {
			base = base.Where("invoke_svc_dept_id IS NULL OR invoke_svc_dept_id = ''")
		} else {
			base = base.Where("invoke_svc_dept_id = ?", req.InvokeSvcDeptID)
		}
	}
	if req.InvokeSystemID != "" {
		base = base.Where("invoke_system_id = ?", req.InvokeSystemID)
	}
	if req.InvokeAppID != "" {
		base = base.Where("invoke_app_id = ?", req.InvokeAppID)
	}
	if req.StartTime != "" {
		base = base.Where("collect_time >= ?", req.StartTime)
	}
	if req.EndTime != "" {
		base = base.Where("collect_time <= ?", req.EndTime)
	}

	// 分组后的总数（distinct svc_id）
	if err = base.Distinct("svc_id").Count(&totalCount).Error; err != nil {
		log.WithContext(ctx).Error("GatewayCollectionLog List Total Count (distinct svc_id)", zap.Error(err))
		return nil, 0, err
	}

	// 分组、聚合查询
	agg := base.Select(
		"svc_id",
		"MAX(svc_name) as svc_name",
		"MAX(svc_belong_dept_id) as svc_belong_dept_id",
		"MAX(svc_belong_dept_name) as svc_belong_dept_name",
		"MAX(invoke_svc_dept_id) as invoke_svc_dept_id",
		"MAX(invoke_svc_dept_name) as invoke_svc_dept_name",
		"MAX(invoke_system_id) as invoke_system_id",
		"MAX(invoke_app_id) as invoke_app_id",
		"MAX(invoke_ip_port) as invoke_ip_port",
		"SUM(invoke_num) as invoke_num",
		"CAST(ROUND(IFNULL(SUM(invoke_num * invoke_average_call_duration) / NULLIF(SUM(invoke_num), 0), 0)) AS SIGNED) as invoke_average_call_duration",
		"MAX(collect_time) as collect_time",
	).Group("svc_id")

	// 排序
	if req.Sort != "" {
		sortField := req.Sort
		switch req.Sort {
		case "call_time", "call_start_time", "call_end_time":
			sortField = "collect_time"
		}
		agg = agg.Order(sortField + " " + req.Direction)
	} else {
		agg = agg.Order("collect_time desc")
	}

	// 分页 + 查询
	var records []*model.GatewayCollectionLog
	if err = agg.Scopes(Paginate(req.Offset, req.Limit)).Find(&records).Error; err != nil {
		log.WithContext(ctx).Error("GatewayCollectionLog List Find (grouped)", zap.Error(err))
		return nil, 0, err
	}
	if records == nil {
		records = []*model.GatewayCollectionLog{}
	}

	res = make([]*dto.GatewayCollectionLog, 0, len(records))

	for _, record := range records {
		// 组装部门名称与路径
		svcBelongDeptName := record.SvcBelongDeptName
		svcBelongDeptPath := ""
		if record.SvcBelongDeptID != "" {
			if dept, derr := r.configurationCenterRepo.DepartmentGet(ctx, record.SvcBelongDeptID); derr != nil {
				log.WithContext(ctx).Warn("GatewayCollectionLog getSvcBelongDept failed", zap.String("departmentID", record.SvcBelongDeptID), zap.Error(derr))
			} else if dept != nil {
				// 若表内已有名称则以表值为准，否则兜底使用配置中心名称
				if svcBelongDeptName == "" {
					svcBelongDeptName = dept.Name
				}
				svcBelongDeptPath = dept.Path
			}
		}

		invokeSvcDeptName := record.InvokeSvcDeptName
		invokeSvcDeptPath := ""
		if record.InvokeSvcDeptID != "" {
			if dept, derr := r.configurationCenterRepo.DepartmentGet(ctx, record.InvokeSvcDeptID); derr != nil {
				log.WithContext(ctx).Warn("GatewayCollectionLog getInvokeDept failed", zap.String("departmentID", record.InvokeSvcDeptID), zap.Error(derr))
			} else if dept != nil {
				if invokeSvcDeptName == "" {
					invokeSvcDeptName = dept.Name
				}
				invokeSvcDeptPath = dept.Path
			}
		}

		// 组装系统与应用名称
		invokeSystemName := ""
		if record.InvokeSystemID != "" {
			if sys, serr := r.configurationCenterRepo.GetInfoSystem(ctx, record.InvokeSystemID); serr != nil {
				log.WithContext(ctx).Warn("GatewayCollectionLog getInvokeSystem failed", zap.String("systemID", record.InvokeSystemID), zap.Error(serr))
			} else if sys != nil {
				invokeSystemName = sys.Name
			}
		}

		invokeAppName := ""
		if record.InvokeAppID != "" {
			if app, aerr := r.configurationCenterDriven.GetApplication(ctx, record.InvokeAppID); aerr != nil {
				log.WithContext(ctx).Warn("GatewayCollectionLog getInvokeApp failed", zap.String("appID", record.InvokeAppID), zap.Error(aerr))
			} else if app != nil {
				invokeAppName = app.Name
			}
		}

		res = append(res, &dto.GatewayCollectionLog{
			SvcID:                     record.SvcID,
			SvcName:                   record.SvcName,
			SvcBelongDeptID:           record.SvcBelongDeptID,
			SvcBelongDeptName:         svcBelongDeptName,
			SvcBelongDeptPath:         svcBelongDeptPath,
			InvokeSvcDeptID:           record.InvokeSvcDeptID,
			InvokeSvcDeptName:         invokeSvcDeptName,
			InvokeSvcDeptPath:         invokeSvcDeptPath,
			InvokeSystemID:            record.InvokeSystemID,
			InvokeSystemName:          invokeSystemName,
			InvokeAppID:               record.InvokeAppID,
			InvokeAppName:             invokeAppName,
			InvokeIPPort:              record.InvokeIPPort,
			InvokeNum:                 record.InvokeNum,
			InvokeAverageCallDuration: record.InvokeAverageCallDuration,
		})
	}

	return res, totalCount, nil
}
