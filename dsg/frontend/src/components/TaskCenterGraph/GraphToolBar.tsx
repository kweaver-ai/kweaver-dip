import * as React from 'react'
import { useState, useEffect } from 'react'
import { Graph } from '@antv/x6'
import { Button, Dropdown, Tooltip, Divider } from 'antd'
import { DownOutlined } from '@ant-design/icons'
import { LargeOutlined, NarrowOutlined, LocationOutlined } from '@/icons'
import styles from './styles.module.less'

interface GraphToolBarType {
    getGrapInstance: () => Graph | undefined
    graphSizeValue: number
}

const graphSizeItems = [
    {
        key: 'all',
        label: '总览全部',
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

const GraphToolBar = ({
    getGrapInstance,
    graphSizeValue,
}: GraphToolBarType) => {
    const [graphSize, setGraphSize] = useState(100)

    useEffect(() => {
        setGraphSize(graphSizeValue)
    }, [graphSizeValue])

    /**
     * 调整画布大小
     * @param multiple
     */
    const onChangeGraphSize = (multiple) => {
        const graphCase = getGrapInstance()
        setGraphSize(multiple * 100)
        graphCase?.zoomTo(multiple)
    }

    /**
     * 展示所有画布内容
     */
    const showAllGraphSize = () => {
        const graphCase = getGrapInstance()
        if (graphCase) {
            graphCase.zoomToFit({ padding: 24 })
            const multiple = graphCase.zoom()
            const showSize = Math.round(multiple * 100)
            setGraphSize(showSize - (showSize % 5))
            return multiple
        }
        return 100
    }

    /**
     * 画布定位到中心
     */
    const movedToCenter = () => {
        const graphCase = getGrapInstance()
        graphCase?.centerContent()
    }

    /**
     * 选择画布大小
     * @param key 选择项
     */
    const selectGraphSize = (key: string) => {
        const showSize: number = 100
        switch (true) {
            case key === 'all':
                showAllGraphSize()
                break
            case key === 'divider':
                break
            default:
                onChangeGraphSize(Number(key) / 100)
                break
        }
    }

    return (
        <div>
            <div className={styles.toolbarContent}>
                <div className={styles.toolIcon}>
                    <Tooltip placement="bottom" title="缩小">
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
                    <Tooltip placement="bottom" title="放大">
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
                <div className={styles.toolSplit}>
                    <div className={styles.toolSplitLine} />
                </div>
            </div>
            <div className={styles.toolbarContent}>
                <div className={styles.toolIcon}>
                    <Tooltip placement="bottom" title="定位">
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
                                movedToCenter()
                            }}
                            className={`${styles.toolButton} ${styles.iconEnabled}`}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}

export default GraphToolBar
