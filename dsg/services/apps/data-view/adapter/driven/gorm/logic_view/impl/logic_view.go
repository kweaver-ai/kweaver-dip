package impl

import (
	"context"
	"errors"
	"fmt"
	"strconv"
	"time"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	data_classify_attribute_blacklist "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_classify_attribute_blacklist/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/logic_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type logicViewRepo struct {
	db                        *gorm.DB
	wf                        workflow.WorkflowInterface
	configurationCenterDriven configuration_center.Driven
	fieldRepo                 form_view_field.FormViewFieldRepo
	esRepo                    es.ESRepo
}

func NewLogicViewRepo(
	db *gorm.DB,
	wf workflow.WorkflowInterface,
	configurationCenterDriven configuration_center.Driven,
	fieldRepo form_view_field.FormViewFieldRepo,
	esRepo es.ESRepo,
) logic_view.LogicViewRepo {
	return &logicViewRepo{
		db:                        db,
		wf:                        wf,
		configurationCenterDriven: configurationCenterDriven,
		fieldRepo:                 fieldRepo,
		esRepo:                    esRepo,
	}
}

func (l *logicViewRepo) Create(ctx context.Context, formView *model.FormView) error {
	return l.db.WithContext(ctx).Create(formView).Error
}

func (l *logicViewRepo) Update(ctx context.Context, formView *model.FormView) error {
	return l.db.WithContext(ctx).Where("id=?", formView.ID).Updates(formView).Error
}
func (l *logicViewRepo) Delete(ctx context.Context, formView *model.FormView) error {
	return l.db.WithContext(ctx).Delete(formView).Error
}

func (l *logicViewRepo) GetByOwnerId(ctx context.Context, ownerId string) (logicViews []*model.FormView, err error) {
	err = l.db.WithContext(ctx).Where("owner_id=?", ownerId).Find(&logicViews).Error
	return

}
func (l *logicViewRepo) GetBySubjectId(ctx context.Context, subjectId string) (logicViews []*model.FormView, err error) {
	err = l.db.WithContext(ctx).Where("subject_id=?", subjectId).Find(&logicViews).Error
	return
}

func (l *logicViewRepo) GetSubjectDomainIdsByUserId(ctx context.Context, userId string) (subjectDomainIds []string, err error) {
	tx := l.db.WithContext(ctx).Model(&model.FormView{}).Where("owner_id=? and subject_id is not null and subject_id!=''", userId).Pluck("subject_id", &subjectDomainIds)
	if tx.Error != nil {
		log.WithContext(ctx).Error("GetSubjectDomainIdsByUserId", zap.Error(tx.Error))
		return nil, tx.Error
	}
	return
}

func (l *logicViewRepo) UpdateLogicViewAndField(ctx context.Context, formView *model.FormView, formViewFields []*model.FormViewField, req *logic_view.UpdateLogicViewAndFieldReq) (resErr error) {
	resErr = l.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		if err = tx.Where("id =?", formView.ID).Updates(formView).Error; err != nil {
			return err
		}

		//// 更新前保存时间戳字段
		//var businessTimestampField *model.FormViewField
		//err := tx.Table(model.TableNameFormViewField).Where("form_view_id=? and business_timestamp = 1", formView.ID).First(&businessTimestampField).Error
		//if err != nil {
		//	if !errors.Is(err, gorm.ErrRecordNotFound) {
		//		return err
		//	}
		//}

		newFieldIds := make([]string, len(formViewFields))
		for i, field := range formViewFields {
			newFieldIds[i] = field.ID
		}

		if err = tx.Unscoped().Where("form_view_id = ?  and id in ?", formView.ID, newFieldIds).Delete(&model.FormViewField{}).Error; err != nil {
			return err
		}
		if err = tx.Where("form_view_id = ?", formView.ID).Delete(&model.FormViewField{}).Error; err != nil {
			return err
		}
		if err = tx.CreateInBatches(formViewFields, len(formViewFields)).Error; err != nil {
			return err
		}

		if req.BusinessTimestampID != "" {
			//设置时间戳
			if err = tx.Table(model.TableNameFormViewField).Where("form_view_id = ? and id = ?", formView.ID, req.BusinessTimestampID).UpdateColumn("business_timestamp", 1).Error; err != nil {
				return err
			}
			for _, info := range req.Infos {
				if info.ClearAttributeID != "" {
					if err = data_classify_attribute_blacklist.ClearAttribute(tx, &model.DataClassifyAttrBlacklist{
						FormViewID: formView.ID,
						FieldID:    info.ID,
						SubjectID:  info.ClearAttributeID,
					}); err != nil {
						return err
					}
				}
			}
		}

		//// 更新后更新时间戳字段
		//for _, formViewField := range formViewFields {
		//	if businessTimestampField != nil && businessTimestampField.ID == formViewField.ID {
		//		if err = tx.Table(model.TableNameFormViewField).Where("form_view_id = ? and id = ?", businessTimestampField.FormViewID, businessTimestampField.ID).UpdateColumn("business_timestamp", 1).Error; err != nil {
		//			return err
		//		}
		//	}
		//}

		if req.SQL == "" { //excel 类型不需要sql
			return nil
		}
		if err = tx.Where("form_view_id = ?", formView.ID).Updates(&model.FormViewSql{
			FormViewID: formView.ID,
			Sql:        req.SQL,
		}).Error; err != nil {
			return err
		}
		return nil
	})
	return
}

func (l *logicViewRepo) GetLogicViewSQL(ctx context.Context, logicViewId string) (formViewSql []*model.FormViewSql, err error) {
	err = l.db.WithContext(ctx).Where("form_view_id=?", logicViewId).Find(&formViewSql).Error
	return
}
func (l *logicViewRepo) GetLogicViewSQLs(ctx context.Context, logicViewIds []string) (formViewSql []*model.FormViewSql, err error) {
	err = l.db.WithContext(ctx).Where("form_view_id in ?", logicViewIds).Find(&formViewSql).Error
	return
}

func (l *logicViewRepo) CustomLogicEntityViewNameExist(ctx context.Context, businessName string, technicalName string) error {
	var formView *model.FormView
	err := l.db.WithContext(ctx).Where("business_name=?  and publish_at is not null and deleted_at=0",
		businessName).Take(&formView).Error
	if errors.Is(err, gorm.ErrRecordNotFound) {
		err = l.db.WithContext(ctx).Where("technical_name=? and publish_at is not null and deleted_at=0",
			technicalName).Take(&formView).Error
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(my_errorcode.NameRepeat, "技术名称")
	}
	return errorcode.Desc(my_errorcode.NameRepeat, "业务名称")
}

// Get implements logic_view.LogicViewRepo.
func (l *logicViewRepo) Get(ctx context.Context, logicViewId string) (*model.FormView, error) {
	fv := &model.FormView{ID: logicViewId}

	if err := l.db.WithContext(ctx).Debug().Where(fv).First(fv).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		log.WithContext(ctx).Error("logic view not found", zap.String("id", logicViewId))
		return nil, errorcode.Desc(my_errorcode.LogicViewNotFound, logicViewId)
	} else if err != nil {
		log.WithContext(ctx).Error("get logic view fail", zap.Error(err), zap.String("id", logicViewId))
		return nil, errorcode.Detail(my_errorcode.LogicDatabaseError, fmt.Sprintf("get logic view %q fail: %v", logicViewId, err))
	}
	return fv, nil
}

// GetBasicInfo implements logic_view.LogicViewRepo.
func (l *logicViewRepo) GetBasicInfo(ctx context.Context, logicViewId []string) (ds []*model.FormView, err error) {
	if len(logicViewId) <= 0 {
		return make([]*model.FormView, 0), nil
	}
	err = l.db.WithContext(ctx).Debug().Where("id in ?", logicViewId).Find(&ds).Error
	if err != nil {
		log.WithContext(ctx).Error("get logic view basic  fail", zap.Error(err), zap.String("id", fmt.Sprintf("%v", logicViewId)))
		return nil, errorcode.Desc(my_errorcode.LogicDatabaseError)
	}
	return ds, nil
}

// GetByApplyId implements logic_view.LogicViewRepo.
func (l *logicViewRepo) GetByApplyId(ctx context.Context, applyID uint64) (*model.FormView, error) {
	fv := &model.FormView{ApplyID: applyID}

	if err := l.db.WithContext(ctx).Where(fv).First(fv).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		log.WithContext(ctx).Error("logic view not found", zap.Any("applyID", applyID))
		return nil, errorcode.Desc(my_errorcode.LogicViewNotFound, applyID)
	} else if err != nil {
		log.WithContext(ctx).Error("get logic view fail", zap.Error(err), zap.Any("applyID", applyID))
		return nil, errorcode.Detail(my_errorcode.LogicDatabaseError, fmt.Sprintf("get logic view applyID  %q fail: %v", applyID, err))
	}
	return fv, nil
}
func (l *logicViewRepo) GetAuditingInIds(ctx context.Context, logicViewIds []string) (auditingLogicView []*model.FormView, err error) {
	err = l.db.WithContext(ctx).
		Where("id in ?", logicViewIds).
		Where("online_status = ? or online_status =?", constant.LineStatusUpAuditing, constant.LineStatusDownAuditing).
		Find(&auditingLogicView).Error
	if err != nil {
		log.WithContext(ctx).Error("GetAuditingInIds", zap.Error(err))
	}
	return
}

func (l *logicViewRepo) AuditProcessInstanceCreate(ctx context.Context, viewId string, audit *model.FormView) (err error) {
	err = l.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		view := &model.FormView{}
		tx = tx.WithContext(ctx).Model(&model.FormView{}).
			Where(&model.FormView{ID: viewId}).
			Find(view)
		if tx.Error != nil {
			log.WithContext(ctx).Error("AuditProcessInstanceCreate", zap.Error(tx.Error))
			return tx.Error
		}

		tx.Model(&model.FormView{}).Where(&model.FormView{ID: viewId}).Updates(audit)
		if tx.Error != nil {
			log.WithContext(ctx).Error("AuditProcessInstanceCreate", zap.Error(tx.Error))
			return tx.Error
		}

		audit.ID = view.ID
		audit.UniformCatalogCode = view.UniformCatalogCode
		audit.BusinessName = view.BusinessName

		//需审核的流程发送到 workflow
		if audit.AuditStatus == constant.AuditStatusAuditing {
			return l.ProduceWorkflowAuditApply(ctx, audit)
		}

		return nil
	})

	return nil
}

func (l *logicViewRepo) ProduceWorkflowAuditApply(ctx context.Context, audit *model.FormView) (err error) {
	user, err := util.GetUserInfo(ctx)
	t := time.Now()
	msg := &wf_common.AuditApplyMsg{
		Process: wf_common.AuditApplyProcessInfo{
			AuditType:  audit.AuditType,
			ApplyID:    strconv.FormatUint(audit.ApplyID, 10),
			UserID:     user.ID,
			UserName:   user.Name,
			ProcDefKey: audit.ProcDefKey,
		},
		Data: map[string]any{
			"id":                   audit.ID,
			"uniform_catalog_code": audit.UniformCatalogCode,
			"business_name":        audit.BusinessName,
			"submitter_id":         user.ID,
			"submitter_name":       user.Name,
			"submit_time":          t.Format("2006-01-02 15:04:05"),
		},
		Workflow: wf_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: wf_common.AuditApplyAbstractInfo{
				Icon: constant.AuditIconBase64,
				Text: "视图名称：" + audit.BusinessName,
			},
			Webhooks: []wf_common.Webhook{
				{
					Webhook:     "http://data-view:8123/api/internal/data-view/v1/logic-view/" + audit.ID + "/auditors",
					StrategyTag: constant.OwnerAuditStrategyTag,
				},
			},
		},
	}

	err = l.wf.AuditApply(msg)
	if err != nil {
		log.WithContext(ctx).Error("ProduceWorkflowAuditApply", zap.Error(err), zap.Any("msg", msg))
		return err
	}
	log.Info("producer workflow msg", zap.Any("msg", msg))
	return nil
}

func (l *logicViewRepo) ConsumerWorkflowAuditMsg(ctx context.Context, result *wf_common.AuditProcessMsg) error {
	defer func() {
		if r := recover(); r != nil {
			log.Error("【MQ】 ConsumerWorkflowAuditMsg panic", zap.Any("recover", r))
		}
	}()
	_, ok := constant.AuditTypeMap[result.ProcessDef.Category]
	if !ok {
		return nil
	}

	log.Info("consumer workflow audit process msg", zap.String("audit_type", result.ProcessDef.Category), zap.Any("msg", fmt.Sprintf("%#v", result)))

	logicView := map[string]interface{}{
		"apply_id":     result.ProcessInputModel.Fields.ApplyID,
		"flow_id":      result.ProcInstId,
		"audit_advice": l.getAuditAdvice(result.ProcessInputModel.WFCurComment, result.ProcessInputModel.Fields.AuditMsg),
	}

	if result.CurrentActivity == nil {
		if len(result.NextActivity) > 0 {
			logicView["flow_node_id"] = result.NextActivity[0].ActDefId
			logicView["flow_node_name"] = result.NextActivity[0].ActDefName
		} else {
			log.Info("audit result auto finished, do nothing",
				zap.String("audit_type", result.ProcessDef.Category),
				zap.String("apply_id", result.ProcessInputModel.Fields.ApplyID))
		}
	} else if len(result.NextActivity) == 0 {
		if !result.ProcessInputModel.Fields.AuditIdea {
			logicView["audit_status"] = constant.AuditStatusReject
			logicView["audit_advice"] = l.getAuditAdvice(result.ProcessInputModel.WFCurComment, result.ProcessInputModel.Fields.AuditMsg)
		}
	} else {
		if result.ProcessInputModel.Fields.AuditIdea {
			logicView["flow_node_id"] = result.NextActivity[0].ActDefId
			logicView["flow_node_name"] = result.NextActivity[0].ActDefName
		} else {
			logicView["audit_status"] = constant.AuditStatusReject
			logicView["audit_advice"] = l.getAuditAdvice(result.ProcessInputModel.WFCurComment, result.ProcessInputModel.Fields.AuditMsg)
		}
	}

	tx := l.db.Model(&model.FormView{}).Where("apply_id=?", logicView["apply_id"]).Updates(logicView)
	if tx.Error != nil {
		log.Error("ConsumerWorkflowAuditMsg Update", zap.Any("logicView", logicView))
		return tx.Error
	}
	return nil
}

func (l *logicViewRepo) getAuditAdvice(curComment, auditMsg string) string {
	auditAdvice := ""
	if len(curComment) > 0 {
		auditAdvice = curComment
	} else {
		auditAdvice = auditMsg
	}

	// workflow 里不填审核意见时默认是 default_comment, 排除这种情况
	if auditAdvice == "default_comment" {
		auditAdvice = ""
	}

	return auditAdvice
}
func (l *logicViewRepo) ConsumerWorkflowAuditResult(ctx context.Context, auditType string, result *wf_common.AuditResultMsg) error {
	defer func() {
		if r := recover(); r != nil {
			log.Error("【MQ】 consumerWorkflowAuditResult panic", zap.Any("recover", r))
		}
	}()
	t := time.Now()
	formView := &model.FormView{
		UpdatedAt: t,
	}
	applyID, err := strconv.ParseUint(result.ApplyID, 10, 64)
	if err != nil {
		log.Error("logicViewRepo consumerWorkflowAuditResult ParseUint", zap.Any("msg", fmt.Sprintf("%#v", result)))
		return err
	}
	var orgFormView model.FormView
	if err = l.db.Where("apply_id=?", applyID).Take(&orgFormView).Error; err != nil {
		log.Error("logicViewRepo Take Take", zap.Any("msg", fmt.Sprintf("%#v", result)))
	}
	switch result.Result {
	case constant.AuditStatusPass: //审核通过
		formView.AuditStatus = constant.AuditStatusPass
		switch auditType {
		case constant.AuditTypePublish: //TODO: 业务侧状态根据审核结果做更新
			//formView.PublishStatus = constant.PublishStatusPublished
			formView.PublishAt = &t // 更新发布时间
			return nil              //temp
		case constant.AuditTypeOnline:
			formView.OnlineStatus = constant.LineStatusOnLine
			formView.OnlineTime = &t
		case constant.AuditTypeOffline:
			formView.OnlineStatus = constant.LineStatusOffLine
		}
	case constant.AuditStatusReject: // 审核拒绝，结果为reject
		formView.AuditStatus = constant.AuditStatusReject
		switch auditType {
		case constant.AuditTypePublish:
			//formView.PublishStatus = constant.PublishStatusPubReject
			return nil //temp
		case constant.AuditTypeOnline:
			formView.OnlineStatus = constant.LineStatusUpReject
		case constant.AuditTypeOffline:
			formView.OnlineStatus = constant.LineStatusDownReject
		}
	case constant.AuditStatusUndone:
		formView.AuditStatus = constant.AuditStatusUndone
		switch auditType {
		case constant.AuditTypePublish:
			//formView.PublishStatus = constant.PublishStatusUnPublished
			return nil //temp
		case constant.AuditTypeOnline:
			formView.OnlineStatus = constant.LineStatusNotLine
		case constant.AuditTypeOffline:
			if orgFormView.OnlineStatus != constant.LineStatusNotLine { //特殊处理扫描自动下线，撤销审核中，状态不变，为下线；其他情况撤销下线审核还是上线
				formView.OnlineStatus = constant.LineStatusOnLine
			}
		}
	}

	err = l.db.Transaction(func(tx *gorm.DB) error {
		t := tx.Model(formView).
			Where(&model.FormView{ApplyID: applyID}).
			Updates(formView)
		if t.Error != nil {
			log.Error("logicViewRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
			return tx.Error
		}

		t = tx.Model(formView).
			Where(&model.FormView{ApplyID: applyID}).
			Take(&formView)
		if t.Error != nil {
			log.Error("logicViewRepo consumerWorkflowAuditResult Update", zap.Any("msg", fmt.Sprintf("%#v", result)))
			return tx.Error
		}

		if result.Result == constant.AuditStatusPass {
			//变更审核通过的时候：
		}

		//发布审核通过、上线审核通过、变更审核通过后，创建es索引
		if (auditType == constant.AuditTypePublish || auditType == constant.AuditTypeOnline || auditType == constant.AuditTypeOffline) && formView.AuditStatus == constant.AuditStatusPass {
			fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
			viewFieldList, err := l.fieldRepo.GetFormViewFieldList(ctx, formView.ID)
			if err != nil {
				return err
			}
			for _, field := range viewFieldList {
				fieldObj := &es.FieldObj{
					FieldNameZH: field.BusinessName,
					FieldNameEN: field.TechnicalName,
				}
				fieldObjs = append(fieldObjs, fieldObj)
			}
			return l.esRepo.PubToES(ctx, formView, fieldObjs) //发布审核通过、上线审核通过、变更审核通过后，创建es索引
		}

		//改为撤销发布删除es索引
		//下线通过
		//if auditType == enum.AuditTypeOffline && service.AuditStatus == enum.AuditStatusPass {
		//删除es索引
		//	err := r.ServiceESIndexDelete(context.Background(), service)
		//	if err != nil {
		//		return err
		//	}

		//撤销正处在审核中的申请
		//	err = r.RequestApplyCancel(context.Background(), service.ServiceID)
		//	return err
		//}

		return nil
	})
	return err
}

func (l *logicViewRepo) ConsumerWorkflowAuditProcDelete(ctx context.Context, auditType string, result *wf_common.AuditProcDefDelMsg) error {
	defer func() {
		if r := recover(); r != nil {
			log.Error("【MQ】 consumerWorkflowAuditProcDelete panic", zap.Any("recover", r))
		}
	}()
	if len(result.ProcDefKeys) == 0 {
		return nil
	}
	// 撤销正在进行的审核
	formView := &model.FormView{
		AuditStatus: constant.AuditStatusReject,
		AuditAdvice: "流程删除，审核撤销",
	}
	tx := l.db.Model(&model.FormView{}).
		Where("audit_type = ?", auditType).
		Where("audit_status = ?", constant.AuditStatusAuditing).
		Where("proc_def_key in ?", result.ProcDefKeys).
		Updates(formView)
	if tx.Error != nil {
		log.Error("consumerWorkflowAuditProcDelete Updates FormView failed: ", zap.Error(tx.Error), zap.Any("msg", fmt.Sprintf("%#v", result)))
	}
	//删除审核流程绑定
	for _, procDefKey := range result.ProcDefKeys {
		err := l.configurationCenterDriven.DeleteProcessBindByAuditType(context.Background(), &configuration_center.DeleteProcessBindByAuditTypeReq{
			AuditType: procDefKey,
		})
		if err != nil {
			log.Error("consumerWorkflowAuditProcDelete configuration-center DeleteProcessBindByAuditType failed: ", zap.Error(tx.Error), zap.Any("msg", fmt.Sprintf("%#v", result)))
		}
	}
	return nil
}

// GetPushView 2.0.0.5版本升级接口，发布后不可修改
func (l *logicViewRepo) GetPushView(ctx context.Context) (logicViews []*model.FormView, err error) {
	err = l.db.WithContext(ctx).Find(&logicViews).Error
	return
}
func (l *logicViewRepo) ViewsCatalogs(ctx context.Context, ids []string) (count []*logic_view.ViewsCatalogs, err error) {
	sql := `
		SELECT r.resource_id ,c.id ,c.title name,c.apply_num, c.department_id 
		from af_data_catalog.t_data_resource r 
		inner join af_data_catalog.t_data_catalog c on r.catalog_id = c.id 
		where r.type = 1 and r.resource_id in  ?
	`
	if err = l.db.WithContext(ctx).Raw(sql, ids).Scan(&count).Error; err != nil {
		return
	}
	return
}
