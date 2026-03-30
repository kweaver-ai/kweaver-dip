package impl

import (
	"context"
	"fmt"
	"strings"
	"time"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/task_center"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/virtualization_engine"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/data_sync"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	task_center2 "github.com/kweaver-ai/idrm-go-common/rest/task_center"
	"github.com/kweaver-ai/idrm-go-common/rest/virtual_engine"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

// queryUserInfo 返回用户信息
func (u *useCase) queryUserInfo(ctx context.Context, userID string) request.UserInfo {
	userInfo := request.UserInfo{Uid: userID}
	userInfoSlice, err := u.ccDriven.GetBaseUserByIds(ctx, []string{userID})
	if err != nil {
		log.WithContext(ctx).Warnf("user no token")
		return userInfo
	}
	if len(userInfoSlice) <= 0 {
		return userInfo
	}
	userInfo.UserName = userInfoSlice[0].Name
	return userInfo
}

// queryCatalogSourceFields 查询目录绑定的表的字段
func (u *useCase) queryCatalogSourceFields(ctx context.Context, catalogID uint64) (*DataViewFieldInfo, error) {
	dataResource, err := u.dataResourceRepo.GetByCatalogId(ctx, catalogID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	//查询视图的ID
	resourceID := ""
	departmentID := ""
	for _, r := range dataResource {
		if r.Type != constant.MountView {
			continue
		}
		resourceID = r.ResourceId
		departmentID = r.DepartmentId
	}
	if resourceID == "" {
		return nil, errorcode.Desc(errorcode.NoTableMounted)
	}
	//视图查询字段
	fieldResp, err := u.dataViewDriven.GetDataViewField(ctx, resourceID)
	if err != nil {
		return nil, err
	}
	return &DataViewFieldInfo{
		GetFieldsRes: *fieldResp,
		DepartmentID: departmentID,
	}, nil
}

// QueryDatasourceInfo 查询数据源信息
func (u *useCase) queryDatasourceInfo(ctx context.Context, id string) (*DataSource, error) {
	datasourceInfos, err := u.ccDriven.GetDataSourcePrecision(ctx, []string{id})
	if err != nil {
		return nil, err
	}
	dataSourceInfo := &DataSource{}
	if len(datasourceInfos) > 0 {
		dataSourceInfo = &DataSource{
			Name:         datasourceInfos[0].Name,
			DataSourceID: datasourceInfos[0].DataSourceID,
			ID:           datasourceInfos[0].ID,
			DepartmentID: datasourceInfos[0].DepartmentID,
			CatalogName:  datasourceInfos[0].CatalogName,
			Schema:       datasourceInfos[0].Schema,
			TypeName:     datasourceInfos[0].TypeName,
			HuaAoId:      datasourceInfos[0].HuaAoId,
			SourceType:   datasourceInfos[0].SourceType,
		}
	}
	return dataSourceInfo, nil
}

// querySourceDetail 数据推送详情，查询来源表信息
func (u *useCase) querySourceDetail(ctx context.Context, dataPush *model.TDataPushModel) (*domain.SourceDetail, error) {
	sourceDetail := &domain.SourceDetail{
		TableID:   dataPush.SourceTableID,
		CatalogID: fmt.Sprintf("%v", dataPush.SourceCatalogID),
	}
	//查询目录
	if catalogInfo, err := u.catalogRepo.Get(nil, ctx, dataPush.SourceCatalogID); err != nil {
		log.WithContext(ctx).Errorf("data push source %v catalog %v not exists", dataPush.ID, dataPush.SourceCatalogID)
	} else {
		sourceDetail.CatalogName = catalogInfo.Title
		sourceDetail.DepartmentID = dataPush.SourceDepartmentID
	}
	//查询挂载资源信息, 资源查不到也是要报错的
	if dataResource, err := u.dataResourceRepo.GetByResourceId(ctx, dataPush.SourceTableID); err != nil {
		log.WithContext(ctx).Errorf("data push source %v data resource %v not exists", dataPush.ID, dataPush.SourceTableID)
		return nil, err
	} else {
		sourceDetail.TableDisplayName = dataResource.Name
		sourceDetail.Encoding = dataResource.Code
	}
	//视图查询字段, 视图还是很重要的，没有的话就表示被删除了，报个错吧
	if sourceTableInfo, err := u.dataViewDriven.GetDataViewField(ctx, dataPush.SourceTableID); err != nil {
		log.WithContext(ctx).Errorf("data push source %v data view %v not exists", dataPush.ID, dataPush.SourceTableID)
		return nil, err
	} else {
		sourceDetail.TableDisplayName = sourceTableInfo.BusinessName
		sourceDetail.TableTechnicalName = sourceTableInfo.TechnicalName
		sourceDetail.DBType = sourceTableInfo.DatasourceType
		sourceDetail.Fields = sourceTableInfo.FieldsRes
	}
	//查询部门信息
	if sourceDetail.DepartmentID != "" {
		departmentsInfo, err := u.ccDriven.GetDepartmentPrecision(ctx, []string{sourceDetail.DepartmentID})
		if err != nil || (departmentsInfo != nil && len(departmentsInfo.Departments) <= 0) {
			log.WithContext(ctx).Errorf("data push source %v department %v not exists", dataPush.ID, sourceDetail.DepartmentID)
		} else {
			sourceDetail.DepartmentName = departmentsInfo.Departments[0].Name
		}
	}
	return sourceDetail, nil
}

// queryTargetDetail 数据推送详情，查询目的表信息
func (u *useCase) queryTargetDetail(ctx context.Context, dataPush *model.TDataPushModel) (*domain.TargetDetail, error) {
	targetDetail := &domain.TargetDetail{
		TargetTableExists:     dataPush.TargetTableExists > 0,
		TableName:             dataPush.TargetTableName,
		DatasourceID:          dataPush.TargetDatasourceUUID,
		DepartmentID:          dataPush.TargetDepartmentID,
		DepartmentName:        "",
		SourceType:            0,
		SandboxProjectName:    "",
		SandboxDatasourceName: "",
		SandboxID:             dataPush.TargetSandboxID,
	}
	//查询数据资源
	datasource, err := u.queryDatasourceInfo(ctx, dataPush.TargetDatasourceUUID)
	if err != nil {
		log.WithContext(ctx).Errorf("data push target %v datasource  %v not exists", dataPush.ID, dataPush.TargetDatasourceID)
		return nil, err
	}
	targetDetail.DatasourceName = datasource.Name
	targetDetail.DBType = datasource.TypeName
	targetDetail.SourceType = datasource.SourceType
	//查询沙箱详情
	//如果targetDetail.SourceType=3(沙箱)，且dataPush.TargetSandboxID不为空，则查询沙箱详情
	if targetDetail.SourceType == 3 && dataPush.TargetSandboxID != "" {
		req := &task_center.GetSandboxDetailReq{
			ID: dataPush.TargetSandboxID,
		}
		sandboxDetail, err := u.taskCenterDriven.GetSandboxDetail(ctx, req)
		if err != nil {
			log.WithContext(ctx).Warnf("failed to get sandbox detail for sandbox_id %s: %v", dataPush.TargetSandboxID, err)
		} else {
			// 设置沙箱相关信息到targetDetail
			targetDetail.SandboxProjectName = sandboxDetail.ProjectName
		}
		sandboxInfo, err := u.taskDriven.GetSandboxSampleInfo(ctx, dataPush.TargetSandboxID)
		if err != nil {
			log.WithContext(ctx).Warnf("failed to get sandbox sample info for sandbox_id %s: %v", dataPush.TargetSandboxID, err)
		} else {
			targetDetail.SandboxDatasourceName = sandboxInfo.DatasourceName
		}
	}

	//查询部门信息
	if targetDetail.DepartmentID != "" {
		departmentsInfo, err := u.ccDriven.GetDepartmentPrecision(ctx, []string{targetDetail.DepartmentID})
		if err != nil || (departmentsInfo != nil && len(departmentsInfo.Departments) <= 0) {
			log.WithContext(ctx).Errorf("data push target %v department %v not exists", dataPush.ID, targetDetail.DepartmentID)
		} else {
			targetDetail.DepartmentName = departmentsInfo.Departments[0].Name
		}
	}

	return targetDetail, nil
}

// querySyncModelFields 数据推送详情，查询同步字段映射信息
func (u *useCase) querySyncModelFields(ctx context.Context, dataPush *model.TDataPushModel, fields []*model.TDataPushField) ([]*domain.SyncModelField, error) {
	sourceTableInfo, err := u.dataViewDriven.GetDataViewField(ctx, dataPush.SourceTableID)
	if err != nil {
		log.WithContext(ctx).Errorf("data push source %v data view %v not exists", dataPush.ID, dataPush.SourceTableID)
		return nil, err
	}

	sourceFieldDict := lo.SliceToMap(sourceTableInfo.FieldsRes, func(item *data_view.FieldsRes) (string, *data_view.FieldsRes) {
		return item.TechnicalName, item
	})
	commonModestart := time.Now()
	// 首先通过 common 中的 getDesensitizationRuleFieldMap() 方法获取脱敏规则map
	commonModel, err := u.NewCommonModel(ctx, dataPush)
	if err != nil {
		return nil, err
	}
	commonModeend := time.Now()
	commonModediff := commonModeend.Sub(commonModestart)
	log.Infof("NewCommonModel时间差: %d ms", commonModediff.Milliseconds())
	// 通过fields为commonModel添加TargetFieldsInfo
	commonModel.TargetFieldsInfo = fields

	ruleMap, err := commonModel.getDesensitizationRuleFieldMap(ctx)
	if err != nil {
		return nil, err
	}

	syncFields := make([]*domain.SyncModelField, 0)
	for i := range fields {
		syncField := &domain.SyncModelField{}
		copier.Copy(syncField, fields[i])
		sourceField, ok := sourceFieldDict[fields[i].SourceTechName]
		if !ok {
			continue
		}
		syncModelSourceField := &domain.SourceField{}
		copier.Copy(syncModelSourceField, sourceField)
		if sourceField.PrimaryKey {
			syncModelSourceField.PrimaryKey = 1
		}
		syncField.FieldID = sourceField.ID
		syncField.SourceField = syncModelSourceField
		syncField.DesensitizationRuleId = fields[i].DesensitizationRuleId
		if rule, ok := ruleMap[fields[i].TechnicalName]; ok {
			syncField.DesensitizationRuleName = rule.Name
		}
		syncFields = append(syncFields, syncField)
	}
	return syncFields, err
}

// querySyncTaskHistoryLatest  查询执行历史
func (u *useCase) querySyncTaskHistoryLatest(ctx context.Context, id string) ([]*data_sync.TaskLogInfo, error) {
	req := &data_sync.TaskLogReq{
		Offset:    1,
		Limit:     10,
		Direction: "desc",
		Sort:      "start_time",
		Step:      "INSERT",
		ModelUUID: id,
	}
	taskLogDetail, err := u.dataSyncDriven.QueryTaskHistory(ctx, req)
	if err != nil {
		return nil, err
	}
	return taskLogDetail.TotalList, nil
}

// queryLastTaskExecuteInfo  查询最后一次执行时间
func (u *useCase) queryLastTaskExecuteInfo(ctx context.Context, id uint64) (*data_sync.TaskLogInfo, error) {
	list, err := u.querySyncTaskHistoryLatest(ctx, fmt.Sprintf("%v", id))
	if err != nil || len(list) <= 0 {
		return nil, err
	}
	return list[0], nil
}

// queryLastTaskExecuteTime  查询最后一次执行时间
func (u *useCase) queryLastTaskExecuteTime(ctx context.Context, id uint64) (string, string) {
	list, err := u.querySyncTaskHistoryLatest(ctx, fmt.Sprintf("%v", id))
	if err != nil || len(list) <= 0 {
		return "", ""
	}
	return list[0].StartTime, list[0].Status
}

// queryDBConnectorConfig  查询olk类型映射
// 优先使用 DatabaseTypeMapping 构建映射，失败时降级到 DBConnectorConfig
func (u *useCase) queryDBConnectorConfig(ctx context.Context, dbType string, sourceTypeMapping *virtual_engine.DatabaseTypeMappingReq, olkTypeMapping *virtual_engine.DatabaseTypeMappingResp) (map[string]string, error) {
	// 优先使用 DatabaseTypeMapping 构建映射
	if sourceTypeMapping != nil && olkTypeMapping != nil &&
		len(sourceTypeMapping.Type) > 0 && len(olkTypeMapping.Type) > 0 {

		olkTypeDict := u.buildOlkTypeDictFromMappings(sourceTypeMapping, olkTypeMapping)

		// 验证映射完整性
		if len(olkTypeDict) > 0 {
			log.WithContext(ctx).Infof("使用 DatabaseTypeMapping 构建类型映射，数据库类型: %s, 映射数量: %d", dbType, len(olkTypeDict))
			return olkTypeDict, nil
		}

		log.WithContext(ctx).Warnf("DatabaseTypeMapping 构建的类型映射为空，降级使用 DBConnectorConfig，数据库类型: %s", dbType)
	} else {
		log.WithContext(ctx).Infof("DatabaseTypeMapping 参数不完整，直接使用 DBConnectorConfig，数据库类型: %s", dbType)
	}

	// 降级到原有的 DBConnectorConfig 方式
	connectorResp, err := u.virtualEngine.DBConnectorConfig(ctx, dbType)
	if err != nil {
		log.WithContext(ctx).Errorf("DBConnectorConfig 调用失败，数据库类型: %s, 错误: %v", dbType, err)
		return nil, err
	}

	olkTypeDict := lo.SliceToMap(connectorResp.Type, func(item *virtual_engine.ConnectorConfigColumn) (string, string) {
		return item.SourceType, item.OlkSearchType
	})

	log.WithContext(ctx).Infof("使用 DBConnectorConfig 构建类型映射，数据库类型: %s, 映射数量: %d", dbType, len(olkTypeDict))
	return olkTypeDict, nil
}

// buildOlkTypeDictFromMappings 从 DatabaseTypeMapping 的结果构建类型映射字典
// 通过索引匹配源类型和目标类型，确保映射的准确性
func (u *useCase) buildOlkTypeDictFromMappings(sourceTypeMapping *virtual_engine.DatabaseTypeMappingReq, olkTypeMapping *virtual_engine.DatabaseTypeMappingResp) map[string]string {
	olkTypeDict := make(map[string]string)

	// 数据验证
	if sourceTypeMapping == nil || olkTypeMapping == nil {
		return olkTypeDict
	}

	// 按索引构建源类型映射表，便于快速查找
	sourceTypeByIndex := make(map[int]string)
	for _, sourceField := range sourceTypeMapping.Type {
		if sourceField.SourceTypeName != "" {
			sourceTypeByIndex[sourceField.Index] = strings.ToUpper(sourceField.SourceTypeName)
		}
	}

	// 按索引匹配源类型和目标类型
	var unmatchedIndices []int
	for _, targetField := range olkTypeMapping.Type {
		if sourceType, exists := sourceTypeByIndex[targetField.Index]; exists {
			if targetField.TargetTypeName != "" {
				olkTypeDict[sourceType] = targetField.TargetTypeName
			}
		} else {
			unmatchedIndices = append(unmatchedIndices, targetField.Index)
		}
	}

	// 记录未匹配的索引，用于调试
	if len(unmatchedIndices) > 0 {
		log.Debugf("DatabaseTypeMapping 中存在未匹配的目标字段索引: %v", unmatchedIndices)
	}

	return olkTypeDict
}

func (u *useCase) genSQL(ctx context.Context, commonModel *CommonModel, sourceTableInfo *DataViewFieldInfo) (err error) {
	//类型映射
	// sourceTypeMapping := commonModel.SourceTypeMapping(sourceTableInfo)
	targetTypeMapping := commonModel.TargetTypeMapping()
	// sourceOlkTypeMapping, err := u.virtualEngine.DatabaseTypeMapping(ctx, sourceTypeMapping)
	// if err != nil {
	// 	return err
	// }
	targetOlkTypeMapping, err := u.virtualEngine.DatabaseTypeMapping(ctx, targetTypeMapping)
	if err != nil {
		return err
	}
	generateSQLData, err := commonModel.genDataTableTypeMappingReq(targetOlkTypeMapping)
	if err != nil {
		return err
	}
	//获取到建表语句
	createSQL, err := u.GenerateCreateSQL(ctx, generateSQLData, commonModel.TargetDatasourceInfo)
	if err != nil {
		return err
	}
	commonModel.PushData.CreateSQL = createSQL
	//组装插入语句
	commonModel.OlkTargetSearchTypeDict, err = u.queryDBConnectorConfig(ctx, commonModel.TargetDatasourceInfo.TypeName, targetTypeMapping, targetOlkTypeMapping)
	log.WithContext(ctx).Infof("commonModel.OlkTargetSearchTypeDict: %+v", commonModel.OlkTargetSearchTypeDict)
	if err != nil {
		return err
	}
	commonModel.PushData.InsertSQL, err = commonModel.genInsertSQL(ctx, targetOlkTypeMapping)
	//如果PushData是增量更新且要求同时更新存量数据，则生成更新语句
	if commonModel.PushData.TransmitMode == constant.TransmitModeInc.Integer.Int32() && commonModel.PushData.UpdateExistingDataFlag == 1 {
		commonModel.PushData.UpdateSQL, err = commonModel.genUpdateSQL()
	}
	return err
}

// queryListDepartmentPathInfo  查询部门的父级，方便按部门查询
func (u *useCase) queryListDepartmentPathInfo(ctx context.Context, req *domain.ListPageReq) {
	if req.SourceDepartmentID != "" {
		req.SourceDepartmentIDPath = []string{
			req.SourceDepartmentID,
		}
		departmentSlice, err := u.ccDriven.GetChildDepartments(ctx, req.SourceDepartmentID)
		if err != nil {
			log.Errorf("query list department path info error, %v", err)
			return
		}
		for i := range departmentSlice.Entries {
			node := departmentSlice.Entries[i]
			ids := strings.Split(node.PathID, "/")
			req.SourceDepartmentIDPath = append(req.SourceDepartmentIDPath, ids...)
		}
		req.SourceDepartmentIDPath = lo.Uniq(req.SourceDepartmentIDPath)
	}
	if req.TargetDepartmentID != "" {
		req.TargetDepartmentIDPath = []string{
			req.TargetDepartmentID,
		}
		departmentSlice, err := u.ccDriven.GetChildDepartments(ctx, req.TargetDepartmentID)
		if err != nil {
			log.Errorf("query list department path info error, %v", err)
			return
		}
		for i := range departmentSlice.Entries {
			node := departmentSlice.Entries[i]
			ids := strings.Split(node.PathID, "/")
			req.TargetDepartmentIDPath = append(req.TargetDepartmentIDPath, ids...)
		}
		req.TargetDepartmentIDPath = lo.Uniq(req.TargetDepartmentIDPath)
	}
}

// queryUserSandboxInfo 查询用可见的空间的推送日志
func (u *useCase) queryUserSandboxInfo(ctx context.Context, req *domain.ListPageReq) error {
	//是沙箱列表页面,或者说查询多个项目
	if !req.WithSandboxInfo || len(req.AuthedSandboxID) > 0 {
		return nil
	}
	sandboxInfoListPageResult, err := u.taskDriven.GetUserSandboxSampleInfo(ctx)
	if err != nil {
		return errorcode.Detail(errorcode.DataPushGetSpaceInfoError, err.Error())
	}
	list := sandboxInfoListPageResult.Entries
	req.AuthedSandboxID = lo.Uniq(lo.Times(len(list), func(index int) string {
		return list[index].SandboxID
	}))
	req.AuthedSandboxDict = lo.SliceToMap(list, func(item *task_center2.SandboxSpaceListItem) (string, string) {
		return item.SandboxID, item.ProjectName
	})
	return nil
}

// getCatalogDict 查询用可见的空间的推送日志
func (u *useCase) getCatalogDict(ctx context.Context, catalogID []uint64) (map[uint64]string, error) {
	catalogInfoSlice, err := u.catalogRepo.GetDetailByIds(nil, ctx, nil, catalogID...)
	if err != nil {
		return make(map[uint64]string), errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return lo.SliceToMap(catalogInfoSlice, func(item *model.TDataCatalog) (uint64, string) {
		return item.ID, item.Title
	}), nil
}

// queryMaxIncrementValue 查询增量字段的最大值
func (u *useCase) queryMaxIncrementValue(ctx context.Context, sql string) (string, error) {
	// 通过类型断言将 u.virtualEngine 转换为 VirtualizationEngine 接口
	ve, ok := u.virtualEngine.(virtualization_engine.VirtualizationEngine)
	if !ok {
		return "", fmt.Errorf("virtual engine does not implement VirtualizationEngine interface")
	}

	// 调用 VirtualizationEngine 接口的 Raw 方法执行 SQL 查询
	rawResult, err := ve.Raw(ctx, sql)
	if err != nil {
		return "", err
	}
	if len(rawResult.Data) == 0 || len(rawResult.Data[0]) == 0 {
		return "", fmt.Errorf("no data returned")
	}
	// 返回第一行第一列的值，并转换为字符串
	return fmt.Sprintf("%v", rawResult.Data[0][0]), nil
}
