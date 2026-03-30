package impl

import (
	"bytes"
	"context"
	"encoding/json"
	"fmt"
	"strconv"
	"strings"
	"time"

	"github.com/go-kratos/kratos/v2/log"
	pmr_driven "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/points_management"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/errorcode"
	pmr_domain "github.com/kweaver-ai/dsg/services/apps/task_center/domain/points_management"
	"github.com/kweaver-ai/dsg/services/apps/task_center/infrastructure/repository/db/model"
	configRest "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/xuri/excelize/v2"
)

type PointsManagement struct {
	pmr pmr_driven.PointsRuleConfigRepo
	per pmr_driven.PointsEventRepo
	cgr configRest.Driven
}

func NewPointsManagement(pmr pmr_driven.PointsRuleConfigRepo, per pmr_driven.PointsEventRepo, cgr configRest.Driven) pmr_domain.PointsManagement {
	d := &PointsManagement{
		pmr: pmr,
		per: per,
		cgr: cgr,
	}
	return d
}

func (p *PointsManagement) PointsRuleConfigObjToPointsRuleConfigResp(pointsRuleConfig *model.PointsRuleConfigObj) (*pmr_domain.PointsRuleConfigResp, error) {
	var config, period []int64
	var err error
	if err = json.Unmarshal(pointsRuleConfig.Config, &config); err != nil {
		err = errorcode.Desc(errorcode.PointsRuleConfigJsonError, err)
		return nil, err
	}
	if err = json.Unmarshal(pointsRuleConfig.Period, &period); err != nil {
		err = errorcode.Desc(errorcode.PointsRuleConfigJsonError, err)
		return nil, err
	}
	return &pmr_domain.PointsRuleConfigResp{
		Code:        pointsRuleConfig.Code,
		Config:      config,
		Period:      period,
		UpdatedByID: pointsRuleConfig.UpdatedByUID,
		UpdatedBy:   pointsRuleConfig.UpdatedByUserName,
		UpdatedAt:   pointsRuleConfig.UpdatedAt,
	}, err
}

func (p *PointsManagement) Detail(ctx context.Context, code string) (*pmr_domain.PointsRuleConfigResp, error) {
	var (
		err                error
		pointRuleConfigObj *model.PointsRuleConfigObj
	)
	pointRuleConfigObj, err = p.pmr.Detail(ctx, code)
	if err != nil {
		return nil, err
	}
	return p.PointsRuleConfigObjToPointsRuleConfigResp(pointRuleConfigObj)
}

func (p *PointsManagement) Create(ctx context.Context, req *pmr_domain.PointsManagementCreateParam, userID string) (*pmr_domain.PointsRuleConfigResp, error) {
	var (
		err                error
		pointRuleConfigObj *pmr_domain.PointsRuleConfigResp
		pointRuleConfig    *model.PointsRuleConfig
	)
	pointRuleConfigObj, _ = p.Detail(ctx, req.Code)
	if pointRuleConfigObj != nil {
		return nil, errorcode.Desc(errorcode.PointsCodeExistError)
	}
	pointRuleConfig, err = p.ToModel(ctx, req)
	if err != nil {
		return nil, err
	}
	pointRuleConfig.CreatedByUID = userID
	pointRuleConfig.UpdatedByUID = userID
	err = p.pmr.Create(ctx, pointRuleConfig)
	if err != nil {
		return nil, err
	}
	pointRuleConfigObj, err = p.Detail(ctx, req.Code)
	if err != nil {
		return nil, err
	}
	return pointRuleConfigObj, nil
}

func (p *PointsManagement) Update(ctx context.Context, req *pmr_domain.PointsManagementCreateParam, userID string) (*pmr_domain.PointsRuleConfigResp, error) {
	var (
		err                error
		pointRuleConfigObj *pmr_domain.PointsRuleConfigResp
		pointRuleConfig    *model.PointsRuleConfig
	)
	pointRuleConfigObj, _ = p.Detail(ctx, req.Code)
	if pointRuleConfigObj == nil {
		return nil, errorcode.Desc(errorcode.PointsCodeNotExistError)
	}
	pointRuleConfig, err = p.ToModel(ctx, req)
	if err != nil {
		return nil, err
	}
	pointRuleConfig.UpdatedByUID = userID
	err = p.pmr.Update(ctx, pointRuleConfig)
	if err != nil {
		return nil, err
	}
	pointRuleConfigObj, err = p.Detail(ctx, req.Code)
	if err != nil {
		return nil, err
	}
	return pointRuleConfigObj, nil
}

func (p *PointsManagement) ToModel(ctx context.Context, req *pmr_domain.PointsManagementCreateParam) (*model.PointsRuleConfig, error) {
	var (
		err             error
		pointRuleConfig *model.PointsRuleConfig
		config          []byte
		period          []byte
	)
	config, err = json.Marshal(req.Config)
	if err != nil {
		return nil, errorcode.Desc(errorcode.PointsRuleConfigJsonError, err)
	}
	period, err = json.Marshal(req.Period)
	if err != nil {
		return nil, errorcode.Desc(errorcode.PointsRuleConfigJsonError, err)
	}
	pointRuleConfig = &model.PointsRuleConfig{
		Code:     req.Code,
		RuleType: pmr_domain.PointsType2Str(req.Code),
		Config:   config,
		Period:   period,
	}
	return pointRuleConfig, nil
}

func (p *PointsManagement) List(ctx context.Context) (*pmr_domain.PointsRuleConfigList, error) {
	var (
		total               int64
		pointsRuleConfigObj []*model.PointsRuleConfigObj
		err                 error
	)
	pointsRuleConfigRespList := []*pmr_domain.PointsRuleConfigResp{}
	total, pointsRuleConfigObj, err = p.pmr.List(ctx)
	if err != nil {
		return nil, err
	}
	for i := range pointsRuleConfigObj {
		pointRuleConfigResp, err := p.PointsRuleConfigObjToPointsRuleConfigResp(pointsRuleConfigObj[i])
		if err != nil {
			return nil, err
		}
		pointsRuleConfigRespList = append(pointsRuleConfigRespList, pointRuleConfigResp)
	}

	return &pmr_domain.PointsRuleConfigList{
		Entries:    pointsRuleConfigRespList,
		TotalCount: total,
	}, nil
}

func (p *PointsManagement) Delete(ctx context.Context, code string) error {
	return p.pmr.Delete(ctx, code)
}

func (p *PointsManagement) GetUserTopLevelDeparment(ctx context.Context, userID string) ([]*configRest.DepartmentObject, error) {
	topDepartments := []*configRest.DepartmentObject{}
	departmentsMes, err := p.cgr.GetDepartmentsByUserID(ctx, userID)
	if err != nil {
		return nil, err
	}
	for i := range departmentsMes {
		pathIDs := strings.Split(departmentsMes[i].PathID+departmentsMes[i].ID, "/")
		var topDepartment *configRest.DepartmentObject
		for _, pathID := range pathIDs {
			department, err := p.cgr.GetDepartmentsByCodeInternal(ctx, pathID)
			if err != nil {
				return nil, err
			}
			if department.Subtype == 1 { // 2表示部门
				topDepartment = department
				break
			}
		}
		if topDepartment != nil {
			topDepartments = append(topDepartments, topDepartment)
		}
	}
	return topDepartments, nil
}

func (p *PointsManagement) PointsEventList(ctx context.Context, req *pmr_domain.PointsEventListParam, userID string, limit *int) (*pmr_domain.PointsEventList, error) {
	var (
		total       int64
		pointEvents []*model.PointsEvent
		err         error
	)

	if req.IsDepartment == "true" {
		total, pointEvents, err = p.per.DepartmentPointsList(ctx, req.ID, nil)
	} else {
		total, pointEvents, err = p.per.PersionalPointsList(ctx, req.ID, nil)
	}
	if err != nil {
		return nil, err
	}

	pointsEventList := make([]*pmr_domain.PointsEvent, 0, len(pointEvents))
	for _, event := range pointEvents {
		pointsEventList = append(pointsEventList, &pmr_domain.PointsEvent{
			StrategyCode:       event.Code,
			BusinessModule:     event.BusinessModule,
			StrategyObjectID:   event.PointsObjectID,
			StrategyObjectName: event.PointsObjectName,
			Points:             event.PointsValue,
			CreatedAt:          event.CreatedAt,
		})
	}

	return &pmr_domain.PointsEventList{
		Entries:    pointsEventList,
		TotalCount: total,
	}, nil
}

func (p *PointsManagement) ExportPointsEventList(ctx context.Context, req *pmr_domain.PointsEventListParam) ([]byte, error) {
	// Get 1000 records
	limit := 1000
	pointsEventList, err := p.PointsEventList(ctx, req, "", &limit)
	if err != nil {
		return nil, err
	}

	// Create Excel file
	f := excelize.NewFile()
	defer f.Close()

	// Set headers
	headers := []string{"积分类型", "业务模块", "获取积分对象", "获取积分条件", "积分变化", "获取积分事件"}
	for i, header := range headers {
		cell := fmt.Sprintf("%c1", 'A'+i)
		f.SetCellValue("Sheet1", cell, header)
	}

	// Write data rows
	for i, event := range pointsEventList.Entries {
		row := i + 2
		// 积分类型
		pointsType := pmr_domain.PointsType2Str(event.StrategyCode)
		switch pointsType {
		case pmr_domain.FeedbackType:
			pointsType = "反馈型"
		case pmr_domain.TaskType:
			pointsType = "任务型"
		case pmr_domain.DemandType:
			pointsType = "需求型"
		}
		f.SetCellValue("Sheet1", fmt.Sprintf("A%d", row), pointsType)

		// 业务模块
		module := ""
		switch event.BusinessModule {
		case pmr_domain.CatalogModule:
			module = "目录反馈"
		case pmr_domain.ShareApplicationModule:
			module = "共享申请成效反馈"
		case pmr_domain.DataAggregationModule:
			module = "数据归集任务"
		case pmr_domain.SupplyAndDemandModule:
			module = "供需申请"
		case pmr_domain.ShareModule:
			module = "共享申请"
		}
		f.SetCellValue("Sheet1", fmt.Sprintf("B%d", row), module)

		f.SetCellValue("Sheet1", fmt.Sprintf("C%d", row), event.StrategyObjectName)
		f.SetCellValue("Sheet1", fmt.Sprintf("D%d", row), pmr_domain.PointsCode2Condition[event.StrategyCode])
		f.SetCellValue("Sheet1", fmt.Sprintf("E%d", row), fmt.Sprintf("+%d分", event.Points))
		f.SetCellValue("Sheet1", fmt.Sprintf("F%d", row), event.CreatedAt.Format("2006-01-02 15:04:05"))
	}

	// Save to buffer
	var buffer bytes.Buffer
	if err := f.Write(&buffer); err != nil {
		return nil, err
	}

	return buffer.Bytes(), nil
}

func (p *PointsManagement) PersonalAndDepartmentPointsSummary(ctx context.Context, userID string) ([]pmr_domain.PointsSummary, error) {
	// 获取个人属于部门信息
	departmentsMes, err := p.GetUserTopLevelDeparment(ctx, userID)
	if err != nil {
		return nil, err
	}
	pointsSummmaryList := []pmr_domain.PointsSummary{}
	// 获取个人积分
	personalPoints, err := p.per.PersonalTotalPoints(ctx, userID)
	if err != nil {
		return nil, err
	} else {
		pointsSummmaryList = append(pointsSummmaryList, pmr_domain.PointsSummary{
			ID:    userID,
			Name:  "个人积分",
			Score: personalPoints,
		})
	}

	// 获取部门积分汇总
	for i := range departmentsMes {
		departmentPoints, err := p.per.DepartmentTotalPoints(ctx, departmentsMes[i].ID)
		if err != nil {
			return nil, err
		} else {
			pointsSummmaryList = append(pointsSummmaryList, pmr_domain.PointsSummary{
				ID:    departmentsMes[i].ID,
				Name:  departmentsMes[i].Name,
				Score: departmentPoints,
			})
		}
	}

	return pointsSummmaryList, nil
}

func (p *PointsManagement) DepartmentPointsTop(ctx context.Context, year string) ([]pmr_domain.DepartmentPointsRank, error) {
	ranks, err := p.per.DepartmentPointsTop(ctx, year, int(5))
	if err != nil {
		return nil, err
	}

	result := make([]pmr_domain.DepartmentPointsRank, len(ranks))
	for i, rank := range ranks {
		result[i] = pmr_domain.DepartmentPointsRank{
			ID:     rank.ID,
			Name:   rank.Name,
			Points: rank.Points,
		}
	}
	return result, nil
}

func (p *PointsManagement) PointsEventGroupByCode(ctx context.Context, year string) ([]pmr_domain.DepartmentPointsRank, error) {
	ranks, err := p.per.PointsEventGroupByCode(ctx, year)
	if err != nil {
		return nil, err
	}

	result := make([]pmr_domain.DepartmentPointsRank, len(ranks))
	for i, rank := range ranks {
		result[i] = pmr_domain.DepartmentPointsRank{
			ID:     rank.ID,
			Name:   rank.Name,
			Points: rank.Points,
		}
	}
	return result, nil
}

func (p *PointsManagement) PointsEventGroupByCodeAndMonth(ctx context.Context, year string) (map[string]interface{}, error) {
	return p.per.PointsEventGroupByCodeAndMonth(ctx, year)
}

func (p *PointsManagement) PointsEventCreate(ctx context.Context, pointsEvent *pmr_domain.PointsEventPub) {
	// Get points rule config for the event type
	ruleConfig, err := p.Detail(ctx, pointsEvent.Type)
	if err != nil {
		log.Error(ctx, "Failed to get points rule config", err)
		return
	}

	// Check if rule is within valid period
	now := time.Now()
	var startTime, endTime time.Time
	if ruleConfig.Period[0] == -1 {
		startTime = time.Unix(0, 0) // Set to Unix epoch start if -1
	} else {
		startTime = time.Unix(ruleConfig.Period[0], 0)
	}
	if ruleConfig.Period[1] == -1 {
		endTime = time.Unix(1<<63-1, 0) // Set to max time if -1
	} else {
		endTime = time.Unix(ruleConfig.Period[1], 0)
	}

	if (ruleConfig.Period[0] != -1 && now.Before(startTime)) || (ruleConfig.Period[1] != -1 && now.After(endTime)) {
		log.Info(ctx, "Points event is outside valid period", map[string]interface{}{
			"type":      pointsEvent.Type,
			"startTime": startTime,
			"endTime":   endTime,
			"now":       now,
		})
		return
	}

	// Create points event record
	points, err := strconv.ParseInt(pointsEvent.Score, 10, 64)
	if err != nil {
		log.Error(ctx, "Failed to parse points score", err)
		return
	}

	pointsEventObj := &model.PointsEvent{
		Code:             pointsEvent.Type,
		BusinessModule:   pmr_domain.PointsCode2Module(pointsEvent.Type),
		PointsObjectType: pmr_domain.PointsType2Str(pointsEvent.Type),
		PointsObjectID:   pointsEvent.PointObject,
		PointsObjectName: pointsEvent.PointsObjectName,
		PointsValue:      points,
	}

	if err := p.per.Create(ctx, pointsEventObj); err != nil {
		log.Error(ctx, "Failed to create points event", err)
		return
	}

	// Get department info based on event type
	var departmentID string
	var userID string

	switch pointsEvent.Type {
	case pmr_domain.CatalogFeedback, pmr_domain.ShareApplicationFeedback,
		pmr_domain.DataAggregationComplete, pmr_domain.DataAggregationRelease:
		// For these types, point_object is user ID, need to get their department
		userID = pointsEvent.PointObject
		topDepartments, err := p.GetUserTopLevelDeparment(ctx, userID)
		if err != nil {
			log.Error(ctx, "Failed to get top department", err)
			return
		}
		departmentPointsEventList := make([]*model.PointsEventTopDepartment, 0, len(topDepartments))
		for _, department := range topDepartments {
			// Create points event for each department
			departmentPointsEvent := &model.PointsEventTopDepartment{
				DepartmentID:   department.ID,
				DepartmentName: department.Name,
				DepartmentPath: department.PathID,
				PointsEventID:  pointsEventObj.PointEventID,
			}
			departmentPointsEventList = append(departmentPointsEventList, departmentPointsEvent)
		}
		if err := p.per.BatchCreateTopDepartment(ctx, departmentPointsEventList); err != nil {
			log.Error(ctx, "Failed to create department points event", err)
			return
		}
	case pmr_domain.CatalogRating, pmr_domain.SupplyAndDemandApplicationSubmisionDirectory,
		pmr_domain.ShareApplicationSubmissionResource:
		// For these types, point_object is directly department ID
		departmentID = pointsEvent.PointObject
		if departmentID != "" {
			department, err := p.cgr.GetDepartmentsByCodeInternal(ctx, departmentID)
			if err != nil {
				log.Error(ctx, "Failed to get department info", err)
				return
			}
			departmentPointsEvent := &model.PointsEventTopDepartment{
				DepartmentID:   department.ID,
				DepartmentName: department.Name,
				DepartmentPath: department.PathID,
				PointsEventID:  pointsEventObj.PointEventID,
			}
			if err := p.per.BatchCreateTopDepartment(ctx, []*model.PointsEventTopDepartment{departmentPointsEvent}); err != nil {
				log.Error(ctx, "Failed to create department points event", err)
				return
			}
		}
	}
}
