import {
    forwardRef,
    useEffect,
    useImperativeHandle,
    useMemo,
    useState,
} from 'react'
import moment from 'moment'
import { message, Table } from 'antd'
import { noop } from 'lodash'
import {
    Empty,
    ListDefaultPageSize,
    ListType,
    Loader,
    OptionBarTool,
    OptionMenuType,
} from '@/ui'
import { getSuffix, transUnit } from './helper'
import __ from './locale'
import FileIcon from '../FileIcon'
import {
    deleteDataCatalogFileAttachment,
    formatError,
    getFileAttachmentPreviewPdf,
    getFileResourceList,
} from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import styles from './styles.module.less'

const defaultPageSize = ListDefaultPageSize[ListType.WideList]

// 文件列表table

interface IFilesTable {
    allowRemove?: boolean
    id: string
    onListResCallback?: (res: any) => void
}

const FilesTable = forwardRef(
    (
        { allowRemove = false, id, onListResCallback = noop }: IFilesTable,
        ref,
    ) => {
        const [dataSource, setDataSource] = useState<any[]>([])
        const [queryParams, setQueryParams] = useState<{
            keyword?: string
            offset: number
            limit: number
        }>({
            keyword: '',
            offset: 1,
            limit: defaultPageSize,
        })
        const [loading, setLoading] = useState(true)
        const [total, setTotal] = useState(0)
        // 无关键词下总条数
        const [allTotalCount, setAllTotalCount] = useState(0)

        useEffect(() => {
            getFileList(queryParams)
        }, [queryParams, id])

        const handleKeywordChange = (val: string) => {
            setQueryParams({
                ...queryParams,
                keyword: val,
                offset: 1,
            })
        }

        /**
         * 获取文件列表
         * @returns
         */
        const getFileList = async (params?: any) => {
            try {
                setLoading(true)
                if (!id) {
                    setLoading(false)
                    return
                }
                const res = await getFileResourceList(id, params)
                setDataSource(res.entries)
                if (!params?.keyword) {
                    onListResCallback(res)
                    setAllTotalCount(res?.total_count)
                }
                setTotal(res.total_count)
            } catch (err) {
                formatError(err)
            } finally {
                setLoading(false)
            }
        }

        const onReload = () => {
            setQueryParams({
                ...queryParams,
                offset: 1,
                limit: defaultPageSize,
            })
        }

        useImperativeHandle<any, { onReload: () => void }>(ref, () => ({
            onReload,
            handleKeywordChange,
            allTotalCount,
        }))

        /**
         * 操作
         * @param key 操作类型
         * @param record 文件资源
         */
        const handleOperate = async (key: string, record: any) => {
            try {
                if (key === 'preview') {
                    // 如果预览oss_id和oss_id相同，则不进行预览
                    if (record.preview_oss_id === record.oss_id) {
                        message.warning(__('请稍后重试'))
                        return
                    }
                    const { href_url } = await getFileAttachmentPreviewPdf({
                        id: record.id,
                        preview_id: record.preview_oss_id,
                    })
                    window.open(href_url, '_blank')
                }
                if (key === 'remove') {
                    await deleteDataCatalogFileAttachment(record.id)
                    message.success(__('移除成功'))
                    setQueryParams({
                        ...queryParams,
                        offset: 1,
                    })
                }
            } catch (err) {
                formatError(err)
            }
        }

        const columns = [
            {
                title: __('文件名称'),
                dataIndex: 'name',
                key: 'name',
                ellipsis: true,
                render: (text, record) => {
                    if (!text) return '--'
                    const suffix = record.type ? record.type : getSuffix(text)
                    return (
                        <>
                            <FileIcon
                                suffix={suffix}
                                style={{
                                    marginRight: 8,
                                    verticalAlign: 'middle',
                                }}
                            />
                            <span title={text}>{text}</span>
                        </>
                    )
                },
            },
            {
                title: __('文件类型'),
                dataIndex: 'type',
                key: 'type',
                ellipsis: true,
                render: (_, record) => {
                    const { type } = record
                    if (!type) return '--'
                    return type
                },
            },
            {
                title: __('文件大小'),
                dataIndex: 'size',
                key: 'size',
                ellipsis: true,
                render: (text) => {
                    if (!text) return '--'
                    const { size, unit } = transUnit(text)
                    return `${size}${unit}`
                },
            },
            {
                title: __('更新时间'),
                dataIndex: 'created_at',
                key: 'created_at',
                ellipsis: true,
                render: (text) => {
                    if (!text) return '--'
                    return moment(text).format('YYYY-MM-DD HH:mm:ss')
                },
            },
            {
                title: __('操作'),
                dataIndex: 'operate',
                key: 'operate',
                ellipsis: true,
                render: (text, record) => {
                    const menus = [
                        {
                            title: __('预览'),
                            label: __('预览'),
                            key: 'preview',
                            menuType: OptionMenuType.Menu,
                        },
                        {
                            title: __('移除'),
                            label: __('移除'),
                            key: 'remove',
                            menuType: OptionMenuType.Menu,
                        },
                    ]
                    const buttonMenus = allowRemove
                        ? menus
                        : menus.filter((menuItem) => menuItem.key !== 'remove')

                    return (
                        <OptionBarTool
                            menus={buttonMenus}
                            onClick={(key) => {
                                handleOperate(key, record)
                            }}
                            getPopupContainer={(node) => node}
                        />
                    )
                },
            },
        ]

        return loading && dataSource.length === 0 ? (
            <div className={styles.emptyWrap}>
                <Loader />
            </div>
        ) : queryParams?.keyword || dataSource.length > 0 ? (
            <Table
                columns={columns}
                dataSource={dataSource}
                pagination={{
                    total,
                    pageSize: queryParams.limit,
                    current: queryParams.offset,
                    showTotal: (t) => `共 ${t} 条`,
                    showQuickJumper: true,
                    showSizeChanger: true,
                    hideOnSinglePage:
                        total < ListDefaultPageSize[ListType.WideList],
                    onChange: (page, pageSize) => {
                        setQueryParams({
                            ...queryParams,
                            offset: page,
                            limit: pageSize,
                        })
                    },
                }}
                loading={loading}
            />
        ) : (
            <div className={styles.emptyWrap}>
                <Empty
                    desc={
                        <span style={{ color: 'rgba(0, 0, 0, .65)' }}>
                            {__('暂无数据，请先添加附件')}
                        </span>
                    }
                    iconSrc={dataEmpty}
                />
            </div>
        )
    },
)

export default FilesTable
