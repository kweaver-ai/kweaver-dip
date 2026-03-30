import React, { useState } from 'react'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
// import LogicViewDetail from './LogicViewDetail'
import LogicViewDetail from '@/components/DataAssetsCatlg/LogicViewDetail'

const DataViewAudit = ({ props }: any) => {
    const {
        props: {
            data: {
                business_name,
                uniform_catalog_code,
                submitter_name,
                submit_time,
                id,
            },
            process: { audit_type },
        },
    } = props
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    return (
        <div className={styles.wrapper} id="wrapper">
            <div className={styles.text}>
                <div className={styles.clums}>{__('库表名称：')}</div>
                <div className={styles.texts}>{business_name || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('库表编码：')}</div>
                <div className={styles.texts}>{uniform_catalog_code || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('申请人：')}</div>
                <div className={styles.texts} title={submitter_name || ''}>
                    {submitter_name || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('申请时间：')}</div>
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
                <LogicViewDetail
                    open={detailDialogOpen}
                    onClose={() => {
                        setDetailDialogOpen(false)
                    }}
                    showShadow={false}
                    id={id}
                />
            )}
        </div>
    )
}

export default DataViewAudit
