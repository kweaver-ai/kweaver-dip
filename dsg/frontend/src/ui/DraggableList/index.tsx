import React, { useEffect, useRef, useState } from 'react'
import { DndProvider, useDrag, useDrop } from 'react-dnd'
import { arrayMoveImmutable } from 'array-move'
import { HTML5Backend } from 'react-dnd-html5-backend'
import styles from './styles.module.less'

const type = 'DraggableItem'
interface DraggableTabPaneProps extends React.HTMLAttributes<HTMLDivElement> {
    index: React.Key
    moveNode: (dragIndex: React.Key, hoverIndex: React.Key) => void
    forbidDrag: boolean
}

const DraggableItem = ({
    index,
    children,
    moveNode,
    forbidDrag = false,
}: DraggableTabPaneProps) => {
    const ref = useRef<HTMLDivElement>(null)

    const [{ isOver, dropClassName }, drop] = useDrop({
        accept: type,
        collect: (monitor) => {
            const { index: dragIndex } = monitor.getItem() || {}
            if (dragIndex === index) {
                return {}
            }
            return {
                isOver: monitor.isOver(),
                dropClassName:
                    dragIndex < index
                        ? ' drop-over-downward'
                        : ' drop-over-upward',
            }
        },
        drop: (item: { index: React.Key }) => {
            moveNode(item.index, index)
        },
        canDrop: (item, monitor) => !forbidDrag,
    })
    const [, drag] = useDrag({
        type,
        item: { index },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        canDrag: !forbidDrag,
    })
    drop(drag(ref))

    return (
        <div ref={ref} className={isOver ? dropClassName : ''}>
            {children}
        </div>
    )
}

interface IDraggableItem {
    // 需要拖拽分割线，key需要为number类型
    key: string | number
    label: React.ReactNode
}

interface IDraggableList extends React.HTMLAttributes<HTMLDivElement> {
    items: IDraggableItem[]
    onDragEnd?: (sortedArr) => void
    fixedKey?: Array<string | number>
}

/**
 * 排序列表
 */
const DraggableList: React.FC<IDraggableList> = ({
    items,
    onDragEnd,
    fixedKey = [],
    ...props
}) => {
    const [list, setList] = useState(items)

    useEffect(() => {
        setList(items)
    }, [items])

    const moveNode = (dragKey: React.Key, hoverKey: React.Key) => {
        const oldIndex = list.findIndex((info) => info?.key === dragKey)
        const newIndex = list.findIndex((info) => info?.key === hoverKey)
        const sortedLists = arrayMoveImmutable(list, oldIndex, newIndex)
        setList(sortedLists)
        onDragEnd?.(sortedLists)
    }

    return (
        <DndProvider backend={HTML5Backend}>
            <div className={styles.draggableListWrap} {...props}>
                {list.map((item) => (
                    <DraggableItem
                        index={item.key}
                        moveNode={moveNode}
                        forbidDrag={fixedKey.includes(item.key)}
                    >
                        {item.label}
                    </DraggableItem>
                ))}
            </div>
        </DndProvider>
    )
}

export default DraggableList
