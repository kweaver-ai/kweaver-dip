export enum DESettingMenuKey {
  BASIC = 'basic',
  SKILL = 'skill',
  KNOWLEDGE = 'knowledge',
  CHANNEL = 'channel',
}

export interface DESettingMenuItem {
  key: DESettingMenuKey
  label: string
}

