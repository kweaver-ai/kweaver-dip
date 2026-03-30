import React, { useState, useEffect, useContext, useRef, useMemo } from 'react'
import { toNumber, trim } from 'lodash'
import { Button, Divider, List, Table, Input, Progress } from 'antd'
import { ColumnsType } from 'antd/lib/table'
import { InfoCircleFilled } from '@ant-design/icons'
import classnames from 'classnames'
import { useDebounceFn } from 'ahooks'
import {
    LightweightSearch,
    ListDefaultPageSize,
    ListPagination,
    ListType,
    SearchInput,
} from '@/ui'
import { RefreshBtn } from '@/components/ToolbarComponents'
import {
    IStdToBeExecTaskItem,
    formatError,
    TaskStatus,
    formsQueryStandards,
    CatalogType,
    IDataItem,
    formsEnumConfig,
    IFormEnumConfigModel,
    getStdTaskBusinTable,
    getStdTaskBusinFieldTable,
    IStdTaskBusinTable,
    submitDataEle,
} from '@/core'
import { stardOrignizeTypeList } from '@/utils'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import Loader from '@/ui/Loader'
import __ from './locale'
import { BlankFormColored, DSFormColored, ProgressCheckOutlined } from '@/icons'
import { NewFormType } from '../Forms/const'
import { FieldState, stdTaskSearchData } from './const'
import SelDataByTypeModal from '../SelDataByTypeModal'
import DataEleDetails from '../DataEleManage/Details'
import { TaskInfoContext } from '@/context'

interface IStdToBeExecTaskProps {
    taskId: string
}

interface ISearchCondition {
    business_table_id: string
    keyword?: string
    state?: number
    offset: number
    limit: number
}

const defaultListType = ListType.NarrowList

const initSearchCondition: ISearchCondition = {
    business_table_id: '',
    keyword: '',
    // state代表过滤状态(0:不限，1：已完成，2：未完成)
    state: FieldState.NOLIMIT,
    offset: 1,
    limit: ListDefaultPageSize[defaultListType],
}

// 新建标准任务——待执行
const StdToBeExecTask: React.FC<IStdToBeExecTaskProps> = ({ taskId }) => {
    const { taskInfo, setTaskInfo } = useContext(TaskInfoContext)

    const [config, setConfig] = useState<IFormEnumConfigModel>()
    const [loading, setLoading] = useState(false)
    // 左侧业务表列表
    const [listLoading, setListLoading] = useState(true)
    // 右侧字段列表
    const [tableLoading, setTableLoading] = useState(true)

    const [searchCondition, setSearchCondition] =
        useState<ISearchCondition>(initSearchCondition)

    // 业务表列表
    // const [formListData, setFormListData] = useState<ICommonRes<any>>()
    const [formListData, setFormListData] = useState<Array<IStdTaskBusinTable>>(
        [],
    )
    // 选中业务表
    const [selectedForm, setSelectedForm] = useState<any>()
    // 业务表搜索字段关键词
    const [formSearchKey, setFormSearchKey] = useState<string>('')
    // 字段列表
    const [fieldsList, setFieldsList] = useState<Array<any>>([])
    const [total, setTotal] = useState<number>(0)
    const lightweightSearchRef: any = useRef()

    // 编辑选择数据对话框（用于码表/编码规则/标准文件的选择对话框）
    const [selDataByTypeVisible, setSelDataByTypeVisible] = useState(false)
    // 选择数据元
    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)
    // 仅查看单个数据元/码表/编码规则详情id
    const [detailId, setDetailId] = useState<string | undefined>('')

    // 搜索数据元
    const [fetching, setFetching] = useState(false)
    // 数据元集，其中std_id为数据元的id，id未数据元的code
    const [standards, setStandards] = useState<any[] | undefined>(undefined)
    const searchDERef = useRef<boolean>(false)

    // 搜索选中值
    const [searchSel, setSearchSel] = useState<any>()
    // 当前表格选中项
    const [curTableItem, setCurTableItem] = useState<any>()

    const stdTypeList = stardOrignizeTypeList.slice(1)

    // 标准类型
    const deStdType = useMemo(() => {
        return stdTypeList?.find((item) => item.value === taskInfo?.org_type)
            ?.label
    }, [taskInfo?.org_type])

    const labelText = (text: string) => {
        return text || '--'
    }

    const curProgress = useMemo(() => {
        const finish_number = toNumber(selectedForm?.finish_number || 0) * 100
        const total_number = toNumber(selectedForm?.total_number || 0)
        return total_number ? finish_number / total_number : 0
    }, [selectedForm?.finish_number])

    useEffect(() => {
        setStandards(undefined)
        setFormListData([])
        setFieldsList([])
        setTotal(0)
        setSearchSel(undefined)
        setSelectedForm(undefined)
        getFormList({}, true)
        getEnumConfig()
    }, [taskId])

    const formOnlySinglePage = useMemo(() => {
        return total <= ListDefaultPageSize[defaultListType]
    }, [total])

    useEffect(() => {
        if (!searchCondition?.business_table_id) return
        getFieldsList(searchCondition)
    }, [searchCondition])

    // 获取配置信息
    const getEnumConfig = async () => {
        try {
            const res = await formsEnumConfig()
            setConfig(res)
        } catch (e) {
            formatError(e)
        }
    }

    // 业务表列表
    const getFormList = async (params: any, isFirst = false) => {
        try {
            if (isFirst) {
                setLoading(true)
            }
            setListLoading(true)
            const { keyword } = params
            // const res = await reqFormList(taskId, keyword)
            const res = await getStdTaskBusinTable(taskId, keyword)
            // const res = []
            if (isFirst) {
                setSelectedForm(res?.data?.[0])
                setSearchCondition({
                    ...searchCondition,
                    business_table_id: res?.data?.[0]?.business_table_id || '',
                    keyword: '',
                    offset: 1,
                })
            }
            setFormListData(res?.data)
        } catch (e) {
            formatError(e)
        } finally {
            setListLoading(false)
            if (isFirst) {
                setLoading(false)
            }
        }
    }

    // 获取字段列表
    const getFieldsList = async (params: any) => {
        const { business_table_id, keyword } = params

        try {
            setTableLoading(true)
            const res = await getStdTaskBusinFieldTable({
                ...params,
                task_id: taskId,
            })
            setFieldsList(res.data)
            setTotal(res.total_count)
        } catch (e) {
            formatError(e)
        } finally {
            setTableLoading(false)
        }
    }

    // 搜索标准数据元
    const handleDataEleSearch = async (value) => {
        if (typeof value !== 'string' || !value?.length) {
            setStandards(undefined)

            return
        }
        try {
            setFetching(true)
            const res = await formsQueryStandards({
                keyword: value,
                limit: 1000,
            })
            setStandards(res || [])
        } catch (error) {
            setStandards([])
            formatError(error)
        } finally {
            setFetching(false)
        }
    }

    const handleSubmitDataEle = async (
        fId: string,
        deId: string,
        isNewCount?: boolean,
    ) => {
        // 提交数据元
        try {
            await submitDataEle({
                id: fId,
                data_element_id: deId,
            })
            const formListDataTemp = formListData?.map((fItem) => {
                if (
                    fItem.business_table_id === selectedForm?.business_table_id
                ) {
                    const finishNumber = fItem?.finish_number || 0
                    let newFinishNumber = deId
                        ? isNewCount
                            ? finishNumber + 1
                            : finishNumber
                        : finishNumber - 1
                    if (newFinishNumber < 0) {
                        newFinishNumber = 0
                    } else if (newFinishNumber > selectedForm?.total_number) {
                        newFinishNumber = selectedForm?.total_number
                    }
                    const newFItem = {
                        ...fItem,
                        finish_number: newFinishNumber,
                    }
                    setSelectedForm(newFItem)
                    return newFItem

                    // setSelectedForm(fItem)
                }
                return fItem
            })
            setFormListData(formListDataTemp)

            const field_finish_number = deId
                ? isNewCount
                    ? (taskInfo.field_finish_number || 0) + 1
                    : taskInfo.field_finish_number || 0
                : (taskInfo.field_finish_number || 0) - 1
            setTaskInfo({
                ...taskInfo,
                field_finish_number:
                    field_finish_number > 0 ? field_finish_number : 0,
            })

            // const res = await formsQueryStandardItem({ id: value })
            // if (!res) {
            //     return
            // }
            // // 判断是否为历史数据
            // const his = current.historyFields.find((h) => h.rowKey === value)
            // if (his) {
            //     // 清掉已有的选中项
            //     current.historyFields.splice(
            //         current.historyFields.indexOf(his),
            //         1,
            //     )
            // }
            // // 更新历史数据，对标标准信息，增加自定义信息
            // const { code_table_name, ...others } = res
            // current.historyFields.push({
            //     ...others,
            //     id: current.originalField.id,
            //     sid: current.originalField.id,
            //     standard_id: res.id,
            //     formulate_basis: res.std_type_name,
            //     rowName: FieldSource.SEARCH,
            //     rowKey: res.id,
            //     code_table_code:
            //         res?.code_table_code ||
            //         current.originalField.code_table_code,
            //     code_table:
            //         res?.code_table_name || current.originalField.code_table,
            // })
            // // 刷新列表
            // setSearchSel(value)
            // setHistory([...current.historyFields])
            // setSelectedRowKey(res.id)
        } catch (error) {
            formatError(error)
            getFieldsList(searchCondition)
        } finally {
            // setLoading(false)
        }
    }

    // 搜索防抖
    const { run } = useDebounceFn(handleDataEleSearch, {
        wait: 400,
        leading: false,
        trailing: true,
    })

    const handleCompositionStart = () => {
        searchDERef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        searchDERef.current = false
        // webkit：compositionstart onChange compositionend
        // firefox：compositionstart compositionend onChange
        if (navigator.userAgent.indexOf('WebKit') > -1) {
            handleDataEleSearch(e)
        }
    }

    const columns: ColumnsType<IStdToBeExecTaskItem> = [
        {
            title: __('原始字段名称'),
            dataIndex: 'business_table_field_origin_name',
            key: 'business_table_field_origin_name',
            ellipsis: true,
            render: (item) => {
                return <span>{labelText(item)}</span>
            },
        },
        {
            title: __('字段说明'),
            dataIndex: 'business_table_field_description',
            key: 'business_table_field_description',
            ellipsis: true,
            render: (item) => {
                return <span>{labelText(item)}</span>
            },
        },
        {
            title: __('数据元'),
            dataIndex: 'data_element',
            key: 'data_element',
            // ellipsis: true,
            width: '30%',
            render: (item, record: any) => {
                // return <span>{labelText(item)}</span>
                return taskInfo?.taskStatus === TaskStatus.COMPLETED ? (
                    <div
                        className={styles.dataEle}
                        onClick={(e) => {
                            if (record?.data_element_id) {
                                setDetailId(record?.data_element_id)
                                setDataEleDetailVisible(true)
                            }
                        }}
                    >
                        {item.name_cn}
                    </div>
                ) : (
                    <Input
                        className={styles.selDEInput}
                        placeholder={__('搜索数据元中英文名称')}
                        allowClear
                        value={record?.data_element?.name_cn || undefined}
                        title={record?.data_element?.name_cn || undefined}
                        onClick={(e) => {
                            e.stopPropagation()
                            setSelDataItems([])
                            setCurTableItem(record)
                            setSelDataByTypeVisible(true)
                        }}
                        onChange={(e) => {
                            const { value } = e.target
                            if (!value) {
                                // 搜索值
                                const fieldsListTemp = fieldsList?.map(
                                    (fItem) => {
                                        if (fItem?.id === record?.id) {
                                            // 清空数据元
                                            if (!value) {
                                                if (record?.data_element_id) {
                                                    handleSubmitDataEle(
                                                        record?.id,
                                                        '',
                                                    )
                                                }
                                            }

                                            return {
                                                ...fItem,
                                                data_element: value
                                                    ? fItem?.data_element
                                                    : undefined,
                                                data_element_id: value
                                                    ? fItem?.data_element_id
                                                    : undefined,
                                                noDataEle: !!value,
                                            }
                                        }
                                        return fItem
                                    },
                                )
                                setFieldsList(fieldsListTemp)
                            }
                        }}
                        suffix={
                            <Button
                                type="link"
                                className={styles.viewDataEle}
                                style={{
                                    color: record?.data_element_id
                                        ? undefined
                                        : 'rgba(18,110,227,0.35)',
                                }}
                                onClick={(e) => {
                                    if (record?.data_element_id) {
                                        setDetailId(record?.data_element_id)
                                        setDataEleDetailVisible(true)
                                    }
                                }}
                                hidden={!record?.data_element_id}
                            >
                                {__('查看')}
                            </Button>
                        }
                    />
                )
            },
        },
        {
            title: __('状态'),
            dataIndex: 'status',
            key: 'status',
            ellipsis: true,
            width: taskInfo?.taskStatus !== 'completed' ? 108 : 0,
            render: (status, record) => {
                return (
                    <ProgressCheckOutlined
                        style={{
                            fontSize: '16px',
                            color: record?.data_element_id
                                ? '#52C41B'
                                : 'rgba(0,0,0,0.15)',
                        }}
                    />
                )
            },
        },
    ]?.filter((item) => item.width !== 0)

    const renderListItem = (item: any) => {
        return (
            <div
                className={classnames(
                    styles.formListItem,
                    selectedForm?.business_table_id ===
                        item.business_table_id && styles.selectedFormItem,
                )}
                onClick={() => {
                    setSelectedForm(item)
                    lightweightSearchRef.current?.reset()
                    setSearchCondition({
                        ...initSearchCondition,
                        business_table_id: item?.business_table_id || '',
                    })
                }}
            >
                <div
                    className={classnames(
                        styles.formTypeIconWrapper,
                        item.business_table_type === NewFormType.BLANK
                            ? styles.blankFormIcon
                            : styles.importFormIcon,
                    )}
                >
                    {item.business_table_type === NewFormType.BLANK ? (
                        <BlankFormColored />
                    ) : (
                        <DSFormColored />
                    )}
                </div>
                <div className={styles.formInfoWrapper}>
                    <div
                        className={styles.formName}
                        title={item?.business_table_name || '--'}
                    >
                        {item?.business_table_name || '--'}
                    </div>
                    <div className={styles.progress}>
                        {`${__('进度：')}`}
                        {toNumber(item.finish_number) ===
                        toNumber(item.total_number) ? (
                            <ProgressCheckOutlined
                                style={{
                                    fontSize: '14px',
                                    color: '#52C41B',
                                }}
                            />
                        ) : (
                            `${item.finish_number || 0}/${item.total_number}`
                        )}
                    </div>
                </div>
            </div>
        )
    }

    // 搜索, 自处理
    const handleFormSearchPressEnter = async (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setFormSearchKey(keyword)
        getFormList({
            keyword,
        })
        // getDoneTaskList(keyword)
    }

    // 搜索框enter
    const handleFieldSearchPressEnter = (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        // setSearchKey(keyword)
        setSearchCondition({
            ...searchCondition,
            keyword,
            offset: 1,
        })
    }

    const searchChange = (d, dataKey) => {
        let searchConditionTemp = {
            ...searchCondition,
        }
        if (!dataKey) {
            // 清空筛选
            searchConditionTemp = {
                ...searchCondition,
                ...d,
            }
        } else {
            searchConditionTemp = {
                ...searchCondition,
                [dataKey]: d[dataKey],
            }
        }
        setSearchCondition(searchConditionTemp)
    }

    const handlePageChange = (offset: number, limit: number) => {
        setSearchCondition({
            ...searchCondition,
            offset,
            limit,
        })
    }

    // 空库表
    const showEmpty = () => {
        const desc = <span>暂无待执行字段</span>
        const icon = dataEmpty
        return <Empty desc={desc} iconSrc={icon} />
    }

    return (
        <div
            className={classnames(styles.taskWrapper, styles.taskToExecWrapper)}
        >
            {loading ? (
                <div className={styles.empty}>
                    <Loader />
                </div>
            ) : !formListData?.length && !formSearchKey ? (
                <div className={styles.empty}>
                    <Empty iconSrc={dataEmpty} desc={__('暂无数据')} />
                </div>
            ) : (
                <div className={styles.newStdContent}>
                    <div className={styles.formListWrapper}>
                        {listLoading ? (
                            <Loader />
                        ) : (
                            <>
                                <SearchInput
                                    className={styles.formSearchInput}
                                    placeholder={__('搜索业务表名称')}
                                    value={formSearchKey}
                                    onKeyChange={(kw: string) =>
                                        handleFormSearchPressEnter(kw)
                                    }
                                    onPressEnter={handleFormSearchPressEnter}
                                    maxLength={128}
                                />

                                <List
                                    dataSource={formListData}
                                    renderItem={renderListItem}
                                    className={styles.formList}
                                    locale={{
                                        emptyText: <Empty />,
                                    }}
                                />
                            </>
                        )}
                    </div>
                    <Divider
                        type="vertical"
                        style={{ height: '100%', margin: 0 }}
                    />
                    <div className={styles.fieldsListWrapper}>
                        <div className={styles.fieldsTopWrapper}>
                            <div className={styles.deStdType}>
                                {deStdType && (
                                    <>
                                        <InfoCircleFilled
                                            style={{ color: '#1890FF' }}
                                        />

                                        <div className={styles.typeContent}>
                                            {__('需配置')}
                                            <span style={{ fontWeight: 550 }}>
                                                {__('“${type}”', {
                                                    type: stardOrignizeTypeList?.find(
                                                        (item) =>
                                                            item.value ===
                                                            taskInfo?.org_type,
                                                    )?.label,
                                                })}
                                            </span>
                                            {__('的数据元')}
                                        </div>
                                    </>
                                )}
                            </div>
                            <div className={styles.filterWrapper}>
                                <div className={styles.progressWrapper}>
                                    {__('进度：')}
                                    <Progress
                                        percent={curProgress}
                                        size="small"
                                        showInfo={false}
                                    />
                                    {toNumber(selectedForm?.total_number) >=
                                        0 && (
                                        <div style={{ fontSize: 12 }}>
                                            <span style={{ color: '#126EE3' }}>
                                                {toNumber(
                                                    selectedForm?.finish_number,
                                                )}
                                            </span>
                                            {` / ${toNumber(
                                                selectedForm?.total_number,
                                            )}`}
                                        </div>
                                    )}
                                </div>
                                <SearchInput
                                    placeholder={__('搜索原始字段名称')}
                                    value={searchCondition?.keyword}
                                    onKeyChange={(kw: string) => {
                                        if (kw !== searchCondition.keyword) {
                                            const searchConditionTemp = {
                                                ...searchCondition,
                                                keyword: kw,
                                                offset: 1,
                                            }
                                            setSearchCondition(
                                                searchConditionTemp,
                                            )
                                        }
                                    }}
                                    className={styles.searchInput}
                                    style={{ width: 272 }}
                                />

                                {taskInfo?.taskStatus !== 'completed' && (
                                    <div className={styles.selectWrapper}>
                                        <LightweightSearch
                                            ref={lightweightSearchRef}
                                            formData={stdTaskSearchData}
                                            onChange={(data, key) =>
                                                searchChange(data, key)
                                            }
                                            defaultValue={{
                                                state: initSearchCondition.state,
                                            }}
                                        />
                                    </div>
                                )}
                                <div className={styles.refreshBtn}>
                                    <RefreshBtn
                                        onClick={() => {
                                            getFieldsList(searchCondition)
                                        }}
                                    />
                                </div>
                            </div>
                        </div>
                        <Table
                            rowKey="id"
                            locale={{
                                emptyText: <Empty />,
                            }}
                            className={styles.fieldsTable}
                            rowClassName={styles.tableRow}
                            columns={columns}
                            dataSource={fieldsList}
                            loading={tableLoading}
                            pagination={false}
                            scroll={{
                                y: formOnlySinglePage
                                    ? 'calc(100vh - 203px)'
                                    : 'calc(100vh - 259px)',
                            }}
                        />
                        <ListPagination
                            listType={defaultListType}
                            queryParams={searchCondition}
                            totalCount={total}
                            onChange={handlePageChange}
                            className={styles.pagination}
                        />
                    </div>
                </div>
            )}

            {/* 选择码表/编码规则 */}
            {selDataByTypeVisible && (
                <SelDataByTypeModal
                    visible={selDataByTypeVisible}
                    // ref={selDataRef}
                    onClose={() => setSelDataByTypeVisible(false)}
                    onOk={(oprItems: any) => {
                        const selItem = oprItems?.[0] || {}
                        handleSubmitDataEle(
                            curTableItem?.id,
                            selItem?.key,
                            !curTableItem?.data_element_id,
                        )

                        const fieldsListTemp = fieldsList?.map((fItem) => {
                            if (fItem?.id === curTableItem?.id) {
                                const curTableItemTemp = {
                                    ...fItem,
                                    data_element: {
                                        name_cn: selItem?.value,
                                        name_en: selItem?.otherInfo,
                                        std_type:
                                            config?.formulate_basis.find(
                                                (currentData) =>
                                                    currentData.id ===
                                                    selItem?.std_type,
                                            )?.value_en || '',
                                    },
                                    deKw: selItem?.value,
                                    data_element_id: selItem?.key,
                                }
                                setCurTableItem(curTableItemTemp)
                                setStandards([
                                    {
                                        id: selItem?.code,
                                        std_id: selItem?.key,
                                        name: selItem?.value,
                                        name_en: selItem?.otherInfo,
                                        std_type_name:
                                            config?.formulate_basis.find(
                                                (currentData) =>
                                                    currentData.id ===
                                                    selItem?.std_type,
                                            )?.value_en || '',
                                    },
                                ])
                                return curTableItemTemp
                            }
                            return fItem
                        })
                        setFieldsList(fieldsListTemp)
                    }}
                    dataType={CatalogType.DATAELE}
                    specifyStdType={taskInfo?.org_type}
                    showAddNewBtn
                    rowSelectionType="radio"
                    oprItems={selDataItems}
                    setOprItems={setSelDataItems}
                    handleShowDataDetail={(
                        dataType: CatalogType,
                        dataId?: string,
                    ) => {
                        if (dataId) {
                            // 选择对话框中选择列表中编码规则查看详情
                            setDetailId(dataId)
                            setDataEleDetailVisible(true)
                        }
                    }}
                    stdRecParams={{
                        table_name: selectedForm?.business_table_name,
                        table_fields: [
                            {
                                table_field:
                                    curTableItem?.business_table_field_origin_name,
                            },
                        ],
                    }}
                />
            )}
            {/* 查看数据元详情 */}
            {dataEleDetailVisible && !!detailId && (
                <DataEleDetails
                    visible={dataEleDetailVisible}
                    dataEleId={detailId}
                    onClose={() => setDataEleDetailVisible(false)}
                />
            )}
        </div>
    )
}

export default StdToBeExecTask
