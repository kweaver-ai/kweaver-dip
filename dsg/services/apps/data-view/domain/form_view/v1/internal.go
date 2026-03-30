package v1

import (
	"context"
	"database/sql"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/mq/es"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/mdl_data_model"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/idrm-go-frame/core/errorx/agerrors"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/google/uuid"
	"github.com/samber/lo"
	"go.uber.org/zap"

	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	form_view_repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

func (f *formViewUseCase) GetLogicViewReportInfo(ctx context.Context, req *data_view.GetLogicViewReportInfoReq) (*data_view.GetLogicViewReportInfoRes, error) {
	reportInfos := make(map[string]*data_view.ReportInfo)
	viewIdMap := make(map[string]string, 0)
	viewIds := make([]string, len(req.FieldIds))
	datasourceIds := make([]string, 0)
	viewIdDatasourceIdMap := make(map[string]string, 0)

	for i, fieldId := range req.FieldIds {
		viewField, err := f.fieldRepo.GetField(ctx, fieldId)
		if err != nil {
			return nil, err
		}
		if _, exist := viewIdMap[fieldId]; !exist {
			viewIdMap[fieldId] = viewField.FormViewID
		}
		viewIds[i] = viewField.FormViewID
		reportInfos[fieldId] = &data_view.ReportInfo{
			FieldTechnicalName: viewField.TechnicalName,
		}
	}
	views, err := f.repo.GetByIds(ctx, util.DuplicateStringRemoval(viewIds))
	if err != nil {
		return nil, err
	}
	for _, view := range views {
		if view.Type == constant.FormViewTypeDatasource.Integer.Int32() {
			datasourceIds = append(datasourceIds, view.DatasourceID)
			viewIdDatasourceIdMap[view.ID] = view.DatasourceID
		}
	}
	modelDatasource, err := f.datasourceRepo.GetByIds(ctx, util.DuplicateStringRemoval(datasourceIds))
	if err != nil {
		return nil, err
	}
	datasourceMap := make(map[string]*model.Datasource)
	for _, datasource := range modelDatasource {
		datasourceMap[datasource.ID] = datasource
	}
	for _, fieldId := range req.FieldIds {
		if datasourceId, exist := viewIdDatasourceIdMap[viewIdMap[fieldId]]; exist {
			reportInfos[fieldId].DatasourceSchema = datasourceMap[datasourceId].Schema
			reportInfos[fieldId].DatasourceId = datasourceId
		}
	}
	return &data_view.GetLogicViewReportInfoRes{
		ReportInfos: reportInfos,
	}, nil

}

func (f *formViewUseCase) GetViewListByTechnicalNameInMultiDatasource(ctx context.Context, req *data_view.GetViewListByTechnicalNameInMultiDatasourceReq) (*data_view.GetViewListByTechnicalNameInMultiDatasourceRes, error) {
	var err error
	var formViews []*model.FormView
	formViewTotal := make([]*model.FormView, 0)
	dids := make([]string, 0)
	for _, datasource := range req.Datasource {
		if len(datasource.OriginalName) > 0 {
			formViews, err = f.repo.GetViewsByDIdOriginalName(ctx, datasource.DatasourceID, datasource.OriginalName)
		} else {
			formViews, err = f.repo.GetViewsByDIdName(ctx, datasource.DatasourceID, datasource.TechnicalName)
		}
		if err != nil {
			return nil, err
		}
		for _, formView := range formViews {
			dids = append(dids, formView.DatasourceID)
		}
		formViewTotal = append(formViewTotal, formViews...)
	}
	datasourceMap, err := f.GetDatasourceMap(ctx, util.DuplicateStringRemoval(dids))
	if err != nil {
		return nil, err
	}
	res := make([]*data_view.FormView, 0)
	for _, formView := range formViewTotal {
		tmp := &data_view.FormView{
			ID:                 formView.ID,
			UniformCatalogCode: formView.UniformCatalogCode,
			TechnicalName:      formView.TechnicalName,
			OriginalName:       formView.OriginalName,
			BusinessName:       formView.BusinessName,
			Type:               enum.ToString[constant.FormViewType](formView.Type),
			DatasourceId:       formView.DatasourceID,
			Status:             enum.ToString[constant.FormViewScanStatus](formView.Status),
			OnlineStatus:       formView.OnlineStatus,
			AuditAdvice:        formView.AuditAdvice,
			EditStatus:         enum.ToString[constant.FormViewEditStatus](formView.EditStatus),
		}
		if d, exist := datasourceMap[formView.DatasourceID]; exist {
			tmp.Datasource = d.Name
			tmp.DatasourceType = d.TypeName
			tmp.DatasourceCatalogName = d.CatalogName
			tmp.ViewSourceCatalogName = d.DataViewSource
		}
		if formView.OnlineTime != nil {
			tmp.OnlineTime = formView.OnlineTime.UnixMilli()
		}
		if formView.PublishAt != nil {
			tmp.PublishAt = formView.PublishAt.UnixMilli()
		}
		res = append(res, tmp)

	}

	return &data_view.GetViewListByTechnicalNameInMultiDatasourceRes{
		FormViews: res,
	}, nil
}

func (f *formViewUseCase) GetViewByKey(ctx context.Context, req *form_view.GetViewByKey) (*form_view.FormViewSimpleInfo, error) {
	data, err := f.repo.GetViewByKey(ctx, req.Key)
	if err != nil {
		return nil, err
	}
	return &form_view.FormViewSimpleInfo{
		ID:            data.ID,
		BusinessName:  data.BusinessName,
		TechnicalName: data.TechnicalName,
		OwnerID:       data.OwnerId.String,
	}, nil
}

func (f *formViewUseCase) QueryAuthedSubView(ctx context.Context, req *form_view.HasSubViewAuthParamReq) ([]string, error) {
	viewIDSlice := strings.Split(req.ViewID, ",")
	ds, err := f.repo.UserAuthedViews(ctx, req.UserID, viewIDSlice...)
	if err != nil {
		return nil, err
	}
	return lo.Uniq(lo.Times(len(ds), func(index int) string {
		return ds[index].ViewID
	})), nil
}

func (f *formViewUseCase) Sync(ctx context.Context) {
	ctx = context.Background()

	// 1) 从 Redis 获取上次同步时间（如果存在）
	lastSyncTimeMs := int64(0)
	syncTimeKey := constant.MdlDataModelSyncTimeKey
	lastSyncTimeStr, err := f.redis.GetClient().Get(ctx, syncTimeKey).Result()
	if err == nil && lastSyncTimeStr != "" {
		lastSyncTimeMs, err = strconv.ParseInt(lastSyncTimeStr, 10, 64)
		if err != nil {
			log.WithContext(ctx).Warn("parse last sync time from redis fail, will do full sync", zap.Error(err))
			lastSyncTimeMs = 0
		} else {
			log.WithContext(ctx).Infof("incremental sync: using last sync time from redis: %d", lastSyncTimeMs)
		}
	} else {
		// Redis 中没有记录，执行全量同步（首次同步或 Redis 数据丢失的情况）
		log.WithContext(ctx).Infof("incremental sync: redis has no record, will do full sync")
		lastSyncTimeMs = 0
	}

	// 记录本次同步开始时间（用于下次同步）
	syncStartTimeMs := time.Now().UnixMilli()

	// 2) 计算增量同步的起始时间（使用时间缓冲窗口，避免漏数据）
	fullSync := lastSyncTimeMs == 0
	updateStart := int64(0)
	if !fullSync {
		// 使用时间缓冲窗口（减去5分钟），避免因时间边界、时间戳精度不一致或同步过程中的数据更新导致漏数据
		const bufferMinutes = 5
		updateStart = lastSyncTimeMs - int64(bufferMinutes*60*1000)
		if updateStart < 0 {
			updateStart = 0
		}
		log.WithContext(ctx).Infof("incremental sync: lastSyncTimeMs=%d, adjusted=%d (minus %d minutes)",
			lastSyncTimeMs, updateStart, bufferMinutes)
	}

	// 按数据源分片同步，避免一次性处理所有视图
	datasources, err := f.datasourceRepo.GetAll(ctx)
	if err != nil {
		log.WithContext(ctx).Error("get all datasource fail", zap.Error(err))
		return
	}

	const listPageSize = 500
	const detailBatchSize = 200

	for _, ds := range datasources {
		if ds == nil || ds.ID == "" {
			continue
		}

		// 分页加载当前数据源的 formViews 映射
		formViewsMap, formViewInfosMap, err := f.buildFormViewSyncMapsPaged(ctx, ds.ID)
		if err != nil {
			log.WithContext(ctx).Error("build form_view sync maps for datasource fail", zap.Error(err), zap.String("datasource_id", ds.ID))
			return
		}

		// 拉一页同步一页，不累积全量 viewMap/needSyncIDs；编码按需从池子中批量获取
		var pool codePool
		for offset := 0; ; {
			page, err := f.DrivenMdlDataModel.GetDataViews(ctx, updateStart, ds.ID, offset, listPageSize)
			if err != nil {
				log.WithContext(ctx).Error("get data views page (sync pass) fail", zap.Error(err), zap.Int("offset", offset), zap.String("datasource_id", ds.ID))
				return
			}
			if len(page.Entries) == 0 {
				break
			}
			viewMapPage := make(map[string]viewSyncEntry, len(page.Entries))
			needSyncIDsPage := make([]string, 0, len(page.Entries))
			for _, v := range page.Entries {
				viewMapPage[v.Id] = viewSyncEntry{DataSourceId: v.DataSourceId, TechnicalName: v.TechnicalName}
				needSyncIDsPage = append(needSyncIDsPage, v.Id)
			}
			for start := 0; start < len(needSyncIDsPage); start += detailBatchSize {
				end := start + detailBatchSize
				if end > len(needSyncIDsPage) {
					end = len(needSyncIDsPage)
				}
				batchIDs := needSyncIDsPage[start:end]
				batchInfos, err := f.DrivenMdlDataModel.GetDataView(ctx, batchIDs)
				if err != nil {
					log.WithContext(ctx).Error("get data view detail from mdl-data-model fail", zap.Error(err), zap.Int("batchSize", len(batchIDs)), zap.String("datasource_id", ds.ID))
					return
				}
				if err = f.compareFormViewBatch(ctx, batchInfos, viewMapPage, formViewsMap, formViewInfosMap, &pool); err != nil {
					log.WithContext(ctx).Error("compare/sync form_view batch fail", zap.Error(err), zap.Int("offset", offset), zap.Int("batchStart", start), zap.String("datasource_id", ds.ID))
					return
				}
				batchInfos = nil
			}
			viewMapPage = nil
			needSyncIDsPage = nil
			if len(page.Entries) < listPageSize {
				break
			}
			offset += len(page.Entries)
		}

		if fullSync {
			if err = f.deleteFormViewFromSyncFlags(ctx, formViewsMap); err != nil {
				log.WithContext(ctx).Error("delete form_view (full sync) fail", zap.Error(err), zap.String("datasource_id", ds.ID))
				return
			}
		}
	}

	// 同步完成后，将本次同步开始时间保存到 Redis，作为下次增量同步的起点
	if err = f.redis.GetClient().Set(ctx, syncTimeKey, syncStartTimeMs, 0).Err(); err != nil {
		log.WithContext(ctx).Error("save sync time to redis fail", zap.Error(err), zap.Int64("syncStartTimeMs", syncStartTimeMs))
		// 不返回错误，因为同步已经完成，只是记录失败
	} else {
		log.WithContext(ctx).Infof("sync completed, saved sync time to redis: %d (next sync will start from this time)", syncStartTimeMs)
	}
}

type SyncFormViewFlag struct {
	FormViewID         string
	UniformCatalogCode string
	flag               int
}

type viewSyncEntry struct{ DataSourceId, TechnicalName string }

// codePool 用于按需批量获取统一视图编码，避免一次性生成大 codeList 占用内存
type codePool struct {
	entries []string
	index   int
}

const dataViewCodeBatchSize = 200

func (f *formViewUseCase) nextDataViewCode(ctx context.Context, pool *codePool) (string, error) {
	if pool == nil {
		return "", nil
	}
	// 当前批次已用完，向配置中心再要一批编码
	if pool.index >= len(pool.entries) {
		batch := dataViewCodeBatchSize
		codeList, err := f.configurationCenterDrivenNG.Generate(ctx, CodeGenerationRuleUUIDDataView, batch)
		if err != nil {
			if agerrors.Code(err).GetErrorCode() == "ConfigurationCenter.CodeGenerationRule.NotFound" {
				// 兼容老版本配置中心：打 warn，返回空编码，后续逻辑自行处理
				log.WithContext(ctx).Warn("generate code for data view fail", zap.Error(err),
					zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", batch))
				pool.entries = make([]string, batch)
				pool.index = 0
			} else {
				log.WithContext(ctx).Error("generate code for data view fail", zap.Error(err),
					zap.Stringer("rule", CodeGenerationRuleUUIDDataView), zap.Int("count", batch))
				return "", err
			}
		} else {
			pool.entries = codeList.Entries
			pool.index = 0
		}
	}
	if pool.index >= len(pool.entries) {
		return "", nil
	}
	code := pool.entries[pool.index]
	pool.index++
	return code, nil
}

func (f *formViewUseCase) buildFormViewSyncMaps(syncList []*form_view_repo.FormViewSyncItem) (
	formViewsMap map[string]*SyncFormViewFlag,
	formViewInfosMap map[string]*SyncFormViewFlag,
) {
	formViewsMap = make(map[string]*SyncFormViewFlag)
	formViewInfosMap = make(map[string]*SyncFormViewFlag)
	for _, item := range syncList {
		flag := &SyncFormViewFlag{FormViewID: item.ID, UniformCatalogCode: item.UniformCatalogCode, flag: 1}
		if item.MdlID != "" {
			formViewsMap[item.MdlID] = flag
		}
		tmp := fmt.Sprintf("%s %s", item.DatasourceID, item.TechnicalName)
		formViewInfosMap[tmp] = flag
	}
	return formViewsMap, formViewInfosMap
}

// buildFormViewSyncMapsPaged 分页拉取指定数据源的 sync 所需字段并构建映射，不一次性加载全量 syncList
func (f *formViewUseCase) buildFormViewSyncMapsPaged(ctx context.Context, datasourceId string) (
	formViewsMap map[string]*SyncFormViewFlag,
	formViewInfosMap map[string]*SyncFormViewFlag,
	err error,
) {
	formViewsMap = make(map[string]*SyncFormViewFlag)
	formViewInfosMap = make(map[string]*SyncFormViewFlag)
	const syncListPageSize = 1000
	for offset := 0; ; {
		page, err := f.repo.GetFormViewSyncList(ctx, offset, syncListPageSize, datasourceId)
		if err != nil {
			return nil, nil, err
		}
		if len(page) == 0 {
			break
		}
		for _, item := range page {
			flag := &SyncFormViewFlag{FormViewID: item.ID, UniformCatalogCode: item.UniformCatalogCode, flag: 1}
			if item.MdlID != "" {
				formViewsMap[item.MdlID] = flag
			}
			tmp := fmt.Sprintf("%s %s", item.DatasourceID, item.TechnicalName)
			formViewInfosMap[tmp] = flag
		}
		if len(page) < syncListPageSize {
			break
		}
		offset += len(page)
	}
	return formViewsMap, formViewInfosMap, nil
}

// compareFormViewBatch 对单批视图详情做新增/更新；更新时按 FormViewID 加载完整 FormView
func (f *formViewUseCase) compareFormViewBatch(ctx context.Context, tables []*mdl_data_model.GetDataViewResp, viewMap map[string]viewSyncEntry,
	formViewsMap map[string]*SyncFormViewFlag, formViewInfosMap map[string]*SyncFormViewFlag, pool *codePool) error {
	for _, table := range tables {
		tmp := fmt.Sprintf("%s %s", table.DataSourceId, table.TechnicalName)
		var fvFlag *SyncFormViewFlag
		if formViewsMap[table.Id] != nil {
			fvFlag = formViewsMap[table.Id]
		} else if formViewInfosMap[tmp] != nil {
			fvFlag = formViewInfosMap[tmp]
		}

		if fvFlag == nil {
			code, err := f.nextDataViewCode(ctx, pool)
			if err != nil {
				return err
			}
			if err := f.newFormView(ctx, code, viewMap, table); err != nil {
				return err
			}
		} else {
			newUniformCatalogCode := fvFlag.UniformCatalogCode == ""
			if newUniformCatalogCode {
				code, err := f.nextDataViewCode(ctx, pool)
				if err != nil {
					return err
				}
				fvFlag.UniformCatalogCode = code
			}

			formView, err := f.repo.GetById(ctx, fvFlag.FormViewID)
			if err != nil {
				return err
			}
			if err := f.updateFormView(ctx, formView, table, newUniformCatalogCode); err != nil {
				return err
			}
			fvFlag.flag = 2
		}
	}
	return nil
}

func (f *formViewUseCase) newFormView(ctx context.Context, uniformCatalogCode string, viewMap map[string]viewSyncEntry, table *mdl_data_model.GetDataViewResp) (err error) {
	formViewId := uuid.New().String()
	fields := make([]*model.FormViewField, len(table.Fields))
	fieldObjs := make([]*es.FieldObj, len(table.Fields)) // 发送ES消息字段列表
	var selectField string
	for i, field := range table.Fields {
		fields[i] = &model.FormViewField{
			FormViewID:       formViewId,
			TechnicalName:    field.Name,
			BusinessName:     field.DisplayName,
			OriginalName:     field.OriginalName,
			Comment:          sql.NullString{String: util.CutStringByCharCount(field.Comment, constant.CommentCharCountLimit), Valid: true},
			Status:           constant.FormViewNew.Integer.Int32(),
			PrimaryKey:       sql.NullBool{Bool: false, Valid: true},
			DataType:         field.Type,
			DataLength:       field.DataLength,
			DataAccuracy:     ToDataAccuracy(&field.DataAccuracy),
			OriginalDataType: field.Type,
			IsNullable:       field.IsNullable,
			Index:            i + 1,
		}
		fieldObjs[i] = &es.FieldObj{
			FieldNameZH: fields[i].BusinessName,
			FieldNameEN: fields[i].TechnicalName,
		}
		selectField = util.CE(selectField == "", util.QuotationMark(field.Name), fmt.Sprintf("%s,%s", selectField, util.QuotationMark(field.Name))).(string)
	}
	formView := &model.FormView{
		ID:                 formViewId,
		UniformCatalogCode: uniformCatalogCode,
		TechnicalName:      table.TechnicalName,
		BusinessName:       table.Name,
		OriginalName:       table.TechnicalName,
		Type:               constant.FormViewTypeDatasource.Integer.Int32(),
		DatasourceID:       viewMap[table.Id].DataSourceId,
		Status:             constant.FormViewNew.Integer.Int32(),
		EditStatus:         constant.FormViewDraft.Integer.Int32(),
		Comment:            sql.NullString{String: util.CutStringByCharCount(table.Comment, constant.CommentCharCountLimit), Valid: true},
		CreatedByUID:       table.Creator.ID,
		UpdatedByUID:       table.Updater.ID,
		MdlID:              table.Id,
	}

	tx := f.repo.Db().WithContext(ctx).Begin()
	//createSql := fmt.Sprintf("select %s from %s.%s.%s", selectField, dataSource.CatalogName, util.QuotationMark(dataSource.Schema), util.QuotationMark(table.Name))
	if err = f.repo.CreateFormAndField(ctx, formView, fields, "", tx); err != nil {
		log.WithContext(ctx).Error("【ScanDataSource】createView  DatabaseError", zap.Error(err))
		tx.Rollback()
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	if err = f.esRepo.PubToES(ctx, formView, fieldObjs); err != nil { //扫描创建元数据视图
		tx.Rollback()
		return err
	}
	if err = tx.Commit().Error; err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	return nil
}

func (f *formViewUseCase) updateFormView(ctx context.Context, formView *model.FormView, table *mdl_data_model.GetDataViewResp, newUniformCatalogCode bool) (err error) {
	fieldList, err := f.fieldRepo.GetFormViewFieldList(ctx, formView.ID)
	if err != nil {
		return err
	}

	newFields := make([]*model.FormViewField, 0)
	updateFields := make([]*model.FormViewField, 0)
	deleteFields := make([]string, 0)

	fieldMap := make(map[string]*FormViewFieldFlag)
	for _, field := range fieldList {
		fieldMap[field.TechnicalName] = &FormViewFieldFlag{FormViewField: field, flag: 1}
	}
	formViewModify := false
	fieldNewOrDelete := false
	fieldObjs := make([]*es.FieldObj, len(table.Fields)) // 发送ES消息字段列表
	var selectFields string
	for i, field := range table.Fields {
		fieldObjs[i] = &es.FieldObj{
			FieldNameEN: field.Name,
		}
		if fieldMap[field.Name] == nil {
			//field new
			newField := &model.FormViewField{
				FormViewID:       formView.ID,
				TechnicalName:    field.Name,
				BusinessName:     field.DisplayName,
				OriginalName:     field.OriginalName,
				Comment:          sql.NullString{String: util.CutStringByCharCount(field.Comment, constant.CommentCharCountLimit), Valid: true},
				Status:           constant.FormViewFieldNew.Integer.Int32(),
				PrimaryKey:       sql.NullBool{Bool: false, Valid: true},
				DataType:         field.Type,
				DataLength:       field.DataLength,
				DataAccuracy:     ToDataAccuracy(&field.DataAccuracy),
				OriginalDataType: field.Type,
				IsNullable:       field.IsNullable,
				Index:            i + 1,
			}
			newFields = append(newFields, newField)
			formViewModify = true
			fieldNewOrDelete = true
			fieldObjs[i].FieldNameZH = newField.BusinessName
			if newField.DataType == "" { //不支持的类型设置状态，跳过创建
				newField.Status = constant.FormViewFieldNotSupport.Integer.Int32()
			} else {
				selectFields = util.CE(selectFields == "", util.QuotationMark(field.Name), fmt.Sprintf("%s,%s", selectFields, util.QuotationMark(field.Name))).(string)
			}
		} else {
			// field update
			oldField := fieldMap[field.Name]
			switch {
			case oldField.Status == constant.FormViewFieldDelete.Integer.Int32(): //删除的反转为新增
				log.WithContext(ctx).Infof("FormViewFieldDelete status Reversal", zap.String("oldField ID", oldField.ID))
				updateFields = append(updateFields, &model.FormViewField{ID: oldField.ID, Status: constant.FormViewFieldNew.Integer.Int32(), Index: i + 1})
				formViewModify = true
			case oldField.Comment.String != field.Comment: //不变状态
				oldField.FormViewField.Index = i + 1
				oldField.FormViewField.Comment = sql.NullString{String: util.CutStringByCharCount(field.Comment, constant.CommentCharCountLimit), Valid: true}
				updateFields = append(updateFields, oldField.FormViewField)
			case oldField.Index != i+1:
				oldField.FormViewField.Index = i + 1
				updateFields = append(updateFields, oldField.FormViewField)
			default: //field not update
			}
			fieldMap[field.Name].flag = 2
			fieldObjs[i].FieldNameZH = field.DisplayName
		}
	}
	for _, field := range fieldMap {
		if field.flag == 1 {
			//field delete
			deleteFields = append(deleteFields, field.ID)
			formViewModify = true
			fieldNewOrDelete = true
		}
	}

	if formView.MdlID == "" {
		formView.MdlID = table.Id
	}
	tableStatusInt := enum.ToInteger[constant.FormViewScanStatus](table.Status).Int32()
	formViewUpdate := formView.Comment.String != table.Comment || formView.OriginalName != table.TechnicalName ||
		formView.BusinessName != table.Name || formView.Status != tableStatusInt
	if formViewUpdate {
		formView.Comment = sql.NullString{String: util.CutStringByCharCount(table.Comment, constant.CommentCharCountLimit), Valid: true}
		formView.OriginalName = table.TechnicalName
	}
	var query string
	if formViewModify { //表的字段有变化
		if formView.EditStatus == constant.FormViewLatest.Integer.Int32() {
			formView.EditStatus = constant.FormViewDraft.Integer.Int32() //有修改，全部Draft
			formViewUpdate = true
		}
		if formView.Status == constant.FormViewUniformity.Integer.Int32() || formView.Status == constant.FormViewNew.Integer.Int32() {
			formViewUpdate = true
		}
	}
	if formView.Status == constant.FormViewDelete.Integer.Int32() { //删除状态又找到
		log.WithContext(ctx).Infof("FormViewDelete status Reversal", zap.String("formView ID", formView.ID))
		formView.EditStatus = constant.FormViewDraft.Integer.Int32()
		formViewUpdate = true
	}
	formView.Status = tableStatusInt
	formView.BusinessName = table.Name
	// 字段没有变化且视图信息也没有变化时，不更新 DB/ES
	if len(newFields) == 0 && len(updateFields) == 0 && len(deleteFields) == 0 && !formViewUpdate && !newUniformCatalogCode {
		return nil
	}
	if len(newFields) != 0 || len(updateFields) != 0 || len(deleteFields) != 0 { //字段及表都修改
		formView.UpdatedByUID = table.Updater.ID
		if err = f.repo.UpdateViewTransaction(ctx, formView, newFields, updateFields, deleteFields, query); err != nil {
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
		if err = f.esRepo.PubToES(ctx, formView, fieldObjs); err != nil { //扫描编辑元数据视图
			return err
		}
		f.RevokeAudit(ctx, formView, "原因：之前处于审核中时，有扫描到字段变更，因此撤销了当时的审核，需要重新进行提交")
	} else if formViewUpdate || newUniformCatalogCode { //只反转，字段不变更，或分配新的 UniformCatalogCode
		formView.UpdatedByUID = table.Updater.ID
		if err = f.repo.Update(ctx, formView); err != nil {
			log.WithContext(ctx).Error("【formViewUseCase】updateView repo Update", zap.Error(err))
			return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
		}
	}

	if fieldNewOrDelete {
		result, err := f.redis.GetClient().Del(ctx, fmt.Sprintf(constant.SyntheticDataKey, formView.ID)).Result()
		if err != nil {
			log.WithContext(ctx).Error("【formViewUseCase】updateView fieldNewOrDelete clear synthetic-data fail ", zap.Error(err))
		}
		log.WithContext(ctx).Infof("【formViewUseCase】updateView fieldNewOrDelete clear synthetic-data result %d", result)
	}

	return nil
}

// deleteFormViewFromSyncFlags 全量同步时删除本地已不存在的视图
func (f *formViewUseCase) deleteFormViewFromSyncFlags(ctx context.Context, formViewsMap map[string]*SyncFormViewFlag) (err error) {
	deleteIds := make([]string, 0)
	for _, fv := range formViewsMap {
		if fv.flag == 1 {
			deleteIds = append(deleteIds, fv.FormViewID)
		}
	}
	if len(deleteIds) == 0 {
		return nil
	}
	auditingLogicView, err := f.logicViewRepo.GetAuditingInIds(ctx, deleteIds)
	if err != nil {
		return errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	for _, view := range auditingLogicView {
		f.RevokeAudit(ctx, view, "原因：之前处于审核中时，有扫描到视图删除，因此撤销了当时的审核，需要重新提交")
	}
	auditAdvice := "之前有扫描到“源表删除”的结果，导致资源不可用并做了自动下线的处理。"
	return f.repo.UpdateViewStatusAndAdvice(ctx, auditAdvice, deleteIds)
}
