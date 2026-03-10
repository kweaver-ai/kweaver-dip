import type { MenuProps } from 'antd'
import type { ObjectType } from '@/apis'
import IconFont from '@/components/IconFont'
import { ProjectActionEnum } from './types'

/** 项目管理操作菜单项 */
export const getProjectMenuItems = (
  onMenuClick: (key: ProjectActionEnum) => void,
): MenuProps['items'] => {
  return [
    {
      key: ProjectActionEnum.Edit,
      icon: <IconFont type="icon-dip-bianji" />,
      label: '编辑',
      onClick: (e: any) => {
        e.domEvent.stopPropagation()
        onMenuClick(ProjectActionEnum.Edit)
      },
    },
    { type: 'divider' },
    {
      key: ProjectActionEnum.Delete,
      icon: <IconFont type="icon-dip-trash" />,
      danger: true,
      label: '删除',
      onClick: (e: any) => {
        e.domEvent.stopPropagation()
        onMenuClick(ProjectActionEnum.Delete)
      },
    },
  ]
}

/** ObjectType 中文名称映射 */
export const objectTypeNameMap = (objectType: ObjectType): string => {
  return {
    project: '项目',
    application: '应用',
    page: '页面',
    function: '功能',
  }[objectType]
}

/** ObjectType 名称输入框占位符映射 */
export const objectNamePlaceholderMap = (objectType: ObjectType): string => {
  return {
    project: '请输入项目名称',
    application: '请输入应用名称',
    page: '例如：用户管理',
    function: '例如：列表查询功能',
  }[objectType]
}

/** ObjectType 描述输入框占位符映射 */
export const objectDescPlaceholderMap = (objectType: ObjectType): string => {
  return {
    project: '请输入项目描述',
    application: '请输入简要描述...',
    page: '请输入简要描述...',
    function: '请输入简要描述...',
  }[objectType]
}
