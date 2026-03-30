package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/open_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/open_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type OpenCatalogRepo struct {
	db *gorm.DB
}

func (d *OpenCatalogRepo) Db() *gorm.DB {
	return d.db
}
func (d *OpenCatalogRepo) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return d.db
}

func NewOpenCatalogRepo(db *gorm.DB) open_catalog.OpenCatalogRepo {
	return &OpenCatalogRepo{db: db}
}

func (d *OpenCatalogRepo) GetOpenableCatalogList(ctx context.Context, req *domain.GetOpenableCatalogListReq) (total int64, catalogs []*model.TDataCatalog, err error) {
	db := d.db.WithContext(ctx).Model(&model.TDataCatalog{}).
		Joins("LEFT JOIN t_open_catalog ON t_data_catalog.id = t_open_catalog.catalog_id AND t_open_catalog.deleted_at IS NULL").
		Where("t_data_catalog.open_type != ? AND t_data_catalog.online_status = ? AND t_open_catalog.catalog_id IS NULL", 3, "online")

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		if strings.Contains(keyword, "%") {
			keyword = strings.Replace(keyword, "%", "\\%", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("t_data_catalog.title like ? or t_data_catalog.code like ? ", keyword, keyword)
	}

	openType := req.OpenType
	if openType != 0 {
		db = db.Where("t_data_catalog.open_type = ? ", openType)
	}
	openCondition := req.OpenCondition
	if openCondition != "" {
		openCondition = "%" + openCondition + "%"
		db = db.Where("t_data_catalog.open_condition like ? ", openCondition)
	}

	sourceDepartmentId := req.SourceDepartmentID

	if sourceDepartmentId != "" && req.SourceDepartmentID != constant.UnallocatedId {
		db = db.Where("t_data_catalog.source_department_id = ? ", sourceDepartmentId)
	}
	if sourceDepartmentId != "" && req.SourceDepartmentID == constant.UnallocatedId {
		db = db.Where("t_data_catalog.source_department_id = ''")
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if *req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" t_data_catalog.title %s", *req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("t_data_catalog.%s %s", *req.Sort, *req.Direction))
	}
	err = db.Find(&catalogs).Error
	return
}

func (d *OpenCatalogRepo) Create(ctx context.Context, catalog *model.TOpenCatalog) error {
	return d.db.WithContext(ctx).Model(&model.TOpenCatalog{}).Create(catalog).Error
}

func (d *OpenCatalogRepo) GetOpenCatalogList(ctx context.Context, req *domain.GetOpenCatalogListReq) (total int64, catalogs []*domain.OpenCatalogVo, err error) {
	db := d.db.WithContext(ctx).Table("t_open_catalog").
		Select("t_open_catalog.id, t_open_catalog.catalog_id, t_open_catalog.audit_advice, t_open_catalog.audit_state, t_data_catalog.title, t_data_catalog.code, t_open_catalog.open_status, t_data_catalog.online_status, t_data_catalog.view_count,t_data_catalog.api_count,t_data_catalog.file_count, t_data_catalog.source_department_id, t_open_catalog.updated_at").
		Joins("JOIN t_data_catalog ON t_open_catalog.catalog_id = t_data_catalog.id").Where("t_open_catalog.deleted_at is null")
	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("t_data_catalog.title like ? or t_data_catalog.code like ? ", keyword, keyword)
	}

	sourceDepartmentId := req.SourceDepartmentID
	if sourceDepartmentId != "" && req.SourceDepartmentID != constant.UnallocatedId {
		db = db.Where("t_data_catalog.source_department_id = ? ", sourceDepartmentId)
	}
	if sourceDepartmentId != "" && req.SourceDepartmentID == constant.UnallocatedId {
		db = db.Where("t_data_catalog.source_department_id = ''")
	}

	if req.UpdatedAtStart != 0 {
		db = db.Where("UNIX_TIMESTAMP(t_open_catalog.updated_at)*1000 >= ?", req.UpdatedAtStart)
	}
	if req.UpdatedAtEnd != 0 {
		db = db.Where("UNIX_TIMESTAMP(t_open_catalog.updated_at)*1000 <= ?", req.UpdatedAtEnd)
	}

	if req.OpenType != 0 {
		db = db.Where("t_open_catalog.open_type = ? ", req.OpenType)
	}

	if req.OpenLevel != 0 {
		db = db.Where("t_open_catalog.open_level = ? ", req.OpenLevel)
	}

	err = db.Count(&total).Error
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if *req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" t_data_catalog.title %s", *req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("t_open_catalog.%s %s", *req.Sort, *req.Direction))
	}
	err = db.Find(&catalogs).Error
	return
}

func (d *OpenCatalogRepo) GetById(ctx context.Context, Id uint64, tx ...*gorm.DB) (catalog *model.TOpenCatalog, err error) {
	err = d.do(tx).WithContext(ctx).Model(&model.TOpenCatalog{}).Where("id = ? and deleted_at is null", Id).Find(&catalog).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return catalog, nil
}

func (d *OpenCatalogRepo) GetByCatalogId(ctx context.Context, catalogId uint64, tx ...*gorm.DB) (catalog *model.TOpenCatalog, err error) {
	err = d.do(tx).WithContext(ctx).Model(&model.TOpenCatalog{}).Where("catalog_id = ? and deleted_at is null", catalogId).Find(&catalog).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return catalog, nil
}

func (d *OpenCatalogRepo) Save(ctx context.Context, catalog *model.TOpenCatalog) error {
	return d.db.WithContext(ctx).Model(&model.TOpenCatalog{}).Where("id = ? and deleted_at is null", catalog.ID).Save(catalog).Error
}

func (d *OpenCatalogRepo) Delete(ctx context.Context, catalog *model.TOpenCatalog, tx ...*gorm.DB) error {
	res := d.do(tx).WithContext(ctx).Model(&model.TOpenCatalog{}).Where("id = ? and deleted_at is null", catalog.ID).Updates(&catalog)
	if res.Error != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, res.Error.Error())
	} else if res.RowsAffected == 0 {
		return errorcode.Desc(errorcode.DataCatalogNotFound)
	}
	return nil
}

func (d *OpenCatalogRepo) GetTotalOpenCatalogCount(ctx context.Context, tx ...*gorm.DB) (count int64, err error) {
	db := d.do(tx).WithContext(ctx)
	// 获取开放目录总数量
	err = db.Model(&model.TOpenCatalog{}).Where("deleted_at is null").Count(&count).Error
	if err != nil {
		return count, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return count, nil
}

func (d *OpenCatalogRepo) GetAuditingOpenCatalogCount(ctx context.Context, tx ...*gorm.DB) (count int64, err error) {
	db := d.do(tx).WithContext(ctx)

	// 获取审核中的开放目录数量
	err = db.Model(&model.TOpenCatalog{}).Where("audit_state = ? and deleted_at is null", constant.AuditStatusAuditing).Count(&count).Error
	if err != nil {
		return count, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return count, nil
}

func (d *OpenCatalogRepo) GetResourceTypeCount(ctx context.Context, tx ...*gorm.DB) (resourceTypeCount []*domain.TypeCatalogCount, err error) {
	db := d.do(tx).WithContext(ctx)

	// 获取不同资源类型数量及占比
	//err = db.Model(&model.TOpenCatalog{}).Select("t_data_catalog.type, COUNT(*) as count").
	//	Joins("JOIN t_data_catalog ON t_open_catalog.catalog_id = t_data_catalog.id").
	//	Where("t_open_catalog.deleted_at is null").
	//	Group("t_data_catalog.type").
	//	Scan(&resourceTypeCount).Error

	err = db.Raw(" SELECT 1 type ,count(view_count) count FROM t_open_catalog  JOIN t_data_catalog ON t_open_catalog.catalog_id = t_data_catalog.id WHERE view_count>0\n UNION\n SELECT 2 type ,count(api_count)count FROM t_open_catalog JOIN t_data_catalog ON t_open_catalog.catalog_id = t_data_catalog.id WHERE api_count>0\n UNION\n SELECT 3 type ,count(file_count)count FROM t_open_catalog  JOIN t_data_catalog ON t_open_catalog.catalog_id = t_data_catalog.id WHERE file_count>0").
		Scan(&resourceTypeCount).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return resourceTypeCount, nil
}

func (d *OpenCatalogRepo) GetMonthlyNewOpenCatalogCount(ctx context.Context, tx ...*gorm.DB) (monthlyNewOpenCatalogCount []*domain.NewOpenCatalogCount, err error) {
	db := d.do(tx).WithContext(ctx)

	// 获取近一年开放目录新增数量(按月统计)
	oneYearAgo := time.Now().AddDate(-1, 0, 0)
	db.Model(&model.TOpenCatalog{}).
		Select("DATE_FORMAT(created_at, '%Y-%m') as month, COUNT(*) as count").
		Where("created_at >= ? and deleted_at is null", oneYearAgo).
		Group("month").
		Order("month").
		Scan(&monthlyNewOpenCatalogCount)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return monthlyNewOpenCatalogCount, nil
}

func (d *OpenCatalogRepo) GetDepartmentCatalogCount(ctx context.Context, tx ...*gorm.DB) (departmentCatalogCountVo []*domain.DepartmentCatalogCount, err error) {
	db := d.do(tx).WithContext(ctx)

	// 获取目录所属部门排行前10的部门id和目录数量
	err = db.Model(&model.TOpenCatalog{}).
		Select("t_data_catalog.department_id, COUNT(*) as count").
		Joins("JOIN t_data_catalog ON t_open_catalog.catalog_id = t_data_catalog.id").
		Where("t_open_catalog.deleted_at is null").
		Group("t_data_catalog.department_id").
		Order("count DESC").
		Limit(10).
		Scan(&departmentCatalogCountVo).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return departmentCatalogCountVo, nil
}

func (d *OpenCatalogRepo) AuditProcessMsgProc(ctx context.Context, catalogID, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error) {
	db := d.do(tx).WithContext(ctx).
		Model(&model.TOpenCatalog{}).
		Where("id = ? and audit_apply_sn = ? and deleted_at is null", catalogID, auditApplySN).
		UpdateColumns(alterInfo)
	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

func (d *OpenCatalogRepo) AuditResultUpdate(ctx context.Context, catalogID, auditApplySN uint64, alterInfo map[string]interface{}, tx ...*gorm.DB) (bool, error) {
	db := d.do(tx).WithContext(ctx).
		Model(&model.TOpenCatalog{}).
		Where("id = ? and audit_apply_sn = ? and audit_state = ? and deleted_at is null", catalogID, auditApplySN, constant.AuditStatusAuditing).
		UpdateColumns(alterInfo)
	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

func (d *OpenCatalogRepo) UpdateAuditStateByProcDefKey(ctx context.Context, procDefKeys []string, tx ...*gorm.DB) (bool, error) {
	db := d.do(tx).WithContext(ctx).
		Model(&model.TOpenCatalog{}).
		Where("proc_def_key in ? and audit_state = ? and deleted_at is null", procDefKeys, constant.AuditStatusAuditing).
		UpdateColumns(map[string]interface{}{
			"audit_state":  constant.AuditStatusUnaudited,
			"audit_advice": "流程被删除，审核撤销",
			"updated_at":   &util.Time{Time: time.Now()},
		})
	return db.RowsAffected > 0, db.Error
}

func (d *OpenCatalogRepo) GetAllCatalogIds(ctx context.Context, tx ...*gorm.DB) (catalogIds []uint64, err error) {

	err = d.do(tx).WithContext(ctx).
		Model(&model.TOpenCatalog{}).
		Select("catalog_id").
		Where("deleted_at is null").
		Scan(&catalogIds).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return catalogIds, nil
}
