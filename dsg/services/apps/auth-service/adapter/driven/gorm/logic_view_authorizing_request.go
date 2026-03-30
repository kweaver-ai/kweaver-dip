package gorm

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/dto"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
)

type LogicViewAuthorizingRequestRepo interface {
	// 创建逻辑视图授权申请，如果缺少 ID 则生成 UUID v7 作为 ID
	Create(ctx context.Context, req *dto.LogicViewAuthorizingRequest) (*dto.LogicViewAuthorizingRequest, error)
	// 更新逻辑视图授权申请
	Update(ctx context.Context, req *dto.LogicViewAuthorizingRequest) (*dto.LogicViewAuthorizingRequest, error)
	// UpdateSuspendPhaseApplyIDProcDefKey(ctx context.Context, id string, suspend bool, phase dto.LogicViewAuthorizingRequestPhase, applyID string, procDefKey string) (*dto.LogicViewAuthorizingRequest, error)
	// 获取逻辑视图授权申请
	Get(ctx context.Context, id string) (*dto.LogicViewAuthorizingRequest, error)
	// 获取逻辑视图授权申请列表
	List(ctx context.Context, opts dto.ListLogicViewAuthorizingRequestOptions) (*dto.LogicViewAuthorizingRequestList, error)
}

// logicViewAuthorizingRequestRepo implements interface
// LogicViewAuthorizingRequestRepo
type logicViewAuthorizingRequestRepo struct {
	db *gorm.DB
}

// NewLogicViewAuthorizingRequestRepo 创建 logicViewAuthorizingRequestRepo
func NewLogicViewAuthorizingRequestRepo(db *gorm.DB) LogicViewAuthorizingRequestRepo {
	return &logicViewAuthorizingRequestRepo{db: db}
}

// Create implements LogicViewAuthorizingRequestRepo.
func (r *logicViewAuthorizingRequestRepo) Create(ctx context.Context, req *dto.LogicViewAuthorizingRequest) (*dto.LogicViewAuthorizingRequest, error) {
	tx := r.db.WithContext(ctx)

	m := &model.LogicViewAuthorizingRequest{}
	if err := dto.LogicViewAuthReqModelUnmarshalDTO(m, req); err != nil {
		return nil, errorcode.Detail(errorcode.InternalError, fmt.Sprintf("unmarshal database model to dto fail: %v", err))
	}

	if err := tx.Create(m).Error; err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, fmt.Sprintf("insert into %v fail: %v", m.TableName(), err))
	}

	return dto.LogicViewAuthReqModelMarshalDTO(m)
}

// Update implements LogicViewAuthorizingRequestRepo.
func (r *logicViewAuthorizingRequestRepo) Update(ctx context.Context, req *dto.LogicViewAuthorizingRequest) (*dto.LogicViewAuthorizingRequest, error) {
	m := new(model.LogicViewAuthorizingRequest)
	if err := dto.LogicViewAuthReqModelUnmarshalDTO(m, req); err != nil {
		return nil, err
	}

	tx := r.db.WithContext(ctx)
	if err := tx.Transaction(func(tx *gorm.DB) (err error) {
		// update record
		if err = tx.Where("id = ?", m.ID).Updates(m).Error; err != nil {
			return
		}
		// get updated record
		if err := tx.Where("id = ?", m.ID).First(m).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return dto.LogicViewAuthReqModelMarshalDTO(m)
}

// UpdateSuspendPhaseApplyIDProcDefKey implements LogicViewAuthorizingRequestRepo.
func (r *logicViewAuthorizingRequestRepo) UpdateSuspendPhaseApplyIDProcDefKey(ctx context.Context, id string, suspend bool, phase dto.LogicViewAuthorizingRequestPhase, applyID string, procDefKey string) (req *dto.LogicViewAuthorizingRequest, err error) {
	tx := r.db.WithContext(ctx)

	m := new(model.LogicViewAuthorizingRequest)
	// get existed record
	if err := tx.Where("id = ?", id).First(m).Error; err != nil {
		return nil, err
	}

	spec := &dto.LogicViewAuthorizingRequestSpec{}
	if err = json.Unmarshal(m.Spec, spec); err != nil {
		return nil, err
	}
	spec.Suspend = suspend
	if m.Spec, err = json.Marshal(spec); err != nil {
		return nil, err
	}

	if err := tx.Transaction(func(tx *gorm.DB) error {
		// update record
		if err := tx.Where("id = ?", id).Updates(&model.LogicViewAuthorizingRequest{
			Spec:       m.Spec,
			Phase:      string(phase),
			ApplyID:    applyID,
			ProcDefKey: procDefKey,
		}).Error; err != nil {
			return err
		}
		// get updated record
		if err := tx.Where("id = ?", id).First(m).Error; err != nil {
			return err
		}
		return nil
	}); err != nil {
		return nil, err
	}

	return dto.LogicViewAuthReqModelMarshalDTO(m)
}

// Get implements LogicViewAuthorizingRequestRepo.
func (r *logicViewAuthorizingRequestRepo) Get(ctx context.Context, id string) (*dto.LogicViewAuthorizingRequest, error) {
	tx := r.db.WithContext(ctx)

	m := &model.LogicViewAuthorizingRequest{ID: id}
	if err := tx.Model(m).Where(m).First(m).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, errorcode.Desc(errorcode.LogicViewAuthorizingRequestNotFound, id)
	} else if err != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, map[string]any{
			"message": "get LogicViewAuthorizingRequest from database fail",
			"sql":     tx.Statement.SQL,
			"err":     err.Error(),
		})
	}
	return dto.LogicViewAuthReqModelMarshalDTO(m)
}

// List implements LogicViewAuthorizingRequestRepo.
func (r *logicViewAuthorizingRequestRepo) List(ctx context.Context, opts dto.ListLogicViewAuthorizingRequestOptions) (list *dto.LogicViewAuthorizingRequestList, err error) {
	tx := r.db.WithContext(ctx)

	tx.Debug()

	if opts.IDs != nil {
		tx = tx.Where("id in ?", opts.IDs)
	}

	if opts.Phases != nil {
		tx = tx.Where("phase in ?", opts.Phases)
	}

	var ms []model.LogicViewAuthorizingRequest
	if err := tx.Find(&ms).Error; err != nil {
		return nil, err
	}

	list = &dto.LogicViewAuthorizingRequestList{Items: make([]dto.LogicViewAuthorizingRequest, len(ms))}
	for i := range ms {
		if err = dto.LogicViewAuthReqModelMarshalDTOInto(&ms[i], &list.Items[i]); err != nil {
			return
		}
	}
	return
}

var _ LogicViewAuthorizingRequestRepo = &logicViewAuthorizingRequestRepo{}
