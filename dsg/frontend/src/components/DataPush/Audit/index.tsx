import React, { useEffect, useState } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import DataPushDrawer from '../DataPushDrawer'
import { formatTime } from '@/utils'
import { auditTypeMap, DataPushAction } from '../const'
import { formatError, getDataPushDetail, IDataPushDetail } from '@/core'

/**
 * 数据推送相关审核内容
 */
const DataPushAudit = ({ props }: any) => {
    const {
        props: {
            data: { id, name, operation, audit_time },
        },
    } = props
    // 详情数据
    const [detailsData, setDetailsData] = useState<IDataPushDetail>()
    const [showDetails, setShowDetails] = useState(false)

    // 获取信息
    const getDetails = async () => {
        try {
            const res = await getDataPushDetail(id)
            setDetailsData(res)
        } catch (error) {
            formatError(error)
        }
    }

    // useEffect(() => {
    //     if (id) {
    //         getDetails()
    //     }
    // }, [id])

    return (
        <div className={styles.wrapper}>
            <div className={styles.text}>
                <div className={styles.clums}>{__('数据推送名称')}：</div>
                <div className={styles.textsWrap}>
                    <div className={styles.texts}>{name || ''}</div>
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('类型')}：</div>
                <div className={styles.texts}>
                    {auditTypeMap?.[operation]?.text || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('申请时间')}：</div>
                <div className={styles.texts}>
                    {formatTime(audit_time * 1000)}
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
                <DataPushDrawer
                    operate={DataPushAction.Detail}
                    dataPushId={id}
                    open={showDetails}
                    onClose={() => {
                        setShowDetails(false)
                    }}
                />
            ) : null}
        </div>
    )
}

export default DataPushAudit
