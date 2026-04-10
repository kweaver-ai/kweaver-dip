import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const { requestMock, handleErrorMock } = vi.hoisted(() => ({
  requestMock: vi.fn(),
  handleErrorMock: vi.fn(),
}))

vi.mock('./internal/axios-instance', () => ({
  default: {
    request: requestMock,
  },
}))

vi.mock('./internal/error-handler', () => ({
  handleError: handleErrorMock,
}))

import {
  cacheableHttp,
  createHttpRequest,
  createRequestCacheKey,
  transformRequestData,
  transformResponseData,
} from './http-request'
import { resetHttpConfig, setHttpConfig } from './config'

describe('http-request helpers', () => {
  beforeEach(() => {
    resetHttpConfig()
    requestMock.mockReset()
    handleErrorMock.mockReset()
    vi.useRealTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('serializes request payloads safely', () => {
    const body = { name: 'kweaver' }
    const circular: Record<string, unknown> = {}
    circular.self = circular

    expect(transformRequestData(body)).toBe(JSON.stringify(body))
    expect(transformRequestData('plain-text')).toBe('plain-text')
    expect(transformRequestData(circular)).toBe(circular)
  })

  it('parses json responses and keeps plain text untouched', () => {
    expect(transformResponseData('{"ok":true}')).toEqual({ ok: true })
    expect(transformResponseData('not-json')).toBe('not-json')
    expect(transformResponseData({ ok: true })).toEqual({ ok: true })
  })

  it('creates stable cache keys for equivalent params and body', () => {
    const first = createRequestCacheKey('GET', '/users', {
      params: { b: 2, a: 1 },
      body: { profile: { lastName: 'B', firstName: 'A' } },
    })
    const second = createRequestCacheKey('GET', '/users', {
      params: { a: 1, b: 2 },
      body: { profile: { firstName: 'A', lastName: 'B' } },
    })

    expect(first).toBe(second)
  })

  it('builds requests with merged headers and full responses', async () => {
    setHttpConfig({
      accessToken: 'token-a',
      getLanguage: () => 'en_us',
      buildUrl: (url) => `/api${url}`,
    })

    requestMock.mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })

    const response = await createHttpRequest('POST', '/users', {
      body: { name: 'kweaver' },
      headers: {
        traceId: 'trace-1',
      },
      params: {
        page: 1,
      },
      returnFullResponse: true,
    })

    expect(response).toMatchObject({
      data: { ok: true },
      status: 200,
    })
    expect(requestMock).toHaveBeenCalledWith(
      expect.objectContaining({
        method: 'post',
        url: '/api/users',
        data: { name: 'kweaver' },
        params: { page: 1 },
        headers: expect.objectContaining({
          Authorization: 'Bearer token-a',
          Token: 'token-a',
          'Accept-Language': 'en-US',
          'x-language': 'en-US',
          'Content-Type': 'application/json;charset=UTF-8',
          traceId: 'trace-1',
        }),
      }),
    )
  })

  it('reuses cached inflight requests until expiration', async () => {
    vi.useFakeTimers()
    requestMock.mockResolvedValue({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })

    const first = cacheableHttp('GET', '/users', { params: { page: 1 }, expires: 1000 })
    const second = cacheableHttp('GET', '/users', { params: { page: 1 }, expires: 1000 })

    expect(first).toBe(second)
    expect(requestMock).toHaveBeenCalledTimes(1)

    await first
    vi.advanceTimersByTime(1000)

    const third = cacheableHttp('GET', '/users', { params: { page: 1 }, expires: 1000 })

    expect(third).not.toBe(first)
    expect(requestMock).toHaveBeenCalledTimes(2)
  })

  it('clears failed cache entries so the next call can retry', async () => {
    handleErrorMock.mockImplementation(({ error, reject }) => {
      reject(error)
    })

    requestMock.mockRejectedValueOnce(new Error('boom')).mockResolvedValueOnce({
      data: { ok: true },
      status: 200,
      statusText: 'OK',
      headers: {},
      config: {},
    })

    await expect(cacheableHttp('GET', '/retry')).rejects.toThrow('boom')
    await expect(cacheableHttp('GET', '/retry')).resolves.toEqual({ ok: true })
    expect(requestMock).toHaveBeenCalledTimes(2)
  })
})
