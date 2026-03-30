import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { Button, Input, List, message, Pagination, Space } from 'antd'
import { SearchOutlined } from '@ant-design/icons'
import { useSize } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import { trim } from 'lodash'
import { AddOutlined, ImportOutlined, SortOutlined } from '@/icons'
import styles from './styles.module.less'
import DropDownFilter from '../DropDownFilter'
import EditFlowchart from './EditFlowchart'
import {
    IFlowchartItem,
    IFlowchartQueryParams,
    formatError,
    SortDirection,
    TaskExecutableStatus,
    TaskType,
    flowchartDelete,
    flowchartQueryItem,
    flowchartsQuery,
    transformQuery,
} from '@/core'
import Confirm from '../Confirm'
import { menus, SortType } from './const'
import FlowchartCardItem from './FlowchartCardItem'
import Loader from '@/ui/Loader'
import Empty from '@/ui/Empty'
import empty from '@/assets/emptyAdd.svg'
import searchEmpty from '@/assets/searchEmpty.svg'
import { TaskInfoContext } from '@/context'
import dataEmpty from '../../assets/dataEmpty.svg'
import { getActualUrl, OperateType, useQuery } from '@/utils'
import __ from './locale'
import { DrawioInfoContext } from '@/context/DrawioProvider'
import { ListDefaultPageSize, ListPagination, ListType } from '@/ui'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'

interface IContent {
    modelId: string
    domainId: number
    mainbusId?: string
}

// 初始搜索条件
const initialQueryParams = {
    offset: 1,
    limit: ListDefaultPageSize[ListType.CardList],
    direction: SortDirection.DESC,
    sort: SortType.CREATED,
    keyword: '',
}

const Flowchart: React.FC<IContent> = ({ modelId, domainId, mainbusId }) => {
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const taskDisabled = useMemo(() => {
        const { taskStatus, taskType, taskExecutableStatus } = taskInfo
        return (
            [TaskType.DATACOLLECTING, TaskType.DATAPROCESSING].includes(
                taskType,
            ) ||
            (taskExecutableStatus &&
                taskExecutableStatus !== TaskExecutableStatus.EXECUTABLE)
        )
    }, [taskInfo])

    const navigate = useNavigate()
    const query = useQuery()

    // load显示,【true】显示,【false】隐藏
    const [loading, setLoading] = useState(true)

    // 查询params
    const [queryParams, setQueryParams] =
        useState<IFlowchartQueryParams>(initialQueryParams)

    // 搜素关键字
    const [searchKey, setSearchKey] = useState('')

    // 总数
    const [total, setTotal] = useState(0)

    // 流程图编辑对话框操作类型
    const [modalType, setModalType] = useState(OperateType.CREATE)

    // 新建/编辑弹框显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 删除弹框显示,【true】显示,【false】隐藏
    const [delVisible, setDelVisible] = useState(false)

    // 请求加载
    const [isLoading, setIsLoading] = useState(false)

    // 流程图数据
    const [items, setItems] = useState<Array<IFlowchartItem>>([])

    // 单个操作对应流程图Item
    const [flowchartItem, setFlowchartItem] = useState<IFlowchartItem>()

    const { isDraft, selectedVersion } = useBusinessModelContext()
    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

    const ref = useRef<HTMLDivElement>(null)

    // 列表大小
    const size = useSize(ref)

    // 显示/隐藏搜索框
    const showSearch = useMemo(
        () => (items && items.length > 0) || queryParams.keyword !== '',
        [queryParams.keyword, items],
    )

    useEffect(() => {
        if (!modelId) {
            setLoading(false)
            return
        }
        setSearchKey('')
        setLoading(true)
        async function queryList() {
            await queryFlowcharts(initialQueryParams)
        }
        queryList()
    }, [modelId])

    // 查询流程图列表
    const queryFlowcharts = async (params: IFlowchartQueryParams) => {
        try {
            setLoading(true)
            const model = await flowchartsQuery(modelId, {
                ...params,
                ...versionParams,
            })
            setItems(model.entries)
            setQueryParams(params)
            setTotal(model.total_count)
        } catch (e) {
            formatError(e)
        } finally {
            setLoading(false)
        }
    }

    // 搜索框onChange
    const handleSearchValueChanged = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        queryFlowcharts({
            ...queryParams,
            keyword,
            offset: 1,
        })
    }

    // 排序方式改变
    const handleSortWayChange = (selectedMenu) => {
        if (showSearch) {
            queryFlowcharts({
                ...queryParams,
                offset: 1,
                direction: selectedMenu.sort,
                sort: selectedMenu.key,
            })
        }
    }

    // 页码onChange
    const handlePageChange = (page: number, pageSize: number) => {
        queryFlowcharts({
            ...queryParams,
            offset: page,
            limit: pageSize,
        })
    }

    // 创建流程图
    const handleCreate = () => {
        setModalType(OperateType.CREATE)
        setFlowchartItem(undefined)
        setEditVisible(true)
    }

    // 获取流程图详细信息
    const getFlowchartDetail = async (item): Promise<boolean> => {
        try {
            const res = await flowchartQueryItem(
                modelId,
                item.id,
                versionParams,
            )
            setFlowchartItem(res)
            return Promise.resolve(true)
        } catch (err) {
            formatError(err)
            queryFlowcharts({
                ...queryParams,
                offset:
                    items.length === 1
                        ? queryParams.offset! - 1 || 1
                        : queryParams.offset!,
            })
            setFlowchartItem(undefined)
            return Promise.resolve(false)
        }
    }

    // 编辑流程图信息
    const handleEdit = async (item: IFlowchartItem) => {
        const bo = await getFlowchartDetail(item)
        if (bo) {
            setModalType(OperateType.EDIT)
            setEditVisible(true)
        }
    }

    // 新建/编辑流程图成功
    const handleEditSure = async (item: IFlowchartItem) => {
        await queryFlowcharts({
            ...queryParams,
            offset: 1,
        })

        if (modalType !== OperateType.EDIT) {
            navigate(`/drawio${getUrlQuery(item)}&viewmode=0`)
        }

        setFlowchartItem(undefined)
    }

    // 查看流程图内容
    const handlePreview = async (item: IFlowchartItem) => {
        const bo = await getFlowchartDetail(item)
        if (bo) {
            navigate(`/drawio${getUrlQuery(item)}&viewmode=1`)
        }
    }

    // 编辑流程图内容
    const handleEditDrawio = async (item: IFlowchartItem) => {
        const bo = await getFlowchartDetail(item)
        if (bo) {
            navigate(`/drawio${getUrlQuery(item)}&viewmode=0`)
        }
    }

    const getUrlQuery = (item: IFlowchartItem) => {
        // 查看视角
        const viewType = query.get('viewType')
        // 任务相关
        const backUrl = query.get('backUrl')
        const projectId = query.get('projectId') || ''
        if (taskInfo?.taskId) {
            return `?viewType=${viewType}&mainbusId=${mainbusId}&mid=${modelId}&fid=${item?.id}&title=${item?.name}&saved=${item?.saved}&backUrl=${backUrl}&projectId=${projectId}&taskId=${taskInfo.taskId}&taskType=${taskInfo?.taskType}&taskStatus=${taskInfo?.taskStatus}&taskExecutableStatus=${taskInfo?.taskExecutableStatus}&isDraft=${isDraft}&versionId=${selectedVersion}`
        }
        return `?viewType=${viewType}&mainbusId=${mainbusId}&mid=${modelId}&fid=${item?.id}&title=${item?.name}&saved=${item?.saved}&isDraft=${isDraft}&versionId=${selectedVersion}`
    }

    // 删除流程图
    const handleDelete = async () => {
        try {
            setIsLoading(true)
            if (!flowchartItem) return
            await flowchartDelete(modelId, flowchartItem.id!, taskInfo.taskId)
            setIsLoading(false)
            message.success(__('删除成功'))
        } catch (e) {
            formatError(e)
        } finally {
            queryFlowcharts({
                ...queryParams,
                offset:
                    items.length === 1
                        ? queryParams.offset! - 1 || 1
                        : queryParams.offset!,
            })
            setFlowchartItem(undefined)
            setDelVisible(false)
            setIsLoading(false)
        }
    }

    // 流程图卡片
    const renderItem = (item: IFlowchartItem, index: number) => {
        return (
            <List.Item>
                <FlowchartCardItem
                    item={item}
                    onEdit={() => handleEdit(item)}
                    onPreview={() => handlePreview(item)}
                    onDelete={() => {
                        setFlowchartItem(item)
                        setDelVisible(true)
                    }}
                    onEditDrawio={() => handleEditDrawio(item)}
                />
            </List.Item>
        )
    }

    // 空白显示
    const showEmpty = () => {
        const isSearch = queryParams.keyword !== ''
        const desc = isSearch ? (
            <span>{__('抱歉，没有找到相关内容')}</span>
        ) : taskDisabled ? (
            <span>{__('暂无数据')}</span>
        ) : (
            <div>
                {__('点击')}
                <Button type="link" onClick={handleCreate}>
                    【{__('新建')}】
                </Button>
                {/* {__('按钮或')}
                <Button
                    type="link"
                    onClick={() => {
                        setEditVisible(true)
                        setModalType(OperateType.IMPORT)
                    }}
                >
                    【{__('导入流程图')}】
                </Button> */}

                {__('按钮,可新建业务流程图')}
            </div>
        )
        const icon = isSearch ? searchEmpty : taskDisabled ? dataEmpty : empty
        return <Empty desc={desc} iconSrc={icon} />
    }

    return (
        <div className={styles.content}>
            <div className={styles.opearteWrapper}>
                <span>
                    <Space size={12} hidden={taskDisabled}>
                        <Button
                            type="primary"
                            onClick={handleCreate}
                            disabled={items.length === 1}
                            icon={<AddOutlined />}
                        >
                            {__('新建')}
                        </Button>
                        {/* <Button
                            onClick={() => {
                                setEditVisible(true)
                                setModalType(OperateType.IMPORT)
                            }}
                            className={`${styles.operateBtn} ${styles.opearteWhite}`}
                        >
                            <ImportOutlined />
                            {__('导入流程图')}
                        </Button> */}
                    </Space>
                </span>
                {/* <span hidden={!showSearch}>
                    <Space>
                        <SearchInput
                            placeholder={__('请输入流程图名称/创建人')}
                            value={searchKey}
                            onKeyChange={(kw: string) => {
                                setSearchKey(kw)
                                if (kw === '') {
                                    handleSearchValueChanged(kw)
                                }
                            }}
                            onPressEnter={handleSearchValueChanged}
                            style={{ width: 272 }}
                        />
                        <DropDownFilter
                            menus={menus}
                            defaultMenu={{
                                key: SortType.CREATED,
                                sort: SortDirection.DESC,
                            }}
                            menuChangeCb={handleSortWayChange}
                            Icon={<Button icon={<SortOutlined />} />}
                        />
                    </Space>
                </span> */}
            </div>
            {loading ? (
                <div className={styles.empty}>
                    <Loader />
                </div>
            ) : items && items.length > 0 ? (
                <div ref={ref} className={styles.listWrapper}>
                    <List
                        grid={{
                            gutter: 20,
                            column:
                                (size?.width || 0) >= 1356
                                    ? 4
                                    : (size?.width || 0) >= 1012
                                    ? 3
                                    : (size?.width || 0) >= 668
                                    ? 2
                                    : 1,
                        }}
                        dataSource={items}
                        renderItem={renderItem}
                        className={styles.list}
                    />
                    <ListPagination
                        listType={ListType.CardList}
                        queryParams={queryParams}
                        totalCount={total}
                        onChange={handlePageChange}
                    />
                </div>
            ) : (
                <div className={styles.empty}>{showEmpty()}</div>
            )}
            <EditFlowchart
                visible={editVisible}
                operate={modalType}
                fid={flowchartItem?.id}
                modelId={modelId}
                onClose={() => {
                    setEditVisible(false)
                    setFlowchartItem(undefined)
                }}
                onSure={handleEditSure}
            />
            <Confirm
                open={delVisible}
                title={__('确认要删除流程图吗？')}
                content={__('流程图删除后将无法找回，请谨慎操作！')}
                onOk={() => handleDelete()}
                onCancel={() => setDelVisible(false)}
                width={432}
                okButtonProps={{ loading: isLoading }}
            />
        </div>
    )
}

export default Flowchart
