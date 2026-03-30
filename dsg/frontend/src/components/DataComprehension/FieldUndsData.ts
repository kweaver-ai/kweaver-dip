// 字段理解对象
export class FieldUndsData {
    // 理解数据
    data: any[]

    // 字段类型枚举值
    dataType: any[]

    constructor(data?, dataType?) {
        this.data = data || []
        this.dataType = dataType || []
    }
}
