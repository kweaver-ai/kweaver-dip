package info_resource_catalog

import (
	"context"
	"time"

	domain "github.com/kweaver-ai/dsg/services/apps/data-catalog/domain/info_resource_catalog"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/mq/kafka"
	"github.com/kweaver-ai/idrm-go-common/rest/business_grooming"
	"github.com/kweaver-ai/idrm-go-common/util"
	"gorm.io/gorm"
)

// [信息资源编目资源库实现]
type infoResourceCatalogRepo struct {
	db          *gorm.DB
	consumer    *kafka.Consumer
	bizGrooming business_grooming.Driven
} // [/]

// [信息资源编目资源库构造器函数]
func NewInfoResourceCatalogRepo(db *gorm.DB, consumer *kafka.Consumer, bizGrooming business_grooming.Driven) domain.InfoResourceCatalogRepo {
	repo := &infoResourceCatalogRepo{
		db:          db,
		consumer:    consumer,
		bizGrooming: bizGrooming,
	}
	repo.init()
	return repo
} // [/]

const (
	reTryInterval = 60 * time.Second
	maxRetry      = 3
)

func (repo *infoResourceCatalogRepo) init() {
	// [初始化未编目业务表] 全量同步
	go func() {
		ticker := time.NewTicker(reTryInterval)
		ctx := context.TODO()
		err := repo.initBusinessFormNotCataloged()
		count := maxRetry
		for err != nil && count > 0 {
			<-ticker.C
			util.RecordErrLog(ctx, err)
			err = repo.initBusinessFormNotCataloged()
			count--
		}
	}() // [/]
	// [同步业务表更新] 增量同步
	repo.syncBusinessFormUpdate() // [/]
}
