package impl

import (
	"strings"

	"github.com/biocrosscoder/flex/typed/collections/arraylist"
	"github.com/biocrosscoder/flex/typed/functools"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

func (d *infoResourceCatalogDomain) buildEsCreateMsg(entity *info_resource_catalog.InfoResourceCatalog, formPathInfo *business_grooming.FormPathInfoResp) *info_resource_catalog.EsIndexCreateMsgBody {
	resp := &info_resource_catalog.EsIndexCreateMsgBody{
		DocID:       entity.ID,
		ID:          entity.ID,
		Name:        entity.Name,
		Code:        entity.Code,
		Description: entity.Description,
		Fields: functools.Map(func(x *info_resource_catalog.InfoItem) *info_resource_catalog.Field {
			return &info_resource_catalog.Field{
				FieldNameZH: x.Name,
			}
		}, entity.Columns),
		CateInfos: entity.CategoryNodeList.Filter(func(cn *info_resource_catalog.CategoryNode) bool {
			return cn.NodeID != constant.UnallocatedId
		}),
		BusinessProcesses:    entity.BelongBusinessProcessList,
		UpdateCycle:          entity.UpdateCycle.Integer.Int8(),
		SharedType:           entity.SharedType.Integer.Int8(),
		PublishedStatus:      entity.PublishStatus.String,
		PublishedAt:          entity.PublishAt.UnixMilli(),
		OnlineStatus:         entity.OnlineStatus.String,
		OnlineAt:             entity.OnlineAt.UnixMilli(),
		UpdatedAt:            entity.UpdateAt.UnixMilli(),
		DataResourceCatalogs: entity.RelatedDataResourceCatalogList,
		LabelIds:             strings.Join(entity.LabelIds, ","),
	}
	if formPathInfo != nil {
		resp.FormID = formPathInfo.FormID
		resp.FormName = formPathInfo.FormName
		resp.BusinessModelID = formPathInfo.BusinessModelID
		resp.BusinessModelName = formPathInfo.BusinessModelName
		resp.ProcessPathID = formPathInfo.ProcessPathID
		resp.ProcessPathName = formPathInfo.ProcessPathName
		resp.DomainID = formPathInfo.DomainID
		resp.DomainName = formPathInfo.DomainName
		resp.DepartmentPathID = formPathInfo.DepartmentPathID
		resp.DepartmentPathName = formPathInfo.DepartmentPathName
	}
	return resp
}

func (d *infoResourceCatalogDomain) buildSearchRequest(keyword info_resource_catalog.KeywordParam, filter *info_resource_catalog.UserSearchFilterParams, publishStatus, onlineStatus, nextFlag []string, cateInfo *info_resource_catalog.CateInfoQuery) *info_resource_catalog.EsSearchParam {
	req := &info_resource_catalog.EsSearchParam{
		Keyword:         keyword.Keyword,
		Fields:          keyword.Fields,
		CateInfos:       map[bool][]*info_resource_catalog.CateInfoQuery{false: nil, true: arraylist.Of(cateInfo)}[cateInfo != nil],
		PublishedStatus: publishStatus,
		OnlineStatus:    onlineStatus,
		Size:            info_resource_catalog.SearchInfoResourceCatalogRequestSize,
		NextFlag:        nextFlag,
	}
	if filter != nil {
		req.BusinessProcessIDs = filter.BusinessProcessIDs
		req.UpdateCycle = functools.Map(func(x string) int8 {
			return enum.Get[info_resource_catalog.EnumUpdateCycle](x).Integer.Int8()
		}, filter.UpdateCycle)
		req.SharedType = functools.Map(func(x string) int8 {
			return enum.Get[info_resource_catalog.EnumSharedType](x).Integer.Int8()
		}, filter.SharedType)
		if filter.OnlineAt != nil {
			req.OnlineAt = &info_resource_catalog.TimeRange{
				StartTime: filter.OnlineAt.Start,
				EndTime:   filter.OnlineAt.End,
			}
		}
	}
	return req
}
