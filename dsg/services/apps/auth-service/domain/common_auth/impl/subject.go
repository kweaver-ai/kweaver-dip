package impl

import (
	"context"
	"encoding/json"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/redis"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/indicator_management"
	"github.com/kweaver-ai/idrm-go-common/rest/user_management"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
	"go.uber.org/zap"
	"strings"
	"time"
)

type AuthHelper struct {
	redisClient          *redis.Client
	subIndicatorRepo     gorm.IndicatorDimensionalRuleInterface
	ccDriven             configuration_center.Driven
	apiDriven            data_application_service.Driven
	dataViewDriven       data_view.Driven
	indicatorDriven      indicator_management.Driven
	userManagementDriven user_management.DrivenUserMgnt
}

func NewAuthHelper(
	redisClient *redis.Client,
	subIndicatorRepo gorm.IndicatorDimensionalRuleInterface,
	ccDriven configuration_center.Driven,
	apiDriven data_application_service.Driven,
	dataViewDriven data_view.Driven,
	indicatorDriven indicator_management.Driven,
	userManagementDriven user_management.DrivenUserMgnt,
) *AuthHelper {
	return &AuthHelper{
		redisClient:          redisClient,
		subIndicatorRepo:     subIndicatorRepo,
		ccDriven:             ccDriven,
		apiDriven:            apiDriven,
		dataViewDriven:       dataViewDriven,
		indicatorDriven:      indicatorDriven,
		userManagementDriven: userManagementDriven,
	}
}

func (d *AuthHelper) getSubjectInfoDict(ctx context.Context, subjectKeys []string) (subjectInfos map[string]dto.Subject, err error) {
	if len(subjectKeys) == 0 {
		return make(map[string]dto.Subject), err
	}
	subjectInfoSlice, err := d.getSubjectKeyInfos(ctx, subjectKeys)
	if err != nil {
		log.Warn("get subject info fail", zap.Error(err))
		return make(map[string]dto.Subject), err
	}
	subjectInfoDict := lo.SliceToMap(subjectInfoSlice, func(item *dto.Subject) (string, dto.Subject) {
		return item.SubjectId, *item
	})
	return subjectInfoDict, nil
}

func (d *AuthHelper) getSubjectKeyInfos(ctx context.Context, subjectKeys []string) (subjectInfos []*dto.Subject, err error) {
	subjectInfos, err = d.querySubjectInCache(ctx, subjectKeys...)
	if err == nil {
		return subjectInfos, nil
	}
	subjectInfos, err = d.querySubjectKeyInfos(ctx, subjectKeys)
	if err != nil {
		return nil, err
	}
	//缓存下数据，应该设置下空
	args := make([]any, 0, len(subjectInfos))
	for _, subjectInfo := range subjectInfos {
		args = append(args, subjectInfo.Key(), subjectInfo)
	}
	if _, err = d.redisClient.MSetWithExp(ctx, time.Second*5, args...); err != nil {
		log.Warnf("getSubjectKeyInfos MSetWithExp fail, %v", err.Error())
	}
	return subjectInfos, nil
}

func (d *AuthHelper) querySubjectInCache(ctx context.Context, keys ...string) (subs []*dto.Subject, err error) {
	datas, err := d.redisClient.MGet(ctx, keys)
	if err != nil {
		log.Warnf("querySubjectInCache %v error: %v", keys, err.Error())
		return nil, err
	}
	for key, data := range datas {
		payload := fmt.Sprintf("%v", data)
		sub := &dto.Subject{}
		if err = json.Unmarshal([]byte(payload), sub); err != nil {
			log.Warnf("querySubjectInCache %v  Unmarshal error: %v", key, err.Error())
			return nil, err
		}
		subs = append(subs, sub)
	}
	return subs, nil
}

// 获取访问者信息
func (d *AuthHelper) querySubjectKeyInfos(ctx context.Context, subjectKeys []string) (subjectInfos []*dto.Subject, err error) {
	//ID分组
	subjectGroup := make(map[string][]string)
	for _, subjectKey := range subjectKeys {
		subjectType, subjectID := util.SplitField(subjectKey)
		subjectGroup[subjectType] = append(subjectGroup[subjectType], subjectID)
	}
	//分组查询
	for subjectType, subjectIDSlice := range subjectGroup {
		subjectIDSlice = lo.Uniq(subjectIDSlice)
		switch subjectType {
		// 应用
		case enum.SubjectTypeAPP:
			subjectInfoSlice, err := d.getUserManagementApplicationSubjects(ctx, subjectIDSlice...)
			if err != nil {
				log.Error("get application subject info fail", zap.Error(err), zap.String("type", subjectType), zap.Any("id", subjectIDSlice))
				return nil, err
			}
			subjectInfos = append(subjectInfos, subjectInfoSlice...)
		// 用户
		case enum.SubjectTypeUser:
			subjectInfoSlice, err := d.getUserSubjects(ctx, subjectIDSlice...)
			if err != nil {
				log.Error("get user subject info fail", zap.Error(err), zap.String("type", subjectType), zap.Any("id", subjectIDSlice))
				return nil, err
			}
			subjectInfos = append(subjectInfos, subjectInfoSlice...)
			// 部门
		case enum.SubjectTypeDepartment:
			subjectInfoSlice, err := d.getDepartmentSubjects(ctx, subjectIDSlice...)
			if err != nil {
				log.Error("get department subject info fail", zap.Error(err), zap.String("type", subjectType), zap.Any("id", subjectIDSlice))
				return nil, err
			}
			subjectInfos = append(subjectInfos, subjectInfoSlice...)
		}
	}
	return subjectInfos, nil
}

func (d *AuthHelper) getApplicationSubjects(ctx context.Context, appID ...string) (subjectInfos []*dto.Subject, err error) {
	appInfos, err := d.ccDriven.GetAppSimpleInfo(ctx, appID)
	if err != nil {
		return nil, errorcode.PublicConfigurationCenterError.Detail(err.Error())
	}
	return lo.Times(len(appInfos), func(index int) *dto.Subject {
		return &dto.Subject{
			SubjectType: string(dto.SubjectAPP),
			SubjectId:   appInfos[index].ID,
			SubjectName: appInfos[index].Name,
		}
	}), nil
}

// getUserManagementApplicationSubjects 查询user_management提供的应用
func (d *AuthHelper) getUserManagementApplicationSubjects(ctx context.Context, appID ...string) (subjectInfos []*dto.Subject, err error) {
	//单个应用直接查询即可
	if len(appID) == 1 {
		appSubject, err := d.getUserManagementSingleApplicationSubjects(ctx, appID[0])
		return []*dto.Subject{appSubject}, err
	}
	//没有批量查询接口，用列表接口代替下
	appMap := lo.SliceToMap(appID, func(item string) (string, bool) {
		return item, true
	})
	appListArgs := &user_management.AppListArgs{
		Limit:  1000,
		Offset: 0,
	}
	for {
		appList, err := d.userManagementDriven.GetUserManagementAppList(ctx, appListArgs)
		if err != nil {
			return nil, errorcode.PublicConfigurationCenterError.Detail(err.Error())
		}
		if len(appList.Entries) == 0 {
			break
		}
		//过滤下查询的应用
		appList.Entries = lo.Filter(appList.Entries, func(item *user_management.AppEntry, index int) bool {
			if appMap[item.ID] {
				delete(appMap, item.ID)
			}
			return appMap[item.ID]
		})
		//获取返回结果
		subjectInfos = append(subjectInfos, lo.Map(appList.Entries, func(item *user_management.AppEntry, index int) *dto.Subject {
			return &dto.Subject{
				SubjectType: string(dto.SubjectAPP),
				SubjectId:   item.ID,
				SubjectName: item.Name,
			}
		})...)
		//退出条件
		if len(appList.Entries) < appListArgs.Limit {
			break
		}
		//下一页偏移量
		appListArgs.Offset += len(appList.Entries)
	}
	return subjectInfos, nil
}

func (d *AuthHelper) getUserManagementSingleApplicationSubjects(ctx context.Context, appID string) (subjectInfo *dto.Subject, err error) {
	appInfo, err := d.userManagementDriven.GetUserManagementApp(ctx, appID)
	if err != nil {
		return nil, errorcode.PublicConfigurationCenterError.Detail(err.Error())
	}
	return &dto.Subject{
		SubjectType: string(dto.SubjectAPP),
		SubjectId:   appInfo.ID,
		SubjectName: appInfo.Name,
	}, nil
}

func (d *AuthHelper) getUserSubjects(ctx context.Context, userID ...string) (subjectInfos []*dto.Subject, err error) {
	userInfos, err := d.ccDriven.GetUsers(ctx, userID)
	if err != nil {
		return nil, errorcode.PublicConfigurationCenterError.Detail(err.Error())
	}
	return lo.Times(len(userID), func(index int) *dto.Subject {
		subjectInfo := &dto.Subject{
			SubjectType: string(dto.SubjectUser),
			SubjectId:   userInfos[index].ID,
			SubjectName: userInfos[index].Name,
			Departments: make([][]dto.Department, len(userInfos[index].ParentDeps)),
		}
		//用户所属部门
		for i := range userInfos[index].ParentDeps {
			subjectInfo.Departments[i] = make([]dto.Department, len(userInfos[index].ParentDeps[i]))
			for j := range userInfos[index].ParentDeps[i] {
				department := dto.Department{
					DepartmentId:   userInfos[index].ParentDeps[i][j].ID,
					DepartmentName: userInfos[index].ParentDeps[i][j].Name,
				}
				subjectInfo.Departments[i][j] = department
			}
		}
		return subjectInfo
	}), nil
}

func (d *AuthHelper) getDepartmentSubjects(ctx context.Context, departmentID ...string) (subjectInfos []*dto.Subject, err error) {
	departmentInfos, err := d.ccDriven.GetDepartmentsByIds(ctx, departmentID)
	if err != nil {
		return nil, errorcode.PublicConfigurationCenterError.Detail(err.Error())
	}
	return lo.Times(len(departmentInfos), func(index int) *dto.Subject {
		subjectInfo := &dto.Subject{
			SubjectType: string(dto.SubjectUser),
			SubjectId:   departmentInfos[index].ID,
			SubjectName: departmentInfos[index].Name,
			//部门的上级部门
			Departments: make([][]dto.Department, 1),
		}
		depIDs := strings.Split(departmentInfos[index].PathID, "/")
		depNames := strings.Split(departmentInfos[index].Path, "/")
		for i := range depIDs {
			department := dto.Department{
				DepartmentId:   depIDs[i],
				DepartmentName: depNames[i],
			}
			subjectInfo.Departments[0][i] = department
		}
		return subjectInfo
	}), nil
}
