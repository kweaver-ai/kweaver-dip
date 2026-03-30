package impl

import (
	"context"
	//"github.com/kweaver-ai/idrm-go-common/rest/basic_bigdata_service"
	json "encoding/json"
	"errors"
	"fmt"
	"io/ioutil"
	"mime/multipart"
	"strings"
	"sync"
	"time"

	"github.com/avast/retry-go"
	"github.com/google/uuid"
	db "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	object_subtype "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/object_subtype"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	users "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	cept "github.com/kweaver-ai/idrm-go-common/go-ceph-client"
	CommonRest "github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type businessStructUseCase struct {
	repo db.Repo
	//HttpClient http_client.HttpClient
	CephClient cept.CephClient
	ug         user_management.DrivenUserMgnt
	user       users.UseCase
	producer   kafkax.Producer
	//fileMgnt          basic_bigdata_service.Driven
	objectSubtypeRepo object_subtype.Repo
}

func NewBusinessStructUseCase(
	repo db.Repo,
	cephClient cept.CephClient,
	ug user_management.DrivenUserMgnt,
	producer kafkax.Producer,
	objectSubtypeRepo object_subtype.Repo,
	//fileMgnt basic_bigdata_service.Driven,
	user users.UseCase,
) domain.UseCase {
	return &businessStructUseCase{
		repo:              repo,
		CephClient:        cephClient,
		ug:                ug,
		producer:          producer,
		objectSubtypeRepo: objectSubtypeRepo,
		//fileMgnt:          fileMgnt,
		user: user,
	}
}

var once = sync.Once{}
var syncTime time.Time

func (uc *businessStructUseCase) GetDepartmentInfo(ctx context.Context) {
	once.Do(func() {
		go uc.RetryObtainDepartmentInfo(context.Background())
		//更新同步时间
		syncTime = time.Now()
	})
}

func (uc *businessStructUseCase) RetryObtainDepartmentInfo(ctx context.Context) {
	_ = retry.Do(
		func() error {
			if err := uc.ObtainDepartment(ctx); err != nil {
				return err
			}
			return nil
		},
		retry.OnRetry(func(n uint, err error) {
			log.Warnf("【RetryObtainDepartmentInfo】#%d: %s\n", n, err)
		}),
		retry.Attempts(15),
	)
}

func (uc *businessStructUseCase) ObtainDepartment(ctx context.Context) error {
	for i := 0; ; i++ {
		departments, err := uc.ug.GetDepartments(ctx, i)
		if err != nil {
			return err
		}
		var organizationStr string
		for _, organization := range departments {
			if i == 0 {
				// 检查组织是否已存在，避免主键冲突
				_, err = uc.repo.GetObjByID(ctx, organization.ID)
				if err != nil {
					// 对象不存在，创建新对象
					if errors.Is(err, gorm.ErrRecordNotFound) {
						_, err = uc.repo.Create(ctx, &model.Object{ID: organization.ID, Name: organization.Name, PathID: organization.ID, Path: organization.Name, Type: 1, ThirdDeptId: organization.ThirdId, IsRegister: 1})
						if err != nil {
							log.WithContext(ctx).Errorf("ObtainDepartment repo create error :%v", err.Error())
							return err
						}
					} else {
						// 查询出错，返回错误
						log.WithContext(ctx).Errorf("ObtainDepartment repo GetObjByID error :%v", err.Error())
						return err
					}
				}
				// 对象已存在，跳过创建
			}
			organizationStr += organization.ID + ","
		}
		if i > 0 && len(departments) > 0 {
			organizationStr = strings.TrimRight(organizationStr, ",")
			departmentInfos, err := uc.ug.GetDepartmentParentInfo(ctx, organizationStr, "name,parent_deps,third_id")
			if err != nil {
				return err
			}

			for _, departmentInfo := range departmentInfos {
				// 检查部门是否已存在，避免主键冲突
				_, err = uc.repo.GetObjByID(ctx, departmentInfo.ID)
				if err != nil {
					// 对象不存在，创建新对象
					if errors.Is(err, gorm.ErrRecordNotFound) {
						var path, pathID string
						for _, parent := range departmentInfo.ParentDep {
							pathID += parent.ID + "/"
							path += parent.Name + "/"
						}
						pathID += departmentInfo.ID
						path += departmentInfo.Name
						thirdId := departmentInfo.ThirdId
						_, err = uc.repo.Create(ctx, &model.Object{ID: departmentInfo.ID, Name: departmentInfo.Name, PathID: pathID, Path: path, Type: 2, ThirdDeptId: thirdId})
						if err != nil {
							log.WithContext(ctx).Errorf("ObtainDepartment repo create error :%v", err.Error())
							return err
						}
					} else {
						// 查询出错，返回错误
						log.WithContext(ctx).Errorf("ObtainDepartment repo GetObjByID error :%v", err.Error())
						return err
					}
				}
				// 对象已存在，跳过创建
			}
		} else if i > 0 && len(departments) == 0 {
			break
		}
	}
	return nil
}

/*
func (uc *businessStructUseCase) CheckRepeat(ctx context.Context, checkType, id, name, objType string) (bool, error) {
	uc.GetDepartmentInfo(ctx)
	switch checkType {
	case "update": // ID作为自身ID去定位上层ID
		if id == "" {
			return false, errorcode.Desc(errorcode.BusinessStructureIDEmpty)
		}
		objByID, err := uc.repo.GetObjByID(ctx, id)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
			} else {
				err = errorcode.Desc(errorcode.PublicDatabaseError)
			}
			return false, err
		}
		path := strings.Split(objByID.PathID, "/")
		if len(path) == 1 {
			// 说明这是组织对象，无上层对象，查找所有组织对象
			objects, err := uc.repo.GetChildObjectByID(ctx, "")
			if err != nil {
				return false, err
			}
			for _, obj := range objects {
				if strings.EqualFold(obj.Name, name) {
					return obj.ID != id, nil
				}
			}
			return false, nil
		} else {
			// 定位上一级ID，根据ID查找其下层所有对象
			upperID := path[len(path)-2]
			objects, err := uc.repo.GetChildObjectByID(ctx, upperID)
			if err != nil {
				return false, err
			}
			for _, obj := range objects {
				if strings.EqualFold(obj.Name, name) && objByID.Type == obj.Type {
					return obj.ID != id, nil
				}
			}
			return false, nil
		}
	case "create": // ID作为上层ID，校验

		if constant.ObjectTypeStringToInt(objType) == 0 {
			return false, errorcode.Desc(errorcode.BusinessStructureObjectType)
		}

		if id != "" {
			_, err := uc.repo.GetObjByID(ctx, id)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
				} else {
					err = errorcode.Desc(errorcode.PublicDatabaseError)
				}
				return false, err
			}
		}
		objects, err := uc.repo.GetChildObjectByID(ctx, id)
		if err != nil {
			return false, err
		}
		for _, obj := range objects {
			if strings.EqualFold(obj.Name, name) && constant.ObjectTypeStringToInt(objType) == obj.Type {
				return true, nil
			}
		}
		return false, nil
	default:
		return false, nil
	}
}
*/

/*
func (uc *businessStructUseCase) Check(ctx context.Context, id, name, objType, mid string) (bool, error) {
	uc.GetDepartmentInfo(ctx)
	repeat, err := uc.CheckRepeat(ctx, "create", id, name, objType)
	if err != nil {
		return repeat, err
	} else if objType == string(constant.ObjectTypeStringMainBusiness) && !repeat {
		repeat, err = uc.bg.CheckMainBusinessRepeat(ctx, mid, name)
		return repeat, err
	}
	return repeat, nil
}
*/

/*
func (uc *businessStructUseCase) CreateObject(ctx context.Context, req *domain.ObjectCreateReq) (id, name string, err error) {
	uc.GetDepartmentInfo(ctx)
	// 校验当前父节点下是否允许创建该类型对象
	upperObj, repeat, err := uc.getUpperAndCheckRepeat(ctx, req.UpperID, "create", *req.Name, req.Type)
	if err != nil {
		return "", "", err
	}
	if repeat {
		return "", "", errorcode.Desc(errorcode.BusinessStructureObjectNameRepeat)
	}

	objModel, err := req.ToModel(ctx, upperObj)
	if err != nil {
		return "", "", err
	}

	if !uc.isCreateEnable(constant.ObjectTypeToString(upperObj.Type), constant.ObjectTypeToString(objModel.Type)) {
		// 当前对象不允许创建目标对象
		return "", "", errorcode.Desc(errorcode.BusinessStructureUnsupportedType)
	}

	_, err = uc.repo.Create(ctx, objModel)

	if err != nil {
		return "", "", err
	}

	return objModel.ID, objModel.Name, nil
}

*/

func (uc *businessStructUseCase) UpdateObject(ctx context.Context, req *domain.ObjectUpdateReq, uid string) (string, error) {
	uc.GetDepartmentInfo(ctx)
	objByID, err := uc.repo.GetObjByID(ctx, req.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
		} else {
			log.WithContext(ctx).Error("GetObjByID", zap.Error(err))
			err = errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		return "", err
	}
	if int32(constant.ObjectTypeOrganization) != objByID.Type && int32(constant.ObjectTypeDepartment) != objByID.Type {
		log.WithContext(ctx).Error("illegality object type in databases")
		return "", errorcode.Desc(errorcode.PublicDatabaseError)
	}
	objModel, resMap, err := req.ToModel(ctx, constant.ObjectTypeToString(objByID.Type))
	if err != nil {
		return "", err
	}
	res, err := json.Marshal(resMap)
	if err != nil {
		log.WithContext(ctx).Error("Marshal", zap.Error(err))
		return "", errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	if objModel.Attribute = domain.UpdateAttr(objByID.Attribute, string(res)); objModel.Attribute == "" {
		return "", errorcode.Desc(errorcode.PublicInternalError)
	}

	err = uc.repo.UpdateAttr(ctx, req.ID, objModel.Attribute)
	if err != nil {
		log.WithContext(ctx).Error("UpdateAttr", zap.Error(err))
		return objByID.Name, errorcode.Desc(errorcode.PublicDatabaseError)
	}

	//修改部门子类型
	if req.Subtype > 0 {
		err = uc.SetSubtype(ctx, uid, req.ID, req.Subtype, req.MainDeptType, objByID)
		if err != nil {
			return "", err
		}
	}

	// [异步从文件管理删除文件]
	//if resMap["file_specification_id"] == "" {
	//	go func(ctx context.Context) (err error) {
	//		//defer func() {
	//		//	util.RecordErrLog(ctx, err)
	//		//}()
	//		// 全部删除
	//		err = uc.fileMgnt.DeleteFiles(ctx, &basic_bigdata_service.DeleteReq{
	//			ID: req.ID,
	//		})
	//		return err
	//	}(ctx)
	//} else {
	//	// 删除不包括的ID
	//	go func(ctx context.Context) (err error) {
	//		//defer func() {
	//		//	util.RecordErrLog(ctx, err)
	//		//}()
	//		err = uc.fileMgnt.DeleteExcludeFiles(ctx, &basic_bigdata_service.DeleteExcludeOssIdsReq{
	//			RelatedObjectId: req.ID,
	//			ExcludeOssIDs:   resMap["file_specification_id"].(string),
	//		})
	//		return err
	//	}(ctx)
	//}
	return objByID.Name, nil
}

func (uc businessStructUseCase) SetSubtype(ctx context.Context, uid string, objectId string, subtype int32, mainDeptType int32, obj *model.Object) error {
	if int32(constant.ObjectTypeDepartment) != obj.Type {
		return errorcode.Detail(errorcode.PublicInvalidParameter, "object type must be department")
	}
	pathIds := strings.Split(obj.PathID, "/")
	parentObj, err := uc.repo.GetObject(ctx, pathIds[len(pathIds)-2])
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
		} else {
			log.WithContext(ctx).Error("GetObject", zap.Error(err))
			err = errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		return err
	}
	parentObjSubtype, err := uc.objectSubtypeRepo.GetSubtypeByObjectId(ctx, parentObj.ID)
	if err != nil {
		log.WithContext(ctx).Error("uc.objectSubtypeRepo.GetSubtypeByObjectId", zap.Error(err))
		return err
	}
	//父级为部门的，必须先设置子类型
	if parentObj.Type == int32(constant.ObjectTypeDepartment) && parentObjSubtype == 0 {
		return errorcode.Detail(errorcode.ParentDepartmentParameterError, "The parent's department type must be set first")
	}

	childObjs, err := uc.repo.GetObjByPathID(ctx, obj.ID)
	if err != nil {
		log.WithContext(ctx).Error("GetObjByPathID", zap.Error(err))
		err = errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		return err
	}

	/*
		组织下一级:行政区、部门
		行政区下一级：部门、处（科）室
		部门下一级：部门、处（科）室
		处（科）室没有下一级
	*/
	if !((subtype == int32(constant.ObjectSubtypeAdministrativeDistrict) &&
		int32(constant.ObjectTypeOrganization) == parentObj.Type) ||
		(subtype == int32(constant.ObjectSubtypeDepartment) &&
			parentObjSubtype != int32(constant.ObjectSubtypeOffice)) ||
		(subtype == int32(constant.ObjectSubtypeOffice) &&
			parentObjSubtype != int32(constant.ObjectSubtypeOffice) &&
			int32(constant.ObjectTypeOrganization) != parentObj.Type &&
			len(childObjs) == 1)) {
		return errorcode.Detail(errorcode.AppropriateDepartmentParameterError, "Please fill in the appropriate type")
	}

	dbSubtype, err := uc.objectSubtypeRepo.GetSubtypeByObjectId(ctx, objectId)
	if err != nil {
		log.WithContext(ctx).Error("uc.objectSubtypeRepo.GetSubtypeByObjectId", zap.Error(err))
		return err
	}
	nowTime := time.Now()
	if dbSubtype > 0 {
		err = uc.objectSubtypeRepo.Update(ctx, &model.TObjectSubtype{ID: objectId, Subtype: subtype, MainDeptType: mainDeptType, UpdatedBy: &uid, UpdatedAt: &nowTime})
		if err != nil {
			log.WithContext(ctx).Error("uc.objectSubtypeRepo.Update", zap.Error(err))
			return err
		}
	} else {
		err = uc.objectSubtypeRepo.Create(ctx, &model.TObjectSubtype{ID: objectId, Subtype: subtype, MainDeptType: mainDeptType, CreatedBy: uid, CreatedAt: nowTime})
		if err != nil {
			log.WithContext(ctx).Error("uc.objectSubtypeRepo.Create", zap.Error(err))
			return err
		}
	}
	return nil
}

/*
func (uc *businessStructUseCase) DeleteObjects(ctx context.Context, req *domain.ObjectDeleteReq) error {
	uc.GetDepartmentInfo(ctx)
	objs, err := uc.repo.GetObjectsByIDs(ctx, req.IDS)
	if err != nil {
		return err
	}
	if len(objs) != len(req.IDS) {
		return errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
	}
	for _, obj := range objs {
		if int32(constant.ObjectTypeOrganization) == obj.Type || int32(constant.ObjectTypeDepartment) == obj.Type {
			return errorcode.Desc(errorcode.BusinessStructureUnsupportedDelete)
		}
		//if obj.Type == int32(constant.ObjectTypeBusinessSystem) {
		//	if err = uc.datasourceRepo.ClearInfoSystemID(ctx, obj.ID); err != nil {
		//		return err
		//	}
		//}
	}

	objects, err := uc.repo.Delete(ctx, req.IDS)
	for _, object := range objects {
		mqMessage := domain.NewDeleteObjectMessage(object.ID, object.Type)
		if mqMessage != nil {
			if err := producers.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
				log.WithContext(ctx).Error("send delete object info error", zap.Error(err))
				return errorcode.Desc(errorcode.BusinessStructureDeleteObjectMessageSendError)
			}
		}
	}
	return nil
}
*/

func (uc *businessStructUseCase) ListByPaging(ctx context.Context, req *domain.QueryPageReqParam) (*domain.QueryPageReapParam, error) {
	//uc.GetDepartmentInfo(ctx)

	// resp := &domain.QueryPageReapParam{}
	// 判断keyword是否有效，无效返回空
	// if !util.CheckKeyword(&req.Keyword) {
	// 	log.Warnf("keyword is invalid, keyword: %s", req.Keyword)
	// 	resp.Entries = make([]*domain.SummaryInfo, 0)
	// 	return resp, nil
	// }

	//if req.ID != "" {
	//	_, err := uc.repo.GetObject(ctx, req.ID)
	//	if err != nil {
	//		log.WithContext(ctx).Error("object not found", zap.String("object id", req.ID), zap.Error(err))
	//		return nil, err
	//	}
	//}
	objects, total, err := uc.repo.ListByPaging(ctx, req)
	if err != nil {
		return nil, err
	}
	objType := make([]int32, 0)
	objType = append(objType, int32(constant.ObjectTypeDepartment))
	ObjectInfoList := make([]*domain.SummaryInfo, 0)

	// 批量收集所有用户ID，避免N+1查询问题
	//allUserIdsSet := make(map[string]struct{})
	//for _, object := range objects {
	//	if object.UserIds == "" {
	//		continue
	//	}
	//	userIds := strings.Split(object.UserIds, ",")
	//	for _, userId := range userIds {
	//		userId = strings.TrimSpace(userId)
	//		if userId != "" {
	//			allUserIdsSet[userId] = struct{}{}
	//		}
	//	}
	//}
	//// 转换为切片，批量获取用户名称
	//allUserIds := make([]string, 0, len(allUserIdsSet))
	//for userId := range allUserIdsSet {
	//	allUserIds = append(allUserIds, userId)
	//}
	//// 批量获取所有用户名称映射
	//userNameMap := make(map[string]string)
	//if len(allUserIds) > 0 {
	//	var err error
	//	userNameMap, err = uc.user.GetByUserNameMap(ctx, allUserIds)
	//	if err != nil {
	//		log.WithContext(ctx).Warn("failed to batch get user names", zap.Error(err))
	//		// 如果批量获取失败，userNameMap为空，后续会使用userId作为名称
	//	}
	//}

	for i, object := range objects {
		item := new(domain.SummaryInfo)
		ObjectInfoList = append(ObjectInfoList, item)

		// 从批量获取的映射中查找用户名称
		//userIds := strings.Split(object.UserIds, ",")
		//userIdMap := make(map[string]struct{})
		//userNames := []string{}
		//for _, userId := range userIds {
		//	userId = strings.TrimSpace(userId)
		//	if userId == "" {
		//		continue
		//	}
		//	if _, exists := userIdMap[userId]; exists {
		//		continue // 跳过重复
		//	}
		//	userIdMap[userId] = struct{}{}
		//	// 从批量获取的映射中获取用户名称
		//	if name, exists := userNameMap[userId]; exists && name != "" {
		//		userNames = append(userNames, name)
		//	}
		//}
		//userNameStr := strings.Join(userNames, ",")
		responsibilities, err := getDepartmentResponsibilities(object.Attribute)
		if err != nil {
			return nil, err
		}
		ObjectInfoList[i] = &domain.SummaryInfo{
			ID:           object.ID,
			Name:         object.Name,
			Type:         constant.ObjectTypeToString(object.Type),
			Subtype:      object.Subtype,
			MainDeptType: object.MainDeptType,
			Path:         object.Path,
			PathID:       object.PathID,
			UpdatedAt:    object.UpdatedAt.UnixMilli(),
			ThirdDeptId:  object.ThirdDeptId,
			RegisterAt:   object.RegisterAt,
			IsRegister:   object.IsRegister,
			DeptTag:      object.DeptTag,
			UserIds:      object.UserIds,
			//UserName:     userNameStr,
			OrgId:        object.OrgId,
			BusinessDuty: responsibilities,
		}
		if !req.IsAll {
			ObjectInfoList[i].Expand, _ = uc.repo.Expand(ctx, object.PathID, objType)
		} else {
			// 查询全部不再进行查询是否有下级
			ObjectInfoList[i].Expand = false
		}
		if req.IsAttrReturned {
			if object.Attribute != "" {
				if object.Type == int32(constant.ObjectTypeOrganization) {
					var attribute domain.OrgAttribute
					err = json.Unmarshal([]byte(object.Attribute), &attribute)
					if err != nil {
						return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
					}
					ObjectInfoList[i].Attributes = attribute
				} else if object.Type == int32(constant.ObjectTypeDepartment) {
					var attribute domain.DepartmentAttribute
					err = json.Unmarshal([]byte(object.Attribute), &attribute)
					if err != nil {
						return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
					}
					ObjectInfoList[i].Attributes = attribute
				} else {
					return nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
				}
			} else {
				ObjectInfoList[i].Attributes = struct{}{}
			}
		}
	}

	return &domain.QueryPageReapParam{Entries: ObjectInfoList, TotalCount: total}, nil
}

func getDepartmentResponsibilities(attribute string) (string, error) {
	if attribute == "" {
		return "", nil
	}
	// 定义一个 map 来接收解析后的 JSON 数据
	var attrMap map[string]interface{}
	if err := json.Unmarshal([]byte(attribute), &attrMap); err != nil {
		return "", fmt.Errorf("failed to unmarshal attribute: %v", err)
	}

	// 获取 department_responsibilities 字段的值
	if responsibilities, ok := attrMap["department_responsibilities"].(string); ok {
		return responsibilities, nil
	} else {
		return "", nil
	}
}

func (uc *businessStructUseCase) ListByPagingWithRegisterAndTag(ctx context.Context, req *domain.QueryOrgPageReqParam) (*domain.QueryPageReapParam, error) {
	uc.GetDepartmentInfo(ctx)
	// resp := &domain.QueryPageReapParam{}
	// 判断keyword是否有效，无效返回空
	// if !util.CheckKeyword(&req.Keyword) {
	// 	log.Warnf("keyword is invalid, keyword: %s", req.Keyword)
	// 	resp.Entries = make([]*domain.SummaryInfo, 0)
	// 	return resp, nil
	// }
	if req.ID != "" {
		_, err := uc.repo.GetObject(ctx, req.ID)
		if err != nil {
			log.WithContext(ctx).Error("object not found", zap.String("object id", req.ID), zap.Error(err))
			return nil, err
		}
	}
	objects, total, err := uc.repo.ListOrgByPaging(ctx, req)
	if err != nil {
		return nil, err
	}
	objType := make([]int32, 0)
	objType = append(objType, int32(constant.ObjectTypeDepartment))
	ObjectInfoList := make([]*domain.SummaryInfo, 0)

	// 批量收集所有用户ID，避免N+1查询问题
	allUserIdsSet := make(map[string]struct{})
	for _, object := range objects {
		if object.UserIds == "" {
			continue
		}
		userIds := strings.Split(object.UserIds, ",")
		for _, userId := range userIds {
			userId = strings.TrimSpace(userId)
			if userId != "" {
				allUserIdsSet[userId] = struct{}{}
			}
		}
	}
	// 转换为切片，批量获取用户名称
	allUserIds := make([]string, 0, len(allUserIdsSet))
	for userId := range allUserIdsSet {
		allUserIds = append(allUserIds, userId)
	}
	// 批量获取所有用户名称映射
	userNameMap := make(map[string]string)
	if len(allUserIds) > 0 {
		var err error
		userNameMap, err = uc.user.GetByUserNameMap(ctx, allUserIds)
		if err != nil {
			log.WithContext(ctx).Warn("failed to batch get user names", zap.Error(err))
			// 如果批量获取失败，userNameMap为空，后续会跳过该用户
		}
	}

	for i, object := range objects {
		item := new(domain.SummaryInfo)
		ObjectInfoList = append(ObjectInfoList, item)

		// 从批量获取的映射中查找用户名称
		userIds := strings.Split(object.UserIds, ",")
		userIdMap := make(map[string]struct{})
		userNames := []string{}
		for _, userId := range userIds {
			userId = strings.TrimSpace(userId)
			if userId == "" {
				continue
			}
			if _, exists := userIdMap[userId]; exists {
				continue // 跳过重复
			}
			userIdMap[userId] = struct{}{}
			// 从批量获取的映射中获取用户名称
			if name, exists := userNameMap[userId]; exists && name != "" {
				userNames = append(userNames, name)
			}
		}
		userNameStr := strings.Join(userNames, ",")
		responsibilities, err := getDepartmentResponsibilities(object.Attribute)
		if err != nil {
			return nil, err
		}
		ObjectInfoList[i] = &domain.SummaryInfo{
			ID:           object.ID,
			Name:         object.Name,
			Type:         constant.ObjectTypeToString(object.Type),
			Subtype:      object.Subtype,
			MainDeptType: object.MainDeptType,
			Path:         object.Path,
			PathID:       object.PathID,
			UpdatedAt:    object.UpdatedAt.UnixMilli(),
			ThirdDeptId:  object.ThirdDeptId,
			RegisterAt:   object.RegisterAt,
			IsRegister:   object.IsRegister,
			DeptTag:      object.DeptTag,
			UserIds:      object.UserIds,
			UserName:     userNameStr,
			OrgId:        object.OrgId,
			BusinessDuty: responsibilities,
		}
		ObjectInfoList[i].Expand, _ = uc.repo.Expand(ctx, object.PathID, objType)
		if req.IsAttrReturned {
			if object.Attribute != "" {
				if object.Type == int32(constant.ObjectTypeOrganization) {
					var attribute domain.OrgAttribute
					err = json.Unmarshal([]byte(object.Attribute), &attribute)
					if err != nil {
						return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
					}
					ObjectInfoList[i].Attributes = attribute
				} else if object.Type == int32(constant.ObjectTypeDepartment) {
					var attribute domain.DepartmentAttribute
					err = json.Unmarshal([]byte(object.Attribute), &attribute)
					if err != nil {
						return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
					}
					ObjectInfoList[i].Attributes = attribute
				} else {
					return nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
				}
			} else {
				ObjectInfoList[i].Attributes = struct{}{}
			}
		}
	}

	return &domain.QueryPageReapParam{Entries: ObjectInfoList, TotalCount: total}, nil
}

func (uc *businessStructUseCase) Get(ctx context.Context, id string) (*domain.GetResp, error) {
	uc.GetDepartmentInfo(ctx)
	object, err := uc.repo.GetObject(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("object not found", zap.String("object id", id), zap.Error(err))
		return nil, err
	}
	// 获取用户名称
	userNames := ""
	if object.UserIds != "" {
		userIds := strings.Split(object.UserIds, ",")
		userNameMap, err := uc.user.GetByUserNameMap(ctx, userIds)
		if err != nil {
			log.WithContext(ctx).Warn("failed to get user names", zap.Error(err))
		} else {
			var names []string
			for _, userId := range userIds {
				if name, exists := userNameMap[userId]; exists && name != "" {
					names = append(names, name)
				} else {
					names = append(names, userId) // 如果找不到名称，使用ID
				}
			}
			userNames = strings.Join(names, ",")
		}
	}

	resp := &domain.GetResp{
		ID:           object.ID,
		Name:         object.Name,
		Path:         object.Path,
		PathID:       object.PathID,
		Type:         constant.ObjectTypeToString(object.Type),
		Subtype:      object.Subtype,
		MainDeptType: object.MainDeptType,
		ThirdDeptId:  object.ThirdDeptId,
		RegisterAt:   object.RegisterAt,
		IsRegister:   object.IsRegister,
		DeptTag:      object.DeptTag,
		UserIds:      object.UserIds,
		UserNames:    userNames,
	}
	if object.Attribute != "" {
		if object.Type == int32(constant.ObjectTypeOrganization) {
			var attribute domain.OrgAttribute
			err = json.Unmarshal([]byte(object.Attribute), &attribute)
			if err != nil {
				return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
			}
			resp.Attributes = attribute
		} else if object.Type == int32(constant.ObjectTypeDepartment) {
			var attribute domain.DepartmentAttribute
			err = json.Unmarshal([]byte(object.Attribute), &attribute)
			if err != nil {
				return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
			}
			resp.Attributes = attribute
		} else {
			return nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
		}
	} else {
		resp.Attributes = struct{}{}
	}

	return resp, nil
}

func (uc *businessStructUseCase) GetType(ctx context.Context, id string, catalog int32) (*domain.GetResp, error) {
	uc.GetDepartmentInfo(ctx)
	object, err := uc.repo.GetObjectType(ctx, id, catalog)
	if err != nil {
		log.WithContext(ctx).Error("object not found", zap.String("object id", id), zap.Error(err))
		return nil, err
	}
	var parentTypeEditStatus int32 = 0 //父部门未编辑
	if object == nil {
		return &domain.GetResp{
			ID:                   "",
			Name:                 "",
			Path:                 "",
			PathID:               "",
			Type:                 "",
			Subtype:              0,
			MainDeptType:         0,
			ParentTypeEditStatus: parentTypeEditStatus,
			ThirdDeptId:          "",
			RegisterAt:           time.Time{},
			IsRegister:           0,
			DeptTag:              "",
			UserIds:              "",
			Attributes:           struct{}{},
		}, nil
	}
	//前端判断需要查询父部门是否编辑，如果是组织不查询上级部门,一级部门可以编辑，二级部门需要查询上一级部门是否编辑过
	pathIds := strings.Split(object.PathID, "/")
	if len(pathIds) == 2 {
		parentTypeEditStatus = 1
	} else if len(pathIds) > 2 {
		count, _ := uc.objectSubtypeRepo.GetCountSubTypeById(ctx, pathIds[len(pathIds)-1])
		if count > 0 {
			parentTypeEditStatus = 1
		}
	}

	// 获取用户名称
	userNames := ""
	if object.UserIds != "" {
		userIds := strings.Split(object.UserIds, ",")
		userNameMap, err := uc.user.GetByUserNameMap(ctx, userIds)
		if err != nil {
			log.WithContext(ctx).Warn("failed to get user names", zap.Error(err))
		} else {
			var names []string
			for _, userId := range userIds {
				if name, exists := userNameMap[userId]; exists && name != "" {
					names = append(names, name)
				} else {
					names = append(names, userId) // 如果找不到名称，使用ID
				}
			}
			userNames = strings.Join(names, ",")
		}
	}

	resp := &domain.GetResp{
		ID:                   object.ID,
		Name:                 object.Name,
		Path:                 object.Path,
		PathID:               object.PathID,
		Type:                 constant.ObjectTypeToString(object.Type),
		Subtype:              object.Subtype,
		MainDeptType:         object.MainDeptType,
		ParentTypeEditStatus: parentTypeEditStatus,
		ThirdDeptId:          object.ThirdDeptId,
		RegisterAt:           object.RegisterAt,
		IsRegister:           object.IsRegister,
		DeptTag:              object.DeptTag,
		UserIds:              object.UserIds,
		UserNames:            userNames,
	}
	if object.Attribute != "" {
		if object.Type == int32(constant.ObjectTypeOrganization) {
			var attribute domain.OrgAttribute
			err = json.Unmarshal([]byte(object.Attribute), &attribute)
			if err != nil {
				return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
			}
			resp.Attributes = attribute
		} else if object.Type == int32(constant.ObjectTypeDepartment) {
			var attribute domain.DepartmentAttribute
			err = json.Unmarshal([]byte(object.Attribute), &attribute)
			if err != nil {
				return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
			}
			resp.Attributes = attribute
		} else {
			return nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
		}
	} else {
		resp.Attributes = struct{}{}
	}

	return resp, nil
}
func (uc *businessStructUseCase) GetFile(ctx context.Context, id string, fileId string) ([]byte, string, error) {
	uc.GetDepartmentInfo(ctx)
	object, err := uc.repo.GetObject(ctx, id)
	if err != nil {
		return nil, "", err
	}
	if object.Attribute == "" {
		return nil, "", errorcode.Desc(errorcode.BusinessStructureNotHaveAttribute)
	}
	var fileIdStr, fileNameStr string
	if object.Type == constant.ObjectTypeObjectTypeStringToInt(constant.ObjectTypeStringDepartment) {
		var attribute domain.DepartmentAttribute
		err = json.Unmarshal([]byte(object.Attribute), &attribute)
		if err != nil {
			return nil, "", errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
		}
		fileIdStr = attribute.FileSpecificationID
		fileNameStr = attribute.FileSpecificationName
	} else {
		return nil, "", errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
	}
	if fileIdStr == "" || fileNameStr == "" || !strings.Contains(fileIdStr, fileId) {
		return nil, "", errorcode.Desc(errorcode.BusinessStructureFileNotFound)
	}
	data, err := uc.CephClient.Down(fileId)
	if err != nil {
		log.WithContext(ctx).Error("failed to Down ", zap.String("object id", id), zap.Error(err))
		return nil, "", errorcode.Desc(errorcode.BusinessStructureCephClientDownFailed)
	}
	fileIds := strings.Split(fileIdStr, ",")
	fileNames := strings.Split(fileNameStr, ",")
	fileName := ""
	for i, info := range fileIds {
		if info == fileId {
			fileName = fileNames[i]
			break
		}
	}
	return data, fileName, nil
}

/*
func (uc *businessStructUseCase) getUpperAndCheckRepeat(ctx context.Context, upperID, reqType, name, objType string) (upperByID *model.Object, repeat bool, err error) {
	uc.GetDepartmentInfo(ctx)
	if upperID == "" {
		return nil, false, errorcode.Desc(errorcode.BusinessStructureUnsupportedType)
	} else {
		upperByID, err = uc.repo.GetObjByID(ctx, upperID)
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
			} else {
				err = errorcode.Desc(errorcode.PublicDatabaseError)
			}
			return nil, false, err
		}
	}

	repeat, err = uc.CheckRepeat(ctx, reqType, upperID, name, objType)
	if err != nil {
		return nil, false, err
	}
	return upperByID, repeat, nil
}
*/

/*
func (uc *businessStructUseCase) isCreateEnable(upperObjType, createType string) bool {
	caseType := constant.ObjectTypeString(upperObjType)
	targetType := constant.ObjectTypeString(createType)
	switch caseType {
	case constant.ObjectTypeStringOrganization, constant.ObjectTypeStringDepartment:
		return targetType == constant.ObjectTypeStringBusinessMatters ||
			targetType == constant.ObjectTypeStringMainBusiness
	default:
		return false
	}
}
*/

func (uc *businessStructUseCase) Save(ctx context.Context, id string, files []*multipart.FileHeader) (string, error) {
	uc.GetDepartmentInfo(ctx)
	object, err := uc.repo.GetObject(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("object not found", zap.String("object id", id), zap.Error(err))
		return "", err
	}
	if object.Type != int32(constant.ObjectTypeDepartment) /* && object.Type != int32(constant.ObjectTypeBusinessMatters)*/ {
		return "", errorcode.Desc(errorcode.BusinessStructureUploadFileError)
	}
	fileIds := make([]string, 0)
	fileNames := make([]string, 0)
	fileSizes := make([]int64, 0)
	var uploadErr error
	for _, file := range files {
		//check size
		if !validSize(file.Size) {
			uploadErr = errorcode.Desc(errorcode.BusinessStructureMaxFileSize)
			break
		}
		f, err := file.Open()
		if err != nil {
			uploadErr = errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
			break
		}
		defer f.Close()

		//get content
		bts, err := ioutil.ReadAll(f)
		if err != nil {
			uploadErr = errorcode.Detail(errorcode.BusinessStructureFileReadError, err.Error())
			break
		}
		uuid := uuid.New().String()
		err = uc.CephClient.Upload(uuid, bts)
		if err != nil {
			log.WithContext(ctx).Error("failed to Upload ", zap.String("object id", id), zap.Error(err))
			uploadErr = errorcode.Desc(errorcode.BusinessStructureCephClientUploadFailed)
			break
		}
		fileIds = append(fileIds, uuid)
		fileNames = append(fileNames, file.Filename)
		fileSizes = append(fileSizes, file.Size)
	}
	if object.Type == int32(constant.ObjectTypeDepartment) && len(fileIds) > 0 {
		result := make(map[string]string)
		json.Unmarshal([]byte(object.Attribute), &result)
		if value, exists := result["file_specification_id"]; exists && len(value) > 0 {
			result["file_specification_id"] = value + "," + strings.Join(fileIds, ",")
		} else {
			result["file_specification_id"] = strings.Join(fileIds, ",")
		}
		if value, exists := result["file_specification_name"]; exists && len(value) > 0 {
			result["file_specification_name"] = value + "," + strings.Join(fileNames, ",")
		} else {
			result["file_specification_name"] = strings.Join(fileNames, ",")
		}

		attrBytes, err := json.Marshal(result)
		if err != nil {
			return "", err
		}
		object.Attribute = string(attrBytes)
	}
	/*
		if object.Type == int32(constant.ObjectTypeBusinessMatters) {
			tmp := &domain.BusinessMattersAttribute{
				DocumentBasisID:   uuid,
				DocumentBasisName: file.Filename,
			}
			attrBytes, err := json.Marshal(tmp)
			if err != nil {
				return "", err
			}
			object.Attribute = string(attrBytes)
		}
	*/
	err = uc.repo.UpdateAttribute(ctx, id, object.Attribute)
	if err != nil {
		return "", err
	}
	if uploadErr != nil {
		return "", uploadErr
	}
	// [将上传文件异步推送到文件管理]
	//go func(ctx context.Context) {
	//	if fileIds != nil && len(fileIds) > 0 {
	//		for i, v := range fileIds {
	//			_, err = uc.fileMgnt.UploadFile(ctx, &basic_bigdata_service.UploadReq{
	//				Name:            fileNames[i],
	//				Type:            basic_bigdata_service.EnumThreeDefinedResponsibility.String,
	//				RelatedObjectID: id,
	//				OssID:           v,
	//				FileSize:        fileSizes[i],
	//			})
	//		}
	//		util.RecordErrLog(ctx, err)
	//	}
	//}(ctx)
	return strings.Join(fileIds, ","), nil
}

const (
	maxUploadSize = 1024 * 1024 * 50
)

// validSize check valid size
func validSize(size int64) bool {
	return size <= maxUploadSize
}

/*
func (uc *businessStructUseCase) GetNames(ctx context.Context, ids []string, objectType string) ([]domain.ObjectInfoResp, error) {
	uc.GetDepartmentInfo(ctx)
	res := make([]domain.ObjectInfoResp, 0)
	for _, id := range ids {
		if id != "" {
			object, _ := uc.Get(ctx, id)
			if object != nil && object.Type == objectType {
				res = append(res, domain.ObjectInfoResp{ID: id, Name: object.Name, Path: object.Path, PathID: object.PathID})
			}
		}
	}
	return res, nil
}
*/

/*
func (uc *businessStructUseCase) MoveObject(ctx context.Context, targetId, id, name string) (string, error) {
	uc.GetDepartmentInfo(ctx)
	objByID, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
		} else {
			err = errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return "", err
	}
	targetObj, err := uc.repo.GetObjByID(ctx, targetId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.BusinessStructureParentObjectNotFound)
		} else {
			err = errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return "", err
	}
	newPathID := targetObj.PathID + "/" + id
	if strings.HasPrefix(newPathID, objByID.PathID) {
		return "", errorcode.Desc(errorcode.BusinessStructureMoveError)
	}
	if objByID.Type == int32(constant.ObjectTypeOrganization) || objByID.Type == int32(constant.ObjectTypeDepartment) || objByID.Type > int32(constant.ObjectTypeMainBusiness) {
		return "", errorcode.Desc(errorcode.BusinessStructureUnsupportedMove)
	}
	if !uc.isCreateEnable(constant.ObjectTypeToString(targetObj.Type), constant.ObjectTypeToString(objByID.Type)) {
		return "", errorcode.Desc(errorcode.BusinessStructureParentObjectError)
	}
	objName := objByID.Name
	if name == objByID.Name || name == "" {
		name = ""
	} else {
		objName = name
	}
	repeat, err := uc.CheckRepeat(ctx, "create", targetId, objName, constant.ObjectTypeToString(objByID.Type))
	if err != nil {
		return "", err
	}
	if repeat {
		return "", errorcode.Desc(errorcode.BusinessStructureObjectNameRepeat)
	}

	objs, err := uc.repo.GetObjByPathID(ctx, id)
	if err != nil {
		return "", err
	}
	newPath := targetObj.Path + "/" + objName
	for _, obj := range objs {
		obj.PathID = strings.Replace(obj.PathID, objByID.PathID, newPathID, 1)
		obj.Path = strings.Replace(obj.Path, objByID.Path, newPath, 1)
	}

	err = uc.repo.UpdatePath(ctx, id, name, objs)
	if err != nil {
		return objByID.Name, errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if objByID.Type == int32(constant.ObjectTypeMainBusiness) {
		mqMessage := domain.NewMoveMainBusinessMessage(objByID.PathID, newPathID, objByID.Path, newPath, name, constant.ObjectTypeToString(targetObj.Type))
		if mqMessage != nil {
			if err := producers.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
				log.WithContext(ctx).Error("send move main_business info error", zap.Error(err))
				return objName, errorcode.Desc(errorcode.BusinessStructureMoveObjectMessageSendError)
			}
		}
	} else {
		mqMessage := domain.NewMoveObjectMessage(objByID.PathID, newPathID, objByID.Path, newPath, name, objByID.Type)
		if mqMessage != nil {
			if err := producers.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
				log.WithContext(ctx).Error("send move object info error", zap.Error(err))
				return objName, errorcode.Desc(errorcode.BusinessStructureMoveObjectMessageSendError)
			}
		}
	}
	return objName, nil
}
*/

/*
func (uc *businessStructUseCase) GetObjectPathInfo(ctx context.Context, id string) ([]*domain.ObjectPathInfoResp, error) {
	uc.GetDepartmentInfo(ctx)
	objByID, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
		} else {
			err = errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return nil, err
	}
	ObjectPathInfoList := make([]*domain.ObjectPathInfoResp, 0)
	ids := strings.Split(objByID.PathID, "/")
	for i := 0; i < len(ids); i++ {
		obj, err := uc.repo.GetObjByID(ctx, ids[i])
		if err != nil {
			if errors.Is(err, gorm.ErrRecordNotFound) {
				err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
			} else {
				err = errorcode.Desc(errorcode.PublicDatabaseError)
			}
			return nil, err
		}
		item := new(domain.ObjectPathInfoResp)
		item.ID = obj.ID
		item.Name = obj.Name
		item.Type = constant.ObjectTypeToString(obj.Type)
		ObjectPathInfoList = append(ObjectPathInfoList, item)
	}
	return ObjectPathInfoList, nil
}
*/

/*
func (uc *businessStructUseCase) GetSuggestedName(ctx context.Context, id, parentID string) (string, error) {
	uc.GetDepartmentInfo(ctx)
	objByID, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
		} else {
			err = errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return "", err
	}
	_, err = uc.repo.GetObjByID(ctx, parentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = errorcode.Desc(errorcode.BusinessStructureParentObjectNotFound)
		} else {
			err = errorcode.Desc(errorcode.PublicDatabaseError)
		}
		return "", err
	}
	repeat, _ := uc.Check(ctx, parentID, objByID.Name, constant.ObjectTypeToString(objByID.Type), objByID.ID)
	if repeat {
		for i := 1; ; i++ {
			newName := fmt.Sprintf("%s_%d", objByID.Name, i)
			repeat, _ = uc.Check(ctx, parentID, newName, constant.ObjectTypeToString(objByID.Type), objByID.ID)
			if !repeat {
				return newName, nil
			}
		}
	} else {
		return objByID.Name, nil
	}
}
*/

/*
func (uc *businessStructUseCase) HandleMainBusinessCreate(ctx context.Context, id, name, departmentID string, businessSystemID, businessMattersID []string, createdAt time.Time) error {
	object, err := uc.repo.GetObjByID(ctx, departmentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if object.Type == int32(constant.ObjectTypeDepartment) || object.Type == int32(constant.ObjectTypeOrganization) {
		tmp := &domain.MainBusinessAttribute{
			BusinessSystem:  businessSystemID,
			BusinessMatters: businessMattersID,
		}
		attrBytes, err := json.Marshal(tmp)
		if err != nil {
			return err
		}
		object.Attribute = string(attrBytes)
	}
	var obj = &model.Object{
		ID:        id,
		Name:      name,
		Type:      int32(constant.ObjectTypeMainBusiness),
		CreatedAt: createdAt,
		UpdatedAt: createdAt,
		Attribute: object.Attribute,
	}
	obj.PathID = object.PathID + "/" + id
	obj.Path = object.Path + "/" + name

	_, err = uc.repo.Create(ctx, obj)

	if err != nil {
		return err
	}
	return nil
}
*/

/*
func (uc *businessStructUseCase) HandleMainBusinessModify(ctx context.Context, id, name string, businessSystemID, businessMattersID []string, updatedAt time.Time) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if object.Type == int32(constant.ObjectTypeMainBusiness) {
		tmp := &domain.MainBusinessAttribute{
			BusinessSystem:  businessSystemID,
			BusinessMatters: businessMattersID,
		}
		attrBytes, err := json.Marshal(tmp)
		if err != nil {
			return err
		}
		object.Attribute = string(attrBytes)
		object.UpdatedAt = updatedAt
		if name != object.Name {
			paging, err := uc.repo.GetObjByPathID(ctx, id)
			if err != nil {
				return err
			}
			for _, page := range paging {
				ids := strings.Split(page.PathID, "/")
				path := strings.Split(page.Path, "/")
				for i2, s := range ids {
					if s == id {
						path[i2] = name
					}
				}
				page.Path = strings.Join(path, "/")
			}
			err = uc.repo.Update(ctx, id, name, object.Attribute, paging)
			if err != nil {
				return errorcode.Desc(errorcode.PublicDatabaseError)
			}
		} else {
			err = uc.repo.UpdateAttribute(ctx, id, object.Attribute)
			if err != nil {
				return err
			}
		}
	}
	return nil
}
*/

/*
func (uc *businessStructUseCase) HandleMainBusinessMove(ctx context.Context, id, newParentID, newName string) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	parentObj, err := uc.repo.GetObjByID(ctx, newParentID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}

	objs, err := uc.repo.GetObjByPathID(ctx, id)
	if err != nil {
		return err
	}
	var newPath string
	if newName != "" {
		newPath = parentObj.Path + "/" + newName
	} else {
		newPath = parentObj.Path + "/" + object.Name
	}
	newPathID := parentObj.PathID + "/" + object.ID
	for _, obj := range objs {
		obj.PathID = strings.Replace(obj.PathID, object.PathID, newPathID, 1)
		obj.Path = strings.Replace(obj.Path, object.Path, newPath, 1)
	}

	err = uc.repo.UpdatePath(ctx, id, newName, objs)
	if err != nil {
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	return nil
}
*/

/*
func (uc *businessStructUseCase) HandleMainBusinessDelete(ctx context.Context, id string) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if object.Type == int32(constant.ObjectTypeMainBusiness) {
		err = uc.repo.DeleteObject2(ctx, id)
		if err != nil {
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
	}
	return nil
}
*/

/*
func (uc *businessStructUseCase) HandleBusinessFormCreate(ctx context.Context, id, name, mid string, createdAt time.Time) error {
	object, err := uc.repo.GetObjByID(ctx, mid)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return errorcode.Desc(errorcode.BusinessStructureObjectNotFound)
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	object2, _ := uc.repo.GetObjByID(ctx, id)
	if object2 != nil {
		return nil
	}
	if object.Type == int32(constant.ObjectTypeMainBusiness) {
		var obj = &model.Object{
			ID:        id,
			Name:      name,
			CreatedAt: createdAt,
			Type:      int32(constant.ObjectTypeBusinessForm),
		}
		obj.PathID = object.PathID + "/" + id
		obj.Path = object.Path + "/" + name

		_, err = uc.repo.Create(ctx, obj)

		if err != nil {
			return err
		}
	}
	return nil
}

func (uc *businessStructUseCase) HandleBusinessFormRename(ctx context.Context, id, name, mid string) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if object.Type == int32(constant.ObjectTypeBusinessForm) {
		path := strings.Split(object.Path, "/")
		path[len(path)-1] = name
		objectPath := strings.Join(path, "/")

		err = uc.repo.UpdateObjectName(ctx, id, name, objectPath)
		if err != nil {
			return err
		}
	}
	return nil
}

func (uc *businessStructUseCase) HandleBusinessFormDelete(ctx context.Context, id string) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	if object.Type == int32(constant.ObjectTypeBusinessForm) {
		err = uc.repo.DeleteObject2(ctx, id)
		if err != nil {
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
	}
	return nil
}
*/

func (uc *businessStructUseCase) HandleDepartmentCreate(ctx context.Context, id, name string) error {
	// if parentDepartID == "" {
	// 	_, err := uc.repo.Create(ctx, &model.Object{ID: id, Name: name, PathID: id, Path: name, Type: 1})
	// 	if err != nil {
	// 		return err
	// 	}
	// } else {
	// 	object, err := uc.repo.GetObjByID(ctx, parentDepartID)
	// 	if err != nil {
	// 		if errors.Is(err, gorm.ErrRecordNotFound) {
	// 			return nil
	// 		}
	// 		return errorcode.Desc(errorcode.PublicDatabaseError)
	// 	}
	// 	pathID := object.PathID + "/" + id
	// 	path := object.Path + "/" + name
	// 	_, err = uc.repo.Create(ctx, &model.Object{ID: id, Name: name, PathID: pathID, Path: path, Type: 2})
	// 	if err != nil {
	// 		return err
	// 	}
	// }

	departmentInfos, err := uc.ug.GetDepartmentParentInfo(ctx, id, "name,parent_deps,third_id")
	if err != nil {
		return err
	}

	for _, departmentInfo := range departmentInfos {
		var path, pathID string
		var objType int32 = 1
		if len(departmentInfo.ParentDep) > 0 {
			objType = 2
			for _, parent := range departmentInfo.ParentDep {
				pathID += parent.ID + "/"
				path += parent.Name + "/"
			}
		}
		pathID += departmentInfo.ID
		path += departmentInfo.Name
		thirdId := departmentInfo.ThirdId
		_, err = uc.repo.Create(ctx, &model.Object{ID: departmentInfo.ID, Name: departmentInfo.Name, PathID: pathID, Path: path, Type: objType, ThirdDeptId: thirdId})
		if err != nil {
			log.WithContext(ctx).Errorf("ObtainDepartment repo create error :%v", err.Error())
			return err
		}
	}
	//更新同步时间
	syncTime = time.Now()
	return nil
}

func (uc *businessStructUseCase) HandleDepartmentRename(ctx context.Context, id, newName string) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}

	objs, err := uc.repo.GetObjByPathID(ctx, id)
	if err != nil {
		return err
	}
	for _, obj := range objs {
		obj.Path = strings.Replace(obj.Path, object.Name, newName, 1)
	}

	err = uc.repo.UpdatePath(ctx, id, newName, objs)
	if err != nil {
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	mqMessage := domain.NewRenameObjectMessage(id, newName, object.Type)
	if mqMessage != nil {
		if err = uc.producer.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
			log.WithContext(ctx).Error("send rename object info error", zap.Error(err))
			return errorcode.Desc(errorcode.BusinessStructureRenameObjectMessageSendError)
		}
	}
	//更新同步时间
	syncTime = time.Now()
	return nil
}

func (uc *businessStructUseCase) HandleDepartmentDelete(ctx context.Context, id string) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("HandleDepartmentDelete delete GetObjByID info error", zap.Error(err))
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	log.Infof("===删除部门==HandleDepartmentDelete==开始==id:%s=", id)
	if object.Type == int32(constant.ObjectTypeOrganization) || object.Type == int32(constant.ObjectTypeDepartment) {
		err = uc.repo.DeleteObject(ctx, id)
		if err != nil {
			log.WithContext(ctx).Error("HandleDepartmentDelete delete DeleteObject info error", zap.Error(err))
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		err = uc.objectSubtypeRepo.BatchDelete(ctx, []string{id}, "")
		if err != nil {
			log.WithContext(ctx).Error("HandleDepartmentDelete delete BatchDelete info error", zap.Error(err))
			return errorcode.Desc(errorcode.PublicDatabaseError)
		}
		mqMessage := domain.NewDeleteObjectMessage(object.ID, object.Type)
		if mqMessage != nil {
			if err = uc.producer.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
				log.WithContext(ctx).Error("send delete object info error", zap.Error(err))
				return errorcode.Desc(errorcode.BusinessStructureDeleteObjectMessageSendError)
			}
		}
	}
	//更新同步时间
	syncTime = time.Now()
	return nil
}

func (uc *businessStructUseCase) HandleDepartmentMove(ctx context.Context, id, newPathId string) error {
	object, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}

	pathIds := strings.Split(newPathId, "/")
	newParentId := pathIds[len(pathIds)-2]
	targetObj, err := uc.repo.GetObjByID(ctx, newParentId)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil
		}
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	objs, err := uc.repo.GetObjByPathID(ctx, id)
	if err != nil {
		return err
	}
	newPath := targetObj.Path + "/" + object.Name
	for _, obj := range objs {
		obj.PathID = strings.Replace(obj.PathID, object.PathID, newPathId, 1)
		obj.Path = strings.Replace(obj.Path, object.Path, newPath, 1)
	}
	err = uc.repo.UpdatePath(ctx, id, "", objs)
	if err != nil {
		return errorcode.Desc(errorcode.PublicDatabaseError)
	}
	mqMessage := domain.NewMoveObjectMessage(object.PathID, newPathId, object.Path, newPath, "", object.Type)
	if mqMessage != nil {
		if err = uc.producer.Send(mqMessage.Topic, []byte(mqMessage.Message)); err != nil {
			log.WithContext(ctx).Error("send move object info error", zap.Error(err))
			return errorcode.Desc(errorcode.BusinessStructureMoveObjectMessageSendError)
		}
	}
	//更新同步时间
	syncTime = time.Now()
	return nil
}

func (uc *businessStructUseCase) ToTree(ctx context.Context, req *domain.QueryPageReqParam) (tree []*domain.SummaryInfoTreeNode, err error) {
	resp, err := uc.ListByPaging(ctx, req)
	if err != nil {
		return nil, err
	}
	treeWithType, err := uc.getTreeWithType(ctx, resp)
	if err != nil {
		return nil, err
	}
	return treeWithType, nil
}

func (uc *businessStructUseCase) GetDepartmentPrecision(ctx context.Context, req *domain.GetDepartmentPrecisionReq) (*domain.GetDepartmentPrecisionRes, error) {
	precision, err := uc.repo.GetDepartmentPrecision(ctx, req.IDS)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	res := make([]*domain.DepartmentInternal, len(precision))
	for i, value := range precision {
		res[i] = &domain.DepartmentInternal{
			ID:          value.ID,
			Name:        value.Name,
			PathID:      value.PathID,
			Path:        value.Path,
			Type:        value.Type,
			DeletedAt:   int32(value.DeletedAt),
			ThirdDeptId: value.ThirdDeptId,
		}
	}
	return &domain.GetDepartmentPrecisionRes{
		Departments: res,
	}, nil

}

func (uc *businessStructUseCase) GetDepartsByPaths(ctx context.Context, req *CommonRest.GetDepartmentByPathReq) (resp *CommonRest.GetDepartmentByPathRes, err error) {
	if len(req.Paths) <= 0 {
		return nil, nil
	}
	resp, err = uc.repo.GetObjectByDepartName(ctx, req.Paths)
	if err != nil {
		log.Error("GetDepartsByPaths -> Query Objects filed: ", zap.Error(err))
		return nil, err
	}
	return
}

func (uc *businessStructUseCase) SyncStructure(ctx context.Context) (bool, error) {
	//获取原有部门列表
	dbObjs, err := uc.repo.GetAllObjects(ctx)
	if err != nil {
		log.WithContext(ctx).Errorf("SyncStructure error :%v", err.Error())
		return false, err
	}
	dbObjIds := make([]string, 0)
	dbObjMap := make(map[string]*model.Object)
	for _, obj := range dbObjs {
		dbObjMap[obj.ID] = obj
		dbObjIds = append(dbObjIds, obj.ID)
	}

	newObjIdStr := ""
	for i := 0; ; i++ {
		departments, err := uc.ug.GetDepartments(ctx, i)
		if err != nil {
			return false, err
		}
		var organizationStr string
		for _, organization := range departments {
			if i == 0 {
				if dbObj, ok := dbObjMap[organization.ID]; !ok {
					//添加新部门
					_, err = uc.repo.Create(ctx, &model.Object{ID: organization.ID, Name: organization.Name, PathID: organization.ID, Path: organization.Name, Type: 1, ThirdDeptId: organization.ThirdId, IsRegister: 1})
					if err != nil {
						log.WithContext(ctx).Errorf("SyncStructure error :%v", err.Error())
						return false, err
					}
				} else {
					//根据变动修改部门名称或者路径
					if dbObj.Name != organization.Name || dbObj.PathID != organization.ID || dbObj.Path != organization.Name {
						err = uc.repo.UpdateStructure(ctx, organization.ID, organization.Name, organization.ID, organization.Name)
						if err != nil {
							log.WithContext(ctx).Errorf("SyncStructure error :%v", err.Error())
							return false, err
						}
					}

				}
			}
			newObjIdStr += organization.ID + ","
			organizationStr += organization.ID + ","
		}
		if i > 0 && len(departments) > 0 {
			organizationStr = strings.TrimRight(organizationStr, ",")
			departmentInfos, err := uc.ug.GetDepartmentParentInfo(ctx, organizationStr, "name,parent_deps,third_id")
			if err != nil {
				return false, err
			}

			for _, departmentInfo := range departmentInfos {
				var path, pathID string
				for _, parent := range departmentInfo.ParentDep {
					pathID += parent.ID + "/"
					path += parent.Name + "/"
				}
				pathID += departmentInfo.ID
				path += departmentInfo.Name
				thirdId := departmentInfo.ThirdId
				if dbObj, ok := dbObjMap[departmentInfo.ID]; !ok {
					//添加新部门
					_, err = uc.repo.Create(ctx, &model.Object{ID: departmentInfo.ID, Name: departmentInfo.Name, PathID: pathID, Path: path, Type: 2, ThirdDeptId: thirdId})
					if err != nil {
						log.WithContext(ctx).Errorf("SyncStructure error :%v", err.Error())
						return false, err
					}
				} else {
					//根据变动修改部门名称或者路径
					if dbObj.Name != departmentInfo.Name || dbObj.PathID != pathID || dbObj.Path != path {
						err = uc.repo.UpdateStructure(ctx, departmentInfo.ID, departmentInfo.Name, pathID, path)
						if err != nil {
							log.WithContext(ctx).Errorf("SyncStructure error :%v", err.Error())
							return false, err
						}
					}
				}
				newObjIdStr += departmentInfo.ID + ","
			}
		} else if i > 0 && len(departments) == 0 {
			break
		}
	}

	//删除不存在的部门
	deleteObjIds := make([]string, 0)
	for _, dbObjId := range dbObjIds {
		if !strings.Contains(newObjIdStr, dbObjId) {
			deleteObjIds = append(deleteObjIds, dbObjId)
		}
	}
	err = uc.repo.BatchDelete(ctx, deleteObjIds)
	if err != nil {
		return false, err
	}
	err = uc.objectSubtypeRepo.BatchDelete(ctx, deleteObjIds, "")
	if err != nil {
		return false, err
	}

	//更新同步时间
	syncTime = time.Now()

	return true, nil
}

func (uc *businessStructUseCase) GetSyncTime() (*domain.GetSyncTimeResp, error) {
	return &domain.GetSyncTimeResp{SyncedAt: syncTime.UnixMilli()}, nil
}

func (uc *businessStructUseCase) UpdateFileById(ctx context.Context, req *domain.ObjectUpdateFileReq, id string) (string, error) {
	t, err := uc.repo.GetObjByID(ctx, id)
	if err != nil {
		log.WithContext(ctx).Errorf("UpdateFileById error :%v", err.Error())
		return "", errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	reqAttr := &domain.ObjectUpdateReq{}
	var data map[string]interface{}
	err = json.Unmarshal([]byte(t.Attribute), &data)
	if err != nil {
		log.WithContext(ctx).Errorf("Error parsing JSON: :%v", err.Error())
		return "", errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	reqAttr.Attribute = data
	_, resMap, err := reqAttr.ToModel(ctx, constant.ObjectTypeToString(t.Type))
	newFileIds := make([]string, 0)
	newFileNames := make([]string, 0)
	if v, ok := resMap["file_specification_id"]; ok && v != nil {
		fileIds := strings.Split(v.(string), ",")
		fileNames := strings.Split(resMap["file_specification_name"].(string), ",")
		for i, values := range fileIds {
			if values != req.FileId {
				newFileIds = append(newFileIds, values)
				newFileNames = append(newFileNames, fileNames[i])
			}
		}
	} else {
		return req.FileName, nil
	}
	resMap["file_specification_id"] = strings.Join(newFileIds, ",")
	resMap["file_specification_name"] = strings.Join(newFileNames, ",")
	res, err := json.Marshal(resMap)
	if err != nil {
		log.WithContext(ctx).Error("Marshal", zap.Error(err))
		return "", errorcode.Detail(errorcode.PublicInternalError, err.Error())
	}
	//if objModel.Attribute = domain.UpdateAttr(t.Attribute, string(res)); objModel.Attribute == "" {
	//	return "", errorcode.Desc(errorcode.PublicInternalError)
	//}
	err = uc.repo.UpdateAttr(ctx, id, string(res))
	if err != nil {
		log.WithContext(ctx).Errorf("UpdateFileById error :%v", err.Error())
		return "", errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return req.FileName, nil
}
func (uc *businessStructUseCase) FirstLevelDepartment(ctx context.Context) (res []*domain.FirstLevelDepartmentRes, err error) {
	department1, err := uc.repo.FirstLevelDepartment1(ctx)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	pathIds, err := uc.repo.GetSecondLevelNotDepart(ctx)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	for _, pathId := range pathIds {
		department2, err := uc.repo.FirstLevelDepartment2(ctx, pathId)
		if err != nil {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		department1 = append(department1, department2...)
	}
	return department1, nil

}

func (uc *businessStructUseCase) GetDepartmentByIdOrThirdId(ctx context.Context, id string) (*domain.GetResp, error) {
	object, err := uc.repo.GetObject(ctx, id)
	if err != nil {
		log.WithContext(ctx).Error("object not found", zap.String("object id", id), zap.Error(err))
		return nil, err
	}
	// 获取用户名称
	userNames := ""
	if object.UserIds != "" {
		userIds := strings.Split(object.UserIds, ",")
		userNameMap, err := uc.user.GetByUserNameMap(ctx, userIds)
		if err != nil {
			log.WithContext(ctx).Warn("failed to get user names", zap.Error(err))
		} else {
			var names []string
			for _, userId := range userIds {
				if name, exists := userNameMap[userId]; exists && name != "" {
					names = append(names, name)
				} else {
					names = append(names, userId) // 如果找不到名称，使用ID
				}
			}
			userNames = strings.Join(names, ",")
		}
	}

	resp := &domain.GetResp{
		ID:          object.ID,
		Name:        object.Name,
		Path:        object.Path,
		PathID:      object.PathID,
		Type:        constant.ObjectTypeToString(object.Type),
		Subtype:     object.Subtype,
		ThirdDeptId: object.ThirdDeptId,
		UserIds:     object.UserIds,
		UserNames:   userNames,
	}
	if object.Attribute != "" {
		if object.Type == int32(constant.ObjectTypeOrganization) {
			var attribute domain.OrgAttribute
			err = json.Unmarshal([]byte(object.Attribute), &attribute)
			if err != nil {
				return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
			}
			resp.Attributes = attribute
		} else if object.Type == int32(constant.ObjectTypeDepartment) {
			var attribute domain.DepartmentAttribute
			err = json.Unmarshal([]byte(object.Attribute), &attribute)
			if err != nil {
				return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
			}
			resp.Attributes = attribute
		} else {
			return nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
		}
	} else {
		resp.Attributes = struct{}{}
	}

	return resp, nil
}

func (uc *businessStructUseCase) UpdateObjectRegister(ctx context.Context, req *model.Object) error {
	return uc.repo.UpdateRegister(ctx, req)
}

func (uc *businessStructUseCase) GetDepartmentsByIds(ctx context.Context, ids []string) ([]*domain.GetResp, error) {
	objects, err := uc.repo.GetObjectsByIDs(ctx, ids)
	if err != nil {
		return nil, err
	}
	lists := make([]*domain.GetResp, 0, len(objects))
	for _, object := range objects {
		o := &domain.GetResp{
			ID:          object.ID,
			Name:        object.Name,
			Path:        object.Path,
			PathID:      object.PathID,
			Type:        constant.ObjectTypeToString(object.Type),
			ThirdDeptId: object.ThirdDeptId,
			IsRegister:  object.IsRegister,
			DeptTag:     object.DeptTag,
		}
		if object.Attribute != "" {
			if object.Type == int32(constant.ObjectTypeOrganization) {
				var attribute domain.OrgAttribute
				err = json.Unmarshal([]byte(object.Attribute), &attribute)
				if err != nil {
					return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
				}
				o.Attributes = attribute
			} else if object.Type == int32(constant.ObjectTypeDepartment) {
				var attribute domain.DepartmentAttribute
				err = json.Unmarshal([]byte(object.Attribute), &attribute)
				if err != nil {
					return nil, errorcode.Desc(errorcode.BusinessStructureJsonUnmarshalFailed)
				}
				o.Attributes = attribute
			} else {
				return nil, errorcode.Desc(errorcode.BusinessStructureJsonifyFailed)
			}
		} else {
			o.Attributes = struct{}{}
		}
		lists = append(lists, o)
	}

	return lists, nil
}
