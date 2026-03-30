import { dataTypeMapping } from '../importFromDataSource'

export const FormatDataTypeTXT = (type) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return '字符型'
        case dataTypeMapping.int.includes(type):
            return '整数型'
        case dataTypeMapping.float.includes(type):
            return '小数型'
        case dataTypeMapping.decimal.includes(type):
            return '高精度型'
        case dataTypeMapping.time.includes(type):
            return '时间型'
        case dataTypeMapping.number.includes(type):
            return '数字型'
        case dataTypeMapping.bool.includes(type):
            return '布尔型'
        case dataTypeMapping.date.includes(type):
            return '日期型'
        case dataTypeMapping.datetime.includes(type):
            return '日期时间型'
        case dataTypeMapping.binary.includes(type):
            return '二进制'
        default:
            return '未知'
    }
}
