package impl

import (
	"context"
	"strconv"

	"github.com/biocrosscoder/flex/typed/functools"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

func (d *infoResourceCatalogDomain) buildSearchListEntry(item *info_resource_catalog.EsSearchEntryListItem) *info_resource_catalog.UserSearchListItem {
	log.Debug("build search list entry", zap.Any("item", item))

	// 只关注直接关联信息资源目录的主干业务
	// var mainBusiness info_resource_catalog.Reference
	// if size := len(item.BusinessProcesses); size > 0 {
	// 	mainBusiness = item.BusinessProcesses[size-1]
	// }
	resp := info_resource_catalog.UserSearchListItem{
		ID:             item.ID,
		Name:           item.Name,
		RawName:        item.RawName,
		Code:           item.Code,
		RawCode:        item.RawCode,
		Description:    item.Description,
		RawDescription: item.RawDescription,
		OnlineAt:       item.OnlineAt,
		Columns: functools.Map(func(x *info_resource_catalog.FieldInfo) *info_resource_catalog.ColumnVO {
			return &info_resource_catalog.ColumnVO{
				Name:    x.FieldNameZH,
				RawName: x.RawFieldNameZH,
			}
		}, item.Fields),
		CateInfo: item.CateInfo,
		// 信息资源目录 - 业务表
		BusinessForm: item.BusinessForm,
		// 信息资源目录 - 业务表 - 业务模型
		BusinessModel: item.BusinessModel,
		// 信息资源目录 - 业务表 - 业务模型 - 主干业务
		MainBusiness: item.BusinessProcesses,
		// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 部门及其上级部门，为从顶级部门开始
		MainBusinessDepartments: item.MainBusinessDepartments,
		// 信息资源目录 - 业务表 - 业务模型 - 主干业务 - 业务领域
		BusinessDomain: item.BusinessDomain,
		// 信息资源目录 - 数据资源目录
		DataResourceCatalogs: item.DataResourceCatalogs,
		LabelListResp:        item.LabelListResp,

		SharedType:  enum.Get[info_resource_catalog.EnumSharedType](item.SharedType).String,
		UpdateCycle: enum.Get[info_resource_catalog.EnumUpdateCycle](item.UpdateCycle).String,
	}
	id, err := strconv.ParseInt(item.ID, 10, 64)
	if err != nil {
		log.Error("parse id error", zap.Error(err))
		return &resp
	}
	catalog, err := d.repo.FindBaseInfoByID(context.Background(), id)
	if err != nil {
		log.Error("find base info by id error", zap.Error(err))
		return &resp
	}
	resp.OpenType = catalog.OpenType.String

	return &resp
}

func (d *infoResourceCatalogDomain) extractStatusFromSearchResult(item *info_resource_catalog.EsSearchEntryListItem) *info_resource_catalog.InfoResourceCatalogStatusVO {
	return &info_resource_catalog.InfoResourceCatalogStatusVO{
		Publish: item.PublishedStatus,
		Online:  item.OnlineStatus,
	}
}
