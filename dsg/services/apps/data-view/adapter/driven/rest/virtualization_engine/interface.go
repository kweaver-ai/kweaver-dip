package virtualization_engine

import (
	"context"
)

//mockgen  -source "adapter/driven/virtualization_engine/interface.go"  -destination="interface/mock/virtualization_engine_mock.go" -package=mock

//http://api.aishu.cn/project/3003/interface/api/cat_17977

type DrivenVirtualizationEngine interface {
	GetView(ctx context.Context, req *GetViewReq) (*GetViewRes, error) //查询视图
	CreateView(ctx context.Context, req *CreateViewReq) error          //新增视图
	DeleteView(ctx context.Context, req *DeleteViewReq) error          //删除视图
	ModifyView(ctx context.Context, req *ModifyViewReq) error          //修改视图
	CreateViewSource(ctx context.Context, req *CreateViewSourceReq) ([]*CreateViewSourceRes, error)
	DeleteDataSource(ctx context.Context, req *DeleteDataSourceReq) error
	FetchData(ctx context.Context, statement string) (*FetchDataRes, error)
	FetchAuthorizedData(ctx context.Context, statement string, req *FetchReq) (*FetchDataRes, error)
	GetConnectors(ctx context.Context) (*GetConnectorsRes, error)

	StreamDataFetch(ctx context.Context, urlStr string, statement string) (*StreamFetchResp, error)
	StreamDataDownload(ctx context.Context, urlStr string, req *StreamDownloadReq) (*StreamFetchResp, error)

	CreateExcelView(ctx context.Context, req *CreateExcelViewReq) (*CreateExcelViewRes, error) //新增Excel视图
	DeleteExcelView(ctx context.Context, req *DeleteExcelViewReq) (*DeleteExcelViewRes, error) //删除Excel视图
	GetPreview(ctx context.Context, req *ViewEntries) (*FetchDataRes, error)
}

//region GetView

type GetViewReq struct {
	PageNum  int `json:"pageNum"`
	PageSize int `json:"pageSize"`
}
type GetViewRes struct {
	Msg  int            `json:"total"`
	Code int            `json:"pages"`
	Data []*ViewEntries `json:"entries"`
}
type ViewEntries struct {
	CatalogName string `json:"catalogName"`
	ViewName    string `json:"viewName"`
	Schema      string `json:"schema"`
	Limit       int    `json:"limit"`
	UserId      string `json:"user_id"`
}

//endregion

//region createView

type CreateViewReq struct {
	CatalogName string `json:"catalogName"` // 数据源catalog
	Query       string `json:"query"`
	ViewName    string `json:"viewName"`
}

//endregion

//region DeleteView

type DeleteViewReq struct {
	CatalogName string `json:"catalogName"` // 数据源catalog
	ViewName    string `json:"viewName"`
}

//endregion

//region ModifyView

type ModifyViewReq struct {
	CatalogName string `json:"catalogName"` // 数据源catalog
	Query       string `json:"query"`
	ViewName    string `json:"viewName"`
}

//endregion

//region CreateViewSource

type CreateViewSourceReq struct {
	CatalogName   string `json:"catalogName"`
	ConnectorName string `json:"connectorName"`
}

type CreateViewSourceRes struct {
	Name string `json:"name"`
}

//endregion

//region DeleteDataSource

type DeleteDataSourceReq struct {
	CatalogName string `json:"catalogName"` // 数据源catalog
}

//endregion

//region DeleteDataSource

type FetchDataRes struct {
	TotalCount int       `json:"total_count"`
	Columns    []*Column `json:"columns"`
	Data       [][]any   `json:"data"`
}
type Column struct {
	Name string `json:"name"`
	Type string `json:"type"`
}

//endregion

// GetConnectorsRes 代表虚拟化引擎的查询所有支持数据源的返回值结构
type GetConnectorsRes struct {
	ConnectorNames []GetConnectorsResConnector `json:"connectorNames,omitempty"`
}

// GetConnectorsResConnector 代表虚拟化引擎的查询所有支持数据源接口的返回值中的一个数据源
//
// Definition: http://api.aishu.cn/project/3003/interface/api/93478
type GetConnectorsResConnector struct {
	OLKConnectorName string `json:"olkConnectorName,omitempty"`

	ShowConnectorName string `json:"showConnectorName,omitempty"`
}

type StreamFetchResp struct {
	NextURI string `json:"nextUri"`
	FetchDataRes
}

type DownloadDataReq struct {
	Catalog  string `json:"catalog"`             // catalog名称
	Schema   string `json:"schema"`              // schema名称
	Table    string `json:"table"`               // 表名称
	Columns  string `json:"columns"`             // 要下载的列名称（多个列以;隔开）
	RowRules string `json:"row_rules,omitempty"` // 行限制条件（多个条件以;隔开）
	OrderBy  string `json:"order_by,omitempty"`  // 排序字句（多个排序子句以;隔开）如"a desc;b asc;c desc"
	Offset   uint64 `json:"offset"`              // 偏移量
	Limit    uint64 `json:"limit"`               // 下载行数限制
	Action   string `json:"action"`              // 动作类型
}

type StreamDownloadReq struct {
	UserID string
	DownloadDataReq
}

//region  CreateExcelView 新增Excel视图

type CreateExcelViewReq struct {
	Catalog          string         `json:"catalog"`
	FileName         string         `json:"file_name"`
	TableName        string         `json:"table_name"`
	Columns          []*ExcelColumn `json:"columns"`
	VDMCatalog       string         `json:"vdm_catalog"`
	StartCell        string         `json:"start_cell"`
	EndCell          string         `json:"end_cell"`
	Sheet            string         `json:"sheet"`
	AllSheet         bool           `json:"all_sheet"`
	SheetAsNewColumn bool           `json:"sheet_as_new_column"`
	HasHeaders       bool           `json:"has_headers"`
}

type ExcelColumn struct {
	Column string `json:"column"`
	Type   string `json:"type"`
}
type CreateExcelViewRes struct {
	TableName string `json:"tableName"`
	ViewName  string `json:"viewName"`
}

//endregion

//region  DeleteExcelView 删除Excel视图

type DeleteExcelViewReq struct {
	VdmCatalog string `json:"vdm_catalog"`
	Schema     string `json:"schema"`
	View       string `json:"view"`
}

type DeleteExcelViewRes struct {
	ViewName string `json:"viewName"`
}

//endregion

type FetchReq struct {
	UserID string `json:"user_id"`
	Action string `json:"action"` // 动作类型
}
