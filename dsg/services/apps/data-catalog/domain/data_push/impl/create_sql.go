package impl

import (
	"bytes"
	"context"
	_ "embed"
	"html/template"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
)

//go:embed create_table_statement.gtpl
var createTableStatementTmplText string

// createTableStatementTmpl is the template for CREATE_TABLE_STATEMENT
var createTableStatementTmpl = template.Must(template.New("create_table_statement").Parse(createTableStatementTmplText))

// createTableStatementData A is the data used to render the createTableStatementTmpl
type createTableStatementData struct {
	Table      *DataTableCreateReq
	DataSource *DataSource
}

// DataSource mapped from table <data_source>
type DataSource struct {
	Name         string `json:"name"`                                             // 数据源的名称
	DataSourceID uint64 `json:"data_source_id"`                                   // 数据源雪花id
	CatalogName  string `gorm:"column:catalog_name;not null" json:"catalog_name"` // 数据源catalog名称
	Schema       string `gorm:"column:schema;not null" json:"schema"`             // 数据库实例名称
	ID           string `gorm:"column:id;not null" json:"id"`                     // 数据源ID
	TypeName     string `json:"type_name"`                                        // 数据库类型名称
	DepartmentID string `json:"department_id"`                                    // 部门ID
	HuaAoId      string `json:"hua_ao_id"`                                        // 华傲数据源id
	SourceType   int32  `json:"source_type"`                                      // 数据源类型
}

type DataTableCreateReq struct {
	Name   string            `json:"name" form:"name" example:"表名" binding:"required"` // 表名
	Fields []*FieldCreateReq `json:"fields" binding:"required,gte=1,dive"`
}

type FieldCreateReq struct {
	Name           string `json:"name" binding:"required" example:"字段1"`           // 字段名称
	Type           string `json:"type" binding:"required" example:"char"`          // 字段类型，对应虚拟化引擎数据源配置的 sourceType。
	Length         *int   `json:"length" example:"128" binding:"omitempty,min=0" ` // 字段长度
	FieldPrecision *int   `json:"field_precision" binding:"omitempty,min=0" `      // 字段精度
	Description    string `json:"description" binding:"omitempty" example:"字段注释"`  // 字段注释
	UnMapped       bool   `json:"unmapped"`                                        // 映射是否取消，true表示取消了映射。只有同步模型的target表需要该参数

	// 字段类型，用于通过虚拟化引擎的接口创建表，对应虚拟化引擎数据源配置的 olkSearchType。只有 target 表需要此参数。
	SearchType string `json:"searchType" example:"DECIMAL"`
}

func (_ *useCase) GenerateCreateSQL(ctx context.Context, target *DataTableCreateReq, dataSource *DataSource) (string, error) {
	// 检查是否存在名称重复的字段
	allFieldNames := make(map[string]bool)
	for _, field := range target.Fields {
		if _, ok := allFieldNames[field.Name]; ok {
			return "", errorcode.Detail(errorcode.PublicInvalidParameter, "字段名["+field.Name+"]重复冲突")
		}
		allFieldNames[field.Name] = true
	}

	var buf bytes.Buffer
	if err := createTableStatementTmpl.Execute(&buf, &createTableStatementData{Table: target, DataSource: dataSource}); err != nil {
		return "", err
	}

	return buf.String(), nil
}
