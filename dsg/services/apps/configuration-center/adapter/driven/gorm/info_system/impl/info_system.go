package impl

import (
	"context"
	"errors"
	"fmt"
	"strings"

	"github.com/kweaver-ai/idrm-go-frame/core/store/gormx"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/common"
	info_system "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/info_system"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/models/request"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/info_system"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model/query"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gen/field"
	"gorm.io/gorm"
	"gorm.io/gorm/clause"
)

type infoSystemRepo struct {
	q  *query.Query
	db *gorm.DB
}

func NewInfoSystemRepo(db *gorm.DB) info_system.Repo {
	return &infoSystemRepo{
		q:  common.GetQuery(db),
		db: db,
	}
}

func (d *infoSystemRepo) ListByPaging(ctx context.Context, pageInfo *request.PageInfo, keyword string) (res []*model.InfoSystem, total int64, err error) {
	infoSystemDo := d.q.InfoSystem
	do := infoSystemDo.WithContext(ctx)
	if len(keyword) > 0 {
		do = do.Where(infoSystemDo.Name.Like("%" + common.KeywordEscape(keyword) + "%"))
	}

	total, err = do.Count()
	if err != nil {
		log.Error("failed to get datasources count from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	if pageInfo.Limit > 0 {
		limit := pageInfo.Limit
		offset := limit * (pageInfo.Offset - 1)
		do = do.Limit(limit).Offset(offset)
	}

	var orderField field.OrderExpr
	if pageInfo.Sort == constant.SortByCreatedAt {
		orderField = infoSystemDo.CreatedAt
	} else {
		orderField = infoSystemDo.UpdatedAt
	}

	var orderCond field.Expr
	if pageInfo.Direction == "asc" {
		orderCond = orderField
	} else {
		orderCond = orderField.Desc()
	}

	do = do.Order(orderCond)

	models, err := do.Find()
	if err != nil {
		log.Error("failed to get InfoStstem from db", zap.Error(err))
		return nil, 0, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}

	return models, total, nil
}
func (d *infoSystemRepo) ListByPagingNew(ctx context.Context, req *domain.QueryPageReqParam) (res []*model.InfoSystemObjectUser, total int64, err error) {
	do := d.q.InfoSystem.WithContext(ctx).UnderlyingDB().WithContext(ctx).Table("info_system as i").Select("i.*,h.name as department_name, h.path as department_path,j.name as js_department_name, j.path as js_department_path, u.name as updated_user_name").
		Joins("left join `object` as h on i.`department_id` = h.`id` and i.`deleted_at`=0 and i.`department_id` is not null  ").
		Joins("left join `object` as j on i.`js_department_id` = j.`id` and i.`deleted_at`=0  and i.`js_department_id` is not null ").
		Joins("left join `user` as u on i.`updated_by_uid` = u.`id` and i.`deleted_at`=0  ").
		Where(" i.`deleted_at`=0  ")
	if len(req.Keyword) > 0 {
		do = do.Where(" i.`name` like ? ", "%"+common.KeywordEscape(req.Keyword)+"%")
	}
	if req.DepartmentId != "" {
		ids := make([]string, 0)
		err = d.db.WithContext(ctx).Model(model.Object{}).Select("id").Where("path_id like ?", "%"+req.DepartmentId+"%").Find(&ids).Error
		if err != nil {
			log.Error(err.Error())
		}
		if len(ids) == 0 {
			return make([]*model.InfoSystemObjectUser, 0), 0, nil
		}
		do = do.Where(" i.`department_id` in ? ", ids)
	}
	if req.JsDepartmentId != "" {
		jsIds := make([]string, 0)
		err = d.db.WithContext(ctx).Model(model.Object{}).Select("id").Where("path_id like ?", "%"+req.JsDepartmentId+"%").Find(&jsIds).Error
		if err != nil {
			log.Error(err.Error())
		}
		if len(jsIds) == 0 {
			return make([]*model.InfoSystemObjectUser, 0), 0, nil
		}
		do = do.Where(" i.`js_department_id` in ? ", jsIds)
	}

	if req.IsRegisterGateway == "true" {
		do = do.Where(" i.`is_register_gateway` = ? ", domain.RegisteGateway)
	}
	if req.IsRegisterGateway == "false" {
		do = do.Where(" i.`is_register_gateway` = ? ", domain.NotRegisteGateway)
	}

	total, err = gormx.RawCount(do)
	if err != nil {
		return
	}
	if *req.Sort == "name" {
		do = do.Order(fmt.Sprintf(" i.name %s,i.id asc", *req.Direction))
	} else {
		do = do.Order(fmt.Sprintf("i.%s %s,i.id asc", *req.Sort, *req.Direction))
	}

	do = do.Offset((*req.Offset - 1) * *req.Limit).Limit(*req.Limit)

	res, err = gormx.RawScan[*model.InfoSystemObjectUser](do)
	return
}
func (d *infoSystemRepo) ListOrderByInfoStstemID(ctx context.Context, firstInfoStstemID uint64, limit int) ([]model.InfoSystem, error) {
	var result []model.InfoSystem
	tx := d.q.InfoSystem.WithContext(ctx).
		UnderlyingDB().
		Unscoped().
		Order(clause.OrderByColumn{Column: clause.Column{Name: "info_ststem_id"}}).
		Where(clause.Gte{Column: clause.Column{Name: "info_ststem_id"}, Value: firstInfoStstemID}).
		Limit(limit).
		Find(&result)
	if tx.Error != nil || tx.RowsAffected == 0 {
		return nil, tx.Error
	}
	return result, nil
}

func (d *infoSystemRepo) GetByID(ctx context.Context, id string) (*model.InfoSystem, error) {
	infoSystemDo := d.q.InfoSystem
	infoSystem, err := infoSystemDo.WithContext(ctx).Where(infoSystemDo.ID.Eq(id)).Take()
	if err != nil {
		if is := errors.Is(err, gorm.ErrRecordNotFound); is {
			return nil, errorcode.Detail(errorcode.InfoSystemNotExist, err)
		}
		log.Error("failed to get info_system from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return infoSystem, nil
}
func (d *infoSystemRepo) GetByIDs(ctx context.Context, ids []string) ([]*model.InfoSystem, error) {
	infoSystemDo := d.q.InfoSystem
	infoSystems, err := infoSystemDo.WithContext(ctx).Where(infoSystemDo.ID.In(ids...)).Find()
	if err != nil {
		log.Error("failed to get info_systems from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return infoSystems, nil
}

func (d *infoSystemRepo) GetByNames(ctx context.Context, names []string) ([]*model.InfoSystem, error) {
	infoSystemDo := d.q.InfoSystem
	infoSystems, err := infoSystemDo.WithContext(ctx).Where(infoSystemDo.Name.In(names...)).Find()
	if err != nil {
		log.Error("failed to get info_systems from db", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return infoSystems, nil
}

func (d *infoSystemRepo) Insert(ctx context.Context, infoSystem *model.InfoSystem) error {
	if err := d.q.InfoSystem.WithContext(ctx).Create(infoSystem); err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return errorcode.Detail(errorcode.InfoSystemNameExistInfoSystem, err.Error())
		}
		log.Error("failed to Insert info_system to db", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *infoSystemRepo) Inserts(ctx context.Context, infoSystems []*model.InfoSystem) error {
	if err := d.q.InfoSystem.WithContext(ctx).CreateInBatches(infoSystems, common.DefaultBatchSize); err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return errorcode.Detail(errorcode.InfoSystemNameExistInfoSystem, err.Error())
		}
		log.Error("failed to Insert info_system to db", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *infoSystemRepo) Update(ctx context.Context, infoSystem *model.InfoSystem) error {
	do := d.q.InfoSystem
	res, err := do.WithContext(ctx).Where(do.ID.Eq(infoSystem.ID)).Updates(infoSystem)
	if err != nil {
		if strings.Contains(err.Error(), "Duplicate entry") {
			return errorcode.Detail(errorcode.InfoSystemNameExistInfoSystem, err.Error())
		}
		log.Error("failed to Update info_system to db", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if res.Error != nil {
		log.Error("failed to Update info_system to db info.Error", zap.Error(res.Error))
		return errorcode.Detail(errorcode.PublicDatabaseError, res.Error.Error())
	}
	return nil
}

func (d *infoSystemRepo) Delete(ctx context.Context, infoSystem *model.InfoSystem) (err error) {
	db := d.q.InfoSystem.WithContext(ctx).UnderlyingDB()
	err = db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		if err = tx.WithContext(ctx).Where("id =?", infoSystem.ID).Delete(infoSystem).Error; err != nil {
			log.Error("failed to Delete info_system to db", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		if err = tx.Exec("UPDATE datasource SET info_system_id = ?  WHERE info_system_id = ?", "", infoSystem.ID).Error; err != nil {
			log.Error("failed to Delete info_system to db", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}
		return nil
	})
	if err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *infoSystemRepo) NameExistCheck(ctx context.Context, name string, ids ...string) (bool, error) {
	infoSystemDo := d.q.InfoSystem
	do := infoSystemDo.WithContext(ctx)
	if len(ids) > 0 {
		do = do.Where(infoSystemDo.ID.NotIn(ids...))
	}
	var cnt int64
	cnt, err := do.Where(infoSystemDo.Name.Eq(name)).Limit(1).Count()
	if err != nil {
		log.Error("failed to NameExistCheck info_system count from db", zap.Error(err))
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return cnt > 0, nil
}

type BusinessSystem struct {
	ID   string `gorm:"column:id" json:"id"`
	Name string `gorm:"column:name" json:"name"`
}

func (d *infoSystemRepo) GetBusinessSystem(ctx context.Context) ([]*model.Object, error) {
	do := d.q.Object
	find, err := do.WithContext(ctx).Where(do.Type.Eq(3)).Find()
	if err != nil {
		log.Error("failed to GetBusinessSystem Find", zap.Error(err))
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return find, nil
}

func (d *infoSystemRepo) DeleteBusinessSystem(ctx context.Context) error {
	do := d.q.Object
	info, err := do.WithContext(ctx).Where(do.Type.Eq(3)).Delete(&model.Object{})
	if err != nil {
		log.Error("failed to DeleteBusinessSystem", zap.Error(err))
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	if info.Error != nil {
		log.Error("failed to DeleteBusinessSystemb info.Error", zap.Error(info.Error))
		return errorcode.Detail(errorcode.PublicDatabaseError, info.Error.Error())
	}
	return nil
}

func (d *infoSystemRepo) RegisterInfoSystem(ctx context.Context, infoSystem *model.InfoSystem, registers []*model.LiyueRegistration) error {
	if err := d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) (err error) {
		if err := tx.Table(model.TableNameInfoSystem).Updates(infoSystem).Error; err != nil {
			log.WithContext(ctx).Error("Updates info_system", zap.Error(tx.Error))
			return err
		}
		register := &model.LiyueRegistration{}
		if err = tx.Table(model.TableNameLiyueRegistration).Where("liyue_id =?", infoSystem.ID).Delete(register).Error; err != nil {
			log.Error("failed to Delete liyue_registrations ", zap.Error(err))
			return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
		}

		if registers != nil {
			if err := tx.Table(model.TableNameLiyueRegistration).Create(&registers).Error; err != nil {
				log.WithContext(ctx).Error("Updates info_system", zap.Error(tx.Error))
				return err
			}
		}
		return nil
	}); err != nil {
		return errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return nil
}

func (d *infoSystemRepo) CheckSystemIdentifierRepeat(ctx context.Context, identifier, id string) (isRepeat bool, err error) {
	model := new(model.InfoSystem)
	Db := d.db.WithContext(ctx).Debug()
	if id == "" {
		err = Db.Where("system_identifier=?", identifier).Take(model).Error
	} else {
		err = Db.Where("system_identifier=? and info_ststem_id<>?", identifier, id).Take(model).Error
	}
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return false, errorcode.Detail(errorcode.PublicDatabaseError, err.Error())
	}
	return true, nil
}

func (d *infoSystemRepo) GetAllByIDS(ctx context.Context, ids []string) (models []*info_system.InfoSystemRegister, err error) {
	Db := d.db.WithContext(ctx).Table("info_system as i").Debug().Select("i.*,h.name as department_name, h.path as department_path").
		Joins("left join `object` as h on i.`department_id` = h.`id` and i.`deleted_at`=0  ").
		Where("i.`id` in ?", ids)

	models, err = gormx.RawScan[*info_system.InfoSystemRegister](Db.Debug())
	if err != nil {
		return nil, err
	}
	return models, nil
}

func (d *infoSystemRepo) GetAllByDepartmentId(ctx context.Context, departmentId string) (models []*model.InfoSystem, err error) {
	err = d.db.WithContext(ctx).Where("department_id=?", departmentId).Find(&models).Error
	return

}
