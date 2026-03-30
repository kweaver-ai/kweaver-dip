package impl

import (
	"context"
	"errors"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/apps"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain_apps "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type appsRepo struct {
	db *gorm.DB
}

func NewAppsRepo(db *gorm.DB) apps.AppsRepo {
	return &appsRepo{db: db}
}

func (r *appsRepo) Create(ctx context.Context, apps *model.Apps, appsHistory *model.AppsHistory) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Table(model.TableNameApps).Create(apps).Error; err != nil {
			log.WithContext(ctx).Error("Create Apps", zap.Error(tx.Error))
			return err
		}
		if err := tx.Table(model.TableNameAppsHistory).Create(appsHistory).Error; err != nil {
			log.WithContext(ctx).Error("Create AppsHistory", zap.Error(tx.Error))
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) UpdateApp(ctx context.Context, Id string, apps *model.Apps, appsHistory *model.AppsHistory) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if apps != nil {
			if err := tx.Table(model.TableNameApps).Debug().Updates(apps).Error; err != nil {
				// log.WithContext(ctx).Error("Create Apps", zap.Error(tx.Error))
				return err
			}
		}
		if appsHistory != nil {
			if err := tx.Table(model.TableNameAppsHistory).Debug().Updates(appsHistory).Error; err != nil {
				log.WithContext(ctx).Error("Create provinceApps", zap.Error(tx.Error))
				return err
			}
		}

		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) UpdateEditingApp(ctx context.Context, Id string, apps *model.Apps, appsHistory *model.AppsHistory) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Table(model.TableNameApps).Updates(apps).Error; err != nil {
			log.WithContext(ctx).Error("Create Apps", zap.Error(tx.Error))
			return err
		}

		if appsHistory != nil {
			if err := tx.Table(model.TableNameAppsHistory).Create(appsHistory).Error; err != nil {
				log.WithContext(ctx).Error("Create provinceApps", zap.Error(tx.Error))
				return err
			}
		}

		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) Delete(ctx context.Context, id uint64) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		app := &model.Apps{}
		if err := tx.Table(model.TableNameApps).Where("id = ?", id).Delete(app).Error; err != nil {
			log.WithContext(ctx).Error("Delete Apps", zap.Error(tx.Error))
			return err
		}

		apphsitory := &model.AppsHistory{}
		if err := tx.Table(model.TableNameAppsHistory).Where("app_id = ?", id).Delete(apphsitory).Error; err != nil {
			log.WithContext(ctx).Error("Delete Apps", zap.Error(tx.Error))
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) CheckNameRepeatWithId(ctx context.Context, name, id string) error {
	model := &model.AllApp{}
	if id == "" {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.published_version_id = h.id").
			Where(" a.published_version_id != 0").
			Where(" h.name = ?", name).
			First(model)
		return tx.Error
	} else {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.published_version_id = h.id").
			Where(" a.published_version_id != 0").
			Where(" h.name=? and a.apps_id<>?", name, id).
			First(model)
		return tx.Error
	}
}

func (r *appsRepo) CheckEditingNameRepeatWithId(ctx context.Context, name, id string) error {
	model := &model.AllApp{}
	if id == "" {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.editing_version_id = h.id").
			Where(" a.editing_version_id != 0").
			Where(" h.name = ?", name).
			First(model)
		return tx.Error
	} else {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.editing_version_id = h.id").
			Where(" a.editing_version_id != 0").
			Where(" h.name=? and a.apps_id<>?", name, id).
			First(model)
		return tx.Error
	}
}

func (r *appsRepo) GetAppByAppsId(ctx context.Context, id, version string) (app *model.AllApp, err error) {
	var tx *gorm.DB
	switch version {
	case "published":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.published_version_id = p.id").
			// Where(" a.published_version_id != 0").
			Where(" a.apps_id = ?", id).
			First(&app)
	case "editing":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.editing_version_id = p.id").
			// Where(" a.editing_version_id != 0").
			Where(" a.apps_id = ?", id).
			First(&app)
	case "to_report":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.report_editing_version_id = p.id").
			// Where(" a.report_editing_version_id != 0").
			Where(" a.apps_id = ?", id).
			First(&app)
	case "reported":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.report_published_version_id = p.id").
			// Where(" a.report_published_version_id != 0").
			Where(" a.apps_id = ?", id).
			First(&app)
	}
	err = tx.Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		log.WithContext(ctx).Error("app not found", zap.String("id", id))
		return nil, errorcode.Desc(errorcode.AppsNotFound, id)
	} else if err != nil {
		log.WithContext(ctx).Error("get app fail", zap.Error(err), zap.String("id", id))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return app, nil
}

func (r *appsRepo) GetAppById(ctx context.Context, id uint64, version string) (app *model.AllApp, err error) {
	var tx *gorm.DB
	switch version {
	case "published":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.published_version_id = p.id").
			Where(" a.id = ?", id).
			First(&app)
	case "editing":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.editing_version_id = p.id").
			Where(" a.id = ?", id).
			First(&app)
	case "to_report":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.report_editing_version_id = p.id").
			Where(" a.id = ?", id).
			First(&app)
	case "reported":
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.report_published_version_id = p.id").
			Where(" a.id = ?", id).
			First(&app)
	}
	err = tx.Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		log.WithContext(ctx).Error("app not found", zap.Uint64("id", id))
		return nil, errorcode.Desc(errorcode.AppsNotFound, id)
	} else if err != nil {
		log.WithContext(ctx).Error("get app fail", zap.Error(err), zap.Uint64("id", id))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return app, nil
}

func (r *appsRepo) GetAppsByAppsIds(ctx context.Context, ids []string, version string) (apps []*model.AllApp, err error) {
	var tx *gorm.DB
	if version == "published" {
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.published_version_id = p.id").
			Where(" a.apps_id in ?", ids).
			Find(&apps)
	}
	if version == "editing" {
		tx = r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as p on a.editing_version_id = p.id").
			Where(" a.apps_id in ?", ids).
			Find(&apps)
	}
	err = tx.Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		log.WithContext(ctx).Error("apps not found", zap.String("id", ids[0]))
		return nil, errorcode.Desc(errorcode.AppsNotFound, ids)
	} else if err != nil {
		log.WithContext(ctx).Error("get apps  fail", zap.Error(err), zap.String("id", ids[0]))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return apps, nil
}

func (r *appsRepo) ListApps(ctx context.Context, req *domain_apps.ListReqQuery, uid string) (apps []*model.AllApp, count int64, err error) {
	limit := req.Limit
	offset := limit * (req.Offset - 1)

	Db := r.db.WithContext(ctx).Table(" app as a").Select("*").
		Joins("left join app_history as h on a.published_version_id = h.id")

	Db = Db.Where("a.mark != ?", "cssjj")
	Db = Db.Where("h.application_developer_id = ?", uid)

	if req.OnlyDeveloper {
		Db = Db.Where("h.application_developer_id = ?", uid)
	}

	if req.NeedAccount {
		Db = Db.Where("h.account_id != ?", "")
	}

	if req.Keyword != "" {
		Db = Db.Where("h.name like ?", "%"+common.KeywordEscape(req.Keyword)+"%")
	}

	var total int64
	err = Db.Where("a.deleted_at=0").Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	models := make([]*model.AllApp, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))

	if req.Sort == "created_at" {
		err = Db.Order(fmt.Sprintf("a.%s %s, a.id asc", req.Sort, req.Direction)).
			Find(&models).Error
		if err != nil {
			return nil, 0, err
		}
	} else {
		err = Db.Order(fmt.Sprintf("h.%s %s, a.id asc", req.Sort, req.Direction)).
			Find(&models).Error
		if err != nil {
			return nil, 0, err
		}
	}

	return models, total, nil
}

func (r *appsRepo) GetAllApps(ctx context.Context) (apps []*model.AllApp, err error) {
	tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
		Joins("left join app_history as h on a.published_version_id = h.id").
		Where("h.status = 4 or h.status = 0").
		Find(&apps)
	err = tx.Error
	if err != nil {
		log.WithContext(ctx).Error("get all apps fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return apps, nil
}

func (r *appsRepo) GetAppsByAccountId(ctx context.Context, id string) (app *model.AllApp, err error) {
	tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
		Joins("left join app_history as h on a.published_version_id = h.id").
		Where("h.status = 4 or h.status = 0").
		Where("h.account_id = ?", id).
		First(&app)
	err = tx.Error
	if err != nil {
		log.WithContext(ctx).Error("get app fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return app, nil
}

func (r *appsRepo) GetAppsByApplicationDeveloperId(ctx context.Context, id string) (apps []*model.AllApp, err error) {
	tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
		Joins("left join app_history as h on a.published_version_id = h.id").
		Where("h.status = 4 or h.status = 0").
		Where("h.application_developer_id = ?", id).
		Find(&apps)
	err = tx.Error
	if err != nil {
		log.WithContext(ctx).Error("get all apps fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return apps, nil
}

func (r *appsRepo) GetReportApps(ctx context.Context, req *domain_apps.ProvinceAppListReq) (appses []*model.AllApp, count int64, err error) {
	limit := req.Limit
	offset := limit * (req.Offset - 1)

	Db := r.db.WithContext(ctx).Table("app as a").Select("*").Debug()
	if req.ReportType == "to_report" {
		Db = Db.Joins("left join app_history as h on a.report_editing_version_id = h.id")
		Db = Db.Where("a.report_editing_version_id != 0")
	}
	if req.ReportType == "reported" {
		Db = Db.Joins("left join app_history as h on a.report_published_version_id = h.id")
		Db = Db.Where("a.report_published_version_id != 0")
	}

	// 有上报信息的
	Db = Db.Where("h.province_url !=''")

	if req.Keyword != "" {
		Db = Db.Where("h.name like ?", "%"+common.KeywordEscape(req.Keyword)+"%")
	}

	if req.IsUpdate == "true" {
		Db = Db.Where("h.province_app_id != ''")
	}
	if req.IsUpdate == "false" {
		Db = Db.Where("h.province_app_id = ''")
	}

	var total int64
	err = Db.Where("a.deleted_at=0").Count(&total).Error
	if err != nil {
		return nil, 0, err
	}
	models := make([]*model.AllApp, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))

	err = Db.Order(fmt.Sprintf("h.%s %s, a.id asc", req.Sort, req.Direction)).
		Find(&models).Error
	if err != nil {
		return nil, 0, err
	}

	return models, total, nil
}

// func (r *appsRepo) GetAppsByIdV3(ctx context.Context, id uint64, version string) (process *model.AllApp, err error) {
// 	var tx *gorm.DB
// 	if version == "published" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.report_published_version_id = p.id").
// 			Where(" a.id = ?", id).
// 			First(&process)
// 	}
// 	if version == "editing" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.report_editing_version_id = p.id").
// 			Where(" a.id = ?", id).
// 			First(&process)
// 	}
// 	err = tx.Error
// 	if errors.Is(err, gorm.ErrRecordNotFound) {
// 		// log.WithContext(ctx).Error("apps not found", zap.String("id", id))
// 		return nil, errorcode.Desc(errorcode.AppsNotFound, id)
// 	} else if err != nil {
// 		// log.WithContext(ctx).Error("get apps  fail", zap.Error(err), zap.String("id", id))
// 		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}
// 	return process, nil
// }

// func (r *appsRepo) GetAppsByIdV5(ctx context.Context, id uint64, version string) (process *model.AllApp, err error) {
// 	var tx *gorm.DB
// 	if version == "published" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.report_published_version_id = p.id").
// 			Where(" a.id = ?", id).
// 			First(&process)
// 	}
// 	if version == "editing" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.editing_version_id = p.id").
// 			Where(" a.id = ?", id).
// 			First(&process)
// 	}
// 	err = tx.Error
// 	if errors.Is(err, gorm.ErrRecordNotFound) {
// 		// log.WithContext(ctx).Error("apps not found", zap.String("id", id))
// 		return nil, errorcode.Desc(errorcode.AppsNotFound, id)
// 	} else if err != nil {
// 		// log.WithContext(ctx).Error("get apps  fail", zap.Error(err), zap.String("id", id))
// 		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}
// 	return process, nil
// }

// func (r *appsRepo) GetAppsByIdV4(ctx context.Context, id, version string) (process *model.AllApp, err error) {
// 	var tx *gorm.DB
// 	if version == "published" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.report_published_version_id = p.id").
// 			Where(" a.apps_id = ?", id).
// 			First(&process)
// 	}
// 	if version == "editing" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.report_editing_version_id = p.id").
// 			Where(" a.apps_id = ?", id).
// 			First(&process)
// 	}
// 	err = tx.Error
// 	if errors.Is(err, gorm.ErrRecordNotFound) {
// 		// log.WithContext(ctx).Error("apps not found", zap.String("id", id))
// 		return nil, errorcode.Desc(errorcode.AppsNotFound, id)
// 	} else if err != nil {
// 		// log.WithContext(ctx).Error("get apps  fail", zap.Error(err), zap.String("id", id))
// 		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}
// 	return process, nil
// }

// func (r *appsRepo) Update(ctx context.Context, Id string, process *model.Apps) (err error) {
// 	tx := r.db.WithContext(ctx).
// 		Model(&model.Apps{}).
// 		// Where(&model.Apps{AppsId: Id}).
// 		Updates(&process)
// 	if tx.Error != nil {
// 		log.WithContext(ctx).Error("Update", zap.Error(err))
// 		return tx.Error
// 	}
// 	return nil
// }

// func (r *appsRepo) List(ctx context.Context, req *domain_apps.ListReqQuery, uid string) (processes []*model.AllApp, count int64, err error) {
// 	limit := req.Limit
// 	offset := limit * (req.Offset - 1)

// 	// Db := r.db.Debug().WithContext(ctx).Model(&model.Apps{})

// 	Db := r.db.WithContext(ctx).Table("apps as a").Select("*")

// 	Db = Db.Where("a.application_developer_id = ?", uid)
// 	// if req.OnlyDeveloper {
// 	// 	Db = Db.Where("a.application_developer_id = ?", uid)
// 	// }

// 	if req.NeedAccount {
// 		Db = Db.Where("a.account_id != ?", "")
// 	}

// 	if req.Keyword != "" {
// 		Db = Db.Where("a.name like ?", "%"+common.KeywordEscape(req.Keyword)+"%")
// 	}

// 	var total int64
// 	err = Db.Where("a.deleted_at=0").Count(&total).Error
// 	// err = Db.Count(&total).Error
// 	if err != nil {
// 		return nil, 0, err
// 	}

// 	models := make([]*model.AllApp, 0)
// 	Db = Db.Limit(int(limit)).Offset(int(offset))

// 	err = Db.Order(fmt.Sprintf("%s %s, a.id asc", req.Sort, req.Direction)).
// 		// Joins("left join province as p on a.province_id = p.id").
// 		Find(&models).Error
// 	if err != nil {
// 		return nil, 0, err
// 	}

// 	return models, total, nil
// }

// func (r *appsRepo) GetAppsById(ctx context.Context, id, version string) (process *model.AppsHistory, err error) {
// 	var tx *gorm.DB
// 	if version == "published" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.published_version_id = p.id").
// 			Where(" a.apps_id = ?", id).
// 			First(&process)
// 	}
// 	if version == "editing" {
// 		tx = r.db.WithContext(ctx).Table("apps as a").Select("*").Debug().
// 			Joins("left join apps_history as p on a.editing_version_id = p.id").
// 			Where(" a.apps_id = ?", id).
// 			First(&process)
// 	}
// 	err = tx.Error
// 	if errors.Is(err, gorm.ErrRecordNotFound) {
// 		log.WithContext(ctx).Error("apps not found", zap.String("id", id))
// 		return nil, errorcode.Desc(errorcode.AppsNotFound, id)
// 	} else if err != nil {
// 		log.WithContext(ctx).Error("get apps  fail", zap.Error(err), zap.String("id", id))
// 		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
// 	}
// 	return process, nil
// }

func (r *appsRepo) CreateProviceApp(ctx context.Context, apps_id, name, description, infoSystem, applicationDeveloperId string, provinceApps *model.ProvinceApps) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := r.db.WithContext(ctx).Table(model.TableNameApps).Where("apps_id=?", apps_id).UpdateColumns(map[string]interface{}{
			"province_id":              provinceApps.ID,
			"name":                     name,
			"description":              description,
			"info_system":              infoSystem,
			"application_developer_id": applicationDeveloperId,
		}).Error; err != nil {
			log.WithContext(ctx).Error("Update Apps", zap.Error(tx.Error))
			return err
		}

		// if err := tx.Table(model.TableNameProvinceApps).Create(provinceApps).Error; err != nil {
		// 	log.WithContext(ctx).Error("Create provinceApps", zap.Error(tx.Error))
		// 	return err
		// }
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) UpdateProviceApp(ctx context.Context, apps_id, name, description, infoSystem, applicationDeveloperId string, provinceApps *model.ProvinceApps) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := r.db.WithContext(ctx).Table(model.TableNameApps).Where("apps_id=?", apps_id).UpdateColumns(map[string]interface{}{
			"province_id":              provinceApps.ID,
			"name":                     name,
			"description":              description,
			"info_system":              infoSystem,
			"application_developer_id": applicationDeveloperId,
		}).Error; err != nil {
			log.WithContext(ctx).Error("Update Apps", zap.Error(tx.Error))
			return err
		}

		if err := tx.Table(model.TableNameProvinceApps).Where("id=?", provinceApps.ID).Updates(provinceApps).Error; err != nil {
			log.WithContext(ctx).Error("Updates provinceApps", zap.Error(tx.Error))
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) GetAllOldApps(ctx context.Context) (appses []*model.OldApps, err error) {
	tx := r.db.WithContext(ctx).
		Model(&model.OldApps{}).
		Find(&appses)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetAllOldApps", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (r *appsRepo) Upgrade(ctx context.Context, apps *model.Apps, appsHistory *model.AppsHistory) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		var appses []*model.Apps
		if err := tx.Table(model.TableNameApps).Find(&appses).Error; err != nil {
			log.WithContext(ctx).Error("GET Apps", zap.Error(tx.Error))
			return err
		}
		if len(appses) == 0 {
			if err := tx.Table(model.TableNameApps).Create(apps).Error; err != nil {
				log.WithContext(ctx).Error("Create Apps", zap.Error(tx.Error))
				return err
			}
			if err := tx.Table(model.TableNameAppsHistory).Create(appsHistory).Error; err != nil {
				log.WithContext(ctx).Error("Create AppsHistory", zap.Error(tx.Error))
				return err
			}
		}

		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) RegistApp(ctx context.Context, id string, apps_id uint64, registers []*model.LiyueRegistration) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := r.db.WithContext(ctx).Table(model.TableNameAppsHistory).Where("app_id=?", apps_id).UpdateColumns(map[string]interface{}{
			"is_register_gateway": 1,
			"register_at":         time.Now(),
			// "token":               token,
		}).Error; err != nil {
			log.WithContext(ctx).Error("Update Apps", zap.Error(tx.Error))
			return err
		}

		register := &model.LiyueRegistration{}
		if err = tx.Table(model.TableNameLiyueRegistration).Where("liyue_id =?", id).Delete(register).Error; err != nil {
			log.Error("failed to Delete liyue_registrations ", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		if len(registers) > 0 {
			if err := tx.Table(model.TableNameLiyueRegistration).Create(registers).Error; err != nil {
				log.WithContext(ctx).Error("Updates info_system", zap.Error(tx.Error))
				return err
			}
		}

		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *appsRepo) ListRegisterApps(ctx context.Context, infoSystemIds []string, req *domain_apps.ListRegisteReqQuery) (apps []*model.AllApp, count int64, err error) {
	limit := req.Limit
	offset := limit * (req.Offset - 1)

	Db := r.db.WithContext(ctx).Table("app as a").Select("*").
		Joins("left join app_history as h on a.published_version_id = h.id").
		Where("a.mark='cssjj'")

	Db = Db.Where("a.mark = ?", "cssjj")
	if req.Keyword != "" {
		Db = Db.Where("h.name like ?", "%"+common.KeywordEscape(req.Keyword)+"%")
	}

	if req.IsRegisterGateway == "true" {
		Db = Db.Where(" h.is_register_gateway = ? ", domain_apps.RegisteGateway)
	}
	if req.IsRegisterGateway == "false" {
		Db = Db.Where(" h.is_register_gateway = ? ", domain_apps.NotRegisteGateway)
	}

	if req.StartedAt > 0 && req.FinishedAt > 0 {
		Db = Db.Where("h.register_at between ? and ? ", time.UnixMilli(req.StartedAt), time.UnixMilli(req.FinishedAt))
	}

	if len(infoSystemIds) > 0 {
		Db = Db.Where("h.info_system in ? ", infoSystemIds)
	}

	if req.AppType != "" {
		Db = Db.Where("h.app_type=?", req.AppType)
	}

	var total int64
	err = Db.Where("a.deleted_at=0").Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	models := make([]*model.AllApp, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))

	if req.Sort == "created_at" {
		err = Db.Order(fmt.Sprintf("a.%s %s, a.id asc", req.Sort, req.Direction)).
			Find(&models).Error
		if err != nil {
			return nil, 0, err
		}
	} else {
		err = Db.Order(fmt.Sprintf("h.%s %s, a.id asc", req.Sort, req.Direction)).
			Find(&models).Error
		if err != nil {
			return nil, 0, err
		}
	}

	return models, total, nil
}

func (r *appsRepo) CheckPassIDRepeatWithId(ctx context.Context, passId, id string) error {
	model := &model.AllApp{}
	if id == "" {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.published_version_id = h.id").
			Where(" a.published_version_id != 0").
			Where(" h.pass_id = ?", passId).
			First(model)
		return tx.Error
	} else {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.published_version_id = h.id").
			Where(" a.published_version_id != 0").
			Where(" h.pass_id=? and a.apps_id<>?", passId, id).
			First(model)
		return tx.Error
	}
}

func (r *appsRepo) CheckEditingPassIDRepeatWithId(ctx context.Context, passId, id string) error {
	model := &model.AllApp{}
	if id == "" {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.editing_version_id = h.id").
			Where(" a.editing_version_id != 0").
			Where(" h.pass_id = ?", passId).
			First(model)
		return tx.Error
	} else {
		tx := r.db.WithContext(ctx).Table("app as a").Select("*").Debug().
			Joins("left join app_history as h on a.editing_version_id = h.id").
			Where(" a.editing_version_id != 0").
			Where(" h.pass_id=? and a.apps_id<>?", passId, id).
			First(model)
		return tx.Error
	}
}
