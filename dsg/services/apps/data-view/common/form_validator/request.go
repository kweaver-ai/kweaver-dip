package form_validator

/*
新版指标开发完成后，可以删除该文件
*/

import (
	"encoding/json"
	"fmt"
	"reflect"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/kweaver-ai/dsg/services/apps/data-view/common/util"
)

// getOrmJsonBody get request body content json struct
func getOrmJsonBody(c *gin.Context) (map[string]any, error) {
	content, has := c.Get(gin.BodyBytesKey)
	if !has {
		return nil, fmt.Errorf("body数据为空")
	}
	contentBts, _ := content.([]byte)
	if len(contentBts) <= 0 {
		return nil, fmt.Errorf("invalid content type")
	}
	datas := make(map[string]any)
	if err1 := json.Unmarshal(contentBts, &datas); err1 != nil {
		return nil, err1
	}
	return datas, nil
}

// filterUselessInputKeys  filter the same key in m and keySlice
func filterUselessInputKeys(reqStruct any, keyMap map[string]any) error {
	bts, err := json.Marshal(reqStruct)
	if err != nil {
		return fmt.Errorf("arg 'reqStruct' is not a json struct, err: %v", err.Error())
	}
	dest := make(map[string]any)
	json.Unmarshal(bts, &dest)

	for key, _ := range keyMap {
		if _, ok := dest[key]; !ok {
			delete(keyMap, key)
		}
	}
	return nil
}

// getRequiredKeys get all required keys
func getRequiredKeys(b any) map[string]any {
	result := make(map[string]any)

	btype := reflect.TypeOf(b)
	if btype.Kind() != reflect.Struct {
		return result
	}
	bMap := util.TransAnyStruct(b)
	num := btype.NumField()
	for i := 0; i < num; i++ {
		field := btype.Field(i)
		tag := field.Tag.Get("binding")
		if strings.Contains(tag, "required") {
			prop := util.FindTagName(field, "json")
			if prop != "" {
				result[prop] = bMap[prop]
			}
		}
	}
	return result
}
