import { Col, Row, Table } from 'antd'
import classNames from 'classnames'
import React, { useEffect, useMemo, useState } from 'react'
import { useAntdTable } from 'ahooks'
import { CommonTitle } from '@/ui'
import { resourceDetailsFields, ResourceDetailsFieldType } from './helper'
import styles from './styles.module.less'
import {
    dataSource,
    formatError,
    getDataBaseDetails,
    reqDataCatlgColumnInfo,
} from '@/core'
import { ResTypeEnum } from '../helper'
import {
    analysisConfigApiFields,
    analysisConfigApiFieldsWithAppInfo,
} from '../Analysis/helper'
import { ApplyResource } from '../const'
import __ from '../locale'

interface ResourceDetailsProps {
    data: any
    isShowAppInfo?: boolean
}
const ResourceDetails = ({
    data,
    isShowAppInfo = false,
}: ResourceDetailsProps) => {
    const [loading, setLoading] = useState(false)
    const [queryParams, setQueryParams] = useState({
        current: 1,
        pageSize: 5,
        catalogId: data?.res_id,
    })
    const [dbInfo, setDBInfo] = useState<dataSource>()

    useEffect(() => {
        if (
            data.res_type === ResTypeEnum.Catalog &&
            data.apply_conf.supply_type === ApplyResource.Database
        ) {
            run({
                ...queryParams,
                current: 1,
            })
        }
    }, [queryParams])

    useEffect(() => {
        if (
            data.res_type === ResTypeEnum.Catalog &&
            data.apply_conf.supply_type === ApplyResource.Database
        ) {
            getDataBaseInfo()
        }
    }, [data])

    const getDataBaseInfo = async () => {
        const res = await getDataBaseDetails(
            data.apply_conf.view_apply_conf.dst_data_source_id,
        )
        setDBInfo(res)
    }

    const getColumnInfo = async (params) => {
        const {
            direction,
            keyword,
            sort,
            current: offset,
            pageSize: limit,
        } = params

        try {
            const res = await reqDataCatlgColumnInfo({
                catalogId: data?.res_id,
                direction,
                keyword,
                sort,
                offset,
                limit,
            })
            return {
                total: res?.total_count || 0,
                list: res?.columns || [],
            }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getColumnInfo, {
        defaultPageSize: 5,
        manual: true,
    })

    const rowSelection: any = useMemo(
        () => ({
            type: 'checkbox',
            selectedRowKeys:
                data.res_type === ResTypeEnum.Catalog &&
                data.apply_conf.supply_type === ApplyResource.Database
                    ? // 前者为分析时信息项
                      data?.column_ids?.split(',') ||
                      data?.apply_conf.view_apply_conf.column_ids.split(',')
                    : [],
        }),
        [data],
    )

    const getValue = (field: any) => {
        let val = data
        if (Array.isArray(field.key)) {
            field.key.forEach((key) => {
                val = val?.[key]
            })
        } else {
            val = data[field.key]
        }

        if (field.type === ResourceDetailsFieldType.Table) {
            return (
                <Table
                    rowKey={(record) => record.id}
                    columns={field.columns}
                    {...tableProps}
                    pagination={{
                        ...tableProps.pagination,
                        current: pagination.current,
                        pageSize: pagination.pageSize,
                        total: pagination.total,
                        hideOnSinglePage: pagination.total <= 5,
                        size: 'small',
                    }}
                    rowSelection={rowSelection}
                    className={styles['table-field']}
                />
            )
        }

        if (field.type === ResourceDetailsFieldType.Other) {
            return dbInfo?.[field.key]
        }

        if (field.render) {
            return field.render(val, data)
        }

        if (field.key.includes('ip_addr') && Array.isArray(val)) {
            return (
                <div className={styles['ip-container']}>
                    {val.map((item, ipIndex) => (
                        <div key={ipIndex} className={styles['ip-item']}>
                            {item.ip}
                        </div>
                    ))}
                </div>
            )
        }

        if (
            field.key.includes('res_name') &&
            data.apply_conf?.api_apply_conf?.data_res_type ===
                'service_register'
        ) {
            return (
                <div className={styles['res-name-container']}>
                    <div className={styles['res-name']} title={val}>
                        {val}
                    </div>
                    <div className={styles['res-type-flag']}>
                        {__('注册接口')}
                    </div>
                </div>
            )
        }

        return val || '--'
    }

    return (
        <div className={styles['resource-details-wrapper']}>
            {(data.res_type === ResTypeEnum.Catalog &&
            data.apply_conf.supply_type === ApplyResource.Database
                ? resourceDetailsFields
                : isShowAppInfo
                ? analysisConfigApiFieldsWithAppInfo
                : analysisConfigApiFields
            ).map((item, index) => {
                return (
                    <div key={index} className={styles['group-container']}>
                        <div className={styles['group-title']}>
                            <CommonTitle
                                title={item.title || item.groupTitle}
                            />
                        </div>
                        <Row>
                            {item.fields.map((field, fIdx) => {
                                return (
                                    <Col
                                        span={field.span || 12}
                                        key={fIdx}
                                        className={classNames(
                                            styles['field-item'],
                                            field.type ===
                                                ResourceDetailsFieldType.Table &&
                                                styles['table-field-item'],
                                        )}
                                    >
                                        <div className={styles['item-label']}>
                                            {field.label}：
                                        </div>
                                        <div className={styles['item-value']}>
                                            {getValue(field)}
                                        </div>
                                    </Col>
                                )
                            })}
                        </Row>
                    </div>
                )
            })}
        </div>
    )
}

export default ResourceDetails
