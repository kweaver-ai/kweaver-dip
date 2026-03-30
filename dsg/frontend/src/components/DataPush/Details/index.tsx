import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { noop } from 'lodash'
import { Tabs } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { formatError, getDataPushDetail, IDataPushDetail } from '@/core'
import { renderEmpty, renderLoader } from '../helper'
import { DataPushAction, DataPushStatus } from '../const'
import DrawerHeader from './DrawerHeader'
import SingleMonitorTable from './SingleMonitorTable'
import DetailsContent from './DetailsContent'

interface IDetails {
    // 数据推送 id
    dataPushId?: string
    // 操作
    operate?: string
    // 是否全屏
    fullScreen?: boolean
    onClose?: () => void
}

const Details: React.FC<IDetails> = ({
    dataPushId,
    operate,
    fullScreen = true,
    onClose = noop,
}) => {
    const [activeKey, setActiveKey] = useState<string>(operate || 'detail')
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(false)
    // 详情数据
    const [detailsData, setDetailsData] = useState<IDataPushDetail>()

    useEffect(() => {
        if (dataPushId) {
            getDetails()
        }
    }, [dataPushId])

    // 导航栏tab
    const tabItems = useMemo(() => {
        let items: any[] = []
        if (operate === DataPushAction.Detail) {
            items = [
                {
                    label: __('详情'),
                    key: DataPushAction.Detail,
                },
            ]
            if (
                detailsData &&
                [
                    DataPushStatus.NotStarted,
                    DataPushStatus.InProgress,
                    DataPushStatus.Stopped,
                    DataPushStatus.Ended,
                ].includes(detailsData.push_status)
            ) {
                items.push({
                    label: __('作业监控'),
                    key: DataPushAction.Monitor,
                })
            }
        } else {
            items = [
                {
                    label: __('详情'),
                    key: DataPushAction.Detail,
                },
                {
                    label: __('作业监控'),
                    key: DataPushAction.Monitor,
                },
            ]
        }
        return items
    }, [detailsData, operate])

    // 获取信息
    const getDetails = async () => {
        try {
            setLoading(true)
            const res = await getDataPushDetail(dataPushId!)
            setDetailsData(res)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <div
            className={classnames(
                styles.details,
                !fullScreen && styles.details_notFullScreen,
            )}
        >
            <DrawerHeader
                title={detailsData?.name}
                fullScreen={fullScreen}
                showIcon
                onClose={onClose}
            >
                <Tabs
                    items={tabItems}
                    activeKey={activeKey}
                    onChange={(key) => {
                        setActiveKey(key)
                    }}
                    className={styles.tabs}
                />
            </DrawerHeader>
            <div className={styles.bottom}>
                <div className={styles.content}>
                    {loading ? (
                        renderLoader()
                    ) : activeKey === DataPushAction.Detail ? (
                        <DetailsContent detailsData={detailsData} />
                    ) : (
                        <SingleMonitorTable dataPushData={detailsData} />
                    )}
                </div>
            </div>
        </div>
    )
}
export default Details
