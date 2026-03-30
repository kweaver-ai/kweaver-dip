package v1

import (
	"bytes"
	"context"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/explore_task"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"encoding/json"
	"fmt"
	"github.com/jung-kurt/gofpdf"
	"github.com/shopspring/decimal"
	"io/ioutil"
	"os"
	"strings"
	"time"
)

func (f *formViewUseCase) GetOverview(ctx context.Context, req *form_view.GetOverviewReq) (*form_view.GetOverviewResp, error) {
	// 根据部门id和owner_id筛选逻辑视图列表
	formViews, err := f.repo.GetList(ctx, req.DepartmentID, req.OwnerIDs, "")
	if err != nil {
		return nil, err
	}
	if len(formViews) == 0 {
		return &form_view.GetOverviewResp{}, nil
	}
	formViewIds := make([]string, 0)
	for _, formView := range formViews {
		formViewIds = append(formViewIds, formView.ID)
	}
	reportsReq := &form_view.GetDataExploreReportsReq{
		TableIds: formViewIds,
	}
	srcData, err := f.GetReports(ctx, reportsReq)
	if err != nil {
		return nil, err
	}
	resp := CalculateViewStats(srcData.Entries)
	resp.TotalViews = int64(len(formViewIds))
	return resp, nil
}

func (f *formViewUseCase) GetReports(ctx context.Context, req *form_view.GetDataExploreReportsReq) (*form_view.GetDataExploreReportsResp, error) {
	buf, err := json.Marshal(req)
	if err != nil {
		log.WithContext(ctx).Errorf("json.Marshal data-exploration-service formViewIds 失败，err is %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	rBuf, err := f.dataExploration.GetReports(ctx, bytes.NewReader(buf))
	if rBuf == nil {
		return nil, nil
	}
	srcData := &form_view.GetDataExploreReportsResp{}
	if err = json.Unmarshal(rBuf, srcData); err != nil {
		log.WithContext(ctx).Errorf("解析获取视图最新报告失败，err is %v", err)
		return nil, errorcode.Detail(my_errorcode.DataExplorationGetReportError, err)
	}
	return srcData, nil
}

// 计算视图统计信息
func CalculateViewStats(reports []*form_view.SrcReportData) *form_view.GetOverviewResp {
	if len(reports) == 0 {
		return &form_view.GetOverviewResp{}
	}

	// 初始化累加变量和计数器
	var (
		sumTotal, sumCompleteness, sumUniqueness, sumStandardization, sumAccuracy, sumConsistency             float64
		countTotal, countCompleteness, countUniqueness, countStandardization, countAccuracy, countConsistency int64
		validScores                                                                                           []float64 // 存储有效的总分
	)

	// 遍历所有视图，累加各维度分数（忽略nil指针）
	for _, view := range reports {
		if view.TotalScore != nil {
			total := float64(*view.TotalScore)
			sumTotal += total
			countTotal++
			validScores = append(validScores, total)
		}
		if view.CompletenessScore != nil {
			sumCompleteness += float64(*view.CompletenessScore)
			countCompleteness++
		}
		if view.UniquenessScore != nil {
			sumUniqueness += float64(*view.UniquenessScore)
			countUniqueness++
		}
		if view.StandardizationScore != nil {
			sumStandardization += float64(*view.StandardizationScore)
			countStandardization++
		}
		if view.AccuracyScore != nil {
			sumAccuracy += float64(*view.AccuracyScore)
			countAccuracy++
		}
		if view.ConsistencyScore != nil {
			sumConsistency += float64(*view.ConsistencyScore)
			countConsistency++
		}
	}

	// 计算平均分（只统计非null的分数）
	stats := &form_view.GetOverviewResp{
		ExploredViews: int64(len(reports)),
	}

	stats.AverageScore = formatCalculateScoreResult(sumTotal, countTotal)
	stats.CompletenessAverageScore = formatCalculateScoreResult(sumCompleteness, countCompleteness)
	stats.UniquenessAverageScore = formatCalculateScoreResult(sumUniqueness, countUniqueness)
	stats.StandardizationAverageScore = formatCalculateScoreResult(sumStandardization, countStandardization)
	stats.AccuracyAverageScore = formatCalculateScoreResult(sumAccuracy, countAccuracy)
	stats.ConsistencyAverageScore = formatCalculateScoreResult(sumConsistency, countConsistency)

	// 统计高于和低于平均分的视图数量（仅针对有总分的视图）
	if countTotal > 0 {
		for _, score := range validScores {
			if stats.AverageScore != nil && score > *stats.AverageScore {
				stats.AboveAverageViews++
			} else if stats.AverageScore != nil && score < *stats.AverageScore {
				stats.BelowAverageViews++
			}
		}
	}

	return stats
}

func formatCalculateScoreResult(count1 float64, count2 int64) *float64 {
	formatResult := float64(0)
	if count2 != 0 {
		formatResult, _ = decimal.NewFromFloat(count1 / float64(count2)).RoundFloor(4).Float64()
		return &formatResult
	} else {
		return nil
	}
}

func (f *formViewUseCase) GetExploreReports(ctx context.Context, req *form_view.GetExploreReportsReq) (*form_view.GetExploreReportsResp, error) {
	formViews, err := f.repo.GetList(ctx, req.DepartmentID, req.OwnerIDs, req.Keyword)
	if err != nil {
		return nil, err
	}
	if len(formViews) == 0 {
		return &form_view.GetExploreReportsResp{}, nil
	}
	formViewIds := make([]string, 0)
	formViewNameMap := make(map[string]string)
	for _, formView := range formViews {
		formViewIds = append(formViewIds, formView.ID)
		formViewNameMap[formView.ID] = formView.BusinessName
	}
	reportsReq := &form_view.GetDataExploreReportsReq{
		TableIds:  formViewIds,
		Offset:    req.Offset,
		Limit:     req.Limit,
		Direction: req.Direction,
		Sort:      req.Sort,
	}
	srcData, err := f.GetReports(ctx, reportsReq)
	if err != nil {
		return nil, err
	}
	if srcData == nil || len(srcData.Entries) == 0 {
		return &form_view.GetExploreReportsResp{}, nil
	}
	reportInfos := make([]*form_view.ExploreReportInfo, 0)
	for _, report := range srcData.Entries {
		reportInfo := &form_view.ExploreReportInfo{
			FormViewID:           report.TableId,
			TechnicalName:        report.Table,
			BusinessName:         formViewNameMap[report.TableId],
			TotalScore:           report.TotalScore,
			CompletenessScore:    report.CompletenessScore,
			UniquenessScore:      report.UniquenessScore,
			StandardizationScore: report.StandardizationScore,
			AccuracyScore:        report.AccuracyScore,
			ConsistencyScore:     report.ConsistencyScore,
		}
		reportInfos = append(reportInfos, reportInfo)
	}
	return &form_view.GetExploreReportsResp{
		PageResult: response.PageResult[form_view.ExploreReportInfo]{
			Entries:    reportInfos,
			TotalCount: srcData.TotalCount,
		}}, nil
}

func (f *formViewUseCase) ExportExploreReports(ctx context.Context, req *form_view.ExportExploreReportsReq) (*form_view.ExportExploreReportsResp, error) {
	// 创建PDF文档
	pdf := gofpdf.New("P", "mm", "A4", "")
	pdf.SetAutoPageBreak(true, 20)

	// 设置中文字体
	setChineseFont(pdf)

	// 第一页
	addCoverPage(pdf, form_view.CoverInfo{
		Title:        "数据质量稽核报告",
		EvaluateDate: "评估时间：" + time.Now().Format("2006.01.02"),
	})
	pdf.AddPage()

	// 按顺序创建三个表格，不强制分页
	formViews, err := f.repo.GetList(ctx, req.DepartmentID, req.OwnerIDs, "")
	if err != nil {
		return nil, err
	}
	if len(formViews) == 0 {
		return nil, errorcode.Desc(my_errorcode.DataExploreReportGetErr)
	}
	formViewIds := make([]string, 0)
	datasourceIds := make([]string, 0)
	ownerIds := make([]string, 0)
	formViewBusinessNameMap := make(map[string]string)
	formViewMap := make(map[string]*model.FormView)
	for _, formView := range formViews {
		formViewIds = append(formViewIds, formView.ID)
		if formView.DatasourceID != "" {
			datasourceIds = append(datasourceIds, formView.DatasourceID)
		}
		if formView.OwnerId.String != "" {
			ownerIds = append(ownerIds, formView.OwnerId.String)
		}
		formViewBusinessNameMap[formView.ID] = formView.BusinessName
		formViewMap[formView.ID] = formView
	}
	fieldBusinessNameMap, fieldTechnicalNameMap, err := f.getFieldName(ctx, formViewIds)
	if err != nil {
		return nil, err
	}
	datasourceNameMap, err := f.getDatasourceName(ctx, datasourceIds)
	if err != nil {
		return nil, err
	}
	ownerNameMap, err := f.getOwnerName(ctx, ownerIds)
	if err != nil {
		return nil, err
	}
	direction := "desc"
	sort := "f_total_score"
	reportsReq := &form_view.GetDataExploreReportsReq{
		TableIds:  formViewIds,
		Direction: &direction,
		Sort:      &sort,
	}
	srcData, err := f.GetReports(ctx, reportsReq)
	if err != nil {
		return nil, err
	}
	resp := CalculateViewStats(srcData.Entries)
	resp.TotalViews = int64(len(formViewIds))
	departmentName := ""
	departmentPrecision, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{req.DepartmentID})
	if err != nil {
		return nil, err
	}
	if departmentPrecision != nil && len(departmentPrecision.Departments) > 0 {
		departmentName = departmentPrecision.Departments[0].Name
	}
	tableInfos := getScoreTableInfo(formViewBusinessNameMap, srcData, resp.AverageScore)
	createBackgroundSection(pdf, resp, departmentName)
	createScoreTablePage(pdf, tableInfos)
	createDimensionScorePage(pdf, resp)
	if req.NeedRule {
		rules := getExploreRules(srcData, formViewBusinessNameMap, fieldBusinessNameMap, fieldTechnicalNameMap, datasourceNameMap, ownerNameMap, formViewMap)
		createExploreRulesPages(pdf, rules)
	}

	// 将PDF写入buffer
	var buf bytes.Buffer
	err = pdf.Output(&buf)
	if err != nil {
		return nil, err
	}
	fileName := fmt.Sprintf("%s-数据质量稽核报告-%s.pdf", departmentName, time.Now().Format("2006.01.02"))
	return &form_view.ExportExploreReportsResp{Buffer: &buf, FileName: fileName}, nil
}

func (f *formViewUseCase) getFieldName(ctx context.Context, formViewIds []string) (map[string]string, map[string]string, error) {
	fieldBusinessNameMap := make(map[string]string)
	fieldTechnicalNameMap := make(map[string]string)
	fields, err := f.fieldRepo.GetFieldsByFormViewIds(ctx, formViewIds)
	if err != nil {
		return nil, nil, err
	}
	for _, field := range fields {
		fieldBusinessNameMap[field.ID] = field.BusinessName
		fieldTechnicalNameMap[field.ID] = field.TechnicalName
	}
	return fieldBusinessNameMap, fieldTechnicalNameMap, nil
}

func (f *formViewUseCase) getDatasourceName(ctx context.Context, datasourceIds []string) (map[string]string, error) {
	datasourceNameMap := make(map[string]string)
	if len(datasourceIds) > 0 {
		datasources, err := f.datasourceRepo.GetByIds(ctx, datasourceIds)
		if err != nil {
			return nil, err
		}
		for _, datasource := range datasources {
			datasourceNameMap[datasource.ID] = datasource.Name
		}
	}
	return datasourceNameMap, nil
}

func (f *formViewUseCase) getOwnerName(ctx context.Context, ownerIds []string) (map[string]string, error) {
	ownerNameMap := make(map[string]string)
	if len(ownerIds) > 0 {
		owners, err := f.userRepo.GetByUserIds(ctx, ownerIds)
		if err != nil {
			return nil, err
		}
		for _, owner := range owners {
			ownerNameMap[owner.ID] = owner.Name
		}
	}
	return ownerNameMap, nil
}

func setChineseFont(pdf *gofpdf.Fpdf) {
	if _, err := os.Stat("cmd/server/fonts/simfang.ttf"); err == nil {
		// 使用更简单的方法添加字体
		fontData, err := ioutil.ReadFile("cmd/server/fonts/simfang.ttf")
		if err != nil {
			fmt.Printf("读取字体文件失败 %s: %v\n", "cmd/server/fonts/simfang.ttf", err)
		}
		pdf.AddUTF8FontFromBytes("zh", "", fontData)
		pdf.SetFont("zh", "", 12)
		fmt.Printf("使用字体文件: %s\n", "cmd/server/fonts/simfang.ttf")
	}
	if _, err := os.Stat("cmd/server/fonts/simhei.ttf"); err == nil {
		// 使用更简单的方法添加字体
		fontData, err := ioutil.ReadFile("cmd/server/fonts/simhei.ttf")
		if err != nil {
			fmt.Printf("读取字体文件失败 %s: %v\n", "cmd/server/fonts/simhei.ttf", err)

		}
		pdf.AddUTF8FontFromBytes("zh", "B", fontData)
		pdf.SetFont("zh", "B", 16)
		fmt.Printf("使用字体文件: %s\n", "cmd/server/fonts/simhei.ttf")
	}
	return
}

func addCoverPage(pdf *gofpdf.Fpdf, c form_view.CoverInfo) {
	pdf.AddPage()

	// 页面尺寸与边距
	pageW, pageH := pdf.GetPageSize()

	// 居中大标题
	pdf.SetFont("zh", "B", 28)

	title := c.Title
	titleW := pdf.GetStringWidth(title)
	x := (pageW - titleW) / 2
	y := pageH * 0.4 // 垂直居中略偏上
	pdf.Text(x, y, title)

	// 左下角信息
	pdf.SetFont("zh", "", 12)
	baseY := y + 80
	evaluatorW := pdf.GetStringWidth(c.EvaluateDate)
	x = (pageW - evaluatorW) / 2
	pdf.Text(x, baseY+8, c.EvaluateDate)
}

// 数据质量评估背景和范围
func createBackgroundSection(pdf *gofpdf.Fpdf, info *form_view.GetOverviewResp, departmentName string) {
	// 检查是否需要新页面
	_, pageHeight := pdf.GetPageSize()
	_, top, _, bottom := pdf.GetMargins()
	usableHeight := pageHeight - top - bottom

	if pdf.GetY() > usableHeight-150 {
		pdf.AddPage()
	}

	// 设置大标题
	pdf.SetFontSize(18)
	pdf.SetFontStyle("B")
	title := "数据质量评估报告"
	pdf.CellFormat(0, 25, title, "", 1, "C", false, 0, "")

	// 设置章节标题
	pdf.SetFontSize(16)
	pdf.SetFontStyle("B")
	sectionTitle := "一、数据质量评估背景和范围"
	pdf.CellFormat(0, 20, sectionTitle, "", 1, "L", false, 0, "")

	// 设置正文内容
	pdf.SetFontSize(12)
	pdf.SetFontStyle("")

	// 正文内容
	content := fmt.Sprintf("    根据数据质量部门「%s」库表的统计，此部门的表数量为「%d」张，探查覆盖量为「%d」张，计算得到表的平均分为「%s」分，其中高于平均分的有「%d」张，低于平均分的有「%d」张。维度评分包含的准确性平均分为「%s」、完整性平均分为「%s」、一致性的平均分为「%s」、唯一性平均分为「%s」、规范性平均分为「%s」。",
		departmentName, info.TotalViews, info.ExploredViews, getScore(info.AverageScore), info.AboveAverageViews, info.BelowAverageViews, getScore(info.AccuracyAverageScore), getScore(info.CompletenessAverageScore), getScore(info.ConsistencyAverageScore), getScore(info.UniquenessAverageScore), getScore(info.StandardizationAverageScore))

	// 绘制多行文本
	pdf.MultiCell(0, 8, content, "", "L", false)
	pdf.SetFontSize(10)
	pdf.SetFontStyle("")
	note := "     注：如果未配置对应规则其平均分则显示“/”。"
	pdf.CellFormat(0, 8, note, "", 1, "L", false, 0, "")
}

func getScore(score *float64) string {
	if score == nil {
		return "/"
	}
	// 先格式化为带两位小数的字符串
	formatted := fmt.Sprintf("%.2f", *score*100)

	// 去除末尾的0和小数点（如果有）
	formatted = strings.TrimRight(formatted, "0")
	formatted = strings.TrimRight(formatted, ".")
	return formatted
}

func getScoreTableInfo(formViewBusinessNameMap map[string]string, srcData *form_view.GetDataExploreReportsResp, averageScore *float64) []*form_view.ScoreTable {
	tableInfos := make([]*form_view.ScoreTable, 0)
	i := 1
	score := 0.0
	for _, report := range srcData.Entries {
		tableInfo := &form_view.ScoreTable{
			TableCN: formViewBusinessNameMap[report.TableId],
			TableEN: report.Table,
			Score:   getScore(report.TotalScore),
		}
		tableInfo.Rank = fmt.Sprintf("%d", i)
		finishedAt := time.UnixMilli(report.FinishedAt)
		tableInfo.ExploreTime = finishedAt.Format("2006-01-02 15:04:05")
		tableInfos = append(tableInfos, tableInfo)
		if report.TotalScore != nil && *report.TotalScore > score {
			i++
		}
	}
	tableInfos = append(tableInfos, &form_view.ScoreTable{
		TableCN:     "平均得分",
		TableEN:     "/",
		Score:       getScore(averageScore),
		Rank:        "/",
		ExploreTime: "/",
	})
	return tableInfos
}

func createScoreTablePage(pdf *gofpdf.Fpdf, tableInfos []*form_view.ScoreTable) {
	// 检查是否需要新页面（如果当前位置太低）
	_, pageHeight := pdf.GetPageSize()
	_, top, _, bottom := pdf.GetMargins()
	usableHeight := pageHeight - top - bottom

	if pdf.GetY() > usableHeight-100 {
		pdf.AddPage()
	}

	// 设置标题
	pdf.SetFontSize(16)
	pdf.SetFontStyle("B")
	title := "二、评估结果分析"
	pdf.CellFormat(0, 20, title, "", 1, "L", false, 0, "")

	// 设置表格说明
	pdf.SetFontSize(12)
	pdf.SetFontStyle("")
	desc := "数据表得分情况如表1："
	pdf.MultiCell(0, 8, desc, "", "L", false)

	// 设置表格标题
	pdf.SetFontSize(12)
	pdf.SetFontStyle("B")
	tableTitle := "表1数据表得分"
	pdf.CellFormat(0, 15, tableTitle, "", 1, "C", false, 0, "")

	// 设置表格列宽
	colWidths := []float64{50, 50, 35, 35, 20}
	margins := []float64{3, 3, 3, 3, 3}

	// 设置表头
	headers := []string{"表中文名", "表英文名", "评分", "探查时间", "排名"}

	// 绘制表头
	pdf.SetFontSize(11)
	pdf.SetFontStyle("B")
	pdf.SetFillColor(200, 200, 220)
	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 10, header, "1", 0, "CM", true, 0, "")
	}
	pdf.Ln(-1)

	// 设置表格内容字体
	pdf.SetFontSize(10)
	pdf.SetFontStyle("")
	pdf.SetFillColor(255, 255, 255)

	// 绘制表格内容（支持自动分页）

	for _, data := range tableInfos {
		// 计算当前行所需的最大高度
		rowData := []string{data.TableCN, data.TableEN, data.Score, data.ExploreTime, data.Rank}
		maxLines := 1
		for i, text := range rowData {
			lines := calculateLinesNeeded(pdf, text, colWidths[i]-margins[i]*2)
			if lines > maxLines {
				maxLines = lines
			}
		}

		// 行高
		lineHeight := 6.0
		rowHeight := float64(maxLines)*lineHeight + 4

		// 检查是否需要分页
		if pdf.GetY()+rowHeight > usableHeight {
			pdf.AddPage()
			// 在新页面重新绘制表头
			pdf.SetFontSize(11)
			pdf.SetFontStyle("B")
			pdf.SetFillColor(200, 200, 220)
			for i, header := range headers {
				pdf.CellFormat(colWidths[i], 10, header, "1", 0, "CM", true, 0, "")
			}
			pdf.Ln(-1)
			pdf.SetFontSize(10)
			pdf.SetFontStyle("")
			pdf.SetFillColor(255, 255, 255)
		}

		// 记录起始位置
		startX, currentY := pdf.GetXY()

		// 绘制每个单元格
		currentX := startX
		for i, text := range rowData {
			drawCellWithWrap(pdf, text, currentX, currentY, colWidths[i], rowHeight, margins[i], lineHeight, "C")
			currentX += colWidths[i]
		}

		// 移动到下一行
		pdf.SetXY(startX, currentY+rowHeight)
	}

	// 表格结束后添加一些间距
	pdf.Ln(5)
}

// 表2 - 各维度得分情况
func createDimensionScorePage(pdf *gofpdf.Fpdf, info *form_view.GetOverviewResp) {
	// 表3数据
	dimensionData := make([]form_view.DimensionScore, 0)
	dimensionData = append(dimensionData, form_view.DimensionScore{
		Dimension: "完整性",
		Score:     getScore(info.CompletenessAverageScore),
	})
	dimensionData = append(dimensionData, form_view.DimensionScore{
		Dimension: "唯一性",
		Score:     getScore(info.UniquenessAverageScore),
	})
	dimensionData = append(dimensionData, form_view.DimensionScore{
		Dimension: "规范性",
		Score:     getScore(info.StandardizationAverageScore),
	})
	dimensionData = append(dimensionData, form_view.DimensionScore{
		Dimension: "准确性",
		Score:     getScore(info.AccuracyAverageScore),
	})
	dimensionData = append(dimensionData, form_view.DimensionScore{
		Dimension: "一致性",
		Score:     getScore(info.ConsistencyAverageScore),
	})

	// 检查是否需要新页面
	_, pageHeight := pdf.GetPageSize()
	_, top, _, bottom := pdf.GetMargins()
	usableHeight := pageHeight - top - bottom

	//if pdf.GetY() > usableHeight-80 {
	//	pdf.AddPage()
	//}

	// 设置表格说明
	pdf.SetFontSize(12)
	pdf.SetFontStyle("")
	desc := "对应库表在各评估维度的得分情况如表2："
	pdf.MultiCell(0, 8, desc, "", "L", false)

	// 设置表格标题
	pdf.SetFontSize(12)
	pdf.SetFontStyle("B")
	tableTitle := "表2库表各维度得分"
	pdf.CellFormat(0, 15, tableTitle, "", 1, "C", false, 0, "")

	// 设置表格列宽
	colWidths := []float64{95, 95}
	margins := []float64{3, 3}

	// 设置表头
	headers := []string{"评估维度", "评估得分"}
	// 绘制表头
	pdf.SetFontSize(11)
	pdf.SetFontStyle("B")
	pdf.SetFillColor(200, 200, 220)
	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 10, header, "1", 0, "CM", true, 0, "")
	}
	pdf.Ln(-1)

	// 设置表格内容字体
	pdf.SetFontSize(10)
	pdf.SetFontStyle("")
	pdf.SetFillColor(255, 255, 255)

	// 绘制表格内容（支持自动分页）

	for _, data := range dimensionData {
		// 计算当前行所需的最大高度
		rowData := []string{data.Dimension, data.Score}
		maxLines := 1
		for i, text := range rowData {
			lines := calculateLinesNeeded(pdf, text, colWidths[i]-margins[i]*2)
			if lines > maxLines {
				maxLines = lines
			}
		}

		// 行高
		lineHeight := 6.0
		rowHeight := float64(maxLines)*lineHeight + 4

		// 检查是否需要分页
		if pdf.GetY()+rowHeight > usableHeight {
			pdf.AddPage()
			// 在新页面重新绘制表头
			pdf.SetFontSize(11)
			pdf.SetFontStyle("B")
			pdf.SetFillColor(200, 200, 220)
			for i, header := range headers {
				pdf.CellFormat(colWidths[i], 10, header, "1", 0, "CM", true, 0, "")
			}
			pdf.Ln(-1)
			pdf.SetFontSize(10)
			pdf.SetFontStyle("")
			pdf.SetFillColor(255, 255, 255)
		}

		// 记录起始位置
		startX, currentY := pdf.GetXY()

		// 绘制每个单元格
		currentX := startX
		for i, text := range rowData {
			drawCellWithWrap(pdf, text, currentX, currentY, colWidths[i], rowHeight, margins[i], lineHeight, "C")
			currentX += colWidths[i]
		}

		// 移动到下一行
		pdf.SetXY(startX, currentY+rowHeight)
	}

	// 表格结束后添加一些间距
	pdf.Ln(5)
}

func getExploreRules(srcData *form_view.GetDataExploreReportsResp, formViewBusinessNameMap, fieldBusinessNameMap, fieldTechnicalNameMap, datasourceNameMap, ownerNameMap map[string]string, formViewMap map[string]*model.FormView) []form_view.ExploreRule {
	rules := make([]form_view.ExploreRule, 0)
	for _, report := range srcData.Entries {
		if len(report.FieldExplore) == 0 {
			continue
		}
		for _, fieldRule := range report.FieldExplore {
			for _, detail := range fieldRule.Details {
				if detail.Dimension == explore_task.DimensionDataStatistics.String {
					continue
				}
				rule := form_view.ExploreRule{
					TableEN:        report.Table,
					TableCN:        formViewBusinessNameMap[report.TableId],
					FieldEN:        fieldTechnicalNameMap[fieldRule.FieldId],
					FieldCN:        fieldBusinessNameMap[fieldRule.FieldId],
					Rule:           detail.RuleName,
					RuleDesc:       detail.RuleDescription,
					SourceSystem:   "/",
					OwnerName:      "/",
					InspectedCount: fmt.Sprintf("%d", detail.InspectedCount),
					IssueCount:     fmt.Sprintf("%d", detail.IssueCount),
				}
				datasourceId := formViewMap[report.TableId].DatasourceID
				if datasourceId != "" {
					if datasourceName, exist := datasourceNameMap[datasourceId]; exist {
						rule.SourceSystem = datasourceName
					}
				}
				ownerId := formViewMap[report.TableId].OwnerId.String
				if ownerId != "" {
					if ownerName, exist := ownerNameMap[ownerId]; exist {
						rule.OwnerName = ownerName
					}
				}
				rules = append(rules, rule)
			}
		}
	}
	return rules
}

// 数据质量稽核规则
func createExploreRulesPages(pdf *gofpdf.Fpdf, rules []form_view.ExploreRule) {
	// 检查是否需要新页面
	_, pageHeight := pdf.GetPageSize()
	_, top, _, bottom := pdf.GetMargins()
	usableHeight := pageHeight - top - bottom

	if pdf.GetY() > usableHeight-100 {
		pdf.AddPage()
	}

	// 设置标题
	pdf.SetFontSize(16)
	pdf.SetFontStyle("B")
	title := "各表对应的质量稽核规则"
	pdf.CellFormat(0, 20, title, "", 1, "L", false, 0, "")

	// 设置表格标题
	pdf.SetFontSize(12)
	pdf.SetFontStyle("B")
	title = "数据质量稽核规则"
	pdf.CellFormat(0, 20, title, "", 1, "C", false, 0, "")

	// 设置表格列宽
	colWidths := []float64{20, 20, 20, 20, 20, 20, 18, 16, 18, 18}
	margins := []float64{2, 2, 2, 2, 2, 2, 2, 2, 2, 2}

	// 设置表头
	headers := []string{
		"表英文名称", "表中文名称", "字段英文名称", "字段中文名称",
		"稽核规则", "规则描述", "来源系统",
		"数据owner", "总记录数", "问题数",
	}

	// 绘制表头
	pdf.SetFontSize(8)
	pdf.SetFontStyle("B")
	pdf.SetFillColor(200, 200, 220)
	for i, header := range headers {
		pdf.CellFormat(colWidths[i], 10, header, "1", 0, "CM", true, 0, "")
	}
	pdf.Ln(-1)

	// 设置表格内容字体
	pdf.SetFontSize(7)
	pdf.SetFontStyle("")
	pdf.SetFillColor(255, 255, 255)

	// 绘制表格内容（支持自动分页）

	for _, rule := range rules {
		// 计算当前行所需的最大高度
		rowData := []string{
			rule.TableEN, rule.TableCN, rule.FieldEN, rule.FieldCN,
			rule.Rule, rule.RuleDesc, rule.SourceSystem,
			rule.OwnerName, rule.InspectedCount, rule.IssueCount,
		}

		maxLines := 1
		for i, text := range rowData {
			lines := calculateLinesNeeded(pdf, text, colWidths[i]-margins[i]*2)
			if lines > maxLines {
				maxLines = lines
			}
		}

		// 行高
		lineHeight := 4.0
		rowHeight := float64(maxLines)*lineHeight + 3

		// 检查是否需要分页
		if pdf.GetY()+rowHeight > usableHeight {
			pdf.AddPage()
			// 在新页面重新绘制表头
			pdf.SetFontSize(8)
			pdf.SetFontStyle("B")
			pdf.SetFillColor(200, 200, 220)
			for i, header := range headers {
				pdf.CellFormat(colWidths[i], 10, header, "1", 0, "CM", true, 0, "")
			}
			pdf.Ln(-1)
			pdf.SetFontSize(7)
			pdf.SetFontStyle("")
			pdf.SetFillColor(255, 255, 255)
		}

		// 记录起始位置
		startX, currentY := pdf.GetXY()

		// 绘制每个单元格
		currentX := startX
		for i, text := range rowData {
			align := "C"
			if i == 4 || i == 5 { // 稽核规则和问题描述左对齐
				align = "L"
			}
			drawCellWithWrap(pdf, text, currentX, currentY, colWidths[i], rowHeight, margins[i], lineHeight, align)
			currentX += colWidths[i]
		}

		// 移动到下一行
		pdf.SetXY(startX, currentY+rowHeight)
	}
}

// 计算文本需要的行数
func calculateLinesNeeded(pdf *gofpdf.Fpdf, text string, maxWidth float64) int {
	if text == "" {
		return 1
	}

	lines := pdf.SplitText(text, maxWidth)
	return len(lines)
}

// 绘制带自动换行的单元格
func drawCellWithWrap(pdf *gofpdf.Fpdf, text string, x, y, width, height, margin, lineHeight float64, align string) {
	// 绘制单元格边框
	pdf.Rect(x, y, width, height, "D")

	// 计算可用宽度
	availableWidth := width - margin*2

	// 拆分文本为多行
	lines := pdf.SplitText(text, availableWidth)

	// 计算垂直居中偏移
	totalTextHeight := float64(len(lines)) * lineHeight
	yOffset := (height - totalTextHeight) / 2

	// 绘制每行文本
	currentY := y + yOffset + margin
	for _, line := range lines {
		pdf.SetXY(x+margin, currentY)
		pdf.CellFormat(availableWidth, lineHeight, line, "", 0, align, false, 0, "")
		currentY += lineHeight
	}

	// 重置位置
	pdf.SetXY(x+width, y)
}

func (f *formViewUseCase) GetDepartmentExploreReports(ctx context.Context, req *form_view.GetDepartmentExploreReportsReq) (*form_view.GetDepartmentExploreReportsResp, error) {
	total, reports, err := f.departmentExploreReportRepo.GetList(ctx, *req.Limit, *req.Offset, *req.Sort, *req.Direction, req.DepartmentID)
	if err != nil {
		return nil, err
	}
	entries := make([]*form_view.DepartmentExploreReportsInfo, 0)
	departmentIds := make([]string, 0)
	for _, report := range reports {
		departmentIds = append(departmentIds, report.DepartmentID)
	}
	nameMap := make(map[string]string)
	pathMap := make(map[string]string)
	typeMap := make(map[string]int32)
	if len(departmentIds) > 0 {
		departmentPrecision, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
		if err != nil {
			return nil, err
		}
		for _, departmentInfo := range departmentPrecision.Departments {
			nameMap[departmentInfo.ID] = departmentInfo.Name
			pathMap[departmentInfo.ID] = departmentInfo.Path
			typeMap[departmentInfo.ID] = departmentInfo.Type
		}
	}

	for _, report := range reports {
		info := &form_view.DepartmentExploreReportsInfo{
			DepartmentID:         report.DepartmentID,
			DepartmentName:       nameMap[report.DepartmentID],
			DepartmentType:       typeMap[report.DepartmentID],
			DepartmentPath:       pathMap[report.DepartmentID],
			TotalViews:           report.TotalViews,
			ExploredViews:        report.ExploredViews,
			TotalScore:           report.TotalScore,
			CompletenessScore:    report.TotalCompleteness,
			UniquenessScore:      report.TotalUniqueness,
			StandardizationScore: report.TotalStandardization,
			AccuracyScore:        report.TotalAccuracy,
			ConsistencyScore:     report.TotalConsistency,
		}
		entries = append(entries, info)
	}
	return &form_view.GetDepartmentExploreReportsResp{
		PageResult: response.PageResult[form_view.DepartmentExploreReportsInfo]{
			Entries:    entries,
			TotalCount: total,
		},
	}, nil
}

func (f *formViewUseCase) CreateExploreReports() {
	ctx := context.Background()
	formViews, err := f.repo.GetList(ctx, "", "", "")
	if err != nil {
		return
	}
	if len(formViews) == 0 {
		return
	}
	formViewIds := make([]string, 0)
	for _, formView := range formViews {
		formViewIds = append(formViewIds, formView.ID)
	}
	reportsReq := &form_view.GetDataExploreReportsReq{
		TableIds: formViewIds,
	}
	srcData, err := f.GetReports(ctx, reportsReq)
	if err != nil {
		return
	}
	if srcData == nil || len(srcData.Entries) == 0 {
		return
	}
	results := getDepartmentQualityReport(formViews, srcData)
	infos := make([]*model.DepartmentExploreReport, 0)
	for _, result := range results {
		info := &model.DepartmentExploreReport{
			DepartmentID:         result.DepartmentId,
			TotalViews:           result.TotalViews,
			ExploredViews:        result.CoveredViews,
			TotalScore:           result.QualityScore,
			TotalCompleteness:    result.CompletenessAvg,
			TotalStandardization: result.StandardizationAvg,
			TotalUniqueness:      result.UniquenessAvg,
			TotalAccuracy:        result.AccuracyAvg,
			TotalConsistency:     result.ConsistencyAvg,
		}
		infos = append(infos, info)
	}
	err = f.departmentExploreReportRepo.Update(ctx, infos)
	if err != nil {
		return
	}
}

// 获取部门数据质量报告
func getDepartmentQualityReport(formViews []*model.FormView, srcData *form_view.GetDataExploreReportsResp) []form_view.DepartmentStats {
	// 2. 创建报告映射，便于快速查找
	reportMap := make(map[string]*form_view.SrcReportData)
	reports := srcData.Entries
	for i := range reports {
		reportMap[reports[i].TableId] = reports[i]
	}

	// 3. 按部门聚合数据
	deptMap := make(map[string]*form_view.DepartmentStats)

	for _, view := range formViews {
		// 初始化或获取部门统计
		if _, exists := deptMap[view.DepartmentId.String]; !exists {
			deptMap[view.DepartmentId.String] = &form_view.DepartmentStats{
				DepartmentId: view.DepartmentId.String,
			}
		}
		dept := deptMap[view.DepartmentId.String]

		// 增加总视图数
		dept.TotalViews++

		// 查找对应的报告

		if report, hasReport := reportMap[view.ID]; hasReport {
			// 增加已覆盖视图数
			dept.CoveredViews++

			// 处理每个维度，只有非null时才累加和计数
			if report.AccuracyScore != nil {
				dept.AccuracySum += *report.AccuracyScore
				dept.AccuracyCount++
			}
			if report.CompletenessScore != nil {
				dept.CompletenessSum += *report.CompletenessScore
				dept.CompletenessCount++
			}
			if report.ConsistencyScore != nil {
				dept.ConsistencySum += *report.ConsistencyScore
				dept.ConsistencyCount++
			}
			if report.UniquenessScore != nil {
				dept.UniquenessSum += *report.UniquenessScore
				dept.UniquenessCount++
			}
			if report.StandardizationScore != nil {
				dept.ValiditySum += *report.StandardizationScore
				dept.ValidityCount++
			}
			if report.TotalScore != nil {
				dept.QualitySum += *report.TotalScore
			}
		}
	}

	// 4. 计算平均分和质量得分
	var results []form_view.DepartmentStats
	for _, dept := range deptMap {
		if dept.CoveredViews > 0 {
			// 计算各维度平均分（只有有数据的维度才计算）
			dept.AccuracyAvg = formatCalculateScoreResult(dept.AccuracySum, dept.AccuracyCount)
			dept.CompletenessAvg = formatCalculateScoreResult(dept.CompletenessSum, dept.CompletenessCount)
			dept.ConsistencyAvg = formatCalculateScoreResult(dept.ConsistencySum, dept.ConsistencyCount)
			dept.UniquenessAvg = formatCalculateScoreResult(dept.UniquenessSum, dept.UniquenessCount)
			dept.StandardizationAvg = formatCalculateScoreResult(dept.ValiditySum, dept.ValidityCount)
			dept.QualityScore = formatCalculateScoreResult(dept.QualitySum, dept.CoveredViews)
		}
		results = append(results, *dept)
	}
	return results
}
