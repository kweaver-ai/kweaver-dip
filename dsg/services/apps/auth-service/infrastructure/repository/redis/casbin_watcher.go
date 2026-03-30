package redis

import (
	"github.com/casbin/casbin/v2/persist"
	rediswatcher "github.com/casbin/redis-watcher/v2"
	"github.com/kweaver-ai/dsg/services/apps/auth-service/common/settings"
	"github.com/kweaver-ai/idrm-go-frame/core/telemetry/log"
	"github.com/redis/go-redis/v9"
)

type DataPermissionWatcher persist.Watcher

func NewDataPermissionWatcher() DataPermissionWatcher {
	return newCasbinWatcher(settings.Instance.Redis, "channel:casbin:data-permission")
}

type PermissionResourceWatcher persist.Watcher

func NewPermissionResourceWatcher() PermissionResourceWatcher {
	return newCasbinWatcher(settings.Instance.Redis, "channel:casbin:permission-resource")
}

func newCasbinWatcher(s settings.Redis, channel string) persist.Watcher {
	w, err := rediswatcher.NewWatcher(s.Host, rediswatcher.WatcherOptions{
		Options: redis.Options{
			Password: s.Password,
		},
		Channel:    channel,
		IgnoreSelf: true,
	})
	if err != nil {
		log.Fatal(err.Error())
	}
	return w
}
