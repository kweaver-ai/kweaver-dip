import { DESettingMenuKey, type DESettingMenuItem } from './types'

export const deSettingMenuItems: DESettingMenuItem[] = [
  { key: DESettingMenuKey.BASIC, label: '基本设定' },
  { key: DESettingMenuKey.SKILL, label: '技能配置' },
  { key: DESettingMenuKey.KNOWLEDGE, label: '知识配置' },
  { key: DESettingMenuKey.CHANNEL, label: '通道接入' },
]

