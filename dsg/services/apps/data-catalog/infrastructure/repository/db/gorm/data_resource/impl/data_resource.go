package impl

import (
	"context"
	"fmt"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/common/constant"
	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/data_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/gorm/data_resource"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"gorm.io/gorm"
)

type DataResourceRepo struct {
	db *gorm.DB
}

func NewDataResourceRepo(db *gorm.DB) data_resource.DataResourceRepo {
	return &DataResourceRepo{db: db}
}

func (d *DataResourceRepo) Create(ctx context.Context, dataResource *model.TDataResource) error {
	return d.db.WithContext(ctx).Create(dataResource).Error
}

func (d *DataResourceRepo) Update(ctx context.Context, dataResource *model.TDataResource) error {
	return d.db.WithContext(ctx).Where("id=?", dataResource.ID).Updates(dataResource).Error
}
func (d *DataResourceRepo) SyncViewSelect(ctx context.Context, dataResource *model.TDataResource) error {
	return d.db.WithContext(ctx).Select("name", "department_id", "subject_id", "publish_at", "status").Where("id=?", dataResource.ID).Updates(dataResource).Error
}
func (d *DataResourceRepo) Save(ctx context.Context, dataResource *model.TDataResource) error {
	return d.db.WithContext(ctx).Save(dataResource).Error
}
func (d *DataResourceRepo) UpdateInterfaceCount(ctx context.Context, resourceId string, increment int) error {
	//return d.db.WithContext(ctx).Select("has_interface").Where("resource_id=?", dataResource.ResourceId).Updates(dataResource).Error
	return d.db.Model(&model.TDataResource{}).
		Where("resource_id = ?", resourceId).
		Update("interface_count", gorm.Expr("interface_count + ?", increment)).Error
}
func (d *DataResourceRepo) Delete(ctx context.Context, dataResource *model.TDataResource) error {
	return d.db.WithContext(ctx).Delete(dataResource).Error
}
func (d *DataResourceRepo) CreateInBatches(ctx context.Context, dataResource []*model.TDataResource) error {
	return d.db.WithContext(ctx).CreateInBatches(&dataResource, len(dataResource)).Error
}

func (d *DataResourceRepo) DeleteByResourceId(ctx context.Context, resourceId []string) error {
	return d.db.WithContext(ctx).Where("resource_id in (?)", resourceId).Delete(&model.TDataResource{}).Error
}

func (d *DataResourceRepo) DeleteTransaction(ctx context.Context, resourceId string) (err error) {
	if err = d.db.WithContext(ctx).Transaction(func(tx *gorm.DB) error {
		resource := make([]*model.TDataResource, 0)
		if err = tx.Where("resource_id=?", resourceId).Find(&resource).Error; err != nil {
			return err
		}
		for _, r := range resource {
			if r.CatalogID == 0 {
				if err = tx.Where("resource_id=?", resourceId).Delete(&model.TDataResource{}).Error; err != nil {
					return err
				}
				if err = tx.Table("t_data_resource_history").Create(resource).Error; err != nil {
					return err
				}
			}
			if r.CatalogID != 0 {
				if err = tx.Model(&model.TDataResource{}).Where("resource_id=?", resourceId).UpdateColumn("status", constant.ReSourceTypeDelete).Error; err != nil {
					return err
				}
			}
		}

		return nil
	}); err != nil {
		return err
	}
	return
}

func (d *DataResourceRepo) GetCount(ctx context.Context, req *domain.GetCountReq) (res *domain.GetCountRes, err error) {
	res = &domain.GetCountRes{}
	err = d.db.WithContext(ctx).Table("t_data_resource").Where("catalog_id = 0 and   type !=2 ").Count(&res.NotCatalogCount).Error //未编目
	if err != nil {
		return
	}
	tx := d.db.WithContext(ctx).Table("t_data_catalog").Where("draft_id!=?", constant.DraftFlag)
	if len(req.OnlineStatus) == 1 {
		tx = tx.Where("online_status = ?", req.OnlineStatus[0])
	} else if len(req.OnlineStatus) > 1 {
		tx = tx.Where("online_status in ?", req.OnlineStatus)
	}

	if len(req.PublishStatus) == 1 {
		tx = tx.Where("publish_status = ?", req.PublishStatus[0])
	} else if len(req.PublishStatus) > 1 {
		tx = tx.Where("publish_status in ?", req.PublishStatus)
	}

	err = tx.Count(&res.DoneCatalogCount).Error //已编目
	if err != nil {
		return
	}
	if len(req.MyDepartmentIDs) > 0 {
		err = d.db.WithContext(ctx).Where("draft_id!=? and department_id in ?", constant.DraftFlag, req.MyDepartmentIDs).Table("t_data_catalog").Count(&res.DepartCatalogCount).Error //数据目录数量
		if err != nil {
			return
		}
	}

	return
}
func (d *DataResourceRepo) GetDataResourceList(ctx context.Context, req *domain.DataResourceInfoReq) (total int64, dataResource []*model.TDataResource, err error) {
	//db := d.db.WithContext(ctx).Table("t_data_resource").Where("catalog_id = 0 and view_id ='' and status = ?", constant.ReSourceTypeNormal) view_id ='' 代表去掉生成接口，保留注册接口
	db := d.db.WithContext(ctx).Table("t_data_resource").Where("type !=2 and status = ?", constant.ReSourceTypeNormal) //未编目
	if req.ResourceType == constant.MountAPI {
		viewIds := make([]string, 0)
		err = d.db.WithContext(ctx).Table("t_data_resource").Select("DISTINCT view_id").Where("catalog_id = 0 and view_id != '' and type =2 and status = ?", constant.ReSourceTypeNormal).Find(&viewIds).Error
		if err != nil {
			return
		}
		db = db.Where("resource_id in ?", viewIds)
	}

	if err != nil {
		return
	}
	if req.FormViewIDS != nil {
		if len(*req.FormViewIDS) > 0 && (req.InfoSystemID != nil && *req.InfoSystemID == "") {
			db = db.Where("resource_id in ? or type = ?", *req.FormViewIDS, constant.MountFile)
		} else if len(*req.FormViewIDS) > 0 {
			db = db.Where("resource_id in ?", *req.FormViewIDS)
		} else if len(*req.FormViewIDS) == 0 {
			db = db.Where("resource_id IS NULL")
		}
	}

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("name like ? or code like ? ", keyword, keyword)

		//支持根据接口名称以及编码查询对应资源数据
		if req.ResourceType == 0 || req.ResourceType == constant.MountView || req.ResourceType == constant.MountAPI {
			viewIds := make([]string, 0)
			err = d.db.WithContext(ctx).Table("t_data_resource").Select("DISTINCT view_id").
				Where("catalog_id = 0 and view_id != '' and type =2 and status = ?", constant.ReSourceTypeNormal).
				Where("name like ? or code like ? ", keyword, keyword).
				Find(&viewIds).Error
			if err != nil {
				return
			}
			db = db.Or("resource_id in ?", viewIds)
		}
	}
	if req.ResourceType != 0 && req.ResourceType != 2 {
		db.Where("type =?", req.ResourceType)
	}
	if req.PublishAtStart != nil && *req.PublishAtStart != 0 {
		db = db.Where("UNIX_TIMESTAMP(publish_at)*1000 >= ?", req.PublishAtStart)
	}
	if req.PublishAtEnd != nil && *req.PublishAtEnd != 0 {
		db = db.Where("UNIX_TIMESTAMP(publish_at)*1000 <= ?", req.PublishAtEnd)
	}
	if len(req.SubDepartmentIDs) == 1 {
		db.Where("department_id = ?", req.SubDepartmentIDs[0])
	} else if len(req.SubDepartmentIDs) > 1 {
		db.Where("department_id in ?", req.SubDepartmentIDs)
	}
	if req.DepartmentID == constant.UnallocatedId {
		db = db.Where("department_id = '' or department_id is null")
	}
	if len(req.SubSubjectIDs) == 1 {
		db.Where("subject_id = ?", req.SubSubjectIDs[0])
	} else if len(req.SubSubjectIDs) > 1 {
		db.Where("subject_id in ?", req.SubSubjectIDs)
	}
	if req.SubjectID == constant.UnallocatedId {
		db = db.Where("subject_id = '' or subject_id is null")
	}
	if req.CatalogID.Uint64() != 0 {
		db = db.Where("catalog_id = 0 or catalog_id = ?", req.CatalogID.Uint64())
	} else {
		db = db.Where("catalog_id = 0")
	}
	err = db.Count(&total).Error
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if *req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" name  %s", *req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("%s %s", *req.Sort, *req.Direction))
	}
	err = db.Find(&dataResource).Error
	return
}

func (d *DataResourceRepo) GetViewInterface(ctx context.Context, viewId string, catalogIdNotExist bool) (res []*model.TDataResource, err error) {
	tx := d.db.WithContext(ctx).Table("t_data_resource").Where("view_id = ? and status = ?", viewId, constant.ReSourceTypeNormal)
	if catalogIdNotExist {
		tx = tx.Where("catalog_id = 0")
	}
	err = tx.Find(&res).Error
	return
}
func (d *DataResourceRepo) QueryDataCatalogResourceList(ctx context.Context, req *domain.DataCatalogResourceListReq) (total int64, dataResource []*model.TDataCatalogResourceWithName, err error) {
	db := d.db.WithContext(ctx).Table("t_data_catalog c").Joins("join t_data_resource r on r.catalog_id = c.id")
	db = db.Select(" distinct r.resource_id as unique_resource_id, r.*, c.title as catalog_name ")
	if len(req.SubSubjectIDs) > 0 {
		db.Joins("left join t_data_catalog_category dcc on c.id = dcc.catalog_id")
		db = db.Where(" dcc.category_id in ?", req.SubSubjectIDs)
	}

	keyword := req.Keyword
	if keyword != "" {
		if strings.Contains(keyword, "_") {
			keyword = strings.Replace(keyword, "_", "\\_", -1)
		}
		keyword = "%" + keyword + "%"
		db = db.Where("c.title like ? or c.code like ?  or r.name like ?", keyword, keyword, keyword)
	}
	db = db.Where("c.publish_status in  ? ", constant.PublishedSlice)
	db = db.Where("c.view_count>0 and r.type=? ", constant.MountView)
	err = db.Count(&total).Error
	if err != nil {
		return
	}
	limit := *req.Limit
	offset := limit * (*req.Offset - 1)
	if limit > 0 {
		db = db.Limit(limit).Offset(offset)
	}
	if *req.Sort == "name" {
		db = db.Order(fmt.Sprintf(" r.name %s", *req.Direction))
	} else {
		db = db.Order(fmt.Sprintf("%s %s", *req.Sort, *req.Direction))
	}
	err = db.Find(&dataResource).Error
	return total, dataResource, err
}

func (d *DataResourceRepo) GetByCatalogId(ctx context.Context, catalogId uint64) (dataResource []*model.TDataResource, err error) {
	err = d.db.WithContext(ctx).Where("catalog_id = ?", catalogId).Find(&dataResource).Error
	return
}

func (d *DataResourceRepo) GetByDraftCatalogId(ctx context.Context, draftCatalogId uint64) (dataResource []*model.TDataResource, err error) {
	err = d.db.WithContext(ctx).Table("t_data_resource r").Joins("inner join t_data_catalog_resource c on c.resource_id = r.resource_id").Where("c.catalog_id = ?", draftCatalogId).Find(&dataResource).Error
	return
}

func (d *DataResourceRepo) GetByCatalogIds(ctx context.Context, catalogId ...uint64) (dataResource []*model.TDataResource, err error) {
	err = d.db.WithContext(ctx).Where("catalog_id in ?", catalogId).Find(&dataResource).Error
	return
}

func (d *DataResourceRepo) GetByResourceId(ctx context.Context, resourceId string) (dataResource *model.TDataResource, err error) {
	err = d.db.WithContext(ctx).Where("resource_id = ?", resourceId).Take(&dataResource).Error
	return
}
func (d *DataResourceRepo) GetByResourceIds(ctx context.Context, resourceId []string, resourceType int8, viewIdNotExist *bool) (dataResource []*model.TDataResource, err error) {
	tx := d.db.WithContext(ctx).Where("resource_id in ?", resourceId)
	if resourceType != 0 {
		tx.Where("type=?", resourceType)
	}
	if viewIdNotExist != nil {
		tx.Where("view_id =''")
	}
	err = tx.Find(&dataResource).Error
	return
}
func (d *DataResourceRepo) GetByName(ctx context.Context, resourceName string, resourceType int8) (dataResource []*model.TDataResource, err error) {
	tx := d.db.WithContext(ctx).Where("name = ?", resourceName)
	if resourceType != 0 {
		tx.Where("type=?", resourceType)
	}
	err = tx.Find(&dataResource).Error
	return
}

func (d *DataResourceRepo) GetResourceAndCatalog(ctx context.Context, resourceIds []string) (res []*data_resource_catalog.DataCatalogWithMount, err error) {
	if len(resourceIds) == 0 {
		return res, nil
	}
	var s string
	for _, rid := range resourceIds {
		s = s + "'" + rid + "', "
	}
	s = strings.TrimRight(s, ", ")
	sql := fmt.Sprintf("SELECT c.title catalog_name,c.id catalog_id,r.name resource_name,r.resource_id resource_id FROM  t_data_catalog c INNER JOIN t_data_resource r on  c.id=r.catalog_id WHERE r.resource_id in (%s)", s)
	err = d.db.WithContext(ctx).Raw(sql).Scan(&res).Error
	return
}
func (d *DataResourceRepo) GetApiBody(ctx context.Context, catalogId uint64) (res []*model.TApi, err error) {
	err = d.db.WithContext(ctx).Where("catalog_id = ?", catalogId).Find(&res).Error
	return
}
func (d *DataResourceRepo) Count(ctx context.Context) (res *data_resource.CountRes, err error) {
	res = new(data_resource.CountRes)
	err = d.db.WithContext(ctx).Table("t_data_resource").Where("type =?", constant.MountView).Count(&res.ViewCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_resource").Where("type =?", constant.MountAPI).Count(&res.ApiCount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_resource").Where("type =? and catalog_id !=0", constant.MountView).Count(&res.ViewMount).Error
	if err != nil {
		return
	}
	err = d.db.WithContext(ctx).Table("t_data_resource").Where("type =? and catalog_id !=0", constant.MountAPI).Count(&res.ApiMount).Error
	if err != nil {
		return
	}
	return
}

func (d *DataResourceRepo) GetByResourceType(ctx context.Context, resourceType int8) (res []*model.TDataResource, err error) {
	err = d.db.WithContext(ctx).Model(&model.TDataResource{}).Where("type = ? and catalog_id > 0", resourceType).Find(&res).Error
	return
}
