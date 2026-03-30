package gorm

import (
	"context"
	"errors"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-common/util"
	"github.com/kweaver-ai/idrm-go-common/workflow/common"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
	"strings"
)

// DataAuthRequestFormRepo 定义了数据申请单的仓储接口
type DataAuthRequestFormRepo interface {
	UpsertBeforeAudit(ctx context.Context, form *model.DwhAuthRequestFormAssociations) error
	GetUserApplicationForm(ctx context.Context, vid string) (data *model.TDwhAuthRequestForm, err error)
	GetAuthReqSpec(ctx context.Context, id string) (data *model.TDwhAuthRequestSpec, err error)
	Get(ctx context.Context, id string) (*model.DwhAuthRequestFormAssociations, error)
	GetAuthReqForm(ctx context.Context, id string) (data *model.TDwhAuthRequestForm, err error)
	Delete(ctx context.Context, id string) error
	List(ctx context.Context, req *dto.DataAuthRequestListArgs) (int, []*model.TDwhAuthRequestForm, error)
	ListUserAuthForm(ctx context.Context, req *dto.UserDataAuthRequestListArgs) (forms []*model.TDwhAuthRequestForm, err error)
	UpdateAfterAuditApproved(ctx context.Context, requestFormID string, txFunc func() error) error
	UpdateRequestPhaseAndMsg(ctx context.Context, formInfo *model.TDwhAuthRequestForm) error
	UpdateRequestFormName(ctx context.Context, formInfo *model.TDwhAuthRequestForm) error
	SaveSubViewID(ctx context.Context, specInfo *model.TDwhAuthRequestSpec) error
	DeleteByAuditTypeKey(ctx context.Context, formInfo *model.TDwhAuthRequestForm, txFunc func() error) error
}

type dataAuthRequestFormRepo struct {
	db *gorm.DB
}

func NewDataApplicationFormRepo(db *gorm.DB) DataAuthRequestFormRepo {
	return &dataAuthRequestFormRepo{db: db}
}

// UpsertBeforeAudit 插入或者更新数据
func (r *dataAuthRequestFormRepo) UpsertBeforeAudit(ctx context.Context, form *model.DwhAuthRequestFormAssociations) error {
	existsCount := int64(0)
	err := r.db.WithContext(ctx).Model(&model.TDwhAuthRequestForm{}).Where("id = ?", form.TDwhAuthRequestForm.ID).Count(&existsCount).Error
	if err != nil {
		return err
	}
	//已经存在，只需要更新状态, 因为还没审核通过
	if existsCount > 0 {
		return r.UpdateBeforeAuditApproved(ctx, form)
	}
	//不存在，新建
	return r.Create(ctx, form)
}

func (r *dataAuthRequestFormRepo) GetUserApplicationForm(ctx context.Context, vid string) (data *model.TDwhAuthRequestForm, err error) {
	applicantInfo, err := util.GetUserInfo(ctx)
	if err != nil {
		return nil, err
	}
	if applicantInfo.ID == "" {
		return nil, errorcode.PublicInternalErr.Err()
	}
	data = &model.TDwhAuthRequestForm{}
	err = r.db.WithContext(ctx).Where("applicant = ? AND data_id = ?", applicantInfo.ID, vid).Take(data).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, nil
		}
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return data, nil
}

// GetAuthReqForm 根据ID获取申请单
func (r *dataAuthRequestFormRepo) GetAuthReqForm(ctx context.Context, id string) (data *model.TDwhAuthRequestForm, err error) {
	data = &model.TDwhAuthRequestForm{}
	tx := r.db.WithContext(ctx).Model(&model.TDwhAuthRequestForm{})
	err = tx.Where("id = ?", id).Take(data).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.DWHAuthReqFormDataViewNotExistErr.Err()
		}
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return data, err
}

// GetAuthReqSpec 根据ID获取申请单
func (r *dataAuthRequestFormRepo) GetAuthReqSpec(ctx context.Context, id string) (data *model.TDwhAuthRequestSpec, err error) {
	tx := r.db.WithContext(ctx).Model(&model.TDwhAuthRequestSpec{})
	data = &model.TDwhAuthRequestSpec{}
	err = tx.Where("request_form_id = ?", id).Take(data).Error
	if err != nil {
		return nil, errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return data, err
}

// Get 根据ID获取申请单详情
func (r *dataAuthRequestFormRepo) Get(ctx context.Context, id string) (*model.DwhAuthRequestFormAssociations, error) {
	authRequestForm, err := r.GetAuthReqForm(ctx, id)
	if err != nil {
		return nil, err
	}
	authRequestSpec, err := r.GetAuthReqSpec(ctx, id)
	if err != nil {
		return nil, err
	}
	return &model.DwhAuthRequestFormAssociations{
		TDwhAuthRequestForm: *authRequestForm,
		TDwhAuthRequestSpec: *authRequestSpec,
	}, nil
}

// Create 创建新的申请单
func (r *dataAuthRequestFormRepo) Create(ctx context.Context, form *model.DwhAuthRequestFormAssociations) error {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//插入申请表单
		err := tx.Create(&form.TDwhAuthRequestForm).Error
		if err != nil {
			return err
		}
		//插入申请单的行列规则
		return tx.Create(&form.TDwhAuthRequestSpec).Error
	})
	if err != nil {
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

// UpdateBeforeAuditApproved 申请通过前更新的操作
func (r *dataAuthRequestFormRepo) UpdateBeforeAuditApproved(ctx context.Context, formInfo *model.DwhAuthRequestFormAssociations) error {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//更新申请单状态
		err := tx.Where("id=?", formInfo.TDwhAuthRequestForm.ID).Updates(&formInfo.TDwhAuthRequestForm).Error
		if err != nil {
			return err
		}
		//查询申请单详情
		existsSpec := &model.TDwhAuthRequestSpec{}
		db := tx.Model(new(model.TDwhAuthRequestSpec))
		if err = db.Where("request_form_id=?", formInfo.TDwhAuthRequestForm.ID).Take(existsSpec).Error; err != nil {
			return err
		}
		updateProps := make(map[string]any)
		//审核通过过，保存到草稿
		if existsSpec.ID != "" {
			updateProps["draft_request_type"] = formInfo.TDwhAuthRequestSpec.DraftRequestType
			updateProps["draft_spec"] = formInfo.TDwhAuthRequestSpec.DraftSpec
			updateProps["draft_expired_at"] = formInfo.TDwhAuthRequestSpec.DraftExpiredAt
		} else {
			updateProps["request_type"] = formInfo.TDwhAuthRequestSpec.RequestType
			updateProps["spec"] = formInfo.TDwhAuthRequestSpec.Spec
			updateProps["expired_at"] = formInfo.TDwhAuthRequestSpec.ExpiredAt
		}
		db = tx.Model(new(model.TDwhAuthRequestSpec))
		return db.Where("request_form_id=?", formInfo.TDwhAuthRequestForm.ID).Updates(&updateProps).Error
	})
	if err != nil {
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

func (r *dataAuthRequestFormRepo) SaveSubViewID(ctx context.Context, specInfo *model.TDwhAuthRequestSpec) error {
	db := r.db.WithContext(ctx).Model(new(model.TDwhAuthRequestSpec))
	err := db.Where("request_form_id=?", specInfo.RequestFormID).Update("id", specInfo.ID).Error
	if err != nil {
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

// UpdateAfterAuditApproved 申请通过前更新的操作, 主要针对的是修改申请单操作
func (r *dataAuthRequestFormRepo) UpdateAfterAuditApproved(ctx context.Context, requestFormID string, txFunc func() error) error {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//查询申请单
		db := tx.Model(new(model.TDwhAuthRequestSpec))
		existFormSpec := &model.TDwhAuthRequestSpec{}
		err := db.Where("request_form_id=?", requestFormID).Take(existFormSpec).Error
		if err != nil {
			return err
		}
		updateProps := make(map[string]interface{})
		//不管咋样，这几个草稿都要清空
		updateProps["draft_spec"] = ""
		updateProps["draft_expired_at"] = 0
		updateProps["draft_request_type"] = ""
		//如果时申请通过后的，需要将草稿更新到正式值上
		if existFormSpec.ID != "" {
			updateProps["spec"] = existFormSpec.DraftSpec
			updateProps["expired_at"] = existFormSpec.DraftExpiredAt
			updateProps["request_type"] = existFormSpec.DraftRequestType
		}
		db = tx.Model(new(model.TDwhAuthRequestSpec))
		if err = db.Where("request_form_id=?", requestFormID).Updates(updateProps).Error; err != nil {
			return err
		}
		//如果更新错误, 直接在结果中显示出来, 事务回退
		if err = txFunc(); err != nil {
			failedUpdateBody := &model.TDwhAuthRequestForm{
				ID:      requestFormID,
				Phase:   constant.AUDIT_FAILED,
				Message: err.Error(),
			}
			if err1 := r.UpdateRequestPhaseAndMsg(ctx, failedUpdateBody); err1 != nil {
				log.Errorf("UpdateRequestPhaseAndMsg error ： %v", err1.Error())
			}
			return err
		}
		return nil
	})
	if err != nil {
		log.Errorf("UpdateAfterAuditApproved： %v", err.Error())
		return errorcode.PublicDatabaseErr.Detail(err.Error())
	}
	return nil
}

// UpdateRequestFormName 更新状态和msg
func (r *dataAuthRequestFormRepo) UpdateRequestFormName(ctx context.Context, formInfo *model.TDwhAuthRequestForm) error {
	db := r.db.WithContext(ctx).Model(new(model.TDwhAuthRequestForm))
	updateProps := make(map[string]interface{})
	updateProps["name"] = formInfo.Name
	updateProps["data_business_name"] = formInfo.DataBusinessName
	return db.Where("id=?", formInfo.ID).Updates(updateProps).Error
}

// UpdateRequestPhaseAndMsg 更新状态和msg
func (r *dataAuthRequestFormRepo) UpdateRequestPhaseAndMsg(ctx context.Context, formInfo *model.TDwhAuthRequestForm) error {
	updateProps := make(map[string]interface{})
	updateProps["phase"] = formInfo.Phase
	if formInfo.Message != "" {
		updateProps["message"] = formInfo.Message
	}
	return r.db.WithContext(ctx).Model(new(model.TDwhAuthRequestForm)).Where("id=?", formInfo.ID).Updates(updateProps).Error
}

// Delete 根据ID删除申请单
func (r *dataAuthRequestFormRepo) Delete(ctx context.Context, id string) error {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//删除申请单
		err := tx.Where("id = ?", id).Delete(&model.TDwhAuthRequestForm{}).Error
		if err != nil {
			return err
		}
		return tx.Where("request_form_id = ?", id).Delete(&model.TDwhAuthRequestSpec{}).Error
	})
	if err != nil {
		return errorcode.PublicInternalErr.Detail(err.Error())
	}
	return nil
}

// DeleteByAuditTypeKey 根据审核类型key删除
func (r *dataAuthRequestFormRepo) DeleteByAuditTypeKey(ctx context.Context, formInfo *model.TDwhAuthRequestForm, txFunc func() error) error {
	err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		//更新所有的状态为驳回
		err := r.db.Model(formInfo).Where("proc_def_key = ?", formInfo.ProcDefKey).
			Where("phase = ?", common.AUDIT_AUDITING).Updates(formInfo).Error
		if err != nil {
			log.Error("DeleteByAuditTypeKey error: ", zap.Error(tx.Error))
			return err
		}
		// 删除审核绑定
		return txFunc()
	})
	if err != nil {
		return errorcode.PublicInternalErr.Detail(err.Error())
	}
	return nil
}

// List 根据申请人获取申请单列表
func (r *dataAuthRequestFormRepo) List(ctx context.Context, req *dto.DataAuthRequestListArgs) (int, []*model.TDwhAuthRequestForm, error) {
	var forms []*model.TDwhAuthRequestForm
	db := r.db.WithContext(ctx)

	if req.Applicant != "" {
		db = db.Where("applicant = ?", req.Applicant)
	}
	if req.Keyword != "" {
		nameLike := "%" + req.Keyword + "%"
		db = db.Where("name like ? or data_business_name like ? or data_tech_name like ? ", nameLike, nameLike, nameLike)
	}
	if req.Phase != "" {
		phases := strings.Split(req.Phase, ",")
		db = db.Where("phase in  ?", phases)
	}
	if req.DataID != "" {
		db = db.Where("data_id in  ? ", strings.Split(req.DataID, ","))
	}
	//返回总数
	total := int64(0)
	err := db.Model(new(model.TDwhAuthRequestForm)).Count(&total).Error
	if err != nil {
		return 0, nil, errorcode.PublicInternalErr.Detail(err.Error())
	}

	db = Paginate(req.Offset, req.Limit)(db)
	err = db.Order("apply_time DESC").Find(&forms).Error
	if err != nil {
		return 0, nil, errorcode.PublicInternalErr.Detail(err.Error())
	}
	return int(total), forms, nil
}

// ListUserAuthForm 根据申请人获取申请单列表, 内部接口使用
func (r *dataAuthRequestFormRepo) ListUserAuthForm(ctx context.Context, req *dto.UserDataAuthRequestListArgs) (forms []*model.TDwhAuthRequestForm, err error) {
	db := r.db.WithContext(ctx)

	if req.Applicant != "" {
		db = db.Where("applicant = ?", req.Applicant)
	}
	if req.DataID != "" {
		db = db.Where("data_id in  ?", strings.Split(req.DataID, ","))
	}
	if err = db.Find(&forms).Error; err != nil {
		return nil, errorcode.PublicInternalErr.Detail(err.Error())
	}
	return forms, nil
}
