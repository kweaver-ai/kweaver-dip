import { del, get, put } from '@/utils/http'
import type {
  CronJob,
  CronJobListResponse,
  CronRunListResponse,
  GetCronJobListParams,
  GetDigitalHumanPlanListParams,
  GetPlanRunsParams,
  PlanContentResponse,
  UpdatePlanRequest,
} from './index.d'

export type {
  CronJob,
  CronJobListEnabledFilter,
  CronJobListResponse,
  CronJobListSortBy,
  CronJobState,
  CronRunEntry,
  CronRunListResponse,
  GetCronJobListParams,
  GetDigitalHumanPlanListParams,
  GetPlanRunsParams,
  PlanContentResponse,
  SortDir,
  UpdatePlanRequest,
} from './index.d'

const BASE = '/api/dip-studio/v1'

/** 省略 undefined，避免作为 query 传出 */
function cleanParams<T extends Record<string, unknown>>(obj?: T): T | undefined {
  if (!obj) return undefined
  const entries = Object.entries(obj).filter(([, v]) => v !== undefined)
  if (entries.length === 0) return undefined
  return Object.fromEntries(entries) as T
}

/** 获取计划任务列表（getCronJobList） */
export const getCronJobList = (params?: GetCronJobListParams): Promise<CronJobListResponse> =>
  get(`${BASE}/plans`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<CronJobListResponse>

/** 获取单个计划任务（getCronJob） */
export const getCronJob = (planId: string): Promise<CronJob> =>
  get(`${BASE}/plans/${planId}`) as Promise<CronJob>

/** 获取指定数字员工的计划任务列表（getDigitalHumanPlanList） */
export const getDigitalHumanPlanList = (
  dhId: string,
  params?: GetDigitalHumanPlanListParams,
): Promise<CronJobListResponse> =>
  get(`${BASE}/digital-human/${dhId}/plans`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<CronJobListResponse>

/** 获取指定计划任务的运行记录（getPlanRuns） */
export const getPlanRuns = (
  planId: string,
  params?: GetPlanRunsParams,
): Promise<CronRunListResponse> =>
  get(`${BASE}/plans/${planId}/runs`, {
    params: cleanParams(params as Record<string, unknown> | undefined),
  }) as Promise<CronRunListResponse>

/** 获取指定计划任务的 PLAN.md 内容（getPlanContent） */
export const getPlanContent = (planId: string): Promise<PlanContentResponse> =>
  get(`${BASE}/plans/${planId}/content`) as Promise<PlanContentResponse>

/** 编辑计划任务（updateCronJob） */
export const updateCronJob = (planId: string, body: UpdatePlanRequest): Promise<CronJob> =>
  put(`${BASE}/plans/${planId}`, { body }) as Promise<CronJob>

/** 删除计划任务（deleteCronJob） */
export const deleteCronJob = (planId: string): Promise<void> => del(`${BASE}/plans/${planId}`)
