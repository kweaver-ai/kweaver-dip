package d_session

import (
	"encoding/json"

	"github.com/kweaver-ai/dsg/services/apps/session/adapter/driven/http_client/hydra"
)

type SessionInfo struct {
	RefreshToken string
	Token        string
	IdToken      string
	Userid       string
	UserName     string
	VisionName   string
	VisitorTyp   hydra.VisitorType
	State        string
	Platform     int32
	SSO          int32
	ASRedirect   string
}

func (s *SessionInfo) Serialize() string {
	marshal, _ := json.Marshal(s)
	return string(marshal)
}

func (s *SessionInfo) Deserialization(str string) error {
	return json.Unmarshal([]byte(str), s)
}
