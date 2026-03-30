package user_mgm

import (
	"context"
	"encoding/json"
	"errors"
	"reflect"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/business_structure"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/flowchart"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/user"
	kafka_infra "github.com/kweaver-ai/dsg/services/apps/configuration-center/infrastructure/mq/kafka"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"github.com/nsqio/go-nsq"
	"go.uber.org/zap"
)

type Handler struct {
	flowchartUserCase         flowchart.UseCase
	businessStructureUserCase business_structure.UseCase
	user                      user.UseCase
	producer                  kafkax.Producer
}

func NewHandler(
	flowchartUserCase flowchart.UseCase,
	businessStructureUserCase business_structure.UseCase,
	user user.UseCase,
) *Handler {
	producer, err := kafka_infra.NewSyncProducer()
	if err != nil {
		log.Error("MQ user Handler kafka_infra.NewSyncProducer")
	}
	return &Handler{
		flowchartUserCase:         flowchartUserCase,
		businessStructureUserCase: businessStructureUserCase,
		user:                      user,
		producer:                  producer,
	}
}

// DeleteRoleMessage implements the Handler interface.
func (d *Handler) DeleteRoleMessage(m *nsq.Message) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	if len(m.Body) == 0 {
		// Returning nil will automatically send a FIN command to NSQ to mark the message as processed.
		// In this case, a message with an empty body is simply ignored/discarded.
		return nil
	}
	msg := &DeleteRoleMessage{}
	err = json.Unmarshal(m.Body, msg)
	if err != nil {
		log.WithContext(ctx).Error("unmarshal message body error", zap.Error(err))
		return nil
	}
	// Returning a non-nil error will automatically send a REQ command to NSQ to re-queue the message.
	return d.flowchartUserCase.HandleRoleMissing(ctx, msg.Payload.RoleId)
}

// func (d *Handler) CreateUser(message *nsq.Message) (err error) {
func (d *Handler) CreateUser(message []byte) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【NSQ Driven】CreateUser")
	id, name, userType, err := d.getNameCreateParamsInNsqMsg(message)
	if err != nil {
		log.WithContext(ctx).Error("【NSQ Driven】CreateUser getNameCreateParamsInNsqMsg", zap.Error(err))
		return nil
	}
	log.Infof("【NSQ Driven】CreateUser param userid %v ,name %v, userType %v", id, name, userType)
	d.user.CreateUserNSQ(ctx, id, name, userType)

	return nil
}
func (d *Handler) getNameCreateParamsInNsqMsg(message []byte) (id, name, userType string, err error) {
	var jsonV interface{}
	if err = jsoniter.Unmarshal(message, &jsonV); err != nil {
		return "", "", "", err
	}

	// 检测参数类型
	objDesc := make(map[string]*util.JSONValueDesc)
	objDesc["id"] = &util.JSONValueDesc{Kind: reflect.String, Required: true}
	objDesc["name"] = &util.JSONValueDesc{Kind: reflect.String, Required: true}
	objDesc["user_type"] = &util.JSONValueDesc{Kind: reflect.String, Required: false}
	reqParamsDesc := &util.JSONValueDesc{Kind: reflect.Map, Required: true, ValueDesc: objDesc}
	if cErr := util.CheckJSONValue("body", jsonV, reqParamsDesc); cErr != nil {
		return "", "", "", cErr
	}

	id = jsonV.(map[string]interface{})["id"].(string)
	name = jsonV.(map[string]interface{})["name"].(string)
	// 没有默认为普通账号
	userType = string(constant.RealName)
	_, OK := jsonV.(map[string]interface{})["user_type"]
	if OK {
		userType = jsonV.(map[string]interface{})["user_type"].(string)
	}
	return
}
func (d *Handler) ModifyUser(message []byte) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【NSQ Driven】ModifyUser")
	id, name, strType, err := d.getNameUpdateParamsInNsqMsg(ctx, message)
	if err != nil {
		log.WithContext(ctx).Error("【NSQ Driven】ModifyUser getNameUpdateParamsInNsqMsg", zap.Error(err))
		return nil
	}
	//log.Infof("【NSQ Driven】ModifyUser param userid %v ,name %v",id,name)

	switch strType {
	case "user":
		log.Infof("【NSQ Driven】user %v name change to %v", id, name)
		d.user.UpdateUserNameNSQ(ctx, id, name)
		return nil
	case "group":
		log.Infof("【NSQ Driven】group %v name change to %v", id, name)
	case "department":
		log.Infof("【NSQ Driven】department %v name change to %v", id, name)
		err = d.businessStructureUserCase.HandleDepartmentRename(ctx, id, name)
		if err != nil {
			log.WithContext(ctx).Errorf("【NSQ Driven】ModifyUser HandleDepartmentRename error", zap.Error(err))
		}
		return nil
	default:
		log.Infof("【NSQ Driven】%v type %v name change to %v", strType, id, name)
	}
	return nil
}

func (d *Handler) ModifyMobileMailUser(message []byte) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【NSQ Driven】ModifyMobileMailUser")
	id, mobile, mail, err := d.getMobileMailUpdateParamsInNsqMsg(ctx, message)
	if err != nil {
		log.WithContext(ctx).Error("【NSQ Driven】ModifyUser ModifyMobileMailUser", zap.Error(err))
		return nil
	}
	d.user.UpdateUserMobileMail(ctx, id, mobile, mail)
	return nil
}

// getNameUpdateParamsInNsqMsg 获取NSQ消息内显示名更新信息
func (d *Handler) getNameUpdateParamsInNsqMsg(ctx context.Context, message []byte) (id, name, strType string, err error) {
	var jsonV interface{}
	if err = jsoniter.Unmarshal(message, &jsonV); err != nil {
		return "", "", "", err
	}

	// 检测参数类型
	objDesc := make(map[string]*util.JSONValueDesc)
	objDesc["id"] = &util.JSONValueDesc{Kind: reflect.String, Required: true}
	objDesc["new_name"] = &util.JSONValueDesc{Kind: reflect.String, Required: true}
	objDesc["type"] = &util.JSONValueDesc{Kind: reflect.String, Required: true}
	reqParamsDesc := &util.JSONValueDesc{Kind: reflect.Map, Required: true, ValueDesc: objDesc}
	if cErr := util.CheckJSONValue("body", jsonV, reqParamsDesc); cErr != nil {
		return "", "", "", cErr
	}

	// 检测type参数是否正常
	strType = jsonV.(map[string]interface{})["type"].(string)
	if strType != "user" && strType != "group" && strType != "department" && strType != "contactor" {
		log.WithContext(ctx).Errorf("【NSQ Driven】invalid org type", zap.String("strType", strType))
		return "", "", "", errors.New("invalid org type")
	}

	id = jsonV.(map[string]interface{})["id"].(string)
	name = jsonV.(map[string]interface{})["new_name"].(string)

	return
}

// getNameUpdateParamsInNsqMsg 获取NSQ消息内显示名更新信息
func (d *Handler) getMobileMailUpdateParamsInNsqMsg(ctx context.Context, message []byte) (id, mobile, mail string, err error) {
	var jsonV interface{}
	if err = jsoniter.Unmarshal(message, &jsonV); err != nil {
		return "", "", "", err
	}

	// 检测参数类型
	objDesc := make(map[string]*util.JSONValueDesc)
	objDesc["user_id"] = &util.JSONValueDesc{Kind: reflect.String, Required: true}
	objDesc["new_telephone"] = &util.JSONValueDesc{Kind: reflect.String, Required: false}
	objDesc["new_email"] = &util.JSONValueDesc{Kind: reflect.String, Required: false}
	reqParamsDesc := &util.JSONValueDesc{Kind: reflect.Map, Required: true, ValueDesc: objDesc}
	if cErr := util.CheckJSONValue("body", jsonV, reqParamsDesc); cErr != nil {
		return "", "", "", cErr
	}

	id = jsonV.(map[string]interface{})["user_id"].(string)
	_, new_telephone := jsonV.(map[string]interface{})["new_telephone"]
	if new_telephone {
		mobile = jsonV.(map[string]interface{})["new_telephone"].(string)
	}
	_, new_email := jsonV.(map[string]interface{})["new_email"]
	if new_email {
		mail = jsonV.(map[string]interface{})["new_email"].(string)
	}
	return
}

func (d *Handler) DeleteUser(message []byte) (err error) {
	ctx, span := af_trace.StartProducerSpan(context.Background())
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.Infof("【NSQ Driven】DeleteUser")
	userID, err := d.getIDInNsqMsg(message)
	if err != nil {
		log.WithContext(ctx).Error("【NSQ Driven】DeleteUser getIDInNsqMsg", zap.Error(err))
		return nil
	}
	d.user.DeleteUserNSQ(context.Background(), userID)
	log.Warn("【NSQ Driven】 DeleteUser", zap.String("userID", userID))
	return nil
}
func (d *Handler) getIDInNsqMsg(message []byte) (string, error) {
	var jsonV interface{}
	if err := jsoniter.Unmarshal(message, &jsonV); err != nil {
		return "", err
	}

	objDesc := make(map[string]*util.JSONValueDesc)
	objDesc["id"] = &util.JSONValueDesc{Kind: reflect.String, Required: true}
	reqParamsDesc := &util.JSONValueDesc{Kind: reflect.Map, Required: true, ValueDesc: objDesc}
	if cErr := util.CheckJSONValue("body", jsonV, reqParamsDesc); cErr != nil {
		return "", cErr
	}

	return jsonV.(map[string]interface{})["id"].(string), nil
}

func (d *Handler) Wrap(topic string, fn func(msg []byte) error) func(msg []byte) error {
	return func(msg []byte) error {
		if err := fn(msg); err != nil {
			return err
		}
		//如果成功，那就发送kafka
		return d.producer.Send(topic, msg)
	}
}
