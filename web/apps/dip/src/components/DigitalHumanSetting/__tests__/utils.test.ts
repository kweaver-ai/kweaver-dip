import { describe, expect, it } from 'vitest'

import { DESettingMenuKey } from '../types'
import { deSettingMenuItems } from '../utils'

describe('DigitalHumanSetting/utils', () => {
  it('菜单项顺序与 key 正确', () => {
    expect(deSettingMenuItems.map((item) => item.key)).toEqual([
      DESettingMenuKey.BASIC,
      DESettingMenuKey.SKILL,
      DESettingMenuKey.KNOWLEDGE,
      DESettingMenuKey.CHANNEL,
    ])
  })

  it('菜单文案完整', () => {
    expect(deSettingMenuItems.map((item) => item.label)).toEqual([
      '基本设定',
      '技能配置',
      '知识配置',
      '通道接入',
    ])
  })
})
