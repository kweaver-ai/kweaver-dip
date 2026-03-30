package impl

// import (
// 	"crypto/hmac"
// 	"crypto/sha256"
// 	"encoding/base64"
// 	"encoding/hex"
// )

// // OpenAPISecret reqParams 请求体
// //timestamp 时间戳
// //appid 账号标识
// func OpenAPISecret(appId string, timesTamp string, requestbody string) string {
// 	hmac := hmac.New(sha256.New, []byte(appId))
// 	sha := sha256.New()
// 	sha.Write([]byte(timesTamp))
// 	timestamp16str := hex.EncodeToString(sha.Sum(nil))
// 	sha.Reset()
// 	sha.Write([]byte(requestbody))
// 	reqParams16str := hex.EncodeToString(sha.Sum(nil))
// 	hmac.Write([]byte(timestamp16str))
// 	hmac.Write([]byte(reqParams16str))
// 	return base64.StdEncoding.EncodeToString([]byte(hex.EncodeToString(hmac.Sum(nil))))
// }
