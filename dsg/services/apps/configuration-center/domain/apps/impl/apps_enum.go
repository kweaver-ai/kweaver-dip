package impl

import (
	"strconv"

	"github.com/kweaver-ai/dsg/services/apps/configuration-center/common/constant"
	"github.com/kweaver-ai/dsg/services/apps/configuration-center/domain/apps"
	"github.com/kweaver-ai/idrm-go-frame/core/enum"
)

// region common
var enumObject *apps.EnumObject

func init() {
	enumObject = new(apps.EnumObject)
	enumObject.AreaName = newKV(enum.Objects[constant.AreaName]())
	enumObject.RangeName = newKV(enum.Objects[constant.RangeName]())
}
func newKV(objs []enum.Object) []apps.KV {
	rs := make([]apps.KV, 0)
	for _, obj := range objs {
		rs = append(rs, apps.KV{
			ID:    strconv.Itoa(obj.Integer.Int()),
			Value: obj.Display,
			// ValueEn: obj.String,
		})
	}
	return rs
}

func GetEnumConfig() *apps.EnumObject {
	return enumObject
}

func (u appsUseCase) GetFormEnum() *apps.EnumObject {
	return GetEnumConfig()
}
