import { Typography } from 'antd'
import React, { useState, ReactNode } from 'react'
import styles from './styles.module.less'
import __ from './locale'

const { Paragraph } = Typography

interface IExpand {
    rows?: number
    expandTips?: ReactNode
    collapseTips?: ReactNode
    content: string | ReactNode
}
/**
 * 自定义文字展开收起组件
 */
const Expand = ({
    rows = 1,
    expandTips = __('展开全部'),
    collapseTips = __('收起'),
    content,
}: IExpand) => {
    const [counter, setCounter] = useState(0)
    const [expand, setExpand] = useState(false)

    const handleExpand = () => {
        setExpand(true)
        setCounter(!expand ? counter + 0 : counter + 1)
    }

    const handleCollapse = () => {
        setExpand(false)
        setCounter(!expand ? counter + 0 : counter + 1)
    }

    return (
        <div key={counter}>
            <Paragraph
                style={{
                    marginBottom: 0,
                    display: expand ? 'inline' : 'block',
                }}
                ellipsis={{
                    rows,
                    expandable: true,
                    symbol: expandTips,
                    onExpand: handleExpand,
                }}
            >
                {content}
            </Paragraph>
            {expand && (
                <a className={styles.collapse} onClick={handleCollapse}>
                    {collapseTips}
                </a>
            )}
        </div>
    )
}

export default Expand
