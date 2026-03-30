import { Button, List, message, Space, Spin, Table } from 'antd'
import { useEffect, useRef, useState } from 'react'

import {
    AppstoreOutlined,
    ExclamationCircleFilled,
    TableOutlined,
} from '@ant-design/icons'
import { useSize, useUpdateEffect } from 'ahooks'
import { useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import DragBox from '@/components/DragBox'
import { RefreshBtn, SortBtn } from '@/components/ToolbarComponents'
import {
    deleteSceneAnalysis,
    formatError,
    ICatalogItem,
    ISceneItem,
    querySceneAnalysisList,
} from '@/core'
import { AddOutlined } from '@/icons'
import {
    ListDefaultPageSize,
    ListPagination,
    ListType,
    OptionBarTool,
    OptionMenuType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import { formatTime, OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import DropDownFilter from '../DropDownFilter'
import CatalogTree from './CatalogTree'
import { defaultMenu, menus, ModuleType } from './const'
import CreateScene from './CreateScene'
import { sceneAnalFormatError } from './helper'
import __ from './locale'
import SceneListCard from './SceneListCard'
import styles from './styles.module.less'

interface ICoreBusinessesParams {
    direction: string
    keyword?: string
    limit?: number
    offset?: number
    type?: string
    sort?: string
    catalog_id?: string
}

type ViewMode = 'table' | 'card'

const SceneAnalysis = () => {
    const [createVisible, setCreateVisible] = useState(false)
    const [operateType, setOperateType] = useState(OperateType.CREATE)
    const navigator = useNavigate()
    const [keyword, setKeyword] = useState('')
    const [sceneCardList, setSceneCardList] = useState<ISceneItem[]>([])
    const [total, setTotal] = useState(0)
    const [viewMode, setViewMode] = useState<ViewMode>('table')
    const [searchCondition, setSearchCondition] =
        useState<ICoreBusinessesParams>({
            limit: ListDefaultPageSize[ListType.WideList],
            offset: 1,
            sort: defaultMenu.key,
            direction: defaultMenu.sort,
            keyword,
        })
    const [loading, setLoading] = useState(false)
    const [operateItem, setOperateItem] = useState<ISceneItem>()
    const [selectedCatalog, setSelectedCatalog] = useState<
        ICatalogItem | undefined
    >(undefined)
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const ref = useRef<HTMLDivElement>(null)

    // 列表大小
    const size = useSize(ref)
    const col = size
        ? (size?.width || 0) >= 1356
            ? 4
            : (size?.width || 0) >= 1012
            ? 3
            : (size?.width || 0) >= 668
            ? 2
            : 1
        : 3

    useEffect(() => {
        getSceneListData()
    }, [searchCondition])

    useUpdateEffect(() => {
        if (keyword === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword,
            offset: 1,
        })
    }, [keyword])

    // 获取场景分析列表
    const getSceneListData = async () => {
        try {
            setLoading(true)
            const res = await querySceneAnalysisList({
                ...searchCondition,
            })
            setSceneCardList(res?.entries || [])
            setTotal(res.total_count)
        } catch (error) {
            formatError(error)
            setSceneCardList([])
            setTotal(0)
        } finally {
            setLoading(false)
        }
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
    }

    // 场景操作处理
    const handleOperate = (op: OperateType, item?) => {
        setOperateItem(item)
        setOperateType(op)
        switch (op) {
            case OperateType.CREATE:
            case OperateType.EDIT:
                setCreateVisible(true)
                break
            case OperateType.DELETE:
                confirm({
                    title: __('确认要删除场景分析吗？'),
                    icon: (
                        <ExclamationCircleFilled className={styles.delIcon} />
                    ),
                    content: __('删除后该场景分析将无法找回，请谨慎操作！'),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk() {
                        delScene(item)
                    },
                })
                break
            case OperateType.PREVIEW:
                navigator(
                    `/sceneGraph?sceneId=${item.id}&operate=${OperateType.EDIT}&module=${ModuleType.SceneAnalysis}`,
                )
                break
            default:
                break
        }
    }

    // 删除
    const delScene = async (item) => {
        try {
            await deleteSceneAnalysis(item.id)
            message.success(__('删除成功'))
            setSearchCondition({
                ...searchCondition,
                offset:
                    sceneCardList.length === 1
                        ? (searchCondition.offset || 1) - 1 || 1
                        : searchCondition.offset,
            })
        } catch (error) {
            sceneAnalFormatError(
                ModuleType.SceneAnalysis,
                navigator,
                error,
                () => {
                    setSearchCondition({
                        ...searchCondition,
                        offset: 1,
                    })
                },
                '无法删除',
            )
        }
    }

    // 新建/编辑 场景
    const handleCreateEdit = (info) => {
        if (info && operateType === OperateType.CREATE) {
            navigator(
                `/sceneGraph?sceneId=${info.id}&operate=${OperateType.CREATE}&module=${ModuleType.SceneAnalysis}`,
            )
        } else {
            setSearchCondition({
                ...searchCondition,
                offset:
                    operateType === OperateType.CREATE
                        ? 1
                        : searchCondition.offset,
            })
        }
    }

    // 空库表
    const renderEmpty = () => {
        // 未搜索 没数据
        if (total === 0 && !searchCondition.keyword) {
            return <Empty desc={__('暂无数据')} iconSrc={dataEmpty} />
        }
        if (total === 0 && searchCondition.keyword) {
            return <Empty />
        }
        return null
    }

    const handlePageChange = (offset: number, limit: number) => {
        setSearchCondition({ ...searchCondition, offset, limit })
    }

    // 表格操作项
    const getTableOptions = () => {
        const optionMenus = [
            {
                key: OperateType.EDIT,
                label: __('编辑基本信息'),
                menuType: OptionMenuType.Menu,
            },
            {
                key: OperateType.DELETE,
                label: __('删除'),
                menuType: OptionMenuType.Menu,
            },
        ]

        return optionMenus
    }
    const handleSelectCatalog = (node: ICatalogItem | undefined) => {
        setSelectedCatalog(node)
        setSearchCondition({
            ...searchCondition,
            offset: 1,
            catalog_id: node?.id,
        })
    }

    // 表格列定义
    const tableColumns = [
        {
            title: __('场景分析名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (text: string, record: ISceneItem) => (
                <span
                    className={styles.tableName}
                    title={text || '--'}
                    onClick={() => handleOperate(OperateType.PREVIEW, record)}
                >
                    {text || '--'}
                </span>
            ),
        },
        {
            title: __('场景分类'),
            dataIndex: 'catalog_name',
            key: 'catalog_name',
            ellipsis: true,
            render: (text: string, record: any) => text || '--',
        },
        {
            title: __('描述'),
            dataIndex: 'desc',
            key: 'desc',
            ellipsis: true,
            render: (text: string) => text || '--',
        },
        {
            title: __('更新时间'),
            dataIndex: 'updated_at',
            key: 'updated_at',
            render: (time: number) => formatTime(time) || '--',
        },
        {
            title: __('操作'),
            key: 'action',
            width: 160,
            render: (_: any, record: ISceneItem) => {
                return (
                    <OptionBarTool
                        menus={getTableOptions() as any[]}
                        onClick={(key, e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            handleOperate(key as OperateType, record)
                        }}
                    />
                )
            },
        },
    ]

    return (
        <div className={styles.sceneAnalysisWrapper} ref={ref}>
            <div className={styles.contentWrapper}>
                <DragBox
                    defaultSize={defaultSize}
                    expandCloseText={__('分类')}
                    minSize={[280, 400]}
                    maxSize={[600, Infinity]}
                    onDragEnd={(dragSize) => setDefaultSize(dragSize)}
                >
                    <div className={styles.leftTree}>
                        <div className={styles.treeTitle}>{__('场景分类')}</div>
                        <CatalogTree onSelect={handleSelectCatalog} />
                    </div>
                    <div className={styles.rightContent}>
                        <div className={styles.top}>
                            <div className={styles.topLeft}>
                                <div className={styles.titleWrap}>
                                    {__('场景分析')}
                                </div>
                                <Button
                                    type="primary"
                                    icon={<AddOutlined />}
                                    onClick={() =>
                                        handleOperate(OperateType.CREATE)
                                    }
                                >
                                    {__('新建场景分析')}
                                </Button>
                            </div>
                            <Space size={12} className={styles.topRight}>
                                <SearchInput
                                    style={{ width: 272 }}
                                    placeholder={__('搜索场景分析名称')}
                                    onKeyChange={(kw: string) => {
                                        if (kw === searchCondition?.keyword)
                                            return
                                        setSearchCondition({
                                            ...searchCondition,
                                            offset: 1,
                                            keyword: kw,
                                        })
                                        setKeyword(kw)
                                    }}
                                />
                                <Space size={0}>
                                    <Button
                                        type="text"
                                        icon={
                                            viewMode === 'table' ? (
                                                <AppstoreOutlined />
                                            ) : (
                                                <TableOutlined />
                                            )
                                        }
                                        onClick={() =>
                                            setViewMode(
                                                viewMode === 'table'
                                                    ? 'card'
                                                    : 'table',
                                            )
                                        }
                                        title={
                                            viewMode === 'table'
                                                ? __('切换为卡片')
                                                : __('切换为表格')
                                        }
                                    />
                                    <SortBtn
                                        contentNode={
                                            <DropDownFilter
                                                menus={menus}
                                                defaultMenu={defaultMenu}
                                                menuChangeCb={handleMenuChange}
                                                overlayStyle={{ width: 160 }}
                                            />
                                        }
                                    />
                                    <RefreshBtn
                                        onClick={() =>
                                            setSearchCondition({
                                                ...searchCondition,
                                                offset: 1,
                                            })
                                        }
                                    />
                                </Space>
                            </Space>
                        </div>
                        {loading ? (
                            <Spin className={styles.ldWrap} />
                        ) : total > 0 ? (
                            <div className={styles.bottom} ref={ref}>
                                {viewMode === 'card' ? (
                                    <>
                                        <div className={styles.listWrapper}>
                                            <List
                                                grid={{
                                                    gutter: 20,
                                                    column: col,
                                                }}
                                                dataSource={sceneCardList}
                                                renderItem={(item, idx) => {
                                                    let lastLineIndex =
                                                        Math.floor(
                                                            sceneCardList.length /
                                                                col,
                                                        ) * col
                                                    if (
                                                        lastLineIndex ===
                                                        sceneCardList.length
                                                    ) {
                                                        lastLineIndex =
                                                            sceneCardList.length -
                                                            col
                                                    }
                                                    return (
                                                        <List.Item
                                                            style={{
                                                                maxWidth:
                                                                    ((size?.width ||
                                                                        0) -
                                                                        8 -
                                                                        (col -
                                                                            1) *
                                                                            20) /
                                                                    col,
                                                                marginBottom:
                                                                    idx >=
                                                                    lastLineIndex
                                                                        ? 0
                                                                        : 16,
                                                            }}
                                                        >
                                                            <SceneListCard
                                                                item={item}
                                                                onOperate={(
                                                                    op,
                                                                ) =>
                                                                    handleOperate(
                                                                        op,
                                                                        item,
                                                                    )
                                                                }
                                                            />
                                                        </List.Item>
                                                    )
                                                }}
                                                className={styles.list}
                                                locale={{
                                                    emptyText: (
                                                        <Empty
                                                            desc={__(
                                                                '暂无数据',
                                                            )}
                                                            iconSrc={dataEmpty}
                                                        />
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <ListPagination
                                            className={styles.pagination}
                                            listType={ListType.CardList}
                                            queryParams={searchCondition}
                                            totalCount={total}
                                            onChange={handlePageChange}
                                        />
                                    </>
                                ) : (
                                    <>
                                        <div className={styles.tableWrapper}>
                                            <Table
                                                columns={tableColumns}
                                                dataSource={sceneCardList}
                                                rowKey="id"
                                                pagination={false}
                                                locale={{
                                                    emptyText: (
                                                        <Empty
                                                            desc={__(
                                                                '暂无数据',
                                                            )}
                                                            iconSrc={dataEmpty}
                                                        />
                                                    ),
                                                }}
                                            />
                                        </div>
                                        <ListPagination
                                            className={styles.pagination}
                                            listType={ListType.WideList}
                                            queryParams={searchCondition}
                                            totalCount={total}
                                            onChange={handlePageChange}
                                        />
                                    </>
                                )}
                            </div>
                        ) : (
                            <div className={styles.emptyWrapper}>
                                {renderEmpty()}
                            </div>
                        )}
                    </div>
                </DragBox>
            </div>

            <CreateScene
                visible={createVisible}
                item={operateItem}
                operate={operateType as OperateType}
                selectedCatalog={selectedCatalog || undefined}
                onClose={(isError) => {
                    if (isError) {
                        setSearchCondition({
                            ...searchCondition,
                            offset: 1,
                        })
                    }
                    setCreateVisible(false)
                }}
                onSure={(info) => handleCreateEdit(info)}
            />
        </div>
    )
}

export default SceneAnalysis
