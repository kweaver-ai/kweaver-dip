/**
 * DIP Studio 初始化引导（Guide）API 类型
 * 与 guide.paths.yaml / guide.schemas.yaml 保持一致
 */

/** 初始化状态枚举 */
export type GuideState = 'ready' | 'pending'

/** 缺失字段枚举 */
export type GuideMissingField =
  | 'envFile'
  | 'gatewayProtocol'
  | 'gatewayHost'
  | 'gatewayPort'
  | 'gatewayToken'
  | 'workspaceDir'
  | 'privateKey'
  | 'publicKey'

/** 网关协议枚举 */
export type GatewayProtocol = 'ws' | 'wss'

/** 引导状态响应（GuideStatusResponse） */
export interface GuideStatusResponse {
  state: GuideState
  ready: boolean
  missing: GuideMissingField[]
}

/** 本机检测到的 OpenClaw 配置（OpenClawDetectedConfig） */
export interface OpenClawDetectedConfig {
  protocol: GatewayProtocol
  host: string
  port: number
  token: string
}

/** 初始化请求（GuideInitializeRequest） */
export interface GuideInitializeRequest {
  openclaw_address: string
  openclaw_token: string
  kweaver_base_url?: string
  kweaver_token?: string
}

/** 初始化成功响应（GuideInitializeResponse） */
export interface GuideInitializeResponse {
  initialized: true
  state: 'ready'
  envFilePath: string
  assetsDir: string
  configPath?: string
  stateDir?: string
  workspaceDir: string
}
