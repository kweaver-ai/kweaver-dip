package v1

import (
	"context"
	"encoding/json"
	"fmt"
	"regexp"
	"strconv"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule"
	group_repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/grade_rule_group"
	user "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/grade_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
)

type gradeRuleUseCase struct {
	repo              repo.GradeRuleRepo
	groupRepo         group_repo.GradeRuleGroupRepo
	userRepo          user.UserRepo
	dataSubjectDriven data_subject_local.DrivenDataSubject
	ccDriven          configuration_center.Driven
}

func NewGradeRuleUseCase(
	repo repo.GradeRuleRepo,
	groupRepo group_repo.GradeRuleGroupRepo,
	userRepo user.UserRepo,
	dataSubjectDriven data_subject_local.DrivenDataSubject,
	ccDriven configuration_center.Driven,
) domain.GradeRuleUseCase {
	return &gradeRuleUseCase{
		repo:              repo,
		groupRepo:         groupRepo,
		userRepo:          userRepo,
		dataSubjectDriven: dataSubjectDriven,
		ccDriven:          ccDriven,
	}
}

func (f *gradeRuleUseCase) PageList(ctx context.Context, req *domain.PageListGradeRuleReq) (*domain.PageListGradeRuleResp, error) {
	total, rules, err := f.repo.PageList(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("GradeRuleRepo.PageList", zap.Error(err))
		return nil, err
	}

	// Get subject IDs and label IDs
	subjectIds := make([]string, 0)
	labelIds := make([]string, 0)
	groupIds := make([]string, 0)
	for _, rule := range rules {
		subjectIds = append(subjectIds, rule.SubjectID)
		labelIds = append(labelIds, fmt.Sprintf("%d", rule.LabelID))
		groupIds = append(groupIds, rule.GroupID)
	}
	// 去重
	subjectIds = util.DuplicateStringRemoval(subjectIds)
	labelIds = util.DuplicateStringRemoval(labelIds)
	groupIds = util.DuplicateStringRemoval(groupIds)

	// 批量查询所有规则组信息
	groupList, err := f.groupRepo.Details(ctx, groupIds)
	if err != nil {
		log.WithContext(ctx).Error("GradeRuleRepo.groupRepo.Details", zap.Error(err))
		return nil, err
	}
	groupInfoMap := lo.SliceToMap(groupList, func(item *model.GradeRuleGroup) (string, string) {
		return item.ID, item.Name
	})

	labelInfosMap := make(map[string]domain.LabInfo)
	// 如果有标签id，查询标签信息
	if len(labelIds) > 0 {
		labelIds = util.DuplicateStringRemoval(labelIds)
		labelInfos, err := f.ccDriven.GetLabelByIds(ctx, strings.Join(labelIds, ","))
		if err != nil {
			return nil, err
		}
		for _, labelInfo := range labelInfos.Entries {
			labelInfosMap[labelInfo.ID] = domain.LabInfo{
				LabelID:   labelInfo.ID,
				LabelName: labelInfo.Name,
				LabelIcon: labelInfo.LabelIcon,
			}
		}
	}

	// Get subject names
	subjectNameMap := make(map[string]string)
	subjectDefaultName := "未分级"
	subjectDefaultId := "1"
	defaultLable := domain.LabInfo{
		LabelID:   "default",
		LabelName: "默认",
		LabelIcon: "default",
	}
	if len(subjectIds) > 0 {
		subjectResp, err := f.dataSubjectDriven.GetObjectPrecision(ctx, subjectIds)
		if err != nil {
			log.WithContext(ctx).Error("GetObjectPrecision", zap.Error(err))
			return nil, err
		}
		for _, subject := range subjectResp.Object {
			subjectNameMap[subject.ID] = subject.Name
			subjectDefaultName = subject.Name
			subjectDefaultId = subject.ID
		}
	}
	// get default label

	// Get Subject label info
	if len(labelIds) > 0 {
		labelAttr, err := f.dataSubjectDriven.GetAttributeByIds(ctx, subjectIds)
		if err != nil {
			log.WithContext(ctx).Error("GetAttributeByIds", zap.Error(err))
			return nil, err
		}
		if len(labelAttr.Attributes) > 0 {
			defaultLable.LabelID = labelAttr.Attributes[0].ID
			defaultLable.LabelName = labelAttr.Attributes[0].Name
			defaultLable.LabelIcon = labelAttr.Attributes[0].LabelIcon
		}
	}

	// Build response
	res := make([]*domain.GradeRule, 0, len(rules)+1)
	res = append(res, &domain.GradeRule{
		ID:          "1",
		Name:        "内置规则",
		Description: "内置规则优先级最低",
		Type:        "inner",
		Status:      1,
		SubjectID:   subjectDefaultId,
		SubjectName: subjectDefaultName,
		LabelID:     defaultLable.LabelID,
		LabelName:   defaultLable.LabelName,
		LabelIcon:   defaultLable.LabelIcon,
	})
	for _, rule := range rules {
		// Parse logical expression to get classification subject names
		// 解析逻辑表达式为Classifications结构
		var classifications domain.Classifications
		err = json.Unmarshal([]byte(rule.LogicalExpression), &classifications)
		log.WithContext(ctx).Info("gradeRuleUseCase.PageList classifications", zap.Any("classifications", classifications))

		if err != nil {
			log.WithContext(ctx).Error("parseLogicalExpression failed", zap.Error(err))
			continue
		}

		// Get all classification subject IDs
		var classificationSubjectIds []string
		for _, gradeRule := range classifications.GradeRules {
			classificationSubjectIds = append(classificationSubjectIds, gradeRule.ClassificationRuleSubjectIds...)
		}

		// Clean the extracted IDs using regex to extract only valid UUIDs
		re := regexp.MustCompile(`[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}`)
		var cleanIds []string
		for _, id := range classificationSubjectIds {
			// Extract the first valid UUID from the string
			if valid := re.FindString(id); valid != "" {
				cleanIds = append(cleanIds, valid)
			}
		}
		classificationSubjectIds = cleanIds

		// Get classification subject names
		var classificationSubjectNames []string
		if len(classificationSubjectIds) > 0 {
			subjectInfo, err := f.dataSubjectDriven.GetObjectPrecision(ctx, classificationSubjectIds)
			if err != nil {
				log.WithContext(ctx).Error("GetObjectPrecision for classification subjects", zap.Error(err))
				continue
			}
			for _, subject := range subjectInfo.Object {
				classificationSubjectNames = append(classificationSubjectNames, subject.Name)
			}
		}

		// Get label info
		var labelName, labelIcon string
		if labelAttr, ok := labelInfosMap[fmt.Sprintf("%d", rule.LabelID)]; ok {
			labelName = labelAttr.LabelName
			labelIcon = labelAttr.LabelIcon
		}

		res = append(res, &domain.GradeRule{
			ID:                         rule.ID,
			Name:                       rule.Name,
			Description:                rule.Description,
			ClassificationSubjectNames: classificationSubjectNames,
			SubjectID:                  rule.SubjectID,
			SubjectName:                subjectNameMap[rule.SubjectID],
			LabelID:                    fmt.Sprintf("%d", rule.LabelID),
			LabelName:                  labelName,
			LabelIcon:                  labelIcon,
			Status:                     rule.Status,
			CreatedAt:                  rule.CreatedAt.UnixMilli(),
			UpdatedAt:                  rule.UpdatedAt.UnixMilli(),
			GroupID:                    rule.GroupID,
			GroupName:                  groupInfoMap[rule.GroupID],
		})
	}

	return &domain.PageListGradeRuleResp{
		PageResultNew: domain.PageResultNew[domain.GradeRule]{
			Entries:    res,
			TotalCount: total,
		},
	}, nil
}

func (f *gradeRuleUseCase) Create(ctx context.Context, req *domain.CreateGradeRuleReq) (*domain.CreateGradeRuleResp, error) {
	log.WithContext(ctx).Info("Create grade rule request", zap.Any("req", req))
	//数据量超过100条，返回错误
	count, err := f.repo.GetCount(ctx)
	if err != nil {
		return nil, err
	}
	log.WithContext(ctx).Info("Create grade rule count", zap.Any("count", count))
	if count >= 100 {
		return nil, errorcode.Detail(errorcode.GradeRuleCountLimit, "分级规则数量超过100条")
	}

	// 校验规则组是否存在
	if req.GroupID != "" {
		groupList, err := f.groupRepo.Details(ctx, []string{req.GroupID})
		if err != nil {
			return nil, err
		}
		if len(groupList) <= 0 {
			return nil, errorcode.Detail(errorcode.GradeRuleGroupNotFound, "规则组不存在")
		}
	}

	userInfo, _ := util.GetUserInfo(ctx)
	log.WithContext(ctx).Info("Create grade rule userInfo", zap.Any("userInfo", userInfo))
	// Set default type if empty
	if req.Type == "" {
		req.Type = "custom"
	}

	// 将Classifications转换为反序列化字符串
	log.WithContext(ctx).Info("Create grade rule req.Classifications", zap.Any("req.Classifications", req.Classifications))

	// 将Classifications转换为JSON字符串
	logicalExpressionBytes, err := json.Marshal(req.Classifications)
	if err != nil {
		log.WithContext(ctx).Error("failed to serialize classifications",
			zap.Error(err),
			zap.Any("classifications", req.Classifications))
		return nil, err
	}
	logicalExpression := string(logicalExpressionBytes)

	// 验证LabelID
	labelID, err := strconv.ParseInt(req.LabelId, 10, 64)
	if err != nil {
		log.WithContext(ctx).Error("failed to parse label_id",
			zap.Error(err),
			zap.String("label_id", req.LabelId))
		return nil, err
	}

	rule := &model.GradeRule{
		Name:              req.Name,
		Description:       req.Description,
		SubjectID:         req.SubjectId,
		LabelID:           labelID,
		LogicalExpression: logicalExpression,
		Status:            1,
		Type:              req.Type,
		CreatedByUID:      userInfo.ID,
		UpdatedByUID:      userInfo.ID,
		GroupID:           req.GroupID,
	}
	if rule.Type == "inner" {
		return nil, errorcode.Detail(errorcode.GradeRuleTypeInvalid, "inner类型不能创建")
	}
	id, err := f.repo.Create(ctx, rule)
	if err != nil {
		log.WithContext(ctx).Error("repo.Create failed", zap.Error(err))
		return nil, err
	}

	return &domain.CreateGradeRuleResp{
		ID: id,
	}, nil
}

func (f *gradeRuleUseCase) Update(ctx context.Context, req *domain.UpdateGradeRuleReq) (*domain.UpdateGradeRuleResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		log.WithContext(ctx).Error("GetById failed", zap.Error(err))
		return nil, err
	}
	if rule.Type == "inner" {
		return nil, errorcode.Detail(errorcode.GradeRuleTypeInvalid, "inner类型不能更新")
	}

	if rule == nil {
		return nil, errorcode.Detail(errorcode.GradeRuleNotFound, "分级规则不存在")
	}

	// 校验规则组是否存在
	if req.GroupID != "" {
		groupList, err := f.groupRepo.Details(ctx, []string{req.GroupID})
		if err != nil {
			return nil, err
		}
		if len(groupList) <= 0 {
			return nil, errorcode.Detail(errorcode.GradeRuleGroupNotFound, "规则组不存在")
		}
		rule.GroupID = req.GroupID
	}

	// 所属规则组置空
	if req.GroupID == "" {
		rule.GroupID = ""
	}

	userInfo, _ := util.GetUserInfo(ctx)

	if req.Name != "" {
		rule.Name = req.Name
	}
	if req.Description != "" {
		rule.Description = req.Description
	}
	if req.SubjectId != "" {
		rule.SubjectID = req.SubjectId
	}
	if req.LabelId != "" {
		rule.LabelID = func() int64 {
			id, err := strconv.ParseInt(req.LabelId, 10, 64)
			if err != nil {
				return 0
			}
			return id
		}()
	}

	// 如果提供了Classifications，则更新LogicalExpression
	if req.Classifications.Operate != "" {
		logicalExpressionBytes, err := json.Marshal(req.Classifications)
		if err != nil {
			log.WithContext(ctx).Error("failed to serialize classifications", zap.Error(err))
			return nil, err
		}
		logicalExpression := string(logicalExpressionBytes)
		rule.LogicalExpression = logicalExpression
	}

	rule.UpdatedByUID = userInfo.ID

	err = f.repo.Update(ctx, rule)
	if err != nil {
		log.WithContext(ctx).Error("repo.Update failed", zap.Error(err))
		return nil, err
	}

	return &domain.UpdateGradeRuleResp{ID: rule.ID}, nil
}

func (f *gradeRuleUseCase) GetDetailById(ctx context.Context, req *domain.GetDetailByIdReq) (*domain.GradeRuleDetailResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if rule == nil {
		return nil, nil
	}

	// 获取创建者和更新者信息
	createUser, err := f.userRepo.GetByUserId(ctx, rule.CreatedByUID)
	if err != nil {
		return nil, err
	}

	updateUser, err := f.userRepo.GetByUserId(ctx, rule.UpdatedByUID)
	if err != nil {
		return nil, err
	}

	// 获取分级属性信息
	log.WithContext(ctx).Info("gradeRuleUseCase.GetDetailById rule.SubjectID", zap.Any("rule.SubjectID", rule.SubjectID))
	subject, err := f.dataSubjectDriven.GetsObjectById(ctx, rule.SubjectID)
	if err != nil {
		return nil, err
	}

	// 解析逻辑表达式为Classifications结构
	var classifications domain.Classifications
	err = json.Unmarshal([]byte(rule.LogicalExpression), &classifications)
	log.WithContext(ctx).Info("gradeRuleUseCase.GetDetailById classifications", zap.Any("classifications", classifications))

	if err != nil {
		return nil, err
	}

	// 构建ClassificationDetails结构
	classificationDetails := domain.ClassificationDetails{
		Operate:          classifications.Operate,
		GradeRuleDetails: make([]domain.GradeRuleDetail, 0, len(classifications.GradeRules)),
	}
	log.WithContext(ctx).Info("gradeRuleUseCase.GetDetailById classificationDetails", zap.Any("classificationDetails", classificationDetails))

	// 遍历每个分级规则
	for _, gradeRule := range classifications.GradeRules {
		// 创建GradeRuleDetail
		detail := domain.GradeRuleDetail{
			Operate:                    gradeRule.Operate,
			ClassificationRuleSubjects: make([]domain.ClassificationRuleSubject, 0, len(gradeRule.ClassificationRuleSubjectIds)),
		}

		// 批量获取分类属性信息
		log.WithContext(ctx).Info("gradeRuleUseCase.GetDetailById gradeRule.ClassificationRuleSubjectIds", zap.Any("gradeRule.ClassificationRuleSubjectIds", gradeRule.ClassificationRuleSubjectIds))
		subjectInfo, err := f.dataSubjectDriven.GetObjectPrecision(ctx, gradeRule.ClassificationRuleSubjectIds)
		if err != nil {
			return nil, err
		}

		// 构建ID到Name的映射
		subjectNameMap := make(map[string]string)
		for _, subject := range subjectInfo.Object {
			subjectNameMap[subject.ID] = subject.Name
		}

		// 填充分类属性信息
		for _, subjectId := range gradeRule.ClassificationRuleSubjectIds {
			detail.ClassificationRuleSubjects = append(detail.ClassificationRuleSubjects, domain.ClassificationRuleSubject{
				ID:   subjectId,
				Name: subjectNameMap[subjectId],
			})
		}

		classificationDetails.GradeRuleDetails = append(classificationDetails.GradeRuleDetails, detail)
	}

	// 获取标签信息
	labelAttr, err := f.ccDriven.GetLabelByIds(ctx, fmt.Sprintf("%d", rule.LabelID))
	if err != nil {
		return nil, err
	}

	var labelName, labelIcon string
	if len(labelAttr.Entries) > 0 {
		labelName = labelAttr.Entries[0].Name
		labelIcon = labelAttr.Entries[0].LabelIcon
	}

	// 查询规则组信息
	groupInfoMap := make(map[string]string)
	if rule.GroupID != "" {
		groupList, err := f.groupRepo.Details(ctx, []string{rule.GroupID})
		if err != nil {
			return nil, err
		}
		groupInfoMap = lo.SliceToMap(groupList, func(item *model.GradeRuleGroup) (string, string) {
			return item.ID, item.Name
		})
	}

	return &domain.GradeRuleDetailResp{
		ID:              rule.ID,
		Name:            rule.Name,
		Description:     rule.Description,
		Classifications: classificationDetails,
		SubjectID:       rule.SubjectID,
		SubjectName:     subject.Name,
		LabelID:         fmt.Sprintf("%d", rule.LabelID),
		LabelName:       labelName,
		LabelIcon:       labelIcon,
		Type:            rule.Type,
		Status:          int(rule.Status),
		CreatedAt:       rule.CreatedAt.UnixMilli(),
		CreatedByName:   createUser.Name,
		UpdatedAt:       rule.UpdatedAt.UnixMilli(),
		UpdatedByName:   updateUser.Name,
		GroupID:         rule.GroupID,
		GroupName:       groupInfoMap[rule.GroupID],
	}, nil
}

func (f *gradeRuleUseCase) Delete(ctx context.Context, req *domain.DeleteGradeRuleReq) (*domain.DeleteGradeRuleResp, error) {
	err := f.repo.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	return &domain.DeleteGradeRuleResp{ID: req.ID}, nil
}

func (f *gradeRuleUseCase) GetUserMapByIds(ctx context.Context, ids []string) (map[string]string, error) {
	usersMap := make(map[string]string)
	if len(ids) == 0 {
		return usersMap, nil
	}
	users, err := f.userRepo.GetByUserIds(ctx, ids)
	if err != nil {
		return usersMap, err
	}
	for _, u := range users {
		if u.Status == constant.UserDelete {
			usersMap[u.ID] = u.Name + "#用户已删除#"
		} else {
			usersMap[u.ID] = u.Name
		}
	}
	return usersMap, nil
}

func (f *gradeRuleUseCase) Export(ctx context.Context, req *domain.ExportGradeRuleReq) (*domain.ExportGradeRuleResp, error) {
	var (
		rules = make([]*model.GradeRule, 0)
		err   error
	)

	// 查询单个或者多个规则组规则数据
	if len(req.GroupIds) > 0 {
		rules, err = f.repo.GetByGroupIds(ctx, req.BusinessObjectID, req.GroupIds)
		if err != nil {
			return nil, err
		}
	}

	// 查询单个或者多个规则数据
	if len(req.GroupIds) <= 0 && len(req.Ids) > 0 {
		rules, err = f.repo.GetByIds(ctx, req.Ids)
		if err != nil {
			return nil, err
		}
	}

	// 获取规则ID列表
	subjectIds := make([]string, 0)
	labelIds := make([]string, 0)
	for _, rule := range rules {
		subjectIds = append(subjectIds, rule.SubjectID)
		labelIds = append(labelIds, fmt.Sprintf("%d", rule.LabelID))
	}

	// 获取主题名称
	subjectNameMap := make(map[string]string)
	defaultSubjectName := "无"
	if len(subjectIds) > 0 {
		subjectResp, err := f.dataSubjectDriven.GetObjectPrecision(ctx, subjectIds)
		if err != nil {
			return nil, err
		}
		for _, subject := range subjectResp.Object {
			subjectNameMap[subject.ID] = subject.Name
			defaultSubjectName = subject.Name
		}
	}

	// 获取标签名称
	labelNameMap := make(map[string]string)
	if len(labelIds) > 0 {
		labelIds = util.DuplicateStringRemoval(labelIds)
		labelInfos, err := f.ccDriven.GetLabelByIds(ctx, strings.Join(labelIds, ","))
		if err != nil {
			return nil, err
		}
		for _, labelInfo := range labelInfos.Entries {
			labelNameMap[labelInfo.ID] = labelInfo.Name
		}
	}

	// 构建导出数据
	res := make([]domain.ExportGradeRule, 0, len(rules)+1)

	// 内置追加条件：指定内置导出、导出未分组
	var showInner bool
	for _, id := range req.Ids {
		if id == "1" {
			showInner = true
			break
		}
	}

	if len(req.GroupIds) > 0 {
		showInner = true
	}

	if showInner {
		res = append(res, domain.ExportGradeRule{
			RuleName:            "内置规则",
			LogicalExpression:   fmt.Sprintf("【%s】类的字段", defaultSubjectName),
			ClassificationGrade: fmt.Sprintf("【%s】类的字段分级：无", defaultSubjectName),
			Status:              1,
		})
	}

	for _, rule := range rules {
		// 解析逻辑表达式为Classifications结构
		var classifications domain.Classifications
		err = json.Unmarshal([]byte(rule.LogicalExpression), &classifications)
		log.WithContext(ctx).Info("gradeRuleUseCase.GetDetailById classifications", zap.Any("classifications", classifications))

		if err != nil {
			return nil, err
		}

		log.WithContext(ctx).Info("gradeRuleUseCase.Export classifications", zap.Any("classifications", classifications))

		// 构建ClassificationDetails结构
		classificationDetails := domain.ClassificationDetails{
			Operate:          classifications.Operate,
			GradeRuleDetails: make([]domain.GradeRuleDetail, 0, len(classifications.GradeRules)),
		}
		log.WithContext(ctx).Info("gradeRuleUseCase.Export classificationDetails", zap.Any("classificationDetails", classificationDetails))

		// 遍历每个分级规则
		for _, gradeRule := range classifications.GradeRules {
			// 创建GradeRuleDetail
			detail := domain.GradeRuleDetail{
				Operate:                    gradeRule.Operate,
				ClassificationRuleSubjects: make([]domain.ClassificationRuleSubject, 0, len(gradeRule.ClassificationRuleSubjectIds)),
			}

			// 批量获取分类属性信息
			log.WithContext(ctx).Info("gradeRuleUseCase.Export gradeRule.ClassificationRuleSubjectIds", zap.Any("gradeRule.ClassificationRuleSubjectIds", gradeRule.ClassificationRuleSubjectIds))
			subjectInfo, err := f.dataSubjectDriven.GetObjectPrecision(ctx, gradeRule.ClassificationRuleSubjectIds)
			if err != nil {
				return nil, err
			}

			// 构建ID到Name的映射
			subjectNameMap := make(map[string]string)
			for _, subject := range subjectInfo.Object {
				subjectNameMap[subject.ID] = subject.Name
			}

			// 填充分类属性信息
			for _, subjectId := range gradeRule.ClassificationRuleSubjectIds {
				detail.ClassificationRuleSubjects = append(detail.ClassificationRuleSubjects, domain.ClassificationRuleSubject{
					ID:   subjectId,
					Name: subjectNameMap[subjectId],
				})
			}

			classificationDetails.GradeRuleDetails = append(classificationDetails.GradeRuleDetails, detail)
		}
		log.WithContext(ctx).Info("gradeRuleUseCase.Export classificationDetails", zap.Any("classificationDetails", classificationDetails))
		var logicalExpression string
		if len(classificationDetails.GradeRuleDetails) > 0 {
			if len(classificationDetails.GradeRuleDetails) == 1 && len(classificationDetails.GradeRuleDetails[0].ClassificationRuleSubjects) == 1 {
				logicalExpression = fmt.Sprintf("【%s】类的字段", classificationDetails.GradeRuleDetails[0].ClassificationRuleSubjects[0].Name)
			} else {
				var ruleExpressions []string
				ruleExpressions = append(ruleExpressions, "字段组合：\n")
				for i, gradeRule := range classificationDetails.GradeRuleDetails {
					var subjectExpressions []string
					for _, subject := range gradeRule.ClassificationRuleSubjects {
						subjectExpressions = append(subjectExpressions, fmt.Sprintf("【%s】", subject.Name))
					}
					// 使用当前分组的操作符拼接其内部的字段表达式
					ruleExpr := strings.Join(subjectExpressions, fmt.Sprintf(" %s ", "+"))
					// 如果当前分组包含多个字段，则用括号包裹表达式
					if len(gradeRule.ClassificationRuleSubjects) > 2 {
						ruleExpr = fmt.Sprintf("(%s)", ruleExpr)
					}
					ruleExpressions = append(ruleExpressions, fmt.Sprintf("%d、%s\n", i+1, ruleExpr))
				}
				logicalExpression = strings.Join(ruleExpressions, "")
			}
		}

		// 获取标签信息
		labelAttr, err := f.ccDriven.GetLabelByIds(ctx, fmt.Sprintf("%d", rule.LabelID))
		if err != nil {
			return nil, err
		}

		var labelName string
		if len(labelAttr.Entries) > 0 {
			labelName = labelAttr.Entries[0].Name
		}
		classificationGrade := fmt.Sprintf("【%s】类的字段分级：%s", subjectNameMap[rule.SubjectID], labelName)
		res = append(res, domain.ExportGradeRule{
			RuleName:            rule.Name,
			LogicalExpression:   logicalExpression,
			ClassificationGrade: classificationGrade,
			Status:              int(rule.Status),
		})
	}

	return &domain.ExportGradeRuleResp{
		Data: res,
	}, nil
}

func (f *gradeRuleUseCase) Start(ctx context.Context, req *domain.StartGradeRuleReq) (*domain.StartGradeRuleResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if rule == nil {
		return nil, errorcode.Detail(errorcode.GradeRuleNotFound, "分级规则不存在")
	}
	if rule.Status == 1 {
		return nil, errorcode.Detail(errorcode.GradeRuleNotInUse, "分级规则已启用")
	}
	err = f.repo.UpdateStatus(ctx, req.ID, 1)
	if err != nil {
		return nil, err
	}
	return &domain.StartGradeRuleResp{ID: req.ID}, nil
}

func (f *gradeRuleUseCase) Stop(ctx context.Context, req *domain.StopGradeRuleReq) (*domain.StopGradeRuleResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if rule == nil {
		return nil, errorcode.Detail(errorcode.GradeRuleNotFound, "分级规则不存在")
	}
	if rule.Status == 0 {
		return nil, errorcode.Detail(errorcode.GradeRuleNotInUse, "分级规则已停用")
	}
	err = f.repo.UpdateStatus(ctx, req.ID, 0)
	if err != nil {
		return nil, err
	}
	return &domain.StopGradeRuleResp{ID: req.ID}, nil
}

func (f *gradeRuleUseCase) Statistics(ctx context.Context, req *domain.StatisticsGradeRuleReq) (*domain.StatisticsGradeRuleResp, error) {
	// 获取所有启用的规则
	rules, err := f.repo.GetWorkingRules(ctx)
	if err != nil {
		return nil, err
	}

	// 统计每个主题的规则数量
	subjectCountMap := make(map[string]int64)
	for _, rule := range rules {
		subjectCountMap[rule.SubjectID]++
	}

	// 获取主题名称
	subjectIds := make([]string, 0, len(subjectCountMap))
	for subjectID := range subjectCountMap {
		subjectIds = append(subjectIds, subjectID)
	}

	subjectNameMap := make(map[string]string)
	if len(subjectIds) > 0 {
		subjectResp, err := f.dataSubjectDriven.GetObjectPrecision(ctx, subjectIds)
		if err != nil {
			return nil, err
		}
		for _, subject := range subjectResp.Object {
			subjectNameMap[subject.ID] = subject.Name
		}
	}

	// 构建统计结果
	var statistics []domain.SubjectRuleStatistics
	for subjectID, count := range subjectCountMap {
		statistics = append(statistics, domain.SubjectRuleStatistics{
			SubjectID:   subjectID,
			SubjectName: subjectNameMap[subjectID],
			Count:       count,
		})
	}

	return &domain.StatisticsGradeRuleResp{
		Statistics: statistics,
	}, nil
}

func (f *gradeRuleUseCase) BindGroup(ctx context.Context, req *domain.BindGradeRuleGroupReq) (*domain.BindGradeRuleGroupResp, error) {
	// 校验规则组是否存在
	if req.GroupID != "" {
		groupList, err := f.groupRepo.Details(ctx, []string{req.GroupID})
		if err != nil {
			return nil, err
		}
		if len(groupList) <= 0 {
			return nil, errorcode.Detail(errorcode.GradeRuleGroupNotFound, "规则组不存在")
		}
	}

	err := f.repo.BindGroup(ctx, req.RuleIds, req.GroupID)
	if err != nil {
		return nil, err
	}

	return &domain.BindGradeRuleGroupResp{
		GroupID: req.GroupID,
		RuleIds: req.RuleIds,
	}, nil
}

func (f *gradeRuleUseCase) BatchDelete(ctx context.Context, req *domain.BatchDeleteReq) (*domain.BatchDeleteResp, error) {
	err := f.repo.BatchDelete(ctx, req.Ids)
	if err != nil {
		return nil, err
	}

	return &domain.BatchDeleteResp{
		Ids: req.Ids,
	}, nil
}
