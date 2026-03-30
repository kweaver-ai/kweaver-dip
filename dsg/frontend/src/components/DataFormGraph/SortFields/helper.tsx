import { CSSProperties } from 'react'
import { XYCoord } from 'react-dnd'

export const snapToGridFun = (x: number, y: number): [number, number] => {
    const snappedX = Math.round(x / 32) * 32
    const snappedY = Math.round(y / 32) * 32
    return [snappedX, snappedY]
}

export const layerStyles: CSSProperties = {
    position: 'fixed',
    pointerEvents: 'none',
    zIndex: 100,
    left: 0,
    top: 0,
    // width: '100%',
    // height: '100%',
}

export const getItemStyles = (
    initialOffset: XYCoord | null,
    currentOffset: XYCoord | null,
    isSnapToGrid: boolean,
) => {
    if (!initialOffset || !currentOffset) {
        return {
            display: 'none',
        }
    }

    let { x, y } = currentOffset

    if (isSnapToGrid) {
        x -= initialOffset.x
        y -= initialOffset.y
        ;[x, y] = snapToGridFun(x, y)
        x += initialOffset.x
        y += initialOffset.y
    }

    const transform = `translate(${x}px, ${y}px)`
    return {
        transform,
        WebkitTransform: transform,
    }
}
