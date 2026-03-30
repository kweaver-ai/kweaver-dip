import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons'
import * as React from 'react'
import { ReactNode, useState, useEffect } from 'react'
import Split from 'react-split'
import classnames from 'classnames'
import styles from './styles.module.less'
import './style.gutter.less'

interface DragBoxType {
    children: [ReactNode, ReactNode]
    defaultSize: Array<number>
    minSize: [number, number]
    maxSize: [number, number]
    cursor?: string
    onDragStart?: (size: Array<number>) => void
    onDragEnd: (size: Array<number>) => void
    gutterStyles?: any
    splitClass?: string
    rightNodeStyle?: React.CSSProperties
    gutterSize?: number
    showExpandBtn?: boolean
    existPadding?: boolean
    hiddenElement?: string
    expandCloseText?: string
    defaultExpand?: boolean
    unExpandFunc?: (bool) => void
}

const DragBox: React.FC<DragBoxType> = ({
    children,
    defaultSize,
    minSize,
    maxSize,
    cursor,
    onDragStart,
    onDragEnd,
    splitClass,
    rightNodeStyle,
    gutterStyles = {},
    gutterSize = 20,
    showExpandBtn = true,
    existPadding = true,
    hiddenElement = '',
    expandCloseText = '目录',
    defaultExpand = true,
    unExpandFunc,
}) => {
    const [expand, setExpand] = useState<boolean>(true)
    useEffect(() => {
        setExpand(defaultExpand)
    }, [defaultExpand])

    return (
        <Split
            className={classnames(styles.split, splitClass)}
            sizes={expand ? defaultSize : [0, 100]}
            minSize={expand ? minSize : [0, 500]}
            maxSize={expand ? maxSize : [0, Infinity]}
            gutterSize={expand ? gutterSize : 0}
            direction="horizontal"
            cursor={cursor || 'ew-resize'}
            gutterStyle={() =>
                expand
                    ? {
                          background: 'transparent',
                          width: `${gutterSize}px`,
                          cursor: cursor || 'ew-resize',
                          borderLeft: '1px solid rgb(0 0 0 / 10%)',
                          ...gutterStyles,
                      }
                    : {
                          background: 'transparent',
                          width: '0px',
                          cursor: cursor || 'ew-resize',
                          borderLeft: '0',
                      }
            }
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
        >
            {hiddenElement === 'left' ? (
                <div />
            ) : (
                <div
                    className={styles.leftSpanList}
                    style={{
                        minWidth: expand ? (minSize ? minSize[0] : 0) : 0,
                    }}
                >
                    <div className={styles.expandList}>
                        <div className={styles.listContent}>{children[0]}</div>
                        {showExpandBtn ? (
                            expand ? (
                                <div>
                                    <div
                                        className={styles.expandOpen}
                                        onClick={() => {
                                            setExpand(false)
                                            // eslint-disable-next-line
                                            unExpandFunc && unExpandFunc(expand)
                                        }}
                                    >
                                        <CaretLeftOutlined />
                                    </div>
                                </div>
                            ) : (
                                <div
                                    className={styles.unexpandList}
                                    onClick={() => {
                                        setExpand(true)
                                        // eslint-disable-next-line
                                        unExpandFunc && unExpandFunc(expand)
                                    }}
                                >
                                    <div
                                        className={styles.expandClose}
                                        style={{
                                            height: expandCloseText.length * 20,
                                        }}
                                    >
                                        {expandCloseText}
                                    </div>
                                </div>
                            )
                        ) : undefined}
                    </div>
                </div>
            )}

            {hiddenElement === 'right' ? (
                <div />
            ) : (
                <div
                    className={classnames(
                        styles.rightNode,
                        existPadding &&
                            (expand
                                ? styles.rightNodeOn
                                : styles.rightNodeExpandOff),
                    )}
                    style={rightNodeStyle}
                >
                    {children[1]}
                </div>
            )}
        </Split>
    )
}

export default React.memo(DragBox)
