package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"
	"unsafe"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/models/response"

	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/task_config"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/shopspring/decimal"
	"gorm.io/gorm"
)

// getReport 根据执行结果获取探查报告,计算探查报告总得分
func (e *ExplorationDomainImpl) getReport(tx *gorm.DB, ctx context.Context, report *model.Report) (reportFormat exploration.ReportFormat, err error) {
	reportFormat.Code = *report.Code
	reportFormat.TaskId = fmt.Sprintf("%d", report.TaskID)
	reportFormat.Version = *report.TaskVersion
	reportFormat.ExploreType = *report.ExploreType
	reportFormat.Schema = *report.Schema
	reportFormat.Table = *report.Table
	reportFormat.TotalSample = *report.TotalSample
	reportFormat.VeCatalog = *report.VeCatalog
	reportFormat.CreatedAt = util.ValueToPtr(report.CreatedAt.UnixMilli())
	now := time.Now()
	reportFormat.FinishedAt = util.ValueToPtr(now.UnixMilli())
	if report.TotalNum != nil {
		//全量探查时，总行数为实际探查数量
		reportFormat.Total = *report.TotalNum
	} else {
		// 非全量探查时，样本数为实际探查数量
		if report.TotalSample != nil && report.ExploreType != nil && *report.ExploreType != 0 {
			reportFormat.Total = *report.TotalSample
		} else {
			err = errorcode.Desc(errorcode.PublicReportFailedError, "未执行数据总量探查或数据总量探查结果异常，无法生成报告")
			log.WithContext(ctx).Errorf("calculateReportScore: get total num result not found , err: %v", err)
			return reportFormat, err
		}
	}
	// 计算探查项目得分
	err = e.calculateItemScore(tx, ctx, report, &reportFormat)
	if err != nil {
		return reportFormat, err
	}

	return reportFormat, nil
}

func (e *ExplorationDomainImpl) FormatExploreDataResult(response string) (map[string]map[string]any, error) {
	ret := make(map[string]map[string]any)
	var err error
	var res *exploration.DataExploreResultMsg
	if err = json.Unmarshal([]byte(response), &res); err != nil {
		log.Errorf("json.Unmarshal task result (%s) failed: %v", response, err)
		return ret, err
	}
	if res.Aggregation.TotalCount == 0 {
		return ret, nil
	}
	for i, column := range res.Aggregation.Columns {
		retM := make(map[string]any)
		item := res.Aggregation.Data[i]
		if subSlice, ok := item.([]interface{}); ok && len(subSlice) > 0 {
			for _, subSlice1 := range subSlice {
				value, ok := subSlice1.([]interface{})[1].(string)
				if !ok {
					continue
				}
				retM[value] = subSlice1.([]interface{})[0]
			}
		} else {
			log.Errorf("json.Unmarshal task result (%s) failed: %v", response, err)
			return ret, err
		}
		ret[column.Name] = retM
	}

	if res.GroupBy != nil {
		for i, column := range res.GroupBy.Columns {
			retM := make(map[string]any)
			if retAggregation, ok := ret[column.Name]; ok {
				retM = retAggregation
			}
			if res.GroupBy.Data[i].Group != nil {
				retM[constant.Group] = res.GroupBy.Data[i].Group
			}
			if res.GroupBy.Data[i].Day != nil {
				retM[constant.Day] = res.GroupBy.Data[i].Day
			}
			if res.GroupBy.Data[i].Month != nil {
				retM[constant.Month] = res.GroupBy.Data[i].Month
			}
			if res.GroupBy.Data[i].Year != nil {
				retM[constant.Year] = res.GroupBy.Data[i].Year
			}
			ret[column.Name] = retM
		}
	}

	return ret, nil
}

func (e *ExplorationDomainImpl) FormatExploreTimestampResult(response string) (map[string]string, error) {
	result := make(map[string]string)
	var res *exploration.DataExploreResultMsg
	if err := json.Unmarshal([]byte(response), &res); err != nil {
		log.Errorf("json.Unmarshal task result (%s) failed: %v", response, err)
		return result, err
	}
	if res.NotNull != nil {
		for i, column := range res.NotNull.Columns {
			result[column.Name] = res.NotNull.Data[0][i]
		}
	}
	return result, nil
}

// calculateItemScore 计算探查项目得分
func (e *ExplorationDomainImpl) calculateItemScore(tx *gorm.DB, ctx context.Context, report *model.Report, reportFormat *exploration.ReportFormat) (err error) {
	var task task_config.TaskConfigReq
	if err = json.Unmarshal([]byte(*report.QueryParams), &task); err != nil {
		log.WithContext(ctx).Errorf("calculateReportScore: query params unmarshal failed, err: %v", err)
		return err
	}
	completenessScore := float64(0)
	standardizationScore := float64(0)
	uniquenessScore := float64(0)
	accuracyScore := float64(0)
	totalScore := float64(0)
	var completenessCount, standardizationCount, uniquenessCount, accuracyCount, demensionCount int
	metadataExplore, err := e.calculateMetadataExploreScore(ctx, &task, *report.Code)
	if err != nil {
		return err
	}
	if metadataExplore != nil {
		reportFormat.MetadataExplore = metadataExplore
		if metadataExplore.CompletenessScore != nil {
			completenessCount++
			completenessScore += *metadataExplore.CompletenessScore
		}
		if metadataExplore.StandardizationScore != nil {
			standardizationCount++
			standardizationScore += *metadataExplore.StandardizationScore
		}
	}
	fieldExplore, err := e.calculateFieldExploreScore(tx, ctx, &task, *report.Code)
	if err != nil {
		return err
	}
	if fieldExplore != nil {
		reportFormat.FieldExplore = fieldExplore.ExploreFieldDetails
		if fieldExplore.CompletenessScore != nil {
			completenessCount++
			completenessScore += *fieldExplore.CompletenessScore
		}
		if fieldExplore.StandardizationScore != nil {
			standardizationCount++
			standardizationScore += *fieldExplore.StandardizationScore
		}
		if fieldExplore.UniquenessScore != nil {
			uniquenessCount++
			uniquenessScore += *fieldExplore.UniquenessScore
		}
		if fieldExplore.AccuracyScore != nil {
			accuracyCount++
			accuracyScore += *fieldExplore.AccuracyScore
		}
	}
	rowExplore, err := e.calculateRowExploreScore(tx, ctx, &task, *report.Code)
	if err != nil {
		return err
	}
	if rowExplore != nil {
		reportFormat.RowExplore = rowExplore
		if rowExplore.CompletenessScore != nil {
			completenessCount++
			completenessScore += *rowExplore.CompletenessScore
		}
		if rowExplore.UniquenessScore != nil {
			uniquenessCount++
			uniquenessScore += *rowExplore.UniquenessScore
		}
		if rowExplore.AccuracyScore != nil {
			accuracyCount++
			accuracyScore += *rowExplore.AccuracyScore
		}
	}
	viewExplore, err := e.calculateViewExploreScore(tx, ctx, &task, *report.Code)
	if err != nil {
		return err
	}
	if viewExplore != nil {
		reportFormat.ViewExplore = viewExplore.ExploreDetails
		if viewExplore.CompletenessScore != nil {
			completenessCount++
			completenessScore += *viewExplore.CompletenessScore
		}
	}
	if completenessCount > 0 {
		reportFormat.CompletenessScore = formatCalculateScoreResult(completenessScore, float64(completenessCount))
		demensionCount++
		totalScore += *reportFormat.CompletenessScore
	}
	if standardizationCount > 0 {
		reportFormat.StandardizationScore = formatCalculateScoreResult(standardizationScore, float64(standardizationCount))
		demensionCount++
		totalScore += *reportFormat.StandardizationScore
	}
	if uniquenessCount > 0 {
		reportFormat.UniquenessScore = formatCalculateScoreResult(uniquenessScore, float64(uniquenessCount))
		demensionCount++
		totalScore += *reportFormat.UniquenessScore
	}
	if accuracyCount > 0 {
		reportFormat.AccuracyScore = formatCalculateScoreResult(accuracyScore, float64(accuracyCount))
		demensionCount++
		totalScore += *reportFormat.AccuracyScore
	}
	if demensionCount > 0 {
		reportFormat.TotalScore = formatCalculateScoreResult(totalScore, float64(demensionCount))
	}
	return nil
}

func (e *ExplorationDomainImpl) calculateMetadataExploreScore(ctx context.Context, task *task_config.TaskConfigReq, code string) (*exploration.ExploreDetails, error) {
	metadataExplore := &exploration.ExploreDetails{}
	completenessScore := float64(0)
	standardizationScore := float64(0)
	if task.MetadataExplore != nil {
		var completenessCount, standardizationCount int
		ruleResults := make([]*exploration.RuleResult, 0)
		for _, rule := range task.MetadataExplore {
			ruleResult := &exploration.RuleResult{
				RuleId:          rule.RuleId,
				RuleName:        rule.RuleName,
				Dimension:       rule.Dimension,
				DimensionType:   rule.DimensionType,
				RuleDescription: rule.RuleDescription,
			}
			var data exploration.CountInfo
			if err := json.Unmarshal([]byte(*rule.RuleConfig), &data); err != nil {
				log.WithContext(ctx).Errorf("calculateFieldExploreScore: result unmarshal failed, err: %v", err)
				return nil, err
			}
			switch rule.Dimension {
			case constant.DimensionCompleteness.String:
				completenessCount++
				ruleResult.CompletenessScore = formatCalculateScoreResult(data.Count1, data.Count2)
				completenessScore += *ruleResult.CompletenessScore
			case constant.DimensionStandardization.String:
				standardizationCount++
				ruleResult.StandardizationScore = formatCalculateScoreResult(data.Count1, data.Count2)
				standardizationScore += *ruleResult.StandardizationScore
			}
			ruleResults = append(ruleResults, ruleResult)
		}
		if len(ruleResults) > 0 {
			metadataExplore.ExploreDetails = ruleResults
			if completenessCount > 0 {
				metadataExplore.CompletenessScore = formatCalculateScoreResult(completenessScore, float64(completenessCount))
			}
			if standardizationCount > 0 {
				metadataExplore.StandardizationScore = formatCalculateScoreResult(standardizationScore, float64(standardizationCount))
			}
		}
	}
	return metadataExplore, nil
}

func (e *ExplorationDomainImpl) calculateFieldExploreScore(tx *gorm.DB, ctx context.Context, task *task_config.TaskConfigReq, code string) (*exploration.ExploreFieldDetails, error) {
	var filedCompletenessCount, filedStandardizationCount, filedUniquenessCount, filedAccuracyCount int
	fieldDetail := &exploration.ExploreFieldDetails{}
	fieldCompletenessScore := float64(0)
	fieldStandardizationScore := float64(0)
	fieldUniquenessScore := float64(0)
	fieldAccuracyScore := float64(0)
	fieldExplores := make([]*exploration.ExploreFieldDetail, 0)

	if task.FieldExplore != nil {
		for _, fieldRule := range task.FieldExplore {
			var completenessScore, standardizationScore, uniquenessScore, accuracyScore float64
			ruleResults := make([]*exploration.RuleResult, 0)
			var completenessCount, standardizationCount, uniquenessCount, accuracyCount int
			for _, rule := range fieldRule.Projects {
				reportItem, err := e.item_repo.GetByCodeAndProject(tx, ctx, code, rule.RuleName, fieldRule.FieldName)
				if err != nil {
					log.WithContext(ctx).Errorf("calculateFieldExploreScore: GetByCode failed, err: %v", err)
					return fieldDetail, err
				}
				ruleResult := &exploration.RuleResult{
					RuleId:          rule.RuleId,
					RuleName:        rule.RuleName,
					Dimension:       rule.Dimension,
					DimensionType:   rule.DimensionType,
					RuleDescription: rule.RuleDescription,
					RuleConfig:      rule.RuleConfig,
				}
				var score *float64
				if rule.Dimension != constant.DimensionDataStatistics.String {
					var data []exploration.CountData
					if reportItem.Result != nil {
						if err = json.Unmarshal([]byte(*reportItem.Result), &data); err != nil {
							log.WithContext(ctx).Errorf("calculateFieldExploreScore: result unmarshal failed, err: %v", err)
							return nil, err
						}
					}
					if len(data) > 0 {
						count1 := float64(0)
						if data[0].Count1 != nil {
							count1, _ = data[0].Count1.(float64)
						}
						count2 := data[0].Count2
						if rule.RuleName == constant.NullCount || rule.RuleName == constant.Unique {
							ruleResult.InspectedCount = int64(count2)
							ruleResult.IssueCount = int64(count1)
							score = formatCalculateScoreResult(count2-count1, count2)
						} else {
							ruleResult.InspectedCount = int64(count2)
							ruleResult.IssueCount = int64(count2 - count1)
							score = formatCalculateScoreResult(count1, count2)
						}
					}
				}

				switch rule.Dimension {
				case constant.DimensionCompleteness.String:
					completenessCount++
					ruleResult.CompletenessScore = score
					completenessScore += *ruleResult.CompletenessScore
				case constant.DimensionStandardization.String:
					standardizationCount++
					ruleResult.StandardizationScore = score
					standardizationScore += *ruleResult.StandardizationScore
				case constant.DimensionUniqueness.String:
					uniquenessCount++
					ruleResult.UniquenessScore = score
					uniquenessScore += *ruleResult.UniquenessScore
				case constant.DimensionAccuracy.String:
					accuracyCount++
					ruleResult.AccuracyScore = score
					accuracyScore += *ruleResult.AccuracyScore
				case constant.DimensionDataStatistics.String:
					ruleResult.Result = reportItem.Result
				}
				ruleResults = append(ruleResults, ruleResult)
			}
			fieldExplore := &exploration.ExploreFieldDetail{
				FieldId:  fieldRule.FieldId,
				CodeInfo: fieldRule.Params,
				Details:  ruleResults,
			}
			if completenessCount > 0 {
				filedCompletenessCount++
				fieldExplore.CompletenessScore = formatCalculateScoreResult(completenessScore, float64(completenessCount))
				fieldCompletenessScore += *fieldExplore.CompletenessScore
			}
			if standardizationCount > 0 {
				filedStandardizationCount++
				fieldExplore.StandardizationScore = formatCalculateScoreResult(standardizationScore, float64(standardizationCount))
				fieldStandardizationScore += *fieldExplore.StandardizationScore
			}
			if uniquenessCount > 0 {
				filedUniquenessCount++
				fieldExplore.UniquenessScore = formatCalculateScoreResult(uniquenessScore, float64(uniquenessCount))
				fieldUniquenessScore += *fieldExplore.UniquenessScore
			}
			if accuracyCount > 0 {
				filedAccuracyCount++
				fieldExplore.AccuracyScore = formatCalculateScoreResult(accuracyScore, float64(accuracyCount))
				fieldAccuracyScore += *fieldExplore.AccuracyScore
			}
			fieldExplores = append(fieldExplores, fieldExplore)
		}
		if len(fieldExplores) > 0 {
			fieldDetail.ExploreFieldDetails = fieldExplores
		}
		if filedCompletenessCount > 0 {
			fieldDetail.CompletenessScore = formatCalculateScoreResult(fieldCompletenessScore, float64(filedCompletenessCount))
		}
		if filedStandardizationCount > 0 {
			fieldDetail.StandardizationScore = formatCalculateScoreResult(fieldStandardizationScore, float64(filedStandardizationCount))
		}
		if filedUniquenessCount > 0 {
			fieldDetail.UniquenessScore = formatCalculateScoreResult(fieldUniquenessScore, float64(filedUniquenessCount))
		}
		if filedAccuracyCount > 0 {
			fieldDetail.AccuracyScore = formatCalculateScoreResult(fieldAccuracyScore, float64(filedAccuracyCount))
		}
	}
	return fieldDetail, nil
}

func (e *ExplorationDomainImpl) calculateRowExploreScore(tx *gorm.DB, ctx context.Context, task *task_config.TaskConfigReq, code string) (*exploration.ExploreDetails, error) {
	rowExplore := &exploration.ExploreDetails{}
	completenessScore := float64(0)
	uniquenessScore := float64(0)
	accuracyScore := float64(0)
	if task.RowExplore != nil {
		var completenessCount, uniquenessCount, accuracyCount int
		ruleResults := make([]*exploration.RuleResult, 0)
		for _, rule := range task.RowExplore {
			reportItem, err := e.item_repo.GetByCodeAndProject(tx, ctx, code, rule.RuleName, "")
			if err != nil {
				log.WithContext(ctx).Errorf("calculateRowExploreScore: GetByCode failed, err: %v", err)
				return rowExplore, err
			}
			var data []exploration.CountData
			if err = json.Unmarshal([]byte(*reportItem.Result), &data); err != nil {
				log.WithContext(ctx).Errorf("calculateRowExploreScore: result unmarshal failed, err: %v", err)
				return nil, err
			}
			ruleResult := &exploration.RuleResult{
				RuleId:          rule.RuleId,
				RuleName:        rule.RuleName,
				Dimension:       rule.Dimension,
				DimensionType:   rule.DimensionType,
				RuleDescription: rule.RuleDescription,
				RuleConfig:      rule.RuleConfig,
			}
			var score *float64
			if len(data) > 0 {
				count1 := float64(0)
				if data[0].Count1 != nil {
					count1, _ = data[0].Count1.(float64)
				}
				count2 := data[0].Count2
				if rule.RuleName == constant.RowNull || rule.RuleName == constant.RowUnique {
					ruleResult.InspectedCount = int64(count2)
					ruleResult.IssueCount = int64(count1)
					score = formatCalculateScoreResult(count2-count1, count2)
				} else {
					ruleResult.InspectedCount = int64(count2)
					ruleResult.IssueCount = int64(count2 - count1)
					score = formatCalculateScoreResult(count1, count2)
				}
			}

			switch rule.Dimension {
			case constant.DimensionCompleteness.String:
				completenessCount++
				ruleResult.CompletenessScore = score
				completenessScore += *ruleResult.CompletenessScore
			case constant.DimensionUniqueness.String:
				uniquenessCount++
				ruleResult.UniquenessScore = score
				uniquenessScore += *ruleResult.UniquenessScore
			case constant.DimensionAccuracy.String:
				accuracyCount++
				ruleResult.AccuracyScore = score
				accuracyScore += *ruleResult.AccuracyScore
			}
			ruleResults = append(ruleResults, ruleResult)
		}
		if len(ruleResults) > 0 {
			rowExplore.ExploreDetails = ruleResults
			if completenessCount > 0 {
				rowExplore.CompletenessScore = formatCalculateScoreResult(completenessScore, float64(completenessCount))
			}
			if uniquenessCount > 0 {
				rowExplore.UniquenessScore = formatCalculateScoreResult(uniquenessScore, float64(uniquenessCount))
			}
			if accuracyCount > 0 {
				rowExplore.AccuracyScore = formatCalculateScoreResult(accuracyScore, float64(accuracyCount))
			}
		}
	}
	return rowExplore, nil
}

func (e *ExplorationDomainImpl) calculateViewExploreScore(tx *gorm.DB, ctx context.Context, task *task_config.TaskConfigReq, code string) (*exploration.ExploreDetails, error) {
	viewExplore := &exploration.ExploreDetails{}
	completenessScore := float64(0)
	if task.ViewExplore != nil {
		var completenessCount int
		ruleResults := make([]*exploration.RuleResult, 0)
		for _, rule := range task.ViewExplore {
			reportItem, err := e.item_repo.GetByCodeAndProject(tx, ctx, code, rule.RuleName, "")
			if err != nil {
				log.WithContext(ctx).Errorf("calculateViewExploreScore: GetByCode failed, err: %v", err)
				return viewExplore, err
			}

			ruleResult := &exploration.RuleResult{
				RuleId:          rule.RuleId,
				RuleName:        rule.RuleName,
				Dimension:       rule.Dimension,
				DimensionType:   rule.DimensionType,
				RuleDescription: rule.RuleDescription,
				RuleConfig:      rule.RuleConfig,
			}
			switch rule.Dimension {
			case constant.DimensionCompleteness.String:
				var data []exploration.CountData
				if err = json.Unmarshal([]byte(*reportItem.Result), &data); err != nil {
					log.WithContext(ctx).Errorf("calculateViewExploreScore: result unmarshal failed, err: %v", err)
					return nil, err
				}
				var score *float64
				if len(data) > 0 {
					count1 := float64(0)
					if data[0].Count1 != nil {
						count1, _ = data[0].Count1.(float64)
					}
					count2 := data[0].Count2
					ruleResult.InspectedCount = int64(count2)
					ruleResult.IssueCount = int64(count2 - count1)
					score = formatCalculateScoreResult(count1, count2)
				}
				completenessCount++
				ruleResult.CompletenessScore = score
				completenessScore += *ruleResult.CompletenessScore
			case constant.DimensionTimeliness.String:
				ruleResult.Result = rule.RuleConfig
			}
			ruleResults = append(ruleResults, ruleResult)
		}
		if len(ruleResults) > 0 {
			viewExplore.ExploreDetails = ruleResults
			if completenessCount >= 1 {
				viewExplore.CompletenessScore = formatCalculateScoreResult(completenessScore, float64(completenessCount))
			}
		}
	}
	return viewExplore, nil
}

// calculateTableTotalScore 计算表各个维度总得分
func calculateTableTotalScore(table_zqxTotalWeight float64, tableReport *exploration.TableReport, table_jsxTotalWeight float64, table_wzxTotalWeight float64, table_wyxTotalWeight float64, table_yzxTotalWeight float64, table_yxxTotalWeight float64, table_score float64, table_weight float64) {
	if table_zqxTotalWeight != 0 {
		tableReport.ZQX = formatCalculateResult(*tableReport.ZQX / table_zqxTotalWeight)
	}
	if table_jsxTotalWeight != 0 {
		tableReport.JSX = formatCalculateResult(*tableReport.JSX / table_jsxTotalWeight)
	}
	if table_wzxTotalWeight != 0 {
		tableReport.WZX = formatCalculateResult(*tableReport.WZX / table_wzxTotalWeight)
	}
	if table_wyxTotalWeight != 0 {
		tableReport.WYX = formatCalculateResult(*tableReport.WYX / table_wyxTotalWeight)
	}
	if table_yzxTotalWeight != 0 {
		tableReport.YZX = formatCalculateResult(*tableReport.YZX / table_yzxTotalWeight)
	}
	if table_yxxTotalWeight != 0 {
		tableReport.YXX = formatCalculateResult(*tableReport.YXX / table_yxxTotalWeight)
	}
	if table_weight != 0 {
		tableReport.Total = formatCalculateResult(table_score / table_weight)
	}
}

func formatCalculateScoreResult(count1, count2 float64) *float64 {
	formatResult := float64(0)
	if count2 != 0 {
		formatResult, _ = decimal.NewFromFloat(count1 / count2).RoundFloor(4).Float64()
	}
	return &formatResult
}

// formatCalculateResult 格式化计算结果，保留两位小数
func formatCalculateResult(value float64) *float64 {
	formatResult, _ := decimal.NewFromFloat(value).RoundFloor(4).Float64()
	return &formatResult
}

// calculateFieldTotalScore 计算字段级别各个维度总分数
func calculateFieldTotalScore(zqxTotalWeight float64, fieldReport *exploration.FieldReport, jsxTotalWeight float64, wzxTotalWeight float64, wyxTotalWeight float64, yzxTotalWeight float64, yxxTotalWeight float64, totalScore float64, totalWeight float64) {
	if zqxTotalWeight != 0 && fieldReport.ZQX != nil {
		fieldReport.ZQX = formatCalculateResult(*fieldReport.ZQX / zqxTotalWeight)
	}
	if jsxTotalWeight != 0 && fieldReport.JSX != nil {
		fieldReport.JSX = formatCalculateResult(*fieldReport.JSX / jsxTotalWeight)
	}
	if wzxTotalWeight != 0 && fieldReport.WZX != nil {
		fieldReport.WZX = formatCalculateResult(*fieldReport.WZX / wzxTotalWeight)
	}
	if wyxTotalWeight != 0 && fieldReport.WYX != nil {
		fieldReport.WYX = formatCalculateResult(*fieldReport.WYX / wyxTotalWeight)
	}
	if yzxTotalWeight != 0 && fieldReport.YZX != nil {
		fieldReport.YZX = formatCalculateResult(*fieldReport.YZX / yzxTotalWeight)
	}
	if yxxTotalWeight != 0 && fieldReport.YXX != nil {
		fieldReport.YXX = formatCalculateResult(*fieldReport.YXX / yxxTotalWeight)
	}
	if totalWeight != 0 {
		fieldReport.Total = formatCalculateResult(totalScore / totalWeight)
	}
}

// calculateYXX 计算有效性维度分数
func calculateYXX(fieldReport *exploration.FieldReport, score float64, projectConfig exploration.ExploreConfig, tableReport *exploration.TableReport, yxxTotalWeight float64, totalWeight float64, table_weight float64, table_yxxTotalWeight float64) (float64, float64, float64, float64) {
	if fieldReport.YXX == nil {
		fieldReport.YXX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		fieldReport.YXX = util.ValueToPtr(*fieldReport.YXX + score*projectConfig.Weight)
	}
	if tableReport.YXX == nil {
		tableReport.YXX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		tableReport.YXX = util.ValueToPtr(*tableReport.YXX + score*projectConfig.Weight)
	}
	yxxTotalWeight = yxxTotalWeight + projectConfig.Weight
	totalWeight = totalWeight + projectConfig.Weight
	table_weight = table_weight + projectConfig.Weight
	table_yxxTotalWeight = table_yxxTotalWeight + projectConfig.Weight
	return yxxTotalWeight, totalWeight, table_weight, table_yxxTotalWeight
}

// calculateYZX 计算一致性维度分数
func calculateYZX(fieldReport *exploration.FieldReport, score float64, projectConfig exploration.ExploreConfig, tableReport *exploration.TableReport, yzxTotalWeight float64, totalWeight float64, table_weight float64, table_yzxTotalWeight float64) (float64, float64, float64, float64) {
	if fieldReport.YZX == nil {
		fieldReport.YZX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		fieldReport.YZX = util.ValueToPtr(*fieldReport.YZX + score*projectConfig.Weight)
	}
	if tableReport.YZX == nil {
		tableReport.YZX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		tableReport.YZX = util.ValueToPtr(*tableReport.YZX + score*projectConfig.Weight)
	}
	yzxTotalWeight = yzxTotalWeight + projectConfig.Weight
	totalWeight = totalWeight + projectConfig.Weight
	table_weight = table_weight + projectConfig.Weight
	table_yzxTotalWeight = table_yzxTotalWeight + projectConfig.Weight
	return yzxTotalWeight, totalWeight, table_weight, table_yzxTotalWeight
}

// calculateWYX 计算唯一性维度分数
func calculateWYX(fieldReport *exploration.FieldReport, score float64, projectConfig exploration.ExploreConfig, tableReport *exploration.TableReport, wyxTotalWeight float64, totalWeight float64, table_weight float64, table_wyxTotalWeight float64) (float64, float64, float64, float64) {
	if fieldReport.WYX == nil {
		fieldReport.WYX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		fieldReport.WYX = util.ValueToPtr(*fieldReport.WYX + score*projectConfig.Weight)
	}
	if tableReport.WYX == nil {
		tableReport.WYX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		tableReport.WYX = util.ValueToPtr(*tableReport.WYX + score*projectConfig.Weight)
	}
	wyxTotalWeight = wyxTotalWeight + projectConfig.Weight
	totalWeight = totalWeight + projectConfig.Weight
	table_weight = table_weight + projectConfig.Weight
	table_wyxTotalWeight = table_wyxTotalWeight + projectConfig.Weight
	return wyxTotalWeight, totalWeight, table_weight, table_wyxTotalWeight
}

// calculateWZX 计算完整性维度分数
func calculateWZX(fieldReport *exploration.FieldReport, score float64, projectConfig exploration.ExploreConfig, tableReport *exploration.TableReport, wzxTotalWeight float64, totalWeight float64, table_weight float64, table_wzxTotalWeight float64) (float64, float64, float64, float64) {
	if fieldReport.WZX == nil {
		fieldReport.WZX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		fieldReport.WZX = util.ValueToPtr(*fieldReport.WZX + score*projectConfig.Weight)
	}
	if tableReport.WZX == nil {
		tableReport.WZX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		tableReport.WZX = util.ValueToPtr(*tableReport.WZX + score*projectConfig.Weight)
	}
	wzxTotalWeight = wzxTotalWeight + projectConfig.Weight
	totalWeight = totalWeight + projectConfig.Weight
	table_weight = table_weight + projectConfig.Weight
	table_wzxTotalWeight = table_wzxTotalWeight + projectConfig.Weight
	return wzxTotalWeight, totalWeight, table_weight, table_wzxTotalWeight
}

// calculateJSX 计算及时性维度分数
func calculateJSX(fieldReport *exploration.FieldReport, score float64, projectConfig exploration.ExploreConfig, tableReport *exploration.TableReport, jsxTotalWeight float64, totalWeight float64, table_weight float64, table_jsxTotalWeight float64) (float64, float64, float64, float64) {
	if fieldReport.JSX == nil {
		fieldReport.JSX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		fieldReport.JSX = util.ValueToPtr(*fieldReport.JSX + score*projectConfig.Weight)
	}
	if tableReport.JSX == nil {
		tableReport.JSX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		tableReport.JSX = util.ValueToPtr(*tableReport.JSX + score*projectConfig.Weight)
	}
	jsxTotalWeight = jsxTotalWeight + projectConfig.Weight
	totalWeight = totalWeight + projectConfig.Weight
	table_weight = table_weight + projectConfig.Weight
	table_jsxTotalWeight = table_jsxTotalWeight + projectConfig.Weight
	return jsxTotalWeight, totalWeight, table_weight, table_jsxTotalWeight
}

// calculateZQX 计算正确性维度分数
func calculateZQX(fieldReport *exploration.FieldReport, score float64, projectConfig exploration.ExploreConfig, tableReport *exploration.TableReport, zqxTotalWeight float64, totalWeight float64, table_weight float64, table_zqxTotalWeight float64) (float64, float64, float64, float64) {
	if fieldReport.ZQX == nil {
		fieldReport.ZQX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		fieldReport.ZQX = util.ValueToPtr(*fieldReport.ZQX + score*projectConfig.Weight)
	}
	if tableReport.ZQX == nil {
		tableReport.ZQX = util.ValueToPtr(score * projectConfig.Weight)
	} else {
		tableReport.ZQX = util.ValueToPtr(*tableReport.ZQX + score*projectConfig.Weight)
	}
	zqxTotalWeight = zqxTotalWeight + projectConfig.Weight
	totalWeight = totalWeight + projectConfig.Weight
	table_weight = table_weight + projectConfig.Weight
	table_zqxTotalWeight = table_zqxTotalWeight + projectConfig.Weight
	return zqxTotalWeight, totalWeight, table_weight, table_zqxTotalWeight
}

// calculateProjectScore 计算项目得分，反向规则计算
func calculateProjectScore(reportItem *model.ReportItem, report *model.Report) (score float64, err error) {
	resultTotal, err := getReportItemResultTotal(reportItem)
	if err != nil {
		log.Errorf("calculateProjectScore getReportItemResultTotal  err: %v", err)
		return score, err
	}
	score = (float64(1) - float64(resultTotal)/float64(*report.TotalNum)) * float64(100)
	log.Infof("calculateProjectScore score : %f", score)
	return score, err
}

// getReportItemResultTotal 获取报告结果进行处理
func getReportItemResultTotal(reportItem *model.ReportItem) (total int64, err error) {
	if reportItem.Result == nil {
		if err != nil {
			log.Error("getFormatResult reportItem.Result is nil")
			return total, nil
		}
	}
	if len(*reportItem.Result) > 0 {
		total, err = strconv.ParseInt(*reportItem.Result, 10, 64)
		if err != nil {
			log.Errorf("getFormatResult ParseInt err: %v", err)
			return total, nil
		}
	} else {
		total = 0
	}
	return total, err
}

// GetDataExploreReport 根据报告编号获取报告
func (e *ExplorationDomainImpl) GetDataExploreReport(ctx context.Context, req *exploration.CodePathParam) (report *exploration.ReportFormat, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	reportRecord, err := e.repo.GetByCode(nil, ctx, req.Code)
	if err != nil || reportRecord == nil {
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, "未找到编号对应的探查报告")
	}
	if reportRecord.FinishedAt == nil {
		return nil, errorcode.Detail(errorcode.PublicReportUnfinishedError, "探查报告未完成")
	}
	if *reportRecord.Status == constant.Explore_Status_Fail || reportRecord.Result == nil {
		return nil, errorcode.Detail(errorcode.PublicReportFailedError, "探查失败，无探查报告")
	}
	report = &exploration.ReportFormat{}
	err = json.Unmarshal([]byte(*reportRecord.Result), report)
	if err != nil {
		log.WithContext(ctx).Errorf("GetDataExploreReport error json.Unmarshal report failed : %v", err)
	}
	return report, err
}

// GetDataExploreReport 根据表或任务id获取最新报告
func (e *ExplorationDomainImpl) GetDataExploreReportByParam(ctx context.Context, req *exploration.ReportSearchReq) (report *exploration.ReportFormat, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if req.TableId == nil && req.TaskId == nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "table_id和task_id不能同时为空")
	}
	var reportRecord *model.Report
	if req.TaskVersion == nil {
		reportRecord, err = e.repo.GetRecentSuccessReportByParams(nil, ctx, (*string)(req.TaskId), req.TableId)
	} else {
		reportRecord, err = e.repo.GetByTaskIdAndVersion(nil, ctx, req.TaskId.Uint64(), req.TaskVersion)
	}
	if err != nil || reportRecord == nil {
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, "未找到任务编号对应的探查报告")
	}
	report = &exploration.ReportFormat{}
	if reportRecord.Result != nil {
		err = json.Unmarshal([]byte(*reportRecord.Result), report)
		if err != nil {
			log.WithContext(ctx).Errorf("GetDataExploreReport error json.Unmarshal report failed : %v", err)
		}
	}
	report.FinishedAt = util.ValueToPtr(reportRecord.FinishedAt.UnixMilli())
	return report, err
}

// GetDataExploreReport 根据表或任务id获取最新报告
func (e *ExplorationDomainImpl) GetDataExploreThirdPartyReportByParam(ctx context.Context, req *exploration.ReportSearchReq) (report *exploration.ReportFormat, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if req.TableId == nil && req.TaskId == nil {
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, "table_id和task_id不能同时为空")
	}
	var reportRecord *model.ThirdPartyReport
	if req.TaskVersion == nil {
		reportRecord, err = e.thirdPartyTaskRepo.GetRecentSuccessReportByParams(nil, ctx, (*string)(req.TaskId), req.TableId)
	} else {
		reportRecord, err = e.thirdPartyTaskRepo.GetByTableIdAndVersion(nil, ctx, req.TaskId.Uint64(), req.TaskVersion)
	}
	if err != nil || reportRecord == nil {
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, "未找到任务编号对应的探查报告")
	}
	report = &exploration.ReportFormat{}
	if reportRecord.Result != nil {
		err = json.Unmarshal([]byte(*reportRecord.Result), report)
		if err != nil {
			log.WithContext(ctx).Errorf("GetDataExploreReport error json.Unmarshal report failed : %v", err)
		}
	}
	report.FinishedAt = util.ValueToPtr(reportRecord.FinishedAt.UnixMilli())
	return report, err
}

// GetDataExploreReport 根据表或任务id获取报告列表
func (e *ExplorationDomainImpl) GetDataExploreReportListByParam(ctx context.Context, req *exploration.ReportListSearchReq) (result *exploration.ListReportRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	models, total, err := e.repo.ListByPage(ctx, &req.PageInfo, req.TableId, req.TaskId)
	if err != nil {
		return result, err
	}
	return exploration.NewReportListRespParam(ctx, models, total)
}

// GetDataExploreReport 根据表或任务id获取第三方报告列表
func (e *ExplorationDomainImpl) GetDataExploreThirdPartyReportListByParam(ctx context.Context, req *exploration.ReportListSearchReq) (result *exploration.ListReportRespParam, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	models, total, err := e.thirdPartyTaskRepo.ListByPage(ctx, &req.PageInfo, req.TableId, req.TaskId)
	if err != nil {
		return result, err
	}
	return exploration.NewThirdPartyReportListRespParam(ctx, models, total)
}

func (e *ExplorationDomainImpl) GetLatestDataExploreReportList(ctx context.Context, req *exploration.ReportListReq) (result *exploration.ReportListResp, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	if req.ThirdParty {
		models, total, err := e.thirdPartyTaskRepo.QueryList(ctx, &req.PageInfo, req.CatalogName, req.Keyword)
		if err != nil {
			return result, err
		}
		return exploration.NewThirdPartyReportListResp(ctx, models, total)
	} else {
		models, total, err := e.repo.QueryList(ctx, &req.PageInfo, req.CatalogName, req.Keyword)
		if err != nil {
			return result, err
		}
		return exploration.NewReportListResp(ctx, models, total)
	}
}

// GetDataExploreReport 获取字段报告
func (e *ExplorationDomainImpl) GetFieldDataExploreReport(ctx context.Context, req *exploration.FieldReportSearchReq) (*exploration.FieldReportResp, error) {
	var err error
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()
	reportRecord, err := e.repo.GetRecentSuccessReportByParams(nil, ctx, req.TaskId, nil)
	if err != nil || reportRecord == nil {
		return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, "未找到任务编号对应的探查报告")
	}
	result := &exploration.FieldReportResp{TotalSample: *reportRecord.TotalSample}
	fieldType := *req.FieldType
	if fieldType == constant.DataTypeInt.String || fieldType == constant.DataTypeFloat.String || fieldType == constant.DataTypeDecimal.String || fieldType == constant.DataTypeChar.String {
		item, err := e.item_repo.GetByProjectCode(nil, ctx, constant.Group, *reportRecord.Code, req.FieldName, nil)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, "未找到字段对应的探查报告")
		}
		result.Data = item.Result
	} else if fieldType == constant.DataTypeDate.String || fieldType == constant.DataTypeDateTime.String {
		timeRange := &exploration.TimeRange{}
		item1, err1 := e.item_repo.GetByProjectCode(nil, ctx, constant.Max, *reportRecord.Code, req.FieldName, nil)
		item2, err2 := e.item_repo.GetByProjectCode(nil, ctx, constant.Min, *reportRecord.Code, req.FieldName, nil)
		if err1 != nil && err2 != nil {
			return nil, errorcode.Detail(errorcode.PublicDataNotFoundError, "未找到字段对应的探查报告")
		}
		if item1 != nil {
			max := strings.Trim(*item1.Result, `"`)
			timeRange.Max = &max
		}
		if item2 != nil {
			min := strings.Trim(*item2.Result, `"`)
			timeRange.Min = &min
		}
		bytes, _ := json.Marshal(timeRange)
		result.Data = (*string)(unsafe.Pointer(&bytes))
	}
	return result, nil
}

// getTimestampReport 根据执行结果获取探查报告,
func (e *ExplorationDomainImpl) getTimestampReport(tx *gorm.DB, ctx context.Context, report *model.Report) ([]*exploration.FieldInfo, error) {
	fieldInfos := make([]*exploration.FieldInfo, 0)
	reportItemRecords, err := e.item_repo.GetListByCode(tx, ctx, *report.Code)
	if err != nil {
		log.WithContext(ctx).Errorf("calculateReportScore: GetByProjectCode failed, err: %v", err)
		return nil, err
	}

	if len(reportItemRecords) > 0 {
		for _, item := range reportItemRecords {
			fieldInfo := &exploration.FieldInfo{
				FieldName: *item.Column,
				Value:     *item.Result,
			}
			fieldInfos = append(fieldInfos, fieldInfo)
		}
	}

	return fieldInfos, nil
}

func (e *ExplorationDomainImpl) GetDataExploreReports(ctx context.Context, req *exploration.GetDataExploreReportsReq) (*exploration.GetDataExploreReportsResp, error) {
	reports, total, err := e.repo.GetReports(ctx, req.Offset, req.Limit, req.Direction, req.Sort, req.TableIds)
	if err != nil {
		return nil, err
	}
	entries := make([]*exploration.ReportFormat, 0)
	for _, report := range reports {
		result := &exploration.ReportFormat{}
		if report.Result != nil {
			err = json.Unmarshal([]byte(*report.Result), result)
			if err != nil {
				log.WithContext(ctx).Errorf("GetDataExploreReport error json.Unmarshal report failed : %v", err)
				continue
			}
		}
		result.FinishedAt = util.ValueToPtr(report.FinishedAt.UnixMilli())
		result.TableId = *report.TableID
		entries = append(entries, result)
	}
	return &exploration.GetDataExploreReportsResp{
		PageResult: response.PageResult[exploration.ReportFormat]{
			Entries:    entries,
			TotalCount: total,
		}}, nil
}

func (e *ExplorationDomainImpl) calculateThirdPartyFieldExploreScore(tx *gorm.DB, ctx context.Context, report *model.ThirdPartyReport, rules []exploration.RuleInfo) (*exploration.ExploreFieldDetails, error) {
	var filedCompletenessCount, filedStandardizationCount, filedUniquenessCount, filedAccuracyCount int
	fieldDetail := &exploration.ExploreFieldDetails{}
	fieldCompletenessScore := float64(0)
	fieldStandardizationScore := float64(0)
	fieldUniquenessScore := float64(0)
	fieldAccuracyScore := float64(0)
	fieldExplores := make([]*exploration.ExploreFieldDetail, 0)
	var task *task_config.ThirdPartyTaskConfigReq
	if err := json.Unmarshal([]byte(*report.QueryParams), &task); err != nil {
		log.Errorf("json.Unmarshal report.QueryParams (%s) failed: %v", *report.QueryParams, err)
		return nil, nil
	}
	ruleResultMap := make(map[string]exploration.RuleInfo)
	for _, rule := range rules {
		ruleResultMap[rule.RuleId] = rule
	}
	if task.FieldExplore != nil {
		for _, fieldRule := range task.FieldExplore {
			var completenessScore, standardizationScore, uniquenessScore, accuracyScore float64
			ruleResults := make([]*exploration.RuleResult, 0)
			var completenessCount, standardizationCount, uniquenessCount, accuracyCount int
			for _, rule := range fieldRule.Projects {
				ruleResult := &exploration.RuleResult{
					RuleId:          rule.RuleId,
					RuleName:        rule.RuleName,
					Dimension:       rule.Dimension,
					DimensionType:   rule.DimensionType,
					RuleDescription: rule.RuleDescription,
					RuleConfig:      rule.RuleConfig,
					InspectedCount:  ruleResultMap[rule.RuleId].InspectedCount,
					IssueCount:      ruleResultMap[rule.RuleId].IssueCount,
				}
				score := formatCalculateScoreResult(float64(ruleResult.InspectedCount-ruleResult.IssueCount), float64(ruleResult.InspectedCount))
				switch rule.Dimension {
				case constant.DimensionCompleteness.String:
					completenessCount++
					ruleResult.CompletenessScore = score
					completenessScore += *ruleResult.CompletenessScore
				case constant.DimensionStandardization.String:
					standardizationCount++
					ruleResult.StandardizationScore = score
					standardizationScore += *ruleResult.StandardizationScore
				case constant.DimensionUniqueness.String:
					uniquenessCount++
					ruleResult.UniquenessScore = score
					uniquenessScore += *ruleResult.UniquenessScore
				case constant.DimensionAccuracy.String:
					accuracyCount++
					ruleResult.AccuracyScore = score
					accuracyScore += *ruleResult.AccuracyScore
				}
				ruleResults = append(ruleResults, ruleResult)
			}
			fieldExplore := &exploration.ExploreFieldDetail{
				FieldId:  fieldRule.FieldId,
				CodeInfo: fieldRule.Params,
				Details:  ruleResults,
			}
			if completenessCount > 0 {
				filedCompletenessCount++
				fieldExplore.CompletenessScore = formatCalculateScoreResult(completenessScore, float64(completenessCount))
				fieldCompletenessScore += *fieldExplore.CompletenessScore
			}
			if standardizationCount > 0 {
				filedStandardizationCount++
				fieldExplore.StandardizationScore = formatCalculateScoreResult(standardizationScore, float64(standardizationCount))
				fieldStandardizationScore += *fieldExplore.StandardizationScore
			}
			if uniquenessCount > 0 {
				filedUniquenessCount++
				fieldExplore.UniquenessScore = formatCalculateScoreResult(uniquenessScore, float64(uniquenessCount))
				fieldUniquenessScore += *fieldExplore.UniquenessScore
			}
			if accuracyCount > 0 {
				filedAccuracyCount++
				fieldExplore.AccuracyScore = formatCalculateScoreResult(accuracyScore, float64(accuracyCount))
				fieldAccuracyScore += *fieldExplore.AccuracyScore
			}
			fieldExplores = append(fieldExplores, fieldExplore)
		}
		if len(fieldExplores) > 0 {
			fieldDetail.ExploreFieldDetails = fieldExplores
		}
		if filedCompletenessCount > 0 {
			fieldDetail.CompletenessScore = formatCalculateScoreResult(fieldCompletenessScore, float64(filedCompletenessCount))
		}
		if filedStandardizationCount > 0 {
			fieldDetail.StandardizationScore = formatCalculateScoreResult(fieldStandardizationScore, float64(filedStandardizationCount))
		}
		if filedUniquenessCount > 0 {
			fieldDetail.UniquenessScore = formatCalculateScoreResult(fieldUniquenessScore, float64(filedUniquenessCount))
		}
		if filedAccuracyCount > 0 {
			fieldDetail.AccuracyScore = formatCalculateScoreResult(fieldAccuracyScore, float64(filedAccuracyCount))
		}
	}
	return fieldDetail, nil
}

func (e *ExplorationDomainImpl) getThirdPartyReport(tx *gorm.DB, ctx context.Context, report *model.ThirdPartyReport, result *exploration.ThirdPartyDataExploreResultMsg) (reportFormat exploration.ReportFormat, err error) {
	reportFormat.Code = report.Code
	reportFormat.TaskId = fmt.Sprintf("%d", report.TaskID)
	reportFormat.Version = *report.TaskVersion
	reportFormat.ExploreType = *report.ExploreType
	reportFormat.Schema = *report.Schema
	reportFormat.Table = *report.Table
	reportFormat.TotalSample = *report.TotalSample
	reportFormat.VeCatalog = *report.VeCatalog
	reportFormat.CreatedAt = util.ValueToPtr(report.CreatedAt.UnixMilli())
	now := time.Now()
	reportFormat.FinishedAt = util.ValueToPtr(now.UnixMilli())
	if report.TotalNum != nil {
		//全量探查时，总行数为实际探查数量
		reportFormat.Total = *report.TotalNum
	} else {
		// 非全量探查时，样本数为实际探查数量
		if report.TotalSample != nil && report.ExploreType != nil && *report.ExploreType != 0 {
			reportFormat.Total = *report.TotalSample
		} else {
			err = errorcode.Desc(errorcode.PublicReportFailedError, "未执行数据总量探查或数据总量探查结果异常，无法生成报告")
			log.WithContext(ctx).Errorf("calculateReportScore: get total num result not found , err: %v", err)
			return reportFormat, err
		}
	}
	// 计算探查项目得分
	err = e.calculateThirdPartyReportScore(tx, ctx, report, result, &reportFormat)
	if err != nil {
		return reportFormat, err
	}

	return reportFormat, nil
}

func (e *ExplorationDomainImpl) calculateThirdPartyReportScore(tx *gorm.DB, ctx context.Context, report *model.ThirdPartyReport, result *exploration.ThirdPartyDataExploreResultMsg, reportFormat *exploration.ReportFormat) (err error) {
	completenessScore := float64(0)
	standardizationScore := float64(0)
	uniquenessScore := float64(0)
	accuracyScore := float64(0)
	var completenessCount, standardizationCount, uniquenessCount, accuracyCount int
	fieldExplore, err := e.calculateThirdPartyFieldExploreScore(tx, ctx, report, result.Rules)
	if err != nil {
		return err
	}
	if fieldExplore != nil {
		reportFormat.FieldExplore = fieldExplore.ExploreFieldDetails
		if fieldExplore.CompletenessScore != nil {
			completenessCount++
			completenessScore += *fieldExplore.CompletenessScore
		}
		if fieldExplore.StandardizationScore != nil {
			standardizationCount++
			standardizationScore += *fieldExplore.StandardizationScore
		}
		if fieldExplore.UniquenessScore != nil {
			uniquenessCount++
			uniquenessScore += *fieldExplore.UniquenessScore
		}
		if fieldExplore.AccuracyScore != nil {
			accuracyCount++
			accuracyScore += *fieldExplore.AccuracyScore
		}
	}
	if completenessCount > 0 {
		reportFormat.CompletenessScore = formatCalculateScoreResult(completenessScore, float64(completenessCount))
	}
	if standardizationCount > 0 {
		reportFormat.StandardizationScore = formatCalculateScoreResult(standardizationScore, float64(standardizationCount))
	}
	if uniquenessCount > 0 {
		reportFormat.UniquenessScore = formatCalculateScoreResult(uniquenessScore, float64(uniquenessCount))
	}
	if accuracyCount > 0 {
		reportFormat.AccuracyScore = formatCalculateScoreResult(accuracyScore, float64(accuracyCount))
	}
	return nil
}
