import { Drawer, Timeline } from 'antd'
import { useEffect, useState } from 'react'
import { isNumber } from 'lodash'
import moment from 'moment'
import __ from './locale'
import styles from './styles.module.less'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    formatError,
    getSSZDResourceAuditRecord,
    ISSZDAuditLevel,
    ISSZDAuditRecordItem,
    ISSZDReportAuditStatus,
} from '@/core'
import { AuditStatusMap } from './const'
import { auditLevel } from '../ResourceDirReport/const'
import { Empty, Loader } from '@/ui'

interface IAuditRecordModal {
    item: any
    onClose?: () => void
}

const AuditFlowItem = ({ item }: any) => {
    const {
        audit_level,
        audit_comment,
        audit_status,
        reporter_name,
        report_time,
    } = item || {}

    const cur = AuditStatusMap.find((o) => o.value === audit_status)

    const color = cur?.color || 'rgba(0,0,0,0.3)'

    const status = cur?.label || __('待审核')

    const level =
        auditLevel?.find((o) => o.value === audit_level)?.label || '--'

    const time = isNumber(report_time)
        ? moment(report_time).format('YYYY-MM-DD HH:mm:ss')
        : '--'

    return (
        <Timeline.Item color={color}>
            <div className={styles['audit-status']}>
                {status}（{level}）
            </div>
            <div className={styles['audit-info']}>
                <div className={styles['audit-info-time']}>
                    {audit_level === ISSZDAuditLevel.City ? (
                        <span>
                            {reporter_name}
                            {'  '}
                            {__('提交于')}
                            {'  '}
                        </span>
                    ) : (
                        <span style={{ marginRight: '12px' }}>
                            {__('时间')}:
                        </span>
                    )}
                    <span>{time}</span>
                </div>
                <div className={styles['audit-info-remark']}>
                    <span>{__('备注')}: </span>
                    <span>{audit_comment}</span>
                </div>
            </div>
        </Timeline.Item>
    )
}

function AuditRecordModal({ item, onClose }: IAuditRecordModal) {
    const [loading, setLoading] = useState<boolean>(false)
    const [data, setData] = useState<ISSZDAuditRecordItem[]>([])

    useEffect(() => {
        if (item?.resource_key) {
            getAuditRecord(item?.resource_key)
        }
    }, [item])

    const getAuditRecord = async (key: string) => {
        try {
            setLoading(true)
            const res = await getSSZDResourceAuditRecord(key)
            setData(res?.entries || [])
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    return (
        <Drawer
            open
            title={
                <span style={{ fontWeight: 550, fontSize: 16 }}>
                    {__('审核详情')}
                </span>
            }
            onClose={onClose}
            maskClosable={false}
            width={640}
        >
            <div className={styles['audit-record']}>
                {loading ? (
                    <div style={{ paddingTop: '64px' }}>
                        <Loader />
                    </div>
                ) : data?.length ? (
                    <Timeline>
                        {data.map((it) => (
                            <AuditFlowItem item={it} key={it?.record_id} />
                        ))}
                    </Timeline>
                ) : (
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                )}
            </div>
        </Drawer>
    )
}

export default AuditRecordModal
