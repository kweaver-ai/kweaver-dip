package gorm

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ServiceStatsRepo interface {
	GetTopList(ctx context.Context, topNum int, dimension string) (res []*model.ServiceStatsAssociations, err error)
	AssetCount(ctx context.Context, assetStatus string) (count int64, err error)
	IncrPreviewNum(ctx context.Context, serviceID string) (err error)
	IncrApplyNum(ctx context.Context, serviceID string) (err error)
	QueryPublishedServiceCount(c context.Context, isOperator bool) (resp *dto.QueryDomainServicesResp, err error)
	QuerySubjectRelationServiceCount(c context.Context, req *dto.QueryDomainServiceArgs) (resp []*model.DomainServiceRelation, err error)
}

func NewServiceStatsRepo(data *db.Data, redis *repository.Redis, serviceDailyRecordRepo ServiceDailyRecordRepo) ServiceStatsRepo {
	return &serviceStatsRepo{
		data:                   data,
		redis:                  redis,
		serviceDailyRecordRepo: serviceDailyRecordRepo,
	}
}

type serviceStatsRepo struct {
	data                   *db.Data
	redis                  *repository.Redis
	serviceDailyRecordRepo ServiceDailyRecordRepo
}

func (r *serviceStatsRepo) IncrPreviewNum(ctx context.Context, serviceID string) (err error) {
	return r.incrStatsNum(ctx, serviceID, enum.ServiceStatsTypePreviewNum)
}

func (r *serviceStatsRepo) IncrApplyNum(ctx context.Context, serviceID string) (err error) {
	// 1. 更新 service_stats_info 表的统计
	err = r.incrStatsNum(ctx, serviceID, enum.ServiceStatsTypeApplyNum)
	if err != nil {
		log.WithContext(ctx).Error("serviceStatsRepo IncrApplyNum incrStatsNum", zap.Error(err))
		return err
	}

	// 2. 异步更新 service_daily_record 表的每日统计
	go func() {
		if err := r.serviceDailyRecordRepo.IncrementApplyCount(context.Background(), serviceID); err != nil {
			log.Error("IncrApplyNum 每日统计埋点失败",
				zap.String("serviceID", serviceID),
				zap.Error(err))
		}
	}()

	return nil
}

func (r *serviceStatsRepo) incrStatsNum(ctx context.Context, serviceID string, statsType string) (err error) {
	key := "data_application_service_stats_" + statsType
	userId := util.GetUser(ctx).Id
	cmd := r.redis.Client.SAdd(ctx, key, serviceID+":"+userId)
	if cmd.Err() != nil {
		log.WithContext(ctx).Error("serviceStatsRepo incrStatsNum SAdd", zap.Error(cmd.Err()))
		return cmd.Err()
	}

	// 已经统计过的不再计数
	if cmd.Val() == 0 {
		return nil
	}

	sql := ""
	switch statsType {
	case enum.ServiceStatsTypePreviewNum:
		sql = "INSERT INTO `service_stats_info` (`id`,`preview_num`,`service_id`) VALUES (?,?,?) ON DUPLICATE KEY UPDATE `preview_num`=`preview_num`+1"
	case enum.ServiceStatsTypeApplyNum:
		sql = "INSERT INTO `service_stats_info` (`id`,`apply_num`,`service_id`) VALUES (?,?,?) ON DUPLICATE KEY UPDATE `apply_num`=`apply_num`+1"
	}
	tx := r.data.DB.WithContext(ctx).Exec(sql, util.GetUniqueID(), 1, serviceID)
	if tx.Error != nil {
		log.WithContext(ctx).Error("serviceStatsRepo incrStatsNum", zap.Error(tx.Error))
		return tx.Error
	}

	return nil
}

func (r *serviceStatsRepo) GetTopList(ctx context.Context, topNum int, dimension string) (res []*model.ServiceStatsAssociations, err error) {
	res = []*model.ServiceStatsAssociations{}
	tx := r.data.DB.WithContext(ctx).
		Model(&model.ServiceStatsInfo{}).
		Select("service.service_name, service_stats_info.service_id, service_stats_info." + dimension).
		Joins("join service on service_stats_info.service_id = service.service_id and service.publish_status = '" + enum.PublishStatusPublished + "'").
		Order(dimension + " desc").
		Limit(topNum).
		Find(&res)

	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceStatsRepo GetTopList", zap.Error(tx.Error))
		return nil, tx.Error
	}

	return res, nil
}

func (r *serviceStatsRepo) AssetCount(ctx context.Context, assetStatus string) (count int64, err error) {
	user := util.GetUser(ctx)
	tx := r.data.DB.WithContext(ctx).Model(&model.ServiceApply{}).
		Joins("join service on service_apply.service_id = service.service_id and service.publish_status = '" + enum.PublishStatusPublished + "'").
		Where(&model.ServiceApply{UID: user.Id})

	switch assetStatus {
	case "available":
		tx = tx.Where(&model.ServiceApply{AuditStatus: enum.AuditStatusPass})
	case "auditing":
		tx = tx.Where(&model.ServiceApply{AuditStatus: enum.AuditStatusAuditing})
	}

	tx = tx.Count(&count)

	if tx.Error != nil {
		log.WithContext(ctx).Error("ServiceStatsRepo AssetCount", zap.Error(tx.Error))
		return 0, tx.Error
	}
	return count, nil
}

// QueryPublishedServiceCount isOperator=false  查询已经发布的，isOperator=true，查询所有的
func (r *serviceStatsRepo) QueryPublishedServiceCount(c context.Context, isOperator bool) (resp *dto.QueryDomainServicesResp, err error) {
	var Count int64
	tx := r.data.DB.WithContext(c).Scopes(Undeleted()).
		Model(&model.Service{}).
		Where("subject_domain_id != ''").
		Where("(is_changed = '0' OR is_changed = '')")
	if !isOperator {
		tx = tx.Where(&model.Service{Status: enum.LineStatusOnLine})
	}
	err = tx.Count(&Count).Error
	if err != nil {
		log.WithContext(c).Error("ServiceStatsRepo QueryPublishedServiceCount", zap.Error(err))
		return nil, err
	}
	resp = &dto.QueryDomainServicesResp{
		Total:       Count,
		RelationNum: nil,
	}
	return
}

func (r *serviceStatsRepo) QuerySubjectRelationServiceCount(c context.Context, req *dto.QueryDomainServiceArgs) (resp []*model.DomainServiceRelation, err error) {
	tx := r.data.DB.WithContext(c).Scopes(Undeleted()).
		Model(&model.Service{}).
		Select("subject_domain_id, COUNT(*) as relation_service_num")
	//如果是数据运营，数据开发人员，返回所有，否则，只展示发布的
	if !req.IsOperator {
		tx = tx.Where(&model.Service{Status: enum.LineStatusOnLine})
	}
	//返回ID里的主题域ID对应的Service数量
	if req.Flag == enum.ReqCount {
		if len(req.ID) <= 0 {
			return make([]*model.DomainServiceRelation, 0), nil
		}
		tx = tx.Where(fmt.Sprintf("subject_domain_id in ('%s')", strings.Join(req.ID, "','")))
	}
	//Service表中所有主题域ID对应的Service数量
	if req.Flag == enum.ReqAll {
		tx = tx.Where("subject_domain_id != ''")
	}
	err = tx.Where("(is_changed = '0' OR is_changed = '')").Group("subject_domain_id").Scan(&resp).Error
	if err != nil {
		log.WithContext(c).Error("ServiceStatsRepo QuerySubjectRelationServiceCount", zap.Error(err))
	}
	return resp, err
}
