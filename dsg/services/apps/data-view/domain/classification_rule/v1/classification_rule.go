package v1

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/classification_rule"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"

	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule"
	classification_rule_algorithm_relation "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule_algorithm_relation"
	form_view_field "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	recognition_algorithm "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/recognition_algorithm"
	user "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
)

type classificationRuleUseCase struct {
	repo                                    repo.ClassificationRuleRepo
	userRepo                                user.UserRepo
	classificationRuleAlgorithmRelationRepo classification_rule_algorithm_relation.ClassificationRuleAlgorithmRelationRepo
	recognitionAlgorithmRepo                recognition_algorithm.RecognitionAlgorithmRepo
	dataSubjectDriven                       data_subject_local.DrivenDataSubject
	formViewFieldRepo                       form_view_field.FormViewFieldRepo
}

func NewClassificationRuleUseCase(
	repo repo.ClassificationRuleRepo,
	userRepo user.UserRepo,
	classificationRuleAlgorithmRelationRepo classification_rule_algorithm_relation.ClassificationRuleAlgorithmRelationRepo,
	recognitionAlgorithmRepo recognition_algorithm.RecognitionAlgorithmRepo,
	dataSubjectDriven data_subject_local.DrivenDataSubject,
	formViewFieldRepo form_view_field.FormViewFieldRepo,
) domain.ClassificationRuleUseCase {
	return &classificationRuleUseCase{
		repo:                                    repo,
		userRepo:                                userRepo,
		classificationRuleAlgorithmRelationRepo: classificationRuleAlgorithmRelationRepo,
		recognitionAlgorithmRepo:                recognitionAlgorithmRepo,
		dataSubjectDriven:                       dataSubjectDriven,
		formViewFieldRepo:                       formViewFieldRepo,
	}
}

func (f *classificationRuleUseCase) PageList(ctx context.Context, req *domain.PageListClassificationRuleReq) (*domain.PageListClassificationRuleResp, error) {
	total, rules, err := f.repo.PageList(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("ClassificationRuleRepo.PageList", zap.Error(err))
		return nil, err
	}

	// Get subject IDs and rule IDs
	subjectIds := make([]string, 0)
	ruleIds := make([]string, 0)
	for _, rule := range rules {
		subjectIds = append(subjectIds, rule.SubjectID)
		ruleIds = append(ruleIds, rule.ID)
	}

	// Get subject names
	subjectNameMap := make(map[string]string)
	if len(subjectIds) > 0 {
		subjectResp, err := f.dataSubjectDriven.GetObjectPrecision(ctx, subjectIds)
		if err != nil {
			log.WithContext(ctx).Error("GetObjectPrecision", zap.Error(err))
			return nil, err
		}
		for _, subject := range subjectResp.Object {
			subjectNameMap[subject.ID] = subject.Name
		}
	}

	// Get algorithm relations
	algorithmRelations, err := f.classificationRuleAlgorithmRelationRepo.GetWorkingAlgorithmByRuleIds(ctx, ruleIds)
	if err != nil {
		log.WithContext(ctx).Error("GetWorkingAlgorithm", zap.Error(err))
		return nil, err
	}

	// Get algorithm IDs
	algorithmIds := make([]string, 0)
	for _, relation := range algorithmRelations {
		algorithmIds = append(algorithmIds, relation.RecognitionAlgorithmID)
	}
	algorithmIds = util.DuplicateStringRemoval(algorithmIds)

	// Get algorithms
	algorithmMap := make(map[string]*model.RecognitionAlgorithm)
	if len(algorithmIds) > 0 {
		algorithms, err := f.recognitionAlgorithmRepo.GetByIds(ctx, algorithmIds)
		if err != nil {
			log.WithContext(ctx).Error("GetByIds", zap.Error(err))
			return nil, err
		}
		for _, algo := range algorithms {
			algorithmMap[algo.ID] = algo
		}
	}

	// Build response
	res := make([]*domain.ClassificationRule, 0, len(rules)+1)
	res = append(res, &domain.ClassificationRule{
		ID:          "1",
		Name:        "内置规则",
		Description: "内置规则优先级最低",
		Type:        "inner",
		SubjectID:   "default",
		SubjectName: "默认",
		Status:      1,
	})
	for _, rule := range rules {
		// Get algorithm list for this rule
		algorithmList := make([]domain.Algorithm, 0)
		for _, relation := range algorithmRelations {
			if relation.ClassificationRuleID == rule.ID {
				if algo, ok := algorithmMap[relation.RecognitionAlgorithmID]; ok {
					algorithmList = append(algorithmList, domain.Algorithm{
						ID:   algo.ID,
						Name: algo.Name,
					})
				}
			}
		}

		res = append(res, &domain.ClassificationRule{
			ID:          rule.ID,
			Name:        rule.Name,
			Description: rule.Description,
			Type:        "custom",
			SubjectID:   rule.SubjectID,
			SubjectName: subjectNameMap[rule.SubjectID],
			Status:      rule.Status,
			CreatedAt:   rule.CreatedAt.UnixMilli(),
			UpdatedAt:   rule.UpdatedAt.UnixMilli(),
			Algorithms:  algorithmList,
		})
	}

	return &domain.PageListClassificationRuleResp{
		PageResultNew: domain.PageResultNew[domain.ClassificationRule]{
			Entries:    res,
			TotalCount: total + 1,
		},
	}, nil
}

func (f *classificationRuleUseCase) Create(ctx context.Context, req *domain.CreateClassificationRuleReq) (*domain.CreateClassificationRuleResp, error) {
	userInfo, _ := util.GetUserInfo(ctx)

	// Set default type if empty
	if req.Type == "" {
		req.Type = "custom"
	}

	rule := &model.ClassificationRule{
		Name:         req.Name,
		Description:  req.Description,
		SubjectID:    req.SubjectID,
		Status:       1,
		CreatedByUID: userInfo.ID,
		UpdatedByUID: userInfo.ID,
		Type:         req.Type,
	}

	id, err := f.repo.Create(ctx, rule)
	if err != nil {
		return nil, err
	}
	//批量创建分类规则算法关系
	var relations []*model.ClassificationRuleAlgorithmRelation
	for _, algorithmID := range req.AlgorithmIDs {
		relation := &model.ClassificationRuleAlgorithmRelation{
			ClassificationRuleID:   id,
			RecognitionAlgorithmID: algorithmID,
			Status:                 1,
		}
		relations = append(relations, relation)
	}
	err = f.classificationRuleAlgorithmRelationRepo.BatchCreate(ctx, relations)
	if err != nil {
		return nil, err
	}

	return &domain.CreateClassificationRuleResp{
		ID: id,
	}, nil
}

func (f *classificationRuleUseCase) Update(ctx context.Context, req *domain.UpdateClassificationRuleReq) (*domain.UpdateClassificationRuleResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if rule == nil || rule.Type == "inner" {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotInUse, "默认规则不能修改")
	}

	userInfo, _ := util.GetUserInfo(ctx)

	if req.Name != "" {
		rule.Name = req.Name
	}
	if req.Description != "" {
		rule.Description = req.Description
	}
	if req.SubjectID != "" {
		rule.SubjectID = req.SubjectID
	}
	rule.UpdatedByUID = userInfo.ID

	err = f.repo.Update(ctx, rule)
	if err != nil {
		return nil, err
	}
	//批量删除旧的分类规则算法关系
	err = f.classificationRuleAlgorithmRelationRepo.BatchDeleteByRuleId(ctx, rule.ID)
	if err != nil {
		return nil, err
	}
	//批量创建新的分类规则算法关系
	var relations []*model.ClassificationRuleAlgorithmRelation
	for _, algorithmID := range req.AlgorithmIDs {
		relation := &model.ClassificationRuleAlgorithmRelation{
			ClassificationRuleID:   rule.ID,
			RecognitionAlgorithmID: algorithmID,
			Status:                 1,
		}
		relations = append(relations, relation)
	}
	err = f.classificationRuleAlgorithmRelationRepo.BatchCreate(ctx, relations)
	if err != nil {
		return nil, err
	}

	return &domain.UpdateClassificationRuleResp{ID: rule.ID}, nil
}

func (f *classificationRuleUseCase) GetDetailById(ctx context.Context, req *domain.GetDetailByIdReq) (*domain.ClassificationRuleDetailResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if rule == nil || rule.Type == "inner" {
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

	//获取分类规则算法关系
	algorithmRelations, err := f.classificationRuleAlgorithmRelationRepo.GetByRuleId(ctx, rule.ID)
	if err != nil {
		return nil, err
	}

	//获取算法信息
	algorithmMap := make(map[string]*model.RecognitionAlgorithm)
	algorithmIds := make([]string, 0)
	for _, relation := range algorithmRelations {
		algorithmIds = append(algorithmIds, relation.RecognitionAlgorithmID)
	}

	if len(algorithmIds) > 0 {
		algorithms, err := f.recognitionAlgorithmRepo.GetByIds(ctx, algorithmIds)
		if err != nil {
			return nil, err
		}
		for _, algo := range algorithms {
			algorithmMap[algo.ID] = algo
		}
	}

	//拼接Algorithms
	algorithms := make([]domain.Algorithm, 0)
	for _, relation := range algorithmRelations {
		if algo, ok := algorithmMap[relation.RecognitionAlgorithmID]; ok {
			algorithms = append(algorithms, domain.Algorithm{
				ID:   algo.ID,
				Name: algo.Name,
			})
		}
	}
	//获取分类属性信息
	subject, err := f.dataSubjectDriven.GetsObjectById(ctx, rule.SubjectID)
	if err != nil {
		return nil, err
	}
	return &domain.ClassificationRuleDetailResp{
		ID:            rule.ID,
		Name:          rule.Name,
		Description:   rule.Description,
		Type:          rule.Type,
		SubjectID:     rule.SubjectID,
		SubjectName:   subject.Name,
		Status:        int(rule.Status),
		CreatedAt:     rule.CreatedAt.UnixMilli(),
		CreatedByName: createUser.Name,
		UpdatedAt:     rule.UpdatedAt.UnixMilli(),
		UpdatedByName: updateUser.Name,
		Algorithms:    algorithms,
	}, nil
}

func (f *classificationRuleUseCase) Delete(ctx context.Context, req *domain.DeleteClassificationRuleReq) (*domain.DeleteClassificationRuleResp, error) {
	if req.ID == "1" {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotInUse, "默认规则不能删除")
	}
	err := f.repo.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	return &domain.DeleteClassificationRuleResp{ID: req.ID}, nil
}

func (f *classificationRuleUseCase) GetUserMapByIds(ctx context.Context, ids []string) (map[string]string, error) {
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

func (f *classificationRuleUseCase) Export(ctx context.Context, req *domain.ExportClassificationRuleReq) (*domain.ExportClassificationRuleResp, error) {
	// 获取规则列表
	rules, err := f.repo.GetByIds(ctx, req.Ids)
	if err != nil {
		return nil, err
	}

	// 获取规则ID列表
	ruleIds := make([]string, 0)
	subjectIds := make([]string, 0)
	for _, rule := range rules {
		ruleIds = append(ruleIds, rule.ID)
		subjectIds = append(subjectIds, rule.SubjectID)
	}

	// 获取主题名称
	subjectNameMap := make(map[string]string)
	subjectDefaultName := "未分类"
	if len(subjectIds) > 0 {
		subjectResp, err := f.dataSubjectDriven.GetObjectPrecision(ctx, subjectIds)
		if err != nil {
			return nil, err
		}
		for _, subject := range subjectResp.Object {
			subjectNameMap[subject.ID] = subject.Name
			subjectDefaultName = subject.Name
		}
	}

	// 获取算法关系
	algorithmRelations, err := f.classificationRuleAlgorithmRelationRepo.GetWorkingAlgorithmByRuleIds(ctx, ruleIds)
	if err != nil {
		return nil, err
	}

	// 获取算法ID列表
	algorithmIds := make([]string, 0)
	for _, relation := range algorithmRelations {
		algorithmIds = append(algorithmIds, relation.RecognitionAlgorithmID)
	}
	algorithmIds = util.DuplicateStringRemoval(algorithmIds)

	// 获取算法信息
	algorithmMap := make(map[string]*model.RecognitionAlgorithm)
	if len(algorithmIds) > 0 {
		algorithms, err := f.recognitionAlgorithmRepo.GetByIds(ctx, algorithmIds)
		if err != nil {
			return nil, err
		}
		for _, algo := range algorithms {
			algorithmMap[algo.ID] = algo
		}
	}

	// 构建规则ID到算法列表的映射
	ruleAlgorithmMap := make(map[string][]*model.RecognitionAlgorithm)
	for _, relation := range algorithmRelations {
		if algo, ok := algorithmMap[relation.RecognitionAlgorithmID]; ok {
			ruleAlgorithmMap[relation.ClassificationRuleID] = append(ruleAlgorithmMap[relation.ClassificationRuleID], algo)
		}
	}

	// 计算总行数
	totalRows := 0
	for _, rule := range rules {
		totalRows += len(ruleAlgorithmMap[rule.ID])
	}

	// 构建导出数据
	res := make([]domain.ExportClassificationRule, 0, totalRows+1)
	res = append(res, domain.ExportClassificationRule{
		RuleName:      "内置规则",
		Description:   "内置规则优先级最低",
		SubjectName:   subjectDefaultName,
		Status:        1,
		AlgorithmName: "数据识别算法",
		Algorithm:     "通过识别字段名称和属性名称的相似度",
	})
	for _, rule := range rules {
		// 获取该规则关联的算法列表
		algorithms := ruleAlgorithmMap[rule.ID]
		for _, algo := range algorithms {
			res = append(res, domain.ExportClassificationRule{
				RuleName:      rule.Name,
				Description:   rule.Description,
				SubjectName:   subjectNameMap[rule.SubjectID],
				Status:        int(rule.Status),
				AlgorithmName: algo.Name,
				Algorithm:     algo.Algorithm,
			})
		}
	}

	return &domain.ExportClassificationRuleResp{
		Data: res,
	}, nil
}

func (f *classificationRuleUseCase) Start(ctx context.Context, req *domain.StartClassificationRuleReq) (*domain.StartClassificationRuleResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if rule == nil {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotFound, "分类规则不存在")
	}
	if rule.Status == 1 {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotInUse, "分类规则已启用")
	}
	if rule.Type == "inner" {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotInUse, "默认规则不能启用")
	}
	err = f.repo.UpdateStatus(ctx, req.ID, 1)
	if err != nil {
		return nil, err
	}
	return &domain.StartClassificationRuleResp{ID: req.ID}, nil
}

func (f *classificationRuleUseCase) Stop(ctx context.Context, req *domain.StopClassificationRuleReq) (*domain.StopClassificationRuleResp, error) {
	rule, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if rule == nil {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotFound, "分类规则不存在")
	}
	if rule.Status == 0 {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotInUse, "分类规则已停用")
	}
	if rule.Type == "inner" {
		return nil, errorcode.Detail(errorcode.ClassificationRuleNotInUse, "默认规则不能停用")
	}
	err = f.repo.UpdateStatus(ctx, req.ID, 0)
	if err != nil {
		return nil, err
	}
	return &domain.StopClassificationRuleResp{ID: req.ID}, nil
}

func (f *classificationRuleUseCase) Statistics(ctx context.Context, req *domain.StatisticsClassificationRuleReq) (*domain.StatisticsClassificationRuleResp, error) {
	groups, err := f.formViewFieldRepo.GroupBySubjectId(ctx)
	if err != nil {
		return nil, err
	}
	subjectIds := make([]string, 0)
	for _, group := range groups {
		if group.SubjectID != "未分类" && group.SubjectID != "" {
			subjectIds = append(subjectIds, group.SubjectID)
		}
	}
	subjectResp, err := f.dataSubjectDriven.GetObjectPrecision(ctx, subjectIds)
	if err != nil {
		return nil, err
	}
	subjectIdMap := make(map[string]string)
	for _, subject := range subjectResp.Object {
		subjectIdMap[subject.ID] = subject.Name
	}
	subjectIdMap["未分类"] = "未分类"
	var statistics []domain.SubjectRuleStatistics
	for _, group := range groups {
		subjectName := ""
		if name, ok := subjectIdMap[group.SubjectID]; ok {
			subjectName = name
		}
		statistics = append(statistics, domain.SubjectRuleStatistics{
			SubjectID:   group.SubjectID,
			SubjectName: subjectName,
			Count:       group.Count,
		})
	}
	return &domain.StatisticsClassificationRuleResp{
		Statistics: statistics,
	}, nil
}
