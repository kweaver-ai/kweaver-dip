import { Radio, Space, Table, Tabs } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import { useAntdTable } from 'ahooks'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import styles from './styles.module.less'
import { formatTime } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import { Empty, Loader, SearchInput, LightweightSearch } from '@/ui'
import { RefreshBtn } from '../ToolbarComponents'
import {
    formatError,
    getTagAuditList,
    IAppCaseAuditType,
    TagDetailsType,
} from '@/core'
import Audit from './Audit'
import TagDetails from '@/components/BusinessTagClassify/Details'
import { searchData, auditTypeOptions } from './const'

const BusinessTagAuditList = () => {
    const [searchCondition, setSearchCondition] = useState({
        offset: 1,
        limit: 10,
        type: '',
        target: 'tasks',
    })
    const [auditOpen, setAuditOpen] = useState(false)
    const [detailDialogOpen, setDetailDialogOpen] = useState(false)
    const [auditAppCaseInfo, setAuditAppCaseInfo] = useState<any>()

    const columns: any = [
        {
            title: __('申请类型'),
            dataIndex: 'audit_type',
            key: 'audit_type',
            ellipsis: true,
            render: (val) =>
                auditTypeOptions.find((item) => item.value === val)?.label ||
                '--',
        },
        {
            title: __('申请内容'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            width: 300,
            render: (val, record) => {
                return (
                    <div className={styles.nameBox}>
                        <FontIcon
                            type={IconType.COLOREDICON}
                            name="icon-shujufenleifenji"
                            style={{
                                color: '#00B592',
                                fontSize: '20px',
                            }}
                        />
                        <span
                            title={val}
                            className={styles.name}
                            // onClick={() => {
                            //     setDetailDialogOpen(true)
                            //     setAuditAppCaseInfo(record)
                            // }}
                        >
                            {val}
                        </span>
                    </div>
                )
            },
        },
        {
            title: __('发起人'),
            dataIndex: 'apply_user_name',
            key: 'apply_user_name',
        },
        {
            title: __('发起时间'),
            dataIndex: 'apply_time',
            key: 'apply_time',
            render: (val) => formatTime(val),
        },
        {
            title: __('操作'),
            key: 'action',
            fixed: 'right',
            width: 180,
            render: (_, record) => (
                <Space size={8}>
                    <a
                        onClick={() => {
                            setAuditOpen(true)
                            setAuditAppCaseInfo(record)
                        }}
                    >
                        {__('审核')}
                    </a>
                    <a
                        onClick={() => {
                            setDetailDialogOpen(true)
                            setAuditAppCaseInfo(record)
                        }}
                    >
                        {__('详情')}
                    </a>
                </Space>
            ),
        },
    ]

    const renderEmpty = () => {
        return <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
    }

    const getAppCaseAuditList = async (params: any) => {
        try {
            const res = await getTagAuditList(params)

            return {
                total: Math.abs(res.total_count),
                list: res.entries,
            }
        } catch (error) {
            formatError(error)
            return {
                total: 0,
                list: [],
            }
        }
    }

    const { tableProps, run, pagination, loading } = useAntdTable(
        getAppCaseAuditList,
        {
            defaultPageSize: 10,
            manual: true,
        },
    )

    useEffect(() => {
        run(searchCondition)
    }, [searchCondition])

    return (
        <div className={styles['tag-audit']}>
            <div className={styles['tag-audit-top']}>
                <div className={styles['tag-audit-title']}>
                    {__('标签审核')}
                </div>
                <Space
                    size={8}
                    className={styles['bussinessTagClassify-top-searchBox']}
                >
                    <SearchInput
                        placeholder={__('搜索申请内容')}
                        onKeyChange={(value: string) => {
                            if (value) {
                                setSearchCondition((pre) => ({
                                    ...pre,
                                    // apply_user_names,abstracts
                                    keyword: value,
                                }))
                            }
                        }}
                        // 解决清除按钮接口调用2次
                        onChange={(e) => {
                            const { value } = e.target
                            if (!value) {
                                setSearchCondition((pre) => ({
                                    ...pre,
                                    keyword: undefined,
                                }))
                            }
                        }}
                        style={{ width: 272 }}
                    />
                    <LightweightSearch
                        formData={searchData}
                        onChange={(data, key) => {
                            setSearchCondition((pre) => ({
                                ...pre,
                                [key || '']: data[key || ''],
                            }))
                        }}
                        defaultValue={{ type: '' }}
                    />
                    <RefreshBtn onClick={() => run(searchCondition)} />
                </Space>
            </div>
            {loading ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !loading && tableProps.dataSource.length === 0 ? (
                <div className={styles.emptyWrapper}>{renderEmpty()}</div>
            ) : (
                <Table
                    columns={columns}
                    {...tableProps}
                    rowKey="id"
                    rowClassName={styles.tableRow}
                    className={styles.table}
                    onChange={(currentPagination) => {
                        setSearchCondition({
                            ...searchCondition,
                            offset: currentPagination?.current || 1,
                        })
                    }}
                    scroll={{
                        x: 1200,
                        y:
                            tableProps.dataSource.length === 0
                                ? undefined
                                : `calc(100vh - 278px)`,
                    }}
                    pagination={{
                        ...tableProps.pagination,
                        showSizeChanger: false,
                        hideOnSinglePage: true,
                    }}
                    locale={{ emptyText: <Empty /> }}
                />
            )}
            {auditOpen && auditAppCaseInfo && (
                <Audit
                    open={auditOpen}
                    onClose={() => {
                        setAuditOpen(false)
                        setAuditAppCaseInfo(undefined)
                        run(searchCondition)
                    }}
                    id={auditAppCaseInfo?.id || ''}
                    appCaseInfo={auditAppCaseInfo}
                    target={auditAppCaseInfo?.audit_type!}
                />
            )}
            {detailDialogOpen && auditAppCaseInfo?.id && (
                <TagDetails
                    open={detailDialogOpen}
                    id={auditAppCaseInfo?.id || ''}
                    showTreeInfo
                    showAuditInfo
                    type={TagDetailsType.audit}
                    onClose={() => setDetailDialogOpen(false)}
                />
            )}
        </div>
    )
}

export default BusinessTagAuditList
