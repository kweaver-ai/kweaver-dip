import React from 'react'
import moment from 'moment'
import styles from './styles.module.less'

const Download = ({ props }: any) => {
    const {
        props: {
            data: {
                title,
                code,
                submitter_name,
                submit_time,
                apply_days,
                apply_reason,
            },
        },
    } = props

    return (
        <div className={styles.wrapper}>
            <div className={styles.text}>
                <div className={styles.clums}>目录名称：</div>
                <div className={styles.texts} title={title}>
                    {title || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>目录编号：</div>
                <div className={styles.texts} title={code}>
                    {code || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>申请人：</div>
                <div className={styles.texts} title={submitter_name}>
                    {submitter_name || ''}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>申请时间：</div>
                <div className={styles.texts}>
                    {moment(submit_time || '').format('YYYY-MM-DD HH:mm')}
                </div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>申请天数：</div>
                <div className={styles.texts}>{apply_days || ''}</div>
            </div>
            <div className={styles.text}>
                <div className={styles.clums}>申请理由：</div>
                <div className={styles.texts} title={apply_reason}>
                    {apply_reason || ''}
                </div>
            </div>
        </div>
    )
}

export default Download
