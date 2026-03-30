import {
    CaretDownOutlined,
    CaretRightOutlined,
    CloseCircleFilled,
    ExclamationCircleFilled,
    InfoCircleFilled,
} from '@ant-design/icons'
import {
    Button,
    Dropdown,
    MenuProps,
    Modal,
    Progress,
    Space,
    Table,
    message,
} from 'antd'
import classnames from 'classnames'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { DndProvider } from 'react-dnd'
import { HTML5Backend } from 'react-dnd-html5-backend'
import dataEmpty from '@/assets/dataEmpty.svg'
import { RefreshBtn } from '@/components/ToolbarComponents'
import {
    DataGradeLabelType,
    GradeLabelStatusEnum,
    IGradeLabel,
    deleteDataGradeLabel,
    formatError,
    getDataGradeLabel,
    getDataGradeLabelStatus,
    getGradeLabelBindInfo,
    getGradeLabelIcons,
    moveDataGradeLabel,
    startDataGradeLabel,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { Empty, SearchInput } from '@/ui'
import Loader from '@/ui/Loader'
import { OperateType } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { TipsLabel } from '../BusinessTagAuthorization/helper'
import Confirm from '../Confirm'
import AddGroup from './AddGroup'
import AddTag from './AddTag'
import {
    CreateType,
    bindInfoIsEmpty,
    classifiedOptoins,
    colorList,
    findFromData,
    gradeLabelBindInfoTypeMap,
    gradeLabelBindInfoTypes,
    sensitiveOptions,
    shareTypeOptoins,
    titleTipsText,
} from './const'
import DeleteErrorTable from './DeleteErrorTable'
import DraggableBodyRow from './DraggableBodyRow'
import __ from './locale'
import styles from './styles.module.less'
import { getTabByUsing } from './helper'

export const CustomExpandIcon = ({ expanded, onExpand, record }: any) => {
    return record?.children?.length ? (
        <span
            onClick={(e) => onExpand(record, e)}
            style={{
                cursor: 'pointer',
                marginRight: 8,
                color: 'rgba(0,0,0,0.65)',
            }}
        >
            {expanded ? <CaretDownOutlined /> : <CaretRightOutlined />}
        </span>
    ) : null
}

interface IDataClassificationTagProps {
    isSecurity?: boolean
}
const DataClassificationTag = ({ isSecurity }: IDataClassificationTagProps) => {
    const [isStart, setIsStart] = useState(false)
    const [addTagOpen, setAddTagOpen] = useState(false)
    const [addGroupOpen, setAddGroupOpen] = useState(false)
    const [operateType, setOperateType] = useState<OperateType>(
        OperateType.CREATE,
    )
    const [delItem, setDelItem] = useState<IGradeLabel>()
    const [delConfrim, setDelConfrim] = useState<boolean>(false)
    const [delGroupConfrim, setDelGroupConfrim] = useState<boolean>(false)
    const [searchValue, setSearchValue] = useState('')
    const [searchCondition, setSearchCondition] = useState<any>({})
    const [expandedRowKeys, setExpandedRowKeys] = useState<any[]>([])
    const [searchExpandedKeys, setSearchExpandedKeys] = useState<any[]>([])
    const [fetching, setFetching] = useState(false)
    const [dataSource, setDataSource] = useState<IGradeLabel[]>([])
    const [loading, setLoading] = useState(false)
    const [editItem, setEditItem] = useState<IGradeLabel>()
    const [isCanCreate, setIsCanCreate] = useState(true)
    const [tagCount, setTagCount] = useState(0)
    const [delLoading, setDelLoading] = useState(false)
    const [selectedRowKeys, setSelectedRowKeys] = useState<string[]>([])
    const [selectedRows, setSelectedRows] = useState<any[]>([])
    const [deleteErrorList, setDeleteErrorList] = useState<any[]>([])
    const [{ using }] = useGeneralConfig()
    const [delTitle, setDelTitle] = useState<string>(
        __('当前分级已被引用，需要先解除分级的作用关系，才能进行删除。'),
    )
    const [delConfrimOpen, setDelConfrimOpen] = useState<boolean>(false)
    const [showCancelBtn, setShowCancelBtn] = useState<boolean>(true)
    const [showDeleteProgress, setShowDeleteProgress] = useState<boolean>(true)
    const [delCount, setDelCount] = useState<number>(0)
    const [errorCount, setErrorCount] = useState<number>(0)

    const percentageCompletion = useMemo(() => {
        const percentage = Math.floor(
            ((delCount > 0 ? delCount - 1 : delCount) /
                (setSelectedRowKeys?.length || 1)) *
                100,
        )
        return percentage
    }, [delCount])
    const getIcons = async () => {
        try {
            const res = await getGradeLabelIcons()
            if (Array.isArray(res)) {
                setTagCount(res.length)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getIcons()
    }, [])

    useEffect(() => {
        setIsCanCreate(tagCount < colorList.length)
    }, [tagCount])

    const columns = [
        {
            title: __('标签名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (name, record) => {
                return (
                    <div className={styles['name-container']}>
                        {record.node_type === DataGradeLabelType.Node && (
                            <FontIcon
                                name="icon-biaoqianicon"
                                style={{ color: record.icon }}
                                className={classnames(styles['tag-icon'])}
                            />
                        )}
                        <div title={name} className={styles['tag-name']}>
                            {name}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('描述'),
            dataIndex: 'description',
            ellipsis: true,
            key: 'description',
            render: (description) => description || '--',
        },
        {
            title: (
                <span>
                    {__('数据资源目录属性预设')}
                    {getTabByUsing(using)}
                </span>
            ),
            dataIndex: 'data_catalog_attribute_preset',
            ellipsis: true,
            key: 'data_catalog_attribute_preset',
            children: [
                {
                    title: __('敏感属性'),
                    dataIndex: 'sensitive_attri',
                    key: 'sensitive_attri',
                    width: 150,
                    render: (text) =>
                        sensitiveOptions?.find((o) => o?.value === text)
                            ?.label || '--',
                },
                {
                    title: __('涉密属性'),
                    dataIndex: 'secret_attri',
                    key: 'secret_attri',
                    width: 150,
                    render: (text) =>
                        classifiedOptoins?.find((o) => o?.value === text)
                            ?.label || '--',
                },
                {
                    title: __('共享属性'),
                    dataIndex: 'share_condition',
                    key: 'share_condition',
                    width: 150,
                    render: (text) =>
                        shareTypeOptoins?.find((o) => o?.value === text)
                            ?.label || '--',
                },
            ],
        },
        {
            title: __('库表数据保护'),
            dataIndex: 'data_protection_query',
            ellipsis: true,
            key: 'data_protection_query',
            render: (text) => (text ? __('数据查询保护') : '--'),
        },
        {
            title: __('操作'),
            width: 156,
            render: (_, record: IGradeLabel) => {
                return (
                    <Space size={16}>
                        <a
                            onClick={() => {
                                setOperateType(OperateType.EDIT)
                                setEditItem(record)
                                if (
                                    record.node_type ===
                                    DataGradeLabelType.Group
                                ) {
                                    setAddGroupOpen(true)
                                } else {
                                    setAddTagOpen(true)
                                }
                            }}
                        >
                            {__('编辑')}
                        </a>
                        <a
                            onClick={() => {
                                setDelConfrim(true)
                                setShowDeleteProgress(false)
                                setDelItem(record)
                            }}
                        >
                            {__('删除')}
                        </a>
                    </Space>
                )
            },
        },
    ]

    const rowSelection = {
        selectedRowKeys,
        onChange: (selectedKeys, rows) => {
            setSelectedRowKeys(selectedKeys)
            setSelectedRows(rows)
        },
    }

    // 获取分级标签是否开启
    const getTagStatus = async () => {
        try {
            setLoading(true)
            const res = await getDataGradeLabelStatus()
            setIsStart(res === GradeLabelStatusEnum.Open)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const start = async () => {
        try {
            const res = await startDataGradeLabel()
            if (res) {
                setIsStart(true)
                message.success(__('开启成功'))
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        getTagStatus()
    }, [])

    // useUpdateEffect(() => {
    //     getTable()
    // }, [searchValue])

    useEffect(() => {
        if (isStart) {
            getTable()
        }
    }, [isStart])

    // 查询
    const getTable = async (params?: any) => {
        try {
            setFetching(true)
            const res = await getDataGradeLabel(params)
            setDataSource(res?.entries || [])
            if (params?.keyword && res?.entries.length > 0) {
                setSearchExpandedKeys(getExpandedKeys(res?.entries))
            }
        } catch (error) {
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    // 获取展开树结构id
    const getExpandedKeys = (tree: any[], ids: any = []) => {
        tree.forEach((item) => {
            ids.push(item.id)
            if (item.children) {
                getExpandedKeys(item.children, ids)
            }
        })
        return ids
    }

    const handleStart = () => {
        confirm({
            title: __('确认要开启此功能吗？'),
            icon: (
                <InfoCircleFilled style={{ color: 'rgba(18, 110, 227, 1)' }} />
            ),
            content: __('开启后将无法关闭'),
            onOk: () => {
                start()
            },
            okText: __('确定'),
            cancelText: __('取消'),
        })
    }

    const items: MenuProps['items'] = [
        {
            key: CreateType.Tag,
            label: __('新建标签'),
        },
        {
            key: CreateType.Group,
            label: __('新建标签组'),
        },
    ]

    const handleAdd = ({ key }) => {
        setOperateType(OperateType.CREATE)
        if (Number(key) === CreateType.Tag) {
            if (!isCanCreate) {
                message.error(__('标签创建不能超过12个'))
                return
            }
            setAddTagOpen(true)
        }
        if (Number(key) === CreateType.Group) {
            setAddGroupOpen(true)
        }
    }

    const handleDelete = async (rows: any[]) => {
        if (!rows?.length) return
        try {
            setDelLoading(true)
            await Promise.all(rows.map((item) => deleteDataGradeLabel(item.id)))
            // await deleteDataGradeLabel(row.id)
            // if (row.node_type === DataGradeLabelType.Node) {
            //     setTagCount(tagCount - 1)
            // }
            setDeleteErrorList((pre) =>
                pre.filter((item) => !rows.map((o) => o.id)?.includes(item.id)),
            )
            setDelItem(undefined)
            message.success(__('删除成功'))
            getTable()
            getIcons()
        } catch (error) {
            formatError(error)
        } finally {
            setDelLoading(false)
        }
    }

    const components = {
        body: {
            row: DraggableBodyRow,
        },
    }

    const moveRow = useCallback(async (props) => {
        // eslint-disable-next-line react/prop-types
        const { dragId, dropId, dropParentId, operateType: ot } = props
        if (ot === 'drop' && dropParentId && dragId !== dropId) {
            try {
                await moveDataGradeLabel({
                    id: dragId,
                    dest_parent_id: dropParentId,
                    next_id: dropId,
                })
                message.success(__('移动成功'))
                getTable()
            } catch (err) {
                formatError(err)
            }
        }
    }, [])

    const findRow = (id) => {
        const { row, index, parentIndex } = findFromData(dataSource, id)
        return {
            row,
            rowIndex: index,
            rowParentIndex: parentIndex,
        }
    }

    const loopDelete = async (
        listArr: any[],
        index: number,
        errorList: any[],
    ) => {
        let count: number = index
        setDelCount(count)
        try {
            const res = await getGradeLabelBindInfo(listArr[count - 1].id)
            if (bindInfoIsEmpty(res)) {
                await handleDelete([listArr[count - 1]])
            } else {
                setErrorCount((pre) => pre + 1)
                const list: any = []
                gradeLabelBindInfoTypes.forEach((item) => {
                    if (res?.[item]?.entries?.length > 0) {
                        list.push(
                            ...res[item].entries.map((o) => ({
                                ...o,
                                type: gradeLabelBindInfoTypeMap[item],
                            })),
                        )
                    }
                })
                errorList.push({
                    name: listArr[count - 1].name,
                    id: listArr[count - 1].id,
                    objects: list,
                })
            }
        } catch (err) {
            // const obj = {
            //     ...err?.data,
            //     name: listArr[count - 1].name,
            //     type: listArr[count - 1].type,
            //     description:
            //         err?.data?.description ||
            //         __('请求的服务暂不可用，请稍后再试'),
            // }
            // errorList.push(obj)
        } finally {
            count += 1
            setDelCount(count)
            if (
                count - 1 === listArr.length ||
                errorList.findIndex((item) => item.code === 'ERR_CANCELED') > -1
            ) {
                setDeleteErrorList(errorList)
                if (errorList?.length) {
                    setDelConfrimOpen(true)
                }
                setShowDeleteProgress(false)
            } else {
                loopDelete(listArr, count, errorList)
            }
        }
    }

    return (
        <div className={styles['data-classification-tag-wrapper']}>
            {loading || fetching ? (
                <div className={styles.loader}>
                    <Loader />
                </div>
            ) : !isStart ? (
                <div className={styles['start-tag-container']}>
                    <FontIcon
                        name="icon-shujufenjibiaoqianweikaiqitushi"
                        type={IconType.COLOREDICON}
                        className={styles['tag-icon']}
                    />
                    <div className={styles['tag-title']}>
                        {__('数据分级标签')}
                    </div>
                    <div className={styles['tag-desc']}>
                        {__('开启数据分级标签后')}
                    </div>
                    <div className={styles['tag-desc']}>
                        {__('可以将关联了逻辑实体属性的数据字段进行打标分级')}
                    </div>
                    <Button
                        type="primary"
                        className={styles['start-btn']}
                        onClick={handleStart}
                    >
                        {__('立即开启')}
                    </Button>
                </div>
            ) : dataSource.length === 0 && !searchCondition?.keyword ? (
                <div className={styles['empty-container']}>
                    <Empty
                        iconSrc={dataEmpty}
                        desc={__('暂无数据，可通过【新建】来添加数据分级标签')}
                    />
                    <Dropdown
                        menu={{ items, onClick: handleAdd }}
                        placement="bottomLeft"
                        overlayStyle={{ minWidth: 160 }}
                    >
                        <Button type="primary" className={styles['add-btn']}>
                            <FontIcon name="icon-Add" />
                            &nbsp; {__('新建')}
                            <CaretDownOutlined />
                        </Button>
                    </Dropdown>
                </div>
            ) : (
                <>
                    <div className={styles.title}>
                        <TipsLabel
                            label={
                                <span style={{ fontWeight: 550 }}>
                                    {isSecurity
                                        ? __('数据密级标签')
                                        : __('数据分级标签')}
                                </span>
                            }
                            maxWidth="1050px"
                            placement="bottomRight"
                            tips={
                                <div>
                                    <div style={{ fontWeight: 550 }}>
                                        {__('数据分级标签')}
                                    </div>
                                    {titleTipsText.map((item, index) => (
                                        <div key={index}>{item}</div>
                                    ))}
                                </div>
                            }
                        />
                    </div>
                    <div className={styles.operateBox}>
                        <Space size={12}>
                            <Dropdown
                                menu={{ items, onClick: handleAdd }}
                                placement="bottomLeft"
                                overlayStyle={{ minWidth: 160 }}
                            >
                                <Button
                                    type="primary"
                                    className={styles['add-btn']}
                                >
                                    <FontIcon name="icon-Add" />
                                    &nbsp; {__('新建')}
                                    <CaretDownOutlined />
                                </Button>
                            </Dropdown>
                            <Button
                                className={styles['add-btn']}
                                disabled={!selectedRowKeys?.length}
                                onClick={() => {
                                    setShowDeleteProgress(true)
                                    setDelConfrim(true)
                                }}
                            >
                                {__('删除')}
                            </Button>
                        </Space>
                        <Space size={12} className={styles.serachBox}>
                            <SearchInput
                                placeholder={__('搜索级别名称')}
                                onKeyChange={(kw: string) => {
                                    if (!kw && !searchCondition.current) return
                                    searchCondition.current = kw
                                    const params = {
                                        ...searchCondition,
                                        current: 1,
                                        keyword: kw || '',
                                    }
                                    setSearchCondition(params)
                                    getTable(params)
                                }}
                                maxLength={255}
                                value={searchCondition.keyword}
                                className={styles.searchInput}
                                style={{ width: 285 }}
                            />
                            <RefreshBtn
                                onClick={() => getTable(searchCondition)}
                            />
                        </Space>
                    </div>
                    <div className={styles.content}>
                        <div className={styles.left}>
                            <DndProvider backend={HTML5Backend}>
                                <Table
                                    columns={
                                        using === 1
                                            ? columns
                                            : columns.filter(
                                                  (item) =>
                                                      item.key !==
                                                      'data_catalog_attribute_preset',
                                              )
                                    }
                                    className={classnames(
                                        using === 1 && styles.tagTable,
                                    )}
                                    rowClassName={styles.tableRow}
                                    expandable={{
                                        expandedRowKeys: searchValue
                                            ? searchExpandedKeys
                                            : expandedRowKeys,
                                        indentSize: 12,
                                        expandIcon: CustomExpandIcon,
                                    }}
                                    rowSelection={rowSelection}
                                    onExpand={(
                                        expanded: boolean,
                                        record: any,
                                    ) => {
                                        const res = expanded
                                            ? [...expandedRowKeys, record.id]
                                            : expandedRowKeys.filter(
                                                  (item) => item !== record.id,
                                              )
                                        setExpandedRowKeys(res)
                                    }}
                                    dataSource={dataSource}
                                    pagination={false}
                                    rowKey="id"
                                    loading={fetching}
                                    onRow={(record, index) => ({
                                        record,
                                        index,
                                        moveRow,
                                        findRow,
                                        resource: '',
                                    })}
                                    scroll={{
                                        y:
                                            dataSource.length === 0
                                                ? undefined
                                                : 'calc(100vh - 248px)',
                                    }}
                                    components={
                                        dataSource.length === 0
                                            ? undefined
                                            : components
                                    }
                                />
                            </DndProvider>
                        </div>
                    </div>
                </>
            )}
            {addTagOpen && (
                <AddTag
                    open={addTagOpen}
                    onClose={() => {
                        setAddTagOpen(false)
                        setEditItem(undefined)
                    }}
                    operateType={operateType}
                    onSuccess={() => {
                        getTable()
                        if (operateType === OperateType.EDIT) {
                            setEditItem(undefined)
                        } else {
                            setTagCount(tagCount + 1)
                        }
                    }}
                    data={editItem}
                />
            )}
            {addGroupOpen && (
                <AddGroup
                    open={addGroupOpen}
                    onClose={() => {
                        setAddGroupOpen(false)
                        setEditItem(undefined)
                    }}
                    operateType={operateType}
                    onSuccess={() => {
                        getTable()
                        if (operateType === OperateType.EDIT) {
                            setEditItem(undefined)
                        }
                    }}
                    data={editItem}
                />
            )}

            <Confirm
                title={
                    delItem?.node_type === DataGradeLabelType.Group
                        ? __('确认要删除选择的分组吗？')
                        : __('确认要删除选择的标签吗？')
                }
                content=""
                open={delConfrim}
                onOk={() => {
                    if (
                        delItem?.node_type === DataGradeLabelType.Group &&
                        delItem?.children?.length > 0
                    ) {
                        setDelGroupConfrim(true)
                    } else {
                        loopDelete(
                            selectedRows?.length > 0 ? selectedRows : [delItem],
                            1,
                            [],
                        )
                    }
                    setDelConfrim(false)
                }}
                onCancel={() => {
                    setDelConfrim(false)
                    setDelItem(undefined)
                }}
                okButtonProps={{ disabled: delLoading }}
            />
            <Confirm
                title={__(
                    '当前标签组下存在分级，需要先移除所有分级标签，才能删除标签组。',
                )}
                icon={
                    <ExclamationCircleFilled
                        style={{ color: '#126ee3' }}
                        className={styles.icon}
                    />
                }
                content=""
                open={delGroupConfrim}
                onOk={() => {
                    setDelGroupConfrim(false)
                }}
                onCancel={() => {
                    setDelGroupConfrim(false)
                }}
                okButtonProps={{ disabled: delLoading }}
            />
            <Modal
                width={800}
                open={delConfrimOpen}
                footer={null}
                getContainer={false}
                onCancel={() => setDelConfrimOpen(false)}
                title={showDeleteProgress ? __('删除分级标签') : undefined}
            >
                {showDeleteProgress ? (
                    <div className={styles.progresscontainer}>
                        <div>
                            {__(
                                '正在删除第${count}个分级标签（共${totle}）个',
                                {
                                    count: delCount - 1 || 1,
                                    totle: selectedRowKeys?.length || 1,
                                },
                            )}
                        </div>
                        <div className={styles.secLine}>
                            {__('已完成')}
                            {`${percentageCompletion}%`}
                        </div>
                        <Progress
                            percent={percentageCompletion}
                            showInfo={false}
                        />
                        {errorCount > 0 ? (
                            <div className={styles.errorTips}>
                                <CloseCircleFilled
                                    className={styles.errorIcon}
                                />
                                {__(
                                    '有${errorCount}个失败项，全部操作完成后可输出详情',
                                    { errorCount },
                                )}
                            </div>
                        ) : null}
                    </div>
                ) : (
                    <div className={styles.container}>
                        <div className={styles.title}>
                            <ExclamationCircleFilled className={styles.icon} />
                            <div className={styles.text}>{delTitle}</div>
                        </div>
                        <div className={styles.content}>
                            <DeleteErrorTable
                                data={deleteErrorList}
                                onDelete={(rows: any[]) => {
                                    handleDelete(rows)
                                    if (
                                        deleteErrorList.length === 1 ||
                                        deleteErrorList.length === rows.length
                                    ) {
                                        setDelConfrimOpen(false)
                                    }
                                }}
                                showCheckbox={selectedRowKeys.length > 1}
                            />
                        </div>
                        <div className={styles.operate}>
                            <Space size={12}>
                                {/* {!showDeleteProgress && (
                                    <Button
                                        className={styles.btn}
                                        onClick={() => setDelConfrimOpen(false)}
                                    >
                                        {__('取消')}
                                    </Button>
                                )} */}
                                <Button
                                    className={styles.btn}
                                    type="primary"
                                    onClick={() => setDelConfrimOpen(false)}
                                >
                                    {__('关闭')}
                                </Button>
                            </Space>
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    )
}

export default DataClassificationTag
