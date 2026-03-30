import React, { useState, useEffect, useRef } from 'react'
import { useUpdateEffect } from 'ahooks'
import { Drawer, Descriptions, Table } from 'antd'
import { trim } from 'lodash'
import { SearchInput } from '@/ui'
import {
    formatError,
    getDataDictItems,
    IDataDictItem,
    IGetDataDictItemsParams,
    IDataDictBasicInfo,
} from '@/core'
import searchEmpty from '@/assets/searchEmpty.svg'
import { renderAnchor, renderContent, renderEmpty } from './helper'
import styles from './styles.module.less'
import __ from './locale'

interface IDetails {
    // 是否打开
    open: boolean
    // 数据
    item: IDataDictBasicInfo | undefined
    // 关闭
    onDetailsClose: () => void
}

// 抽取通用的样式配置
const descriptionStyles = {
    labelStyle: {
        width: 120,
        flex: 'none' as const,
        color: 'rgba(0 0 0 / 45%)',
        padding: '4px 8px',
    },
    contentStyle: {
        padding: '4px 8px',
        flex: 'auto',
    },
}

// 创建通用的 Descriptions 组件
const CommonDescriptions = ({
    items,
}: {
    items: Array<{ label: string; value: any; isDate?: boolean }>
}) => (
    <Descriptions
        bordered
        column={1}
        labelStyle={descriptionStyles.labelStyle}
        contentStyle={descriptionStyles.contentStyle}
    >
        {items.map(({ label, value, isDate }) => (
            <Descriptions.Item key={label} label={__(label)} span={1}>
                {renderContent(value, isDate)}
            </Descriptions.Item>
        ))}
    </Descriptions>
)

const DetailSection = ({
    title,
    content,
}: {
    title: string
    content: React.ReactNode
}) => (
    <div className={styles.detailSectionWrapper}>
        <div className={styles.title}>{title}</div>
        <div>{content}</div>
    </div>
)

const initSearchCondition: IGetDataDictItemsParams = {
    limit: 5,
    offset: 1,
    name: '',
    dict_id: '',
}

const Details = ({ open, item, onDetailsClose }: IDetails) => {
    // 表格数据加载中
    const [fetching, setFetching] = useState<boolean>(false)
    // 字典项
    const [tableData, setTableData] = useState<IDataDictItem[]>()
    // 总条数
    const [total, setTotal] = useState<number>(0)
    // 搜索条件
    const [searchCondition, setSearchCondition] =
        useState<IGetDataDictItemsParams>()

    const container = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (open) {
            setSearchCondition({
                ...initSearchCondition,
                dict_id: item?.id,
            })
        }
    }, [item, open])

    // 定义表格列
    const columns = [
        {
            title: __('值'),
            dataIndex: 'dict_key',
            key: 'dict_key',
            width: 100,
            ellipsis: true,
            render: (text: string) => text || '--',
        },
        {
            title: __('名称'),
            dataIndex: 'dict_value',
            key: 'dict_value',
            width: 150,
            ellipsis: true,
            render: (text: string) => text || '--',
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            key: 'description',
            ellipsis: true,
            render: (text: string) => text || '--',
        },
    ]

    useUpdateEffect(() => {
        if (searchCondition) {
            getDictItems({ ...searchCondition })
        }
    }, [searchCondition])

    // 获取表格数据
    const getDictItems = async (params: any) => {
        try {
            setFetching(true)
            const itemRes = await getDataDictItems(params)
            setTableData(itemRes?.entries)
            setTotal(itemRes?.total_count)
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    // 关键字搜索
    const handleKwSearch = (kw) => {
        if (kw === searchCondition?.name) return
        setSearchCondition((prev) => ({
            ...prev,
            name: kw,
            offset: 1,
        }))
    }

    // 分页改变
    const onPaginationChange = (page) => {
        setSearchCondition((prev) => ({
            ...prev,
            offset: page || 1,
        }))
    }

    return (
        <Drawer
            title={__('数据字典详情')}
            placement="right"
            onClose={onDetailsClose}
            open={open}
            width={640}
            maskClosable={false}
            bodyStyle={{ overflow: 'hidden' }}
            destroyOnClose
        >
            <div className={styles.detailsWrapper} ref={container}>
                <div className={styles.detailsContentWrapper}>
                    <div id="detailsBasic">
                        <DetailSection
                            title={__('基本属性')}
                            content={
                                <CommonDescriptions
                                    items={[
                                        {
                                            label: __('数据字典名称'),
                                            value: item?.name,
                                        },
                                        {
                                            label: __('字典类型'),
                                            value: item?.dict_type,
                                        },
                                        {
                                            label: __('描述'),
                                            value: item?.description,
                                        },
                                        // {
                                        //     label: __('是否省市直达'),
                                        //     value: item?.sszd_flag
                                        //         ? __('是')
                                        //         : __('否'),
                                        // },
                                    ]}
                                />
                            }
                        />
                    </div>
                    <div id="detailsItems" className={styles.section}>
                        <div className={styles.titleWrapper}>
                            <div className={styles.title}>{__('字典项')}</div>
                            <SearchInput
                                value={searchCondition?.name}
                                style={{ width: 150 }}
                                maxLength={64}
                                placeholder={__('搜索值或名称')}
                                onKeyChange={handleKwSearch}
                                onPressEnter={(
                                    e: React.KeyboardEvent<HTMLInputElement>,
                                ) => {
                                    handleKwSearch(trim(e.currentTarget.value))
                                }}
                            />
                        </div>
                        <div className={styles.content}>
                            <Table
                                loading={fetching}
                                columns={columns}
                                dataSource={tableData}
                                rowKey="value"
                                pagination={{
                                    current: searchCondition?.offset,
                                    pageSize: searchCondition?.limit,
                                    total,
                                    onChange: onPaginationChange,
                                    size: 'small',
                                    simple: true,
                                    position: ['bottomRight'],
                                }}
                                size="middle"
                                bordered
                                className={styles.dictTable}
                                locale={{
                                    emptyText: renderEmpty({
                                        desc: __('抱歉，没有找到相关内容'),
                                        iconSrc: searchEmpty,
                                    }),
                                }}
                            />
                        </div>
                    </div>
                    <div id="detailsVersion" className={styles.section}>
                        <DetailSection
                            title={__('版本信息')}
                            content={
                                <CommonDescriptions
                                    items={[
                                        {
                                            label: __('当前版本号'),
                                            value: item?.version,
                                        },
                                        {
                                            label: __('最终修改人'),
                                            value: item?.updater_name,
                                        },
                                        {
                                            label: __('最终修改时间'),
                                            value: item?.updated_at,
                                            isDate: true,
                                        },
                                        {
                                            label: __('创建人'),
                                            value: item?.creator_name,
                                        },
                                        {
                                            label: __('创建时间'),
                                            value: item?.created_at,
                                            isDate: true,
                                        },
                                    ]}
                                />
                            }
                        />
                    </div>
                </div>

                {renderAnchor({ container })}
            </div>
        </Drawer>
    )
}

export default Details
