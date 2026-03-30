import { useEffect, useMemo, useRef, useState } from 'react'
import {
    Button,
    Dropdown,
    Input,
    MenuProps,
    Select,
    Space,
    Table,
    Tooltip,
} from 'antd'
import { useAntdTable, useDebounce, useUpdateEffect } from 'ahooks'
import { trim } from 'lodash'
import { OperateType } from '@/utils'
import dataEmpty from '@/assets/dataEmpty.svg'
import Details from './Details'
import {
    Architecture,
    DataNode,
    getParent,
    nodeInfo,
    searchData,
} from './const'
import Icons from './Icons'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import DragBox from '../DragBox'
import { formatError, getObjectDetails, getObjects, IGetObject } from '@/core'
import __ from './locale'
import ArchitectureDirTree from './ArchitectureDirTree'
import { SearchInput, LightweightSearch } from '@/ui'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { IformItem } from '@/ui/LightweightSearch/const'

interface ISearchCondition extends IGetObject {
    current?: number
}
const OrganizationalStructure = () => {
    const ref: any = useRef()
    const lightweightSearchRef: any = useRef()
    const [defaultSize, setDefaultSize] = useState<Array<number>>([12, 88])
    const [searchValue, setSearchValue] = useState('')
    const [selectedNode, setSelectedNode] = useState<DataNode>({
        name: '全部',
        id: '',
        path: '',
        type: Architecture.ALL,
    })
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        id: selectedNode.id,
        is_all: true,
        type: '',
        keyword: '',
        current: 1,
    })

    const [selectedRow, setSelectedRow] = useState<DataNode>()
    const [details, setDetails] = useState<any>()
    const [LightweightData, setLightweightData] =
        useState<IformItem[]>(searchData)

    const [defaultValue, setDefaultValue] = useState<any>({
        is_all: true,
        type: '',
    })

    const typeList = useMemo(() => {
        return searchCondition.is_all
            ? nodeInfo[selectedNode.type].allobjects
            : nodeInfo[selectedNode.type].subobjects
    }, [searchCondition.is_all, selectedNode])

    useUpdateEffect(() => {
        if (searchValue === searchCondition.keyword) return
        setSearchCondition({
            ...searchCondition,
            keyword: searchValue,
            current: 1,
        })
    }, [searchValue])

    useEffect(() => {
        const data = LightweightData.map((item) => {
            if (item.key === 'type') {
                return {
                    ...item,
                    options: [
                        {
                            label: __('不限'),
                            value: '',
                        },
                        ...typeList.map((it) => {
                            return {
                                label: nodeInfo[it].name,
                                value: it,
                            }
                        }),
                    ],
                }
            }
            return item
        })
        setLightweightData(data)
    }, [typeList])

    const handleObjChange = (isAll: boolean) => {
        setSearchCondition({
            ...searchCondition,
            is_all: isAll,
            current: 1,
            type: isAll ? searchCondition.type : '',
        })
    }

    const handleTypeChange = (type: string) => {
        setSearchCondition({ ...searchCondition, type, current: 1 })
    }

    const searchChange = (data, dataKey) => {
        if (!dataKey) {
            // 清空筛选
            setSearchCondition({
                ...searchCondition,
                current: 1,
                ...data,
            })
        } else if (dataKey === 'is_all') {
            handleObjChange(data[dataKey])
        } else if (dataKey === 'type') {
            handleTypeChange(data[dataKey])
        }
    }

    // 获取节点对象
    const getNodeObjects = async (params: any) => {
        const {
            current: offset,
            pageSize: limit,
            id,
            is_all,
            type,
            keyword,
        } = params

        const tempType = !searchCondition?.type ? typeList?.join() : type
        const tempIsAll = [
            Architecture.BSYSTEMCONTAINER,
            Architecture.BMATTERSCONTAINER,
        ].includes(selectedNode.type as Architecture)
            ? false
            : is_all

        try {
            const res = await getObjects({
                offset,
                limit: 20,
                id,
                is_all: tempIsAll,
                type: tempType,
                keyword,
            })
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getNodeObjects, {
        defaultPageSize: 20,
        manual: true,
    })

    useEffect(() => {
        run({ ...pagination, ...searchCondition })
    }, [searchCondition])

    const moreItems = (type: Architecture): MenuProps['items'] => {
        const delItem = [
            {
                key: OperateType.DELETE,
                label: '删除',
            },
        ]
        const moveItem = [
            {
                key: OperateType.MOVE,
                label: '移动',
            },
        ]

        const renameItem = [
            {
                key: OperateType.RENAME,
                label: '重命名',
            },
        ]

        // 业务事项/信息系统 允许重命名 删除/移动 操作
        if ([Architecture.BMATTERS, Architecture.BSYSTEM].includes(type)) {
            return [...renameItem, ...moveItem, ...delItem]
        }
        if (type === Architecture.COREBUSINESS) {
            // 业务模型仅允许移动操作
            return moveItem
        }

        return []
    }
    // 点击更多操作 重命名 or 删除
    const handleClickMore = (
        ot: OperateType,
        td: DataNode,
        parentNode?: DataNode,
    ) => {
        // 若悬浮点击“操作”但当前节点未被选中，则选中该节点
        if (td.id !== selectedRow?.id) {
            setSelectedRow(td)
        }
        if (ot === OperateType.RENAME) {
            ref.current?.handleOperate(
                OperateType.RENAME,
                td.type,
                td,
                parentNode,
            )
        } else if (ot === OperateType.MOVE) {
            ref.current?.handleOperate(
                OperateType.MOVE,
                td.type,
                td,
                parentNode,
            )
        }
    }

    const columns = [
        {
            title: '名称',
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            // width: '40%',
            render: (name, record) => (
                <span>
                    <Icons type={record.type} />
                    <span title={name} style={{ marginLeft: '8px' }}>
                        {name}
                    </span>
                </span>
            ),
        },
        {
            title: '类型',
            dataIndex: 'type',
            key: 'type',
            ellipsis: true,
            width: 120,
            render: (type) => (
                <span title={nodeInfo[type].name}>{nodeInfo[type].name}</span>
            ),
        },
        {
            title: '路径',
            dataIndex: 'path',
            key: 'path',
            ellipsis: true,
            // width: '30%',
            // render: (name, record) => (
            //     <Tooltip
            //         title={<div className={styles.tooltipWrap}>{name}</div>}
            //         placement="topLeft"
            //     >
            //         <span>{name}</span>
            //     </Tooltip>
            // ),
        },
    ]

    const items: MenuProps['items'] = useMemo(() => {
        // 组织/部门仅允许新建业务事项/信息系统
        return nodeInfo[selectedNode.type].subobjects
            .filter(
                (item) =>
                    ![
                        Architecture.DOMAIN,
                        Architecture.DISTRICT,
                        Architecture.DEPARTMENT,
                        Architecture.COREBUSINESS,
                    ].includes(item),
            )
            .map((key: string) => ({
                key,
                label: nodeInfo[key].name,
                icon: <Icons type={key as Architecture} />,
            }))
    }, [selectedNode])

    const onClick: MenuProps['onClick'] = ({ key }) => {
        ref.current?.handleOperate(OperateType.CREATE, key, selectedNode)
    }

    // 获取选中的节点 delNode: 删除的节点(用来判断列表中的选中项是否被删除) 用来刷新列表及详情
    const getSelectedNode = (sn?: DataNode, delNode?: DataNode) => {
        // if: 在树结构中操作后获取选中项 else: 在列表中操作后 选中项不变，但要更新列表及详情
        if (sn) {
            setSelectedNode({ ...sn })
            setSelectedRow(undefined)
            setSearchCondition({
                ...searchCondition,
                is_all: true,
                keyword: '',
                type: '',
                id:
                    sn.id.endsWith('SC') || sn.id.endsWith('MC')
                        ? sn.id.substring(0, sn.id.length - 3)
                        : sn.id,
                current: 1,
            })
            setSearchValue('')
            lightweightSearchRef.current?.reset()
        } else {
            // 在列表中删除的情况或重命名时，选中项不变，但是要更新数据
            setSearchCondition({
                ...searchCondition,
            })
            // 操作成功后，按照左侧树选中节点刷新列表+详情
            setSelectedRow(undefined)
            setSelectedNode({ ...selectedNode })
        }
    }

    const getDetails = async (objId: string, record?) => {
        try {
            const res = await getObjectDetails(objId)
            setDetails({
                ...res.attributes,
                name: res.name,
            })
            // 请求成功设置选中行，不成功不允许选中
            if (record) {
                setSelectedRow(record)
            }
        } catch (error) {
            formatError(error)
        }
    }

    // 选中树节点变化 或者 列表中选中变化，查属性详情
    useEffect(() => {
        if (selectedNode.id || selectedRow?.id) {
            getDetails(selectedRow?.id || selectedNode.id)
        }
    }, [selectedNode, selectedRow])

    // 点击选中表格某一行，再次点击取消选中 属性展示树节点信息
    const onClickRow = (record) => {
        // 取消选中，获取选中树节点数据
        if (selectedRow?.id === record.id) {
            setSelectedRow(undefined)
            return
        }
        setSelectedRow(record)
    }
    const isSearch = useMemo(() => {
        const { is_all, type, keyword } = searchCondition
        return !(is_all && !type && !keyword)
    }, [searchCondition])

    return (
        <div className={styles.architectureWrapper}>
            <DragBox
                defaultSize={defaultSize}
                minSize={[220, 270]}
                maxSize={[800, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
            >
                <div className={styles.left}>
                    <div className={styles.title}>{__('组织架构')}</div>
                    <div className={styles.leftTreeWrapper}>
                        <ArchitectureDirTree
                            getSelectedNode={getSelectedNode}
                            ref={ref}
                            // isShowOperate
                            filterType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                        />
                        {/* <ArchitectureTree
                            getSelectedNode={getSelectedNode}
                            ref={ref}
                            initNodeType={[
                                Architecture.ORGANIZATION,
                                Architecture.DEPARTMENT,
                            ].join()}
                        /> */}
                    </div>
                </div>
                <div className={styles.right}>
                    <div className={styles.top}>
                        <Space
                            size={8}
                            style={{ marginTop: '16px', flexWrap: 'wrap' }}
                            className={styles.searchRight}
                        >
                            <SearchInput
                                className={styles.nameInput}
                                placeholder="搜索名称"
                                value={searchValue}
                                onKeyChange={(val: string) =>
                                    setSearchValue(val)
                                }
                            />
                            <LightweightSearch
                                formData={LightweightData}
                                onChange={(data, key) =>
                                    searchChange(data, key)
                                }
                                defaultValue={defaultValue}
                            />
                            <RefreshBtn onClick={() => run(searchCondition)} />
                        </Space>
                    </div>
                    <div className={styles.bottom}>
                        {!isSearch &&
                        tableProps.dataSource.length === 0 &&
                        !tableProps.loading ? (
                            <div className={styles.emptyWrapper}>
                                <Empty desc="暂无数据" iconSrc={dataEmpty} />
                            </div>
                        ) : (
                            <Table
                                columns={columns}
                                {...tableProps}
                                rowKey="id"
                                scroll={{
                                    x: 500,
                                    y:
                                        tableProps.dataSource.length === 0
                                            ? undefined
                                            : tableProps.pagination.total > 20
                                            ? 'calc(100vh - 250px)'
                                            : 'calc(100vh - 250px)',
                                }}
                                pagination={{
                                    ...tableProps.pagination,
                                    showSizeChanger: false,
                                    hideOnSinglePage: true,
                                }}
                                bordered={false}
                                locale={{
                                    emptyText: tableProps.loading ? (
                                        <div style={{ height: 300 }} />
                                    ) : (
                                        <Empty />
                                    ),
                                }}
                                style={{ width: 'calc(100% - 290px)' }}
                                onRow={(record) => ({
                                    onClick: () => onClickRow(record),
                                })}
                                rowClassName={(record) =>
                                    record.id === selectedRow?.id
                                        ? 'any-fabric-ant-table-row-selected'
                                        : ''
                                }
                            />
                        )}

                        <Details
                            selectedNode={selectedRow || selectedNode}
                            data={details}
                        />
                    </div>
                </div>
            </DragBox>
        </div>
    )
}

export default OrganizationalStructure
