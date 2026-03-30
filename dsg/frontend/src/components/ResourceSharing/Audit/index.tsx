import React, { useEffect, useState } from 'react'
import { Button } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import SharingDrawer from '../SharingDrawer'
import { formatTime } from '@/utils'
import { applyResourceMap } from '../const'
import { PolicyType } from '@/components/AuditPolicy/const'
import { ResourceInvalidTag } from '../helper'
import { formatError, getShareApplyDetail, IShareApplyBasic } from '@/core'

/**
 * 资源共享相关审核内容
 */
const ResourceShareAudit = ({ props }: any) => {
    const {
        props: {
            data: {
                id,
                catalog_name,
                resource_name,
                resource_type,
                submit_time, // 资源申请审核
                updated_at, // 资源共享审核
            },
            process: { audit_type },
        },
        inAudit = true,
    } = props
    // 详情数据
    const [detailsData, setDetailsData] = useState<IShareApplyBasic>()
    const [showDetails, setShowDetails] = useState(false)

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getShareApplyDetail(id)
            setDetailsData(res?.basic_info)
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        if (id) {
            getDetails()
        }
    }, [id])

    return (
        <div className={styles.wrapper}>
            <div className={styles.text}>
                <div className={styles.clums}>{__('申请数据目录名称')}：</div>
                <div className={styles.textsWrap}>
                    <div className={styles.texts}>{catalog_name || ''}</div>
                    {detailsData?.catalog_status === 0 && (
                        <ResourceInvalidTag />
                    )}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('申请资源名称')}：</div>
                <div className={styles.texts}>{resource_name || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('资源类型')}：</div>
                <div className={styles.texts}>
                    {applyResourceMap?.[resource_type]?.text || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>
                    {audit_type === PolicyType.SSZDShareApplyEscalate
                        ? __('申请时间')
                        : __('更新时间')}
                    ：
                </div>
                <div className={styles.texts}>
                    {formatTime(
                        audit_type === PolicyType.SSZDShareApplyEscalate
                            ? submit_time
                            : updated_at,
                    )}
                </div>
            </div>
            <div className={styles.text}>
                <div className={classnames(styles.clums, styles.details)}>
                    {__('详情')}：
                </div>
                <a
                    className={classnames(styles.texts, styles.link)}
                    onClick={() => setShowDetails(true)}
                >
                    {__('查看全部')}
                </a>
            </div>
            {showDetails ? (
                <SharingDrawer
                    operate="view"
                    applyId={id}
                    open={showDetails}
                    fullScreen={false}
                    isModal={!inAudit}
                    onClose={() => {
                        setShowDetails(false)
                    }}
                />
            ) : null}
        </div>
    )
}

export default ResourceShareAudit
