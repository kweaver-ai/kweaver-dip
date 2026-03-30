package workflow

import (
	"context"
	"sync"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/enum"
	"github.com/kweaver-ai/idrm-go-common/workflow"
)

// Workflow 的 Consumer
type Consumer struct {
	w workflow.WorkflowInterface

	// 新增：状态管理和控制
	ctx        context.Context
	cancel     context.CancelFunc
	mu         sync.RWMutex
	isRunning  bool
	isStopping bool
	wg         sync.WaitGroup
}

func (c *Consumer) Start() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.isRunning {
		return nil // 已经在运行
	}

	// 创建context用于控制消费者
	c.ctx, c.cancel = context.WithCancel(context.Background())
	c.isRunning = true
	c.isStopping = false

	// 启动消费者
	err := c.w.Start()
	if err != nil {
		c.isRunning = false
		return err
	}

	// 启动健康检查goroutine
	c.wg.Add(1)
	go c.healthCheck()

	return nil
}

func (c *Consumer) Stop() {
	c.mu.Lock()
	if !c.isRunning || c.isStopping {
		c.mu.Unlock()
		return
	}
	c.isStopping = true
	c.mu.Unlock()

	// 优雅关闭：先取消context，再停止workflow
	if c.cancel != nil {
		c.cancel()
	}

	// 等待健康检查goroutine完成
	c.wg.Wait()

	// 停止workflow
	c.w.Stop()

	c.mu.Lock()
	c.isRunning = false
	c.isStopping = false
	c.mu.Unlock()
}

// 新增：健康检查方法
func (c *Consumer) healthCheck() {
	defer c.wg.Done()

	ticker := time.NewTicker(30 * time.Second)
	defer ticker.Stop()

	for {
		select {
		case <-ticker.C:
			c.mu.RLock()
			running := c.isRunning && !c.isStopping
			c.mu.RUnlock()

			if !running {
				return
			}

			// 这里可以添加更多的健康检查逻辑
			// 比如检查workflow的状态、连接状态等

		case <-c.ctx.Done():
			return
		}
	}
}

// 新增：获取运行状态
func (c *Consumer) IsRunning() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.isRunning && !c.isStopping
}

// 新增：获取停止状态
func (c *Consumer) IsStopping() bool {
	c.mu.RLock()
	defer c.mu.RUnlock()
	return c.isStopping
}

func NewConsumerAndRegisterHandlers(w workflow.WorkflowInterface, s gorm.ServiceRepo, sa gorm.ServiceApplyRepo) *Consumer {
	c := &Consumer{w: w}
	c.RegisterHandlers(s, sa)
	return c
}

// 注册消费 Workflow 消息的 Handler
func (c *Consumer) RegisterHandlers(serviceRepo gorm.ServiceRepo, serviceApplyRepo gorm.ServiceApplyRepo) {
	// 发布审核消息
	c.w.RegistConusmeHandlers(
		enum.AuditTypePublish,
		serviceRepo.ConsumerWorkflowAuditMsg,
		serviceRepo.ConsumerWorkflowAuditResultPublish,
		serviceRepo.ConsumerWorkflowAuditProcDeletePublish,
	)
	c.w.RegistConusmeHandlers(
		enum.AuditTypeRequest,
		serviceRepo.ConsumerWorkflowAuditMsg,
		serviceApplyRepo.ConsumerWorkflowAuditResultRequest,
		serviceApplyRepo.ConsumerWorkflowAuditProcDeleteRequest,
	)
	//变更审核消息消费
	c.w.RegistConusmeHandlers(
		enum.AuditTypeChange,
		serviceRepo.ConsumerWorkflowAuditMsg,
		serviceRepo.ConsumerWorkflowAuditResultChange,
		serviceRepo.ConsumerWorkflowAuditProcDeleteChange,
	)
	//下线审核消息消费
	c.w.RegistConusmeHandlers(
		enum.AuditTypeOffline,
		serviceRepo.ConsumerWorkflowAuditMsg,
		serviceRepo.ConsumerWorkflowAuditResultOffline,
		serviceRepo.ConsumerWorkflowAuditProcDeleteOffline,
	)
	//上线审核消息消费
	c.w.RegistConusmeHandlers(
		enum.AuditTypeOnline,
		serviceRepo.ConsumerWorkflowAuditMsg,
		serviceRepo.ConsumerWorkflowAuditResultOnline,
		serviceRepo.ConsumerWorkflowAuditProcDeleteOnline,
	)
}
