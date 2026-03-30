import { useDebounceFn } from 'ahooks'
import { Button, Popconfirm, Space, Table, Tooltip } from 'antd'
import { ColumnsType } from 'antd/es/table'
import { SortOrder } from 'antd/lib/table/interface'
import { isNumber, trim } from 'lodash'
import React, {
    memo,
    useCallback,
    useContext,
    useEffect,
    useState,
} from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { TaskInfoContext } from '@/context'
import {
    deleteDataComprehension,
    formatError,
    getCatalogComprehensionListByTaskId,
    SortDirection,
    TaskStatus,
    updateComprehensionMark,
} from '@/core'
import { IRescCatlg } from '@/core/apis/dataCatalog/index.d'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { Loader, OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import { formatTime, OperateType } from '@/utils'
import { CatlgTreeNode, labelText } from '../ResourcesDir/const'
import { products, TabKey, totalOperates, UndsStatus, ViewMode } from './const'
import { UndsLabel } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IDataUndsListContent {
    activeTabKey?: string
    selectedNode: CatlgTreeNode
}

const DataUndsListContent: React.FC<IDataUndsListContent> = ({
    activeTabKey,
    selectedNode,
}) => {
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const navigator = useNavigate()
    const [searchParams] = useSearchParams()
    const backUrl = searchParams.get('backUrl')
    // 搜索关键字
    const [searchKey, setSearchKey] = useState('')
    // 加载
    const [loading, setLoading] = useState(true)
    const [fetching, setFetching] = useState(false)
    // 数据总数
    const [total, setTotal] = useState(0)
    // 目录数据集
    const [items, setItems] = useState<any[]>([])
    const [originItems, setOriginItems] = useState<any[]>([])
    const [templateId, setTemplateId] = useState<any>('')

    // 操作的目录
    const [curCatlg, setCurCatlg] = useState<IRescCatlg>()

    // 筛选值
    const [selectValue, setSelectValue] = useState<number>(0)

    // 创建表头排序
    const [tableSort, setTableSort] = useState<{
        [key: string]: SortOrder
    }>({
        name: null,
        updatedAt: 'descend',
        mountSourceName: null,
    })

    useEffect(() => {
        // if (activeTabKey) {
        setLoading(true)
        setSearchKey('')
        setSelectValue(0)
        setTotal(0)
        setItems([])
        getCatlgList()
        // }
    }, []) // activeTabKey, selectedNode

    useEffect(() => {
        setTaskInfo((prev) => ({
            ...prev,
            isAllPass:
                originItems?.length > 0 &&
                originItems.every(
                    (o) => o.report_status === UndsStatus.Understood,
                ),
        }))
    }, [originItems, setTaskInfo])

    // 获取目录列表
    const getCatlgList = async () => {
        if (fetching) return
        try {
            setFetching(true)
            const res = await getCatalogComprehensionListByTaskId(
                taskInfo?.taskId || '',
            )
            setTemplateId(res?.template_id)
            setOriginItems(res?.entries || [])
            setItems(res?.entries || [])
            setTotal(res?.entries?.length || 0)
        } catch (error) {
            formatError(error)
            setItems([])
            setTotal(0)
        } finally {
            setFetching(false)
            setLoading(false)
        }
    }

    useEffect(() => {
        if (searchKey) {
            const its = (originItems || []).filter((o) =>
                o?.catalog_name
                    ?.toLowerCase()
                    .includes(searchKey?.toLowerCase()),
            )
            setItems(its)
            setTotal(its?.length || 0)
        } else {
            setItems(originItems)
            setTotal(originItems?.length || 0)
        }
    }, [searchKey, originItems])

    // 搜索防抖
    const { run: searchFn } = useDebounceFn(getCatlgList, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    // 搜索框enter
    const handleSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setSearchKey(keyword)
    }

    // 进入画布url拼接
    const getUrlQuery = (url: string) => {
        // 任务信息
        if (taskInfo?.taskId) {
            return `${url}&backPrev=true&projectId=${taskInfo.projectId}&taskId=${taskInfo.taskId}&taskExecutableStatus=${taskInfo?.taskExecutableStatus}&arch=`
        }
        return `${url}&arch=`
    }

    // 操作处理
    const handleOperate = async (op: OperateType | string, item: any) => {
        setCurCatlg(item)
        switch (op) {
            case OperateType.PREVIEW:
                // remarkRed(item)
                navigator(
                    getUrlQuery(
                        `/dataComprehensionContent?cid=${item?.catalog_id}&templateId=${templateId}&tab=${TabKey.CANVAS}`,
                    ),
                )
                break
            case OperateType.EDIT:
                // remarkRed(item)
                navigator(
                    getUrlQuery(
                        `/dataComprehensionContent?mode=${ViewMode.EDIT}&cid=${item?.catalog_id}&templateId=${templateId}&tab=${TabKey.CANVAS}`,
                    ),
                )
                break
            case 'report':
                navigator(
                    getUrlQuery(
                        `/dataComprehensionContent?cid=${item?.catalog_id}&templateId=${templateId}&tab=${TabKey.REPORT}`,
                    ),
                )
                break
            default:
                break
        }
    }

    // 列表项
    const columns = (): ColumnsType<any> => {
        return [
            {
                title: (
                    <div>
                        <span>{__('关联数据资源目录名称')}</span>
                        <span style={{ color: 'rgba(0,0,0,0.65)' }}>
                            ({__('描述')})
                        </span>
                    </div>
                ),
                dataIndex: 'catalog_name',
                key: 'catalog_name',
                width: 200,
                render: (value, record) => (
                    <div>
                        <div
                            className={styles.catlgName}
                            title={labelText(value)}
                            onClick={() =>
                                handleOperate(OperateType.PREVIEW, record)
                            }
                        >
                            {labelText(value)}
                        </div>
                        <div
                            className={styles.catlgDesc}
                            title={labelText(record?.catalog_description)}
                        >
                            {labelText(record?.catalog_description)}
                        </div>
                    </div>
                ),
                ellipsis: true,
            },
            {
                title: __('库表'),
                dataIndex: 'view_name',
                key: 'view_name',
                width: 120,
                render: (_, record) => (
                    <div className={styles.ellipsisTitle}>
                        {labelText(record?.view_name)}
                    </div>
                ),
            },
            {
                title: __('报告状态'),
                dataIndex: 'report_status',
                key: 'report_status',
                width: 120,
                render: (_, record) => (
                    <UndsLabel type={record.report_status || 1} />
                ),
            },
            {
                title: __('更新时间'),
                dataIndex: 'comprehension_update_time',
                key: 'comprehension_update_time',
                width: 180,
                ellipsis: true,
                render: (_, record) => {
                    return isNumber(record.comprehension_update_time) &&
                        record.comprehension_update_time
                        ? formatTime(record.comprehension_update_time)
                        : '--'
                },
            },
            {
                title: __('操作'),
                key: 'action',
                width: 180,
                fixed: 'right',
                render: (_, record) => {
                    const btnList: any[] = [
                        {
                            key: OperateType.EDIT,
                            label:
                                record?.report_status === UndsStatus.Reject
                                    ? __('重新生成') // 未通过显示重新生成
                                    : __('生成报告'),
                            tips:
                                record?.report_status === UndsStatus.Reject ? (
                                    <div style={{ maxWidth: 200 }}>
                                        {__(
                                            '点击【重新生成】后，会将当前报告删除再重新生成新的报告',
                                        )}
                                    </div>
                                ) : undefined,
                            show:
                                taskInfo?.status &&
                                taskInfo?.status !== TaskStatus.COMPLETED,
                            disabled: [
                                UndsStatus.Auditing,
                                UndsStatus.Understood,
                            ].includes(record?.report_status),
                        },
                        {
                            key: 'report',
                            label: __('查看报告'),
                            show: true,
                        },
                    ]
                    return (
                        <Space size={16} className={styles.oprColumn}>
                            {btnList
                                .filter((o) => o.show)
                                .map((item) => {
                                    return (
                                        <Popconfirm
                                            title={item.tips}
                                            onConfirm={async () => {
                                                try {
                                                    if (
                                                        record?.report_status ===
                                                            UndsStatus.Reject &&
                                                        item.key ===
                                                            OperateType.EDIT
                                                    ) {
                                                        await deleteDataComprehension(
                                                            record?.catalog_id,
                                                        )
                                                    }
                                                    handleOperate(
                                                        item.key,
                                                        record,
                                                    )
                                                } catch (error) {
                                                    formatError(error)
                                                }
                                            }}
                                            disabled={!item.tips}
                                            okText={__('确定')}
                                            cancelText={__('取消')}
                                        >
                                            <Button
                                                type="link"
                                                key={item.key}
                                                onClick={(e) => {
                                                    e.stopPropagation()
                                                    if (
                                                        item.disabled ||
                                                        (item.key ===
                                                            OperateType.EDIT &&
                                                            record?.report_status ===
                                                                UndsStatus.Reject)
                                                    )
                                                        return
                                                    handleOperate(
                                                        item.key,
                                                        record,
                                                    )
                                                }}
                                                disabled={item.disabled}
                                            >
                                                {item.label}
                                            </Button>
                                        </Popconfirm>
                                    )
                                })}
                        </Space>
                    )
                },
            },
        ]
    }

    return (
        <div className={styles.dataUndsListContentWrap}>
            <div className={styles.topWrapper}>
                <div className={styles.leftWrapper}>
                    <div className={styles.leftTitle}>
                        {__('数据资源目录理解')}
                    </div>
                </div>
                <div className={styles.dulc_top} hidden={loading}>
                    <div className={styles.topRight}>
                        <Space size={12}>
                            <SearchInput
                                placeholder={__('搜索关联数据资源目录名称')}
                                value={searchKey}
                                onKeyChange={(kw: string) =>
                                    handleSearchPressEnter(kw)
                                }
                                onPressEnter={(e) => handleSearchPressEnter(e)}
                                style={{ width: 272 }}
                            />
                            <RefreshBtn onClick={() => searchFn()} />
                        </Space>
                    </div>
                </div>
            </div>
            {loading ? (
                <Loader />
            ) : (
                <div className={styles.dulc_bottom}>
                    <Table
                        columns={columns()}
                        dataSource={items}
                        loading={fetching}
                        pagination={{ position: [] }}
                        rowClassName={styles.tableRow}
                        scroll={{
                            x: 1000,
                            y:
                                items?.length > 0
                                    ? total > 10
                                        ? 'calc(100vh - 296px)'
                                        : 'calc(100vh - 248px)'
                                    : undefined,
                        }}
                        rowKey="id"
                        locale={{
                            emptyText: <Empty />,
                        }}
                    />
                </div>
            )}
        </div>
    )
}

export default memo(DataUndsListContent)
