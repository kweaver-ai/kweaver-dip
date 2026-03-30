package data_assets

import (
	"context"
	"errors"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/business_logic_entity_by_business_domain"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/business_logic_entity_by_department"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/client_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_assets_info"
	catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	catalog_column "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_column"
	catalog_info "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/standardization_info"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

type DataAssetsDomain struct {
	dataAssetsRepo      data_assets_info.RepoOp
	logicEntityRepo     business_logic_entity_by_business_domain.RepoOp
	dLogicEntityRepo    business_logic_entity_by_department.RepoOp
	standardizationRepo standardization_info.RepoOp
	cataRepo            catalog.RepoOp
	colRepo             catalog_column.RepoOp
	infoRepo            catalog_info.RepoOp
	clientInfoRepo      client_info.RepoOp
	data                *db.Data
}

func NewDataAssetsDomain(
	dataAssetsRepo data_assets_info.RepoOp,
	logicEntityRepo business_logic_entity_by_business_domain.RepoOp,
	dLogicEntityRepo business_logic_entity_by_department.RepoOp,
	standardizationRepo standardization_info.RepoOp,
	cataRepo catalog.RepoOp,
	colRepo catalog_column.RepoOp,
	infoRepo catalog_info.RepoOp,
	clientInfoRepo client_info.RepoOp,
	data *db.Data) *DataAssetsDomain {
	return &DataAssetsDomain{
		dataAssetsRepo:      dataAssetsRepo,
		logicEntityRepo:     logicEntityRepo,
		dLogicEntityRepo:    dLogicEntityRepo,
		standardizationRepo: standardizationRepo,
		cataRepo:            cataRepo,
		colRepo:             colRepo,
		infoRepo:            infoRepo,
		clientInfoRepo:      clientInfoRepo,
		data:                data}
}

func (d *DataAssetsDomain) GetDataAssetsCount(ctx context.Context) (*DataAssetsResp, error) {
	info, err := d.dataAssetsRepo.Get(ctx)
	if err != nil {
		return nil, err
	}
	if info == nil {
		return &DataAssetsResp{0, 0, 0, 0, 0}, nil
	}
	res := &DataAssetsResp{
		BusinessDomainCount:      info.BusinessDomainCount,
		SubjectDomainCount:       info.SubjectDomainCount,
		BusinessObjectCount:      info.BusinessObjectCount,
		BusinessLogicEntityCount: info.BusinessLogicEntityCount,
		BusinessAttributesCount:  info.BusinessAttributesCount,
	}
	return res, nil
}

func (d *DataAssetsDomain) GetBusinessLogicEntityInfo(ctx context.Context) ([]*BusinessLogicEntityInfo, int64, error) {
	infos, err := d.logicEntityRepo.Get(ctx)
	if err != nil {
		return nil, 0, err
	}
	var totalCount int64
	businessLogicEntityInfos := make([]*BusinessLogicEntityInfo, 0)
	for _, info := range infos {
		businessLogicEntityInfo := &BusinessLogicEntityInfo{
			BusinessDomainID:         info.BusinessDomainID,
			BusinessDomainName:       info.BusinessDomainName,
			BusinessLogicEntityCount: info.BusinessLogicEntityCount,
		}
		totalCount += int64(info.BusinessLogicEntityCount)
		businessLogicEntityInfos = append(businessLogicEntityInfos, businessLogicEntityInfo)
	}

	return businessLogicEntityInfos, totalCount, nil
}

func (d *DataAssetsDomain) GetDepartmentBusinessLogicEntityInfo(ctx context.Context) ([]*DepartmentBusinessLogicEntityInfo, int64, error) {
	infos, err := d.dLogicEntityRepo.Get(ctx)
	if err != nil {
		return nil, 0, err
	}
	var totalCount int64
	businessLogicEntityInfos := make([]*DepartmentBusinessLogicEntityInfo, 0)
	for _, info := range infos {
		businessLogicEntityInfo := &DepartmentBusinessLogicEntityInfo{
			DepartmentID:             info.DepartmentID,
			DepartmentName:           info.DepartmentName,
			BusinessLogicEntityCount: info.BusinessLogicEntityCount,
		}
		totalCount += int64(info.BusinessLogicEntityCount)
		businessLogicEntityInfos = append(businessLogicEntityInfos, businessLogicEntityInfo)
	}
	return businessLogicEntityInfos, totalCount, nil
}

func (d *DataAssetsDomain) GetStandardizedRate(ctx context.Context) ([]*StandardizedRateResp, error) {
	infos, err := d.standardizationRepo.Get(ctx)
	if err != nil {
		return nil, err
	}
	standardizedRateInfos := make([]*StandardizedRateResp, 0)
	for _, info := range infos {
		standardizedRateInfo := &StandardizedRateResp{
			BusinessDomainID:   info.BusinessDomainID,
			BusinessDomainName: info.BusinessDomainName,
			StandardizedFields: info.StandardizedFields,
			TotalFields:        info.TotalFields,
		}
		standardizedRateInfos = append(standardizedRateInfos, standardizedRateInfo)
	}
	return standardizedRateInfos, nil
}

func (c *DataAssetsDomain) GetToken(ctx context.Context) (string, error) {
	clientID, clientSecret, err := c.getClientInfo(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to getClientInfo, err: %v", err)
		return "", err
	}
	token, err := util.RequestToken(ctx, clientID, clientSecret)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to RequestToken, err: %v", err)
		return "", err
	}
	return token, nil
}

func (c *DataAssetsDomain) getClientInfo(ctx context.Context) (string, string, error) {
	info, err := c.clientInfoRepo.Get(ctx)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			clientID, clientSecret, err := util.GetClientInfo(ctx)
			if err != nil {
				log.WithContext(ctx).Errorf("failed to getClientInfo, err: %v", err)
				return "", "", err
			}
			err = c.clientInfoRepo.Insert(ctx, &model.TClientInfo{ClientID: clientID, ClientSecret: clientSecret})
			if err != nil {
				log.WithContext(ctx).Errorf("failed to insert clientInfo, err: %v", err)
				return "", "", err
			}
		}
	}
	return info.ClientID, info.ClientSecret, nil
}
