import {
    CaretRightOutlined,
    ExclamationCircleFilled,
    InfoCircleFilled,
} from '@ant-design/icons'
import {
    Button,
    Collapse,
    Divider,
    Input,
    List,
    message,
    Popconfirm,
    Space,
    Table,
    Tabs,
    Tooltip,
} from 'antd'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { isEqual, toNumber, trim } from 'lodash'
import moment from 'moment'
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { TaskInfoContext } from '@/context'
import {
    cancelBusinessTableField,
    createStdTask,
    deleteBusinessTableField,
    formatError,
    formsQueryStandardCreateTaskList,
    formsQueryStandardCreatingTaskList,
    formsQueryStandardDoneTaskList,
    getFieldRelateTasksInfo,
    getPendingBusinTable,
    getPendingBusinTableField,
    IBusinTableField,
    IPendingBusinsTableFieldQuery,
    IPendingRes,
    messageError,
    SortDirection,
    TaskStatus,
    TaskType,
    updFieldDesc,
} from '@/core'
import { BlankFormColored, DSFormColored } from '@/icons'
import {
    LightweightSearch,
    ListDefaultPageSize,
    ListType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import { keyboardCharactersReg, OperateType, useQuery } from '@/utils'
import { confirm } from '@/utils/modalHelper'
import { getSource } from '@/utils/request'
import dataEmpty from '../../assets/dataEmpty.svg'
import CustomDrawer from '../CustomDrawer'
import { statusInfos } from '../MyTask/const'
import { StatusLabel } from '../MyTask/custom/StatusComponent'
import CreateTask from '../TaskComponents/CreateTask'
import {
    NewFormType,
    NewStdOperate,
    TabKey,
    TabKeyValue,
    tabList,
} from './const'
import { allStatusValue, reqStandSearchData } from './helper'
import __ from './locale'
import styles from './styles.module.less'

interface IReqAddStandard {
    showStateTabs?: boolean
    open: boolean
    coreBizName?: string
    fid?: number | string
    mbid?: string
    titleText?: string
    onSure: () => void
    onClose: () => void
    getContainer?: any
}

/**
 * 请求创建标准
 * @param open: boolean
 * @param fid: 业务表ID
 * @param mbid: main_business_id
 * @param coreBizName 业务模型名称
 * @param titleText: 标题
 * @param onSure: () => void
 * @param onClose: () => void
 * @returns
 */
const ReqAddStandard: React.FC<IReqAddStandard> = ({
    showStateTabs = true,
    open,
    coreBizName,
    fid,
    mbid = '',
    titleText,
    onSure = () => {},
    onClose = () => {},
    getContainer = false,
}) => {
    const { taskInfo } = useContext(TaskInfoContext)
    // 错误提示
    const [errorText, setErrorText] = useState('')

    // loading
    const [loading, setLoading] = useState(false)
    // const [fetching, setFetching] = useState(false)

    // 展示的Collapse
    // const [activeKey, setActiveKey] = useState<any[]>([])

    // 标准化管理-业务表列表
    const [businTableList, setBusinTableList] = useState<any[]>([])
    // 字段列表--一次性查询所有，保存原始列表数据
    const [fieldsTable, setFieldsTable] =
        useState<IPendingRes<IBusinTableField>>()
    // 字段列表
    const [fields, setFields] = useState<Array<IBusinTableField>>()
    const lightweightSearchRef: any = useRef()

    // 选中业务表 -- 存储不同tab下选中业务表
    const [selectedForms, setSelectedForms] = useState<{}>({})

    // 已选表格数据 -- 二维数组，存放多个表格已选ID数组
    const [selectedRowKeysArry, setSelectedRowKeysArry] = useState<{}>({})

    // tabs名称后显示的数量
    const [tabsTotal, setTabsTotal] = useState<number[]>([0, 0, 0])

    // tabs当前选中
    const [tabsActiveKey, setTabsActiveKey] = useState<TabKey>(
        TabKey.AWAITSTART,
    )

    // tabs当前选中
    const [rowSelectionList, setRowSelectionList] = useState<any>({})
    // 创建任务弹窗显示
    const [taskShow, setTaskShow] = useState(false)

    // const [createTaskDefaultData, setCreateTaskDefaultData] = useState<any[]>(
    //     [],
    // )
    const [showSearch, setShowSearch] = useState<boolean>(false)
    const [btnDisabled, setBtnDisabled] = useState<boolean>(true)
    const [pageLoading, setPageLoading] = useState<boolean>(false)
    const [fieldListLoading, setFieldListLoading] = useState<boolean>(false)
    const [businTableListLoading, setBusinTableListLoading] =
        useState<boolean>(false)
    const [searchKey, setSearchKey] = useState<string>()
    const [timer, setTimer] = useState<any>()

    const initSearchCondition: IPendingBusinsTableFieldQuery = {
        // 业务表模型id
        business_table_model_id: mbid,
        // 业务表名称
        business_table_id: selectedForms?.[tabsActiveKey]?.business_table_id,
        state: TabKeyValue[tabsActiveKey].join(','),
        keyword: '',
        // offset: 1,
        // limit: ListDefaultPageSize[ListType.NarrowList],
    }

    // 字段查询参数
    // 需要手动调用getFieldsList方法获取数据
    const [searchCondition, setSearchCondition] =
        useState<IPendingBusinsTableFieldQuery>({
            // 业务表模型id
            business_table_model_id: mbid,
            // 业务表名称
            business_table_id:
                selectedForms?.[tabsActiveKey]?.business_table_id || '',
            state: TabKeyValue[tabsActiveKey].join(','),
            keyword: '',
            // offset: 1,
            // limit: ListDefaultPageSize[ListType.NarrowList],
            // sort: 'update_time',
            direction: SortDirection.DESC,
        })
    // 业务表列表
    const [formListData, setFormListData] = useState<Array<any>>([])
    // 业务表搜索字段关键词
    const [formSearchKey, setFormSearchKey] = useState<string>('')

    // 创建任务是否需要父任务id
    const needParentTaskId = true
    // 任务名称独占一行
    const isNameRow = true

    const { Panel } = Collapse

    // 根据URL获取main_business_id
    const getMainBusinessId = () => {
        const url = window.location.pathname
        const id =
            url.split('/').length > 0
                ? url.split('/')[url.split('/').length - 1]
                : ''
        return id
    }

    const mainBusinessId = mbid || getMainBusinessId()

    // useEffect(() => {
    //     mainBusinessId = mbid || ''
    //     if (mainBusinessId !== '') {
    //         // getStandardListSum()
    //         tabsOnChange(TabKey.AWAITSTART)
    //     }
    // }, [mbid])

    const sourceType =
        window.location.pathname.indexOf('/coreBusiness') > -1
            ? 'mainBusiness'
            : 'executeTask'

    const query = useQuery()
    const taskId = query.get('taskId') || ''
    const projectId = query.get('projectId') || ''

    // 新建标准任务信息
    const [createTaskDefaultData, setCreateTaskDefaultData] = useState<any[]>([
        {
            name: 'name',
            value: `新建标准${
                coreBizName ? `-${coreBizName.substring(0, 27)}` : ''
            }`,
        },
        {
            name: 'stage_node',
            hidden: true,
            disabled: true,
            value: {
                node_id: taskInfo?.node_id,
                node_name: taskInfo?.node_name,
            },
        },
        {
            name: 'task_type',
            disabled: true,
            value: TaskType.FIELDSTANDARD,
        },
        {
            name: 'project_id',
            disabled: true,
            value: {
                id: taskInfo?.projectId,
                name: taskInfo?.project_name,
                nodeId: taskInfo?.node_id,
            },
            hidden: true,
        },
        {
            name: 'other',
            value: { parent_task_id: taskId },
        },
    ])

    const getErrorMessage = (error) => {
        switch (error?.data?.code) {
            case 'TaskCenter.Task.TaskDomainNotExist':
                return messageError(__('关联业务领域或业务模型被删除'))

            default:
                return formatError({ error })
        }
    }

    useEffect(() => {
        setBusinTableList([])
        setSelectedForms({})
        if (open) {
            setErrorText('暂无数据')
            setTabsActiveKey(TabKey.AWAITSTART)
            if (mainBusinessId) {
                // getStandardListSum()
                tabsOnChange(TabKey.AWAITSTART)
            }
            // 根据URL判断业务模型还是执行标准化任务
            // getDetails()
        }
    }, [open])

    useEffect(() => {
        if ([TabKey.AWAITSTART, TabKey.DOING].includes(tabsActiveKey)) {
            const selectionList = {}
            const selectArry: any = {}
            businTableList.forEach((item, index) => {
                // selectionList.push(rowSelection(item.business_table_id))
                selectionList[item.business_table_id] = rowSelection(
                    item.business_table_id,
                )
                selectArry[item?.business_table_id] = []
            })
            setRowSelectionList(selectionList)
            setSelectedRowKeysArry(selectArry)
        }
    }, [businTableList])

    useEffect(() => {
        // const fieldsTemp = fileCatlgTreeToStdTreeData
        setFields(fieldsTable?.data)
    }, [fieldsTable])

    // 取消onClick
    const handleCancel = () => {
        const sor = getSource()
        if (sor.length > 0) {
            sor[0].source.cancel(__('取消'))
        }
        onClose()
    }

    const createTaskHandle = async () => {
        // 无数据不能发起请求
        if (businTableList.length === 0) return
        try {
            setLoading(true)
            setTaskShow(true)
        } catch (error) {
            formatError(error)
        } finally {
            setLoading(false)
        }
    }

    const createTaskToStandard = async (info) => {
        const fIds =
            createTaskDefaultData?.[(createTaskDefaultData?.length || 0) - 1]
                ?.fieldsIds || []
        await createStdTask(info.length > 0 ? info[0].id : '', fIds)
        getBusinTableList(
            {
                business_table_model_id: mbid || '',
                keyword: formSearchKey,
                state: TabKeyValue[tabsActiveKey].join(','),
            },
            tabsActiveKey,
        )
        message.success(__('请求已发出并创建任务成功'))
        // 切换到进行中
        tabsOnChange(TabKey.DOING)
        onSure()
    }

    // 搜索, 自处理
    const handleFormSearchPressEnter = async (e: any) => {
        const keyword = typeof e === 'string' ? e : trim(e.target.value)
        setFormSearchKey(keyword)
        // getDoneTaskList(keyword)
        // if (e === TabKey.AWAITSTART) {
        //     await getCreateTaskList({
        //         keyword: formSearchKey,
        //     })
        // } else if (e === TabKey.DOING) {
        //     await getCreatingTaskList({
        //         keyword: formSearchKey,
        //     })
        // } else if (e === TabKey.DONE) {
        //     await getDoneTaskList(keyword)
        // }

        getBusinTableList(
            {
                business_table_model_id: mbid || '',
                keyword,
                state: TabKeyValue[tabsActiveKey].join(','),
            },
            tabsActiveKey,
        )
    }

    // 表格输入框取值
    const editColumnsChange = async (key: string, value: string, data: any) => {
        try {
            // 不判断是否有值，空值为清空操作
            await updFieldDesc(data.id, value)
        } catch (e) {
            formatError(e)
        }
    }

    // 多选表格
    const rowSelection = (index) => {
        return {
            selectedRowKeys: selectedRowKeysArry[index],
            onChange: (key) => onSelectChange(key, index),
        }
    }

    useEffect(() => {
        setSearchKey('')
        lightweightSearchRef.current?.reset()
        if (selectedForms?.[tabsActiveKey]?.business_table_id) {
            setSearchCondition({
                ...searchCondition,
                state: TabKeyValue[tabsActiveKey].join(','),
                business_table_id:
                    selectedForms?.[tabsActiveKey]?.business_table_id,
                keyword: '',
                sort:
                    tabsActiveKey === TabKey.DONE
                        ? 'update_time'
                        : 'create_time',
                direction: SortDirection.DESC,
                // offset: 1,
                // limit: ListDefaultPageSize[ListType.NarrowList],
            })
        }
    }, [selectedForms])

    const formOnlySinglePage = useMemo(() => {
        return (
            (formListData?.find(
                (fItem) =>
                    fItem?.business_table_id ===
                    selectedForms?.[tabsActiveKey]?.business_table_id,
            )?.total_number || 0) <= ListDefaultPageSize[ListType.NarrowList]
        )
    }, [selectedForms?.[tabsActiveKey]])

    // 进行中-撤销请求
    const removeAllBtnDiable = useMemo(() => {
        if (tabsActiveKey !== TabKey.DOING) return true
        return (
            !selectedRowKeysArry?.[
                selectedForms?.[tabsActiveKey]?.business_table_id
            ]?.length ||
            !!fieldsTable?.data?.find(
                (item) =>
                    selectedRowKeysArry?.[
                        selectedForms?.[tabsActiveKey]?.business_table_id
                    ]?.includes(item?.business_table_field_id) &&
                    item.task_status !== TaskStatus.READY,
            )
        )
    }, [selectedRowKeysArry])

    const onSelectChange = (newSelectedRowKeys: React.Key[], index) => {
        const selectedRowKeysArryTemp = { ...(selectedRowKeysArry || {}) }
        selectedRowKeysArryTemp[index] = newSelectedRowKeys
        const hasSelectedRowKeys = !!businTableList?.find(
            (fItem) =>
                selectedRowKeysArryTemp[fItem?.business_table_id]?.length > 0,
        )
        setBtnDisabled(!hasSelectedRowKeys)
        setSelectedRowKeysArry(selectedRowKeysArryTemp)
    }

    // tabs onchange
    const tabsOnChange = async (e) => {
        await setTabsActiveKey(e)
        setBusinTableList([])
        setSearchKey('')
        setFormSearchKey('')
        // setSelectedForms(undefined)
        setBtnDisabled(true)
        setSelectedRowKeysArry({})
        try {
            // setFetching(true)
            getBusinTableList(
                {
                    business_table_model_id: mbid || '',
                    keyword: '',
                    state: TabKeyValue[e].join(','),
                },
                e,
            )
        } catch (error) {
            formatError(error)
        } finally {
            // setFetching(false)
        }
    }

    useEffect(() => {
        getFieldsList(searchCondition)
    }, [searchCondition])

    // 获取业务表
    const getBusinTableList = async (params: any, curTabKey: TabKey) => {
        const { business_table_model_id, keyword } = params || {}
        if (!keyword) {
            setPageLoading(true)
        }
        try {
            setBusinTableListLoading(true)
            const createResSum = 0
            const res = await getPendingBusinTable(params)
            const data = res?.data || []
            // setActiveKey(keys)
            setBusinTableList(data)
            // 如在此页面tab项中选中xx业务表，切换其他tab后再切换到待创建tab时，选中表为上次选中业务表
            const curSelFormItemExist = data?.find(
                (fItem) =>
                    fItem.business_table_id ===
                    selectedForms?.[curTabKey]?.business_table_id,
            )
            // 搜索业务表的情况下，不需要重新设置当前选中表
            if (!keyword) {
                if (!curSelFormItemExist) {
                    setSelectedForms({
                        ...selectedForms,
                        [curTabKey]: data?.[0],
                    })
                } else {
                    setSearchCondition({
                        ...searchCondition,
                        business_table_id:
                            selectedForms?.[curTabKey]?.business_table_id,
                        state: TabKeyValue[curTabKey].join(','),
                        keyword: '',
                        sort:
                            curTabKey === TabKey.DONE
                                ? 'update_time'
                                : 'create_time',
                        direction: SortDirection.DESC,
                        // offset: 1,
                        // limit: ListDefaultPageSize[ListType.NarrowList],
                    })
                }
            }
            tabsTotal[0] = createResSum
            setTabsTotal(tabsTotal)
            setLoading(data.length === 0)
            setPageLoading(false)
        } catch (e) {
            setPageLoading(false)
            formatError(e)
        } finally {
            setBusinTableListLoading(false)
        }
    }

    // 获取业务表不同tab下对应字段
    const getFieldsList = async (params: IPendingBusinsTableFieldQuery) => {
        try {
            setFieldListLoading(true)
            const { business_table_id, business_table_model_id, state } = params
            if (!business_table_model_id || !business_table_id) return
            const res = await getPendingBusinTableField(params)

            const { data } = res
            if (isEqual(state, TabKeyValue[TabKey.DOING]?.join())) {
                const taskIds: any[] = []
                data?.forEach((item) => {
                    const { task_id } = item
                    if (task_id && !taskIds.includes(task_id)) {
                        taskIds.push(task_id)
                    }
                })
                const tIds = taskIds?.join()
                const tasksInfo = {}
                if (tIds) {
                    // 字段相关任务信息
                    const tasks = await getFieldRelateTasksInfo(
                        tIds,
                        'id,name,status',
                    )

                    tasks?.forEach((tItem) => {
                        tasksInfo[tItem.id] = tItem
                    })
                }
                setFieldsTable({
                    ...res,
                    data: data?.map((item) => {
                        const { task_id = '' } = item
                        return {
                            ...item,
                            task_name: tasksInfo[task_id]?.name,
                            task_status: tasksInfo[task_id]?.status,
                        }
                    }),
                })
            } else {
                setFieldsTable(res)
            }
        } catch (e) {
            formatError(e)
        } finally {
            setFieldListLoading(false)
        }
    }

    // 获取标准列表总数
    const getStandardListSum = async () => {
        const obj =
            sourceType === 'executeTask'
                ? { standard_create_task_id: taskId }
                : { main_business_id: mainBusinessId }
        const createRes = await formsQueryStandardCreateTaskList(
            sourceType === 'executeTask'
                ? { standard_task_id: taskId }
                : { main_business_id: mainBusinessId },
        )
        const creatingRes = await formsQueryStandardCreatingTaskList(obj)
        const doneRes = await formsQueryStandardDoneTaskList(obj)
        let createResSum = 0
        createRes.forEach((it) => {
            createResSum += it.fields.length
        })
        let creatingResSum = 0
        creatingRes.forEach((it) => {
            creatingResSum += it.fields.length
        })
        setBusinTableList(createRes)
        const keys: any[] = []
        createRes?.forEach((item, index) => {
            keys.push(index.toString())
        })
        setLoading(createResSum === 0)
        // setActiveKey(keys)
        setTabsTotal([createResSum, creatingResSum, doneRes.length])
        setShowSearch(doneRes.length > 0)
    }

    const btnOperate = async (oprType: string, id?: string) => {
        if (oprType === NewStdOperate.REMOVE) {
            const type =
                tabsActiveKey === TabKey.AWAITSTART ? __('移除') : __('撤销')
            let selectedKeys: Array<any> = []
            let ids = id ? [id] : []
            if (!id) {
                businTableList?.forEach((fItem) => {
                    selectedKeys = selectedKeys.concat(
                        selectedRowKeysArry?.[fItem?.business_table_id] || [],
                    )
                })
                ids = selectedKeys
            }
            if (!ids?.length) return
            confirm({
                title: `${__(`确定要`)}${type}${__('新建标准请求吗？')}`,
                icon: <ExclamationCircleFilled />,
                closable: true,
                width: 432,
                content: (
                    <div>
                        <div>
                            {__(
                                '撤销后数据开发工程师不再对撤销的字段新建标准，请确认操作。',
                            )}
                        </div>
                    </div>
                ),
                async onOk() {
                    try {
                        await cancelBusinessTableField(ids)
                        getBusinTableList(
                            {
                                business_table_model_id: mbid || '',
                                keyword: '',
                                state: TabKeyValue[tabsActiveKey].join(','),
                            },
                            tabsActiveKey,
                        )
                    } catch (e) {
                        formatError(e)
                    }
                },
                onCancel() {},
            })
        }
    }

    // id拆分
    const splitArray = (array: any[], size: number) => {
        const data: any[] = []
        for (let i = 0; i < array.length; i += size) {
            data.push(array.slice(i, i + size))
        }
        return data
    }

    const tabsItems = tabList.map((item, index) => {
        return {
            // label: `${item.label}(${tabsTotal[index]})`,
            label: item.label,
            key: item.key,
        }
    })

    const searchChange = (d, dataKey) => {
        setFieldListLoading(true)
        if (timer) {
            clearTimeout(timer)
        }
        if (dataKey === 'task_status') {
            let fieldsTemp
            if (d[dataKey] === allStatusValue) {
                fieldsTemp = fieldsTable?.data
            } else {
                fieldsTemp = fieldsTable?.data?.filter((fItem) => {
                    return fItem?.[dataKey] === d[dataKey]
                })
            }

            setFields(fieldsTemp)
        }
        // 前端搜索太快，用户没有搜索感知，增加定时器增加加载动画
        setTimer(
            setTimeout(() => {
                setFieldListLoading(false)
            }, 150),
        )
        // if (!dataKey) {
        //     // 清空筛选
        //     getFieldsList({
        //         ...searchCondition,
        //         ...d,
        //     })
        // } else {
        //     getFieldsList({
        //         ...searchCondition,
        //         [dataKey]: d[dataKey],
        //     })
        // }
    }

    const renderListItem = (item: any) => {
        return (
            <div
                className={classnames(
                    styles.formListItem,
                    selectedForms?.[tabsActiveKey]?.business_table_id ===
                        item.business_table_id && styles.selectedFormItem,
                    tabsActiveKey !== TabKey.AWAITSTART &&
                        styles.formListCommonItem,
                )}
                onClick={() => {
                    if (
                        selectedForms?.[tabsActiveKey]?.business_table_id !==
                        item.business_table_id
                    ) {
                        setSelectedRowKeysArry({})
                        setSelectedForms({
                            ...selectedForms,
                            [tabsActiveKey]: item,
                        })
                    }
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
                    {TabKey.AWAITSTART === tabsActiveKey && (
                        <div className={styles.progress}>
                            {`${__('已选：')}${
                                selectedRowKeysArry?.[item?.business_table_id]
                                    ?.length || 0
                            }/${item?.total_number || 0}`}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    // 待发起-进行中-移除
    const handleDeleteFormItem = async (item: any) => {
        try {
            await deleteBusinessTableField(item?.id)
            tabsOnChange(tabsActiveKey)
            message.success(`${__('移除')}${__('成功')}`)
        } catch (e) {
            formatError(e)
        }
    }

    // 待发起-业务表字段
    const pendingColumns: ColumnsType<any> = [
        {
            title: __('当前字段名称'),
            dataIndex: 'business_table_field_current_name',
            key: 'business_table_field_current_name',
            ellipsis: true,
            width: '20%',
        },
        {
            title: __('原始字段名称'),
            dataIndex: 'business_table_field_origin_name',
            key: 'business_table_field_origin_name',
            ellipsis: true,
            width: '20%',
        },
        {
            title: __('字段说明'),
            dataIndex: 'business_table_field_description',
            key: 'business_table_field_description',
            width: '30%',
            render: (text, record) => {
                // 原数据的标准化状态
                return tabsActiveKey === TabKey.AWAITSTART ? (
                    <Input
                        defaultValue={text}
                        placeholder={__('请输入字段说明')}
                        maxLength={255}
                        onBlur={(e) => {
                            const desc = text || ''
                            const value = trim(e?.target?.value)
                            if (!keyboardCharactersReg.test(value)) {
                                message.error(
                                    '仅支持中英文、数字及键盘上的特殊字符',
                                )
                                return
                            }
                            if (value !== desc) {
                                editColumnsChange('description', value, record)
                            }
                        }}
                    />
                ) : (
                    <div title={text} className={styles.textEllipsis}>
                        {text}
                    </div>
                )
            },
        },
        {
            title: __('发起请求人'),
            dataIndex: 'create_user',
            key: 'create_user',
            width: 114,
            ellipsis: true,
            render: (create_user, record) => record?.create_user || '--',
        },
        // getAccess(`${ResourceType.new_standard}.${RequestType.delete}`)
        //     ?
        {
            title: __('操作'),
            fixed: 'right',
            key: 'action',
            width: 110,
            render: (_, record) => (
                <Popconfirm
                    placement="bottomRight"
                    title={__('你确定要移除吗？')}
                    onConfirm={() => handleDeleteFormItem(record)}
                    okText={__('确定')}
                    cancelText={__('取消')}
                >
                    <Button
                        type="link"
                        // onClick={(e) => {
                        //     btnOperate(record.id)
                        //     e.stopPropagation()
                        // }}
                        style={{ marginRight: '8px' }}
                    >
                        {__('移除')}
                    </Button>
                </Popconfirm>
            ),
        },
        // : {},
    ]

    // 进行中-业务表字段
    const onGoingColumns: ColumnsType<any> = [
        {
            title: __('当前字段名称'),
            dataIndex: 'business_table_field_current_name',
            key: 'business_table_field_current_name',
            ellipsis: true,
            width: 154,
        },
        {
            title: __('原始字段名称'),
            dataIndex: 'business_table_field_origin_name',
            key: 'business_table_field_origin_name',
            ellipsis: true,
            width: 154,
        },
        {
            title: __('新建标准状态'),
            dataIndex: 'task_status',
            key: 'task_status',
            width: 122,
            render: (task_status) => {
                const info = statusInfos.filter(
                    (s) => s.value === task_status,
                )?.[0]
                return info ? (
                    <StatusLabel
                        label={info.label}
                        color={info.color}
                        bgColor={info.backgroundColor}
                    />
                ) : (
                    '--'
                )
            },
        },
        {
            title: __('关联任务名称'),
            dataIndex: 'task_name',
            key: 'task_name',
            ellipsis: true,
            width: 135,
            render: (task_name) => task_name || '--',
        },
        {
            title: __('发起请求人'),
            dataIndex: 'create_user',
            key: 'create_user',
            width: 114,
            ellipsis: true,
            render: (create_user, record) => record?.create_user || '--',
        },
        {
            title: __('发起请求时间'),
            dataIndex: 'create_start_time',
            key: 'create_time',
            width: 175,
            sorter: true,
            sortOrder:
                searchCondition.sort === 'create_time'
                    ? searchCondition.direction === SortDirection.ASC
                        ? 'ascend'
                        : 'descend'
                    : null,
            showSorterTooltip: false,
            render: (create_start_time, record) => {
                let time = moment(toNumber(create_start_time)).format(
                    'YYYY-MM-DD HH:mm:ss',
                )
                time = time !== 'Invalid date' ? time : '--'
                return <div className={styles.tableOperate}>{time}</div>
            },
        },
        {
            title: __('操作'),
            fixed: 'right',
            key: 'action',
            width: 80,
            render: (_, record) =>
                record?.task_status === TaskStatus.READY ? (
                    <Button
                        type="link"
                        onClick={(e) => {
                            btnOperate(NewStdOperate.REMOVE, record.id)
                            e.stopPropagation()
                        }}
                        style={{ marginRight: '8px' }}
                    >
                        {__('撤销')}
                    </Button>
                ) : undefined,
        },
    ]

    // 已完成业务表字段
    const doneColumns: ColumnsType<any> = [
        {
            title: __('当前字段名称'),
            dataIndex: 'business_table_field_current_name',
            key: 'business_table_field_current_name',
            ellipsis: true,
            width: 154,
            render: (text, record) => {
                return (
                    <div title={text} className={styles.textEllipsis}>
                        {text}
                    </div>
                )
            },
        },
        {
            title: __('原始字段名称'),
            dataIndex: 'business_table_field_origin_name',
            key: 'business_table_field_origin_name',
            width: 154,
            render: (text, record) => {
                return (
                    <div title={text} className={styles.textEllipsis}>
                        {text}
                    </div>
                )
            },
        },
        {
            title: __('标准字段中文名称'),
            dataIndex: 'data_element',
            key: 'name_cn',
            ellipsis: true,
            width: 159,
            render: (dataEle, record) => {
                const name = dataEle?.name_cn || '--'
                return (
                    <div title={name} className={styles.textEllipsis}>
                        {name}
                    </div>
                )
            },
        },
        {
            title: __('标准字段英文名称'),
            dataIndex: 'data_element',
            key: 'name_en',
            width: 135,
            render: (dataEle, record) => {
                const name = dataEle?.name_en || '--'
                return (
                    <div title={name} className={styles.textEllipsis}>
                        {name}
                    </div>
                )
            },
        },
        // {
        //     title: __('标准分类'),
        //     dataIndex: 'data_element',
        //     key: 'std_type',
        //     width: 88,
        //     render: (dataEle, record) => {
        //         const label =
        //             stardOrignizeTypeList?.find(
        //                 (item) => item.value === dataEle?.std_type,
        //             )?.label || '--'
        //         return (
        //             <div title={label} className={styles.textEllipsis}>
        //                 {label}
        //             </div>
        //         )
        //     },
        // },
        {
            title: __('完成时间'),
            dataIndex: 'create_end_time',
            key: 'update_time',
            width: 143,
            sorter: true,
            sortOrder:
                searchCondition.sort === 'update_time'
                    ? searchCondition.direction === SortDirection.ASC
                        ? 'ascend'
                        : 'descend'
                    : null,
            showSorterTooltip: false,
            render: (text, record) => {
                const time = moment(toNumber(text)).format(
                    'YYYY-MM-DD HH:mm:ss',
                )
                return time !== 'Invalid date' ? time : '--'
            },
        },
    ]

    const tableColumns = {
        [TabKey.AWAITSTART]: pendingColumns,
        [TabKey.DOING]: onGoingColumns,
        [TabKey.DONE]: doneColumns,
    }

    // 搜索框enter
    const handleFieldSearchPressEnter = (keyword) => {
        // const keyword = typeof e === 'string' ? e : trim(e.target.value)
        // setSearchKey(keyword)
        setFieldListLoading(true)
        if (timer) {
            clearTimeout(timer)
        }
        let fieldsTemp: any
        if (keyword) {
            fieldsTemp = fieldsTable?.data?.filter((fItem) => {
                let hasSearchKey =
                    fItem?.business_table_field_current_name?.includes(
                        keyword,
                    ) ||
                    fItem?.business_table_field_origin_name?.includes(keyword)
                if (tabsActiveKey === TabKey.DONE) {
                    hasSearchKey =
                        hasSearchKey &&
                        fItem.data_element?.name_cn.includes(keyword) &&
                        fItem.data_element?.name_en.includes(keyword)
                }
                return hasSearchKey
            })
        } else {
            fieldsTemp = fieldsTable?.data
        }
        setFields(fieldsTemp)
        // 前端搜索太快，用户没有搜索感知，增加定时器增加加载动画
        setTimer(
            setTimeout(() => {
                setFieldListLoading(false)
            }, 150),
        )
    }

    const getExpandIcon = (isActive: boolean | undefined) => (
        <CaretRightOutlined rotate={isActive ? 90 : 0} />
    )

    const showFormListEmpty = () => {
        let desc = ''

        if (formSearchKey) {
            desc = __('抱歉，没有找到相关内容')
        } else {
            desc = __('暂无数据')
        }
        return (
            <div style={{ marginTop: 76 }}>
                <Empty iconSrc={dataEmpty} desc={desc} />
            </div>
        )
    }

    const handleTableChange = (pagination: any, filters: any, sorter: any) => {
        let newSearchCondition = {
            ...searchCondition,
        }
        if (sorter?.order) {
            // 默认
            newSearchCondition = {
                ...searchCondition,
                sort: sorter?.columnKey,
                direction:
                    searchCondition?.direction === SortDirection.DESC
                        ? SortDirection.ASC
                        : SortDirection.DESC,
            }
            setSearchCondition({
                ...newSearchCondition,
            })
        }
    }

    return (
        <div className={styles.reqAddStandardWrapper}>
            <CustomDrawer
                open={open}
                destroyOnClose
                onCancel={handleCancel}
                onClose={handleCancel}
                className={styles.reqAddStandardWrapper}
                getContainer={getContainer}
                headerWidth="calc(100% - 40px)"
                style={{
                    height: 'calc(100% - 100px)',
                    top: '76px',
                    left: '24px',
                    width: 'calc(100% - 48px)',
                }}
                customTitleStyle={{ marginTop: 16, height: 22 }}
                title={
                    <div
                        className={styles.reqDrawerTitle}
                        title={`${
                            titleText ? `${titleText} / ` : ''
                        }__('待新建标准')`}
                    >
                        {titleText && (
                            <span
                                title={titleText}
                                onClick={handleCancel}
                                className={styles.defaultTitle}
                            >
                                {titleText}&nbsp;/&nbsp;
                            </span>
                        )}
                        <span>{__('待新建标准')}</span>
                        <span className={styles.reqDrawerTitleDescWrapper}>
                            <InfoCircleFilled
                                style={{ color: '#1890ff', fontSize: 14 }}
                            />
                            <span className={styles.reqDrawerTitleDescInfo}>
                                {__(
                                    '您可勾选字段创建“新建标准任务”，并可跟踪字段新建标准状态',
                                )}
                            </span>
                        </span>
                    </div>
                    // <div
                    //     title={`${
                    //         titleText || __('标准化')
                    //     }/__('新建标准请求')`}
                    // >
                    //     <span
                    //         title={titleText || __('标准化')}
                    //         onClick={handleCancel}
                    //         className={styles.defaultTitle}
                    //     >
                    //         {titleText || __('标准化')}/
                    //     </span>
                    //     <span title={__('新建标准请求')}>
                    //         {__('新建标准请求')}
                    //     </span>
                    // </div>
                }
                isShowFooter={
                    tabsActiveKey === TabKey.AWAITSTART &&
                    businTableList?.length > 0
                }
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 1232,
                }}
                customBodyStyle={{
                    height:
                        tabsActiveKey === TabKey.AWAITSTART
                            ? 'calc(100% - 102px)'
                            : 'calc(100% - 38px)',
                }}
                footerExtend={
                    tabsActiveKey === TabKey.AWAITSTART ? (
                        <div className={styles.reqAddStandardFooter}>
                            <Space>
                                <Button
                                    className={styles.cancelBtn}
                                    onClick={handleCancel || onClose}
                                >
                                    {__('取消')}
                                </Button>
                                <Button
                                    className={styles.okBtn}
                                    type="primary"
                                    onClick={() => {
                                        const fIds = []
                                        Object.keys(
                                            selectedRowKeysArry,
                                        )?.forEach((tableId) => {
                                            const tableSelKeys: [] =
                                                selectedRowKeysArry[tableId] ||
                                                []
                                            if (tableSelKeys?.length) {
                                                fIds.push(...tableSelKeys)
                                            }
                                        })

                                        if (!fIds?.length) {
                                            message.error(
                                                __('选择字段创建新建标准任务'),
                                            )
                                            return
                                        }
                                        setCreateTaskDefaultData([
                                            ...createTaskDefaultData,
                                            {
                                                fieldsIds: fIds,
                                            },
                                        ])
                                        setTaskShow(true)
                                    }}
                                    disabled={loading}
                                >
                                    {__('新建标准任务')}
                                </Button>
                            </Space>
                        </div>
                    ) : undefined
                }
            >
                <div className={styles.reqAddStandardBody}>
                    {showStateTabs && (
                        <Tabs
                            activeKey={tabsActiveKey}
                            onChange={(e) => tabsOnChange(e)}
                            tabBarGutter={32}
                            className={styles.tabsBox}
                            items={tabsItems}
                        />
                    )}
                    {pageLoading ? (
                        <div className={styles.empty}>
                            <Loader />
                        </div>
                    ) : !formSearchKey && businTableList?.length === 0 ? (
                        showFormListEmpty()
                    ) : (
                        <div className={styles.reqTabsContentWrapper}>
                            <div className={styles.formListWrapper}>
                                <div className={styles.formListTitle}>
                                    {__('业务表列表')}
                                </div>
                                {/* <Input value={formSearchKey} placeholder={__('搜索业务表名称')} /> */}
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

                                {/* {businTableList?.length === 0 ? (
                                        <Empty desc={__('暂无数据')} />
                                    ) : ( */}

                                {businTableListLoading ? (
                                    <div style={{ marginTop: 48 }}>
                                        <Loader />
                                    </div>
                                ) : (
                                    <List
                                        dataSource={businTableList}
                                        renderItem={renderListItem}
                                        className={styles.formList}
                                        locale={{
                                            emptyText: <Empty />,
                                        }}
                                    />
                                )}
                                {/* )} */}
                            </div>
                            <Divider
                                type="vertical"
                                style={{ height: '100%', margin: 0 }}
                            />
                            <div className={styles.fieldsListWrapper}>
                                <div className={styles.fieldsTopWrapper}>
                                    {tabsActiveKey === TabKey.DOING ? (
                                        <Tooltip
                                            title={
                                                selectedRowKeysArry?.[
                                                    selectedForms?.[
                                                        tabsActiveKey
                                                    ]?.business_table_id
                                                ]?.length > 0
                                                    ? ''
                                                    : __(
                                                          '仅可选择“未开始”标准化的字段进行撤销操作',
                                                      )
                                            }
                                            overlayClassName={styles.oprToolTip}
                                        >
                                            <Button
                                                disabled={removeAllBtnDiable}
                                                onClick={() =>
                                                    btnOperate(
                                                        NewStdOperate.REMOVE,
                                                    )
                                                }
                                            >
                                                {__('撤销请求')}
                                            </Button>
                                        </Tooltip>
                                    ) : (
                                        <div className={styles.fieldsTitle}>
                                            {__('字段列表')}
                                            {TabKey.AWAITSTART ===
                                                tabsActiveKey && (
                                                <span
                                                    style={{ fontWeight: 400 }}
                                                >
                                                    {` (${__('已选：')}`}
                                                    <span
                                                        style={{
                                                            color: '#126ee3',
                                                        }}
                                                    >
                                                        {selectedRowKeysArry?.[
                                                            selectedForms?.[
                                                                tabsActiveKey
                                                            ]?.business_table_id
                                                        ]?.length || 0}
                                                    </span>
                                                    {`/${
                                                        fieldsTable?.total_count ||
                                                        0
                                                    })`}
                                                </span>
                                            )}
                                        </div>
                                    )}

                                    <div className={styles.filterWrapper}>
                                        <Tooltip
                                            title={
                                                tabsActiveKey === TabKey.DONE &&
                                                __(
                                                    '搜索当前字段名称、原始字段名称、标准字段中文名称、标准字段英文名称',
                                                )
                                            }
                                            overlayStyle={{ maxWidth: 260 }}
                                        >
                                            <SearchInput
                                                placeholder={
                                                    tabsActiveKey ===
                                                    TabKey.DONE
                                                        ? __(
                                                              '搜索当前字段名称、原始字段名称、标准字段中文名称、标准字段英文名称',
                                                          )
                                                        : __(
                                                              '搜索当前字段名称、原始字段名称',
                                                          )
                                                }
                                                value={searchKey}
                                                onKeyChange={(kw: string) => {
                                                    const keyword = trim(kw)
                                                    setSearchKey(keyword)
                                                    if (
                                                        kw !==
                                                        searchCondition.keyword
                                                    ) {
                                                        setSearchCondition({
                                                            ...searchCondition,
                                                            keyword,
                                                        })
                                                    }
                                                }}
                                                // onPressEnter={
                                                //     handleFieldSearchPressEnter
                                                // }
                                                className={styles.searchInput}
                                                style={{ width: 284 }}
                                            />
                                        </Tooltip>

                                        {tabsActiveKey === TabKey.DOING &&
                                            selectedForms?.[tabsActiveKey]
                                                ?.business_table_id && (
                                                <div
                                                    className={
                                                        styles.selectWrapper
                                                    }
                                                >
                                                    <LightweightSearch
                                                        ref={
                                                            lightweightSearchRef
                                                        }
                                                        formData={
                                                            reqStandSearchData
                                                        }
                                                        onChange={(data, key) =>
                                                            searchChange(
                                                                data,
                                                                key,
                                                            )
                                                        }
                                                        defaultValue={{
                                                            task_status: '',
                                                        }}
                                                    />
                                                </div>
                                            )}
                                        <div className={styles.refreshBtn}>
                                            <RefreshBtn
                                                onClick={() => {
                                                    getFieldsList(
                                                        searchCondition,
                                                    )
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                                <Table
                                    rowKey={
                                        tabsActiveKey === TabKey.AWAITSTART
                                            ? 'business_table_field_id'
                                            : 'id'
                                    }
                                    rowSelection={
                                        [
                                            TabKey.AWAITSTART,
                                            TabKey.DOING,
                                        ].includes(tabsActiveKey)
                                            ? {
                                                  selectedRowKeys:
                                                      selectedRowKeysArry[
                                                          selectedForms?.[
                                                              tabsActiveKey
                                                          ]?.business_table_id
                                                      ] || [],
                                                  onChange: (key) =>
                                                      onSelectChange(
                                                          key,
                                                          selectedForms?.[
                                                              tabsActiveKey
                                                          ]?.business_table_id,
                                                      ),
                                                  getCheckboxProps: (
                                                      record: IBusinTableField,
                                                  ) => ({
                                                      disabled:
                                                          tabsActiveKey ===
                                                              TabKey.DOING &&
                                                          record.task_status !==
                                                              TaskStatus.READY,
                                                  }),
                                              }
                                            : undefined
                                    }
                                    locale={{
                                        emptyText: <Empty />,
                                    }}
                                    className={styles.fieldsTable}
                                    columns={tableColumns[tabsActiveKey]}
                                    dataSource={fields}
                                    loading={fieldListLoading}
                                    pagination={false}
                                    scroll={{
                                        // x: 'calc(100vw - 374px)',
                                        y: formOnlySinglePage
                                            ? 'calc(100vh - 377px)'
                                            : 'calc(100vh - 441px)',
                                    }}
                                    sortDirections={[
                                        'ascend',
                                        'descend',
                                        'ascend',
                                    ]}
                                    onChange={handleTableChange}
                                />
                                {/* <ListPagination
                                    listType={ListType.NarrowList}
                                    queryParams={searchCondition}
                                    totalCount={businTableList?.length || 0}
                                    onChange={handleTableChange}
                                    className={styles.pagination}
                                /> */}
                            </div>
                        </div>
                    )}
                </div>
                {taskShow && (
                    <CreateTask
                        show={taskShow}
                        operate={OperateType.CREATE}
                        title={__('创建任务')}
                        defaultData={createTaskDefaultData}
                        isSupportFreeTask={!taskInfo?.projectId}
                        isTaskShowMsg={false}
                        onClose={(info) => {
                            if (info) {
                                createTaskToStandard(info)
                            }
                            setTaskShow(false)
                        }}
                    />
                )}
            </CustomDrawer>
        </div>
    )
}

export default ReqAddStandard
