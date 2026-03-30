package callbacks

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_lineage/processor"
	"github.com/kweaver-ai/idrm-go-common/database_callback/callback"
	"github.com/kweaver-ai/idrm-go-common/rest/metadata_manage"
)

type DataLineageTransport struct {
	MetaDataDriven metadata_manage.Driven
	InfoFetcher    *processor.FormViewInfoFetcher
}

func NewDataLineageTransport(
	metaDataDriven metadata_manage.Driven,
	infoFetcher *processor.FormViewInfoFetcher,
) *DataLineageTransport {
	return &DataLineageTransport{
		MetaDataDriven: metaDataDriven,
		InfoFetcher:    infoFetcher,
	}
}

func (d DataLineageTransport) Send(ctx context.Context, body any) error {
	return d.MetaDataDriven.SendLineage(ctx, body)
}

func (d DataLineageTransport) Process(ctx context.Context, model callback.DataModel, tableName, operation string) (any, error) {
	return d.InfoFetcher.HandlerCallback(ctx, model, tableName, operation)
}
