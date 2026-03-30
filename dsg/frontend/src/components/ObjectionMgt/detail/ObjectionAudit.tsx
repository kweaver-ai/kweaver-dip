import React, { useState } from 'react'
import { Button } from 'antd'
import classnames from 'classnames'
import moment from 'moment'
import Details from './Details'
import styles from '../styles.module.less'
import __ from '../locale'
import { ObjectionMenuEnum } from '../helper'

interface ObjectionAuditProps {
    data: {
        title: string
        data_name: string
        id: string
        objection_type: string
        submit_time: string
    }
    process: {
        audit_type: string
    }
}

// 渲染文本行
const renderTextRow = (label: string, value: string) => (
    <div className={styles.text}>
        <div className={styles.clums}>{__(label)}</div>
        <div className={styles.texts}>{value}</div>
    </div>
)

const ObjectionAudit: React.FC<{ props: { props: ObjectionAuditProps } }> = ({
    props,
}) => {
    const { data, process } = props.props
    const [detailsVisible, setDetailsVisible] = useState(false)

    return (
        <div className={styles.wrapper}>
            {renderTextRow('异议标题', data.title || '')}
            {renderTextRow('数据目录/资源名称', data.data_name || '')}
            {renderTextRow('异议类型', data.objection_type || '')}
            {renderTextRow(
                '发起时间',
                moment(data.submit_time || '').format('YYYY-MM-DD HH:mm'),
            )}

            <div className={styles.text}>
                <div className={classnames(styles.clums, styles.details)}>
                    {__('详情：')}
                </div>
                <Button
                    className={classnames(styles.texts, styles.link)}
                    onClick={() => {
                        setDetailsVisible(true)
                    }}
                    type="text"
                >
                    {__('查看全部')}
                </Button>
            </div>
            {detailsVisible ? (
                <Details
                    open={detailsVisible}
                    menu={ObjectionMenuEnum.Handle}
                    item={data}
                    onDetailsClose={() => setDetailsVisible(false)}
                />
            ) : null}
        </div>
    )
}

export default ObjectionAudit
