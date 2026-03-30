package impl

import (
	"context"
	"database/sql"
	"fmt"
	"time"

	"go.uber.org/zap"

	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/info_system"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

func (uc *infoSystemUseCase) RegisterInfoSystem(ctx context.Context, id string, req *domain.RegisterInfoSystem, userInfo *model.User) (*response.NameIDResp2, error) {
	// 获取信息系统，检查信息系统是否存在
	infoSystem, err := uc.repo.GetByID(ctx, id)
	if err != nil {
		return nil, err
	}
	// 获取第三方用户信息
	var ids []string
	userInfos, err := uc.user.GetByUserIds(ctx, req.ResponsibleUIDS)
	if err != nil {
		log.WithContext(ctx).Error("ConfigurationCenter GetByUserIds error" + err.Error())
		return nil, err
	}
	for _, userInfo := range userInfos {
		ids = append(ids, userInfo.ThirdServiceId)
	}

	err = uc.systemRegister(ctx, ids, req, infoSystem)
	if err != nil {
		log.WithContext(ctx).Error("systemRegister error" + err.Error())
		return nil, err
	}

	// 入库
	infoSystem.IsRegisterGateway = sql.NullInt32{Int32: domain.RegisteGateway, Valid: true}
	infoSystem.SystemIdentifier = req.SystemIdentifier
	infoSystem.RegisterAt = time.Now()
	var registers []*model.LiyueRegistration
	for _, uid := range req.ResponsibleUIDS {
		registers = append(registers, &model.LiyueRegistration{
			LiyueID: id,
			UserID:  uid,
			Type:    2,
		})
	}
	if err = uc.repo.RegisterInfoSystem(ctx, infoSystem, registers); err != nil {
		return nil, err
	}

	return &response.NameIDResp2{
		ID: id,
	}, nil
}

func (uc *infoSystemUseCase) SystemIdentifierRepeat(ctx context.Context, req *domain.IdentifierRepeat) error {
	repeat, err := uc.repo.CheckSystemIdentifierRepeat(ctx, req.Identifier, req.ID)
	if err != nil {
		return err
	}
	if repeat {
		return errorcode.Desc(errorcode.InfoSystemNameExist)
	}
	return nil
}

func (uc *infoSystemUseCase) systemRegister(ctx context.Context, ids []string, req *domain.RegisterInfoSystem, infoSystem *model.InfoSystem) error {
	if infoSystem.IsRegisterGateway.Int32 != domain.RegisteGateway {
		log.Info("start SystemCreate-------------------------------------")
		// 获取部门信息
		department, err := uc.liyueRegistrationsRepo.GetLiyueRegistration(ctx, infoSystem.DepartmentId.String)
		if err != nil {
			return err
		}
		// 创建注册
		rParams := &register.SystemCreateRequest{
			Sysid:       req.SystemIdentifier,
			Name:        infoSystem.Name,
			Operators:   ids,
			Description: infoSystem.Description.String,
			Orgid:       department.ID,
		}

		log.Info("invoke callback SystemCreate", zap.Any("SystemCreateRequest", rParams))
		r, err := uc.register.SystemCreate(ctx, rParams)
		if err != nil {
			return err
		}
		log.Info("SystemCreate error, Errcode", zap.Any("SystemCreate", r.Errcode))
		log.Info("SystemCreate error, Errmsg:", zap.Any("SystemCreate", r.Errmsg))
		if r.Errcode != "0" {
			return fmt.Errorf("SystemCreate error,Errcode: %s,  Errmsg: %s", r.Errcode, r.Errmsg)
		}
	} else {
		// 修改注册
		log.Info("start SystemUpdate---------------------------------------------")
		rParams := &register.SystemUpdateRequest{
			Sysid:       req.SystemIdentifier,
			Operators:   ids,
			Description: infoSystem.Description.String,
		}
		log.Info("invoke callback SystemUpdate", zap.Any("SystemUpdate", rParams))
		r, err := uc.register.SystemUpdate(ctx, rParams)
		if err != nil {
			return err
		}
		log.Info("SystemUpdate error, Errmsg:", zap.Any("SystemUpdate", r.Errmsg))
		log.Info("SystemUpdate error, Errcode", zap.Any("SystemUpdate", r.Errcode))
		if r.Errcode != "0" {
			return fmt.Errorf("SystemUpdate error,Errcode: %s,  Errmsg: %s", r.Errcode, r.Errmsg)
		}
	}
	return nil
}
