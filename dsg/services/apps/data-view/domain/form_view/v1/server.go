package v1

import (
	"context"
	"fmt"
	"github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/tmp_completion"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	conf "github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/config"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"sync"
	"time"
)

type Server struct {
	tmpCompletionRepo tmp_completion.TmpCompletionRepo
	conf              *conf.Bootstrap
	mtx               sync.Mutex
	cancel            context.CancelFunc
}

func NewServer(tmpCompletionRepo tmp_completion.TmpCompletionRepo, conf *conf.Bootstrap) *Server {
	return &Server{
		tmpCompletionRepo: tmpCompletionRepo,
		conf:              conf,
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
				s.cleanOverTimeCompletion()
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

func (s *Server) cleanOverTimeCompletion() {
	//log.Info("start clean over time completion records")
	ctx := context.Background()
	now := time.Now()
	overTime := util.AsInt(s.conf.Exploration.CompletionDefaultOvertime)
	if overTime <= 0 {
		panic(fmt.Errorf("invalid overTime %d", overTime))
	}
	deadLine := now.Add(-time.Second * time.Duration(overTime))
	completionList, err := s.tmpCompletionRepo.SelectOverTimeCompletion(ctx, &deadLine)
	if err == nil && completionList != nil {
		for _, completion := range completionList {
			completion.Status = form_view.CompletionStatusFailed.Integer.Int32()
			completion.Reason = fmt.Sprintf("超过最长执行时长%d(秒)任务自动清理，标记为失败", overTime)
			err = s.tmpCompletionRepo.Update(ctx, completion)
			if err != nil {
				continue
			}
		}
	}
	//log.Info("end clean over time completion records")
}
