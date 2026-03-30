package impl

import (
	"strconv"

	repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report"
	item_repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report_item"
	task_repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/task_config"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/third_party_report"
	mdl_uniquery "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mdl-uniquery"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/redis_lock"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	commonService "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/tools"
	v2 "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
)

type ExplorationDomainImpl struct {
	data               *db.Data
	repo               repo.Repo
	task_repo          task_repo.Repo
	item_repo          item_repo.Repo
	engineSource       tools.EngineSource
	mq_producter       *kafka.KafkaProducer
	mtx                *redis_lock.Mutex
	commonDomain       commonService.Domain
	thirdPartyTaskRepo third_party_report.Repo
	mdl_uniquery       mdl_uniquery.DrivenMDLUniQuery
	semaphore          chan struct{} // 用于限制探查本服务并发数的信号量
	explorDomainImplV2 *v2.ExplorationDomainImplV2
}

func NewExplorationDomain(
	data *db.Data,
	mtx *redis_lock.Mutex,
	commonDomain commonService.Domain,
	engineSource tools.EngineSource,
	repo repo.Repo,
	task_repo task_repo.Repo,
	item_repo item_repo.Repo,
	mq_producter *kafka.KafkaProducer,
	thirdPartyTaskRepo third_party_report.Repo,
	mdl_uniquery mdl_uniquery.DrivenMDLUniQuery,
	explorDomainImplV2 *v2.ExplorationDomainImplV2,
) exploration.Domain {
	concurrencyLimit, _ := strconv.Atoi(settings.GetConfig().ExplorationConf.ConcurrencyLimit)
	if concurrencyLimit <= 0 {
		concurrencyLimit = 100 // 默认并发数为100
	}
	e := &ExplorationDomainImpl{
		data:               data,
		repo:               repo,
		task_repo:          task_repo,
		item_repo:          item_repo,
		engineSource:       engineSource,
		mq_producter:       mq_producter,
		mtx:                mtx,
		commonDomain:       commonDomain,
		thirdPartyTaskRepo: thirdPartyTaskRepo,
		mdl_uniquery:       mdl_uniquery,
		semaphore:          make(chan struct{}, concurrencyLimit),
		explorDomainImplV2: explorDomainImplV2,
	}
	//go e.RecoverExecuting(context.Background()) //修复服务中断的探查任务
	return e
}
