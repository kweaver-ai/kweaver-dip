/**
 * 开发模式管理工具
 * 使用 localStorage 存储，按用户和项目记录
 */

import type { TreeItems } from '@/components/ProjectSider/utils'
import { flattenTree } from '@/components/ProjectSider/utils'
import { useUserInfoStore } from '@/stores'

const DEV_MODE_STORAGE_KEY = 'dip_project_dev_mode'

interface DevModeData {
  [userId: string]: {
    [projectId: string]: string | null // nodeId 或 null
  }
}

/**
 * 获取当前用户 ID
 */
const getCurrentUserId = (): string => {
  const userInfo = useUserInfoStore.getState().userInfo
  return userInfo?.id || ''
}

/**
 * 获取开发模式数据
 */
const getDevModeData = (): DevModeData => {
  try {
    const data = localStorage.getItem(DEV_MODE_STORAGE_KEY)
    return data ? JSON.parse(data) : {}
  } catch {
    return {}
  }
}

/**
 * 保存开发模式数据
 */
const saveDevModeData = (data: DevModeData): void => {
  try {
    localStorage.setItem(DEV_MODE_STORAGE_KEY, JSON.stringify(data))
  } catch (error) {
    console.error('保存开发模式数据失败:', error)
  }
}

/**
 * 获取项目的开发模式节点 ID
 */
export const getDevModeNodeId = (projectId: string): string | null => {
  const userId = getCurrentUserId()
  const data = getDevModeData()
  return data[userId]?.[projectId] ?? null
}

/**
 * 设置项目的开发模式节点
 * @param projectId 项目 ID
 * @param nodeId 节点 ID，null 表示关闭开发模式
 */
export const setDevModeNodeId = (projectId: string, nodeId: string | null): void => {
  const userId = getCurrentUserId()
  const data = getDevModeData()

  if (!data[userId]) {
    data[userId] = {}
  }

  data[userId][projectId] = nodeId
  saveDevModeData(data)

  // 触发自定义事件，通知其他组件更新
  window.dispatchEvent(
    new CustomEvent('devModeChanged', {
      detail: { projectId, nodeId },
    }),
  )
}

/**
 * 检查节点是否处于开发模式（包括继承）
 * @param projectId 项目 ID
 * @param nodeId 节点 ID
 * @param flattenedItems 扁平化的节点列表（用于查找父子关系）
 */
export const isNodeInDevMode = (
  projectId: string,
  nodeId: string,
  flattenedItems: Array<{ id: string; parentId: string | null }>,
): boolean => {
  const devModeNodeId = getDevModeNodeId(projectId)
  if (!devModeNodeId) {
    return false
  }

  // 如果当前节点就是开发模式节点
  if (nodeId === devModeNodeId) {
    return true
  }

  // 构建节点映射
  const nodeMap = new Map<string, { id: string; parentId: string | null }>()
  flattenedItems.forEach((item) => {
    nodeMap.set(item.id, item)
  })

  // 检查当前节点是否是开发模式节点的后代
  const checkIsDescendant = (currentId: string, ancestorId: string): boolean => {
    if (currentId === ancestorId) {
      return true
    }
    const currentNode = nodeMap.get(currentId)
    if (!currentNode?.parentId) {
      return false
    }
    // 递归检查父节点
    return checkIsDescendant(currentNode.parentId, ancestorId)
  }

  return checkIsDescendant(nodeId, devModeNodeId)
}

/**
 * 检查节点是否处于开发模式（包括继承）- 使用树结构
 * @param projectId 项目 ID
 * @param nodeId 节点 ID
 * @param treeItems 树结构的节点列表
 */
export const isNodeInDevModeWithTree = (
  projectId: string,
  nodeId: string,
  treeItems: TreeItems,
): boolean => {
  // 使用 flattenTree 将树结构扁平化，然后提取 id 和 parentId
  const flattenedItems = flattenTree(treeItems).map((item) => ({
    id: item.id,
    parentId: item.parentId,
  }))
  return isNodeInDevMode(projectId, nodeId, flattenedItems)
}

/**
 * 检查项目是否有任何节点处于开发模式
 */
export const hasAnyDevMode = (projectId: string): boolean => {
  return getDevModeNodeId(projectId) !== null
}
