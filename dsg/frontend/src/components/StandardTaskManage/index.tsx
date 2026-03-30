import { FC, useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import { Progress, Space, Table, Tooltip } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { SearchInput } from '@/ui'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { formatError, getCompletedTasks, getUnCompletedTasks } from '@/core'
import dataEmpty from '@/assets/dataEmpty.svg'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import { OperateType } from './const'
import TaskDetail from './TaskDetail'
import TaskResolve from './TaskResolve'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

const initSearchCondition = {
    limit: 20,
    offset: 1,
    keyword: '',
}

interface StandardTaskManageType {}
const StandardTaskManage: FC<StandardTaskManageType> = () => {
    const [finishTabCheck, setFinishTabCheck] = useState<boolean>(false)
    const [query, setQuery] = useState<any>(initSearchCondition)
    const [unfinishedCount, setUnfinishedCount] = useState<number>()
    const [totalCount, setTotalCount] = useState<number>(0)
    const [loading, setLoading] = useState<boolean>(true)
    const [dataList, setDataList] = useState<Array<any>>([])
    const { checkPermission } = useUserPermCtx()
    const [viewDetailId, setViewDetailId] = useState<string>('')
    const [editDetailId, setEditDetailId] = useState<string>('')

    useEffect(() => {
        getTaskList(finishTabCheck, query)
    }, [query, finishTabCheck])

    const renderProgressBar = (text: string, record: any) => {
        const fenzi: number = Number(record.relation_field) || 0
        const fenmu: number = Number(record.total_field) || 0
        // 分子*100后，再除以分母
        const percent: number = (fenzi * 100) / fenmu
        return (
            // <ProgressSpan>
            <>
                <Progress
                    style={{ width: 70, marginRight: 5 }}
                    percent={percent}
                    showInfo={false}
                />
                {`${fenzi}/${fenmu}`}
            </>
            // </ProgressSpan>
        )
    }

    // 操作处理
    const handleOperate = async (type: OperateType, id: string) => {
        if (type === OperateType.DETAIL) {
            setViewDetailId(id)
        } else if (type === OperateType.EDIT) {
            setEditDetailId(id)
        }
    }
    // 是否至少有一种操作权限
    const hasOprAccess = useMemo(
        () => checkPermission('manageDataStandard'),
        [checkPermission],
    )

    // 未完成columns
    const unfinishedColumns: any = [
        {
            title: __('任务编号'),
            dataIndex: 'task_no',
            key: 'task_no',
            width: '10%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('业务表名称'),
            dataIndex: 'table',
            key: 'table',
            width: '10%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('业务表描述'),
            dataIndex: 'table_description',
            key: 'table_description',
            width: '18%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('业务字段'),
            dataIndex: 'table_field',
            key: 'table_field',
            width: '15%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('完成度'),
            dataIndex: 'complete_degree',
            key: 'complete_degree',
            width: '12%',
            render: (text: any, record: any, index: number) =>
                renderProgressBar(text, record),
        },
        {
            title: __('创建用户'),
            dataIndex: 'create_user',
            key: 'create_user',
            width: '8%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            // 2023-01-02 21:58:59
            title: __('创建时间'),
            dataIndex: 'create_time',
            key: 'create_time',
            width: '15%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        hasOprAccess
            ? {
                  title: __('操作'),
                  key: 'action',
                  fixed: 'right',
                  width: 100,
                  // text是指metadata字段对应的值，record就指整个一行需要的数据，
                  // record即businessFieldList下面每一项{"fieldName": "手机号1","fieldDescription": "字段描述","refStandardDoc","metadata": "数据元名称1",...}
                  // index表示Table表格数据的下标，也就是数组的下标从0开始
                  render: (text: any, record: any, index: number) => (
                      <Space size={16} className="tableOperate">
                          <div
                              className={styles.operate}
                              onClick={() =>
                                  handleOperate(OperateType.EDIT, record.id)
                              }
                          >
                              {__('处理')}
                          </div>
                      </Space>
                  ),
              }
            : {},
    ].filter((item) => item)

    // 已完成columns
    const finishedColumns: any = [
        {
            title: __('任务编号'),
            dataIndex: 'task_no',
            key: 'task_no',
            width: '10%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('业务表名称'),
            dataIndex: 'table',
            key: 'table',
            width: '10%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('业务表描述'),
            dataIndex: 'table_description',
            key: 'table_description',
            width: '18%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('业务字段'),
            dataIndex: 'table_field',
            key: 'table_field',
            width: '15%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: '创建用户',
            dataIndex: 'create_user',
            key: 'create_user',
            width: '8%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('操作用户'),
            dataIndex: 'update_user',
            key: 'update_user',
            width: '8%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('创建时间'),
            dataIndex: 'create_time',
            key: 'create_time',
            width: '15%',
            ellipsis: true,
            render: (text: any, record: any, index: number) => text || '--',
        },
        {
            title: __('操作'),
            key: 'action',
            fixed: 'right',
            width: 100,
            // text是指metadata字段对应的值，record就指整个一行需要的数据，
            // record即businessFieldList下面每一项{"fieldName": "手机号1","fieldDescription": "字段描述","refStandardDoc","metadata": "数据元名称1",...}
            // index表示Table表格数据的下标，也就是数组的下标从0开始
            render: (text: any, record: any, index: number) => (
                <div>
                    <div
                        className={styles.operate}
                        onClick={() =>
                            handleOperate(OperateType.DETAIL, record.id)
                        }
                    >
                        {__('详情')}
                    </div>
                </div>
            ),
        },
    ].filter((item) => item.key)

    const getTaskList = async (isFinish, params) => {
        try {
            setLoading(true)
            if (isFinish) {
                const { total_count, data } = await getCompletedTasks(params)
                setDataList(data)
                setTotalCount(total_count)
            } else {
                const { total_count, data } = await getUnCompletedTasks(params)
                setUnfinishedCount(total_count)
                setDataList(data)
                setTotalCount(total_count)
            }
        } catch (ex) {
            formatError(ex)
        } finally {
            setLoading(false)
        }
    }
    return (
        <div className={styles.taskManageWrapper}>
            <div className={styles.taskTitle}>{__('任务列表')}</div>
            <div className={styles.baseContentLayout}>
                <div className={styles.taskHeader}>
                    <div>
                        <span
                            className={classnames(
                                styles.normalStyle,
                                !finishTabCheck && styles.highlightStyle,
                            )}
                            onClick={() => {
                                setFinishTabCheck(false)
                                setQuery(initSearchCondition)
                            }}
                        >
                            {__('未完成(${count})', {
                                count: unfinishedCount || '0',
                            })}
                        </span>
                        <span
                            className={classnames(
                                styles.normalStyle,
                                finishTabCheck && styles.highlightStyle,
                            )}
                            onClick={() => {
                                setFinishTabCheck(true)
                                setQuery(initSearchCondition)
                            }}
                        >
                            {__('已完成')}
                        </span>
                    </div>
                    <div className="filterCondits">
                        <Space>
                            <Tooltip
                                title={__(
                                    '搜索任务编号、表名称、表描述、业务字段',
                                )}
                                overlayStyle={{
                                    maxWidth: '300px',
                                }}
                            >
                                <SearchInput
                                    style={{ height: 32, width: 272 }}
                                    placeholder={__(
                                        '搜索任务编号、表名称、表描述、业务字段',
                                    )}
                                    onKeyChange={(kw: string) =>
                                        setQuery({
                                            ...initSearchCondition,
                                            offset: 1,
                                            keyword: kw,
                                        })
                                    }
                                    value={query.keyword}
                                />
                            </Tooltip>
                            <RefreshBtn
                                onClick={() =>
                                    getTaskList(finishTabCheck, query)
                                }
                            />
                        </Space>
                    </div>
                </div>
                {loading ? (
                    <div style={{ width: '100%', height: '100%' }}>
                        <Loader />
                    </div>
                ) : !dataList?.length && query.keyword === '' ? (
                    <div className={styles.tableEmpty}>
                        <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                    </div>
                ) : (
                    <div className="task-content">
                        <Table
                            loading={loading}
                            bordered={false}
                            // 表格行 key 的取值，可以是字符串或一个函数
                            rowKey={(record: any) => record.id}
                            dataSource={dataList}
                            columns={
                                finishTabCheck
                                    ? finishedColumns
                                    : unfinishedColumns
                            }
                            scroll={{
                                x: 1000,
                                y: 'calc(100vh - 305px)',
                            }}
                            onChange={(newPagination) => {
                                setQuery({
                                    ...query,
                                    offset: newPagination.current,
                                    limit: newPagination.pageSize,
                                })
                            }}
                            pagination={{
                                current: query.offset,
                                pageSize: query.limit,
                                pageSizeOptions: [10, 20, 50, 100],
                                showQuickJumper: true,
                                responsive: true,
                                showLessItems: true,
                                showSizeChanger: true,
                                hideOnSinglePage: totalCount <= 10,
                                total: totalCount,
                                showTotal: (count) => {
                                    return `共 ${count} 条记录 第 ${
                                        query.offset
                                    }/${Math.ceil(count / query.limit)} 页`
                                },
                            }}
                        />
                    </div>
                )}
            </div>
            <TaskDetail
                visible={!!viewDetailId}
                onClose={() => {
                    setViewDetailId('')
                }}
                id={viewDetailId}
            />
            <TaskResolve
                visible={!!editDetailId}
                onClose={() => {
                    setEditDetailId('')
                }}
                id={editDetailId}
                afterOprReload={() => {
                    setQuery({
                        ...initSearchCondition,
                    })
                    setEditDetailId('')
                }}
            />
        </div>
    )
}
export default StandardTaskManage
