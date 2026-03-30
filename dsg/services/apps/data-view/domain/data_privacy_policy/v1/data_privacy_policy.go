package v1

import (
	"context"
	"strconv"

	"fmt"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	virtualization_engine "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/virtualization_engine"
	"go.uber.org/zap"
	"gorm.io/gorm"

	// "github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"errors"

	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy"
	data_privacy_policy_field "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/data_privacy_policy_field"
	datasource_repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/datasource"
	desensitization_rule "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/desensitization_rule"
	form_view "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	form_view_field "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view_field"
	user "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/user"
	data_subject_local "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/rest/data-subject"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	domain "github.com/kweaver-ai/dsg/services/apps/data-view/domain/data_privacy_policy"
	domain_form_view "github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type dataPrivacyPolicyUseCase struct {
	repo                       repo.DataPrivacyPolicyRepo
	dataPrivacyPolicyFieldRepo data_privacy_policy_field.DataPrivacyPolicyFieldRepo
	configurationCenterDriven  configuration_center.Driven
	DrivenDataSubjectNG        data_subject_local.DrivenDataSubject
	userRepo                   user.UserRepo
	formViewRepo               form_view.FormViewRepo
	formViewFieldRepo          form_view_field.FormViewFieldRepo
	desensitizationRuleRepo    desensitization_rule.DesensitizationRuleRepo
	virtualizationEngineDriven virtualization_engine.DrivenVirtualizationEngine
	datasourceRepo             datasource_repo.DatasourceRepo
}

func NewDataPrivacyPolicyUseCase(repo repo.DataPrivacyPolicyRepo,
	dataPrivacyPolicyFieldRepo data_privacy_policy_field.DataPrivacyPolicyFieldRepo,
	configurationCenterDriven configuration_center.Driven,
	DrivenDataSubjectNG data_subject_local.DrivenDataSubject,
	userRepo user.UserRepo,
	formViewRepo form_view.FormViewRepo,
	formViewFieldRepo form_view_field.FormViewFieldRepo,
	desensitizationRuleRepo desensitization_rule.DesensitizationRuleRepo,
	virtualizationEngineDriven virtualization_engine.DrivenVirtualizationEngine,
	datasourceRepo datasource_repo.DatasourceRepo) domain.DataPrivacyPolicyUseCase {
	useCase := &dataPrivacyPolicyUseCase{
		repo:                       repo,
		dataPrivacyPolicyFieldRepo: dataPrivacyPolicyFieldRepo,
		configurationCenterDriven:  configurationCenterDriven,
		DrivenDataSubjectNG:        DrivenDataSubjectNG,
		userRepo:                   userRepo,
		formViewRepo:               formViewRepo,
		formViewFieldRepo:          formViewFieldRepo,
		desensitizationRuleRepo:    desensitizationRuleRepo,
		virtualizationEngineDriven: virtualizationEngineDriven,
		datasourceRepo:             datasourceRepo,
	}
	return useCase
}

func (f *dataPrivacyPolicyUseCase) PageList(ctx context.Context, req *domain.PageListDataPrivacyPolicyReq) (*domain.PageListDataPrivacyPolicyResp, error) {
	if req.DatasourceId != "" {
		// req.DatasourceId = strings.Split(req.DatasourceId, ",")
	}
	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId && req.IncludeSubDepartment {
		req.SubDepartmentIDs = []string{req.DepartmentID}
		departmentList, err := f.configurationCenterDriven.GetDepartmentList(ctx, configuration_center.QueryPageReqParam{Offset: 1, Limit: 0, ID: req.DepartmentID}) //limit 0 Offset 1 not available
		if err != nil {
			return nil, err
		}
		for _, entry := range departmentList.Entries {
			req.SubDepartmentIDs = append(req.SubDepartmentIDs, entry.ID)
		}
	}
	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId && req.IncludeSubSubject {
		req.SubSubSubjectIDs = []string{req.SubjectID}
		subjectList, err := f.DrivenDataSubjectNG.GetSubjectList(ctx, req.SubjectID, "subject_domain,business_object,business_activity,logic_entity")
		if err != nil {
			return nil, err
		}
		for _, entry := range subjectList.Entries {
			req.SubSubSubjectIDs = append(req.SubSubSubjectIDs, entry.Id)
		}
	}
	total, policyList, err := f.repo.PageList(ctx, req)
	if err != nil {
		log.WithContext(ctx).Error("DataPrivacyPolicyRepo.PageList", zap.Error(err))
		return nil, errorcode.Detail(my_errorcode.DataPrivacyPolicyDatabaseError, err.Error())
	}

	policyIds := make([]string, 0)
	for _, policy := range policyList {
		policyIds = append(policyIds, policy.ID)
	}

	uids, formViewIds := f.LoopId(policyList)

	userIdNameMap, err := f.GetUserMapByIds(ctx, uids)
	if err != nil {
		return nil, err
	}
	formViews, formViewMap, err := f.GetFormViewMapByIds(ctx, formViewIds)
	if err != nil {
		return nil, err
	}

	policyFieldList, err := f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyIds(ctx, policyIds)
	if err != nil {
		return nil, err
	}
	formViewFieldIds, desensitizationRuleIds := f.LoopDataPrivacyPolicyFieldId(policyFieldList)
	//获取视图字段map
	formViewFieldMap, err := f.GetFormViewFieldMapByIds(ctx, formViewFieldIds)
	if err != nil {
		return nil, err
	}
	//获取脱敏规则map
	desensitizationRuleMap, err := f.GetDesensitizationRuleMapByIds(ctx, policyFieldList, desensitizationRuleIds)
	if err != nil {
		return nil, err
	}

	subjectIds, departIds := f.LoopFormViewId(formViews)
	//获取所属主题map
	subjectNameMap, _, _, err := f.GetSubjectNameAndPathMap(ctx, subjectIds)
	if err != nil {
		return nil, err
	}
	//获取所属部门map
	departmentNameMap, _, err := f.GetDepartmentNameAndPathMap(ctx, departIds)
	if err != nil {
		return nil, err
	}

	res := make([]*domain.DataPrivacyPolicy, len(policyIds))
	for i, policy := range policyList {
		res[i] = &domain.DataPrivacyPolicy{}
		res[i].Assemble(policy, userIdNameMap, formViewMap, subjectNameMap, departmentNameMap, formViewFieldMap, desensitizationRuleMap)
	}

	return &domain.PageListDataPrivacyPolicyResp{
		PageResultNew: domain.PageResultNew[domain.DataPrivacyPolicy]{
			Entries:    res,
			TotalCount: total,
		},
	}, nil
}

func (f *dataPrivacyPolicyUseCase) LoopId(policies []*model.DataPrivacyPolicy) (uids []string, formViewIds []string) {
	for _, policy := range policies {
		uids = append(uids, policy.CreatedByUID, policy.UpdatedByUID)
		formViewIds = append(formViewIds, policy.FormViewID)
	}
	uids = util.DuplicateStringRemoval(uids)
	formViewIds = util.DuplicateStringRemoval(formViewIds)
	return
}

func (f *dataPrivacyPolicyUseCase) LoopDataPrivacyPolicyFieldId(policyFieldList []*model.DataPrivacyPolicyField) (formViewFieldIds []string, desensitizationRuleIds []string) {
	for _, policyField := range policyFieldList {
		formViewFieldIds = append(formViewFieldIds, policyField.FormViewFieldID)
		desensitizationRuleIds = append(desensitizationRuleIds, policyField.DesensitizationRuleID)
	}
	formViewFieldIds = util.DuplicateStringRemoval(formViewFieldIds)
	desensitizationRuleIds = util.DuplicateStringRemoval(desensitizationRuleIds)
	return
}

func (f *dataPrivacyPolicyUseCase) LoopFormViewId(formViews []*model.FormView) (subjectIds []string, departIds []string) {
	for _, formView := range formViews {
		subjectIds = append(subjectIds, formView.SubjectId.String)
		departIds = append(departIds, formView.DepartmentId.String)
	}
	subjectIds = util.DuplicateStringRemoval(subjectIds)
	departIds = util.DuplicateStringRemoval(departIds)
	return
}

func (f *dataPrivacyPolicyUseCase) GetFormViewFieldMapByIds(ctx context.Context, formViewFieldIds []string) (formViewFieldMap map[string]string, err error) {
	if len(formViewFieldIds) == 0 {
		return nil, nil
	}
	formViewFields, err := f.formViewFieldRepo.GetByIds(ctx, formViewFieldIds)
	if err != nil {
		return nil, err
	}
	if formViewFields == nil {
		return nil, nil
	}
	formViewFieldMap = make(map[string]string)
	for _, formViewField := range formViewFields {
		if formViewFieldMap[formViewField.FormViewID] == "" {
			formViewFieldMap[formViewField.FormViewID] = formViewField.BusinessName
		} else {
			formViewFieldMap[formViewField.FormViewID] += "," + formViewField.BusinessName
		}
	}
	return formViewFieldMap, nil
}

func (f *dataPrivacyPolicyUseCase) GetDesensitizationRuleMapByIds(ctx context.Context, policyFieldList []*model.DataPrivacyPolicyField, desensitizationRuleIds []string) (desensitizationRuleMap map[string]string, err error) {
	if len(desensitizationRuleIds) == 0 {
		return nil, nil
	}
	desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizationRuleIds)
	if err != nil {
		return nil, err
	}
	if desensitizationRules == nil {
		return nil, nil
	}
	desensitizationRuleNameMap := make(map[string]string)
	for _, desensitizationRule := range desensitizationRules {
		desensitizationRuleNameMap[desensitizationRule.ID] = desensitizationRule.Name
	}
	desensitizationRuleMap = make(map[string]string)
	for _, policyField := range policyFieldList {
		if desensitizationRuleMap[policyField.DataPrivacyPolicyID] == "" {
			desensitizationRuleMap[policyField.DataPrivacyPolicyID] = desensitizationRuleNameMap[policyField.DesensitizationRuleID]
		} else {
			desensitizationRuleMap[policyField.DataPrivacyPolicyID] += "," + desensitizationRuleNameMap[policyField.DesensitizationRuleID]
		}
	}
	return desensitizationRuleMap, nil
}

func (f *dataPrivacyPolicyUseCase) GetUserMapByIds(ctx context.Context, ids []string) (map[string]string, error) {
	usersMap := make(map[string]string)
	if len(ids) == 0 {
		return usersMap, nil
	}
	users, err := f.userRepo.GetByUserIds(ctx, ids)
	if err != nil {
		return usersMap, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
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

func (f *dataPrivacyPolicyUseCase) GetFormViewMapByIds(ctx context.Context, ids []string) ([]*model.FormView, map[string]*model.FormView, error) {
	formViewMap := make(map[string]*model.FormView)
	if len(ids) == 0 {
		return nil, formViewMap, nil
	}
	formViews, err := f.formViewRepo.GetByIds(ctx, ids)
	if err != nil {
		return nil, formViewMap, errorcode.Detail(my_errorcode.DatabaseError, err.Error())
	}
	for _, formView := range formViews {
		formViewMap[formView.ID] = formView
	}
	return formViews, formViewMap, nil
}

func (f *dataPrivacyPolicyUseCase) GetSubjectNameAndPathMap(ctx context.Context, subjectIds []string) (nameMap map[string]string, pathIdMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathIdMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(subjectIds) == 0 {
		return
	}
	objects, err := f.DrivenDataSubjectNG.GetObjectPrecision(ctx, subjectIds)
	if err != nil {
		return
	}
	for _, object := range objects.Object {
		nameMap[object.ID] = object.Name
		pathIdMap[object.ID] = object.PathID
		pathMap[object.ID] = object.PathName
	}
	return nameMap, pathIdMap, pathMap, nil
}

func (f *dataPrivacyPolicyUseCase) GetDepartmentNameAndPathMap(ctx context.Context, departmentIds []string) (nameMap map[string]string, pathMap map[string]string, err error) {
	nameMap = make(map[string]string)
	pathMap = make(map[string]string)
	if len(departmentIds) == 0 {
		return nameMap, pathMap, nil
	}
	departmentInfos, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, departmentIds)
	if err != nil {
		return nameMap, pathMap, err
	}

	for _, departmentInfo := range departmentInfos.Departments {
		nameMap[departmentInfo.ID] = ""
		pathMap[departmentInfo.ID] = ""
		if departmentInfo.DeletedAt == 0 {
			nameMap[departmentInfo.ID] = departmentInfo.Name
			pathMap[departmentInfo.ID] = departmentInfo.Path
		}
	}
	return nameMap, pathMap, nil
}

func (f *dataPrivacyPolicyUseCase) Create(ctx context.Context, req *domain.CreateDataPrivacyPolicyReq) (*domain.CreateDataPrivacyPolicyResp, error) {
	policy := &model.DataPrivacyPolicy{
		FormViewID:        req.FormViewID,
		PolicyDescription: req.Description,
	}
	exist, err := f.repo.IsExistByFormViewId(ctx, req.FormViewID)
	if err != nil {
		return nil, err
	}
	if exist {
		return nil, errorcode.Detail(my_errorcode.DataPrivacyPolicyisExist, "数据隐私策略已存在")
	}
	userInfo, _ := util.GetUserInfo(ctx)
	policy.CreatedByUID = userInfo.ID
	policy.UpdatedByUID = userInfo.ID
	id, err := f.repo.Create(ctx, policy)
	if err != nil {
		return nil, err
	}
	return &domain.CreateDataPrivacyPolicyResp{
		ID: id,
	}, nil
}

func (f *dataPrivacyPolicyUseCase) CreateFieldBatch(ctx context.Context, req *domain.CreateDataPrivacyPolicyFieldBatchReq) (*domain.CreateDataPrivacyPolicyFieldBatchResp, error) {
	policyFieldList := make([]*model.DataPrivacyPolicyField, 0)
	for i, fieldId := range req.FormViewFieldIDs {
		policyFieldList = append(policyFieldList, &model.DataPrivacyPolicyField{
			DataPrivacyPolicyID:   req.DataPrivacyPolicyID,
			FormViewFieldID:       fieldId,
			DesensitizationRuleID: req.DesensitizationRuleIDs[i],
		})
	}
	log.Info(fmt.Sprintf("policyFieldList : %d", len(policyFieldList)))
	log.Info(fmt.Sprintf("req.DataPrivacyPolicyID : %s", req.DataPrivacyPolicyID))
	log.Info(fmt.Sprintf("f.dataPrivacyPolicyFieldRepo: %t", f.dataPrivacyPolicyFieldRepo == nil))
	fieldIds, err := f.dataPrivacyPolicyFieldRepo.CreateBatch(ctx, req.DataPrivacyPolicyID, policyFieldList)
	if err != nil {
		return nil, err
	}
	return &domain.CreateDataPrivacyPolicyFieldBatchResp{
		ID: fieldIds[0],
	}, nil
}

func (f *dataPrivacyPolicyUseCase) Update(ctx context.Context, req *domain.UpdateDataPrivacyPolicyReq) (*domain.UpdateDataPrivacyPolicyResp, error) {
	policy, err := f.repo.GetById(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	userInfo, _ := util.GetUserInfo(ctx)
	policy.PolicyDescription = req.Description
	policy.UpdatedByUID = userInfo.ID
	err = f.repo.Update(ctx, policy)
	if err != nil {
		return nil, err
	}
	return &domain.UpdateDataPrivacyPolicyResp{ID: policy.ID}, nil
}

func (f *dataPrivacyPolicyUseCase) GetDetailByFormViewId(ctx context.Context, req *domain.GetDetailByFormViewIdReq) (*domain.DataPrivacyPolicyDetailResp, error) {
	id := req.ID
	policy, err := f.repo.GetByFormViewId(ctx, id)
	if err != nil {
		if err == gorm.ErrRecordNotFound {
            return nil, nil
		}
		return nil, err
	}
	if policy == nil {
		return nil, nil
	}
	return f.GetDetailById(ctx, &domain.GetDetailByIdReq{IDReqParamPath: domain.IDReqParamPath{ID: policy.ID}})
}

func (f *dataPrivacyPolicyUseCase) GetDetailById(ctx context.Context, req *domain.GetDetailByIdReq) (*domain.DataPrivacyPolicyDetailResp, error) {
	id := req.ID
	log.Info(fmt.Sprintf("GetDetailById.id: %s", id))
	policy, err := f.repo.GetById(ctx, id)
	log.Info(fmt.Sprintf("GetDetailById.policy: %+v", policy))
	if err != nil {
		return nil, err
	}
	if policy == nil {
		return nil, fmt.Errorf("data privacy policy not found, id: %s", req.ID)
	}

	policyDetail := &domain.DataPrivacyPolicyDetailResp{}

	policyDetail.ID = policy.ID
	policyDetail.DataPrivacyPolicy.FormViewID = policy.FormViewID
	policyDetail.DataPrivacyPolicy.Description = policy.PolicyDescription
	policyDetail.DataPrivacyPolicy.CreatedAt = policy.CreatedAt.UnixMilli()
	policyDetail.DataPrivacyPolicy.UpdatedAt = policy.UpdatedAt.UnixMilli()
	createUser, err := f.userRepo.GetByUserId(ctx, policy.CreatedByUID)
	if err != nil {
		return nil, err
	}
	if createUser != nil {
		policyDetail.DataPrivacyPolicy.CreatedByUser = createUser.Name
	}
	updateUser, err := f.userRepo.GetByUserId(ctx, policy.UpdatedByUID)
	if err != nil {
		return nil, err
	}
	if updateUser != nil {
		policyDetail.DataPrivacyPolicy.UpdatedByUser = updateUser.Name
	}

	form_view, err := f.formViewRepo.GetById(ctx, policy.FormViewID)
	if err != nil {
		return nil, err
	}
	if form_view != nil {
		policyDetail.BusinessName = form_view.BusinessName
		policyDetail.TechnicalName = form_view.TechnicalName
		policyDetail.UniformCatalogCode = form_view.UniformCatalogCode
	}

	if form_view.SubjectId.Valid && form_view.SubjectId.String != "" {
		subject, err := f.DrivenDataSubjectNG.GetsObjectById(ctx, form_view.SubjectId.String)
		if err != nil {
			return nil, err
		}
		policyDetail.SubjectID = form_view.SubjectId.String
		policyDetail.Subject = subject.Name
	}

	if form_view.DepartmentId.Valid && form_view.DepartmentId.String != "" {
		department, err := f.configurationCenterDriven.GetDepartmentPrecision(ctx, []string{form_view.DepartmentId.String})
		if err != nil {
			return nil, err
		}
		if len(department.Departments) > 0 {
			policyDetail.DepartmentID = form_view.DepartmentId.String
			policyDetail.Department = department.Departments[0].Name
		}
	}

	policyFieldList, err := f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyId(ctx, policy.ID)
	log.Info(fmt.Sprintf("policyFieldList: %+v", policyFieldList))
	if err != nil {
		return nil, err
	}
	formViewFieldIds, desensitizationRuleIds := f.LoopDataPrivacyPolicyFieldId(policyFieldList)
	log.Info(fmt.Sprintf("formViewFieldIds: %+v", formViewFieldIds))
	log.Info(fmt.Sprintf("desensitizationRuleIds: %+v", desensitizationRuleIds))
	//获取视图字段
	if len(formViewFieldIds) == 0 {
		return nil, nil
	}
	formViewFields, err := f.formViewFieldRepo.GetByIds(ctx, formViewFieldIds)
	if err != nil {
		return nil, err
	}
	//获取脱敏规则
	desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizationRuleIds)
	if err != nil {
		return nil, err
	}

	// 批量获取属性信息构建subjectid为key,AttributeInfo为value的map
	var labelIds []string
	for _, field := range formViewFields {
		if field.SubjectID != nil && *field.SubjectID != "" {
			labelIds = append(labelIds, *field.SubjectID)
		}
	}

	attributeInfoMap := make(map[string]domain_form_view.AttributeInfo, 0)
	if len(labelIds) > 0 {
		attributeInfos, err := f.DrivenDataSubjectNG.GetAttributeByIds(ctx, labelIds)
		if err != nil {
			return nil, err
		}
		for _, tempAttributeInfo := range attributeInfos.Attributes {
			attributeInfoMap[tempAttributeInfo.ID] = domain_form_view.AttributeInfo{
				AttributeID: tempAttributeInfo.ID,
				Name:        tempAttributeInfo.Name,
				PathName:    tempAttributeInfo.PathName,
				LabelName:   tempAttributeInfo.LabelName,
				LabelId:     tempAttributeInfo.LabelId,
				LabelIcon:   tempAttributeInfo.LabelIcon,
				LabelPath:   tempAttributeInfo.LabelPath,
			}
		}
	}

	// 构建脱敏规则map
	desensitizationRuleMap := make(map[string]*model.DesensitizationRule)
	policyDesensitizationRuleMap := make(map[string]*model.DesensitizationRule)

	for _, desensitizationRule := range desensitizationRules {
		desensitizationRuleMap[desensitizationRule.ID] = desensitizationRule
	}

	for _, policyField := range policyFieldList {
		policyDesensitizationRuleMap[policyField.DataPrivacyPolicyID] = desensitizationRuleMap[policyField.DesensitizationRuleID]
	}
	// 组装policyDetail.FieldList
	formViewFieldMap := make(map[string]*model.FormViewField)
	for _, field := range formViewFields {
		formViewFieldMap[field.ID] = field
	}

	policyDetail.FieldList = make([]struct {
		FormViewFieldID            string `json:"form_view_field_id"`             // 视图字段id
		FormViewFieldBusinessName  string `json:"form_view_field_business_name"`  // 视图字段业务名称
		FormViewFieldTechnicalName string `json:"form_view_field_technical_name"` // 视图字段技术名称
		FormViewFieldDataGrade     string `json:"form_view_field_data_grade"`     //视图字段数据分级
		DesensitizationRuleID      string `json:"desensitization_rule_id"`        // 脱敏规则id
		DesensitizationRuleName    string `json:"desensitization_rule_name"`      // 脱敏规则名称
		DesensitizationRuleMethod  string `json:"desensitization_rule_method"`    // 脱敏规则方法
	}, 0)

	for _, policyField := range policyFieldList {
		if formViewField, ok := formViewFieldMap[policyField.FormViewFieldID]; ok {
			fieldItem := struct {
				FormViewFieldID            string `json:"form_view_field_id"`             // 视图字段id
				FormViewFieldBusinessName  string `json:"form_view_field_business_name"`  // 视图字段业务名称
				FormViewFieldTechnicalName string `json:"form_view_field_technical_name"` // 视图字段技术名称
				FormViewFieldDataGrade     string `json:"form_view_field_data_grade"`     //视图字段数据分级
				DesensitizationRuleID      string `json:"desensitization_rule_id"`        // 脱敏规则id
				DesensitizationRuleName    string `json:"desensitization_rule_name"`      // 脱敏规则名称
				DesensitizationRuleMethod  string `json:"desensitization_rule_method"`    // 脱敏规则方法
			}{
				FormViewFieldID:            policyField.FormViewFieldID,
				FormViewFieldBusinessName:  formViewField.BusinessName,
				FormViewFieldTechnicalName: formViewField.TechnicalName,
				DesensitizationRuleID:      policyField.DesensitizationRuleID,
			}

			// 获取脱敏规则
			rule := desensitizationRuleMap[policyField.DesensitizationRuleID]

			// 设置规则名称
			if rule != nil {
				fieldItem.DesensitizationRuleName = rule.Name

				// 根据不同的脱敏方法设置不同的描述
				nameMap := map[string]string{
					"all":       "全部脱敏",
					"middle":    "中间脱敏",
					"head-tail": "首尾脱敏",
				}
				switch rule.Method {
				case "all":
					fieldItem.DesensitizationRuleMethod = nameMap[rule.Method]
				case "head-tail":
					fieldItem.DesensitizationRuleMethod = nameMap[rule.Method] + "(首部脱敏" + strconv.Itoa(int(rule.HeadBit)) + "位，尾部脱敏" + strconv.Itoa(int(rule.TailBit)) + "位)"
				case "middle":
					fieldItem.DesensitizationRuleMethod = nameMap[rule.Method] + "(中间脱敏" + strconv.Itoa(int(rule.MiddleBit)) + "位)"
				default:
					fieldItem.DesensitizationRuleMethod = nameMap[rule.Method]
				}

				// 将tempAttributeInfo.LabelName赋值给FormViewFieldDataGrade
				if formViewField.SubjectID != nil && *formViewField.SubjectID != "" {
					if attributeInfo, exists := attributeInfoMap[*formViewField.SubjectID]; exists {
						fieldItem.FormViewFieldDataGrade = attributeInfo.LabelName
					}
				}
			}

			policyDetail.FieldList = append(policyDetail.FieldList, fieldItem)
		}
	}

	return policyDetail, nil
}

func (f *dataPrivacyPolicyUseCase) Delete(ctx context.Context, req *domain.DeleteDataPrivacyPolicyReq) (*domain.DeleteDataPrivacyPolicyResp, error) {
	//删除视图字段
	err := f.dataPrivacyPolicyFieldRepo.DeleteByPolicyID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//删除数据隐私策略
	err = f.repo.Delete(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &domain.DeleteDataPrivacyPolicyResp{ID: req.ID}, nil
}

func (f *dataPrivacyPolicyUseCase) IsExistByFormViewId(ctx context.Context, req *domain.IsExistByFormViewIdReq) (*domain.IsExistByFormViewIdResp, error) {
	isExist, err := f.repo.IsExistByFormViewId(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	return &domain.IsExistByFormViewIdResp{IsExist: isExist}, nil
}

func (f *dataPrivacyPolicyUseCase) GetFormViewIdsByFormViewIds(ctx context.Context, req *domain.GetFormViewIdsByFormViewIdsReq) (*domain.GetFormViewIdsByFormViewIdsResp, error) {
	formViewIds, err := f.repo.GetFormViewIdsByFormViewIds(ctx, req.FormViewIDs)
	if err != nil {
		return nil, err
	}
	return &domain.GetFormViewIdsByFormViewIdsResp{FormViewIDs: formViewIds}, nil
}

func (f *dataPrivacyPolicyUseCase) GetDesensitizationDataById(ctx context.Context, req *domain.GetDesensitizationDataByIdReq) (*domain.GetDesensitizationDataByIdResp, error) {
	var formViewFieldIds []string
	var desensitizationRuleIds []string
	formViewFields := make([]*model.FormViewField, 0)
	dataPrivacyPolicyFields := make([]*model.DataPrivacyPolicyField, 0)
	log.Info(fmt.Sprintf("len(req.FormViewFieldIds): %d", len(req.FormViewFieldIds)))
	if len(req.FormViewFieldIds) == 0 {
		policy, err := f.repo.GetByFormViewId(ctx, req.FormViewID)
		if err != nil {
			return nil, err
		}
		dataPrivacyPolicyFields, err = f.dataPrivacyPolicyFieldRepo.GetFieldsByDataPrivacyPolicyId(ctx, policy.ID)
		if err != nil {
			return nil, err
		}
		formViewFieldIds, desensitizationRuleIds = f.LoopDataPrivacyPolicyFieldId(dataPrivacyPolicyFields)
	} else {
		formViewFieldIds = req.FormViewFieldIds
		desensitizationRuleIds = req.DesensitizationRuleIds
	}
	formView, err := f.formViewRepo.GetById(ctx, req.FormViewID)
	if err != nil {
		return nil, err
	}

	// 获取字段
	columMap := make(map[string]string, 0)
	if req.IsAll {
		// Check if the policy has an associated form view
		formViewFields, err := f.formViewFieldRepo.GetFormViewFields(ctx, formView.ID)
		if err != nil {
			return nil, err
		}
		for _, field := range formViewFields {
			columMap[field.ID] = escape(field.TechnicalName)
		}
	} else {
		//获取视图字段
		if len(formViewFieldIds) == 0 {
			return nil, nil
		}
		formViewFields, err := f.formViewFieldRepo.GetByIds(ctx, formViewFieldIds)
		if err != nil {
			return nil, err
		}
		for _, field := range formViewFields {
			columMap[field.ID] = escape(field.TechnicalName)
		}
	}
	log.Info(fmt.Sprintf("len(columnMap): %d", len(columMap)))
	// 构建脱敏规则map
	if len(desensitizationRuleIds) == 0 {
		return nil, nil
	}
	desensitizationRules, err := f.desensitizationRuleRepo.GetByIds(ctx, desensitizationRuleIds)
	if err != nil {
		return nil, err
	}
	desensitizationRuleMap := make(map[string]*model.DesensitizationRule)
	fieldDesensitizationRuleMap := make(map[string]*model.DesensitizationRule)

	for _, desensitizationRule := range desensitizationRules {
		desensitizationRuleMap[desensitizationRule.ID] = desensitizationRule
	}
	for key, rule := range desensitizationRuleMap {
		log.Info(fmt.Sprintf("desensitizationRuleMap key: %s, rule: %+v", key, rule))
	}
	if len(req.FormViewFieldIds) == 0 {
		for _, policyField := range dataPrivacyPolicyFields {
			fieldDesensitizationRuleMap[policyField.FormViewFieldID] = desensitizationRuleMap[policyField.DesensitizationRuleID]
		}
	} else {
		formViewFields, err = f.formViewFieldRepo.GetByIds(ctx, formViewFieldIds)
		if err != nil {
			return nil, err
		}
		for i, formViewField := range formViewFields {
			log.Info(fmt.Sprintf("desensitizationRuleIds[%d]: %s", i, desensitizationRuleIds[i]))
			fieldDesensitizationRuleMap[formViewField.ID] = desensitizationRuleMap[desensitizationRuleIds[i]]
		}
	}
	log.Info(fmt.Sprintf("len(fieldDesensitizationRuleMap): %d", len(fieldDesensitizationRuleMap)))
	//拼接脱敏sql
	selectSql := ""
	for id, col := range columMap {
		rule := fieldDesensitizationRuleMap[id]
		if rule == nil {
			selectSql += fmt.Sprintf("CAST(%s AS VARCHAR) AS %s,", col, col)
			continue
		}
		if rule.Method == "all" {
			selectSql += fmt.Sprintf("regexp_replace(CAST(%s AS VARCHAR), '.', '*') AS %s,", col, col)
		} else if rule.Method == "middle" {
			selectSql += fmt.Sprintf(
				"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
					"substring(CAST(%s AS VARCHAR), 1, CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer)), '%s', "+
					"substring(CAST(%s AS VARCHAR), CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) + %d, "+
					"length(CAST(%s AS VARCHAR)) - CAST(floor((length(CAST(%s AS VARCHAR)) - %d) / 2) AS integer) - %d)) END AS %s,",
				col, rule.MiddleBit, col,
				col, col, rule.MiddleBit, strings.Repeat("*", int(rule.MiddleBit)),
				col, col, rule.MiddleBit,
				rule.MiddleBit+1, col, col, rule.MiddleBit, rule.MiddleBit, col)
		} else if rule.Method == "head-tail" {
			selectSql += fmt.Sprintf(
				"CASE WHEN length(CAST(%s AS VARCHAR)) < %d THEN regexp_replace(CAST(%s AS VARCHAR), '.', '*') ELSE CONCAT("+
					"'%s', substring(CAST(%s AS VARCHAR), %d, length(CAST(%s AS VARCHAR)) - %d), '%s') END AS %s,",
				col, rule.HeadBit+rule.TailBit, col,
				strings.Repeat("*", int(rule.HeadBit)),
				col, rule.HeadBit+1, col, rule.HeadBit+rule.TailBit, strings.Repeat("*", int(rule.TailBit)), col)
		}
	}
	selectSql = strings.TrimSuffix(selectSql, ",")
	log.Info(fmt.Sprintf("selectSql: %s", selectSql))
	var dataViewSource string
	switch formView.Type {
	case constant.FormViewTypeDatasource.Integer.Int32():
		datasourceInfo, err := f.datasourceRepo.GetById(ctx, formView.DatasourceID)
		if err != nil {
			log.WithContext(ctx).Errorf("f.datasourceRepo.GetById DatabaseError", zap.Error(err))
		}
		dataViewSource = datasourceInfo.DataViewSource
	case constant.FormViewTypeCustom.Integer.Int32():
		dataViewSource = constant.CustomViewSource + constant.CustomAndLogicEntityViewSourceSchema
	case constant.FormViewTypeLogicEntity.Integer.Int32():
		dataViewSource = constant.LogicEntityViewSource + constant.CustomAndLogicEntityViewSourceSchema
	default:
		err = errors.New("unknown form view type")
		log.WithContext(ctx).Errorf("unknown form view type")
	}
	if err != nil {
		return nil, err
	}

	desensitizationSql := fmt.Sprintf(`SELECT %s FROM %s."%s"`, selectSql, dataViewSource, formView.TechnicalName)
	log.Info(fmt.Sprintf("desensitizationSql: %s", desensitizationSql))
	limit := 10
	if req.Limit != nil {
		limit = *req.Limit
	}
	offset := 0
	if req.Offset != nil {
		offset = limit * (*req.Offset - 1)
	}
	desensitizationSql = fmt.Sprintf(`%s OFFSET %d LIMIT %d`, desensitizationSql, offset, limit)
	log.Info(fmt.Sprintf("vitriEngine excute sql : %s", desensitizationSql))
	//todo 拼接sql

	fetchDataRes, err := f.virtualizationEngineDriven.FetchData(ctx, desensitizationSql)
	if err != nil {
		return nil, err
	}
	log.Info(fmt.Sprintf("fetchDataRes: %+v", fetchDataRes))
	return &domain.GetDesensitizationDataByIdResp{FetchDataRes: *fetchDataRes}, nil
}

// quote 转义字段名称
func escape(s string) string {
	s = strings.Replace(s, "\"", "\"\"", -1)
	// 虚拟化引擎要求字段名称使用英文双引号 "" 转义，避免与关键字冲突
	s = fmt.Sprintf(`"%s"`, s)
	return s
}
