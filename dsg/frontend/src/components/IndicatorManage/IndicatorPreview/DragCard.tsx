import { CSSProperties, FC, ReactNode, useEffect } from 'react'
import { XYCoord, useDrag, useDragLayer } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { getItemStyles, layerStyles } from '../helper'

interface IDragCard {
    children: ReactNode
    updateDragAndDrop: () => void
    onStartDrag: () => void
    dropCardList: any[]
    data
    onEndDrag: () => void
    previewNode?: ReactNode
    snapToGrid?: any
}

const DragCard: FC<IDragCard> = ({
    children,
    updateDragAndDrop,
    onStartDrag,
    dropCardList,
    data,
    onEndDrag,
    previewNode,
    snapToGrid,
}) => {
    const [{ isDragging }, drag, dragPreview] = useDrag({
        type: 'card',
        item: () => {
            onStartDrag()

            return data
        },
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),

        end: (current, monitor) => {
            // const uselessIndex = dropCardList.findIndex(
            //     (item: any) => item.id === -1,
            // )
            onEndDrag()

            /**
             * 拖拽结束时，判断是否将拖拽元素放入了目标接收组件中
             *  1、如果是，则使用真正传入的 box 元素代替占位元素
             *  2、如果否，则将占位元素删除
             */

            // if (monitor.didDrop()) {
            //     dropCardList.splice(uselessIndex, 1, {
            //         ...monitor.getItem(),
            //         id: id++,
            //     })
            // } else {
            //     dropCardList.splice(uselessIndex, 1)
            // }
            // 更新 cardList 数据源
            updateDragAndDrop()
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
    return (
        <>
            <div ref={drag}>{children}</div>
            {previewNode && isDragging && (
                <div style={layerStyles}>
                    <div
                        style={getItemStyles(
                            initialOffset,
                            currentOffset,
                            snapToGrid,
                        )}
                    >
                        {previewNode}
                    </div>
                </div>
            )}
        </>
    )
}

export default DragCard
