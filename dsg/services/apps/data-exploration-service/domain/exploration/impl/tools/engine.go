package tools

import (
	"context"
	"fmt"
	"io"

	engine "github.com/kweaver-ai/dsg/services/apps/data-exploration-service/adapter/driven/virtualization_engine"
	log "github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"go.uber.org/zap"
)

type EngineSource struct {
	Client engine.VirtualizationEngine
}

func NewEngineSource(engine engine.VirtualizationEngine) EngineSource {
	return EngineSource{
		Client: engine,
	}
}

/*
// Search 数据实时探查，为避免查询虚拟化引擎执行超时，设置较长的超时时间
func (e EngineSource) Search(ctx context.Context, sql string) ([]map[string]any, error) {
	log.Info(fmt.Sprintf("vitriEngine excute sql : %s", sql))
	result, err := e.Client.RawWithTimeOut(ctx, sql, 2*time.Minute)
	if err != nil {
		return nil, errorcode.Detail(errorcode.PublicExploreError, err)
	}
	return e.Format(result)
}*/
/*
// AsyncSearch 数据异步探查，返回的是taskid
func (e EngineSource) AsyncSearch(ctx context.Context, sql string) ([]string, error) {
	log.Info(fmt.Sprintf("vitriEngine excute sql : %s", sql))
	result, err := e.Client.AsyncRaw(ctx, sql)
	if result == nil || err != nil {
		return nil, err
	}
	return result.TaskId, nil
}*/

// AsyncExplore 数据异步探查，返回的是taskid
func (e EngineSource) AsyncExplore(ctx context.Context, param io.Reader, exploreType int) ([]string, error) {
	log.Info(fmt.Sprintf("vitriEngine excute param : %s", param))
	result, err := e.Client.AsyncExplore(ctx, param, exploreType)
	if result == nil || err != nil {
		return nil, err
	}
	return result.TaskId, nil
}

func (e EngineSource) Format(response *engine.RawResult) (result []map[string]any, err error) {
	data := make([]map[string]any, 0, len(response.Data))
	for _, datum := range response.Data {
		m := make(map[string]any)
		for i, column := range response.Columns {
			// if datum[i] != nil {
			// 	m[column.Name] = datum[i]
			// } else {
			// 	m[column.Name] = nil
			// }
			m[column.Name] = datum[i]
		}
		data = append(data, m)
	}

	cMap := make(map[string]string)
	for _, column := range response.Columns {
		cMap[fmt.Sprintf("%s", column.Name)] = column.Name
	}

	retArr := make([]map[string]any, 0)
	for _, datum := range data {
		retM := make(map[string]any)
		for _, value := range cMap {
			dv, ok := datum[value]
			if ok {
				retM[value] = dv
			}
		}

		if len(retM) > 0 {
			retArr = append(retArr, retM)
		}
	}

	log.Info("virtual engine result:", zap.Any("ret:", retArr))
	if len(retArr) <= 0 {
		return retArr, fmt.Errorf("empty virtual engine result %v", retArr)
	}
	return retArr, nil
}

type void struct{}

var member void

/*
func (e EngineSource) Columns(ctx context.Context, tableInfo exploration.MetaDataTableInfo) (map[string]exploration.ColumnInfo, error) {
	results, err := e.Client.Columns(ctx, tableInfo.VeCatalogId, tableInfo.SchemaName, tableInfo.Name)
	if err != nil {
		return nil, err
	}
	columns := make(map[string]exploration.ColumnInfo)
	for _, result := range results.Columns {
		columnInfo := exploration.ColumnInfo{
			Name:       result.Name,
			Type:       result.Type,
			OriginType: result.OrigType,
			Comment:    result.Name,
		}
		columns[result.Name] = columnInfo
	}
	return columns, nil
}
*/
