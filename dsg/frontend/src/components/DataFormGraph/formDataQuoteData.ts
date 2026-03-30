export default class FormQuoteData {
    quoteData: { [key: string]: any }

    selected: string | number = ''

    multipleSelected: Array<string | number> = []

    constructor(data: { [key: string]: any }) {
        this.quoteData = data
    }

    deleteData(key: string) {
        delete this.quoteData[key]
    }

    addData(item: { [key: string]: any }) {
        this.quoteData = {
            ...this.quoteData,
            ...item,
        }
    }

    clearData() {
        this.quoteData = {}
    }

    onSelectData(id: string | number) {
        this.selected = id
    }

    onMultipleSelectData(data: Array<string | number>) {
        this.multipleSelected = data
    }
}
