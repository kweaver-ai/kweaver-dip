package subject_domain

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"mime/multipart"
	"path"
	"regexp"
	"sort"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process/rule"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process/template"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/file_manager"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/xuri/excelize/v2"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type ResutlDetail struct {
	SheetName    string `json:"sheet_name"`
	SerialNumber int    `json:"serial_number"`
	Content      string `json:"content"`
	Reason       string `json:"reason"`
}

type ResutlDetailArray []ResutlDetail

func (array ResutlDetailArray) Len() int {
	return len(array)
}

func (array ResutlDetailArray) Less(i, j int) bool {
	if array[i].SheetName == array[j].SheetName {
		return array[i].SerialNumber < array[j].SerialNumber
	}
	return array[i].SheetName > array[j].SheetName
}

func (array ResutlDetailArray) Swap(i, j int) {
	array[i], array[j] = array[j], array[i]
}

var resutlDetails = []ResutlDetail{}

type ObjInfo struct {
	Path         string
	SerialNumber int
}

type SubjectDomainExportTransfer struct {
	BusinessDomainName                string `gorm:"column:subject_domain_group;not null" json:"subject_domain_group"`                             // 业务对象分组名称
	BusinessDomainDescription         string `gorm:"subject_domain_group_description" json:"subject_domain_group_description"`                     // 业务对象分组描述
	SubjectDomainName                 string `gorm:"subject_domain" json:"subject_domain"`                                                         // 业务对象名称
	SubjectDomainOwner                string `gorm:"column:subject_domain_owners;not null" json:"subject_domain_owners"`                           // 业务对象Owner
	SubjectDomainDescription          string `gorm:"subject_domain_description" json:"subject_domain_description"`                                 // 业务对象描述
	BusinessObjectOrActivityName      string `gorm:"column:business_object_or_activity;not null" json:"business_object_or_activity"`               // 业务对象/活动名称
	BusinessObjectOrActivitOwner      string `gorm:"column:business_object_or_activity_owners;not null" json:"business_object_or_activity_owners"` // 业务对象/活动Owner
	SubjectObjectOrActivitDescription string `gorm:"business_object_or_activity_description" json:"business_object_or_activity_description"`       // 业务对象/活动描述
	Type                              string `gorm:"update_cycle" json:"update_cycle"`                                                             // 业务对象/活动类型
	LogicEntitieName                  string `gorm:"column:logic_entity;not null" json:"logic_entity"`                                             // 逻辑实体名称
	AttributeName                     string `gorm:"column:attribute;not null" json:"attribute"`                                                   // 属性名称
	Unique                            string `gorm:"column:is_primary_key" json:"is_primary_key"`                                                  // 唯一标识
	LabelName                         string `gorm:"column:label_name" json:"label_name"`                                                          // 分级标签
}

type SubjectDomainImportTransfer struct {
	BusinessDomainName                string `gorm:"column:subject_domain_group;not null" json:"subject_domain_group"`                             // 业务对象分组名称
	BusinessDomainDescription         string `gorm:"subject_domain_group_description" json:"subject_domain_group_description"`                     // 业务对象分组描述
	SubjectDomainName                 string `gorm:"subject_domain" json:"subject_domain"`                                                         // 业务对象名称
	SubjectDomainOwner                string `gorm:"column:subject_domain_owners;not null" json:"subject_domain_owners"`                           // 业务对象Owner
	SubjectDomainDescription          string `gorm:"subject_domain_description" json:"subject_domain_description"`                                 // 业务对象描述
	BusinessObjectOrActivityName      string `gorm:"column:business_object_or_activity;not null" json:"business_object_or_activity"`               // 业务对象/活动名称
	BusinessObjectOrActivitOwner      string `gorm:"column:business_object_or_activity_owners;not null" json:"business_object_or_activity_owners"` // 业务对象/活动Owner
	SubjectObjectOrActivitDescription string `gorm:"business_object_or_activity_description" json:"business_object_or_activity_description"`       // 业务对象/活动描述
	Type                              string `gorm:"update_cycle" json:"update_cycle"`                                                             // 业务对象/活动类型
	LogicEntitieName                  string `gorm:"column:logic_entity;not null" json:"logic_entity"`                                             // 逻辑实体名称
	AttributeName                     string `gorm:"column:attribute;not null" json:"attribute"`                                                   // 属性名称
	Unique                            int8   `gorm:"column:is_primary_key" json:"is_primary_key"`                                                  // 唯一标识
	LabelName                         string `gorm:"column:label_name" json:"label_name"`                                                          // 分级标签
}

func (c *SubjectDomainUsecase) ImportSubDomain(ctx context.Context, f *file_manager.File, formFile *multipart.FileHeader) error {
	reader, err := formFile.Open()
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return errorcode.Desc(my_errorcode.FormOpenExcelFileError)
	}
	defer func() {
		if err := reader.Close(); err != nil {
			log.WithContext(ctx).Error("reader.Close " + err.Error())
		}
	}()

	sheetLists, xlsxFile, xlsFile, err := file_manager.ReadSheetList(f.FileType, reader)
	if err != nil {
		log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
		return errorcode.Desc(my_errorcode.FormOpenExcelFileError)
	}

	var listTemplate *template.Template
	for _, t := range template.TemplateStruct.Templates {
		if t.Name == "subject_domain_list" || t.SheetName == "业务对象或活动清单" {
			listTemplate = t
		}

	}
	if listTemplate == nil {
		return errorcode.Desc(my_errorcode.FormGetTemplateError)
	}

	var listRule *rule.CutRuleByLine
	for _, r := range rule.LineRulesStruct.LineRules {
		if r.Name == "业务对象或活动清单" {
			listRule = r
		}
	}
	if listRule == nil {
		return errorcode.Desc(my_errorcode.FormGetRuleError)
	}

	resutlDetails = []ResutlDetail{}
	var subjectDomainLists []*model.SubjectDomain
	for _, sheet := range sheetLists {
		var rows [][]string
		rows, err := file_manager.GetRows(f.FileType, sheet, xlsxFile, xlsFile)
		if err != nil {
			log.WithContext(ctx).Error("FormOpenExcelFileError " + err.Error())
			return errorcode.Desc(my_errorcode.FormOpenExcelFileError)
		}
		if sheet == "业务对象或活动清单表" || sheet == "业务对象或活动清单" {
			subjectDomainLists, err = c.ParsingSubjectDomainList(ctx, rows, listRule, listTemplate, sheet)
			if err != nil {
				return err
			}
		}
	}

	if len(subjectDomainLists) == 0 {
		log.WithContext(ctx).Error("业务对象或活动字段表为空")
		return errorcode.Desc(my_errorcode.FormEmptyError)
	}

	sort.Sort(ResutlDetailArray(resutlDetails))
	if len(resutlDetails) > 0 {
		return errorcode.Detail(my_errorcode.SheetContentError, resutlDetails)
	}

	// 写入数据库
	if err := c.repo.ImportSubDomainsBatch(ctx, subjectDomainLists); err != nil {
		return err
	}
	return nil
}

func (c *SubjectDomainUsecase) ParsingSubjectDomainList(ctx context.Context, rows [][]string, listRule *rule.CutRuleByLine, listTemplate *template.Template, sheet string) ([]*model.SubjectDomain, error) {

	tableContent, hasError := c.process.CutRowsByLineVIndictor(listRule, rows)
	if hasError {
		log.WithContext(ctx).Error("ParsingStandardFormList CutRows err")
		return nil, errorcode.Desc(my_errorcode.FormContentError)
	}

	if tableContent[0] != nil && len(tableContent[0]) != len(listTemplate.Components) { //-2 for filler and filling_date_str
		log.WithContext(ctx).Error("standard field title not equal")
		return nil, errorcode.Desc(my_errorcode.FormContentError)
	}

	limit := 2000
	// if settings.ConfigInstance.Config.Form.Original.FormFieldImportCountLimit != 0 {
	// 	limit = settings.ConfigInstance.Config.Form.Original.FormFieldImportCountLimit
	// }
	if len(tableContent) > limit+1 { // 每次仅支持最多导入个数限制
		return nil, errorcode.Desc(my_errorcode.FormFeildMaxLimitError, limit)
	}
	if len(tableContent) < 2 { // 空文件
		return nil, errorcode.Desc(my_errorcode.FormEmptyError)
	}

	// 去除前后空格，并验证
	err := c.process.VerifyTablePattern(tableContent)
	if err != nil {
		log.WithContext(ctx).Error("FormContentError " + err.Error())
		return nil, err
	}

	// 解析为map
	patterns := c.process.AnalysisTablePattern(tableContent)
	transform, err := ReplaceEnumValue(ctx, patterns, listTemplate)
	if err != nil {
		return nil, err
	}

	if err = VerifySubDomainStandard(ctx, transform, sheet); err != nil {
		return nil, err
	}

	subjectDomainList := make([]*model.SubjectDomain, 0)
	subjectDomainGroupLists := make([]*model.SubjectDomain, 0)
	subjectDomainLists := make([]*model.SubjectDomain, 0)
	businessObjectOrActivityLists := make([]*model.SubjectDomain, 0)
	logicEntityLists := make([]*model.SubjectDomain, 0)
	attributeLists := make([]*model.SubjectDomain, 0)

	subjectDomainExistMap := make(map[string]struct{})
	attributeMap := make(map[string][]string)
	attributeUniqueMap := make(map[string][]string)

	for i := 0; i < len(transform); i++ {
		if len(transform[i]) == 0 {
			continue
		}
		transfer2 := make(map[string]interface{}, 0)
		for k, e := range transform[i] {
			transfer2[k] = e
		}
		marshal, err := json.Marshal(transfer2)
		if err != nil {
			log.WithContext(ctx).Error("FormJsonMarshalError " + err.Error())
			return nil, errorcode.Desc(my_errorcode.FormJsonUnMarshalError)
		}
		tr := new(SubjectDomainImportTransfer)
		err = json.Unmarshal(marshal, tr)
		if err != nil {
			log.WithContext(ctx).Error("FormJsonUnMarshalError " + err.Error())
			return nil, errorcode.Desc(my_errorcode.FormJsonUnMarshalError)
		}

		if tr.BusinessDomainName == "" || tr.SubjectDomainName == "" || tr.BusinessObjectOrActivityName == "" ||
			tr.BusinessObjectOrActivitOwner == "" || tr.SubjectDomainOwner == "" || tr.Type == "" {
			addResutlDetail(sheet, i, "填写不完整", "请将业务对象组、业务对象、业务对象Owner、业务对象名称、业务对象/活动、业务对象Owner中缺少的字段补齐")
		}
		tr.BusinessDomainName = util.XssEscape(tr.BusinessDomainName)
		tr.BusinessDomainDescription = util.XssEscape(tr.BusinessDomainDescription)
		tr.SubjectDomainName = util.XssEscape(tr.SubjectDomainName)
		tr.SubjectDomainDescription = util.XssEscape(tr.SubjectDomainDescription)
		tr.BusinessObjectOrActivityName = util.XssEscape(tr.BusinessObjectOrActivityName)
		tr.SubjectObjectOrActivitDescription = util.XssEscape(tr.SubjectObjectOrActivitDescription)

		// 开始解析数据
		now := time.Now()
		userInfo := ctx.Value(interception.InfoName).(*middleware.User)

		// 解析业务对象分组
		businessDomainId := uuid.NewString()
		_, ok := subjectDomainExistMap[tr.BusinessDomainName]
		if tr.BusinessDomainName != "" && !ok {
			subjectDomainExistMap[tr.BusinessDomainName] = struct{}{}
			subjectDomain := &model.SubjectDomain{
				ID:           businessDomainId,
				Name:         tr.BusinessDomainName,
				Description:  tr.BusinessDomainDescription,
				Type:         constant.SubjectDomainGroup,
				PathID:       businessDomainId,
				Path:         tr.BusinessDomainName,
				CreatedAt:    now,
				CreatedByUID: userInfo.ID,
				UpdatedAt:    now,
				UpdatedByUID: userInfo.ID,
			}
			subjectDomainGroupLists = append(subjectDomainGroupLists, subjectDomain)
		}

		// 解析业务对象
		subjectDomainId := uuid.NewString()
		_, ok = subjectDomainExistMap[tr.BusinessDomainName+"/"+tr.SubjectDomainName]
		if tr.SubjectDomainName != "" && !ok {
			subjectDomainExistMap[tr.BusinessDomainName+"/"+tr.SubjectDomainName] = struct{}{}
			Owners := c.checkOwner(ctx, tr.SubjectDomainOwner, sheet, "业务对象Owner", i)
			subjectDomain := &model.SubjectDomain{
				ID:           subjectDomainId,
				Name:         tr.SubjectDomainName,
				PathID:       businessDomainId + "/" + subjectDomainId,
				Path:         tr.BusinessDomainName + "/" + tr.SubjectDomainName,
				Description:  tr.SubjectDomainDescription,
				Type:         constant.SubjectDomain,
				Owners:       Owners,
				CreatedAt:    now,
				CreatedByUID: userInfo.ID,
				UpdatedAt:    now,
				UpdatedByUID: userInfo.ID,
			}
			subjectDomainLists = append(subjectDomainLists, subjectDomain)
		}

		// 解析业务对象业务活动
		businessObjectOrActivityId := uuid.NewString()
		businessObjectOrActivitypathId := businessDomainId + "/" + subjectDomainId + "/" + businessObjectOrActivityId
		businessObjectOrActivitypath := tr.BusinessDomainName + "/" + tr.SubjectDomainName + "/" + tr.BusinessObjectOrActivityName
		_, ok = subjectDomainExistMap[businessObjectOrActivitypath]
		if tr.BusinessObjectOrActivityName != "" && !ok {
			subjectDomainExistMap[businessObjectOrActivitypath] = struct{}{}
			Owners := c.checkOwner(ctx, tr.BusinessObjectOrActivitOwner, sheet, "业务对象/活动Owner", i)
			var subjectDomainType int8
			if tr.Type == "业务对象" {
				subjectDomainType = constant.BusinessObject
			} else {
				subjectDomainType = constant.BusinessActivity
			}
			subjectDomain := &model.SubjectDomain{
				ID:           businessObjectOrActivityId,
				Name:         tr.BusinessObjectOrActivityName,
				PathID:       businessObjectOrActivitypathId,
				Path:         businessObjectOrActivitypath,
				Description:  tr.SubjectObjectOrActivitDescription,
				Type:         subjectDomainType,
				Owners:       Owners,
				CreatedAt:    now,
				CreatedByUID: userInfo.ID,
				UpdatedAt:    now,
				UpdatedByUID: userInfo.ID,
			}
			businessObjectOrActivityLists = append(businessObjectOrActivityLists, subjectDomain)
		}

		// 逻辑实体解析
		logicEntityId := uuid.NewString()
		_, ok = subjectDomainExistMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName]
		if tr.LogicEntitieName != "" && !ok {
			subjectDomainExistMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName] = struct{}{}
			subjectDomain := &model.SubjectDomain{
				ID:           logicEntityId,
				Name:         tr.LogicEntitieName,
				PathID:       businessObjectOrActivitypathId + "/" + logicEntityId,
				Path:         businessObjectOrActivitypath + "/" + tr.LogicEntitieName,
				Type:         constant.LogicEntity,
				Owners:       nil,
				CreatedAt:    now,
				CreatedByUID: userInfo.ID,
				UpdatedAt:    now,
				UpdatedByUID: userInfo.ID,
			}
			logicEntityLists = append(logicEntityLists, subjectDomain)
		}

		// 解析属性
		if tr.LogicEntitieName != "" {
			attributeId := uuid.NewString()
			if len(attributeMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName+"/"+tr.AttributeName]) == 0 {
				attributeMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName+"/"+tr.AttributeName] = []string{strconv.Itoa(i + 4)}
				labelID := c.getLabelByName(ctx, tr.LabelName, sheet, i)
				subjectDomain := &model.SubjectDomain{
					ID:           attributeId,
					Name:         tr.AttributeName,
					Unique:       tr.Unique,
					PathID:       businessObjectOrActivitypathId + "/" + logicEntityId + "/" + attributeId,
					Path:         businessObjectOrActivitypath + "/" + tr.LogicEntitieName + "/" + tr.AttributeName,
					Type:         constant.Attribute,
					Owners:       nil,
					LabelID:      labelID,
					CreatedAt:    now,
					CreatedByUID: userInfo.ID,
					UpdatedAt:    now,
					UpdatedByUID: userInfo.ID,
				}
				attributeLists = append(attributeLists, subjectDomain)
				if tr.Unique == 1 {
					err := c.checkUnique(ctx, tr, attributeUniqueMap, sheet, i)
					if err != nil {
						return nil, err
					}
				}
			} else {
				attributeMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName+"/"+tr.AttributeName] = append(
					attributeMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName+"/"+tr.AttributeName], strconv.Itoa(i+4))
				str := strings.Join(attributeMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName+"/"+tr.AttributeName][:len(attributeMap[businessObjectOrActivitypath+"/"+tr.LogicEntitieName+"/"+tr.AttributeName])-1], ",")
				addResutlDetail(sheet, i, "属性名称", "与"+str+"行的属性名称名称重名")
				// if tr.Unique == 1 {
				// 	err := c.checkUnique(ctx, tr, attributeUniqueMap, sheet, i)
				// 	if err != nil {
				// 		return nil, err
				// 	}
				// }
			}
		}
	}

	subjectDomainList = append(subjectDomainList, subjectDomainGroupLists...)
	subjectDomainList = append(subjectDomainList, subjectDomainLists...)
	subjectDomainList = append(subjectDomainList, businessObjectOrActivityLists...)
	subjectDomainList = append(subjectDomainList, logicEntityLists...)
	subjectDomainList = append(subjectDomainList, attributeLists...)

	return subjectDomainList, nil
}

func (c *SubjectDomainUsecase) checkOwner(ctx context.Context, owner, sheet, field string, i int) []string {
	// Owner的处理
	Owners := make([]string, 1)
	if owner != "" {
		Owners[0] = owner
		user, err := c.userRepo.GetByUserName(ctx, Owners[0])
		if err != nil {
			addResutlDetail(sheet, i, field, err.Error())
		} else {
			Owners[0] = user.ID
			_, err := c.userRepo.GetByUserName(ctx, Owners[0])
			if err != nil {
				addResutlDetail(sheet, i, field, err.Error())
			}
			//exist, err := c.ccDriven.GetRolesInfo(ctx, access_control.ManagerDataFLFJPermission, Owners[0])
			//if err != nil {
			//	addResutlDetail(sheet, i, field, err.Error())
			//} else {
			//	if !exist {
			//		addResutlDetail(sheet, i, field, errorcode.Desc(my_errorcode.OwnersIncorrect).Error())
			//	}
			//}
		}
	}
	return Owners
}

func (c *SubjectDomainUsecase) getLabelByName(ctx context.Context, labelName, sheet string, i int) uint64 {
	var labelID uint64
	if labelName != "" {
		labelInfo, err := c.ccDriven.GetLabelByName(ctx, labelName)
		if err != nil {
			addResutlDetail(sheet, i, "获取标签信息失败", err.Error())
		} else {
			if labelInfo == nil {
				addResutlDetail(sheet, i, "获取标签信息失败", "请检查标签名称是否存在")
			} else {
				tempLabelID, _ := (strconv.Atoi(labelInfo.ID))
				labelID = uint64(tempLabelID)
			}
		}
	}
	return labelID
}

func (c *SubjectDomainUsecase) checkUnique(ctx context.Context, tr *SubjectDomainImportTransfer, attributeUniqueMap map[string][]string, sheet string, i int) error {
	path := tr.BusinessDomainName + "/" + tr.SubjectDomainName + "/" + tr.BusinessObjectOrActivityName + "/" + tr.LogicEntitieName
	if len(attributeUniqueMap[path]) == 0 {
		attributeUniqueMap[path] = []string{strconv.Itoa(i + 4)}

		// path := tr.BusinessDomainName + "/" + tr.SubjectDomainName + "/" + tr.BusinessObjectOrActivityName + "/" + tr.LogicEntitieName + "/" + tr.AttributeName
		f, err := c.repo.GetAttribuitByPath(ctx, path+"/"+tr.AttributeName)
		if err != nil {
			return err
			// addResutlDetail(sheet, i, "唯一标识", "获取属性信息失败"+err.Error())
		}
		if f != nil {
			if f.StandardID > 0 {
				standardInfo, err := c.standard.GetStandardById(ctx, f.StandardID)
				if err != nil {
					return err
				}
				if standardInfo.DataType != "number" && standardInfo.DataType != "char" {
					addResutlDetail(sheet, i, "唯一标识", "只支持设置字符型或者数字型为唯一标识")
				}
			}
		}

	} else {
		attributeUniqueMap[path] =
			append(attributeUniqueMap[path], strconv.Itoa(i+4))
		str := strings.Join(attributeUniqueMap[path][:len(attributeUniqueMap[path])-1], ",")
		addResutlDetail(sheet, i, "唯一标识", "业务对象/业务活动最多只能有一个唯一标识, 与"+str+"行唯一标识冲突")
	}
	return nil
}

// ReplaceEnumValue 根据配置文件将excel中的中文转换为配置文件中的name字段 ，多行拆成一行  *****加替换枚举值,仅限表单可用****** same to Transform
func ReplaceEnumValue(ctx context.Context, tablePattern []interface{}, t *template.Template) ([]map[string]interface{}, error) {
	res := make([]map[string]interface{}, len(tablePattern))
	tableComponentCnt := 0
	for _ = range t.Components {
		tableComponentCnt++
	}
	//遍历每一行
	for i := 0; i < len(tablePattern); i++ {
		m := tablePattern[i].(map[string]string)
		if len(m) != 0 && len(m) != tableComponentCnt {
			log.WithContext(ctx).Error("Inconsistent with template filed count", zap.Int("field ", len(m)), zap.Int("field ", len(tablePattern)))
			return nil, errorcode.Desc(my_errorcode.FormContentError)
		}
		tmpMap := make(map[string]interface{})
		for key, value := range m {
			for _, component := range t.Components {
				if key == component.Label || key == "*"+component.Label {
					if key == "唯一标识" {
						if m[key] == "" || m[key] == "否" {
							tmpMap[component.Name] = 0
						} else {
							tmpMap[component.Name] = 1
						}
						break
					}
					tmpMap[component.Name] = value
					break
				}

			}
		}
		res[i] = tmpMap
	}
	return res, nil
}

func VerifySubDomainStandard(ctx context.Context, transforms []map[string]interface{}, sheet string) error {
	for i, v := range transforms {
		if v["subject_domain_group"] != nil && len([]rune(v["subject_domain_group"].(string))) != 0 {
			// if !regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]{1,128}$").MatchString(v["subject_domain_group"].(string)) {
			// log.WithContext(ctx).Error("Business Table Name Error ", zap.Int("lines", i), zap.String("error value", v["logic_entity"].(string)))
			if len([]rune(v["subject_domain_group"].(string))) > 128 {
				addResutlDetail(sheet, i, "业务对象分组名称", "最多可输入128字符")
			}
		}
		if v["subject_domain"] != nil && len([]rune(v["subject_domain"].(string))) != 0 {
			// if !regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]{1,128}$").MatchString(v["subject_domain"].(string)) {
			// log.WithContext(ctx).Error("Business Table Name Error ", zap.Int("lines", i), zap.String("error value", v["logic_entity"].(string)))
			if len([]rune(v["subject_domain"].(string))) > 128 {
				addResutlDetail(sheet, i, "业务对象名称", "最多可输入128字符")
			}
			// }
		}

		if v["business_object_or_activity"] != nil && len([]rune(v["business_object_or_activity"].(string))) != 0 {
			// if !regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]{1,128}$").MatchString(v["business_object_or_activity"].(string)) {
			// log.WithContext(ctx).Error("Business Table Name Error ", zap.Int("lines", i), zap.String("error value", v["business_object_or_activity"].(string)))
			if len([]rune(v["business_object_or_activity"].(string))) > 128 {
				addResutlDetail(sheet, i, "业务对象/活动名称", "必填，最多可输入128字符")
			}
			// }
		}

		if v["subject_domain_group_description"] != nil && len([]rune(v["subject_domain_group_description"].(string))) > 255 {
			// log.WithContext(ctx).Error("Business Table Field Name Error ", zap.Int("lines", i), zap.String("error value", v["attribute"].(string)))
			addResutlDetail(sheet, i, "业务对象分组描述", "最多可输入255字符")
		}
		if v["subject_domain_description"] != nil && len([]rune(v["subject_domain_description"].(string))) > 255 {
			// log.WithContext(ctx).Error("Business Table Field Name Error ", zap.Int("lines", i), zap.String("error value", v["attribute"].(string)))
			addResutlDetail(sheet, i, "业务对象描述", "最多可输入255字符")
		}
		if v["business_object_or_activity_description"] != nil && len([]rune(v["business_object_or_activity_description"].(string))) > 255 {
			// log.WithContext(ctx).Error("Business Table Field Name Error ", zap.Int("lines", i), zap.String("error value", v["attribute"].(string)))
			addResutlDetail(sheet, i, "业务对象/活动描述", "最多可输入255字符")
		}

		if v["logic_entity"] != nil && v["logic_entity"].(string) != "" {
			// if !regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]{1,128}$").MatchString(v["logic_entity"].(string)) {
			// log.WithContext(ctx).Error("Business Table Name Error ", zap.Int("lines", i), zap.String("error value", v["logic_entity"].(string)))
			if len([]rune(v["logic_entity"].(string))) > 128 {
				addResutlDetail(sheet, i, "逻辑实体名称", "最多可输入128字符")
			}
			// }
			if len([]rune(v["attribute"].(string))) == 0 || len([]rune(v["attribute"].(string))) > 255 {
				// log.WithContext(ctx).Error("Business Table Field Name Error ", zap.Int("lines", i), zap.String("error value", v["attribute"].(string)))
				addResutlDetail(sheet, i, "属性名称", "逻辑实体存在，需要填写，最多可输入255字符")
			}
		}

		if v["attribute"] != nil && v["attribute"].(string) != "" {
			if !regexp.MustCompile("^[a-zA-Z0-9\u4e00-\u9fa5-_]{1,128}$").MatchString(v["logic_entity"].(string)) {
				// log.WithContext(ctx).Error("Business Table Name Error ", zap.Int("lines", i), zap.String("error value", v["logic_entity"].(string)))
				if len([]rune(v["logic_entity"].(string))) > 128 {
					addResutlDetail(sheet, i, "逻辑实体名称", "属性存在，需要填写，最多可输入128字符")
				}
			}
			if len([]rune(v["attribute"].(string))) == 0 || len([]rune(v["attribute"].(string))) > 255 {
				// log.WithContext(ctx).Error("Business Table Field Name Error ", zap.Int("lines", i), zap.String("error value", v["attribute"].(string)))
				addResutlDetail(sheet, i, "属性名称", "最多可输入255字符")
			}
		}
	}
	return nil
}

func addResutlDetail(sheetName string, serialNumber int, content, reason string) {
	resutlDetail := ResutlDetail{
		SheetName:    sheetName,
		SerialNumber: serialNumber + 4,
		Content:      content,
		Reason:       reason,
	}
	resutlDetails = append(resutlDetails, resutlDetail)
}

func (c *SubjectDomainUsecase) ExportSubjectDomains(ctx context.Context, ids []string) (*excelize.File, string, error) {
	if len(ids) > 50 {
		return nil, "", errorcode.Desc(my_errorcode.ExportMaxLimitError, 50)

	}
	file, err := excelize.OpenFile(path.Join("cmd/server/template_file", "standard_template.xlsx"))
	if err != nil {
		log.WithContext(ctx).Error("excelize OpenFile ", zap.Error(err))
		return nil, "", errorcode.Desc(my_errorcode.FormOpenTemplateFileError)
	}
	defer func(file *excelize.File) {
		_ = file.Close()
	}(file)

	var listTemplate *template.Template
	for _, t := range template.TemplateStruct.Templates {
		if t.Name == "subject_domain_list" || t.SheetName == "业务对象或活动清单" {
			listTemplate = t
		}
		// else if t.Name == "subject_domain_field" || t.SheetName == "业务对象或活动字段" {
		// 	fieldTemplate = t
		// }
	}
	if listTemplate == nil {
		return nil, "", errorcode.Desc(my_errorcode.FormGetTemplateError)
	}

	var listRule *rule.CutRuleByLine
	for _, r := range rule.LineRulesStruct.LineRules {
		if r.Name == "业务对象或活动清单" {
			listRule = r
		}
		// else if r.Name == "业务对象或活动字段" {
		// 	fieldRule = r
		// }
	}

	if listRule == nil {
		return nil, "", errorcode.Desc(my_errorcode.FormGetTemplateError)
	}
	name, err := c.exportSubjectDomainsList(ctx, file, listRule, listTemplate, ids)
	if err != nil {
		return nil, "", err
	}
	return file, name, nil
}

func (c *SubjectDomainUsecase) exportSubjectDomainsList(ctx context.Context, file *excelize.File, listRule *rule.CutRuleByLine, listTemplate *template.Template, ids []string) (string, error) {
	var name string
	var resAll [][]string
	sheetName := file.GetSheetList()[0]
	for _, id := range ids {

		subjectDomainsLists, err := c.repo.GetObjectsByLogicEntityID(ctx, id)

		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				return "", errorcode.Desc(my_errorcode.ObjectNotExist)
			}
			return "", errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}

		exportTrans, err := c.TransSubjectDomains(ctx, subjectDomainsLists)
		if err != nil {
			return "", err
		}

		for _, exportTran := range exportTrans {
			marshal, err := json.Marshal(exportTran)
			if err != nil {
				log.WithContext(ctx).Error("json.Marshal" + err.Error())
				return "", errorcode.Desc(my_errorcode.FormJsonUnMarshalError)
			}
			formMap := make(map[string]string)
			err = json.Unmarshal(marshal, &formMap)
			if err != nil {
				log.WithContext(ctx).Error("json.Unmarshal" + err.Error())
				return "", errorcode.Desc(my_errorcode.FormJsonUnMarshalError)
			}

			rows, err := file.GetRows(sheetName)

			if err != nil {
				// log.WithContext(ctx).Error("json.Unmarshal" + err.Error())
				return "", errorcode.Desc(my_errorcode.FormOpenExcelFileError)
			}
			titles := rows[listRule.TableContent.TitleNum-1]
			res := make([]string, len(titles))
			for i, title := range titles {
				for _, component := range listTemplate.Components {
					if component.Label == title || "*"+component.Label == title {
						res[i] = formMap[component.Name]
					}
				}
			}
			resAll = append(resAll, res)

		}
	}

	for i, res := range resAll {
		if err := file.SetSheetRow(sheetName, fmt.Sprintf("A%d", listRule.TableContent.TitleNum+1+i), &res); err != nil {
			return "", errorcode.Desc(my_errorcode.IndicatorExcelFileWriteError)
		}
	}
	return name, nil
}

func (c *SubjectDomainUsecase) TransSubjectDomains(ctx context.Context, mm []*model.SubjectDomain) ([]*SubjectDomainExportTransfer, error) {
	var businessDomainName,
		businessDomainDescription,
		subjectDomainName,
		subjectDomainDescription,
		subjectDomainOwner,
		businessObjectOrActivityName,
		businessObjectOrActivityOwner,
		SubjectObjectOrActivitDescription,
		objectType,
		logicEntitieName,
		attributeName,
		unique,
		labelName string

	var subdomain *SubjectDomainExportTransfer
	SubjectDomainForModelExportTransfers := make([]*SubjectDomainExportTransfer, 0)
	logicEntitiesMap := make(map[string]string)

	for _, m := range mm {
		if m.Type == constant.LogicEntity {
			_, ok := logicEntitiesMap[m.Name]
			if !ok {
				logicEntitiesMap[m.Name] = m.PathID
			}
		}
	}

	for _, m := range mm {
		switch m.Type {
		case constant.SubjectDomainGroup:
			businessDomainName = m.Name
			businessDomainDescription = m.Description
		case constant.SubjectDomain:
			subjectDomainName = m.Name
			subjectDomainDescription = m.Description
			user, err := c.userRepo.GetByUserId(ctx, m.Owners[0])
			if err != nil {
				return nil, err
			}
			subjectDomainOwner = user.Name
		case constant.BusinessObject, constant.BusinessActivity:
			businessObjectOrActivityName = m.Name
			SubjectObjectOrActivitDescription = m.Description
			user, err := c.userRepo.GetByUserId(ctx, m.Owners[0])
			if err != nil {
				return nil, err
			}
			businessObjectOrActivityOwner = user.Name
			if m.Type == constant.BusinessObject {
				objectType = "业务对象"
			}
			if m.Type == constant.BusinessActivity {
				objectType = "业务活动"
			}
		case constant.Attribute:
			for k, v := range logicEntitiesMap {
				if strings.HasPrefix(m.PathID, v) {
					logicEntitieName = k
				}
			}
			attributeName = m.Name
			if m.Unique == 1 {
				unique = "是"
			} else {
				unique = "否"
			}
			if m.LabelID != 0 {
				labelInfo, err := c.ccDriven.GetLabelById(ctx, strconv.Itoa(int(m.LabelID)))
				if err != nil {
					return nil, err
				}

				if labelInfo == nil {
					labelName = ""
				} else {
					labelName = labelInfo.Name
				}
			}
			subdomain = &SubjectDomainExportTransfer{
				BusinessDomainName:                businessDomainName,
				BusinessDomainDescription:         businessDomainDescription,
				SubjectDomainName:                 subjectDomainName,
				SubjectDomainOwner:                subjectDomainOwner,
				SubjectDomainDescription:          subjectDomainDescription,
				BusinessObjectOrActivityName:      businessObjectOrActivityName,
				BusinessObjectOrActivitOwner:      businessObjectOrActivityOwner,
				SubjectObjectOrActivitDescription: SubjectObjectOrActivitDescription,
				Type:                              objectType,
				LogicEntitieName:                  logicEntitieName,
				AttributeName:                     attributeName,
				Unique:                            unique,
				LabelName:                         labelName,
			}
			SubjectDomainForModelExportTransfers = append(SubjectDomainForModelExportTransfers, subdomain)
		}
	}
	// 若没有L5，则导出L1，L2和L3
	if len(SubjectDomainForModelExportTransfers) == 0 {
		subdomain = &SubjectDomainExportTransfer{
			BusinessDomainName:                businessDomainName,
			BusinessDomainDescription:         businessDomainDescription,
			SubjectDomainName:                 subjectDomainName,
			SubjectDomainOwner:                subjectDomainOwner,
			SubjectDomainDescription:          subjectDomainDescription,
			BusinessObjectOrActivityName:      businessObjectOrActivityName,
			BusinessObjectOrActivitOwner:      businessObjectOrActivityOwner,
			SubjectObjectOrActivitDescription: SubjectObjectOrActivitDescription,
			Type:                              objectType,
			LogicEntitieName:                  logicEntitieName,
			AttributeName:                     attributeName,
			Unique:                            unique,
			LabelName:                         labelName,
		}
		SubjectDomainForModelExportTransfers = append(SubjectDomainForModelExportTransfers, subdomain)
	}

	return SubjectDomainForModelExportTransfers, nil
}

func (c *SubjectDomainUsecase) ExportSubjectDomainTemplate(ctx context.Context) (*excelize.File, error) {

	file, err := excelize.OpenFile(path.Join("cmd/server/template_file", "standard_template.xlsx"))
	if err != nil {
		log.WithContext(ctx).Error("excelize OpenFile ", zap.Error(err))
		return nil, errorcode.Desc(my_errorcode.FormOpenTemplateFileError)
	}
	defer func(file *excelize.File) {
		_ = file.Close()
	}(file)
	return file, nil
}
