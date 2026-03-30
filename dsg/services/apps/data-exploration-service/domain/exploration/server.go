package exploration

import (
	"context"
	"fmt"
	"sync"
	"time"

	repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report"
	item_repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/report_item"
	task_repo "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/gorm/task_config"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
)

type Server struct {
	data      *db.Data
	repo      repo.Repo
	task_repo task_repo.Repo
	item_repo item_repo.Repo
	mtx       sync.Mutex
	cancel    context.CancelFunc
}

func NewServer(data *db.Data, repo repo.Repo, task_repo task_repo.Repo, item_repo item_repo.Repo) *Server {
	return &Server{
		data:      data,
		repo:      repo,
		task_repo: task_repo,
		item_repo: item_repo,
	}
}

func (s *Server) Start(ctx context.Context) (err error) {
	ctx, span := trace.StartInternalSpan(ctx)
	defer func() { trace.TelemetrySpanEnd(span, err) }()

	ctx, cancel := context.WithCancel(ctx)
	defer cancel()

	s.mtx.Lock()
	s.cancel = cancel
	s.mtx.Unlock()

	var ticker *time.Ticker
	defer func() {
		if ticker != nil {
			ticker.Stop()
		}
	}()

	for {
		if ticker == nil {
			ticker = time.NewTicker(time.Second * 60)
		} else {
			select {
			case <-ctx.Done():
				return
			case <-ticker.C:
				s.cleanOverTimeExploration()
			}
		}
	}
}

func (s *Server) Stop(_ context.Context) error {
	s.mtx.Lock()
	s.cancel()
	s.mtx.Unlock()
	return nil
}

func (s *Server) cleanOverTimeExploration() {
	log.Info("start clean over time exploration report records")
	ctx := context.Background()
	now := time.Now()
	overTime := settings.GetConfig().ExplorationConf.ReportDefaultOvertime
	deadLine := now.Add(-time.Second * time.Duration(overTime))
	reportList, err := s.repo.SelectOverTimeReport(nil, ctx, &deadLine)
	if err == nil && reportList != nil {
		codeSet := make([]string, 0)
		reason := fmt.Sprintf("超过最长执行时长%d(秒)任务自动清理，标记为失败", overTime)
		for _, report := range reportList {
			report.FinishedAt = &now
			report.Status = util.ValueToPtr(constant.Explore_Status_Fail)
			report.Latest = constant.NO
			report.Reason = &reason
			s.repo.Update(nil, ctx, report)
			codeSet = append(codeSet, *report.Code)
			taskConfig, err := s.task_repo.GetLatestByTaskId(nil, ctx, report.TaskID)
			if err == nil && taskConfig != nil {
				taskConfig.ExecStatus = util.ValueToPtr(constant.Explore_Status_Fail)
				s.task_repo.Update(nil, ctx, taskConfig)
			}
		}
		//s.item_repo.DeleteByTaskWithOutCurrentReport(nil, ctx, codeSet)
	}
	log.Info("end clean over time exploration report records")
}
