package impl

import (
	"encoding/json"
	"errors"
	"fmt"
	"strconv"
	"strings"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/domain/sub_service"
)

func genWhereClause(subView *sub_service.SubService) (clause string) {
	subServiceDetail := &sub_service.SubServiceDetail{}
	if err := json.Unmarshal([]byte(subView.Detail), &subServiceDetail); err != nil {
		log.Warn("unmarshal error while decode subService", zap.Error(err), zap.Any("subService", subView.Detail))
		return ""
	}

	rowFilterClause, err1 := generateWhereClause(&subServiceDetail.RowFilters)
	if err1 != nil {
		log.Warn("generate sub service where clause fail", zap.Error(err1), zap.Any("filters", subServiceDetail.RowFilters))
	}
	if subServiceDetail.FixedRowFilters == nil {
		return rowFilterClause
	}
	fixedRangeClause, err := generateWhereClause(subServiceDetail.FixedRowFilters)
	if err != nil {
		log.Warn("generate sub service where clause fail", zap.Error(err), zap.Any("fixed_filters", subServiceDetail.FixedRowFilters))
	}
	if fixedRangeClause != "" {
		if rowFilterClause == "" {
			rowFilterClause = fixedRangeClause
		} else {
			rowFilterClause = fmt.Sprintf("(%v and %v) ", fixedRangeClause, rowFilterClause)
		}
	}
	return rowFilterClause
}

func generateWhereClause(f *sub_service.RowFilters) (string, error) {
	var conditions []string
	for _, w := range f.Where {
		var conditionPreGroup string
		for _, m := range w.Member {
			opAndValueSQL, err := whereOPAndValue(escape(m.NameEn), m.Operator, m.Value, m.DataType)
			if err != nil {
				return "", err
			}
			if conditionPreGroup != "" {
				conditionPreGroup = conditionPreGroup + " " + w.Relation + " " + opAndValueSQL
			} else {
				conditionPreGroup = opAndValueSQL
			}
		}
		conditions = append(conditions, "("+conditionPreGroup+")")
	}
	var whereRelation string
	if f.WhereRelation != "" {
		whereRelation = fmt.Sprintf(` %s `, f.WhereRelation)
	} else {
		whereRelation = " AND "
	}

	return strings.Join(conditions, whereRelation), nil
}

func whereOPAndValue(name, op, value, dataType string) (whereBackendSql string, err error) {
	special := strings.NewReplacer(`\`, `\\\\`, `'`, `\'`, `%`, `\%`, `_`, `\_`)
	switch op {
	case "<", "<=", ">", ">=":
		if _, err = strconv.ParseFloat(value, 64); err != nil {
			return whereBackendSql, errors.New("where conf invalid")
		}
		whereBackendSql = fmt.Sprintf("%s %s %s", name, op, value)
	case "=", "<>":
		if dataType == constant.SimpleInt || dataType == constant.SimpleFloat || dataType == constant.SimpleDecimal {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errors.New("where conf invalid")
			}
			whereBackendSql = fmt.Sprintf("%s %s %s", name, op, value)
		} else if dataType == constant.SimpleChar {
			whereBackendSql = fmt.Sprintf("%s %s '%s'", name, op, value)
		} else {
			return "", errors.New("523 where op not allowed")
		}
	case "null":
		whereBackendSql = fmt.Sprintf("%s IS NULL", name)
	case "not null":
		whereBackendSql = fmt.Sprintf("%s IS NOT NULL", name)
	case "include":
		if dataType == constant.SimpleChar {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s LIKE '%s'", name, "%"+value+"%")
		} else {
			return "", errors.New("534 where op not allowed")
		}
	case "not include":
		if dataType == constant.SimpleChar {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s NOT LIKE '%s'", name, "%"+value+"%")
		} else {
			return "", errors.New("541 where op not allowed")
		}
	case "prefix":
		if dataType == constant.SimpleChar {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s LIKE '%s'", name, value+"%")
		} else {
			return "", errors.New("548 where op not allowed")
		}
	case "not prefix":
		if dataType == constant.SimpleChar {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf("%s NOT LIKE '%s'", name, value+"%")
		} else {
			return "", errors.New("555 where op not allowed")
		}
	case "in list":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.SimpleChar {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf("%s IN %s", name, "("+value+")")
	case "belong":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.SimpleChar {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf("%s IN %s", name, "("+value+")")
	case "true":
		whereBackendSql = fmt.Sprintf("%s = true", name)
	case "false":
		whereBackendSql = fmt.Sprintf("%s = false", name)
	case "before":
		valueList := strings.Split(value, " ")
		whereBackendSql = fmt.Sprintf(`%s >= DATE_add('%s', -%s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') AND %s <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai'`, name, valueList[1], valueList[0], name)
	case "current":
		if value == "%Y" || value == "%Y-%m" || value == "%Y-%m-%d" || value == "%Y-%m-%d %H" || value == "%Y-%m-%d %H:%i" || value == "%x-%v" {
			whereBackendSql = fmt.Sprintf("DATE_FORMAT(%s, '%s') = DATE_FORMAT(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai', '%s')", name, value, value)
		} else {
			return "", errors.New("586 where op not allowed")
		}
	case "between":
		valueList := strings.Split(value, ",")
		whereBackendSql = fmt.Sprintf("%s BETWEEN DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP)) AND DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP))", name, valueList[0], valueList[1])
	default:
		return "", errors.New("592 where op not allowed")
	}
	return
}

// quote 转义字段名称
func escape(s string) string {
	s = strings.Replace(s, "\"", "\"\"", -1)
	// 虚拟化引擎要求字段名称使用英文双引号 "" 转义，避免与关键字冲突
	s = fmt.Sprintf(`"%s"`, s)
	return s
}
