package util

import (
	"net/http"
	"net/url"
	"reflect"
	"testing"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/enum"
)

func TestHttpSignGenerate(t *testing.T) {
	type args struct {
		req       *http.Request
		appSecret string
	}

	const (
		appId     = "1662322293948416"
		appSecret = "23d72b82191944e8a9a7f0cb4ffca3a9"
	)

	//	body := `{
	//    "c": 3,
	//    "b": 2,
	//    "a": 1
	//}`
	//
	//	buf, _ := json.Marshal(body)

	req := &http.Request{
		Method: http.MethodPost,
		URL: &url.URL{
			Scheme:      "",
			Opaque:      "",
			User:        nil,
			Host:        "",
			Path:        "/api/data-application-gateway/v1/query-test",
			RawPath:     "",
			ForceQuery:  false,
			RawQuery:    "b=2&a=1&c=3",
			Fragment:    "",
			RawFragment: "",
		},
		Proto:  "HTTP/1.1",
		Header: make(http.Header),
		//Body:       ioutil.NopCloser(bytes.NewBuffer(buf)),
		Host:       "127.0.0.1:8157",
		RequestURI: "/api/data-application-gateway/v1/query-test?b=2&a=1&c=3",
	}

	req.Header.Set(enum.HeaderAuthorization, appId)

	authorization, _ := ParseAuthorization(req.Header.Get(enum.HeaderAuthorization))

	tests := []struct {
		name     string
		args     args
		wantSign string
	}{
		{
			name: "",
			args: args{
				req:       req,
				appSecret: appSecret,
			},
			wantSign: "",
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			if gotSign := HttpSignGenerate(tt.args.req, tt.args.appSecret, authorization); gotSign != tt.wantSign {
				t.Errorf("HttpSignGenerate() = %v, want %v", gotSign, tt.wantSign)
			}
		})
	}
}

func TestParseAuthorization(t *testing.T) {
	type args struct {
		authorizationHeader string
	}
	tests := []struct {
		name              string
		args              args
		wantAuthorization *Authorization
		wantErr           bool
	}{
		{
			name: "",
			args: args{
				authorizationHeader: "ANYFABRIC-HMAC-SHA256 appid=1662322293948416,timestamp=1695033780,nonce=d77c8cc3-368a-44fa-bec2-f116975ef0ce,signature=cbabbd37f3d7b2f80d469c98ad131d1bc9f27c39fa0bbaf66e81d4701bc18062",
			},
			wantAuthorization: &Authorization{
				AppId:     "1662322293948416",
				Timestamp: "1695033780",
				Nonce:     "d77c8cc3-368a-44fa-bec2-f116975ef0ce",
				Signature: "cbabbd37f3d7b2f80d469c98ad131d1bc9f27c39fa0bbaf66e81d4701bc18062",
			},
			wantErr: false,
		},
	}
	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotAuthorization, err := ParseAuthorization(tt.args.authorizationHeader)
			if (err != nil) != tt.wantErr {
				t.Errorf("ParseAuthorization() error = %v, wantErr %v", err, tt.wantErr)
				return
			}
			if !reflect.DeepEqual(gotAuthorization, tt.wantAuthorization) {
				t.Errorf("ParseAuthorization() gotAuthorization = %v, want %v", gotAuthorization, tt.wantAuthorization)
			}
		})
	}
}
