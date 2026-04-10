import {
  closestCenter,
  DndContext,
  type DragEndEvent,
  type DragMoveEvent,
  type DragOverEvent,
  DragOverlay,
  type DragStartEvent,
  type DropAnimation,
  defaultDropAnimation,
  MeasuringStrategy,
  type Modifier,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import { arrayMove, SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import type { MenuProps } from 'antd'
import { Layout, Menu, Modal, message } from 'antd'
import clsx from 'clsx'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { deleteNode, moveNode, type Node, type NodeType } from '@/apis'
import DictionaryIcon from '@/assets/images/project/dictionary.svg?react'
import ActionModal from '@/components/ProjectActionModal/ActionModal'
import { hasAnyDevMode, isNodeInDevMode } from '@/pages/ProjectManagement/devMode'
import { objectTypeNameMap } from '@/pages/ProjectManagement/utils'
import { useProjectStore } from '@/stores'
import styles from './index.module.less'
import { SortableTreeItem } from './SortableTreeItem'
import {
  buildTree,
  type FlattenedItem,
  findItemDeep,
  flattenTree,
  getChildCount,
  getProjection,
  removeChildrenOf,
  setProperty,
  type TreeItems,
} from './utils'

const { Sider: AntdSider } = Layout
interface ProjectSiderProps {
  /** 是否折叠 */
  collapsed: boolean
  /** 折叠状态改变回调 */
  onCollapse: (collapsed: boolean) => void
  /** 项目 ID */
  projectId: string
  /** 查看项目词典回调 */
  onViewDictionary?: () => void
}

const measuring = {
  droppable: {
    strategy: MeasuringStrategy.Always,
  },
}

const dropAnimationConfig: DropAnimation = {
  keyframes({ transform }: { transform: { initial: any; final: any } }) {
    return [
      {
        opacity: 1,
        transform: CSS.Transform.toString(transform.initial),
      },
      {
        opacity: 0,
        transform: CSS.Transform.toString({
          ...transform.final,
          x: transform.final.x + 5,
          y: transform.final.y + 5,
        }),
      },
    ]
  },
  easing: 'ease-out',
  sideEffects({ active }: { active: any }) {
    active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: defaultDropAnimation.duration,
      easing: defaultDropAnimation.easing,
    })
  },
}

const adjustTranslate: Modifier = ({ transform }: { transform: any }) => {
  return {
    ...transform,
    y: transform.y - 25,
  }
}

const indentationWidth = 24

/**
 * 项目侧边栏（ProjectSider）
 * 用于项目详情页面的侧边栏
 */
const ProjectSider = ({
  collapsed,
  onCollapse: _onCollapse,
  projectId,
  onViewDictionary,
}: ProjectSiderProps) => {
  const {
    selectedNode,
    setSelectedNode,
    treeData,
    setTreeData,
    getNodeInfo,
    updateNodeInfo,
    addNode,
    removeNode: removeNodeFromStore,
  } = useProjectStore()
  const [selectedKey, setSelectedKey] = useState<string>('')
  const [activeId, setActiveId] = useState<string | null>(null)
  const activeIdRef = useRef<string | null>(null)
  const treeDataRef = useRef<TreeItems>(treeData)
  const [overId, setOverId] = useState<string | null>(null)
  const overIdRef = useRef<string | null>(null)
  const [offsetLeft, setOffsetLeft] = useState(0)
  const offsetLeftRef = useRef<number>(0)
  const [timer, setTimer] = useState<{ id: string | null; interval?: NodeJS.Timeout } | null>(null)

  // 同步 treeData、overId、offsetLeft 到 ref
  useEffect(() => {
    treeDataRef.current = treeData
  }, [treeData])

  useEffect(() => {
    overIdRef.current = overId
  }, [overId])

  useEffect(() => {
    offsetLeftRef.current = offsetLeft
  }, [offsetLeft])

  // ActionModal 相关状态
  const [actionModalVisible, setActionModalVisible] = useState(false)
  const [actionModalType, setActionModalType] = useState<'add' | 'edit'>('add')
  const [actionObjectType, setActionObjectType] = useState<NodeType>('application')
  const [actionObjectInfo, setActionObjectInfo] = useState<{
    id: string
    name: string
    description: string
  } | null>(null)
  const [actionParentId, setActionParentId] = useState<string | null>(null)
  const [modal, contextHolder] = Modal.useModal()
  const [messageApi, messageContextHolder] = message.useMessage()

  // 从 store 同步选中状态
  useEffect(() => {
    if (selectedNode && selectedNode.projectId === projectId) {
      setSelectedKey(selectedNode.nodeId)
    } else {
      setSelectedKey('')
    }
  }, [selectedNode, projectId])

  // 监听开发模式变化事件，触发重新渲染
  useEffect(() => {
    const handleDevModeChange = () => {
      // 触发组件重新渲染以更新开发模式状态
      // 通过强制更新树数据来触发重新渲染
      setTreeData([...treeData])
    }

    window.addEventListener('devModeChanged', handleDevModeChange as EventListener)
    return () => {
      window.removeEventListener('devModeChanged', handleDevModeChange as EventListener)
    }
  }, [treeData, setTreeData])

  const flattenedItems = useMemo(() => {
    const flattenedTree = flattenTree(treeData)
    const collapsedItems: string[] = []
    for (const item of flattenedTree) {
      if (item.collapsed && item.children.length) {
        collapsedItems.push(item.id)
      }
    }

    return removeChildrenOf(
      flattenedTree,
      activeId ? [activeId, ...collapsedItems] : collapsedItems,
    )
  }, [activeId, treeData])

  const projected =
    activeId && overId
      ? getProjection(flattenedItems, activeId, overId, offsetLeft, indentationWidth)
      : null

  const sensors = useSensors(useSensor(PointerSensor))

  const sortedIds = useMemo(() => flattenedItems.map(({ id }) => id), [flattenedItems])
  const activeItem = activeId ? flattenedItems.find(({ id }) => id === activeId) : null

  /** 验证拖拽是否符合层级规则 */
  const validateDrag = useCallback(
    (dragNode: FlattenedItem, targetParentId: string | null): boolean => {
      // 如果拖拽到根节点（null），只允许 application 类型
      if (!targetParentId) {
        return dragNode.type === 'application'
      }

      // 找到目标父节点
      const targetParent = targetParentId
        ? flattenedItems.find((item) => item.id === targetParentId)
        : null

      if (!targetParent) {
        return dragNode.type === 'application'
      }

      // 层级规则：
      // application 只能在根节点下（targetParentId 为 null）
      // page 只能在 application 下
      // function 只能在 page 下
      if (dragNode.type === 'application') {
        return false // application 不能作为子节点
      }
      if (dragNode.type === 'page') {
        return targetParent.type === 'application'
      }
      if (dragNode.type === 'function') {
        return targetParent.type === 'page'
      }

      return false
    },
    [flattenedItems],
  )

  /** 处理新建子级 */
  const handleAddChild = useCallback((parentId: string, parentType: NodeType) => {
    const newItemType: NodeType = parentType === 'application' ? 'page' : 'function'
    setActionParentId(parentId)
    setActionModalType('add')
    setActionObjectType(newItemType)
    setActionObjectInfo(null)
    setActionModalVisible(true)
  }, [])

  /** 处理节点选择 */
  const handleSelect = useCallback(
    (
      item:
        | FlattenedItem
        | {
            id: string
            name: string
            type: NodeType
            parentId: string
            depth: number
            collapsed: boolean
            children: never[]
          },
    ) => {
      setSelectedKey(item.id)
      setSelectedNode(item.id)
    },
    [setSelectedNode],
  )

  /** 处理编辑节点 */
  const handleEdit = useCallback(
    (item: FlattenedItem) => {
      // 检查节点是否处于开发模式（包括继承）
      if (isNodeInDevMode(projectId, item.id, flattenedItems)) {
        messageApi.warning('开发模式下的节点无法编辑')
        return
      }

      // 从节点映射中获取完整的节点信息
      const nodeInfo = getNodeInfo(item.id)
      setActionParentId(null)
      setActionModalType('edit')
      setActionObjectType(item.type)
      setActionObjectInfo({
        id: item.id,
        name: item.name,
        description: nodeInfo?.description || '',
      })
      setActionModalVisible(true)
    },
    [projectId, flattenedItems, getNodeInfo],
  )

  /** 处理删除节点 */
  const handleDelete = useCallback(
    (item: FlattenedItem) => {
      // 如果有任何节点处于开发模式，禁用删除
      if (hasAnyDevMode(projectId)) {
        messageApi.warning('开发模式下无法删除节点')
        return
      }

      modal.confirm({
        title: '确认删除',
        content: `确定要删除${objectTypeNameMap(item.type)} "${item.name}" 吗？删除后无法恢复。`,
        okText: '确定',
        cancelText: '取消',
        okType: 'primary',
        okButtonProps: { danger: true },
        footer: (_, { OkBtn, CancelBtn }) => (
          <>
            <OkBtn />
            <CancelBtn />
          </>
        ),
        onOk: async () => {
          try {
            await deleteNode(item.id)
            messageApi.success('删除成功')

            // 从 store 中移除节点
            removeNodeFromStore(item.id)

            // 如果删除的是当前选中的节点，清除选中状态
            if (selectedNode?.nodeId === item.id) {
              setSelectedNode(null)
              setSelectedKey('')
            }
          } catch (error: any) {
            messageApi.error(error?.description || '删除失败，请稍后重试')
          }
        },
      })
    },
    [projectId, selectedNode, setSelectedNode, removeNodeFromStore, addNode, updateNodeInfo],
  )

  /** 处理节点移动 */
  const changeOrder = async (id: string, parentId: string | null, newItems: TreeItems) => {
    try {
      const parentItem = parentId ? findItemDeep(newItems, parentId) : null
      const list = parentItem ? parentItem.children : newItems
      const itemIndex = list.findIndex((c) => c.id === id)
      const predecessorId = itemIndex > 0 ? list[itemIndex - 1].id : null
      await moveNode({
        node_id: id,
        new_parent_id: parentId,
        predecessor_node_id: predecessorId,
      })
      setTreeData(newItems)
    } catch (error: any) {
      messageApi.error(error?.description || '移动失败，请稍后重试')
    }
  }

  /** 处理 ActionModal 成功回调 */
  const handleActionModalSuccess = useCallback(
    (result: Node) => {
      if (actionModalType === 'add') {
        // 新建节点

        if (actionParentId) {
          addNode(result)

          const parentItem = flattenedItems.find((item) => item.id === actionParentId)
          const newItem: FlattenedItem = {
            id: String(result.id),
            name: result.name,
            type: result.node_type,
            parentId: actionParentId,
            depth: parentItem ? parentItem.depth + 1 : 0,
            collapsed: false,
            children: [],
            index: 0, // 新节点在父节点的第一个位置
          }
          handleSelect(newItem)
        }
      } else if (actionModalType === 'edit') {
        // 编辑节点
        updateNodeInfo(String(result.id), result)

        // 如果当前节点是选中状态，同步更新 store（updateNodeInfo 已更新 nodeMap，直接传 id 即可）
        if (selectedNode?.nodeId === String(result.id)) {
          setSelectedNode(String(result.id))
        }
      }
    },
    [
      actionModalType,
      actionParentId,
      selectedNode,
      setSelectedNode,
      handleSelect,
      addNode,
      updateNodeInfo,
    ],
  )

  /** 处理展开/折叠 */
  const handleCollapse = useCallback(
    (id: string) => {
      const updated = setProperty(treeData, id, 'collapsed', (value) => !value)
      setTreeData(updated)
    },
    [treeData, setTreeData],
  )

  const menuItems = useMemo<MenuProps['items']>(() => {
    return [
      {
        type: 'group',
        label: '项目配置',
      },
      {
        key: 'project-dictionary',
        label: '项目词典',
        icon: <DictionaryIcon className="!text-base" />,
        onClick: () => {
          onViewDictionary?.()
        },
      },
      { type: 'divider' },
    ]
  }, [projectId, onViewDictionary])

  /** 处理拖拽开始 */
  const handleDragStart = useCallback(
    ({ active: { id: actId } }: DragStartEvent) => {
      // 如果有任何节点处于开发模式，禁用拖拽
      if (hasAnyDevMode(projectId)) {
        messageApi.warning('开发模式下无法移动节点')
        return
      }
      const activeIdStr = actId as string
      setActiveId(activeIdStr)
      activeIdRef.current = activeIdStr
      setOverId(activeIdStr)
    },
    [projectId],
  )

  /** 检查并展开需要展开的节点 */
  const checkAndExpandNode = useCallback(() => {
    // 检查拖拽是否还在进行中
    if (!(activeIdRef.current && overIdRef.current)) {
      return
    }

    // 重新计算 flattenedItems，使用最新的 treeData
    const currentTreeData = treeDataRef.current
    const flattenedTree = flattenTree(currentTreeData)
    const collapsedItems: string[] = []
    for (const item of flattenedTree) {
      if (item.collapsed && item.children.length) {
        collapsedItems.push(item.id)
      }
    }
    const currentFlattenedItems = removeChildrenOf(
      flattenedTree,
      activeIdRef.current ? [activeIdRef.current, ...collapsedItems] : collapsedItems,
    )

    // 重新计算 parentId，使用最新的 offsetLeft 和 overId
    const { parentId } = getProjection(
      currentFlattenedItems,
      activeIdRef.current,
      overIdRef.current,
      offsetLeftRef.current,
      indentationWidth,
    )

    if (parentId) {
      // 使用最新的 treeData 更新折叠状态
      const updated = setProperty(currentTreeData, parentId, 'collapsed', () => false)
      setTreeData(updated)
    }
  }, [indentationWidth, setTreeData])

  /** 处理拖拽移动 */
  const handleDragMove = useCallback(
    ({ delta }: DragMoveEvent) => {
      setOffsetLeft(delta.x)
      offsetLeftRef.current = delta.x

      // 当 offsetLeft 改变时，深度可能会变化，需要检查是否需要展开节点
      // 只有在有 activeId 和 overId 时才处理
      if (activeIdRef.current && overIdRef.current) {
        // 清除之前的定时器
        if (timer?.interval) {
          clearTimeout(timer.interval)
        }

        // 设置新的定时器，在回调中重新计算 parentId
        const interval = setTimeout(checkAndExpandNode, 600)
        setTimer({ id: null, interval })
      }
    },
    [timer, checkAndExpandNode],
  )

  /** 处理拖拽悬停 */
  const handleDragOver = useCallback(
    ({ over }: DragOverEvent) => {
      if (over?.id && activeId) {
        const overIdStr = over.id as string
        setOverId(overIdStr)
        overIdRef.current = overIdStr

        // 清除之前的定时器
        if (timer?.interval) {
          clearTimeout(timer.interval)
        }

        // 设置新的定时器，在回调中重新计算 parentId，使用最新的 offsetLeft 和 overId
        const interval = setTimeout(checkAndExpandNode, 600)
        setTimer({ id: null, interval })
      } else {
        setOverId(null)
        overIdRef.current = null
      }
    },
    [activeId, timer, checkAndExpandNode],
  )

  /** 处理拖拽结束 */
  const handleDragEnd = useCallback(
    ({ active, over }: DragEndEvent) => {
      resetState()

      // 如果有任何节点处于开发模式，禁用移动
      if (hasAnyDevMode(projectId)) {
        messageApi.warning('开发模式下无法移动节点')
        return
      }

      if (projected && over && activeItem) {
        const { depth, parentId } = projected
        const clonedItems: FlattenedItem[] = JSON.parse(JSON.stringify(flattenTree(treeData)))
        const overIndex = clonedItems.findIndex(({ id }) => id === over.id)
        const activeIndex = clonedItems.findIndex(({ id }) => id === active.id)
        const activeTreeItem = clonedItems[activeIndex]

        if (activeTreeItem) {
          // 验证拖拽规则
          if (!validateDrag(activeTreeItem, parentId)) {
            messageApi.warning('不符合层级规则：页面只能在应用下，功能只能在页面下')
            return
          }

          clonedItems[activeIndex] = { ...activeTreeItem, depth, parentId }

          const sortedItems = arrayMove(clonedItems, activeIndex, overIndex)
          const newItems = buildTree(sortedItems)

          if (!(overIndex === activeIndex && parentId === activeItem.parentId)) {
            changeOrder(active.id.toString(), parentId, newItems)
          }
        }
      }
    },
    [projectId, projected, activeItem, treeData, validateDrag, setTreeData],
  )

  /** 处理拖拽取消 */
  const handleDragCancel = useCallback(() => {
    resetState()
  }, [])

  /** 重置拖拽状态 */
  const resetState = useCallback(() => {
    // 清除定时器，避免拖拽结束后定时器触发导致数据回退
    if (timer?.interval) {
      clearTimeout(timer.interval)
      setTimer(null)
    }
    setOverId(null)
    setActiveId(null)
    activeIdRef.current = null
    setOffsetLeft(0)
    document.body.style.setProperty('cursor', '')
  }, [timer])

  return (
    <AntdSider
      width={240}
      collapsedWidth={60}
      collapsible
      collapsed={collapsed}
      trigger={null}
      className={clsx(styles.projectSider, collapsed && styles.collapsed)}
      style={{
        left: 0,
        height: '100%',
        top: 0,
        bottom: 0,
      }}
    >
      {messageContextHolder}
      {contextHolder}
      <div className="flex flex-col h-full px-0 pt-4 pb-2 overflow-hidden">
        {/* 菜单内容 */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden dip-hideScrollbar">
          {/* 项目配置菜单 */}
          <Menu
            mode="inline"
            selectedKeys={selectedKey.startsWith('project-dictionary') ? [selectedKey] : []}
            items={menuItems}
            inlineCollapsed={collapsed}
            selectable={true}
          />
          {/* 项目结构树 */}
          {!collapsed && (
            <div className="px-0 mt-1">
              {flattenedItems.length > 0 && (
                <div className="relative">
                  <SortableTreeItem
                    key={flattenedItems[0].id}
                    id={flattenedItems[0].id}
                    name={flattenedItems[0].name}
                    type={flattenedItems[0].type}
                    depth={-1}
                    indentationWidth={indentationWidth}
                    collapsed={false}
                    selected={selectedKey === flattenedItems[0].id}
                    canAddChild
                    canEdit={!isNodeInDevMode(projectId, flattenedItems[0].id, flattenedItems)}
                    canDelete={!hasAnyDevMode(projectId)}
                    canDrag={false}
                    onAddChild={() => handleAddChild(flattenedItems[0].id, flattenedItems[0].type)}
                    onEdit={() => handleEdit(flattenedItems[0])}
                    onDelete={() => handleDelete(flattenedItems[0])}
                    onSelect={() => handleSelect(flattenedItems[0])}
                  />
                  <DndContext
                    sensors={sensors}
                    collisionDetection={closestCenter}
                    measuring={measuring}
                    onDragStart={handleDragStart}
                    onDragMove={handleDragMove}
                    onDragOver={handleDragOver}
                    onDragEnd={handleDragEnd}
                    onDragCancel={handleDragCancel}
                  >
                    <SortableContext items={sortedIds} strategy={verticalListSortingStrategy}>
                      {flattenedItems.slice(1).map((item) => {
                        const { id, children, collapsed, depth, type } = item
                        const dp = id === activeId && projected ? projected.depth : depth
                        const isSelected = selectedKey === id
                        const isInDevMode = isNodeInDevMode(projectId, id, flattenedItems)
                        const canEdit = !isInDevMode
                        const canDelete = !hasAnyDevMode(projectId)
                        const canDrag = !hasAnyDevMode(projectId) && type !== 'application'

                        return (
                          <SortableTreeItem
                            key={id}
                            id={id}
                            name={item.name}
                            type={item.type}
                            depth={dp}
                            indentationWidth={indentationWidth}
                            collapsed={Boolean(collapsed && children.length)}
                            selected={isSelected}
                            canAddChild={item.type !== 'function'}
                            canEdit={canEdit}
                            canDelete={canDelete}
                            canDrag={canDrag}
                            onCollapse={children.length ? () => handleCollapse(id) : undefined}
                            onAddChild={() => handleAddChild(id, item.type)}
                            onEdit={() => handleEdit(item)}
                            onDelete={() => handleDelete(item)}
                            onSelect={() => handleSelect(item)}
                          />
                        )
                      })}
                      {createPortal(
                        <DragOverlay
                          dropAnimation={dropAnimationConfig}
                          modifiers={[adjustTranslate]}
                          zIndex={1001}
                        >
                          {activeId && activeItem ? (
                            <SortableTreeItem
                              id={activeId}
                              name={activeItem.name}
                              type={activeItem.type}
                              depth={activeItem.depth}
                              clone
                              childCount={getChildCount(treeData, activeId) + 1}
                              indentationWidth={indentationWidth}
                            />
                          ) : null}
                        </DragOverlay>,
                        document.body,
                      )}
                    </SortableContext>
                  </DndContext>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 分割线 */}
        {/* <div className="h-px bg-[--dip-border-color] my-2 shrink-0" /> */}

        {/* 底部收缩按钮 */}
        {/* <div
        className={clsx(
          'flex items-center',
          collapsed ? 'justify-center' : 'justify-between pl-2 pr-2',
        )}
      >
        <Tooltip title={collapsed ? '展开' : '收起'} placement="right">
          <button
            type="button"
            className="text-sm cursor-pointer flex items-center justify-center w-8 h-8 rounded-md text-[--dip-text-color] hover:text-[--dip-primary-color]"
            onClick={() => onCollapse(!collapsed)}
          >
            {collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
          </button>
        </Tooltip>
      </div> */}

        {/* ActionModal */}
        <ActionModal
          open={actionModalVisible}
          onCancel={() => {
            setActionModalVisible(false)
            setActionObjectInfo(null)
            setActionParentId(null)
          }}
          onSuccess={handleActionModalSuccess}
          operationType={actionModalType}
          objectType={actionObjectType}
          objectInfo={actionObjectInfo || undefined}
          parentId={actionParentId || undefined}
          projectId={projectId || undefined}
        />
      </div>
    </AntdSider>
  )
}

export default ProjectSider
