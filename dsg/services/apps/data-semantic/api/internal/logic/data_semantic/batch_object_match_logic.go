// Code scaffolded by goctl. Safe to edit.
// goctl 1.9.2

package data_semantic

import (
	"context"
	"sync"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/middleware"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/svc"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/api/internal/types"
	"github.com/kweaver-ai/dsg/services/apps/data-semantic/internal/pkg/agentretrieval"

	"github.com/zeromicro/go-zero/core/logx"
)

type BatchObjectMatchLogic struct {
	logx.Logger
	ctx    context.Context
	svcCtx *svc.ServiceContext
}

// 批量匹配业务对象
func NewBatchObjectMatchLogic(ctx context.Context, svcCtx *svc.ServiceContext) *BatchObjectMatchLogic {
	return &BatchObjectMatchLogic{
		Logger: logx.WithContext(ctx),
		ctx:    ctx,
		svcCtx: svcCtx,
	}
}

func (l *BatchObjectMatchLogic) BatchObjectMatch(req *types.BatchObjectMatchReq) (resp *types.BatchObjectMatchResp, err error) {
	// 固定查询数量
	limit := 10
	// 最大并发数
	maxConcurrency := 50

	// 从 context 获取账户信息
	accountInfo := l.getAccountInfo()

	// 预分配结果数组
	results := make([]types.MatchResult, len(req.Entries))
	var wg sync.WaitGroup
	// 使用 channel 控制最大并发数
	sem := make(chan struct{}, maxConcurrency)

	// 并发查询
	for i, item := range req.Entries {
		// 初始化结果
		results[i] = types.MatchResult{
			Name:       item.Name,
			DataSource: make([]types.ResponseDataSource, 0),
		}

		// 有 data_source 直接返回
		if item.DataSource != nil && item.DataSource.Id != "" {
			results[i].DataSource = append(results[i].DataSource, types.ResponseDataSource{
				Id:         item.DataSource.Id,
				Name:       item.DataSource.Name,
				ObjectName: item.Name,
			})
			continue
		}

		// 空关键词跳过
		if item.Name == "" {
			continue
		}

		wg.Add(1)
		go func(index int, entry types.SourceObject) {
			defer wg.Done()

			// 捕获 panic
			defer func() {
				if r := recover(); r != nil {
					logx.Errorf("goroutine panic: %v", r)
				}
			}()

			// 获取信号量，控制最大并发数
			sem <- struct{}{}
			defer func() { <-sem }()

			// 创建独立 context，避免主 context 取消影响
			ctx, cancel := context.WithCancel(l.ctx)
			defer cancel()

			// 模糊匹配查询：object_name like keyword
			condition := agentretrieval.Condition{
				Operation: "and",
				SubConditions: []agentretrieval.SubCondition{
					{
						Field:     "object_name",
						Operation: "like",
						ValueFrom: "const",
						Value:     entry.Name,
					},
				},
			}

			queryResults, err := l.svcCtx.AgentRetrieval.QueryObjectInstance(ctx, req.KnId, req.OtId, condition, limit, accountInfo)
			if err != nil {
				logx.Errorf("callAgentRetrieval error: %v", err)
				return
			}

			// 转换结果
			dataSources := make([]types.ResponseDataSource, 0, len(queryResults))
			for _, data := range queryResults {
				dataSources = append(dataSources, types.ResponseDataSource{
					Id:         data.MdlId,
					Name:       data.Display,
					ObjectName: data.ObjectName,
				})
			}

			// 写入结果
			results[index].DataSource = dataSources
		}(i, item)
	}

	wg.Wait()

	resp = &types.BatchObjectMatchResp{
		Entries: results,
	}

	return resp, nil
}

// getAccountInfo 从 context 获取账户信息
func (l *BatchObjectMatchLogic) getAccountInfo() agentretrieval.AccountInfo {
	if userInfo, ok := l.ctx.Value(middleware.InfoName).(*middleware.UserInfo); ok && userInfo != nil {
		return agentretrieval.AccountInfo{
			UserID:   userInfo.ID,
			UserType: "user",
		}
	}
	return agentretrieval.AccountInfo{}
}
