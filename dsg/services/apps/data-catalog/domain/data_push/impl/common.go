package impl

import (
	"context"
	"fmt"
	"slices"
	"strconv"
	"strings"
	"time"

	"github.com/jinzhu/copier"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_push"

	localDataView "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/rest/data_sync"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/virtual_engine"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/robfig/cron/v3"
	"github.com/samber/lo"
)

type CommonModel struct {
	//数据库对象
	PushData *model.TDataPushModel
	//数据源对象
	TargetDatasourceInfo *DataSource
	SourceDatasourceInfo *DataSource
	//辅助信息
	SourceDataTableFields   []*business_grooming.DataTableFieldInfo
	TargetFieldsInfo        []*model.TDataPushField
	OlkTargetSearchTypeDict map[string]string
	DataViewRepo            localDataView.Repo
}
type DataViewFieldInfo struct {
	data_view.GetFieldsRes
	DepartmentID string `json:"department_id"`
}

func (u *useCase) NewCommonModel(ctx context.Context, dataPush *model.TDataPushModel) (*CommonModel, error) {
	queryDatasourceInfostart := time.Now()
	//查询来源数据源
	sourceDatasourceInfo, err := u.queryDatasourceInfo(ctx, dataPush.SourceDatasourceUUID)
	if err != nil {
		return nil, err
	}
	queryDatasourceInfoend := time.Now()
	queryDatasourceInfoediff := queryDatasourceInfoend.Sub(queryDatasourceInfostart)
	log.Infof("queryDatasourceInfo时间差: %d ms", queryDatasourceInfoediff.Milliseconds())
	dataPush.SourceDatasourceID = sourceDatasourceInfo.DataSourceID
	dataPush.SourceDatasourceUUID = sourceDatasourceInfo.ID

	queryTargetDatasourceInfostart := time.Now()
	//查询目标数据源
	targetDatasourceInfo, err := u.queryTargetDatasourceInfo(ctx, dataPush)
	if err != nil {
		return nil, err
	}
	queryTargetDatasourceInfoend := time.Now()
	queryTargetDatasourceInfodiff := queryTargetDatasourceInfoend.Sub(queryTargetDatasourceInfostart)
	log.Infof("queryTargetDatasourceInfo时间差: %d ms", queryTargetDatasourceInfodiff.Milliseconds())

	dataPush.TargetDatasourceID = targetDatasourceInfo.DataSourceID
	dataPush.TargetDatasourceUUID = targetDatasourceInfo.ID
	dataPush.TargetDepartmentID = targetDatasourceInfo.DepartmentID
	dataPush.TargetHuaAoId = targetDatasourceInfo.HuaAoId
	dataPush.SourceHuaAoId = sourceDatasourceInfo.HuaAoId
	//组装参数
	commonModel := &CommonModel{
		PushData:             dataPush,
		TargetDatasourceInfo: targetDatasourceInfo,
		SourceDatasourceInfo: sourceDatasourceInfo,
		DataViewRepo:         u.localDataView,
	}

	queryDataTablestart := time.Now()
	//查询来源表的全部字段
	commonModel.SourceDataTableFields, err = u.bgDriven.QueryDataTable(ctx, sourceDatasourceInfo.ID, dataPush.SourceTableName)
	if err != nil {
		return nil, err
	}
	queryDataTableend := time.Now()
	queryDataTablediff := queryDataTableend.Sub(queryDataTablestart)
	log.Infof("queryDataTable时间差: %d ms", queryDataTablediff.Milliseconds())
	return commonModel, nil
}

func (u *useCase) queryTargetDatasourceInfo(ctx context.Context, dataPush *model.TDataPushModel) (*DataSource, error) {
	targetDatasourceID := dataPush.TargetDatasourceUUID
	if targetDatasourceID == "" { //查询沙箱管理的详情
		getSandboxSampleInfostart := time.Now()
		sandboxSimpleInfo, err := u.taskDriven.GetSandboxSampleInfo(ctx, dataPush.TargetSandboxID)
		if err != nil {
			return nil, errorcode.Detail(errorcode.DataPushGetTargetDatasourceInfoError, err.Error())
		}
		targetDatasourceID = sandboxSimpleInfo.DatasourceID
		getSandboxSampleInfoend := time.Now()
		getSandboxSampleInfodiff := getSandboxSampleInfoend.Sub(getSandboxSampleInfostart)
		log.Infof("GetSandboxSampleInfo时间差: %d ms", getSandboxSampleInfodiff.Milliseconds())
	}
	return u.queryDatasourceInfo(ctx, targetDatasourceID)
}

// SortFields  将来源字段和目标字段的顺序统一下，按照
// 按照目标字段修改
func (c *CommonModel) SortFields() {
	sourceFieldDict := lo.SliceToMap(c.SourceDataTableFields, func(item *business_grooming.DataTableFieldInfo) (string, *business_grooming.DataTableFieldInfo) {
		return item.Name, item
	})
	newSortedSourceFields := make([]*business_grooming.DataTableFieldInfo, 0, len(c.SourceDataTableFields))
	for i := range c.TargetFieldsInfo {
		sourceField, ok := sourceFieldDict[c.TargetFieldsInfo[i].SourceTechName]
		if !ok {
			continue
		}
		newSortedSourceFields = append(newSortedSourceFields, sourceField)
	}
	c.SourceDataTableFields = newSortedSourceFields
}

// CollectModelReq  同步模型，用来生成同步模型的
// 1: 如果目标表已经存在，前端直接传目标物理表的类型，长度，精度，
// 2: 如果目标物理表不存在，前端传来源物理表的类型，长度，精度作为目标字段的对应数据
func (c *CommonModel) CollectModelReq() *data_sync.CollectModelReq {
	modelReq := &data_sync.CollectModelReq{
		Name:            c.PushData.Name,
		SourceDsId:      fmt.Sprintf("%v", c.SourceDatasourceInfo.DataSourceID),
		TargetDsId:      fmt.Sprintf("%v", c.TargetDatasourceInfo.DataSourceID),
		SourceTableName: c.PushData.SourceTableName,
		TargetTableName: c.PushData.TargetTableName,
		TargetTableSql:  c.PushData.CreateSQL,
	}
	targetFieldDict := lo.SliceToMap(c.TargetFieldsInfo, func(item *model.TDataPushField) (string, any) {
		return item.SourceTechName, struct{}{}
	})
	//来源字段
	for _, source := range c.SourceDataTableFields {
		if _, chosen := targetFieldDict[source.Name]; !chosen {
			continue
		}
		field := &data_sync.Field{
			Name:        source.Name,
			Description: source.Description,
		}
		fieldType, length, dataAccuracy := parseOriginType(source.OrigType)
		field.Type = fieldType
		if length != nil {
			field.Length = length
		}
		if dataAccuracy != nil {
			field.FieldPrecision = dataAccuracy
		}
		modelReq.SourceFields = append(modelReq.SourceFields, field)
	}
	//目标字段
	for _, target := range c.TargetFieldsInfo {
		field := &data_sync.Field{
			Name:        target.TechnicalName,
			Type:        target.DataType,
			Description: target.Comment,
		}
		length := int(target.DataLength)
		if length > 0 {
			field.Length = &length
		}
		if target.DataAccuracy != nil {
			precision := int(*target.DataAccuracy)
			field.FieldPrecision = &precision
		}
		modelReq.TargetFields = append(modelReq.TargetFields, field)
	}
	return modelReq
}

func (c *CommonModel) CheckPrimaryKey() error {
	if c.PushData.TransmitMode == constant.TransmitModeAll.Integer.Int32() {
		return nil
	}
	if c.PushData.PrimaryKey == "" {
		return errorcode.Desc(errorcode.IncrementDataPushMustChoicePrimaryKey)
	}
	//多个主键，逗号分割，此时输入的是来源字段
	primaryKeySlice := strings.Split(c.PushData.PrimaryKey, ",")
	for _, key := range primaryKeySlice {
		//目标字段必须包含主键
		has := slices.ContainsFunc(c.TargetFieldsInfo, func(field *model.TDataPushField) bool {
			return field.SourceTechName == key
		})
		if !has {
			return errorcode.Desc(errorcode.DataPushMustContainPrimaryKey)
		}
	}
	return nil
}

// 获取主键
func (c *CommonModel) GetPrimaryKey() []string {
	if c.PushData.PrimaryKey == "" {
		return nil
	}
	return strings.Split(c.PushData.PrimaryKey, ",")
}

// SourceTypeMapping 根据输入的字段的类型，去调用虚拟化引擎，得到类型映射
func (c *CommonModel) SourceTypeMapping(sourceTableInfo *DataViewFieldInfo) *virtual_engine.DatabaseTypeMappingReq {
	mapping := &virtual_engine.DatabaseTypeMappingReq{
		SourceConnectorName: c.SourceDatasourceInfo.TypeName,
		TargetConnectorName: "olk",
	}
	sourceFieldDict := lo.SliceToMap(sourceTableInfo.FieldsRes, func(item *data_view.FieldsRes) (string, string) {
		return item.TechnicalName, item.OriginalDataType
	})
	//如果目标字段映射关系在来源表中不存在
	for i, inputField := range c.TargetFieldsInfo {
		if _, has := sourceFieldDict[inputField.SourceTechName]; !has {
			continue
		}
		field := virtual_engine.SourceFieldObject{
			Index:          i,
			SourceTypeName: sourceFieldDict[inputField.SourceTechName],
			Precision:      inputField.DataLength,
			DecimalDigits:  inputField.DataAccuracy,
		}
		mapping.Type = append(mapping.Type, field)
	}
	return mapping
}

// SourceTypeMapping 根据输入的字段的类型，去调用虚拟化引擎，得到类型映射
func (c *CommonModel) TargetTypeMapping() *virtual_engine.DatabaseTypeMappingReq {
	mapping := &virtual_engine.DatabaseTypeMappingReq{
		SourceConnectorName: c.TargetDatasourceInfo.TypeName,
		TargetConnectorName: "olk",
	}
	sourceFieldDict := lo.SliceToMap(c.SourceDataTableFields, func(item *business_grooming.DataTableFieldInfo) (string, string) {
		return item.Name, item.Type
	})
	//如果目标字段映射关系在来源表中不存在
	for i, inputField := range c.TargetFieldsInfo {
		if _, has := sourceFieldDict[inputField.SourceTechName]; !has {
			continue
		}
		field := virtual_engine.SourceFieldObject{
			Index:          i,
			SourceTypeName: inputField.DataType,
			Precision:      inputField.DataLength,
			DecimalDigits:  inputField.DataAccuracy,
		}
		mapping.Type = append(mapping.Type, field)
	}
	return mapping
}

func (c *CommonModel) getTypeMapping(sourceFieldType string) (string, error) {
	sourceType := strings.ToUpper(sourceFieldType)
	olkSearchType, ok := c.OlkTargetSearchTypeDict[sourceType]
	if ok {
		return olkSearchType, nil
	}
	middleType := dbTypeMapping(c.SourceDatasourceInfo.TypeName, c.TargetDatasourceInfo.TypeName, sourceType)
	if middleType == "" {
		return olkSearchType, fmt.Errorf("无法找到数据库类型映射：源数据库类型=%s，目标数据库类型=%s，字段类型=%s：%w",
			c.SourceDatasourceInfo.TypeName, c.TargetDatasourceInfo.TypeName, sourceType,
			errorcode.Desc(errorcode.DataPushInvalidTypeMapping))
	}
	olkSearchType, ok = c.OlkTargetSearchTypeDict[middleType]
	if ok {
		return olkSearchType, nil
	}
	return olkSearchType, fmt.Errorf("无法找到OLK搜索类型映射：中间类型=%s，字段类型=%s，可用映射=%+v：%w",
		middleType, sourceType, c.OlkTargetSearchTypeDict,
		errorcode.Desc(errorcode.DataPushInvalidTypeMapping))
}

// genDataTableTypeMappingReq 查询表类型映射,  然后组装成建表参数
func (c *CommonModel) genDataTableTypeMappingReq(tableTypeMapping *virtual_engine.DatabaseTypeMappingResp) (*DataTableCreateReq, error) {
	//组成目标参数
	table := &DataTableCreateReq{
		Name:   c.PushData.TargetTableName,
		Fields: []*FieldCreateReq{},
	}
	for i, f := range c.TargetFieldsInfo {
		// tableTypeMapping 的结果没有类型技术名称，根据数据顺序找到
		targetMappingItem := tableTypeMapping.Type[i]
		field := &FieldCreateReq{
			Name:        f.TechnicalName,
			Type:        f.DataType,
			Description: f.Comment,
			UnMapped:    false,
			SearchType:  targetMappingItem.TargetTypeName,
		}
		if targetMappingItem.Precision > 0 {
			field.Length = &targetMappingItem.Precision
			f.DataLength = int32(targetMappingItem.Precision)
		} else {
			field.Length = nil
		}
		if targetMappingItem.DecimalDigits != nil {
			field.FieldPrecision = targetMappingItem.DecimalDigits
			// 更新目标字段精度
			accuracy := int32(*targetMappingItem.DecimalDigits)
			f.DataAccuracy = &accuracy
		} else {
			field.FieldPrecision = nil
		}
		table.Fields = append(table.Fields, field)
	}
	return table, nil
}

// genDataTableTypeMappingReq 查询表类型映射,  然后组装成建表参数
func (c *CommonModel) genDataTableWithoutTypeMappingReq() (*DataTableCreateReq, error) {
	//组成目标参数
	table := &DataTableCreateReq{
		Name:   c.PushData.TargetTableName,
		Fields: []*FieldCreateReq{},
	}
	for _, f := range c.TargetFieldsInfo {
		field := &FieldCreateReq{
			Name:        f.TechnicalName,
			Type:        f.DataType,
			Description: f.Comment,
			UnMapped:    false,
			SearchType:  f.DataType,
		}
		if f.DataLength > 0 {
			length := int(f.DataLength)
			field.Length = &length
		}
		if f.DataAccuracy != nil {
			precision := int(*f.DataAccuracy)
			field.FieldPrecision = &precision
		}
		table.Fields = append(table.Fields, field)
	}
	return table, nil
}

// genInsertSQL 数据加工插入SQL逻辑
func (c *CommonModel) genInsertSQL(ctx context.Context, tableTypeMapping *virtual_engine.DatabaseTypeMappingResp) (string, error) {
	targetDatasource := c.TargetDatasourceInfo
	sourceDatasource := c.SourceDatasourceInfo
	// 获取脱敏规则数组
	desensitizationRuleFieldMap, err := c.getDesensitizationRuleFieldMap(ctx)
	if err != nil {
		return "", err
	}

	insertMethod := "INSERT INTO "
	if targetDatasource.TypeName == "Hive" {
		insertMethod = "INSERT OVERWRITE "
	}
	//insert 部分
	var sb strings.Builder
	sb.WriteString(fmt.Sprintf("%s  %s.\"%s\".\"%s\"", insertMethod, targetDatasource.CatalogName, targetDatasource.Schema, c.PushData.TargetTableName))
	//插入选中的字段
	sb.WriteString("(")
	for i, targetField := range c.TargetFieldsInfo {
		sb.WriteString(`"`)
		sb.WriteString(targetField.TechnicalName)
		sb.WriteString(`"`)
		if i < len(c.TargetFieldsInfo)-1 {
			sb.WriteString(",")
		}
	}
	sb.WriteString(")")

	sb.WriteString("  SELECT ")
	collectingModelReq := c.CollectModelReq()
	//log.Printf("collectingModelReq: %+v", collectingModelReq)
	incrementFieldType := ""
	//select 部分
	for i, sourceField := range collectingModelReq.SourceFields {
		targetField := collectingModelReq.TargetFields[i]
		if targetField.Name == c.PushData.IncrementField && c.PushData.IncrementField != "" {
			incrementFieldType = targetField.Type
		}
		//如果来源和目标的类型一致，那就不用转了
		if rule, ok := desensitizationRuleFieldMap[targetField.Name]; ok && c.PushData.IsDesensitization == 1 {
			// 如果存在脱敏规则，则对源表字段进行脱敏处理，再插入目标字段
			rawField := "s." + escape(sourceField.Name)
			var transformed string
			if rule.Method == "all" {
				transformed = fmt.Sprintf("regexp_replace(CAST(%s AS VARCHAR), '.', '*') AS %s", rawField, escape(targetField.Name))
			} else if rule.Method == "middle" {
				transformed = fmt.Sprintf(
					"(CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
						"substring(CAST(%s AS VARCHAR), 1, CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer)), '%s', "+
						"substring(CAST(%s AS VARCHAR), CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) + %d, "+
						"length(CAST(%s AS VARCHAR)) - CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) - %d)) END) AS %s",
					rawField, rule.MiddleBit, rawField,
					rawField, rawField, rule.MiddleBit, strings.Repeat("*", int(rule.MiddleBit)),
					rawField, rawField, rule.MiddleBit, rule.MiddleBit+1,
					rawField, rawField, rule.MiddleBit, rule.MiddleBit, escape(targetField.Name))
			} else if rule.Method == "head-tail" {
				transformed = fmt.Sprintf(
					"(CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
						"'%s', substring(CAST(%s AS VARCHAR), %d, length(CAST(%s AS VARCHAR)) - %d), '%s') END) AS %s",
					rawField, rule.HeadBit+rule.TailBit, rawField,
					strings.Repeat("*", int(rule.HeadBit)),
					rawField, rule.HeadBit+1, rawField, rule.HeadBit+rule.TailBit, strings.Repeat("*", int(rule.TailBit)), escape(targetField.Name))
			}
			sb.WriteString(transformed)
		} else {
			// if sourceDatasource.TypeName == targetDatasource.TypeName && sourceField.Type == targetField.Type {
			// 	sb.WriteString(escape(sourceField.Name))
			// } else {
			sb.WriteString("CAST(s.")
			sb.WriteString(`"`)
			sb.WriteString(sourceField.Name)
			sb.WriteString(`"`)
			sb.WriteString(" AS ")
			// olkSearchType, err := c.getTypeMapping(sourceField.Type)
			// if err != nil {
			// 	return "", err
			// }
			sb.WriteString(tableTypeMapping.Type[i].TargetTypeName)
			fieldLength := tableTypeMapping.Type[i].Precision
			fieldPrecision := tableTypeMapping.Type[i].DecimalDigits
			if fieldLength != 0 && fieldPrecision != nil {
				sb.WriteString("(")
				sb.WriteString(fmt.Sprintf("%v", fieldLength))
				sb.WriteString(",")
				sb.WriteString(fmt.Sprintf("%v", *fieldPrecision))
				sb.WriteString(")")
			}
			if fieldLength != 0 && fieldPrecision == nil {
				sb.WriteString("(")
				sb.WriteString(fmt.Sprintf("%v", fieldLength))
				sb.WriteString(")")
			}
			sb.WriteString(")")
			sb.WriteString(" AS ")
			sb.WriteString(`"`)
			sb.WriteString(targetField.Name)
			sb.WriteString(`"`)
			// }
		}
		if i+1 < len(collectingModelReq.TargetFields) {
			sb.WriteString(",")
		}

	}
	sourceTableName := fmt.Sprintf("%s.\"%s\".\"%s\"", sourceDatasource.CatalogName, sourceDatasource.Schema, collectingModelReq.SourceTableName)
	targetTableName := fmt.Sprintf("%s.\"%s\".\"%s\"", targetDatasource.CatalogName, targetDatasource.Schema, collectingModelReq.TargetTableName)
	sb.WriteString(fmt.Sprintf(" FROM  %s s", sourceTableName))
	//存在主键，且开启增量更新的存量更新开关
	if len(c.GetPrimaryKey()) > 0 && c.PushData.TransmitMode == constant.TransmitModeInc.Integer.Int32() && c.PushData.UpdateExistingDataFlag == 1 {

		targetTableName := fmt.Sprintf("%s.\"%s\".\"%s\"", targetDatasource.CatalogName, targetDatasource.Schema, collectingModelReq.TargetTableName)
		sb.WriteString(fmt.Sprintf(" LEFT JOIN %s d ON ", targetTableName))
		primaryKeys := c.GetPrimaryKey()
		joinConditions := make([]string, len(primaryKeys))
		for i, key := range primaryKeys {
			joinConditions[i] = fmt.Sprintf(`s."%s" = d."%s"`, key, key)
		}
		sb.WriteString(strings.Join(joinConditions, " AND "))
	}
	//添加过滤条件
	hasCondition := false
	if c.PushData.FilterCondition != "" {
		hasCondition = true
		sb.WriteString(" where ")
		sb.WriteString(c.PushData.FilterCondition)
	}
	//如果开了增量更新，查询来源表的增量字段的最新的值, 确定更新范围
	if c.PushData.TransmitMode == constant.TransmitModeInc.Integer.Int32() {
		incrementFieldStr := timeTypeToTimeStamp(c.PushData.IncrementField, incrementFieldType)
		incrementTimestampStr := fmt.Sprintf("cast(from_unixtime(%v) as timestamp)", c.PushData.IncrementTimestamp)
		if !strings.Contains(incrementFieldStr, "from_unixtime") {
			incrementTimestampDatetimeStr := time.Unix(c.PushData.IncrementTimestamp, 0).Format(constant.LOCAL_TIME_FORMAT)
			incrementTimestampDatetimeStrCast := fmt.Sprintf("cast('%s' as timestamp)", incrementTimestampDatetimeStr)
			incrementTimestampDatetimeStr = fmt.Sprintf("SELECT COALESCE(greatest(max(\"%s\"), %s), %s) FROM %s", c.PushData.IncrementField, incrementTimestampDatetimeStrCast, incrementTimestampDatetimeStrCast, targetTableName)
			incrementTimestampStr = fmt.Sprintf("cast((%v)as timestamp)", incrementTimestampDatetimeStr)
		}
		//startCondition := fmt.Sprintf(" (select coalesce(max(%s), %v) from %s where %s > %v )",
		//	incrementFieldStr, incrementTimestampStr, targetTableName, incrementFieldStr, incrementTimestampStr)
		if !hasCondition {
			hasCondition = true
			sb.WriteString(" where ")
		} else {
			sb.WriteString(" and ")
		}
		sb.WriteString(fmt.Sprintf("  %s > %s ", incrementFieldStr, incrementTimestampStr))
	}
	return sb.String(), nil
}

// 获取脱敏规则map
func (c *CommonModel) getDesensitizationRuleFieldMap(ctx context.Context) (map[string]*localDataView.DesensitizationRule, error) {
	// 循环目标字段数组获取脱敏规则数组
	desensitizationRuleIds := make([]string, 0)
	desensitizationRuleMap := make(map[string]*localDataView.DesensitizationRule)
	desensitizationRuleFieldMap := make(map[string]*localDataView.DesensitizationRule)

	for _, targetField := range c.TargetFieldsInfo {
		desensitizationRuleIds = append(desensitizationRuleIds, targetField.DesensitizationRuleId)
	}
	desensitizationRuleIds = lo.Uniq(desensitizationRuleIds)

	//如果脱敏规则数组不为空，则调用 DataViewRepo.GetDesensitizationRuleByIds 查询脱敏规则
	if len(desensitizationRuleIds) > 0 {
		req := &localDataView.GetDesensitizationRuleByIdsReq{
			GetDesensitizationRuleByIdsReqBody: localDataView.GetDesensitizationRuleByIdsReqBody{
				Ids: desensitizationRuleIds,
			},
		}
		desensitizationRulesRes, err := c.DataViewRepo.GetDesensitizationRuleByIds(ctx, req)
		if err != nil {
			return desensitizationRuleFieldMap, err
		}
		if desensitizationRulesRes.Data != nil {
			for _, desensitizationRule := range desensitizationRulesRes.Data {
				desensitizationRuleMap[desensitizationRule.ID] = desensitizationRule
			}
		}
		for _, targetField := range c.TargetFieldsInfo {
			desensitizationRule, ok := desensitizationRuleMap[targetField.DesensitizationRuleId]
			if ok {
				desensitizationRuleFieldMap[targetField.TechnicalName] = desensitizationRule
			}
		}
	}
	return desensitizationRuleFieldMap, nil
}

// quote 转义字段名称
func escape(s string) string {
	s = strings.Replace(s, "\"", "\"\"", -1)
	// 虚拟化引擎要求字段名称使用英文双引号 "" 转义，避免与关键字冲突
	s = fmt.Sprintf(`"%s"`, s)
	return s
}

// genUpdateSQL 数据加工更新SQL逻辑，当前逻辑下暂时用不上
// Start of Selection
func (c *CommonModel) genUpdateSQL() (string, error) {
	// 检查是否配置了主键字段，因为更新操作必须基于主键关联
	primaryKeys := c.GetPrimaryKey()
	if len(primaryKeys) == 0 {
		return "", fmt.Errorf("更新SQL生成失败：缺少主键字段")
	}

	// 构造来源表和目标表的完整表名
	sourceTableName := fmt.Sprintf("%s.%s.%s", c.SourceDatasourceInfo.CatalogName, c.SourceDatasourceInfo.Schema, c.PushData.SourceTableName)
	targetTableName := fmt.Sprintf("%s.%s.%s", c.TargetDatasourceInfo.CatalogName, c.TargetDatasourceInfo.Schema, c.PushData.TargetTableName)

	var sb strings.Builder

	// 构建SET部分，对目标字段进行显式赋值（排除主键字段）
	updateAssignments := []string{}
	for _, field := range c.TargetFieldsInfo {
		// 假定字段TechnicalName为目标表字段名，若为主键则跳过更新赋值
		isPrimary := false
		for _, pk := range primaryKeys {
			if pk == field.TechnicalName {
				isPrimary = true
				break
			}
		}
		if isPrimary {
			continue
		}
		assignment := fmt.Sprintf(`target."%s" = source."%s"`, field.TechnicalName, field.TechnicalName)
		updateAssignments = append(updateAssignments, assignment)
	}

	if len(updateAssignments) == 0 {
		return "", fmt.Errorf("更新SQL生成失败：无可更新字段")
	}

	// 拼接UPDATE语句及SET赋值
	sb.WriteString(fmt.Sprintf("UPDATE %s\n", targetTableName))
	sb.WriteString("SET \n  " + strings.Join(updateAssignments, ",\n  ") + "\n")

	// 增量更新：构造子查询，从来源表中筛选出需要更新的记录
	// 要求：来源记录的增量字段值大于当前模型记录的增量字段值
	if c.PushData.IncrementField == "" {
		return "", fmt.Errorf("更新SQL生成失败：缺少增量字段")
	}
	// 将增量时间转换为符合SQL要求的时间格式
	incrementTimeStr := time.Unix(c.PushData.IncrementTimestamp, 0).Format(constant.LOCAL_TIME_FORMAT)
	incrementTimeStrCast := fmt.Sprintf("cast('%s' as timestamp)", incrementTimeStr)
	incrementTimeStr = fmt.Sprintf("SELECT COALESCE(greatest(max(\"%s\"), %s), %s) FROM %s", c.PushData.IncrementField, incrementTimeStrCast, incrementTimeStrCast, targetTableName)
	incrementTimestampStr := fmt.Sprintf("cast((%s) as timestamp)", incrementTimeStr)

	// 构造子查询，注意这里在WHERE子句中使用了来源表的增量字段过滤
	subQuery := fmt.Sprintf("(SELECT * FROM %s WHERE source.\"%s\" > %s) AS source",
		sourceTableName,
		c.PushData.IncrementField,
		incrementTimestampStr,
	)
	sb.WriteString("FROM " + subQuery + "\n")

	// 构造WHERE部分：通过主键字段实现目标表与来源表记录的关联
	var pkConditions []string
	for _, pk := range primaryKeys {
		condition := fmt.Sprintf(`target."%s" = source."%s"`, pk, pk)
		pkConditions = append(pkConditions, condition)
	}
	sb.WriteString("WHERE " + strings.Join(pkConditions, "\n  AND ") + ";\n")

	return sb.String(), nil
}

// End of Selectio

// 拼接sql，查询本次增量推送完成时增量字段的最大值
func (c *CommonModel) getMaxIncrementValueSQL() string {
	return fmt.Sprintf("SELECT MAX(%s) FROM %s.%s.%s", c.PushData.IncrementField, c.TargetDatasourceInfo.CatalogName, c.TargetDatasourceInfo.Schema, c.PushData.TargetTableName)
}

// IsExecuteNow  判断是不是立即执行
func isExecuteNow(pushData *model.TDataPushModel) bool {
	return pushData.ScheduleType == constant.ScheduleTypeOnce.String &&
		pushData.ScheduleTime == ""
}

func workflowReq(pushData *model.TDataPushModel) *data_sync.WorkflowReq {
	req := &data_sync.WorkflowReq{
		ProcessName:  pushData.Name,
		OnlineStatus: 1,
		Models: []data_sync.CollectionModel{
			{
				Uuid:       fmt.Sprintf("%v", pushData.ID),
				ModelType:  2,
				Dependency: "",
			},
		},
	}
	//如果是周期性的，那么设置个开始和结束时间
	if pushData.ScheduleType == constant.ScheduleTypePeriod.String {
		req.Crontab = fixCrontab(pushData.CrontabExpr)
		req.StartTime = pushData.ScheduleStart + " 00:00:00"
		req.EndTime = pushData.ScheduleEnd + " 23:59:59"
	}
	//如果是一次性的, 定时执行
	if pushData.ScheduleType == constant.ScheduleTypeOnce.String && pushData.ScheduleTime != "" {
		dts := strings.Split(pushData.ScheduleTime, " ")
		req.StartTime = dts[0] + " 00:00:00"
		req.EndTime = dts[0] + " 23:59:59"
		splits := strings.Split(dts[1], ":")
		// cron :0 0 0 0/3 * ?   秒	分钟	小时	日	月 星期	年(可选字段)
		req.Crontab = fmt.Sprintf("%s %s %s * * ? *", splits[2], splits[1], splits[0])
	}
	//如果是一次性且立即执行
	if pushData.ScheduleType == constant.ScheduleTypeOnce.String && pushData.ScheduleTime == "" {
		req.OnlineStatus = 0
	}
	return req
}

func processingModelReq(pushData *model.TDataPushModel) *data_sync.ProcessModelCUReq {
	advancedParamsArr := []interface{}{}
	if pushData.TransmitMode == constant.TransmitModeInc.Integer.Int32() {
		advancedParamsArr = []interface{}{
			map[string]interface{}{"key": "modelType", "value": "IncrementalSync"},
			map[string]interface{}{"key": "targetTableUpdate", "value": pushData.UpdateSQL},
			map[string]interface{}{"key": "targetTableUpdateExistingData", "value": fmt.Sprintf("%d", pushData.UpdateExistingDataFlag)},
		}
	}

	return &data_sync.ProcessModelCUReq{
		Name:              pushData.Name,
		TargetDsId:        fmt.Sprintf("%v", pushData.TargetDatasourceID),
		TargetTableName:   pushData.TargetTableName,
		TargetTableSql:    pushData.CreateSQL,
		TargetTableInsert: pushData.InsertSQL,
		AdvancedParams:    advancedParamsArr,
	}
}

func fixCrontab(expr string) string {
	ts := strings.Split(expr, " ")
	if len(ts) == 6 {
		return expr + " *"
	}
	if len(ts) == 5 {
		ts[4] = "?"
		return "0 " + strings.Join(ts, " ") + " *"
	}

	return expr
}

// checkCrontab 解析crontab表达式
func checkCrontab(expr string) error {
	if expr == "" {
		return nil
	}
	expr = strings.ReplaceAll(expr, "?", "*")
	_, err := cron.ParseStandard(expr)
	if err != nil {
		return errorcode.Desc(errorcode.DataPushInvalidCrontabExpression)
	}
	return nil
}

// NextExecute5 解析下一次是什么时候执行
func NextExecute5(expr string) int64 {
	s, err := cron.ParseStandard(expr)
	if err != nil {
		//log.Printf("parse crontab error %v", err.Error())
		return -1
	}
	nextTime := s.Next(time.Now())
	return nextTime.UnixMilli()
}

func parseOriginType(t string) (string, *int, *int) {
	t = strings.TrimSpace(t)
	rts := strings.Split(t, " ")
	ts := strings.Split(t, "(")
	ts = strings.Split(ts[0], " ")
	length, precise := parserOriginType(rts[0])
	return ts[0], length, precise
}

func parserOriginType(t string) (*int, *int) {
	if !strings.Contains(t, "(") {
		return nil, nil
	}
	t = strings.TrimRight(t, ")")
	ts := strings.Split(t, "(")
	if len(ts) != 2 {
		return nil, nil
	}
	if !strings.Contains(ts[1], ",") {
		length, _ := strconv.Atoi(ts[1])
		return &length, nil
	}
	ds := strings.Split(ts[1], ",")
	if len(ds) != 2 {
		return nil, nil
	}
	length, _ := strconv.Atoi(ds[0])
	precision, _ := strconv.Atoi(ds[1])
	return &length, &precision
}

// timeTypeToTimeStamp 字段时间类型转换方法, 默认是秒
// 默认数据库里面的字段时间日期不包含时区，就是当前东八区的值
// 默认数据库里面的整数型的，是unix时间戳，
func timeTypeToTimeStamp(field any, fieldType string) string {
	if strings.Contains(fieldType, "int") {
		return fmt.Sprintf("cast(from_unixtime(%v) as timestamp)", field)
	}
	//datetime、timestamp可以直接转换
	return fmt.Sprintf(`cast("%v" as timestamp)`, field)
}

// SetNextExecuteTime 设置下次执行时间
func SetNextExecuteTime(obj *domain.DataPushModelObject) {
	if obj.PushStatus == constant.DataPushStatusGoing.Integer.Int32() || obj.PushStatus == constant.DataPushStatusStarting.Integer.Int32() {
		// 对于一次性任务，优先使用schedule_time
		if obj.ScheduleType == constant.ScheduleTypeOnce.String && obj.ScheduleTime != "" {
			if scheduleTime, err := time.ParseInLocation(constant.LOCAL_TIME_FORMAT, obj.ScheduleTime, time.Local); err == nil {
				obj.NextExecute = scheduleTime.UnixMilli()
				return
			}
		}
		// 其他情况使用crontab表达式
		obj.NextExecute = NextExecute5(obj.CrontabExpr)
		// 如果crontab解析失败且是一次性任务，再尝试使用schedule_time作为兜底
		if obj.NextExecute == -1 && obj.ScheduleType == constant.ScheduleTypeOnce.String && obj.ScheduleTime != "" {
			if scheduleTime, err := time.ParseInLocation(constant.LOCAL_TIME_FORMAT, obj.ScheduleTime, time.Local); err == nil {
				obj.NextExecute = scheduleTime.UnixMilli()
			}
		}
	} else {
		obj.NextExecute = -1
	}
}

func SetDetailNextExecuteTime(obj *domain.DataPushModelDetail) {
	if obj.PushStatus == constant.DataPushStatusGoing.Integer.Int32() || obj.PushStatus == constant.DataPushStatusStarting.Integer.Int32() {
		// 对于一次性任务，优先使用schedule_time
		if obj.ScheduleType == constant.ScheduleTypeOnce.String && obj.ScheduleTime != "" {
			if scheduleTime, err := time.ParseInLocation(constant.LOCAL_TIME_FORMAT, obj.ScheduleTime, time.Local); err == nil {
				obj.NextExecute = scheduleTime.UnixMilli()
				return
			}
		}
		// 其他情况使用crontab表达式
		obj.NextExecute = NextExecute5(obj.CrontabExpr)
		// 如果crontab解析失败且是一次性任务，再尝试使用schedule_time作为兜底
		if obj.NextExecute == -1 && obj.ScheduleType == constant.ScheduleTypeOnce.String && obj.ScheduleTime != "" {
			if scheduleTime, err := time.ParseInLocation(constant.LOCAL_TIME_FORMAT, obj.ScheduleTime, time.Local); err == nil {
				obj.NextExecute = scheduleTime.UnixMilli()
			}
		}
	} else {
		obj.NextExecute = -1
	}
}

func GetNextExecuteTime(dataPush *model.TDataPushModel, logs []*domain.TaskLogInfo) int64 {
	detail := &domain.DataPushModelDetail{}
	copier.Copy(&detail, &dataPush)
	detail.ID = models.NewModelID(dataPush.ID)
	detail.PushStatus = dataPush.PushStatus
	if len(logs) > 0 {
		detail.RecentExecute, detail.RecentExecuteStatus = logs[0].StartTime, logs[0].Status
	}
	SetDetailNextExecuteTime(detail)
	return detail.NextExecute
}
