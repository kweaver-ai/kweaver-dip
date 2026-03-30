package impl

import (
	"fmt"
	"log"
	"testing"
	"time"

	"github.com/kweaver-ai/dsg/services/apps/data-view/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/data-view/infrastructure/db/model"
	"go.uber.org/zap"
	"gorm.io/driver/mysql"
	"gorm.io/gorm"
)

func Test_logicViewRepo_consumerWorkflowAuditResult(t *testing.T) {
	//logicViewRepo = NewLogicViewRepo(get(),nil,nil,nil,nil,nil,nil)
	ti := time.Now()
	formView := &model.FormView{
		UpdatedAt: ti,
	}
	formView.OnlineStatus = constant.LineStatusOnLine
	formView.OnlineTime = &ti
	db := get()
	err := db.Model(formView).
		Where(&model.FormView{ApplyID: 56}).
		Updates(formView).Error
	if err != nil {
		t.Error("logicViewRepo consumerWorkflowAuditResult Update", zap.Error(err))
	}
	err = db.Model(formView).
		Where(&model.FormView{ApplyID: 56}).
		Take(&formView).Error
	if err != nil {
		t.Error("logicViewRepo consumerWorkflowAuditResult Update", zap.Error(err))

	}
	fmt.Println(formView)

}

func get() *gorm.DB {
	DB, err := gorm.Open(mysql.Open(fmt.Sprintf("%s:%s@(%s:%d)/%s?charset=utf8mb4&parseTime=true",
		"root",
		"eisoo.com123",
		"10.4.109.181",
		3320,
		"af_main")))
	if err != nil {
		log.Println("open mysql failed,err:", err)
		return nil
	}
	return DB
}
