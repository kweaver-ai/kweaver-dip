import { beforeEach, describe, expect, it, vi } from 'vitest'
import { resetHttpConfig, setHttpConfig } from '../config'
import { handleError } from './error-handler'

describe('handleError', () => {
  beforeEach(() => {
    resetHttpConfig()
    vi.restoreAllMocks()
  })

  it('deduplicates offline error messages', () => {
    const onErrorMessage = vi.fn()
    const reject = vi.fn()

    setHttpConfig({
      onErrorMessage,
      resolveErrorMessage: () => '网络异常',
    })

    vi.spyOn(Date, 'now').mockReturnValueOnce(1000).mockReturnValueOnce(1500)

    handleError({
      error: { isAxiosError: true },
      url: '/v1/documents',
      reject,
      isOffline: true,
    })
    handleError({
      error: { isAxiosError: true },
      url: '/v1/documents',
      reject,
      isOffline: true,
    })

    expect(onErrorMessage).toHaveBeenCalledTimes(1)
    expect(onErrorMessage).toHaveBeenCalledWith('网络异常')
    expect(reject).toHaveBeenCalledTimes(2)
    expect(reject).toHaveBeenNthCalledWith(1, 0)
    expect(reject).toHaveBeenNthCalledWith(2, 0)
  })

  it('notifies token expiration on 401 responses', () => {
    const onTokenExpired = vi.fn()
    const reject = vi.fn()

    setHttpConfig({
      onTokenExpired,
    })

    handleError({
      error: {
        isAxiosError: true,
        response: {
          status: 401,
          data: {
            code: 1001,
          },
        },
      },
      url: '/v1/documents',
      reject,
    })

    expect(onTokenExpired).toHaveBeenCalledWith(1001)
    expect(reject).toHaveBeenCalledWith(401)
  })

  it('returns server descriptions for 5xx responses when available', () => {
    const reject = vi.fn()
    const payload = {
      description: 'service unavailable',
    }

    handleError({
      error: {
        isAxiosError: true,
        response: {
          status: 503,
          data: payload,
        },
      },
      url: '/v1/documents',
      reject,
    })

    expect(reject).toHaveBeenCalledWith(payload)
  })

  it('maps timeout errors to configured messages', () => {
    const onErrorMessage = vi.fn()
    const reject = vi.fn()

    setHttpConfig({
      onErrorMessage,
      resolveErrorMessage: (status) => (status === 408 ? '请求超时' : '请求失败'),
    })

    handleError({
      error: {
        isAxiosError: true,
        code: 'ECONNABORTED',
      },
      url: '/v1/documents',
      reject,
    })

    expect(onErrorMessage).toHaveBeenCalledWith('请求超时')
    expect(reject).toHaveBeenCalledWith(0)
  })
})
