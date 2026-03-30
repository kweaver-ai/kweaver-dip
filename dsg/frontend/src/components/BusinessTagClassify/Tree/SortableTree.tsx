import React, {
    useEffect,
    useMemo,
    useRef,
    useState,
    forwardRef,
    useImperativeHandle,
} from 'react'
import { createPortal } from 'react-dom'
import {
    PointerSensor,
    useSensor,
    useSensors,
    DragStartEvent,
    DragOverlay,
    DragMoveEvent,
    DragEndEvent,
    DragOverEvent,
    MeasuringStrategy,
    DropAnimation,
    Modifier,
    defaultDropAnimation,
} from '@dnd-kit/core'
import { arrayMove } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { Button, Input, Spin } from 'antd'
import { useGetState } from 'ahooks'
import classnames from 'classnames'
import {
    buildTree,
    flattenTree,
    getProjection,
    getChildCount,
    removeItem,
    removeChildrenOf,
    setProperty,
    searchChildOf,
    collapsedAll,
    collapseChildOf,
    changeCategoryType,
    findItemDeep,
} from './utilities'
import type { FlattenedItem, SensorContext, TreeItems } from './types'
import { SortableTreeItem } from './SortableTreeItem'
import { formatError } from '@/core'
import { AddOutlined } from '@/icons'
import __ from '../locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty } from '@/ui'

const measuring = {
    droppable: {
        strategy: MeasuringStrategy.Always,
    },
}

const dropAnimationConfig: DropAnimation = {
    keyframes({ transform }) {
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
    sideEffects({ active }) {
        active.node.animate([{ opacity: 0 }, { opacity: 1 }], {
            duration: defaultDropAnimation.duration,
            easing: defaultDropAnimation.easing,
        })
    },
}

const adjustTranslate: Modifier = ({ transform }) => {
    return {
        ...transform,
        y: transform.y - 25,
    }
}

interface ISortableTree {
    category: any
    indentationWidth?: number
    onConfiged: () => void
    isEdit?: boolean
}

export const SortableTree = forwardRef((props: ISortableTree, ref) => {
    const { category = {}, indentationWidth = 24, onConfiged, isEdit } = props

    const [loading, setLoading] = useState<boolean>(false)
    const [items, setItems] = useState<TreeItems>(() =>
        changeCategoryType(category?.label_tree_resp || []),
    )
    const [activeId, setActiveId] = useState<string | null>(null)
    const [overId, setOverId] = useState<string | null>(null)
    const [offsetLeft, setOffsetLeft] = useState(0)
    const [currentPosition, setCurrentPosition] = useState<{
        parentId: string | null
        overId: string
    } | null>(null)
    const [editId, setEditId] = useState<string | undefined>()
    const [searchValue, setSearchValue] = useState<string>()
    const [searchItems, setSearchItems] = useState<TreeItems>([])
    const [timer, setTimer, getTimer] = useGetState<any>()
    const [searchEmpty, setSearchEmpty] = useState<boolean>(false)

    useImperativeHandle(ref, () => ({
        items,
    }))

    useEffect(() => {
        if (category?.label_tree_resp?.length) {
            setItems(changeCategoryType(category?.label_tree_resp || []))
        }
    }, [category])

    const flattenedItems = useMemo(() => {
        const flattenedTree = flattenTree(searchValue ? searchItems : items)
        const collapsedItems = flattenedTree.reduce<string[]>(
            (acc, { children, collapsed, id }) =>
                collapsed && children.length ? [...acc, id] : acc,
            [],
        )

        return removeChildrenOf(
            flattenedTree,
            activeId ? [activeId, ...collapsedItems] : collapsedItems,
        )
    }, [activeId, items, searchItems])
    const projected =
        activeId && overId
            ? getProjection(
                  flattenedItems,
                  activeId,
                  overId,
                  offsetLeft,
                  indentationWidth,
              )
            : null
    const sensorContext: SensorContext = useRef({
        items: flattenedItems,
        offset: offsetLeft,
    })

    const sensors = useSensors(useSensor(PointerSensor))

    const sortedIds = useMemo(
        () => flattenedItems.map(({ id }) => id),
        [flattenedItems],
    )
    const activeItem = activeId
        ? flattenedItems.find(({ id }) => id === activeId)
        : null

    useMemo(() => {
        if (searchValue) {
            const clonedItems: TreeItems = JSON.parse(
                JSON.stringify(collapsedAll(items, true)),
            )
            const result = searchChildOf(clonedItems, searchValue)
            setSearchEmpty(!result)
            setSearchItems(clonedItems)
        } else {
            setSearchEmpty(false)
            setSearchItems([])
        }
    }, [searchValue])
    useMemo(() => {
        if (searchValue) {
            const clonedItems: TreeItems = JSON.parse(
                JSON.stringify(collapsedAll(items, true)),
            )
            const flattenedTree = flattenTree(searchItems)
            collapseChildOf(clonedItems, flattenedTree)
            setSearchItems(clonedItems)
        }
    }, [items])

    useEffect(() => {
        sensorContext.current = {
            items: flattenedItems,
            offset: offsetLeft,
        }
    }, [flattenedItems, offsetLeft])

    const handleStartEdit = (id: string) => {
        setEditId(id)
    }

    const handleCancelEdit = () => {
        setEditId(undefined)
    }

    const handleSureEdit = async (item: FlattenedItem, name: string) => {
        try {
            let id = `${new Date().getTime()}`
            const pid = item.parentId || `0`
            if (item.id === 'newItemId') {
                setItems((info) => {
                    setProperty(info, item.id, 'pid', () => {
                        return pid
                    })
                    setProperty(info, item.id, 'collapsed', () => {
                        return undefined
                    })
                    return setProperty(info, item.id, 'name', () => {
                        return name
                    })
                })
            } else {
                id = item.id
            }
            setItems((info) => {
                setProperty(info, item.id, 'id', () => {
                    return id
                })
                setProperty(info, item.id, 'pid', () => {
                    return pid
                })
                setProperty(info, item.id, 'collapsed', () => {
                    return undefined
                })
                setProperty(info, item.id, 'type', () => {
                    // 13位id为前端时间戳id，type不修改
                    return isEdit && item.id.length !== 13 ? 2 : item.type
                })
                return setProperty(info, item.id, 'name', () => {
                    return name
                })
            })
            setEditId(undefined)
            onConfiged()
        } catch (err) {
            formatError(err)
        }
    }

    const handleAddParent = () => {
        setItems([
            { id: 'newItemId', children: [], collapsed: false },
            ...items,
        ])
        setEditId('newItemId')
    }

    const handleAddChild = (id: string) => {
        setItems((info) => {
            setProperty(info, id, 'collapsed', (value) => {
                return false
            })
            return setProperty(info, id, 'children', (value) => {
                return [
                    { id: 'newItemId', children: [], collapsed: false },
                    ...value,
                ]
            })
        })
        setEditId('newItemId')
    }

    const handleRemove = async (id: string) => {
        if (id === 'newItemId') {
            setItems((info) => removeItem(info, id))
            return
        }
        setItems((info) => removeItem(info, id))
        onConfiged()
    }

    const changeOrder = async (id: string, parentId, newItems: TreeItems) => {
        try {
            setLoading(true)
            const parentItem = findItemDeep(newItems, parentId)
            const list = parentItem ? parentItem.children : newItems
            const itemIndex = list.findIndex((c) => c.id === id)
            let next_id = ''
            if (itemIndex < list.length - 1) {
                next_id = list[itemIndex + 1].id
            }
            // await putCategoryTreesNode(category.id, {
            //     id,
            //     dest_parent_id: parentId || category.id,
            //     next_id,
            // })
            onConfiged()
            setItems(newItems)
        } catch (err) {
            formatError(err)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className={styles.configTree}>
            <div
                className={classnames(
                    styles['configTree-top'],
                    editId && styles['not-edit'],
                )}
            >
                <Button
                    type="primary"
                    onClick={() => handleAddParent()}
                    icon={<AddOutlined />}
                >
                    {__('新建顶级标签')}
                </Button>
                <Input
                    placeholder={__('搜索标签名称')}
                    onChange={(e) => {
                        const kw = e.target.value?.trim()
                        setSearchValue(kw)
                    }}
                    allowClear
                    style={{ width: 230 }}
                    maxLength={32}
                />
            </div>
            {/* <div className={styles['configTree-tips']}>
                {__('拖动标签可调整顺序')}
            </div> */}
            {flattenedItems.length === 0 ? (
                <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
            ) : searchValue && searchEmpty ? (
                <Empty />
            ) : (
                <div className={styles['configTree-content']}>
                    {/* <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        measuring={measuring}
                        onDragStart={handleDragStart}
                        onDragMove={handleDragMove}
                        onDragOver={handleDragOver}
                        onDragEnd={handleDragEnd}
                        onDragCancel={handleDragCancel}
                    > */}
                    {/* <SortableContext
                        items={sortedIds}
                        strategy={verticalListSortingStrategy}
                    > */}
                    {flattenedItems.map((item) => {
                        const { id, children, collapsed, depth, ...args } = item
                        const dp =
                            id === activeId && projected
                                ? projected.depth
                                : depth
                        return (
                            <SortableTreeItem
                                key={id}
                                id={id}
                                data={{
                                    id,
                                    ...args,
                                    categoryId: category.id,
                                }}
                                depth={dp}
                                indentationWidth={indentationWidth}
                                collapsed={Boolean(
                                    collapsed && children.length,
                                )}
                                notDeleted={
                                    items.length === 1 &&
                                    dp === 0 &&
                                    category.using
                                }
                                keyword={searchValue}
                                editId={editId}
                                onCollapse={
                                    children.length
                                        ? () => handleCollapse(id)
                                        : undefined
                                }
                                onStartEdit={() => handleStartEdit(id)}
                                onCancelEdit={() => handleCancelEdit()}
                                onSureEdit={(name) =>
                                    handleSureEdit(item, name)
                                }
                                onAddChild={() => handleAddChild(id)}
                                onRemove={() => handleRemove(id)}
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
                                    depth={activeItem.depth}
                                    clone
                                    childCount={
                                        getChildCount(items, activeId) + 1
                                    }
                                    data={{
                                        id: activeId,
                                        name: activeItem.name,
                                    }}
                                    indentationWidth={indentationWidth}
                                />
                            ) : null}
                        </DragOverlay>,
                        document.body,
                    )}
                    {/* </SortableContext> */}
                    {/* </DndContext> */}
                </div>
            )}
            {editId && <div className={styles['configTree-mask']} />}
            {loading && (
                <div className={styles['configTree-load']}>
                    <Spin />
                </div>
            )}
        </div>
    )

    function handleDragStart({ active: { id: actId } }: DragStartEvent) {
        setActiveId(actId as string)
        setOverId(actId as string)

        const actItem = flattenedItems.find(({ id }) => id === actId)

        if (actItem) {
            setCurrentPosition({
                parentId: actItem.parentId,
                overId: actId as string,
            })
        }
    }

    function handleDragMove({ delta }: DragMoveEvent) {
        setOffsetLeft(delta.x)
    }

    function handleDragOver({ over }: DragOverEvent) {
        if (over?.id) {
            const { parentId } = getProjection(
                flattenedItems,
                activeId!,
                `${over.id}`,
                offsetLeft,
                indentationWidth,
            )
            if (getTimer()?.interval) {
                clearTimeout(timer.interval)
            }
            const interval = setTimeout(() => {
                if (searchValue) {
                    setSearchItems((info) =>
                        setProperty(
                            info,
                            getTimer().id,
                            'collapsed',
                            (value) => {
                                return false
                            },
                        ),
                    )
                } else {
                    setItems((info) =>
                        setProperty(
                            info,
                            getTimer().id,
                            'collapsed',
                            (value) => {
                                return false
                            },
                        ),
                    )
                }
            }, 600)
            setTimer({ id: parentId, interval })
        }
        setOverId((over?.id as string) ?? null)
    }

    function handleDragEnd({ active, over }: DragEndEvent) {
        resetState()

        if (projected && over) {
            const { depth, parentId } = projected
            const clonedItems: FlattenedItem[] = JSON.parse(
                JSON.stringify(flattenTree(items)),
            )
            const overIndex = clonedItems.findIndex(({ id }) => id === over.id)
            const activeIndex = clonedItems.findIndex(
                ({ id }) => id === active.id,
            )
            const activeTreeItem = clonedItems[activeIndex]

            clonedItems[activeIndex] = {
                ...activeTreeItem,
                depth,
                parentId,
            }

            const sortedItems = arrayMove(clonedItems, activeIndex, overIndex)
            const newItems = buildTree(sortedItems)

            if (
                !(
                    overIndex === activeIndex &&
                    parentId === activeItem?.parentId
                )
            ) {
                changeOrder(active.id.toString(), parentId, newItems)
            }
            // setItems(newItems)
        }
    }

    function handleDragCancel() {
        resetState()
    }

    function resetState() {
        setOverId(null)
        setActiveId(null)
        setOffsetLeft(0)
        setCurrentPosition(null)

        document.body.style.setProperty('cursor', '')
    }

    function handleCollapse(id: string) {
        if (searchValue) {
            setSearchItems((info) =>
                setProperty(info, id, 'collapsed', (value) => {
                    return !value
                }),
            )
        } else {
            setItems((info) =>
                setProperty(info, id, 'collapsed', (value) => {
                    return !value
                }),
            )
        }
    }
})
