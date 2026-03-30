import { AutoComplete, Button, Select, Space, Table } from 'antd'
import { memo, useEffect, useMemo, useRef, useState } from 'react'
import { IDatasheetField, formatError, searchUserDepart } from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { Empty, SearchInput } from '@/ui'
import AddVisitorModal from '../AddVisitorModal'
import { SearchItem } from '../AddVisitorModal/VisitorTree'
import { OptionType, useVisitorContext } from '../VisitorProvider'
import styles from './styles.module.less'
import Confirm from '@/components/Confirm'
import dataEmpty from '@/assets/dataEmpty.svg'
import { getDepartmentInfo } from '../helper'
import __ from '../locale'
import { Permission, PermissionOptions } from '../const'
import {
    DepartInfoItem,
    getDepartLabelByDepartments,
} from '@/components/AccessPolicy/helper'

export interface IVisitorCard {
    onChange?: (bindItems: any[]) => void
    value?: any
    fields?: IDatasheetField[]
    applierId?: string
    visitorPermission?: { [key: string]: Permission }
}

function VisitorCard({
    onChange,
    value,
    fields = [],
    applierId = '',
    visitorPermission = {},
}: IVisitorCard) {
    const userId = useCurrentUser('ID')
    const { bindItems, optBindItems, setBindItems } = useVisitorContext()
    const [addVisible, setAddVisible] = useState<boolean>(false)
    const isSearchRef = useRef<any>(false)
    const [keyword, setKeyword] = useState<string>()
    const [searchResult, setSearchResult] = useState<any[]>()
    const [sk, setSK] = useState<string>('')
    const [filterDataSource, setFilterDataSource] = useState<any[]>()
    const [delOpen, setDelOpen] = useState(false)
    const [operateItem, setOperateItem] = useState<any>()
    const [configOpen, setConfigOpen] = useState(false)

    useEffect(() => {
        if (sk) {
            const list = bindItems?.filter((o) => o?.subject_name?.includes(sk))
            setFilterDataSource(list)
        } else {
            setFilterDataSource([])
        }
    }, [sk, bindItems])

    useEffect(() => {
        setBindItems(value)
    }, [value])

    useEffect(() => {
        if (onChange && bindItems?.length) {
            onChange(bindItems)
        }
    }, [bindItems])

    const getVisitors = async (kw: string) => {
        try {
            const res = await searchUserDepart({ keyword: kw })
            // setSearchResult(
            //     res?.filter((current) => getUserIsVisitor(current)) ?? [],
            // )
            setSearchResult(res ?? [])
        } catch (error) {
            formatError(error)
        }
    }

    const handleAddItem = (item) => {
        if (!bindItems?.some((o) => o.subject_id === item.id)) {
            // 默认将库表字段选中
            optBindItems(OptionType.Add, [
                {
                    ...item,
                },
            ])
            setKeyword('')
        }
    }

    const options = useMemo(
        () =>
            searchResult?.map((o) => ({
                label: (
                    <SearchItem
                        data={o}
                        onClick={handleAddItem}
                        applierId={applierId}
                    />
                ),
                value: o.id,
            })),
        [searchResult],
    )

    useEffect(() => {
        if (keyword) {
            getVisitors(keyword)
        } else {
            setSearchResult([])
        }
    }, [keyword])

    const Columns: any = [
        {
            title: __('访问者'),
            dataIndex: 'subject_name',
            key: 'subject_name',
            ellipsis: true,
            render: (_, record) => record.subject_name || record.name,
        },
        {
            title: __('所属部门'),
            dataIndex: 'departments',
            key: 'departments',
            ellipsis: true,
            render: (arr: DepartInfoItem[][] | string, record) => {
                if (typeof arr === 'string') {
                    return arr
                }
                let name = ''
                let tip = ''
                const { showName, title } = getDepartmentInfo(arr)
                if (showName) {
                    name = showName
                    tip = title
                } else {
                    const info = getDepartLabelByDepartments(arr)
                    name = info.title
                    tip = info.tip
                }

                return <span title={tip}>{name}</span>
            },
        },
        {
            title: __('访问权限'),
            dataIndex: 'actions',
            key: 'actions',
            width: 280,
            render: (actions, record) => {
                return (
                    <Select
                        placeholder={__('请选择需申请的访问权限')}
                        options={PermissionOptions}
                        value={
                            actions?.includes(Permission.Download)
                                ? Permission.Download
                                : actions?.includes(Permission.Read)
                                ? Permission.Read
                                : undefined
                        }
                        disabled={
                            visitorPermission[record.subject_id] ===
                            Permission.Download
                        }
                        className={styles['permission-select']}
                        onChange={(e) => {
                            optBindItems(OptionType.Update, {
                                ...record,
                                actions:
                                    e === Permission.Download
                                        ? [Permission.Download, Permission.Read]
                                        : [Permission.Read],
                            })
                        }}
                    />
                )
            },
        },
        {
            title: __('操作'),
            key: 'action',
            width: 120,
            render: (_, record) => {
                return (
                    <Space size={16}>
                        {/* <Button
                            type="link"
                            onClick={() => {
                                setConfigOpen(true)
                                setOperateItem(record)
                            }}
                            disabled={!fields || fields?.length === 0}
                        >
                            {__('行列规则设置')}
                        </Button> */}
                        <a
                            onClick={() => {
                                setDelOpen(true)
                                setOperateItem(record)
                            }}
                        >
                            {__('删除')}
                        </a>
                    </Space>
                )
            },
        },
    ]

    const handleCompositionStart = () => {
        isSearchRef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        isSearchRef.current = false
    }

    const handleSure = (arr: any[]) => {
        // 默认将库表字段选中
        optBindItems(
            OptionType.Add,
            arr.map((item) => ({
                ...item,
            })),
        )
        setAddVisible(false)
    }

    const handleConfigRule = (data: any) => {
        optBindItems(OptionType.Update, { ...operateItem, ...data })
        setOperateItem(undefined)
        setConfigOpen(false)
    }

    return (
        <div className={styles['visitor-card']}>
            <div className={styles['visitor-card-search']}>
                <div className={styles['visitor-card-search-left']}>
                    <div className={styles['search-label']}>
                        {__('添加访问者：')}
                    </div>
                    <AutoComplete
                        dropdownMatchSelectWidth={252}
                        style={{ width: 320 }}
                        options={options}
                        maxLength={128}
                        value={keyword}
                        popupClassName={styles['search-select']}
                        notFoundContent={
                            keyword && (
                                <span style={{ color: 'rgba(0, 0, 0, 0.65)' }}>
                                    {__('抱歉，没有找到相关内容')}
                                </span>
                            )
                        }
                    >
                        <SearchInput
                            style={{ width: 320 }}
                            placeholder={__('搜索用户、部门可快速添加访问者')}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                            onKeyChange={(key) => {
                                if (!isSearchRef.current) {
                                    setKeyword(key)
                                }
                            }}
                        />
                    </AutoComplete>

                    <Button type="default" onClick={() => setAddVisible(true)}>
                        {__('组织架构中添加')}
                    </Button>
                </div>

                {/* <div className={styles['visitor-card-search-right']}>
                    <SearchInput
                        style={{ width: 280 }}
                        placeholder="搜索访问者"
                        onKeyChange={(key) => setSK(key)}
                    />
                </div> */}
            </div>
            <div className={styles['visitor-card-table']}>
                {!bindItems || bindItems?.length === 0 ? (
                    <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
                ) : (
                    <Table
                        columns={Columns}
                        dataSource={bindItems}
                        // scroll={{
                        //     y: `calc(100vh - 340px)`,
                        // }}
                        rowKey="subject_id"
                        locale={{
                            emptyText: (
                                <Empty
                                    desc={__('暂无数据')}
                                    iconSrc={dataEmpty}
                                />
                            ),
                        }}
                        pagination={false}
                    />
                )}
            </div>
            {addVisible && (
                <AddVisitorModal
                    visible={addVisible}
                    currentId={userId}
                    onSure={handleSure}
                    onClose={() => setAddVisible(false)}
                    applierId={applierId}
                />
            )}
            <Confirm
                title={__('确认要删除访问者${name}吗？', {
                    name: operateItem?.subject_name,
                })}
                open={delOpen}
                content={__('删除后该访问者权限将被移除，请确认操作。')}
                onOk={() => {
                    if (bindItems.length === 1) {
                        onChange?.([])
                    }
                    optBindItems(OptionType.Remove, operateItem)
                    setDelOpen(false)
                    setOperateItem(undefined)
                }}
                onCancel={() => {
                    setDelOpen(false)
                    setOperateItem(undefined)
                }}
            />
            {/* {configOpen && (
                <ColumnRuleConfig
                    open={configOpen}
                    onClose={() => setConfigOpen(false)}
                    fields={fields}
                    onOk={handleConfigRule}
                    data={operateItem}
                />
            )} */}
        </div>
    )
}

export default memo(VisitorCard)
