import { Table } from 'antd'
import { FC, useMemo, useRef } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import { Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { getDataTypeByStr } from '../helper'

/**
 * 空数据
 */
export const renderEmpty = (
    marginTop: number = 36,
    iconHeight: number = 144,
    desc: any = __('暂无数据'),
) => (
    <Empty
        iconSrc={dataEmpty}
        desc={desc || __('暂无数据')}
        style={{ marginTop, width: '100%' }}
        iconHeight={iconHeight}
    />
)

interface PushFieldDetailProps {
    targetFields: Array<any>
    sourceFields: Array<any>
}

const PushFieldDetail: FC<PushFieldDetailProps> = ({
    targetFields,
    sourceFields,
}) => {
    const container = useRef(null)

    const sourceTable = (dataSource: any) => (
        <Table
            dataSource={dataSource}
            columns={[
                {
                    title: __('字段名称'),
                    dataIndex: 'field_name',
                    key: 'field_name',
                    render: (value, record) => {
                        const { business_name, technical_name, primary_key } =
                            record
                        return (
                            <div className={styles.twoLine}>
                                <div className={styles.name_desc}>
                                    <span
                                        className={styles.firstLine}
                                        title={business_name}
                                    >
                                        {business_name}
                                    </span>
                                    {primary_key && (
                                        <span className={styles.primaryKey}>
                                            {__('主键')}
                                        </span>
                                    )}
                                </div>
                                <span
                                    className={styles.secondLine}
                                    title={technical_name}
                                >
                                    {technical_name || '--'}
                                </span>
                            </div>
                        )
                    },
                },
                {
                    title: __('数据类型'),
                    dataIndex: 'data_type',
                    key: 'data_type',
                    ellipsis: true,
                    render: (value) => value || '--',
                },
                {
                    title: __('数据长度'),
                    dataIndex: 'data_length',
                    key: 'data_length',
                    ellipsis: true,
                    render: (value) => value || '--',
                },
                {
                    title: __('注释'),
                    dataIndex: 'comment',
                    key: 'comment',
                    ellipsis: true,
                    render: (value) => value || '--',
                },
            ]}
            rowKey="field_id"
            rowClassName={styles.tableRow}
            className={styles.pushFieldTable}
            pagination={false}
            locale={{
                emptyText: renderEmpty(0, 104),
            }}
        />
    )

    const targetTable = (dataSource: any) => (
        <Table
            dataSource={dataSource}
            columns={[
                {
                    title: __('英文名称'),
                    dataIndex: 'technical_name',
                    key: 'technical_name',
                    ellipsis: true,
                    render: (value) => value || '--',
                },
                {
                    title: __('数据类型'),
                    dataIndex: 'data_type',
                    key: 'data_type',
                    ellipsis: true,
                    render: (value) => value || '--',
                },
                {
                    title: __('数据长度'),
                    dataIndex: 'data_length',
                    key: 'data_length',
                    ellipsis: true,
                    render: (value) => value || '--',
                },
                {
                    title: __('注释'),
                    dataIndex: 'comment',
                    key: 'comment',
                    ellipsis: true,
                    render: (value) => value || '--',
                },
            ]}
            rowKey="field_id"
            rowClassName={styles.tableRow}
            className={styles.pushFieldTable}
            pagination={false}
            locale={{
                emptyText: renderEmpty(0, 104),
            }}
        />
    )
    const arrowArr = useMemo(
        () => Array(sourceFields.length).fill('⇀'),
        [sourceFields],
    )
    return (
        <div className={styles.pushField}>
            <div className={styles.fieldTable}>
                <span className={styles.fieldTableTitle}>
                    {__('来源表字段')}
                </span>
                {sourceTable(sourceFields)}
            </div>
            <div className={styles.arrowArr}>
                {arrowArr.map((item, index) => (
                    <span key={index} className={styles.arrowItem}>
                        {item}
                    </span>
                ))}
            </div>
            <div className={styles.fieldTable}>
                <span className={styles.fieldTableTitle}>
                    {__('目标表字段')}
                </span>
                {targetTable(targetFields)}
            </div>
        </div>
    )
}
export default PushFieldDetail
