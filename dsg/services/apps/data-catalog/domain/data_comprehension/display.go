package data_comprehension

import (
	"context"
	"encoding/json"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

// GenComprehensionDetail  生成详情
func GenComprehensionDetail(details []*model.DataComprehensionDetail) map[uint64]*ComprehensionDetailModel {
	detailModels := make(map[uint64]*ComprehensionDetailModel)
	for _, detail := range details {
		detailModel := new(ComprehensionDetailModel)
		copier.Copy(detailModel, &detail)
		detailModel.Status = detail.Status
		if detail.Details != "" {
			if err := json.Unmarshal([]byte(detail.Details), &detailModel.Details); err != nil {
				log.Error(err.Error())
				continue
			}
		}
		detailModels[detailModel.CatalogID] = detailModel
	}
	return detailModels
}

func GenCatalogInfo(catalogInfo *model.TDataCatalog) *CatalogInfo {
	return &CatalogInfo{
		ID:              models.NewModelID(catalogInfo.ID),
		DepartmentInfos: nil,
		Name:            catalogInfo.Title,
		NameEn:          catalogInfo.Title,
		//BusinessDuties:  nil,
		//BaseWorks:       nil,
		UpdateCycle: catalogInfo.UpdateCycle,
		//TotalData:       0,
		//DataKind:    catalogInfo.DataKind,
		TableDesc:  catalogInfo.Description,
		UpdaterUID: catalogInfo.UpdaterUID,
		UpdatedAt:  catalogInfo.UpdatedAt.UnixMilli(),
	}
}

func GenColumnInfo(columnInfo *model.TDataCatalogColumn) *ColumnBriefInfo {
	dataFormat := int32(0)
	if columnInfo.DataFormat != nil {
		dataFormat = *columnInfo.DataFormat
	}
	return &ColumnBriefInfo{
		ID:         models.NewModelID(columnInfo.ID),
		ColumnName: columnInfo.TechnicalName,
		NameCN:     columnInfo.BusinessName,
		DataFormat: dataFormat,
	}
}

// CheckAndMerge 检查有更改的，同时合并没有的
func (c *ComprehensionDetail) CheckAndMerge(ctx context.Context, helper CheckHelper) error {
	//挨个更新
	for _, dimension := range c.ComprehensionDimensions {
		dimension.CatalogId = c.CatalogID
		if err := dimension.checkAndMerge(ctx, helper); err != nil {
			return err
		}
	}
	return nil
}

func (d *DimensionConfig) checkAndMerge(ctx context.Context, helper CheckHelper) error {
	if !d.IsLeaf() {
		for _, child := range d.Children {
			child.CatalogId = d.CatalogId
			if err := child.checkAndMerge(ctx, helper); err != nil {
				return err
			}
		}
		return nil
	}
	bts, _ := json.Marshal(d.Detail.Content)
	d.Detail.CatalogId = d.CatalogId

	if d.Detail.ContentType == ContentTypeColumnComprehension {
		columnInfos := make([]ColumnComprehension, 0)
		if err := json.Unmarshal(bts, &columnInfos); err != nil {
			log.WithContext(ctx).Error(err.Error())
			return errorcode.Desc(errorcode.DataComprehensionUnmarshalJsonError)
		}
		ColumnComprehensions(columnInfos).Merge(ctx, d.Detail, helper)
	}
	if d.Detail.ContentType == ContentTypeCatalogRelation {
		catalogBaseInfos := make([]CatalogRelation, 0)
		if err := json.Unmarshal(bts, &catalogBaseInfos); err != nil {
			log.WithContext(ctx).Error(err.Error())
			return errorcode.Desc(errorcode.DataComprehensionUnmarshalJsonError)
		}

		catalogBaseInfos = lo.Filter(catalogBaseInfos, func(item CatalogRelation, _ int) bool {
			return len(item.CatalogInfos) > 0
		})
		d.Detail.Content = catalogBaseInfos

		contentError := CatalogRelations(catalogBaseInfos).Check(ctx, *d.Detail, helper, nil)
		if v, ok := contentError[listErrKey]; ok {
			d.Detail.ListErr = v
		}
		delete(contentError, listErrKey)
		d.Detail.ContentErrors = contentError
		d.DimensionError()
	}
	return nil
}

func CancelMark(mark int8, taskId string) int8 {
	switch {
	case taskId == "" && mark == TaskChange:
		return AllNoChange
	case taskId == "" && mark == AllChange:
		return ModelChange
	case taskId != "" && mark == ModelChange:
		return AllNoChange
	case taskId != "" && mark == AllChange:
		return TaskChange
	}
	return mark
}

func Mark(mark int8, taskId string) int8 {
	switch {
	case taskId != "" && mark == ModelChange:
		return AllChange
	case taskId != "" && mark == AllNoChange:
		return TaskChange
	case taskId == "" && mark == TaskChange:
		return AllChange
	case taskId == "" && mark == AllNoChange:
		return ModelChange
	}
	return mark
}
