package impl

import (
	"context"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/news_policy"
	domain "github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/news_policy"
	"gorm.io/gorm"
)

type Repo struct {
	db *gorm.DB
}

func NewRepo(db *gorm.DB) news_policy.UseCase {
	return &Repo{db: db}
}

func (r *Repo) List(req *domain.ListReq) ([]*domain.CmsContent, int64, error) {
	var list []*domain.CmsContent
	var total int64
	db := r.db.Model(&domain.CmsContent{}).Where("is_deleted='0' or is_deleted='' ")
	if req.Title != "" {
		db = db.Where("title LIKE ?", "%"+req.Title+"%")
	}
	if req.Status != "" {
		db = db.Where("status = ?", req.Status)
	}
	if req.Type != "" {
		db = db.Where("type = ?", req.Type)
	}
	if req.Name != "" {
		db = db.Where("name LIKE ?", "%"+req.Name+"%")
	}
	if req.HomeShow != "" {
		db = db.Where("home_show = ?", req.HomeShow)
	}

	db.Count(&total)
	//排序有两个字段组成，req.direction 表示降序还是升序, req.sort 排序的字段
	if req.Direction != "" && req.Sort != "" {
		// 排序
		db = db.Order(req.Sort + " " + req.Direction)
	} else {
		// 默认排序
		db = db.Order("update_time desc")
	}
	db = db.Order(req.Sort + " " + req.Direction)

	err := db.Offset((req.Offset - 1) * req.Limit).Limit(req.Limit).Find(&list).Error
	return list, total, err
}

func (r *Repo) GetByID(id string) (*domain.CmsContent, error) {
	var c domain.CmsContent
	err := r.db.Model(&domain.CmsContent{}).Where("id=? AND (is_deleted='0' or is_deleted='')", id).Find(&c).Error
	return &c, err
}

func (r *Repo) Create(ctx context.Context, content domain.CmsContent) error {
	return r.db.WithContext(ctx).Create(content).Error
}

func (r *Repo) Update(ctx context.Context, id string, content domain.CmsContent) error {
	return r.db.WithContext(ctx).Model(&domain.CmsContent{}).Where("id=? AND (is_deleted='0' or is_deleted='')", id).Updates(content).Error
}

func (r *Repo) Delete(id string) error {
	return r.db.Model(&domain.CmsContent{}).Where("id=? AND (is_deleted='0' or is_deleted='')", id).Update("is_deleted", '1').Error
}

func (r *Repo) ListImages(contentID string) ([]*domain.CmsContentImage, error) {
	var imgs []*domain.CmsContentImage
	err := r.db.Where("content_id=?", contentID).Find(&imgs).Error
	return imgs, err
}

func (r *Repo) SaveImages(contentID string, urls []string) error {
	// 先删后插
	r.db.Where("content_id=?", contentID).Delete(&domain.CmsContentImage{})
	for i, url := range urls {
		img := domain.CmsContentImage{
			ContentID: contentID,
			ImageUrl:  url,
			IsCover:   1, // 这里假设都为封面
		}
		if i > 0 {
			img.IsCover = 0
		}
		if err := r.db.Create(&img).Error; err != nil {
			return err
		}
	}
	return nil
}

func (r *Repo) GetNewsPolicy(ctx context.Context, req *domain.NewsDetailsReq) (*domain.CmsContent, error) {
	var list *domain.CmsContent
	db := r.db.Model(&domain.CmsContent{}).Where("is_deleted='0'")
	if req.ID != "" {
		db = db.Where("id = ?", req.ID)
	}
	if req.Status != "" {
		db = db.Where("status = ?", req.Status)
	}
	if req.Type != "" {
		db = db.Where("type = ?", req.Type)
	}
	err := db.Order("update_time desc").Find(&list).Error
	return list, err
}

// 实现抽象类函数
func (r *Repo) GetHelpDocumentList(ctx context.Context, req *domain.ListHelpDocumentReq) ([]*domain.HelpDocument, int64, error) {
	var list []*domain.HelpDocument
	var total int64
	db := r.db.Model(&domain.HelpDocument{}).Where("is_deleted ='' or is_deleted ='0'")
	if req.Title != "" {
		db = db.Where("title LIKE ?", "%"+req.Title+"%")
	}
	if req.Type != "" {
		db = db.Where("type = ?", req.Type)
	}
	if req.Status != "" {
		db = db.Where("status = ?", req.Status)
	}
	db.Count(&total)
	if req.Direction != "" && req.Sort != "" {
		// 排序
		db = db.Order(req.Sort + " " + req.Direction)
	} else {
		// 默认排序
		db = db.Order("updated_at desc")
	}
	err := db.Offset((req.Offset - 1) * req.Limit).Limit(req.Limit).Find(&list).Error
	return list, total, err
}

func (r *Repo) CreateHelpDocument(ctx context.Context, req *domain.HelpDocument) error {
	return r.db.WithContext(ctx).Create(&req).Error
	return nil
}

func (r *Repo) UpdateHelpDocument(ctx context.Context, req *domain.HelpDocument) error {
	err := r.db.Model(&domain.HelpDocument{}).Where("id = ?", req.ID).Updates(req).Error
	if err != nil {
	}
	return err
}

func (r *Repo) DeleteHelpDocument(ctx context.Context, id string) error {
	err := r.db.Model(&domain.HelpDocument{}).Where("id = ?", id).Delete(&domain.HelpDocument{}).Error
	if err != nil {
	}
	return err
}

func (r *Repo) GetHelpDocumentDetail(ctx context.Context, req *domain.GetHelpDocumentReq) (*domain.HelpDocument, error) {
	resp := &domain.HelpDocument{}
	err := r.db.Where("id = ?", req.ID).First(resp).Error
	if err != nil {
	}
	return resp, err
}

func (r *Repo) GetHelpDocumentById(ctx context.Context, id string) (*domain.HelpDocument, error) {
	resp := &domain.HelpDocument{}
	err := r.db.Where("id = ?", id).Find(resp).Error
	if err != nil {
	}
	return resp, err
}

func (r *Repo) UpdateHelpDocumentStatus(ctx context.Context, req *domain.UpdateHelpDocumentPath) error {
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	err := r.db.Model(&domain.HelpDocument{}).
		Where("id = ?", req.ID).
		Updates(map[string]interface{}{
			"status":       req.Status,
			"published_at": beijingTime.Format("2006-01-02 15:04:05"),
		}).Error
	return err
}

func (r *Repo) UpdatePolicyStatus(ctx context.Context, req *domain.UpdatePolicyPath) error {
	//published_at获取当前时间
	// 获取 UTC 时间
	utcNow := time.Now().UTC()
	beijingTime := utcNow.Add(8 * time.Hour)
	err := r.db.Model(&domain.CmsContent{}).
		Where("id = ? and type = ?", req.ID, req.Type).
		Updates(map[string]interface{}{
			"status":       req.Status,
			"publish_time": beijingTime.Format("2006-01-02 15:04:05"),
		}).Error
	return err
}
