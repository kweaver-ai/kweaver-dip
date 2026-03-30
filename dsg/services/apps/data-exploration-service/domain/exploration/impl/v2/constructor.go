package v2

import (
	"context"
	"strconv"
	"time"

	repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report"
	item_repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report_item"
	task_repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/task_config"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/third_party_report"
	mdl_uniquery "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mdl-uniquery"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq/kafka"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/redis_lock"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	commonService "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/common"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration/impl/tools"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
)

type ExplorationDomainImplV2 struct {
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
	groupTaskExec      *groupTaskExecutor
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
) (*ExplorationDomainImplV2, error) {
	concurrencyLimit, _ := strconv.Atoi(settings.GetConfig().ExplorationConf.ConcurrencyLimit)
	if concurrencyLimit <= 0 {
		concurrencyLimit = 100 // 默认并发总数为100
	}
	concurrencyTaskLimit, _ := strconv.Atoi(settings.GetConfig().ExplorationConf.ConcurrencyTaskLimit)
	if concurrencyTaskLimit <= 0 {
		concurrencyTaskLimit = 10 // 默认并发组数为0
	}
	maxGroupNum := concurrencyLimit / concurrencyTaskLimit
	if maxGroupNum <= 0 {
		maxGroupNum = 1
	}
	groupTaskExec, err := NewGroupTaskExecutor(context.Background(), maxGroupNum, concurrencyTaskLimit)
	if err != nil {
		return nil, err
	}

	e := &ExplorationDomainImplV2{
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
		groupTaskExec:      groupTaskExec,
	}
	go func() {
		ctx := context.Background()
		for {
			e.exploreTaskDevideProc(ctx)
			time.Sleep(1 * time.Minute)
		}
	}()
	go func() {
		ctx := context.Background()
		for {
			e.execExploreTaskProc(ctx)
			time.Sleep(1 * time.Minute)
		}
	}()
	return e, nil
}
