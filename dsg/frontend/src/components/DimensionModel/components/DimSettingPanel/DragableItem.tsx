import { memo, useEffect } from 'react'
import { useDrag } from 'react-dnd'
import { getEmptyImage } from 'react-dnd-html5-backend'
import { DragDropType } from '.'
import FieldItemContent, { IFieldItemContent } from './FieldItemContent'

/**
 * 字段行拖拽项
 */
const DragableItem = ({
    item,
    checked,
    connected,
    handleCheck,
}: IFieldItemContent) => {
    const [{ isDragging }, drag, preview] = useDrag({
        type: DragDropType,
        item: { item, isChecked: checked },
        canDrag: () => {
            return !connected
        },
        collect: (monitor) => ({
            isDragging: !!monitor.isDragging(),
        }),
    })

    useEffect(() => {
        preview(getEmptyImage(), {
            captureDraggingState: true,
        })
    }, [])

    return (
        <div ref={drag}>
            <FieldItemContent
                item={item}
                checked={checked}
                connected={connected}
                handleCheck={handleCheck}
            />
        </div>
    )
}

export default memo(DragableItem)
