package user_mgm

import (
	"context"
	"errors"
	"reflect"

	jsoniter "github.com/json-iterator/go"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/dsg/services/apps/task_center/domain/user"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	af_trace "github.com/kweaver-ai/idrm-go-frame/core/telemetry/trace"
	"github.com/kweaver-ai/idrm-go-frame/core/transport/mq/kafkax"
	"go.uber.org/zap"
)

type UserMgmHandler struct {
	user user.IUser
}

func NewUserMgmHandler(u user.IUser) *UserMgmHandler {
	return &UserMgmHandler{user: u}
}

func (u *UserMgmHandler) CreateUser(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.WithContext(ctx).Infof("【NSQ Driven】CreateUser")
	id, name, userType, err := u.getNameCreateParamsInMQMsg(message.Value)
	if err != nil {
		log.WithContext(ctx).Error("【kafka Driven】CreateUser getNameCreateParamsInMQMsg", zap.Error(err))
		return nil
	}
	log.WithContext(ctx).Infof("【NSQ Driven】CreateUser param userid %v ,name %v, userType %v", id, name, userType)
	u.user.CreateUserMQ(context.Background(), id, name, userType)

	return nil
}

func (u *UserMgmHandler) getNameCreateParamsInMQMsg(message []byte) (id, name, userType string, err error) {
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
func (u *UserMgmHandler) ModifyUser(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()

	log.WithContext(ctx).Infof("【kafka Driven】ModifyUser")
	id, name, strType, err := u.getNameUpdateParamsInNQMsg(ctx, message.Value)
	if err != nil {
		log.WithContext(ctx).Error("【kafka Driven】ModifyUser getNameUpdateParamsInNQMsg", zap.Error(err))
		return nil
	}
	//log.WithContext(ctx).Infof("【MQ Driven】ModifyUser param userid %v ,name %v",id,name)

	switch strType {
	case "user":
		log.WithContext(ctx).Infof("【kafka Driven】user %v name change to %v", id, name)
		u.user.UpdateUserNameMQ(context.Background(), id, name)
		return nil
	case "group":
		log.WithContext(ctx).Infof("【kafka Driven】group %v name change to %v", id, name)
	case "department":
		log.WithContext(ctx).Infof("【kafka Driven】department %v name change to %v", id, name)
	default:
		log.WithContext(ctx).Infof("【kafka Driven】%v type %v name change to %v", strType, id, name)
	}
	return nil
}

// getNameUpdateParamsInMQMsg 获取MQ消息内显示名更新信息
func (u *UserMgmHandler) getNameUpdateParamsInNQMsg(ctx context.Context, message []byte) (id, name, strType string, err error) {
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
		log.WithContext(ctx).Errorf("【kafka Driven】invalid org type", zap.String("strType", strType))
		return "", "", "", errors.New("invalid org type")
	}

	id = jsonV.(map[string]interface{})["id"].(string)
	name = jsonV.(map[string]interface{})["new_name"].(string)

	return
}

func (u *UserMgmHandler) DeleteUser(ctx context.Context, message *kafkax.Message) error {
	var err error
	ctx, span := af_trace.StartProducerSpan(ctx)
	defer func() { af_trace.TelemetrySpanEnd(span, err) }()
	log.WithContext(ctx).Infof("【kafka Driven】DeleteUser")
	userID, err := u.getIDInMQMsg(message.Value)
	if err != nil {
		log.WithContext(ctx).Error("【kafka Driven】DeleteUser getIDInMQMsg", zap.Error(err))
		return nil
	}
	u.user.DeleteUserNSQ(context.Background(), userID)
	log.WithContext(ctx).Warn("【kafka Driven】 DeleteUser", zap.String("userID", userID))
	return nil
}

func (u *UserMgmHandler) getIDInMQMsg(message []byte) (string, error) {
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
