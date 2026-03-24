import { get } from '@/utils/http'
import type {
  DigitalHumanAgentSkillList,
  DigitalHumanSkillList,
} from './index.d'

export type {
  DigitalHumanAgentSkill,
  DigitalHumanAgentSkillList,
  DigitalHumanSkill,
  DigitalHumanSkillList,
} from './index.d'

const BASE = '/api/dip-studio/v1'

/** 获取全局启用技能列表（getEnabledSkills，`GET /skills`） */
export const getEnabledSkills = (): Promise<DigitalHumanSkillList> => {
  const p1 = get(`${BASE}/skills`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DigitalHumanSkillList) : [],
  )
  p2.abort = p1.abort
  return p2
}

/** 获取指定数字员工已配置技能列表（getDigitalHumanSkills，`GET /digital-human/{id}/skills`） */
export const getDigitalHumanSkills = (id: string): Promise<DigitalHumanAgentSkillList> => {
  const p1 = get(`${BASE}/digital-human/${id}/skills`)
  const p2 = p1.then((result: unknown) =>
    Array.isArray(result) ? (result as DigitalHumanAgentSkillList) : [],
  )
  p2.abort = p1.abort
  return p2
}
