package sharemanagement

type Visitor struct {
	ID        string   `json:"id"`
	CsfLevel  float64  `json:"csf_level"`
	Name      string   `json:"name"`
	IP        string   `json:"ip"`
	Mac       string   `json:"mac"`
	Udid      string   `json:"udid"`
	AgentType string   `json:"client_type"`
	Roles     []string `json:"roles"`
	Email     string   `json:"email"`
	Token     string   `json:"token"`
	Type      string   `json:"type"` // 用户代理类型

}
