package impl

import (
	"context"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_comprehension"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

func NewRepo(data *db.Data, wf workflow.WorkflowInterface) data_comprehension.RepoOp {
	return &repo{
		data: data,
		wf:   wf,
	}
}

type repo struct {
	data *db.Data
	wf   workflow.WorkflowInterface
}

func (r repo) TransactionUpsert(ctx context.Context, tx *gorm.DB, content *model.DataComprehensionDetail) error {
	columns := make([]clause.Column, 0)
	columns = append(columns, clause.Column{Name: "catalog_id"})
	columns = append(columns, clause.Column{Name: "deleted_at"})
	//添加更新
	updateColumns := make([]string, 0)
	updateColumns = append(updateColumns, "details", "code", "mark", "updater_uid", "updated_at", "updater_name", "status", "deleted_at", "apply_id")
	if err := tx.WithContext(ctx).Debug().Clauses(
		clause.OnConflict{
			Columns:   columns,
			DoUpdates: clause.AssignmentColumns(updateColumns),
		}).Create(&content).Error; err != nil {
		return err
	}
	return nil
}
func (r repo) Upsert(ctx context.Context, comprehensionDetail *model.DataComprehensionDetail) error {
	err := r.data.DB.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error

		//if err = r.Audit(ctx, comprehensionDetail, bind, catalogName, audit); err != nil {
		//	return err
		//}
		err = r.TransactionUpsert(ctx, tx, comprehensionDetail)
		if err != nil {
			return err
		}
		return err
	})
	if errorcode.IsErrorCode(err) {
		return err
	}
	if err != nil {
		log.WithContext(ctx).Error(err.Error())
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}
func (r repo) Audit(ctx context.Context, comprehensionDetail *model.DataComprehensionDetail, bind *configuration_center.GetProcessBindByAuditTypeRes, catalogName string) error {
	if bind.ProcDefKey != "" {
		applyID, err := utils.GetUniqueID()
		if err != nil {
			return errorcode.Detail(errorcode.PublicInternalError, err.Error())
		}
		comprehensionDetail.Status = domain.Auditing
		comprehensionDetail.ProcDefKey = bind.ProcDefKey
		comprehensionDetail.ApplyID = applyID
		applyIDs := strconv.FormatUint(applyID, 10)
		uInfo, err := util.GetUserInfo(ctx)
		if err != nil {
			return err
		}
		t := time.Now()

		msg := &wf_common.AuditApplyMsg{
			Process: wf_common.AuditApplyProcessInfo{
				AuditType:  domain.ComprehensionReportAuditType,
				ApplyID:    applyIDs,
				UserID:     uInfo.ID,
				UserName:   uInfo.ID,
				ProcDefKey: bind.ProcDefKey,
			},
			Data: map[string]any{
				"id":             fmt.Sprint(comprehensionDetail.CatalogID),
				"code":           comprehensionDetail.Code,
				"title":          catalogName,
				"submitter":      uInfo.ID,
				"submit_time":    t.UnixMilli(),
				"submitter_name": uInfo.Name,
			},
			Workflow: wf_common.AuditApplyWorkflowInfo{
				TopCsf: 5,
				AbstractInfo: wf_common.AuditApplyAbstractInfo{
					Icon: common.AUDIT_ICON_BASE64,
					Text: "数据理解名称：" + catalogName,
				},
				/*Webhooks: []wf_common.Webhook{
					{
						Webhook:     settings.GetConfig().DepServicesConf.DataCatalogHost + "/api/internal/data-catalog/v1/audits/" + applyIDs + "/auditors?auditGroupType=2",
						StrategyTag: common.OWNER_AUDIT_STRATEGY_TAG,
					},
				},*/
			},
		}

		err = r.wf.AuditApply(msg)
		if err != nil {
			return errorcode.Detail(errorcode.PublicAuditApplyFailedError, err.Error())
		}
	}
	return nil
}
func (r repo) GetStatus(ctx context.Context, catalogId uint64) (detail *model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Select("status", "catalog_id").Where("catalog_id=?", catalogId).Take(&detail).Error
	return
}

//func (r repo) Get(ctx context.Context, id uint64) (detail *model.DataComprehensionDetail, err error) {
//	err = r.data.DB.WithContext(ctx).Where("id=?", id).Take(&detail).Error
//	return
//}
//func (r repo) GetByIds(ctx context.Context, Ids []uint64) (details []*model.DataComprehensionDetail, err error) {
//	err = r.data.DB.WithContext(ctx).Where("id in ?", Ids).Find(&details).Error
//	return
//}

func (r repo) GetCatalogId(ctx context.Context, catalogId uint64) (detail *model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Where("catalog_id=?", catalogId).Take(&detail).Error
	return
}
func (r repo) Get(ctx context.Context, catalogId uint64, taskId string) (detail *model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Where("catalog_id=? and task_id=?", catalogId, taskId).Take(&detail).Error
	return
}

func (r repo) GetByCatalogIds(ctx context.Context, catalogIds []uint64) (details []*model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Where("catalog_id in ?", catalogIds).Find(&details).Error
	return
}
func (r repo) GetByTaskId(ctx context.Context, taskId string) (details []*model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Where("task_id = ?", taskId).Find(&details).Error
	return
}
func (r repo) Delete(ctx context.Context, catalogId uint64) error {
	return r.data.DB.WithContext(ctx).Model(new(model.DataComprehensionDetail)).Delete("catalog_id=?", catalogId).Error
}

// List 获取详情列表，该方法可以选择是否需要detail
func (r repo) List(ctx context.Context, catalogIds ...uint64) (details []*model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Model(new(model.DataComprehensionDetail)).Where("catalog_id in ?", catalogIds).Find(&details).Error
	return
}

func (r repo) ListByPage(ctx context.Context, req *domain.GetReportListReq) (total int64, list []*data_comprehension.ListByPageRes, err error) {
	var db *gorm.DB
	db = r.data.DB.WithContext(ctx).Table("t_data_comprehension_details t").
		Select("t.*,c.department_id").
		Joins("inner join t_data_catalog c on c.id= t.catalog_id").
		Where("t.deleted_at=0 and (status=2 or status=5 )") //deleted_at=0   for count without deleted_at

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("c.title like ? ", keyword)
	}
	if len(req.SubDepartmentIDs) > 0 {
		db.Where("c.department_id in ? ", req.SubDepartmentIDs)
	}
	err = db.Count(&total).Error
	if err != nil {
		return total, list, err
	}
	limit := req.Limit
	offset := limit * (req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	db = db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
	err = db.Scan(&list).Error
	return total, list, err
}

// ListByCodes 获取详情列表，该方法可以选择是否需要detail
func (r repo) ListByCodes(ctx context.Context, catalogCodes ...string) (details []*model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Model(new(model.DataComprehensionDetail)).Where("code in ?", catalogCodes).Find(&details).Error
	return
}

func (r repo) Update(ctx context.Context, detail *model.DataComprehensionDetail) (err error) {
	err = r.data.DB.WithContext(ctx).Where("catalog_id=?", detail.CatalogID).Updates(detail).Error
	return
}

func (r repo) UpdateByAuditType(ctx context.Context, procDefKeys []string, detail *model.DataComprehensionDetail) (err error) {
	err = r.data.DB.WithContext(ctx).Where("proc_def_key in ?", procDefKeys).Updates(detail).Error
	return
}

func (r repo) GetBrief(ctx context.Context, catalogId uint64) (data *model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Omit("details").Where("catalog_id=?", catalogId).Take(&data).Error
	return
}

func (r repo) GetByAppId(ctx context.Context, appId uint64) (data *model.DataComprehensionDetail, err error) {
	err = r.data.DB.WithContext(ctx).Where("apply_id=?", appId).Take(&data).Error
	return
}
func (r repo) GetCatalog(ctx context.Context, req *domain.GetCatalogListReq) (total int64, list []*domain.Catalog, err error) {
	var db *gorm.DB
	db = r.data.DB.WithContext(ctx).Select("c.id catalog_id", "c.title catalog_name").Table("t_data_catalog c ").Joins("LEFT JOIN t_data_comprehension_details t  on t.catalog_id=c.id").Where("t.catalog_id is  null  ")

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("c.title like ? ", keyword)
	}
	db.Where("online_status in ?", constant.OnLineArray)
	err = db.Count(&total).Error
	if err != nil {
		return total, list, err
	}
	limit := req.Limit
	offset := limit * (req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	err = db.Find(&list).Error
	return total, list, err
}
