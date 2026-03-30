package data_lineage

import (
	"fmt"
	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/sailor_service"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"sort"
	"strings"
)

/////////////////// GetBase ///////////////////

type GetBaseReqParam struct {
	IDReqParamPath `param_type:"path"`
}

type IDReqParamPath struct {
	ID string `uri:"id" binding:"required,uuid" example:"88f78432-ee4e-43df-804c-4ccc4ff17f15"`
}

type GetBaseResp struct {
	SummaryInfoBase
}

type SummaryInfoBase struct {
	TechnicalName  string   `json:"technical_name"`   // 视图的技术名称
	Name           string   `json:"name"`             // 视图的业务名称
	VID            string   `json:"vid"`              // 节点实体id，由ad生成
	InfoSystemName string   `json:"info_system_name"` // 信息系统名称
	DBName         string   `json:"db_name"`          // 库名称
	ExpansionFlag  bool     `json:"expansion_flag"`   // 是否允许展开
	Fields         []*Field `json:"fields"`           // 字段列表
	TargetTable    []string `json:"target_table"`     // 目标table

	DSID     string `json:"-"` // data source id
	DBSchema string `json:"-"` // database schema

}

type Field struct {
	ID             string         `json:"id"`               // 字段id
	BusinessName   string         `json:"business_name"`    //业务名称
	Name           string         `json:"name"`             // 字段名称
	Type           string         `json:"type"`             // 字段类型：文本型varchar，数值型number，日期型date，未知的类型undefined
	PrimaryKeyFlag bool           `json:"primary_key_flag"` // 是否为主键
	TargetField    TableFieldsMap `json:"target_field"`     // 目标字段列表，类型为map，key为目标表id，value为目标字段id列表

	position int // 字段位置
}

type TableFieldsMap map[string][]string // key 目标table，value 目标field列表

/////////////////// ListLineage ///////////////////

type ListLineageReqParam struct {
	VIDPathParam             `param_type:"path"`
	ListLineageReqParamQuery `param_type:"query"`
}

type ListLineageReqParamQuery struct {
	PageBaseInfo
}

type VIDPathParam struct {
	VID string `uri:"vid" binding:"required,VerifyVertexID,len=32" example:"08aa80a85cbb5cf82697b7fd334e90b0"` // 图谱实体id，32位uuid ——> 36位uuid去掉4个短划线
}

type PageBaseInfo struct {
	Offset *int `json:"offset" form:"offset,default=1" binding:"omitempty,min=1" default:"1"`          // 页码，默认1
	Limit  *int `json:"limit" form:"limit,default=10" binding:"omitempty,min=1,max=2000" default:"10"` // 每页大小，默认10
}

type PageResult[T any] struct {
	Entries    []*T  `json:"entries" binding:"required"`                       // 对象列表
	TotalCount int64 `json:"total_count" binding:"required,gte=0" example:"3"` // 当前筛选条件下的对象数量
}

type ListLineageResp struct {
	PageResult[SummaryInfoBase] // 血缘列表
}

func GetFields(neighbor *sailor_service.ADLineageNeighborsResp, fieldsList []*model.FormViewField) (bool, []*Field) {
	// base := fulltext.Res.Result[0].Vertexes[0]

	fields := make([]*Field, 0)
	adFieldsMap := make(map[string]*Field, 0)

	expansionFlag := false
	if neighbor != nil {
		for _, n := range neighbor.Res.VResult {
			switch EntityType(n.Tag) {
			case Fields:
				for i, vertex := range n.Vertexes {

					field := &Field{
						ID:          vertex.ID,
						Name:        vertex.DefaultProperty.V,
						TargetField: nil,
						position:    i,
					}
					// t_lineage_tag_column_2_t_lineage_tag_table

					fields = append(fields, field)
					adFieldsMap[field.Name] = field
				}
			case Tables:
				// 表血缘数量非0
				expansionFlag = len(n.Vertexes) > 0
			default:
				log.Warnf("undefined neighbor.Res.VResult.n.Tag: %v", n.Tag)
			}
		}
	}
	if fieldsList != nil && len(fieldsList) > 0 {
		position := len(adFieldsMap)
		for i, field := range fieldsList {
			if f, ok := adFieldsMap[field.TechnicalName]; ok {
				f.BusinessName = field.BusinessName
				f.Type = strings.ToLower(field.DataType)
				f.PrimaryKeyFlag = field.PrimaryKey.Bool
			} else {
				newField := &Field{
					ID:             new32UUID(), // 前端需要字段唯一ID作为标识，即使每次返回结果不一致也没有影响
					BusinessName:   field.BusinessName,
					Name:           field.TechnicalName,
					Type:           strings.ToLower(field.DataType),
					PrimaryKeyFlag: field.PrimaryKey.Bool,
					position:       position + i,
				}
				adFieldsMap[field.TechnicalName] = newField
				fields = append(fields, newField)
			}
		}
	}

	sort.Slice(fields, func(i, j int) bool {
		return fields[i].position < fields[j].position
	})

	return expansionFlag, fields
}

func new32UUID() string {
	return strings.ReplaceAll(uuid.New().String(), "-", "")
}

func NewGetBaseResp(businessName, tbName, dbName, vid, infoSysName string, expansionFlag bool, fields []*Field) *GetBaseResp {
	return &GetBaseResp{
		SummaryInfoBase: SummaryInfoBase{
			TechnicalName:  tbName,
			Name:           businessName,
			VID:            vid,
			InfoSystemName: infoSysName,
			DBName:         dbName,
			ExpansionFlag:  expansionFlag,
			Fields:         fields,
		},
	}
}

type TableFields struct {
	DSID     string                 `json:"ds_id"`
	DBName   string                 `json:"db_name"`
	DBSchema string                 `json:"db_schema"`
	TBName   string                 `json:"tb_name"`
	Fields   []*model.FormViewField `json:"fields"`
}

func NewSummaryInfoList(baseNode string, neighbor *sailor_service.ADLineageNeighborsResp) []*SummaryInfoBase {
	tableMap := make(map[string]*SummaryInfoBase, 0) // key 表id    	value 响应给前端的base结构体
	fieldsMap := make(map[string]*Field, 0)          // key 字段id   	value 响应给前端的field结构体
	fieldsTableMap := make(map[string]string, 0)     // key 字段id 		value 字段所属表id
	tableTableMap := make(map[string][]string, 0)    // key 父血缘表id  	value 指向表id列表
	fieldFieldMap := make(map[string][]string, 0)    // key 父血缘字段id	value 指向字段id列表

	resp := make([]*SummaryInfoBase, 0)

	for _, group := range neighbor.Res.VResult {
		switch EntityType(group.Tag) {
		case Tables:
			// 表
			for _, vertex := range group.Vertexes {
				summary := &SummaryInfoBase{
					Name:           vertex.DefaultProperty.V,
					VID:            vertex.ID,
					InfoSystemName: "",
				}
				for _, property := range vertex.Properties {
					if EntityType(property.Tag) == Tables {
						for _, prop := range property.Props {
							switch prop.Name {
							case "f_db_name":
								summary.DBName = prop.Value
							case "f_ds_id":
								summary.DSID = prop.Value
							case "f_db_schema":
								summary.DBSchema = prop.Value
							}
						}
						break
					}
				}

				tableMap[vertex.ID] = summary

				if vertex.ID != baseNode {
					resp = append(resp, summary)
				}

				for _, edge := range vertex.InEdges {
					// 进边，区分表字段关系和表血缘关系
					// t_lineage_edge_table:"d06bd642141b9715c7ba23409fa60737"->"349f5850cca21eeecf12f118f7aa8475"
					// t_lineage_tag_column_2_t_lineage_tag_table:"89f7d7ef7c4dccf954c5d9e47cdaf9c8"->"349f5850cca21eeecf12f118f7aa8475"
					length := len(edge)
					if strings.Contains(edge, string(TableLineageRelation)) {

						parentTableID := edge[length-69 : length-37]
						tableTableMap[parentTableID] = append(tableTableMap[parentTableID], vertex.ID)

					} else if strings.Contains(edge, string(FieldTableRelation)) {

						fieldID := edge[length-69 : length-37]
						fieldsTableMap[fieldID] = vertex.ID

					} else {
						log.Errorf("undefined in vertex.InEdges, edge: %v", edge)
					}
				}
			}
		case Fields:
			// 字段

			for i, vertex := range group.Vertexes {

				for _, edge := range vertex.InEdges {
					// t_lineage_edge_column:"7cebd1baaff86fa46a7bcd150f5bed30"->"0766ea8a0491a9ae0c8fa2e7dbcce352"
					if strings.Contains(edge, string(FieldLineageRelation)) {
						length := len(edge)
						parentFieldID := edge[length-69 : length-37]
						fieldFieldMap[parentFieldID] = append(fieldFieldMap[parentFieldID], vertex.ID)
					}
				}

				field := &Field{
					ID:             vertex.ID,
					Name:           vertex.DefaultProperty.V,
					PrimaryKeyFlag: false,
					TargetField:    map[string][]string{},
					position:       i,
				}

				fieldsMap[vertex.ID] = field
			}
		default:
			log.Errorf("undefined neighbor.Res.VResult.Tag type: %v", group.Tag)
		}
	}

	for _, table := range tableMap {
		table.TargetTable = tableTableMap[table.VID]
		for _, t := range table.TargetTable {
			tableMap[t].ExpansionFlag = true
		}
	}

	// key 当前字段id value map  key 指向字段所属表id value 指向字段id列表
	targets := make(map[string]map[string][]string, 0)
	// 遍历所有字段map
	for _, field := range fieldsMap {
		// 当前字段指向的字段
		targetFields := fieldFieldMap[field.ID]

		for _, t := range targetFields {
			// 当前被指向字段所属表id
			targetTableID := fieldsTableMap[t]

			if v, ok := targets[field.ID]; ok {
				if f, ok := v[targetTableID]; ok {
					f = append(f, t)
				} else {
					v[targetTableID] = []string{t}
				}
			} else {
				targets[field.ID] = map[string][]string{targetTableID: {t}}
			}
		}
	}

	for _, target := range targets {
		for _, fields := range target {
			fields = lo.Uniq[string](fields)
		}
	}

	for _, field := range fieldsMap {
		field.TargetField = targets[field.ID]

		tableID := fieldsTableMap[field.ID]
		tableMap[tableID].Fields = append(tableMap[tableID].Fields, field)
	}

	// 过滤掉没有指向当前node的实体
	resp = lo.Filter[*SummaryInfoBase](resp, func(r *SummaryInfoBase, index int) bool {
		return lo.Contains(r.TargetTable, baseNode)
	})

	for _, base := range resp {
		sort.Slice(base.Fields, func(i, j int) bool {
			return base.Fields[i].position < base.Fields[j].position
		})
	}

	return resp
}

type FormViewFieldQueryArg struct {
	DSID   string `json:"ds_id"`
	DBName string `json:"db_name"`
}

// FormViewFieldListDetail   数据血缘从表中查询的字段信息
type FormViewFieldListDetail struct {
	DSID         string                 `json:"ds_id"`         //雪花ID
	DatasourceID string                 `json:"datasource_id"` //UUID
	DBName       string                 `json:"db_name"`
	DBSchema     string                 `json:"db_schema"`
	TBName       string                 `json:"tb_name"`
	InfoSystemID string                 `json:"info_system_id"`
	Fields       []*model.FormViewField `json:"fields"`
}

func AddFieldsType(list []*SummaryInfoBase, fieldsGroup []*FormViewFieldListDetail) {
	uniqueFieldMap := make(map[string]*Field, 0)
	uniqueTableMap := make(map[string]*SummaryInfoBase, 0)

	for _, base := range list {
		key := fmt.Sprintf("%s:%s:%s:%s", base.DSID, base.DBName, base.DBSchema, base.Name)
		uniqueTableMap[key] = base

		for _, field := range base.Fields {
			// dataSourceID dbName dbSchema tableName filedName 拼接唯一标识
			uniqueFieldMap[key+":"+field.Name] = field
		}
	}

	position := len(uniqueFieldMap)
	for _, data := range fieldsGroup {

		tKey := data.DSID + ":" + data.DBName + ":" + data.DBSchema + ":" + data.TBName
		for _, field := range data.Fields {
			fKey := tKey + ":" + field.TechnicalName
			if v, ok := uniqueFieldMap[fKey]; ok {
				// 元数据字段查询结果已在AD中存在，赋值主键标识，和字段类型
				v.BusinessName = field.BusinessName
				v.PrimaryKeyFlag = field.PrimaryKey.Bool
				v.Type = strings.ToLower(field.DataType)
			} else {
				// 查询结果AD中不存在（即没有血缘关系的字段），添加到对应表的字段中
				// 拼接的字段位于原有字段后面
				position++

				newField := &Field{
					ID:             new32UUID(),
					Name:           field.TechnicalName,
					Type:           strings.ToLower(field.DataType),
					PrimaryKeyFlag: field.PrimaryKey.Bool,
					position:       position,
				}
				uniqueFieldMap[fKey] = newField
				uniqueTableMap[tKey].Fields = append(uniqueTableMap[tKey].Fields, newField)
			}
		}
	}
	for _, base := range list {
		sort.Slice(base.Fields, func(i, j int) bool {
			return base.Fields[i].position < base.Fields[j].position
		})
	}
}
func NewListLineageResp(summary []*SummaryInfoBase, total int64) *ListLineageResp {
	return &ListLineageResp{
		PageResult: PageResult[SummaryInfoBase]{
			Entries:    summary,
			TotalCount: total,
		},
	}
}

func AddInfoSysName(list []*SummaryInfoBase, infos map[string]string) {
	for _, base := range list {
		if base.DSID != "" {
			base.InfoSystemName = infos[base.DSID]
		}
	}
}

//region ParseLineage

type ParseLineageParamReq struct {
	ParseLineageParam `param_type:"query"`
}

type ParseLineageParam struct {
	TableName string `json:"table_name" form:"table_name" binding:"required"`
	ID        string `json:"id" form:"id" binding:"required"`
}

//endregion
