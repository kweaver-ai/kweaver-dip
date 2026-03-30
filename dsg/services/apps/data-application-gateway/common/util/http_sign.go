package util

import (
	"crypto/hmac"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"net/http"
	"net/url"
	"strings"

	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/enum"
	"github.com/kweaver-ai/dsg/services/apps/data-application-gateway/common/errorcode"
)

type Authorization struct {
	AppId     string `json:"appid"`
	Timestamp string `json:"timestamp"`
	Nonce     string `json:"nonce"`
	Signature string `json:"signature"`
}

// HttpSignValidate Http 请求签名验证
func HttpSignValidate(req *http.Request, appSecret string, authorization *Authorization) bool {
	return HttpSignGenerate(req, appSecret, authorization) == authorization.Signature
}

// HttpSignGenerate Http 请求签名生成
/*
签名串需要包含的内容为:

HTTP 请求方法\n
请求时间戳\n
请求随机串\n
请求 Path (不包括域名部分, 不包含 QueryString)\n
请求 QueryString (按 key 升序排序 k1=v1&k2=v2&k3=v3)\n
请求 Body (序列化后的 json 字符串, 如果没有 Body, 此行为空, 只保留换行符)\n
*/
func HttpSignGenerate(req *http.Request, appSecret string, authorization *Authorization) (signature string) {
	method := req.Method
	timestamp := authorization.Timestamp
	nonce := authorization.Nonce
	path := req.URL.EscapedPath()
	qs, _ := url.QueryUnescape(req.URL.Query().Encode())
	body, _ := GetBody(req)

	var message strings.Builder
	message.WriteString(method + "\n")
	message.WriteString(timestamp + "\n")
	message.WriteString(nonce + "\n")
	message.WriteString(path + "\n")
	message.WriteString(qs + "\n")
	message.WriteString(string(body) + "\n")

	h := hmac.New(sha256.New, []byte(appSecret))
	h.Write([]byte(message.String()))
	signature = hex.EncodeToString(h.Sum(nil))

	return signature
}

// ParseAuthorization 解析 Authorization
// ANYFABRIC-HMAC-SHA256 appid=1662322293948416,timestamp=1695033780,nonce=d77c8cc3-368a-44fa-bec2-f116975ef0ce,signature=cbabbd37f3d7b2f80d469c98ad131d1bc9f27c39fa0bbaf66e81d4701bc18062
func ParseAuthorization(authorizationHeader string) (authorization *Authorization, err error) {
	if authorizationHeader == "" {
		return nil, errorcode.Desc(errorcode.SignValidateError)
	}

	authSplit := strings.Split(authorizationHeader, " ")
	if len(authSplit) != 2 {
		return nil, errorcode.Desc(errorcode.SignValidateError)
	}

	if authSplit[0] != enum.SignAlgorithm {
		return nil, errorcode.Desc(errorcode.SignValidateError)
	}

	fieldsMap := make(map[string]string)
	fields := strings.Split(authSplit[1], ",")
	for _, field := range fields {
		split := strings.Split(field, "=")
		if len(split) != 2 {
			return nil, errorcode.Desc(errorcode.SignValidateError)
		}
		fieldsMap[split[0]] = split[1]
	}

	marshal, err := json.Marshal(fieldsMap)
	if err != nil {
		return nil, errorcode.Desc(errorcode.SignValidateError)
	}

	err = json.Unmarshal(marshal, &authorization)
	if err != nil {
		return nil, errorcode.Desc(errorcode.SignValidateError)
	}

	return authorization, nil
}
