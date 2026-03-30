package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"strconv"
	"strings"
	"time"
)

const (
	AuthInfoRedisClientKey  = "auth:info"
	AuthInfoCacheExpiration = time.Second * 5
)

func authInfoRedisClientKey(keys ...string) string {
	ps := append([]string{AuthInfoRedisClientKey}, keys...)
	return strings.Join(ps, ":")
}

func (d *AuthHelper) cacheAuthedInfo(ctx context.Context, key string, data any) {
	payload := lo.T2(json.Marshal(data)).A
	if err := d.redisClient.Set(ctx, key, payload, AuthInfoCacheExpiration); err != nil {
		log.Warnf("cache auth data %v error: %v", key, err.Error())
	}
}

// queryObjectInCache  查询object 信息
func (d *AuthHelper) queryObjectInCache(ctx context.Context, key string) (obj *dto.Object, err error) {
	data, err := d.redisClient.Get(ctx, key)
	if err != nil {
		log.Warnf("queryObjectInCache %v error: %v", key, err.Error())
		return nil, err
	}
	if err = json.Unmarshal([]byte(data), obj); err != nil {
		log.Warnf("queryObjectInCache %v  Unmarshal error: %v", key, err.Error())
		return nil, err
	}
	return obj, nil
}

// 获取资源信息
func (d *AuthHelper) getObjectInfo(ctx context.Context, objectType, objectId string) (objectInfo *dto.Object, err error) {
	key := authInfoRedisClientKey(objectType, objectId)
	objectInfo, err = d.queryObjectInCache(ctx, key)
	if err == nil {
		return objectInfo, nil
	}
	objectInfo, err = d.getObjectInfoFromDB(ctx, objectType, objectId)
	if err != nil {
		log.Warnf("getObjectInfo error %v", err.Error())
		return nil, err
	}
	//缓存下数据，应该设置下空
	d.cacheAuthedInfo(ctx, key, objectInfo)
	return objectInfo, nil
}

// 获取资源信息
func (d *AuthHelper) getObjectInfoFromDB(ctx context.Context, objectType, objectId string) (objectInfo *dto.Object, err error) {
	switch objectType {
	case enum.ObjectTypeDataView:
		objectInfo, err = d.GetDataViewInfo(ctx, objectId) // 逻辑视图、
	case enum.ObjectTypeSubView: // 子视图（行列规则
		objectInfo, err = d.GetSubViewInfo(ctx, objectId)

	case enum.ObjectTypeApi:
		objectInfo, err = d.GetDataApplicationInfo(ctx, objectId) // 接口服务
	case enum.ObjectTypeSubService:
		objectInfo, err = d.GetSubService(ctx, objectId) //接口服务行列规则

	case enum.ObjectTypeIndicator:
		objectInfo, err = d.GetIndicatorInfo(ctx, objectId) // 指标
	case enum.ObjectTypeIndicatorDimensionalRule:
		objectInfo, err = d.GetSubIndicatorInfo(ctx, objectId) // 指标维度规则

	default:
		objectInfo = &dto.Object{}
	}

	if err != nil {
		return nil, err
	}
	//补上部门信息
	ownerKeys := lo.Times(len(objectInfo.Owners), func(index int) string {
		return util.JoinField(dto.SubjectUser.String(), objectInfo.Owners[index].OwnerID)
	})
	subjectInfo, err := d.getSubjectKeyInfos(ctx, ownerKeys)
	if err != nil {
		return nil, errorcode.PublicConfigurationCenterError.Detail(err.Error())
	}
	ownerDepartmentInfoDict := lo.SliceToMap(subjectInfo, func(item *dto.Subject) (string, [][]dto.Department) {
		return item.SubjectId, item.Departments
	})
	for i := range objectInfo.Owners {
		objectInfo.OwnerDepartments = ownerDepartmentInfoDict[objectInfo.Owners[i].OwnerID]

	}
	return objectInfo, nil
}

// GetDataViewInfo 查询视图详情
func (d *AuthHelper) GetDataViewInfo(ctx context.Context, objectID string) (*dto.Object, error) {
	dataView, err := d.dataViewDriven.GetDataViewDetails(ctx, objectID)
	if err != nil {
		return nil, err
	}
	objectInfo := &dto.Object{
		ObjectId:     objectID,
		ObjectType:   dto.ObjectDataView.Str(),
		ObjectName:   dataView.BusinessName,
		DepartmentID: dataView.DepartmentID,
		Owners: lo.Times(len(dataView.Owners), func(index int) dto.ObjectOwner {
			return dto.ObjectOwner{
				OwnerID:   dataView.Owners[index].OwnerID,
				OwnerName: dataView.Owners[index].Owner,
			}
		}),
	}
	return objectInfo, nil
}

func (d *AuthHelper) GetDataApplicationInfo(ctx context.Context, objectID string) (*dto.Object, error) {
	apiDetail, err := d.apiDriven.InternalGetServiceDetail(ctx, objectID)
	if err != nil {
		return nil, err
	}
	objectInfo := &dto.Object{
		ObjectId:     apiDetail.ServiceInfo.ServiceID,
		ObjectType:   dto.ObjectAPI.Str(),
		ObjectName:   apiDetail.ServiceInfo.ServiceName,
		DepartmentID: apiDetail.ServiceInfo.Department.Id,
		Owners: lo.Times(len(apiDetail.ServiceInfo.Owners), func(index int) dto.ObjectOwner {
			return dto.ObjectOwner{
				OwnerID:   apiDetail.ServiceInfo.Owners[index].OwnerID,
				OwnerName: apiDetail.ServiceInfo.Owners[index].OwnerName,
			}
		}),
	}
	return objectInfo, nil
}

func (d *AuthHelper) GetIndicatorInfo(ctx context.Context, objectID string) (*dto.Object, error) {
	indicator, err := d.indicatorDriven.GetIndicator(ctx, objectID)
	if errors.Is(err, gorm.ErrNotFound) {
		return nil, errorcode.Desc(errorcode.ObjectIdNotExist)
	} else if err != nil {
		return nil, err
	}

	objectInfo := &dto.Object{
		ObjectId:     objectID,
		ObjectType:   dto.ObjectIndicator.Str(),
		ObjectName:   indicator.Name,
		DepartmentID: indicator.Department.Id,
		Owners: lo.Times(len(indicator.Owners), func(index int) dto.ObjectOwner {
			return dto.ObjectOwner{
				OwnerID:   indicator.Owners[index].OwnerID,
				OwnerName: indicator.Owners[index].OwnerName,
			}
		}),
	}
	return objectInfo, nil
}

func (d *AuthHelper) GetSubService(ctx context.Context, objectID string) (*dto.Object, error) {
	//从接口服务查询接口详情
	subService, err := d.apiDriven.GetSubServiceSimple(ctx, objectID)
	if err != nil {
		return nil, err
	}
	got, err := d.apiDriven.Service(ctx, subService.ServiceID.String())
	if err != nil {
		return nil, err
	}
	objectInfo := &dto.Object{
		ObjectId:       subService.ServiceID.String(),
		ObjectType:     dto.ObjectSubService.Str(),
		ObjectName:     subService.Name,
		SourceObjectID: subService.ServiceID.String(),
		DepartmentID:   got.ServiceInfo.Department.Id,
		AuthScopeID:    subService.AuthScopeID.String(),
		AuthScopeType:  dto.ObjectSubService.Str(),
		Owners: lo.Times(len(got.ServiceInfo.Owners), func(index int) dto.ObjectOwner {
			return dto.ObjectOwner{
				OwnerID:   got.ServiceInfo.Owners[index].OwnerID,
				OwnerName: got.ServiceInfo.Owners[index].OwnerName,
			}
		}),
	}
	//父级和顶级一样，授权范围就是顶级的类型
	if objectInfo.AuthScopeID == objectInfo.SourceObjectID {
		objectInfo.AuthScopeType = string(dto.ObjectAPI)
	}
	return objectInfo, nil
}

func (d *AuthHelper) GetSubViewInfo(ctx context.Context, objectID string) (*dto.Object, error) {
	// 获取子视图（行列规则）
	subView, err := d.dataViewDriven.GetSubView(ctx, objectID)
	if errors.Is(err, gorm.ErrNotFound) {
		return nil, errorcode.Desc(errorcode.ObjectIdNotExist)
	} else if err != nil {
		return nil, err
	}
	// 获取子视图（行列规则）所属逻辑视图
	dataView, err := d.dataViewDriven.GetDataViewDetails(ctx, subView.LogicViewID)
	if err != nil {
		return nil, err
	}
	// 认为子视图（行列规则）所属的逻辑视图的 Owner 即为子视图（行列规则）的 Owner
	objectInfo := &dto.Object{
		ObjectId:       objectID,
		ObjectType:     dto.ObjectSubView.Str(),
		ObjectName:     subView.Name,
		AuthScopeID:    subView.AuthScopeID,
		DepartmentID:   dataView.DepartmentID,
		SourceObjectID: fmt.Sprintf("%v", subView.LogicViewID),
		AuthScopeType:  dto.ObjectSubView.Str(),
		Owners: lo.Times(len(dataView.Owners), func(index int) dto.ObjectOwner {
			return dto.ObjectOwner{
				OwnerID:   dataView.Owners[index].OwnerID,
				OwnerName: dataView.Owners[index].Owner,
			}
		}),
	}
	//父级和顶级一样，授权范围就是顶级的类型
	if objectInfo.AuthScopeID == objectInfo.SourceObjectID {
		objectInfo.AuthScopeType = string(dto.ObjectDataView)
	}
	return objectInfo, nil
}

func (d *AuthHelper) GetSubIndicatorInfo(ctx context.Context, objectID string) (*dto.Object, error) {
	// 从数据库查询指标维度规则
	log.Debug("get indicator dimensional rule", zap.Any("id", objectID))
	rule, err := d.subIndicatorRepo.Get(ctx, objectID)
	if errors.Is(err, gorm.ErrNotFound) {
		return nil, errorcode.Desc(errorcode.ObjectIdNotExist)
	} else if err != nil {
		return nil, err
	}

	// 从数据库查询规则所属的指标
	log.Debug("get indicator the indicator dimensional rule belongs to", zap.Any("indicatorID", rule.Spec.IndicatorID))
	indicator, err := d.indicatorDriven.GetIndicator(ctx, strconv.Itoa(rule.Spec.IndicatorID))
	if errors.Is(err, gorm.ErrNotFound) {
		return nil, errorcode.Desc(errorcode.ObjectIdNotExist)
	} else if err != nil {
		return nil, err
	}
	objectInfo := &dto.Object{
		ObjectId:       objectID,
		ObjectType:     dto.ObjectSubIndicator.Str(),
		ObjectName:     rule.Spec.Name,
		DepartmentID:   indicator.Department.Id,
		AuthScopeID:    fmt.Sprintf("%v", rule.Spec.AuthScopeID),
		SourceObjectID: fmt.Sprintf("%v", rule.Spec.IndicatorID),
		AuthScopeType:  dto.ObjectSubIndicator.Str(),
		Owners: lo.Times(len(indicator.Owners), func(index int) dto.ObjectOwner {
			return dto.ObjectOwner{
				OwnerID:   indicator.Owners[index].OwnerID,
				OwnerName: indicator.Owners[index].OwnerName,
			}
		}),
	}
	//父级和顶级一样，授权范围就是顶级的类型
	if objectInfo.AuthScopeID == objectInfo.SourceObjectID {
		objectInfo.AuthScopeType = string(dto.ObjectIndicator)
	}
	return objectInfo, nil
}
