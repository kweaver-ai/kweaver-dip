package mq_client

import (
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/task_center/common/settings"
	msqclient "github.com/kweaver-ai/proton-mq-sdk-go"
)

func NewProtonMQClient() (msqclient.ProtonMQClient, error) {
	var (
		err                   error
		mqPort, mqLookupdPort int
	)
	mqConf := settings.ConfigInstance.DepServices.MQ
	if mqConf != nil {
		mqPort, err = strconv.Atoi(mqConf.MqPort)
		if err != nil {
			return nil, err
		}
		mqLookupdPort, err = strconv.Atoi(mqConf.MqLookupdPort)
		if err != nil {
			return nil, err
		}
		var opts []msqclient.ClientOpt
		// 默认启用共享连接
		opts = append(opts, msqclient.ShareConn(true))
		if mqConf.Auth.Mechanism != "" &&
			mqConf.Auth.Username != "" &&
			mqConf.Auth.Password != "" {
			opts = append(opts,
				msqclient.AuthMechanism(
					mqConf.Auth.Mechanism,
				),
				msqclient.UserInfo(
					mqConf.Auth.Username,
					mqConf.Auth.Password,
				),
			)
		}
		return msqclient.NewProtonMQClient(mqConf.MqHost, mqPort, mqConf.MqLookupdHost, mqLookupdPort, mqConf.ConnectorType, opts...)
	}
	return nil, err
}
