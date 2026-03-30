package gorm

import (
	"context"
	_ "embed"

	"gorm.io/gorm"

	"github.com/kweaver-ai/dsg/services/apps/auth-service/infrastructure/repository/db/model"
)

type SubViewRepo interface {
	Get(ctx context.Context, id string) (*model.SubView, error)
	// 获取子视图（行列）的名称及所属逻辑视图的 Owner
	//
	// Deprecated: use Get instead.
	GetNameAndDataViewOwner(ctx context.Context, subViewID string) (*model.SubViewWithNameAndDataViewOwner, error)
	// 获取子视图（行列）的名称和所属逻辑视图的 ID 和名称
	GetNameAndDataViewIDAndBusinessName(ctx context.Context, id string) (*model.SubViewWithNameAndDataViewIDAndName, error)
}

type subViewRepo struct {
	db *gorm.DB
}

func NewSubViewRepo(db *gorm.DB) SubViewRepo { return &subViewRepo{db: db} }

// Get implements SubViewRepo.
func (r *subViewRepo) Get(ctx context.Context, id string) (*model.SubView, error) {
	result := &model.SubView{ID: id}
	if err := r.db.WithContext(ctx).Take(result).Error; err != nil {
		return nil, err
	}
	return result, nil
}

const sqlGetSubViewNameAndOwner = `
SELECT
	sub_views.id,
	sub_views.name,
	form_view.owner_id AS data_view_owner_id,
	user.name AS data_view_owner_name
FROM
	sub_views
LEFT JOIN
	form_view on sub_views.logic_view_id = form_view.id
LEFT JOIN
	user on form_view.owner_id = user.id
WHERE
	sub_views.id = ?
	AND sub_views.deleted_at = 0
`

// GetNameAndDataViewOwner implements SubViewRepo.
func (r *subViewRepo) GetNameAndDataViewOwner(ctx context.Context, subViewID string) (*model.SubViewWithNameAndDataViewOwner, error) {
	var result model.SubViewWithNameAndDataViewOwner
	tx := r.db.WithContext(ctx).
		Raw(sqlGetSubViewNameAndOwner, subViewID).
		Scan(&result)
	if tx.RowsAffected == 0 {
		return nil, ErrNotFound
	} else if tx.Error != nil {
		return nil, newPublicDatabaseError(tx)
	}
	return &result, nil
}

//go:embed sub_views_get_name_and_data_view_id_and_business_name.sql
var SQLGetNameAndDataViewIDAndBusinessName string

// GetNameAndDataViewIDAndBusinessName implements SubViewRepo.
func (r *subViewRepo) GetNameAndDataViewIDAndBusinessName(ctx context.Context, id string) (*model.SubViewWithNameAndDataViewIDAndName, error) {
	var result model.SubViewWithNameAndDataViewIDAndName
	tx := r.db.WithContext(ctx).Raw(SQLGetNameAndDataViewIDAndBusinessName, id).Scan(&result)
	if tx.RowsAffected == 0 {
		return nil, ErrNotFound
	} else if tx.Error != nil {
		return nil, newPublicDatabaseError(tx)
	}
	return &result, nil
}
