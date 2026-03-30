package impl

import (
	"context"
	"strconv"
	"time"

	audit_process_bind_repo "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/rest/workflow"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/form_validator"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/response"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_process_bind"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type auditProcessBindUseCase struct {
	auditProcessBindRepo audit_process_bind_repo.AuditProcessBindRepo
	workflow             workflow.Workflow
}

func NewAuditProcessBindUseCase(
	auditProcessBindRepo audit_process_bind_repo.AuditProcessBindRepo,
	workflow workflow.Workflow,
) audit_process_bind.AuditProcessBindUseCase {
	useCase := &auditProcessBindUseCase{
		auditProcessBindRepo: auditProcessBindRepo,
		workflow:             workflow,
	}
	return useCase
}

func (u auditProcessBindUseCase) AuditProcessBindCreate(ctx context.Context, req *audit_process_bind.CreateReqBody, uid string) error {
	//_, ok := constant.ServiceTypeAllowedAuditType[req.ServiceType+req.AuditType.AuditType]
	//if !ok {
	//	return errorcode.Desc(errorcode.AuditTypeOrServiceTypeError)
	//}
	res, err := u.workflow.ProcessDefinitionGet(ctx, req.ProcDefKey)
	if err != nil {
		log.Error("AuditProcessBindCreate ProcessDefinitionGet Error: ", zap.Error(err))
		return errorcode.Desc(errorcode.ProcDefKeyNotFound)
	}

	if res.Key != req.ProcDefKey {
		return errorcode.Detail(errorcode.ProcDefKeyNotFound, err)
	}

	process := &model.AuditProcessBind{
		AuditType:    req.AuditType.AuditType,
		ProcDefKey:   req.ProcDefKey,
		ServiceType:  req.ServiceType,
		CreatedByUID: uid,
	}
	err = u.auditProcessBindRepo.Create(ctx, process)
	return err

}
func (u auditProcessBindUseCase) AuditProcessBindList(ctx context.Context, req *audit_process_bind.ListReqQuery) (*audit_process_bind.ListRes, error) {
	if req.Limit <= 0 {
		validErr := form_validator.ValidErrors{{Key: "limit", Message: "limit最小只能为1"}}
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, validErr)
	}
	if req.Offset <= 0 {
		validErr := form_validator.ValidErrors{{Key: "offset", Message: "offset最小只能为1"}}
		return nil, errorcode.Detail(errorcode.PublicInvalidParameter, validErr)
	}
	auditProcessBinds, count, err := u.auditProcessBindRepo.List(ctx, req)
	if err != nil {
		return nil, err
	}

	entries := []*audit_process_bind.AuditProcessBind{}
	for _, auditProcessBind := range auditProcessBinds {
		entries = append(entries, &audit_process_bind.AuditProcessBind{
			AuditType: audit_process_bind.AuditType{
				AuditType: auditProcessBind.AuditType,
			},
			ID:         strconv.FormatUint(auditProcessBind.ID, 10),
			ProcDefKey: auditProcessBind.ProcDefKey,
		})
	}

	res := &audit_process_bind.ListRes{
		PageResults: response.PageResults[audit_process_bind.AuditProcessBind]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil

}

func (u auditProcessBindUseCase) AuditProcessBindUpdate(ctx context.Context, req *audit_process_bind.UpdateReq, uid string) error {
	//_, ok := constant.ServiceTypeAllowedAuditType[req.ServiceType+req.AuditType.AuditType]
	//if !ok {
	//	return errorcode.Desc(errorcode.AuditTypeOrServiceTypeError)
	//}
	res, err := u.workflow.ProcessDefinitionGet(ctx, req.ProcDefKey)
	if err != nil {
		log.Error("AuditProcessBindUpdate ProcessDefinitionGet Error: ", zap.Error(err))
		return errorcode.Desc(errorcode.ProcDefKeyNotFound)
	}

	if res.Key != req.ProcDefKey {
		return errorcode.Desc(errorcode.ProcDefKeyNotFound)
	}

	process := &model.AuditProcessBind{
		AuditType:    req.AuditType.AuditType,
		ProcDefKey:   req.ProcDefKey,
		ServiceType:  req.ServiceType,
		UpdatedByUID: uid,
		UpdateTime:   time.Now(),
	}

	err = u.auditProcessBindRepo.Update(ctx, req.Id, process)
	return err

}
func (u auditProcessBindUseCase) AuditProcessBindDelete(ctx context.Context, req *audit_process_bind.DeleteReq) error {
	return u.auditProcessBindRepo.Delete(ctx, req.Id)
}

func (u auditProcessBindUseCase) AuditProcessBindGet(ctx context.Context, req *audit_process_bind.AuditProcessBindUriReq) (*audit_process_bind.GetAuditProcessRes, error) {
	process, err := u.auditProcessBindRepo.Get(ctx, req.Id)
	if err != nil {
		return nil, err
	}
	resp := &audit_process_bind.GetAuditProcessRes{
		ID:          strconv.FormatUint(process.ID, 10),
		AuditType:   process.AuditType,
		ProcDefKey:  process.ProcDefKey,
		ServiceType: process.ServiceType,
	}
	return resp, nil
}

func (u auditProcessBindUseCase) AuditProcessBindGetByAuditType(ctx context.Context, req *audit_process_bind.AuditTypeGetParameter) (*audit_process_bind.GetAuditProcessRes, error) {
	process, err := u.auditProcessBindRepo.GetByAuditType(ctx, req.AuditType)
	if err != nil {
		return nil, err
	}
	resp := &audit_process_bind.GetAuditProcessRes{
		ID:          strconv.FormatUint(process.ID, 10),
		AuditType:   process.AuditType,
		ProcDefKey:  process.ProcDefKey,
		ServiceType: process.ServiceType,
	}
	return resp, nil
}

func (u auditProcessBindUseCase) AuditProcessBindDeleteByAuditType(ctx context.Context, req *audit_process_bind.AuditType) error {
	return u.auditProcessBindRepo.DeleteByAuditType(ctx, req.AuditType)
}
