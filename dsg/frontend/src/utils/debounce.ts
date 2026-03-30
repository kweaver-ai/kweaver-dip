import { Timeout } from 'ahooks/lib/useRequest/src/types'

/**
 * 更新防抖函数，用于持续保存数据。
 * @param time 间隔时长
 * @returns 执行函数
 */
const debounceToUpdate = (time: number) => {
    let timer: Timeout | number = 0
    return (option: () => void) => {
        if (!timer) {
            timer = setTimeout(() => {
                option()
                clearTimeout(timer)
                timer = 0
            }, time)
        }
    }
}

/**
 * 节流类方法
 * debounce 执行的函数
 * delay 默认5000ms
 * cancel  立即取消节流函数
 */
class Throttler {
    private timeoutId: number | null = null

    private delay: number

    constructor(delay = 5000) {
        this.delay = delay
    }

    execute(func: Function, ...args: any[]): void {
        const now = Date.now()
        // 当前时间和上次执行时间大于延时 就执行函数
        if (this.timeoutId === null) {
            this.timeoutId = window.setTimeout(() => {
                func.apply(this, args)
                this.timeoutId = null
            }, this.delay)
        }
    }

    cancel(): void {
        if (this.timeoutId) {
            clearTimeout(this.timeoutId)
            this.timeoutId = null
        }
    }
}

export { debounceToUpdate, Throttler }
