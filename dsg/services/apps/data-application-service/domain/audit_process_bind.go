package domain

import (
	"context"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/microservice"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
)

type AuditProcessBindDomain struct {
	auditProcessBindRepo gorm.AuditProcessBindRepo
	workflowRestRepo     microservice.WorkflowRestRepo
}

func NewAuditProcessBindDomain(auditProcessBindRepo gorm.AuditProcessBindRepo, workflowRestRepo microservice.WorkflowRestRepo) *AuditProcessBindDomain {
	return &AuditProcessBindDomain{
		auditProcessBindRepo: auditProcessBindRepo,
		workflowRestRepo:     workflowRestRepo,
	}
}

func (u *AuditProcessBindDomain) AuditProcessBindList(ctx context.Context, req *dto.AuditProcessBindListReq) (res *dto.AuditProcessBindListRes, err error) {
	auditProcessBinds, count, err := u.auditProcessBindRepo.List(ctx, req)
	if err != nil {
		return nil, err
	}

	entries := []*dto.AuditProcessBind{}
	for _, auditProcessBind := range auditProcessBinds {
		entries = append(entries, &dto.AuditProcessBind{
			BindID:     auditProcessBind.BindID,
			AuditType:  auditProcessBind.AuditType,
			ProcDefKey: auditProcessBind.ProcDefKey,
		})
	}

	res = &dto.AuditProcessBindListRes{
		PageResult: dto.PageResult[dto.AuditProcessBind]{
			Entries:    entries,
			TotalCount: count,
		},
	}
	return res, nil
}

func (u *AuditProcessBindDomain) AuditProcessBindCreate(ctx context.Context, req *dto.AuditProcessBindCreateReq) error {
	res, err := u.workflowRestRepo.ProcessDefinitionGet(ctx, req.ProcDefKey)
	if err != nil {
		return errorcode.Detail(errorcode.ProcDefKeyNotExist, err)
	}

	if res.Type != req.AuditType {
		return errorcode.Detail(errorcode.ProcDefKeyNotExist, err)
	}

	if res.Key != req.ProcDefKey {
		return errorcode.Detail(errorcode.ProcDefKeyNotExist, err)
	}

	process := &model.AuditProcessBind{
		BindID:     util.GetUniqueString(),
		AuditType:  req.AuditType,
		ProcDefKey: req.ProcDefKey,
	}
	err = u.auditProcessBindRepo.Create(ctx, process)

	return err
}

func (u *AuditProcessBindDomain) AuditProcessBindGet(ctx context.Context, req *dto.AuditProcessBindGetReq) (res *dto.AuditProcessBindGetRes, err error) {
	process, err := u.auditProcessBindRepo.Get(ctx, req.BindId)

	if err != nil {
		return nil, err
	}
	t := &dto.AuditProcessBindGetRes{
		AuditProcessBind: dto.AuditProcessBind{
			BindID:     process.BindID,
			AuditType:  process.AuditType,
			ProcDefKey: process.ProcDefKey,
		},
	}
	return t, err
}

func (u *AuditProcessBindDomain) AuditProcessBindUpdate(ctx context.Context, req *dto.AuditProcessBindUpdateReq) error {
	res, err := u.workflowRestRepo.ProcessDefinitionGet(ctx, req.ProcDefKey)
	if err != nil {
		return errorcode.Detail(errorcode.ProcDefKeyNotExist, err)
	}

	if res.Type != req.AuditType {
		return errorcode.Detail(errorcode.ProcDefKeyNotExist, err)
	}

	if res.Key != req.ProcDefKey {
		return errorcode.Detail(errorcode.ProcDefKeyNotExist, err)
	}

	process := &model.AuditProcessBind{
		AuditType:  req.AuditType,
		ProcDefKey: req.ProcDefKey,
	}

	err = u.auditProcessBindRepo.Update(ctx, req.BindId, process)
	return err
}

func (u *AuditProcessBindDomain) AuditProcessBindDelete(ctx context.Context, req *dto.AuditProcessBindDeleteReq) error {
	err := u.auditProcessBindRepo.Delete(ctx, req.BindId)
	return err
}
