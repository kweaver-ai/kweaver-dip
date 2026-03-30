package settings

import (
	"fmt"
	"os"
	"strconv"
)

func checkDir(dstDir string) error {
	if dstDir == "" {
		panic("empty config")
	}
	if _, err := os.Stat(dstDir); os.IsNotExist(err) {
		if err = os.MkdirAll(dstDir, os.ModePerm); err != nil {
			panic(err.Error())
		} else {
			fmt.Printf("create dir: %s", dstDir)
		}
	}
	return nil
}

// CheckConfigPath check config path, if not exists, try create
func CheckConfigPath() {
	checkDir(ConfigInstance.Config.LogPath)
}

func CheckConfig() {
	checks := []string{
		ConfigInstance.Config.Oauth.OauthClientID,
		ConfigInstance.Config.Oauth.OauthClientSecret,
		//ConfigInstance.Config.UserMgmInfo.PrivateHost,
	}
	for i, check := range checks {
		if check == "" {
			panic(strconv.Itoa(i) + " is empty")
		}
	}
	intChecks := []int{
		//ConfigInstance.Config.UserMgmInfo.PrivatePort,
	}
	for i, check := range intChecks {
		if check == 0 {
			panic(strconv.Itoa(i) + " is zero")
		}
	}

}
