import { get, post } from '@/utils/http'
import type {
  GuideInitializeRequest,
  GuideInitializeResponse,
  GuideStatusResponse,
  OpenClawDetectedConfig,
} from './index.d'
import {
  GUIDE_USE_MOCK,
  mockGetGuideStatus,
  mockGetOpenClawDetectedConfig,
  mockInitializeGuide,
} from './mockGuide'

export type {
  GatewayProtocol,
  GuideInitializeRequest,
  GuideInitializeResponse,
  GuideMissingField,
  GuideState,
  GuideStatusResponse,
  OpenClawDetectedConfig,
} from './index.d'

const BASE = '/api/dip-studio/v1'

/** 获取 DIP Studio 初始化状态（getGuideStatus） */
export const getGuideStatus = (): Promise<GuideStatusResponse> =>
  GUIDE_USE_MOCK
    ? mockGetGuideStatus()
    : (get(`${BASE}/guide/status`) as Promise<GuideStatusResponse>)

/** 获取本机 OpenClaw 配置（getOpenClawDetectedConfig） */
export const getOpenClawDetectedConfig = (): Promise<OpenClawDetectedConfig> =>
  GUIDE_USE_MOCK
    ? mockGetOpenClawDetectedConfig()
    : (get(`${BASE}/guide/openclaw-config`) as Promise<OpenClawDetectedConfig>)

/** 完成 DIP Studio 初始化（initializeGuide） */
export const initializeGuide = (body: GuideInitializeRequest): Promise<GuideInitializeResponse> =>
  GUIDE_USE_MOCK
    ? mockInitializeGuide(body)
    : (post(`${BASE}/guide/initialize`, { body }) as Promise<GuideInitializeResponse>)
