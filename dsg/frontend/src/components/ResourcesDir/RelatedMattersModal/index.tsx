import { useAntdTable } from 'ahooks'
import { Button, Modal, Space, Table, Tag } from 'antd'
import { uniqBy } from 'lodash'
import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import dataEmpty from '@/assets/dataEmpty.svg'
import { searchData } from '@/components/BusinessMatters/const'
import { formatError, getBusinessMattersList } from '@/core'
import { LightweightSearch, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import __ from '../locale'
import { getDictItems } from '@/components/BusinessMatters/helper'
import styles from './styles.module.less'

interface IRelatedMattersModal {
    open: boolean
    onClose: () => void
    onOk: (list: any[]) => void
    initData?: any[]
}

const RelatedMattersModal: React.FC<IRelatedMattersModal> = ({
    open,
    initData,
    onClose,
    onOk,
}) => {
    const [loading, setLoading] = useState(false)
    const [searchValue, setSearchValue] = useState<string>('')
    const [searchCondition, setSearchCondition] = useState<any>({
        keyword: '',
        current: 1,
    })
    const [selectedData, setSelectedData] = useState<any[]>([])
    const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([])
    const [LightweightData, setLightweightData] = useState<any[]>(searchData)
    const [defaultValue, setDefaultValue] = useState<any>({
        type_key: '',
    })

    useEffect(() => {
        if (initData?.length) {
            setSelectedData(initData)
        }
    }, [initData])

    useEffect(() => {
        getTypeOptions()
    }, [])

    useEffect(() => {
        setSelectedRowKeys(selectedData?.map((item) => item.id))
    }, [selectedData])

    const isSearch = useMemo(() => {
        return !!searchCondition.type_key
    }, [searchCondition])

    useEffect(() => {
        run({ ...pagination, ...searchCondition })
    }, [searchCondition])

    useEffect(() => {
        if (searchValue === searchCondition.keyword) return
        setSearchCondition((pre) => ({
            ...pre,
            keyword: searchValue,
            current: 1,
        }))
    }, [searchValue])

    // 获取列表
    const getList = async (params: any) => {
        const {
            current: offset,
            pageSize: limit,
            keyword,
            sort,
            direction,
            type_key,
        } = params

        try {
            const res = await getBusinessMattersList({
                offset,
                limit,
                keyword,
                sort,
                direction,
                type_key,
            })
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getList, {
        defaultPageSize: 5,
        manual: true,
    })

    const columns = [
        {
            title: __('事项名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
        },
        {
            title: __('事项类型'),
            dataIndex: 'type_value',
            key: 'type_value',
            ellipsis: true,
            render: (text, record) => text || '--',
        },
        {
            title: __('来源部门'),
            dataIndex: 'department_name',
            key: 'department_name',
            ellipsis: true,
        },
        {
            title: __('材料数'),
            dataIndex: 'materials_number',
            key: 'materials_number',
            ellipsis: true,
        },
    ]

    // 自定义 rowSelection
    const rowSelection = {
        selectedRowKeys,
        onSelect: (record, selected, selecRows, nativeEvent) => {
            const list = selected
                ? uniqBy([...selectedData, record], 'id')
                : selectedData.filter((item) => item.id !== record.id)
            setSelectedData(list)
        },
        onSelectAll: (selected, selectedRows, changeRows) => {
            setSelectedData((pre) =>
                selected
                    ? [...pre, ...changeRows]
                    : pre.filter(
                          (o) => !changeRows?.map((i) => i.id)?.includes(o.id),
                      ),
            )
        },
    }

    const getTypeOptions = async () => {
        const res = await getDictItems()
        setLightweightData((pre) =>
            pre.map((o) => ({
                ...o,
                options: [{ label: '不限', value: '' }, ...res],
            })),
        )
    }

    return (
        <Modal
            title={__('关联事项')}
            width={640}
            maskClosable={false}
            open={open}
            onCancel={() => onClose()}
            destroyOnClose
            getContainer={false}
            okButtonProps={{ loading }}
            className={styles.modalWrapper}
            footer={[
                <Button
                    onClick={() => onClose()}
                    key="cancel"
                    style={{ minWidth: 80 }}
                >
                    {__('取消')}
                </Button>,
                <Button
                    type="primary"
                    disabled={!selectedData?.length}
                    onClick={() => {
                        onOk(selectedData)
                    }}
                    loading={loading}
                    key="confirm"
                    style={{ minWidth: 80 }}
                >
                    {__('确定')}
                </Button>,
            ]}
        >
            <div className={styles.modalContainer}>
                <div
                    className={classnames(
                        styles['fl-ct-space-bt'],
                        styles.title,
                    )}
                >
                    <span>
                        {__('已选(${total})：', {
                            total: selectedData?.length || '0',
                        })}
                    </span>
                    <Button
                        type="link"
                        onClick={() => {
                            setSelectedData([])
                        }}
                    >
                        {__('清空')}
                    </Button>
                </div>
                <div className={styles.tagBox}>
                    {selectedData?.map((o, index) => {
                        return (
                            <Tag
                                key={`${o}-${index}`}
                                closable
                                onClose={(e) => {
                                    e.preventDefault()
                                    const list = selectedData.filter(
                                        (tag) => tag.id !== o.id,
                                    )
                                    setSelectedData(list)
                                }}
                                className={styles.tagItem}
                            >
                                <span
                                    title={o?.name}
                                    className={styles.tagText}
                                >
                                    {o?.name}
                                </span>
                            </Tag>
                        )
                    })}
                </div>
                <div className={styles.tableBox}>
                    <div
                        className={classnames(
                            styles['fl-ct-space-bt'],
                            styles.tableSearch,
                        )}
                    >
                        <span>{__('事项列表')}</span>
                        <Space size={12}>
                            <SearchInput
                                className={styles.nameInput}
                                placeholder="搜索业务事项名称"
                                value={searchValue}
                                onKeyChange={(val: string) =>
                                    setSearchValue(val)
                                }
                            />
                            <LightweightSearch
                                formData={LightweightData}
                                onChange={(data, key) =>
                                    setSearchCondition((pre) => ({
                                        ...pre,
                                        [key || '']: data[key || ''],
                                    }))
                                }
                                defaultValue={defaultValue}
                            />
                        </Space>
                    </div>
                    {!isSearch &&
                    tableProps.dataSource.length === 0 &&
                    !tableProps.loading ? (
                        <div className={styles.emptyWrapper}>
                            <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                        </div>
                    ) : (
                        <Table
                            columns={columns}
                            {...tableProps}
                            rowKey="id"
                            scroll={{
                                y: 'calc(100vh - 250px)',
                            }}
                            rowSelection={rowSelection}
                            pagination={{
                                ...tableProps.pagination,
                                hideOnSinglePage: true,
                                showQuickJumper: true,
                                showTotal: (count) =>
                                    __('共${count}条', { count }),
                            }}
                            bordered={false}
                            locale={{
                                emptyText: <Empty />,
                            }}
                        />
                    )}
                </div>
            </div>
        </Modal>
    )
}

export default RelatedMattersModal
