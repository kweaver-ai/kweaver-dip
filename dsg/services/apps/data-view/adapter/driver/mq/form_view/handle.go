package form_view

import (
	"context"
	"encoding/json"
	repo "github.com/kweaver-ai/dsg/services/apps/data-view/adapter/driven/gorm/form_view"
	"github.com/kweaver-ai/dsg/services/apps/data-view/domain/form_view"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
)

type FormViewHandler struct {
	fv   form_view.FormViewUseCase
	repo repo.FormViewRepo
}

func NewFormViewHandler(
	fv form_view.FormViewUseCase,
	repo repo.FormViewRepo,
) *FormViewHandler {
	return &FormViewHandler{
		fv:   fv,
		repo: repo,
	}
}

// Completion 补全结果
func (f *FormViewHandler) Completion(msg []byte) error {
	log.Infof("Completion msg :%s", string(msg))
	return f.fv.Completion(context.Background(), msg)
}

// UpdateAuthedUsers 更新有授权人的信息
func (f *FormViewHandler) UpdateAuthedUsers(msg []byte) error {
	log.Infof("UpdateAuthedUsers msg :%s", string(msg))
	msgBody := MsgEntity[UpdateAuthedUsersMsgBody]{}
	err := json.Unmarshal(msg, &msgBody)
	if err != nil {
		log.Errorf("decoded UpdateAuthedUsers msg :%s error %v", string(msg), err.Error())
		return err
	}
	//不是视图的变更，不处理
	if msgBody.Payload.FormViewID == "" || len(msgBody.Payload.AuthedUsers) <= 0 {
		return nil
	}
	//处理视图的变更
	payload := msgBody.Payload
	ctx := context.Background()
	if payload.Method != AuthChangeMethodDelete {
		err = f.repo.UpdateAuthedUsers(ctx, payload.FormViewID, payload.AuthedUsers)
	} else {
		err = f.repo.RemoveAuthedUsers(ctx, payload.FormViewID, payload.AuthedUsers[0])
	}
	if err != nil {
		log.Errorf("update authed users error %v", err.Error())
	}
	return err
}
