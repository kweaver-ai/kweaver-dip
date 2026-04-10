import { beforeEach, describe, expect, it, vi } from 'vitest'

import type { CronJob } from '@/apis/dip-studio/plan'

const messageSuccess = vi.fn()
const messageError = vi.fn()

vi.mock('antd', () => ({
  message: {
    success: (msg: string) => messageSuccess(msg),
    error: (msg: string) => messageError(msg),
  },
}))

const { getCronJobListMock, updateCronJobMock, deleteCronJobMock } = vi.hoisted(() => ({
  getCronJobListMock: vi.fn(),
  updateCronJobMock: vi.fn(),
  deleteCronJobMock: vi.fn(),
}))

vi.mock('@/apis/dip-studio/plan', () => ({
  getCronJobList: (...args: unknown[]) => getCronJobListMock(...args),
  updateCronJob: (...args: unknown[]) => updateCronJobMock(...args),
  deleteCronJob: (...args: unknown[]) => deleteCronJobMock(...args),
}))

vi.mock('@/components/WorkPlanList/mockPlanList', () => ({
  PLAN_LIST_USE_MOCK: false,
  mockFetchPlanListPage: vi.fn(),
  mockPausePlan: vi.fn(),
  mockResumePlan: vi.fn(),
  mockDeletePlan: vi.fn(),
}))

const job = (id: string, enabled: boolean): CronJob => ({
  id,
  agentId: 'a',
  sessionKey: 'sk',
  name: 'n',
  enabled,
  createdAtMs: 1,
  updatedAtMs: 1,
  schedule: { kind: 'every', expr: '0 0 * * *', tz: 'UTC' },
})

describe('userWorkPlanStore', () => {
  beforeEach(() => {
    vi.resetModules()
    getCronJobListMock.mockReset()
    updateCronJobMock.mockReset()
    deleteCronJobMock.mockReset()
    messageSuccess.mockReset()
    messageError.mockReset()
  })

  it('fetchPlans 写入 jobs 与 total', async () => {
    getCronJobListMock.mockResolvedValue({
      jobs: [job('p1', true)],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null,
    })
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    await useUserWorkPlanStore.getState().fetchPlans()
    expect(useUserWorkPlanStore.getState().plans).toHaveLength(1)
    expect(useUserWorkPlanStore.getState().total).toBe(1)
    expect(useUserWorkPlanStore.getState().loading).toBe(false)
  })

  it('refreshPlansOnFocus 受节流限制', async () => {
    getCronJobListMock.mockResolvedValue({
      jobs: [],
      total: 0,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null,
    })
    const now = vi.spyOn(Date, 'now')
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    now.mockReturnValue(1_000_000)
    await useUserWorkPlanStore.getState().fetchPlans()
    expect(getCronJobListMock).toHaveBeenCalledTimes(1)
    now.mockReturnValue(1_000_000 + 10_000)
    await useUserWorkPlanStore.getState().refreshPlansOnFocus()
    expect(getCronJobListMock).toHaveBeenCalledTimes(1)
    now.mockReturnValue(1_000_000 + 31_000)
    await useUserWorkPlanStore.getState().refreshPlansOnFocus()
    expect(getCronJobListMock).toHaveBeenCalledTimes(2)
    now.mockRestore()
  })

  it('pausePlan 成功时更新本地 enabled', async () => {
    getCronJobListMock.mockResolvedValue({
      jobs: [job('p1', true)],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null,
    })
    updateCronJobMock.mockResolvedValue(undefined)
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    await useUserWorkPlanStore.getState().fetchPlans()
    const ok = await useUserWorkPlanStore.getState().pausePlan('p1')
    expect(ok).toBe(true)
    expect(useUserWorkPlanStore.getState().plans.find((p) => p.id === 'p1')?.enabled).toBe(false)
    expect(messageSuccess).toHaveBeenCalledWith('已暂停计划')
  })

  it('deletePlan 成功时移除项并调整 total', async () => {
    getCronJobListMock.mockResolvedValue({
      jobs: [job('p1', true), job('p2', true)],
      total: 2,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null,
    })
    deleteCronJobMock.mockResolvedValue(undefined)
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    await useUserWorkPlanStore.getState().fetchPlans()
    useUserWorkPlanStore.getState().setSelectedPlanId('p1')
    const ok = await useUserWorkPlanStore.getState().deletePlan('p1')
    expect(ok).toBe(true)
    expect(useUserWorkPlanStore.getState().plans.map((p) => p.id)).toEqual(['p2'])
    expect(useUserWorkPlanStore.getState().total).toBe(1)
    expect(useUserWorkPlanStore.getState().selectedPlanId).toBeUndefined()
  })

  it('fetchPlans 失败时结束 loading', async () => {
    getCronJobListMock.mockRejectedValue(new Error('list-fail'))
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    await useUserWorkPlanStore.getState().fetchPlans()
    expect(useUserWorkPlanStore.getState().loading).toBe(false)
    expect(useUserWorkPlanStore.getState().plans).toEqual([])
    consoleError.mockRestore()
  })

  it('pausePlan 失败：有 description 时用其文案，否则通用文案', async () => {
    getCronJobListMock.mockResolvedValue({
      jobs: [job('p1', true)],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null,
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    await useUserWorkPlanStore.getState().fetchPlans()

    updateCronJobMock.mockRejectedValueOnce({ description: '业务拒绝' })
    expect(await useUserWorkPlanStore.getState().pausePlan('p1')).toBe(false)
    expect(messageError).toHaveBeenLastCalledWith('业务拒绝')

    updateCronJobMock.mockRejectedValueOnce(new Error('x'))
    expect(await useUserWorkPlanStore.getState().pausePlan('p1')).toBe(false)
    expect(messageError).toHaveBeenLastCalledWith('暂停计划失败，请稍后重试')

    consoleError.mockRestore()
  })

  it('resumePlan 失败时返回 false 并提示', async () => {
    getCronJobListMock.mockResolvedValue({
      jobs: [job('p1', false)],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null,
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    updateCronJobMock.mockRejectedValue(new Error('x'))
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    await useUserWorkPlanStore.getState().fetchPlans()
    expect(await useUserWorkPlanStore.getState().resumePlan('p1')).toBe(false)
    expect(messageError).toHaveBeenCalledWith('启用计划失败，请稍后重试')
    consoleError.mockRestore()
  })

  it('deletePlan 失败时返回 false 并提示', async () => {
    getCronJobListMock.mockResolvedValue({
      jobs: [job('p1', true)],
      total: 1,
      offset: 0,
      limit: 200,
      hasMore: false,
      nextOffset: null,
    })
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    deleteCronJobMock.mockRejectedValue({ description: '禁止删除' })
    const { useUserWorkPlanStore } = await import('../userWorkPlanStore')
    await useUserWorkPlanStore.getState().fetchPlans()
    expect(await useUserWorkPlanStore.getState().deletePlan('p1')).toBe(false)
    expect(useUserWorkPlanStore.getState().plans).toHaveLength(1)
    expect(messageError).toHaveBeenCalledWith('禁止删除')
    consoleError.mockRestore()
  })
})
