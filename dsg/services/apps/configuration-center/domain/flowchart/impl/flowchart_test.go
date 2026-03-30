package impl

import (
	"context"
	"fmt"
	"testing"

	impl3 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_node_task/impl"
	impl4 "github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driven/gorm/flowchart_version/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/logx/zapx"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func get2() *gorm.DB {
	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
		"root",
		"***",
		"10.4.119.40",
		3330,
		"af_configuration")))
	if err != nil {
		//log.Errorf("open mysql failed,err:", err)
		return nil
	}
	return DB
}
func Test_flowchartUseCase_Migration(t *testing.T) {
	tc := settings.ConfigInstance.Config.DepServices.TelemetryConf
	options := zapx.LogConfigs{}
	log.InitLogger(options, &tc)
	flowchartUseCase := NewFlowchartUseCase(nil, impl4.NewFlowchartVersionRepoNative(get2()), nil, nil, impl3.NewFlowchartNodeTaskNative(get2()), nil, nil, nil)
	if err := flowchartUseCase.Migration(context.Background()); err != nil {
		t.Log("task Migration failed,err:", err)
	}
}
