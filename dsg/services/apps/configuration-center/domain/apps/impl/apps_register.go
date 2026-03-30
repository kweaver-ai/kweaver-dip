package impl

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	app_register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	"go.uber.org/zap"
	"gorm.io/gorm"
)

func (u appsUseCase) AppRegister(ctx context.Context, req *apps.AppRegister, userInfo *model.User) (*apps.CreateOrUpdateResBody, error) {
	// 数据库中获取应用信息,检查是否存在
	appFromDb, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "published")
	if err != nil {
		return nil, err
	}
	// 获取信息系统
	infoSystem, err := u.infoSystemrepo.GetByID(ctx, *appFromDb.InfoSystem)
	if err != nil {
		log.WithContext(ctx).Error("ConfigurationCenter infoSystemrepo.GetByID error" + err.Error())
		return nil, errorcode.Desc("GetInfoSystemFailed")
	}
	// 获取第三方用户信息
	var ids []string
	userInfos, err := u.user.GetByUserIds(ctx, req.ResponsibleUIDS)
	if err != nil {
		log.WithContext(ctx).Error("ConfigurationCenter GetByUserIds error" + err.Error())
		return nil, err
	}
	for _, userInfo := range userInfos {
		ids = append(ids, userInfo.ThirdServiceId)
	}
	// 注册
	err = u.register(ctx, ids, appFromDb, infoSystem)
	if err != nil {
		log.WithContext(ctx).Error("Register error" + err.Error())
		return nil, err
	}

	// 入库
	var registers []*model.LiyueRegistration
	for _, uid := range req.ResponsibleUIDS {
		registers = append(registers, &model.LiyueRegistration{
			LiyueID: req.Id,
			UserID:  uid,
			Type:    3,
		})
	}
	err = u.appsRepo.RegistApp(ctx, appFromDb.AppsID, appFromDb.AppID, registers)
	if err != nil {
		return nil, err
	}

	return &apps.CreateOrUpdateResBody{ID: req.Id}, err
}

func (u appsUseCase) AppsRegisterList(ctx context.Context, req *apps.ListRegisteReqQuery, userInfo *model.User) (*apps.ListRegisteRes, error) {

	// 内部定义的结构体（infoSystem）
	type infoSystem struct {
		ID             string `json:"id"`
		Name           string `json:"name"`            // 信息系统名称
		DepartmentID   string `json:"department_id"`   // 部门ID
		DepartmentName string `json:"department_name"` // 部门名称
		DepartmentPath string `json:"department_path"` // 部门路径
	}

	infoSystemNameMap := make(map[string]infoSystem)
	infoSystemIds := []string{}
	info_system_ids := []string{}

	// 如果部门不等于空，根据部门获取信息系统的id
	if req.DepartmentID != "" {
		modelInfoSystems, err := u.infoSystemrepo.GetAllByDepartmentId(ctx, req.DepartmentID)
		if err != nil {
			return nil, err
		}
		for _, modelInfoSystem := range modelInfoSystems {
			if req.InfoSystem != "" {
				if req.InfoSystem == modelInfoSystem.ID {
					infoSystemIds = []string{modelInfoSystem.ID}
					break
				}
			} else {
				infoSystemIds = append(infoSystemIds, modelInfoSystem.ID)
			}

		}
		// 如果信息系统为空，直接返回空
		if len(infoSystemIds) == 0 {
			res := &apps.ListRegisteRes{
				PageResults: response.PageResults[apps.RegisteList]{
					Entries:    []*apps.RegisteList{},
					TotalCount: 0,
				},
			}
			return res, nil
		}
	}
	// 部门为空时，检查是否有信息系统
	if req.DepartmentID == "" && req.InfoSystem != "" {
		infoSystemIds = append(infoSystemIds, req.InfoSystem)
	}

	// 获取数据库中所有Apps
	appses, count, err := u.appsRepo.ListRegisterApps(ctx, infoSystemIds, req)
	if err != nil {
		return nil, err
	}
	for _, appsTemp := range appses {
		info_system_ids = append(info_system_ids, *appsTemp.InfoSystem)
	}

	// 获取信息系统（批量）
	if len(info_system_ids) > 0 {
		batchs, err := u.infoSystemrepo.GetAllByIDS(ctx, info_system_ids)
		if err != nil {
			log.WithContext(ctx).Error("ConfigurationCenter error" + err.Error())
		}
		for _, batch := range batchs {
			infoSystemNameMap[batch.ID] = infoSystem{
				ID:             batch.ID,
				Name:           batch.Name,
				DepartmentID:   batch.DepartmentId,
				DepartmentName: batch.DepartmentName,
				DepartmentPath: batch.DepartmentPath,
			}
		}
	}

	// 构建响应
	entries := []*apps.RegisteList{}
	for _, appsTemp := range appses {
		content := make([]*apps.IpAddr, 0)
		if err := json.Unmarshal([]byte(appsTemp.IpAddr), &content); err != nil {
			return nil, err
		}
		registerAt := appsTemp.RegisterAt.UnixMilli()
		if registerAt < 0 {
			registerAt = 0
		}
		entries = append(entries, &apps.RegisteList{
			ID:                appsTemp.Apps.AppsID,
			Name:              appsTemp.Name,
			Description:       *appsTemp.Description,
			PassID:            appsTemp.PassID,
			InfoSystemName:    infoSystemNameMap[*appsTemp.InfoSystem].Name,
			DepartmentId:      infoSystemNameMap[*appsTemp.InfoSystem].DepartmentID,
			DepartmentName:    infoSystemNameMap[*appsTemp.InfoSystem].DepartmentName,
			DepartmentPath:    infoSystemNameMap[*appsTemp.InfoSystem].DepartmentPath,
			AppType:           appsTemp.AppType,
			IsRegisterGateway: appsTemp.IsRegisterGateway.Int32 == apps.RegisteGateway,
			RegisterAt:        registerAt,
			IpAddrs:           content,
		})
	}

	res := &apps.ListRegisteRes{
		PageResults: response.PageResults[apps.RegisteList]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u appsUseCase) PassIDRepeat(ctx context.Context, req *apps.PassIDRepeatReq) (bool, error) {
	err := u.appsRepo.CheckPassIDRepeatWithId(ctx, req.PassId, req.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = u.appsRepo.CheckEditingPassIDRepeatWithId(ctx, req.PassId, req.ID)
			if err != nil {
				if errors.Is(err, gorm.ErrRecordNotFound) {
					return true, nil
				}
				return false, errorcode.Desc(errorcode.PublicDatabaseError)
			}

		} else {
			return false, errorcode.Desc(errorcode.PublicDatabaseError)
		}
	}
	return false, errorcode.Desc(errorcode.AppsNameExist)
}

func (u appsUseCase) register(ctx context.Context, ids []string, appFromDb *model.AllApp, infoSystem *model.InfoSystem) error {
	// 注册
	if appFromDb.IsRegisterGateway.Int32 != apps.RegisteGateway {
		log.Info("start AppCreate---------------------------------------------")
		// 获取部门信息
		department, err := u.liyueRegistrationsRepo.GetLiyueRegistration(ctx, infoSystem.DepartmentId.String)
		if err != nil {
			return err
		}
		// 创建注册
		rParams := &app_register.AppCreateRequest{
			SystemId:    infoSystem.SystemIdentifier,
			PaasId:      appFromDb.PassID,
			Tokens:      []*app_register.AppTokenRequest{{Token: appFromDb.Token}},
			Operators:   ids,
			Description: *appFromDb.Description,
			Name:        appFromDb.Name,
			Orgid:       department.ID,
		}
		log.Info("invoke callback AppCreate", zap.Any("AppCreate", rParams))
		r, err := u.app_register.AppCreate(ctx, rParams)
		if err != nil {
			return err
		}
		log.Info("AppCreate error, Errcode", zap.Any("AppCreate", r.Errcode))
		log.Info("AppCreate error, Errmsg:", zap.Any("AppCreate", r.Errmsg))
		if r.Errcode != "0" {
			return fmt.Errorf("AppCreate error,Errcode: %s,  Errmsg: %s", r.Errcode, r.Errmsg)
		}

	} else {
		// 修改注册
		log.Info("start AppUpdate---------------------------------------------")
		rParams := &app_register.AppUpdateRequest{
			PaasId:      appFromDb.PassID,
			Tokens:      []*app_register.AppTokenRequest{{Token: appFromDb.Token}},
			Operators:   ids,
			Description: *appFromDb.Description,
		}
		log.Info("invoke callback AppUpdate", zap.Any("AppUpdate", rParams))
		r, err := u.app_register.AppUpdate(ctx, rParams)
		if err != nil {
			return err
		}
		log.Info("AppUpdate error, Errcode", zap.Any("AppUpdate", r.Errcode))
		log.Info("AppUpdate error, Errmsg:", zap.Any("AppUpdate", r.Errmsg))
		if r.Errcode != "0" {
			return fmt.Errorf("AppUpdate error,Errcode: %s,  Errmsg: %s", r.Errcode, r.Errmsg)
		}
	}
	return nil
}
