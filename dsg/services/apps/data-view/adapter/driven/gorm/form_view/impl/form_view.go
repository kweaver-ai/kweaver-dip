package impl

import (
	"context"
	"database/sql"
	"errors"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/samber/lo"

	data_classify_attribute_blacklist "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_classify_attribute_blacklist/impl"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/google/uuid"
	"go.uber.org/zap"
	"gorm.io/gorm"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type formViewRepo struct {
	db                         *gorm.DB
	esRepo                     es.ESRepo
	drivenVirtualizationEngine virtualization_engine.DrivenVirtualizationEngine
}

func NewFormViewRepo(db *gorm.DB, esRepo es.ESRepo, drivenVirtualizationEngine virtualization_engine.DrivenVirtualizationEngine) form_view.FormViewRepo {
	return &formViewRepo{db: db, esRepo: esRepo, drivenVirtualizationEngine: drivenVirtualizationEngine}
}
func (f *formViewRepo) Db() *gorm.DB {
	return f.db
}
func (f *formViewRepo) do(tx []*gorm.DB) *gorm.DB {
	if len(tx) > 0 && tx[0] != nil {
		return tx[0]
	}
	return f.db
}
func (r *formViewRepo) GetFormViewById(ctx context.Context, id string) (formView *model.FormView, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("id =? and deleted_at=0", id).Take(&formView).Error
	return
}
func (r *formViewRepo) GetById(ctx context.Context, id string, tx ...*gorm.DB) (formView *model.FormView, err error) {
	err = r.do(tx).WithContext(ctx).Table(model.TableNameFormView).Where("id =? and deleted_at=0", id).Take(&formView).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(my_errorcode.FormViewIdNotExist)
		}
		log.WithContext(ctx).Error("formViewRepo GetById DatabaseError", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return
}

// GetExistedViewByID 获取formView 信息，删除的也算
func (r *formViewRepo) GetExistedViewByID(ctx context.Context, id string) (*model.FormView, error) {
	form := new(model.FormView)
	err := r.db.WithContext(ctx).Debug().Where("id=? ", id).Unscoped().Take(form).Error
	return form, err
}

func (r *formViewRepo) PageList(ctx context.Context, req *domain.PageListFormViewReq) (total int64, formView []*model.FormView, err error) {
	/*	var typeName string
		if req.DatasourceId != "" {
			if err = r.db.WithContext(ctx).Select("type_name").Table(model.TableNameDatasource).Where("id =?", req.DatasourceId).Take(&typeName).Error; err != nil {
				log.WithContext(ctx).Error("formViewRepo GetById DatabaseError", zap.Error(err))
			}
		}*/

	var db *gorm.DB
	db = r.db.WithContext(ctx).Table("form_view f").Where("f.deleted_at=0") //deleted_at=0   for count without deleted_at

	/*	if req.Type == constant.FormViewTypeDatasource.String && req.DatasourceType != constant.ExcelTypeName && typeName != constant.ExcelTypeName {
			if req.TaskId == "" {
				req.TaskId = constant.ManagementScanner
			}
			db = db.Joins("INNER JOIN scan_record r  ON f.datasource_id = r.datasource_id").
				Where("r.scanner=?", req.TaskId)
		}
	*/
	if req.InfoSystemID != nil && *req.InfoSystemID != "" {
		if *req.InfoSystemID == constant.UnallocatedId {
			db = db.Where("f.info_system_id is null or f.info_system_id =''")
		} else {
			db = db.Where("f.info_system_id = ?", *req.InfoSystemID)
		}
	}
	if req.Type != "" {
		db = db.Where("f.type = ?", enum.ToInteger[constant.FormViewType](req.Type).Int32())
	}
	if req.Status != "" {
		db = db.Where("f.status = ?", enum.ToInteger[constant.FormViewScanStatus](req.Status).Int32())
	}
	if len(req.StatusList) > 0 {
		db = db.Where("f.status in ?", req.StatusList)
	}
	if req.PublishStatus != "" && req.PublishStatus == constant.FormViewReleased.String {
		db = db.Where("f.publish_at IS NOT NULL")
	}
	if req.PublishStatus != "" && req.PublishStatus == constant.FormViewUnreleased.String {
		db = db.Where("f.publish_at IS NULL")
	}

	if req.EditStatus != "" {
		db = db.Where("f.edit_status = ?", enum.ToInteger[constant.FormViewEditStatus](req.EditStatus).Int32())
	}
	if req.CreatedAtStart != 0 {
		db = db.Where("UNIX_TIMESTAMP(f.created_at)*1000 >= ?", req.CreatedAtStart)
	}
	if req.CreatedAtEnd != 0 {
		db = db.Where("UNIX_TIMESTAMP(f.created_at)*1000 <= ?", req.CreatedAtEnd)
	}
	if req.UpdatedAtStart != 0 {
		db = db.Where("UNIX_TIMESTAMP(f.updated_at)*1000 >= ?", req.UpdatedAtStart)
	}
	if req.UpdatedAtEnd != 0 {
		db = db.Where("UNIX_TIMESTAMP(f.updated_at)*1000 <= ?", req.UpdatedAtEnd)
	}

	if req.DatasourceId != "" {
		db = db.Where("f.datasource_id = ?", req.DatasourceId)
	}
	if len(req.DatasourceIds) != 0 {
		db = db.Where("f.datasource_id in ?", req.DatasourceIds) //类型筛选加id筛选
	}
	if len(req.FormViewIds) != 0 {
		db = db.Where("f.id in ?", req.FormViewIds)
	}
	if req.MdlID != "" {
		db = db.Where("f.mdl_id = ?", req.MdlID)
	}

	if req.SubjectID == constant.UnallocatedId {
		db = db.Where("f.subject_id is null  or f.subject_id =''")
	}
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId && req.IncludeSubSubject {
		db = db.Where("f.subject_id in ?", req.SubSubSubjectIDs)
	}
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId && !req.IncludeSubSubject {
		db = db.Where("f.subject_id = ?", req.SubjectID)
	}

	if req.DepartmentID == constant.UnallocatedId {
		db = db.Where("f.department_id is null or f.department_id =''")
	}
	if (req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId && req.IncludeSubDepartment) || req.MyDepartmentResource {
		db = db.Where("f.department_id in ?", req.SubDepartmentIDs)
	}
	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId && !req.IncludeSubDepartment {
		db = db.Where("f.department_id = ?", req.DepartmentID)
	}

	if len(req.OwnerIDs) != 0 {
		var ownerIDStr string
		for _, ownerID := range req.OwnerIDs {
			ownerIDStr = ownerIDStr + " f.owner_id like  '%" + ownerID + "%' or "
		}
		ownerIDStr = strings.TrimRight(ownerIDStr, "or ")
		if req.NotHaveOwner {
			db = db.Where(ownerIDStr+" or  f.owner_id is null or f.owner_id =''", req.OwnerIDs)
		} else {
			db = db.Where(ownerIDStr)
		}
	} else {
		if req.NotHaveOwner {
			db = db.Where("f.owner_id is null")
		}
	}
	if req.OwnerID != "" {
		if req.QueryAuthed {
			db = db.Where("f.owner_id like ? or f.id in ? ", "%"+req.OwnerID+"%", req.AuthedViewID)
		} else {
			db = db.Where("f.owner_id like ?", "%"+req.OwnerID+"%")
		}
	}
	if req.OnlineStatus != "" {
		db = db.Where("f.online_status = ?", req.OnlineStatus)
	}
	if len(req.OnlineStatusList) > 0 {
		db = db.Where("f.online_status in ?", req.OnlineStatusList)
	}
	if req.AuditStatus != "" {
		db = db.Where("f.audit_status = ?", req.AuditStatus)
	}
	if req.ExcelFileName != "" {
		db = db.Where("f.excel_file_name = ?", req.ExcelFileName)
	}
	if req.TechnicalName != "" {
		db = db.Where("f.technical_name = ?", req.TechnicalName)
	}
	if req.UpdateCycle != nil {
		db = db.Where("f.update_cycle = ?", *req.UpdateCycle)
	}
	if req.SharedType != nil {
		db = db.Where("f.shared_type = ?", *req.SharedType)
	}
	if req.OpenType != nil {
		db = db.Where("f.open_type = ?", *req.OpenType)
	}
	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("f.technical_name like ? or f.business_name like ? or f.uniform_catalog_code like ?", keyword, keyword, keyword)
	}
	err = db.Count(&total).Error
	if err != nil {
		return total, formView, err
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" f.business_name %s", req.Direction))
	} else if req.Sort == "type" {
		db = db.Joins("INNER JOIN datasource d on f.datasource_id = d.id").
			Order(fmt.Sprintf("CASE  d.type_name\nWHEN 'mysql' THEN 1\nWHEN 'maria' THEN 2\nWHEN 'hive-hadoop2' THEN 3\nWHEN 'postgresql' THEN 4\nWHEN 'oracle' THEN 5\nWHEN 'sqlserver' THEN 7\nELSE  8 END %s,f.datasource_id %s,f.updated_at %s", req.Direction, req.Direction, req.Direction))
		//db = db.Order(fmt.Sprintf(" %s,updated_at %s", req.PageInfo.Sort, req.PageInfo.Direction))
	} else {
		db = db.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
	}
	err = db.Find(&formView).Error
	return total, formView, err
}

func (r *formViewRepo) Create(ctx context.Context, formView *model.FormView) error {
	return r.db.WithContext(ctx).Create(formView).Error
}

func (r *formViewRepo) Update(ctx context.Context, formView *model.FormView) error {
	return r.db.WithContext(ctx).Where("id=?", formView.ID).Updates(formView).Error
}

func (r *formViewRepo) UpdateAuthedUsers(ctx context.Context, id string, users []string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("view_id=?", id).Delete(&model.ViewAuthedUser{}).Error; err != nil {
			return err
		}
		users = lo.Uniq(users)
		objs := lo.Times(len(users), func(index int) *model.ViewAuthedUser {
			return &model.ViewAuthedUser{
				ID:     uuid.NewString(),
				ViewID: id,
				UserID: users[index],
			}
		})
		return tx.Create(objs).Error
	})
}

func (r *formViewRepo) RemoveAuthedUsers(ctx context.Context, id string, userID string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//1. 不传，删除全部访问者
		if userID == "" {
			return tx.Where("view_id=?", id).Delete(&model.ViewAuthedUser{}).Error
		}
		//2. 传，删除指定的访问者
		return tx.Where("view_id=? and user_id=?", id, userID).Delete(&model.ViewAuthedUser{}).Error
	})
}

func (r *formViewRepo) UserCanAuthView(ctx context.Context, userID string, viewID string) (can bool, err error) {
	total := int64(0)
	err = r.db.WithContext(ctx).Model(new(model.ViewAuthedUser)).Where("user_id=? and view_id=?", userID, viewID).Count(&total).Error
	return total > 0, err
}

// UserAuthedViews 查询用户是否是授权用户
func (r *formViewRepo) UserAuthedViews(ctx context.Context, userID string, viewID ...string) (ds []*model.ViewAuthedUser, err error) {
	err = r.db.WithContext(ctx).Where("user_id=? and view_id in ? ", userID, viewID).Find(&ds).Error
	return ds, err
}

func (r *formViewRepo) Save(ctx context.Context, formView *model.FormView) error {
	return r.db.WithContext(ctx).Save(formView).Error
}

func (r *formViewRepo) UpdateFormColumn(ctx context.Context, status int, ids []string) error {
	if len(ids) < 1 {
		return nil
	}
	idString := "'"
	for _, id := range ids {
		idString = idString + id + "','"
	}
	//idString = strings.TrimRight(idString, ",'")
	idString = idString[:len(idString)-2]
	sql := fmt.Sprintf("UPDATE form_view SET status=? , edit_status=1 WHERE id IN (%s)", idString)
	return r.db.WithContext(ctx).Exec(sql, status).Error
}
func (r *formViewRepo) UpdateViewStatusAndAdvice(ctx context.Context, auditAdvice string, ids []string) error {
	if len(ids) < 1 {
		return nil
	}
	idString := "'"
	for _, id := range ids {
		idString = idString + id + "','"
	}
	idString = idString[:len(idString)-2]

	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		statusSql := fmt.Sprintf("UPDATE form_view SET status=? , edit_status=1 WHERE id IN (%s)", idString)
		err := r.db.WithContext(ctx).Exec(statusSql, constant.FormViewDelete.Integer.Int()).Error
		if err != nil {
			return err
		}
		onlineLogicView := make([]*model.FormView, 0)
		err = r.db.WithContext(ctx).
			Where("id in ?", ids).
			Where("online_status = ? or online_status =?", constant.LineStatusOnLine, constant.LineStatusDownReject).
			Find(&onlineLogicView).Error
		if err != nil {
			log.WithContext(ctx).Error("GetOnlineInIds", zap.Error(err))
		}
		for _, view := range onlineLogicView {
			err = r.esRepo.DeletePubES(ctx, view.ID) //源表删除重新扫描后状态改为自动下线
			if err != nil {
				return err
			}
		}
		adviceSql := fmt.Sprintf("UPDATE form_view SET audit_advice=?,online_status = ? WHERE id IN (%s) and (online_status=? or online_status=?) ", idString)
		err = r.db.WithContext(ctx).Exec(adviceSql, auditAdvice, constant.LineStatusDownAuto, constant.LineStatusOnLine, constant.LineStatusDownReject).Error
		if err != nil {
			return err
		}
		return nil
	})
	if err != nil {
		return err
	}
	return nil
}

func (r *formViewRepo) UpdateTransaction(ctx context.Context, args *form_view.UpdateTransactionArgs) (resErr error) {
	if resErr = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		if err = tx.Table(model.TableNameFormView).Updates(args.FormView).Error; err != nil {
			return err
		}
		formViewFields := make([]*model.FormViewField, 0)
		if err = tx.Table(model.TableNameFormViewField).Where("form_view_id=? and deleted_at=0", args.FormView.ID).Find(&formViewFields).Error; err != nil {
			return err
		}
		for _, formViewField := range formViewFields {
			if formViewField.Status == constant.FormViewFieldDelete.Integer.Int32() { //保存后删除表已删除字段
				if err = tx.Delete(formViewField).Error; err != nil {
					return err
				}
				continue
			}
			if formViewField.Status == constant.FormViewFieldModify.Integer.Int32() || formViewField.Status == constant.FormViewFieldNew.Integer.Int32() { //保存后新建和修改字段改为无变化
				if err = tx.Table(model.TableNameFormViewField).Where("id=?", formViewField.ID).Update("status", constant.FormViewFieldUniformity.Integer.Int32()).Error; err != nil {
					return err
				}
			}
			if formViewField.BusinessName != args.Fields[formViewField.ID] {
				formViewField.BusinessName = args.Fields[formViewField.ID]
				formViewField.Status = constant.FormViewFieldUniformity.Integer.Int32()
				if err = tx.Table(model.TableNameFormViewField).Updates(formViewField).Error; err != nil {
					return err
				}
			}
		}
		return nil
	}); resErr != nil {
		log.WithContext(ctx).Error("【formViewRepo】UpdateTransaction ", zap.Error(resErr))
		return resErr
	}
	return nil
}

func (r *formViewRepo) UpdateDatasourceViewTransaction(ctx context.Context, view *model.FormView, timestampId string, fieldReqMap map[string]*domain.Fields) (clearSyntheticData bool, resErr error) {
	fieldObjs := make([]*es.FieldObj, 0) // 发送ES消息字段列表
	if resErr = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		if err = tx.Table(model.TableNameFormView).Where("id =?", view.ID).Take(&model.FormView{}).Error; err != nil {
			return err
		}
		publishAt := time.Now()
		formView := &model.FormView{
			FormViewID:   view.FormViewID,
			ID:           view.ID,
			BusinessName: view.BusinessName,
			PublishAt:    &publishAt,
			EditStatus:   constant.FormViewLatest.Integer.Int32(),
			InfoSystemID: view.InfoSystemID,
		}
		var formViewField []*model.FormViewField
		err = tx.Where("form_view_id=? and business_timestamp = 1", view.ID).Find(&formViewField).Error
		if err != nil {
			return err
		}
		if len(formViewField) > 0 { //清理时间戳
			if err = tx.Table(model.TableNameFormViewField).Where("form_view_id = ? and business_timestamp = 1", view.ID).UpdateColumn("business_timestamp", 0).Error; err != nil {
				return err
			}
		}
		if timestampId != "" {
			//设置时间戳
			if err = tx.Table(model.TableNameFormViewField).Where("form_view_id = ? and id = ?", view.ID, timestampId).UpdateColumn("business_timestamp", 1).Error; err != nil {
				return err
			}
		}

		if err = tx.Select("business_name", "publish_at", "edit_status", "info_system_id").Updates(formView).Error; err != nil {
			return err
		}
		formViewFields := make([]*model.FormViewField, 0)
		if err = tx.Where("form_view_id=?", view.ID).Find(&formViewFields).Error; err != nil {
			return err
		}
		if len(formViewFields) != len(fieldReqMap) {
			return errorcode.Desc(my_errorcode.FormViewFieldIDNotComplete)
		}
		fieldNameMap := make(map[string]string) //用于业务名称验证
		var selectFields string
		var VEModifyView bool
		for i, originalField := range formViewFields {
			var exist bool

			//es信息
			fieldObj := &es.FieldObj{
				FieldNameZH: originalField.BusinessName,
				FieldNameEN: originalField.TechnicalName,
			}
			fieldObjs = append(fieldObjs, fieldObj)

			//校验
			if _, exist = fieldReqMap[originalField.ID]; !exist {
				return errorcode.Desc(my_errorcode.FormViewFieldIDNotComplete) //req Fields id不完整
			}
			reqName := fieldReqMap[originalField.ID].BusinessName
			if _, exist = fieldNameMap[reqName]; originalField.Status != constant.FormViewFieldDelete.Integer.Int32() && exist {
				return errorcode.WithDetail(my_errorcode.FieldsBusinessNameRepeat, map[string]any{"form_view_field_id": originalField.ID, "form_view_field_name": reqName}) //req Fields中业务名重复
			}
			if originalField.Status != constant.FormViewFieldDelete.Integer.Int32() {
				fieldNameMap[reqName] = originalField.ID
			}

			//发布更新状态
			if originalField.Status == constant.FormViewFieldDelete.Integer.Int32() { //保存后删除表已删除字段
				if err = tx.Delete(originalField).Error; err != nil {
					return err
				}
				continue
			}
			if originalField.Status == constant.FormViewFieldModify.Integer.Int32() || originalField.Status == constant.FormViewFieldNew.Integer.Int32() { //保存后新建和修改字段改为无变化
				if err = tx.Table(model.TableNameFormViewField).Where("id=?", originalField.ID).Update("status", constant.FormViewFieldUniformity.Integer.Int32()).Error; err != nil {
					return err
				}
			}

			//编辑信息
			req := fieldReqMap[originalField.ID]

			// 数据标准code或码表id改变，清除数据
			if (!clearSyntheticData && req.StandardCode != originalField.StandardCode.String) || (!clearSyntheticData && req.CodeTableID != originalField.CodeTableID.String) {
				clearSyntheticData = true
			}

			if req.ClearAttributeID != "" {
				if err = data_classify_attribute_blacklist.ClearAttribute(tx, &model.DataClassifyAttrBlacklist{
					FormViewID: view.ID,
					FieldID:    originalField.ID,
					SubjectID:  req.ClearAttributeID,
				}); err != nil {
					return err
				}
			}
			updateField := &model.FormViewField{
				ID:           originalField.ID,
				BusinessName: req.BusinessName,
				StandardCode: sql.NullString{String: req.StandardCode, Valid: true},
				CodeTableID:  sql.NullString{String: req.CodeTableID, Valid: true},
			}

			// 处理分类标签ID
			if req.AttributeID != "" {
				updateField.SubjectID = &req.AttributeID
			} else {
				attributeID := ""
				updateField.SubjectID = &attributeID
			}

			// 处理分类方法
			if req.ClassifyType != 0 {
				updateField.ClassifyType = &req.ClassifyType
			} else {
				updateField.ClassifyType = nil
			}

			// 处理分级标签ID
			if req.LabelID != "" {
				gradeID, err := strconv.ParseInt(req.LabelID, 10, 64)
				if err != nil {
					return errorcode.Detail(my_errorcode.PublicInvalidParameter, "invalid label_id format")
				}
				updateField.GradeID = sql.NullInt64{Int64: gradeID, Valid: true}
			} else {
				// updateField.GradeID = sql.NullInt64{Valid: false}
				updateField.GradeID = sql.NullInt64{Int64: 0, Valid: true}
			}

			// 处理分级标签类型
			if req.GradeType != 0 {
				updateField.GradeType = sql.NullInt32{Int32: int32(req.GradeType), Valid: true}
			} else {
				updateField.GradeType = sql.NullInt32{Valid: false}
			}

			// 处理字段属性
			if req.SharedType != nil {
				updateField.SharedType = *req.SharedType
			}
			if req.OpenType != nil {
				updateField.OpenType = *req.OpenType
			}
			if req.SensitiveType != nil {
				updateField.SensitiveType = *req.SensitiveType
			}
			if req.SecretType != nil {
				updateField.SecretType = *req.SecretType
			}

			// 处理清除分级标签ID
			if req.ClearLableID != "" || req.ClearAttributeID != "" {
				updateField.GradeID = sql.NullInt64{Valid: true}
				updateField.GradeType = sql.NullInt32{Valid: true}
			}

			if originalField.DataType != "" && req.DataType == "" {
				return errorcode.Detail(my_errorcode.PublicInvalidParameter, "data_type is required")
			}
			if originalField.DataType != "" {
				//类型转换
				switch {
				case req.DataType != originalField.DataType && req.DataType != originalField.ResetBeforeDataType.String: //类型变化，非回退  转换
					verify := originalField.DataType + req.DataType
					if originalField.ResetBeforeDataType.String != "" {
						verify = originalField.ResetBeforeDataType.String + req.DataType
					}
					if _, exist = constant.TypeConvertMap[verify]; !exist {
						return errorcode.Detail(my_errorcode.DataTypeConversionError, fmt.Sprintf("Field TechnicalName:%s type: %s cant not Convert to :%s", originalField.TechnicalName, originalField.DataType, req.DataType))
					}
					updateField.DataType = req.DataType
					if originalField.ResetBeforeDataType.String == "" { //未转换过 转换
						updateField.ResetBeforeDataType = sql.NullString{String: originalField.DataType, Valid: true}
					}
					VEModifyView = true
					selectFields, err = ResetDataType(i, selectFields, req, originalField, updateField)
					if err != nil {
						return err
					}
					if originalField.DataType == constant.DECIMAL || originalField.DataType == constant.NUMERIC || originalField.DataType == constant.DEC { //原来是
						updateField.ResetDataLength = sql.NullInt32{Int32: 0, Valid: true}
						updateField.ResetDataAccuracy = sql.NullInt32{Int32: 0, Valid: true}
					}
					if originalField.DataType == constant.DATE || originalField.DataType == constant.TIME || originalField.DataType == constant.TIME_WITH_TIME_ZONE || originalField.DataType == constant.DATETIME || originalField.DataType == constant.TIMESTAMP || originalField.DataType == constant.TIMESTAMP_WITH_TIME_ZONE { //原来是
						updateField.ResetConvertRules = sql.NullString{String: "", Valid: true}
					}
				case req.DataType != originalField.DataType && req.DataType == originalField.ResetBeforeDataType.String: // 回退转换
					updateField.DataType = originalField.ResetBeforeDataType.String
					updateField.ResetBeforeDataType = sql.NullString{String: "", Valid: true}
					updateField.ResetConvertRules = sql.NullString{String: "", Valid: true}
					updateField.ResetDataLength = sql.NullInt32{Int32: 0, Valid: true}
					updateField.ResetDataAccuracy = sql.NullInt32{Int32: 0, Valid: true}
					VEModifyView = true
					selectFields = SplicingNotResetDataTypeSql(i, selectFields, originalField.TechnicalName)
				case req.DataType == originalField.DataType && originalField.ResetBeforeDataType.String != "": //类型无变化 转换过 不转换保持
					VEModifyView = true
					selectFields, err = ResetDataType(i, selectFields, req, originalField, updateField)
					if err != nil {
						return err
					}
				case req.DataType == originalField.DataType && originalField.ResetBeforeDataType.String == "": //未转换过、不转换
					selectFields = SplicingNotResetDataTypeSql(i, selectFields, originalField.TechnicalName)
				default:
					return errorcode.Desc(my_errorcode.PublicInvalidParameter)
				}
			}
			//end 类型转换

			tx.Where("id=?", originalField.ID).Updates(updateField)
		}

		//类型转换
		if VEModifyView {
			datasource := &model.Datasource{}
			if err = tx.Where("id=? ", view.DatasourceID).Take(&datasource).Error; err != nil {
				return err
			}
			createSql := fmt.Sprintf("select %s from %s.%s.%s", selectFields, datasource.CatalogName, util.QuotationMark(datasource.Schema), util.QuotationMark(view.TechnicalName))
			if view.FilterRule != "" {
				createSql = fmt.Sprintf("%s where %s", createSql, view.FilterRule)
			}
			if err = r.SaveFormViewSql(ctx, &model.FormViewSql{FormViewID: formView.ID, Sql: createSql}, tx); err != nil {
				return err
			}
			if err = r.drivenVirtualizationEngine.ModifyView(ctx, &virtualization_engine.ModifyViewReq{
				CatalogName: datasource.DataViewSource,
				Query:       createSql,
				ViewName:    view.TechnicalName,
			}); err != nil {
				return err
			}

		}
		return nil
	}); resErr != nil {
		log.WithContext(ctx).Error("【formViewRepo】UpdateTransaction2 ", zap.Error(resErr))
		return clearSyntheticData, resErr
	}

	var err error
	formView := &model.FormView{
		FormViewID: view.FormViewID,
		ID:         view.ID,
	}
	if err = r.db.Table(model.TableNameFormView).Where("id =?", view.ID).Take(&formView).Error; err != nil {
		log.WithContext(ctx).Error("【formViewRepo】UpdateTransaction2  PubToES error", zap.Error(resErr))
	}
	if err := r.esRepo.PubToES(ctx, formView, fieldObjs); err != nil { // 编辑元数据视图
		log.WithContext(ctx).Error("【formViewRepo】UpdateTransaction2  PubToES error", zap.Error(resErr))
	}
	return clearSyntheticData, nil
}

func SplicingNotResetDataTypeSql(i int, selectFields string, fieldTechnicalName string) string {
	return util.CE(i == 0,
		util.QuotationMark(fieldTechnicalName),
		fmt.Sprintf("%s,%s", selectFields, util.QuotationMark(fieldTechnicalName))).(string)
}
func ResetDataType(i int, selectFields string, reqField *domain.Fields, originalField *model.FormViewField, updateField *model.FormViewField) (string, error) {
	fieldTechnicalName := util.QuotationMark(originalField.TechnicalName)
	var selectField string
	switch reqField.DataType { //编辑转换接口
	case constant.DATE, constant.TIME, constant.TIME_WITH_TIME_ZONE, constant.DATETIME, constant.TIMESTAMP, constant.TIMESTAMP_WITH_TIME_ZONE:
		beforeDataType := util.CE(originalField.ResetBeforeDataType.String != "", originalField.ResetBeforeDataType.String, originalField.DataType).(string)
		if beforeDataType == constant.CHAR || beforeDataType == constant.VARCHAR || beforeDataType == constant.STRING {
			if reqField.ResetConvertRules == "" {
				return "", errorcode.Detail(my_errorcode.PublicInvalidParameter, "reset_convert_rules is invalid")
			}
			updateField.ResetConvertRules = sql.NullString{String: reqField.ResetConvertRules, Valid: true}
			selectField = fmt.Sprintf("try_cast(date_parse(%s,'%s') AS %s) %s", fieldTechnicalName, reqField.ResetConvertRules, reqField.DataType, fieldTechnicalName)
		} else {
			selectField = fmt.Sprintf("try_cast(%s AS %s) %s", fieldTechnicalName, reqField.DataType, fieldTechnicalName)
		}
	case constant.DECIMAL, constant.NUMERIC, constant.DEC:
		if reqField.ResetDataLength <= 0 || reqField.ResetDataAccuracy == nil || *reqField.ResetDataAccuracy < 0 || reqField.ResetDataLength < *reqField.ResetDataAccuracy { //校验参数
			return "", errorcode.Detail(my_errorcode.PublicInvalidParameter, "reset_data_length or reset_data_accuracy is invalid")
		}
		updateField.ResetDataLength = sql.NullInt32{Int32: reqField.ResetDataLength, Valid: true}
		updateField.ResetDataAccuracy = sql.NullInt32{Int32: *reqField.ResetDataAccuracy, Valid: true}
		selectField = fmt.Sprintf("try_cast(%s AS %s(%d,%d)) %s", fieldTechnicalName, reqField.DataType, reqField.ResetDataLength, *reqField.ResetDataAccuracy, fieldTechnicalName)
	default:
		selectField = fmt.Sprintf("try_cast(%s AS %s) %s", fieldTechnicalName, reqField.DataType, fieldTechnicalName)
	}
	return util.CE(i == 0,
		selectField,
		fmt.Sprintf("%s,%s", selectFields, selectField)).(string), nil
}
func (r *formViewRepo) SaveFormViewSql(ctx context.Context, viewSQL *model.FormViewSql, tx *gorm.DB) error {
	if tx == nil {
		tx = r.db
	}
	var count int64
	tx.WithContext(ctx).Model(viewSQL).Where("form_view_id =? ", viewSQL.FormViewID).Count(&count)
	if count == 0 {
		if err := tx.Create(viewSQL).Error; err != nil {
			return err
		}
	} else {
		if err := tx.Where("form_view_id =? ", viewSQL.FormViewID).Updates(viewSQL).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *formViewRepo) Delete(ctx context.Context, formView *model.FormView) error {
	return r.db.WithContext(ctx).Delete(formView).Error
}

func (r *formViewRepo) DeleteDatasourceViewTransaction(ctx context.Context, id, datasource_id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Table(model.TableNameSubViews).
			Where(&model.SubView{LogicViewID: uuid.MustParse(id)}).Delete(&model.SubView{}).Error; err != nil {
			return err
		}
		if err := tx.Table(model.TableNameFormView).
			Where("id=?", id).Delete(&model.FormView{}).Error; err != nil {
			return err
		}
		if err := tx.Table(model.TableNameFormViewField).
			Where("form_view_id =?", id).Delete(&model.FormViewField{}).Error; err != nil {
			return err
		}
		var formView = new(model.FormView)
		err := tx.Table(model.TableNameFormView).Where("datasource_id =? and deleted_at=0", datasource_id).Take(&formView).Error
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return nil
			}
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}

		return nil
	})
}

func (r *formViewRepo) DeleteCustomOrLogicEntityViewTransaction(ctx context.Context, id string) error {
	return r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := r.db.WithContext(ctx).Table(model.TableNameSubViews).
			Where(&model.SubView{LogicViewID: uuid.MustParse(id)}).Delete(&model.SubView{}).Error; err != nil {
			return err
		}
		if err := r.db.WithContext(ctx).Table(model.TableNameFormView).
			Where("id=?", id).Delete(&model.FormView{}).Error; err != nil {
			return err
		}
		if err := r.db.WithContext(ctx).Table(model.TableNameFormViewField).
			Where("form_view_id =?", id).Delete(&model.FormViewField{}).Error; err != nil {
			return err
		}
		return nil
	})
}

func (r *formViewRepo) GetFormViewList(ctx context.Context, datasourceId string) (formView []*model.FormView, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("datasource_id=? and deleted_at=0 ", datasourceId).Find(&formView).Error
	return
}

func (r *formViewRepo) GetFormViews(ctx context.Context, datasourceId string) (formView []*model.FormView, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("datasource_id=? and deleted_at=0 and status <> ?", datasourceId, constant.FormViewDelete.Integer.Int()).Find(&formView).Error
	return
}

func (r *formViewRepo) CreateField(ctx context.Context, formViewField *model.FormViewField) error {
	return r.db.WithContext(ctx).Create(formViewField).Error
}

func (r *formViewRepo) createFormAndField(ctx context.Context, formView *model.FormView, formViewFields []*model.FormViewField, sql string, tx *gorm.DB) (resErr error) {
	tx = tx.Debug()
	if err := tx.Table(model.TableNameFormView).Create(formView).Error; err != nil {
		return err
	}
	if err := tx.Table(model.TableNameFormViewField).CreateInBatches(formViewFields, len(formViewFields)).Error; err != nil {
		return err
	}
	if sql == "" { //excel 类型不需要sql
		return nil
	}
	if err := tx.Create(&model.FormViewSql{
		FormViewID: formView.ID,
		Sql:        sql,
	}).Error; err != nil {
		return err
	}
	return nil
}
func (r *formViewRepo) CreateFormAndField(ctx context.Context, formView *model.FormView, formViewFields []*model.FormViewField, sql string, tx ...*gorm.DB) (resErr error) {
	if len(tx) > 0 && tx[0] != nil {
		return r.createFormAndField(ctx, formView, formViewFields, sql, tx[0])
	}
	resErr = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		return r.createFormAndField(ctx, formView, formViewFields, sql, tx)
	})
	return
}

func (r *formViewRepo) UpdateFormAndField(ctx context.Context, formView *model.FormView, formViewFields []*model.FormViewField) (resErr error) {
	resErr = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Table(model.TableNameFormView).Updates(formView).Error; err != nil {
			return err
		}
		if err := tx.Table(model.TableNameFormViewField).Updates(formViewFields).Error; err != nil {
			return err
		}
		return nil
	})
	return
}

func (r *formViewRepo) ScanTransaction(ctx context.Context, newView []*model.FormView, updateView []*model.FormView, newField []*model.FormViewField, updateField []*model.FormViewField) (resErr error) {
	resErr = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Table(model.TableNameFormView).CreateInBatches(newView, len(newField)).Error; err != nil {
			return err
		}
		if err := tx.Table(model.TableNameFormView).Updates(updateView).Error; err != nil {
			return err
		}
		if err := tx.Table(model.TableNameFormViewField).CreateInBatches(newField, len(newField)).Error; err != nil {
			return err
		}
		if err := tx.Table(model.TableNameFormViewField).Updates(updateField).Error; err != nil {
			return err
		}
		return nil
	})
	return
}

func (r *formViewRepo) UpdateViewTransaction(ctx context.Context, formView *model.FormView, newField []*model.FormViewField, updateField []*model.FormViewField, deleteFieldIds []string, sql string) (resErr error) {
	resErr = r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err := tx.Table(model.TableNameFormView).Where("id=?", formView.ID).Updates(formView).Error; err != nil {
			log.WithContext(ctx).Error("【formViewRepo】UpdateViewTransaction formView", zap.Error(err))
			return err
		}
		if err := tx.Table(model.TableNameFormViewField).CreateInBatches(newField, len(newField)).Error; err != nil {
			log.WithContext(ctx).Error("【formViewRepo】UpdateViewTransaction newField", zap.Error(err))
			return err
		}
		for _, update := range updateField {
			if err := tx.Model(update).Where("id=?", update.ID).Updates(update).Error; err != nil {
				log.WithContext(ctx).Error("【formViewRepo】UpdateViewTransaction updateField", zap.Error(err))
				return err
			}
		}
		if err := tx.Table(model.TableNameFormViewField).Where("id in ?", deleteFieldIds).Update("status", constant.FormViewFieldDelete.Integer.Int32()).Error; err != nil {
			log.WithContext(ctx).Error("【formViewRepo】UpdateViewTransaction deleteFieldIds", zap.Error(err))
			return err
		}
		if sql != "" {
			var conut int64
			if err := tx.Model(&model.FormViewSql{}).Where("form_view_id =?", formView.ID).Count(&conut).Error; err != nil {
				return err
			}
			if conut == 0 {
				if err := tx.Create(&model.FormViewSql{FormViewID: formView.ID, Sql: sql}).Error; err != nil {
					return err
				}
			} else {
				if err := tx.Model(&model.FormViewSql{}).Where("form_view_id =?", formView.ID).Update("sql", sql).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	return
}

func (r *formViewRepo) DataSourceDeleteTransaction(ctx context.Context, id string) error {
	resErr := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		if err = r.db.Where("id=? ", id).Delete(&model.Datasource{}).Error; err != nil {
			return err
		}
		formViews := make([]*model.FormView, 0)
		if err = r.db.Where("datasource_id =? and deleted_at=0", id).Find(&formViews).Error; err != nil {
			return err
		}
		formViewIds := make([]string, len(formViews))
		for i, view := range formViews {
			formViewIds[i] = view.ID
		}
		if err = r.db.Where("id in ?", formViewIds).Delete(&model.FormView{}).Error; err != nil {
			return err
		}
		if err = r.db.Where("form_view_id in ?", formViewIds).Delete(&model.FormViewField{}).Error; err != nil {
			return err
		}
		return nil
	})
	if resErr != nil {
		log.WithContext(ctx).Error("DataSourceDeleteTransaction", zap.Error(resErr))
	}
	return resErr
}
func (r *formViewRepo) DataSourceViewNameExist(ctx context.Context, selfView *model.FormView, name string, tx ...*gorm.DB) (bool, error) {
	var formView *model.FormView
	err := r.do(tx).WithContext(ctx).Where("business_name=? and datasource_id=? and id<>? and publish_at is not null and deleted_at=0",
		name, selfView.DatasourceID, selfView.ID).Take(&formView).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return true, err
	}
	return true, nil
}
func (r *formViewRepo) CustomLogicEntityViewNameExist(ctx context.Context, viewType string, formID string, name string, nameType string) (bool, error) {
	var formView *model.FormView
	err := r.db.WithContext(ctx).Where(fmt.Sprintf("type = ? and %s=? and  id<>? and publish_at is not null and deleted_at=0", nameType),
		enum.ToInteger[constant.FormViewType](viewType).Int32(), name, formID).Take(&formView).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return true, err
	}
	return true, nil
}

func (r *formViewRepo) GetRelationCountBySubjectIds(ctx context.Context, isOperator bool, ids []string) (relations []*model.SubjectRelation, err error) {
	db := r.db.WithContext(ctx).Table(model.TableNameFormView)
	raw := `select count(fv.id) as num , fv.subject_id from af_main.form_view fv where fv.deleted_at=0  and fv.subject_id !='' `
	if !isOperator {
		raw += fmt.Sprintf("  and online_status='%s'  ", constant.LineStatusOnLine)
	}
	if len(ids) > 0 {
		raw += fmt.Sprintf(` and fv.subject_id in ('%s') `, strings.Join(ids, "','"))
	}
	raw += ` group by fv.subject_id `
	err = db.Raw(raw).Scan(&relations).Error
	return
}
func (r *formViewRepo) GetLogicalEntityByIds(ctx context.Context, ids []string) (formViews []*model.FormView, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("id in ? and type=? and subject_id!='' ",
		ids, constant.FormViewTypeLogicEntity.Integer.Int8()).Find(&formViews).Error
	return
}

func (r *formViewRepo) GetByIds(ctx context.Context, ids []string) (formViews []*model.FormView, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("id in ? ", ids).Find(&formViews).Error
	return
}
func (r *formViewRepo) VerifyIds(ctx context.Context, ids []string) (pass bool, err error) {
	var count int64
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("id in ? ", ids).Count(&count).Error
	if err != nil {
		return
	}
	if count == int64(len(ids)) {
		pass = true
	}
	return
}

func (r *formViewRepo) GetFormViewIDByOwnerID(ctx context.Context, OwnerId string) (formViewID []string, err error) {
	tx := r.db.WithContext(ctx).Table(model.TableNameFormView)
	tx = tx.Select("id")
	tx = tx.Where("owner_id LIKE ? ", "%"+OwnerId+"%")
	err = tx.Find(&formViewID).Error
	return formViewID, err
}

func (r *formViewRepo) GetByOwnerOrIdsPages(ctx context.Context, req *domain.GetUsersFormViewsReq) (total int64, formViews []*model.FormView, err error) {
	tx := r.db.WithContext(ctx).Table(model.TableNameFormView)
	tx = tx.Where(" deleted_at=0 ")
	if req.ViewIds != nil {
		tx = tx.Where("id in ? ", req.ViewIds)
	}
	if req.Owner {
		// 我的-逻辑视图-我可授权：支持通过数据owner过滤
		if req.DataOwner != "" {
			tx = tx.Where("owner_id LIKE ? ", "%"+req.DataOwner+"%")
		}
	} else {
		tx = tx.Where(" owner_id not like ?", "%"+req.OwnerId+"%")
	}

	if req.OrgCode == constant.UnallocatedId {
		tx = tx.Where("(department_id is null or department_id = '')")
	} else if req.OrgCode != "" && len(req.SubDepartmentIDs) != 0 {
		tx = tx.Where("department_id in ?", req.SubDepartmentIDs)
	}

	if req.SubjectDomainID == constant.UnallocatedId {
		tx = tx.Where("(subject_id is null or subject_id = '')")
	} else if len(req.SubjectDomainID) > 0 {
		tx = tx.Where("subject_id = ?", req.SubjectDomainID)
	}

	if req.Keyword != "" {
		if strings.Contains(req.Keyword, "_") {
			req.Keyword = strings.Replace(req.Keyword, "_", "\\_", -1)
		}
		req.Keyword = "%" + req.Keyword + "%"
		tx = tx.Where("technical_name like ? or business_name like ? or uniform_catalog_code like ?", req.Keyword, req.Keyword, req.Keyword)
	}
	if len(req.LineStatus) != 0 {
		tx = tx.Where("online_status in ?", req.LineStatus)
	}
	err = tx.Count(&total).Error
	if err != nil {
		return total, formViews, err
	}
	req.Offset = req.Limit * (req.Offset - 1)
	if req.Limit > 0 {
		tx = tx.Limit(req.Limit).Offset(req.Offset)
	}
	//tx = tx.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
	if req.Sort == "name" {
		tx = tx.Order(fmt.Sprintf(" business_name %s", req.Direction))
	} else {
		tx = tx.Order(fmt.Sprintf("%s %s", req.Sort, req.Direction))
	}
	err = tx.Find(&formViews).Error
	return
}

func (r *formViewRepo) GetByOwnerID(ctx context.Context, userId string, id string) (total int64, formViews []*model.FormView, err error) {
	tx := r.db.WithContext(ctx).Table(model.TableNameFormView)
	if userId == "" {
		return
	} else {
		tx = tx.Where("owner_id LIKE ? and deleted_at=0", "%"+userId+"%")
	}
	if id != "" {
		tx = tx.Where("id=?", id)
	}
	err = tx.Count(&total).Error
	if err != nil {
		return total, formViews, err
	}
	err = tx.Find(&formViews).Error
	return
}

func (r *formViewRepo) GetBySubjectId(ctx context.Context, subjectIds []string) (formViews []*model.FormView, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("subject_id in ?", subjectIds).Find(&formViews).Error
	return
}
func (r *formViewRepo) ClearSubjectIdRelated(ctx context.Context, subjectDomainId []string, logicEntityId []string, moveDeletes []*domain.MoveDelete, nameChangeView []*model.FormView) error {
	resErr := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		var err error
		if len(subjectDomainId) != 0 {
			err = tx.Model(&model.FormView{}).Where("subject_id in ? and deleted_at=0 ", subjectDomainId).Update("subject_id", "").Error
			if err != nil {
				return err
			}
		}
		if len(logicEntityId) != 0 {
			if err = tx.Select("subject_id", "type").Where("subject_id in ? and deleted_at=0 ", logicEntityId).Updates(&model.FormView{
				Type: constant.FormViewTypeCustom.Integer.Int32(),
				SubjectId: sql.NullString{
					String: "",
					Valid:  true,
				},
			}).Error; err != nil {
				return err
			}
		}
		for _, moveDelete := range moveDeletes {
			if err = tx.Select("subject_id", "type").Where("subject_id = ? and deleted_at=0 ", moveDelete.LogicEntityID).Updates(&model.FormView{
				Type: constant.FormViewTypeCustom.Integer.Int32(),
				SubjectId: sql.NullString{
					String: moveDelete.SubjectDomainID,
					Valid:  true,
				},
			}).Error; err != nil {
				return err
			}
		}
		if len(nameChangeView) != 0 {
			for _, view := range nameChangeView {
				if err = tx.WithContext(ctx).Where("id=?", view.ID).Updates(view).Error; err != nil {
					return err
				}
			}
		}
		return nil
	})
	if resErr != nil {
		log.WithContext(ctx).Error("ClearSubjectIdRelated", zap.Error(resErr))
	}
	return resErr
}

func (r *formViewRepo) UpdateExploreJob(ctx context.Context, viewID string, jobInfo map[string]interface{}) (bool, error) {
	db := r.db.WithContext(ctx).Model(&model.FormView{}).Where("id = ?", viewID).UpdateColumns(jobInfo)
	return db.RowsAffected > 0, db.Error
}

func (r *formViewRepo) GetOwnerViewCount(ctx context.Context, viewId, ownerId string) (total int64, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("id =? and owner_id=?", viewId, ownerId).Count(&total).Error
	return
}

// QueryViewCreatedByLogicalEntity 根据业务名称和技术名称，查询从逻辑实体构建的逻辑视图
func (r *formViewRepo) QueryViewCreatedByLogicalEntity(ctx context.Context, req *domain.QueryLogicalEntityByViewReq) (total int64, formView []*model.FormView, err error) {
	d := r.db.WithContext(ctx).Model(new(model.FormView))
	if req.Keyword != "" {
		keyword := "%" + req.Keyword + "%"
		d = d.Where("business_name like ? or technical_name like ? ", keyword, keyword)
	}
	//必须是从逻辑实体开发出来的视图
	d = d.Where("type=? and subject_id !='' ", constant.FormViewTypeLogicEntity.Integer.Int())
	err = d.Count(&total).Error
	if err != nil {
		return 0, nil, err
	}
	limit := *req.PageInfo.Limit
	offset := limit * (*req.PageInfo.Offset - 1)
	if limit > 0 {
		d = d.Limit(limit).Offset(offset)
	}
	err = d.Order(req.Sort + " " + req.Direction).Scan(&formView).Error
	return total, formView, err
}

func (r *formViewRepo) TotalSubjectCount(ctx context.Context, isOperator bool) (total int64, err error) {
	db := r.db.WithContext(ctx).Model(new(model.FormView))
	if isOperator {
		err = db.Where(" subject_id !='' ").Count(&total).Error
	} else {
		// fmt.Sprintf("  and status='%s'  ", constant.LineStatusOnLine)
		err = db.Where(fmt.Sprintf(" subject_id !='' and  online_status='%s' ", constant.LineStatusOnLine)).Count(&total).Error
	}
	return total, nil
}

func (r *formViewRepo) GetViewsByDIdName(ctx context.Context, datasourceId string, name []string) (formViews []*model.FormView, err error) {
	err = r.db.WithContext(ctx).Debug().Table(model.TableNameFormView).Where("datasource_id =? and technical_name in ?", datasourceId, name).Find(&formViews).Error
	return
}

func (r *formViewRepo) GetViewsByDIdOriginalName(ctx context.Context, datasourceId string, name []string) (formViews []*model.FormView, err error) {
	err = r.db.WithContext(ctx).Table(model.TableNameFormView).Where("datasource_id =? and original_name in ?", datasourceId, name).Find(&formViews).Error
	return
}

func (r *formViewRepo) GetViewsByDIdAndFilter(ctx context.Context, datasourceId string, filter *domain.DatasourceFilter) (formViews []*model.FormView, err error) {
	tx := r.db.WithContext(ctx).Table(model.TableNameFormView).Where("datasource_id =?", datasourceId)
	if filter.PublishStatus != nil && *filter.PublishStatus {
		tx.Where("publish_at is not null")
	}
	if filter.PublishStatus != nil && !*filter.PublishStatus {
		tx.Where("publish_at is null")
	}
	if filter.Limit != nil {
		tx.Limit(*filter.Limit)
	}
	err = tx.Find(&formViews).Error
	return
}

func (f *formViewRepo) GetByAuditStatus(ctx context.Context, req *domain.GetByAuditStatusReq) (total int64, formViews []*model.FormView, err error) {
	var db *gorm.DB
	db = f.db.WithContext(ctx).
		Table("form_view f")

	if req.IsAudited != nil {
		db = db.Joins("LEFT JOIN t_form_view_extend t  ON f.id = t.id").
			Where("f.status != ? and f.deleted_at = 0", constant.FormViewDelete.Integer.Int())
		if *req.IsAudited {
			db = db.Where("t.is_audited = 1")
		} else {
			db = db.Where("t.is_audited = 0 or t.id is null")
		}
	}

	if req.DatasourceId != "" {
		db = db.Where("f.datasource_id = ?", req.DatasourceId)
	}
	if len(req.DatasourceIds) != 0 {
		db = db.Where("f.datasource_id in ?", req.DatasourceIds) //类型筛选加id筛选
	}

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("f.technical_name like ? or f.business_name like ?", keyword, keyword)
	}

	if req.PublishStatus != "" && req.PublishStatus == constant.FormViewReleased.String {
		db = db.Where("f.publish_at IS NOT NULL")
	}
	if req.PublishStatus != "" && req.PublishStatus == constant.FormViewUnreleased.String {
		db = db.Where("f.publish_at IS NULL")
	}

	err = db.Count(&total).Error
	db = db.Select("f.*")
	if err != nil {
		return total, formViews, err
	}
	if req.Limit != nil && req.Offset != nil {
		limit := *req.Limit
		offset := limit * (*req.Offset - 1)
		if limit > 0 {
			db = db.Limit(limit).Offset(offset)
		}
	}
	err = db.Find(&formViews).Error
	return total, formViews, err
}

func (f *formViewRepo) GetBasicViewList(ctx context.Context, req *domain.GetBasicViewListReqParam) (formViews []*model.FormView, err error) {
	if len(req.IDs) <= 0 {
		return make([]*model.FormView, 0), nil
	}
	err = f.db.WithContext(ctx).Debug().Where("id in ? and deleted_at = 0", req.IDs).Find(&formViews).Error
	if err != nil {
		log.WithContext(ctx).Error("GetViewInfoPage", zap.Error(err))
		return nil, errorcode.Desc(my_errorcode.LogicDatabaseError)
	}

	return formViews, nil
}

func (r *formViewRepo) GetViewByTechnicalNameAndHuaAoId(ctx context.Context, technicalName, huaAoId string) (*model.FormView, error) {
	var formView *model.FormView
	err := r.db.WithContext(ctx).
		Table(model.TableNameFormView).
		Joins("INNER JOIN datasource d ON d.id = form_view.datasource_id").
		Where("form_view.technical_name = ? AND d.hua_ao_id = ? AND form_view.deleted_at = 0", technicalName, huaAoId).
		First(&formView).Error
	return formView, err
}

func (r *formViewRepo) GetViewByKey(ctx context.Context, key string) (formView *model.FormView, err error) {
	views := make([]*model.FormView, 0)
	keys := strings.Split(key, ".")
	if len(keys) != 3 {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, fmt.Sprintf("视图%s全路径格式错误", key))
	}
	datasourceName := keys[0]
	schemaName := keys[1]
	viewName := keys[2]

	rawSQL := ""
	args := make([]interface{}, 0)
	switch {
	case datasourceName == constant.CustomViewSource:
		rawSQL = "select fv.* from af_main.form_view fv  where  " +
			" fv.technical_name=? and fv.datasource_id='' and fv.type=? and  fv.deleted_at=0"
		args = append(args, viewName, constant.FormViewTypeCustom.Integer.Int32())
	case datasourceName == constant.LogicEntityViewSource:
		rawSQL = "select fv.* from af_main.form_view fv  where  " +
			" fv.technical_name=? and fv.datasource_id='' and fv.type=? and  fv.deleted_at=0"
		args = append(args, viewName, constant.FormViewTypeLogicEntity.Integer.Int32())
	default:
		rawSQL = "select fv.* from af_main.form_view fv   " +
			"  join  datasource d  on fv.datasource_id=d.id " +
			"  where  fv.deleted_at=0 and d.data_view_source=? and fv.technical_name=? ;"
		args = append(args, fmt.Sprintf("%s.%s", datasourceName, schemaName), viewName)
	}
	err = r.db.WithContext(ctx).Raw(rawSQL, args...).Scan(&views).Error
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if len(views) == 0 {
		return nil, gorm.ErrRecordNotFound
	}
	return views[0], nil
}

func (r *formViewRepo) GetDatabaseTableCount(ctx context.Context, departmentId string) (total int64, err error) {
	err = r.db.WithContext(ctx).
		Table("form_view f").
		Joins("INNER JOIN datasource s ON f.datasource_id = s.id").
		Where("f.deleted_at = 0").
		Where("s.source_type = ?", enum.ToInteger[constant.DataSourceType](constant.Analytical.String).Int32).
		Where("f.type = ?", enum.ToInteger[constant.FormViewType](constant.FormViewTypeDatasource.String).Int32()).
		Where("s.department_id = ?", departmentId).
		Count(&total).Error
	return total, err
}

func (r *formViewRepo) GetFormViewSyncList(ctx context.Context, offset, limit int, datasourceId string) ([]*form_view.FormViewSyncItem, error) {
	var list []*form_view.FormViewSyncItem
	q := r.db.WithContext(ctx).Table(model.TableNameFormView).
		Select("id", "mdl_id", "datasource_id", "technical_name", "uniform_catalog_code").
		Where("deleted_at = 0")
	if datasourceId != "" {
		q = q.Where("datasource_id = ?", datasourceId)
	}
	if offset > 0 {
		q = q.Offset(offset)
	}
	if limit > 0 {
		q = q.Limit(limit)
	}
	err := q.Find(&list).Error
	return list, err
}

func (r *formViewRepo) GetList(ctx context.Context, departmentId, ownerIds, keyword string) (formViews []*model.FormView, err error) {
	d := r.db.WithContext(ctx).Table(model.TableNameFormView)
	if departmentId != "" {
		d = d.Where("department_id = ?", departmentId)
	} else {
		d = d.Where("department_id is not null and department_id <> ''")
	}
	if keyword != "" {
		keyword = "%" + keyword + "%"
		d = d.Where("business_name like ? or technical_name like ? ", keyword, keyword)
	}

	if ownerIds != "" {
		ids := strings.Split(ownerIds, ",")
		if len(ids) > 0 {
			conditions := make([]string, len(ids))
			params := make([]interface{}, len(ids))
			for i, id := range ids {
				conditions[i] = "owner_id LIKE ?"
				params[i] = "%" + id + "%"
			}
			d = d.Where(strings.Join(conditions, " OR "), params...)
		}
	}
	err = d.Find(&formViews).Error
	return
}
