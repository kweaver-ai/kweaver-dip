package settings

// Proton 提供的消息队列访问配置
type MQ struct {
	MQType        string `json:"mqType,omitempty"`
	MQHost        string `json:"mqHost,omitempty"`
	MQPort        string `json:"mqPort,omitempty"`
	MQLookupdHost string `json:"mqLookupdHost,omitempty"`
	MQLookupdPort string `json:"mqLookupdPort,omitempty"`
	Auth          MQAuth `json:"auth,omitempty"`
}

// 访问 Proton 提供的消息队列所使用的身份验证信息
type MQAuth struct {
	Mechanism string `json:"mechanism,omitempty"`
	Username  string `json:"username,omitempty"`
	Password  string `json:"password,omitempty"`
}
