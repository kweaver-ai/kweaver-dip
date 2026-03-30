package impl

import (
	"context"
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/business_matters"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	domain_business_matters "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_matters"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"
)

type businessMattersRepo struct {
	db *gorm.DB
}

func NewBusinessMattersRepo(db *gorm.DB) business_matters.BusinessMattersRepo {
	return &businessMattersRepo{db: db}
}

func (r *businessMattersRepo) Create(ctx context.Context, businessMatter *model.BusinessMatter) (err error) {
	if err := r.db.Table(model.TableNameBusinessMatter).Create(businessMatter).Error; err != nil {
		log.WithContext(ctx).Error("Create business_matters", zap.Error(err))
		return err
	}
	return nil
}

func (r *businessMattersRepo) Update(ctx context.Context, Id string, businessMatter *model.BusinessMatter) (err error) {
	if err = r.db.Table(model.TableNameBusinessMatter).Where("business_matters_id=?", Id).Updates(businessMatter).Error; err != nil {
		log.WithContext(ctx).Error("Update business_matters", zap.Error(err))
		return err
	}
	return nil
}

func (r *businessMattersRepo) Delete(ctx context.Context, id string) (err error) {
	if err := r.db.Where("business_matters_id = ?", id).Delete(&model.BusinessMatter{}).Error; err != nil {
		log.WithContext(ctx).Error("Delete business_matters", zap.Error(err))
		return err
	}
	return nil
}

func (r *businessMattersRepo) GetByBusinessMattersId(ctx context.Context, id string) (businessMatters *model.BusinessMatter, err error) {
	result := r.db.WithContext(ctx).First(&businessMatters, "business_matters_id=?", id)
	if result.Error != nil {
		if is := errors.Is(result.Error, gorm.ErrRecordNotFound); is {
			log.WithContext(ctx).Error("business_matters not found", zap.String("id", id))
			return nil, errorcode.Desc(errorcode.BusinessMattersNotFound, id)
		}
		log.WithContext(ctx).Error("get business_matters fail", zap.Error(err), zap.String("id", id))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return
}

func (r *businessMattersRepo) GetByBusinessMattersIds(ctx context.Context, ids ...string) (businessMatters []*model.BusinessMatter, err error) {
	result := r.db.WithContext(ctx).Find(&businessMatters, "business_matters_id in ?", ids)
	if result.Error != nil {
		log.WithContext(ctx).Error("get business_matters fail", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err)
	}
	return
}

func (r *businessMattersRepo) GetThirdByBusinessMattersIds(ctx context.Context, ids ...string) (businessMatters []*model.BusinessMatter, err error) {
	db := r.db.WithContext(ctx)
	sql := "select approval_items.id as id" +
		", approval_items.approve_id AS business_matters_id" +
		", approval_items.approve_name AS name" +
		", approval_items.approve_type_name AS type_key" +
		", approval_items.approve_type_id AS type_key" +
		", approval_items.belong_dept_id AS department_id" +
		", approval_items.material_quantity AS materials_number" +
		" " +
		"from af_configuration.approval_items"
	sqlIds := ""
	for _, id := range ids {
		if sqlIds == "" {
			sqlIds = sqlIds + "'" + id + "'"
		} else {
			sqlIds = sqlIds + ",'" + id + "'"
		}
	}
	where := fmt.Sprintf("where approve_id in (%s)", sqlIds)
	err = db.Raw(fmt.Sprintf("%s %s", sql, where)).Scan(&businessMatters).Error
	if err != nil {
		return nil, err
	}
	return businessMatters, nil
}

func (r *businessMattersRepo) NameRepeat(ctx context.Context, name, id string) (bool, error) {
	tx := r.db.WithContext(ctx).Model(&model.BusinessMatter{})
	tx.Distinct("name")
	tx.Where("name = ?", name)
	if id != "" {
		tx.Where("business_matters_id != ?", id)
	}
	var count int64
	result := tx.Count(&count)
	if result.Error != nil {
		return false, result.Error
	}
	if count != 0 {
		return true, nil
	}
	return false, nil
}

func (r *businessMattersRepo) List(ctx context.Context, query *domain_business_matters.ListReqQuery) (businessMatters []*model.BusinessMatter, total int64, err error) {
	limit := query.Limit
	offset := limit * (query.Offset - 1)
	Db := r.db.WithContext(ctx).Model(&model.BusinessMatter{})

	if query.Keyword != "" {
		Db = Db.Where("name like ?", "%"+common.KeywordEscape(query.Keyword)+"%")
	}
	if query.TypeKey != "" {
		Db = Db.Where("type_key = ?", query.TypeKey)
	}

	err = Db.Count(&total).Error
	if err != nil {
		return nil, 0, err
	}

	models := make([]*model.BusinessMatter, 0)
	Db = Db.Limit(int(limit)).Offset(int(offset))

	err = Db.Order(fmt.Sprintf("%s %s, id asc", query.Sort, query.Direction)).Find(&models).Error
	if err != nil {
		return nil, 0, err
	}

	return models, total, nil
}

func (r *businessMattersRepo) ListThird(ctx context.Context, query *domain_business_matters.ListReqQuery) (businessMatters []*model.CssjjBusinessMatter, total int64, err error) {
	db := r.db.WithContext(ctx)
	taskCountSql := "select count(*) from af_configuration.approval_items"
	where := "where 1=1"
	if query.Keyword != "" {
		where = fmt.Sprintf("%s and approval_items.approve_name like '%s'", where, "%"+util.KeywordEscape(query.Keyword)+"%")
	}
	if query.TypeKey != "" {
		where = fmt.Sprintf("%s and approval_items.approve_type_id = '%s'", where, query.TypeKey)
	}
	err = db.Raw(taskCountSql + " " + where).Scan(&total).Error
	if err != nil {
		return nil, 0, err
	}
	if total > 0 {
		sql := "select approval_items.id as id" +
			", approval_items.approve_id AS business_matters_id" +
			", approval_items.approve_name AS name" +
			", approval_items.approve_type_name AS type_key" +
			", approval_items.approve_type_id AS type_key" +
			", approval_items.belong_dept_id AS department_id" +
			", approval_items.belong_dept_name AS department_name" +
			", approval_items.material_quantity AS materials_number" +
			" " +
			"from af_configuration.approval_items"

		where = fmt.Sprintf("%s order by %s %s", where, query.Sort, query.Direction)
		limitWhere := fmt.Sprintf("limit %v offset %v", int(query.Limit), int(query.Limit*(query.Offset-1)))
		err := db.Raw(fmt.Sprintf("%s %s %s", sql, where, limitWhere)).Scan(&businessMatters).Error
		if err != nil {
			return nil, 0, err
		}
		return businessMatters, total, nil
	}

	return nil, 0, nil

}
