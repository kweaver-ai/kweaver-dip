package impl

import (
	"context"
	"fmt"
	"time"

	"github.com/samber/lo"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"

	"github.com/kweaver-ai/idrm-go-common/middleware"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

const (
	historyInsetSql = `INSERT INTO t_data_catalog_history (
		id, code, title, group_id, group_name, 
		theme_id, theme_name, forward_version_id, description, version, 
		data_range, update_cycle, data_kind, shared_type, shared_condition, 
		open_type, open_condition, shared_mode, physical_deletion, sync_mechanism, 
		sync_frequency, table_count, file_count, state, flow_node_id, 
		flow_node_name, audit_type, flow_id, flow_name, flow_version, 
		orgcode, orgname, creator_uid,  updated_at, 
		updater_uid,  source, table_type, current_version, 
		publish_flag, data_kind_flag, label_flag, src_event_flag, rel_event_flag, 
		system_flag, rel_catalog_flag, created_at,  
		audit_apply_sn, audit_advice, owner_id, owner_name, 
		audit_state, proc_def_key, flow_apply_id) 
	  SELECT 
		id, code, title, group_id, group_name, 
		theme_id, theme_name, forward_version_id, description, version, 
		data_range, update_cycle, data_kind, shared_type, shared_condition, 
		open_type, open_condition, shared_mode, physical_deletion, sync_mechanism, 
		sync_frequency, table_count, file_count, state, flow_node_id, 
		flow_node_name, audit_type, flow_id, flow_name, flow_version, 
		orgcode, orgname, creator_uid,  updated_at, 
		updater_uid,  source, table_type, current_version, 
		publish_flag, data_kind_flag, label_flag, src_event_flag, rel_event_flag, 
		system_flag, rel_catalog_flag, created_at, ?, ?, 
		?, audit_apply_sn, audit_advice, owner_id, owner_name, 
		audit_state, proc_def_key, flow_apply_id    
	  FROM t_data_catalog 
	  WHERE id = ? 
	  		and state = 1 
	  		and ((audit_type is null and audit_state is null) or (audit_type = 4 and audit_state = 3));`
	pubOrEditApplyCondition = `(
		(state = 1 
			and (
					(audit_type is null and audit_state is null) 
				 or (audit_type = 4 and audit_state = 3)
				)
		) 
	 or (state = 8 
			and (
					(audit_type = 3 and audit_state = 2) 
				 or (audit_type = 4 and audit_state = 3)
				)
		)
	)`
	onlineApplyCondition = `(
		state = 3 
			and (
					(audit_type = 4 and audit_state = 2) 
				 or (audit_type = 1 and audit_state = 3)
				)
	)`
	offlineApplyCondition = `(
		state = 5 
			and (
					(audit_type = 1 and audit_state = 2) 
				 or (audit_type = 3 and audit_state = 3)
				)
	)`
)

func NewRepo(data *db.Data) data_catalog.RepoOp {
	return &repo{data: data}
}

type repo struct {
	data *db.Data
}

func (r *repo) do(tx *gorm.DB, ctx context.Context) *gorm.DB {
	if tx == nil {
		return r.data.DB.WithContext(ctx)
	}
	return tx
}
func (r *repo) Get(tx *gorm.DB, ctx context.Context, id uint64) (catalog *model.TDataCatalog, err error) {
	catalogs := make([]*model.TDataCatalog, 0)
	err = r.do(tx, ctx).Where("id = ? ", id).Find(&catalogs).Error
	if err != nil {
		return nil, err
	}
	if len(catalogs) <= 0 {
		return nil, fmt.Errorf("record %v not found", id)
	}
	return catalogs[0], nil
}
func (r *repo) Insert(tx *gorm.DB, ctx context.Context, catalog *model.TDataCatalog) error {
	return r.do(tx, ctx).Model(&model.TDataCatalog{}).Create(catalog).Error
}

func (r *repo) DeleteIntoHistory(tx *gorm.DB, ctx context.Context, catalogID uint64, uInfo *middleware.User) (bool, error) {
	db := r.do(tx, ctx).Exec(historyInsetSql, time.Now(), uInfo.ID, uInfo.Name, catalogID)
	if db.Error == nil && db.RowsAffected > 0 {
		catalog := &model.TDataCatalog{ID: catalogID}
		db = db.Model(catalog).Delete(catalog)
	}

	return db.RowsAffected > 0, db.Error
}

func (r *repo) Update(tx *gorm.DB, ctx context.Context, catalog *model.TDataCatalog) (bool, error) {
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Where("id = ?", catalog.ID).
		Where(pubOrEditApplyCondition).
		Save(catalog)
	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

func (r *repo) GetComprehensionCatalogList(tx *gorm.DB, ctx context.Context,
	page *request.PageInfo,
	comprehensionState []int8,
	catalogIds []uint64,
	req *request.CatalogListReqBase,
	orgCodes []string,
	catagoryIds []string,
	businessDomainIDs []string,
	excludeCatalogIds []uint64) (catalogs []*data_catalog.ComprehensionCatalogListItem, totalCount int64, err error) {
	catalogTableName, dataComprehensionTableName, resMountTableName := new(model.TDataCatalog).TableName(), new(model.DataComprehensionDetail).TableName(), new(model.TDataCatalogResourceMount).TableName()
	db := r.do(tx, ctx).Table(catalogTableName + "  d").Select(
		`d.id, d.code, d.title, d.version, d.data_kind, d.state,
				d.flow_node_id, d.flow_node_name, d.audit_type, d.flow_id, 
				d.flow_name, d.flow_version, d.orgcode, d.orgname, d.table_count,
				d.file_count, d.created_at, d.updated_at, d.table_type, 
				d.source, d.description, d.owner_id, d.owner_name,
				c.status as comprehension_status, c.updated_at as comprehension_update_time`).
		Joins(" left join " + " (select * from " + dataComprehensionTableName + " where deleted_at=0) " + "  c on d.id = c.catalog_id ")
	if *page.Sort == "mount_source_name" {
		db = db.Joins(" left join " + " (select res_id, res_name, code from " + resMountTableName + " where res_type = 1) " + " e on d.code = e.code")
	}

	if req.State > 0 {
		db = db.Where("d.state = ?", req.State)
	}

	if req.OwnerID != "" {
		db = db.Where("owner_id = ?", req.OwnerID)
	}

	if len(comprehensionState) > 0 {
		if lo.Contains(comprehensionState, 1) {
			db = db.Where("c.status is null OR c.status in  ?", comprehensionState)
		} else {
			db = db.Where("c.status in  ?", comprehensionState)
		}
	}

	if len(catalogIds) > 0 {
		db = db.Where("d.id in  ?", catalogIds)
	}

	if len(excludeCatalogIds) > 0 {
		db = lo.IfF(len(excludeCatalogIds) == 1, func() *gorm.DB {
			return db.Where("d.id!=?", excludeCatalogIds[0])
		}).ElseF(func() *gorm.DB {
			return db.Where("d.id not in ?", excludeCatalogIds)
		})
	}

	if req.SharedType > 0 {
		db = db.Where("d.shared_type = ?", req.SharedType)
	}

	db = db.Where("d.current_version = 1")

	if len(orgCodes) > 0 {
		db = db.Where("d.orgcode in ?", orgCodes)
	}

	if len(catagoryIds) > 0 {
		db = db.Where("d.group_id in ?", catagoryIds)
	}

	switch req.ResType {
	case 1:
		db = db.Where("d.table_count > 0")
	case 2:
		db = db.Where("d.file_count > 0")
	}

	if req.DataKind > 0 {
		db = db.Where("d.data_kind & ? > 0", req.DataKind)
	}

	if len(req.Keyword) > 0 {
		kw := util.KeywordEscape(req.Keyword)
		db = db.Where("(d.title like concat('%',?,'%') or d.code like concat('%',?,'%'))", kw, kw)
	}

	if len(businessDomainIDs) > 0 {
		db = db.Where("d.id in (select distinct catalog_id from t_data_catalog_info where info_type = 6 and info_key in ?)", businessDomainIDs)
	}

	db = db.Count(&totalCount)
	if db.Error == nil {
		if *page.Sort == "name" {
			db = db.Order("d.title " + *(page.Direction))
		} else if *page.Sort == "mount_source_name" {
			db = db.Order("e.res_name " + *(page.Direction))
		} else {
			db = db.Order("c." + *(page.Sort) + " " + *(page.Direction))
		}
		db = db.Order("d.id " + *(page.Direction))
		if *page.Limit > 0 {
			db = db.Offset((*(page.Offset) - 1) * *(page.Limit)).Limit(*(page.Limit))
		}
		db = db.Scan(&catalogs)
	}

	//for _, catalog := range catalogs {
	//	if catalog.State < 1 {
	//		catalog.State = 1
	//	}
	//}
	return catalogs, totalCount, db.Error
}

func (r *repo) GetList(tx *gorm.DB, ctx context.Context, page *request.PageInfo, catalogIds []uint64,
	req *request.CatalogListReqBase, orgcodes, catagoryIDs, businessDomainIDs []string, excludeCatalogIds []uint64) ([]*data_catalog.ComprehensionCatalogListItem, int64, error) {
	var catalogs []*data_catalog.ComprehensionCatalogListItem
	var totalCount int64
	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).Select(`id, code, title, version, data_kind, state, flow_node_id, flow_node_name, audit_type, flow_id, 
		flow_name, flow_version, orgcode, orgname, table_count, file_count, created_at, updated_at, table_type, source, owner_id, owner_name, audit_state, 
		creator_uid`)

	if req.State > 0 {
		db = db.Where("state = ?", req.State)
	}

	if req.OwnerID != "" {
		db = db.Where("owner_id = ?", req.OwnerID)
	}

	if len(catalogIds) > 0 {
		db = db.Where("id in  ?", catalogIds)
	}

	if len(excludeCatalogIds) > 0 {
		db = lo.IfF(len(excludeCatalogIds) == 1, func() *gorm.DB {
			return db.Where("id!=?", excludeCatalogIds[0])
		}).ElseF(func() *gorm.DB {
			return db.Where("id not in ?", excludeCatalogIds)
		})
	}

	switch req.FlowType {
	case -1:
		db = db.Where("audit_type is null")
	case 1, 2, 3, 4:
		db = db.Where("audit_type = ?", req.FlowType)
	}

	switch req.AuditState {
	case -1:
		db = db.Where("audit_state is null")
	case 1, 2, 3:
		db = db.Where("audit_state = ?", req.AuditState)
	}

	if req.SharedType > 0 {
		db = db.Where("shared_type = ?", req.SharedType)
	}

	db = db.Where("current_version = 1")

	if len(orgcodes) > 0 {
		db = db.Where("orgcode in ?", orgcodes)
	}

	if len(catagoryIDs) > 0 {
		db = db.Where("group_id in ?", catagoryIDs)
	}

	switch req.ResType {
	case 1:
		db = db.Where("table_count > 0")
	case 2:
		db = db.Where("file_count > 0")
	}

	if req.DataKind > 0 {
		db = db.Where("data_kind & ? > 0", req.DataKind)
	}

	if len(req.Keyword) > 0 {
		kw := util.KeywordEscape(req.Keyword)
		db = db.Where("(title like concat('%',?,'%') or code like concat('%',?,'%'))", kw, kw)
	}

	if len(businessDomainIDs) > 0 {
		db = db.Where("id in (select distinct catalog_id from t_data_catalog_info where info_type = 6 and info_key in ?)", businessDomainIDs)
	}

	db = db.Count(&totalCount)
	if db.Error == nil {
		if *page.Sort == "name" {
			*page.Sort = "title"
		}
		db = db.Order(*(page.Sort) + " " + *(page.Direction)).Order("id " + *(page.Direction))
		if *page.Limit > 0 {
			db = db.Offset((*(page.Offset) - 1) * *(page.Limit)).Limit(*(page.Limit))
		}
		db = db.Scan(&catalogs)
	}

	return catalogs, totalCount, db.Error
}

func (r *repo) GetDetail(tx *gorm.DB, ctx context.Context, id uint64, orgcodes []string) (*model.TDataCatalog, error) {
	var catalog *model.TDataCatalog
	db := r.do(tx, ctx).Model(&model.TDataCatalog{})
	db = db.Where("id = ?", id)
	if len(orgcodes) > 0 {
		db = db.Where("orgcode in ?", orgcodes)
	}
	db.Take(&catalog)
	return catalog, db.Error
}

func (r *repo) GetDetailByCode(tx *gorm.DB, ctx context.Context, code string) (*model.TDataCatalog, error) {
	var catalog *model.TDataCatalog
	db := r.do(tx, ctx).Model(&model.TDataCatalog{})
	db = db.Where("code = ? and current_version = 1", code)
	db.Take(&catalog)
	return catalog, db.Error
}

func (r *repo) GetDetailByIds(tx *gorm.DB, ctx context.Context, departmentIDSlice []string, ids ...uint64) ([]*model.TDataCatalog, error) {
	catalogs := make([]*model.TDataCatalog, 0)
	db := r.do(tx, ctx).Model(&model.TDataCatalog{})
	db = db.Where("id in ?", ids)
	if len(departmentIDSlice) > 0 {
		db = db.Where("department_id in ?", departmentIDSlice)
	}
	db.Find(&catalogs)
	return catalogs, db.Error
}

func (r *repo) GetDetailWithComprehensionByIds(tx *gorm.DB, ctx context.Context, ids ...uint64) (datas []*data_catalog.ComprehensionCatalogListItem, err error) {
	catalogTableName, dataComprehensionTableName := new(model.TDataCatalog).TableName(), new(model.DataComprehensionDetail).TableName()
	tx = r.do(tx, ctx).Table(catalogTableName + "  d").Select(`d.*, c.status as comprehension_status`).
		Joins(" left join " + " (select * from " + dataComprehensionTableName + " where deleted_at=0) " + "  c on d.id = c.catalog_id ")

	tx = tx.Where("id in ?", ids)
	tx.Find(&datas)
	return datas, tx.Error
}

func (r *repo) TitleValidCheck(tx *gorm.DB, ctx context.Context, code string, title string) (bool, error) {
	var rowCount int64
	db := r.do(tx, ctx).Model(&model.TDataCatalog{})
	if len(code) > 0 {
		db = db.Where("code != ?", code)
	}
	db = db.Where("title = ?", title).Count(&rowCount)
	return rowCount > 0, db.Error
}

func (r *repo) GetEXUnindexList(tx *gorm.DB, ctx context.Context) ([]*model.TDataCatalog, error) {
	var catalogs []*model.TDataCatalog
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Select(`id, code, title, description, group_id, orgcode, orgname, shared_type, data_kind, data_range, update_cycle, published_at, updated_at, publish_flag, open_type, state, owner_name, owner_id`).
		Where("is_indexed = 0 and current_version = 1 and table_count > 0").Order("code asc, id desc").Scan(&catalogs)
	return catalogs, db.Error
}

func (r *repo) UpdateIndexFlag(tx *gorm.DB, ctx context.Context, catalogID uint64, updatedAt *util.Time) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).Where("id = ? and updated_at = ?", catalogID, updatedAt)
	db = db.UpdateColumn("is_indexed", 1)
	return db.RowsAffected > 0, db.Error
}

func (r *repo) UpdateAuditStateByProcDefKey(tx *gorm.DB, ctx context.Context, auditType string, procDefKeys []string) (bool, error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).
		Where("audit_type = ? and proc_def_key in ? and audit_state = 1", auditType, procDefKeys).
		UpdateColumns(map[string]interface{}{
			"audit_state":  3,
			"audit_advice": "流程被删除，审核撤销",
			"updated_at":   &util.Time{Time: time.Now()},
		})
	return db.RowsAffected > 0, db.Error
}

func (r *repo) GetBusinessObjectList(tx *gorm.DB, ctx context.Context, page *request.BOPageInfo,
	req *request.BusinessObjectListReqBase, businessDomainIDs []string, orgCodes []string) ([]*data_catalog.BusinessObjectListItem, int64, error) {
	var catalogs []*data_catalog.BusinessObjectListItem
	var totalCount int64
	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).
		Select(
			`t_data_catalog.id as ID, t_data_catalog.title as Name, 
		 	 t_data_catalog.description as Description, t_data_catalog.orgcode as Orgcode, 
		 	 t_data_catalog.orgname as Orgname, t_data_catalog.updated_at as UpdatedAt, 
		 	 b.info_key as SystemID, b.info_value as SystemName, 
		 	 t_data_catalog.code as Code`).
		Where("state = 5 and current_version = 1 and table_count > 0")

	if len(orgCodes) > 0 {
		db = db.Where("orgcode in ?", orgCodes)
	}

	if len(req.Keyword) > 0 {
		kw := util.KeywordEscape(req.Keyword)
		db = db.Where("(title like concat('%',?,'%') or description like concat('%',?,'%'))", kw, kw)
	}

	if len(businessDomainIDs) > 0 {
		db = db.Where("t_data_catalog.id in (select distinct catalog_id from t_data_catalog_info where info_type = 6 and info_key in ?)", businessDomainIDs)
	}

	db = db.Joins(`LEFT JOIN (select catalog_id, info_key, info_value from t_data_catalog_info where info_type = 4) as b 
					ON t_data_catalog.id = b.catalog_id`)
	if len(req.SystemID) > 0 {
		db.Where("b.info_key = ?", req.SystemID)
	}

	db = db.Count(&totalCount)
	if db.Error == nil {
		db = db.Order(*(page.Sort) + " " + *(page.Direction)).Offset((*(page.Offset) - 1) * *(page.Limit)).Limit(*(page.Limit)).Scan(&catalogs)
	}
	return catalogs, totalCount, db.Error
}

func (r *repo) GetOnlineBusinessObjectList(tx *gorm.DB, ctx context.Context) (catalogs []*model.TDataCatalog, totalCount int64, err error) {
	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).Where("state = 5 and current_version = 1 and table_count > 0").Scan(&catalogs)
	db = db.Count(&totalCount)
	return catalogs, totalCount, db.Error
}

func (r *repo) AuditResultUpdate(tx *gorm.DB, ctx context.Context, auditType string, catalogID, auditApplySN uint64, alterInfo map[string]interface{}) (bool, error) {
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Where("id = ? and audit_apply_sn = ? and audit_type = ?", catalogID, auditApplySN, auditType).
		UpdateColumns(alterInfo)
	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

func (r *repo) AuditApplyUpdate(tx *gorm.DB, ctx context.Context, catalogID uint64, flowType int, alterInfo map[string]interface{}) (bool, error) {
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Where("id = ? and current_version = 1", catalogID)

	conditions := ""
	switch flowType {
	case 1:
		conditions = onlineApplyCondition
	case 3:
		conditions = offlineApplyCondition
	case 4:
		conditions = pubOrEditApplyCondition
	}

	if len(conditions) == 0 {
		return false, nil
	}

	db = db.Where(conditions).
		UpdateColumns(alterInfo)

	if db.Error == nil {
		return db.RowsAffected > 0, nil
	}
	return false, db.Error
}

func (r *repo) GetCatalogIDByCode(tx *gorm.DB, ctx context.Context, codes []string) ([]*model.TDataCatalog, error) {
	var catalogs []*model.TDataCatalog
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Select("id, code").
		Where("code in ? and current_version = 1", codes).
		Scan(&catalogs)
	return catalogs, db.Error
}

func (r *repo) GetByCodes(tx *gorm.DB, ctx context.Context, codes []string) ([]*model.TDataCatalog, error) {
	var catalogs []*model.TDataCatalog
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Where("code in ? and (current_version = 1 and table_count > 0)", codes).
		Scan(&catalogs)
	return catalogs, db.Error
}

/*
func (r *repo) GetTopList(tx *gorm.DB, ctx context.Context, topNum int, dimension string) ([]*data_catalog.BusinessObjectListItem, error) {
	var catalogs []*data_catalog.BusinessObjectListItem
	db := r.do(tx, ctx).Model(&model.TDataCatalog{}).
		Select(
			`t_data_catalog.id as ID, t_data_catalog.title as Name,
		 	 t_data_catalog.description as Description, t_data_catalog.orgcode as Orgcode,
		 	 t_data_catalog.orgname as Orgname, t_data_catalog.updated_at as UpdatedAt,
		 	 t_data_catalog.code as Code, b.apply_num as ApplyNum, b.preview_num as PreviewNum,
			 t_data_catalog.owner_id as OwnerID, t_data_catalog.owner_name as OwnerName`).
		Where("state = 5 and current_version = 1 and table_count > 0").
		Joins("INNER JOIN (select code, apply_num, preview_num from t_data_catalog_stats_info where " +
			dimension + " > 0) as b ON t_data_catalog.code = b.code")
	db = db.Order(dimension + " desc, ID asc").Limit(topNum).Offset(0).Scan(&catalogs)
	return catalogs, db.Error
}
*/

func (r *repo) GetOfflineWaitProcList(tx *gorm.DB, ctx context.Context) ([]string, error) {
	var codes []string
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Distinct("code").
		Where("state != 5 and current_version = 1 and is_canceled = 0 and table_count > 0").Scan(&codes)
	return codes, db.Error
}

func (r *repo) CancelFlagUpdate(tx *gorm.DB, ctx context.Context, code string, alterInfo map[string]interface{}) (bool, error) {
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		Where("code = ? and current_version = 1 and state != 5", code).
		UpdateColumns(alterInfo)
	return db.RowsAffected > 0, db.Error
}

func (r *repo) GetListByOrgCode(tx *gorm.DB, ctx context.Context, orgCode string) ([]*model.TDataCatalog, error) {
	var catalogs []*model.TDataCatalog
	db := r.do(tx, ctx).
		Model(&model.TDataCatalog{}).
		//Select("id, code, title").
		Where("department_id = ?", orgCode).
		Scan(&catalogs)
	return catalogs, db.Error
}
