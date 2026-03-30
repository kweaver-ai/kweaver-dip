package gorm

import (
	"context"
	"errors"

	"github.com/google/uuid"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/samber/lo"
	"gorm.io/gorm"
)

type SubServiceRepo interface {
	Create(ctx context.Context, subService *model.SubService) (*model.SubService, error)   // 创建子视图
	Delete(ctx context.Context, id uuid.UUID) error                                        // 删除子视图
	Update(ctx context.Context, subService *model.SubService) (*model.SubService, error)   // 更新子视图
	Get(ctx context.Context, id uuid.UUID) (*model.SubService, error)                      // 获取子视图
	GetServiceID(ctx context.Context, id uuid.UUID) (uuid.UUID, error)                     // 获取指定子视图所属逻辑视图的 ID
	List(ctx context.Context, opts ListOptions) ([]model.SubService, int, error)           // 获取子视图列表
	ListID(ctx context.Context, dataViewID uuid.UUID) ([]uuid.UUID, error)                 // 获取指定ID的子接口列表
	ListSubServices(ctx context.Context, serviceID ...string) (map[string][]string, error) // 通过serviceID批量查询子接口
	CheckRepeat(ctx context.Context, subView *model.SubService) (bool, error)
	IsRepeat(ctx context.Context, subView *model.SubService) error
}

type ListOptions struct {
	ServiceID uuid.UUID `json:"service_id,omitempty"`
	// 页码
	Offset int `form:"offset,default=1" json:"offset,omitempty"`
	// 每页数量
	Limit int `form:"limit,default=10" json:"limit,omitempty"`
}

type subServiceImpl struct {
	db *gorm.DB
}

func NewSubServiceImpl(db *gorm.DB) SubServiceRepo { return &subServiceImpl{db: db} }

// Create implements sub_service.subServiceImpl.
func (s *subServiceImpl) Create(ctx context.Context, subService *model.SubService) (*model.SubService, error) {
	tx := s.db.WithContext(ctx).Debug()

	if err := tx.Create(subService).Error; err != nil {
		return nil, newErrSubServiceDatabaseError(err)
	}

	return subService, nil
}

// Delete implements sub_service.subServiceImpl.
func (s *subServiceImpl) Delete(ctx context.Context, id uuid.UUID) error {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	tx := s.db.WithContext(ctx).Debug()

	tx = tx.Where(&model.SubService{ID: id}).Delete(&model.SubService{})

	if tx.RowsAffected == 0 {
		return newErrSubServiceNotFound(id)
	}

	if tx.Error != nil {
		return newErrSubServiceDatabaseError(tx.Error)
	}

	return nil
}

// CheckRepeat implements sub_view.SubViewRepo.
// 同一个视图下的授权规则不能一样
func (s *subServiceImpl) CheckRepeat(ctx context.Context, subView *model.SubService) (bool, error) {
	tx := s.db.WithContext(ctx).Debug()
	err := tx.Where("service_id=? and name=? and id !=?  and deleted_at=0 ",
		subView.ServiceID, subView.Name, subView.ID).Take(&model.SubService{}).Error
	if err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			return false, nil
		}
		return true, err
	}
	return true, nil
}

// IsRepeat implements sub_view.SubViewRepo.
func (s *subServiceImpl) IsRepeat(ctx context.Context, subView *model.SubService) error {
	isRepeat, err := s.CheckRepeat(ctx, subView)
	if err != nil {
		return errorcode.PublicDatabaseErr.Err()
	}
	if isRepeat {
		return errorcode.SubServiceNameRepeatError.Err()
	}
	return nil
}

// Get implements sub_service.subServiceImpl.
func (s *subServiceImpl) Get(ctx context.Context, id uuid.UUID) (*model.SubService, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	tx := s.db.WithContext(ctx).Debug()

	subService := &model.SubService{ID: id}
	if err := tx.Where(subService).Take(subService).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, newErrSubServiceNotFound(id)
	} else if err != nil {
		return nil, newErrSubServiceDatabaseError(err)
	}

	return subService, nil
}

// GetServiceID implements sub_service.subServiceImpl.
func (s *subServiceImpl) GetServiceID(ctx context.Context, id uuid.UUID) (uuid.UUID, error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	subService := &model.SubService{ID: id}
	tx := s.db.WithContext(ctx).Select("logic_view_id").Where(subService).Take(subService)
	if errors.Is(tx.Error, gorm.ErrRecordNotFound) {
		return uuid.Nil, newErrSubServiceNotFound(id)
	} else if tx.Error != nil {
		return uuid.Nil, newErrSubServiceDatabaseError(tx.Error)
	}

	return subService.ServiceID, nil
}

// List implements sub_service.subServiceImpl.
func (s *subServiceImpl) List(ctx context.Context, opts ListOptions) ([]model.SubService, int, error) {
	tx := s.db.WithContext(ctx).Debug().Order("name")

	// 根据子视图所属的逻辑视图过滤
	if opts.ServiceID != uuid.Nil {
		tx = tx.Where(&model.SubService{ServiceID: opts.ServiceID})
	}

	// 查询记录条数
	var count int64
	tx = tx.Model(&model.SubService{}).Count(&count)
	if tx.Error != nil {
		return nil, 0, newErrSubServiceDatabaseError(tx.Error)
	}

	// 分页查询条件
	if opts.Limit != 0 {
		tx = tx.Limit(opts.Limit)
		if opts.Offset != 0 {
			tx = tx.Offset((opts.Offset - 1) * opts.Limit)
		}
	}

	// 查询
	var subServices []model.SubService
	tx = tx.Find(&subServices)
	if tx.Error != nil {
		return nil, 0, newErrSubServiceDatabaseError(tx.Error)
	}

	return subServices, int(count), nil
}

// ListID implements sub_service.subServiceImpl.
// 获取指定逻辑视图的子视图（行列规则） ID 列表，如果未指定逻辑视图则返回所有子接口
func (s *subServiceImpl) ListID(ctx context.Context, serviceID uuid.UUID) ([]uuid.UUID, error) {
	tx := s.db.WithContext(ctx)

	tx = tx.Model(&model.SubService{}).Select("id")

	if serviceID != uuid.Nil {
		tx = tx.Where(&model.SubService{ServiceID: serviceID})
	}

	var subServiceIDs []uuid.UUID
	tx = tx.Find(&subServiceIDs)
	if tx.Error != nil {
		return nil, newErrSubServiceDatabaseError(tx.Error)
	}

	return subServiceIDs, nil
}

// ListSubServices implements sub_service.SubViewRepo.
func (s *subServiceImpl) ListSubServices(ctx context.Context, serviceID ...string) (map[string][]string, error) {
	tx := s.db.WithContext(ctx)

	tx = tx.Model(&model.SubService{})

	if len(serviceID) > 0 {
		tx = tx.Where(" service_id in ? ", serviceID)
	}
	subServices := make([]*model.SubService, 0)
	tx = tx.Find(&subServices)
	if tx.Error != nil {
		return nil, newErrSubServiceDatabaseError(tx.Error)
	}

	subServiceGroup := lo.GroupBy(subServices, func(item *model.SubService) string {
		return item.ServiceID.String()
	})
	return lo.MapEntries(subServiceGroup, func(key string, value []*model.SubService) (string, []string) {
		return key, lo.Uniq(lo.Times(len(value), func(index int) string {
			return value[index].ID.String()
		}))
	}), nil
}

// Update implements sub_service.subServiceImpl.
func (s *subServiceImpl) Update(ctx context.Context, subService *model.SubService) (result *model.SubService, err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer span.End()

	tx := s.db.WithContext(ctx).Debug()

	if err := tx.Transaction(func(tx *gorm.DB) error {
		tx = tx.Where(&model.SubService{ID: subService.ID})

		// 检查 SubService 是否已经存在
		var count int64
		if err := tx.Model(&model.SubService{}).Count(&count).Error; err != nil {
			return newErrSubServiceDatabaseError(err)
		}
		if count == 0 {
			return newErrSubServiceNotFound(subService.ID)
		}

		// 更新记录 name, form_view_id, detail
		if err := tx.Updates(&model.SubService{
			Name:            subService.Name,
			ServiceID:       subService.ServiceID,
			Detail:          subService.Detail,
			AuthScopeID:     subService.AuthScopeID,
			RowFilterClause: subService.RowFilterClause,
		}).Error; err != nil {
			return newErrSubServiceDatabaseError(err)
		}
		// 获取更新之后的记录
		result = &model.SubService{}
		if err := tx.Where(&model.SubService{ID: subService.ID}).First(result).Error; err != nil {
			return newErrSubServiceDatabaseError(err)
		}

		return nil
	}); err != nil {
		return nil, err
	}

	return
}
