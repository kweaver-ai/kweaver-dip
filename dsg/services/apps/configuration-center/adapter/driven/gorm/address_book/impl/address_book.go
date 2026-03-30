package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	address_book "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/address_book"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/address_book"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"
	"gorm.io/gorm"
)

func NewRepo(db *gorm.DB) address_book.Repo {
	return &repo{db: db}
}

type repo struct {
	db *gorm.DB
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.db.WithContext(ctx)
	}
	return tx
}

func (r *repo) Create(tx *gorm.DB, ctx context.Context, m *model.TAddressBook) error {
	return r.do(tx, ctx).Model(&model.TAddressBook{}).Create(m).Error
}

func (r *repo) BatchCreate(tx *gorm.DB, ctx context.Context, m []*model.TAddressBook) error {
	return r.do(tx, ctx).Model(&model.TAddressBook{}).CreateInBatches(m, len(m)).Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, m *model.TAddressBook) (bool, error) {
	d := r.do(tx, ctx).Model(&model.TAddressBook{}).Where("id = ? and deleted_at is null", m.ID).
		Updates(map[string]interface{}{
			"name":          m.Name,
			"department_id": m.DepartmentID,
			"contact_phone": m.ContactPhone,
			"contact_mail":  m.ContactMail,
			"updated_at":    m.UpdatedAt,
			"updated_by":    m.UpdatedBy,
		})
	return d.RowsAffected > 0, d.Error
}

func (r *repo) Delete(tx *gorm.DB, ctx context.Context, uid string, recordId uint64) (bool, error) {
	d := r.do(tx, ctx).Model(&model.TAddressBook{}).Where("id = ? and deleted_at is null", recordId).
		Updates(map[string]interface{}{
			"deleted_at": time.Now(),
			"deleted_by": uid,
		})
	return d.RowsAffected > 0, d.Error
}

func (r *repo) GetList(tx *gorm.DB, ctx context.Context, req *domain.ListReq) (totalCount int64, data []*domain.ListItem, err error) {

	d := r.do(tx, ctx).Model(&model.TAddressBook{}).
		Select("t_address_book.id, t_address_book.name, t_address_book.department_id, t_address_book.contact_phone, t_address_book.contact_mail, CASE WHEN t_address_book.department_id = ? THEN '未分类' ELSE `object`.name END AS department", constant.UnallocatedId).
		Joins("LEFT JOIN `object` ON `object`.id = t_address_book.department_id").
		Where("t_address_book.deleted_at is null")

	if req.Keyword != "" {
		var keyword string
		if strings.Contains(req.Keyword, "_") {
			keyword = strings.Replace(req.Keyword, "_", "\\_", -1)
		} else if strings.Contains(req.Keyword, "%") {
			keyword = strings.Replace(req.Keyword, "%", "\\%", -1)
		} else {
			keyword = req.Keyword
		}
		kw := "%" + keyword + "%"
		d = d.Where("t_address_book.name LIKE ? OR t_address_book.contact_phone LIKE ? OR `object`.name LIKE ?", kw, kw, kw)
	}

	if req.DepartmentID != "" {
		pathId := "%" + req.DepartmentID + "%"
		d = d.Where("t_address_book.department_id = ? or `object`.path_id LIKE ?", req.DepartmentID, pathId)
	}
	totalCount, err = gormx.RawCount(d)
	if err != nil {
		return
	}
	limit := req.Limit
	offset := limit * (req.Offset - 1)
	if limit > 0 {
		d = d.Limit(limit).Offset(offset)
	}
	if req.Sort == "name" {
		d = d.Order(fmt.Sprintf(" t_address_book.name %s", req.Direction))
	}
	data, err = gormx.RawScan[*domain.ListItem](d)
	return
}
