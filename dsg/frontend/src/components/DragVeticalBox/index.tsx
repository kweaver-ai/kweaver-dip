import React, { ReactNode, useRef } from 'react'
import Split, { SplitProps } from 'react-split'
import classnames from 'classnames'
import { useMount } from 'ahooks'
import styles from './styles.module.less'
import dragVertical from '@/icons/svg/colored/dragVertical.svg'

interface DragBoxType extends SplitProps {
    children: [ReactNode, ReactNode]
    defaultSize: Array<number>
    gutterSize?: number
    hiddenElement?: string
    wi?: string | number
}

const DragVeticalBox: React.FC<DragBoxType> = ({
    children,
    defaultSize,
    gutterSize = 20,
    hiddenElement = '',
    wi,
    ...props
}) => {
    const domRef = useRef<any>()
    useMount(() => {
        const gutter = domRef.current?.parent?.getElementsByClassName(
            'gutter gutter-vertical',
        )[0]
        while (gutter.firstChild) {
            gutter.removeChild(gutter.firstChild)
        }
        const icon = document.createElement('img')
        icon.src = dragVertical
        icon.className = `gutterIcon`
        gutter.append(icon)
    })

    return (
        <Split
            ref={domRef}
            className={styles.split}
            sizes={defaultSize}
            gutterSize={hiddenElement ? 0 : gutterSize || 20}
            direction="vertical"
            cursor="ns-resize"
            style={{ maxWidth: wi || '100%' }}
            {...props}
        >
            {hiddenElement === 'left' ? (
                <div />
            ) : (
                <div className={styles.leftSpanList}>
                    <div className={styles.expandList}>
                        <div className={styles.listContent}>{children[0]}</div>
                    </div>
                </div>
            )}

            {hiddenElement === 'right' ? (
                <div />
            ) : (
                <div className={classnames(styles.rightNode)}>
                    {/* {expand ? (
                        <div
                            className={styles.expandOpen}
                            onClick={() => {
                                onExpend?.(false)
                            }}
                        >
                            <CaretUpOutlined />
                        </div>
                    ) : (
                        <div
                            className={styles.unexpandList}
                            onClick={() => {
                                onExpend?.(true)
                            }}
                        >
                            <div className={styles.expandClose}>
                                <CaretDownOutlined />
                            </div>
                        </div>
                    )} */}
                    {children[1]}
                </div>
            )}
        </Split>
    )
}

export default React.memo(DragVeticalBox)
