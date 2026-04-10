/* eslint-disable no-continue */
/* eslint-disable no-restricted-syntax */
import { arrayMove } from '@dnd-kit/sortable'
import type { Node, NodeType } from '@/apis'

export interface TreeItem {
  id: string
  name: string
  type: NodeType
  children: TreeItem[]
  collapsed?: boolean
}

export type TreeItems = TreeItem[]

export interface FlattenedItem extends TreeItem {
  parentId: string | null
  depth: number
  index: number
}

function getDragDepth(offset: number, indentationWidth: number) {
  return Math.round(offset / indentationWidth)
}

export function getProjection(
  items: FlattenedItem[],
  activeId: string,
  overId: string,
  dragOffset: number,
  indentationWidth: number,
) {
  const overItemIndex = items.findIndex(({ id }) => id === overId)
  const activeItemIndex = items.findIndex(({ id }) => id === activeId)
  const activeItem = items[activeItemIndex]
  const newItems = arrayMove(items, activeItemIndex, overItemIndex)
  const previousItem = newItems[overItemIndex - 1]
  const nextItem = newItems[overItemIndex + 1]
  const dragDepth = getDragDepth(dragOffset, indentationWidth)
  const projectedDepth = activeItem.depth + dragDepth
  const maxDepth = getMaxDepth({ previousItem })
  const minDepth = getMinDepth({ nextItem })
  let depth = projectedDepth

  if (projectedDepth >= maxDepth) {
    depth = maxDepth
  } else if (projectedDepth < minDepth) {
    depth = minDepth
  }

  // 确保 depth 不会小于 0（最小深度是 0，不把 -1 算进去）
  // 但是允许 depth === -1（应用层级），只是在计算最小深度时不考虑它
  // 如果计算出的 depth 小于 0 且不是 -1，则限制为 0
  if (depth < 0 && depth !== -1) {
    depth = 0
  }

  return { depth, maxDepth, minDepth, parentId: getParentId() }

  function getParentId() {
    // depth === -1 表示应用层级（根节点），parentId 应该为 null
    if (depth === -1 || !previousItem) {
      return null
    }

    if (depth === previousItem.depth) {
      return previousItem.parentId
    }

    if (depth > previousItem.depth) {
      return previousItem.id
    }

    const newParent = newItems
      .slice(0, overItemIndex)
      .reverse()
      .find((item) => item.depth === depth)?.parentId

    return newParent ?? null
  }
}

function getMaxDepth({ previousItem }: { previousItem?: FlattenedItem }) {
  if (previousItem) {
    // 最大深度不能超过 1（功能层级）
    return Math.min(1, previousItem.depth + 1)
  }

  return -1
}

function getMinDepth({ nextItem }: { nextItem?: FlattenedItem }) {
  if (nextItem) {
    // 如果 nextItem 的 depth 是 -1（应用层级），最小深度应该是 0
    // 因为最小深度不把 -1 算进去
    return nextItem.depth === -1 ? 0 : nextItem.depth
  }

  // 没有 nextItem 时，最小深度是 0（页面层级）
  return 0
}

function flatten(items: TreeItems, parentId: string | null = null, depth = -1): FlattenedItem[] {
  return items.reduce<FlattenedItem[]>((acc, item, index) => {
    acc.push({ ...item, parentId, depth, index })
    acc.push(...flatten(item.children, item.id, depth + 1))
    return acc
  }, [])
}

export function flattenTree(items: TreeItems): FlattenedItem[] {
  return flatten(items)
}

export function buildTree(flattenedItems: FlattenedItem[]): TreeItems {
  const root: TreeItem = { id: 'root', name: '', type: 'application', children: [] }
  const nodes: Record<string, TreeItem> = { [root.id]: root }
  const items = flattenedItems.map((item) => ({ ...item, children: [] }))

  for (const item of items) {
    const { id, name, type, collapsed, children } = item
    const parentId = item.parentId ?? root.id
    const parent = nodes[parentId] ?? findItem(items, parentId)

    nodes[id] = { id, name, type, collapsed, children }
    if (parent) {
      parent.children.push({ id, name, type, collapsed, children })
    }
  }

  return root.children
}

export function findItem(items: TreeItem[], itemId: string) {
  return items.find(({ id }) => id === itemId)
}

export function findItemDeep(items: TreeItems, itemId: string): TreeItem | undefined {
  for (const item of items) {
    const { id, children } = item

    if (id === itemId) {
      return item
    }

    if (children.length) {
      const child = findItemDeep(children, itemId)

      if (child) {
        return child
      }
    }
  }

  return undefined
}

/** 将节点 id 转为 string（TreeItem/React key 使用） */
function toIdStr(id: number | string): string {
  return String(id)
}

/**
 * 将 Node 数组转换为树结构
 */
export function convertNodeInfoToTree(nodes: Node[]): TreeItems {
  const nodeMap = new Map<string, Node>()
  nodes.forEach((node) => {
    nodeMap.set(toIdStr(node.id), node)
  })

  const treeMap = new Map<string, TreeItem>()
  const rootNodes: TreeItem[] = []

  nodes.forEach((node) => {
    treeMap.set(toIdStr(node.id), {
      id: toIdStr(node.id),
      name: node.name,
      type: node.node_type,
      children: [],
    })
  })

  nodes.forEach((node) => {
    const treeNode = treeMap.get(toIdStr(node.id))
    if (!treeNode) return
    if (node.parent_id != null) {
      const parent = treeMap.get(toIdStr(node.parent_id))
      if (parent) {
        parent.children.push(treeNode)
      } else {
        rootNodes.push(treeNode)
      }
    } else {
      rootNodes.push(treeNode)
    }
  })

  return rootNodes
}

export function removeItem(items: TreeItems, id: string) {
  const newItems: TreeItem[] = []

  for (const item of items) {
    if (item.id === id) {
      continue
    }

    if (item.children.length) {
      item.children = removeItem(item.children, id)
    }

    newItems.push(item)
  }

  return newItems
}

export function setProperty<T extends keyof TreeItem>(
  items: TreeItems,
  id: string,
  property: T,
  setter: (value: TreeItem[T]) => TreeItem[T],
) {
  for (const item of items) {
    if (item.id === id) {
      item[property] = setter(item[property])
      continue
    }

    if (item.children.length) {
      item.children = setProperty(item.children, id, property, setter)
    }
  }

  return [...items]
}

function countChildren(items: TreeItem[], count = 0): number {
  return items.reduce((acc, { children }) => {
    if (children.length) {
      return countChildren(children, acc + 1)
    }

    return acc + 1
  }, count)
}

export function getChildCount(items: TreeItems, id: string) {
  const item = findItemDeep(items, id)

  return item ? countChildren(item.children) : 0
}

export function removeChildrenOf(items: FlattenedItem[], ids: string[]) {
  const excludeParentIds = [...ids]

  return items.filter((item) => {
    if (item.parentId && excludeParentIds.includes(item.parentId)) {
      if (item.children.length) {
        excludeParentIds.push(item.id)
      }
      return false
    }

    return true
  })
}
