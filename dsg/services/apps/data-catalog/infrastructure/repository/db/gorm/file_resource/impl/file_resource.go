package impl

import (
	"context"
	"fmt"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/file_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/file_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type FileResourceRepo struct {
	db *gorm.DB
}

func (d *FileResourceRepo) Db() *gorm.DB {
	return d.db
}
func (d *FileResourceRepo) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return d.db
}

func NewFileResourceRepo(db *gorm.DB) file_resource.FileResourceRepo {
	return &FileResourceRepo{db: db}
}

func (d *FileResourceRepo) Create(ctx context.Context, fileResource *model.TFileResource) error {
	return d.db.WithContext(ctx).Model(&model.TFileResource{}).Create(fileResource).Error
}

func (d *FileResourceRepo) GetFileResourceList(ctx context.Context, req *domain.GetFileResourceListReq) (totalCount int64, fileResources []*model.TFileResource, err error) {
	db := d.db.WithContext(ctx).Model(&model.TFileResource{})
	keyword := req.Keyword
	if keyword != "" {
		// if strings.Contains(keyword, "_") {
		// 	keyword = strings.Replace(keyword, "_", "\\_", -1)
		// }
		// keyword = "%" + keyword + "%"
		// db = db.Where("name like ? or code like ? ", keyword, keyword)
		kw := "%" + util.KeywordEscape(keyword) + "%"
		db = db.Where("name like ? or code like ? ", kw, kw)
	}

	if req.DepartmentID != "" && req.DepartmentID == constant.UnallocatedId {
		db = db.Where("department_id = ? ", req.DepartmentID)
	}

	if len(req.SubDepartmentIDs) > 0 {
		db = db.Where("department_id in ? ", req.SubDepartmentIDs)
	}

	if req.UpdatedAtStart != 0 {
		db = db.Where("UNIX_TIMESTAMP(updated_at)*1000 >= ?", req.UpdatedAtStart)
	}
	if req.UpdatedAtEnd != 0 {
		db = db.Where("UNIX_TIMESTAMP(updated_at)*1000 <= ?", req.UpdatedAtEnd)
	}

	if len(req.PublishStatus) == 1 {
		db = db.Where("publish_status = ?", req.PublishStatus[0])
	} else if len(req.PublishStatus) > 1 {
		db = db.Where("publish_status in ?", req.PublishStatus)
	}

	db = db.Where("deleted_at is null")

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
		db = db.Order(fmt.Sprintf(" name %s", *req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("%s %s", *req.Sort, *req.Direction))
	}
	err = db.Find(&fileResources).Error
	return
}

func (d *FileResourceRepo) GetById(ctx context.Context, Id uint64, tx ...*gorm.DB) (fileResource *model.TFileResource, err error) {
	err = d.do(tx).WithContext(ctx).Model(&model.TFileResource{}).Where("id = ? and deleted_at is null", Id).Find(&fileResource).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return fileResource, nil
}

func (d *FileResourceRepo) Save(ctx context.Context, fileResource *model.TFileResource) error {
	return d.db.WithContext(ctx).Model(&model.TFileResource{}).Where("id = ? and deleted_at is null", fileResource.ID).Save(fileResource).Error
}

func (d *FileResourceRepo) Delete(ctx context.Context, fileResource *model.TFileResource, tx ...*gorm.DB) error {
	res := d.do(tx).WithContext(ctx).Model(&model.TFileResource{}).Where("id = ? and deleted_at is null", fileResource.ID).Updates(&fileResource)
	if res.Error != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, res.Error.Error())
	} else if res.RowsAffected == 0 {
		return errorcode.Desc(errorcode.PublicResourceNotExisted)
	}
	return nil
}

func (d *FileResourceRepo) AuditProcessMsgProc(ctx context.Context, fileResourceID, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error) {
	db := d.do(tx).WithContext(ctx).
		Model(&model.TFileResource{}).
		Where("id = ? and audit_apply_sn = ? and deleted_at is null", fileResourceID, auditApplySN).
		UpdateColumns(alterInfo)
	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

func (d *FileResourceRepo) AuditResultUpdate(ctx context.Context, fileResourceID, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error) {
	db := d.do(tx).WithContext(ctx).
		Model(&model.TFileResource{}).
		Where("id = ? and audit_apply_sn = ? and audit_state = ? and deleted_at is null", fileResourceID, auditApplySN, constant.AuditStatusAuditing).
		UpdateColumns(alterInfo)
	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

func (d *FileResourceRepo) UpdateAuditStateByProcDefKey(ctx context.Context, procDefKeys []string, tx ...*gorm.DB) (bool, error) {
	db := d.do(tx).WithContext(ctx).
		Model(&model.TFileResource{}).
		Where("proc_def_key in ? and audit_state = ? and deleted_at is null", procDefKeys, constant.AuditStatusAuditing).
		UpdateColumns(map[string]interface{}{
			"audit_state":  constant.AuditStatusUnaudited,
			"audit_advice": "流程被删除，审核撤销",
			"updated_at":   &util.Time{Time: time.Now()},
		})
	return db.RowsAffected > 0, db.Error
}
