/* eslint-disable no-bitwise */
export type BinArr = number[]

const MAX_31_VALUE = 0b1111111111111111111111111111111

// 2^30 二进制刚好是 31 位
const toBinArr = (index: number): number[] => {
    if (index < 1) return [0]
    const power = index - 1
    const numOfZero = ~~(power / 30)
    const rest = power % 30
    const arr = numOfZero ? new Array(numOfZero).fill(0) : []
    arr.push(2 ** rest)
    return arr
}

const plusBinArr = (...args: BinArr[]): BinArr => {
    const length = Math.max(...args.map((arr) => arr?.length))
    const result = new Array(length).fill(0)

    result.forEach((n, i) => {
        args.forEach((arr) => {
            result[i] += arr[i] || 0
        })
        // 处理进位
        while (result[i] > MAX_31_VALUE) {
            result[i + 1] += 1
            result[i] -= MAX_31_VALUE
        }
    })

    return result.length === 0 ? [0] : result
}

const andBinArr = (a: BinArr, b: BinArr): BinArr => {
    const length = Math.max(a.length, b.length)
    const result = new Array(length).fill(0)

    result.forEach((n, i) => {
        result[i] = a[i] & b[i]
    })

    while (result[result.length - 1] === 0) {
        result.pop()
    }

    return result.length === 0 ? [0] : result
}

const equalBinArr = (a: BinArr, b: BinArr) => {
    return (
        a.length === b.length && a.every((value, index) => value === b[index])
    )
}

export { toBinArr, plusBinArr, andBinArr, equalBinArr }
