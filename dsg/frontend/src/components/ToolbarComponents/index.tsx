import React, { CSSProperties, ReactNode } from 'react'
import { Button, Tooltip } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { FontIcon } from '@/icons'

interface ILabelSelect {
    label?: string
    contentNode: ReactNode
}

interface IRefreshBtn extends React.HTMLAttributes<HTMLSpanElement> {
    onClick?: (e) => void
    tips?: string
    loading?: boolean
}

export const RefreshBtn = ({
    onClick,
    tips,
    loading = false,
    ...props
}: IRefreshBtn) => {
    return (
        <span className={styles.refreshBtnBox} {...props}>
            <Tooltip placement="bottom" title={tips || __('刷新')}>
                <Button
                    type="text"
                    onClick={onClick}
                    className={styles.textBtn}
                    icon={<FontIcon name="icon-tongyishuaxin" />}
                    loading={loading}
                />
            </Tooltip>
        </span>
    )
}

export const SortBtn = ({
    contentNode,
    style,
}: {
    contentNode: ReactNode
    style?: CSSProperties
}) => {
    return (
        <span className={styles.sortBtnBox} style={style}>
            {contentNode}
        </span>
    )
}

/**
 * 带label下拉搜索组件
 * @param label 标题
 * @param contentNode 内容组件
 */
export const LabelSelect = (props: ILabelSelect) => {
    const { label, contentNode } = props
    return (
        <div className={styles.labelSelectBox}>
            {/* {label && <span className={styles.label}>{label}:</span>} */}
            <span className={styles.contentNode}>{contentNode}</span>
        </div>
    )
}
