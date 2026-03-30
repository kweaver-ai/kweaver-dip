package v1

import (
	"context"
	"fmt"
	"regexp"
	"strconv"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/recognition_algorithm"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"

	classification_rule_repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule"
	classification_rule_algorithm_relation_repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/classification_rule_algorithm_relation"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/recognition_algorithm"
	user "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
)

type recognitionAlgorithmUseCase struct {
	repo                                    repo.RecognitionAlgorithmRepo
	userRepo                                user.UserRepo
	classificationRuleAlgorithmRelationRepo classification_rule_algorithm_relation_repo.ClassificationRuleAlgorithmRelationRepo
	classificationRuleRepo                  classification_rule_repo.ClassificationRuleRepo
	dataSubjectDriven                       data_subject_local.DrivenDataSubject
}

func NewRecognitionAlgorithmUseCase(
	repo repo.RecognitionAlgorithmRepo,
	userRepo user.UserRepo,
	classificationRuleAlgorithmRelationRepo classification_rule_algorithm_relation_repo.ClassificationRuleAlgorithmRelationRepo,
	classificationRuleRepo classification_rule_repo.ClassificationRuleRepo,
	dataSubjectDriven data_subject_local.DrivenDataSubject,
) domain.RecognitionAlgorithmUseCase {
	return &recognitionAlgorithmUseCase{
		repo:                                    repo,
		userRepo:                                userRepo,
		classificationRuleAlgorithmRelationRepo: classificationRuleAlgorithmRelationRepo,
		classificationRuleRepo:                  classificationRuleRepo,
		dataSubjectDriven:                       dataSubjectDriven,
	}
}

func (f *recognitionAlgorithmUseCase) PageList(ctx context.Context, req *domain.PageListRecognitionAlgorithmReq) (*domain.PageListRecognitionAlgorithmResp, error) {
	total, algorithms, err := f.repo.PageList(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("RecognitionAlgorithmRepo.PageList", zap.Error(err))
		return nil, err
	}

	// // 获取创建者和更新者信息
	// userIds := make([]string, 0)
	// for _, algo := range algorithms {
	// 	userIds = append(userIds, algo.CreatedByUID, algo.UpdatedByUID)
	// }
	// userIds = util.DuplicateStringRemoval(userIds)

	// userIdNameMap, err := f.GetUserMapByIds(ctx, userIds)
	// if err != nil {
	// 	return nil, err
	// }

	res := make([]*domain.RecognitionAlgorithm, len(algorithms))
	for i, algo := range algorithms {
		res[i] = &domain.RecognitionAlgorithm{
			ID:          algo.ID,
			Name:        algo.Name,
			Description: algo.Description,
			Algorithm:   algo.Algorithm,
			Type:        algo.Type,
			Status:      algo.Status,
			CreatedAt:   getTimeUnixMilli(algo.CreatedAt),
			UpdatedAt:   getTimeUnixMilli(algo.UpdatedAt),
			// CreatedByName: userIdNameMap[algo.CreatedByUID],
			// UpdatedByName: userIdNameMap[algo.UpdatedByUID],
		}
	}

	return &domain.PageListRecognitionAlgorithmResp{
		PageResultNew: domain.PageResultNew[domain.RecognitionAlgorithm]{
			Entries:    res,
			TotalCount: total,
		},
	}, nil
}

func (f *recognitionAlgorithmUseCase) Create(ctx context.Context, req *domain.CreateRecognitionAlgorithmReq) (*domain.CreateRecognitionAlgorithmResp, error) {
	userInfo, _ := util.GetUserInfo(ctx)

	// 校验正则表达式的有效性
	if req.Algorithm != "" {
		if _, err := regexp.Compile(req.Algorithm); err != nil {
			log.WithContext(ctx).Error(fmt.Sprintf("无效的正则表达式: %s", req.Algorithm), zap.Error(err))
			return nil, errorcode.Detail(errorcode.RecognitionAlgorithmInvalid, fmt.Sprintf("无效的正则表达式: %v", err))
		}
	}

	algorithm := &model.RecognitionAlgorithm{
		Name:         req.Name,
		Description:  req.Description,
		Type:         req.Type,
		InnerType:    req.InnerType,
		Algorithm:    req.Algorithm,
		Status:       req.Status,
		CreatedByUID: userInfo.ID,
		UpdatedByUID: userInfo.ID,
	}

	//DuplicateCheck
	isDuplicate, err := f.repo.DuplicateCheck(ctx, req.Name, "")
	if err != nil {
		return nil, err
	}
	if isDuplicate {
		return nil, errorcode.Detail(errorcode.RecognitionAlgorithmDuplicate, "识别算法名称已存在")
	}
	//InnerCheck
	// if req.Type == "inner" {
	// 	if req.InnerType == "" {
	// 		return nil, nil
	// 	}
	// }
	id, err := f.repo.Create(ctx, algorithm)
	if err != nil {
		return nil, err
	}

	return &domain.CreateRecognitionAlgorithmResp{
		ID: id,
	}, nil
}

func (f *recognitionAlgorithmUseCase) Update(ctx context.Context, req *domain.UpdateRecognitionAlgorithmReq) (*domain.UpdateRecognitionAlgorithmResp, error) {
	algorithm, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//DuplicateCheck
	isDuplicate, err := f.repo.DuplicateCheck(ctx, req.Name, req.ID)
	if err != nil {
		return nil, err
	}
	if isDuplicate {
		return nil, errorcode.Detail(errorcode.RecognitionAlgorithmDuplicate, "识别算法名称已存在")
	}
	//InnerCheck
	// if req.Type == "inner" {
	// 	if req.InnerType == "" {
	// 		return nil, nil
	// 	}
	// }
	userInfo, _ := util.GetUserInfo(ctx)

	// 校验正则表达式的有效性
	if req.Algorithm != "" {
		if _, err := regexp.Compile(req.Algorithm); err != nil {
			log.WithContext(ctx).Error(fmt.Sprintf("无效的正则表达式: %s", req.Algorithm), zap.Error(err))
			return nil, errorcode.Detail(errorcode.RecognitionAlgorithmInvalid, fmt.Sprintf("无效的正则表达式: %v", err))
		}
	}

	if req.Name != "" {
		algorithm.Name = req.Name
	}
	if req.Description != "" {
		algorithm.Description = req.Description
	}
	if req.Type != "" {
		algorithm.Type = req.Type
	}
	if req.InnerType != "" {
		algorithm.InnerType = req.InnerType
	}
	if req.Algorithm != "" {
		algorithm.Algorithm = req.Algorithm
	}
	if req.Status != 0 {
		algorithm.Status = int32(req.Status)
	}
	algorithm.UpdatedByUID = userInfo.ID

	err = f.repo.Update(ctx, algorithm)
	if err != nil {
		return nil, err
	}

	return &domain.UpdateRecognitionAlgorithmResp{ID: algorithm.ID}, nil
}

func (f *recognitionAlgorithmUseCase) GetDetailById(ctx context.Context, req *domain.GetDetailByIdReq) (*domain.RecognitionAlgorithmDetailResp, error) {
	algorithm, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	if algorithm == nil {
		return nil, nil
	}
	var createUser *model.User
	var updateUser *model.User
	// 获取创建者和更新者信息
	if algorithm.CreatedByUID != "" {
		createUser, err = f.userRepo.GetByUserId(ctx, algorithm.CreatedByUID)
		if err != nil {
			return nil, err
		}
	}

	if algorithm.UpdatedByUID != "" {
		updateUser, err = f.userRepo.GetByUserId(ctx, algorithm.UpdatedByUID)
		if err != nil {
			return nil, err
		}
	}

	return &domain.RecognitionAlgorithmDetailResp{
		ID:            algorithm.ID,
		Name:          algorithm.Name,
		Description:   algorithm.Description,
		Algorithm:     algorithm.Algorithm,
		Type:          algorithm.Type,
		InnerType:     algorithm.InnerType,
		Status:        int(algorithm.Status),
		CreatedAt:     formatTime(algorithm.CreatedAt),
		CreatedByName: getUserName(createUser),
		UpdatedAt:     formatTime(algorithm.UpdatedAt),
		UpdatedByName: getUserName(updateUser),
	}, nil
}

func (f *recognitionAlgorithmUseCase) Delete(ctx context.Context, req *domain.DeleteRecognitionAlgorithmReq) (*domain.DeleteRecognitionAlgorithmResp, error) {
	algorithm, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if algorithm == nil {
		return nil, errorcode.Detail(errorcode.RecognitionAlgorithmNotFound, "识别算法不存在")
	}
	// if algorithm.Type == "inner" {
	// 	return nil, errorcode.Detail(errorcode.RecognitionAlgorithmInnerType, "内置算法不能删除")
	// }
	err = f.repo.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}

	return &domain.DeleteRecognitionAlgorithmResp{ID: req.ID}, nil
}

func (f *recognitionAlgorithmUseCase) GetUserMapByIds(ctx context.Context, ids []string) (map[string]string, error) {
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

func (f *recognitionAlgorithmUseCase) GetWorkingAlgorithmIds(ctx context.Context, req *domain.GetWorkingAlgorithmIdsReq) (*domain.GetWorkingAlgorithmIdsResp, error) {
	relations, err := f.classificationRuleAlgorithmRelationRepo.GetWorkingAlgorithmByAlgorithmIds(ctx, req.Ids)
	if err != nil {
		return nil, err
	}
	seen := make(map[string]bool)
	var uniqueRelations []*model.ClassificationRuleAlgorithmRelation
	for _, relation := range relations {
		if !seen[relation.RecognitionAlgorithmID] {
			seen[relation.RecognitionAlgorithmID] = true
			uniqueRelations = append(uniqueRelations, relation)
		}
	}
	relations = uniqueRelations

	workingIds := make([]string, 0)
	for _, relation := range relations {
		workingIds = append(workingIds, relation.RecognitionAlgorithmID)
	}
	return &domain.GetWorkingAlgorithmIdsResp{WorkingIds: workingIds}, nil
}

func (f *recognitionAlgorithmUseCase) DeleteBatch(ctx context.Context, req *domain.DeleteBatchRecognitionAlgorithmReq) (*domain.DeleteBatchRecognitionAlgorithmResp, error) {
	if req.Mode == "force" {
		// 强制删除，删除算法的同时删除关联关系
		algorithms, err := f.repo.GetByIds(ctx, req.Ids)
		if err != nil {
			return nil, err
		}
		algorithmIds := make([]string, 0)
		for _, algo := range algorithms {
			// if algo.Type == "inner" {
			// 	return nil, errorcode.Detail(errorcode.RecognitionAlgorithmInnerType, "内置算法不能删除")
			// }
			algorithmIds = append(algorithmIds, algo.ID)
		}
		err = f.classificationRuleAlgorithmRelationRepo.BatchDeleteByAlgorithmIds(ctx, algorithmIds)
		if err != nil {
			return nil, err
		}
		// 删除算法
		err = f.repo.DeleteBatch(ctx, algorithmIds)
		if err != nil {
			return nil, err
		}
		return &domain.DeleteBatchRecognitionAlgorithmResp{DeletedIds: algorithmIds}, nil
	} else {
		algorithms, err := f.repo.GetByIds(ctx, req.Ids)
		if err != nil {
			return nil, err
		}
		algorithmIds := make([]string, 0)
		for _, algo := range algorithms {
			// if algo.Type == "inner" {
			// 	return nil, errorcode.Detail(errorcode.RecognitionAlgorithmInnerType, "内置算法不能删除")
			// }
			algorithmIds = append(algorithmIds, algo.ID)
		}
		// 安全删除，只删除无关联关系的算法
		// 获取关联关系
		relations, err := f.classificationRuleAlgorithmRelationRepo.GetWorkingAlgorithmByAlgorithmIds(ctx, algorithmIds)
		if err != nil {
			return nil, err
		}
		// 获取无关联关系的算法ID
		ids := make([]string, 0)
		relatedIds := make(map[string]bool)
		for _, relation := range relations {
			relatedIds[relation.RecognitionAlgorithmID] = true
		}
		for _, id := range algorithmIds {
			if !relatedIds[id] {
				ids = append(ids, id)
			}
		}
		// 删除无关联关系的算法
		err = f.repo.DeleteBatch(ctx, ids)
		if err != nil {
			return nil, err
		}
		return &domain.DeleteBatchRecognitionAlgorithmResp{DeletedIds: ids}, nil
	}
}

func (f *recognitionAlgorithmUseCase) Start(ctx context.Context, req *domain.StartRecognitionAlgorithmReq) (*domain.StartRecognitionAlgorithmResp, error) {
	algorithm, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if algorithm == nil {
		return nil, errorcode.Detail(errorcode.RecognitionAlgorithmNotFound, "识别算法不存在")
	}
	if algorithm.Status == 1 {
		return nil, errorcode.Detail(errorcode.RecognitionAlgorithmInUse, "识别算法已启用")
	}
	err = f.repo.UpdateStatus(ctx, req.ID, 1)
	if err != nil {
		return nil, err
	}
	return &domain.StartRecognitionAlgorithmResp{ID: req.ID}, nil
}

func (f *recognitionAlgorithmUseCase) Stop(ctx context.Context, req *domain.StopRecognitionAlgorithmReq) (*domain.StopRecognitionAlgorithmResp, error) {
	algorithm, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if algorithm == nil {
		return nil, errorcode.Detail(errorcode.RecognitionAlgorithmNotFound, "识别算法不存在")
	}
	if algorithm.Status == 0 {
		return nil, errorcode.Detail(errorcode.RecognitionAlgorithmNotInUse, "识别算法已停用")
	}
	err = f.repo.UpdateStatus(ctx, req.ID, 0)
	if err != nil {
		return nil, err
	}
	return &domain.StopRecognitionAlgorithmResp{ID: req.ID}, nil
}

func (f *recognitionAlgorithmUseCase) Export(ctx context.Context, req *domain.ExportRecognitionAlgorithmReq) (*domain.ExportRecognitionAlgorithmResp, error) {
	algorithms, err := f.repo.GetByIds(ctx, req.Ids)
	if err != nil {
		return nil, err
	}
	res := make([]domain.RecognitionAlgorithm, len(algorithms))
	for i, algo := range algorithms {
		res[i] = domain.RecognitionAlgorithm{
			ID:          algo.ID,
			Name:        algo.Name,
			Description: algo.Description,
			Algorithm:   algo.Algorithm,
			Type:        algo.Type,
			Status:      algo.Status,
			CreatedAt:   getTimeUnixMilli(algo.CreatedAt),
			UpdatedAt:   getTimeUnixMilli(algo.UpdatedAt),
		}
	}
	return &domain.ExportRecognitionAlgorithmResp{Data: res}, nil
}

func (f *recognitionAlgorithmUseCase) GetInnerType(ctx context.Context, req *domain.GetInnerTypeReq) (*domain.GetInnerTypeResp, error) {
	// 返回固定的内置算法数据
	innerMaps := []domain.InnerMap{
		{
			InnerType:      "身份证",
			InnerAlgorithm: "^[1-9]\\d{5}(?:18|19|20)\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}[\\dXx]$|^[1-9]\\d{5}\\d{2}(?:0[1-9]|1[0-2])(?:0[1-9]|[1-2]\\d|3[0-1])\\d{3}$",
		},
		{
			InnerType:      "手机号",
			InnerAlgorithm: "^1[3-9]\\d{9}$",
		},
		{
			InnerType:      "邮箱",
			InnerAlgorithm: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$",
		},
		{
			InnerType:      "银行卡号",
			InnerAlgorithm: "^[1-9]\\d{12,18}$",
		},
	}

	// 如果指定了特定的 InnerType，则只返回匹配的数据
	if req.InnerType != "" {
		filteredMaps := make([]domain.InnerMap, 0)
		for _, m := range innerMaps {
			if m.InnerType == req.InnerType {
				filteredMaps = append(filteredMaps, m)
				break
			}
		}
		return &domain.GetInnerTypeResp{InnerMap: filteredMaps}, nil
	}

	return &domain.GetInnerTypeResp{InnerMap: innerMaps}, nil
}

func (f *recognitionAlgorithmUseCase) DuplicateCheck(ctx context.Context, req *domain.DuplicateCheckReq) (*domain.DuplicateCheckResp, error) {
	log.WithContext(ctx).Info("DuplicateCheck.req.Name", zap.Any("req.Name", req.Name))
	isDuplicate, err := f.repo.DuplicateCheck(ctx, req.Name, req.ID)
	log.WithContext(ctx).Info("DuplicateCheck.isDuplicate", zap.Any("isDuplicate", isDuplicate))
	if err != nil {
		return nil, err
	}
	log.WithContext(ctx).Info("DuplicateCheck.isDuplicateString", zap.Any("isDuplicateString", strconv.FormatBool(isDuplicate)))
	return &domain.DuplicateCheckResp{IsDuplicate: strconv.FormatBool(isDuplicate)}, nil
}

func (f *recognitionAlgorithmUseCase) GetSubjectsByIds(ctx context.Context, req *domain.GetSubjectsByIdsReq) (*domain.GetSubjectsByIdsResp, error) {
	relations, err := f.classificationRuleAlgorithmRelationRepo.GetWorkingAlgorithmByAlgorithmIds(ctx, req.Ids)
	if err != nil {
		return nil, err
	}
	//根据relations获取分类id列表
	classificationRuleIds := make([]string, 0)
	for _, relation := range relations {
		classificationRuleIds = append(classificationRuleIds, relation.ClassificationRuleID)
	}
	//去重
	classificationRuleIds = util.DuplicateStringRemoval(classificationRuleIds)
	//根据classificationRuleIds获取分类属性classificationRules
	classificationRules, err := f.classificationRuleRepo.GetByIds(ctx, classificationRuleIds)
	if err != nil {
		return nil, err
	}
	//根据classificationRules构造classificationRuleId与classificationRule的映射
	classificationRuleMap := make(map[string]model.ClassificationRule)
	for _, classificationRule := range classificationRules {
		classificationRuleMap[classificationRule.ID] = *classificationRule
	}
	//根据classificationRules获取分类属性subjectids
	subjectIds := make([]string, 0)
	for _, classificationRule := range classificationRules {
		subjectIds = append(subjectIds, classificationRule.SubjectID)
	}
	//根据subjectIds获取分类属性subjects
	// Get subject names
	subjectMap := make(map[string]domain.Subject)
	if len(subjectIds) > 0 {
		subjectResp, err := f.dataSubjectDriven.GetObjectPrecision(ctx, subjectIds)
		if err != nil {
			log.WithContext(ctx).Error("GetObjectPrecision", zap.Error(err))
			return nil, err
		}
		for _, subject := range subjectResp.Object {
			subjectMap[subject.ID] = domain.Subject{
				ID:          subject.ID,
				Name:        subject.Name,
				Description: subject.Description,
				PathId:      subject.PathID,
				PathName:    subject.PathName,
			}
		}
	}
	//构造结构体，合并ClassificationRule与Subject
	// Merge each ClassificationRule with its corresponding Subject into a combined structure.
	type mergedClassificationRule struct {
		ClassificationRule model.ClassificationRule
		Subject            domain.Subject
	}
	mergedRulesMap := make(map[string]mergedClassificationRule)
	for _, rule := range classificationRules {
		if sub, found := subjectMap[rule.SubjectID]; found {
			mergedRulesMap[rule.ID] = mergedClassificationRule{
				ClassificationRule: *rule,
				Subject:            sub,
			}
		}
	}
	// 构造algorithmId与mergedClassificationRule的映射
	algorithmMap := make(map[string][]mergedClassificationRule)
	for _, relation := range relations {
		algorithmMap[relation.RecognitionAlgorithmID] = append(algorithmMap[relation.RecognitionAlgorithmID], mergedRulesMap[relation.ClassificationRuleID])
	}

	//根据relations构造algorithmIds
	algorithmIds := make([]string, 0)
	for _, relation := range relations {
		algorithmIds = append(algorithmIds, relation.RecognitionAlgorithmID)
	}
	//去重
	algorithmIds = util.DuplicateStringRemoval(algorithmIds)
	// 获取算法名称
	algorithms, err := f.repo.GetByIds(ctx, algorithmIds)
	if err != nil {
		return nil, err
	}
	// 构造算法ID到名称的映射
	algorithmNameMap := make(map[string]string)
	for _, algo := range algorithms {
		algorithmNameMap[algo.ID] = algo.Name
	}
	// 根据algorithmIds与algorithmMap构造[]AlgorithmSubject
	algorithmSubjects := make([]domain.AlgorithmSubject, 0, len(algorithmIds))
	for _, algorithmId := range algorithmIds {
		// 获取该算法关联的所有mergedClassificationRule
		mergedRules := algorithmMap[algorithmId]

		// 从mergedRules中提取所有Subject并去重
		subjectMap := make(map[string]domain.Subject)
		for _, rule := range mergedRules {
			// Only add non-empty subjects to the map
			if rule.Subject.ID != "" {
				subjectMap[rule.Subject.ID] = rule.Subject
			}
		}

		// 将去重后的subjects转换为切片
		subjects := make([]domain.Subject, 0, len(subjectMap))
		for _, subject := range subjectMap {
			subjects = append(subjects, subject)
		}

		// 构造AlgorithmSubject
		algorithmSubject := domain.AlgorithmSubject{
			AlgorithmID:   algorithmId,
			AlgorithmName: algorithmNameMap[algorithmId],
			Subjects:      subjects,
		}
		algorithmSubjects = append(algorithmSubjects, algorithmSubject)
	}

	return &domain.GetSubjectsByIdsResp{AlgorithmSubjects: algorithmSubjects}, nil
}

func getTimeUnixMilli(t time.Time) int64 {
	if t.IsZero() {
		return 0
	}
	return t.UnixMilli()
}

func formatTime(t time.Time) string {
	if t.IsZero() {
		return ""
	}
	return t.Format(time.RFC3339)
}

func getUserName(user *model.User) string {
	if user == nil {
		return ""
	}
	return user.Name
}
