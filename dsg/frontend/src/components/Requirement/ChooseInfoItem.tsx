import React, { useEffect, useState } from 'react'
import { Input, Modal, Table } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useAntdTable, useDebounce } from 'ahooks'
import styles from './styles.module.less'
import { formatError, getInfoItems, IInfoItem } from '@/core'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import { dataTypes } from './const'
import { SearchInput } from '@/ui'
import __ from './locale'

export interface ISearchCondition {
    current?: number
    pageSize?: number
    keyword?: string
}

interface IChooseInfoItem {
    open: boolean
    id: string
    onClose: () => void
    getInfoItem: (its: IInfoItem[]) => void
    selectedInfoItem?: IInfoItem[]
}
const ChooseInfoItem: React.FC<IChooseInfoItem> = ({
    open,
    id,
    onClose,
    getInfoItem,
    selectedInfoItem = [],
}) => {
    const [searchValue, setSearchValue] = useState('')
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
    const [selectedInfoItems, setSelectedInfoItems] = useState<any[]>([])
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        pageSize: 10,
        current: 1,
        keyword: '',
    })

    useEffect(() => {
        setSearchCondition({ ...searchCondition, keyword: searchValue })
    }, [searchValue])

    const onSelectChange = (newSelectedRowKeys: React.Key[], selectedRows) => {
        // 在全部选中项中将当前页数据全部去掉,留下其他页选中的数据
        const srks = selectedRowKeys.filter(
            (rk) => !tableProps.dataSource.find((item) => item.id === rk),
        )

        const siis = selectedInfoItems.filter(
            (rk) => !tableProps.dataSource.find((item) => item.id === rk.id),
        )

        // 将其他页选中的数据 与 当前页选中的数据拼起来 即为全部选中的数据
        setSelectedRowKeys([...srks, ...newSelectedRowKeys])
        setSelectedInfoItems([...siis, ...selectedRows])
    }

    const rowSelection = {
        selectedRowKeys,
        onChange: onSelectChange,
        getCheckboxProps: (record) => ({
            disabled: !!selectedInfoItem.find((r) => r.item_uuid === record.id),
        }),
    }

    const getData = async (params: any) => {
        if (!id) {
            return { total: 0, list: [] }
        }
        const { current: offset, pageSize: limit, keyword } = params

        try {
            const res = await getInfoItems(id, {
                offset,
                limit,
                keyword,
            })

            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getData, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (id && open) {
            run({ ...pagination, ...searchCondition })
        }
    }, [searchCondition, id, open])

    useEffect(() => {
        if (!open) {
            setSelectedRowKeys([])
            setSelectedInfoItems([])
            setSearchValue('')
        }
    }, [open])

    const columns = [
        {
            title: __('信息项名称'),
            dataIndex: 'name_cn',
            key: 'name_cn',
            ellipsis: true,
        },
        {
            title: __('字段名称'),
            dataIndex: 'column_name',
            key: 'column_name',
            ellipsis: true,
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_format',
            key: 'data_format',
            render: (val) => {
                if (typeof val === 'number') {
                    return dataTypes.find((d) => d.value === val)?.label
                }
                return '--'
            },
            ellipsis: true,
        },
    ]

    const handleClear = () => {
        setSelectedRowKeys([])
    }

    const handleOk = () => {
        onClose()
        getInfoItem(
            selectedInfoItems.map((s) => {
                return {
                    item_uuid: s.id,
                    data_type: s.data_format,
                    description: '',
                    item_name: s.name_cn,
                    column_name: s.column_name,
                }
            }),
        )
    }

    return (
        <Modal
            title={__('选择信息项')}
            open={open}
            onCancel={onClose}
            width={1000}
            getContainer={false}
            onOk={handleOk}
            destroyOnClose
            okButtonProps={{ disabled: selectedInfoItems.length === 0 }}
        >
            <div className={styles.chooseInfoWrapper}>
                <SearchInput
                    placeholder={__('信息项名称')}
                    value={searchValue}
                    onKeyChange={(kw: string) => setSearchValue(kw)}
                />
                <div className={styles.itemsCountWrapper}>
                    <span className={styles.itemsCount}>
                        {__('已选：')}
                        {`${selectedRowKeys.length}/${pagination.total}`}
                    </span>
                    <span className={styles.itemsClear} onClick={handleClear}>
                        {__('清空')}
                    </span>
                </div>
                {!searchValue && tableProps.dataSource.length === 0 ? (
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                ) : (
                    <Table
                        columns={columns}
                        rowSelection={rowSelection}
                        {...tableProps}
                        pagination={{
                            ...tableProps.pagination,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                        }}
                        locale={{ emptyText: <Empty /> }}
                        rowKey="id"
                    />
                )}
            </div>
        </Modal>
    )
}

export default ChooseInfoItem
