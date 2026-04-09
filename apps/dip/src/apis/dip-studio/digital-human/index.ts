import { del, get, post, put } from '@/utils/http'
import type {
  BuiltInDigitalHumanList,
  CreateDigitalHumanRequest,
  CreateDigitalHumanResponse,
  DeleteDigitalHumanDeleteFiles,
  DigitalHumanDetail,
  DigitalHumanList,
  DigitalHumanResponseRequest,
  DigitalHumanResponseStream,
  UpdateDigitalHumanRequest,
  UpdateDigitalHumanResponse,
} from './index.d'

export type {
  BknEntry,
  BuiltInDigitalHuman,
  BuiltInDigitalHumanList,
  ChannelConfig,
  ChannelType,
  CreateDigitalHumanRequest,
  CreateDigitalHumanResponse,
  DeleteDigitalHumanDeleteFiles,
  DigitalHuman,
  DigitalHumanDetail,
  DigitalHumanList,
  DigitalHumanResponseRequest,
  DigitalHumanResponseStream,
  UpdateDigitalHumanRequest,
  UpdateDigitalHumanResponse,
} from './index.d'

const BASE = '/api/dip-studio/v1'

/** 获取预置数字员工模板列表（getBuiltInDigitalHumanList） */
export const getBuiltInDigitalHumanList = (): Promise<BuiltInDigitalHumanList> => {
  const p1 = get(`${BASE}/digital-human/built-in`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as BuiltInDigitalHumanList) : [],
  )
  p2.abort = p1.abort
  return p2
}

/** 根据模板 ID 创建或更新预置数字员工（createBuiltInDigitalHuman） */
export const createBuiltInDigitalHuman = (ids: string): Promise<CreateDigitalHumanResponse[]> =>
  put(`${BASE}/digital-human/built-in/${ids}`)

/** 获取数字员工列表（getDigitalHumanList） */
export const getDigitalHumanList = (): Promise<DigitalHumanList> => {
  const p1 = get(`${BASE}/digital-human`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DigitalHumanList) : [],
  )
  p2.abort = p1.abort
  return p2
}

/** 创建数字员工（createDigitalHuman） */
export const createDigitalHuman = (
  body: CreateDigitalHumanRequest,
): Promise<CreateDigitalHumanResponse> => post(`${BASE}/digital-human`, { body })

/** 获取单个数字员工详情（getDigitalHumanDetail） */
export const getDigitalHumanDetail = (id: string): Promise<DigitalHumanDetail> =>
  get(`${BASE}/digital-human/${id}`)

/** 更新数字员工（updateDigitalHuman） */
export const updateDigitalHuman = (
  id: string,
  body: UpdateDigitalHumanRequest,
): Promise<UpdateDigitalHumanResponse> => put(`${BASE}/digital-human/${id}`, { body })

/** 删除数字员工（deleteDigitalHuman） */
export const deleteDigitalHuman = (
  id: string,
  params?: { deleteFiles?: DeleteDigitalHumanDeleteFiles },
): Promise<void> =>
  del(`${BASE}/digital-human/${id}`, {
    ...(params?.deleteFiles !== undefined ? { params: { deleteFiles: params.deleteFiles } } : {}),
  })

/**
 * 创建数字员工响应流（createDigitalHumanResponse）
 * 返回 `text/event-stream` 全文（连接结束后一次性得到字符串）；长连接可调大 `timeout`
 */
export const createDigitalHumanResponse = (
  id: string,
  body: DigitalHumanResponseRequest,
  options?: { timeout?: number },
): Promise<DigitalHumanResponseStream> =>
  post(`${BASE}/digital-human/${id}/chat/responses`, {
    body,
    responseType: 'text',
    timeout: options?.timeout ?? 600_000,
  }) as Promise<DigitalHumanResponseStream>
