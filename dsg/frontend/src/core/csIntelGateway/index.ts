import { pinyin } from 'pinyin-pro'

// 获取首字母
export function getFirstLetter(str: any): string {
    // 类型检查和容错处理
    if (!str) return ''

    // 确保转换为字符串
    const strValue = typeof str === 'string' ? str : String(str)

    if (!strValue) return ''

    return strValue
        .split('')
        .map((char) => {
            // 英文字符直接返回小写
            if (/^[a-zA-Z]$/.test(char)) {
                return char.toLowerCase()
            }
            // 中文字符取拼音首字母
            if (/[\u4e00-\u9fff]/.test(char)) {
                const py = pinyin(char, {
                    toneType: 'none',
                    pattern: 'first',
                })
                return py ? py.toLowerCase() : ''
            }
            // 数字直接返回
            if (/^\d$/.test(char)) {
                return char
            }
            // 其他字符返回空
            return ''
        })
        .join('')
        .slice(0, 128)
}
