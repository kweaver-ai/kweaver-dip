package domain

import (
	"context"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type ServiceStatsDomain struct {
	repo gorm.ServiceStatsRepo
}

func NewServiceStatsDomain(repo gorm.ServiceStatsRepo) *ServiceStatsDomain {
	return &ServiceStatsDomain{
		repo: repo,
	}
}

func (d *ServiceStatsDomain) ServiceTopData(c context.Context, req *dto.ServiceTopDataReq) (res *dto.ServiceTopDataRes, err error) {
	previewNumStats, err := d.repo.GetTopList(c, req.TopNum, enum.ServiceStatsTypePreviewNum)
	if err != nil {
		return nil, err
	}
	var previewNum []*dto.ServiceTopData
	for _, stat := range previewNumStats {
		item := &dto.ServiceTopData{
			ServiceID:   stat.ServiceStatsInfo.ServiceID,
			ServiceName: stat.Service.ServiceName,
			Num:         stat.PreviewNum,
		}

		previewNum = append(previewNum, item)
	}

	applyNumStats, err := d.repo.GetTopList(c, req.TopNum, enum.ServiceStatsTypeApplyNum)
	if err != nil {
		return nil, err
	}
	var applyNum []*dto.ServiceTopData
	for _, stat := range applyNumStats {
		item := &dto.ServiceTopData{
			ServiceID:   stat.ServiceStatsInfo.ServiceID,
			ServiceName: stat.Service.ServiceName,
			Num:         stat.ApplyNum,
		}

		applyNum = append(applyNum, item)
	}

	res = &dto.ServiceTopDataRes{
		ApplyNum:   applyNum,
		PreviewNum: previewNum,
	}

	return res, err
}

func (d *ServiceStatsDomain) ServiceAssetCount(c context.Context, req *dto.ServiceAssetCountReq) (res *dto.ServiceAssetCountRes, err error) {
	availableCount, err := d.repo.AssetCount(c, "available")
	if err != nil {
		return nil, err
	}

	auditingCount, err := d.repo.AssetCount(c, "auditing")
	if err != nil {
		return nil, err
	}

	res = &dto.ServiceAssetCountRes{
		Available: availableCount,
		Auditing:  auditingCount,
	}
	return
}

func (d *ServiceStatsDomain) SubjectRelationServiceCount(c context.Context, req *dto.QueryDomainServiceArgs) (resp *dto.QueryDomainServicesResp, err error) {
	if req.Flag == enum.ReqTotal {
		resp, err = d.repo.QueryPublishedServiceCount(c, req.IsOperator)
		if err != nil {
			log.Error("SubjectRelationServiceCount --> Query Count Failed：", zap.Error(err))
			return nil, err
		}
		return resp, nil
	}
	relations, err := d.repo.QuerySubjectRelationServiceCount(c, req)
	if err != nil {
		log.Error("SubjectRelationServiceCount --> Query Count Failed：", zap.Error(err))
		return nil, err
	}
	resp = &dto.QueryDomainServicesResp{
		RelationNum: make([]dto.DomainServiceRelation, 0),
	}
	copier.Copy(&resp.RelationNum, relations)
	return resp, nil
}
