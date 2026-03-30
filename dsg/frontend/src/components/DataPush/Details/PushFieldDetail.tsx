import React, { useEffect, useMemo, useRef, useState } from 'react'
import { Popover, Table } from 'antd'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from '../locale'
import { renderEmpty } from '../helper'
import { PrivacyProtectionTooltip } from './helper'
import { ListPagination, ListType } from '@/ui'
import PreviewDesensitizedTable, {
    PreviewBtn,
} from './PreviewDesensitizedTable'

interface IPushField {
    data: any
}

/**
 * 推送字段详情
 */
const PushFieldDetail: React.FC<IPushField> = ({ data }: any) => {
    const { sync_model_fields = [], is_desensitization, source_detail } = data
    const { fields } = source_detail
    const [offset, setOffset] = useState(1)
    const [limit, setLimit] = useState(10)

    const showTableData = useMemo(() => {
        return sync_model_fields.slice((offset - 1) * limit, offset * limit)
    }, [offset, limit, sync_model_fields])

    // 添加表格引用
    const sourceTableRef = useRef<HTMLDivElement>(null)
    const targetTableRef = useRef<HTMLDivElement>(null)
    const arrowArrRef = useRef<HTMLDivElement>(null)

    // 箭头数组
    const arrowArr = useMemo(
        () => Array(showTableData.length).fill('⇀'),
        [showTableData],
    )

    // // 修改滚动同步处理函数
    // const handleTableScroll = (e: Event, isSource: boolean) => {
    //     const { scrollTop } = e.target as HTMLElement
    //     if (isSource && targetTableRef.current) {
    //         const targetBody = targetTableRef.current?.querySelector(
    //             '.any-fabric-ant-table-body',
    //         )
    //         if (targetBody) {
    //             targetBody.scrollTop = scrollTop
    //         }
    //         if (arrowArrRef.current) {
    //             arrowArrRef.current.scrollTop = scrollTop
    //         }
    //     } else if (!isSource && sourceTableRef.current) {
    //         const sourceBody = sourceTableRef.current?.querySelector(
    //             '.any-fabric-ant-table-body',
    //         )
    //         if (sourceBody) {
    //             sourceBody.scrollTop = scrollTop
    //         }
    //         if (arrowArrRef.current) {
    //             arrowArrRef.current.scrollTop = scrollTop
    //         }
    //     }
    // }

    // // 添加滚动事件监听
    // useEffect(() => {
    //     const sourceBody = sourceTableRef?.current?.querySelector(
    //         '.any-fabric-ant-table-body',
    //     )
    //     const targetBody = targetTableRef?.current?.querySelector(
    //         '.any-fabric-ant-table-body',
    //     )
    //     if (sourceBody) {
    //         sourceBody.addEventListener('scroll', (e) =>
    //             handleTableScroll(e, true),
    //         )
    //     }
    //     if (targetBody) {
    //         targetBody.addEventListener('scroll', (e) =>
    //             handleTableScroll(e, false),
    //         )
    //     }
    //     return () => {
    //         if (sourceBody) {
    //             sourceBody.removeEventListener('scroll', (e) =>
    //                 handleTableScroll(e, true),
    //             )
    //         }
    //         if (targetBody) {
    //             targetBody.removeEventListener('scroll', (e) =>
    //                 handleTableScroll(e, false),
    //             )
    //         }
    //     }
    // }, [sync_model_fields])

    const sourceTable = (dataSource: any) => (
        <Table
            ref={sourceTableRef}
            dataSource={dataSource}
            columns={[
                {
                    title: __('字段名称'),
                    dataIndex: 'field_name',
                    key: 'field_name',
                    render: (value, record) => {
                        const { business_name, technical_name, primary_key } =
                            record.source_field
                        return (
                            <div className={styles.twoLine}>
                                <div className={styles.name_desc}>
                                    <span
                                        className={styles.firstLine}
                                        title={business_name}
                                    >
                                        {business_name}
                                    </span>
                                    {!!primary_key && (
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
                    render: (value, record) => {
                        const field = fields.find(
                            (item) =>
                                item.technical_name ===
                                record.source_field.technical_name,
                        )
                        return field?.original_data_type?.toLowerCase() || '--'
                        // getDataTypeByStr(getCommonDataType(value))?.label ||
                    },
                },
                {
                    title: __('数据长度'),
                    dataIndex: 'data_length',
                    key: 'data_length',
                    ellipsis: true,
                    render: (value, record) =>
                        record.source_field.data_length || '--',
                },
                {
                    title: __('注释'),
                    dataIndex: 'comment',
                    key: 'comment',
                    ellipsis: true,
                    render: (value, record) =>
                        record.source_field.comment || '--',
                },
                {
                    title: __('引用脱敏规则'),
                    dataIndex: 'reference_de_rule',
                    key: 'reference_de_rule',
                    render: (value, record) => (
                        <div className={styles.deRuleWrap}>
                            <span
                                className={styles.deRule}
                                title={record.desensitization_rule_name}
                            >
                                {record.desensitization_rule_name || '--'}
                            </span>
                            {record.desensitization_rule_name && (
                                <PreviewBtn
                                    fieldData={{
                                        ...record,
                                        id: record.field_id,
                                    }}
                                />
                            )}
                        </div>
                    ),
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
            ref={targetTableRef}
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
                    render: (value) =>
                        // getDataTypeByStr(getCommonDataType(value))?.label ||
                        value?.toLowerCase() || '--',
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

    return (
        <div className={classnames(styles.pushFieldDetail)}>
            <div className={styles.pushField}>
                <div className={styles.fieldTable}>
                    <span className={styles.fieldTableTitle}>
                        {__('来源表字段')}
                        <span className={styles.privacyProtection}>
                            {is_desensitization === 1
                                ? __('已启用隐私数据保护')
                                : __('未启用隐私数据保护')}
                            <PrivacyProtectionTooltip />
                        </span>
                    </span>
                    {sourceTable(showTableData)}
                </div>
                <div className={styles.arrowArr}>
                    <div className={styles.place} />
                    <div className={styles.arrows}>
                        {arrowArr.map((item, index) => (
                            <span key={index} className={styles.arrowItem}>
                                {item}
                            </span>
                        ))}
                    </div>
                </div>
                <div className={styles.fieldTable}>
                    <span className={styles.fieldTableTitle}>
                        {__('目标表字段')}
                    </span>
                    {targetTable(showTableData)}
                </div>
            </div>
            {sync_model_fields.length > 10 && (
                <div className={styles.paginationTable}>
                    <ListPagination
                        listType={ListType.WideList}
                        queryParams={{
                            offset,
                            limit,
                        }}
                        totalCount={sync_model_fields.length}
                        onChange={(page, pageSize) => {
                            setOffset(page)
                            setLimit(pageSize)
                        }}
                        hideOnSinglePage={sync_model_fields.length <= 10}
                    />
                </div>
            )}
        </div>
    )
}

export default PushFieldDetail
