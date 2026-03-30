import React, {
    CSSProperties,
    HTMLAttributes,
    ReactNode,
    useEffect,
    useRef,
    useState,
} from 'react'
import styles from './styles.module.less'

interface IRemovableView extends HTMLAttributes<HTMLDivElement> {
    children: ReactNode
    visible: boolean
    modalWid?: number
    modalHgt?: number
    paddingTop?: number
    paddingLeft?: number
    saveArea?: number[]
    bodyStyle?: CSSProperties
}

/**
 * 可移动库表
 * @children 内容
 * @visible 弹窗是否显示
 * @modalWid 弹窗宽度
 * @modalHgt 弹窗高度
 * @paddingTop 距离顶部高度
 * @paddingLeft 距离左侧高度
 * @saveArea 安全距离
 * @bodyStyle 容器样式
 */
const RemovableView: React.FC<IRemovableView> = ({
    children,
    visible,
    modalWid = 200,
    modalHgt = 200,
    paddingTop,
    paddingLeft,
    saveArea = [0, 0, 0, 0],
    bodyStyle,
    ...props
}) => {
    const [styleTop, setStyleTop] = useState(document.body.clientHeight / 2)
    const [styleLeft, setStyleLeft] = useState(document.body.clientWidth / 2)
    const [maxHgt, setMaxHgt] = useState('')
    const [maxWid, setMaxWid] = useState('')
    const ref = useRef<HTMLDivElement>(null)

    const onMouseDown = (e) => {
        // e.preventDefault()
        const bodyWid = document.body.clientWidth
        const bodyHgt = document.body.clientHeight
        const domWid = ref.current?.clientWidth || 0
        const domHgt = ref.current?.clientHeight || 0
        const startPosX = e.clientX
        const startPosY = e.clientY
        document.body.onmousemove = (evt) => {
            let left = evt.clientX - startPosX + styleLeft
            let top = evt.clientY - startPosY + styleTop
            const [a, b, c, d] = saveArea
            if (top < a) {
                top = a
            }
            if (bodyWid - left < domWid + b) {
                left = bodyWid - domWid - b
            }
            if (bodyHgt - top < domHgt + c) {
                top = bodyHgt - domHgt - c
            }
            if (left < d) {
                left = d
            }

            setStyleTop(top)
            setStyleLeft(left)
        }
        document.body.onmouseup = () => {
            document.body.onmousemove = null
            document.body.onmouseup = null
        }
    }

    const resetModal = () => {
        // 浏览器宽高
        const bodyWid = document.body.clientWidth
        const bodyHgt = document.body.clientHeight
        // 弹窗宽高
        const domWid = ref.current?.clientWidth || 0
        const domHgt = ref.current?.clientHeight || 0
        if (paddingLeft === undefined) {
            const pLeft = Math.floor((bodyWid - domWid) / 2)
            setStyleLeft(pLeft)
        } else {
            setStyleLeft(paddingLeft)
        }
        if (paddingTop === undefined) {
            const pTop = Math.floor((bodyHgt - domHgt) / 2)
            setStyleTop(pTop)
        } else {
            setStyleTop(paddingTop)
        }
    }

    useEffect(() => {
        if (visible) {
            resetModal()
            setMaxHgt(`${document.body.clientHeight}px`)
            setMaxWid(`${document.body.clientWidth}px`)
        }
    }, [visible])

    window.onresize = () => {
        setMaxHgt(`${document.body.clientHeight}px`)
        setMaxWid(`${document.body.clientWidth}px`)
    }

    return (
        <div
            className={styles.removableViewWrap}
            style={{ display: visible ? 'block' : 'none' }}
        >
            <div
                {...props}
                className={styles.popContainer}
                style={{
                    left: `${styleLeft}px`,
                    top: `${styleTop}px`,
                    width: modalWid,
                    height: modalHgt,
                    ...bodyStyle,
                }}
                ref={ref}
                onMouseDown={onMouseDown}
            >
                <div className={styles.content}>{children}</div>
            </div>
        </div>
    )
}

export default RemovableView
