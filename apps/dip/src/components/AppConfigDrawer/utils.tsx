import { ConfigMenuType } from './types'

/** 配置菜单项 */
export const menuItems: Array<{ key: ConfigMenuType; label: string }> = [
  { key: ConfigMenuType.BASIC, label: '基本信息' },
  { key: ConfigMenuType.ONTOLOGY, label: '业务知识网络' },
  { key: ConfigMenuType.AGENT, label: '智能体配置' },
]
