import moment from 'moment'
import __ from './locale'

export const formatTime = (
    time: number | string,
    format: string = 'YYYY-MM-DD HH:mm:ss',
) => {
    let t = time
    if (typeof time === 'number') {
        t =
            time.toString().length === 13
                ? time
                : time * 10 ** (13 - time.toString().length)
    }
    return moment(t).format(format)
}

export const formatCount = (count: number) => {
    if (count >= 1000000) {
        return (count / 1000000).toFixed(1).concat('M')
    }
    if (count >= 1000) {
        return (count / 1000).toFixed(1).concat('K')
    }
    return count.toString()
}

// 将十六进制转换为 rgba 形式
export const hex2rgba = (hex: string, alpha = 1) => {
    const [r, g, b] = hex.match(/\w\w/g)?.map((x) => parseInt(x, 16)) || []
    return `rgba(${r},${g},${b},${alpha})`
}

// 日期范围
export enum DateRange {
    // 分钟
    Minute = 'minute',

    // 小时
    Hour = 'hour',

    // 今天
    ToDay = 'toDay',

    // 昨天
    Yesterday = 'yesterday',

    // 6天
    SixDay = 'sevenDay',

    // 月
    Month = 'month',

    // 年
    Year = 'year',
}

// 日期范围的数据
const DateRangeValue: {
    [key in DateRange]: number
} = {
    [DateRange.Minute]: 1000 * 60,
    [DateRange.Hour]: 1000 * 60 * 60,
    [DateRange.ToDay]: 1000 * 60 * 60 * 24,
    [DateRange.Yesterday]: 1000 * 60 * 60 * 24 * 2,
    [DateRange.SixDay]: 1000 * 60 * 60 * 24 * 6,
    [DateRange.Month]: 1000 * 60 * 60 * 24 * 30,
    [DateRange.Year]: 1000 * 60 * 60 * 24 * 30 * 12,
}

/**
 * 获取当前日期零时的时间
 * @param time
 * @returns
 */
export const getTimesZeroTime = (time: number = Date.now()): number => {
    return moment(time).startOf('day').valueOf()
}
/**
 * 获取当前时间的相对日期
 * @param time 当前时间
 * @param range 需要格式化的范围
 * @param defaultFormat 超出格式化的范围的默认显示的格式
 */
export const formatTImeToRelativelyTime = (
    time: number,
    range: Array<DateRange>,
    defaultFormat: string,
) => {
    const relativelyTime = Date.now() - time
    // 今天零时的时间
    const toDayStartTime = getTimesZeroTime()
    // 昨天零时的时间
    const yesterdayStartTime = getTimesZeroTime(
        Date.now() - DateRangeValue.yesterday,
    )
    switch (true) {
        case range.includes(DateRange.Minute) &&
            DateRangeValue[DateRange.Minute] > relativelyTime:
            return __('刚刚')
        case range.includes(DateRange.Hour) &&
            DateRangeValue[DateRange.Hour] > relativelyTime:
            return `${Math.floor(relativelyTime / (1000 * 60))}${__('分钟前')}`
        case range.includes(DateRange.ToDay) && toDayStartTime < time:
            return __('今天')
        case range.includes(DateRange.Yesterday) && yesterdayStartTime < time:
            return __('昨天')
        case range.includes(DateRange.Month) &&
            DateRangeValue[DateRange.Month] > relativelyTime:
            return __('一个月内')
        case range.includes(DateRange.Year) &&
            DateRangeValue[DateRange.Year] > relativelyTime:
            return __('今年')
        default:
            try {
                return moment(time).format(defaultFormat)
            } catch (ex) {
                return new Error('time or defaultFormat Error')
            }
    }
}

/**
 * 转化时间
 * 若为当日内的时间，则仅显示时间的时分；
 * 若为7日内的时间，则显示：1天前～6天前；
 * 若超出7日，则显示时间的月日；
 * 若不在当年，则显示时间的年月日；
 * @time 当前时间
 * @range 需要格式化的范围
 */
export const formatTime1 = (time: number, range: Array<DateRange>) => {
    // time零时的时间
    const timeStartTime = getTimesZeroTime(time)
    // 今天零时的时间
    const toDayStartTime = getTimesZeroTime()
    // 6天零时的时间
    const sevenDayStartTime = getTimesZeroTime(
        Date.now() - DateRangeValue.sevenDay,
    )
    const relativelyTime = toDayStartTime - timeStartTime
    const currentYear = new Date().getFullYear()
    const timeYear = new Date(time).getFullYear()
    switch (true) {
        case range.includes(DateRange.ToDay) && toDayStartTime < time:
            return moment(time).format('HH:mm')
        case range.includes(DateRange.SixDay) && sevenDayStartTime < time:
            return `${Math.floor(relativelyTime / (1000 * 60 * 60 * 24))}${__(
                '天前',
            )}`
        case range.includes(DateRange.Year) && currentYear === timeYear:
            return moment(time).format('MM-DD')
        default:
            try {
                return moment(time).format('YYYY-MM-DD')
            } catch (ex) {
                return new Error('time or defaultFormat Error')
            }
    }
}

/**
 * 获取指定日期是当月的第几周
 * @param date 要计算的日期
 * @returns 该日期在当月的周数
 */
function getWeekOfMonth(date: Date): number {
    const firstDayOfMonth = new Date(date.getFullYear(), date.getMonth(), 1)
    const firstDayWeekday = firstDayOfMonth.getDay()
    const offset = firstDayWeekday === 0 ? 7 : firstDayWeekday // 周日设为 7
    const dayOfMonth = date.getDate()
    return Math.ceil((dayOfMonth + offset - 1) / 7)
}

/**
 * 获取指定日期的近num周名称
 * @param inputDate 指定日期，默认为当前日期
 * @returns 包含近num周名称的数组
 */
export function getRecentWeeksName(
    inputDate: Date = new Date(),
    num = 4,
): string[] {
    const result: string[] = []
    const currentDate = new Date(inputDate)

    for (let i = 0; i < num; i += 1) {
        const targetDate = new Date(currentDate)
        targetDate.setDate(currentDate.getDate() - i * 7)
        const month = targetDate.getMonth() + 1
        const week = getWeekOfMonth(targetDate)
        result.unshift(`${month}月第${week}周`)
    }

    return result
}

// 使用示例
// const inputDate = new Date('2025/05/10')
// const recentFourWeeks = getRecentFourWeeks(inputDate)
