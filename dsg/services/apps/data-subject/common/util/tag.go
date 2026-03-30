package util

import (
	"reflect"
	"strings"
)

//FindTagName find tag value in structField c
func FindTagName(c reflect.StructField, tagName string) string {
	tagValue := c.Tag.Get(tagName)
	ts := strings.Split(tagValue, ",")
	if tagValue == "" || tagValue == "omitempty" || ts[0] == "" {
		return c.Name
	}
	if tagValue == "-" {
		return ""
	}
	if len(ts) == 1 {
		return tagValue
	}
	return ts[0]
}
