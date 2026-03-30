package info_system

import (
	"context"

	"github.com/google/uuid"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/databases/af_configuration"
	api_basic_search_v1 "github.com/kweaver-ai/idrm-go-common/api/basic_search/v1"
	api_data_catalog_frontend_v1 "github.com/kweaver-ai/idrm-go-common/api/data_catalog/frontend/v1"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (d *Domain) AggregateInfoSystemSearchResultInto(ctx context.Context, in *api_basic_search_v1.InfoSystemSearchResult, out *api_data_catalog_frontend_v1.InfoSystemSearchResult) {
	// Entries
	if in.Entries != nil {
		out.Entries = make([]api_data_catalog_frontend_v1.InfoSystemWithHighlight, len(in.Entries))
		for i := range in.Entries {
			d.AggregateInfoSystemWithHighlightInto(ctx, &in.Entries[i], &out.Entries[i])
		}
	}
	// Total
	convert_BasicSearchV1_Total_Into_DataCatalogV1_Total(&in.Total, &out.Total)
	// Continue
	out.Continue = in.Continue
}

func (d *Domain) AggregateInfoSystemSearchResult(ctx context.Context, in *api_basic_search_v1.InfoSystemSearchResult) (out *api_data_catalog_frontend_v1.InfoSystemSearchResult) {
	if in == nil {
		return nil
	}
	out = new(api_data_catalog_frontend_v1.InfoSystemSearchResult)
	d.AggregateInfoSystemSearchResultInto(ctx, in, out)
	return
}

func (d *Domain) AggregateInfoSystemWithHighlightInto(ctx context.Context, in *api_basic_search_v1.InfoSystemWithHighlight, out *api_data_catalog_frontend_v1.InfoSystemWithHighlight) {
	d.AggregateInfoSystemInto(ctx, &in.InfoSystem, &out.InfoSystem)
	out.NameHighlight = in.NameHighlight
	out.DescriptionHighlight = in.DescriptionHighlight

}

func (d *Domain) AggregateInfoSystemInto(ctx context.Context, in *api_basic_search_v1.InfoSystem, out *api_data_catalog_frontend_v1.InfoSystem) {
	out.ID = in.ID.String()
	out.UpdatedAt = in.UpdatedAt
	out.Name = in.Name
	out.Description = in.Description

	if in.DepartmentID != uuid.Nil {
		out.DepartmentID = in.DepartmentID.String()
		// 获取信息系统所属部门的路径
		d, err := d.Object.Get(ctx, in.DepartmentID.String())
		if err != nil {
			log.WithContext(ctx).Warn("get department fail", zap.Error(err), zap.Stringer("id", in.DepartmentID))
			d = &af_configuration.Object{}
		}
		out.DepartmentPath = d.Path
	}
}
