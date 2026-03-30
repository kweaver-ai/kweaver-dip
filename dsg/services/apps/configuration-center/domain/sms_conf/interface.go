package sms_conf

import (
	"context"
)

const (
	GLOBAL_SMS_CONF = "gSMSConf"
)

const (
	SwitchStatusOn  = "on"
	SwitchStatusOff = "off"
)

type UseCase interface {
	Get(ctx context.Context) (*SMSConfResp, error)
	Update(ctx context.Context, req *UpdateReq) error
}

type SMSConfResp struct {
	SwitchStatus string `json:"switch_status"` // 短信推送开关状态, on 开启 off 关闭
	PushRoleID   string `json:"push_role_id"`  // 短信推送角色ID
}

type UpdateReq struct {
	SwitchStatus string `json:"switch_status" binding:"TrimSpace,required,oneof=on off"`                     // 短信推送开关状态, on 开启 off 关闭
	PushRoleID   string `json:"push_role_id" binding:"TrimSpace,required_if=SwitchStatus on,omitempty,uuid"` // 短信推送角色ID
}
