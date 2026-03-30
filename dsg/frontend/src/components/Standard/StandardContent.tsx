import {
    ExclamationCircleFilled,
    QuestionCircleOutlined,
} from '@ant-design/icons'
import { useAntdTable, useSize } from 'ahooks'
import { Button, Select, Space, Table, Tooltip, message } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { SortOrder } from 'antd/lib/table/interface'
import moment from 'moment'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { confirm } from '@/utils/modalHelper'
import { AddOutlined } from '@/icons'
import {
    IFormData,
    IStandardData,
    IStandardEnum,
    SortDirection,
    TaskStatus,
    deleteStandard,
    formatError,
    queryStandardEnum,
    queryStandards,
} from '@/core'
import DropDownFilter from '../DropDownFilter'
import {
    SortType,
    defaultMenu,
    getStandradRate,
    getYesOrNoText,
    menus,
    standardSearchList,
} from './const'
import styles from './styles.module.less'

import empty from '@/assets/emptyAdd.svg'
import { TaskInfoContext } from '@/context'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { OperateType } from '@/utils'
import Details from './Details'

export interface ISearchCondition {
    current?: number
    pageSize?: number
    direction?: SortDirection
    sort?: string
    keyword?: string
    is_standard?: number
}

interface IStandardContent {
    modalId: string
    form: IFormData
    updateFormList: (form?: IFormData) => void
}
const StandardContent: React.FC<IStandardContent> = ({
    form,
    modalId,
    updateFormList,
}) => {
    const { taskInfo } = useContext(TaskInfoContext)
    const [searchValue, setSearchValue] = useState('')
    const [isStandard, setIsStandard] = useState<number>(0)
    const [createVisible, setCreateVisible] = useState(false)
    const [detailVisible, setDetailVisible] = useState(false)
    const [standardId, setStandardId] = useState<number>()
    const [standardEnum, setStandardEnum] = useState<IStandardEnum>()
    const [operateType, setOperateType] = useState<OperateType>(
        OperateType.CREATE,
    )
    const [searchCondition, setSearchCondition] = useState<ISearchCondition>({
        pageSize: 10,
        current: 1,
        sort: defaultMenu.key,
        direction: defaultMenu.sort,
        is_standard: 0,
    })
    const [loading, setLoading] = useState(true)
    const [delLoading, setDelLoading] = useState(false)

    // 创建时间表头排序
    const [createSortOrder, setCreateSortOrder] = useState<SortOrder>('descend')

    // 修改时间表头排序
    const [updateSortOrder, setUpdateSortOrder] = useState<SortOrder>(null)

    const [menuValue, setMenuValue] = useState<
        { key: string; sort: SortDirection } | undefined
    >(defaultMenu)

    const searchRef = useRef<HTMLDivElement>(null)
    // 列表大小
    const sizeSearch = useSize(searchRef)

    // 获取业务标准枚举配置
    const getStandardEnum = async () => {
        const res = await queryStandardEnum()
        setStandardEnum(res)
    }

    useEffect(() => {
        getStandardEnum()
    }, [])

    useEffect(() => {
        setSearchValue('')
        setIsStandard(0)
        setLoading(true)
        setSearchCondition({
            ...searchCondition,
            keyword: '',
            is_standard: 0,
        })
    }, [form.id])

    const getFormFields = async (params: any) => {
        const {
            current: offset,
            pageSize: limit,
            keyword,
            sort,
            direction,
            is_standard,
            sorter,
        } = params
        let sortFields = {}
        if (sorter && Object.keys(sorter).length > 0) {
            const { order, columnKey } = sorter
            setCreateSortOrder(null)
            setUpdateSortOrder(null)
            if (columnKey === 'created_at') {
                setCreateSortOrder(order)
            } else {
                setUpdateSortOrder(order)
            }
            sortFields = {
                direction:
                    order?.indexOf(SortDirection.ASC) !== -1
                        ? SortDirection.ASC
                        : SortDirection.DESC,
                sort: columnKey,
            }
            setMenuValue({
                key: columnKey,
                sort:
                    order === 'ascend' ? SortDirection.ASC : SortDirection.DESC,
            })
        }
        try {
            const res = await queryStandards(modalId, form.id, {
                offset,
                limit,
                keyword,
                sort,
                direction,
                is_standard,
                ...sortFields,
            })
            setLoading(false)
            return { total: res.total_count, list: res.entries }
        } catch (error) {
            formatError(error)
            return { total: 0, list: [] }
        } finally {
            setLoading(false)
            setMenuValue(undefined)
        }
    }

    const { tableProps, run, pagination } = useAntdTable(getFormFields, {
        defaultPageSize: 10,
        manual: true,
    })

    useEffect(() => {
        if (form.id === '') return
        run({ ...searchCondition })
    }, [JSON.stringify(searchCondition), form.id])

    // 查全部时 若为空 则系统无数据
    const isSearchEmpty = useMemo(
        () =>
            tableProps.dataSource.length === 0 &&
            !searchCondition.keyword &&
            searchCondition.is_standard === 0,
        [tableProps.dataSource, searchCondition],
    )

    const delStandard = async (id: number) => {
        try {
            setDelLoading(true)
            await deleteStandard(modalId, form.id, id, taskInfo.taskId)
            message.success('删除成功！')
            setDelLoading(false)
            updateFormList(form)
            run({
                ...searchCondition,
                current:
                    tableProps.dataSource.length === 1
                        ? pagination.current - 1 || 1
                        : pagination.current,
            })
        } catch (error) {
            formatError(error)
        } finally {
            setDelLoading(false)
        }
    }

    const deleteConfirm = (id: number) => {
        confirm({
            title: '确认要删除标准吗？',
            icon: <ExclamationCircleFilled className={styles.delIcon} />,
            content: '标准删除后将无法找回，请谨慎操作！',
            onOk() {
                delStandard(id)
            },
            okButtonProps: {
                loading: delLoading,
            },
        })
    }

    const handleOperate = (type: OperateType, id?: number) => {
        if (type === OperateType.DETAIL) {
            setDetailVisible(true)
        } else {
            setCreateVisible(true)
        }
        setOperateType(type)
        setStandardId(id)
    }

    const columns: ColumnsType<IStandardData> = [
        {
            title: '字段中英文名称',
            fixed: 'left',
            width: 200,
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (_, record) => {
                return (
                    <div className={styles.showTableInfo}>
                        <div className={styles.topInfo} title={record.name}>
                            {record.name}
                        </div>
                        <div className={styles.enName} title={record.name_en}>
                            {record.name_en}
                        </div>
                    </div>
                )
            },
        },
        {
            title: '标准',
            dataIndex: 'is_standard',
            key: 'is_standard',
            render: (value) => getYesOrNoText(value),
        },
        {
            title: '本业务产生',
            dataIndex: 'is_current_business_generation',
            key: 'is_current_business_generation',
            render: (value) => getYesOrNoText(value),
        },
        {
            title: '数据类型',
            dataIndex: 'data_type',
            key: 'data_type',
        },
        {
            title: '数据长度',
            dataIndex: 'data_length',
            key: 'data_length',
        },
        {
            title: '主键',
            dataIndex: 'is_primary_key',
            key: 'is_primary_key',
            render: (value) => getYesOrNoText(value),
        },
        {
            title: '增量字段',
            dataIndex: 'is_incremental_field',
            key: 'is_incremental_field',
            render: (value) => getYesOrNoText(value),
        },
        {
            title: '必填',
            dataIndex: 'is_required',
            key: 'is_required',
            render: (value) => getYesOrNoText(value),
        },
        {
            title: '创建人/时间',
            dataIndex: 'created_at',
            key: 'created_at',
            width: 180,
            sorter: true,
            sortOrder: createSortOrder,
            render: (_, record: IStandardData) => {
                return (
                    <div className={styles.showTableInfo}>
                        <div
                            className={styles.topInfo}
                            title={record.created_by}
                        >
                            {record.created_by}
                        </div>
                        <div className={styles.bottomInfo}>
                            {moment(record.created_at).format(
                                'YYYY-MM-DD HH:mm:ss',
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            title: '最终修改人/时间',
            dataIndex: 'updated_at',
            key: 'updated_at',
            width: 180,
            sorter: true,
            sortOrder: updateSortOrder,
            render: (_, record: IStandardData) => {
                return (
                    <div className={styles.showTableInfo}>
                        <div
                            className={styles.topInfo}
                            title={record.updated_by}
                        >
                            {record.updated_by}
                        </div>
                        <div className={styles.bottomInfo}>
                            {moment(record.updated_at).format(
                                'YYYY-MM-DD HH:mm:ss',
                            )}
                        </div>
                    </div>
                )
            },
        },

        {
            title: '操作',
            fixed: 'right',
            width: 200,
            key: 'action',
            render: (_: string, record) => (
                <Space size={32}>
                    <Button
                        type="link"
                        onClick={() =>
                            handleOperate(OperateType.DETAIL, record.id)
                        }
                    >
                        查看
                    </Button>
                    {taskInfo.taskStatus !== TaskStatus.COMPLETED && (
                        <Button
                            type="link"
                            onClick={() =>
                                handleOperate(OperateType.EDIT, record.id)
                            }
                        >
                            编辑
                        </Button>
                    )}
                    {taskInfo.taskStatus !== TaskStatus.COMPLETED && (
                        <Button
                            type="link"
                            onClick={() => deleteConfirm(record.id)}
                        >
                            删除
                        </Button>
                    )}
                </Space>
            ),
        },
    ]

    // 输入框改变回调
    const handleSearchChange = (value: string) => {
        // 点击× 清空 重新请求数据
        if (!value) {
            setSearchCondition({
                ...searchCondition,
                keyword: value,
            })
        }
        setSearchValue(value)
    }

    // 回车搜索
    const handlePressEnter = (e: any) => {
        setSearchCondition({
            ...searchCondition,
            keyword: e.target.value,
            ...pagination,
            current: 1,
        })
    }

    // 筛选顺序变化
    const handleMenuChange = (selectedMenu) => {
        if (selectedMenu.key === SortType.CREATED) {
            setCreateSortOrder(
                selectedMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
            )
            setUpdateSortOrder(null)
        } else {
            setUpdateSortOrder(
                selectedMenu.sort === SortDirection.DESC ? 'descend' : 'ascend',
            )
            setCreateSortOrder(null)
        }
        setSearchCondition({
            ...searchCondition,
            sort: selectedMenu.key,
            direction: selectedMenu.sort,
        })
    }

    const handleStandardChange = (e: number) => {
        setIsStandard(e)
        setSearchCondition({
            ...searchCondition,
            is_standard: e,
        })
    }

    const FieldNormalizationRate = (
        <div className={styles.rateTips}>
            <p>字段标准化率=标准字段数量/总字段数量</p>
            <p>
                标准字段数量：{form.field_standard_rate.standard_fields_count}
            </p>
            <p>总字段数量：{form.field_standard_rate.fields_count}</p>
            <p>字段标准化率：{getStandradRate(form.field_standard_rate)}</p>
        </div>
    )

    const renderEmpty = () => {
        const descComp =
            taskInfo.taskStatus === TaskStatus.COMPLETED ? (
                '暂无数据'
            ) : (
                <div>
                    点击
                    <Button
                        type="link"
                        onClick={() => handleOperate(OperateType.CREATE)}
                    >
                        【新建标准】
                    </Button>
                    按钮
                    <p className={styles.operateDesc}>
                        可新建业务表单下字段的标准内容
                    </p>
                </div>
            )
        return <Empty desc={descComp} iconSrc={empty} />
    }

    return (
        <div className={styles.standardWrapper} ref={searchRef}>
            <div className={styles.operateWrapper}>
                {taskInfo.taskStatus !== TaskStatus.COMPLETED ? (
                    <Button
                        type="primary"
                        className={styles.btn}
                        onClick={() => handleOperate(OperateType.CREATE)}
                        disabled={taskInfo.taskStatus === TaskStatus.COMPLETED}
                    >
                        <AddOutlined className={styles.addIcon} />
                        新建标准
                    </Button>
                ) : (
                    <div />
                )}

                {isSearchEmpty ? null : (
                    <Space size={12}>
                        <span>是否标准</span>
                        <div className={styles.isStandard}>
                            <Select
                                className={
                                    (sizeSearch?.width || 700) < 700
                                        ? styles.shrinkStandardSelected
                                        : styles.selectIsStandard
                                }
                                onChange={handleStandardChange}
                                value={isStandard}
                            >
                                {standardSearchList.map((s) => (
                                    <Select.Option value={s.key} key={s.key}>
                                        {s.value}
                                    </Select.Option>
                                ))}
                            </Select>
                        </div>
                        <SearchInput
                            placeholder="请输入字段中英文名称"
                            value={searchValue}
                            onKeyChange={handleSearchChange}
                            onPressEnter={handlePressEnter}
                            className={
                                (sizeSearch?.width || 700) < 700
                                    ? styles.shrinkFieldInput
                                    : styles.fieldInput
                            }
                        />
                        <DropDownFilter
                            menus={menus}
                            defaultMenu={defaultMenu}
                            menuChangeCb={handleMenuChange}
                            changeMenu={menuValue}
                        />
                    </Space>
                )}
            </div>
            {isSearchEmpty ? null : (
                <div className={styles.normalizationRate}>
                    <span className={styles.normalizationRateLable}>
                        字段标准化率：
                    </span>
                    <span className={styles.normalizationRateValue}>
                        {getStandradRate(form.field_standard_rate)}
                    </span>
                    <Tooltip
                        title={FieldNormalizationRate}
                        placement="right"
                        getPopupContainer={(node) => node}
                    >
                        <QuestionCircleOutlined
                            className={styles.normalizationRateIcon}
                        />
                    </Tooltip>
                </div>
            )}

            {loading ? (
                <Loader />
            ) : tableProps.dataSource.length === 0 &&
              !searchCondition.keyword &&
              searchCondition.is_standard === 0 ? (
                <div className={styles.empty}>{renderEmpty()}</div>
            ) : (
                <div className={styles.indicatorList}>
                    <Table
                        columns={columns}
                        {...tableProps}
                        rowKey="name"
                        scroll={{ x: 1500, y: 'calc(100vh - 420px)' }}
                        pagination={{
                            ...tableProps.pagination,
                            showSizeChanger: false,
                            hideOnSinglePage: true,
                        }}
                        bordered={false}
                        sortDirections={['ascend', 'descend', 'ascend']}
                        locale={{ emptyText: <Empty /> }}
                    />
                </div>
            )}

            {/* <CreateStandard
                visible={createVisible}
                type={operateType}
                standardId={standardId}
                modalId={modalId}
                formInfo={form}
                standardEnum={standardEnum}
                onClose={() => setCreateVisible(false)}
                update={() => run(searchCondition)}
                updateFormList={updateFormList}
            /> */}

            <Details
                visible={detailVisible}
                modalId={modalId}
                formId={form.id}
                standardId={standardId}
                standardEnum={standardEnum}
                onClose={() => setDetailVisible(false)}
            />
        </div>
    )
}

export default StandardContent
