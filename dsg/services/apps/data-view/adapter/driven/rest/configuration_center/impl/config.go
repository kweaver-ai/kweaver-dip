package impl

// configuration-center 客户端的配置
type Config struct {
	// configuration-center 的服务端地址：协议，域名或 IP 地址，端口号可选。
	//
	//  - http://localhost
	//  - https://127.0.0.1:8080
	Host string

	// configuration-center 的 API endpoint 的绝对路径。
	//
	//  - /api
	//  - /api/configuration-center
	//  - /api/configuration-center/v1
	APIPath string
}
