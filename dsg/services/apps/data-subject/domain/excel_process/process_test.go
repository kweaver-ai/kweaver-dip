package excel_process

import (
	"fmt"
	"io/ioutil"
	"path"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process/rule"
	"github.com/xuri/excelize/v2"
	"gopkg.in/yaml.v2"
)

func TestExcelProcessUsecase_CutRowsByLine(t *testing.T) {
	configYamlV3, err := ioutil.ReadFile("./rule/主干业务清单表.yaml")
	if err != nil {
		fmt.Printf("Read conf File error :%v", err)
	}
	cutRuleByLine := new(rule.CutRuleByLine)
	err = yaml.Unmarshal(configYamlV3, &cutRuleByLine)
	if err != nil {
		fmt.Printf("Unmarshal conf File error :%v", err)
	}
	e := &ExcelProcessUsecase{}
	file, err := excelize.OpenFile(path.Join("D:", "file", "af", "f3", "相关流程的模板表", "业务梳理流程相关的模板表.xlsx")) //数据质量梳理流程相关的模板表
	if err != nil {
		fmt.Println(err)
	}
	sheetList := file.GetSheetList()
	for _, sheet := range sheetList {
		//if sheet == e.CutRuleByLine.SheetName.RuleName {
		if sheet == "主干业务清单表" {
			rows, err := file.GetRows(sheet)
			if err != nil {
				fmt.Println(err)
				return
			}
			gotKvContent, gotTableContent, gotInstruction, gotSheetNameContent, err := e.CutRowsByLine(cutRuleByLine, rows, sheet)
			if err != nil {
				fmt.Println(err)
				return
			}
			fmt.Println(e.VerifyTablePattern(gotTableContent))
			fmt.Println("------------------")
			fmt.Println(gotSheetNameContent)
			fmt.Println("------------------")
			fmt.Println(gotInstruction)
			fmt.Println("------------------")
			kvPattern := e.AnalysisKVPattern(gotKvContent)
			fmt.Println(kvPattern)
			fmt.Println("------------------")
			tablePattern := e.AnalysisTablePattern(gotTableContent)
			fmt.Println(tablePattern)
		}
	}
}
