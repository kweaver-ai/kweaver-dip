package impl

import (
	"context"

	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/register"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
	"gorm.io/gorm"

	register "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/register"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) register.UseCase {
	return &Repo{db: db}
}

// implement register.UseCase
func (r *Repo) RegisterUser(ctx context.Context, req *domain.RegisterReq) error {
	return r.db.WithContext(ctx).Create(req).Error
}

// implement register.UseCase
func (r *Repo) GetRegisterInfo(ctx context.Context, req *domain.ListUserReq) ([]*domain.RegisterReq, int64, error) {
	var list []*domain.RegisterReq
	var total int64
	db := r.db.Model(&domain.RegisterReq{}).Where("is_deleted ='' or is_deleted ='0'")
	if req.Name != "" {
		db = db.Where("name LIKE ?", "%"+req.Name+"%")
	}
	if req.DepartmentID != "" {
		db = db.Where("department_id = ?", req.DepartmentID)
	}
	db.Count(&total)
	if req.Direction != "" && req.Sort != "" {
		// 排序
		db = db.Order(req.Sort + " " + req.Direction)
	} else {
		// 默认排序
		db = db.Order("created_at desc")
	}
	err := db.Offset((req.Offset - 1) * req.Limit).Limit(req.Limit).Find(&list).Error
	//打印sql
	/*sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Count(&total)
	})
	log.Info("Generated SQL for count", zap.String("sql", sql))*/
	return list, total, err
}

/*func (r *Repo) GetUserList(ctx context.Context, req *domain.ListReq) ([]*domain.User, int64, error) {
	var list []*domain.User
	var total int64

	// 构建基础查询
	db := r.db.Model(&domain.RegisterReq{}).
		Select(`
			user.*,
			CASE WHEN register_req.user_id IS NOT NULL THEN true ELSE false END AS is_register
		`).
		Joins("RIGHT JOIN user ON user.id = register_req.user_id").
		Where("register_req.is_deleted = '' OR register_req.is_deleted = '0'")

	// 按名称过滤

	// 打印最终生成的 SQL（不带参数）
	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Count(&total)
	})
	log.Info("Generated SQL for count", zap.String("sql", sql))

	// 统计总数
	db.Count(&total)

	// 排序
	if req.Direction != "" && req.Sort != "" {
		db = db.Order(req.Sort + " " + req.Direction)
	} else {
		db = db.Order("register_req.updated_at desc")
	}

	// 分页查询
	// 打印分页查询 SQL
	sql = db.Session(&gorm.Session{}).ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Offset((req.Offset - 1) * req.Limit).Limit(req.Limit).Find(&list)
	})
	log.Info("Generated SQL for query", zap.String("sql", sql))

	// 实际执行查询
	err := db.Offset((req.Offset - 1) * req.Limit).
		Limit(req.Limit).
		Find(&list).Error

	return list, total, err
}*/

func (r *Repo) GetUserList(ctx context.Context, req *domain.ListReq) ([]*domain.User, int64, error) {
	var list []*domain.User
	var total int64

	// 构建基础查询：主表改为 user，LEFT JOIN register_req
	db := r.db.Model(&domain.User{}).
		Select(`
			user.id AS user_id,
			user.name AS user_name,
			user.login_name,
			user.phone_number AS phone,
			user.mail_address AS mail,
			CASE WHEN principal_registrations.user_id IS NOT NULL THEN true ELSE false END AS is_register,
			principal_registrations.id AS register_id,
			principal_registrations.department_id
		`).
		Joins("LEFT JOIN principal_registrations ON principal_registrations.user_id = user.id  ")

	// 打印总数 SQL 用于调试
	sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Count(&total)
	})
	log.Info("Generated SQL for count", zap.String("sql", sql))

	if req.Name != "" {
		db = db.Where("user.name LIKE ?", "%"+req.Name+"%")
	}
	/*if req.Department != "" {
		db = db.Where("principal_registrations.department_id = ?", req.Department)
	}*/

	// 获取总数
	db.Count(&total)

	// 排序
	db = db.Order("user.updated_at desc")

	// 分页查询
	sql = db.Session(&gorm.Session{}).ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Offset((req.Offset - 1) * req.Limit).Limit(req.Limit).Find(&list)
	})
	log.Info("Generated SQL for query", zap.String("sql", sql))

	// 实际执行查询
	err := db.Offset((req.Offset - 1) * req.Limit).
		Limit(req.Limit).
		Scan(&list).Error // 使用 Scan 而不是 Find，因为返回的是非结构体映射

	return list, total, err
}

func (r *Repo) GetUserInfo(ctx context.Context, req *domain.IDPath) (*domain.RegisterReq, error) {
	var info domain.RegisterReq
	err := r.db.Where("id = ?", req.ID).First(&info).Error
	return &info, err
}

func (r *Repo) UserUnique(ctx context.Context, req *domain.UserUniqueReq) (bool, error) {
	var count int64
	err := r.db.Table("principal_registrations").Where("name = ?", req.Name).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repo) OrganizationRegister(ctx context.Context, req *domain.LiyueRegisterReq) error {
	return r.db.WithContext(ctx).Create(req).Error
}

func (r *Repo) OrganizationUpdate(ctx context.Context, req *domain.LiyueRegisterReq) error {
	return r.db.WithContext(ctx).Where("id = ?", req.ID).Updates(req).Error
}

func (r *Repo) OrganizationList(ctx context.Context, req *domain.ListReq) ([]*domain.OrganizationRegisterReq, int64, error) {
	var list []*domain.OrganizationRegisterReq
	var total int64
	db := r.db.Model(&domain.OrganizationRegisterReq{})
	db.Count(&total)
	if req.Department != "" {
		db = db.Where("organization_name LIKE ?", "%"+req.Department+"%")
	}
	if req.Direction != "" && req.Sort != "" {
		// 排序
		db = db.Order(req.Sort + " " + req.Direction)
	} else {
		// 默认排序
		db = db.Order("created_at desc")
	}
	err := db.Offset((req.Offset - 1) * req.Limit).Limit(req.Limit).Find(&list).Error
	//打印sql
	/*sql := db.ToSQL(func(tx *gorm.DB) *gorm.DB {
		return tx.Count(&total)
	})
	log.Info("Generated SQL for count", zap.String("sql", sql))*/
	return list, total, err
}

func (r *Repo) IsOrganizationRegistered(ctx context.Context, id string) (bool, error) {
	var count int64
	err := r.db.Table("organization_registrations").Where("organization_id = ?", id).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repo) IsOrganizationUnique(ctx context.Context, req *domain.OrganizationUniqueReq) (bool, error) {
	var count int64
	err := r.db.Table("organization_registrations").Where("organization_name = ?", req.OrganizationName).Count(&count).Error
	if err != nil {
		return false, err
	}
	return count > 0, nil
}

func (r *Repo) GetOrganizationInfo(ctx context.Context, id string) (*domain.LiyueRegisterReq, error) {
	var info domain.LiyueRegisterReq
	err := r.db.Where("liyue_id = ?", id).First(&info).Error
	return &info, err
}

func (r *Repo) OrganizationDelete(ctx context.Context, id string) error {
	return r.db.Where("liyue_id = ?", id).Delete(&domain.LiyueRegisterReq{}).Error
}
