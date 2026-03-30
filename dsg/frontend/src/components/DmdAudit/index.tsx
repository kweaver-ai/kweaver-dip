import React, { useState } from 'react'
import classnames from 'classnames'
import moment from 'moment'
import DetailDrawer from './DetailDrawer'
import styles from './styles.module.less'
import __ from './locale'

const DmdAuditApp = ({ props }: any) => {
    const {
        props: {
            data: { title, code, id, submit_time, analysis_id, description },
            name,
            process: { user_name },
        },
    } = props

    const [detailDialogOpen, setDetailDialogOpen] = useState(false)

    const viewDetail = () => {
        setDetailDialogOpen(true)
    }

    const handleCancel = () => {
        setDetailDialogOpen(false)
    }

    return (
        <div className={styles.wrapper}>
            <div className={styles.text}>
                <div className={styles.clums}>{__('需求名称：')}</div>
                <div className={styles.texts} title={title}>
                    {title}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('需求编码：')}</div>
                <div className={styles.texts}>{code}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('申请人：')}</div>
                <div className={styles.texts} title={user_name}>
                    {user_name}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('需求描述：')}</div>
                <div className={styles.texts} title={description}>
                    {description}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('申请时间：')}</div>
                <div className={styles.texts}>
                    {moment(submit_time || '').format('YYYY-MM-DD HH:mm')}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>{__('详情：')}</div>
                <div
                    className={classnames(styles.texts, styles.link)}
                    onClick={viewDetail}
                >
                    {__('查看详情')}
                </div>
            </div>
            {detailDialogOpen && (
                <DetailDrawer
                    id={id}
                    analysisId={analysis_id || ''}
                    open={detailDialogOpen}
                    onCancel={handleCancel}
                />
            )}
        </div>
    )
}

export default DmdAuditApp
