import { del, get, post } from '@/utils/http'
import type {
  DigitalHumanSkillList,
  InstallSkillResult,
  SkillFileContentResponse,
  SkillTreeResponse,
  UninstallSkillResult,
} from './index.d'

export type {
  DigitalHumanSkill,
  DigitalHumanSkillList,
  InstallSkillResult,
  SkillFileContentResponse,
  SkillTreeEntry,
  SkillTreeResponse,
  UninstallSkillResult,
} from './index.d'

const BASE = '/api/dip-studio/v1'

export interface GetEnabledSkillsParams {
  /** 按技能 ID 或展示名称/描述模糊匹配，大小写不敏感 */
  name?: string
}

/** 获取全局启用技能列表（getEnabledSkills，`GET /skills`） */
export const getEnabledSkills = (
  params?: GetEnabledSkillsParams,
): Promise<DigitalHumanSkillList> => {
  const p1 = get(`${BASE}/skills`, { params })
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DigitalHumanSkillList) : [],
  )
  p2.abort = p1.abort
  return p2
}

/** 获取指定数字员工已配置技能列表（getDigitalHumanSkills，`GET /digital-human/{id}/skills`） */
export const getDigitalHumanSkills = (id: string): Promise<DigitalHumanSkillList> => {
  const p1 = get(`${BASE}/digital-human/${id}/skills`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DigitalHumanSkillList) : [],
  )
  p2.abort = p1.abort
  return p2
}

export interface InstallSkillPayload {
  /** ZIP 包（建议扩展名 .skill 或 .zip；与 OpenClaw .skill 约定一致） */
  file: File | Blob
  /**
   * 为 `true` 或 `1` 时覆盖已存在的技能目录。
   * 按文档要求以字符串形式传递。
   */
  overwrite?: 'true' | '1'
  /** 技能目录名（slug）；不传则使用上传文件名推导（与 DIP slug 规则一致） */
  skillName?: string
}

/** 上传并安装 .skill 包（installSkill，`POST /skills/install`） */
export const installSkill = (payload: InstallSkillPayload): Promise<InstallSkillResult> => {
  const formData = new FormData()
  formData.append('file', payload.file)

  if (payload.overwrite !== undefined) {
    formData.append('overwrite', payload.overwrite)
  }

  if (payload.skillName) {
    formData.append('skillName', payload.skillName)
  }

  const p1 = post(`${BASE}/skills/install`, { body: formData })
  const p2 = p1.then((result: unknown) => result as InstallSkillResult)
  p2.abort = p1.abort
  return p2
}

/** 卸载技能目录（uninstallSkill，`DELETE /skills/{name}`） */
export const uninstallSkill = (name: string): Promise<UninstallSkillResult> => {
  const p1 = del(`${BASE}/skills/${encodeURIComponent(name)}`)
  const p2 = p1.then((result: unknown) => result as UninstallSkillResult)
  p2.abort = p1.abort
  return p2
}

/** 获取技能目录树（getSkillTree，`GET /skills/{name}/tree`） */
export const getSkillTree = (name: string): Promise<SkillTreeResponse> => {
  const p1 = get(`${BASE}/skills/${encodeURIComponent(name)}/tree`)
  const p2 = p1.then((result: unknown) => result as SkillTreeResponse)
  p2.abort = p1.abort
  return p2
}

export interface GetSkillFileContentParams {
  /** 技能根目录下的相对路径，如 `SKILL.md`、`docs/guide.md` */
  path: string
}

/** 预览技能文件内容（getSkillFileContent，`GET /skills/{name}/content`） */
export const getSkillFileContent = (
  name: string,
  params?: GetSkillFileContentParams,
): Promise<SkillFileContentResponse> => {
  const p1 = get(`${BASE}/skills/${encodeURIComponent(name)}/content`, { params })
  const p2 = p1.then((result: unknown) => result as SkillFileContentResponse)
  p2.abort = p1.abort
  return p2
}

/** 下载技能文件（downloadSkillFile，`GET /skills/{name}/download`） */
export const downloadSkillFile = (
  name: string,
  params: GetSkillFileContentParams,
): Promise<ArrayBuffer> => {
  const p1 = get(`${BASE}/skills/${encodeURIComponent(name)}/download`, {
    params,
    responseType: 'arraybuffer',
  })
  const p2 = p1.then((result: unknown) => result as ArrayBuffer)
  p2.abort = p1.abort
  return p2
}
