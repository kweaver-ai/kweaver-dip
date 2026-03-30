package microservice

import (
	"context"
	"errors"

	"github.com/imroc/req/v2"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/errorcode"
	"github.com/kweaver-ai/dsg/services/apps/data-application-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"go.uber.org/zap"
)

type Catalogs []string

type CatalogListRes struct {
	Entries    []Catalog `json:"entries"`
	TotalCount int       `json:"total_count"`
}

type Catalog struct {
	CatalogName   string `json:"catalogName"`
	ConnectorName string `json:"connectorName"`
}

type DataSchema struct {
	CatalogName string   `json:"catalogName"`
	Schemas     []string `json:"schemas"`
}

type Schema struct {
	CatalogName string `json:"catalog_name"`
	SchemaName  string `json:"schema_name"`
}

type TableListRes struct {
	Data       []DataTable `json:"data"`
	TotalCount int         `json:"total_count"`
}

type DataTable struct {
	Catalog string `json:"catalog"`
	Schema  string `json:"schema"`
	Table   string `json:"table"`
	Fqn     string `json:"fqn"`
}

type DataTableColumnRes struct {
	Data       []DataTableColumn `json:"data"`
	TotalCount int               `json:"total_count"`
}
type DataTableColumn struct {
	Name     string `json:"name"`
	Type     string `json:"type"`
	OrigType string `json:"origType"`
	Comment  string `json:"comment"`
}

type VirtualEngineError struct {
	Code        string `json:"code,omitempty"`
	Description string `json:"description,omitempty"`
	Detail      string `json:"detail,omitempty"`
	Solution    string `json:"solution,omitempty"`
}

type VirtualEngineRepo interface {
	CatalogList(ctx context.Context) (catalogs Catalogs, err error)
	DataTableList(ctx context.Context, catalogName string, schemaName string) (dataTables []DataTable, err error)
	DataTableColumn(ctx context.Context, catalogName string, schemaName, tableName string) (dataTableColumns []DataTableColumn, err error)
}

type virtualEngineRepo struct{}

func NewVirtualEngineRepo() VirtualEngineRepo {
	return &virtualEngineRepo{}
}

func (d *virtualEngineRepo) CatalogList(ctx context.Context) (catalogs Catalogs, err error) {
	//req.DevMode()
	response, err := req.SetHeader("X-Presto-User", "admin").Get(settings.Instance.Services.VirtualEngine + "/api/virtual_engine_service/v1/catalog")
	if err != nil {
		log.WithContext(ctx).Error("CatalogList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("CatalogList", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}

	var catalogListRes = &CatalogListRes{}
	err = response.Unmarshal(&catalogListRes)
	if err != nil {
		log.WithContext(ctx).Error("CatalogList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	for _, catalog := range catalogListRes.Entries {
		catalogs = append(catalogs, catalog.CatalogName)
	}

	return catalogs, nil
}

func (d *virtualEngineRepo) DataTableList(ctx context.Context, catalogName string, schemaName string) (dataTables []DataTable, err error) {
	//req.DevMode()
	response, err := req.SetHeader("X-Presto-User", "admin").Get(settings.Instance.Services.VirtualEngine + "/api/virtual_engine_service/v1/metadata/tables/" + catalogName + "/" + schemaName)
	if err != nil {
		log.WithContext(ctx).Error("DataTableList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if response.StatusCode != 200 {
		log.WithContext(ctx).Error("DataTableList", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.InternalError, response.String())
	}

	var tableListRes = &TableListRes{}
	err = response.Unmarshal(&tableListRes)
	if err != nil {
		log.WithContext(ctx).Error("DataTableList", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return tableListRes.Data, nil
}

func (d *virtualEngineRepo) DataTableColumn(ctx context.Context, catalogName string, schemaName, tableName string) (dataTableColumns []DataTableColumn, err error) {
	//req.DevMode()
	response, err := req.SetHeader("X-Presto-User", "admin").Get(settings.Instance.Services.VirtualEngine + "/api/virtual_engine_service/v1/metadata/columns/" + catalogName + "/" + schemaName + "/" + tableName)
	if err != nil {
		log.WithContext(ctx).Error("DataTableColumn", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	if response.StatusCode != 200 {
		virtualEngineError := &VirtualEngineError{}
		err := response.Unmarshal(virtualEngineError)
		if err != nil {
			return nil, errorcode.Detail(errorcode.InternalError, err.Error())
		}
		log.WithContext(ctx).Error("DataTableColumn", zap.Error(errors.New(response.String())))
		return nil, errorcode.Detail(errorcode.MicroServiceVirtualEngineError, virtualEngineError.Solution)
	}

	var dataTableColumnRes = &DataTableColumnRes{}
	err = response.Unmarshal(&dataTableColumnRes)
	if err != nil {
		log.WithContext(ctx).Error("DataTableColumn", zap.Error(err))
		return nil, errorcode.Detail(errorcode.InternalError, err.Error())
	}

	return dataTableColumnRes.Data, nil
}
