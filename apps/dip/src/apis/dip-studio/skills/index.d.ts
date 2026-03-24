/**
 * 技能（Skills）API 类型定义。
 * 与 `skills.schemas.yaml`、`skills.paths.yaml` 中的 OpenAPI 描述一致。
 */

/**
 * 全局启用技能项（`DigitalHumanSkill`）。
 */
export interface DigitalHumanSkill {
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description?: string
}

/**
 * 数字员工已配置技能项（`DigitalHumanAgentSkill`）。
 * 与 `DigitalHumanSkill` 字段结构一致，语义为「某数字员工下的技能」。
 */
export interface DigitalHumanAgentSkill {
  /** 技能名称 */
  name: string
  /** 技能描述 */
  description?: string
}

/** 全局启用技能列表（`DigitalHumanSkillList`） */
export type DigitalHumanSkillList = DigitalHumanSkill[]

/** 数字员工已配置技能列表（`DigitalHumanAgentSkillList`） */
export type DigitalHumanAgentSkillList = DigitalHumanAgentSkill[]
