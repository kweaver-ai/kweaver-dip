import React, { useState } from 'react'
import classnames from 'classnames'
import moment from 'moment'
import DetailDialog from './DetailDialog'
import styles from './styles.module.less'
import __ from './locale'

const ApiServiceAudit = ({ props }: any) => {
    const {
        props: {
            data: {
                service_name,
                service_code,
                submitter_name,
                submit_time,
                service_id,
            },
            process: { audit_type },
        },
    } = props
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const noDetails = [
        'af-data-application-offline',
        'af-data-application-request',
    ]

    return (
        <div className={styles.wrapper}>
            <div className={styles.text}>
                <div className={styles.clums}>{__('接口名称：')}</div>
                <div className={styles.texts}>{service_name || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('接口编码：')}</div>
                <div className={styles.texts}>{service_code || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('发起人：')}</div>
                <div className={styles.texts} title={submitter_name || ''}>
                    {submitter_name || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('发起时间：')}</div>
                <div className={styles.texts}>
                    {moment(submit_time || '').format('YYYY-MM-DD HH:mm')}
                </div>
            </div>
            {!noDetails.includes(audit_type) && (
                <div className={styles.text}>
                    <div className={styles.clums}>{__('详情：')}</div>
                    <div
                        className={classnames(styles.texts, styles.link)}
                        onClick={() => setDetailDialogOpen(true)}
                    >
                        {__('查看全部')}
                    </div>
                </div>
            )}
            {detailDialogOpen ? (
                <DetailDialog
                    id={service_id}
                    open={detailDialogOpen}
                    onCancel={() => setDetailDialogOpen(false)}
                />
            ) : null}
        </div>
    )
}

export default ApiServiceAudit
