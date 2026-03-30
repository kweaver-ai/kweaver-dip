import { Col, Drawer, Row } from 'antd'
import { useEffect, useState } from 'react'
import {
    formatError,
    getWorkOrderTemplateDetailById,
    IWorkOrderTemplateInfo,
} from '@/core'
import { CommonTitle } from '@/ui'
import __ from './locale'
import styles from './styles.module.less'
import { formatTime } from '@/utils'
import { TicketTypeOptions } from './helper'

interface DetailsProps {
    id: string
    open: boolean
    onClose: () => void
}
const Details = ({ id, open, onClose }: DetailsProps) => {
    const [detailInfo, setDetailInfo] = useState<IWorkOrderTemplateInfo>()

    useEffect(() => {
        if (open && id) {
            getDetailInfo()
        }
    }, [open, id])

    const getDetailInfo = async () => {
        try {
            const res = await getWorkOrderTemplateDetailById(id)
            setDetailInfo(res)
        } catch (error) {
            formatError(error)
        }
    }

    return (
        <Drawer
            title={__('详情')}
            open={open}
            push={false}
            onClose={onClose}
            maskClosable={false}
            width={640}
            footer={null}
        >
            <div className={styles['details-container']}>
                <CommonTitle title={__('基本信息')} />
                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>
                        {__('模板名称')}：
                    </div>
                    <div className={styles['detail-value']}>
                        {detailInfo?.template_name || '--'}
                    </div>
                </div>
                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>{__('描述')}：</div>
                    <div className={styles['detail-value']}>
                        {detailInfo?.description || '--'}
                    </div>
                </div>
                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>
                        {__('工单类型')}：
                    </div>
                    <div className={styles['detail-value']}>
                        {TicketTypeOptions.find(
                            (item) => item.value === detailInfo?.ticket_type,
                        )?.label || '--'}
                    </div>
                </div>

                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>
                        {__('启用状态')}：
                    </div>
                    <div className={styles['detail-value']}>
                        {detailInfo?.status ? (
                            <span className={styles.active}>
                                {__('启用中')}
                            </span>
                        ) : (
                            <span>{__('未启用')}</span>
                        )}
                    </div>
                </div>
                <div style={{ marginTop: 20 }}>
                    <CommonTitle title={__('更新信息')} />
                </div>
                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>
                        {__('创建人')}：
                    </div>
                    <div className={styles['detail-value']}>
                        {detailInfo?.created_name || '--'}
                    </div>
                </div>
                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>
                        {__('创建时间')}：
                    </div>
                    <div className={styles['detail-value']}>
                        {detailInfo?.created_at
                            ? formatTime(detailInfo?.created_at)
                            : '--'}
                    </div>
                </div>
                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>
                        {__('更新人')}：
                    </div>
                    <div className={styles['detail-value']}>
                        {detailInfo?.updated_name || '--'}
                    </div>
                </div>
                <div className={styles['detail-item']}>
                    <div className={styles['detail-label']}>
                        {__('更新时间')}：
                    </div>
                    <div className={styles['detail-value']}>
                        {detailInfo?.updated_at
                            ? formatTime(detailInfo?.updated_at)
                            : '--'}
                    </div>
                </div>
            </div>
        </Drawer>
    )
}

export default Details
