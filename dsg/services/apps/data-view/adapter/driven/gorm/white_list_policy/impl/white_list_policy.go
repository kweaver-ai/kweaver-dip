package impl

import (
	"context"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"fmt"
	"strings"

	//"github.com/kweaver-ai/idrm-go-common/errorcode"
	//my_errorcode "github.com/kweaver-ai/dsg/services/apps/data-view/common/errorcode"
	//"errors"
	//"fmt"
	//"time"

	//"go.uber.org/zap"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/white_list_policy"
	"gorm.io/gorm"
	//"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	//"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	//"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type whiteListPolicyRepo struct {
	db *gorm.DB
}

func NewWhiteListPolicyRepo(db *gorm.DB) white_list_policy.WhiteListPolicyRepo {
	return &whiteListPolicyRepo{db: db}
}

func (d *whiteListPolicyRepo) GetWhiteListPolicyList(ctx context.Context) (whiteListPolicy []*model.WhiteListPolicy, err error) {
	err = d.db.WithContext(ctx).Table(model.TableNameWhiteListPolicy).Find(&whiteListPolicy).Error
	return
}

func (d *whiteListPolicyRepo) GetWhiteListPolicyListByCondition(ctx context.Context, req *form_view.GetWhiteListPolicyListReq) (total int64, whiteListPolicy []*model.WhiteListPolicy, err error) {
	var db *gorm.DB
	db = d.db.WithContext(ctx).Table("white_list_policy w").Where("w.deleted_at=0").Joins("INNER JOIN form_view f  ON w.form_view_id = f.id") //deleted_at=0
	db = db.Where("f.deleted_at = 0")
	if req.DatasourceID != "" {
		db = db.Where("f.datasource_id = ?", req.DatasourceID)
	}

	if req.SubjectID != "" && req.SubjectID != constant.UnallocatedId {
		db = db.Where("f.subject_id = ?", req.SubjectID)
	}

	if req.DepartmentID != "" && req.DepartmentID != constant.UnallocatedId {
		db = db.Where("f.department_id = ?", req.DepartmentID)
	}

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("f.technical_name like ? or f.business_name like ? or f.uniform_catalog_code like ?", keyword, keyword, keyword)
	}
	err = db.Count(&total).Error
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}

	if req.Sort == "form_view_name" {
		db = db.Order(fmt.Sprintf(" f.business_name %s", req.Direction))
	} else {
		db = db.Order(fmt.Sprintf(" %s %s ", req.Sort, req.Direction))
	}

	err = db.Find(&whiteListPolicy).Error
	return total, whiteListPolicy, err
}

func (d *whiteListPolicyRepo) GetWhiteListPolicyDetail(ctx context.Context, id string) (whiteListPolicy *model.WhiteListPolicy, err error) {
	err = d.db.WithContext(ctx).Table(model.TableNameWhiteListPolicy).Where("id =? and deleted_at=0", id).Take(&whiteListPolicy).Error
	return
}

func (d *whiteListPolicyRepo) CreateWhiteListPolicy(ctx context.Context, whiteListPolicy *model.WhiteListPolicy) error {
	return d.db.WithContext(ctx).Create(whiteListPolicy).Error

}

func (d *whiteListPolicyRepo) UpdateWhiteListPolicy(ctx context.Context, whiteListPolicy *model.WhiteListPolicy) error {
	return d.db.WithContext(ctx).Table(model.TableNameWhiteListPolicy).Where("id=?", whiteListPolicy.ID).Updates(whiteListPolicy).Error
}
func (d *whiteListPolicyRepo) DeleteWhiteListPolicy(ctx context.Context, id string, userid string) error {
	return d.db.WithContext(ctx).Table(model.TableNameWhiteListPolicy).Where("id=?", id).Updates(model.WhiteListPolicy{UpdatedByUID: userid, DeletedAt: 1}).Error
}

func (d *whiteListPolicyRepo) GetWhiteListPolicyListByFormView(ctx context.Context, formViewIDs []string) (whiteListPolicy []*model.WhiteListPolicy, err error) {
	err = d.db.WithContext(ctx).Table(model.TableNameWhiteListPolicy).Where("form_view_id in (?) and deleted_at=0", formViewIDs).Find(&whiteListPolicy).Error
	return
}

func (d *whiteListPolicyRepo) GetWhiteListPolicyByFormView(ctx context.Context, formViewID string) (whiteListPolicy *model.WhiteListPolicy, err error) {
	err = d.db.WithContext(ctx).Table(model.TableNameWhiteListPolicy).Where("form_view_id =? and deleted_at=0", formViewID).Take(&whiteListPolicy).Error
	return
}
