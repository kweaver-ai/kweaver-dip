package data_comprehension

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type TimeRange struct {
	Start int64 `json:"start"`
	End   int64 `json:"end"`
}

type Choice struct {
	Id   int    `json:"id"`
	Name string `json:"name"`
}

type CatalogBriefInfo struct {
	Id    models.ModelID `json:"id"`
	Title string         `json:"title"`
	Code  string         `json:"code"`
}

type CatalogRelation struct {
	CatalogInfos  []CatalogBriefInfo `json:"catalog_infos"`
	Comprehension string             `json:"comprehension"`
}

type ColumnBriefInfo struct {
	ID         models.ModelID `json:"id"`          //字段ID
	ColumnName string         `json:"column_name"` //字段名称
	NameCN     string         `json:"name_cn"`     //字段中文名称
	DataFormat int32          `json:"data_format"` //字段类型
}

type ColumnComprehension struct {
	ColumnInfo    ColumnBriefInfo `json:"column_info"`
	Comprehension string          `json:"comprehension"` //字段注释理解
}

type ColumnDetailInfo struct {
	ID         string `json:"id"`
	ColumnName string `json:"column_name"`
	NameCn     string `json:"name_cn"`
	DataType   string `json:"data_type"`
	AIComment  string `json:"ai_comment"`
}

type TextSlice []string
type TimeRanges []TimeRange
type Choices [][]Choice
type ColumnComprehensions []ColumnComprehension
type CatalogRelations []CatalogRelation
type ColumnDetailInfos []ColumnDetailInfo

type ContentType interface {
	Check(ctx context.Context, c DimensionDetail, helper CheckHelper, config *Configuration) ContentError
	TextSlice | TimeRanges | Choices | ColumnComprehensions | CatalogRelations | ColumnDetailInfos
}

func Recognize[T ContentType](d any) (T, error) {
	bts, _ := json.Marshal(d)
	log.Infof("content: %v, b: %s", d, bts)
	data, err := Decode[T](bts)
	if err != nil {
		return nil, err
	}
	return *data, err
}

func Decode[T ContentType](ds []byte) (*T, error) {
	t := new(T)
	if err := json.Unmarshal(ds, t); err != nil {
		log.Infof("failed to unmarshal json to struct, b: %s, err: %v", ds, err)
		return nil, errorcode.Desc(errorcode.DataComprehensionUnmarshalJsonError)
	}
	return t, nil
}
