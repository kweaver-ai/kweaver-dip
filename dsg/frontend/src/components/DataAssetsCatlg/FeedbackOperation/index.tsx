import { Button, Tooltip } from 'antd'
import React, { useState } from 'react'
import classnames from 'classnames'
import { FontIcon } from '@/icons'
import { CreateFeadback } from '@/components/DataCatalogFeedback'
import __ from './locale'

interface IFeedbackOperation {
    type?: 'icon' | 'button'
    catalog: any // 数据目录
    className?: string
}

/**
 * 目录反馈操作
 */
const FeedbackOperation = ({
    type = 'icon',
    catalog,
    className,
}: IFeedbackOperation) => {
    const [createVisible, setCreateVisible] = useState(false)

    const handleCreateSuccess = () => {
        setCreateVisible(false)
    }

    const handleFeedbackClick = (e) => {
        e.preventDefault()
        e.stopPropagation()
        setCreateVisible(true)
    }

    return (
        <>
            <Tooltip title={__('反馈')} placement="bottom">
                {type === 'icon' ? (
                    <FontIcon
                        name="icon-fankui"
                        className={classnames({
                            [`${className}`]: true,
                        })}
                        style={{ cursor: 'pointer' }}
                        onClick={handleFeedbackClick}
                    />
                ) : (
                    <Button
                        className={classnames({
                            [`${className}`]: true,
                        })}
                        style={{ cursor: 'pointer' }}
                        icon={<FontIcon name="icon-fankui" />}
                        onClick={handleFeedbackClick}
                    >
                        <span style={{ paddingLeft: '4px' }}>{__('反馈')}</span>
                    </Button>
                )}
            </Tooltip>
            {createVisible && (
                <CreateFeadback
                    open={createVisible}
                    item={catalog}
                    onCreateClose={() => setCreateVisible(false)}
                    onCreateSuccess={handleCreateSuccess}
                />
            )}
        </>
    )
}

export default FeedbackOperation
