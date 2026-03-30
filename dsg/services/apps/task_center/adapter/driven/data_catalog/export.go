package data_catalog

import (
	"context"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/business_grooming"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
)

var Service Call

func GeCatalogInfos(ctx context.Context, catalogIds ...string) ([]*CatalogInfo, error) {
	return Service.GetCatalogInfos(ctx, catalogIds...)
}

func CheckCatalogInfo(ctx context.Context, catalogIds ...string) error {
	catalogIds = util.SliceUnique(catalogIds)
	catalogInfos, err := Service.GetCatalogInfos(ctx, catalogIds...)
	if err != nil {
		return err
	}
	if len(catalogInfos) != len(catalogIds) {
		return errorcode.Desc(errorcode.RelationDataInvalidIdExists)
	}
	return nil
}

// CheckCatalogStatus 检查是否是有未理解的任务
func CheckCatalogStatus(ctx context.Context, catalogIds ...string) error {
	catalogIds = util.SliceUnique(catalogIds)
	catalogInfos, err := Service.GetCatalogInfos(ctx, catalogIds...)
	if err != nil {
		return err
	}
	for _, catalogInfo := range catalogInfos {
		if catalogInfo.ComprehensionStatus != 2 && catalogInfo.State == 5 {
			return errorcode.Desc(errorcode.RelatedDataNotComprehendedExists)
		}
	}
	return nil
}

func GetCatalogInfoBriefs(ctx context.Context, catalogIds ...string) (*business_grooming.RelationDataList, error) {
	catalogInfos, err := Service.GetCatalogInfos(ctx, catalogIds...)
	if err != nil {
		return nil, err
	}
	data := new(business_grooming.RelationDataList)
	for _, info := range catalogInfos {
		data.Data = append(data.Data, &business_grooming.RelationDataInfo{
			Id:   fmt.Sprintf("%v", info.ID),
			Name: info.Title,
		})
	}
	return data, nil
}
