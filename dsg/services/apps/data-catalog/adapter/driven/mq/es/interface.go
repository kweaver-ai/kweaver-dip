package es

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
)

type ESRepo interface {
	PubApplyNumToES(ctx context.Context, catalogId uint64, applyNum int64) error
	PubToES(ctx context.Context, catalog *model.TDataCatalog, mountResources []*MountResources, businessObjects []*BusinessObject, cateInfos []*CateInfo, columns []*model.TDataCatalogColumn) (err error)
	DeletePubES(ctx context.Context, id string) (err error)
	CreateInfoCatalog(ctx context.Context, msgBody *info_resource_catalog.EsIndexCreateMsgBody) (err error)
	DeleteInfoCatalog(ctx context.Context, docID string) (err error)
	UpdateInfoCatalog(ctx context.Context, msgBody *info_resource_catalog.EsIndexUpdateMsgBody) (err error)
	PubElecLicenceToES(ctx context.Context, elec *model.ElecLicence, columns []*model.ElecLicenceColumn) (err error)
	DeleteElecLicencePubES(ctx context.Context, id string) (err error)
}
