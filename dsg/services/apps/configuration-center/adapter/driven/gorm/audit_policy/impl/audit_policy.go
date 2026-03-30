package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/audit_policy"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"

	domain_audit_policy "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/audit_policy"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type auditPolicyRepo struct {
	db *gorm.DB
}

func NewAuditPolicyRepo(db *gorm.DB) audit_policy.AuditPolicyRepo {
	return &auditPolicyRepo{db: db}
}

func (r *auditPolicyRepo) Create(ctx context.Context, auditPolicy *model.AuditPolicy, auditPolicyResource []*model.AuditPolicyResource) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Table(model.TableNameAuditPolicy).Create(auditPolicy).Error; err != nil {
			log.WithContext(ctx).Error("Create audit_policy", zap.Error(tx.Error))
			return err
		}
		if len(auditPolicyResource) > 0 {
			if err := tx.Table(model.TableNameAuditPolicyResource).Create(auditPolicyResource).Error; err != nil {
				log.WithContext(ctx).Error("Create audit_policy_resources", zap.Error(tx.Error))
				return err
			}
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *auditPolicyRepo) Update(ctx context.Context, auditPolicy *model.AuditPolicy, auditPolicyResource []*model.AuditPolicyResource) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Table(model.TableNameAuditPolicy).Debug().Updates(auditPolicy).Error; err != nil {
			log.WithContext(ctx).Error("Update audit_policy", zap.Error(tx.Error))
			return err
		}

		if err := tx.Table(model.TableNameAuditPolicyResource).Where("audit_policy_id = ?", auditPolicy.ID).Delete(&model.AuditPolicyResource{}).Error; err != nil {
			log.WithContext(ctx).Error("Delete audit_policy_resources", zap.Error(tx.Error))
			return err
		}
		if len(auditPolicyResource) > 0 {
			if err := tx.Table(model.TableNameAuditPolicyResource).Debug().Create(auditPolicyResource).Error; err != nil {
				log.WithContext(ctx).Error("Create audit_policy_resources", zap.Error(tx.Error))
				return err
			}
		}

		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *auditPolicyRepo) Delete(ctx context.Context, id string) (err error) {
	if err := r.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		audit_policy := &model.AuditPolicy{}
		if err := tx.Table(model.TableNameAuditPolicy).Where("id = ?", id).Delete(audit_policy).Error; err != nil {
			log.WithContext(ctx).Error("Delete audit_policy", zap.Error(tx.Error))
			return err
		}

		audit_policy_resource := &model.AuditPolicyResource{}
		if err := tx.Table(model.TableNameAuditPolicyResource).Where("audit_policy_id = ?", id).Delete(audit_policy_resource).Error; err != nil {
			log.WithContext(ctx).Error("Delete audit_policy_resources", zap.Error(tx.Error))
			return err
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (r *auditPolicyRepo) List(ctx context.Context, req *domain_audit_policy.ListReqQuery) (apps []*model.AuditPolicy, total int64, err error) {
	limit := req.Limit
	offset := limit * (req.Offset - 1)

	Db := r.db.WithContext(ctx).Debug().Model(&model.AuditPolicy{})

	if req.Keyword != "" {
		keywords := util.KeywordEscape(req.Keyword)
		Db = Db.Where("name like ?", "%"+keywords+"%")
	}
	if req.Status != "" {
		Db = Db.Where("status=?", req.Status)
	}
	if req.HasAudit != nil {
		if *req.HasAudit {
			Db = Db.Where("proc_def_key!=''")
		} else {
			Db = Db.Where("proc_def_key=''")
		}
	}
	if req.HasResource != nil {
		if *req.HasResource {
			Db = Db.Where("resources_count>0")
		} else {
			Db = Db.Where("resources_count=0")
		}
	}
	err = Db.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	models := make([]*model.AuditPolicy, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))
	orderSql := gormx.Field(Db, "type", "desc", "built-in-interface-svc", "built-in-indicator", "built-in-data-view")
	err = Db.Order(fmt.Sprintf("%s, %s %s, id asc", orderSql, req.Sort, req.Direction)).Debug().Find(&models).Error
	if err != nil {
		return nil, 0, err
	}

	return models, total, nil
}

func (r *auditPolicyRepo) GetById(ctx context.Context, id string) (*model.AuditPolicy, error) {
	model := new(model.AuditPolicy)
	err := r.db.WithContext(ctx).Debug().Where("id=?", id).First(model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.AuditPolicyNotFound)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return model, err
}

func (r *auditPolicyRepo) GetAuditPolicyByResourceIds(ctx context.Context, ids []string) (policyResources []*audit_policy.AuditPolicyResource, err error) {
	err = r.db.WithContext(ctx).Table("audit_policy_resources m").Debug().Select("m.id, m.audit_policy_id, m.type, b.status").
		Joins("left join audit_policy b on b.id = m.audit_policy_id").
		Where("m.deleted_at = 0").
		Where("m.id in ? ", ids).Find(&policyResources).Error
	return
}

func (r *auditPolicyRepo) GetResourceByPolicyId(ctx context.Context, id string) ([]*model.AuditPolicyResource, error) {
	models := make([]*model.AuditPolicyResource, 0)
	err := r.db.WithContext(ctx).Debug().Where("audit_policy_id=?", id).Find(&models).Error
	return models, err
}

func (r *auditPolicyRepo) CheckNameRepeatWithId(ctx context.Context, name, id string) (isRepeat bool, err error) {
	model := new(model.AuditPolicy)
	Db := r.db.WithContext(ctx).Debug()
	if id == "" {
		err = Db.Where("name=?", name).Take(model).Error
	} else {
		err = Db.Where("name=? and id<>?", name, id).Take(model).Error
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return true, nil
}

func (r *auditPolicyRepo) GetIndicatorByIds(ctx context.Context, ids []string) ([]*audit_policy.TTechnicalIndicator, error) {
	models := make([]*audit_policy.TTechnicalIndicator, 0)
	err := r.db.WithContext(ctx).Table("af_data_model.t_technical_indicator m").Debug().Select("m.id, m.name, m.code, m.indicator_type, b.path as path, c.name as subject_domain_name").
		Joins("left join af_configuration.object b on b.id = m.mgnt_dep_id").
		Joins("left join af_main.subject_domain c on c.id = m.subject_domain_id").
		Where("m.deleted_at = 0 or m.deleted_at IS NULL").
		Where("m.id in ? ", ids).Find(&models).Error
	return models, err
}
func (r *auditPolicyRepo) GetFormViewByIds(ctx context.Context, ids []string) ([]*audit_policy.FormView, error) {
	models := make([]*audit_policy.FormView, 0)
	err := r.db.WithContext(ctx).Table("af_main.form_view m").Debug().Select("m.id, m.business_name, m.uniform_catalog_code, m.technical_name, m.online_status, b.path as path, c.name as subject_domain_name").
		Joins("left join af_configuration.object b on b.id = m.department_id").
		Joins("left join af_main.subject_domain c on c.id = m.subject_id").
		Where("m.deleted_at = 0").
		Where("m.id in ? ", ids).Find(&models).Error
	return models, err

}
func (r *auditPolicyRepo) GetServiceByIds(ctx context.Context, ids []string) ([]*audit_policy.Service, error) {
	models := make([]*audit_policy.Service, 0)
	err := r.db.WithContext(ctx).Table("data_application_service.service m").Debug().Select("m.service_id, m.service_name, m.service_code, m.status, b.path as path, c.name as subject_domain_name").
		Joins("left join af_configuration.object b on b.id = m.department_id").
		Joins("left join af_main.subject_domain c on c.id = m.subject_domain_id").
		Where("m.delete_time = 0").
		Where("m.service_id in ? ", ids).Find(&models).Error
	return models, err
}

func (r *auditPolicyRepo) GetResourceAuditPolicyByResourceId(ctx context.Context, id string) (*audit_policy.ResourceAuditPolicy, error) {
	models := &audit_policy.ResourceAuditPolicy{}
	err := r.db.WithContext(ctx).Table("audit_policy_resources m").Debug().Select("m.id, m.type, b.status as status, b.audit_type as audit_type, b.proc_def_key as proc_def_key, b.service_type as service_type").
		Joins("left join audit_policy b on b.id = m.audit_policy_id").
		Where("m.deleted_at = 0").
		Where("m.id = ? ", id).First(&models).Error
	return models, err
}

func (r *auditPolicyRepo) GetByType(ctx context.Context, resource_type string) (*model.AuditPolicy, error) {
	model := new(model.AuditPolicy)
	err := r.db.WithContext(ctx).Debug().Where("type=?", resource_type).First(model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return nil, errorcode.Desc(errorcode.AuditPolicyNotFound)
		}
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return model, err

}

func (r *auditPolicyRepo) CheckPolicyEnabled(ctx context.Context, resource_type string) (bool, bool, error) {
	model := new(model.AuditPolicy)
	audit_resource_type := "built-in-" + resource_type
	err := r.db.WithContext(ctx).Debug().Where("type=? and status=? and proc_def_key != ''", audit_resource_type, domain_audit_policy.AuditPolicyEnabledStatus).First(model).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			var total int64
			err := r.db.WithContext(ctx).Table("audit_policy_resources m").Debug().
				Joins("left join audit_policy b on b.id = m.audit_policy_id").
				Where("m.deleted_at = 0 and m.type=? and b.status=?", resource_type, domain_audit_policy.AuditPolicyEnabledStatus).Count(&total).Error

			if err != nil {
				return false, false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
			}
			if total == 0 {
				return false, false, nil
			}
			return false, true, nil
		}
		return false, false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return true, true, err
}
