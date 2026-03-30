package subject_domain

import (
	"context"
	"encoding/json"
	"errors"
	"path"
	"strconv"
	"strings"
	"time"

	"github.com/kweaver-ai/idrm-go-common/rest/af_sailor"

	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/data_subject"

	api_audit_v1 "github.com/kweaver-ai/idrm-go-common/api/audit/v1"
	"github.com/kweaver-ai/idrm-go-common/audit"

	"github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/indicator_management"
	"github.com/kweaver-ai/idrm-go-common/rest/standardization"
	"github.com/kweaver-ai/idrm-go-common/util/iter"

	formSubjectRelation "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/form_subject_relation"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/standard_info"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/subject_domain"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/user"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/rest/sailor_service"
	sailorService "github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/rest/sailor_service"
	"github.com/kweaver-ai/idrm-go-common/errorcode"
	"github.com/kweaver-ai/idrm-go-common/interception"
	"github.com/kweaver-ai/idrm-go-common/middleware"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/adapter/driven/gorm/classify"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-subject/common/errorcode"

	//"github.com/kweaver-ai/dsg/services/apps/data-subject/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/domain/excel_process"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type SubjectDomainUsecase struct {
	repo     subject_domain.SubjectDomainRepo
	userMgr  user_management.DrivenUserMgnt
	userRepo user.UserRepo
	standard standard_info.StandardInfoRepo
	// s                   standardzation.Driven
	standardDriven      standardization.Driven
	ccDriven            configuration_center.Driven
	formRelationRepo    formSubjectRelation.Repo
	dataViewDriven      data_view.Driven
	appServiceDriven    data_application_service.Driven
	indicatorDriven     indicator_management.Driven
	sailorServiceDriven sailorService.GraphSearch
	classifyRepo        classify.Repo
	process             *excel_process.ExcelProcessUsecase
	sailorDriven        af_sailor.Driven
}

func NewSubjectDomainUseCase(repo subject_domain.SubjectDomainRepo,
	userMgr user_management.DrivenUserMgnt,
	userRepo user.UserRepo,
	standard standard_info.StandardInfoRepo,
	standardDriven standardization.Driven,
	formRelationRepo formSubjectRelation.Repo,
	ccDriven configuration_center.Driven,
	dataViewDriven data_view.Driven,
	appServiceDriven data_application_service.Driven,
	indicatorDriven indicator_management.Driven,
	process *excel_process.ExcelProcessUsecase,
	sailorService sailorService.GraphSearch,
	classifyRepo classify.Repo,
	sailorDriven af_sailor.Driven,
) *SubjectDomainUsecase {
	return &SubjectDomainUsecase{repo: repo,
		userMgr:          userMgr,
		userRepo:         userRepo,
		standard:         standard,
		ccDriven:         ccDriven,
		formRelationRepo: formRelationRepo,
		process:          process,
		// s:                   s,
		standardDriven:      standardDriven,
		dataViewDriven:      dataViewDriven,
		sailorServiceDriven: sailorService,
		classifyRepo:        classifyRepo,
		appServiceDriven:    appServiceDriven,
		indicatorDriven:     indicatorDriven,
		sailorDriven:        sailorDriven,
	}
}

func (c *SubjectDomainUsecase) AddObject(ctx context.Context, req *AddObjectReq) (*AddObjectResp, error) {
	l := audit.FromContextOrDiscard(ctx)
	var parentObject *model.SubjectDomain
	var err error
	// 创建业务域
	if req.ParentID == "" {
		if req.Type != string(constant.StringSubjectDomainGroup) {
			return nil, errorcode.Desc(my_errorcode.UnsupportedCreate)
		}
		if req.Owners != nil {
			return nil, errorcode.Desc(my_errorcode.UnsupportedAddOwner)
		}
	} else {
		parentObject, err = c.repo.GetObjectByID(ctx, req.ParentID)
		if err != nil {
			return nil, err
		}
		switch parentObject.Type {
		case constant.SubjectDomainGroup:
			if req.Type != string(constant.StringSubjectDomain) {
				return nil, errorcode.Desc(my_errorcode.UnsupportedCreate)
			}
			if len(req.Owners) == 0 {
				return nil, errorcode.Desc(my_errorcode.OwnersNotExist)
			}
		case constant.SubjectDomain:
			if req.Type != string(constant.StringBusinessObject) && req.Type != string(constant.StringBusinessActivity) {
				return nil, errorcode.Desc(my_errorcode.UnsupportedCreate)
			}
			if len(req.Owners) == 0 {
				return nil, errorcode.Desc(my_errorcode.OwnersNotExist)
			}
		default:
			return nil, errorcode.Desc(my_errorcode.UnsupportedCreate)
		}
	}

	// 名称存在检测
	if err := c.nameExistCheck(ctx, req.ParentID, "", req.Name); err != nil {
		return nil, err
	}

	//if len(req.Owners) > 0 {
	//	exist, err := c.ccDriven.GetCheckUserPermission(ctx, access_control.ManagerDataFLFJPermission, req.Owners[0])
	//	if err != nil {
	//		return nil, err
	//	}
	//	if !exist {
	//		return nil, errorcode.Desc(my_errorcode.OwnersIncorrect)
	//	}
	//}

	m := req.ToModel(ctx.Value(interception.InfoName).(*middleware.User), parentObject)

	if err := c.repo.Insert(ctx, m); err != nil {
		return nil, err
	}

	c.auditInfo(ctx, l, m, "Create")
	return &AddObjectResp{ID: m.ID}, nil
}

func (c *SubjectDomainUsecase) nameExistCheck(ctx context.Context, parentId, id, name string) error {
	exist, err := c.repo.NameExistCheck(ctx, parentId, id, name)
	if err != nil {
		return err
	}
	if exist {
		log.WithContext(ctx).Errorf("object name already exist, name: %v, parentId id: %v", name, parentId)
		return errorcode.Desc(my_errorcode.NameRepeat)
	}
	return nil
}

func (c *SubjectDomainUsecase) DelObject(ctx context.Context, req *DelObjectReq) (*DelObjectResp, error) {
	l := audit.FromContextOrDiscard(ctx)
	object, err := c.repo.GetObjectByID(ctx, req.DID)
	if err != nil {
		return nil, err
	}
	//查询该层级下所有的逻辑实体
	child, err := c.repo.GetSpecialChildByID(ctx, req.DID, constant.LogicEntity)
	if err != nil {
		return nil, err
	}
	deleteReq := &data_view.DeleteRelatedReq{
		SubjectDomainIDs: []string{req.DID},
		LogicEntityIDs: util.Gen[string](child, func(domain *model.SubjectDomain) string {
			return domain.ID
		}),
	}
	//删除关联的数据
	if !deleteReq.Empty() {
		err = util.TraceA1R1(ctx, deleteReq, c.dataViewDriven.DeleteRelated)
		if err != nil {
			return nil, err
		}
	}
	err = c.repo.Delete(ctx, object.PathID)
	if err != nil {
		return nil, err
	}

	c.auditInfo(ctx, l, object, "Delete")
	return &DelObjectResp{ID: req.DID}, nil
}

func (c *SubjectDomainUsecase) UpdateObject(ctx context.Context, req *UpdateObjectReq) (*UpdateObjectResp, error) {
	l := audit.FromContextOrDiscard(ctx)

	object, err := c.repo.GetObjectByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	switch object.Type {
	case constant.SubjectDomainGroup:
		if req.Type != "" {
			req.Type = ""
			//return nil, errorcode.Desc(my_errorcode.UnsupportedUpdateType)
		}
		if req.Owners != nil {
			return nil, errorcode.Desc(my_errorcode.UnsupportedAddOwner)
		}
	case constant.SubjectDomain:
		if req.Type != "" {
			req.Type = ""
			//return nil, errorcode.Desc(my_errorcode.UnsupportedUpdateType)
		}
		if len(req.Owners) == 0 {
			return nil, errorcode.Desc(my_errorcode.OwnersNotExist)
		}
	case constant.BusinessObject, constant.BusinessActivity:
		if req.Type == "" {
			return nil, errorcode.Desc(my_errorcode.TypeNotExist)
		}
		if len(req.Owners) == 0 {
			return nil, errorcode.Desc(my_errorcode.OwnersNotExist)
		}
	default:
		return nil, errorcode.Desc(my_errorcode.UnsupportedUpdate)
	}
	arr := strings.Split(object.PathID, "/")
	parentID := ""
	if len(arr) > 1 {
		parentID = arr[len(arr)-2]
	}
	if err = c.nameExistCheck(ctx, parentID, req.ID, req.Name); err != nil {
		return nil, err
	}
	//if len(req.Owners) > 0 {
	//	exist, err := c.ccDriven.GetCheckUserPermission(ctx, access_control.ManagerDataFLFJPermission, req.Owners[0])
	//	if err != nil {
	//		return nil, err
	//	}
	//	if !exist {
	//		return nil, errorcode.Desc(my_errorcode.OwnersIncorrect)
	//	}
	//}
	var objectType int8
	if req.Type != "" {
		objectType = constant.SubjectDomainObjectStringToInt(req.Type)
	} else {
		objectType = object.Type
	}
	m := &model.SubjectDomain{
		ID:           req.ID,
		Name:         req.Name,
		Description:  req.Description,
		Type:         objectType,
		Owners:       req.Owners,
		UpdatedByUID: ctx.Value(interception.InfoName).(*middleware.User).ID,
	}
	var objects []*model.SubjectDomain
	if req.Name != object.Name {
		objects, err = c.repo.GetByParentID(ctx, object.PathID)
		if err != nil {
			return nil, err
		}
		parentPath, _ := path.Split(object.Path)
		newPath := parentPath + req.Name
		for _, obj := range objects {
			obj.Path = strings.Replace(obj.Path, object.Path, newPath, 1)
		}
	}
	if err := c.repo.Update(ctx, m, objects); err != nil {
		return nil, err
	}

	c.auditInfo(ctx, l, m, "Update")
	return &UpdateObjectResp{ID: req.ID}, nil
}

func (c *SubjectDomainUsecase) GetObject(ctx context.Context, req *GetObjectReq) (*GetObjectResp, error) {
	object, err := c.repo.GetObjectByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	userInfo := &middleware.User{}
	if len(object.Owners) > 0 {
		name, _, _, err := c.userMgr.GetUserNameByUserID(ctx, object.Owners[0])
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get user name by user id, user id: %v, err: %v", object.Owners[0], err)
			name = object.Owners[0]
		}
		userInfo.ID = object.Owners[0]
		userInfo.Name = name
	}
	/*userInfos, err := c.userMgr.BatchGetUserInfoByID(ctx, util.DuplicateStringRemoval([]string{object.CreatedByUID, object.UpdatedByUID}))
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.UserMgrBatchGetUserInfoByIDFailure, err.Error())
	}*/
	userInfos, err := c.GetByUserMapByIds(ctx, util.DuplicateStringRemoval([]string{object.CreatedByUID, object.UpdatedByUID}))
	if err != nil {
		return nil, err
	}
	return &GetObjectResp{
		ID:          object.ID,
		Name:        object.Name,
		Description: object.Description,
		PathID:      object.PathID,
		PathName:    object.Path,
		Type:        constant.SubjectDomainObjectIntToString(object.Type),
		Owners: &UserInfoResp{
			UID:      userInfo.ID,
			UserName: userInfo.Name,
		},
		CreatedBy: userInfos[object.CreatedByUID],
		CreatedAt: object.CreatedAt.UnixMilli(),
		UpdatedBy: userInfos[object.UpdatedByUID],
		UpdatedAt: object.UpdatedAt.UnixMilli(),
	}, nil
}

func (c *SubjectDomainUsecase) GetAttribute(ctx context.Context, req *GetAttributeReq) (*GetAttributRes, error) {
	var recommendAttributeIds []string
	// 选择全部时候， 如果带了视图ID和字段ID, 先获取推荐字段
	if req.ParentID == "" && req.FieldID != "" && req.ViewID != "" {
		// 构造请求body
		viewDetails, err := c.dataViewDriven.GetDataViewDetails(ctx, req.ViewID)
		if err != nil {
			return nil, err
		}
		viewFields, err := c.dataViewDriven.GetDataViewField(ctx, req.ViewID)
		if err != nil {
			return nil, err
		}
		RecommendInfo := &sailor_service.DataCategorizeReq{
			ViewID:       req.ViewID,
			ViewBusiName: viewDetails.BusinessName,
			ViewTechName: viewDetails.TechnicalName,
			ViewDesc:     viewDetails.Description,
			SubjectID:    viewDetails.SubjectID,
		}
		for _, viewField := range viewFields.FieldsRes {
			if viewField.ID == req.FieldID {
				recommendField := &sailor_service.ViewFiledsReq{
					FieldBusiName: viewField.BusinessName,
					FieldTechName: viewField.TechnicalName,
					FieldID:       viewField.ID,
					StandardCode:  viewField.StandardCode,
				}
				RecommendInfo.ViewFields = append(RecommendInfo.ViewFields, recommendField)
			}
		}
		// 调用af-sailor-service获取推荐属性
		resp, err := c.sailorServiceDriven.DataClassificationExplore(ctx, RecommendInfo)
		if err != nil {
			log.Errorf("query recommend info from af_sailor service error %v", err.Error())
		} else {
			for _, field := range resp.Result.Answers.ViewFields {
				for _, result := range field.MatchResults {
					recommendAttributeIds = append(recommendAttributeIds, result.SubjectID)
				}
			}
		}
	}
	// recommendAttributeIds = append(recommendAttributeIds, "3459b112-6c2f-4e81-af77-65fcb420fa9b")
	attributes, err := c.repo.GetAttribute(ctx, req.ID, req.ParentID, req.Keyword, recommendAttributeIds)
	if err != nil {
		return nil, err
	}

	labelInfosMap, err := c.GetLabelInfos(ctx, attributes)
	if err != nil {
		return nil, err
	}

	res := make([]*GetAttributResp, len(attributes))
	for i, attribute := range attributes {
		var labelId, labelName, labelIcon, labelPath string
		if attribute.LabelID != 0 {
			_, ok := labelInfosMap[strconv.Itoa(int(attribute.LabelID))]
			if ok {
				labelId = strconv.Itoa(int(attribute.LabelID))
				labelName = labelInfosMap[labelId].Name
				labelIcon = labelInfosMap[labelId].LabelIcon
				labelPath = labelInfosMap[labelId].LabelPath
			}
		}
		// 比较前三个是不是推荐字段，如果是，打上推荐标签
		var lsRecommend bool
		if (i == 0 || i == 1 || i == 2) && len(recommendAttributeIds) > 0 {
			for _, recommendAttributeId := range recommendAttributeIds {
				if recommendAttributeId == attribute.ID {
					lsRecommend = true
				}
			}
		}

		res[i] = &GetAttributResp{
			ID:          attribute.ID,
			Name:        attribute.Name,
			Description: attribute.Description,
			PathID:      attribute.PathID,
			PathName:    attribute.Path,
			LabelId:     labelId,
			LabelName:   labelName,
			LabelIcon:   labelIcon,
			LabelPath:   labelPath,
			LsRecommend: lsRecommend,
		}
	}
	return &GetAttributRes{
		Attributes: res,
	}, nil
}

func (c *SubjectDomainUsecase) GetAttributes(ctx context.Context, req *GetAttributesReq) (*GetAttributRes, error) {
	attributes, err := c.repo.GetObjectByIDS(ctx, req.IDs, constant.Attribute)
	if err != nil {
		return nil, err
	}

	labelInfosMap, err := c.GetLabelInfos(ctx, attributes)
	if err != nil {
		return nil, err
	}

	res := make([]*GetAttributResp, len(attributes))
	for i, attribute := range attributes {
		var labelId, labelName, labelIcon, labelPath string
		if attribute.LabelID != 0 {
			_, ok := labelInfosMap[strconv.Itoa(int(attribute.LabelID))]
			if ok {
				labelId = strconv.Itoa(int(attribute.LabelID))
				labelName = labelInfosMap[labelId].Name
				labelIcon = labelInfosMap[labelId].LabelIcon
				labelPath = labelInfosMap[labelId].LabelPath
			}
		}
		res[i] = &GetAttributResp{
			ID:          attribute.ID,
			Name:        attribute.Name,
			Description: attribute.Description,
			PathID:      attribute.PathID,
			PathName:    attribute.Path,
			LabelId:     labelId,
			LabelName:   labelName,
			LabelIcon:   labelIcon,
			LabelPath:   labelPath,
		}
	}
	return &GetAttributRes{
		Attributes: res,
	}, nil
}

func (c *SubjectDomainUsecase) GetLabelInfos(ctx context.Context, attributes []*model.SubjectDomain) (map[string]LabInfo, error) {
	var labelIds []string
	for _, attribute := range attributes {
		if attribute.LabelID != 0 {
			labelIds = append(labelIds, strconv.Itoa(int(attribute.LabelID)))
		}
	}
	labelInfosMap := make(map[string]LabInfo, 0)
	// 如果有标签id，查询标签信息
	if len(labelIds) > 0 {
		labelIds = util.DuplicateStringRemoval(labelIds)
		labelInfos, err := c.ccDriven.GetLabelByIds(ctx, strings.Join(labelIds, ","))
		if err != nil {
			return nil, err
		}
		for _, labelInfo := range labelInfos.Entries {
			labelInfosMap[labelInfo.ID] = LabInfo{
				Name:      labelInfo.Name,
				LabelIcon: labelInfo.LabelIcon,
				LabelPath: labelInfo.LabelPath,
			}
		}
	}
	return labelInfosMap, nil
}

func (c *SubjectDomainUsecase) GetPath(ctx context.Context, req *GetPathReq) (*GetPathResp, error) {
	ids := make([]string, 0)
	arr := strings.Split(req.IDS, ",")
	for i := range arr {
		ids = append(ids, arr[i])
	}
	objects, err := c.repo.GetBusinessObjectByIDS(ctx, ids)
	if err != nil {
		return nil, err
	}

	pathInfos := make([]*PathInfo, 0, len(objects))
	for _, object := range objects {
		info := &PathInfo{
			ID:       object.ID,
			Name:     object.Name,
			PathID:   object.PathID,
			PathName: object.Path,
			Type:     object.Type,
		}
		pathInfos = append(pathInfos, info)
	}

	return &GetPathResp{PathInfo: pathInfos}, nil
}
func (c *SubjectDomainUsecase) GetObjectEntityPath(ctx context.Context, req *GetPathReq) (*GetPathResp, error) {
	ids := make([]string, 0)
	arr := strings.Split(req.IDS, ",")
	for i := range arr {
		ids = append(ids, arr[i])
	}
	objects, err := c.repo.GetBusinessObjectAndLogicEntityByIDS(ctx, ids)
	if err != nil {
		return nil, err
	}

	pathInfos := make([]*PathInfo, 0, len(objects))
	for _, object := range objects {
		info := &PathInfo{
			ID:       object.ID,
			Name:     object.Name,
			PathID:   object.PathID,
			PathName: object.Path,
			Type:     object.Type,
		}
		pathInfos = append(pathInfos, info)
	}

	return &GetPathResp{PathInfo: pathInfos}, nil
}

func (c *SubjectDomainUsecase) GetLevelCount(ctx context.Context, req *GetLevelCountReq) (*GetLevelCountResp, error) {
	countInfo, groupCount, err := c.repo.GetLevelCount(ctx, req.ID)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	totalCounter := c.NewTotalCounter(ctx)
	return &GetLevelCountResp{
		LevelBusinessDomain:     countInfo.LevelBusinessDomain,
		LevelSubjectDomain:      countInfo.LevelSubjectDomain,
		LevelBusinessObject:     countInfo.LevelBusinessObject,
		LevelBusinessAct:        countInfo.LevelBusinessAct,
		LevelBusinessObj:        countInfo.LevelBusinessObj,
		LevelLogicEntities:      countInfo.LevelLogicEntities,
		LevelAttributes:         countInfo.LevelAttributes,
		TotalLogicalView:        totalCounter.FormViewTotal,
		TotalIndicator:          totalCounter.IndicatorTotal,
		TotalInterfaceService:   totalCounter.InterfaceTotal,
		SubjectDomainGroupCount: groupCount,
	}, nil
}

func (c *SubjectDomainUsecase) List(ctx context.Context, req *ListObjectsReq) (*ListObjectsResp, error) {
	//valid := form_validator.CheckKeyWord(&req.Keyword)
	//if !valid {
	//	return NewListObjectsResp(make([]*ObjectInfo, 0), 0), nil
	//}
	if req.ParentID != "" {
		_, err := c.repo.GetObjectByID(ctx, req.ParentID)
		if err != nil {
			log.WithContext(ctx).Error("parent object not found", zap.String("object id", req.ParentID), zap.Error(err))
			return nil, err
		}
	}
	list, total, err := c.repo.List(ctx, req.ParentID, req.IsAll, req.PageInfoWithKeyword, req.Type, req.NeedCount)
	if err != nil {
		return nil, err
	}
	var listChildren, listSecondChildren []*model.SubjectDomain
	childMap := make(map[string]int64)
	secondChildMap := make(map[string]int64)
	var arr []string
	var parentPath string
	if !req.IsAll || (req.IsAll && req.ParentID != "") {
		listChildren, _ = c.repo.ListChild(ctx, req.ParentID, false)
		if len(listChildren) > 0 {
			arr = strings.Split(listChildren[0].PathID, "/")
			parentPath = strings.Join(arr[:len(arr)-1], "/")
			var childCount int64
			for _, child := range listChildren {
				if strings.HasPrefix(child.PathID, parentPath) {
					childCount++
				} else {
					childMap[parentPath] = childCount
					arr = strings.Split(child.PathID, "/")
					parentPath = strings.Join(arr[:len(arr)-1], "/")
					childCount = 1
				}
			}
			childMap[parentPath] = childCount
		}
	}
	if req.IsAll && req.ParentID != "" {
		if len(listChildren) > 0 {
			listSecondChildren, _ = c.repo.ListChild(ctx, req.ParentID, true)
			if len(listSecondChildren) > 0 {
				arr = strings.Split(listSecondChildren[0].PathID, "/")
				parentPath = strings.Join(arr[:3], "/")
				var secondChildCount int64
				for _, child := range listSecondChildren {
					if strings.HasPrefix(child.PathID, parentPath) {
						if child.Type == constant.LogicEntity {
							// childCount++
						} else if child.Type == constant.Attribute {
							secondChildCount++
						}
					} else {
						// childMap[parentPath] = childCount
						secondChildMap[parentPath] = secondChildCount
						arr = strings.Split(child.PathID, "/")
						parentPath = strings.Join(arr[:3], "/")
						if child.Type == constant.LogicEntity {
							// childCount = 1
							secondChildCount = 0
						} else if child.Type == constant.Attribute {
							// childCount = 0
							secondChildCount = 1
						}
					}
				}
				// childMap[parentPath] = childCount
				secondChildMap[parentPath] = secondChildCount
			}
		}
	}
	infos := make([]*ObjectInfo, 0, len(list))

	//获取用户名
	uids := make([]string, 0)
	logicalEntityIDSlice := make([]string, 0)
	for _, info := range list {
		uids = append(uids, info.CreatedByUID, info.UpdatedByUID)
		if info.Type == constant.LogicEntity {
			logicalEntityIDSlice = append(logicalEntityIDSlice, info.ID)
		}
	}
	/*userInfos, err := c.userMgr.BatchGetUserInfoByID(ctx, util.DuplicateStringRemoval(uids))
	if err != nil {
		return nil, errorcode.Detail(my_errorcode.UserMgrBatchGetUserInfoByIDFailure, err.Error())
	}*/
	uids = util.DuplicateStringRemoval(uids)
	userInfos, err := c.GetByUserMapByIds(ctx, uids)
	if err != nil {
		return nil, err
	}

	//如果是查询所有的
	counter := NewEmptyCounter()
	hasChildDict := make(map[string]bool)
	if req.NeedTotal {
		counter = c.NewAllCounter(ctx)
		hasChildDict, err = c.repo.GroupHasChild(ctx)
		if err != nil {
			log.Errorf("query has child error %v", err.Error())
		}
	}

	for _, info := range list {
		object := &ObjectInfo{
			ID:          info.ID,
			Name:        info.Name,
			Description: info.Description,
			Type:        constant.SubjectDomainObjectIntToString(info.Type),
			PathID:      info.PathID,
			PathName:    info.Path,
			Owners:      info.Owners,
			CreatedBy:   userInfos[info.CreatedByUID],
			CreatedAt:   info.CreatedAt.UnixMilli(),
			UpdatedBy:   userInfos[info.UpdatedByUID],
			UpdatedAt:   info.UpdatedAt.UnixMilli(),
		}
		if len(childMap) > 0 {
			object.ChildCount = childMap[info.PathID]
		}
		if len(secondChildMap) > 0 {
			object.SecondChildCount = secondChildMap[info.PathID]
		}
		//视图数量
		object.LogicViewCount = counter.FormViewCount[object.ID]
		//指标
		object.IndicatorCount = counter.IndicatorCount[object.ID]
		//接口
		object.InterfaceCount = counter.InterfaceCount[object.ID]
		//给出是否有子节点
		object.HasChild = hasChildDict[object.ID]

		infos = append(infos, object)
	}

	return NewListObjectsResp(infos, total), nil
}

func (c *SubjectDomainUsecase) CheckRepeat(ctx context.Context, req *CheckRepeatReq) (*CheckRepeatResp, error) {
	if req.ID != "" {
		_, err := c.repo.GetObjectByID(ctx, req.ID)
		if err != nil {
			return nil, err
		}
	}
	if req.ParentID != "" {
		_, err := c.repo.GetObjectByID(ctx, req.ParentID)
		if err != nil {
			return nil, err
		}
	}
	repeat, err := c.repo.NameExistCheck(ctx, req.ParentID, req.ID, req.Name)
	if err != nil {
		return nil, err
	}
	return &CheckRepeatResp{Name: req.Name, Repeat: repeat}, nil
}

func (c *SubjectDomainUsecase) AddBusinessObject(ctx context.Context, req *AddBusinessObjectReq) (*AddBusinessObjectResp, error) {
	l := audit.FromContextOrDiscard(ctx)

	businessObject, err := c.repo.GetObjectByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	if businessObject.Type != constant.BusinessObject && businessObject.Type != constant.BusinessActivity {
		return nil, errorcode.Desc(my_errorcode.UnsupportedCreate)
	}
	businessObjects, err := c.repo.GetBusinessObjectByIDS(ctx, req.RefID)
	if err != nil {
		return nil, err
	}

	if len(businessObjects) != len(req.RefID) {
		return nil, errorcode.Desc(my_errorcode.RefObjectNotExist)
	}
	// 检查唯一标识
	for _, le := range req.LogicEntities {
		count := 0
		for _, attr := range le.Attributes {
			if attr.Unique {
				count++
			}
		}
		if count > 1 {
			return nil, errorcode.Desc(my_errorcode.UniqueErr)
		}
	}
	// if businessObject.Type == constant.BusinessObject && count == 0 {
	// 	return nil, errorcode.Desc(my_errorcode.UniqueNotExist)
	// }

	entities := make([]*model.SubjectDomain, 0)
	attrs := make([]*model.SubjectDomain, 0)
	userInfo := ctx.Value(interception.InfoName).(*middleware.User)
	now := time.Now()
	for _, logicEntity := range req.LogicEntities {

		// 逻辑实体
		id, err := utils.GetUniqueID()
		if err != nil {
			return nil, err
		}
		m := &model.SubjectDomain{
			DomainID:     id,
			ID:           logicEntity.ID,
			Name:         logicEntity.Name,
			PathID:       businessObject.PathID + "/" + logicEntity.ID,
			Path:         businessObject.Path + "/" + logicEntity.Name,
			Type:         constant.LogicEntity,
			CreatedAt:    now,
			CreatedByUID: userInfo.ID,
			UpdatedAt:    now,
			UpdatedByUID: userInfo.ID,
		}
		entities = append(entities, m)

		for _, attribute := range logicEntity.Attributes {
			labelID, _ := strconv.Atoi(attribute.LabelID)
			standardID, _ := strconv.ParseUint(attribute.StandardID, 10, 64)
			a := &model.SubjectDomain{
				ID:         attribute.ID,
				Name:       attribute.Name,
				PathID:     m.PathID + "/" + attribute.ID,
				Path:       m.Path + "/" + attribute.Name,
				Type:       constant.Attribute,
				StandardID: uint64(standardID),
				LabelID:    uint64(labelID),
				// StandardStatus: standardStatus,
				CreatedAt:    now,
				CreatedByUID: userInfo.ID,
				UpdatedAt:    now,
				UpdatedByUID: userInfo.ID,
			}
			if attribute.Unique {
				a.Unique = 1
			}
			attrs = append(attrs, a)
		}
	}
	//缓存标准
	if err := c.CacheSubjectStandard(ctx, attrs); err != nil {
		return nil, err
	}
	refID := ""
	if len(req.RefID) > 0 {
		b, err := json.Marshal(req.RefID)
		if err != nil {
			return nil, err
		}
		refID = string(b)
	}
	//获取被删除的实体ID
	delEntitys, err := c.repo.GetDeleteEntityID(ctx, businessObject.PathID,
		util.Gen(entities, func(d *model.SubjectDomain) string { return d.ID }))
	if err != nil {
		return nil, err
	}
	//调接口，删除关联实体
	if err := c.dataViewDriven.DeleteRelated(ctx, &data_view.DeleteRelatedReq{
		MoveDeletes: delEntitys,
	}); err != nil {
		return nil, err
	}
	//更新实体
	if err := c.repo.UpdateBusinessObject(ctx, businessObject.PathID, refID, userInfo.ID, entities, attrs); err != nil {
		return nil, err
	}
	c.auditInfo(ctx, l, businessObject, "UpdateBusinessObjectContent")

	return &AddBusinessObjectResp{ID: req.ID}, nil
}
func (c *SubjectDomainUsecase) AddBusinessObject2(ctx context.Context, userInfo *middleware.User, isNew bool, businessObject *model.SubjectDomain, logicEntities []*LogicEntity) error {
	entities := make([]*model.SubjectDomain, 0)
	attrs := make([]*model.SubjectDomain, 0)
	now := time.Now()
	for _, logicEntity := range logicEntities {
		// 逻辑实体
		id, err := utils.GetUniqueID()
		if err != nil {
			return err
		}
		m := &model.SubjectDomain{
			DomainID:     id,
			ID:           logicEntity.ID,
			Name:         logicEntity.Name,
			PathID:       businessObject.PathID + "/" + logicEntity.ID,
			Path:         businessObject.Path + "/" + logicEntity.Name,
			Type:         constant.LogicEntity,
			CreatedAt:    now,
			CreatedByUID: userInfo.ID,
			UpdatedAt:    now,
			UpdatedByUID: userInfo.ID,
		}
		entities = append(entities, m)
		for _, attribute := range logicEntity.Attributes {
			// 属性
			standardID, _ := strconv.ParseUint(attribute.StandardID, 10, 64)
			a := &model.SubjectDomain{
				ID:           attribute.ID,
				Name:         attribute.Name,
				PathID:       m.PathID + "/" + attribute.ID,
				Path:         m.Path + "/" + attribute.Name,
				Type:         constant.Attribute,
				StandardID:   uint64(standardID),
				CreatedAt:    now,
				CreatedByUID: userInfo.ID,
				UpdatedAt:    now,
				UpdatedByUID: userInfo.ID,
			}
			if attribute.Unique {
				a.Unique = 1
			}
			attrs = append(attrs, a)
		}
	}
	//缓存标准
	if err := c.CacheSubjectStandard(ctx, attrs); err != nil {
		return err
	}

	if err := c.repo.CreateOrUpdateBusinessObject(ctx, isNew, businessObject, userInfo.ID, entities, attrs); err != nil {
		return err
	}

	return nil
}

func (c *SubjectDomainUsecase) GetBusinessObject(ctx context.Context, req *GetBusinessObjectReq) (*GetBusinessObjectResp, error) {
	businessObjectInfo := new(GetBusinessObjectResp)
	businessObject, err := c.repo.GetObjectByID(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	refIDS := make([]string, 0)
	if len(businessObject.RefID) > 0 {
		err = json.Unmarshal([]byte(businessObject.RefID), &refIDS)
		if err != nil {
			return nil, err
		}
	}
	refInfos := make([]*RefInfo, 0)
	for _, id := range refIDS {
		res, err := c.repo.GetObjectByID(ctx, id)
		if err != nil {
			continue
		}
		refInfo := &RefInfo{
			ID:       res.ID,
			Name:     res.Name,
			PathID:   res.PathID,
			PathName: res.Path,
			Type:     constant.SubjectDomainObjectIntToString(res.Type),
		}
		refInfos = append(refInfos, refInfo)
	}

	businessObjectInfo.RefInfo = refInfos
	// 获取创建的逻辑实体和属性
	logicEntities, err := c.repo.GetObjectsByParentID(ctx, businessObject.PathID, constant.LogicEntity)
	if err != nil {
		return nil, err
	}
	logicEntityInfos := make([]*LogicEntityInfo, 0)
	for _, logicEntity := range logicEntities {
		logicEntityInfo := new(LogicEntityInfo)
		attributeInfos := make([]*AttributeInfo, 0)
		attributes, err := c.repo.GetObjectsByParentID(ctx, logicEntity.PathID, constant.Attribute)
		if err != nil {
			return nil, err
		}
		labelInfosMap, err := c.GetLabelInfos(ctx, attributes)
		if err != nil {
			return nil, err
		}
		for _, attribute := range attributes {

			attributeInfo := new(AttributeInfo)

			attributeInfo.ID = attribute.ID
			attributeInfo.Name = attribute.Name
			attributeInfo.Path = attribute.Path

			// 添加标签
			var labelId, labelName, labelIcon, labelPath string
			if attribute.LabelID != 0 {
				_, ok := labelInfosMap[strconv.Itoa(int(attribute.LabelID))]
				if ok {
					labelId = strconv.Itoa(int(attribute.LabelID))
					labelName = labelInfosMap[labelId].Name
					labelIcon = labelInfosMap[labelId].LabelIcon
					labelPath = labelInfosMap[labelId].LabelPath
				}
			}
			attributeInfo.LabelID = labelId
			attributeInfo.LabelName = labelName
			attributeInfo.LabelIcon = labelIcon
			attributeInfo.LabelPath = labelPath

			if attribute.StandardID > 0 {
				standardInfo, err := c.standard.GetStandardById(ctx, attribute.StandardID)
				if err != nil {
					return nil, err
				}
				attributeInfo.StandardInfo = &StandardInfo{
					ID:        strconv.Itoa(int(standardInfo.ID)),
					Name:      standardInfo.Name,
					NameEn:    standardInfo.NameEn,
					DataType:  standardInfo.DataType,
					LabelID:   labelId,
					LabelName: labelName,
					LabelIcon: labelIcon,
					LabelPath: labelPath,
				}
			}
			if attribute.Unique > 0 {
				attributeInfo.Unique = true
			} else {
				attributeInfo.Unique = false
			}
			attributeInfos = append(attributeInfos, attributeInfo)
		}
		logicEntityInfo.ID = logicEntity.ID
		logicEntityInfo.Name = logicEntity.Name
		logicEntityInfo.Attributes = attributeInfos

		logicEntityInfos = append(logicEntityInfos, logicEntityInfo)
	}
	businessObjectInfo.LogicEntities = logicEntityInfos
	return businessObjectInfo, nil
}

func (c *SubjectDomainUsecase) CheckReferences(ctx context.Context, req *CheckReferencesReq) (*CheckReferencesResp, error) {
	object, errs := c.repo.GetObjectByID(ctx, req.ID)
	if errs != nil {
		return nil, errs
	}
	if object.Type != constant.BusinessObject && object.Type != constant.BusinessActivity {
		return nil, errorcode.Desc(my_errorcode.ObjectNotExist)
	}
	res := &CheckReferencesResp{
		ID: req.ID,
	}
	arr := strings.Split(req.RefID, ",")
	ids := make([]string, 0)
	for i := range arr {
		if req.ID == arr[i] {
			res.CircularReference = true
			return res, nil
		}
		ids = append(ids, arr[i])
	}
	var err error
	var check bool
	for {
		if err == nil && len(ids) > 0 {
			check, ids, err = c.Check(ctx, req.ID, ids)
			if err != nil {
				return nil, err
			}
			if check {
				res.CircularReference = true
				return res, nil
			}
		} else {
			break
		}
	}
	res.CircularReference = false
	return res, nil
}

func (c *SubjectDomainUsecase) Check(ctx context.Context, id string, ids []string) (bool, []string, error) {
	newIDS := make([]string, 0)
	businessObjects, err := c.repo.GetBusinessObjectByIDS(ctx, ids)
	if err != nil {
		return false, newIDS, err
	}
	for _, businessObject := range businessObjects {
		if len(businessObject.RefID) > 0 {
			refIDS := make([]string, 0)
			err = json.Unmarshal([]byte(businessObject.RefID), &refIDS)
			if err != nil {
				return false, newIDS, err
			}
			for _, refID := range refIDS {
				if refID == id {
					return true, newIDS, nil
				}
				newIDS = append(newIDS, refID)
			}
		}
	}
	return false, newIDS, nil
}

func (c *SubjectDomainUsecase) GetBusinessObjectOwner(ctx context.Context, req *GetBusinessObjectOwnerReq) (*GetBusinessObjectOwnerResp, error) {
	arr := strings.Split(req.IDS, ",")
	businessObjects, err := c.repo.GetBusinessObjectByIDS(ctx, arr)
	if err != nil {
		return nil, err
	}
	ids := make([]string, 0)
	idSet := map[string]struct{}{}
	for _, businessObject := range businessObjects {
		for _, owner := range businessObject.Owners {
			if _, ok := idSet[owner]; !ok {
				idSet[owner] = struct{}{}
				ids = append(ids, owner)
			}
		}
	}
	userInfos, err := c.userMgr.BatchGetUserInfoByID(ctx, util.DuplicateStringRemoval(ids))
	if err != nil {
		return nil, err
	}
	ownerInfos := make([]*OwnerInfo, 0)
	for _, obj := range businessObjects {
		ownerInfo := new(OwnerInfo)
		ownerInfo.BusinessObjectID = obj.ID
		for _, userInfo := range userInfos {
			if obj.Owners == nil {
				ownerInfos = append(ownerInfos, ownerInfo)
			} else if obj.Owners[0] == userInfo.ID {
				ownerInfo.UserID = userInfo.ID
				ownerInfo.UserName = userInfo.VisionName
				departmentInfos := make([]*Department, 0)
				for _, parents := range userInfo.ParentDeps {
					departmentInfo := new(Department)
					departmentInfo.DepartmentID = parents.Department[len(parents.Department)-1].ID
					departmentInfo.DepartmentName = parents.Department[len(parents.Department)-1].Name
					departmentInfos = append(departmentInfos, departmentInfo)
				}
				ownerInfo.Departments = departmentInfos
				ownerInfos = append(ownerInfos, ownerInfo)
			}
		}
	}
	resp := &GetBusinessObjectOwnerResp{
		OwnerInfo: ownerInfos,
	}
	return resp, nil
}
func (c *SubjectDomainUsecase) GetBusinessObjectsInternal(ctx context.Context, req *ObjectIdInternalReq) ([]*model.SubjectDomain, error) {
	if _, err := c.repo.GetObjectByIDNative(ctx, req.Id); err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(my_errorcode.RefBusinessObjectNotExist)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	objects, err := c.repo.GetByBusinessObjectId(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	return objects, nil
}
func (c *SubjectDomainUsecase) GetBusinessObjectInternal(ctx context.Context, req *ObjectIdInternalReq) (*model.SubjectDomain, error) {
	object, err := c.repo.GetObjectByIDNative(ctx, req.Id)
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Desc(my_errorcode.RefBusinessObjectNotExist)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return object, nil
}

func (c *SubjectDomainUsecase) GetAttributeByObjectInternal(ctx context.Context, req *ObjectIdInternalReq) ([]string, error) {
	attribute, err := c.repo.GetAttributeByObject(ctx, req.Id)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return attribute, nil
}

func (c *SubjectDomainUsecase) BatchCreateObjectAndContent(ctx context.Context, req *BatchCreateObjectAndContentReq) error {
	parentIds := make([]string, len(req.ObjectAndContent), len(req.ObjectAndContent))
	hasNew := false
	nameMap := make(map[string][]string) //[parentId] name slice
	for i, objectContent := range req.ObjectAndContent {
		if objectContent.Id != "" {
			continue
		}
		hasNew = true
		parentIds[i] = objectContent.ParentID
		//Owner校验
		//if len(objectContent.Owner) > 0 {
		//	exist, err := c.ccDriven.GetCheckUserPermission(ctx, access_control.ManagerDataFLFJPermission, objectContent.Owner) //todo change to batch
		//	if err != nil {
		//		return err
		//	}
		//	if !exist {
		//		return errorcode.Desc(my_errorcode.OwnersIncorrect)
		//	}
		//}
		//name根据业务对象划分
		if nameMap[objectContent.ParentID] == nil {
			nameMap[objectContent.ParentID] = make([]string, 0)
		}
		nameMap[objectContent.ParentID] = append(nameMap[objectContent.ParentID], objectContent.Name)

	}
	var subjectDomainMap map[string]*model.SubjectDomain
	var err error
	if hasNew {
		//parentId校验
		subjectDomainMap, err = c.GetSubjectDomainMapByIDS(ctx, util.DuplicateStringRemoval(parentIds))
		if err != nil {
			return err
		}

		// 名称存在检测
		for k, v := range nameMap {
			if util.IsDuplicateString(v) { //一个业务对象下新建的名称重复
				return errorcode.Desc(my_errorcode.BusinessObjectNameExist)
			}
			if err := c.repo.NameExist(ctx, k, v); err != nil { //一个业务对象下与原有的名称重复
				return err
			}
		}
	}

	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return err
	}
	for _, objectContent := range req.ObjectAndContent {
		var businessObject *model.SubjectDomain
		if objectContent.Id == "" {
			businessObject = objectContent.ToModel(userInfo, subjectDomainMap[objectContent.ParentID])
		} else {
			businessObject, err = c.repo.GetObjectByID(ctx, objectContent.Id)
		}
		if err = c.AddBusinessObject2(ctx, userInfo, objectContent.Id == "", businessObject, objectContent.LogicEntities); err != nil {
			return err
		}
	}

	return nil
}
func (c *SubjectDomainUsecase) BatchCreateObjectContent(ctx context.Context, req *BatchCreateObjectContentReq) error {
	userInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return err
	}
	objectIds := make([]string, 0)
	entities := make([]*model.SubjectDomain, 0)
	addAttrs := make([]*model.SubjectDomain, 0)
	updateAttrs := make([]*model.SubjectDomain, 0)
	ids := make([]string, 0)

	formEntitiesID, err := c.formRelationRepo.GetFormEntities(ctx, req.FormID)
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	for _, objectContent := range req.Contents {
		objectIds = append(objectIds, objectContent.Id)
		businessObject, err := c.repo.GetObjectByID(ctx, objectContent.Id)
		if err != nil {
			return errorcode.Detail(my_errorcode.BusinessObjectNotExist, err.Error())
		}

		for _, logicEntity := range objectContent.LogicEntities {
			formEntitiesID = append(formEntitiesID, logicEntity.ID)
		}
		formEntitiesID = util.SliceUnique(formEntitiesID)

		//属性
		attrs := make([]*model.SubjectDomain, 0)
		idSet := map[string]struct{}{}
		attributes, err := c.repo.GetFormAttributeByObject(ctx, objectContent.Id, formEntitiesID)
		if err != nil {
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		for _, id := range attributes {
			if _, ok := idSet[id]; !ok {
				idSet[id] = struct{}{}
			}
		}
		now := time.Now()
		for _, logicEntity := range objectContent.LogicEntities {
			// 逻辑实体
			m := &model.SubjectDomain{
				ID:           logicEntity.ID,
				Name:         logicEntity.Name,
				PathID:       businessObject.PathID + "/" + logicEntity.ID,
				Path:         businessObject.Path + "/" + logicEntity.Name,
				Type:         constant.LogicEntity,
				CreatedAt:    now,
				CreatedByUID: userInfo.ID,
				UpdatedAt:    now,
				UpdatedByUID: userInfo.ID,
			}
			entities = append(entities, m)

			//count := 0
			for _, attribute := range logicEntity.Attributes {
				// 属性
				labelID, _ := strconv.Atoi(attribute.LabelID)
				standardID, _ := strconv.ParseUint(attribute.StandardID, 10, 64)
				a := &model.SubjectDomain{
					ID:           attribute.ID,
					Name:         attribute.Name,
					PathID:       m.PathID + "/" + attribute.ID,
					Path:         m.Path + "/" + attribute.Name,
					Type:         constant.Attribute,
					LabelID:      uint64(labelID),
					StandardID:   standardID,
					CreatedAt:    now,
					CreatedByUID: userInfo.ID,
					UpdatedAt:    now,
					UpdatedByUID: userInfo.ID,
				}
				if attribute.Unique {
					a.Unique = 1
					//count++
				}
				attrs = append(attrs, a)
			}
			//if count > 1 {
			//	return errorcode.Desc(my_errorcode.UniqueErr)
			//}
		}
		//缓存标准
		if err := c.CacheSubjectStandard(ctx, attrs); err != nil {
			return err
		}
		//属性
		for _, attr := range attrs {
			_, ok := idSet[attr.ID]
			if ok {
				updateAttrs = append(updateAttrs, attr)
				delete(idSet, attr.ID)
			} else {
				addAttrs = append(addAttrs, attr)
			}
		}
		for id := range idSet {
			ids = append(ids, id)
		}
	}

	//获取被删除的实体ID
	delEntitys, err := c.repo.GetBatchDeleteEntityID(ctx, objectIds,
		util.Gen(entities, func(d *model.SubjectDomain) string { return d.ID }))
	if err != nil {
		return err
	}
	//调接口，删除关联实体
	if err := c.dataViewDriven.DeleteRelated(ctx, &data_view.DeleteRelatedReq{
		MoveDeletes: delEntitys,
	}); err != nil {
		return err
	}

	//更新实体
	formEntitiesID = util.SliceUnique(formEntitiesID)
	if err = c.repo.BatchUpdateBusinessObject(ctx, formEntitiesID, objectIds, userInfo.ID, entities, ids, updateAttrs, addAttrs); err != nil {
		return err
	}

	return nil
}

func (c *SubjectDomainUsecase) GetSubjectDomainMapByIDS(ctx context.Context, parentIds []string) (map[string]*model.SubjectDomain, error) {
	parentObject, err := c.repo.GetObjectByIDS(ctx, parentIds, constant.SubjectDomain)
	if err != nil {
		return nil, err
	}
	if len(parentObject) != len(parentIds) {
		return nil, errorcode.Desc(my_errorcode.ObjectIDSHasNotExist)
	}
	res := make(map[string]*model.SubjectDomain)
	for _, domain := range parentObject {
		res[domain.ID] = domain
	}
	return res, nil
}
func (c *SubjectDomainUsecase) GetByUserMapByIds(ctx context.Context, ids []string) (map[string]string, error) {
	usersMap := make(map[string]string)
	if len(ids) == 0 {
		return usersMap, nil
	}
	users, err := c.userRepo.GetByUserIds(ctx, ids)
	if err != nil {
		return usersMap, errorcode.Detail(my_errorcode.UserDataBaseError, err.Error())
	}
	for _, user := range users {
		usersMap[user.ID] = user.Name
	}
	return usersMap, nil
}
func (c *SubjectDomainUsecase) GetObjectPrecision(ctx context.Context, req *GetObjectPrecisionReq) (*GetObjectPrecisionRes, error) {
	objects, err := c.repo.GetByIDS(ctx, req.ObjectIDs)
	if err != nil {
		return nil, err
	}
	uids := make([]string, 0)
	for _, object := range objects {
		if len(object.Owners) > 0 {
			uids = append(uids, object.Owners[0])
			uids = append(uids, object.CreatedByUID)
			uids = append(uids, object.UpdatedByUID)
		}
	}
	uids = util.DuplicateStringRemoval(uids)
	/*	userInfoMap, err := c.userMgr.BatchGetUserInfoByID(ctx, util.DuplicateStringRemoval(uids))
		if err != nil {
			return nil, err
		}*/
	userInfoMap, err := c.GetByUserMapByIds(ctx, uids)
	if err != nil {
		return nil, err
	}

	res := make([]*GetObjectResp, len(objects))

	for i, object := range objects {
		var ownerId, ownerName, createdByName, updatedByName string
		if len(object.Owners) > 0 {
			ownerId = object.Owners[0]
			ownerName = userInfoMap[object.Owners[0]]
		}
		if _, exist := userInfoMap[object.CreatedByUID]; exist {
			createdByName = userInfoMap[object.CreatedByUID]
		}
		if _, exist := userInfoMap[object.UpdatedByUID]; exist {
			updatedByName = userInfoMap[object.UpdatedByUID]
		}
		res[i] = &GetObjectResp{
			ID:          object.ID,
			Name:        object.Name,
			Description: object.Description,
			PathID:      object.PathID,
			PathName:    object.Path,
			Type:        constant.SubjectDomainObjectIntToString(object.Type),
			Owners: &UserInfoResp{
				UID:      ownerId,
				UserName: ownerName,
			},
			CreatedBy: createdByName,
			CreatedAt: object.CreatedAt.UnixMilli(),
			UpdatedBy: updatedByName,
			UpdatedAt: object.UpdatedAt.UnixMilli(),
		}
	}
	return &GetObjectPrecisionRes{
		Object: res,
	}, nil
}

func (c *SubjectDomainUsecase) GetObjectChildDetail(ctx context.Context, req *GetObjectChildDetailReq) (*GetObjectChildDetailResp, error) {
	objects, err := c.repo.GetByBusinessObjectId(ctx, req.ID)
	if err != nil {
		return nil, err
	}
	//使用业务域分组计数器
	counter := c.NewGroupCounter(ctx, objects)
	entries := iter.Gen[*GetObjectInfo](objects, func(obj *model.SubjectDomain) *GetObjectInfo {
		info := &GetObjectInfo{
			ID:             obj.ID,
			Name:           obj.Name,
			Type:           constant.SubjectDomainObjectIntToString(obj.Type),
			PathID:         obj.PathID,
			PathName:       obj.Path,
			ParentID:       util.GetParentID(obj.PathID),
			LogicViewCount: counter.FormViewCount[obj.ID],  //视图数量
			IndicatorCount: counter.IndicatorCount[obj.ID], //指标
			InterfaceCount: counter.InterfaceCount[obj.ID], //接口
			Child:          nil,
		}
		return info
	})
	//如果只是想返回list
	if req.Display == "list" || req.Display != "tree" {
		return &GetObjectChildDetailResp{
			Display: "list",
			Entries: entries,
		}, nil
	}
	//如果想要返回tree
	root := iter.Tree[*GetObjectInfo](entries,
		func(info *GetObjectInfo) string { return info.ID },
		func(info *GetObjectInfo) string { return info.ParentID },
		func(parent, child *GetObjectInfo) {
			parent.Child = append(parent.Child, child)
		})
	return &GetObjectChildDetailResp{
		Display: "tree",
		Entries: []*GetObjectInfo{root},
	}, nil
}

func (c *SubjectDomainUsecase) GetSubjectDomainByPaths(ctx context.Context, req []string) (resp *CommonRest.GetDataSubjectByPathRes, err error) {
	resp = &CommonRest.GetDataSubjectByPathRes{
		DataSubjects: make(map[string]*CommonRest.DataSubjectInternal),
	}
	resp.DataSubjects, err = c.repo.GetSubjectByPathName(ctx, req)
	if err != nil {
		log.Error("GetSubjectDomainByPaths -> Query SubjectDomain failed: ", zap.Error(err))
		return nil, err
	}
	return
}

func (c *SubjectDomainUsecase) DelLabels(ctx context.Context, req *DelLabelIdsReq) (any, error) {
	labelIDS := strings.Split(req.LabelIDS, ",")

	err := c.repo.DeleteLabels(ctx, labelIDS)
	if err != nil {
		return nil, err
	}

	return nil, nil

}

func (c *SubjectDomainUsecase) auditInfo(ctx context.Context, l audit.Logger, object *model.SubjectDomain, operationType string) {
	var (
		operation api_audit_v1.Operation
		ownerName string
	)
	switch operationType {
	case "Create":
		switch constant.SubjectDomainObjectIntToString(object.Type) {
		case string(constant.StringSubjectDomainGroup):
			operation = api_audit_v1.OperationCreateSubjectDomainGroup
		case string(constant.StringSubjectDomain):
			operation = api_audit_v1.OperationCreateSubjectDomain
		case string(constant.StringBusinessObject):
			operation = api_audit_v1.OperationCreateBusinessObject
		case string(constant.StringBusinessActivity):
			operation = api_audit_v1.OperationCreateBusinessActivity
		}
	case "Update":
		switch constant.SubjectDomainObjectIntToString(object.Type) {
		case string(constant.StringSubjectDomainGroup):
			operation = api_audit_v1.OperationUpdateSubjectDomainGroup
		case string(constant.StringSubjectDomain):
			operation = api_audit_v1.OperationUpdateSubjectDomain
		case string(constant.StringBusinessObject):
			operation = api_audit_v1.OperationUpdateBusinessObject
		case string(constant.StringBusinessActivity):
			operation = api_audit_v1.OperationUpdateBusinessActivity
		case string(constant.StringLogicEntity):
			operation = api_audit_v1.OperationUpdateBusinessObjectContent
		case string(constant.StringAttribute):
			operation = api_audit_v1.OperationUpdateBusinessActivityContent
		}
	case "Delete":
		switch constant.SubjectDomainObjectIntToString(object.Type) {
		case string(constant.StringSubjectDomainGroup):
			operation = api_audit_v1.OperationDeleteSubjectDomainGroup
		case string(constant.StringSubjectDomain):
			operation = api_audit_v1.OperationDeleteSubjectDomain
		case string(constant.StringBusinessObject):
			operation = api_audit_v1.OperationDeleteBusinessObject
		case string(constant.StringBusinessActivity):
			operation = api_audit_v1.OperationDeleteBusinessActivity
		}
		l.Warn(operation,
			&DataSubjectAuditObject{
				ID:        object.ID,
				Name:      object.Name,
				OwnerName: ownerName,
			})
		return
	case "UpdateBusinessObjectContent":
		switch constant.SubjectDomainObjectIntToString(object.Type) {
		case string(constant.StringBusinessObject):
			operation = api_audit_v1.OperationUpdateBusinessObjectContent
		case string(constant.StringBusinessActivity):
			operation = api_audit_v1.OperationUpdateBusinessActivityContent
		}
	}
	if len(object.Owners) > 0 {
		name, _, _, err := c.userMgr.GetUserNameByUserID(ctx, object.Owners[0])
		if err != nil {
			log.WithContext(ctx).Errorf("failed to get user name by user id, user id: %v, err: %v", object.Owners[0], err)
		}
		ownerName = name
	}
	l.Info(operation,
		&DataSubjectAuditObject{
			ID:        object.ID,
			Name:      object.Name,
			OwnerName: ownerName,
		})
}

func (c *SubjectDomainUsecase) QueryBusinessSubjectRecList(ctx context.Context, req *BusinessSubjectRecReq) (resp *af_sailor.SailorSubjectRecResp, err error) {
	businessSubjectFieldsRecResp, err := c.sailorDriven.QueryBusinessSubjectRec(ctx, req.Query)
	return businessSubjectFieldsRecResp, err
}
