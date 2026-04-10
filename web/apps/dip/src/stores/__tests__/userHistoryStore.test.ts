import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { SessionSummary } from '@/apis/dip-studio/sessions'

const messageSuccess = vi.fn()
const messageError = vi.fn()
const messageWarning = vi.fn()

vi.mock('antd', () => ({
  message: {
    success: (msg: string) => messageSuccess(msg),
    error: (msg: string) => messageError(msg),
    warning: (msg: string) => messageWarning(msg),
  },
}))

const { getSessionsListMock, deleteSessionMock } = vi.hoisted(() => ({
  getSessionsListMock: vi.fn(),
  deleteSessionMock: vi.fn(),
}))

vi.mock('@/apis/dip-studio/sessions', () => ({
  getSessionsList: () => getSessionsListMock(),
  deleteSession: (key: string) => deleteSessionMock(key),
}))

vi.mock('@/components/HistoryList/mockHistoryList', () => ({
  HISTORY_LIST_USE_MOCK: false,
  mockGetSessionsList: vi.fn(),
}))

const session = (key: string): SessionSummary => ({
  key,
  kind: 'direct',
  updatedAt: 1,
  sessionId: `sid-${key}`,
  abortedLastRun: false,
  totalTokensFresh: true,
  modelProvider: 'openai',
  model: 'gpt',
  contextTokens: 4096,
})

describe('userHistoryStore', () => {
  beforeEach(() => {
    vi.resetModules()
    getSessionsListMock.mockReset()
    deleteSessionMock.mockReset()
    messageSuccess.mockReset()
    messageError.mockReset()
    messageWarning.mockReset()
  })

  it('fetchSessions 写入 sessions 与 total', async () => {
    getSessionsListMock.mockResolvedValue({
      ts: 1,
      path: '/',
      count: 1,
      sessions: [session('k1')],
    })
    const { useUserHistoryStore } = await import('../userHistoryStore')
    await useUserHistoryStore.getState().fetchSessions()
    expect(useUserHistoryStore.getState().sessions).toHaveLength(1)
    expect(useUserHistoryStore.getState().total).toBe(1)
    expect(useUserHistoryStore.getState().error).toBeNull()
  })

  it('refreshSessionsOnFocus 受节流限制', async () => {
    getSessionsListMock.mockResolvedValue({
      ts: 1,
      path: '/',
      count: 0,
      sessions: [],
    })
    const now = vi.spyOn(Date, 'now')
    const { useUserHistoryStore } = await import('../userHistoryStore')
    now.mockReturnValue(2_000_000)
    await useUserHistoryStore.getState().fetchSessions()
    expect(getSessionsListMock).toHaveBeenCalledTimes(1)
    now.mockReturnValue(2_000_000 + 10_000)
    await useUserHistoryStore.getState().refreshSessionsOnFocus()
    expect(getSessionsListMock).toHaveBeenCalledTimes(1)
    now.mockReturnValue(2_000_000 + 31_000)
    await useUserHistoryStore.getState().refreshSessionsOnFocus()
    expect(getSessionsListMock).toHaveBeenCalledTimes(2)
    now.mockRestore()
  })

  it('deleteHistorySession 无 sessionId 时 warning', async () => {
    getSessionsListMock.mockResolvedValue({
      ts: 1,
      path: '/',
      count: 1,
      sessions: [{ ...session('k1'), sessionId: '' }],
    })
    const { useUserHistoryStore } = await import('../userHistoryStore')
    await useUserHistoryStore.getState().fetchSessions()
    const ok = await useUserHistoryStore.getState().deleteHistorySession('k1')
    expect(ok).toBe(false)
    expect(messageWarning).toHaveBeenCalledWith('当前会话不存在')
  })

  it('deleteHistorySession 成功时移除项', async () => {
    getSessionsListMock.mockResolvedValue({
      ts: 1,
      path: '/',
      count: 2,
      sessions: [session('k1'), session('k2')],
    })
    deleteSessionMock.mockResolvedValue(undefined)
    const { useUserHistoryStore } = await import('../userHistoryStore')
    await useUserHistoryStore.getState().fetchSessions()
    useUserHistoryStore.getState().setSelectedSessionKey('k1')
    const ok = await useUserHistoryStore.getState().deleteHistorySession('k1')
    expect(ok).toBe(true)
    expect(useUserHistoryStore.getState().sessions.map((s) => s.key)).toEqual(['k2'])
    expect(useUserHistoryStore.getState().selectedSessionKey).toBeUndefined()
    expect(messageSuccess).toHaveBeenCalledWith('删除成功')
  })

  it('fetchSessions 非静默失败：清空列表并保留 error', async () => {
    const err = new Error('fetch-fail')
    getSessionsListMock.mockRejectedValue(err)
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { useUserHistoryStore } = await import('../userHistoryStore')
    await useUserHistoryStore.getState().fetchSessions()
    const s = useUserHistoryStore.getState()
    expect(s.loading).toBe(false)
    expect(s.sessions).toEqual([])
    expect(s.total).toBe(0)
    expect(s.error).toBe(err)
    consoleError.mockRestore()
  })

  it('fetchSessions 静默失败：保留已有 sessions', async () => {
    const now = vi.spyOn(Date, 'now')
    now.mockReturnValue(1_000_000)

    getSessionsListMock.mockResolvedValueOnce({
      ts: 1,
      path: '/',
      count: 1,
      sessions: [session('keep')],
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { useUserHistoryStore } = await import('../userHistoryStore')
    await useUserHistoryStore.getState().fetchSessions()
    expect(useUserHistoryStore.getState().sessions).toHaveLength(1)

    getSessionsListMock.mockRejectedValueOnce(new Error('silent-fail'))
    now.mockReturnValue(1_000_000 + 31_000)
    await useUserHistoryStore.getState().refreshSessionsOnFocus()

    expect(useUserHistoryStore.getState().sessions.map((x) => x.key)).toEqual(['keep'])
    expect(useUserHistoryStore.getState().loading).toBe(false)
    now.mockRestore()
    consoleError.mockRestore()
  })

  it('deleteHistorySession 接口失败：有 description 时 message.error', async () => {
    getSessionsListMock.mockResolvedValue({
      ts: 1,
      path: '/',
      count: 1,
      sessions: [session('del-fail')],
    })
    deleteSessionMock.mockRejectedValue({ description: '无权限' })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { useUserHistoryStore } = await import('../userHistoryStore')
    await useUserHistoryStore.getState().fetchSessions()
    expect(await useUserHistoryStore.getState().deleteHistorySession('del-fail')).toBe(false)
    expect(messageError).toHaveBeenCalledWith('无权限')
    expect(useUserHistoryStore.getState().sessions).toHaveLength(1)
    consoleError.mockRestore()
  })

  it('deleteHistorySession 接口失败：无 description 时通用文案', async () => {
    getSessionsListMock.mockResolvedValue({
      ts: 1,
      path: '/',
      count: 1,
      sessions: [session('del-fail2')],
    })
    deleteSessionMock.mockRejectedValue(new Error('x'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { useUserHistoryStore } = await import('../userHistoryStore')
    await useUserHistoryStore.getState().fetchSessions()
    expect(await useUserHistoryStore.getState().deleteHistorySession('del-fail2')).toBe(false)
    expect(messageError).toHaveBeenCalledWith('删除失败，请稍后重试')
    consoleError.mockRestore()
  })
})
