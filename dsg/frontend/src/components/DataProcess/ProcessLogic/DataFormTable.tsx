import React, { useEffect, useState, useMemo } from 'react'
import { useAntdTable } from 'ahooks'
import { Button, Input, Space, Table, Tooltip, message } from 'antd'
import e from 'express'
import { InfoCircleOutlined } from '@ant-design/icons'
import { formatError, getDataCatalogSamples, previewFormData } from '@/core'
import styles from '../styles.module.less'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import empty from '../../../assets/dataEmpty.svg'
import __ from '../locale'
import DataTypeIcons from '@/components/DataSynchronization/Icons'
import { splitDataType } from '../helper'
import { CopyOutlined } from '@/icons'

interface DataFormTableType {
    dataFormInfo: any
}
const DataFormTable = ({ dataFormInfo }: DataFormTableType) => {
    const [dataColumns, setDataColumns] = useState<Array<any>>([])
    const [loading, setLoading] = useState<boolean>(true)

    useEffect(() => {
        run({ ...pagination, current: 1 })
    }, [dataFormInfo])

    const initTableData = async () => {
        try {
            setLoading(true)
            const res = await previewFormData({
                datasource_id: dataFormInfo.datasource_id,
                table_name: dataFormInfo.table_name,
            })
            const { total_count, data, columns } = res

            setDataColumns(
                columns?.map((item) => {
                    const { newType } = splitDataType(item.type)
                    return {
                        title: (
                            <div title={item.name} style={{ display: 'flex' }}>
                                <DataTypeIcons type={newType} />
                                <span style={{ marginLeft: '8px' }}>
                                    {item.name}
                                </span>
                            </div>
                        ),
                        dataIndex: item.name,
                        key: item.name,
                        ellipsis: true,
                        render: (value) => {
                            return (
                                <div className={styles.tableTDContnet}>
                                    {value}
                                </div>
                            )
                        },
                    }
                }) || [],
            )
            setLoading(false)

            return {
                total: total_count || 0,
                list: data?.map(
                    (currentData) =>
                        currentData.reduce((preData, columnsData, index) => {
                            return {
                                ...preData,
                                [columns[index].name]: columnsData,
                            }
                        }, {}) || [],
                ),
            }
        } catch (ex) {
            formatError(ex)
            setLoading(false)
            return Promise.reject(ex)
        }
    }
    const { tableProps, run, pagination } = useAntdTable(initTableData, {
        defaultPageSize: 20,
        manual: true,
    })

    const props: any = useMemo(() => {
        const p: { dataSource; loading; onChange; [key: string]: any } =
            tableProps
        return p
    }, [tableProps])
    return (
        <div
            style={{
                width: '100%',
            }}
        >
            <div
                style={{
                    margin: '24px 16px 0',
                }}
            >
                <Space>
                    <span>{__('数据表标识：')}</span>
                    <Input.Group compact>
                        <Input
                            style={{ width: '600px' }}
                            readOnly
                            defaultValue={`${dataFormInfo.catalog_name}.${dataFormInfo.schema}.${dataFormInfo.table_name}`}
                        />
                        <Tooltip title={__('复制')} placement="bottom">
                            <Button
                                icon={<CopyOutlined />}
                                onClick={() => {
                                    navigator.clipboard.writeText(
                                        `${dataFormInfo.catalog_name}.${dataFormInfo.schema}.${dataFormInfo.table_name}`,
                                    )
                                    message.success(__('复制成功'))
                                }}
                            />
                        </Tooltip>
                    </Input.Group>
                    <Tooltip
                        title={__('可复制“数据表标识”到编辑器使用')}
                        placement="right"
                        color="#fff"
                        overlayInnerStyle={{
                            color: 'rgba(0,0,0,0.65)',
                            minWidth: '260px',
                        }}
                    >
                        <InfoCircleOutlined />
                    </Tooltip>
                </Space>
            </div>
            <div
                style={{
                    height: `calc(100% - 100px)`,
                }}
            >
                {loading ? (
                    <div
                        style={{
                            display: 'flex',
                            marginTop: '120px',
                        }}
                    >
                        <Loader />
                    </div>
                ) : tableProps?.dataSource?.length > 0 ? (
                    <div
                        className={styles.tableWrapper}
                        style={{
                            height: 'calc(100% - 24px)',
                            padding: 16,
                            width: '100%',
                        }}
                    >
                        <Table
                            {...props}
                            columns={dataColumns}
                            className={styles.sampleTable}
                            rowKey={(record) => record.index}
                            pagination={false}
                            dataSource={tableProps.dataSource}
                            bordered={false}
                            rowSelection={null}
                            scroll={{
                                y: 'calc(100vh - 280px)',
                                x: dataColumns.length * 200,
                            }}
                        />
                    </div>
                ) : (
                    <div
                        style={{
                            marginTop: 120,
                        }}
                    >
                        <Empty desc={__('暂无数据')} iconSrc={empty} />
                    </div>
                )}
            </div>
        </div>
    )
}

export default DataFormTable
