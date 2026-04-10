/** 配置菜单项类型 */
export enum ConfigMenuType {
  BASIC = 'basic',
  ONTOLOGY = 'ontology',
  AGENT = 'agent',
}

/** 配置菜单项 */
export interface ConfigMenuItem {
  key: ConfigMenuType
  label: string
}
