package gorm

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
	v1 "github.com/kweaver-ai/idrm-go-common/api/auth-service/v1"
)

type APIAuthorizingRequestRepo interface {
	// 创建一个个 APIAuthorizingRequest
	Create(ctx context.Context, request *v1.APIAuthorizingRequest) error
	// 获取指定 ID 的 APIAuthorizingRequest
	Get(ctx context.Context, id string) (*v1.APIAuthorizingRequest, error)
	// MapSubjectToAuthorizedTime 返回访问者对指定接口的最后一次被通过的授权申请
	// 的时间
	//
	//  {
	//      "user:0190c8c1-7000-7d4b-9466-5ce656c028f3": 2024-07-19 10:14:11+08:00,
	//      "user:0190c8c1-7000-7d4f-a67d-fea7c5481c4b": 2024-07-19 10:14:12+08:00,
	//      "user:0190c8c1-7000-7d52-90be-d02d71be89ca": 2024-07-19 10:14:13+08:00,
	//  }
	MapSubjectToAuthorizedTime(ctx context.Context, apiID string) (map[string]time.Time, error)
	// 更新 APIAuthorizingRequest 的 Phase 和 Message
	UpdatePhaseAndMessage(ctx context.Context, req *v1.APIAuthorizingRequest) error
}

type apiAuthorizingRequestRepo struct {
	db *gorm.DB
}

func NewAPIAuthorizingRequestRepo(db *gorm.DB) APIAuthorizingRequestRepo {
	return &apiAuthorizingRequestRepo{db: db}
}

// CreateOne implements APIAuthorizingRequestRepo.
func (r *apiAuthorizingRequestRepo) Create(ctx context.Context, request *v1.APIAuthorizingRequest) error {
	m := &model.APIAuthorizingRequest{}
	if err := m.UnmarshalAPIObject(request); err != nil {
		return err
	}
	return r.db.WithContext(ctx).Debug().Create(m).Error
}

// Get implements APIAuthorizingRequestRepo.
func (r *apiAuthorizingRequestRepo) Get(ctx context.Context, id string) (*v1.APIAuthorizingRequest, error) {
	m := &model.APIAuthorizingRequest{ID: id}
	if err := r.db.WithContext(ctx).Debug().Take(m).Error; errors.Is(err, gorm.ErrRecordNotFound) {
		return nil, ErrNotFound
	} else if err != nil {
		return nil, err
	}
	return m.MarshalAPIObject()
}

// UpdatePhaseAndMessage implements APIAuthorizingRequestRepo.
func (r *apiAuthorizingRequestRepo) UpdatePhaseAndMessage(ctx context.Context, req *v1.APIAuthorizingRequest) error {
	m := &model.APIAuthorizingRequest{
		ID:      req.ID,
		Phase:   string(req.Status.Phase),
		Message: req.Status.Message,
	}

	tx := r.db.WithContext(ctx).Debug().Model(m).
		// 仅更新字段 phase 和 message
		Select("phase", "message").
		Updates(m)

	if tx.RowsAffected == 0 {
		return ErrNotFound
	}
	return tx.Error
}

// MapSubjectToAuthorizedTime implements APIAuthorizingRequestRepo.
func (r *apiAuthorizingRequestRepo) MapSubjectToAuthorizedTime(ctx context.Context, id string) (map[string]time.Time, error) {
	var requests []model.APIAuthorizingRequest

	tx := r.db.WithContext(ctx).Debug()
	tx = tx.Where("phase = ?", v1.APIAuthorizingRequestCompleted)
	tx = tx.Find(&requests)

	if tx.Error != nil {
		return nil, errorcode.Detail(errorcode.PublicDatabaseError, map[string]any{"sql": tx.Statement.SQL, "err": tx.Error.Error()})
	}

	return newMapSubjectToAuthorizedTimeForAPIAuthorizingRequests(requests, id)
}

func newMapSubjectToAuthorizedTimeForAPIAuthorizingRequests(requests []model.APIAuthorizingRequest, id string) (result map[string]time.Time, err error) {
	if requests == nil {
		return
	}

	result = make(map[string]time.Time)
	for _, r := range requests {
		spec := &v1.APIAuthorizingRequestSpec{}
		if err = json.Unmarshal(r.Spec, spec); err != nil {
			return
		}
		// 忽略不是指定的接口
		if spec.ID != id {
			continue
		}
		for _, p := range spec.Policies {
			k := fmt.Sprintf("%s:%s", p.Type, p.ID)
			if t, ok := result[k]; ok && t.After(r.UpdatedAt) {
				continue
			}
			result[k] = r.UpdatedAt
		}
	}
	return
}
