import type { SessionSummary, SessionsListResponse } from '@/apis/dip-studio/sessions'

/** 设为 `true` 时使用本地 mock 历史数据；接好接口后改为 `false` */
export const HISTORY_LIST_USE_MOCK = false

const MOCK_TOTAL = 36
const MOCK_DELAY_MS = 320
type MockSessionSummary = SessionSummary & { agentId: string }

let mockSessionsCache: MockSessionSummary[] | null = null

function buildMockSession(index: number): MockSessionSummary {
  const now = Date.now()
  const updatedAt = now - index * 12 * 60 * 1000
  const sessionId = `mock-session-${index + 1}`
  const agentId = `mock-agent-${(index % 3) + 1}`
  const kind: SessionSummary['kind'] = index % 4 === 0 ? 'group' : 'direct'

  return {
    key: `session-key-${index + 1}`,
    kind,
    updatedAt,
    sessionId,
    abortedLastRun: false,
    totalTokensFresh: true,
    modelProvider: 'openai',
    model: 'gpt-4o-mini',
    contextTokens: 8192,
    derivedTitle: `历史会话 #${index + 1}`,
    agentId,
  }
}

function ensureMockCache(): MockSessionSummary[] {
  if (!mockSessionsCache) {
    mockSessionsCache = Array.from({ length: MOCK_TOTAL }, (_, index) => buildMockSession(index))
  }
  return mockSessionsCache
}

function toSessionsListResponse(sessions: SessionSummary[]): SessionsListResponse {
  return {
    ts: Date.now(),
    path: '/mock/sessions',
    count: sessions.length,
    sessions,
    defaults: {},
  }
}

export async function mockGetSessionsList(limit = 200): Promise<SessionsListResponse> {
  const all = ensureMockCache()
  const sliced = all.slice(0, Math.max(0, limit))
  return new Promise((resolve) => {
    setTimeout(() => resolve(toSessionsListResponse(sliced)), MOCK_DELAY_MS)
  })
}

export async function mockGetSessionsListPage(
  offset = 0,
  limit = 20,
): Promise<SessionsListResponse> {
  const all = ensureMockCache()
  const start = Math.max(0, offset)
  const end = start + Math.max(0, limit)
  const sliced = all.slice(start, end)
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          ...toSessionsListResponse(sliced),
          count: all.length,
        }),
      MOCK_DELAY_MS,
    )
  })
}

export async function mockGetDigitalHumanSessionsList(
  digitalHumanId: string,
  limit = 20,
): Promise<SessionsListResponse> {
  const all = ensureMockCache()
  const filtered = all.filter((item) => item.agentId === digitalHumanId)
  const sliced = filtered.slice(0, Math.max(0, limit))
  return new Promise((resolve) => {
    setTimeout(() => resolve(toSessionsListResponse(sliced)), MOCK_DELAY_MS)
  })
}

export async function mockGetDigitalHumanSessionsListPage(
  digitalHumanId: string,
  offset = 0,
  limit = 20,
): Promise<SessionsListResponse> {
  const all = ensureMockCache()
  const filtered = all.filter((item) => item.agentId === digitalHumanId)
  const start = Math.max(0, offset)
  const end = start + Math.max(0, limit)
  const sliced = filtered.slice(start, end)
  return new Promise((resolve) => {
    setTimeout(
      () =>
        resolve({
          ...toSessionsListResponse(sliced),
          count: filtered.length,
        }),
      MOCK_DELAY_MS,
    )
  })
}
