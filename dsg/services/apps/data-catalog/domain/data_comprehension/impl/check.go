package impl

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

// FixConfig 补齐配置
func (c *ComprehensionDomainImpl) FixConfig(req *domain.ComprehensionUpsertReq) ([]*domain.DimensionConfig, error) {
	results := make([]*domain.DimensionConfig, 0)
	configMap, err := c.ConfigMap(req.Configuration.DimensionConfig)
	if err != nil {
		return results, err
	}
	for _, c := range req.DimensionConfigs {
		if detail := c.Detail(configMap); detail != nil {
			results = append(results, detail)
		}
	}
	return results, nil
}

func (c *ComprehensionDomainImpl) ConfigMap(dcs []*domain.DimensionConfig) (map[string]*domain.DimensionConfig, error) {
	res := make(map[string]*domain.DimensionConfig)
	for _, dc := range dcs {
		res[dc.Id] = dc
		if len(dc.Children) != 0 {
			childrenConfigMap, err := c.ConfigMap(dc.Children)
			if err != nil {
				return nil, err
			}
			for key, value := range childrenConfigMap {
				res[key] = value
			}
		}
	}
	return res, nil
}
func (c *ComprehensionDomainImpl) Check(ctx context.Context, req *domain.ComprehensionUpsertReq, needCheck bool) (*domain.ComprehensionDetail, error) {
	detailConfigs, err := c.FixConfig(req)
	if err != nil {
		return nil, err
	}
	hasError := false
	if needCheck {
		if err := req.CheckColumnComments(ctx, c); err != nil {
			hasError = true
		}

		for _, node := range detailConfigs {
			node.CatalogId = req.CatalogID
			//检查得出了错误，不立即返回，而是积累所有的错误，记录在详情中返回
			if err := node.Check(ctx, c, req.Configuration); err != nil {
				hasError = true
				log.WithContext(ctx).Infof("check error：%v", err.Error())
			}
			node.DimensionError()
		}
	}
	catalogInfo, err := c.CatalogDetailInfo(ctx, req.CatalogID.Uint64())
	if err != nil {
		log.WithContext(ctx).Errorf(err.Error())
		return nil, err
	}
	config := req.Configuration
	detailDisplay := &domain.ComprehensionDetail{
		CatalogID:               req.CatalogID,
		CatalogCode:             req.CatalogCode,
		CatalogInfo:             catalogInfo,
		Note:                    config.Note,
		ComprehensionDimensions: detailConfigs,
		ColumnComments:          req.ColumnComments,
		Choices:                 config.Choices,
	}
	if hasError {
		return detailDisplay, errorcode.Desc(errorcode.DataComprehensionContentError)
	}
	return detailDisplay, nil
}

// CatalogBaseInfos 查询数据资源目录, 数据校验辅助函数
func (c *ComprehensionDomainImpl) CatalogBaseInfos(ctx context.Context, catalogIds ...uint64) (details map[uint64]*model.TDataCatalog, err error) {
	tx := c.begin(ctx)
	defer c.Commit(tx, &err)
	catalogs, err1 := c.catalogRepo.GetDetailByIds(tx, ctx, nil, catalogIds...)
	if err1 != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err1.Error())
	}
	details = make(map[uint64]*model.TDataCatalog)
	for _, catalog := range catalogs {
		details[catalog.ID] = catalog
	}
	return details, nil
}

// ColumnInfos  查询数据资源挂载表的字段，数据校验辅助函数
func (c *ComprehensionDomainImpl) ColumnInfos(ctx context.Context, catalogId uint64) (columns map[uint64]*domain.ColumnBriefInfo, err error) {
	tx := c.begin(ctx)
	defer c.Commit(tx, &err)
	columnInfos, err := c.catalogColumnRepo.Get(tx, ctx, catalogId)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	columnBriefInfoMap := make(map[uint64]*domain.ColumnBriefInfo)
	for _, columnInfo := range columnInfos {
		columnBriefInfoMap[columnInfo.ID] = domain.GenColumnInfo(columnInfo)
	}
	return columnBriefInfoMap, nil
}

// ChoiceMap 获取选择配置项
//func (c *ComprehensionDomainImpl) ChoiceMap(ctx context.Context) map[string]map[int]domain.Choice {
//	return domain.ChoiceMap()
//}
