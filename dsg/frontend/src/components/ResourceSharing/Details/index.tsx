import React, { useEffect, useMemo, useState } from 'react'
import { Space } from 'antd'
import { CloseOutlined, LeftOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { clone, noop } from 'lodash'
import __ from '../locale'
import styles from './styles.module.less'
import GlobalMenu from '@/components/GlobalMenu'
import DetailsContent from './DetailsContent'
import {
    details1,
    details2,
    details3,
    details4,
    details5,
    details6,
} from './const'
import OperateRecord from './OperateRecord'
import {
    IShareApplyBasic,
    IShareApplyLog,
    formatError,
    getShareApplyDetail,
} from '@/core'
import { renderEmpty, renderLoader } from '../helper'
import { ApplyResource } from '../const'
import { useResShareDrawerContext } from '../ResShareDrawerProvider'

interface IDetails {
    applyId?: string
    // 配置 keys, 不传则全部展示
    configsKey?: string[]
    // 是否显示操作记录, 默认展示
    showRecord?: boolean
    // 是否全屏
    fullScreen?: boolean
    onClose?: () => void
}

const Details: React.FC<IDetails> = ({
    applyId,
    configsKey = [],
    showRecord = true,
    fullScreen = true,
    onClose = noop,
}) => {
    // 初始化 load
    const [loading, setLoading] = useState<boolean>(false)
    // 详情数据
    const [detailsData, setDetailsData] = useState<IShareApplyBasic>()
    // 操作记录
    const [logsData, setLogsData] = useState<IShareApplyLog[]>([])

    const { dict } = useResShareDrawerContext()

    // 显示的分组
    const detailsConfig = useMemo(() => {
        const all = [details1, details2, details3, details4, details5, details6]
        let configs: any[] = clone(all)
        if (configsKey?.length > 0) {
            configs = configsKey
                .map((item) => all.find((a) => a.key === item))
                .filter((item) => item)
        }
        if (detailsData) {
            // 不是接口类型过滤掉相关配置
            if (detailsData.resource_type !== ApplyResource.Interface) {
                configs = configs.filter((item) => item.key !== details4.key)
            }
        }
        return configs
    }, [detailsData, configsKey])

    useEffect(() => {
        if (applyId) {
            getDetails()
        }
    }, [applyId])

    // 获取信息
    const getDetails = async () => {
        try {
            setLoading(true)
            const res = await getShareApplyDetail(applyId || '')
            setDetailsData(res?.basic_info)
            setLogsData(res?.log || [])
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
            <div className={styles.detialHeader}>
                {fullScreen ? (
                    <Space className={styles.returnWrappper} size={12}>
                        <div className={styles.returnInfo}>
                            <GlobalMenu />
                            <div onClick={() => onClose()}>
                                <LeftOutlined className={styles.returnArrow} />
                                <span className={styles.returnText}>
                                    {__('返回')}
                                </span>
                            </div>
                        </div>
                        <div className={styles.divider} />
                        <div className={styles.titleText} title="ffff">
                            {detailsData?.catalog_title}
                            {__('申请详情')}
                        </div>
                    </Space>
                ) : (
                    <>
                        <div className={styles.titleText} title="ffff">
                            {detailsData?.catalog_title}
                            {__('申请详情')}
                        </div>
                        <CloseOutlined
                            className={styles.close}
                            onClick={() => onClose()}
                        />
                    </>
                )}
            </div>
            <div className={styles.bottom}>
                <div className={styles.content}>
                    {loading ? (
                        renderLoader(0)
                    ) : !detailsData ? (
                        renderEmpty(64)
                    ) : (
                        <>
                            <DetailsContent
                                data={detailsData}
                                config={detailsConfig}
                                center={!showRecord}
                                dict={dict}
                            />
                            {showRecord && <OperateRecord data={logsData} />}
                        </>
                    )}
                </div>
            </div>
        </div>
    )
}
export default Details
