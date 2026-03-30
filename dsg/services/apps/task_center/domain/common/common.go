package common

import (
	"context"
	"encoding/json"
	"fmt"

	"github.com/kweaver-ai/dsg/services/apps/task_center/adapter/driven/gorm/configuration"
	"github.com/kweaver-ai/dsg/services/apps/task_center/common/util"
	"github.com/kweaver-ai/idrm-go-common/rest/configuration_center"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	msqclient "github.com/kweaver-ai/proton-mq-sdk-go"
)

const (
	SwitchStatusOn  = "on"
	SwitchStatusOff = "off"
)

type SMSConf struct {
	SwitchStatus string `json:"switch_status"` // 短信推送开关状态, on 开启 off 关闭
	PushRoleID   string `json:"push_role_id"`  // 短信推送角色ID
}

func getSMSConf(ctx context.Context, ccRepo configuration.Repo) (conf *SMSConf, err error) {
	var smsConf string
	if smsConf, err = ccRepo.GetConf(nil, ctx, GLOBAL_SMS_CONF); err == nil {
		if len(smsConf) > 0 {
			if err = json.Unmarshal(util.StringToBytes(smsConf), &conf); err != nil {
				return nil, err
			}
		}
	}
	return
}

func ProcSMSPushConf(ctx context.Context, conf *SMSConf,
	bIsUIDsNeed bool, deptID string, ccDriven configuration_center.Driven) (bIsPush bool, uids []string, err error) {
	if bIsUIDsNeed && (len(deptID) == 0 || ccDriven == nil) {
		return false, nil, fmt.Errorf("deptID is empty or ccDriven is nil")
	}

	if conf != nil {
		bIsPush = conf.SwitchStatus == SwitchStatusOn
		if bIsPush && bIsUIDsNeed {
			bIsPush = bIsPush && len(conf.PushRoleID) > 0
			if bIsPush {
				var users []*configuration_center.UserRespItem
				if users, err = ccDriven.GetUsersByDeptRoleID(ctx, deptID, conf.PushRoleID); err == nil {
					if len(users) > 0 {
						uids = make([]string, 0, len(users))
						for i := range users {
							uids = append(uids, users[i].ID)
						}
					}
				}
			}
		}
	}

	return bIsPush, uids, err
}

const (
	GLOBAL_SMS_CONF = "gSMSConf"
	SMS_MQ_TOPIC    = "thirdparty_message_plugin.message.push"
	SMS_CHANNEL     = "anyfabric/v1/short-message-push"
	SMS_HEADER      = "{}"
)

type SMSMsgType int

const (
	SMSMsgTypeQualityRectify                           SMSMsgType = 1101 // 质量待整改通知
	SMSMsgTypeRequireResourceConfirm                   SMSMsgType = 2101 // 供需对接需求资源待确认通知
	SMSMsgTypeDataAnalysisRequireAnalConclusionConfirm SMSMsgType = 2201 // 数据分析需求分析结论待确认通知
	SMSMsgTypeDataAnalysisRequireImplResultConfirm     SMSMsgType = 2202 // 数据分析需求分析成果待确认通知
	SMSMsgTypeDataAnalysisRequireFeedback              SMSMsgType = 2203 // 数据分析需求待成效反馈通知
	SMSMsgTypeSharedApplyAnalysisConclusionConfirm     SMSMsgType = 2301 // 共享申请分析结论待确认通知
	SMSMsgTypeSharedApplyImplSolutionConfirm           SMSMsgType = 2302 // 共享申请实施方案待确认通知
	SMSMsgTypeSharedApplyImplResultConfirm             SMSMsgType = 2303 // 共享申请实施成果待确认通知
	SMSMsgTypeSharedApplyFeedback                      SMSMsgType = 2304 // 共享申请待成效反馈通知
)

type SMSPayload struct {
	/*消息类型
	1101 质量待整改通知
	2101 供需对接需求资源待确认通知
	2201 数据分析需求分析结论待确认通知
	2202 数据分析需求分析成果待确认通知
	2203 数据分析需求待成效反馈通知
	2301 共享申请分析结论待确认通知
	2302 共享申请实施方案待确认通知
	2303 共享申请实施成果待确认通知
	2304 共享申请待成效反馈通知
	*/
	MsgType  SMSMsgType `json:"msg_type" binding:"required"`
	RecvUIDs []string   `json:"recv_uids" binding:"required,dive,uuid"`                          // 接收用户ID列表
	ResName  string     `json:"res_name,omitempty" binding:"required_if=MsgType 1101,omitempty"` // 资源名称，仅当msg_type为1101时该字段传库表技术名称，为其它类型时不传
}

func SMSPush(ctx context.Context, mqClient msqclient.ProtonMQClient,
	msgType SMSMsgType, ccRepo configuration.Repo,
	uids []string, deptID string,
	ccDriven configuration_center.Driven, resName string) (err error) {
	if msgType == SMSMsgTypeQualityRectify && len(resName) == 0 {
		err = fmt.Errorf("resName cannot be null when msg type is data quality")
		log.WithContext(ctx).Errorf("SMSPush: %v", err)
		return err
	}
	var (
		buf      []byte
		respUIDs []string
		bIsPush  bool
		conf     *SMSConf
	)
	payload := &SMSPayload{
		MsgType:  msgType,
		RecvUIDs: uids,
		ResName:  resName,
	}

	if conf, err = getSMSConf(ctx, ccRepo); err != nil {
		log.WithContext(ctx).Errorf("SMSPush: getSMSConf failed: %v", err)
		return err
	}

	if conf == nil || (conf != nil && conf.SwitchStatus != SwitchStatusOn) {
		log.WithContext(ctx).Infof("SMSPush switch is off, no need to push")
		return
	}

	bIsPush = conf.SwitchStatus == SwitchStatusOn
	bIsUIDsNeed := len(uids) == 0
	if bIsUIDsNeed {
		bIsPush, respUIDs, err = ProcSMSPushConf(ctx, conf, bIsUIDsNeed, deptID, ccDriven)
		if err != nil {
			log.WithContext(ctx).Errorf("SMSPush: ProcSMSPushConf failed: %v", err)
			return err
		}
	}

	if bIsPush {
		if bIsUIDsNeed {
			if len(respUIDs) == 0 {
				log.WithContext(ctx).Infof("SMSPush: recv uids is empty, no need to push")
				return
			}
			payload.RecvUIDs = respUIDs
		}
		buf, err = json.Marshal(payload)
		if err == nil {
			message := fmt.Sprintf("%s/r/n%s/r/n%s", SMS_CHANNEL, SMS_HEADER, util.BytesToString(buf))
			if err = mqClient.Pub(SMS_MQ_TOPIC, util.StringToBytes(message)); err != nil {
				log.WithContext(ctx).Errorf("SMSPush: mqClient.Pub failed: %v", err)
			}
		}
	} else {
		log.WithContext(ctx).Infof("SMSPush switch is off, no need to push")
	}

	return
}
