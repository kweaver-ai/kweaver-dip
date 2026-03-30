package util

import (
	"bytes"
	"crypto/cipher"
	"crypto/des"
	"crypto/md5"
	"crypto/rand"
	"crypto/rsa"
	"crypto/sha256"
	"crypto/x509"
	"encoding/base64"
	"encoding/hex"
	"encoding/pem"
	"errors"
	"fmt"

	"github.com/daknob/ntlm"
)

// DesCBCPadType des cbc 加密填充类型
type DesCBCPadType int

const (
	// 使用iota，增加新的枚举时，必须按照顺序添加，不得在中间插入
	_ DesCBCPadType = iota

	// PadNormal 填充
	PadNormal

	// PKCS5Padding 填充
	PKCS5Padding
)

// DecodeType 解密类型
type DecodeType int

const (
	// 使用iota，增加新的枚举时，必须按照顺序添加，不得在中间插入
	_ DecodeType = iota

	// RSA1024 解密
	RSA1024

	// RSA2048 解密
	RSA2048
)

var (
	strRSA1024PrivateKey = `
-----BEGIN RSA PRIVATE KEY-----
MIICXQIBAAKBgQC7JL0DcaMUHumSdhxXTxqiABBCDERhRJIsAPB++zx1INgSEKPG
bexDt1ojcNAc0fI+G/yTuQcgH1EW8posgUni0mcTE6CnjkVbv8ILgCuhy+4eu+2l
ApDwQPD9Tr6J8k21Ruu2sWV5Z1VRuQFqGm/c5vaTOQE5VFOIXPVTaa25mQIDAQAB
AoGAe3ZNTExX7hpGtd097Uu+okmwcCJvqkv2sxkbkGpnBE7avXBE29ABItt/mAoB
AkJvshH8m+hhjwuaD62VkO7qsppTg4yL98Z0ZZ4kPqxJaIVU8FDmJyz1Png4ywg9
mw57saoZ+7GFQSITA7Kb5BeMP2xNeLIWjN2s29fhWMxTskECQQD4C4hcT1nWmA8i
j27eK/XDbVeceb8x1fKZ0wor+fQ5wTwmnhVPrRe4AgBVin8kR9kw+fu55Kk0U02o
uZTMh6U1AkEAwSUzIeX3R8TpaRsKnjV0GWGNdxesAg/IZw5k0A9JyiEvFFhNHfp9
00zvutxdK0D1tdzrn+UHwFrVzlN4zqtDVQJBAJT8OFdZwhhHFTAo/uqrdN6BGpJ9
/f0tCJ6kSAPKCot2KW74nMxSp2B6s0CuA1gDX80vGae6VHd9YbPqZBnFj9ECQBQO
HcoWS9/q5WWhhi+5Uy3TgFHuZlDsfJ2e0/76p2nSmkXdiVxkhy4qnfXkLdRw8VKJ
9vlqWayygeLjrfaft+UCQQDH7HQNcfZOcIYV0kpdztP/0bAeh7VHpjDrga7R+W+K
PR2M7HVDPSmmLtrm5snlUwVfu24VF4SO113z24zy6IRn
-----END RSA PRIVATE KEY-----
	`

	strRSA2048PrivateKey = `
-----BEGIN RSA PRIVATE KEY-----
MIIEpAIBAAKCAQEA4E+eiWRwffhRIPQYvlXUjf0b3HqCmosiCxbFCYI/gdfDBhrT
Uzbt3fL3o/gRQQBEPf69vhJMFH2ZMtaJM6ohE3yQef331liPVM0YvqMOgvoID+zD
a1NIZFObSsjOKhvZtv9esO0REeiVEPKNc+Dp6il3x7TV9VKGEv0+iriNjqv7TGAe
xo2jVtLm50iVKTju2qmCDG83SnVHzsiNj70MiviqiLpgz72IxjF+xN4bRw8I5dD0
GwwO8kDoJUGWgTds+VckCwdtZA65oui9Osk5t1a4pg6Xu9+HFcEuqwJTDxATvGAz
1/YW0oUisjM0ObKTRDVSfnTYeaBsN6L+M+8gCwIDAQABAoIBAG2Tl3/ImAeBmag+
diPs6+PdBJJFKq3yT9QY8HI/tWRpkXTW/+sDx1mISp9IHK2jQrMCUZCbgZz06jTi
hq29a2EIlc9yWHLWWlZzxqXCI+Gp4Oxenew9B/0ytobm54e8iTOTNp+5f4A/HSrl
QmKcOcjRLxlY5rhr8uEt4zKDC2vo/69NuQFdAAjrpdk/SKFNwTc+OarkvxW1lpSy
B8InzhKOFL7b+uqZ3HUnSAIUlxkd8rx2Qt/6wK+AQAYESff6lkjNs8ZcvLXMlPir
lU4gwYFsEGxi84+gqYJ1e4HFX9ohuYa9EoUx9jTV5p9o/GwYOiXk91NKCKctNjcm
qlUmWTECgYEA9Sgbo+DCs+SDflBARXr+ZA5eAImcRt+0CtWlU8XBpumrDh99gjXD
h/BdlNfMccG/TTXIpoEl7Mts2wB7hJcbH/G78VLLdnW8GCKQ5ADNFc1q42Pi88Po
6ac2HxnqLlmu2N8AjfVowBb7+YotN48Ku41mNGs2JEH4fMyQeBb2NZMCgYEA6jt6
NFR8GugjMvnXUbcFf7cZ8iMlQLIbpkP8UgIWU5h9dUkw5JgRN0YMnSi9gA31gzsW
V4O8f+XPsnriAk29SY5kI6mGaLq0Ywpk3dvQBRhDUDJ+rItApKbF3ZJ6hjgAgIQx
09A0cPY+T+twXMn2uUV6LfYxEiG3Igokiyb8dqkCgYEAzaLC7IdPSg3XrlAqWR19
3PegKdtD1r82ChCDCO3MLfG6pbIMWPg39wLLvFn3B0R47o66q8+QvDs2J80Tznfh
LL5b42SLfeXrzGLSHi392NfhXLMgX1BpQfQcFaJrKE3Zt9f2Yx0CrH2bBgm9O+kk
G4XTwQxc8bTUdfoxBEpeYzkCgYApIyUFR8k8GIUGEOcGDPTER24hHpcOU7mTa+FG
reMp72ApVx9lJmfvozfX6i3N7aWu1JPJ7vMOK1hc6kQDT4/s+TsRIFbg0dmYg1zP
silIm8hGr3eb6iECSd/6WB14sSE1cQInRyvOoxCyjJEBWt8gDtm0dMaNfqphKhLc
9Y3lcQKBgQCAD+KTHioiJx3uHGC0oK32SYXp9iWYKLZVhozpX/e+fy4AWSDLCI9x
AYTqOuwl0BHDgutwpA2AQy7BsxAC3CPu6F630lv4O644W1aIbaqoS4ty7EeH+tYB
c1LRBByqBLGnV+QtydYIgiwAM7vng9NxSxvUpQ9I/lr8Myu/GeS4dg==
-----END RSA PRIVATE KEY-----
	`
)

// decodeRSA rsa 解密
func DecodeRSA(data string, typ DecodeType) (out string, err error) {
	// 检查rsa解密类型
	var strPrivateKey string
	switch typ {
	case RSA1024:
		strPrivateKey = strRSA1024PrivateKey
	case RSA2048:
		strPrivateKey = strRSA2048PrivateKey
	default:
		return out, errors.New("decode type error")
	}

	// pem 解码
	block, _ := pem.Decode([]byte(strPrivateKey))
	// X509解码
	var privateKey *rsa.PrivateKey
	privateKey, err = x509.ParsePKCS1PrivateKey(block.Bytes)
	if err != nil {
		return
	}

	// base64 解密 go base64包可以处理\r\n 无需额外处理
	var tempData []byte
	tempData, err = base64.StdEncoding.DecodeString(data)
	if err != nil {
		return
	}

	// rsa解码
	temp, err := rsa.DecryptPKCS1v15(rand.Reader, privateKey, tempData)
	if err != nil {
		return
	}
	out = string(temp)
	return
}

// encodeMD5 对密码明文进行MD5加密，空字符串不加密
func encodeMD5(pwd string) (out string, err error) {
	h := md5.New()
	_, err = h.Write([]byte(pwd))
	if err != nil {
		return
	}
	out = hex.EncodeToString(h.Sum(nil))
	return
}

// encodeNtlm ntlm 加密
func encodeNtlm(pwd string) (out string) {
	return ntlm.FromASCIIStringToHex(pwd)
}

// pkcs5Padding PKCS5 填充
func pkcs5Padding(ciphertext []byte, blockSize int) []byte {
	padding := blockSize - len(ciphertext)%blockSize
	padtext := bytes.Repeat([]byte{byte(padding)}, padding)
	return append(ciphertext, padtext...)
}

// padNormal padNormal 填充
func padNormal(ciphertext []byte, blockSize int) []byte {
	ciphertext = append(ciphertext, make([]byte, blockSize-len(ciphertext)%blockSize)...)
	return ciphertext
}

// encodeDes des 加密
func encodeDes(src string, typ DesCBCPadType) (string, error) {
	// string编码
	strDeskey := "Ea8ek&ah"
	key := []byte(strDeskey)
	data := []byte(src)

	block, err := des.NewCipher(key)
	if err != nil {
		return "", err
	}

	nBlockSize := block.BlockSize()
	switch typ {
	case PKCS5Padding:
		data = pkcs5Padding(data, nBlockSize)
	case PadNormal:
		data = padNormal(data, nBlockSize)
	default:
		return "", fmt.Errorf("des cbc pad type error:%d", typ)
	}
	// 获取CBC加密模式
	mode := cipher.NewCBCEncrypter(block, key)
	out := make([]byte, len(data))
	mode.CryptBlocks(out, data)

	return base64.StdEncoding.EncodeToString(out), nil
}

// encodeSha2 sha256 加密
func encodeSha2(src string) string {
	// 字符串转化字节数组
	message := []byte(src)
	// 创建一个基于SHA256算法的hash.Hash接口的对象
	// sha-256加密
	hash := sha256.New()
	// 输入数据
	hash.Write(message)
	// 计算哈希值
	hashbytes := hash.Sum(nil)
	// 将字符串编码为16进制格式,返回字符串
	hashCode := hex.EncodeToString(hashbytes)
	// 返回哈希值
	return hashCode
}

// MD5Encrypt md5加密
func MD5Encrypt(plainText string) (encryptedPassword string, err error) {
	h := md5.New()
	_, err = h.Write([]byte(plainText))
	if err != nil {
		return
	}

	md5Passwd := hex.EncodeToString(h.Sum(nil))

	return md5Passwd, nil
}
