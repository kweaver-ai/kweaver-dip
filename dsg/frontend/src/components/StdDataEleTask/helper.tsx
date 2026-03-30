import React from 'react'
import classnames from 'classnames'
import { Tooltip } from 'antd'
import styles from './styles.module.less'
import __ from './locale'

/**
 * 标准名字、依据组件
 * @param name 标准名字
 * @param basis 标准分类
 * @returns
 */
export const StdOption: React.FC<{
    name: string
    nameEn?: string
    basis: string
    bg?: string
    disabled?: boolean
    disabledTip?: string
}> = ({ name, nameEn, basis, bg, disabled, disabledTip }) => {
    return (
        <div
            className={classnames(
                styles.stdOptionWrapper,
                disabled && styles.stdOptionWrapperDisabled,
            )}
            style={bg ? { backgroundColor: bg } : undefined}
            title={name}
        >
            <Tooltip title={disabled ? disabledTip : ''} placement="topLeft">
                <div className={styles.stdCNLabel}>
                    {basis && <span className={styles.basis}>{basis}</span>}

                    <span className={classnames(styles.name, styles.disbled)}>
                        {name}
                    </span>
                </div>
            </Tooltip>

            {nameEn && (
                <div className={classnames(styles.stdENLabel, styles.disbled)}>
                    {nameEn}
                </div>
            )}
        </div>
    )
}
