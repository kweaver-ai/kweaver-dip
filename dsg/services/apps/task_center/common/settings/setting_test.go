package settings

import (
	"os"
	"testing"

	config "github.com/kweaver-ai/idrm-go-frame/core/config"
	"github.com/kweaver-ai/idrm-go-frame/core/config/sources/env"
	"github.com/stretchr/testify/assert"
)

func TestCheckConfigPath(t *testing.T) {
	CheckConfigPath()
}

func TestInit(t *testing.T) {
	s := env.NewSource()
	config.Init([]config.Source{s}...)
	Init()
}

func Test_checkDir(t *testing.T) {
	realDir := "./"
	assert.Nil(t, checkDir(realDir))
	emptyDir := "xxx/yyy"
	assert.Nil(t, checkDir(emptyDir))
	os.RemoveAll(emptyDir)
	os.RemoveAll("xxx")
}
