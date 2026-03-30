package excel_process

import (
	"errors"
	"fmt"
	"strings"

	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/errorcode"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process/rule"
)

type ExcelProcessUsecase struct{}

func NewExcelProcessUsecase() *ExcelProcessUsecase {
	return &ExcelProcessUsecase{}
}

// CutRowsByLine 通过行数配置文件切分一个sheet的多种类型
func (e *ExcelProcessUsecase) CutRowsByLine(cutRuleByLine *rule.CutRuleByLine, rows [][]string, sheetName string) (kvContent [][]string, tableContent [][]string, instruction []string, sheetNameContent string, err error) {
	if cutRuleByLine.SheetName.Row != 0 {
		sheetNameContent = rows[cutRuleByLine.SheetName.Row-1][0]
	}
	if sheetName != sheetNameContent {
		return nil, nil, nil, "", errors.New("Cut wrong sheet")
	}
	for _, k := range cutRuleByLine.Instruction.Rows {
		if k != 0 {
			instruction = append(instruction, rows[k-1][0])
		}
	}
	if cutRuleByLine.KvContent.Start != 0 {
		kvContent = rows[cutRuleByLine.KvContent.Start-1 : cutRuleByLine.KvContent.End]
	}
	if cutRuleByLine.TableContent.TitleNum != 0 {
		tableContent = rows[cutRuleByLine.TableContent.TitleNum-1 : cutRuleByLine.TableContent.TitleNum+cutRuleByLine.TableContent.ContentCount]
	}
	return
}

// CutRowsByLineV2 通过行数配置文件切分一个sheet的多种类型,新增不变kvContent，instruction，sheetNameContent；可变tableContent，即配置文件中不需要tableContent行数，只需要title，后面直接读有多少行
func (e *ExcelProcessUsecase) CutRowsByLineV2(cutRuleByLine *rule.CutRuleByLine, rows [][]string, sheetName string) (kvContent [][]string, tableContent [][]string, instruction []string, sheetNameContent string, hasError bool) {
	if cutRuleByLine.SheetName.Row > 0 && cutRuleByLine.SheetName.Row-1 < len(rows) && rows[cutRuleByLine.SheetName.Row-1] != nil {
		sheetNameContent = rows[cutRuleByLine.SheetName.Row-1][0]
	} else {
		return nil, nil, nil, "", true
	}
	if sheetName != sheetNameContent {
		return nil, nil, nil, "", true
	}
	for _, k := range cutRuleByLine.Instruction.Rows {
		if k > 0 && rows[k-1] != nil {
			instruction = append(instruction, rows[k-1][0])
		} else {
			return nil, nil, nil, "", true
		}
	}
	if cutRuleByLine.KvContent.Start-1 >= len(rows) || cutRuleByLine.KvContent.End >= len(rows) || cutRuleByLine.TableContent.TitleNum-1 >= len(rows) {
		return nil, nil, nil, "", true
	}
	if cutRuleByLine.KvContent.Start > 0 && rows[cutRuleByLine.KvContent.Start-1] != nil && rows[cutRuleByLine.KvContent.End] != nil {
		kvContent = rows[cutRuleByLine.KvContent.Start-1 : cutRuleByLine.KvContent.End]
	} else {
		return nil, nil, nil, "", true
	}

	if cutRuleByLine.TableContent.TitleNum > 0 && rows[cutRuleByLine.TableContent.TitleNum-1] != nil {
		tableContent = rows[cutRuleByLine.TableContent.TitleNum-1:]
	} else {
		return nil, nil, nil, "", true
	}
	return
}

func (e *ExcelProcessUsecase) CutRowsByLineVIndictor(cutRuleByLine *rule.CutRuleByLine, rows [][]string) (tableContent [][]string, hasError bool) {
	if cutRuleByLine.TableContent.TitleNum > 0 && rows[cutRuleByLine.TableContent.TitleNum-1] != nil {
		tableContent = rows[cutRuleByLine.TableContent.TitleNum-1:]
	} else {
		return nil, true
	}
	return
}

// todo CutRowsByLine 可以将模板配置中确定 instruction个数位置 ，sheetNameContent位置，kvContent位置个数，然后 tableContent 个数不用配置即可读出

// AnalysisTablePattern 切分的Table类型转化为 map
func (e *ExcelProcessUsecase) AnalysisTablePattern(rows [][]string) []interface{} {
	res := make([]interface{}, 0, len(rows))
	if len(rows) == 0 {
		return res
	}
	if len(rows) == 1 {
		rows = append(rows, make([]string, len(rows[0])))
	}
	title := rows[0]
	for i := 1; i < len(rows); i++ {
		tmp := make(map[string]string)
		for k, cel := range rows[i] {
			tmp[title[k]] = cel
		}
		res = append(res, tmp)
	}
	return res
}

// AnalysisKVPattern 切分的kv类型转为 map
func (e *ExcelProcessUsecase) AnalysisKVPattern(rows [][]string) interface{} {
	// res := make([]interface{}, 0, len(rows))
	res := make(map[string]string)
	for i := 0; i < len(rows); i++ {
		// tmp := make(map[string]string)
		tmpKey := ""
		for k, cel := range rows[i] {
			// 赋值 tmpKey
			if k == 0 {
				tmpKey = cel
			} else if tmpKey != "" { // tmpKey非空，后面一列必是v  无论cel是否为空 cel != ""   cel == ""
				res[tmpKey] = cel
				tmpKey = ""
			} else if cel != "" && tmpKey == "" {
				tmpKey = cel
			}
		}
		if tmpKey != "" { // 最后一个kv中v是空的会吞掉
			res[tmpKey] = ""
		}
	}
	return res
}

// Inward 合并为一个json
func (e *ExcelProcessUsecase) Inward(kvPattern interface{}, tablePattern []interface{}, instruction []string, sheetNameContent string) interface{} {
	res := make(map[string]interface{})
	res["sheetName"] = sheetNameContent
	res["instruction"] = instruction
	res["tablePattern"] = tablePattern
	res["kvPattern"] = kvPattern
	return res
}

// VerifyTablePattern 校验table类型的内容有效性 [*必填项]
// false 必填项有空， error是与模板不符
func (e *ExcelProcessUsecase) VerifyTablePattern(rows [][]string) error {
	if len(rows) == 0 || len(rows) == 1 {
		return nil
	}

	title := rows[0]
	fmt.Println(title)

	// reduce title has "" problem
	for i := len(title) - 1; i > 0; i-- {
		if title[i] != "" {
			break
		} else {
			return errorcode.Desc(my_errorcode.FormContentError)
			// 	title = append(title[:i], title[i+1:]...)
			// 	for j := 0; j < len(rows); j++ {
			// 		if len(title) < len(rows[j]) { // why j ,i is column j is line
			// 			rows[j] = rows[j][:len(title)]
			// 		} else if len(title) > len(rows[i]) {
			// 			// 下面添加了
			// 		} // equal not handle
			// 		// rows[j] = append(rows[j][:i], rows[j][i+1:]...)
			// 	}
		}
	}

	// 格式验证：最后一列可能为空，需要填充""
	for i := 1; i < len(rows); i++ {
		// if rows[i] == nil {
		// 	log.Error("VerifyTablePattern row empty err", zap.Int("line", i+2))
		// 	return false, errors.New("中间存在空行")
		// }
		diff := len(title) - len(rows[i])
		// if diff < 0 {
		// 	log.Error("row Is greater than title", zap.Int("line", i+2))
		// 	return errors.New("列数超过标题")
		// } else
		if diff > 0 {
			for j := 0; j < diff; j++ {
				rows[i] = append(rows[i], "")
			}
		}
	}
	//  对列进行验证是否有空
	for i := 1; i < len(rows); i++ { // 遍历除title的行
		for k := 0; k < len(title); k++ {
			rows[i][k] = strings.TrimSpace(rows[i][k])
			// if strings.HasPrefix(title[k], "*") {
			// 	if rows[i][k] == "" { // k列标记必填，i行为空，验证失败
			// 		log.Error("VerifyTablePattern column Required  err(line offset title)", zap.String("column", title[k]), zap.Int("line", i))
			// 		return nil
			// 	}
			// }
		}
	}
	// // delete prefix * of column name
	// for k := 0; k < len(title); k++ {
	// 	if strings.HasPrefix(title[k], "*") {
	// 		title[k] = title[k][1:]
	// 	}
	// }

	return nil
}

// VerifyKVPattern 校验KV类型的内容有效性 [*必填项]
func (e *ExcelProcessUsecase) VerifyKVPattern(rows [][]string) bool {
	for i := 0; i < len(rows); i++ {
		tmpKey := ""
		for k, cel := range rows[i] {
			// 赋值 tmpKey
			if k == 0 {
				tmpKey = cel
			} else if tmpKey != "" { // tmpKey非空，后面一列必是v  无论cel是否为空 cel != ""   cel == ""
				if strings.HasPrefix(tmpKey, "*") {
					rows[i][k] = rows[i][k][1:]
					if cel == "" { // key包含* 必填，且valve为空，返回错误
						return false
					}
				}
				tmpKey = ""
			} else if cel != "" && tmpKey == "" {
				tmpKey = cel
			}
		}
		if tmpKey != "" && strings.HasPrefix(tmpKey, "*") { // 最后一个kv中v是空的会吞掉
			return false
		}
	}
	return true
}

// VerifyKVPatternV2 校验KV类型的内容有效性 [*必填项] 以及去掉*
// func (e *ExcelProcessUsecase) VerifyKVPatternV2(m map[string]string) (map[string]string, error) {
// 	m2 := make(map[string]string, len(m))
// 	for k, v := range m {
// 		v = strings.TrimSpace(v)
// 		if strings.HasPrefix(k, "*") {
// 			if v == "" {
// 				return nil, errorcode.Desc(my_errorcode.ExcelRequiredFieldWithArgsError, k[1:])
// 			}
// 			m2[k[1:]] = v
// 		} else {
// 			m2[k] = v
// 		}
// 	}

// 	return m2, nil
// }

// VerifyAnalysisTablePattern 切分的Table类型转化为 map并且做校验  ,未写完
func (e *ExcelProcessUsecase) VerifyAnalysisTablePattern(rows [][]string) ([]interface{}, bool) {
	res := make([]interface{}, 0, len(rows))
	if len(rows) == 0 {
		return res, true
	}
	if len(rows) == 1 {
		rows = append(rows, make([]string, len(rows[0])))
	}
	title := rows[0]
	for i := 1; i < len(rows); i++ {
		tmp := make(map[string]string)
		for k, cel := range rows[i] {
			tmp[title[k]] = cel
		}
		res = append(res, tmp)
	}
	return res, true
}

// Transform 根据配置文件将excel中的中文转换为配置文件中的name字段 ，多行拆成一行
// func (e *ExcelProcessUsecase) Transform(tablePattern []interface{}, t *template.Template) ([]map[string]interface{}, error) {
// 	res := make([]map[string]interface{}, len(tablePattern), len(tablePattern))

// 	tableComponentCnt := 0
// 	for _, component := range t.Components {
// 		if !component.IsKv {
// 			tableComponentCnt++
// 		}
// 	}

// 	for i := 0; i < len(tablePattern); i++ {
// 		m := tablePattern[i].(map[string]string)
// 		if len(m) != tableComponentCnt {
// 			log.Error("[import models] Inconsistent with template filed count", zap.Int("field ", len(m)), zap.Int("field ", len(tablePattern)))
// 			return nil, errorcode.Desc(my_errorcode.ExcelContentError)
// 		}
// 		tmpMap := make(map[string]interface{})
// 		for key, value := range m {
// 			for _, component := range t.Components {
// 				if component.IsKv {
// 					continue
// 				}

// 				if key == component.Label || key == "*"+component.Label {
// 					tmpMap[component.Name] = value
// 					if component.IsMultipleValues && value != "" { // 多行拆成一行
// 						split := strings.Split(value, component.Separator)
// 						if len(split) > component.MaxValues {
// 							log.Error(component.Label+" [import models] bigger than MaxValues ", zap.Int("line ", i+2))
// 							return nil, errorcode.Desc(errorcode.ExcelTransformError)
// 						}
// 						// if util.IsDuplicateString(split) {
// 						// 	log.Error(component.Label+" [import models] Duplicate error ", zap.Int("line ", i+2))
// 						// 	//return nil, errorcode.Desc(errorcode.ExcelImportDuplicate, component.Label)
// 						// 	return nil, errorcode.WithDetail(errorcode.ExcelImportDuplicate, map[string]any{"%s": component.Label})
// 						// }
// 						tmpMap[component.Name] = split
// 					} else if component.IsMultipleValues && value == "" {
// 						tmpMap[component.Name] = nil
// 					}
// 				}
// 			}
// 		}
// 		res[i] = tmpMap
// 	}
// 	return res, nil
// }

// func (e *ExcelProcessUsecase) TransformKv(kvMap map[string]string, t *template.Template) (map[string]any, error) {
// 	res := make(map[string]any, len(kvMap))
// 	cnt := 0
// 	for k, v := range kvMap {
// 		for _, component := range t.Components {
// 			if component.IsKv && k == component.Label {
// 				res[component.Name] = v
// 				cnt++
// 			}
// 		}
// 	}

// 	if cnt < len(kvMap) {
// 		log.Errorf("failed to transform kv")
// 		return nil, errorcode.Desc(errorcode.ExcelContentError)
// 	}

// 	return res, nil
// }
