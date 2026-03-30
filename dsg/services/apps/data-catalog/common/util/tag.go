package util

import (
	"reflect"
	"strings"
)

// FindTagName find tag value in structField c
func FindTagName(c reflect.StructField, tagName string) string {
	tagValue := c.Tag.Get(tagName)
	if tagValue == "" || tagValue == "-" {
		return ""
	}

	return strings.SplitN(tagValue, ",", 2)[0]
}
