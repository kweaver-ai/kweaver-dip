package data_masking

import (
	"bytes"
	"context"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"fmt"
	"strings"
)

type Field struct {
	FieldName   string `json:"field" binding:"required"`
	ChineseName string `json:"chinese_name" binding:"required"`
	Sensitive   *int   `json:"sensitive" binding:"required,oneof=0 1"`
	Classified  *int   `json:"classified" binding:"required,oneof=0 1"`
	FieldType   string `json:"field_type" binding:"required,VerifySpecialCharacters"`
}

type MaskedSql struct {
	Sql string `json:"masked_sql" example:"select name from db"` // 资源对象ID
}

type ValidError struct {
	Key     string `json:"key"`
	Message string `json:"message"`
}

type CreateReqBodyParams struct {
	Fields    []*Field `json:"fields" binding:"required,min=1,dive"`
	TableName string   `json:"table_name" binding:"required" example:"A.B"`
}

type ValidErrors []*ValidError

type SqlMaskingDomain struct {
	//sqlMaskingRepo sql_masking.Repo
}

func NewSqlMaskingDomain() *SqlMaskingDomain {
	return &SqlMaskingDomain{}
}

var user_defined_masking_rule = map[string]string{
	"姓名":   "MASK_LAST_1",
	"电话号码": "MASK_MID_5,8",
	"身份证":  "MASK_MID_7,14",
	"护照":   "MASK_LAST_4",
}

func (d *SqlMaskingDomain) DoMasking(ctx context.Context, req *CreateReqBodyParams) (resp *MaskedSql, err error) {
	sql, err := masking(d, ctx, req)
	if err != nil {
		return nil, err
	}
	return &MaskedSql{Sql: sql}, nil
}
func masking(d *SqlMaskingDomain, ctx context.Context, req *CreateReqBodyParams) (sql string, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	output := bytes.Buffer{}
	output.WriteString("SELECT ")
	for i := 0; i < len(req.Fields); i++ {
		field := req.Fields[i].FieldName //chinese_name string, sensitive int, classified
		chinese_name := req.Fields[i].ChineseName
		sensitive := req.Fields[i].Sensitive
		classified := req.Fields[i].Classified
		field_type := req.Fields[i].FieldType
		field_str := str_concat(field_type, field, chinese_name, *sensitive, *classified)
		output.WriteString(field_str)
		if i < len(req.Fields)-1 {
			output.WriteString(",")
		}
	}
	output.WriteString(" ")
	output.WriteString("FROM ")
	output.WriteString(req.TableName)
	return output.String(), nil
}

func str_concat(field_type string, field string, chinese_name string, sensitive int, classified int) string {
	if strings.ToLower(field_type) != "string" {
		return fmt.Sprintf(`"` + field + `"`)
	}
	_, ok := user_defined_masking_rule[chinese_name]
	if ok == true {
		if chinese_name == "姓名" { //CONCAT(SUBSTR(%s,1,1),'*')
			return fmt.Sprintf("CONCAT(SUBSTR(" + `"` + field + `"` + ",1,1),'**')  AS " + `"` + field + `"`)
			// return fmt.Sprintf("CONCAT(SUBSTR(%s,1,1),'**')  AS %s", field, field)
		} else if chinese_name == "电话号码" { //中间4位用*代替
			return fmt.Sprintf("CONCAT(SUBSTR(" + `"` + field + `"` + ",1,3),'****',SUBSTR(" + `"` + field + `"` + ",8,12)) AS " + `"` + field + `"`)
			// return fmt.Sprintf("CONCAT(SUBSTR(%s,1,3),'****',SUBSTR(%s,8,12)) AS %s", field, field, field)
		} else if chinese_name == "身份证" { // 中间的生日8位用*代替
			return fmt.Sprintf("CONCAT(SUBSTR(" + `"` + field + `"` + ",1,6),'********',SUBSTR(" + `"` + field + `"` + ",15,18)) AS " + `"` + field + `"`)
			//return fmt.Sprintf("CONCAT(SUBSTR(%s,1,6),'********',SUBSTR(%s,15,18)) AS %s", field, field, field)
		} else if chinese_name == "护照" {
			return fmt.Sprintf("CONCAT(SUBSTR(" + `"` + field + `"` + ",1,5),'****')  AS " + `"` + field + `"`)
		} else {
			return ""
		}
	} else {
		base_result := sensitive + classified
		if base_result == 0 { //不敏感、不涉密，不处理
			return field
		} else if base_result == 1 { //敏感、涉密，字段全部进行脱敏
			return fmt.Sprintf("rpad('',6,'*') as " + `"` + field + `"`)
			// return fmt.Sprintf("CASE WHEN LENGTH(%s) > 2 THEN  RPAD(SUBSTR(%s,1,LENGTH(%s)/2),LENGTH(%s),'*') ELSE '*' END AS %s", field, field, field, field, field)
		} else { //敏感、涉密，字段全部进行脱敏
			return fmt.Sprintf("rpad('',6,'*') as " + `"` + field + `"`)
		}
	}
}
