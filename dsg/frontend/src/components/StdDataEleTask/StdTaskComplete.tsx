import React, {
    useState,
    useEffect,
    useMemo,
    useImperativeHandle,
    forwardRef,
} from 'react'
import { useAntdTable } from 'ahooks'
import { Input, Table, ConfigProvider } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import { ColumnsType } from 'antd/lib/table'
import { trim } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import { getStdCompletedTask, IStdCompletedTask, formatError } from '@/core'
import { formatTime } from '@/utils'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import Loader from '@/ui/Loader'
import { stdDataTypeList } from './const'

interface IStdTaskCompleteProps {
    ref?: any
    taskId: string
    judgeDataCallBack?: (data: any) => void
}

// 新建标准任务——已完成
const StdTaskComplete: React.FC<IStdTaskCompleteProps> = forwardRef(
    (taskProps: any, ref) => {
        const { taskId, judgeDataCallBack } = taskProps
        const [loading, setLoading] = useState(true)

        const [searchKey, setSearchKey] = useState<string>()

        useEffect(() => {
            if (taskId) {
                run({
                    ...queryParams,
                    keyword: searchKey || '',
                    current: 1,
                })
            }
        }, [taskId])

        const labelText = (text: string) => {
            return text || '--'
        }

        const column: ColumnsType<IStdCompletedTask> = [
            {
                title: '中文名称',
                dataIndex: 'standard_result',
                key: 'name',
                ellipsis: true,
                render: (item) => {
                    return <span>{labelText(item.name)}</span>
                },
            },
            {
                title: '英文名称',
                dataIndex: 'standard_result',
                key: 'name_en',
                ellipsis: true,
                render: (item) => {
                    return <span>{labelText(item.name_en)}</span>
                },
            },
            {
                title: '数据类型',
                dataIndex: 'standard_result',
                key: 'data_type',
                width: 128,
                ellipsis: true,
                render: (item) => {
                    const { data_type } = item
                    const changeType =
                        stdDataTypeList?.find(
                            (tItem) => tItem.value === data_type,
                        )?.label || data_type
                    return <span>{labelText(changeType)}</span>
                },
            },
            {
                title: '数据长度',
                dataIndex: 'standard_result',
                key: 'data_length',
                width: 128,
                ellipsis: true,
                render: (item) => {
                    return <span>{labelText(item.data_length)}</span>
                },
            },
            {
                title: '数据精度',
                dataIndex: 'standard_result',
                key: 'data_accuracy',
                width: 127,
                ellipsis: true,
                render: (item) => {
                    return <span>{labelText(item.data_accuracy)}</span>
                },
            },
            {
                title: '值域',
                dataIndex: 'standard_result',
                key: 'value_range',
                width: 100,
                ellipsis: true,
                render: (item) => {
                    return <span>{item.value_range || '--'}</span>
                },
            },
            {
                title: '来源字段名称',
                dataIndex: 'field_name',
                key: 'field_name',
                ellipsis: true,
                render: (item) => {
                    return <span>{labelText(item)}</span>
                },
            },
            {
                title: '来源业务表',
                dataIndex: 'form_name',
                key: 'form_name',
                ellipsis: true,
                render: (item) => {
                    return <span>{labelText(item)}</span>
                },
            },
            {
                title: '完成时间',
                dataIndex: 'end_at',
                key: 'end_at',
                ellipsis: true,
                render: (item) => {
                    return <span>{formatTime(item)}</span>
                },
            },
        ]

        // 初始params
        const initialQueryParams = {
            current: 1,
            pageSize: 10,
            keyword: '',
        }

        // 查询params
        const [queryParams, setQueryParams] = useState(initialQueryParams)

        const getComplTaskList = async (params) => {
            // if (!taskId) return
            try {
                setLoading(true)
                // 请求list
                const res = await getStdCompletedTask(taskId, params.keyword)

                setQueryParams({ ...params })
                return { total: res?.length || 0, list: res || [] }

                // 自测使用
                // setTableList(dataSourceTest)
                // const res = dataSourceTest
                // return { total: res?.length || 0, list: res || [] }
            } catch (error) {
                formatError(error)
                return { total: 0, list: [] }
            } finally {
                setLoading(false)
            }
        }

        const { tableProps, run, pagination } = useAntdTable(getComplTaskList, {
            defaultPageSize: 10,
            manual: true,
        })

        const props = useMemo(() => {
            const p: { dataSource; loading; onChange; [key: string]: any } =
                tableProps
            judgeDataCallBack?.(tableProps.dataSource)
            return p
        }, [tableProps])

        const handleSearchPressEnter = (e) => {
            const keyword = typeof e === 'string' ? e : trim(e.target.value)
            run({
                ...queryParams,
                keyword,
                current: 1,
            })
        }

        useImperativeHandle(ref, () => ({
            handleSearchPressEnter,
        }))

        // 空库表
        const showTableEmpty = () => {
            const desc = queryParams.keyword ? (
                <span>抱歉，没有找到相关内容</span>
            ) : (
                <span>暂无已完成字段</span>
            )
            const icon = searchKey ? searchEmpty : dataEmpty
            return <Empty desc={desc} iconSrc={icon} />
        }

        return (
            <div
                className={classnames(
                    styles.taskWrapper,
                    styles.taskCompWrapper,
                )}
            >
                <div className={styles.empty} hidden={!loading}>
                    <Loader />
                </div>

                <div
                    className={styles.newStdContent}
                    hidden={
                        loading ||
                        (!searchKey && !tableProps.dataSource?.length)
                    }
                >
                    <div className={styles.tableItem}>
                        <div className={styles.tableContent}>
                            <ConfigProvider
                                renderEmpty={() => showTableEmpty()}
                            >
                                <Table
                                    columns={column}
                                    {...props}
                                    pagination={{
                                        current: pagination.current,
                                        pageSize: pagination.pageSize,
                                        total: pagination.total,
                                        showSizeChanger: false,
                                        hideOnSinglePage: true,
                                    }}
                                    scroll={{
                                        x: 1600,
                                        y:
                                            pagination.total > 10
                                                ? 'calc(100vh - 368px)'
                                                : 'calc(100vh - 326px)',
                                    }}
                                />
                            </ConfigProvider>
                        </div>
                    </div>
                </div>
                {!loading &&
                    !searchKey &&
                    !tableProps.dataSource?.length &&
                    showTableEmpty()}
            </div>
        )
    },
)
export default StdTaskComplete
