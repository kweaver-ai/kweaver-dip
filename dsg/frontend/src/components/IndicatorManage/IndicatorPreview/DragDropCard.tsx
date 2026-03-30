import { CSSProperties, FC, ReactNode, useEffect, useMemo, useRef } from 'react'
import {
    XYCoord,
    useDrag,
    useDrop,
    DropTargetMonitor,
    useDragLayer,
} from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DragBoxType } from '../const'
import styles from './styles.module.less'

import { getFieldTypeIcon, getItemStyles, layerStyles } from '../helper'

interface IDragDropCard {
    children: ReactNode
    index: number
    moveCard: (dragIndex: number, hoverIndex: number) => void
    id: string
    onEnd: () => void
    onDropData: (data) => void
    itemData: any
    onStartDrag: () => void
    snapToGrid?: any
    previewNode?: ReactNode
}

const DragDropCard: FC<IDragDropCard> = ({
    children,
    index,
    moveCard,
    id,
    onEnd,
    onDropData,
    itemData,
    onStartDrag,
    previewNode,
    snapToGrid,
}) => {
    const ref = useRef<HTMLDivElement>()

    const [{ isDragging }, drag, dragPreview] = useDrag({
        type: 'card',
        item: () => {
            onStartDrag()
            return {
                ...itemData,
            }
        },
        collect: (monitor) => {
            return {
                isDragging: monitor.isDragging(),
            }
        },
        canDrag: () => {
            return true
        },
        end: (item, monitor) => {
            // 更新 cardList 数据源
            onEnd()
        },
    })

    const [, drop] = useDrop({
        accept: 'card',
        hover(item: any, monitor: DropTargetMonitor) {
            if (!ref.current) {
                return
            }
            const dragIndex = item.index
            const hoverIndex = index

            // 拖拽元素下标与鼠标悬浮元素下标一致时，不进行操作
            if (dragIndex === hoverIndex) {
                return
            }

            // 确定屏幕上矩形范围
            const hoverBoundingRect = ref.current!.getBoundingClientRect()

            // 获取中点垂直坐标
            const hoverMiddleY =
                (hoverBoundingRect.bottom - hoverBoundingRect.top) / 2

            // 确定鼠标位置
            const clientOffset = monitor.getClientOffset()

            // 获取距顶部距离
            const hoverClientY =
                (clientOffset as XYCoord).y - hoverBoundingRect.top

            /**
             * 只在鼠标越过一半物品高度时执行移动。
             *
             * 当向下拖动时，仅当光标低于50%时才移动。
             * 当向上拖动时，仅当光标在50%以上时才移动。
             *
             * 可以防止鼠标位于元素一半高度时元素抖动的状况
             */

            // 向下拖动
            if (dragIndex < hoverIndex && hoverClientY < hoverMiddleY) {
                return
            }

            // 向上拖动
            if (dragIndex > hoverIndex && hoverClientY > hoverMiddleY) {
                return
            }

            // 执行 move 回调函数
            moveCard(dragIndex, hoverIndex)

            /**
             * 如果拖拽的组件为 Box，则 dragIndex 为 undefined，此时不对 item 的 index 进行修改
             * 如果拖拽的组件为 Card，则将 hoverIndex 赋值给 item 的 index 属性
             */
            if (item.index !== undefined) {
                // item.index = hoverIndex
            }
        },
        drop: (item, monitor) => {
            onDropData(item)
        },
    })

    const { itemType, item, initialOffset, currentOffset } = useDragLayer(
        (monitor) => ({
            item: monitor.getItem(),
            itemType: monitor.getItemType(),
            initialOffset: monitor.getInitialSourceClientOffset(),
            currentOffset: monitor.getSourceClientOffset(),
            isDragging: monitor.isDragging(),
        }),
    )

    useEffect(() => {
        dragPreview(getEmptyImage(), { captureDraggingState: true })
    }, [])

    const style: CSSProperties = useMemo(
        () => ({
            // Card 为占位元素是，透明度 0.4，拖拽状态时透明度 0.2，正常情况透明度为 1
            opacity: id === '' ? 0.4 : isDragging ? 1 : 1,
            width: '100%',
        }),
        [id, isDragging],
    )

    return (
        <>
            <div ref={drag(drop(ref)) as any} style={style} key={id}>
                {children}
            </div>
            {isDragging && item && (
                <div style={layerStyles}>
                    <div
                        style={getItemStyles(
                            initialOffset,
                            currentOffset,
                            snapToGrid,
                        )}
                    >
                        <div className={styles.itemDragging}>
                            <div className={styles.dataTypeIcon}>
                                {getFieldTypeIcon(
                                    item?.original_data_type || item.data_type,
                                )}
                            </div>
                            <div
                                className={styles.name}
                                title={item.business_name}
                            >
                                {item.business_name}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    )
}

export default DragDropCard
