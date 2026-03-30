import * as React from 'react'
import { Button, Divider, Dropdown, Tooltip } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import styles from './styles.module.less'
import __ from './locale'
import { LargeOutlined, LocationOutlined, NarrowOutlined } from '@/icons'

interface FloatBarType {
    graphSize: number
    onChangeGraphSize: (multiple: number) => void
    onShowAllGraphSize: () => void
    onMovedToCenter: () => void
}

const FloatBar = ({
    graphSize,
    onChangeGraphSize,
    onShowAllGraphSize,
    onMovedToCenter,
}: FloatBarType) => {
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
                onShowAllGraphSize()
                break
            case key === 'divider':
                break
            default:
                onChangeGraphSize(Number(key) / 100)
                break
        }
    }

    return (
        <div className={styles.toolWrapper}>
            <div className={styles.toolbarContent}>
                <div className={styles.toolIcon}>
                    <Tooltip placement="top" title={__('缩小')}>
                        <Button
                            type="text"
                            icon={
                                <NarrowOutlined
                                    style={{
                                        fontSize: '14px',
                                    }}
                                    // disabled={graphSize <= 20}
                                />
                            }
                            onClick={() => {
                                onChangeGraphSize(
                                    Math.round(graphSize - 5) / 100,
                                )
                            }}
                            disabled={graphSize <= 20}
                            className={`${styles.toolButton} ${
                                graphSize <= 20
                                    ? styles.iconDisabled
                                    : styles.iconEnabled
                            }`}
                        />
                    </Tooltip>
                </div>
                <div className={styles.toolIcon}>
                    <Dropdown
                        menu={{
                            items: graphSizeItems,
                            onClick: ({ key }) => {
                                selectGraphSize(key)
                            },
                        }}
                    >
                        <div
                            className={`${styles.toolSelectSize} ${styles.iconEnabled}`}
                        >
                            <div
                                style={{
                                    fontSize: '12px',
                                    userSelect: 'none',
                                }}
                                onDoubleClick={() => {
                                    onChangeGraphSize(1)
                                }}
                            >
                                {`${Math.round(graphSize)}%`}
                            </div>
                            <DownOutlined
                                style={{
                                    fontSize: '10px',
                                    margin: '0 0 0 5px',
                                }}
                            />
                        </div>
                    </Dropdown>
                </div>
                <div className={styles.toolIcon}>
                    <Tooltip placement="top" title={__('放大')}>
                        <Button
                            type="text"
                            icon={
                                <LargeOutlined
                                    style={{
                                        fontSize: '14px',
                                    }}
                                />
                            }
                            onClick={() => {
                                onChangeGraphSize(
                                    Math.round(graphSize + 5) / 100,
                                )
                            }}
                            disabled={graphSize >= 400}
                            className={`${styles.toolButton} ${
                                graphSize >= 400
                                    ? styles.iconDisabled
                                    : styles.iconEnabled
                            }`}
                        />
                    </Tooltip>
                </div>
            </div>
            <div className={styles.toolbarContent}>
                <div className={styles.toolIcon}>
                    <Tooltip placement="top" title={__('定位')}>
                        <Button
                            type="text"
                            icon={
                                <LocationOutlined
                                    style={{
                                        fontSize: '16px',
                                    }}
                                />
                            }
                            onClick={() => {
                                onMovedToCenter()
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
