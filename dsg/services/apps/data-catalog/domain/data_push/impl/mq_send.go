package impl

import (
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-catalog/adapter/driver/mq"
	"github.com/kweaver-ai/dsg/services/apps/data-catalog/infrastructure/repository/db/model"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"github.com/samber/lo"
)

// SendPushSuccessMsg  推送成功，发送下MQ消息
func (u *useCase) SendPushSuccessMsg(pushModel *model.TDataPushModel) {
	if pushModel.TargetSandboxID == "" {
		return
	}
	body := kafkax.NewRawMessage()
	body["sandbox_id"] = pushModel.TargetSandboxID
	body["target_table_name"] = pushModel.TargetTableName
	msg := kafkax.NewMessage(body, kafkax.NewRawMessage())
	if err := u.producer.Send(mq.TOPIC_DATA_PUSH_TASK_EXECUTING, lo.T2(json.Marshal(msg)).A); err != nil {
		log.Warnf("send push message failed, err:%v", err)
	}
}
