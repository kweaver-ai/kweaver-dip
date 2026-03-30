package audit_process

import (
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db"
	catalog_flow "github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_catalog_audit_flow_bind"
)

type AuditProcessDomain struct {
	flowRepo catalog_flow.RepoOp
	data     *db.Data
}

func NewAuditProcessDomain(
	cataFlow catalog_flow.RepoOp,
	data *db.Data) *AuditProcessDomain {
	return &AuditProcessDomain{
		flowRepo: cataFlow,
		data:     data}
}

/*
func (ap *AuditProcessDomain) GetList(ctx context.Context, req *ReqFormParams) ([]*AuditProcessBindQueryResp, error) {
	datas, err := ap.flowRepo.Get(nil, ctx, 0, req.AuditType)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	rets := make([]*AuditProcessBindQueryResp, 0, 3)
	for i := range datas {
		ret := &AuditProcessBindQueryResp{
			ID:         datas[i].ID,
			AuditType:  datas[i].AuditType,
			ProcDefKey: datas[i].ProcDefKey,
		}
		rets = append(rets, ret)
	}
	return rets, nil
}

func checkAuditProcessDefinition(ctx context.Context, req *ReqAuditProcessBindParams) error {
	data, err := common.GetAuditProcessDefinition(ctx, req.ProcDefKey)
	if err != nil {
		log.WithContext(ctx).Errorf("get audit process procDefKey: %v info failed, err: %v", req.ProcDefKey, err)
		validErrs := &form_validator.ValidErrors{
			&form_validator.ValidError{
				Key:     "proc_def_key",
				Message: err.Error(),
			},
		}

		return errorcode.Detail(errorcode.PublicInvalidParameter, validErrs)
	}

	if data == nil {
		log.WithContext(ctx).Errorf("get audit process procDefKey: %v info failed, not existed", req.ProcDefKey)
		validErrs := &form_validator.ValidErrors{
			&form_validator.ValidError{
				Key:     "proc_def_key",
				Message: "流程定义key不存在",
			},
		}

		return errorcode.Detail(errorcode.PublicInvalidParameter, validErrs)
	}

	if data.Time != req.AuditType {
		log.WithContext(ctx).Errorf("audit process procDefKey: %v type: %v cannot match to req type: %v",
			req.ProcDefKey, data.Time, req.AuditType)
		validErrs := &form_validator.ValidErrors{
			&form_validator.ValidError{
				Key:     "proc_def_key",
				Message: "流程定义类型与绑定类型不匹配",
			},
		}

		return errorcode.Detail(errorcode.PublicInvalidParameter, validErrs)
	}

	if data.Effectivity > 0 {
		log.WithContext(ctx).Errorf("audit process procDefKey: %v invalid or deleted", req.ProcDefKey)
		validErrs := &form_validator.ValidErrors{
			&form_validator.ValidError{
				Key:     "proc_def_key",
				Message: "流程定义key无效或被删除",
			},
		}

		return errorcode.Detail(errorcode.PublicInvalidParameter, validErrs)
	}
	return nil
}

func (ap *AuditProcessDomain) Create(ctx context.Context, req *ReqAuditProcessBindParams) (*IDResp, error) {
	uInfo := request.GetUserInfo(ctx)

	err := checkAuditProcessDefinition(ctx, req)
	if err != nil {
		return nil, err
	}

	curTime := &util.Time{time.Now()}
	flow := &model.TDataCatalogAuditFlowBind{
		AuditType:  req.AuditType,
		ProcDefKey: req.ProcDefKey,
		CreatedAt:  curTime,
		CreatorUID: uInfo.ID,
		UpdatedAt:  curTime,
		UpdaterUID: uInfo.ID,
	}
	err = ap.flowRepo.Insert(nil, ctx, flow)
	if err != nil {
		log.WithContext(ctx).Errorf("failed to create audit flow bind procDefKey: %v to auditType: %v, err: %v", req.ProcDefKey, req.AuditType, err)
		if util.IsMysqlDuplicatedErr(err) {
			return nil, errorcode.Detail(errorcode.PublicAuditTypeConflict, "当前审核类型流程绑定已创建，不可重复创建")
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return &IDResp{ID: flow.ID}, nil
}

func (ap *AuditProcessDomain) Update(ctx context.Context, id uint64, req *ReqAuditProcessBindParams) (*IDResp, error) {
	uInfo := request.GetUserInfo(ctx)
	err := checkAuditProcessDefinition(ctx, req)
	if err != nil {
		return nil, err
	}

	datas, err := ap.flowRepo.Get(nil, ctx, id, "")
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(datas) == 0 {
		return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "绑定记录不存在")
	}

	if datas[0].AuditType != req.AuditType {
		return nil, errorcode.Detail(errorcode.PublicInternalError, "审核类型不匹配")
	}

	datas[0].ProcDefKey = req.ProcDefKey
	datas[0].UpdatedAt = &util.Time{time.Now()}
	datas[0].UpdaterUID = uInfo.ID
	_, err = ap.flowRepo.Update(nil, ctx, datas[0])
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return &IDResp{ID: id}, nil
}

func (ap *AuditProcessDomain) Delete(ctx context.Context, id uint64) (*IDResp, error) {
	datas, err := ap.flowRepo.Get(nil, ctx, id, "")
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}

	if len(datas) == 0 {
		return nil, errorcode.Detail(errorcode.PublicResourceNotExisted, "绑定记录不存在")
	}

	// if datas[0].AuditType != workflow.WORKFLOW_AUDIT_TYPE_CATALOG_ONLINE &&
	// 	datas[0].AuditType != workflow.WORKFLOW_AUDIT_TYPE_CATALOG_OFFLINE {
	// 	return nil, errorcode.Detail(errorcode.PublicResourceDelNotAllowedError, "当前审核类型流程绑定不可删除")
	// }

	_, err = ap.flowRepo.Delete(nil, ctx, id)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return &IDResp{ID: id}, nil
}
*/
