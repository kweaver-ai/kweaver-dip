package datasource

import (
	"context"
	"database/sql"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/repository/db/model"
)

// mockgen  -source "adapter/driven/mq/datasource/handle.go"  -destination="interface/mock/datasource_mq_mock.go" -package=mock

type DataSourceHandle interface {
	CreateDataSource(ctx context.Context, payload *DatasourcePayload) error
	UpdateDataSource(ctx context.Context, payload *DatasourcePayload) error
	DeleteDataSource(ctx context.Context, payload *DatasourcePayload) error
}

const (
	DataSourceTopic = "af.configuration-center.datasource"
)

type DatasourceMessage struct {
	Payload *DatasourcePayload `json:"payload"`
	Header  *DatasourceHeader  `json:"header"`
}
type DatasourceHeader struct {
	Method string `json:"method"`
}
type DatasourcePayload struct {
	ID            string `json:"id"`
	InfoSystemID  string `json:"info_system_id"`
	Name          string `json:"name"`
	CatalogName   string `json:"catalog_name"`
	Type          string `json:"type"`
	Host          string `json:"host"`
	Port          int32  `json:"port"`
	Username      string `json:"username"`
	Password      string `json:"password"`
	GuardianToken string `json:"guardian_token"`
	DatabaseName  string `json:"database_name"`
	Schema        string `json:"schema"`
	SourceType    int32  `json:"source_type"`
	DepartmentId  string `json:"department_id"`  //关联部门id
	Enabled       bool   `json:"enabled"`        //是否启用
	HuaAoId       string `json:"hua_ao_id"`      //华傲数据源id
	ConnectStatus string `json:"connect_status"` //连接状态 1已连接 2未连接
	UpdateTime    string `json:"update_time"`    //更新时间
}

func (p *DatasourcePayload) Copier(d *model.Datasource, token string) {
	p.ID = d.ID
	p.InfoSystemID = d.InfoSystemID.String
	p.Name = d.Name
	p.CatalogName = d.CatalogName
	p.Host = d.Host
	p.Port = d.Port
	p.Username = d.Username
	p.Password = d.Password
	p.GuardianToken = token
	p.DatabaseName = d.DatabaseName
	p.Schema = d.Schema
	p.SourceType = d.SourceType
	p.HuaAoId = d.HuaAoId
	p.DepartmentId = d.DepartmentId
}

func ToModel(p *DatasourcePayload) *model.Datasource {
	return &model.Datasource{
		ID:           p.ID,
		InfoSystemID: sql.NullString{String: p.InfoSystemID, Valid: p.InfoSystemID != ""},
		Name:         p.Name,
		CatalogName:  p.CatalogName,
		Host:         p.Host,
		Port:         p.Port,
		Username:     p.Username,
		Password:     p.Password,
		DatabaseName: p.DatabaseName,
		Schema:       p.Schema,
		SourceType:   p.SourceType,
		UpdatedAt:    time.Now(),
		TypeName:     p.Type,
		//ConnectStatus: p.ConnectStatus, todo transfer
	}
}

type Type string

const (
	Oracle       Type = "oracle"
	Postgresql   Type = "postgresql"
	Doris        Type = "doris"
	Sqlserver    Type = "sqlserver"
	Hive         Type = "hive"
	Clickhouse   Type = "clickhouse"
	Mysql        Type = "mysql"
	Maria        Type = "maria"
	Mongodb      Type = "mongodb"
	Dameng       Type = "dameng"
	Hologres     Type = "hologres"
	Gaussdb      Type = "gaussdb"
	Excel        Type = "excel"
	Opengauss    Type = "opengauss"
	InceptorJdbc Type = "inceptor-jdbc"
	Tingyun      Type = "tingyun"
	Anyshare7    Type = "anyshare7"
	Maxcompute   Type = "maxcompute"
	Opensearch   Type = "opensearch"
)
