package mq

import (
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/data_catalog"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/domain"
	points "github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/points"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/role"
	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driver/mq/user_mgm"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/work_order_alarm"
	"github.com/kweaver-ai/idrm-go-common/reconcile"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
)

type MQConsumerService struct {
	kafkax.Consumer
	roleHandler        *role.RoleHandler
	userMgm            *user_mgm.UserMgmHandler
	domain             *domain.BusinessDomainHandler
	pointsHandler      *points.PointsEventHandler
	dataCatalogHandler *data_catalog.DataCatalogHandler
	workOrderAlarm     work_order_alarm.Interface
}

func NewMQConsumerService(
	consumer kafkax.Consumer,
	roleHandler *role.RoleHandler,
	userMgm *user_mgm.UserMgmHandler,
	domain *domain.BusinessDomainHandler,
	pointsHandler *points.PointsEventHandler,
	dataCatalogHandler *data_catalog.DataCatalogHandler,
	workOrderAlarm work_order_alarm.Interface,
) *MQConsumerService {
	m := &MQConsumerService{
		Consumer:           consumer,
		roleHandler:        roleHandler,
		userMgm:            userMgm,
		domain:             domain,
		pointsHandler:      pointsHandler,
		dataCatalogHandler: dataCatalogHandler,
		workOrderAlarm:     workOrderAlarm,
	}
	m.RegisterHandles()
	return m
}

func (m *MQConsumerService) RegisterHandles() {
	//角色消息
	m.Consumer.RegisterHandles(kafkax.Wrap(m.roleHandler.DeleteUserRoleRelationHandler), constant.DeleteUserRoleRelationTopic)

	//用户消息
	m.Consumer.RegisterHandles(kafkax.Wrap(m.userMgm.CreateUser), constant.ProtonUserCreatedTopic)
	m.Consumer.RegisterHandles(kafkax.Wrap(m.userMgm.ModifyUser), constant.ProtonUserUpdatedTopic)
	m.Consumer.RegisterHandles(kafkax.Wrap(m.userMgm.DeleteUser), constant.ProtonUserDeleteTopic)

	// 工单告警消息
	m.Consumer.RegisterHandles(reconcile.NewKafkaMsgHandleFunc(m.workOrderAlarm.WorkOrderReconciler()), constant.TopicAFTaskCenterV1WorkOrders)

	//APP消息
	m.Consumer.RegisterHandles(kafkax.Wrap(m.userMgm.CreateUser), constant.AppsCreateTopic)
	m.Consumer.RegisterHandles(kafkax.Wrap(m.userMgm.ModifyUser), constant.AppsNameModifyTopic)
	m.Consumer.RegisterHandles(kafkax.Wrap(m.userMgm.DeleteUser), constant.DeleteAppsFormTopic)

	//业务梳理的消息
	m.Consumer.RegisterHandles(kafkax.Wrap(m.domain.DeleteMainBusinessHandler), constant.DeleteMainBusinessTopic)
	m.Consumer.RegisterHandles(kafkax.Wrap(m.domain.DeleteBusinessDomainHandler), constant.DeleteBusinessDomainTopic)
	m.Consumer.RegisterHandles(kafkax.Wrap(m.domain.ModifyBusinessDomainHandler), constant.ModifyBusinessDomainTopic)
	m.Consumer.RegisterHandles(kafkax.Wrap(m.domain.DeletedBusinessFormHandler), constant.DeleteBusinessFormTopic)

	// 积分事件
	m.Consumer.RegisterHandles(kafkax.Wrap(m.pointsHandler.PointsEventPubHandler), constant.PointsEventTopic)
	// 数据推送
	m.Consumer.RegisterHandles(kafkax.Wrap(m.dataCatalogHandler.HandlerDataPushMsg), constant.DataPushTaskExecutingTopic)
}
