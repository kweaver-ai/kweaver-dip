/* eslint-disable no-param-reassign */
/* eslint-disable no-lonely-if */
/* eslint-disable @typescript-eslint/no-shadow */
/* eslint-disable react/prop-types */
import React, { useRef } from 'react'
import { useDrag, useDrop } from 'react-dnd'
import { dataType, ItemTypes, optionsTyps } from './const'

const DraggableBodyRow = (props) => {
    const {
        record,
        data,
        index,
        className,
        style,
        moveRow,
        findRow,
        ...restProps
    } = props
    if (!record) return null

    const {
        row: originalRow,
        rowIndex: originalIndex,
        rowParentIndex: originalParentIndex,
    } = findRow(record.id)

    const itemObj = {
        id: record.id,
        parentId: record.parentId || record.parent_id,
        index,
        isGroup: record.type === dataType.group,
        originalRow, // 拖拽原始数据
        originalIndex, // 拖拽原始数据索引
        originalParentIndex, // 拖拽原始数据父节点索引
    }

    const isDrag = true

    const ref = useRef()

    const [{ handlerId, isOver, dropClassName }, drop] = useDrop({
        accept: ItemTypes,
        collect: (monitor: any) => {
            const {
                id: dragId,
                parentId: dragParentId,
                index: dragPreIndex,
                isGroup,
            } = monitor.getItem() || {}

            if (dragId === record.id) {
                return {}
            }

            // 是否可以拖拽替换
            let isOver = monitor.isOver()
            if (isGroup) {
                // 要覆盖的数据是分组，或者是最外层的子项可以替换，其他情况不可以
                const recordIsGroup = record.type === dataType.group
                if (!recordIsGroup) {
                    isOver = false
                }
            } else {
                // 要覆盖的数据是子项，但不在同分组不可以替换
                if (dragParentId !== record.parentId || record.parent_id) {
                    isOver = false
                }
            }
            return {
                isOver,
                dropClassName: 'drop-over-downward',
                handlerId: monitor.getHandlerId(),
            }
        },
        hover: (item: any, monitor) => {
            if (!ref.current) {
                return
            }
            const dragIndex = item.index
            const dropIndex = index
            if (dragIndex === dropIndex) {
                return
            }
            const opt = {
                dragId: item.id, // 拖拽id
                dropId: record.id, // 要放置位置行的id
                dropParentId: record.parentId || record.parent_id,
                operateType: optionsTyps.hover, // hover操作
            }

            moveRow(opt)
            item.index = dropIndex
        },
        drop: (item) => {
            const opt = {
                dragId: item.id, // 拖拽id
                dropId: record.id, // 要放置位置行的id
                dropParentId: record.parentId || record.parent_id,
                operateType: optionsTyps.drop,
            }
            moveRow(opt)
        },
    })

    const [{ isDragging }, drag] = useDrag({
        type: ItemTypes,
        item: itemObj,
        collect: (monitor) => ({
            isDragging: monitor.isDragging(),
        }),
        // canDrag: (props, monitor) => isDrag //parentId不为0的才可以拖拽
        end: (item, monitor) => {
            const { id: droppedId, originalRow } = item
            const didDrop = monitor.didDrop()
            // 超出可拖拽区域，需要将拖拽行还原
            if (!didDrop) {
                const opt = {
                    dragId: droppedId, // 拖拽id
                    dropId: originalRow.id, // 要放置位置行的id
                    dropParentId: originalRow.parentId,
                    originalIndex,
                    originalParentIndex,
                    operateType: optionsTyps.didDrop,
                }
                moveRow(opt)
            }
        },
    })

    drop(drag(ref))

    // 拖拽行的位置显示透明
    const opacity = isDragging ? 0 : 1

    return (
        <tr
            ref={ref}
            className={`${className}${
                isOver ? dropClassName : ''
            }             ${isDrag ? 'can-drag' : ''}`}
            style={
                isDrag ? { cursor: 'move', opacity, ...style } : { ...style }
            }
            data-handler-id={handlerId}
            {...restProps}
        />
    )
}
export default DraggableBodyRow
