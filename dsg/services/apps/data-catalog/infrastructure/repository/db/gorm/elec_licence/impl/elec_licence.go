package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/elec_licence"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/elec_licence"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type ElecLicenceRepoImpl struct {
	db *gorm.DB
}

func NewElecLicenceRepo(db *gorm.DB) elec_licence.ElecLicenceRepo {
	return &ElecLicenceRepoImpl{db: db}
}

func (e *ElecLicenceRepoImpl) Create(ctx context.Context, elecLicence *model.ElecLicence) error {
	return e.db.WithContext(ctx).Create(elecLicence).Error
}

func (e *ElecLicenceRepoImpl) CreateInBatches(ctx context.Context, elecLicences []*model.ElecLicence) error {
	return e.db.WithContext(ctx).CreateInBatches(elecLicences, len(elecLicences)).Error
}

func (e *ElecLicenceRepoImpl) Update(ctx context.Context, elecLicence *model.ElecLicence) error {
	return e.db.WithContext(ctx).Where("elec_licence_id=?", elecLicence.ElecLicenceID).Updates(elecLicence).Error
}

func (e *ElecLicenceRepoImpl) Delete(ctx context.Context, elecLicence *model.ElecLicence) error {
	return e.db.WithContext(ctx).Delete(elecLicence).Error
}

func (e *ElecLicenceRepoImpl) GetByElecLicenceID(ctx context.Context, elecLicenceID string) (*model.ElecLicence, error) {
	var elecLicence model.ElecLicence
	err := e.db.WithContext(ctx).Where("elec_licence_id = ?", elecLicenceID).First(&elecLicence).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return &elecLicence, errorcode.Desc(errorcode.ElecLicenceNotFound)
		}
		return &elecLicence, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return &elecLicence, err
}

func (e *ElecLicenceRepoImpl) GetByElecLicenceIDs(ctx context.Context, ids []string) ([]*model.ElecLicence, error) {
	var elecLicences []*model.ElecLicence
	err := e.db.WithContext(ctx).Where("elec_licence_id in ?", ids).Find(&elecLicences).Error
	return elecLicences, err
}

func (e *ElecLicenceRepoImpl) GetAll(ctx context.Context) ([]*model.ElecLicence, error) {
	var elecLicences []*model.ElecLicence
	err := e.db.WithContext(ctx).Find(&elecLicences).Error
	return elecLicences, err
}

func (e *ElecLicenceRepoImpl) Truncate(ctx context.Context) error {
	return e.db.WithContext(ctx).Exec("TRUNCATE elec_licence").Error
}
func (e *ElecLicenceRepoImpl) GetList(ctx context.Context, req *domain.ElecLicenceListReq) (totalCount int64, catalogs []*model.ElecLicence, err error) {
	db := e.db.WithContext(ctx).Table(model.TableNameElecLicence)

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		if strings.Contains(keyword, "%") {
			keyword = strings.Replace(keyword, "%", "\\%", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("licence_name like ? or licence_basic_code like ? ", keyword, keyword)
	}
	if len(req.OnlineStatus) == 1 {
		db = db.Where("online_status = ?", req.OnlineStatus[0])
	} else if len(req.OnlineStatus) > 1 {
		db = db.Where("online_status in ?", req.OnlineStatus)
	}

	if req.UpdatedAtStart != 0 {
		db = db.Where("UNIX_TIMESTAMP(update_time)*1000 >= ?", req.UpdatedAtStart)
	}
	if req.UpdatedAtEnd != 0 {
		db = db.Where("UNIX_TIMESTAMP(update_time)*1000 <= ?", req.UpdatedAtEnd)
	}

	if len(req.ClassifyIDs) != 0 {
		db = db.Where("industry_department_id in ?", req.ClassifyIDs)
	} else if req.ClassifyID != "" {
		db = db.Where("industry_department_id = ?", req.ClassifyID)
	}

	err = db.Count(&totalCount).Error
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if *req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" licence_name %s", *req.Direction))
	} else {
		switch *req.Sort {
		case "created_at":
			db = db.Order(fmt.Sprintf("%s %s", "create_time", *req.Direction))
		case "updated_at":
			db = db.Order(fmt.Sprintf("%s %s", "update_time", *req.Direction))

		}
	}
	err = db.Find(&catalogs).Error
	return
}
