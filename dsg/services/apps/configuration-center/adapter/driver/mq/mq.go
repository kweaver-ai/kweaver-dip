package mq

import (
	"errors"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/datasource"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/department"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/impl"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/impl/kafka"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/impl/nsq"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/user_mgm"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/settings"
	kafka_infra "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	nsq_infra "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/nsq"
)

func NewMQ(
	user *user_mgm.Handler,
	department *department.Handler,
	datasource *datasource.Handler,
) (impl.MQ, error) {
	var mq impl.MQ
	switch settings.ConfigInstance.Config.MQType {
	case "nsq":
		consumer := nsq_infra.NewConsumer()
		producer := nsq_infra.NewProducer()
		mq = nsq.New(consumer, producer)
	case "kafka":
		consumer := kafka_infra.NewConsumer()
		producer, err := kafka_infra.NewSyncProducer()
		if err != nil {
			return nil, err
		}
		mq = kafka.New(consumer, producer)
	default:
		return nil, errors.New(fmt.Sprintf("settings.ConfigInstance.Config.MQType :%s ", settings.ConfigInstance.Config.MQType))

	}
	mq.Handler(UserCreateTopic, user.Wrap(kafka_infra.ProtonUserCreateTopic, user.CreateUser))
	mq.Handler(NameModifyTopic, user.Wrap(kafka_infra.ProtonNameModifyTopic, user.ModifyUser))
	mq.Handler(UserMobileMailTopic, user.ModifyMobileMailUser)
	mq.Handler(DeleteUserFormTopic, user.Wrap(kafka_infra.ProtonDeleteUserFormTopic, user.DeleteUser))
	mq.Handler(CreateDepartmentTopic, department.CreateDepartmentMessage)
	mq.Handler(DeleteDepartment, department.DeleteDepartmentMessage)
	mq.Handler(MoveDepartment, department.MoveDepartmentMessage)
	mq.Handler("adp.datasource", datasource.ConsumeDatasource)
	return mq, nil
}
