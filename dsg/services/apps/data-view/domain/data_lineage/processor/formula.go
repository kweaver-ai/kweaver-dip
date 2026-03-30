package processor

import (
	"encoding/json"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_lineage/processor/formulas"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
	"github.com/samber/lo"
	"strings"
	"sync"
)

type FormulaNode struct {
	Id           string        `json:"id"`
	Type         string        `json:"type"`
	Config       any           `json:"config"`
	OutputFields []OutputField `json:"output_fields"`
}

func newPool() *sync.Pool {
	return &sync.Pool{}
}

// Express 根据index，给出该字段的依赖字段和表达式
func (f *FormulaNode) Express(id string) (ref []string, expr string) {
	switch f.Type {
	case FormulaTypeDistinct.String, FormulaTypeForm.String, FormulaTypeSelect.String, FormulaTypeOutputView.String:
		ref = append(ref, id)
		expr = enum.GetObj[FormulaType](f.Type).Display
	case FormulaTypeJoin.String:
		ref = append(ref, id)
		config := parse[formulas.JoinConfig](f.Config)
		if config != nil {
			for _, field := range f.OutputFields {
				if field.Id == id {
					expr = fmt.Sprintf("%v(%v)", enum.GetObj[FormulaType](f.Type).Display, config.RelationType)
				}
			}
		}
	case FormulaTypeMerge.String:
		config := parse[formulas.MergeConfig](f.Config)
		if config != nil {
			for index, configField := range config.ConfigFields {
				if configField.Id == id {
					//依赖字段
					for _, mergeNode := range config.Merge.Nodes {
						ref = append(ref, mergeNode.Fields[index].Id)
					}
					//算子操作
					expr = enum.GetObj[FormulaType](f.Type).Display
				}
			}
		}
	case FormulaTypeWhere.String:
		ref = append(ref, id)
		//判断该字段是否作为条件过滤
		config := parse[formulas.WhereConfig](f.Config)
		for _, where := range config.Where {
			for _, member := range where.Member {
				if member.Field.Id == id {
					expr = fmt.Sprintf("%v(%v)", enum.GetObj[FormulaType](f.Type).Display, config.WhereRelation)
				}
			}
		}
	case FormulaTypeSQL.String:
		ref = append(ref, id)
		//判断当前字段在不在where 条件中
		config := parse[formulas.SQLConfig](f.Config)
		currentFieldName := ""
		for _, field := range f.OutputFields {
			if field.Id == id {
				currentFieldName = field.NameEn
			}
		}
		sqlParts := strings.Split(strings.ToLower(config.Sql.SQLInfo.SqlStr), "where")
		if len(sqlParts) >= 2 {
			whereCondition := sqlParts[1]
			if strings.Contains(whereCondition, fmt.Sprintf(`"%v"`, currentFieldName)) {
				expr = enum.GetObj[FormulaType](f.Type).Display
			}
		}
	}
	return ref, expr
}

func parse[T any](d any) *T {
	t := new(T)
	json.Unmarshal(lo.T2(json.Marshal(d)).A, t)
	if t == nil {
		return nil
	}
	return t
}
