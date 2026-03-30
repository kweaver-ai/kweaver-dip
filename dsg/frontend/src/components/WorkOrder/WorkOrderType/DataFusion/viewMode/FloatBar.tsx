import React, { useMemo } from 'react'
import { Button, Divider, Dropdown, Tooltip } from 'antd'
import { DownOutlined, EditOutlined, SyncOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import {
    FontIcon,
    LargeOutlined,
    LocationOutlined,
    NarrowOutlined,
} from '@/icons'
import { useViewGraphContext } from './ViewGraphProvider'

interface FloatBarType {
    size?: 'small' | 'middle' | 'large'
    inMode?: string // 所在视图模式
    onExpand?: (expand: boolean) => void
    onEdit?: () => void
}

const FloatBar = ({
    size = 'middle',
    inMode,
    onExpand,
    onEdit,
}: FloatBarType) => {
    const { graphSize, onShowAll, onChangeSize, onMovedToCenter, onRefresh } =
        useViewGraphContext()

    const graphSizeItems = [
        {
            key: 'all',
            label: __('总览全部'),
        },
        {
            key: 'divider',
            label: (
                <Divider
                    style={{
                        margin: 0,
                    }}
                />
            ),
            disabled: true,
        },
        {
            key: '400',
            label: '400%',
        },
        {
            key: '200',
            label: '200%',
        },
        {
            key: '100',
            label: '100%',
        },
        {
            key: '50',
            label: '50%',
        },
    ]

    /**
     * 选择画布大小
     * @param key 选择项
     */
    const selectGraphSize = (key: string) => {
        const showSize: number = 100
        switch (true) {
            case key === 'all':
                onShowAll()
                break
            case key === 'divider':
                break
            default:
                onChangeSize(Number(key) / 100)
                break
        }
    }

    const btnSize = useMemo(() => {
        return size === 'small' ? 'small' : 'middle'
    }, [size])

    return (
        <div
            className={classnames(styles.toolWrapper, {
                [styles.smallMode]: size === 'small',
            })}
        >
            <div className={styles.toolbarContent}>
                <div className={styles.toolIcon}>
                    <Tooltip placement="bottom" title={__('全屏')}>
                        <Button
                            type="text"
                            size={btnSize}
                            icon={
                                <FontIcon
                                    name="icon-quanping"
                                    style={{
                                        fontSize: '16px',
                                        lineHeight: 1,
                                        color: 'rgb(0 0 0 / 85%)',
                                    }}
                                />
                            }
                            onClick={() => {
                                onExpand?.(true)
                            }}
                            className={`${styles.toolButton} ${styles.iconEnabled}`}
                        />
                    </Tooltip>
                </div>
            </div>
            {inMode === 'edit' && (
                <>
                    <div className={styles.divider} />
                    <div className={styles.toolbarContent}>
                        <div className={styles.toolIcon}>
                            <Tooltip placement="bottom" title={__('编辑')}>
                                <Button
                                    type="text"
                                    size={btnSize}
                                    icon={
                                        <EditOutlined
                                            style={{
                                                fontSize: '16px',
                                                color: 'rgb(0 0 0 / 85%)',
                                            }}
                                        />
                                    }
                                    onClick={() => {
                                        onEdit?.()
                                    }}
                                    className={`${styles.toolButton} ${styles.iconEnabled}`}
                                />
                            </Tooltip>
                        </div>
                    </div>
                </>
            )}
            <div className={styles.divider} />
            <div className={styles.toolbarContent}>
                <div className={styles.toolIcon}>
                    <Tooltip placement="bottom" title={__('刷新')}>
                        <Button
                            type="text"
                            size={btnSize}
                            icon={
                                <SyncOutlined
                                    style={{
                                        fontSize: '16px',
                                        color: 'rgb(0 0 0 / 85%)',
                                    }}
                                />
                            }
                            onClick={() => {
                                onRefresh?.()
                            }}
                            className={`${styles.toolButton} ${styles.iconEnabled}`}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}

export default FloatBar
