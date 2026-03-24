/**
 * 数字员工（Digital Human）API 类型
 * 与 digital-human.paths.yaml / digital-human.schemas.yaml 保持一致
 */

import type { DigitalHumanSkill } from '../skills'

/** 知识源条目（BknEntry） */
export interface BknEntry {
  /** 知识源名称 */
  name: string
  /** 知识源 URL，即 Id */
  url: string
}

/** 渠道类型；省略时按飞书处理，响应中通常会规范为 `feishu` */
export type ChannelType = 'feishu' | 'dingtalk'

/**
 * IM 渠道配置（ChannelConfig）
 * 绑定到 OpenClaw agent，后端写入 `openclaw.json` 的 `bindings` 与 `channels`；需已安装对应渠道插件。
 */
export interface ChannelConfig {
  /** 渠道类型；省略时按飞书处理 */
  type?: ChannelType
  /** 应用/客户端 ID（飞书/钉钉开放平台） */
  appId: string
  /** 应用密钥 */
  appSecret: string
}

/** 数字员工列表项（DigitalHuman） */
export interface DigitalHuman {
  id: string
  name: string
  /** 岗位 / 角色（IDENTITY.md Creature） */
  creature?: string
  /** 更新时间 */
  updated_at?: string
  /** 更新者 */
  updated_by?: string
}

export type DigitalHumanList = DigitalHuman[]

/** 创建/更新请求体：技能为目录名列表（string[]） */
type DigitalHumanWriteBody = {
  /** 技能目录名列表 */
  skills?: string[]
  bkn?: BknEntry[]
  channel?: ChannelConfig
}

/** 详情与创建/更新响应中的扩展字段（技能为 DigitalHumanSkill[]） */
type DigitalHumanEntityOptional = {
  creature?: string
  soul?: string
  skills?: DigitalHumanSkill[]
  bkn?: BknEntry[]
  channel?: ChannelConfig
}

/**
 * 数字员工详情（DigitalHumanDetail）
 * `skills` 为带名称与描述的结构列表；请求创建/更新时 `skills` 使用 `string[]`（见 CreateDigitalHumanRequest）。
 */
export type DigitalHumanDetail = DigitalHuman & {
  soul: string
  skills?: DigitalHumanSkill[]
  bkn?: BknEntry[]
  channel?: ChannelConfig
}

/**
 * 创建数字员工请求（CreateDigitalHumanRequest）
 * 后端通过 OpenClaw `agents.create` 创建 agent；`channel` 写入本机 `OPENCLAW_CONFIG_PATH` 指向的 `openclaw.json`。
 */
export type CreateDigitalHumanRequest = {
  /** 数字员工 ID；不传则后端自动生成 UUID */
  id?: string
  name: string
  creature?: string
  soul?: string
} & DigitalHumanWriteBody

/**
 * 创建数字员工响应（CreateDigitalHumanResponse）
 * 与请求字段对应；若请求中传了 `channel`，响应会带上 `type`（省略时规范为 `feishu`）
 */
export type CreateDigitalHumanResponse = {
  /** 数字员工 ID（与 OpenClaw agent id 一致，创建时通常为 UUID） */
  id: string
  name: string
} & DigitalHumanEntityOptional

/** 与 CreateDigitalHumanResponse 同构（UpdateDigitalHumanResponse） */
export type UpdateDigitalHumanResponse = CreateDigitalHumanResponse

/**
 * 更新数字员工请求（UpdateDigitalHumanRequest）
 * 至少提供 `name`、`creature`、`soul`、`skills`、`bkn`、`channel` 之一；`skills` / `bkn` 出现时表示整组替换（可为空数组清空）。
 */
export type UpdateDigitalHumanRequest = Partial<
  Pick<CreateDigitalHumanRequest, 'name' | 'creature' | 'soul' | 'skills' | 'bkn' | 'channel'>
>

/** 数字员工响应请求；允许任意扩展字段 */
export type DigitalHumanResponseRequest = Record<string, unknown>

/** 数字员工响应事件流（`text/event-stream` 正文） */
export type DigitalHumanResponseStream = string

/** 删除数字员工时 query `deleteFiles`：是否删除工作区文件（默认 true），`false` 表示仅删除 agent 配置 */
export type DeleteDigitalHumanDeleteFiles = 'true' | 'false'
