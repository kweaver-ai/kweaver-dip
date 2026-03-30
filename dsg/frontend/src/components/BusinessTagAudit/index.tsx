import React, { useState } from 'react'
import classnames from 'classnames'
import moment from 'moment'
import styles from './styles.module.less'
import __ from './locale'
import TagDetails from '@/components/BusinessTagClassify/Details'
import { TagDetailsType } from '@/core'

const DataViewAudit = ({ props }: any) => {
    const {
        props: {
            data: { title, submitter_name, submit_time, id },
            process: { audit_type },
        },
    } = props
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    return (
        <div className={styles.wrapper} id="wrapper">
            <div className={styles.text}>
                <div className={styles.clums}>{__('业务标签分类：')}</div>
                <div className={styles.texts}>{title || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('发起人：')}</div>
                <div className={styles.texts} title={submitter_name || ''}>
                    {submitter_name || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('发起时间：')}</div>
                <div className={styles.texts}>{submit_time}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('详情：')}</div>
                <div
                    className={classnames(styles.texts, styles.link)}
                    onClick={() => setDetailDialogOpen(true)}
                >
                    {__('查看详情')}
                </div>
            </div>
            {detailDialogOpen && (
                <TagDetails
                    open={detailDialogOpen}
                    id={id}
                    showTreeInfo
                    showAuditInfo
                    type={TagDetailsType.audit}
                    onClose={() => setDetailDialogOpen(false)}
                />
            )}
        </div>
    )
}

export default DataViewAudit
