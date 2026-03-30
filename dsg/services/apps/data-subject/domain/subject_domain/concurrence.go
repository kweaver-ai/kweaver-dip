package subject_domain

import (
	"context"
	"fmt"
	"sync"

	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"golang.org/x/sync/errgroup"
)

type TaskHasErr func(context.Context) error
type TaskNoErr func(context.Context)

type TaskGenericity interface {
	TaskHasErr | TaskNoErr
}

type Concurrence[Task TaskGenericity] struct {
	mtx     sync.Mutex
	noErrWg *sync.WaitGroup
	errWg   *errgroup.Group
	cancel  context.CancelFunc
	tasks   []Task
}

// NewConcurrence 新建多任务处理模型
func NewConcurrence[Task TaskGenericity]() *Concurrence[Task] {
	return &Concurrence[Task]{
		mtx:     sync.Mutex{},
		noErrWg: &sync.WaitGroup{},
		errWg:   &errgroup.Group{},
	}
}

// Add 添加任务
func (m *Concurrence[Task]) Add(ts ...Task) *Concurrence[Task] {
	m.tasks = append(m.tasks, ts...)
	return m
}

// done 判定有没有结束
func done(ctx context.Context) error {
	select {
	case <-ctx.Done():
		return ctx.Err()
	default:
	}
	return nil
}

// Cancel 取消所有的任务
func (m *Concurrence[Task]) Cancel() {
	m.cancel()
}

func (m *Concurrence[Task]) Run(ctx context.Context) error {
	if len(m.tasks) <= 0 {
		return nil
	}
	var vtn any = m.tasks[0]
	switch vtn.(type) {
	case TaskHasErr:
		return m.runCatcheError(ctx)
	case TaskNoErr:
		return m.runIgnoreError(ctx)
	}
	return nil
}

// RunIgnoreError  忽略错误，所有的携程尽可能的都执行完毕
func (m *Concurrence[Task]) runIgnoreError(ctx context.Context) error {
	ctx, m.cancel = context.WithCancel(ctx)
	for j := range m.tasks {
		//如果有通知说取消，返回错误
		if err := done(ctx); err != nil {
			log.Errorf("RunTasks: task cancel %v", err.Error())
			return fmt.Errorf("RunTasks: task cancel %v", err.Error())
		}
		var taskContainer any = m.tasks[j]
		task := taskContainer.(TaskNoErr)
		//没有通知说取消，继续执行
		m.noErrWg.Add(1)
		go func(ctx context.Context, wg *sync.WaitGroup, task TaskNoErr) {
			defer wg.Done()
			task(ctx)
		}(ctx, m.noErrWg, task)
	}
	m.noErrWg.Wait() //等待所有的都执行完毕
	return nil
}

// RunCatcheError 不忽略错误，遇到第一个错误就放弃所有其他的携程，直接退出
func (m *Concurrence[Task]) runCatcheError(ctx context.Context) (err error) {
	ctx, m.cancel = context.WithCancel(ctx)
	for j := range m.tasks {
		//如果有通知说取消，返回错误
		if err := done(ctx); err != nil {
			log.Errorf("RunTasks: task cancel %v", err.Error())
			return fmt.Errorf("RunTasks: task cancel %v", err.Error())
		}

		var taskContainer any = m.tasks[j]
		task := taskContainer.(TaskHasErr)
		//没有通知说取消，继续执行
		m.errWg.Go(func() error {
			if err := task(ctx); err != nil {
				log.Errorf("RunTasks: task execute error %s", err.Error())
				return err
			}
			return nil
		})
	}
	if err = m.errWg.Wait(); err != nil {
		log.Errorf("task waitting error %v", err.Error())
		return err
	}
	return nil
}
