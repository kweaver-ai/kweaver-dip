import { Drawer, Timeline } from 'antd'
import { FC, useEffect, useState } from 'react'
import { formatError, getAuditLogs } from '@/core'
import __ from '../locale'
import { formatTime } from '@/utils'
import styles from './styles.module.less'
import { Loader } from '@/ui'

// 审核详情
interface AuditDetailProps {
    auditId: string // 审核ID
    onClose: () => void // 关闭
    open: boolean // 是否打开
}

const AuditDetail: FC<AuditDetailProps> = ({ auditId, onClose, open }) => {
    // 审核日志
    const [auditLogs, setAuditLogs] = useState<Array<any>>([])
    // 加载状态
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        if (auditId) {
            getAuditLogsList()
        }
    }, [auditId])

    /**
     * 获取审核日志列表
     */
    const getAuditLogsList = async () => {
        try {
            setLoading(true)
            const res = await getAuditLogs(auditId)
            const userTaskData = res.filter((item) =>
                ['userTask', 'autoPass', 'autoReject'].includes(item.act_type),
            )
            const auditorLogs = userTaskData.reduce((acc, item) => {
                if (item.act_type === 'userTask') {
                    return [...acc, ...item.auditor_logs.flat()]
                }
                return [...acc, item]
            }, [])
            setAuditLogs(auditorLogs)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    /**
     * 获取审核状态标签
     * @param item 审核日志
     * @returns 审核状态标签
     */
    const getAuditStatusLabel = (item: any) => {
        if (item?.act_type === 'autoPass') {
            return __('系统自动通过')
        }
        if (item?.act_type === 'autoReject') {
            return __('系统自动拒绝')
        }
        if (item?.audit_status === 'pass') {
            return __('已通过')
        }
        return __('已拒绝')
    }

    /**
     * 获取审核状态
     * @param item 审核日志
     * @returns 审核状态
     */
    const getAuditStatus = (item: any) => {
        return item?.act_type === 'autoPass' || item?.audit_status === 'pass'
    }

    return (
        <Drawer
            title={__('审核详情')}
            open={open}
            push={false}
            onClose={onClose}
            maskClosable={false}
            width={640}
            footer={null}
        >
            {loading ? (
                <div className={styles.auditDetailLoading}>
                    <Loader />
                </div>
            ) : (
                <div className={styles.auditDetailContainer}>
                    <Timeline>
                        {auditLogs.map((item) => (
                            <Timeline.Item
                                color={
                                    getAuditStatus(item) ? '#58C524' : '#FF4D50'
                                }
                            >
                                <div className={styles.auditStatus}>
                                    {getAuditStatusLabel(item)}
                                </div>
                                {item.audit_status && (
                                    <>
                                        <div className={styles.auditInfo}>
                                            {__('${name} 提交于 ${time}', {
                                                name: item.auditor_name,
                                                time: formatTime(item.end_time),
                                            })}
                                        </div>
                                        {item.audit_idea && (
                                            <div className={styles.auditIdea}>
                                                <span className={styles.label}>
                                                    {__('备注：')}
                                                </span>
                                                <span>{item.audit_idea}</span>
                                            </div>
                                        )}
                                    </>
                                )}
                            </Timeline.Item>
                        ))}
                    </Timeline>
                </div>
            )}
        </Drawer>
    )
}

export default AuditDetail
