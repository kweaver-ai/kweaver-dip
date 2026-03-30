package v2

import (
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/nsql"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"gorm.io/gorm"
)

const (
	autoRefreshTime    = 1 * time.Second
	AddASyncReportKey  = "AddASyncReport-"
	ExecASyncReportKey = "ExecASyncReport-"
	ExecExploreTask    = "ExecExploreTask"
	RecExploreTask     = "RecExploreTask"
	DevideExploreTask  = "DevideExploreTask"
)

func (e *ExplorationDomainImplV2) exploreTaskDevideProc(ctx context.Context) {
	var (
		err         error
		reportItems []*model.ReportItem
	)
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
		}
	}(&err)
	log.Info("start exploreTaskDevideProc")
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	// 获取待执行的任务
	tasks, err := e.task_repo.GetTaskV2(ctx, []int32{ExploreType_Data, ExploreType_Timestamp}, []int32{constant.Explore_Status_Undo})
	if err != nil {
		log.WithContext(ctx).Errorf("获取待拆分探查子项的任务失败，err: %v", err)
		return
	}
	if len(tasks) == 0 {
		log.WithContext(ctx).Infof("获取待拆分探查子项的任务数量为0，跳过本次执行")
		return
	}

	for i := range tasks {
		key := fmt.Sprintf("%s-%d", DevideExploreTask, tasks[i].ID)
		locker, err := e.mtx.ObtainLocker(ctx, key, autoRefreshTime)
		if err != nil {
			log.Errorf("对探查任务%d执行devide操作冲突 err :%v", tasks[i].ID, err)
			continue
		}
		defer e.mtx.Release(ctx, locker)

		var (
			report *model.Report
			id     uint64
		)
		if report, err = e.repo.GetByTaskIdAndVersionV2(nil, ctx, tasks[i].TaskID, tasks[i].Version); err != nil {
			log.Errorf("获取探查任务%d version %d 对应的report是否存在 err: %v", tasks[i].TaskID, *tasks[i].Version, err)
			continue
		}

		if report != nil {
			log.Infof("获取探查任务%d version %d 对应的report已存在，无需执行拆分探查子项处理，跳过", tasks[i].TaskID, *tasks[i].Version)
			continue
		}
		id, err = utils.GetUniqueID()
		if err != nil {
			log.Errorf("为探查任务%d生成报告ID失败:%v", tasks[i].ID, err)
			continue
		}
		reportCode := uuid.NewString()
		now := time.Now()
		report = &model.Report{
			ID:             id,
			Code:           util.ValueToPtr(reportCode),
			TaskID:         tasks[i].TaskID,
			TaskVersion:    tasks[i].Version,
			QueryParams:    tasks[i].QueryParams,
			ExploreType:    tasks[i].ExploreType,
			Table:          tasks[i].Table,
			TableID:        tasks[i].TableID,
			Schema:         tasks[i].Schema,
			VeCatalog:      tasks[i].VeCatalog,
			TotalSample:    tasks[i].TotalSample,
			Status:         util.ValueToPtr(constant.Explore_Status_Undo),
			Latest:         constant.NO,
			CreatedAt:      &now,
			DvTaskID:       tasks[i].DvTaskID,
			CreatedByUID:   tasks[i].CreatedByUID,
			CreatedByUname: tasks[i].CreatedByUname,
		}

		reportItems, err = e.devideExploreTaskReportItems(ctx, report)
		if err != nil {
			report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
			report.Reason = util.ValueToPtr(fmt.Sprintf("探查规则配置错误_%v", err.Error()))
			report.FinishedAt = util.ValueToPtr(time.Now())
		}

		func() {
			tx := e.data.DB.WithContext(ctx).Begin()
			defer func() {
				if e := recover(); e != nil {
					tx.Rollback()
				} else if e = tx.Commit().Error; e != nil {
					tx.Rollback()
				}
			}()
			if *report.Status == constant.Explore_Status_Success {
				// 更新是否最新标记
				err = e.repo.UpdateLatestStateV2(nil, ctx, report.TaskID, *report.TaskVersion)
				if err != nil {
					log.WithContext(ctx).Errorf("explore task %d version %d e.repo.UpdateLatestState failed: %v", report.TaskID, *report.TaskVersion, err)
					panic(err)
				}
				latestState, err := e.repo.GetLatestState(tx, ctx, report.TaskID, *report.TaskVersion)
				if err != nil {
					log.WithContext(ctx).Errorf("explore task %d version %d e.repo.GetLatestState failed: %v", report.TaskID, *report.TaskVersion, err)
					panic(err)
				}
				report.Latest = latestState
			} else if len(reportItems) > 0 {
				err := e.item_repo.BatchCreate(tx, ctx, reportItems)
				if err != nil {
					log.WithContext(ctx).Errorf("explore task %d version %d e.item_repo.BatchCreate failed: %v", report.TaskID, *report.TaskVersion, err)
					panic(err)
				}
			}

			err = e.repo.Create(tx, ctx, report)
			if err != nil {
				log.WithContext(ctx).Errorf("explore task %d version %d e.repo.Create failed: %v", report.TaskID, *report.TaskVersion, err)
				panic(err)
			}

			// 更新任务执行状态
			err = e.task_repo.UpdateExecStatusV2(tx, ctx, report.TaskID, *report.TaskVersion, *report.Status)
			if err != nil {
				log.WithContext(ctx).Errorf("explore task %d version %d e.task_repo.UpdateExecStatus failed: %v", report.TaskID, *report.TaskVersion, err)
				panic(err)
			}

			if *report.Status == constant.Explore_Status_Success && *report.ExploreType == ExploreType_Data {
				// 消息通知逻辑视图服务
				key := report.TableID
				value, err := newExploreDataFinishedMsg(ctx, report)
				if err != nil {
					log.WithContext(ctx).Errorf("explore task %d version %d newExploreDataFinishedMsg failed: %v", report.TaskID, *report.TaskVersion, err)
					return
				}
				err = e.mq_producter.SyncProduce(mq.ExploreDataFinishedTopic, util.StringToBytes(*key), util.StringToBytes(value))
				if err != nil {
					log.WithContext(ctx).Errorf("explore task %d version %d e.mq_producter.SyncProduce failed: %v", report.TaskID, *report.TaskVersion, err)
					return
				}
			}
		}()
	}
	log.Info("exploreTaskDevideProc finished")
}

func (e *ExplorationDomainImplV2) execExploreTaskProc(ctx context.Context) {
	var (
		err error
	)
	defer func(err *error) {
		if e := recover(); e != nil {
			*err = e.(error)
		}
	}(&err)
	log.Info("start execExploreTaskProc")
	// 获取待执行的任务
	reports, err := e.repo.GetReportV2(ctx, []int32{ExploreType_Data, ExploreType_Timestamp}, []int32{constant.Explore_Status_Undo, constant.Explore_Status_Excuting})
	if err != nil {
		log.WithContext(ctx).Errorf("获取待执行的探查报告失败，err: %v", err)
		return
	}
	if len(reports) == 0 {
		log.WithContext(ctx).Infof("获取待执行的探查报告数量为0，跳过本次执行")
		return
	}

	for i := range reports {
		key := fmt.Sprintf("%s-%d", ExecASyncReportKey, reports[i].Code)
		locker, err := e.mtx.ObtainLocker(ctx, key, autoRefreshTime)
		if err != nil {
			log.WithContext(ctx).Errorf("对探查报告%d执行探查操作冲突 err :%v", reports[i].Code, err)
			continue
		}
		if err := e.groupTaskExec.AddGroup(e, reports[i], locker); err != nil {
			if _, ok := err.(*NoGroupExecResErr); ok {
				log.WithContext(ctx).Warnf("暂无空闲探查报告执行资源，跳过本次执行", reports[i].Code, err)
				break
			} else if _, ok := err.(*GroupExecutingErr); ok {
				log.WithContext(ctx).Errorf("探查报告%d执行探查操作失败 err :探查正在执行中", reports[i].Code)
				continue
			}
			log.WithContext(ctx).Errorf("探查报告%d执行探查操作失败 err :%v", reports[i].Code, err)
		}
	}
	log.Info("execExploreTaskProc finished")
}

func (e *ExplorationDomainImplV2) devideExploreTaskReportItems(ctx context.Context, report *model.Report) (items []*model.ReportItem, err error) {
	var reportItems []*model.ReportItem
	var exploreReq *exploration.DataExploreReq
	if err = json.Unmarshal([]byte(*report.QueryParams), &exploreReq); err != nil {
		log.WithContext(ctx).Errorf("json.Unmarshal explore task %d version %d exploreReq (%s) failed: %v",
			report.TaskID, *report.TaskVersion, *report.QueryParams, exploreReq.FieldInfo, err)
		return nil, err
	}
	tableInfo := exploration.MetaDataTableInfo{
		Name:        exploreReq.Table,
		SchemaName:  exploreReq.Schema,
		VeCatalogId: exploreReq.VeCatalog,
	}
	var res map[string]exploration.ColumnInfo
	if exploreReq.FieldInfo != "" {
		if err = json.Unmarshal([]byte(exploreReq.FieldInfo), &res); err != nil {
			log.WithContext(ctx).Errorf("json.Unmarshal explore task %d version %d exploreReq FieldInfo (%s) failed: %v",
				report.TaskID, *report.TaskVersion, exploreReq.FieldInfo, err)
			return nil, err
		}
		tableInfo.Columns = res
	}

	// 执行时间戳探查
	if exploreReq.ExploreType == 2 {
		reportItems, err = timestampReportItemGenerate(exploreReq, e, ctx, report)
		if err != nil {
			log.WithContext(ctx).Errorf("explore task %d version %d generate timestamp report item failed: %v", report.TaskID, *report.TaskVersion, err)
			return nil, err
		}
	} else {
		sqls := make([]string, 0)
		sqlMap := make(map[string]string)

		// 执行字段级探查
		var (
			fieldSqlMap   map[string]string
			fieldSqls     []string
			statisticsSql string
			mergeSql      string
			groupMap      map[string]string
		)
		fieldSqlMap, fieldSqls, statisticsSql, mergeSql, groupMap, err = fieldExploreSqlGenerate(exploreReq, e, ctx, tableInfo)
		if err != nil {
			log.Errorf("explore task %d version %d fieldExploreSqlGenerate failed: %v", report.TaskID, *report.TaskVersion, err)
			return nil, err
		}
		for ruleName, sql := range fieldSqlMap {
			sqlMap[ruleName] = sql
		}
		if statisticsSql != "" {
			sqls = append(sqls, statisticsSql)
		}
		if mergeSql != "" {
			sqls = append(sqls, mergeSql)
		}
		for _, sql := range fieldSqls {
			sqls = append(sqls, sql)
		}

		// 执行行级探查
		var (
			rowSqlMap map[string]string
			rowSqls   []string
		)
		rowSqlMap, rowSqls, err = RowExploreSqlGenerate(exploreReq, e, ctx, tableInfo)
		if err != nil {
			log.WithContext(ctx).Errorf("explore task %d version %d RowExploreSqlGenerate failed: %v", report.TaskID, *report.TaskVersion, err)
			return nil, err
		}
		for ruleName, sql := range rowSqlMap {
			sqlMap[ruleName] = sql
		}
		for _, sql := range rowSqls {
			sqls = append(sqls, sql)
		}

		// 执行视图级探查
		var (
			viewSqlMap map[string]string
			viewSqls   []string
		)
		viewSqlMap, viewSqls, err = ViewExploreSqlGenerate(exploreReq, e, ctx, tableInfo)
		if err != nil {
			log.WithContext(ctx).Errorf("explore task %d version %d ViewExploreSqlGenerate failed: %v", report.TaskID, *report.TaskVersion, err)
			return nil, err
		}
		for ruleName, sql := range viewSqlMap {
			sqlMap[ruleName] = sql
		}
		for _, sql := range viewSqls {
			sqls = append(sqls, sql)
		}
		if len(sqls) > 0 {
			reportItems, err = e.saveAsyncExploreDataRecord(nil, ctx, sqlMap, statisticsSql, mergeSql, groupMap, *report.Code, exploreReq)
			if err != nil {
				log.WithContext(ctx).Errorf("explore task %d version %d generate explore report item failed: %v", report.TaskID, *report.TaskVersion, err)
				return nil, err
			}
		} else {
			if len(exploreReq.MetadataExplore) > 0 || len(exploreReq.ViewExplore) > 0 {
				reportFormat, err := e.getReport(nil, ctx, report)
				b, err := json.Marshal(reportFormat)
				if err != nil {
					log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", reportFormat, err)
				}
				report.Result = util.ValueToPtr(util.BytesToString(b))
				report.TotalCompleteness = reportFormat.CompletenessScore
				report.TotalStandardization = reportFormat.StandardizationScore
				if report.TotalCompleteness != nil {
					report.TotalScore = report.TotalCompleteness
					if report.TotalStandardization != nil {
						report.TotalScore = formatCalculateScoreResult(*report.TotalCompleteness+*report.TotalStandardization, float64(2))
					}
				} else {
					report.TotalScore = report.TotalStandardization
				}
			} else {
				report.Result = nil
			}
			report.Status = util.ValueToPtr(constant.Explore_Status_Success)
			now := time.Now()
			report.FinishedAt = &now
		}
	}

	return reportItems, err
}

func fieldExploreSqlGenerate(exploreReq *exploration.DataExploreReq, e *ExplorationDomainImplV2, ctx context.Context, tableInfo exploration.MetaDataTableInfo) (map[string]string, []string, string, string, map[string]string, error) {
	sqlMap := make(map[string]string)
	groupMap := make(map[string]string)
	sqls := make([]string, 0)
	var err error
	var statisticsSql, mergeSql string
	statisticsSqls := make([]string, 0)
	mergeSqls := make([]string, 0)
	for _, fieldProject := range exploreReq.FieldExplore {
		groupRules := make([]string, 0)
		for _, project := range fieldProject.Projects {
			var sql string
			res := &exploration.RuleConfig{}
			if project.RuleConfig != nil {
				err := json.Unmarshal([]byte(*project.RuleConfig), res)
				if err != nil {
					log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
					return nil, nil, statisticsSql, mergeSql, groupMap, errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
				}
			}
			if project.RuleName == constant.NullCount || project.DimensionType == constant.DimensionTypeNull.String {
				nullSql, err := GetFieldNullSql(res, fieldProject.FieldId, tableInfo, project.RuleId)
				if err != nil {
					return nil, nil, statisticsSql, mergeSql, groupMap, err
				}
				mergeSqls = append(mergeSqls, nullSql)
				continue
			}
			if project.RuleName == constant.Unique || project.DimensionType == constant.DimensionTypeRepeat.String {
				uniqueSql := GetFieldUniqueSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId)
				mergeSqls = append(mergeSqls, uniqueSql)
			}
			if project.RuleName == constant.Dict || project.DimensionType == constant.DimensionTypeDict.String {
				dictSql, err := GetFieldDictSql(res, fieldProject.FieldId, tableInfo, project.RuleId)
				if err != nil {
					return nil, nil, statisticsSql, mergeSql, groupMap, err
				}
				mergeSqls = append(mergeSqls, dictSql)
				continue
			}
			if project.RuleName == constant.Regexp || project.DimensionType == constant.DimensionTypeFormat.String {
				mergeSqls = append(mergeSqls, GetFieldRegexpSql(res, tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if res.RuleExpression != nil {
				sql, err = GetFieldRuleExpressionSql(res, tableInfo)
				if err != nil {
					return nil, nil, statisticsSql, mergeSql, groupMap, err
				}
			}
			if project.RuleName == constant.Max {
				statisticsSqls = append(statisticsSqls, GetFieldMaxSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if project.RuleName == constant.Min {
				statisticsSqls = append(statisticsSqls, GetFieldMinSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if project.RuleName == constant.Quantile {
				statisticsSqls = append(statisticsSqls, GetFieldQuantileSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if project.RuleName == constant.Avg {
				statisticsSqls = append(statisticsSqls, GetFieldAvgSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if project.RuleName == constant.StddevPop {
				statisticsSqls = append(statisticsSqls, GetFieldStddevPopSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if project.RuleName == constant.Group {
				sql = nsql.Group
			}
			if project.RuleName == constant.Day || project.RuleName == constant.Month || project.RuleName == constant.Year {
				groupRules = append(groupRules, project.RuleName)
			}
			if project.RuleName == constant.TrueCount {
				statisticsSqls = append(statisticsSqls, GetFieldTrueSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if project.RuleName == constant.FalseCount {
				statisticsSqls = append(statisticsSqls, GetFieldFalseSql(tableInfo.Columns[fieldProject.FieldId].Name, project.RuleId))
				continue
			}
			if sql != "" {
				sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, fieldProject)
				if err != nil {
					return nil, nil, statisticsSql, mergeSql, groupMap, err
				}
				ruleName := fmt.Sprintf("字段级(%s):%s", fieldProject.FieldName, project.RuleName)
				sqlMap[ruleName] = sql
				sqls = append(sqls, sql)
			}
		}
		if len(groupRules) > 0 {
			groupColumns := make([]string, 0)
			groupSqls := make([]string, 0)
			for _, ruleName := range groupRules {
				switch ruleName {
				case constant.Day:
					groupColumns = append(groupColumns, "t.day")
					groupSqls = append(groupSqls, fmt.Sprintf(`TO_CHAR("%s", 'yyyy-mm-dd') as "day"`, fieldProject.FieldName))
				case constant.Month:
					groupColumns = append(groupColumns, "t.month")
					groupSqls = append(groupSqls, fmt.Sprintf(`TO_CHAR("%s", 'yyyy-mm') as "month"`, fieldProject.FieldName))
				case constant.Year:
					groupColumns = append(groupColumns, "t.year")
					groupSqls = append(groupSqls, fmt.Sprintf(`TO_CHAR("%s", 'yyyy') as "year"`, fieldProject.FieldName))
				}
			}
			groupSql := strings.Replace(nsql.GroupSql, "${group_column_name}", strings.Join(groupColumns, ", "), -1)
			groupSql = strings.Replace(groupSql, "${group_sql}", strings.Join(groupSqls, ", "), -1)
			groupSql = strings.Replace(groupSql, "${column_name}", fieldProject.FieldName, -1)
			groupSql, err = e.generateSql(groupSql, tableInfo, exploreReq.TotalSample, fieldProject)
			if err != nil {
				return nil, nil, statisticsSql, mergeSql, groupMap, err
			}
			groupMap[fieldProject.FieldName] = groupSql
			sqls = append(sqls, groupSql)
		}
	}
	if len(statisticsSqls) > 0 {
		statisticsSql = strings.Replace(nsql.StatisticsSql, "${sql}", strings.Join(statisticsSqls, ","), -1)
		statisticsSql, err = e.generateSql(statisticsSql, tableInfo, exploreReq.TotalSample, nil)
		if err != nil {
			return nil, nil, statisticsSql, mergeSql, groupMap, err
		}
		log.WithContext(ctx).Infof("统计类合并规则为: %s", statisticsSql)
	}
	if len(mergeSqls) > 0 {
		mergeSql = strings.Replace(nsql.MergeSql, "${sql}", strings.Join(mergeSqls, ","), -1)
		mergeSql, err = e.generateSql(mergeSql, tableInfo, exploreReq.TotalSample, nil)
		if err != nil {
			return nil, nil, statisticsSql, mergeSql, groupMap, err
		}
		log.WithContext(ctx).Infof("空值、枚举值、格式检查合并规则为: %s", mergeSql)
	}
	return sqlMap, sqls, statisticsSql, mergeSql, groupMap, nil
}

// RowAsyncExplore 行级探查
func RowExploreSqlGenerate(exploreReq *exploration.DataExploreReq, e *ExplorationDomainImplV2, ctx context.Context, tableInfo exploration.MetaDataTableInfo) (map[string]string, []string, error) {
	sqlMap := make(map[string]string)
	sqls := make([]string, 0)
	var err error
	for _, project := range exploreReq.RowExplore {
		var sql string
		res := &exploration.RuleConfig{}
		if project.RuleConfig != nil {
			err := json.Unmarshal([]byte(*project.RuleConfig), res)
			if err != nil {
				log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
				return nil, nil, errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
			}
		}
		if project.RuleName == constant.RowNull || project.DimensionType == constant.DimensionTypeRowNull.String {
			sql = GetRowNullSql(res, tableInfo)
			sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, nil)
			if err != nil {
				return nil, nil, err
			}
		} else if project.RuleName == constant.RowUnique || project.DimensionType == constant.DimensionTypeRowRepeat.String {
			var columnNames, columnNotNull string
			for _, id := range res.RowRepeat.FieldIds {
				if columnNotNull == "" {
					columnNames = fmt.Sprintf(`"%s"`, tableInfo.Columns[id].Name)
					columnNotNull = fmt.Sprintf(`"%s" is NOT NULL `, tableInfo.Columns[id].Name)
				} else {
					columnNames = fmt.Sprintf(`%s,"%s"`, columnNames, tableInfo.Columns[id].Name)
					columnNotNull = fmt.Sprintf(`%s AND "%s" is NOT NULL`, columnNotNull, tableInfo.Columns[id].Name)
				}
			}
			sql = strings.Replace(nsql.RowUnique, "${column_names}", columnNames, -1)
			sql = strings.Replace(sql, "${column_not_null}", columnNotNull, -1)
			if exploreReq.TotalSample > 0 {
				limitSql := fmt.Sprintf(`ORDER BY RAND() LIMIT %d`, exploreReq.TotalSample)
				sql = strings.Replace(sql, "${limit}", limitSql, -1)
			} else {
				sql = strings.Replace(sql, "${limit}", "", -1)
			}
		} else {
			var ruleExpressionSql, filterSql string
			if res.Filter != nil {
				if res.Filter.Where != nil {
					filterSql, err = getWhereSQL(res.Filter.Where, res.Filter.WhereRelation, tableInfo, "")
					if err != nil {
						return nil, nil, err
					}
				} else {
					filterSql = strings.TrimSuffix(res.Filter.Sql, ";")
				}
			}
			if res.RuleExpression.Where != nil {
				if res.Filter != nil {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "tmp_table")
					sql = strings.Replace(nsql.CustomRule, "${rule_expression}", ruleExpressionSql, -1)
					sql = strings.Replace(sql, "${filter}", filterSql, -1)
				} else {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "")
					sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
				}
			} else {
				ruleExpressionSql = strings.TrimSuffix(res.RuleExpression.Sql, ";")
				sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
			}
		}
		if sql != "" {
			sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, nil)
			if err != nil {
				return nil, nil, err
			}
			ruleName := fmt.Sprintf("行级:%s", project.RuleName)
			sqlMap[ruleName] = sql
			sqls = append(sqls, sql)
		}
	}
	return sqlMap, sqls, nil
}

func ViewExploreSqlGenerate(exploreReq *exploration.DataExploreReq, e *ExplorationDomainImplV2, ctx context.Context, tableInfo exploration.MetaDataTableInfo) (map[string]string, []string, error) {
	sqlMap := make(map[string]string)
	sqls := make([]string, 0)
	var err error
	for _, project := range exploreReq.ViewExplore {
		res := &exploration.RuleConfig{}
		if project.RuleConfig != nil {
			err := json.Unmarshal([]byte(*project.RuleConfig), res)
			if err != nil {
				log.WithContext(ctx).Errorf("解析探查规则配置失败，err is %v", err)
				return nil, nil, errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
			}
		}
		if project.RuleName == constant.Update || project.Dimension == constant.DimensionTimeliness.String {
			continue
		} else {
			var ruleExpressionSql, filterSql, sql string
			if res.Filter != nil {
				if res.Filter.Where != nil {
					filterSql, err = getWhereSQL(res.Filter.Where, res.Filter.WhereRelation, tableInfo, "")
					if err != nil {
						return nil, nil, err
					}
				} else {
					filterSql = strings.TrimSuffix(res.Filter.Sql, ";")
				}
			}
			if res.RuleExpression.Where != nil {
				if res.Filter != nil {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "tmp_table")
					sql = strings.Replace(nsql.CustomRule, "${rule_expression}", ruleExpressionSql, -1)
					sql = strings.Replace(sql, "${filter}", filterSql, -1)
				} else {
					ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "")
					sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
				}
			} else {
				ruleExpressionSql = strings.TrimSuffix(res.RuleExpression.Sql, ";")
				sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
			}
			sql, err = e.generateSql(sql, tableInfo, exploreReq.TotalSample, nil)
			if err != nil {
				return nil, nil, err
			}
			ruleName := fmt.Sprintf("视图数据级:%s", project.RuleName)
			sqlMap[ruleName] = sql
			sqls = append(sqls, sql)
		}
	}
	return sqlMap, sqls, nil
}

// saveAsyncExploreRecord 保存异步探查项目
func (e *ExplorationDomainImplV2) saveAsyncExploreDataRecord(tx *gorm.DB, c context.Context, sqlMap map[string]string,
	statisticsSql, mergeSql string, groupMap map[string]string, reportCode string, exploreReq *exploration.DataExploreReq) ([]*model.ReportItem, error) {
	now := time.Now()
	items := make([]*model.ReportItem, 0)
	i := 0
	if statisticsSql != "" {
		i++
	}
	if mergeSql != "" {
		i++
	}
	if exploreReq.FieldExplore != nil {
		for _, fieldRule := range exploreReq.FieldExplore {
			hasGroupRule := false
			for _, rule := range fieldRule.Projects {
				ruleName := fmt.Sprintf("字段级(%s):%s", fieldRule.FieldName, rule.RuleName)
				item := &model.ReportItem{
					Code:          &reportCode,
					Column:        &fieldRule.FieldName,
					Params:        &fieldRule.Params,
					CreatedAt:     &now,
					RuleId:        &rule.RuleId,
					Project:       &rule.RuleName,
					Status:        util.ValueToPtr(constant.Explore_Status_Excuting),
					DimensionType: &rule.DimensionType,
				}
				sql, exist := sqlMap[ruleName]
				if exist {
					item.Sql = &sql
					items = append(items, item)
					i++
				} else {
					if rule.Dimension == constant.DimensionDataStatistics.String {
						if rule.RuleName == constant.Day || rule.RuleName == constant.Month || rule.RuleName == constant.Year {
							groupSql := groupMap[fieldRule.FieldName]
							item.Sql = &groupSql
							hasGroupRule = true
						} else {
							item.Sql = &statisticsSql
						}
					} else {
						item.Sql = &mergeSql
					}
					items = append(items, item)
				}
			}
			if hasGroupRule {
				i++
			}
		}
	}
	if exploreReq.RowExplore != nil {
		for _, rule := range exploreReq.RowExplore {
			ruleName := fmt.Sprintf("行级:%s", rule.RuleName)
			if sql, exist := sqlMap[ruleName]; exist {
				item := &model.ReportItem{
					Code:          &reportCode,
					CreatedAt:     &now,
					RuleId:        &rule.RuleId,
					Project:       &rule.RuleName,
					Status:        util.ValueToPtr(constant.Explore_Status_Excuting),
					Sql:           &sql,
					DimensionType: &rule.DimensionType,
				}
				items = append(items, item)
				i++
			}
		}
	}
	if exploreReq.ViewExplore != nil {
		for _, rule := range exploreReq.ViewExplore {
			if rule.RuleName == constant.Update {
				continue
			}
			ruleName := fmt.Sprintf("视图数据级:%s", rule.RuleName)
			if sql, exist := sqlMap[ruleName]; exist {
				item := &model.ReportItem{
					Code:      &reportCode,
					CreatedAt: &now,
					RuleId:    &rule.RuleId,
					Project:   &rule.RuleName,
					Status:    util.ValueToPtr(constant.Explore_Status_Excuting),
					Sql:       &sql,
				}
				items = append(items, item)
				i++
			}
		}
	}

	return items, nil
}

func toFieldReportItem(tableInfo exploration.MetaDataTableInfo, fieldProject *exploration.ExploreField, project *exploration.Project) *model.ReportItem {
	now := time.Now()
	return &model.ReportItem{
		Code:          tableInfo.Code,
		Column:        &fieldProject.FieldName,
		RuleId:        &project.RuleId,
		Project:       &project.RuleName,
		Params:        &fieldProject.Params,
		Status:        util.ValueToPtr(constant.Explore_Status_Excuting),
		CreatedAt:     &now,
		DimensionType: &project.DimensionType,
	}
}

func GetFieldNullSql(res *exploration.RuleConfig, fieldId string, tableInfo exploration.MetaDataTableInfo, ruleId string) (sql string, err error) {
	dataType := constant.DataType2string(tableInfo.Columns[fieldId].Type)
	fieldName := tableInfo.Columns[fieldId].Name
	if res.Null != nil {
		var fieldNullConfig string
		for _, config := range res.Null {
			if dataType == constant.DataTypeChar.String {
				if config == " " {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`trim(cast("%s" as string)) = ' '`, fieldName)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or trim(cast("%s" as string)) = ' '`, fieldNullConfig, fieldName)
					}
				} else if config == "NULL" {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" is NULL`, fieldName)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, fieldNullConfig, fieldName)
					}
				} else {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" = '%s'`, fieldName, config)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" = '%s'`, fieldNullConfig, fieldName, config)
					}
				}
			} else if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
				if config == "NULL" {
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" is NULL`, fieldName)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, fieldNullConfig, fieldName)
					}
				} else {
					num, err := strconv.ParseInt(config, 10, 64)
					if err != nil {
						log.Errorf("getFormatResult ParseInt err: %v", err)
						return sql, errorcode.Detail(errorcode.PublicInvalidParameter, "空值配置不合法")
					}
					if fieldNullConfig == "" {
						fieldNullConfig = fmt.Sprintf(`"%s" = %d`, fieldName, num)
					} else {
						fieldNullConfig = fmt.Sprintf(`%s or "%s" = %d`, fieldNullConfig, fieldName, num)
					}
				}
			} else {
				if fieldNullConfig == "" {
					fieldNullConfig = fmt.Sprintf(`"%s" is NULL `, fieldName)
				} else {
					fieldNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, fieldNullConfig, fieldName)
				}
			}
		}
		sql = strings.Replace(nsql.Null, "${null_config}", fieldNullConfig, -1)
		sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, tableInfo.Columns[fieldId].Name), -1)
	}
	return sql, nil
}

func GetFieldUniqueSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Unique, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldDictSql(res *exploration.RuleConfig, fieldId string, tableInfo exploration.MetaDataTableInfo, ruleId string) (sql string, err error) {
	if res.Dict == nil {
		return sql, errorcode.Detail(errorcode.PublicInvalidParameterJson, "规则配置错误")
	}
	dataType := constant.DataType2string(tableInfo.Columns[fieldId].Type)
	err_desc := fmt.Sprintf("字段级(%s):%s", tableInfo.Columns[fieldId].Name, constant.Dict)
	var dictSql string
	for _, data := range res.Dict.Data {
		if dataType == constant.DataTypeChar.String {
			if dictSql == "" {
				dictSql = fmt.Sprintf(`'%s'`, data.Code)
			} else {
				dictSql = fmt.Sprintf(`%s,'%s'`, dictSql, data.Code)
			}
		} else if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			switch dataType {
			case constant.DataTypeInt.String:
				num, err := strconv.ParseInt(data.Code, 10, 64)
				if err != nil {
					log.Errorf("getFormatResult ParseInt err: %v", err)
					return sql, errorcode.New(errorcode.ExploreSqlError, err_desc, "", "", "", "")
				}
				if dictSql == "" {
					dictSql = fmt.Sprintf(`%d`, num)
				} else {
					dictSql = fmt.Sprintf(`%s,%d`, dictSql, num)
				}
			case constant.DataTypeFloat.String, constant.DataTypeDecimal.String:
				num, err := strconv.ParseFloat(data.Code, 64)
				if err != nil {
					log.Errorf("getFormatResult ParseFloat err: %v", err)
					return sql, errorcode.New(errorcode.ExploreSqlError, err_desc, "", "", "", "")
				}
				if dictSql == "" {
					dictSql = fmt.Sprintf(`%f`, num)
				} else {
					dictSql = fmt.Sprintf(`%s,%f`, dictSql, num)
				}
			}
		}
	}
	sql = strings.Replace(nsql.Dict, "${column_name}", tableInfo.Columns[fieldId].Name, -1)
	sql = strings.Replace(sql, "${dict_config}", dictSql, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, tableInfo.Columns[fieldId].Name), -1)
	return sql, nil
}

func GetFieldRegexpSql(res *exploration.RuleConfig, fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Regexp, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${regexp_config}", res.Format.Regex, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldMaxSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Max, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldMinSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Min, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldQuantileSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Quantile, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${quantile_25}", fmt.Sprintf("%s_quantile_25", ruleId), -1)
	sql = strings.Replace(sql, "${quantile_50}", fmt.Sprintf("%s_quantile_50", ruleId), -1)
	sql = strings.Replace(sql, "${quantile_75}", fmt.Sprintf("%s_quantile_75", ruleId), -1)
	return sql
}

func GetFieldAvgSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.Avg, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldStddevPopSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.StddevPop, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldTrueSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.True, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldFalseSql(fieldName, ruleId string) (sql string) {
	sql = strings.Replace(nsql.False, "${column_name}", fieldName, -1)
	sql = strings.Replace(sql, "${rule_id}", fmt.Sprintf("%s_%s", ruleId, fieldName), -1)
	return sql
}

func GetFieldRuleExpressionSql(res *exploration.RuleConfig, tableInfo exploration.MetaDataTableInfo) (sql string, err error) {
	var ruleExpressionSql, filterSql string
	if res.Filter != nil {
		if res.Filter.Where != nil {
			filterSql, err = getWhereSQL(res.Filter.Where, res.Filter.WhereRelation, tableInfo, "")
			if err != nil {
				return sql, err
			}
		} else {
			filterSql = strings.TrimSuffix(res.Filter.Sql, ";")
		}
	}
	if res.RuleExpression.Where != nil {
		if filterSql != "" {
			ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "tmp_table")
			sql = strings.Replace(nsql.CustomRule, "${rule_expression}", ruleExpressionSql, -1)
			sql = strings.Replace(sql, "${filter}", filterSql, -1)
		} else {
			ruleExpressionSql, err = getWhereSQL(res.RuleExpression.Where, res.RuleExpression.WhereRelation, tableInfo, "")
			sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
		}
	} else {
		ruleExpressionSql = strings.TrimSuffix(res.RuleExpression.Sql, ";")
		sql = strings.Replace(nsql.CustomRuleExpression, "${rule_expression}", ruleExpressionSql, -1)
	}
	return sql, nil
}

func GetRowNullSql(res *exploration.RuleConfig, tableInfo exploration.MetaDataTableInfo) (sql string) {
	if res.RowNull != nil {
		var rowNullConfig string
		for _, config := range res.RowNull.Config {
			for _, id := range res.RowNull.FieldIds {
				dataType := constant.DataType2string(tableInfo.Columns[id].Type)
				if config == " " && dataType == constant.DataTypeChar.String {
					if rowNullConfig == "" {
						rowNullConfig = fmt.Sprintf(`trim(cast("%s" as string)) = ' '`, tableInfo.Columns[id].Name)
					} else {
						rowNullConfig = fmt.Sprintf(`%s or trim(cast("%s" as string)) = ' '`, rowNullConfig, tableInfo.Columns[id].Name)
					}
				}
				if config == "0" && (dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String) {
					if rowNullConfig == "" {
						rowNullConfig = fmt.Sprintf(`"%s" = 0 `, tableInfo.Columns[id].Name)
					} else {
						rowNullConfig = fmt.Sprintf(`%s or "%s" = 0`, rowNullConfig, tableInfo.Columns[id].Name)
					}
				}
				if config == "NULL" {
					if rowNullConfig == "" {
						rowNullConfig = fmt.Sprintf(`"%s" is NULL `, tableInfo.Columns[id].Name)
					} else {
						rowNullConfig = fmt.Sprintf(`%s or "%s" is NULL`, rowNullConfig, tableInfo.Columns[id].Name)
					}
				}
			}
		}
		sql = strings.Replace(nsql.RowNull, "${row_null_config}", rowNullConfig, -1)
	}
	return sql
}

func getWhereSQL(where []*exploration.Where, whereRelation string, tableInfo exploration.MetaDataTableInfo, tableName string) (whereSQL string, err error) {
	var whereArgs []string
	for _, v := range where {
		var wherePreGroupFormat string
		for _, vv := range v.Member {
			var opAndValueSQL string
			columnName := tableInfo.Columns[vv.FieldId].Name
			if tableName != "" {
				columnName = fmt.Sprintf(`"%s"."%s" `, tableName, columnName)
			}
			opAndValueSQL, err = whereOPAndValueFormat(tableInfo.Columns[vv.FieldId].Name, vv.Operator, vv.Value, constant.DataType2string(tableInfo.Columns[vv.FieldId].Type))
			if err != nil {
				return
			}
			if wherePreGroupFormat != "" {
				wherePreGroupFormat = wherePreGroupFormat + " " + v.Relation + " " + opAndValueSQL
			} else {
				wherePreGroupFormat = opAndValueSQL
			}
		}
		wherePreGroupFormat = "(" + wherePreGroupFormat + ")"
		whereArgs = append(whereArgs, wherePreGroupFormat)

	}
	if whereRelation != "" {
		whereRelation = fmt.Sprintf(` %s `, whereRelation)
	} else {
		whereRelation = " AND "
	}
	whereSQL = strings.Join(whereArgs, whereRelation)
	return
}

func whereOPAndValueFormat(name, op, value, dataType string) (whereBackendSql string, err error) {
	special := strings.NewReplacer(`\`, `\\\\`, `'`, `\'`, `%`, `\%`, `_`, `\_`)
	switch op {
	case "<", "<=", ">", ">=":
		if _, err = strconv.ParseFloat(value, 64); err != nil {
			return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
		}
		whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, op, value)
	case "=", "<>":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, op, value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, op, value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}

	case "=dict":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, "=", value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, "=", value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "<>dict":
		if dataType == constant.DataTypeInt.String || dataType == constant.DataTypeFloat.String || dataType == constant.DataTypeDecimal.String {
			if _, err = strconv.ParseFloat(value, 64); err != nil {
				return whereBackendSql, errorcode.Desc(errorcode.PublicInvalidParameter)
			}
			whereBackendSql = fmt.Sprintf(`"%s" %s %s`, name, "<>", value)
		} else if dataType == constant.DataTypeChar.String {
			whereBackendSql = fmt.Sprintf(`"%s" %s '%s'`, name, "<>", value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}

	case "null":
		whereBackendSql = fmt.Sprintf(`"%s" IS NULL`, name)
	case "not null":
		whereBackendSql = fmt.Sprintf(`"%s" IS NOT NULL`, name)
	case "include":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" LIKE '%s'`, name, "%"+value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "not include":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" NOT LIKE '%s'`, name, "%"+value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "prefix":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" LIKE '%s'`, name, value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "not prefix":
		if dataType == constant.DataTypeChar.String {
			value = special.Replace(value)
			whereBackendSql = fmt.Sprintf(`"%s" NOT LIKE '%s'`, name, value+"%")
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "in list":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.DataTypeChar.String {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf(`"%s" IN %s`, name, "("+value+")")
	case "belong":
		valueList := strings.Split(value, ",")
		for i := range valueList {
			if dataType == constant.DataTypeChar.String {
				valueList[i] = "'" + valueList[i] + "'"
			}
		}
		value = strings.Join(valueList, ",")
		whereBackendSql = fmt.Sprintf(`"%s" IN %s`, name, "("+value+")")
	case "true":
		whereBackendSql = fmt.Sprintf(`"%s" = true`, name)
	case "false":
		whereBackendSql = fmt.Sprintf(`"%s" = false`, name)
	case "before":
		valueList := strings.Split(value, " ")
		whereBackendSql = fmt.Sprintf(`"%s" >= DATE_add('%s', -%s, CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai') AND "%s" <= CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai'`, name, valueList[1], valueList[0], name)
	case "current":
		if value == "%Y" || value == "%Y-%m" || value == "%Y-%m-%d" || value == "%Y-%m-%d %H" || value == "%Y-%m-%d %H:%i" || value == "%x-%v" {
			whereBackendSql = fmt.Sprintf(`DATE_FORMAT("%s", '%s') = DATE_FORMAT(CURRENT_TIMESTAMP AT TIME ZONE 'UTC' AT TIME ZONE 'Asia/Shanghai', '%s')`, name, value, value)
		} else {
			return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
		}
	case "between":
		valueList := strings.Split(value, ",")
		whereBackendSql = fmt.Sprintf(`"%s" BETWEEN DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP)) AND DATE_TRUNC('minute', CAST('%s' AS TIMESTAMP))`, name, valueList[0], valueList[1])
	default:
		return "", errorcode.Desc(errorcode.WhereOpNotAllowed)
	}
	return
}

// timestampAsyncExplore 时间戳探查
func timestampReportItemGenerate(exploreReq *exploration.DataExploreReq, e *ExplorationDomainImplV2, c context.Context, reportEntity *model.Report) ([]*model.ReportItem, error) {
	var (
		reportItems []*model.ReportItem
	)
	emptyStr := ""
	timeNow := time.Now()
	reportItems = make([]*model.ReportItem, 0, len(exploreReq.FieldExplore))
	for i := range exploreReq.FieldExplore {
		reportItems = append(reportItems, &model.ReportItem{
			Code:      reportEntity.Code,
			Column:    util.ValueToPtr(exploreReq.FieldExplore[i].FieldName),
			Params:    &emptyStr,
			Status:    util.ValueToPtr(constant.Explore_Status_Undo),
			CreatedAt: &timeNow,
		})
		if len(exploreReq.FieldExplore[i].Code) > 0 {
			reportItems[len(reportItems)-1].Project = &exploreReq.FieldExplore[i].Code[0]
		}
		sql := strings.Replace(nsql.TimeStampRule, "${column_name}", exploreReq.FieldExplore[i].FieldName, -1)
		sql = getSql(sql, nsql.T)
		// 数据库表信息替换
		sql = strings.Replace(sql, "${schema_name}", exploreReq.Schema, -1)
		sql = strings.Replace(sql, "${name}", exploreReq.Table, -1)
		sql = strings.Replace(sql, "${ve_catalog_id}", exploreReq.VeCatalog, -1)
		reportItems[len(reportItems)-1].Sql = &sql
	}
	return reportItems, nil
}

// newExploreFinishedMsg 创建数据异步探查时间戳完成消息
func newExploreFinishedMsg(ctx context.Context, report *model.Report) (msg string, err error) {
	exploreFinishedMsg := &exploration.ExploreFinishedMsg{
		TableId: *report.TableID,
		TaskId:  strconv.FormatUint(report.TaskID, 10),
		Result:  *report.Result,
	}
	b, err := json.Marshal(exploreFinishedMsg)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", exploreFinishedMsg, err)
		return msg, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg = string(b)
	return msg, err
}

// newExploreDataFinishedMsg 创建数据异步探查数据完成消息
func newExploreDataFinishedMsg(ctx context.Context, report *model.Report) (msg string, err error) {
	exploreDataFinishedMsg := &exploration.ExploreDataFinishedMsg{
		TableId:     *report.TableID,
		TaskId:      strconv.FormatUint(report.TaskID, 10),
		TaskVersion: report.TaskVersion,
		FinishedAt:  report.FinishedAt.UnixMilli(),
	}
	b, err := json.Marshal(exploreDataFinishedMsg)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal failed, body: %v, err: %v", exploreDataFinishedMsg, err)
		return msg, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg = string(b)
	return msg, err
}
