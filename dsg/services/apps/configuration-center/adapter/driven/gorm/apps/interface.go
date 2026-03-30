package apps

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

type AppsRepo interface {
	Create(ctx context.Context, apps *model.Apps, appsHistory *model.AppsHistory) (err error)
	UpdateApp(ctx context.Context, Id string, apps *model.Apps, appsHistory *model.AppsHistory) (err error)
	UpdateEditingApp(ctx context.Context, Id string, apps *model.Apps, appsHistory *model.AppsHistory) (err error)
	Delete(ctx context.Context, id uint64) (err error)
	CheckNameRepeatWithId(ctx context.Context, name, id string) error
	CheckEditingNameRepeatWithId(ctx context.Context, name, id string) error
	GetAppByAppsId(ctx context.Context, id string, version string) (app *model.AllApp, err error)
	GetAppsByAppsIds(ctx context.Context, ids []string, version string) (apps []*model.AllApp, err error)
	GetAppById(ctx context.Context, id uint64, version string) (app *model.AllApp, err error)
	ListApps(ctx context.Context, req *apps.ListReqQuery, uid string) (apps []*model.AllApp, count int64, err error)
	GetAllApps(ctx context.Context) (apps []*model.AllApp, err error)
	GetAppsByAccountId(ctx context.Context, id string) (app *model.AllApp, err error)
	GetAppsByApplicationDeveloperId(ctx context.Context, id string) (apps []*model.AllApp, err error)
	GetReportApps(ctx context.Context, req *apps.ProvinceAppListReq) (appses []*model.AllApp, count int64, err error)

	// GetAppsByIdV3(ctx context.Context, id uint64, version string) (process *model.AllApp, err error)
	// GetAppsByIdV5(ctx context.Context, id uint64, version string) (process *model.AllApp, err error)

	// GetAppsByIdV4(ctx context.Context, id, version string) (process *model.AllApp, err error)
	// Update(ctx context.Context, Id string, process *model.Apps) (err error)
	// List(ctx context.Context, req *apps.ListReqQuery, uid string) (processes []*model.AllApp, count int64, err error)
	CreateProviceApp(ctx context.Context, apps_id, name, description, infoSystem, applicationDeveloperId string, provinceApps *model.ProvinceApps) (err error)
	UpdateProviceApp(ctx context.Context, apps_id, name, description, infoSystem, applicationDeveloperId string, provinceApps *model.ProvinceApps) (err error)
	// GetAppsById(ctx context.Context, id string, version string) (process *model.AppsHistory, err error)

	GetAllOldApps(ctx context.Context) (appses []*model.OldApps, err error)
	Upgrade(ctx context.Context, apps *model.Apps, appsHistory *model.AppsHistory) (err error)

	RegistApp(ctx context.Context, id string, apps_id uint64, registers []*model.LiyueRegistration) (err error)
	ListRegisterApps(ctx context.Context, infoSystemIds []string, req *apps.ListRegisteReqQuery) (apps []*model.AllApp, count int64, err error)
	CheckPassIDRepeatWithId(ctx context.Context, name, id string) error
	CheckEditingPassIDRepeatWithId(ctx context.Context, name, id string) error
}
