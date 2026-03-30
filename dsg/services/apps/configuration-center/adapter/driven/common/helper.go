package common

import (
	"github.com/mozillazg/go-pinyin"
	"strings"
	"unicode"
)

const DefaultBatchSize = 100

func KeywordEscape(keyword string) string {
	//special := strings.NewReplacer(`\`, `\\`, `_`, `\_`, `%`, `\%`, `'`, `\'`)
	special := strings.NewReplacer(`\`, `\\`, `_`, `\_`, `%`, `\%`)
	return special.Replace(keyword)
}

// GetPinyinInitials 把机构名称转换为拼音首字母
func GetPinyinInitials(name string) string {
	a := pinyin.NewArgs()
	var result strings.Builder
	for _, r := range name {
		// 英文字符，原样输出（小写）
		if unicode.IsLetter(r) && r <= unicode.MaxASCII {
			result.WriteString(strings.ToLower(string(r)))
			continue
		}
		// 中文字符，取拼音首字母（小写）
		if unicode.Is(unicode.Han, r) {
			py := pinyin.SinglePinyin(r, a)
			if len(py) > 0 && len(py[0]) > 0 {
				result.WriteString(strings.ToLower(string(py[0][0])))
			}
			continue
		}
		// 其他字符（符号、数字等），原样输出
		result.WriteRune(r)
	}
	return result.String()
}
