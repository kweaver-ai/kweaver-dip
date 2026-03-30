import React, {
    forwardRef,
    memo,
    useContext,
    useEffect,
    useImperativeHandle,
    useMemo,
    useRef,
    useState,
} from 'react'
import { useSize, useUpdateEffect } from 'ahooks'
import { Rnd } from 'react-rnd'
import classnames from 'classnames'
import { createPortal } from 'react-dom'
import __ from './locale'
import styles from './styles.module.less'
import { isMicroWidget } from '@/core'
import { MicroWidgetPropsContext } from '@/context'

/**
 * ai 外框
 */
const AiWrap: React.FC<any> = forwardRef((props, ref) => {
    const bodySize = useSize(document.body) || { width: 0, height: 0 }
    const defaultWidth = 520
    const { style, selectorId, isDialogClick, children } = props

    const defaultPos = useMemo(() => {
        let left = bodySize.width - defaultWidth - 24
        if (style) {
            const iconDom = document.getElementById(selectorId) as HTMLElement
            left = iconDom?.getBoundingClientRect()?.left || left
        }
        return { x: left, y: 80 }
    }, [style])
    const [sizeWrap, setSizeWrap] = useState(bodySize)
    const [pos, setPos] = useState(defaultPos)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const rndRef = useRef<any>(null)

    useImperativeHandle(ref, () => ({
        target: rndRef.current.getSelfElement(),
    }))

    // 根据浏览器大小动态调整位置大小
    useUpdateEffect(() => {
        const changeWi = bodySize.width - sizeWrap.width
        const changeHi = bodySize.height - sizeWrap.height
        const changePosX = pos.x + changeWi
        const changePosY = pos.y + changeHi
        const tempPos = {
            x: Math.max(changePosX, 0),
            y: Math.max(changePosY, 0),
        }
        if (pos.y === 0) {
            tempPos.y = 0
        }
        if (
            (tempPos.x === 0 || pos.x === 0) &&
            (changeWi < 0 || bodySize.width <= defaultWidth)
        ) {
            tempPos.x = 0
        } else if (pos.x > bodySize.width - defaultWidth) {
            tempPos.x = bodySize.width - defaultWidth
        }
        setPos(tempPos)
        setSizeWrap(bodySize)
    }, [bodySize])

    // 获取渲染节点
    const getDomNode = () => {
        // 作为AS插件，插入跟节点
        if (isMicroWidget({ microWidgetProps })) {
            return (
                document.getElementById('af-plugin-framework-for-as') ||
                document.body
            )
        }

        return document.getElementById('root') || document.body
    }

    return createPortal(
        <div className={styles.aiDialogWrap}>
            <Rnd
                ref={rndRef}
                enableResizing={false}
                cancel=".aiDialogWrap-drag-unabled"
                className={classnames(
                    styles['aiDialogWrap-content-wrapper'],
                    !isDialogClick && styles.hidden,
                )}
                bounds={getDomNode()}
                minWidth={defaultWidth}
                position={{
                    x: pos.x,
                    y: pos.y,
                }}
                onDragStop={(e, d) => {
                    setPos({ x: d.x, y: d.y })
                }}
            >
                <div className={styles['aiDialogWrap-content']}>{children}</div>
            </Rnd>
        </div>,
        getDomNode(),
    )
})

export default memo(AiWrap)
