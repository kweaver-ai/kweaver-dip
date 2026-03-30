package excel

import (
	"context"
	"errors"
	"regexp"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gopkg.in/fatih/set.v0"
)

var (
	TemplateStruct Templates
	templateMap    map[string]map[string]*SheetTemplate
)

type Rule struct {
	Required       bool    `yaml:"required" json:"required"`
	RequiredInfo   *string `yaml:"required_info" json:"required_info"`
	Regexp         *string `yaml:"regexp" json:"regexp"`
	RegexpInfo     *string `yaml:"regexp_info" json:"regexp_info"`
	MaxLength      *int    `yaml:"max_length" json:"max_length"`
	LengthInfo     *string `yaml:"length_info" json:"length_info"`
	Unique         bool    `yaml:"unique" json:"unique"`
	DuplicatedInfo *string `yaml:"duplicated_info" json:"duplicated_info"`
}
type Component struct {
	Index  int    `yaml:"index" json:"index"`
	Label  string `yaml:"label" json:"label"`
	Name   string `yaml:"name" json:"name"`
	Rule   *Rule  `yaml:"rule" json:"rule"`
	Verify func(context.Context, *Component, string, map[string]map[string]bool) error
}

type SheetTemplate struct {
	SheetName        string       `yaml:"sheet_name" json:"sheet_name"`
	Components       []*Component `yaml:"components" json:"components"`
	FieldName2IdxMap map[string]int
}

type Template struct {
	Name           string           `yaml:"name" json:"name"`
	SheetTemplates []*SheetTemplate `yaml:"sheet_templates"  json:"sheet_templates"`
}

type Templates struct {
	Templates []*Template `yaml:"templates" json:"templates"`
}

func getTemplate(templateName, sheetName string) *SheetTemplate {
	if templateMap != nil {
		tmpMap := templateMap[templateName]
		if tmpMap != nil {
			return tmpMap[sheetName]
		}
	}
	return nil
}

func initTemplate(ctx context.Context) (err error) {
	sTemplate, sSheet, sFieldName := set.New(set.NonThreadSafe), set.New(set.NonThreadSafe), set.New(set.NonThreadSafe)
	templateMap = map[string]map[string]*SheetTemplate{}
	for i := range TemplateStruct.Templates {
		if sTemplate.Has(TemplateStruct.Templates[i].Name) {
			log.WithContext(ctx).Errorf("import template init failed: template name duplicated")
			return errors.New("import template init error")
		}
		sTemplate.Add(TemplateStruct.Templates[i].Name)

		sSheet.Clear()
		templateMap[TemplateStruct.Templates[i].Name] = map[string]*SheetTemplate{}
		for j := range TemplateStruct.Templates[i].SheetTemplates {
			if sTemplate.Has(TemplateStruct.Templates[i].SheetTemplates[j].SheetName) {
				log.WithContext(ctx).Errorf("import template init failed: template: %s sheet name: %s duplicated",
					TemplateStruct.Templates[i].Name, TemplateStruct.Templates[i].SheetTemplates[j].SheetName)
				return errors.New("import template init error")
			}
			sTemplate.Add(TemplateStruct.Templates[i].SheetTemplates[j].SheetName)

			templateMap[TemplateStruct.Templates[i].Name][TemplateStruct.Templates[i].SheetTemplates[j].SheetName] = TemplateStruct.Templates[i].SheetTemplates[j]
			TemplateStruct.Templates[i].SheetTemplates[j].FieldName2IdxMap = map[string]int{}
			sFieldName.Clear()
			for k := range TemplateStruct.Templates[i].SheetTemplates[j].Components {
				if sFieldName.Has(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Name) {
					log.WithContext(ctx).Errorf("import template init failed: field name duplicated")
					return errors.New("import template init error")
				}
				sFieldName.Add(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Name)
				if _, isExisted := TemplateStruct.Templates[i].SheetTemplates[j].FieldName2IdxMap[TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Label]; isExisted {
					log.WithContext(ctx).Errorf("import template init failed: field label / title duplicated")
					return errors.New("import template init error")
				}
				TemplateStruct.Templates[i].SheetTemplates[j].FieldName2IdxMap[TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Label] = k
				if TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule == nil {
					continue
				}

				if TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.Required &&
					(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.RequiredInfo == nil ||
						(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.RequiredInfo != nil &&
							len(*TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.RequiredInfo) == 0)) {
					log.WithContext(ctx).Errorf("import template init failed: required_info cannot be null or empty when required is true")
					return errors.New("import template init error")
				}

				var rexp *regexp.Regexp
				if TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.Regexp != nil &&
					len(*TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.Regexp) > 0 {
					if rexp, err = regexp.Compile(*TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.Regexp); err != nil {
						log.WithContext(ctx).Errorf("import template init failed: %v", err)
						return err
					}
					if TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.RegexpInfo == nil ||
						(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.RegexpInfo != nil &&
							len(*TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.RegexpInfo) == 0) {
						log.WithContext(ctx).Errorf("import template init failed: regexp_info cannot be null or empty when regexp is not null")
						return errors.New("import template init error")
					}
				}

				if TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.MaxLength != nil &&
					*TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.MaxLength > 0 {
					if TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.LengthInfo == nil ||
						(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.LengthInfo != nil &&
							len(*TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.LengthInfo) == 0) {
						log.WithContext(ctx).Errorf("import template init failed: length_info cannot be null or empty when max_length > 0")
						return errors.New("import template init error")
					}
				}

				if TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.Unique &&
					(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.DuplicatedInfo == nil ||
						(TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.DuplicatedInfo != nil &&
							len(*TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Rule.DuplicatedInfo) == 0)) {
					log.WithContext(ctx).Errorf("import template init failed: duplicated_info cannot be null or empty when unique is true")
					return errors.New("import template init error")
				}

				TemplateStruct.Templates[i].SheetTemplates[j].Components[k].Verify =
					func(c context.Context, component *Component, val string, duplicateCheckMap map[string]map[string]bool) error {
						if component.Rule == nil {
							return nil
						}

						// 必填验证 - 如果字段为空，直接返回 FormFieldEmptyError
						if component.Rule.Required {
							if len(strings.TrimSpace(val)) == 0 {
								log.WithContext(c).Errorf(*component.Rule.RequiredInfo)
								return errorcode.Detail(errorcode.FormFieldEmptyError, *component.Rule.RequiredInfo)
							}
						}

						// 如果字段为空且不是必填，直接返回成功
						if len(strings.TrimSpace(val)) == 0 {
							return nil
						}

						// 唯一性验证
						if component.Rule.Unique {
							if valMap, isExisted := duplicateCheckMap[component.Name]; !isExisted {
								valMap = map[string]bool{val: true}
								duplicateCheckMap[component.Name] = valMap
							} else if valMap[val] {
								log.WithContext(c).Errorf(*component.Rule.DuplicatedInfo)
								return errorcode.Detail(errorcode.FormFieldValueError, *component.Rule.DuplicatedInfo)
							} else {
								valMap[component.Name] = true
								duplicateCheckMap[component.Name] = valMap
							}
						}

						// 格式验证
						if rexp != nil && !rexp.Match(util.StringToBytes(val)) {
							log.WithContext(c).Errorf(*component.Rule.RegexpInfo)
							return errorcode.Detail(errorcode.FormFieldValueError, *component.Rule.RegexpInfo)
						}

						// 长度验证
						if component.Rule.MaxLength != nil &&
							*component.Rule.MaxLength > 0 {
							if len(strings.TrimSpace(val)) > *component.Rule.MaxLength {
								log.WithContext(c).Errorf(*component.Rule.LengthInfo)
								return errorcode.Detail(errorcode.FormFieldValueError, *component.Rule.LengthInfo)
							}
						}

						return nil
					}
			}
		}
	}
	return
}
