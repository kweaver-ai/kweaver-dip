package datasource

import (
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
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

func ToModel(p *DatasourcePayload) *model.Datasource {
	datasource := &model.Datasource{
		ID:             p.ID,
		InfoSystemID:   p.InfoSystemID,
		Name:           p.Name,
		CatalogName:    p.CatalogName,
		Host:           p.Host,
		Port:           p.Port,
		Username:       p.Username,
		Password:       p.Password,
		DatabaseName:   p.DatabaseName,
		Schema:         p.Schema,
		SourceType:     p.SourceType,
		UpdatedAt:      time.Now(),
		DataViewSource: p.CatalogName + "." + p.DatabaseName,
		TypeName:       p.Type,
		DepartmentId:   p.DepartmentId,
	}
	if p.Schema != "" {
		datasource.DataViewSource = p.CatalogName + "." + p.Schema
	}
	return datasource
}
