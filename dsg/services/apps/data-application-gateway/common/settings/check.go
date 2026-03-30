package settings

import (
	"fmt"
	"os"
)

func checkDir(dstDir string) error {
	if dstDir == "" {
		panic("empty config")
	}
	if _, err := os.Stat(dstDir); os.IsNotExist(err) {
		if err = os.Mkdir(dstDir, os.ModePerm); err != nil {
			panic(err.Error())
		} else {
			fmt.Printf("create dir: %s", dstDir)
		}
	}
	return nil
}

// CheckConfigPath check config path, if not exists, try create
func CheckConfigPath() {
	checkDir(Instance.Log.LogPath)
}
