// 字段元数据对象
export class FieldsData {
    // 元数据
    data: any[]

    // 字段类型枚举值 - 废弃
    dataType: any[]

    // 样例数据
    exampleData: { id: string; example: any }[]

    constructor(data?, dataType?) {
        this.data = data || []
        this.dataType = dataType || []
        this.exampleData = []
    }

    addData(value: any[]) {
        if (value.length > 0) {
            value.forEach((a) => {
                const temp = this.data.filter((info) => info.id !== a.id)
                this.data = [...temp, a]
            })
        }
    }

    /**
     * 添加样例数据
     * @param id 算子/库表ID
     * @param example 样例数据
     * @param cover 是否覆盖
     */
    addExampleData(id: string, example, cover = false) {
        if (cover || !this.exampleData.find((a) => a.id === id)) {
            this.exampleData = [
                ...this.exampleData.filter((a) => a.id !== id),
                { id, example },
            ]
        }
    }
}
