export default class AiIntervalData {
    // 节点内容定时器
    contentInterval: any = undefined

    // 节点选择项定时器
    selectInterval: any = undefined

    // 节点定时器
    nodeInterval: any = undefined

    // 单个维度中单个节点内容是否开始
    needStart: boolean = false

    // 单个维度请求是否结束
    reqEnd: boolean = true

    isClear() {
        return this.needStart === false && !this.nodeInterval && this.reqEnd
    }

    clearContentInterval() {
        clearInterval(this.contentInterval)
        this.contentInterval = undefined
        this.needStart = false
    }

    clearSelectInterval() {
        clearInterval(this.selectInterval)
        this.selectInterval = undefined
        this.needStart = false
    }

    clearNodeInterval() {
        clearInterval(this.nodeInterval)
        this.nodeInterval = undefined
    }

    clear() {
        clearInterval(this.selectInterval)
        clearInterval(this.contentInterval)
        clearInterval(this.nodeInterval)
        this.selectInterval = undefined
        this.contentInterval = undefined
        this.nodeInterval = undefined
        this.needStart = false
        this.reqEnd = true
    }
}
