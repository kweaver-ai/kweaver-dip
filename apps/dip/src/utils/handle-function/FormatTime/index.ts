import dayjs from 'dayjs'

/**
 * 格式化时间
 * @param time 时间
 * @returns 格式化后的时间 如：2025-12-15 10:00:00
 */
export const formatTime = (time: string | number) =>
  time ? dayjs(time).format('YYYY-MM-DD HH:mm:ss') : '- -'

/**
 * 格式化时间
 * @param time 时间
 * @returns 格式化后的时间 如：2025/12/15 10:00:00
 */
export const formatTimeSlash = (time: string | number) =>
  time ? dayjs(time).format('YYYY/MM/DD HH:mm:ss') : '- -'

/**
 * 格式化时间
 * @param time 时间
 * @returns 格式化后的时间 如：2025-12-15 10:00
 */
export const formatTimeMinute = (time: string | number) =>
  time ? dayjs(time).format('YYYY/MM/DD HH:mm') : '- -'
