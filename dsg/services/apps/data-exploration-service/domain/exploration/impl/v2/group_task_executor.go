package v2

import (
	"context"
	"encoding/json"
	"errors"
	"fmt"
	"os"
	"sync"
	"time"

	"github.com/bsm/redislock"
	mdl_uniquery "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mdl-uniquery"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/settings"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/common/util"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/domain/exploration"
	"github.com/kweaver-ai/dsg/services/apps/data-exploration-service/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/samber/lo"
)

type CancelErr struct {
}

func (e *CancelErr) Error() string {
	return ""
}

type NoGroupExecResErr struct {
}

func (e *NoGroupExecResErr) Error() string {
	return ""
}

type GroupExecutingErr struct {
}

func (e *GroupExecutingErr) Error() string {
	return ""
}

type groupTaskExecutor struct {
	ctx             context.Context
	maxGroupNum     int
	gChan           chan struct{}
	maxTaskNum      int
	groupManagerMap map[string]*groupManager
	cancel          context.CancelFunc
	lock            *sync.Mutex
}

type groupManager struct {
	ctx               context.Context
	group             *model.Report
	groupTaskExecutor *groupTaskExecutor
	tChan             chan struct{}
	cancel            context.CancelFunc
	e                 *ExplorationDomainImplV2
	l                 *redislock.Lock
	errFlag           bool
	wg                *sync.WaitGroup

	errs              []error
	updateFailedItems []*model.ReportItem
	mutex             *sync.Mutex

	callInterval time.Duration
}

func NewGroupTaskExecutor(ctx context.Context, maxGroupNum int, maxTaskNum int) (*groupTaskExecutor, error) {
	if maxGroupNum <= 0 || maxTaskNum <= 0 {
		return nil, fmt.Errorf("maxGroupNum or maxTaskNum is invalid")
	}

	// 创建groupTaskExecutor
	cancelCtx, cancel := context.WithCancel(ctx)
	return &groupTaskExecutor{
		ctx:             cancelCtx,
		maxGroupNum:     maxGroupNum,
		gChan:           make(chan struct{}, maxGroupNum),
		maxTaskNum:      maxTaskNum,
		groupManagerMap: make(map[string]*groupManager, maxGroupNum),
		cancel:          cancel,
		lock:            new(sync.Mutex),
	}, nil
}

func (g *groupTaskExecutor) AddGroup(e *ExplorationDomainImplV2, group *model.Report, lock *redislock.Lock) error {
	var err error
	g.lock.Lock()
	defer g.lock.Unlock()

	if _, ok := g.groupManagerMap[*group.Code]; ok {
		e.mtx.Release(g.ctx, lock)
		return &GroupExecutingErr{}
	}

	select {
	case g.gChan <- struct{}{}:
		ctx, cancel := context.WithCancel(g.ctx)
		gm := &groupManager{
			ctx:               ctx,
			group:             group,
			groupTaskExecutor: g,
			tChan:             make(chan struct{}, g.maxTaskNum),
			cancel:            cancel,
			e:                 e,
			l:                 lock,
			wg:                new(sync.WaitGroup),
			errs:              make([]error, 0, g.maxTaskNum),
			mutex:             new(sync.Mutex),
		}
		g.groupManagerMap[*group.Code] = gm
		err = gm.start()
	default:
		err = &NoGroupExecResErr{}
	}
	if err != nil {
		e.mtx.Release(g.ctx, lock)
	}
	return err
}

func (g *groupTaskExecutor) CancelGroup(gid string) {
	g.lock.Lock()
	defer g.lock.Unlock()

	groupManager, ok := g.groupManagerMap[gid]
	if !ok {
		return
	}
	groupManager.stop()
}

func (g *groupTaskExecutor) CancelAll() {
	g.lock.Lock()
	defer g.lock.Unlock()
	for _, v := range g.groupManagerMap {
		v.cancel()
	}
	g.groupManagerMap = make(map[string]*groupManager, g.maxGroupNum)
}

func (g *groupManager) start() error {
	var (
		err         error
		mdlID       string
		reportItems []*model.ReportItem
	)

	callInterval := os.Getenv("MDL_UNIQUERY_CALL_INTERVAL")
	if len(callInterval) == 0 {
		callInterval = "1s"
	}
	if g.callInterval, err = time.ParseDuration(callInterval); err != nil {
		close(g.tChan)
		<-g.groupTaskExecutor.gChan
		g.e.mtx.Release(g.ctx, g.l)
		log.Errorf("report code %s form view id %s time.ParseDuration MDL_UNIQUERY_CALL_INTERVAL failed: %v", *g.group.Code, *g.group.TableID, err)
		return err
	}

	if err = g.e.data.DB.WithContext(g.ctx).Table("af_main.form_view").Select("mdl_id").Where("id = ?", g.group.TableID).Take(&mdlID).Error; err != nil {
		close(g.tChan)
		<-g.groupTaskExecutor.gChan
		g.e.mtx.Release(g.ctx, g.l)
		log.Errorf("report code %s form view id %s get mdl id failed: %v", *g.group.Code, *g.group.TableID, err)
		return err
	}

	if reportItems, err = g.e.item_repo.GetByCodeV2(nil, g.ctx, *g.group.Code); err != nil {
		close(g.tChan)
		<-g.groupTaskExecutor.gChan
		g.e.mtx.Release(g.ctx, g.l)
		log.Errorf("report code %s g.e.item_repo.GetByCodeV2 failed: %v", *g.group.Code, err)
		return err
	}

	g.updateFailedItems = make([]*model.ReportItem, 0, len(reportItems))
	g.group.Status = util.ValueToPtr(constant.Explore_Status_Excuting)

	// 状态更新失败继续流转
	g.e.repo.UpdateExecStatus(nil, g.ctx, g.group.TaskID, *g.group.TaskVersion, constant.Explore_Status_Excuting)
	g.e.task_repo.UpdateExecStatusV2(nil, g.ctx, g.group.TaskID, *g.group.TaskVersion, constant.Explore_Status_Excuting)

	go func(g *groupManager, mdlID string, items []*model.ReportItem) {
		var (
			isExisted bool
			idx       int
			sqls      []string
			subItems  [][]*model.ReportItem
			sqlMap    map[string]int
		)
		defer func() {
			recover()
			g.e.mtx.Release(g.ctx, g.l)
			<-g.groupTaskExecutor.gChan
			close(g.tChan)
			g.groupTaskExecutor.lock.Lock()
			g.groupTaskExecutor.groupManagerMap[*g.group.Code] = nil
			delete(g.groupTaskExecutor.groupManagerMap, *g.group.Code)
			g.groupTaskExecutor.lock.Unlock()
		}()
		sqlMap = make(map[string]int)
		sqls = make([]string, 0)
		subItems = make([][]*model.ReportItem, 0)
		for i := range items {
			if idx, isExisted = sqlMap[*items[i].Sql]; !isExisted {
				sqls = append(sqls, *items[i].Sql)
				subItems = append(subItems, make([]*model.ReportItem, 0))
				idx = len(sqls) - 1
				sqlMap[*items[i].Sql] = idx
			}
			subItems[idx] = append(subItems[idx], items[i])
		}

		sqlMap = nil
		idx = 0
		for {
			select {
			case <-g.ctx.Done():
				// 已被cancel，进行清理并释放
				return
			default:
				func() {
					defer recover()
					for i := idx; i < len(sqls); {
						select {
						case g.tChan <- struct{}{}:
							idx = i
							ctx, _ := context.WithCancel(g.ctx)
							g.wg.Add(1)
							go func(g *groupManager, ctx context.Context, mdlID string, sql *string, items []*model.ReportItem) {
								defer func() {
									recover()
									<-g.tChan
									g.wg.Done()
								}()

								newItems := make([]*model.ReportItem, 0, len(items))
								startTime := time.Now()
								for j := range items {
									if *items[j].Status == constant.Explore_Status_Success {
										continue
									} else if *items[j].Status == constant.Explore_Status_Canceled {
										g.mutex.Lock()
										g.errFlag = true
										g.errs = append(g.errs, errors.New("exist failed report item"))
										g.mutex.Unlock()
										return
									} else if *items[j].Status == constant.Explore_Status_Fail {
										g.mutex.Lock()
										g.errFlag = true
										g.errs = append(g.errs, &CancelErr{})
										g.mutex.Unlock()
										return
									}
									items[j].Status = util.ValueToPtr(constant.Explore_Status_Excuting)
									items[j].StartedAt = &startTime
									newItems = append(newItems, items[j])
								}

								if len(newItems) > 0 {
									g.e.item_repo.BatchUpdate(nil, ctx, newItems)

									result, err := util.RetryWithResult(ctx,
										func() ([]map[string]any, error) {
											retData := make([]map[string]any, 0)
											result, err := g.e.mdl_uniquery.QueryDataV2(ctx, *g.group.CreatedByUID, mdlID,
												mdl_uniquery.QueryDataBody{SQL: *sql, UseSearchAfter: true})
											if err == nil {
												if len(result.Entries) > 0 {
													retData = append(retData, result.Entries...)
												}
												time.Sleep(g.callInterval)
												for len(result.SearchAfter) > 0 {
													result, err = g.e.mdl_uniquery.QueryDataV2(ctx, *g.group.CreatedByUID, mdlID,
														mdl_uniquery.QueryDataBody{SearchAfter: result.SearchAfter, UseSearchAfter: true})
													if err != nil {
														time.Sleep(g.callInterval)
														return nil, err
													}
													if len(result.Entries) > 0 {
														retData = append(retData, result.Entries...)
													}
													time.Sleep(g.callInterval)
												}
											}
											return retData, err
										},
										settings.RetryCount,
										time.Millisecond*time.Duration(settings.RetryWaitTime),
										"DataStatistic single",
									)

									finishTime := time.Now()
									if err != nil {
										g.mutex.Lock()
										g.errFlag = true
										g.errs = append(g.errs, err)
										g.mutex.Unlock()
										for j := range newItems {
											newItems[j].Status = util.ValueToPtr(constant.Explore_Status_Fail)
											newItems[j].FinishedAt = &finishTime
										}
									} else if len(result) > 0 {
										for j := range newItems {
											newItems[j].Status = util.ValueToPtr(constant.Explore_Status_Success)
											newItems[j].FinishedAt = &finishTime
											g.e.ResultToItem(newItems[j], result)

										}
									}
									if err := g.e.item_repo.BatchUpdate(nil, ctx, newItems); err != nil {
										g.mutex.Lock()
										g.updateFailedItems = append(g.updateFailedItems, newItems...)
										g.mutex.Unlock()
									}
								}
							}(g, ctx, mdlID, &sqls[idx], subItems[idx])
							i++
							idx = i
						default:
							return
						}
					}
				}()
				if idx < len(sqls) && !g.errFlag {
					time.Sleep(1 * time.Second)
				} else if g.errFlag || idx >= len(sqls) {
					g.wg.Wait()
					func() {
						timeNow := time.Now()
						ctx := context.Background()
						if g.errFlag {
							func() {
								tx := g.e.data.DB.WithContext(ctx).Begin()
								defer func() {
									if e := recover(); e != nil {
										tx.Rollback()
									} else if e = tx.Commit().Error; e != nil {
										tx.Rollback()
									}
								}()
								g.group.Status = util.ValueToPtr(constant.Explore_Status_Fail)
								cancelItemNum := lo.CountBy(g.errs,
									func(err error) bool {
										_, ok := err.(*CancelErr)
										return ok
									},
								)
								if cancelItemNum == 0 {
									errDescMap := make(map[string]bool, len(g.errs))
									errs := make([]string, 0, len(g.errs))
									for i := range g.errs {
										if _, ok := errDescMap[g.errs[i].Error()]; !ok {
											errDescMap[g.errs[i].Error()] = true
											errs = append(errs, g.errs[i].Error())
										}
									}
									buf, _ := json.Marshal(errs)
									g.group.Reason = util.ValueToPtr(string(buf))
									errDescMap = nil
									errs = nil
								} else {
									g.group.Status = util.ValueToPtr(constant.Explore_Status_Canceled)
								}
								g.group.FinishedAt = &timeNow

								if err = g.e.repo.UpdateFinished(nil, ctx, g.group); err != nil {
									log.Errorf("report code %s g.e.repo.UpdateFinished failed: %v", *g.group.Code, err)
									panic(err)
								}
								if err = g.e.task_repo.UpdateExecStatusV2(tx, ctx, g.group.TaskID, *g.group.TaskVersion, *g.group.Status); err != nil {
									log.Errorf("report code %s g.e.task_repo.UpdateExecStatusV2 failed: %v", *g.group.Code, err)
									panic(err)
								}
							}()
						} else {
							func() {
								if len(g.updateFailedItems) > 0 {
									log.Errorf("report code %s report item update exist err, cannot update report exec success", *g.group.Code)
									return
								}

								g.group.Status = util.ValueToPtr(constant.Explore_Status_Success)
								g.group.FinishedAt = &timeNow

								var (
									err          error
									reportFormat any
									buf          []byte
								)
								if *g.group.ExploreType == ExploreType_Data {
									var report exploration.ReportFormat
									// 计算报告得分
									if report, err = g.e.getReport(nil, ctx, g.group); err == nil {
										g.group.TotalCompleteness = report.CompletenessScore
										g.group.TotalStandardization = report.StandardizationScore
										g.group.TotalUniqueness = report.UniquenessScore
										g.group.TotalAccuracy = report.AccuracyScore
										g.group.TotalConsistency = report.ConsistencyScore
										g.group.TotalScore = report.TotalScore
										reportFormat = report
									}
								} else if *g.group.ExploreType == ExploreType_Timestamp {
									reportFormat, err = g.e.getTimestampReport(nil, ctx, g.group)
								}
								if err != nil {
									log.Errorf("report code %s get report failed: %v", *g.group.Code, err)
									return
								}
								if buf, err = json.Marshal(reportFormat); err != nil {
									log.Errorf("report code %s json.Marshal failed, body: %v, err: %v", *g.group.Code, reportFormat, err)
									return
								}
								if len(buf) > 0 {
									g.group.Result = util.ValueToPtr(string(buf))
								} else {
									g.group.Result = nil
								}

								if err = g.e.repo.UpdateLatestStateV2(nil, ctx, g.group.TaskID, *g.group.TaskVersion); err != nil {
									log.Errorf("report code %s g.e.repo.UpdateLatestStateV2 failed: %v", *g.group.Code, err)
									return
								}

								tx := g.e.data.DB.WithContext(ctx).Begin()
								defer func() {
									if e := recover(); e != nil {
										tx.Rollback()
									} else if e = tx.Commit().Error; e != nil {
										tx.Rollback()
									}
								}()

								if err = g.e.repo.UpdateFinished(nil, ctx, g.group); err != nil {
									log.Errorf("report code %s g.e.repo.UpdateFinished failed: %v", *g.group.Code, err)
									panic(err)
								}
								if err = g.e.task_repo.UpdateExecStatusV2(tx, ctx, g.group.TaskID, *g.group.TaskVersion, *g.group.Status); err != nil {
									log.Errorf("report code %s g.e.task_repo.UpdateExecStatusV2 failed: %v", *g.group.Code, err)
									panic(err)
								}

								var (
									msg   string
									topic string
								)
								if *g.group.Status == constant.Explore_Status_Success {
									if *g.group.ExploreType == ExploreType_Data {
										topic = mq.ExploreDataFinishedTopic
										// 消息通知逻辑视图服务
										msg, err = newExploreDataFinishedMsg(ctx, g.group)
										if err != nil {
											log.Errorf("report code %s newExploreDataFinishedMsg failed: %v", *g.group.Code, errorcode.Detail(errorcode.MqProduceError, err))
											panic(err)
										}

									} else { // *g.group.ExploreType == ExploreType_Timestamp
										topic = mq.ExploreFinishedTopic
										// 消息通知逻辑视图服务
										msg, err = newExploreFinishedMsg(ctx, g.group)
										if err != nil {
											log.Errorf("report code %s newExploreFinishedMsg failed: %v", *g.group.Code, errorcode.Detail(errorcode.MqProduceError, err))
											panic(err)
										}
									}
									err = g.e.mq_producter.SyncProduce(topic, util.StringToBytes(*g.group.TableID), util.StringToBytes(msg))
									if err != nil {
										log.Errorf("report code %s g.e.mq_producter.SyncProduce failed: %v", *g.group.Code, errorcode.Detail(errorcode.MqProduceError, err))
										panic(err)
									}
								}
							}()
						}
					}()
					return
				}
			}
		}
	}(g, mdlID, reportItems)
	return err
}

func (g *groupManager) stop() {
	defer recover()
	g.cancel()
	close(g.tChan)
}
