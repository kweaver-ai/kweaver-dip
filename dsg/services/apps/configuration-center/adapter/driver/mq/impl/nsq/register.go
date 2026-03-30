package nsq

/*
import (
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/department"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/adapter/driver/mq/user_mgm"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/nsqx"
	"github.com/nsqio/go-nsq"
)

type NSQConsumer struct {
	consumer   nsqx.Consumer
	producer   kafkax.Producer
	user       *user_mgm.Handler
	department *department.Handler
}

func NewNSQConsumer(
	consumer nsqx.Consumer,
	producer kafkax.Producer,
	user *user_mgm.Handler,
	department *department.Handler,
) *NSQConsumer {
	return &NSQConsumer{
		consumer:   consumer,
		producer:   producer,
		user:       user,
		department: department,
	}
}

func (n *NSQConsumer) Wrap(topic string, cmd nsq.HandlerFunc) func(msg *nsq.Message) error {
	return func(msg *nsq.Message) error {
		if err := cmd(msg); err != nil {
			return err
		}
		//如果成功，那就发送kafka
		return n.producer.Send(topic, msg.Body)
	}
}

func (n *NSQConsumer) Register() {
	//用户消息
	n.consumer.Register(mq.UserCreateTopic, n.Wrap(kafka.ProtonUserCreateTopic, n.user.CreateUser))
	n.consumer.Register(mq.NameModifyTopic, n.Wrap(kafka.ProtonNameModifyTopic, n.user.ModifyUser))
	n.consumer.Register(mq.DeleteUserFormTopic, n.Wrap(kafka.ProtonDeleteUserFormTopic, n.user.DeleteUser))
	//apps消息
	n.consumer.Register(mq.AppsCreateTopic, n.Wrap(kafka.AppsCreateTopic, n.user.CreateUser))
	n.consumer.Register(mq.AppsNameModifyTopic, n.Wrap(kafka.AppsNameModifyTopic, n.user.ModifyUser))
	n.consumer.Register(mq.DeleteAppsFormTopic, n.Wrap(kafka.DeleteAppsFormTopic, n.user.DeleteUser))
	//部门消息
	n.consumer.Register(mq.CreateDepartmentTopic, n.Wrap(kafka.ProtonCreateDepartmentTopic, n.department.CreateDepartmentMessage))
	n.consumer.Register(mq.DeleteDepartment, n.Wrap(kafka.ProtonDeleteDepartment, n.department.DeleteDepartmentMessage))
	//下面消息处理有误，移动部门的消息原来是针对配置中心本地部门移动的
	//n.consumer.Register(MoveDepartment, n.Wrap(kafka.ProtonMoveDepartment, n.department.MoveDepartmentMessage))
}
*/
