import { message } from 'antd'
import intl from 'react-intl-universal'
import { httpConfig } from './token-config'

// 错误消息去重：记录每个错误消息的最后显示时间
const errorMessageCache = new Map<string, number>()
const DEDUP_INTERVAL = 2000 // 2秒内相同错误只显示一次

/**
 * 显示错误消息（带去重）
 * @param messageText 错误消息文本
 */
function showDeduplicatedMessage(messageText: string) {
  const now = Date.now()
  const lastShownTime = errorMessageCache.get(messageText)

  // 如果相同错误在 2 秒内已经显示过，则跳过
  if (lastShownTime && now - lastShownTime < DEDUP_INTERVAL) {
    return
  }

  // 记录显示时间并显示消息
  errorMessageCache.set(messageText, now)
  message.warning(messageText)
}

export async function handleError({
  error,
  url,
  reject,
  isOffline,
}: {
  error: any
  url: string
  reject: (params: any) => void
  isOffline?: boolean
}) {
  const handleReject = (code: number | string) => {
    reject(code)
    return
  }

  if (/\/v1\/(ping|profile|avatars|user\/get)/.test(url)) {
    handleReject(0)
    return
  }

  if (isOffline) {
    showDeduplicatedMessage(intl.get('error.networkError'))
    handleReject(0)
    return
  }

  if (error.code === 'ECONNABORTED' && error.message === 'TIMEOUT') {
    showDeduplicatedMessage(intl.get('error.timeoutError'))
    handleReject(0)
    return
  }

  if (error.message === 'CANCEL') {
    handleReject('CANCEL')
    return
  }

  if (!error.response) {
    showDeduplicatedMessage(intl.get('error.serverError'))
    handleReject(0)
    return
  }

  const { status, data } = error.response

  if (status === 401 && httpConfig.onTokenExpired) {
    httpConfig.onTokenExpired(data?.code)
    handleReject(status)
    return
  }

  if (status >= 500) {
    if (data?.description) {
      reject(data)
      return
    }
    const messageText = getServerErrorMsg(status)
    showDeduplicatedMessage(messageText)
    handleReject(status)
    return
  }

  reject(data)
}

export function getServerErrorMsg(status: number): string {
  return intl.get(`error.${status}`) || intl.get('error.serverError')
}
