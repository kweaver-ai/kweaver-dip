package service

import (
	"context"
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/data-application-service/adapter/driven/gorm"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type Handler struct {
	repo gorm.ServiceRepo
}

func NewHandler(repo gorm.ServiceRepo) *Handler {
	return &Handler{repo: repo}
}

// UpdateAuthedUsers   更新授权人的信息
func (h *Handler) UpdateAuthedUsers(msg []byte) error {
	log.Infof("UpdateAuthedUsers msg :%s", string(msg))
	msgBody := MsgEntity[UpdateAuthedUsersMsgBody]{}
	err := json.Unmarshal(msg, &msgBody)
	if err != nil {
		log.Errorf("decoded UpdateAuthedUsers msg :%s error %v", string(msg), err.Error())
		return err
	}
	//不是视图的变更，不处理
	if msgBody.Payload.ServiceID == "" || len(msgBody.Payload.AuthedUsers) <= 0 {
		return nil
	}
	//处理视图的变更
	payload := msgBody.Payload
	ctx := context.Background()
	if payload.Method != AuthChangeMethodDelete {
		err = h.repo.UpdateAuthedUsers(ctx, payload.ServiceID, payload.AuthedUsers)
	} else {
		err = h.repo.RemoveAuthedUsers(ctx, payload.ServiceID, payload.AuthedUsers[0])
	}
	if err != nil {
		log.Errorf("update authed users error %v", err.Error())
	}
	return err
}
