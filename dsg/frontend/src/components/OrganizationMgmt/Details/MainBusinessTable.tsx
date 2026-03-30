import { Table, Form, Input, Button, Space } from 'antd'
import React, { useEffect, useState } from 'react'
import __ from '../locale'
import styles from './styles.module.less'
import { SearchInput, Empty } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import { delOrgMainBusiness, formatError } from '@/core'

interface IMainBusinessTable {
    dataSource: any[]
    dataSourceChange: (data) => void
    id: string
}

const MainBusinessTable: React.FC<IMainBusinessTable> = ({
    dataSource,
    dataSourceChange,
    id,
}) => {
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const onSelectChange = (newSelectedRowKeys: any[]) => {
        setSelectedRowKeys(newSelectedRowKeys)
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
    }
    const columns: any = [
        {
            title: __('主干业务名称'),
            dataIndex: 'name',
            key: 'name',
            render: (text, record) => (
                <SearchInput
                    showIcon={false}
                    allowClear={false}
                    maxLength={128}
                    placeholder={__('请输入')}
                    value={text}
                    onKeyChange={(kw) => {
                        onChange(record, 'name', kw)
                    }}
                />
            ),
        },
        {
            title: __('主干业务简称'),
            dataIndex: 'abbreviation_name',
            key: 'abbreviation_name',
            render: (text, record) => (
                <SearchInput
                    showIcon={false}
                    allowClear={false}
                    maxLength={128}
                    value={text}
                    placeholder={__('请输入')}
                    onKeyChange={(kw) => {
                        onChange(record, 'abbreviation_name', kw)
                    }}
                />
            ),
        },
    ]

    // 添加
    const toAdd = () => {
        const list = [
            ...dataSource,
            { name: '', abbreviation_name: '', id: `${dataSource.length}` },
        ]
        dataSourceChange(list)
    }
    // 批量删除
    const pathDel = async () => {
        // 过滤新增id
        const ids = selectedRowKeys.filter((item) => item.length > 10)
        const list = dataSource.filter(
            (item) => !selectedRowKeys.includes(item.id),
        )
        dataSourceChange(list)
        if (ids.length) {
            try {
                await delOrgMainBusiness({ ids })
            } catch (err) {
                formatError(err)
            }
        }
    }

    // 修改名称
    const onChange = (
        record,
        key: 'name' | 'abbreviation_name',
        text: string,
    ) => {
        const list = dataSource.map((item) => {
            if (record.id === item.id) {
                return {
                    ...item,
                    [key]: text,
                }
            }
            return item
        })
        dataSourceChange(list)
    }

    return (
        <div className={styles.mainBusinessTableWrapper}>
            <Space size={16} className={styles.optBox}>
                <Button type="link" onClick={() => toAdd()}>
                    {__('添加')}
                </Button>
                <Button
                    type="link"
                    onClick={() => pathDel()}
                    disabled={!selectedRowKeys?.length}
                >
                    {__('批量删除')}
                </Button>
            </Space>
            <Table
                rowKey="id"
                rowSelection={rowSelection}
                columns={columns}
                dataSource={dataSource?.map((item, index) => ({
                    ...item,
                    id: item.id || `${index}`,
                }))}
                pagination={{ hideOnSinglePage: true }}
                locale={{
                    emptyText: (
                        <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                    ),
                }}
            />
        </div>
    )
}

export default MainBusinessTable
