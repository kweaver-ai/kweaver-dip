import * as React from 'react'
import { useState, ReactNode } from 'react'
import { CaretLeftOutlined, CaretRightOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'

interface ToolbarType {
    children: ReactNode
    needExpand?: boolean
}

const GraphFloatMenu = ({ children, needExpand = true }: ToolbarType) => {
    const [expand, setExpand] = useState<boolean>(true)
    return (
        <div className={styles.toolBarWrapper}>
            {needExpand && (
                <div
                    className={styles.expandBtn}
                    onClick={() => {
                        setExpand(!expand)
                    }}
                >
                    {expand ? <CaretRightOutlined /> : <CaretLeftOutlined />}
                </div>
            )}
            {expand ? children : null}
        </div>
    )
}

export default GraphFloatMenu
