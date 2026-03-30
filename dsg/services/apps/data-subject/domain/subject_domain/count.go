package subject_domain

import (
	"context"
	"strings"

	"github.com/kweaver-ai/idrm-go-common/util"

	"github.com/kweaver-ai/dsg/services/apps/data-subject/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-subject/infrastructure/db/model"
	"github.com/kweaver-ai/idrm-go-common/rest/data_application_service"
	"github.com/kweaver-ai/idrm-go-common/rest/data_view"
	"github.com/kweaver-ai/idrm-go-common/rest/indicator_management"
	"github.com/kweaver-ai/idrm-go-common/util/iter"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

//按照业务域统计各级关联数据数量的代码，不对外的逻辑

type Counter struct {
	con            *Concurrence[TaskNoErr]
	FormViewTotal  int64
	IndicatorTotal int64
	InterfaceTotal int64
	FormViewCount  map[string]int64
	IndicatorCount map[string]int64
	InterfaceCount map[string]int64
}

func NewEmptyCounter() *Counter {
	return &Counter{
		con:            NewConcurrence[TaskNoErr](),
		FormViewCount:  make(map[string]int64),
		InterfaceCount: make(map[string]int64),
		IndicatorCount: make(map[string]int64),
	}
}

// NewGroupCounter 业务域分组内部的统计器
func (c *SubjectDomainUsecase) NewGroupCounter(ctx context.Context, objects []*model.SubjectDomain) *Counter {
	counter := NewEmptyCounter()
	isOperator := c.isOperator(ctx)
	counter.con.Add(func(ctx context.Context) {
		counter.FormViewCount = c.queryViewCount(ctx, isOperator, objects)
	})
	counter.con.Add(func(ctx context.Context) {
		counter.InterfaceCount = c.queryAppServiceCount(ctx, isOperator, objects)
	})
	counter.con.Add(func(ctx context.Context) {
		counter.IndicatorCount = c.queryIndicatorCount(ctx, isOperator, objects)
	})
	counter.con.Run(ctx)
	return counter
}

// NewAllCounter 顶层的总数计算器
func (c *SubjectDomainUsecase) NewAllCounter(ctx context.Context) *Counter {
	counter := NewEmptyCounter()
	isOperator := c.isOperator(ctx)
	relationDict, err := c.repo.GetRootRelation(ctx)
	if err != nil {
		log.Errorf("query subject root relation fail, %v", err.Error())
		return counter
	}
	counter.con.Add(func(ctx context.Context) {
		counter.FormViewCount, err = c.queryViewCountAll(ctx, isOperator, relationDict)
		if err != nil {
			log.Errorf("query form view subject count fail, %v", err.Error())
		}
	})
	counter.con.Add(func(ctx context.Context) {
		counter.InterfaceCount, err = c.queryAppServiceCountAll(ctx, isOperator, relationDict)
		if err != nil {
			log.Errorf("query data application interface service subject count fail, %v", err.Error())
		}
	})
	counter.con.Add(func(ctx context.Context) {
		counter.IndicatorCount, err = c.queryIndicatorCountAll(ctx, isOperator, relationDict)
		if err != nil {
			log.Errorf("query indicator subject fail fail, %v", err.Error())
		}
	})
	counter.con.Run(ctx)
	return counter
}
func (c *SubjectDomainUsecase) NewTotalCounter(ctx context.Context) *Counter {
	counter := NewEmptyCounter()
	isOperator := c.isOperator(ctx)
	counter.con.Add(func(ctx context.Context) {
		viewCountResp, err := c.dataViewDriven.QueryViewCount(ctx, data_view.QueryFlagTotal, isOperator)
		if err != nil {
			log.Errorf("query view total error %v", err.Error())
		} else {
			counter.FormViewTotal = viewCountResp.Total
		}
	})
	counter.con.Add(func(ctx context.Context) {
		total, err := c.classifyRepo.QueryIndicatorCount(ctx)
		if err != nil {
			log.Errorf("query indicator total error %v", err.Error())
		} else {
			counter.IndicatorTotal = total
		}
	})
	counter.con.Add(func(ctx context.Context) {
		total, err := c.classifyRepo.QueryInterfaceCount(ctx, isOperator)
		if err != nil {
			log.Errorf("query interface total error %v", err.Error())
		} else {
			counter.InterfaceTotal = total
		}
	})
	counter.con.Run(ctx)
	return counter
}

// queryViewCount 查询逻辑实体关联的逻辑视图计数
func (c *SubjectDomainUsecase) queryViewCount(ctx context.Context, isOperator bool, objects []*model.SubjectDomain) map[string]int64 {
	//a. 查询逻辑实体关联的逻辑视图
	subjectIDSlice := iter.Gen[string](objects, func(info *model.SubjectDomain) string {
		if info.Type <= constant.LogicEntity {
			return info.ID
		}
		return ""
	})
	var err error
	//查询关联的视图数据
	countMap := make(map[string]int64)
	if len(subjectIDSlice) > 0 {
		countMap, err = c.dataViewDriven.QueryViewCountInMap(ctx, data_view.QueryFlagCount, isOperator, subjectIDSlice...)
		if err != nil {
			log.Errorf("query data view from logical entity error %v", err.Error())
		}
	}
	if countMap == nil {
		countMap = make(map[string]int64)
	}
	summary(objects, countMap)
	return countMap
}

// queryIndicatorCount 查询各级关联的指标
func (c *SubjectDomainUsecase) queryIndicatorCount(ctx context.Context, isOperator bool, objects []*model.SubjectDomain) map[string]int64 {
	subjectIDSlice := iter.Gen[string](objects, func(info *model.SubjectDomain) string {
		if info.Type <= constant.BusinessActivity {
			return info.ID
		}
		return ""
	})
	var err error
	countMap := make(map[string]int64)
	if len(subjectIDSlice) > 0 {
		countMap, err = c.indicatorDriven.QueryDomainIndicatorCountMap(ctx, indicator_management.QueryFlagCount, subjectIDSlice...)
		if err != nil {
			log.Errorf("query related indicator count error %v", err.Error())
		}
	}
	if countMap == nil {
		countMap = make(map[string]int64)
	}
	summary(objects, countMap)
	return countMap
}

// queryAppServiceCount 查询接口服务数据统计
func (c *SubjectDomainUsecase) queryAppServiceCount(ctx context.Context, isOperator bool, objects []*model.SubjectDomain) map[string]int64 {
	subjectIDSlice := iter.Gen[string](objects, func(info *model.SubjectDomain) string {
		if info.Type <= constant.BusinessActivity {
			return info.ID
		}
		return ""
	})
	var err error
	countMap := make(map[string]int64)
	if len(subjectIDSlice) > 0 {
		countMap, err = c.appServiceDriven.QueryDomainApplicationServiceCountMap(ctx, data_application_service.QueryFlagCount, isOperator, subjectIDSlice...)
		if err != nil {
			log.Errorf("query related indicator count error %v", err.Error())
		}
	}
	if countMap == nil {
		countMap = make(map[string]int64)
	}
	summary(objects, countMap)
	return countMap
}

// 下面是处理所有的根节点的逻辑--------------------------------------------------------------------------------

func (c *SubjectDomainUsecase) queryViewCountAll(ctx context.Context, isOperator bool, relationDict map[string]string) (map[string]int64, error) {
	countMap, err := c.dataViewDriven.QueryViewCountInMap(ctx, data_view.QueryFlagAll, isOperator)
	if err != nil {
		log.Errorf("query data view from logical entity error %v", err.Error())
		return nil, err
	}
	return c.rootSummary(relationDict, countMap)
}

func (c *SubjectDomainUsecase) queryIndicatorCountAll(ctx context.Context, isOperator bool, relationDict map[string]string) (map[string]int64, error) {
	var err error
	countMap, err := c.indicatorDriven.QueryDomainIndicatorCountMap(ctx, indicator_management.QueryFlagAll)
	if err != nil {
		log.Errorf("query related indicator count error %v", err.Error())
		return nil, err
	}
	return c.rootSummary(relationDict, countMap)
}

func (c *SubjectDomainUsecase) queryAppServiceCountAll(ctx context.Context, isOperator bool, relationDict map[string]string) (map[string]int64, error) {
	countMap, err := c.appServiceDriven.QueryDomainApplicationServiceCountMap(ctx, data_application_service.QueryFlagAll, isOperator)
	if err != nil {
		log.Errorf("query related indicator count error %v", err.Error())
		return nil, err
	}
	return c.rootSummary(relationDict, countMap)
}

// rootSummary 统计顶层的数量
func (c *SubjectDomainUsecase) rootSummary(relationDict map[string]string, countInfo map[string]int64) (map[string]int64, error) {
	result := make(map[string]int64)
	for k, v := range countInfo {
		root, ok := relationDict[k]
		if ok {
			result[root] += v
		}
	}
	return result, nil
}

func (c *SubjectDomainUsecase) isOperator(ctx context.Context) bool {
	//判断用户的角色，如果有token，采取查询下，确定是数据运营或者数据加工，才显示全部的数据
	token := util.ObtainToken(ctx)
	if token != "" {
		//roles := []string{access_control.TCDataOperationEngineer, access_control.TCDataDevelopmentEngineer}
		//isOperator, err := c.ccDriven.HasRoles(ctx, roles...)
		//if err != nil {
		//	log.Errorf("query user has role error %v", err.Error())
		//}
		//return isOperator
		return true
	}
	return false
}

// summary 根据objects里面的层级结构，将统计数量countInfo按层级统计
func summary(objects []*model.SubjectDomain, countInfo map[string]int64) {
	if len(countInfo) <= 0 {
		return
	}
	//计和计数，每个值，只能向上加一次，但是可以被加很多次
	for i := 0; i < len(objects); i++ {
		path := objects[i].PathID
		ids := strings.Split(path, "/")
		if len(ids) < 2 {
			continue
		}
		accumlate := countInfo[ids[len(ids)-1]]
		for j := len(ids) - 2; j >= 0; j-- {
			countInfo[ids[j]] += accumlate
		}
	}
}
