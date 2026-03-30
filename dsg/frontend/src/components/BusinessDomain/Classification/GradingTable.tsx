import { Button, message, Space, Table, Tooltip } from 'antd'
import { useEffect, useRef, useState } from 'react'

import {
    ExclamationCircleFilled,
    InfoCircleFilled,
    PlusOutlined,
} from '@ant-design/icons'
import { useDebounce, useSize } from 'ahooks'
import { isString } from 'lodash'
import moment from 'moment'
import { StatusLabel } from '@/components/RecognitionAlgorithmConfig/helper'
import {
    batchDeleteGradeRule,
    deleteGradeRule,
    deleteGradeRuleGroup,
    exportGradeRule,
    formatError,
    getGradeList,
    getGradeRuleGroupList,
    startGradeRule,
    stopGradeRule,
} from '@/core'
import { FontIcon } from '@/icons'
import { Empty, OptionBarTool, OptionMenuType, SearchInput } from '@/ui'
import { streamToFile } from '@/utils'
import { confirm, info } from '@/utils/modalHelper'
import __ from '../locale'
import { useClassificationContext } from './ClassificationProvider'
import {
    AlgorithmStatus,
    AlgorithmType,
    allGroup,
    ClassifyType,
    OperationType,
    OperationTypeMap,
    unGroup,
} from './const'
import CreateGrading from './CreateGrading'
import CreateGroup from './CreateGroup'
import DataDetail from './DataDetail'
import { ContainerBar, IntroductionTooltip } from './helper'
import MoveGroup from './MoveGroup'
import styles from './styles.module.less'

const GradingTable = () => {
    const [data, setData] = useState<any[]>([])
    const [groupData, setGroupData] = useState<any[]>([])
    const [currentGroup, setCurrentGroup] = useState<any>(allGroup)
    const [isEdit, setIsEdit] = useState<boolean>(false)
    const { setSelectedAttribute, selectedAttribute } =
        useClassificationContext()
    // 是否显示创建分类弹窗
    const [showCreateGrading, setShowCreateGrading] = useState(false)
    // 是否显示详情弹窗
    const [showDetail, setShowDetail] = useState(false)

    // 操作id
    const [operationId, setOperationId] = useState('')
    const [batchGroupId, setBatchGroupId] = useState('')

    // 是否显示编辑弹窗
    const [showEditGrading, setShowEditGrading] = useState(false)
    const [createGroupOpen, setCreateGroupOpen] = useState(false)
    const [moveGroupOpen, setMoveGroupOpen] = useState(false)

    // 搜索关键字
    const [searchValue, setSearchValue] = useState<string>('')
    // 表数据
    const [tableData, setTableData] = useState<any[]>([])
    const [selectedRowKeys, setSelectedRowKeys] = useState<any[]>([])
    const [selectedRow, setSelectedRow] = useState<any[]>([])
    const keywordDebounce = useDebounce(searchValue, {
        wait: 500,
    })

    const tableContainerRef = useRef<HTMLDivElement>(null)

    const size = useSize(tableContainerRef)

    useEffect(() => {
        getTableData()
    }, [currentGroup])

    useEffect(() => {
        if (selectedAttribute.id) {
            getTableData()
            getGroupData()
        }
    }, [selectedAttribute])

    useEffect(() => {
        searchData()
    }, [keywordDebounce, data])

    /**
     * 获取表数据
     */
    const getTableData = async () => {
        try {
            if (!selectedAttribute.id) return
            const { entries } = await getGradeList({
                subject_id: selectedAttribute.id,
                group_id:
                    currentGroup?.id === allGroup.id
                        ? undefined
                        : currentGroup?.id,
                offset: 1,
                limit: 100,
            })
            setData(entries)
        } catch (err) {
            formatError(err)
        } finally {
            setSelectedRowKeys([])
            setSelectedRow([])
        }
    }

    const getGroupData = async () => {
        try {
            const { entries } = await getGradeRuleGroupList({
                business_object_id: selectedAttribute.id,
            })
            const list = [allGroup, ...(entries || []), unGroup]
            setGroupData(list)
            if (isEdit && currentGroup.id) {
                setCurrentGroup(list.find((o) => o.id === currentGroup.id))
            }
        } catch (err) {
            formatError(err)
        }
    }

    /**
     * 搜索数据
     */
    const searchData = () => {
        if (keywordDebounce) {
            setTableData(
                data.filter((item) =>
                    item.name
                        .toLocaleUpperCase()
                        .includes(keywordDebounce.trim().toLocaleUpperCase()),
                ),
            )
        } else {
            setTableData(data)
        }
    }

    const columns: Array<any> = [
        {
            title: (
                <span className={styles.nameTitleContainer}>
                    {__('识别规则名称')}
                    <span className={styles.subTitle}>（{__('描述')}）</span>
                </span>
            ),
            key: 'algorithm_name',
            dataIndex: 'algorithm_name',
            ellipsis: true,
            fixed: 'left',
            render: (_, record) => (
                <div className={styles.rowNameContainer}>
                    <div className={styles.nameWrapper}>
                        <span
                            className={styles.name}
                            title={record?.name}
                            onClick={(e) => {
                                e.preventDefault()
                                e.stopPropagation()
                                // onPreview(record.id, record.indicator_type)
                            }}
                        >
                            {record?.name}
                        </span>
                        {record.type === AlgorithmType.BUILT_IN &&
                            IntroductionTooltip()}
                    </div>
                    <div>
                        <span
                            className={styles.description}
                            title={record?.description}
                        >
                            {record?.description || __('暂无描述')}
                        </span>
                    </div>
                </div>
            ),
            width: 220,
        },
        {
            title: __('规则类型'),
            key: 'type',
            dataIndex: 'type',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return text === AlgorithmType.BUILT_IN
                    ? __('内置')
                    : __('自定义')
            },
        },
        {
            title: __('识别出字段'),
            key: 'classification_subject_names',
            dataIndex: 'classification_subject_names',
            ellipsis: true,
            width: 220,
            render: (text, record) => {
                return record.type === AlgorithmType.BUILT_IN ? (
                    <div className={styles.selectOptionWrapper}>
                        「
                        <FontIcon
                            name="icon-shuxing"
                            style={{
                                fontSize: 20,
                                color: 'rgba(245, 137, 13, 1)',
                            }}
                        />
                        <span className={styles.titleText}>
                            {selectedAttribute.name}
                        </span>
                        」
                        <span className={styles.titleText}>
                            {__('类的字段')}
                        </span>
                    </div>
                ) : (
                    __('字段组合')
                )
            },
        },
        {
            title: __('字段数据分级'),
            key: 'label_name',
            dataIndex: 'label_name',
            ellipsis: true,
            width: 370,
            render: (text, record) => {
                return (
                    <div className={styles.gradingDataContainer}>
                        <div className={styles.dataWrapper}>
                            「
                            <FontIcon
                                name="icon-shuxing"
                                style={{
                                    fontSize: 20,
                                    color: 'rgba(245, 137, 13, 1)',
                                }}
                            />
                            <span className={styles.titleText}>
                                {selectedAttribute.name}
                            </span>
                            」
                            <span className={styles.titleText}>
                                {__('类的字段分级：')}
                            </span>
                            <div className={styles.labelWrapper}>
                                <FontIcon
                                    name="icon-biaoqianicon"
                                    style={{
                                        fontSize: 20,
                                        color: record.label_icon,
                                    }}
                                />
                                <span>{record.label_name}</span>
                            </div>
                        </div>
                        {record.type === AlgorithmType.BUILT_IN && (
                            <div className={styles.description}>
                                {__(
                                    '当前分级为属性信息的分级，探查结果默认跟随属性信息的分级',
                                )}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('启用状态'),
            key: 'status',
            dataIndex: 'status',
            ellipsis: true,
            width: 120,
            render: (text, record) => {
                return <StatusLabel status={text} />
            },
        },
        // {
        //     title: __('所属规则组'),
        //     key: 'group_name',
        //     dataIndex: 'group_name',
        //     ellipsis: true,
        //     width: 120,
        //     render: (text, record) => text || '--',
        // },
        {
            title: __('规则创建时间'),
            key: 'created_at',
            dataIndex: 'created_at',
            ellipsis: true,
            width: 180,
            render: (text, record) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('规则更新时间'),
            key: 'updated_at',
            dataIndex: 'updated_at',
            ellipsis: true,
            width: 180,
            render: (text, record) => {
                return text ? moment(text).format('YYYY-MM-DD HH:mm:ss') : '--'
            },
        },
        {
            title: __('操作'),
            key: 'action',
            fixed: 'right',
            width: 220,
            render: (_, record) => {
                // 操作菜单
                const operationMenus = [
                    OperationType.DETAIL,
                    OperationType.EDIT,
                    OperationType.ENABLE,
                    OperationType.DISABLE,
                    OperationType.EXPORT,
                    OperationType.DELETE,
                ]
                    .filter((item) => {
                        // 如果算法状态为启用，则不显示启用操作
                        if (record.status === AlgorithmStatus.ENABLE) {
                            return item !== OperationType.ENABLE
                        }
                        // 如果算法状态为停用，则不显示停用操作
                        if (record.status === AlgorithmStatus.DISABLE) {
                            return item !== OperationType.DISABLE
                        }
                        return true
                    })
                    .map((item) => ({
                        key: item,
                        label: OperationTypeMap[item],
                        menuType: OptionMenuType.Menu,
                    }))
                return (
                    <OptionBarTool
                        menus={
                            record.type === AlgorithmType.BUILT_IN
                                ? [
                                      {
                                          key: OperationType.EXPORT,
                                          label: OperationTypeMap[
                                              OperationType.EXPORT
                                          ],
                                          menuType: OptionMenuType.Menu,
                                      },
                                  ]
                                : operationMenus
                        }
                        onClick={(key) => {
                            setOperationId(record.id)
                            handleOperation(key, record.id)
                        }}
                    />
                )
            },
        },
    ]

    const handleExport = async (
        id: string | string[],
        type: 'ids' | 'group_ids' = 'ids',
    ) => {
        try {
            const res = await exportGradeRule({
                [type]: isString(id) ? [id] : id,
                business_object_id: selectedAttribute.id,
            })
            let fielName: string = ''
            if (isString(id)) {
                const name = data.find((o) => o.id === id)?.name
                fielName = `分级识别规则_${name}_${moment().format(
                    'YYYYMMDDHHmmss',
                )}.xlsx`
            } else if (type === 'group_ids' && id.length === 1) {
                fielName = `分级识别规则_${
                    currentGroup?.name
                }_${moment().format('YYYYMMDDHHmmss')}.xlsx`
            } else {
                fielName = `分级识别规则_${moment().format(
                    'YYYYMMDDHHmmss',
                )}.xlsx`
            }
            streamToFile(res, fielName)
            message.success(__('导出成功'))
        } catch (err) {
            formatError(err)
        }
    }

    // 操作
    const handleOperation = (key: string, id: string) => {
        switch (key) {
            case OperationType.DETAIL:
                setShowDetail(true)
                break
            case OperationType.ENABLE:
                confirm({
                    title: __('确定启用当前识别规则吗？'),
                    content: null,
                    icon: <InfoCircleFilled style={{ color: '#126ee3' }} />,
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: async () => {
                        try {
                            await startGradeRule(id)
                            getTableData()
                            message.success(__('启用成功'))
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            case OperationType.DISABLE:
                confirm({
                    title: __('确定停用当前识别规则吗？'),
                    content: __(
                        '停用后，在进行表（库表）的数据探查时，不能再基于当前规则识别分级。',
                    ),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#FAAD14' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: async () => {
                        try {
                            await stopGradeRule(id)
                            getTableData()
                            message.success(__('停用成功'))
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            case OperationType.EXPORT:
                handleExport(id)
                break
            case OperationType.EDIT:
                setShowEditGrading(true)
                break
            case OperationType.DELETE:
                confirm({
                    title: __('确定删除当前识别规则吗？'),
                    content: __(
                        '删除后，在进行表（库表）的数据探查时，不能再基于当前规则识别分级。',
                    ),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#FAAD14' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: async () => {
                        try {
                            await deleteGradeRule(id)
                            getTableData()
                            message.success(__('删除成功'))
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            case OperationType.BATCHDELETE:
                confirm({
                    title: __('删除识别规则'),
                    content: __(
                        '删除后，在进行表（库表）的数据探查时，不能再基于当前规则识别分级。',
                    ),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#FAAD14' }} />
                    ),
                    okText: __('确定'),
                    cancelText: __('取消'),
                    onOk: async () => {
                        try {
                            await batchDeleteGradeRule({ ids: selectedRowKeys })
                            getTableData()
                            message.success(__('删除成功'))
                        } catch (err) {
                            formatError(err)
                        }
                    },
                })
                break
            default:
                break
        }
    }

    const delGradeRule = () => {
        const canDelete = tableData.filter((o) => o.id !== '1')?.length === 0
        const Action = canDelete ? confirm : info
        Action({
            title: canDelete
                ? __(`确定删除当前规则组吗？`)
                : __(`无法删除规则组`),
            icon: (
                <ExclamationCircleFilled
                    style={{
                        color: canDelete ? 'rgb(250 173 20)' : '#1890FF',
                    }}
                />
            ),
            content: canDelete
                ? __(
                      '删除前，请先将下方的规则移动到其他分组或进行清理，若规则组下方仍有规则，则不可直接删除。',
                  )
                : __(
                      '当前规则组“${name}”规则组名称下方仍存在规则，请先将下方的规则移动到其他分组或进行清理。',
                      { name: currentGroup?.name },
                  ),
            async onOk() {
                const del = async () => {
                    try {
                        await deleteGradeRuleGroup(currentGroup?.id)
                        message.success(__(`删除成功`))
                        getGroupData()
                        setCurrentGroup(allGroup)
                    } catch (error) {
                        formatError(error)
                    }
                }
                if (canDelete) {
                    del()
                }
            },
            onCancel() {},
            okText: __('确定'),
            cancelText: __('取消'),
        })
    }

    return (
        <div className={styles.gradingTableContainer}>
            <ContainerBar>
                <div className={styles.titleContainer}>
                    <div className={styles.leftBarContainer}>
                        <span>{__('探查分级的识别规则')}</span>
                    </div>
                    <Tooltip
                        title={
                            groupData.length === 12 || groupData.length > 12
                                ? __('最多10个规则组')
                                : ''
                        }
                    >
                        {/* <Button
                            type="link"
                            icon={<PlusOutlined />}
                            disabled={
                                groupData.length === 12 || groupData.length > 12
                            }
                            onClick={() => {
                                setIsEdit(false)
                                setCreateGroupOpen(true)
                            }}
                        >
                            {__('新建规则组')}
                        </Button> */}
                    </Tooltip>
                </div>
            </ContainerBar>
            {/* <Tabs
                activeKey={currentGroup?.id}
                items={groupData.map((o) => {
                    return {
                        label: (
                            <span
                                style={{
                                    display: 'inline-block',
                                    maxWidth: '200px',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                    whiteSpace: 'nowrap',
                                }}
                                title={o.name}
                            >
                                {o.name}
                            </span>
                        ),
                        key: o.id,
                        children: undefined,
                    }
                })}
                onTabClick={(val) => {
                    const curG = groupData.find((o) => o.id === val)
                    setCurrentGroup(curG)
                    setSelectedRowKeys([])
                    setSelectedRow([])
                }}
                className={styles.groupTabs}
            /> */}
            {/* {![allGroup.id, unGroup.id].includes(currentGroup?.id) && (
                <div className={styles.groupDes}>
                    {__('分组描述：')}
                    <span
                        title={currentGroup?.description}
                        className={styles.groupDesText}
                    >
                        {currentGroup?.description || '--'}
                    </span>
                </div>
            )} */}
            <div className={styles.ruleOperate}>
                <Space size={16}>
                    <Tooltip
                        title={
                            data.length === 100 || data.length > 100
                                ? __('识别规则已达上限（100条）')
                                : ''
                        }
                    >
                        <Button
                            type="link"
                            icon={<PlusOutlined />}
                            disabled={data.length === 100 || data.length > 100}
                            onClick={() => setShowCreateGrading(true)}
                        >
                            {__('新建规则')}
                        </Button>
                    </Tooltip>
                    {/* <Tooltip
                        title={
                            selectedRowKeys.length === 0
                                ? __('请先选择识别规则')
                                : selectedRow.some((o) => o.id === '1')
                                ? __('内置规则不支持调整分组')
                                : ''
                        }
                    >
                        <Button
                            type="link"
                            disabled={
                                selectedRowKeys.length === 0 ||
                                selectedRow.some((o) => o.id === '1')
                            }
                            onClick={() => {
                                if (
                                    uniq(selectedRow.map((o) => o.group_id))
                                        ?.length > 1
                                ) {
                                    message.info(
                                        __('所选规则存在多个分组，请重新选择'),
                                    )
                                    return
                                }
                                setBatchGroupId(selectedRow?.[0]?.group_id)
                                setMoveGroupOpen(true)
                            }}
                        >
                            {__('调整分组')}
                        </Button>
                    </Tooltip> */}
                    <Tooltip
                        title={
                            selectedRowKeys.length === 0
                                ? __('请先选择识别规则')
                                : ''
                        }
                    >
                        <Button
                            type="link"
                            disabled={selectedRowKeys.length === 0}
                            onClick={() => handleExport(selectedRowKeys)}
                        >
                            {__('导出')}
                        </Button>
                    </Tooltip>
                    <Tooltip
                        title={
                            selectedRowKeys.length === 0
                                ? __('请先选择识别规则')
                                : selectedRow.some((o) => o.id === '1')
                                ? __('内置规则不能持删除')
                                : ''
                        }
                    >
                        <Button
                            type="link"
                            disabled={
                                selectedRowKeys.length === 0 ||
                                selectedRow.some((o) => o.id === '1')
                            }
                            onClick={() =>
                                handleOperation(OperationType.BATCHDELETE, '')
                            }
                        >
                            {__('删除')}
                        </Button>
                    </Tooltip>
                </Space>
                <Space size={16}>
                    {![allGroup.id, unGroup.id].includes(currentGroup?.id) && (
                        <>
                            <Button
                                type="link"
                                onClick={() => {
                                    setIsEdit(true)
                                    setCreateGroupOpen(true)
                                }}
                            >
                                {__('编辑规则组')}
                            </Button>
                            <Button type="link" onClick={() => delGradeRule()}>
                                {__('删除规则组')}
                            </Button>
                        </>
                    )}
                    {/* <Button
                        type="link"
                        disabled={data.length === 100 || data.length > 100}
                        onClick={() =>
                            handleExport(
                                currentGroup?.id === allGroup.id
                                    ? [
                                          ...groupData.map((o) => o.id),
                                          unGroup.id,
                                      ]
                                    : [currentGroup?.id],
                                'group_ids',
                            )
                        }
                    >
                        {currentGroup?.id === allGroup.id
                            ? __('导出全部')
                            : currentGroup?.id === unGroup.id
                            ? __('导出未分组规则')
                            : __('导出规则组')}
                    </Button> */}
                    <SearchInput
                        placeholder={__('搜索规则名称')}
                        onChange={(e) => {
                            setSearchValue(e.target.value)
                        }}
                    />
                </Space>
            </div>
            <div className={styles.tableContainer} ref={tableContainerRef}>
                <Table
                    columns={columns}
                    pagination={false}
                    dataSource={tableData}
                    scroll={{
                        x: 1000,
                        y: size?.height ? size.height - 64 : 0,
                    }}
                    locale={{
                        emptyText: <Empty />,
                    }}
                    rowKey="id"
                    rowSelection={{
                        type: 'checkbox',
                        selectedRowKeys,
                        onSelect: (record, selected, selecRows) => {
                            setSelectedRowKeys(
                                selecRows?.map((item) => item.id),
                            )
                            setSelectedRow(selecRows)
                        },
                        onSelectAll: (checked, selected) => {
                            setSelectedRowKeys(selected?.map((item) => item.id))
                            setSelectedRow(selected)
                        },
                    }}
                />
            </div>
            {showCreateGrading && (
                <CreateGrading
                    open={showCreateGrading}
                    onClose={() => setShowCreateGrading(false)}
                    onConfirm={() => {
                        getTableData()
                        setShowCreateGrading(false)
                    }}
                />
            )}
            {showDetail && (
                <DataDetail
                    onClose={() => setShowDetail(false)}
                    open={showDetail}
                    id={operationId}
                    type={ClassifyType.GRADE}
                />
            )}
            {showEditGrading && (
                <CreateGrading
                    open={showEditGrading}
                    onClose={() => setShowEditGrading(false)}
                    id={operationId}
                    onConfirm={() => {
                        getTableData()
                        setShowEditGrading(false)
                    }}
                />
            )}
            {createGroupOpen && (
                <CreateGroup
                    open={createGroupOpen}
                    onClose={() => setCreateGroupOpen(false)}
                    onOk={() => {
                        getGroupData()
                        setCreateGroupOpen(false)
                    }}
                    isEdit={isEdit}
                    curInfo={currentGroup}
                />
            )}
            {moveGroupOpen && (
                <MoveGroup
                    open={moveGroupOpen}
                    onClose={() => {
                        setBatchGroupId('')
                        setMoveGroupOpen(false)
                    }}
                    onOk={() => {
                        getTableData()
                        setBatchGroupId('')
                        setMoveGroupOpen(false)
                    }}
                    groupId={batchGroupId}
                    selectedRules={selectedRow}
                />
            )}
        </div>
    )
}

export default GradingTable
