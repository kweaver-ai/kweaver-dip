package excel

import (
	"context"
	"errors"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gopkg.in/fatih/set.v0"
)

var (
	LineRulesStruct LineRules
	lineRuleMap     map[string]map[string]*SheetCutRuleByLine
)

type InstructionLine struct {
	Rows []int `yaml:"rows" json:"rows"`
}

type TableContentLine struct {
	TitleNum int `yaml:"title_num" json:"title_num"`
}

type SheetCutRuleByLine struct {
	SheetName    string           `yaml:"sheet_name" json:"sheet_name"`
	Instruction  *InstructionLine `yaml:"instruction" json:"instruction"`
	TableContent TableContentLine `yaml:"table_content" json:"table_content"`
}

type CutRuleByLine struct {
	Name           string                `yaml:"name" json:"name"`
	SheetLineRules []*SheetCutRuleByLine `yaml:"sheet_line_rules" json:"sheet_line_rules"`
}

type LineRules struct {
	LineRules []*CutRuleByLine `yaml:"line_rules" json:"line_rules"`
}

func getLineRule(templateName, sheetName string) *SheetCutRuleByLine {
	if lineRuleMap != nil {
		tmpMap := lineRuleMap[templateName]
		if tmpMap != nil {
			return tmpMap[sheetName]
		}
	}
	return nil
}

func initLineRule(ctx context.Context) (err error) {
	sTemplate, sSheet := set.New(set.NonThreadSafe), set.New(set.NonThreadSafe)
	lineRuleMap = map[string]map[string]*SheetCutRuleByLine{}
	for i := range LineRulesStruct.LineRules {
		if sTemplate.Has(LineRulesStruct.LineRules[i].Name) {
			log.WithContext(ctx).Errorf("import rule init failed: template name duplicated")
			return errors.New("import rule init error")
		}
		sTemplate.Add(LineRulesStruct.LineRules[i].Name)

		sSheet.Clear()
		lineRuleMap[LineRulesStruct.LineRules[i].Name] = map[string]*SheetCutRuleByLine{}
		for j := range LineRulesStruct.LineRules[i].SheetLineRules {
			if sTemplate.Has(LineRulesStruct.LineRules[i].SheetLineRules[j].SheetName) {
				log.WithContext(ctx).Errorf("import rule init failed: template: %s sheet name: %s duplicated",
					LineRulesStruct.LineRules[i].Name, LineRulesStruct.LineRules[i].SheetLineRules[j].SheetName)
				return errors.New("import rule init error")
			}
			sTemplate.Add(LineRulesStruct.LineRules[i].SheetLineRules[j].SheetName)

			lineRuleMap[LineRulesStruct.LineRules[i].Name][LineRulesStruct.LineRules[i].SheetLineRules[j].SheetName] = LineRulesStruct.LineRules[i].SheetLineRules[j]
		}
	}
	return
}
