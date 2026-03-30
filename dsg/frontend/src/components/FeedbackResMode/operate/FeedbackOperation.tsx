import { Button, Tooltip } from 'antd'
import React, { useState } from 'react'
import classnames from 'classnames'
import { FontIcon } from '@/icons'
import { ResType } from '@/core'
import CreateFeadback from './CreateFeadback'
import __ from '../locale'
import styles from '../styles.module.less'

interface IFeedbackOperation {
    type?: 'icon' | 'button'
    item: any // 数据目录
    resType: ResType
    className?: string
    disabled?: boolean
    disabledTooltip?: string
}

/**
 * 目录反馈操作
 */
const FeedbackOperation = ({
    type = 'icon',
    item,
    resType,
    className,
    disabled,
    disabledTooltip,
}: IFeedbackOperation) => {
    const [createVisible, setCreateVisible] = useState(false)

    const handleCreateSuccess = () => {
        setCreateVisible(false)
    }

    const handleFeedbackClick = (e) => {
        if (disabled) return
        e.preventDefault()
        e.stopPropagation()
        setCreateVisible(true)
    }

    return (
        <>
            <Tooltip
                title={disabled ? disabledTooltip : __('反馈')}
                placement="bottom"
            >
                {type === 'icon' ? (
                    <FontIcon
                        name="icon-fankui"
                        className={classnames(styles.feedbackIcon, {
                            [`${className}`]: true,
                        })}
                        disabled={disabled}
                        style={{
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            color: disabled ? 'rgba(0, 0, 0, 0.25)' : undefined,
                        }}
                        onClick={handleFeedbackClick}
                    />
                ) : (
                    <Button
                        className={classnames(styles.feedbackButton, {
                            [`${className}`]: true,
                        })}
                        icon={<FontIcon name="icon-fankui" />}
                        disabled={disabled}
                        style={{
                            cursor: disabled ? 'not-allowed' : 'pointer',
                            color: disabled ? 'rgba(0, 0, 0, 0.25)' : undefined,
                        }}
                        onClick={handleFeedbackClick}
                    >
                        <span style={{ paddingLeft: '4px' }}>{__('反馈')}</span>
                    </Button>
                )}
            </Tooltip>
            {createVisible && (
                <CreateFeadback
                    open={createVisible}
                    item={item}
                    resType={resType}
                    onCreateClose={() => setCreateVisible(false)}
                    onCreateSuccess={handleCreateSuccess}
                />
            )}
        </>
    )
}

export default FeedbackOperation
