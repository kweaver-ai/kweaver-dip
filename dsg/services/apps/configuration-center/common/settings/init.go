package settings

import config2 "github.com/kweaver-ai/idrm-go-frame/core/config"

func Init() {
	//初始化配置文件
	SwagConfig = config2.Scan[SwagConf]()
	if SwagConfig.Doc.Host == "" {
		SwagConfig.Doc.Host = "0.0.0.0:8133"
	}
	//检查配置的目录
	CheckConfigPath()
	//初始化MQ consumer配置
	//MQConf = config2.Scan[MQConfig]()
}
