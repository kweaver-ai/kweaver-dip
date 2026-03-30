package impl

import (
	"context"
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"strings"
	"time"

	auth_service "github.com/kweaver-ai/idrm-go-common/rest/auth-service"

	kafka_infra "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
	"go.uber.org/zap"

	audit_process_bind_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/audit_process_bind"
	app_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/apps"
	liyue_registrations_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/liyue_registrations"
	"github.com/kweaver-ai/idrm-go-frame/core/utils"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/info_system"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/role"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/workflow"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"

	wf_workflow "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/workflow"

	// "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/mq/producers"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/hydra"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/sszd_service"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/user_management"
	app_register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/spt/register"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	user_domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	wf_go "github.com/kweaver-ai/idrm-go-common/workflow"
	wf_common "github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"

	"github.com/google/uuid"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/gorm"
)

const (
	AUDIT_ICON_BASE64 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABgAAAAYCAYAAADgdz34AAABQklEQVR4nO2UP0tCURjGnwOh" +
		"lINSGpRZEjjVUENTn6CWWoKc2mpra6qxpra2mnIybKipPkFTVA41CWGZBUmhg4US2HPuRfpzrn/OQcHBH9z3Pi+Xe393eM8r/FeJEwgsog2ICg6F/zpRYW4" +
		"bXUFDHAXR/jD2xmaw+3LHDtgYmmBV+f18/eES8fc0/uMoyE0vsQIHrynrpZ3gFDuVzWzS+pnVwQg7IHBzzPqXuoLCVxn7uRRTbdYCEXh7XEwGAl06U7Byf4Gzw" +
		"jOTyrx3GLHxWSYbI8FjqYhMucikEnJ5MOr2MNkYCeTHM6UPJpWQu8+SVDESbD0la06SnKDtkZ8RNhLoYCQ4z2dx+5lnUpns9WHOF2SyMRLE39I44ml2YpmnODo" +
		"QRhUjgQ5NC+R+kctOB61l10q6goZIwSnvC7xajoCIfQOxQqhkUqjuTQAAAABJRU5ErkJggg=="
)

var zero uint64

type appsUseCase struct {
	appsRepo                app_repo.AppsRepo
	liyueRegistrationsRepo  liyue_registrations_repo.LiyueRegistrationsRepo
	userMgm                 user_management.DrivenUserMgnt
	hydra                   hydra.Hydra
	infoSystemrepo          info_system.Repo
	user                    user_domain.UseCase
	rolerepo                role.Repo
	business_structure_repo business_structure.Repo
	auth_service_impl       auth_service.AuthServiceInternalV1Interface
	app                     sszd_service.SszdService
	auditProcessBindRepo    audit_process_bind_repo.AuditProcessBindRepo
	workflow                workflow.Workflow
	producer                kafkax.Producer
	wf                      wf_go.WorkflowInterface
	app_register            app_register.UserServiceClient
}

func NewAuditProcessBindUseCase(
	appsRepo app_repo.AppsRepo,
	liyueRegistrationsRepo liyue_registrations_repo.LiyueRegistrationsRepo,
	userMgm user_management.DrivenUserMgnt,
	hydra hydra.Hydra,
	user user_domain.UseCase,
	infoSystemrepo info_system.Repo,
	rolerepo role.Repo,
	business_structure_repo business_structure.Repo,
	auth_service_impl auth_service.AuthServiceInternalV1Interface,
	app sszd_service.SszdService,
	auditProcessBindRepo audit_process_bind_repo.AuditProcessBindRepo,
	workflow workflow.Workflow,
	producer kafkax.Producer,
	wf wf_go.WorkflowInterface,
	app_register app_register.UserServiceClient,
) apps.AppsUseCase {
	useCase := &appsUseCase{
		appsRepo:                appsRepo,
		liyueRegistrationsRepo:  liyueRegistrationsRepo,
		userMgm:                 userMgm,
		hydra:                   hydra,
		user:                    user,
		infoSystemrepo:          infoSystemrepo,
		rolerepo:                rolerepo,
		business_structure_repo: business_structure_repo,
		auth_service_impl:       auth_service_impl,
		app:                     app,
		auditProcessBindRepo:    auditProcessBindRepo,
		workflow:                workflow,
		producer:                producer,
		wf:                      wf,
		app_register:            app_register,
	}
	wf.RegistConusmeHandlers(wf_workflow.AppApplyEscalate, useCase.AppApplyProcessMsgProc,
		useCase.AppApplyAuditResultMsgProc, nil)
	wf.RegistConusmeHandlers(wf_workflow.AppApplyReport, useCase.AppReportProcessMsgProc,
		useCase.AppReportAuditResultMsgProc, nil)
	// useCase.Upgrade(context.Background())

	return useCase
}
func (u appsUseCase) AppsCreate(ctx context.Context, req *apps.CreateReqBody, userInfo *model.User) (*apps.CreateOrUpdateResBody, error) {
	// 1, 如果没有审核流程, 直接调hydra接口,省直达接口,入库
	// 2, 如果有审核流程,走审核流程,入库,状态为审核中,此处需要考虑版本问题
	var (
		bIsAuditNeeded bool
		err            error
		appsRes        *apps.CreateOrUpdateResBody
	)

	// 检查应用授权名称是否重复
	// todo 要检查发布的版本和编辑的版本是否有重名的
	_, err = u.NameRepeat(ctx, &apps.NameRepeatReq{Name: req.Name})
	if err != nil {
		return nil, err
	}

	// 检查应用系统是否存在
	if req.InfoSystem != "" {
		_, err = u.infoSystemrepo.GetByID(ctx, req.InfoSystem)
		if err != nil {
			return nil, err
		}
	}

	// 检查应用账号名称是否重复
	// TODO 检查hydra有没有同名的
	// _, err = u.AccountNameRepeat(ctx, &apps.NameRepeatReq{Name: req.AccountName})
	// if err != nil {
	// 	return nil, err
	// }

	// 查看是否有审核流程
	afs, err := u.auditProcessBindRepo.GetByAuditType(ctx, constant.AppApplyEscalate)
	if err != nil {
		log.WithContext(ctx).Errorf("get demand escalate audit flow bind failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if afs.ProcDefKey != "" {
		res, err := u.workflow.ProcessDefinitionGet(ctx, afs.ProcDefKey)
		if err != nil {
			log.Error("AuditProcessBindCreate ProcessDefinitionGet Error: ", zap.Error(err))
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		} else {
			bIsAuditNeeded = true
		}

		if res.Key != afs.ProcDefKey {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		} else {
			bIsAuditNeeded = true
		}

	}

	if bIsAuditNeeded && req.Mark != apps.MarkCssjj {
		appsRes, err = u.createAppWithAudit(ctx, req, userInfo, afs.ProcDefKey)
		// 后续workflow的处理
		// 1， 审核拒绝：更新数据库状态
		// 2， 审核撤回：更新数据库状态
		// 3， 审核通过：调hydra接口，调省直达接口，更改数据库状态
	} else {
		appsRes, err = u.createAppWithoutAudit(ctx, req, userInfo)
	}

	// 响应
	return appsRes, err
}

func (u appsUseCase) createAppWithoutAudit(ctx context.Context, req *apps.CreateReqBody, userInfo *model.User) (*apps.CreateOrUpdateResBody, error) {
	// 没有审核流程, 直接调hydra接口,省直达接口,入库
	var (
		err              error
		appsModel        *model.Apps
		appsHistoryModel *model.AppsHistory
	)

	var accountID string
	// 如果有，创建hydra中应用账号
	if req.AccountName != "" {
		strPwd, err := util.DecodeRSA(req.Password, util.RSA2048)
		if err != nil {
			return nil, err
		}
		accountID, err = u.hydra.Register(req.AccountName, strPwd)
		if err != nil {
			return nil, err
		}
	}
	// 更新数据库
	appId := uuid.NewString()
	id, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		err = errorcode.Desc(errorcode.PublicUniqueIDError)
		return nil, err
	}
	historyId, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		err = errorcode.Desc(errorcode.PublicUniqueIDError)
		return nil, err
	}

	token := strings.ReplaceAll(uuid.NewString(), "-", "")
	if req.Mark == "" {
		req.Mark = apps.MarkCommon
		token = ""
	}
	appsModel = &model.Apps{
		ID:                     id,
		AppsID:                 appId,
		Mark:                   req.Mark,
		PublishedVersionID:     historyId,
		ReportEditingVersionID: &historyId,
		CreatorUID:             userInfo.ID,
		UpdaterUID:             userInfo.ID,
	}

	bts, _ := json.Marshal(req.IpAddrs)
	appsHistoryModel = &model.AppsHistory{
		ID:                     historyId,
		AppID:                  id,
		Name:                   req.Name,
		PassID:                 req.PassID,
		Token:                  token,
		Description:            &req.Description,
		InfoSystem:             &req.InfoSystem,
		ApplicationDeveloperID: userInfo.ID,
		AppType:                req.AppType,
		IpAddr:                 string(bts),
		IsRegisterGateway:      sql.NullInt32{Int32: apps.NotRegisteGateway, Valid: true},
		AccountID:              accountID,
		AccountName:            req.AccountName,
		AccountPassowrd:        req.Password,
		ProvinceIP:             req.ProvinceIp,
		ProvinceURL:            req.ProvinceUrl,
		ContactName:            req.ContactName,
		ContactPhone:           req.ContactPhone,
		AreaID:                 req.AreaId,
		RangeID:                req.RangeId,
		DepartmentID:           req.DepartmentId,
		OrgCode:                req.OrgCode,
		DeployPlace:            req.DeployPlace,
		UpdaterUID:             userInfo.ID,
	}
	err = u.appsRepo.Create(ctx, appsModel, appsHistoryModel)
	if err != nil {
		// 如果失败需要删除hydra账号
		if req.AccountName != "" {
			errDelete := u.userMgm.DeleteApps(ctx, accountID)
			if errDelete != nil {
				return nil, err
			}
		}
		return nil, err
	}

	//发消息
	if req.AccountName != "" {
		if err = u.user.CreateUser(ctx, appId, req.Name, string(constant.APP)); err != nil {
			log.WithContext(ctx).Error("send app create info error", zap.Error(err))
			return nil, errorcode.Detail(errorcode.UserCreateMessageSendError, err.Error())
		}
		msg, err := json.Marshal(&apps.User{
			ID:       appId,
			Name:     req.Name,
			UserType: string(constant.APP),
		})
		if err != nil {
			return nil, errorcode.Detail(errorcode.UserCreateMessageSendError, err.Error())
		}
		if err = u.producer.Send(kafka_infra.ProtonUserCreateTopic, msg); err != nil {
			return nil, errorcode.Detail(errorcode.UserCreateMessageSendError, err.Error())
		}
	}

	// 响应
	return &apps.CreateOrUpdateResBody{
		ID: appId,
	}, err
}

func (u appsUseCase) createAppWithAudit(ctx context.Context, req *apps.CreateReqBody, userInfo *model.User, procDefKey string) (*apps.CreateOrUpdateResBody, error) {
	// 如果有审核流程
	// 1, 给workflow发审核消息
	// 2, 入库
	var (
		err              error
		appsModel        *model.Apps
		appsHistoryModel *model.AppsHistory
	)

	appId := uuid.NewString()
	id, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		err = errorcode.Desc(errorcode.PublicUniqueIDError)
		return nil, err
	}
	historyId, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		err = errorcode.Desc(errorcode.PublicUniqueIDError)
		return nil, err
	}
	token := strings.ReplaceAll(uuid.NewString(), "-", "")
	if req.Mark == "" {
		req.Mark = apps.MarkCommon
		token = ""
	}
	appsModel = &model.Apps{
		ID:                 id,
		AppsID:             appId,
		Mark:               req.Mark,
		PublishedVersionID: historyId,
		EditingVersionID:   &historyId,
		CreatorUID:         userInfo.ID,
		UpdaterUID:         userInfo.ID,
	}

	bts, _ := json.Marshal(req.IpAddrs)
	appsHistoryModel = &model.AppsHistory{
		ID:                     historyId,
		AppID:                  id,
		Name:                   req.Name,
		PassID:                 req.PassID,
		Token:                  token,
		Description:            &req.Description,
		InfoSystem:             &req.InfoSystem,
		ApplicationDeveloperID: userInfo.ID,
		AppType:                req.AppType,
		IpAddr:                 string(bts),
		IsRegisterGateway:      sql.NullInt32{Int32: apps.NotRegisteGateway, Valid: true},
		AccountName:            req.AccountName,
		AccountPassowrd:        req.Password,
		ProvinceIP:             req.ProvinceIp,
		ProvinceURL:            req.ProvinceUrl,
		ContactName:            req.ContactName,
		ContactPhone:           req.ContactPhone,
		AreaID:                 req.AreaId,
		RangeID:                req.RangeId,
		DepartmentID:           req.DepartmentId,
		OrgCode:                req.OrgCode,
		DeployPlace:            req.DeployPlace,
		UpdaterUID:             userInfo.ID,
	}

	// 发审核消息给workflow
	var auditRecID uint64
	auditRecID, err = utils.GetUniqueID()
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg := &wf_common.AuditApplyMsg{
		Process: wf_common.AuditApplyProcessInfo{
			ApplyID:    GenAuditApplyID(id, auditRecID),
			AuditType:  constant.AppApplyEscalate,
			UserID:     userInfo.ID,
			UserName:   userInfo.Name,
			ProcDefKey: procDefKey,
		},
		Data: map[string]any{
			"id":          appId,
			"title":       req.Name,
			"description": req.Description,
			"submit_time": time.Now().UnixMilli(),
			"type":        "create",
		},
		Workflow: wf_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: wf_common.AuditApplyAbstractInfo{
				Icon: AUDIT_ICON_BASE64,
				Text: "应用名称:" + req.Name,
			},
		},
	}
	if err := u.wf.AuditApply(msg); err != nil {
		log.WithContext(ctx).Error("send app create info error", zap.Error(err))
		return nil, errorcode.Desc(errorcode.UserCreateMessageSendError)
	}

	appsHistoryModel.Status = 1
	appsHistoryModel.AuditID = auditRecID

	// 入库
	err = u.appsRepo.Create(ctx, appsModel, appsHistoryModel)
	if err != nil {
		return nil, err
	}

	// 响应
	return &apps.CreateOrUpdateResBody{ID: appId}, err
	// 后续workflow的处理
	// 1， 审核拒绝：更新数据库状态
	// 2， 审核撤回：更新数据库状态
	// 3， 审核通过：调hydra接口，调省直达接口，更改数据库状态
}

func (u appsUseCase) AppsUpdate(ctx context.Context, req *apps.UpdateReq, userInfo *model.User) (*apps.CreateOrUpdateResBody, error) {
	// 1, 如果没有审核流程, 直接调hydra接口,省直达接口,入库
	// 2, 如果有审核流程,走审核流程,入库,状态为审核中,此处需要考虑版本问题,另外如果需要更新以前的审核流程
	var (
		bIsAuditNeeded bool
		err            error
		appFromDb      *model.AllApp
	)
	// 检查应用授权名称是否重复
	_, err = u.NameRepeat(ctx, &apps.NameRepeatReq{ID: req.Id, Name: req.Name})
	if err != nil {
		return nil, err
	}

	// 检查应用系统是否存在
	if req.InfoSystem != "" {
		_, err = u.infoSystemrepo.GetByID(ctx, req.InfoSystem)
		if err != nil {
			return nil, err
		}
	}

	// 检查应用开发者是否存在
	if req.ApplicationDeveloperId != "" {
		err = u.user.CheckUserExist(ctx, req.ApplicationDeveloperId)
		if err != nil {
			return nil, err
		}
	}

	// 检查角色，如果不是应用开发者，不允许设置
	// var lsApplicationDeveloper bool
	// roleUsers, err := u.rolerepo.GetUserRole(ctx, req.ApplicationDeveloperId)
	// if err != nil {
	// 	log.WithContext(ctx).Error("GetUserListCanAddToRole GetRoleUsers ", zap.Error(err))
	// 	return nil, errorcode.Desc(errorcode.RoleDatabaseError)
	// }
	// for _, roleUser := range roleUsers {
	// 	fmt.Println(roleUser.RoleID)
	// 	if roleUser.RoleID == access_control.ApplicationDeveloper {
	// 		lsApplicationDeveloper = true
	// 		break
	// 	}
	// }
	// if !lsApplicationDeveloper {
	// 	return nil, errorcode.Desc(errorcode.UeserNotApplicationDeveloperRole)
	// }

	// 数据库中获取信息,检查是否存在
	appFromDb, err = u.appsRepo.GetAppByAppsId(ctx, req.Id, "published")
	if err != nil {
		return nil, err
	}

	// 查看是否有审核流程
	afs, err := u.auditProcessBindRepo.GetByAuditType(ctx, constant.AppApplyEscalate)
	if err != nil {
		log.WithContext(ctx).Errorf("get demand escalate audit flow bind failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	if afs.ProcDefKey != "" {
		res, err := u.workflow.ProcessDefinitionGet(ctx, afs.ProcDefKey)
		if err != nil {
			log.Error("AuditProcessBindCreate ProcessDefinitionGet Error: ", zap.Error(err))
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		} else {
			bIsAuditNeeded = true
		}

		if res.Key != afs.ProcDefKey {
			return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
		} else {
			bIsAuditNeeded = true
		}

	}

	if bIsAuditNeeded && appFromDb.Mark != apps.MarkCssjj {
		err = u.updateAppWithAudit(ctx, req, userInfo, afs.ProcDefKey, appFromDb)
		if err != nil {
			return nil, err
		}
		// 后续workflow的处理
		// 1， 审核拒绝：更新数据库状态
		// 2， 审核撤回：更新数据库状态
		// 3， 审核通过：调hydra接口，调省直达接口，更改数据库状态

	} else {
		// 更新
		err = u.updateAppsWithoutAudit(ctx, req, userInfo, appFromDb)
		if err != nil {
			return nil, err
		}

	}

	return &apps.CreateOrUpdateResBody{ID: req.Id}, err
}

func (u appsUseCase) updateAppWithAudit(ctx context.Context, req *apps.UpdateReq, userInfo *model.User, procDefKey string, appFromDb *model.AllApp) error {
	// 有审核流程
	// 1, 给workflow发审核消息，如果上一个编辑版本处于审核状态，撤回上一个版本，再发审核消息
	// 2, 入库，创建版本信息，更新指向
	var (
		err error
	)

	historyId, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		err = errorcode.Desc(errorcode.PublicUniqueIDError)
		return err
	}
	// 如果编辑的版本和发布的版本相等，说明未发布成功过
	var publishedVersionID uint64 = appFromDb.PublishedVersionID
	if appFromDb.Apps.EditingVersionID != nil && appFromDb.Apps.PublishedVersionID == *appFromDb.Apps.EditingVersionID {
		publishedVersionID = historyId

	}

	appFromDb.PublishedVersionID = publishedVersionID
	appFromDb.EditingVersionID = &historyId
	appFromDb.Apps.UpdaterUID = userInfo.ID

	var password string = req.Password
	if req.Password == "" {
		password = appFromDb.AppsHistory.AccountPassowrd
	}
	appFromDb.AppsHistory.ID = historyId
	appFromDb.AppsHistory.Name = req.Name
	appFromDb.AppsHistory.Description = &req.Description
	appFromDb.AppsHistory.InfoSystem = &req.InfoSystem
	appFromDb.AppsHistory.ApplicationDeveloperID = req.ApplicationDeveloperId
	appFromDb.AppsHistory.AccountName = req.AccountName
	appFromDb.AppsHistory.AccountPassowrd = password
	appFromDb.AppsHistory.ProvinceIP = req.ProvinceIp
	appFromDb.AppsHistory.ProvinceURL = req.ProvinceUrl
	appFromDb.AppsHistory.ContactName = req.ContactName
	appFromDb.AppsHistory.ContactPhone = req.ContactPhone
	appFromDb.AppsHistory.AreaID = req.AreaId
	appFromDb.AppsHistory.RangeID = req.RangeId
	appFromDb.AppsHistory.DepartmentID = req.DepartmentId
	appFromDb.AppsHistory.OrgCode = req.OrgCode
	appFromDb.AppsHistory.DeployPlace = req.DeployPlace
	appFromDb.AppsHistory.UpdaterUID = userInfo.ID

	// workflow操作
	// 查询当前编辑版本是否处于上报审核中，如果是，取消审核, 自动发审核消息
	if appFromDb.EditingVersionID != nil {
		appEdingFromDb, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "editing")
		if err != nil {
			return err
		}
		if appEdingFromDb.Status == 1 {
			if appEdingFromDb.AuditID > 0 {
				msg := &wf_common.AuditCancelMsg{
					ApplyIDs: []string{GenAuditApplyID(appEdingFromDb.Apps.ID, appEdingFromDb.AuditID)},
					Cause: struct {
						ZHCN string "json:\"zh-cn\""
						ZHTW string "json:\"zh-tw\""
						ENUS string "json:\"en-us\""
					}{
						ZHCN: "revocation",
						ZHTW: "revocation",
						ENUS: "revocation",
					}}
				if err := u.wf.AuditCancel(msg); err != nil {
					log.WithContext(ctx).Error("send app create info error", zap.Error(err))
					return errorcode.Desc(errorcode.UserCreateMessageSendError)
				}
			}
		}
	}
	// 发审核消息给workflow
	var auditRecID uint64
	auditRecID, err = utils.GetUniqueID()
	if err != nil {
		return errorcode.Detail(errorcode.PublicInternalError, err)
	}
	msg := &wf_common.AuditApplyMsg{
		Process: wf_common.AuditApplyProcessInfo{
			ApplyID:    GenAuditApplyID(appFromDb.Apps.ID, auditRecID),
			AuditType:  constant.AppApplyEscalate,
			UserID:     userInfo.ID,
			UserName:   userInfo.Name,
			ProcDefKey: procDefKey,
		},
		Data: map[string]any{
			"id":          appFromDb.Apps.AppsID,
			"title":       req.Name,
			"description": req.Description,
			"submit_time": time.Now().UnixMilli(),
			"type":        "update",
		},
		Workflow: wf_common.AuditApplyWorkflowInfo{
			TopCsf: 5,
			AbstractInfo: wf_common.AuditApplyAbstractInfo{
				Icon: AUDIT_ICON_BASE64,
				Text: "应用名称:" + req.Name,
			},
		},
	}

	if err := u.wf.AuditApply(msg); err != nil {
		log.WithContext(ctx).Error("send app create info error", zap.Error(err))
		return errorcode.Desc(errorcode.UserCreateMessageSendError)
	}
	appFromDb.AppsHistory.Status = 1
	appFromDb.AppsHistory.AuditID = auditRecID

	// 入库
	err = u.appsRepo.UpdateEditingApp(ctx, appFromDb.AppsID, &appFromDb.Apps, &appFromDb.AppsHistory)
	if err != nil {
		return err
	}
	// 后续workflow的处理
	// 1， 审核拒绝：更新数据库状态
	// 2， 审核撤回：更新数据库状态
	// 3， 审核通过：调hydra接口，调省直达接口，更改数据库状态

	return err
}

func (u appsUseCase) updateAppsWithoutAudit(ctx context.Context, req *apps.UpdateReq, userInfo *model.User, appFromDb *model.AllApp) error {
	var (
		err            error
		bIsAuditNeeded bool
	)
	accountID := appFromDb.AccountID
	// 更新proton中应用账号
	// 此处暂不考虑更新中创建的情况
	if req.AccountName != "" {
		if appFromDb.AccountID != "" {
			// 更新
			if appFromDb.AccountName != req.AccountName || req.Password != "" {
				var strPwd string
				if req.Password != "" {
					strPwd, err = util.DecodeRSA(req.Password, util.RSA2048)
					if err != nil {
						return err
					}
				}
				err = u.hydra.Update(accountID, req.AccountName, strPwd)
				if err != nil {
					return err
				}
				appFromDb.AccountName = req.AccountName
				if req.Password != "" {
					appFromDb.AccountPassowrd = req.Password
				}
			}
		} else {
			// 创建
			strPwd, err := util.DecodeRSA(req.Password, util.RSA2048)
			if err != nil {
				return err
			}
			accountID, err = u.hydra.Register(req.AccountName, strPwd)
			if err != nil {
				return err
			}
			appFromDb.AccountID = accountID
			appFromDb.AccountName = req.AccountName
			appFromDb.AccountPassowrd = req.Password
		}
	}
	bts, _ := json.Marshal(req.IpAddrs)
	appFromDb.Apps.UpdaterUID = userInfo.ID
	appFromDb.PassID = req.PassID
	appFromDb.Token = req.Token
	appFromDb.AppsHistory.Name = req.Name
	appFromDb.Description = &req.Description
	appFromDb.InfoSystem = &req.InfoSystem
	appFromDb.ApplicationDeveloperID = req.ApplicationDeveloperId
	appFromDb.AppType = req.AppType
	appFromDb.IpAddr = string(bts)
	appFromDb.AppsHistory.UpdaterUID = userInfo.ID

	// 先获取省直达信息，比较要不要修改
	// 如果要修改 ,调省直达接口，再入库
	// if req.ProvinceIp == appFromDb.ProvinceIp && req.ProvinceUrl == appFromDb.ProvinceUrl &&
	// 	req.ContactName == appFromDb.ContactName && req.ContactPhone == appFromDb.ContactPhone &&
	// 	req.AreaId == int(appFromDb.AreaId) && req.RangeId == int(appFromDb.RangeId) &&
	// 	req.OrgCode == appFromDb.OrgCode && req.OrgId == appFromDb.OrgId && req.DeployPlace == appFromDb.DeployPlace &&
	// 	req.Name == appFromDb.Name && req.Description == appFromDb.Description {
	// 	return nil
	// }
	if req.ProvinceUrl == "" {
		err = u.appsRepo.UpdateApp(ctx, req.Id, &appFromDb.Apps, &appFromDb.AppsHistory)
		if err != nil {
			return err
		}
	} else {
		newId, err := utils.GetUniqueID()
		if err != nil {
			log.Errorf("failed to general unique id, err: %v", err)
			err = errorcode.Desc(errorcode.PublicUniqueIDError)
			return err
		}
		appFromDb.Apps.PublishedVersionID = newId
		appFromDb.Apps.ReportEditingVersionID = &newId
		bts, _ := json.Marshal(req.IpAddrs)
		appsHistoryModel := &model.AppsHistory{
			ID:                     newId,
			AppID:                  appFromDb.AppsHistory.AppID,
			PassID:                 req.PassID,
			Token:                  req.Token,
			Name:                   req.Name,
			Description:            &req.Description,
			InfoSystem:             &req.InfoSystem,
			ApplicationDeveloperID: appFromDb.AppsHistory.ApplicationDeveloperID,
			AppType:                req.AppType,
			IpAddr:                 string(bts),
			IsRegisterGateway:      appFromDb.AppsHistory.IsRegisterGateway,
			AccountID:              accountID,
			AccountName:            req.AccountName,
			AccountPassowrd:        req.Password,
			ProvinceAppID:          appFromDb.AppsHistory.ProvinceAppID,
			AccessKey:              appFromDb.AppsHistory.AccessKey,
			AccessSecret:           appFromDb.AppsHistory.AccessSecret,
			ProvinceIP:             req.ProvinceIp,
			ProvinceURL:            req.ProvinceUrl,
			ContactName:            req.ContactName,
			ContactPhone:           req.ContactPhone,
			AreaID:                 req.AreaId,
			RangeID:                req.RangeId,
			DepartmentID:           req.DepartmentId,
			OrgCode:                req.OrgCode,
			DeployPlace:            req.DeployPlace,
			ProvinceID:             appFromDb.AppsHistory.ProvinceID,
			UpdaterUID:             userInfo.ID,
		}
		// 查看是否有上报审核流程, 如果有，查询当前应用是否处于待上报状态，如果是，取消其待上报，再自动上报当前版本
		afs, err := u.auditProcessBindRepo.GetByAuditType(ctx, constant.AppApplyReport)
		if err != nil {
			log.WithContext(ctx).Errorf("get app escalate audit flow bind failed: %v", err)
			return errorcode.Detail(errorcode.PublicDatabaseError, err)
		}
		if afs.ProcDefKey != "" {
			res, err := u.workflow.ProcessDefinitionGet(ctx, afs.ProcDefKey)
			if err != nil {
				log.Error("AuditProcessBindCreate ProcessDefinitionGet Error: ", zap.Error(err))
				return errorcode.Detail(errorcode.PublicDatabaseError, err)
			} else {
				bIsAuditNeeded = true
			}
			if res.Key != afs.ProcDefKey {
				return errorcode.Detail(errorcode.PublicDatabaseError, err)
			} else {
				bIsAuditNeeded = true
			}
		}
		if bIsAuditNeeded {
			// 查询当前编辑版本是否处在上报审核中，如果是，取消审核,
			if appFromDb.Apps.ReportEditingVersionID != nil {
				appEdingFromDb, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "to_report")
				if err != nil {
					return err
				}
				if appEdingFromDb.ReportAuditStatus == 1 {
					if appEdingFromDb.ReportAuditID > 0 {
						msg := &wf_common.AuditCancelMsg{
							ApplyIDs: []string{GenAuditApplyID(appEdingFromDb.Apps.ID, appEdingFromDb.ReportAuditID)},
							Cause: struct {
								ZHCN string "json:\"zh-cn\""
								ZHTW string "json:\"zh-tw\""
								ENUS string "json:\"en-us\""
							}{
								ZHCN: "revocation",
								ZHTW: "revocation",
								ENUS: "revocation",
							}}

						if err := u.wf.AuditCancel(msg); err != nil {
							log.WithContext(ctx).Error("send app create info error", zap.Error(err))
							return errorcode.Desc(errorcode.UserCreateMessageSendError)
						}

						// 重新发起审核
						var auditRecID uint64
						auditRecID, err = utils.GetUniqueID()
						if err != nil {
							return errorcode.Detail(errorcode.PublicInternalError, err)
						}
						msg2 := &wf_common.AuditApplyMsg{
							Process: wf_common.AuditApplyProcessInfo{
								ApplyID:    GenAuditApplyID(appFromDb.Apps.ID, auditRecID),
								AuditType:  constant.AppApplyReport,
								UserID:     userInfo.ID,
								UserName:   userInfo.Name,
								ProcDefKey: afs.ProcDefKey,
							},
							Data: map[string]any{
								"id":          appFromDb.Apps.AppsID,
								"title":       appsHistoryModel.Name,
								"description": appsHistoryModel.Description,
								"submit_time": time.Now().UnixMilli(),
								"type":        "report",
							},
							Workflow: wf_common.AuditApplyWorkflowInfo{
								TopCsf: 5,
								AbstractInfo: wf_common.AuditApplyAbstractInfo{
									Icon: AUDIT_ICON_BASE64,
									Text: "应用名称:" + appsHistoryModel.Name,
								},
							},
						}

						if err := u.wf.AuditApply(msg2); err != nil {
							log.WithContext(ctx).Error("send app create info error", zap.Error(err))
							return errorcode.Desc(errorcode.UserCreateMessageSendError)
						}
						appsHistoryModel.ReportAuditID = auditRecID
						appsHistoryModel.ReportAuditStatus = 1
					}
				}
			}
		}

		err = u.appsRepo.UpdateEditingApp(ctx, req.Id, &appFromDb.Apps, appsHistoryModel)
		if err != nil {
			return err
		}
	}

	//发消息
	if err = u.user.UpdateUserName(ctx, req.Id, req.Name); err != nil {
		log.WithContext(ctx).Error("send discard role info error", zap.Error(err))
		return errorcode.Detail(errorcode.UserUpdateMessageSendError, err.Error())
	}
	msg, err := json.Marshal(&apps.User{
		ID:      req.Id,
		NewName: req.Name,
		Type:    "user",
	})
	if err != nil {
		return errorcode.Detail(errorcode.UserUpdateMessageSendError, err.Error())
	}
	if err = u.producer.Send(kafka_infra.ProtonNameModifyTopic, msg); err != nil {
		return errorcode.Detail(errorcode.UserUpdateMessageSendError, err.Error())
	}

	return err
}

func (u appsUseCase) AppsDelete(ctx context.Context, req *apps.DeleteReq) error {
	// 删除需要的操作：
	// 1, 检查授权是否存在
	// 2, 检查是否能删除，如果本地流程和上报流程都在审核中，上报已经成功，都不可以删除
	// 3, 删除hydra账号，再删除数据库
	// 4, 发消息

	// 根据Id获取数据库中的Apps
	app, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "published")
	if err != nil {
		return err
	}

	// 如果当前版本上报已经成功，不可以删除
	if app.ReportStatus == 1 {
		return errorcode.Desc(errorcode.ProvinceAppCantNotDdelete)
	}
	// 查看当前是否有编辑版本处于审核中，有就不能删除
	if app.EditingVersionID != nil && *app.EditingVersionID != 0 {
		appEditing, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "editing")
		if err != nil {
			return err
		}
		if appEditing.Status == 1 {
			return errorcode.Desc(errorcode.AppApplyCantNotDdelete)
		}
	}
	// 查看当前是否有上报版本处于审核中，有就不能删除
	if app.ReportEditingVersionID != nil && *app.ReportEditingVersionID != 0 {
		appReporting, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "to_report")
		if err != nil {
			return err
		}
		if appReporting.ReportAuditStatus == 1 {
			return errorcode.Desc(errorcode.AppReportCantNotDdelete)
		}
	}

	// 如果有hydra账号，先删除hydra账号，再删数据库
	if app.AccountID != "" {
		err = u.hydra.Delete(app.AccountID)
		if err != nil {
			return err
		}
	}
	err = u.appsRepo.Delete(ctx, app.Apps.ID)
	if err != nil {
		return err
	}

	// 发消息
	if err = u.user.DeleteUser(ctx, req.Id); err != nil {
		log.WithContext(ctx).Error("send discard role info error", zap.Error(err))
		return errorcode.Detail(errorcode.UserDeleteMessageSendError, err.Error())
	}
	msg, err := json.Marshal(&struct {
		ID string `json:"id"`
	}{ID: req.Id})
	if err != nil {
		return errorcode.Detail(errorcode.UserDeleteMessageSendError, err.Error())
	}
	if err = u.producer.Send(kafka_infra.ProtonDeleteUserFormTopic, msg); err != nil {
		return errorcode.Detail(errorcode.UserDeleteMessageSendError, err.Error())
	}

	return nil
}

func (u appsUseCase) AppsList(ctx context.Context, req *apps.ListReqQuery, userInfo *model.User) (*apps.ListRes, error) {
	var (
		appIds          []string
		subjects        []v1.Subject
		info_system_ids []string
		canDelete       bool
		status          string
	)
	statusMap := make(map[string]int32)
	rejectReasonMap := make(map[string]string)
	infoSystemNameMap := make(map[string]string)
	var hasResourceMap = make(map[string]bool)

	// 获取数据库中应用开发者的所有Apps
	appses, count, err := u.appsRepo.ListApps(ctx, req, userInfo.ID)
	if err != nil {
		return nil, err
	}
	for _, appsTemp := range appses {
		appIds = append(appIds, appsTemp.Apps.AppsID)
		subjects = append(subjects, v1.Subject{ID: appsTemp.AppsID, Type: v1.SubjectType(v1.SubjectAPP)})
		info_system_ids = append(info_system_ids, *appsTemp.InfoSystem)
	}

	// 获取状态
	if len(appIds) > 0 {
		editingAppses, err := u.appsRepo.GetAppsByAppsIds(ctx, appIds, "editing")
		if err != nil {
			return nil, err
		}
		for _, editingApps := range editingAppses {
			statusMap[editingApps.Apps.AppsID] = editingApps.Status
			rejectReasonMap[editingApps.Apps.AppsID] = editingApps.RejectReason
		}
	}

	// 获取信息系统（批量）
	if len(info_system_ids) > 0 {
		batchs, err := u.infoSystemrepo.GetByIDs(ctx, info_system_ids)
		if err != nil {
			log.WithContext(ctx).Error("ConfigurationCenter error" + err.Error())
		}
		for _, batch := range batchs {
			infoSystemNameMap[batch.ID] = batch.Name
		}
	}
	// 查询应用是否有资源（批量）
	hasResourcreq := &v1.PolicyListOptions{
		Subjects: subjects,
	}
	results, err := u.auth_service_impl.ListPolicies(ctx, hasResourcreq)
	if err != nil {
		return nil, err
	}
	for _, result := range results {
		hasResourceMap[result.Subject.ID] = true
	}

	// 响应
	entries := []*apps.AppsList{}
	for _, appsTemp := range appses {
		var applicationDeveloper string
		if appsTemp.ApplicationDeveloperID != "" {
			applicationDeveloper = u.user.GetUserNameNoErr(ctx, appsTemp.ApplicationDeveloperID)
		}

		// todo  状态
		if statusTemp, ok := statusMap[appsTemp.Apps.AppsID]; ok {
			status = "normal"
			if statusTemp == 1 {
				status = "auditing"
			}
			if statusTemp == 2 {
				status = "audit_rejected"
			}
			if statusTemp == 3 && appsTemp.Status != 4 {
				status = "audit_cancel"
			}
		} else {
			status = "normal"
		}

		// 创建审核中, 上报审核中,上报成功不可以删除
		canDelete = true
		if status == "auditing" || appsTemp.ReportAuditStatus == 1 || appsTemp.ProvinceAppID != "" {
			canDelete = false
		}
		entries = append(entries, &apps.AppsList{
			ID:                       appsTemp.Apps.AppsID,
			Name:                     appsTemp.Name,
			Description:              *appsTemp.Description,
			InfoSystemName:           infoSystemNameMap[*appsTemp.InfoSystem],
			ApplicationDeveloperName: applicationDeveloper,
			AccountID:                appsTemp.AccountID,
			AccountName:              appsTemp.AccountName,
			HasResources:             hasResourceMap[appsTemp.AppsID],
			AppId:                    appsTemp.ProvinceAppID,
			AccessKey:                appsTemp.AccessKey,
			AccessSecret:             appsTemp.AccessSecret,
			CanDelete:                canDelete,
			Status:                   status,
			RejectedReason:           rejectReasonMap[appsTemp.Apps.AppsID],
			CreatedAt:                appsTemp.CreatedAt.UnixMilli(),
			CreatedName:              u.user.GetUserNameNoErr(ctx, appsTemp.CreatorUID),
			UpdatedAt:                appsTemp.Apps.UpdatedAt.UnixMilli(),
			UpdatedName:              u.user.GetUserNameNoErr(ctx, appsTemp.Apps.UpdaterUID),
		})
	}

	res := &apps.ListRes{
		PageResults: response.PageResults[apps.AppsList]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u appsUseCase) AppById(ctx context.Context, req *apps.AppsID, version string) (*apps.Apps, error) {
	// 根据version获取信息
	var (
		err             error
		provinceAppInfo *apps.ProvinceAppResp
		appsTemp        *model.AllApp
	)
	if version == "" {
		version = "published"
	}
	// 根据Id获取数据库中的Apps
	appsTemp, err = u.appsRepo.GetAppByAppsId(ctx, req.Id, version)
	if err != nil {
		return nil, err
	}

	// 如果编辑的版本没有数据，则获取发布版本的数据
	if version == "editing" && (appsTemp.EditingVersionID == nil || (appsTemp.EditingVersionID != nil && *appsTemp.EditingVersionID == 0)) {
		appsTemp, err = u.appsRepo.GetAppByAppsId(ctx, req.Id, "published")
		if err != nil {
			return nil, err
		}
	}

	// 获取应用是否有资源
	var hasResources bool
	hasResourcreq := &v1.PolicyListOptions{
		Subjects: []v1.Subject{{ID: appsTemp.AppsID, Type: v1.SubjectType(v1.SubjectAPP)}},
	}
	results, err := u.auth_service_impl.ListPolicies(ctx, hasResourcreq)
	if err != nil {
		return nil, err
	}
	if len(results) > 0 {
		hasResources = true
	}

	// 获取信息系统
	var infoSystemName string
	if appsTemp.InfoSystem != nil {
		batch, err := u.infoSystemrepo.GetByID(ctx, *appsTemp.InfoSystem)
		if err != nil {
			log.WithContext(ctx).Error("ConfigurationCenter error" + err.Error())
		} else {
			infoSystemName = batch.Name
		}
	}

	// 如果省注册信息存在，就获取
	if appsTemp.ProvinceIP != "" {
		// 获取部门信息
		var orgName string
		var departmentIds []string = []string{appsTemp.DepartmentID}
		object, _ := u.business_structure_repo.GetObjectsByIDs(ctx, departmentIds)
		if len(object) != 0 {
			orgName = object[0].Name
		}
		provinceAppInfo = &apps.ProvinceAppResp{
			AppId:        appsTemp.ProvinceAppID,
			AccessKey:    appsTemp.AccessKey,
			AccessSecret: appsTemp.AccessSecret,
			ProvinceIp:   appsTemp.ProvinceIP,
			ProvinceUrl:  appsTemp.ProvinceURL,
			ContactName:  appsTemp.ContactName,
			ContactPhone: appsTemp.ContactPhone,
			AreaInfo:     &apps.KV{ID: appsTemp.AreaID, Value: enum.Get[constant.AreaName](appsTemp.AreaID).Display},
			RangeInfo:    &apps.KV{ID: appsTemp.RangeID, Value: enum.Get[constant.RangeName](appsTemp.RangeID).Display},
			OrgInfo:      &apps.OrgInfo{OrgCode: appsTemp.OrgCode, DepartmentId: appsTemp.DepartmentID, DepartmentName: orgName},
			DeployPlace:  appsTemp.DeployPlace,
		}
	}
	// 解析ip配置
	content := make([]*apps.IpAddr, 0)
	if appsTemp.IpAddr != "" {
		if err := json.Unmarshal([]byte(appsTemp.IpAddr), &content); err != nil {
			return nil, err
		}
	}
	// 获取责任人
	registrations, err := u.liyueRegistrationsRepo.GetLiyueRegistrations(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	responsiblers := make([]*apps.Responsibler, 0)
	for _, registration := range registrations {
		responsiblers = append(responsiblers, &apps.Responsibler{
			ID:   registration.UserID,
			Name: registration.UserName,
		})
	}

	res := &apps.Apps{
		ID:                   appsTemp.Apps.AppsID,
		Name:                 appsTemp.Name,
		PassID:               appsTemp.PassID,
		Token:                appsTemp.Token,
		Description:          *appsTemp.Description,
		InfoSystem:           &apps.InfoSystem{ID: *appsTemp.InfoSystem, Name: infoSystemName},
		ApplicationDeveloper: &apps.UserInfoResp{UID: appsTemp.ApplicationDeveloperID, UserName: u.user.GetUserNameNoErr(ctx, appsTemp.ApplicationDeveloperID)},
		AppType:              appsTemp.AppType,
		Responsiblers:        responsiblers,
		IpAddrs:              content,
		AccountName:          appsTemp.AccountName,
		AccountID:            appsTemp.AccountID,
		HasResources:         hasResources,
		ProvinceAppInfo:      provinceAppInfo,
		CreatedAt:            appsTemp.CreatedAt.UnixMilli(),
		CreatedName:          u.user.GetUserNameNoErr(ctx, appsTemp.CreatorUID),
		UpdatedAt:            appsTemp.Apps.UpdatedAt.UnixMilli(),
		UpdatedName:          u.user.GetUserNameNoErr(ctx, appsTemp.Apps.UpdaterUID),
	}
	return res, nil
}

func (u appsUseCase) AppsAllListBrief(ctx context.Context) ([]*apps.AppsAllListBrief, error) {
	appses, err := u.appsRepo.GetAllApps(ctx)
	if err != nil {
		return nil, err
	}

	// var info_system_ids []string
	// for _, appsTemp := range appses {
	// 	// appsids = append(appsids, appsTemp.AppsId)
	// 	info_system_ids = append(info_system_ids, *appsTemp.InfoSystem)
	// }

	// 获取信息系统（批量）
	// infoSystemNameMap := make(map[string]string)
	// if len(info_system_ids) > 0 {
	// 	batchs, err := u.infoSystemrepo.GetByIDs(ctx, info_system_ids)
	// 	if err != nil {
	// 		log.WithContext(ctx).Error("ConfigurationCenter error" + err.Error())
	// 	}
	// 	for _, batch := range batchs {
	// 		infoSystemNameMap[batch.ID] = batch.Name
	// 	}
	// }

	entries := []*apps.AppsAllListBrief{}
	for _, appsTemp := range appses {
		// 从proton获取应用账号, 如果应用账号不存在，就跳过
		// accountId := appsTemp.AccountID
		// if accountId != "" {
		// 	_, err := u.userMgm.GetAppInfo(ctx, accountId)
		// 	if err != nil {
		// 		res := new(errorcode.ErrorCodeFullInfo)
		// 		if ierr := jsoniter.Unmarshal([]byte(err.Error()), res); ierr != nil {
		// 			log.Error("400 error jsoniter.Unmarshal", zap.Error(err))
		// 			return nil, ierr
		// 		}
		// 		// 如果Proton删除账号，授权信息置空
		// 		if res.Code == 404019001 {
		// 			continue
		// 		} else {
		// 			return nil, err
		// 		}
		// 	}
		// }

		entries = append(entries, &apps.AppsAllListBrief{
			ID:          appsTemp.Apps.AppsID,
			Name:        appsTemp.Name,
			Description: *appsTemp.Description,
			// InfoSystemName:           infoSystemNameMap[*appsTemp.InfoSystem],
			// ApplicationDeveloperName: u.user.GetUserNameNoErr(ctx, appsTemp.ApplicationDeveloperID),
		})
	}

	return entries, nil
}

func (u appsUseCase) NameRepeat(ctx context.Context, req *apps.NameRepeatReq) (bool, error) {
	err := u.appsRepo.CheckNameRepeatWithId(ctx, req.Name, req.ID)
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			err = u.appsRepo.CheckEditingNameRepeatWithId(ctx, req.Name, req.ID)
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

func (u appsUseCase) AppByAccountId(ctx context.Context, req *apps.AppsID) (*apps.Apps, error) {
	// 获取数据库中所有Apps
	appsTemp, err := u.appsRepo.GetAppsByAccountId(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	res := &apps.Apps{
		ID:   appsTemp.AppsID,
		Name: appsTemp.Name,
		// Description: *appsTemp.Description,
		// CreatedAt:   appsTemp.CreatedAt.UnixMilli(),
		// CreatedName: u.user.GetUserNameNoErr(ctx, appsTemp.CreatorUID),
		// UpdatedAt:   appsTemp.UpdatedAt.UnixMilli(),
		// UpdatedName: u.user.GetUserNameNoErr(ctx, appsTemp.UpdaterUID),
	}

	return res, nil
}

func (u appsUseCase) AppByApplicationDeveloperId(ctx context.Context, req *apps.AppsID) ([]*apps.AppsAllListBrief, error) {
	appses, err := u.appsRepo.GetAppsByApplicationDeveloperId(ctx, req.Id)
	if err != nil {
		return nil, err
	}

	// var info_system_ids []string
	// for _, appsTemp := range appses {
	// 	// appsids = append(appsids, appsTemp.AppsID)
	// 	info_system_ids = append(info_system_ids, *appsTemp.InfoSystem)
	// }

	// 获取信息系统（批量）
	// infoSystemNameMap := make(map[string]string)
	// if len(info_system_ids) > 0 {
	// 	batchs, err := u.infoSystemrepo.GetByIDs(ctx, info_system_ids)
	// 	if err != nil {
	// 		log.WithContext(ctx).Error("ConfigurationCenter error" + err.Error())
	// 	}
	// 	for _, batch := range batchs {
	// 		infoSystemNameMap[batch.ID] = batch.Name
	// 	}
	// }

	entries := []*apps.AppsAllListBrief{}
	for _, appsTemp := range appses {
		// 从proton获取应用账号, 如果应用账号不存在，就跳过
		// accountId := appsTemp.AccountID
		// if accountId != "" {
		// 	_, err := u.userMgm.GetAppInfo(ctx, accountId)
		// 	if err != nil {
		// 		res := new(errorcode.ErrorCodeFullInfo)
		// 		if ierr := jsoniter.Unmarshal([]byte(err.Error()), res); ierr != nil {
		// 			log.Error("400 error jsoniter.Unmarshal", zap.Error(err))
		// 			return nil, ierr
		// 		}
		// 		// 如果Proton删除账号，授权信息置空
		// 		if res.Code == 404019001 {
		// 			continue
		// 		} else {
		// 			return nil, err
		// 		}
		// 	}
		// }

		entries = append(entries, &apps.AppsAllListBrief{
			ID:          appsTemp.AppsID,
			Name:        appsTemp.Name,
			Description: *appsTemp.Description,
			// InfoSystemName:           infoSystemNameMap[*appsTemp.InfoSystem],
			// ApplicationDeveloperName: u.user.GetUserNameNoErr(ctx, appsTemp.ApplicationDeveloperID),
		})
	}
	return entries, nil
}

func (u appsUseCase) GetAuditList(ctx context.Context, req *apps.AuditListGetReq) (*apps.AuditListResp, error) {
	var (
		err    error
		audits *workflow.AuditResponse
		// cids        []uint64
		// cid2idxsMap map[uint64][]int
		// idxs        []int
		// isExisted   bool
	)

	audits, err = u.workflow.GetList(ctx, workflow.WorkflowListType(req.Target), []string{constant.AppApplyEscalate}, req.Offset, req.Limit)
	if err != nil {
		log.WithContext(ctx).Errorf("uc.workflow.GetList failed: %v", err)
		return nil, errorcode.Detail(errorcode.PublicInternalError, err)
	}
	// cids = make([]uint64, 0, len(audits.Entries))
	// cid2idxsMap = make(map[uint64][]int)
	resp := &apps.AuditListResp{}
	resp.TotalCount = int64(audits.TotalCount)
	resp.Entries = make([]*apps.AuditListItem, 0, len(audits.Entries))
	for i := range audits.Entries {
		respa := apps.Data{}
		a := audits.Entries[i].ApplyDetail.Data
		if err = json.Unmarshal([]byte(a), &respa); err != nil {
			return nil, err
		}
		resp.Entries = append(resp.Entries,
			&apps.AuditListItem{
				ApplyTime:   audits.Entries[i].ApplyTime,
				Applyer:     audits.Entries[i].ApplyUserName,
				ProcInstID:  audits.Entries[i].ID,
				TaskID:      audits.Entries[i].ProcInstID,
				Name:        respa.Title,
				ReportType:  respa.Type,
				AuditStatus: audits.Entries[i].AuditStatus,
				AuditTime:   audits.Entries[i].EndTime,
			},
		)
		// resp.Entries[i].ID, _, err = ParseAuditApplyID(audits.Entries[i].ApplyDetail.Process.ApplyID)
		resp.Entries[i].ID = respa.Id
		if err != nil {
			log.WithContext(ctx).Errorf("common.ParseAuditApplyID failed: %v", err)
			return nil, errorcode.Detail(errorcode.PublicInternalError, err)
		}

		// if idxs, isExisted = cid2idxsMap[resp.Entries[i].ID]; !isExisted {
		// 	idxs = make([]int, 0)
		// 	cids = append(cids, resp.Entries[i].ID)
		// }
		// idxs = append(idxs, i)
		// cid2idxsMap[resp.Entries[i].ID] = idxs
	}
	return resp, nil
}

func (u appsUseCase) Cancel(ctx context.Context, req *apps.DeleteReq) error {
	appFromDb, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "published")
	if err != nil {
		return err
	}
	// 查询当前编辑版本是否处在审核中，如果是，取消审核,
	// 数据库更改状态
	if appFromDb.EditingVersionID != nil {
		appEdingFromDb, err := u.appsRepo.GetAppByAppsId(ctx, req.Id, "editing")
		if err != nil {
			return err
		}
		if appEdingFromDb.Status == 1 {
			if appEdingFromDb.AuditID > 0 {
				msg := &wf_common.AuditCancelMsg{
					ApplyIDs: []string{GenAuditApplyID(appEdingFromDb.Apps.ID, appEdingFromDb.AuditID)},
					Cause: struct {
						ZHCN string "json:\"zh-cn\""
						ZHTW string "json:\"zh-tw\""
						ENUS string "json:\"en-us\""
					}{
						ZHCN: "revocation",
						ZHTW: "revocation",
						ENUS: "revocation",
					}}

				if err := u.wf.AuditCancel(msg); err != nil {
					log.WithContext(ctx).Error("send app create info error", zap.Error(err))
					return errorcode.Desc(errorcode.UserCreateMessageSendError)
				}
				appFromDb.EditingVersionID = &zero
				appFromDb.Status = 3
				err = u.appsRepo.UpdateApp(ctx, appFromDb.AppsID, &appFromDb.Apps, &appFromDb.AppsHistory)
				if err != nil {
					return err
				}
				// todo删除编辑版本
			}
		}
	}
	return nil
}

func GenAuditApplyID(demandID uint64, auditRecID uint64) string {
	return fmt.Sprintf("%d-%d", demandID, auditRecID)
}

func (u appsUseCase) Upgrade(ctx context.Context) error {
	// 升级使用
	var (
		err              error
		appsModel        *model.Apps
		appsHistoryModel *model.AppsHistory
	)

	// 查询旧的表里有没有数据，没有或者失败直接返回
	oldAppses, err := u.appsRepo.GetAllOldApps(ctx)
	if err != nil {
		return nil
	}
	if len(oldAppses) == 0 {
		return nil
	}

	// 查询新的表里有没有数据，有或者失败直接返回
	appses, err := u.appsRepo.GetAllApps(ctx)
	if err != nil {
		return nil
	}
	if len(appses) > 0 {
		return nil
	}

	// 更新数据库
	id, err := utils.GetUniqueID()
	if err != nil {
		log.Errorf("failed to general unique id, err: %v", err)
		err = errorcode.Desc(errorcode.PublicUniqueIDError)
		return err
	}
	for _, oldApp := range oldAppses {
		appsModel = &model.Apps{
			ID:                 id,
			AppsID:             oldApp.AppsId,
			PublishedVersionID: oldApp.ID,
			CreatorUID:         oldApp.CreatorUID,
			UpdaterUID:         oldApp.UpdaterUID,
		}

		appsHistoryModel = &model.AppsHistory{
			ID:                     oldApp.ID,
			AppID:                  id,
			Name:                   oldApp.Name,
			Description:            oldApp.Description,
			InfoSystem:             oldApp.InfoSystem,
			ApplicationDeveloperID: *oldApp.ApplicationDeveloperId,
			AccountID:              oldApp.AccountID,
			AccountName:            oldApp.AccountName,
			UpdaterUID:             oldApp.UpdaterUID,
		}
		err = u.appsRepo.Upgrade(ctx, appsModel, appsHistoryModel)
		if err != nil {
			return err
		}
	}

	return nil
}
