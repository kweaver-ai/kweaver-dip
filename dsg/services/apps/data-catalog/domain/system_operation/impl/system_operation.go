package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"math"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_exploration"
	dvRepo "github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driven/data_view"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/models/request"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/system_operation"
	catalog "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog"
	repo "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/form_data_count"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/rule_config"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/system_operation_detail"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/task_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"github.com/xuri/excelize/v2"
)

type systemOperationDomain struct {
	catalogRepo               catalog.RepoOp
	dataResourceRepo          repo.DataResourceRepo
	systemOperationDetailRepo system_operation_detail.SystemOperationDetailRepo
	formDataCountRepo         form_data_count.FormDataCountRepo
	ruleConfigRepo            rule_config.RuleConfigRepo
	ccDriven                  configuration_center.Driven
	dvDrivenRepo              dvRepo.Repo
	dvDriven                  data_view.Driven
	categoryRepo              data_resource_catalog.DataResourceCatalogRepo
	tcDriven                  task_center.Driven
	deDriven                  data_exploration.DrivenDataExploration
}

func NewSystemOperationDomain(
	catalogRepo catalog.RepoOp,
	dataResourceRepo repo.DataResourceRepo,
	systemOperationDetailRepo system_operation_detail.SystemOperationDetailRepo,
	formDataCountRepo form_data_count.FormDataCountRepo,
	ruleConfigRepo rule_config.RuleConfigRepo,
	ccDriven configuration_center.Driven,
	dvDrivenRepo dvRepo.Repo,
	dvDriven data_view.Driven,
	categoryRepo data_resource_catalog.DataResourceCatalogRepo,
	tcDriven task_center.Driven,
	deDriven data_exploration.DrivenDataExploration,
) system_operation.SystemOperationDomain {
	return &systemOperationDomain{
		catalogRepo:               catalogRepo,
		dataResourceRepo:          dataResourceRepo,
		systemOperationDetailRepo: systemOperationDetailRepo,
		formDataCountRepo:         formDataCountRepo,
		ruleConfigRepo:            ruleConfigRepo,
		ccDriven:                  ccDriven,
		dvDrivenRepo:              dvDrivenRepo,
		dvDriven:                  dvDriven,
		categoryRepo:              categoryRepo,
		tcDriven:                  tcDriven,
		deDriven:                  deDriven,
	}
}

func (s *systemOperationDomain) GetDetails(ctx context.Context, req *system_operation.GetDetailsReq) (*system_operation.GetDetailsResp, error) {
	// 获取单位名称、系统名称、表名称、表中文注释
	departmentIds := make([]string, 0)
	infoSystemIds := make([]string, 0)
	var acceptanceStart, acceptanceEnd *time.Time
	var err error
	if len(req.DepartmentID) > 0 {
		departmentIds, err = s.getDepartments(ctx, req.DepartmentID)
		if err != nil {
			return nil, err
		}
	}
	if len(req.InfoSystemID) > 0 {
		infoSystemIds = strings.Split(req.InfoSystemID, ",")
	}
	if req.AcceptanceStart != nil && req.AcceptanceEnd != nil {
		acceptanceStart = lo.ToPtr(time.UnixMilli(*req.AcceptanceStart))
		acceptanceEnd = lo.ToPtr(time.UnixMilli(*req.AcceptanceEnd))
	}
	details, totalCount, err := s.systemOperationDetailRepo.QueryList(ctx, &req.BOPageInfo, req.Keyword, departmentIds, infoSystemIds, acceptanceStart, acceptanceEnd, req.IsWhitelisted)
	if err != nil {
		return nil, err
	}
	departIds := make([]string, 0)
	infoSysIds := make([]string, 0)
	formViewIds := make([]string, 0)
	for _, detail := range details {
		if detail.DepartmentID != "" {
			departIds = append(departIds, detail.DepartmentID)
		}
		if detail.InfoSystemID != "" {
			infoSysIds = append(infoSysIds, detail.InfoSystemID)
		}
		formViewIds = append(formViewIds, detail.FormViewID)
	}
	departmentNameMap, err := s.getDepartmentNameMap(ctx, util.DuplicateStringRemoval(departIds))
	if err != nil {
		return nil, err
	}
	infoSystemNameMap, err := s.getInfoSystemNameMap(ctx, util.DuplicateStringRemoval(infoSysIds))
	if err != nil {
		return nil, err
	}
	startDate := time.UnixMilli(req.StartDate)
	endDate := time.UnixMilli(req.EndDate)
	formUpdateCountMap, err := s.getFormUpdateCountMap(ctx, formViewIds, startDate, endDate)
	if err != nil {
		return nil, err
	}
	expectedUpdateCount := s.getExpectedUpdateCountMap(startDate, endDate)
	normalUpdateRule, err := s.ruleConfigRepo.GetNormalUpdateRule(ctx)
	if err != nil {
		return nil, err
	}
	updateTimeliness := normalUpdateRule.UpdateTimelinessValue

	return &system_operation.GetDetailsResp{
		Entries:    convertSystemOperationDetail(details, departmentNameMap, infoSystemNameMap, formUpdateCountMap, expectedUpdateCount, updateTimeliness),
		TotalCount: totalCount,
	}, nil
}

func (s *systemOperationDomain) getDepartments(ctx context.Context, departmentId string) ([]string, error) {
	departmentIds := make([]string, 0)
	ids := make([]string, 0)
	ids = strings.Split(departmentId, ",")
	for _, id := range ids {
		departmentList, err := s.ccDriven.GetDepartmentList(ctx,
			configuration_center.QueryPageReqParam{Offset: 1, Limit: 0, ID: id}) //limit 0 Offset 1 not available
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			util.SliceAdd(&departmentIds, entry.ID)
		}
		departmentIds = append(departmentIds, id)
	}

	return departmentIds, nil
}

func (s *systemOperationDomain) getDepartmentNameMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, err error) {
	nameMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, nil
	}
	departmentInfos, err := s.ccDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		log.WithContext(ctx).Warnf("get department %v failed, err: %v", strings.Join(departmentIds, ","), err)
		return nameMap, err
	}

	for _, departmentInfo := range departmentInfos.Departments {
		nameMap[departmentInfo.ID] = ""
		if departmentInfo.DeletedAt == 0 {
			nameMap[departmentInfo.ID] = departmentInfo.Name
		}
	}
	return nameMap, nil
}

func (s *systemOperationDomain) getInfoSystemNameMap(ctx context.Context, infoSystemIds []string) (nameMap map[string]string, err error) {
	nameMap = make(map[string]string)
	if len(infoSystemIds) == 0 {
		return nameMap, nil
	}
	infos, err := common.GetInfoSystemsPrecision(ctx, infoSystemIds...)
	if err != nil {
		log.WithContext(ctx).Warnf("get info system %v failed, err: %v", strings.Join(infoSystemIds, ","), err)
		return
	}
	for _, info := range infos {
		nameMap[info.ID] = info.Name
	}
	return nameMap, nil
}

func (s *systemOperationDomain) getFormUpdateCountMap(ctx context.Context, formViewIds []string, startDate, endDate time.Time) (updateCountMap map[string]int, err error) {
	updateCountMap = make(map[string]int)
	if len(formViewIds) == 0 {
		return updateCountMap, nil
	}
	for _, formViewId := range formViewIds {
		infos, err := s.formDataCountRepo.QueryList(ctx, formViewId, startDate, endDate)
		if err != nil {
			return updateCountMap, err
		}
		updateCount := 0
		if len(infos) > 0 {
			dataCount := infos[0].DataCount
			for _, info := range infos {
				if info.DataCount != dataCount {
					updateCount++
				}
			}
		}
		updateCountMap[formViewId] = updateCount
	}
	return updateCountMap, nil
}

func (s *systemOperationDomain) getExpectedUpdateCountMap(startDate, endDate time.Time) map[int32]int {
	expectedUpdateCount := make(map[int32]int)
	// 计算总天数和工作日数
	totalDays := int(endDate.Sub(startDate).Hours()/24) + 1
	workdays := calculateWorkdays(startDate, endDate)

	// 计算总月份数
	months := (endDate.Year()-startDate.Year())*12 + int(endDate.Month()) - int(startDate.Month())
	if endDate.Day() < startDate.Day() {
		months-- // 如果结束日期的日小于开始日期的日，不足一个月
	}
	if months < 0 {
		months = 0
	} else {
		months++ // 包括开始月份
	}
	// 1实时 2每日 3每周 4每月 5每季度 6每半年 7每年 8其他
	expectedUpdateCount[1] = workdays / 2
	expectedUpdateCount[2] = workdays / 2
	expectedUpdateCount[3] = totalDays / 7
	expectedUpdateCount[4] = months
	expectedUpdateCount[5] = months / 3
	expectedUpdateCount[6] = months / 6
	expectedUpdateCount[7] = months / 12
	expectedUpdateCount[8] = 0
	return expectedUpdateCount
}

func calculateWorkdays(startDate, endDate time.Time) int {
	workdays := 0
	for current := startDate; !current.After(endDate); current = current.AddDate(0, 0, 1) {
		if current.Weekday() != time.Saturday && current.Weekday() != time.Sunday {
			workdays++
		}
	}
	return workdays
}

func calculateTimeliness(updateCount, exceptedUpdateCount int) float64 {
	if exceptedUpdateCount == 0 {
		return 100.00 // 应更新次数为0，默认100.00%
	}

	if updateCount >= exceptedUpdateCount {
		return 100.00 // 实际更新次数≥应更新次数，100.00%
	}

	// 实际更新次数<应更新次数，计算比例并保留两位小数
	timeliness := (float64(updateCount) / float64(exceptedUpdateCount)) * 100
	return math.Round(timeliness*100) / 100 // 四舍五入保留两位小数
}

func convertSystemOperationDetail(details []*model.TSystemOperationDetail, departmentNameMap, infoSystemNameMap map[string]string, formUpdateCountMap map[string]int, expectedUpdateCount map[int32]int, updateTimeliness float64) []*system_operation.SystemOperationDetail {
	systemOperationDetails := make([]*system_operation.SystemOperationDetail, 0)
	for _, detail := range details {
		systemOperationDetail := &system_operation.SystemOperationDetail{
			OrganizationName:    departmentNameMap[detail.DepartmentID],
			SystemName:          infoSystemNameMap[detail.InfoSystemID],
			FormViewId:          detail.FormViewID,
			TableName:           detail.TechnicalName,
			TableComment:        detail.BusinessName,
			UpdateCycle:         detail.UpdateCycle,
			FieldCount:          detail.FieldCount,
			LatestDataCount:     detail.LatestDataCount,
			UpdateCount:         formUpdateCountMap[detail.FormViewID],
			ExpectedUpdateCount: expectedUpdateCount[detail.UpdateCycle],
			IssueRemark:         detail.IssueRemark,
		}
		if detail.AcceptanceTime != nil {
			systemOperationDetail.AcceptanceTime = detail.AcceptanceTime.UnixMilli()
		}
		if detail.FirstAggregationTime != nil {
			systemOperationDetail.FirstAggregationTime = detail.FirstAggregationTime.UnixMilli()
		}
		systemOperationDetail.UpdateTimeliness = calculateTimeliness(systemOperationDetail.UpdateCount, systemOperationDetail.ExpectedUpdateCount)
		if systemOperationDetail.UpdateTimeliness >= updateTimeliness {
			systemOperationDetail.IsUpdatedNormally = true
		}
		if detail.HasQualityIssue > 0 {
			systemOperationDetail.HasQualityIssue = true
		}
		if detail.QualityCheck > 0 {
			systemOperationDetail.QualityCheck = true
		}
		if detail.DataUpdate > 0 {
			systemOperationDetail.DataUpdate = true
		}
		if detail.QualityCheck > 0 || detail.DataUpdate > 0 {
			systemOperationDetail.IsWhitelisted = true
		}
		systemOperationDetails = append(systemOperationDetails, systemOperationDetail)
	}
	return systemOperationDetails
}

func (s *systemOperationDomain) UpdateWhiteList(ctx context.Context, id string, req *system_operation.UpdateWhiteListReq) (*system_operation.UpdateWhiteListResp, error) {
	detail, err := s.systemOperationDetailRepo.GetByFormViewID(ctx, id)
	if err != nil {
		return nil, err
	}
	detail.QualityCheck = int32(util.BoolToInt(req.QualityCheck))
	detail.DataUpdate = int32(util.BoolToInt(req.DataUpdate))
	err = s.systemOperationDetailRepo.UpdateWhiteList(ctx, detail)
	if err != nil {
		return nil, err
	}
	return &system_operation.UpdateWhiteListResp{
		FormViewID: id,
	}, nil
}

func (s *systemOperationDomain) GetRule(ctx context.Context) (*system_operation.GetRuleResp, error) {
	resp := &system_operation.GetRuleResp{}
	ruleConfigs, err := s.ruleConfigRepo.Get(ctx)
	if err != nil {
		return nil, err
	}
	for _, rule := range ruleConfigs {
		switch rule.RuleName {
		case "normal_update":
			resp.NormalUpdate = getConfig(rule)
		case "green_card":
			resp.GreenCard = getConfig(rule)
		case "yellow_card":
			resp.YellowCard = getConfig(rule)
		case "red_card":
			resp.RedCard = getConfig(rule)
		}
	}
	return resp, nil
}

func getConfig(rule *model.TRuleConfig) system_operation.Config {
	return system_operation.Config{
		UpdateTimelinessValue: rule.UpdateTimelinessValue,
		QualityPassValue:      rule.QualityPassValue,
		LogicalOperator:       rule.LogicalOperator,
	}
}

func (s *systemOperationDomain) UpdateRule(ctx context.Context, req *system_operation.UpdateRuleReq) error {
	ruleConfigs, err := s.ruleConfigRepo.Get(ctx)
	if err != nil {
		return err
	}
	for _, rule := range ruleConfigs {
		switch rule.RuleName {
		case "normal_update":
			rule.UpdateTimelinessValue = req.NormalUpdate.UpdateTimelinessValue
		case "green_card":
			rule.UpdateTimelinessValue = req.GreenCard.UpdateTimelinessValue
			rule.QualityPassValue = req.GreenCard.QualityPassValue
			rule.LogicalOperator = req.GreenCard.LogicalOperator
		case "yellow_card":
			rule.UpdateTimelinessValue = req.YellowCard.UpdateTimelinessValue
			rule.QualityPassValue = req.YellowCard.QualityPassValue
			rule.LogicalOperator = req.YellowCard.LogicalOperator
		case "red_card":
			rule.UpdateTimelinessValue = req.RedCard.UpdateTimelinessValue
			rule.QualityPassValue = req.RedCard.QualityPassValue
			rule.LogicalOperator = req.RedCard.LogicalOperator
		}
	}

	return s.ruleConfigRepo.Update(ctx, ruleConfigs)
}

func (s *systemOperationDomain) ExportDetails(ctx context.Context, req *system_operation.ExportDetailsReq) (*excelize.File, error) {
	file, err := excelize.OpenFile("cmd/server/static/system_operation_detail.xlsx")
	if err != nil {
		return nil, errorcode.Detail(errorcode.SystemOperationDetailsExportFailed, err.Error())
	}
	excelize.NewFile()
	if len(req.Data) == 0 {
		// 获取全部数据
		if req.StartDate == nil || req.EndDate == nil {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "全部导出查询开始日期和结束日期不能为空")
		}
		getDetailsReq := &system_operation.GetDetailsReq{
			BOPageInfo: getDefaultPageReq(),
			StartDate:  *req.StartDate,
			EndDate:    *req.EndDate,
		}
		details, err := s.GetDetails(ctx, getDetailsReq)
		if err != nil {
			return nil, err
		}
		for i, data := range details.Entries {
			row := []interface{}{
				data.OrganizationName,
				data.SystemName,
				data.TableName,
				data.TableComment,
				timestampToDateString(data.AcceptanceTime),
				timestampToDateString(data.FirstAggregationTime),
				updateCycleToString(data.UpdateCycle),
				data.FieldCount,
				data.LatestDataCount,
				data.UpdateCount,
				data.ExpectedUpdateCount,
				fmt.Sprintf("%.2f%%", data.UpdateTimeliness),
				boolToString(data.IsUpdatedNormally),
				boolToString(data.HasQualityIssue),
				data.IssueRemark,
				boolToString(data.QualityCheck || data.DataUpdate),
				convertWhitelistType(data.QualityCheck, data.DataUpdate),
			}
			if err = file.SetSheetRow("系统运行明细表", "A"+strconv.Itoa(i+2), &row); err != nil {
				return nil, errorcode.Detail(errorcode.SystemOperationDetailsExportFailed, err.Error())
			}
		}
	} else {
		for i, data := range req.Data {
			row := []interface{}{
				data.OrganizationName,
				data.SystemName,
				data.TableName,
				data.TableComment,
				data.AcceptanceTime,
				data.FirstAggregationTime,
				data.UpdateCycle,
				data.FieldCount,
				data.LatestDataCount,
				data.UpdateCount,
				data.ExpectedUpdateCount,
				data.UpdateTimeliness,
				data.IsUpdatedNormally,
				data.HasQualityIssue,
				data.IssueRemark,
				data.IsWhitelisted,
				data.WhitelistType,
			}
			if err = file.SetSheetRow("系统运行明细表", "A"+strconv.Itoa(i+2), &row); err != nil {
				return nil, errorcode.Detail(errorcode.SystemOperationDetailsExportFailed, err.Error())
			}
		}
	}

	return file, nil
}

func (s *systemOperationDomain) OverallEvaluations(ctx context.Context, req *system_operation.OverallEvaluationsReq) (*system_operation.OverallEvaluationsResp, error) {
	overallEvaluations := make([]*system_operation.OverallEvaluation, 0)
	infoSystemIds := make([]string, 0)
	var acceptanceStart, acceptanceEnd *time.Time
	if len(req.InfoSystemID) > 0 {
		infoSystemIds = strings.Split(req.InfoSystemID, ",")
	}
	if req.AcceptanceStart != nil && req.AcceptanceEnd != nil {
		acceptanceStart = lo.ToPtr(time.UnixMilli(*req.AcceptanceStart))
		acceptanceEnd = lo.ToPtr(time.UnixMilli(*req.AcceptanceEnd))
	}
	infoSystemMap, totalCount, err := s.systemOperationDetailRepo.QueryInfoSystemList(ctx, &req.BOPageInfo, infoSystemIds, acceptanceStart, acceptanceEnd)
	if err != nil {
		return nil, err
	}
	startDate := time.UnixMilli(req.StartDate)
	endDate := time.UnixMilli(req.EndDate)
	expectedUpdateCount := s.getExpectedUpdateCountMap(startDate, endDate)
	normalUpdateRule, err := s.ruleConfigRepo.GetNormalUpdateRule(ctx)
	if err != nil {
		return nil, err
	}
	updateTimeliness := normalUpdateRule.UpdateTimelinessValue
	ruleConfigs, err := s.ruleConfigRepo.Get(ctx)
	if err != nil {
		return nil, err
	}
	infoSysIds := make([]string, 0)
	for key := range infoSystemMap {
		infoSysIds = append(infoSysIds, key)
		formViewIds := make([]string, 0)
		details, err := s.systemOperationDetailRepo.GetByInfoSystemID(ctx, key)
		if err != nil {
			return nil, err
		}
		for _, detail := range details {
			formViewIds = append(formViewIds, detail.FormViewID)
		}
		formUpdateCountMap, err := s.getFormUpdateCountMap(ctx, formViewIds, startDate, endDate)
		if err != nil {
			return nil, err
		}
		overallEvaluation, err := s.convertOverallEvaluation(ctx, details, formUpdateCountMap, expectedUpdateCount, updateTimeliness, ruleConfigs)
		if err != nil {
			return nil, err
		}
		overallEvaluations = append(overallEvaluations, overallEvaluation)
	}
	infoSystemInfoMap, err := s.getInfoSystemInfoMap(ctx, util.DuplicateStringRemoval(infoSysIds))
	if err != nil {
		return nil, err
	}
	for _, overallEvaluation := range overallEvaluations {
		overallEvaluation.ConstructionUnit = infoSystemInfoMap[overallEvaluation.InfoSystemID].DepartmentName
		overallEvaluation.SubsystemName = infoSystemInfoMap[overallEvaluation.InfoSystemID].InfoSystemName
	}
	return &system_operation.OverallEvaluationsResp{
		Entries:    overallEvaluations,
		TotalCount: totalCount,
	}, nil
}
func getDefaultPageReq() request.BOPageInfo {
	limit := 2000
	offset := 1
	sort := "updated_at"
	direction := "desc"
	return request.BOPageInfo{
		PageBaseInfo: request.PageBaseInfo{
			Offset: &offset,
			Limit:  &limit,
		},
		Direction: &direction,
		Sort:      &sort,
	}
}

func timestampToDateString(timestamp int64) string {
	if timestamp == 0 {
		return ""
	}
	// 将int64时间戳转换为time.Time
	t := time.UnixMilli(timestamp)

	// 格式化为"YYYY-MM-DD"字符串
	return t.Format("2006-01-02")
}

func boolToString(b bool) string {
	if b {
		return "是"
	}
	return "否"
}

func convertWhitelistType(qualityCheck, dataUpdate bool) string {
	switch {
	case qualityCheck && dataUpdate:
		return "质量检测、数据更新白名单"
	case qualityCheck:
		return "质量检测白名单"
	case dataUpdate:
		return "数据更新白名单"
	default:
		return "--"
	}
}

func updateCycleToString(u int32) string {
	switch u {
	case 1:
		return "实时"
	case 2:
		return "每日"
	case 3:
		return "每周"
	case 4:
		return "每月"
	case 5:
		return "每季度"
	case 6:
		return "每半年"
	case 7:
		return "每年"
	case 8:
		return "其他"
	default:
		return "其他"
	}
}

func (s *systemOperationDomain) ExportOverallEvaluations(ctx context.Context, req *system_operation.ExportOverallEvaluationsReq) (*excelize.File, error) {
	file, err := excelize.OpenFile("cmd/server/static/overall_evaluation.xlsx")
	if err != nil {
		return nil, errorcode.Detail(errorcode.OverallEvaluationsExportFailed, err.Error())
	}
	excelize.NewFile()
	if len(req.Data) == 0 {
		// 获取全部数据
		if req.StartDate == nil || req.EndDate == nil {
			return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "全部导出查询开始日期和结束日期不能为空")
		}
		getDetailsReq := &system_operation.OverallEvaluationsReq{
			BOPageInfo: getDefaultPageReq(),
			StartDate:  *req.StartDate,
			EndDate:    *req.EndDate,
		}
		resp, err := s.OverallEvaluations(ctx, getDetailsReq)
		if err != nil {
			return nil, err
		}
		for i, data := range resp.Entries {
			row := []interface{}{
				data.ProjectName,
				data.ConstructionUnit,
				data.SubsystemName,
				timestampToDateString(data.AcceptanceTime),
				data.AggregationTableCount,
				fmt.Sprintf("%.2f%%", data.OverallUpdateTimeliness),
				data.DataQualitySituation,
				data.Summary,
				data.AwardSuggestion,
				data.AwardReason,
			}
			if err = file.SetSheetRow("整体评价结果表", "A"+strconv.Itoa(i+2), &row); err != nil {
				return nil, errorcode.Detail(errorcode.SystemOperationDetailsExportFailed, err.Error())
			}
		}
	} else {
		for i, data := range req.Data {
			row := []interface{}{
				data.ProjectName,
				data.ConstructionUnit,
				data.SubsystemName,
				data.AcceptanceTime,
				data.AggregationTableCount,
				data.OverallUpdateTimeliness,
				data.DataQualitySituation,
				data.Summary,
				data.AwardSuggestion,
				data.AwardReason,
			}
			if err = file.SetSheetRow("整体评价结果表", "A"+strconv.Itoa(i+2), &row); err != nil {
				return nil, errorcode.Detail(errorcode.OverallEvaluationsExportFailed, err.Error())
			}
		}
	}

	return file, nil
}

func (s *systemOperationDomain) getInfoSystemInfoMap(ctx context.Context, infoSystemIds []string) (infoMap map[string]*system_operation.InfoSystemInfo, err error) {
	infoMap = make(map[string]*system_operation.InfoSystemInfo)
	if len(infoSystemIds) == 0 {
		return infoMap, nil
	}
	infos, err := common.GetInfoSystemsPrecision(ctx, infoSystemIds...)
	if err != nil {
		log.WithContext(ctx).Warnf("get info system %v failed, err: %v", strings.Join(infoSystemIds, ","), err)
		return
	}
	departIds := make([]string, 0)
	departmentNameMap := make(map[string]string)
	for _, info := range infos {
		infoMap[info.ID] = &system_operation.InfoSystemInfo{
			InfoSystemID:   info.ID,
			InfoSystemName: info.Name,
			DepartmentID:   info.DepartmentId,
		}
		if info.DepartmentId != "" {
			departIds = append(departIds, info.DepartmentId)
		}
	}
	if len(departIds) > 0 {
		departmentNameMap, err = s.getDepartmentNameMap(ctx, util.DuplicateStringRemoval(departIds))
		if err != nil {
			return nil, err
		}
	}
	for _, systemInfo := range infoMap {
		if systemInfo.DepartmentID != "" {
			systemInfo.DepartmentName = departmentNameMap[systemInfo.DepartmentID]
		}
	}
	return infoMap, nil
}

func (s *systemOperationDomain) convertOverallEvaluation(ctx context.Context, details []*model.TSystemOperationDetail, formUpdateCountMap map[string]int, expectedUpdateCount map[int32]int, updateTimeliness float64, ruleConfigs []*model.TRuleConfig) (*system_operation.OverallEvaluation, error) {
	if len(details) == 0 {
		return nil, nil
	}
	overallEvaluation := &system_operation.OverallEvaluation{
		InfoSystemID:          details[0].InfoSystemID,
		AggregationTableCount: len(details),
	}
	if details[0].AcceptanceTime != nil {
		overallEvaluation.AcceptanceTime = details[0].AcceptanceTime.UnixMilli()
	}
	status := &system_operation.TableStatus{
		CollectedTables: len(details),
	}
	infoSystemStatus := &system_operation.ProjectStatus{
		TotalCollectedTables: len(details),
	}
	for _, detail := range details {
		formViewList, err := s.dvDrivenRepo.GetDataViewList(ctx, dvRepo.PageListFormViewReqQueryParam{
			InfoSystemID: &overallEvaluation.InfoSystemID,
		})
		if err != nil {
			return nil, err
		}
		status.TotalTables = int(formViewList.TotalCount)

		if detail.QualityCheck > 0 {
			status.QualityWhitelist++
			infoSystemStatus.QualityWhitelist++
		} else {
			if detail.HasQualityIssue > 0 {
				status.QualityIssueTables++
			} else {
				infoSystemStatus.QualifiedTables++
			}
		}
		if detail.DataUpdate > 0 {
			status.UpdateWhitelist++
			infoSystemStatus.UpdateWhitelist++
		} else {
			if calculateTimeliness(formUpdateCountMap[detail.FormViewID], expectedUpdateCount[detail.UpdateCycle]) >= updateTimeliness {
				status.NormalUpdateTables++
				infoSystemStatus.TimelyUpdatedTables++
			}
		}
		if detail.QualityCheck > 0 || detail.DataUpdate > 0 {
			status.HasWhitelist = true
		}
		if detail.QualityCheck > 0 && detail.DataUpdate > 0 {
			infoSystemStatus.BothWhitelist++
		}
	}
	overallEvaluation.Summary, overallEvaluation.OverallUpdateTimeliness = generateSummaryReport(status)
	overallEvaluation.AwardSuggestion, overallEvaluation.AwardReason = evaluateCardWithConfig(infoSystemStatus, ruleConfigs)
	overallEvaluation.DataQualitySituation = generateQualitySituation(details)
	return overallEvaluation, nil
}

func generateQualitySituation(details []*model.TSystemOperationDetail) string {
	var dataQualitySituation string
	// 正则表达式匹配规则和数量
	re := regexp.MustCompile(`【([^】]+)】问题数据量：(\d+)`)

	// 创建统计map
	stats := make(map[string]*system_operation.RuleStats)

	// 处理每张表的数据
	for _, detail := range details {
		if detail.IssueRemark == "" {
			continue
		}

		// 提取当前表的所有规则问题
		matches := re.FindAllStringSubmatch(detail.IssueRemark, -1)
		encounteredRules := make(map[string]bool) // 记录当前表已处理的规则

		for _, match := range matches {
			if len(match) < 3 {
				continue
			}

			ruleName := match[1]
			count := atoi(match[2])

			// 初始化统计项
			if _, exists := stats[ruleName]; !exists {
				stats[ruleName] = &system_operation.RuleStats{}
			}

			// 更新统计
			stats[ruleName].TotalCount += count

			// 如果这个规则在当前表中第一次出现，增加表计数
			if !encounteredRules[ruleName] {
				stats[ruleName].TableCount++
				encounteredRules[ruleName] = true
			}
		}
	}

	// 收集所有规则名称用于排序输出
	var rules []string
	for rule := range stats {
		rules = append(rules, rule)
	}

	// 生成规则统计部分
	var ruleParts []string
	for _, rule := range rules {
		stat := stats[rule]
		part := fmt.Sprintf("%d张表存在【%s】问题",
			stat.TableCount, rule)
		ruleParts = append(ruleParts, part)
	}

	if len(ruleParts) > 0 {
		dataQualitySituation = strings.Join(ruleParts, "，")
	} else {
		dataQualitySituation = "无问题：所有表质量问题都是否"
	}
	return dataQualitySituation
}

func atoi(s string) int {
	var n int
	fmt.Sscanf(s, "%d", &n)
	return n
}

// 生成情况汇总报告
func generateSummaryReport(status *system_operation.TableStatus) (string, float64) {
	// 第一部分：表归集情况
	collectedPart := fmt.Sprintf("应归集数据表%d张，", status.TotalTables)
	if status.CollectedTables == status.TotalTables {
		collectedPart += "均已归集。"
	} else {
		uncollectedRatio := float64(status.TotalTables-status.CollectedTables) / float64(status.TotalTables) * 100
		collectedPart += fmt.Sprintf("%d张表未归集，占比%.2f%%。",
			status.TotalTables-status.CollectedTables, uncollectedRatio)
	}

	// 第二部分：更新情况
	updatePart := ""
	overallUpdateTimeliness := float64(0)
	remainingTables := status.CollectedTables - status.UpdateWhitelist
	if status.HasWhitelist {
		if remainingTables == 0 {
			updatePart = fmt.Sprintf("%d张表纳入数据更新白名单。", status.UpdateWhitelist)
		} else {
			abnormalUpdate := remainingTables - status.NormalUpdateTables
			if abnormalUpdate == 0 {
				updatePart = fmt.Sprintf("%d张表纳入数据更新白名单，剩余%d张表均正常更新。",
					status.UpdateWhitelist, remainingTables)
			} else {
				abnormalRatio := float64(abnormalUpdate) / float64(remainingTables) * 100
				updatePart = fmt.Sprintf("%d张表纳入数据更新白名单，剩余%d张表中%d张表未正常更新，占比%.2f%%。",
					status.UpdateWhitelist, remainingTables, abnormalUpdate, abnormalRatio)
			}
		}
	} else {
		if status.NormalUpdateTables == status.CollectedTables {
			updatePart = "均正常更新。"
		} else {
			abnormalRatio := float64(status.CollectedTables-status.NormalUpdateTables) / float64(status.CollectedTables) * 100
			updatePart = fmt.Sprintf("%d张表未正常更新，占比%.2f%%。",
				status.CollectedTables-status.NormalUpdateTables, abnormalRatio)
		}
	}

	if remainingTables > 0 {
		overallUpdateTimeliness = float64(status.NormalUpdateTables) / float64(status.CollectedTables-status.UpdateWhitelist) * 100
	}

	// 第三部分：质量问题
	qualityPart := ""
	if status.HasWhitelist {
		remainingTables := status.CollectedTables - status.QualityWhitelist
		if remainingTables == 0 {
			qualityPart = fmt.Sprintf("%d张表纳入质量检测白名单。", status.QualityWhitelist)
		} else if status.QualityIssueTables == 0 {
			qualityPart = fmt.Sprintf("%d张表纳入质量检测白名单，剩余%d张表无质量问题。",
				status.QualityWhitelist, remainingTables)
		} else {
			qualityRatio := float64(status.QualityIssueTables) / float64(remainingTables) * 100
			qualityPart = fmt.Sprintf("%d张表纳入质量检测白名单，剩余%d张表中%d张表存在质量问题，占比%.2f%%。",
				status.QualityWhitelist, remainingTables, status.QualityIssueTables, qualityRatio)
		}
	} else {
		if status.QualityIssueTables == 0 {
			qualityPart = "无质量问题。"
		} else {
			qualityRatio := float64(status.QualityIssueTables) / float64(status.CollectedTables) * 100
			qualityPart = fmt.Sprintf("%d张表存在质量问题，占比%.2f%%。",
				status.QualityIssueTables, qualityRatio)
		}
	}

	return collectedPart + updatePart + qualityPart, math.Round(overallUpdateTimeliness*100) / 100
}

// 计算数据质量合格率
func qualityPassRate(p *system_operation.ProjectStatus) float64 {
	denominator := p.TotalCollectedTables - (p.QualityWhitelist + p.BothWhitelist)
	if denominator <= 0 {
		return 100.0
	}
	return float64(p.QualifiedTables) / float64(denominator) * 100
}

// 计算数据更新及时率
func updateTimelyRate(p *system_operation.ProjectStatus) float64 {
	denominator := p.TotalCollectedTables - (p.UpdateWhitelist + p.BothWhitelist)
	if denominator <= 0 {
		return 100.0
	}
	return float64(p.TimelyUpdatedTables) / float64(denominator) * 100
}

// 获取发牌结果和理由(使用可配置阈值)
func evaluateCardWithConfig(p *system_operation.ProjectStatus, ruleConfigs []*model.TRuleConfig) (string, string) {
	qualityRate := qualityPassRate(p)
	updateRate := updateTimelyRate(p)
	config := &system_operation.CardConfig{}
	for _, ruleConfig := range ruleConfigs {
		switch ruleConfig.RuleName {
		case "red_card":
			config.RedUpdateRate = ruleConfig.UpdateTimelinessValue
			config.RedQualityRate = ruleConfig.QualityPassValue
			config.RedCondition = ruleConfig.LogicalOperator
		case "yellow_card":
			config.YellowUpdateRate = ruleConfig.UpdateTimelinessValue
			config.YellowQualityRate = ruleConfig.QualityPassValue
			config.YellowCondition = ruleConfig.LogicalOperator
		case "green_card":
			config.GreenUpdateRate = ruleConfig.UpdateTimelinessValue
			config.GreenQualityRate = ruleConfig.QualityPassValue
			config.GreenCondition = ruleConfig.LogicalOperator
		}
	}
	// 检查红牌条件(优先)
	redConditions := []bool{
		updateRate < config.YellowUpdateRate,
		qualityRate < config.YellowUpdateRate,
	}

	// 检查黄牌条件
	yellowConditions := []bool{
		updateRate >= config.YellowUpdateRate && updateRate < config.GreenUpdateRate,
		qualityRate >= config.YellowQualityRate && qualityRate < config.GreenQualityRate,
	}

	// 检查绿牌条件
	greenConditions := []bool{
		updateRate >= config.GreenUpdateRate,
		qualityRate >= config.GreenQualityRate,
	}

	// 生成理由
	var reason string
	var card string

	// 红牌优先
	if redConditions[0] || redConditions[1] {
		card = system_operation.CardRed
		if redConditions[0] && redConditions[1] {
			reason = fmt.Sprintf("本项目数据更新及时率未达到%.0f%%且数据质量合格率未达到%.0f%%",
				config.YellowUpdateRate, config.YellowQualityRate)
		} else if redConditions[0] {
			reason = fmt.Sprintf("本项目数据更新及时率未达到%.0f%%", config.YellowUpdateRate)
		} else {
			reason = fmt.Sprintf("本项目数据质量合格率未达到%.0f%%", config.YellowQualityRate)
		}
	} else if yellowConditions[0] {
		card = system_operation.CardYellow
		if updateRate < config.GreenUpdateRate && qualityRate < config.GreenQualityRate {
			reason = fmt.Sprintf("本项目数据更新及时率未达到%.0f%%且数据质量合格率未达到%.0f%%",
				config.GreenUpdateRate, config.GreenQualityRate)
		} else if updateRate < config.GreenUpdateRate {
			reason = fmt.Sprintf("本项目数据更新及时率未达到%.0f%%", config.GreenUpdateRate)
		} else {
			reason = fmt.Sprintf("本项目数据质量合格率未达到%.0f%%", config.GreenQualityRate)
		}
	} else if greenConditions[0] {
		card = system_operation.CardGreen
		reason = fmt.Sprintf("本项目数据更新及时率大于%.0f%%且数据质量合格率大于%.0f%%",
			config.GreenUpdateRate, config.GreenQualityRate)
	} else {
		card = system_operation.CardRed // 默认情况
		reason = "无法确定评级"
	}

	return card, reason + "，故本次发牌结果：" + card + "。"
}

func (s *systemOperationDomain) CreateDetail() {
	// 获取目录挂接的库表
	details := make([]*model.TSystemOperationDetail, 0)
	ctx := context.Background()
	status := []string{constant.PublishStatusPublished, constant.PublishStatusChAuditing, constant.PublishStatusChReject}
	catalogs, err := s.categoryRepo.GetPublishedList(ctx, status)
	if err != nil {
		log.WithContext(ctx).Warnf("GetPublishedList failed, err: %v", err)
		return
	}
	catalogIds := make([]uint64, 0)
	catalogMap := make(map[uint64]*model.TDataCatalog)
	for _, catalogInfo := range catalogs {
		catalogIds = append(catalogIds, catalogInfo.ID)
		catalogMap[catalogInfo.ID] = catalogInfo
	}
	resources, err := s.dataResourceRepo.GetByCatalogIds(ctx, catalogIds...)
	if err != nil {
		log.WithContext(ctx).Warnf("dataResourceRepo GetByResourceType failed, err: %v", err)
		return
	}
	formViewIds := make([]string, 0)
	for _, resource := range resources {
		formViewIds = append(formViewIds, resource.ResourceId)
	}
	details, err = s.systemOperationDetailRepo.GetByFormViewIDs(ctx, formViewIds)
	if err != nil {
		log.WithContext(ctx).Warnf("GetByFormViewIDs failed, err: %v", err)
		return
	}
	viewInfos, err := s.dvDriven.BatchQueryViewFieldInfo(ctx, formViewIds...)
	if err != nil {
		log.WithContext(ctx).Warnf("dvDriven BatchQueryViewFieldInfo failed, err: %v", err)
		return
	}
	viewInfoMap := make(map[string]*system_operation.ViewInfo)
	viewNames := make([]string, 0)
	for _, viewInfo := range viewInfos {
		viewInfoMap[viewInfo.FormViewID] = &system_operation.ViewInfo{
			TechnicalName: viewInfo.TechnicalName,
			BusinessName:  viewInfo.BusinessName,
			FieldCount:    len(viewInfo.Fields),
		}
		viewNames = append(viewNames, viewInfo.TechnicalName)
	}
	viewName := strings.Join(viewNames, ",")
	dataAggregationTaskResp, err := s.tcDriven.GetDataAggregationTask(ctx, viewName)
	if err != nil {
		log.WithContext(ctx).Warnf("tcDriven GetDataAggregationTask failed, err: %v", err)
		return
	}
	daTaskMap := make(map[string]task_center.DataAggregationTaskInfo)
	for _, dataAggregationTask := range dataAggregationTaskResp.Entries {
		daTaskMap[dataAggregationTask.FormName] = *dataAggregationTask
	}
	now := time.Now()
	resourceMap := make(map[string]*model.TSystemOperationDetail)
	for _, resource := range resources {
		if len(details) > 0 {
			for _, detail := range details {
				if resource.ResourceId == detail.FormViewID {
					resourceMap[detail.FormViewID] = detail
				}
			}
		}
	}
	for _, resource := range resources {
		systems, err := s.categoryRepo.GetCategoryByCatalogIdAndType(ctx, resource.CatalogID, constant.CategoryTypeInfoSystem)
		if err != nil {
			log.WithContext(ctx).Warnf("categoryRepo GetCategoryByCatalogIdAndType failed,catalog_id :%d  err: %v", resource.CatalogID, err)
			continue
		}
		_, viewExist := viewInfoMap[resource.ResourceId]
		_, exist := resourceMap[resource.ResourceId]
		if exist {
			if !viewExist {
				err = s.systemOperationDetailRepo.Delete(ctx, resourceMap[resource.ResourceId].ID)
				if err != nil {
					log.WithContext(ctx).Warnf("systemOperationDetailRepo Delete failed, err: %v", err)
				}
				continue
			}
			if len(systems) > 0 {
				resourceMap[resource.ResourceId].InfoSystemID = systems[0].CategoryID
			}
			resourceMap[resource.ResourceId].BusinessName = viewInfoMap[resource.ResourceId].BusinessName
			resourceMap[resource.ResourceId].FieldCount = viewInfoMap[resource.ResourceId].FieldCount
			resourceMap[resource.ResourceId].DepartmentID = catalogMap[resource.CatalogID].DepartmentID
			resourceMap[resource.ResourceId].UpdateCycle = catalogMap[resource.CatalogID].UpdateCycle
			s.GetReport(ctx, resource.ResourceId, resourceMap[resource.ResourceId])
			if err != nil {
				log.WithContext(ctx).Warnf("GetReport failed, err: %v", err)
				continue
			}
			err = s.systemOperationDetailRepo.Update(ctx, resourceMap[resource.ResourceId])
			if err != nil {
				log.WithContext(ctx).Warnf("systemOperationDetailRepo Update failed, err: %v", err)
				continue
			}
		} else {
			if !viewExist {
				continue
			}
			newDetail := &model.TSystemOperationDetail{
				CatalogID:       resource.CatalogID,
				FormViewID:      resource.ResourceId,
				TechnicalName:   viewInfoMap[resource.ResourceId].TechnicalName,
				BusinessName:    viewInfoMap[resource.ResourceId].BusinessName,
				FieldCount:      viewInfoMap[resource.ResourceId].FieldCount,
				HasQualityIssue: 0,
				IssueRemark:     "",
				QualityCheck:    0,
				DataUpdate:      0,
				CreatedAt:       now,
				UpdatedAt:       now,
			}

			newDetail.DepartmentID = catalogMap[resource.CatalogID].DepartmentID
			newDetail.UpdateCycle = catalogMap[resource.CatalogID].UpdateCycle
			if len(systems) > 0 {
				newDetail.InfoSystemID = systems[0].CategoryID
			}
			if daTaskMap[newDetail.TechnicalName].CreatedAt > 0 {
				newDetail.FirstAggregationTime = lo.ToPtr(time.UnixMilli(daTaskMap[newDetail.TechnicalName].CreatedAt))
			}
			newDetail.LatestDataCount = daTaskMap[newDetail.TechnicalName].Count
			s.GetReport(ctx, resource.ResourceId, newDetail)
			err = s.systemOperationDetailRepo.Create(ctx, newDetail)
			if err != nil {
				log.WithContext(ctx).Warnf("systemOperationDetailRepo Create failed, err: %v", err)
				continue
			}
		}
	}
}

func (s *systemOperationDomain) GetReport(ctx context.Context, formViewId string, detail *model.TSystemOperationDetail) {
	rBuf, _ := s.deDriven.GetThirdReport(ctx, formViewId, nil)
	if len(rBuf) > 0 {
		report := &system_operation.SrcReportData{}
		err := json.Unmarshal(rBuf, report)
		if err != nil {
			log.WithContext(ctx).Errorf("解析获取探查作业：%s 最新报告失败，err is %v", formViewId, err)
		} else {
			ruleMap := make(map[string]int64)
			for _, ruleResult := range report.ViewExplore {
				scores := ruleResult.DimensionScores
				if (scores.CompletenessScore != nil && *scores.CompletenessScore < 1) ||
					(scores.UniquenessScore != nil && *scores.UniquenessScore < 1) ||
					(scores.StandardizationScore != nil && *scores.StandardizationScore < 1) ||
					(scores.AccuracyScore != nil && *scores.AccuracyScore < 1) ||
					(scores.ConsistencyScore != nil && *scores.ConsistencyScore < 1) {
					detail.HasQualityIssue = 1
					_, exist := ruleMap[ruleResult.RuleName]
					if exist {
						ruleMap[ruleResult.RuleName] += ruleResult.IssueCount
					} else {
						ruleMap[ruleResult.RuleName] = ruleResult.IssueCount
					}
				}
			}
			for _, fieldRule := range report.FieldExplore {
				for _, ruleResult := range fieldRule.Details {
					scores := ruleResult.DimensionScores
					if (scores.CompletenessScore != nil && *scores.CompletenessScore < 1) ||
						(scores.UniquenessScore != nil && *scores.UniquenessScore < 1) ||
						(scores.StandardizationScore != nil && *scores.StandardizationScore < 1) ||
						(scores.AccuracyScore != nil && *scores.AccuracyScore < 1) ||
						(scores.ConsistencyScore != nil && *scores.ConsistencyScore < 1) {
						detail.HasQualityIssue = 1
						_, exist := ruleMap[ruleResult.RuleName]
						if exist {
							ruleMap[ruleResult.RuleName] += ruleResult.IssueCount
						} else {
							ruleMap[ruleResult.RuleName] = ruleResult.IssueCount
						}
					}
				}
			}
			if detail.HasQualityIssue > 0 {
				detail.IssueRemark = formatProblemNotes(ruleMap)
			}
		}
	}
}

func formatProblemNotes(ruleProblems map[string]int64) string {
	var builder strings.Builder

	// 遍历 map，生成格式化的文本
	for ruleName, count := range ruleProblems {
		builder.WriteString(fmt.Sprintf("【%s】问题数据量：%d; ", ruleName, count))
	}

	// 去除末尾的分号和空格
	notes := builder.String()
	if len(notes) > 0 {
		notes = notes[:len(notes)-2] + "。"
	}

	return notes
}

func (s *systemOperationDomain) DataCount() {
	ctx := context.Background()
	formViewIds, err := s.systemOperationDetailRepo.GetFormViewIDs(ctx)
	if err != nil {
		log.WithContext(ctx).Warnf("systemOperationDetailRepo GetFormViewIDs failed, err: %v", err)
		return
	}
	now := time.Now()
	for _, formViewId := range formViewIds {
		dataCount := &model.TFormDataCount{
			FormViewID: formViewId,
			DataCount:  0,
			CreatedAt:  now,
		}
		// todo 获取最新数据量
		err = s.formDataCountRepo.Create(ctx, dataCount)
		if err != nil {
			log.WithContext(ctx).Warnf("formDataCountRepo Create failed, err: %v", err)
			return
		}
		// todo 更新明细表最新数据量
	}
}
