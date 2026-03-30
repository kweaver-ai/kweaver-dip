// Package svc 服务上下文
package svc

import (
	"fmt"
	"log"

	"github.com/kweaver-ai/dsg/services/apps/data-semantic/consumer/internal/config"
	"github.com/zeromicro/go-zero/core/stores/sqlx"
)

// ServiceContext 服务上下文
type ServiceContext struct {
	Config config.Config
	DB     sqlx.SqlConn
}

// NewServiceContext 创建服务上下文
func NewServiceContext(c config.Config) *ServiceContext {
	// 构建数据源字符串
	dataSource := fmt.Sprintf("%s:%s@tcp(%s:%d)/%s?charset=%s&parseTime=true",
		c.DB.Default.Username,
		c.DB.Default.Password,
		c.DB.Default.Host,
		c.DB.Default.Port,
		c.DB.Default.Database,
		c.DB.Default.Charset,
	)

	// 初始化数据库连接
	db := sqlx.NewMysql(dataSource)
	log.Printf("数据库连接已建立: %s@%s:%d/%s",
		c.DB.Default.Username, c.DB.Default.Host, c.DB.Default.Port, c.DB.Default.Database)

	return &ServiceContext{
		Config: c,
		DB:     db,
	}
}
