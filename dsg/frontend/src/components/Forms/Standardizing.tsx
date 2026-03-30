import { Alert, Button, message, Space, Table, Tooltip } from 'antd'
import React, { useContext, useEffect, useMemo, useState } from 'react'

import { ExclamationCircleFilled, InfoCircleFilled } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import { ColumnsType } from 'antd/lib/table'
import classnames from 'classnames'
import { compact, remove, trim, uniq } from 'lodash'
import { RefreshBtn } from '@/components/ToolbarComponents'
import { TaskInfoContext } from '@/context'
import {
    acceptFieldStd,
    addToPending,
    CatalogType,
    createStdTask,
    editBusinessStandard,
    formatError,
    formsQueryStandardItem,
    formsStandardFieldsList,
    getPendingBusinTableField,
    getStandardRecommend,
    IBusinTableField,
    IDataItem,
    IFormEnumConfigModel,
    IPendingBusinsTableFieldQuery,
    IStandardEnum,
    IStdRecParams,
    LoginPlatform,
    TaskType,
    transformQuery,
    ValueRangeType,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { useGradeLabelState } from '@/hooks/useGradeLabelState'
import { useTaskCheck } from '@/hooks/useTaskCheck'
import { FieldStandardColored, FontIcon, ToDoTaskOutlined } from '@/icons'
import RecommendOutlined from '@/icons/RecommendOutlined'
import {
    ListDefaultPageSize,
    ListPagination,
    ListType,
    SearchInput,
} from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import {
    getPlatformNumber,
    OperateType,
    stardOrignizeTypeList,
    useQuery,
} from '@/utils'
import { confirm } from '@/utils/modalHelper'
import dataEmpty from '../../assets/dataEmpty.svg'
import { useBusinessModelContext } from '../BusinessModeling/BusinessModelProvider'
import CustomDrawer from '../CustomDrawer'
import DataEleDetails from '../DataEleManage/Details'
import ViewValueRange from '../FormTableMode/ViewValueRange'
import SelDataByTypeModal from '../SelDataByTypeModal'
import CreateTask from '../TaskComponents/CreateTask'
import { getTaskTypeIcon } from '../TaskComponents/helper'
import {
    FieldSource,
    FormTableKind,
    NewFormType,
    numberAndStringTypeArr,
    numberTypeArr,
    products,
    StandardStatus,
    standardStatusInfos,
    ToBeCreStdStatus,
    ToBeCreStdStatusValue,
    totalOperates,
} from './const'
import {
    defFieldStdState,
    FieldsInfoContext,
    getFormulateBasisNum,
    IFieldInfo,
    StdOperateType,
    transformDataOptions,
    transformDataOptionsForDataStandard,
} from './helper'
import __ from './locale'
import ReqAddStandard from './ReqAddStandard'
import styles from './styles.module.less'
import ViewFieldStd from './ViewFieldStd'

interface ISearchCondition {
    keyword?: string
    status: string
}

interface IStandardizing {
    visible: boolean
    alertOpen?: boolean
    newStandardSum?: string | number
    coreBizName?: string
    mid?: string
    mbid?: string
    fid?: string
    name?: string
    fType?: NewFormType
    config: IFormEnumConfigModel | undefined
    standardEnum?: IStandardEnum
    onClose: () => void
    onSure: () => void
    onSetAlertOpen?: (info: boolean) => void
    getContainer?: any
    tableKind?: FormTableKind
}

/**
 * @param mid string 业务模型id
 * @param coreBizName 业务模型名称
 * @param fid number 表单id
 * @param mbid string main_business_id
 * @param name string 业务表名称
 * @param fType string 业务表类型
 * @param standardEnum IStandardEnum? 业务标准枚举配置
 * @param onClose
 */
const Standardizing: React.FC<IStandardizing> = ({
    visible,
    alertOpen,
    newStandardSum,
    coreBizName,
    mid,
    fid = '',
    mbid = '',
    fType,
    name = '',
    standardEnum,
    config,
    onClose,
    onSure,
    onSetAlertOpen,
    getContainer = false,
    tableKind,
}) => {
    // 存储的字段信息
    const { fieldsInfo, setFieldsInfo } = useContext(FieldsInfoContext)
    // 任务信息
    const { taskInfo } = useContext(TaskInfoContext)
    const { checkTask } = useTaskCheck(totalOperates, products, taskInfo)
    const query = useQuery()

    // 选择数据元弹窗-数据元详情id
    const [showDEDetailId, setShowDEDetailId] = useState<string>('')
    // 数据元详情
    const [dataEleDetailVisible, setDataEleDetailVisible] =
        useState<boolean>(false)

    const platform = getPlatformNumber()
    // 是否为cs平台
    const isCSPlatform = useMemo(() => {
        return platform !== LoginPlatform.default
    }, [platform])

    const [searchCondition, setSearchCondition] =
        useState<IPendingBusinsTableFieldQuery>({
            // 业务表模型id
            business_table_model_id: mid || '',
            // 业务表名称
            business_table_id: fid,
            // state: `${ToBeCreStdStatusValue.CREATED}`,
            offset: 1,
            limit: ListDefaultPageSize[ListType.NarrowList],
            keyword: '',
        })

    const [userInfo] = useCurrentUser()

    useUpdateEffect(() => {
        getFormFields(searchCondition)
    }, [searchCondition])

    // 字段列表默认类型
    const defaultListType = ListType.NarrowList
    const defaultPageSize = ListDefaultPageSize[defaultListType]

    // 展示的原字段集
    const [fields, setFields] = useState<any[]>([])
    // 记录"配置数据元"配置数据,格式{[id]: xxFieldItemContent}
    const [configFields, setConfigFields] = useState<Object>({})

    // 字段数量
    const [total, setTotal] = useState<number>(0)

    // 整个页面loading
    const [loading, setLoading] = useState(true)
    // 字段列表loading
    const [listLoading, setListLoading] = useState(true)
    // 智能推荐loading
    const [fetching, setFetching] = useState(false)
    const [sureLoading, setSureLoading] = useState(false)
    const [addfetching, setAddfetching] = useState(false)
    const [searchLoading, setSearchLoading] = useState(false)
    const [timer, setTimer] = useState<any>()

    // 当前表格操作项
    const [curTableItem, setCurTableItem] = useState<any>()

    // 编辑界面显示,【true】显示,【false】隐藏
    const [editVisible, setEditVisible] = useState(false)

    // 请求新建标准界面显示,【true】显示,【false】隐藏
    const [addStandardVisible, setAddStandardVisible] = useState(false)

    // 查看待创建标准界面显示,【true】显示,【false】隐藏
    const [viewStandardsVisible, setViewStandardsVisible] = useState(false)

    // 创建任务弹窗显示
    const [taskShow, setTaskShow] = useState(false)

    // 保存按钮可用状态
    const [showStateTabs, setShowStateTabs] = useState(true)

    // 编辑选中项
    const [editItem, setEditItem] = useState<any>()

    // 选中项集
    const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])

    // 操作项
    const [oprItem, setOprItems] = useState<any[]>([])

    // 搜索值
    const [searchVal, setSearchVal] = useState('')
    // 标准状态
    const [stdStatus, setStdStatus] = useState(defFieldStdState)
    // 未读标准条数
    const [standardSum, setStandardSum] = useState(0)

    // 保存按钮可用状态
    const [saveDisabled, setSaveDisabled] = useState(true)
    // 未读标准列表
    const [unreadList, setUnreadList] = useState<any[]>([])
    // 创建中标准列表
    const [creatingStandard, setCreatingStandard] = useState<any[]>([])

    const [selDataItems, setSelDataItems] = useState<IDataItem[]>([])

    const [isStart] = useGradeLabelState()

    const [stdRecParams, setStdRecParams] = useState<IStdRecParams>()

    const [departmentId, setDepartmentId] = useState<string>('')

    // 显示/隐藏搜索框
    const showSearch = useMemo(
        () =>
            searchVal !== '' ||
            stdStatus !== defFieldStdState ||
            (fields && fields.length > 0),
        [searchVal, stdStatus, fields],
    )

    // 表格上方的 添加至新建标准 按钮禁用状态
    const topAddPendingBtnDisable = useMemo(() => {
        // const hasDisableItem =
        //     !selectedRowKeys?.length ||
        //     fields?.find(
        //         (fItem) =>
        //             selectedRowKeys?.includes(fItem?.id) &&
        //             [
        //                 ToBeCreStdStatus.WAITING,
        //                 ToBeCreStdStatus.CREATING,
        //             ].includes(fItem?.standard_create_status),
        //     )
        // return hasDisableItem
        return !selectedRowKeys?.length
    }, [selectedRowKeys, fields])

    // 表格上方的 新建任务 按钮禁用状态
    const topNewTaskBtnDisable = useMemo(() => {
        // const hasDisableItem =
        //     !selectedRowKeys?.length ||
        //     fields?.find(
        //         (fItem) =>
        //             selectedRowKeys?.includes(fItem?.id) &&
        //             fItem?.standard_create_status === ToBeCreStdStatus.CREATING,
        //     )
        // return hasDisableItem
        return !selectedRowKeys?.length
    }, [selectedRowKeys, fields])

    // 错误提示
    const [errText, setErrText] = useState(__('暂无数据'))
    // 根据URL判断业务模型还是执行标准化任务
    const sourceType =
        window.location.pathname.indexOf('/coreBusiness') > -1
            ? 'mainBusiness'
            : 'executeTask'
    const taskId = query.get('taskId') || ''
    const { isDraft, selectedVersion } = useBusinessModelContext()

    const versionParams = useMemo(() => {
        return transformQuery({ isDraft, selectedVersion })
    }, [isDraft, selectedVersion])

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

    useEffect(() => {
        setSaveDisabled(true)
        setSearchVal('')
        setSelectedRowKeys([])
        setErrText(__('暂无数据'))
        if (visible && mid && fid) {
            setLoading(true)
            getFormFields(searchCondition)
            getUnreadStandardList({
                // 业务表模型id
                business_table_model_id: mid || '',
                // 业务表名称
                business_table_id: fid,
                state: `${ToBeCreStdStatusValue.CREATED}`,
            })
        }
    }, [visible, mid])

    useEffect(() => {
        handleSearchPressEnter({
            status: stdStatus,
            keyword: searchVal,
        })
    }, [searchVal])

    // 保存
    const handleOk = async () => {
        try {
            setSureLoading(true)
            const pendingFields: any = []
            // 提取更改的数据
            const stds =
                Object.keys(configFields)?.reduce((arr: any[], fId) => {
                    const cur = configFields[fId]
                    if (cur?.changedField) {
                        const changed = {
                            ...cur.changedField,
                            sid: cur.keyId,
                            formulate_basis: getFormulateBasisNum(
                                config?.formulate_basis.find(
                                    (currentConfig) =>
                                        cur.changedField.formulate_basis ===
                                        currentConfig.value_en,
                                )?.value,
                                standardEnum,
                            ),
                            value_range:
                                cur.changedField.value_range ||
                                cur.originalField.value_range,
                        }
                        if (
                            [ToBeCreStdStatus?.WAITING].includes(
                                cur?.originalField?.standard_create_status,
                            )
                        ) {
                            pendingFields.push(cur)
                        }
                        return arr.concat([changed])
                    }
                    return arr
                }, []) || []

            await editBusinessStandard(mid!, fid!, {
                task_id: taskInfo.taskId,
                standards: stds,
            })

            const selFields: Array<IBusinTableField> =
                pendingFields?.map((fItem) => ({
                    id: fItem?.originalField?.id || '',
                    business_table_name: name,
                    business_table_id: fid || '',
                    business_table_type: fType || '',
                    create_user: userInfo?.VisionName || '',
                    business_table_field_id: fItem?.originalField?.id || '',
                    business_table_field_current_name:
                        fItem?.changedField?.name ||
                        fItem?.originalField?.name ||
                        '',
                    business_table_field_origin_name:
                        fItem?.originalField?.name || '',
                    business_table_field_current_name_en:
                        fItem?.changedField?.name_en ||
                        fItem?.originalField?.name_en ||
                        '',
                    business_table_field_origin_name_en:
                        fItem?.originalField?.name_en || '',
                    business_table_field_current_std_type:
                        fItem?.changedField?.formulate_basis ||
                        fItem?.originalField?.formulate_basis,
                    business_table_field_origin_std_type:
                        fItem?.originalField?.formulate_basis,
                    business_table_field_data_type:
                        fItem?.originalField?.data_type,
                    business_table_field_data_length:
                        fItem?.originalField?.data_length,
                    business_table_field_data_precision:
                        fItem?.originalField?.data_accuracy,

                    business_table_field_dict_name: '',
                    business_table_field_description:
                        fItem?.originalField?.description || '',
                    data_element_id: '',
                })) || []

            if (selFields?.length) {
                // 修改 待发起 中字段信息
                await addToPending(mbid, selFields)
            }
            message.success(__('保存成功'))
            handleCancel()
        } catch (e) {
            formatError(e)
        } finally {
            setSureLoading(false)
        }
    }

    // 取消
    const handleCancel = async () => {
        // 清空存储数据
        setFieldsInfo([])
        // 标记已读
        // await markReadStandard()
        onClose()
    }

    // 获取表单字段信息
    const getFormFields = async (params: any) => {
        try {
            if (!mid) return
            setListLoading(true)
            const res = await formsStandardFieldsList(mid!, fid!, {
                ...params,
                ...versionParams,
            })
            // 整合信息
            const fs = res?.entries

            setDepartmentId(res?.department_id)

            // 更新原字段信息存储
            const infos: IFieldInfo[] = []
            const ori: any[] = []
            fs.forEach((source) => {
                // 信息增加“来源”，自定义
                const originalField = {
                    ...source,
                    rowName: FieldSource.ORIGINAL,
                    rowKey: '0',
                }
                infos.push({
                    keyId: source.id,
                    originalField,
                    recommendFields: [],
                    historyFields: [],
                    changedField:
                        configFields[source?.id]?.changedField || undefined,
                })
                ori.push(originalField)
            })
            await setFieldsInfo(infos)
            setFields(ori)
            setTotal(res.total_count || 0)
            // getCreatingStandard(infos)
        } catch (error) {
            setFields([])
            if (error?.data?.code === 'BusinessGrooming.Form.FormNotExist') {
                setErrText(__('该表单被删除，可重新选择'))
            }
            formatError(error)
        } finally {
            setLoading(false)
            setListLoading(false)
        }
    }

    // 获取未读字段列表
    const getUnreadStandardList = async (
        params: IPendingBusinsTableFieldQuery,
    ) => {
        try {
            const { data, total_count } = await getPendingBusinTableField(
                params,
            )
            setStandardSum(total_count || 0)
            if (onSetAlertOpen && total_count) {
                onSetAlertOpen(true)
            } else {
                onSetAlertOpen?.(false)
            }
            setUnreadList(data)
        } catch (e) {
            formatError(e)
        }
    }

    // 批量标记已读，离开页面使用
    const markReadStandard = async () => {
        // 已进入页面即标记已读，下次不再显示未读标记
        // const ids: Array<string> = []
        // unreadList.forEach((element) => {
        //     element?.fields?.forEach((item) => {
        //         ids.push(item.id)
        //     })
        // })
        // // 标记已读
        // if (ids.length > 0) {
        //     await formsQueryStandardMarkReadTaskLists({ ids })
        // }
    }

    const createTaskToStandard = async (info) => {
        const fIds =
            createTaskDefaultData?.find((d) => d.name === 'fieldsIds')?.value ||
            []
        try {
            const selFields: Array<IBusinTableField> =
                fieldsInfo
                    ?.filter((fItem) =>
                        fIds?.includes(fItem?.originalField?.id),
                    )
                    ?.map((fItem) => ({
                        id: fItem?.originalField?.id || '',
                        business_table_name: name,
                        business_table_id: fid || '',
                        business_table_type: fType || '',
                        create_user: userInfo?.VisionName || '',
                        business_table_field_id: fItem?.originalField?.id || '',
                        business_table_field_current_name:
                            fItem?.changedField?.name ||
                            fItem?.originalField?.name ||
                            '',
                        business_table_field_origin_name:
                            fItem?.originalField?.name || '',
                        business_table_field_current_name_en:
                            fItem?.changedField?.name_en ||
                            fItem?.originalField?.name_en ||
                            '',
                        business_table_field_origin_name_en:
                            fItem?.originalField?.name_en || '',
                        business_table_field_current_std_type:
                            fItem?.changedField?.formulate_basis ||
                            fItem?.originalField?.formulate_basis,
                        business_table_field_origin_std_type:
                            fItem?.originalField?.formulate_basis,
                        business_table_field_data_type:
                            fItem?.originalField?.data_type,
                        business_table_field_data_length:
                            fItem?.originalField?.data_length,
                        business_table_field_data_precision:
                            fItem?.originalField?.data_accuracy,

                        business_table_field_dict_name: '',
                        business_table_field_description:
                            fItem?.originalField?.description || '',
                        data_element_id: '',
                    })) || []

            await addToPending(mbid, selFields)
            await createStdTask(info.length > 0 ? info[0].id : '', fIds)
            const originalFieldTemp: any[] = []
            const fieldsInfoTemp = fieldsInfo.map((f) => {
                let obj = f.originalField
                if (fIds?.includes(f.keyId)) {
                    obj = {
                        ...obj,
                        // 状态改为进行中
                        standard_create_status: ToBeCreStdStatus.CREATING,
                    }
                    originalFieldTemp.push(obj)
                    return {
                        ...f,
                        originalField: obj,
                    }
                }
                originalFieldTemp.push(obj)
                return f
            })
            setFields(originalFieldTemp)
            setFieldsInfo(fieldsInfoTemp)

            message.success(__('请求已发出并创建任务成功'))
        } catch (e) {
            formatError(e)
        }
        // onSure()
    }

    // 搜索, 自处理
    const handleSearchPressEnter = (params: any) => {
        const keyword = trim(params?.keyword)
        const status = params?.status
        // setSearchLoading(true)
        // if (timer) {
        //     clearTimeout(timer)
        // }
        // if (keyword || status !== defFieldStdState) {
        //     // 过滤中英文名称
        //     const res = fieldsInfo.reduce((total: any[], cur) => {
        //         const curStatus = isChanged({ ...cur, id: cur?.keyId })
        //             ? StandardStatus.NORMAL
        //             : cur.originalField?.standard_status

        //         try {
        //             if (
        //                 (cur.originalField.name.includes(keyword) ||
        //                     cur.originalField.name_en.includes(keyword) ||
        //                     cur.originalField.name_en.match(
        //                         new RegExp(keyword, 'ig'),
        //                     )) &&
        //                 (status === defFieldStdState || curStatus === status)
        //             ) {
        //                 return total.concat([cur.originalField])
        //             }
        //             return total
        //         } catch (error) {
        //             if (cur.originalField.name.includes(keyword)) {
        //                 return total.concat([cur.originalField])
        //             }
        //             return total
        //         }
        //     }, [])
        //     setFields(res)
        // } else {
        //     // 返回全部
        //     setFields(fieldsInfo.map((f) => f.originalField))
        // }
        // // 前端搜索太快，用户没有搜索感知，增加定时器增加加载动画
        // setTimer(
        //     setTimeout(() => {
        //         setSearchLoading(false)
        //     }, 150),
        // )
    }

    const searchChange = (d, dataKey) => {
        setSearchLoading(true)
        if (timer) {
            clearTimeout(timer)
        }

        const { status } = d
        setStdStatus(status)
        handleSearchPressEnter({
            status,
            keyword: searchVal,
        })
    }

    // 智能推荐
    const handleRecommend = async () => {
        // 没有选中内容不处理
        if (selectedRowKeys.length === 0) {
            return
        }
        try {
            setFetching(true)
            // 需要请求推荐值的选项
            const names = selectedRowKeys.reduce((arr: any[], cur) => {
                // 查找存储数据中的k
                const info = fieldsInfo.find((f) => f.keyId === cur)
                // 判断k是否有推荐值
                if (info?.recommendFields && info?.recommendFields.length > 0) {
                    return arr
                }
                return arr.concat([
                    { fieldName: info?.originalField.name, id: info?.keyId },
                ])
            }, [])

            let num = 0
            if (names.length > 0) {
                const res = await getStandardRecommend({
                    table: name,
                    table_description: '',
                    table_fields: names.map((n) => ({
                        table_field: n.fieldName,
                        table_field_description: '',
                        std_ref_file: '',
                    })),
                    department_id: departmentId,
                })
                // 表字段列表数据
                const table_fields = res
                if (table_fields && table_fields.length > 0) {
                    names.forEach(({ fieldName, id }, idx) => {
                        // 查找n的推荐的标准
                        // const { rec_stds } = table_fields.find(
                        //     (tf) => tf.table_field === table_field,
                        // )
                        const { rec_stds } = table_fields[idx]
                        // 查找存储数据中的n
                        const info = fieldsInfo.find((f) => f.keyId === id)
                        if (rec_stds && rec_stds.length > 0 && info) {
                            num += 1
                            // 对标推荐信息，增加自定义信息
                            const recs = rec_stds.map((r) => ({
                                id: info.keyId,
                                standard_id: r.id,
                                // name: r.name,
                                name_en: r.name_en,
                                data_type: r.data_type,
                                data_length: r.data_length,
                                data_accuracy: r.data_accuracy,
                                // value_range: r.value_range,
                                formulate_basis: r.std_type_name,
                                rowName: FieldSource.RECOMMEND,
                                code_table_code: r?.code_table_code || '',
                                code_table: r?.code_table_name || '',
                                encoding_rule: r?.encoding_rule || '',
                                rowKey: r.id,
                            }))
                            // 存储推荐值
                            info.recommendFields = recs
                        }
                    })
                }
            }
            let newRecommendMap: Array<any> = []
            selectedRowKeys.forEach((k) => {
                // 查找存储数据中的k
                const info = fieldsInfo.find((f) => f.keyId === k)
                // 智能推荐有数据，才修改值
                if (info!.recommendFields.length > 0) {
                    // 存储更换值为推荐值的第一个
                    const [rec] = info!.recommendFields
                    info!.changedField = rec
                    newRecommendMap = [...newRecommendMap, info]
                }
            })
            const newInfos = await Promise.all(
                newRecommendMap.map((currentData) =>
                    transformDataOptions(
                        currentData.changedField.standard_id,
                        currentData.changedField,
                    ),
                ),
            )
            let configFieldsTemp = { ...configFields }
            newInfos.forEach((newInfo) => {
                const currentInfo = fieldsInfo.find(
                    (f) => f?.changedField && f?.keyId === newInfo.id,
                )
                if (currentInfo) {
                    currentInfo.changedField = newInfo

                    configFieldsTemp = {
                        ...configFieldsTemp,
                        [currentInfo?.keyId]: currentInfo,
                    }
                }
            })
            // 设置配置数据元
            setConfigFields(configFieldsTemp)
            // 提示
            if (names.length > 0 && num < names.length) {
                message.info(__('部分字段暂无推荐，您可手动选择数据元'))
            } else {
                message.success(__('推荐成功'))
            }
            // 刷新列表
            setFields(fieldsInfo.map((f) => f.originalField))
            checkDataIsChanged()
        } catch (e) {
            formatError(e)
        } finally {
            setFetching(false)
        }
    }

    // 检查是否有数据变更(智能推荐、配置确定时)
    const checkDataIsChanged = () => {
        setSaveDisabled(!fieldsInfo.find((f) => f.changedField))
    }

    // 是否在项目中
    const isProject = !!taskInfo?.projectId

    // 行选项
    const rowSelection = {
        onChange: (val: React.Key[]) => {
            setSelectedRowKeys(val)
        },
        selectedRowKeys,
        // getCheckboxProps: (record) => {
        //     return {
        //         disabled: !!record.ref_id,
        //     }
        // },
    }

    // 获取更改的数据
    const getChangedData = (record, key: string) =>
        fieldsInfo.find((f) => f.keyId === record.id)?.changedField?.[key]
    const getChangedFields = (record, key: string) =>
        fieldsInfo.find((f) => f.keyId === record.id)?.changedField

    // 判断是否有更换数据
    const isChanged = (record) =>
        !!fieldsInfo.find((f) => f.keyId === record.id)?.changedField

    // 更换字段属性空值内容
    const changeType = (val) => {
        if (val === 0) {
            return 0
        }
        if (!val) {
            return undefined
        }
        return val
    }

    // 撤销配置数据元确认提示
    const undoConfirm = (dataEleName: string, okCallBack: () => void) => {
        confirm({
            title: __('确定要撤销配置的数据元吗？'),
            icon: <ExclamationCircleFilled className="delIcon" />,
            width: 432,
            okText: '确定',
            cancelText: '取消',
            content: (
                <div className={styles.undoConfirmContent}>
                    {__('撤销后将恢复显示为下方字段的信息:')}
                    <div className={styles.undoNameWrapper}>
                        {__('“')}
                        <span className={styles.undoName} title={dataEleName}>
                            {dataEleName}
                        </span>
                        {__('”')}
                    </div>
                </div>
            ),
            onOk() {
                okCallBack()
            },
        })
    }
    // 撤销配置数据元
    const undoChangeField = (record: any) => {
        if (!record) return
        let fildsInfoTemp = [...fieldsInfo]

        fildsInfoTemp = fildsInfoTemp?.map((fItem) => {
            if (fItem?.keyId === record?.id) {
                const { keyId, originalField, recommendFields, historyFields } =
                    fItem
                const configFieldsTemp = {
                    ...configFields,
                    // [editItem.id]: undefined,
                    [record?.id]: undefined, // 此时editItem为空  改为 record
                }
                setConfigFields(configFieldsTemp)
                return {
                    keyId,
                    originalField,
                    recommendFields,
                    historyFields,
                }
            }
            return fItem
        })
        setFieldsInfo(fildsInfoTemp)
        setSaveDisabled(!fildsInfoTemp.find((f) => f.changedField))
    }

    const handleReqAddStandard = async (
        tableItemKeys: any[],
        showTip = true,
    ) => {
        // 没有选中内容不处理
        if (tableItemKeys?.length === 0) {
            return
        }
        try {
            setAddfetching(true)
            // 可创建任务字段ids
            const fieldsIds =
                fields
                    ?.filter(
                        (fItem) =>
                            tableItemKeys?.includes(fItem?.id) &&
                            ![
                                ToBeCreStdStatus.WAITING,
                                ToBeCreStdStatus.CREATING,
                            ].includes(fItem?.standard_create_status),
                    )
                    ?.map((item) => item?.id) || []

            // 非表格内 添加至新建标准 操作
            if (!fieldsIds?.length) {
                message.info(__('已添加至待新建标准或标准正在创建中'))
                setSureLoading(false)
                return
            }

            const hasSomeInvalidFields =
                fieldsIds?.length < tableItemKeys?.length

            const tipsContent = () => (
                <span>
                    {hasSomeInvalidFields
                        ? __('添加成功，')
                        : __(
                              '添加成功，可前往「业务表/待新建标准」中创建新建标准任务。',
                          )}
                    <span
                        style={{
                            color: '#1677FF',
                            cursor: 'pointer',
                            marginLeft: hasSomeInvalidFields ? '' : 16,
                        }}
                        onClick={(e) => {
                            e.preventDefault()
                            e.stopPropagation()
                            setAddStandardVisible(true)
                            message.destroy()
                        }}
                    >
                        {hasSomeInvalidFields ? __('前往查看') : __('立即前往')}
                        {__(',')}
                    </span>
                    {hasSomeInvalidFields
                        ? __(
                              '，其中已添加至“待新建标准”或“标准正在创建中”的字段不会重复添加。',
                          )
                        : ''}
                </span>
            )

            const selFields: Array<IBusinTableField> =
                fieldsInfo
                    ?.filter((fItem) =>
                        fieldsIds?.includes(fItem?.originalField?.id),
                    )
                    ?.map((fItem) => ({
                        id: fItem?.originalField?.id || '',
                        business_table_name: name,
                        business_table_id: fid || '',
                        business_table_type: fType || '',
                        create_user: userInfo?.VisionName || '',
                        business_table_field_id: fItem?.originalField?.id || '',
                        business_table_field_current_name:
                            fItem?.changedField?.name ||
                            fItem?.originalField?.name ||
                            '',
                        business_table_field_origin_name:
                            fItem?.originalField?.name || '',
                        business_table_field_current_name_en:
                            fItem?.changedField?.name_en ||
                            fItem?.originalField?.name_en ||
                            '',
                        business_table_field_origin_name_en:
                            fItem?.originalField?.name_en || '',
                        business_table_field_current_std_type:
                            fItem?.changedField?.formulate_basis ||
                            fItem?.originalField?.formulate_basis,
                        business_table_field_origin_std_type:
                            fItem?.originalField?.formulate_basis,
                        business_table_field_data_type:
                            fItem?.originalField?.data_type,
                        business_table_field_data_length:
                            fItem?.originalField?.data_length,
                        business_table_field_data_precision:
                            fItem?.originalField?.data_accuracy,

                        business_table_field_dict_name: '',
                        business_table_field_description:
                            fItem?.originalField?.description || '',
                        data_element_id: '',
                    })) || []
            await addToPending(mbid, selFields)
            const originalFieldTemp: any[] = []

            const fieldsInfoTemp = fieldsInfo.map((f) => {
                let obj = f.originalField
                if (tableItemKeys?.includes(f.keyId)) {
                    obj = {
                        ...obj,
                        // 状态改为待发起
                        standard_create_status: ToBeCreStdStatus.WAITING,
                    }
                    originalFieldTemp.push(obj)
                    return {
                        ...f,
                        originalField: obj,
                    }
                }
                originalFieldTemp.push(obj)
                return f
            })
            setFields(originalFieldTemp)
            setFieldsInfo(fieldsInfoTemp)

            message.success({
                content: tipsContent(),
                duration: 5,
                style: {
                    marginTop: '40px',
                },
            })
        } catch (e) {
            formatError(e)
        } finally {
            setAddfetching(false)
        }
    }

    /**
     * 行内容，变更在上，原数据在下
     * @param record 数据
     * @param key 列key值
     * @param empty 空内容
     * @param compared 是否参与数据比较
     * @returns
     */
    const rowContent = (record, key, empty, compared: boolean = true) => {
        // 变更的数据，对标推荐数据结构
        const changedData = getChangedData(record, key)

        const rowChangedField = getChangedFields(record, key)
        const showData =
            key === 'data_type'
                ? config?.data_type.find(
                      (currentData) => currentData.value_en === changedData,
                  )?.value || ''
                : changedData
        // 是否展示变更的数据
        const showTop =
            compared &&
            isChanged(record) &&
            changedData !== changeType(record[key])
        // 是否加粗
        const isWeight =
            isChanged(record) &&
            (!compared || changedData === changeType(record[key]))
        const originData =
            key === 'data_type'
                ? config?.data_type.find(
                      (currentData) => currentData.value_en === record[key],
                  )?.value || ''
                : record[key]
        return (
            <div className={compared ? styles.comparedRow : undefined}>
                {compared && (
                    <div className={styles.topInfoWrapper}>
                        <div
                            className={styles.topInfo}
                            title={showData || empty}
                            hidden={!showTop}
                        >
                            {key === 'value_range' && rowChangedField ? (
                                <ViewValueRange
                                    type={rowChangedField.value_range_type}
                                    value={rowChangedField.value_range}
                                    style={{ width: '220px' }}
                                />
                            ) : key === 'encoding_rule' &&
                              rowChangedField?.encoding_rule ? (
                                <ViewValueRange
                                    type={ValueRangeType.CodeRule}
                                    value={`${rowChangedField.encoding_rule}>><<`}
                                    style={{ width: '220px' }}
                                    showLabel={false}
                                />
                            ) : key === 'code_table' &&
                              rowChangedField?.code_table ? (
                                <ViewValueRange
                                    type={ValueRangeType.CodeTable}
                                    value={`${rowChangedField.code_table}>><<`}
                                    style={{ width: '220px' }}
                                    showLabel={false}
                                />
                            ) : key === 'label_name' && showData ? (
                                <span>
                                    <FontIcon
                                        name="icon-biaoqianicon"
                                        style={{
                                            marginRight: 4,
                                            color: getChangedData(
                                                record,
                                                'label_icon',
                                            ),
                                        }}
                                    />
                                    {
                                        showData.split('/')[
                                            showData.split('/').length - 1
                                        ]
                                    }
                                </span>
                            ) : (
                                showData || empty
                            )}
                        </div>
                        <a
                            onClick={(e) => {
                                e.stopPropagation()
                                undoConfirm(record?.name, () =>
                                    undoChangeField(record),
                                )
                            }}
                            hidden={!(showTop && key === 'name')}
                            className={styles.undoBtn}
                        >
                            {__('撤销')}
                        </a>
                        {/* 字段名称添加红点 */}
                        {record.new_flag && key === 'name' && showTop && (
                            <span className={styles.unreadDot} />
                        )}
                    </div>
                )}
                <div
                    className={classnames(
                        styles.bottomInfo,
                        isWeight && styles.topInfo,
                    )}
                    title={originData || empty}
                >
                    {showTop && `${__('原')}${__('：')}`}

                    {key === 'value_range' ? (
                        <ViewValueRange
                            type={record.value_range_type}
                            value={record.value_range}
                            style={{ width: '220px' }}
                        />
                    ) : key === 'encoding_rule' && record.encoding_rule ? (
                        <ViewValueRange
                            type={ValueRangeType.CodeRule}
                            value={`${record.encoding_rule}>><<`}
                            style={{ width: '220px' }}
                            showLabel={false}
                        />
                    ) : key === 'code_table' && record.code_table ? (
                        <ViewValueRange
                            type={ValueRangeType.CodeTable}
                            value={`${record.code_table}>><<`}
                            style={{ width: '220px' }}
                            showLabel={false}
                        />
                    ) : (
                        <>
                            <span className={styles.bottomInfoCon}>
                                {key === 'label_name' && originData ? (
                                    <span>
                                        <FontIcon
                                            name="icon-biaoqianicon"
                                            style={{
                                                marginRight: 4,
                                                color: record.label_icon,
                                            }}
                                        />
                                        {originData}
                                    </span>
                                ) : (
                                    originData || empty
                                )}
                                {/* 字段名称添加红点 */}
                                {record.new_flag &&
                                    key === 'name' &&
                                    !showTop && (
                                        <span className={styles.unreadDot} />
                                    )}
                            </span>
                            <a
                                onClick={(e) => {
                                    e.stopPropagation()
                                    undoConfirm(record?.name, () =>
                                        undoChangeField(record),
                                    )
                                }}
                                hidden={!(isWeight && key === 'name')}
                                className={styles.undoBtn}
                            >
                                {__('撤销')}
                            </a>
                        </>
                    )}
                </div>
            </div>
        )
    }

    const handleTableOpr = (e: any, op: StdOperateType, record?: any) => {
        e.stopPropagation()
        setEditItem(record)

        if (op === StdOperateType.ConfigureDataEle) {
            setSelDataItems([])
            setEditVisible(true)
            setStdRecParams({
                table_name: name,
                table_fields: [
                    {
                        table_field: record?.name,
                    },
                ],
            })
            // // 关闭未读alert提示
            // if (onSetAlertOpen) onSetAlertOpen(false)
        } else if (op === StdOperateType.AddToStd) {
            handleReqAddStandard([record?.id])
        } else if (op === StdOperateType.CreateStdTask) {
            // setLoading(true)

            setSureLoading(true)
            // 可创建任务字段
            const selFields = record
                ? [record]
                : fields?.filter((fItem) =>
                      selectedRowKeys?.includes(fItem?.id),
                  )
            // 可创建任务字段ids
            const fieldsIds = record
                ? [record?.id]
                : fields
                      ?.filter(
                          (fItem) =>
                              selectedRowKeys?.includes(fItem?.id) &&
                              fItem?.standard_create_status !==
                                  ToBeCreStdStatus.CREATING,
                      )
                      ?.map((item) => item?.id) || []

            const taskDefaultDataTemp = [...createTaskDefaultData]

            // 移除上次操作设置的标准分类
            remove(taskDefaultDataTemp, (d) => d.name === 'org_type')
            remove(taskDefaultDataTemp, (d) => d.name === 'fieldsIds')

            // 非表格内新建操作
            if (!record && !fieldsIds?.length) {
                message.info(__('勾选字段的标准正在创建中'))
                setSureLoading(false)
                return
            }
            // 非表格内新建操作
            if (!record && fieldsIds?.length < selectedRowKeys?.length) {
                message.info(__('部分勾选字段的标准正在创建中'))
            }

            // 设置本次创建新建标准任务字段ids
            taskDefaultDataTemp.push({ name: 'fieldsIds', value: fieldsIds })

            const fieldsOrgTypeList = uniq(
                compact(
                    selFields?.map((sItem) => sItem?.formulate_basis) || [],
                ),
            )

            const formulate_basis =
                fieldsOrgTypeList?.length === 1 ? fieldsOrgTypeList?.[0] : ''
            if (formulate_basis) {
                // 标准分类label
                const orgTypeLabel = config?.formulate_basis.find(
                    (currentConfig) =>
                        formulate_basis === currentConfig.value_en,
                )?.value
                // 标准分类的传值按照数据元那边的值，完成任务需要根据标准类型筛选数据元，类型：StandardizationType
                const org_type = stardOrignizeTypeList?.find(
                    (type) => type.label === orgTypeLabel,
                )?.value
                if (typeof org_type === 'number') {
                    taskDefaultDataTemp.push({
                        name: 'org_type',
                        value: org_type,
                    })
                }
            }
            setCreateTaskDefaultData(taskDefaultDataTemp)
            setTaskShow(true)
        }
    }

    // 当前操作字段所有相关信息
    const curOprField = useMemo(
        () => fieldsInfo.find((f) => f.keyId === editItem?.id)!,
        [fieldsInfo, editItem],
    )

    // 配置数据元-选择数据元弹窗
    const handleSelDataEle = async (newDataEle: any) => {
        const dataEleCode = newDataEle?.code
        if (!dataEleCode) return
        try {
            // 获取标准详情
            const res = await formsQueryStandardItem({ code: dataEleCode })
            if (!res) {
                return
            }
            let newFmDataEle: any = {}

            // 判断是否为历史数据
            const his = curOprField.historyFields.find(
                (h) => h.rowKey === dataEleCode,
            )

            if (his) {
                // 清掉已有的选中项
                curOprField.historyFields.splice(
                    curOprField.historyFields.indexOf(his),
                    1,
                )
            }
            // 更新历史数据，对标标准信息，增加自定义信息
            const { code_table_name, name: resName, ...others } = res
            if (tableKind === FormTableKind.DATA_STANDARD) {
                const newRes = await transformDataOptionsForDataStandard(
                    res.id,
                    res,
                )
                newFmDataEle = {
                    ...others,
                    label_id: newDataEle.label_id,
                    label_name: newDataEle.label_name,
                    label_icon: newDataEle.label_icon,
                    id: curOprField.originalField.id,
                    sid: curOprField.originalField.id,
                    standard_id: newRes.id,
                    formulate_basis: newRes.std_type_name,
                    rowName: FieldSource.SEARCH,
                    rowKey: newRes.id,
                    code_table: newRes.code_table,
                    encoding_rule: newRes.encoding_rule,
                    rule_name: newRes.rule_name,
                    value_range_type: 'custom',
                }
            } else {
                const newRes = await transformDataOptions(res.id, res)
                newFmDataEle = {
                    ...others,
                    label_id: newDataEle.label_id,
                    label_name: newDataEle.label_name,
                    label_icon: newDataEle.label_icon,
                    id: curOprField.originalField.id,
                    sid: curOprField.originalField.id,
                    standard_id: newRes.id,
                    formulate_basis: newRes.std_type_name,
                    rowName: FieldSource.SEARCH,
                    rowKey: newRes.id,
                    value_range: newRes.value_range,
                    value_range_type: newRes.value_range_type,
                }
            }

            curOprField.historyFields.push(newFmDataEle)
            // 修改标准状态
            curOprField.changedField = {
                ...newFmDataEle,
                standard_status: StandardStatus.NORMAL,
            }

            const fieldsInfoTemp = fieldsInfo?.map((item) => {
                if (item.keyId === editItem?.id) {
                    const newItem = {
                        ...item,
                        changedField: !!newFmDataEle && {
                            ...newFmDataEle,
                            standard_status: StandardStatus.NORMAL,
                        },
                    }
                    const configFieldsTemp = {
                        ...configFields,
                        [editItem.id]: newItem,
                    }
                    setConfigFields(configFieldsTemp)
                    return newItem
                }
                return item
            })
            setFieldsInfo(fieldsInfoTemp)
            setSaveDisabled(!fieldsInfoTemp.find((f) => f.changedField))
        } catch (error) {
            formatError(error)
        } finally {
            // setLoading(false)
        }
    }

    const handlePageChange = (page: number, pageSize: number) => {
        setSelectedRowKeys([])
        setSearchCondition({
            ...searchCondition,
            offset: page,
            limit: pageSize,
        })
    }

    // 业务表字段
    const columns: ColumnsType<any> = [
        {
            title: __('字段中文名称'),
            dataIndex: 'name',
            key: 'name',
            ellipsis: true,
            render: (_, record) => {
                // return rowContent(record, 'name', '--')
                // return (
                //     <div style={{ display: 'flex' }}>
                //         {rowContent(record, 'name', '--')}
                //     </div>
                // )
                return record.name
            },
        },
        {
            title: __('字段英文名称'),
            dataIndex: 'name_en',
            key: 'name_en',
            ellipsis: true,
            render: (_, record) => rowContent(record, 'name_en', '--'),
        },
        {
            title: __('是否标准'),
            key: 'is_standardization_required',
            width: 150,
            render: (_, record) => (
                <div>
                    {record.is_standardization_required ? __('是') : __('否')}
                </div>
            ),
        },
        {
            title: __('标准化状态'),
            dataIndex: 'standard_status',
            key: 'standard_status',
            render: (_, record) => {
                // 原数据的标准化状态
                const status =
                    fieldsInfo.find((f) => f.keyId === record.id)?.originalField
                        .standard_status || StandardStatus.NONE
                // 配置数据元则状态为“已标准化”
                const value = isChanged(record) ? StandardStatus.NORMAL : status
                const { label, color, bgColor } = standardStatusInfos.find(
                    (s) => s.value === value,
                )!
                return (
                    <div style={{ display: 'flex', alignItems: 'center' }}>
                        {/* <StandardStatusLabel
                            value={
                                isChanged(record)
                                    ? StandardStatus.NORMAL
                                    : status
                            }
                        /> */}
                        <div
                            className={classnames(
                                styles.stdStatus,
                                value === StandardStatus?.NORMAL &&
                                    styles.stdStatusNormal,
                            )}
                        >
                            {label}
                        </div>
                        {/* 字段关联了任务且任务未完成（标准化进行中）则显示此图标 */}
                        {record?.standard_create_status ===
                            ToBeCreStdStatus?.CREATING && (
                            <div style={{ marginLeft: 4 }}>
                                {getTaskTypeIcon(
                                    TaskType.FIELDSTANDARD,
                                    true,
                                    __('标准创建中'),
                                )}
                            </div>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('是否标准化'),
            dataIndex: 'is_standardization_required',
            key: 'is_standardization_required',
            render: (_, record) => {
                return record.is_standardization_required ? __('是') : __('否')
            },
        },
        // {
        //     title: __('标准分类'),
        //     dataIndex: 'formulate_basis',
        //     key: 'formulate_basis',
        //     ellipsis: true,
        //     render: (_, record) => {
        //         // 变更的数据，对标推荐数据结构
        //         const changedData = getChangedData(record, 'formulate_basis')
        //         // 是否展示变更的数据
        //         const showTop =
        //             isChanged(record) &&
        //             changedData !== changeType(record.formulate_basis)
        //         // 是否加粗
        //         const isWeight =
        //             isChanged(record) &&
        //             changedData === changeType(record.formulate_basis)

        //         const standardData =
        //             config?.formulate_basis.find(
        //                 (currentData) => currentData.value_en === changedData,
        //             )?.value || ''
        //         const value =
        //             config?.formulate_basis.find(
        //                 (currentData) =>
        //                     currentData.value_en === record.formulate_basis,
        //             )?.value || ''
        //         // const std = getFormulateBasis(changedData, standardEnum)
        //         return (
        //             <div>
        //                 <div
        //                     className={styles.topInfo}
        //                     title={standardData || '--'}
        //                     hidden={!showTop}
        //                 >
        //                     {standardData || '--'}
        //                 </div>

        //                 <div
        //                     className={classnames(
        //                         styles.bottomInfo,
        //                         isWeight && styles.topInfo,
        //                     )}
        //                     title={value || '--'}
        //                 >
        //                     {showTop && `${__('原')}${__('：')}`}
        //                     {value || '--'}
        //                 </div>
        //             </div>
        //         )
        //     },
        // },
        {
            title: __('数据标准'),
            dataIndex: 'standard_id',
            key: 'standard_id',
            ellipsis: true,
            render: (_, record) => {
                // 变更的数据，对标推荐数据结构
                const changedData = getChangedData(record, 'standard_id')
                // 是否展示变更的数据
                const showTop =
                    isChanged(record) &&
                    changedData !== changeType(record.formulate_basis)
                // 是否加粗
                const isWeight =
                    isChanged(record) &&
                    changedData === changeType(record.formulate_basis)

                const standardData =
                    config?.formulate_basis.find(
                        (currentData) => currentData.value_en === changedData,
                    )?.value || ''
                const value =
                    config?.formulate_basis.find(
                        (currentData) =>
                            currentData.value_en === record.formulate_basis,
                    )?.value || ''
                // const std = getFormulateBasis(changedData, standardEnum)
                return (
                    <div>
                        {changedData && (
                            <ViewValueRange
                                type={ValueRangeType.DataElement}
                                value={`${changedData}>><<`}
                                style={{ width: '120px' }}
                            />
                        )}

                        <div
                            className={classnames(
                                styles.bottomInfo,
                                isWeight && styles.topInfo,
                            )}
                            title={value || '--'}
                        >
                            {showTop && `${__('原')}${__('：')}`}
                            {record?.standard_id && (
                                <ViewValueRange
                                    type={ValueRangeType.DataElement}
                                    value={`${record.standard_id}>><<`}
                                    style={{ width: '120px' }}
                                />
                            )}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('数据类型'),
            dataIndex: 'data_type',
            key: 'data_type',
            ellipsis: true,
            render: (_, record) => rowContent(record, 'data_type', '--'),
        },
        {
            title: __('数据长度'),
            dataIndex: 'data_length',
            key: 'data_length',
            ellipsis: true,
            render: (_, record) => {
                const changed = fieldsInfo.find(
                    (f) => f.keyId === record.id,
                )?.changedField
                // 校验数据类型
                const bo1 = numberAndStringTypeArr.includes(changed?.data_type)
                // const bo2 = numberAndStringTypeArr.includes(record.data_type)
                // 变更的数据，对标推荐数据结构
                const changedData = bo1
                    ? getChangedData(record, 'data_length') || '--'
                    : '--'
                const data = record.data_length || '--'
                // 是否展示变更的数据
                const showTop = isChanged(record) && changedData !== data
                // 是否加粗
                const isWeight = isChanged(record) && changedData === data
                return (
                    <div>
                        <div
                            className={styles.topInfo}
                            title={changedData}
                            hidden={!showTop}
                        >
                            {changedData}
                        </div>
                        <div
                            className={classnames(
                                styles.bottomInfo,
                                isWeight && styles.topInfo,
                            )}
                            title={data}
                        >
                            {showTop && `${__('原')}${__('：')}`}
                            {data}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('数据精度'),
            dataIndex: 'data_accuracy',
            key: 'data_accuracy',
            ellipsis: true,
            render: (_, record) => {
                const changed = fieldsInfo.find(
                    (f) => f.keyId === record.id,
                )?.changedField
                // 校验数据类型
                const bo1 = numberTypeArr.includes(changed?.data_type)
                const bo2 = numberTypeArr.includes(record.data_type)
                // 变更的数据，对标推荐数据结构
                const changedData = bo1
                    ? getChangedData(record, 'data_accuracy') || 0
                    : '--'
                const data =
                    record.data_accuracy !== null ? record.data_accuracy : '--'
                // 是否展示变更的数据
                const showTop = isChanged(record) && changedData !== data
                // 是否加粗
                const isWeight = isChanged(record) && changedData === data
                return (
                    <div>
                        <div
                            className={styles.topInfo}
                            title={changedData}
                            hidden={!showTop}
                        >
                            {changedData}
                        </div>
                        <div
                            className={classnames(
                                styles.bottomInfo,
                                isWeight && styles.topInfo,
                            )}
                            title={data}
                        >
                            {showTop && `${__('原')}${__('：')}`}
                            {data}
                        </div>
                    </div>
                )
            },
        },
        {
            title: __('值域'),
            dataIndex: 'value_range',
            key: 'value_range',
            ellipsis: true,
            width: 280,
            render: (_, record) => rowContent(record, 'value_range', '--'),
        },
        {
            title: __('码表'),
            dataIndex: 'code_table',
            key: 'code_table',
            ellipsis: true,
            render: (_, record) => rowContent(record, 'code_table', '--'),
        },
        {
            title: __('编码规则'),
            dataIndex: 'encoding_rule',
            key: 'encoding_rule',
            ellipsis: true,
            render: (_, record) => rowContent(record, 'encoding_rule', '--'),
        },
        {
            title: __('数据分级'),
            dataIndex: 'label_name',
            key: 'label_name',
            ellipsis: true,
            render: (val, record) => rowContent(record, 'label_name', '--'),
            // val ? (
            //     <>
            //         <FontIcon name="icon-biaoqianicon" />
            //         {val}
            //     </>
            // ) : (
            //     '--'
            // ),
        },
        // {
        //     title: __('字段关系'),
        //     dataIndex: 'field_relationship',
        //     key: 'field_relationship',
        //     ellipsis: true,
        //     render: (_, record) =>
        //         rowContent(record, 'field_relationship', '--', false),
        // },
        {
            title: __('操作'),
            fixed: 'right',
            key: 'action',
            width: 268,
            render: (_, record) => (
                // 引用不显示操作列
                <div className={styles.tableOperate}>
                    <Button
                        type="link"
                        onClick={(e) =>
                            handleTableOpr(
                                e,
                                StdOperateType.ConfigureDataEle,
                                record,
                            )
                        }
                        // disabled={!!record.ref_id}
                    >
                        {__('配置数据元')}
                    </Button>
                    {/* cs项目从项目中创建新建标准任务，非cs的显示下面的字段新建标准任务 */}
                    {!isCSPlatform && (
                        <>
                            <Tooltip
                                title={
                                    [
                                        ToBeCreStdStatus?.WAITING,
                                        ToBeCreStdStatus?.CREATING,
                                    ].includes(record.standard_create_status) &&
                                    __('已添加至待新建标准或标准正在创建中')
                                }
                                overlayClassName={styles.oprToolTip}
                            >
                                <Button
                                    type="link"
                                    onClick={(e) =>
                                        handleTableOpr(
                                            e,
                                            StdOperateType.AddToStd,
                                            record,
                                        )
                                    }
                                    disabled={[
                                        ToBeCreStdStatus?.WAITING,
                                        ToBeCreStdStatus?.CREATING,
                                    ].includes(record.standard_create_status)}
                                    hidden={
                                        // 项目中暂屏蔽
                                        isProject
                                    }
                                >
                                    {__('待新建标准')}
                                </Button>
                            </Tooltip>
                            <Tooltip
                                title={
                                    record.standard_create_status ===
                                        ToBeCreStdStatus?.CREATING &&
                                    __('标准正在创建中')
                                }
                            >
                                <Button
                                    type="link"
                                    onClick={(e) =>
                                        handleTableOpr(
                                            e,
                                            StdOperateType.CreateStdTask,
                                            record,
                                        )
                                    }
                                    disabled={
                                        record.standard_create_status ===
                                        ToBeCreStdStatus?.CREATING
                                    }
                                    hidden={
                                        // 项目中暂屏蔽
                                        isProject
                                    }
                                >
                                    {__('新建任务')}
                                </Button>
                            </Tooltip>
                        </>
                    )}
                </div>
            ),
        },
    ]

    // 关闭未读提示-已读所有
    const unreadAlertOnClose = async () => {
        try {
            setListLoading(true)
            const unreadAllKeys = unreadList?.map((fItem) => fItem.id)
            // 通知标准平台字段已采纳
            await acceptFieldStd(unreadAllKeys)
        } catch (e) {
            formatError(e)
        } finally {
            setListLoading(false)
        }
    }

    return (
        <div className={styles.standardizingWrapper}>
            <CustomDrawer
                open={visible}
                okButtonProps={{ loading: sureLoading }}
                destroyOnClose
                onClose={() => {
                    // 没有变更不提示
                    if (saveDisabled) {
                        handleCancel()
                        return
                    }
                    ReturnConfirmModal({
                        onCancel: handleCancel,
                    })
                }}
                onCancel={handleCancel}
                handleOk={handleOk}
                className={styles.standardizingWrapper}
                headerWidth="calc(100% - 40px)"
                customTitleStyle={{
                    marginTop: 16,
                    // marginTop: alertOpen ? 56 : 16,
                }}
                title={
                    <div>
                        {/* <div className={styles.titleWrapper}> */}
                        <span>{__('标准化')}</span>
                        {/* <span className={styles.titleDescWrapper}>
                            <InfoCircleFilled
                                style={{ color: '#1890ff', fontSize: 14 }}
                            />
                            <span className={styles.titleDescInfo}>
                                {__('灰置字段为被引用字段，不可以进行标准化')}
                            </span>
                        </span> */}
                    </div>
                }
                titleExtend={
                    alertOpen && visible && standardSum ? (
                        <Alert
                            className={styles.alertBox}
                            message={
                                <div className={styles.message}>
                                    <InfoCircleFilled
                                        style={{ color: '#1890ff' }}
                                    />
                                    <div className={styles.msgInfo}>
                                        {__('有')}
                                        <span> {standardSum} </span>
                                        {__('条新标准可用')}
                                    </div>
                                    <span
                                        className={styles.messageBtn}
                                        onClick={() => {
                                            setViewStandardsVisible(true)
                                            // viewUnreadStandard()
                                            // getUnreadStandardList(
                                            //     searchCondition,
                                            // )
                                        }}
                                    >
                                        {__('立即查看')}
                                    </span>
                                </div>
                            }
                            type="info"
                            closable
                            onClose={unreadAlertOnClose}
                        />
                    ) : undefined
                }
                // okText={__('保存')}
                loading={saveDisabled}
                style={{
                    height: 'calc(100% - 100px)',
                    top: '76px',
                    left: '24px',
                    width: 'calc(100% - 48px)',
                }}
                bodyStyle={{
                    padding: 0,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    minWidth: 1280,
                    overflow: 'hidden',
                }}
                customBodyStyle={{
                    overflow: 'hidden',
                    height: 'calc(100% - 104px)',
                }}
                customHeaderStyle={{
                    display: 'flex',
                    flexDirection: 'column-reverse',
                }}
                getContainer={getContainer || false}
            >
                <div className={styles.empty} hidden={loading || showSearch}>
                    <Empty iconSrc={dataEmpty} desc={errText} />
                </div>
                <div className={styles.empty} hidden={!loading}>
                    <Loader />
                </div>
                <div
                    className={styles.bodyWrapper}
                    hidden={loading || !showSearch}
                >
                    <div className={styles.titleWrapper}>
                        {__('字段信息')}
                        <span className={styles.titleDescWrapper}>
                            <InfoCircleFilled
                                style={{ color: '#1890ff', fontSize: 14 }}
                            />
                            <span className={styles.titleDescInfo}>
                                {__('灰置字段为被引用字段，不可以进行标准化')}
                            </span>
                        </span>
                    </div>
                    <div className={styles.operateWrapper}>
                        <div className={styles.operateBox}>
                            <Tooltip
                                title={
                                    selectedRowKeys.length === 0 &&
                                    __('选择字段进行标准推荐')
                                }
                            >
                                <Button
                                    type="primary"
                                    className={styles.operate}
                                    onClick={() => handleRecommend()}
                                    loading={fetching}
                                    disabled={selectedRowKeys.length === 0}
                                >
                                    {!fetching && (
                                        <RecommendOutlined
                                            style={{ fontSize: 14 }}
                                        />
                                    )}
                                    {__('智能推荐')}
                                </Button>
                            </Tooltip>
                            {/* cs项目从项目中创建新建标准任务，非cs的显示下面的字段新建标准任务 */}

                            {!isCSPlatform && (
                                <>
                                    <Tooltip
                                        title={
                                            topAddPendingBtnDisable
                                                ? __(
                                                      '选择字段添加至“待新建标准”',
                                                  )
                                                : ''
                                        }
                                    >
                                        <Button
                                            className={styles.operate}
                                            onClick={(e) =>
                                                handleReqAddStandard(
                                                    selectedRowKeys,
                                                )
                                            }
                                            // loading={addfetching}
                                            icon={
                                                <FieldStandardColored
                                                    style={{
                                                        fontSize: 18,
                                                    }}
                                                />
                                            }
                                            disabled={topAddPendingBtnDisable}
                                            hidden={
                                                // !getAccess(
                                                //     accessScene.biz_newStd,
                                                //     taskInfo,
                                                // ) ||
                                                // 项目中暂屏蔽
                                                isProject ||
                                                !checkTask('newStandard')
                                            }
                                        >
                                            {__('添加至待新建标准')}
                                        </Button>
                                    </Tooltip>
                                    <Tooltip
                                        title={
                                            topNewTaskBtnDisable
                                                ? __(
                                                      '选择字段创建“新建标准任务”',
                                                  )
                                                : ''
                                        }
                                    >
                                        <Button
                                            className={styles.operate}
                                            onClick={(e) =>
                                                handleTableOpr(
                                                    e,
                                                    StdOperateType.CreateStdTask,
                                                )
                                            }
                                            icon={<ToDoTaskOutlined />}
                                            disabled={topNewTaskBtnDisable}
                                            hidden={
                                                // !getAccess(
                                                //     accessScene.biz_newStd,
                                                //     taskInfo,
                                                // ) ||

                                                isProject ||
                                                !checkTask('newStandard')
                                            }
                                        >
                                            {__('新建标准任务')}
                                        </Button>
                                    </Tooltip>
                                </>
                            )}
                        </div>
                        <Space size={4}>
                            <SearchInput
                                placeholder={__('搜索字段中文名称、英文名称')}
                                onKeyChange={(kw: string) => {
                                    if (searchVal !== trim(kw)) {
                                        setSearchVal(trim(kw))
                                        // getFormFields({
                                        //     ...searchCondition,
                                        //     keyword: trim(kw),
                                        // })
                                        setSearchCondition({
                                            ...searchCondition,
                                            keyword: trim(kw),
                                        })
                                    }
                                }}
                                onPressEnter={(e: any) => {
                                    const kw = e?.target?.value || ''
                                    if (searchVal !== trim(kw)) {
                                        setSearchVal(trim(kw))
                                        setSearchCondition({
                                            ...searchCondition,
                                            keyword: trim(kw),
                                        })
                                    }
                                    // getFormFields({
                                    //     ...searchCondition,
                                    //     keyword: trim(kw),
                                    // })
                                }}
                                style={{ width: 272 }}
                            />
                            <div className={styles.selectWrapper}>
                                {/* <LightweightSearch
                                    formData={standardizingSearchData}
                                    onChange={(data, key) =>
                                        searchChange(data, key)
                                    }
                                    defaultValue={{
                                        status: defFieldStdState,
                                    }}
                                /> */}
                            </div>
                            <RefreshBtn
                                onClick={() => {
                                    setLoading(true)
                                    getFormFields(searchCondition)
                                    // getUnreadStandardList({
                                    //     // 业务表模型id
                                    //     business_table_model_id: mid || '',
                                    //     // 业务表名称
                                    //     business_table_id: fid,
                                    //     state: `${ToBeCreStdStatusValue.CREATED}`,
                                    // })
                                    setLoading(false)
                                }}
                                // onClick={() =>
                                //     handleSearchPressEnter({
                                //         status: stdStatus,
                                //         keyword: searchVal,
                                //     })
                                // }
                            />
                        </Space>
                    </div>
                    <div className={styles.fieldsTableWrapper}>
                        <Table
                            className={styles.fieldsTable}
                            columns={(isStart
                                ? columns
                                : columns.filter(
                                      (col) => col.key !== 'label_name',
                                  )
                            ).filter((col) =>
                                tableKind === FormTableKind.DATA_STANDARD
                                    ? col.key !== 'value_range'
                                    : !['code_table', 'encoding_rule'].includes(
                                          col.key as string,
                                      ),
                            )}
                            dataSource={fields}
                            loading={listLoading || fetching}
                            pagination={false}
                            scroll={{
                                x: 1600,
                                y:
                                    total < defaultPageSize
                                        ? 'calc(100vh - 390px)'
                                        : 'calc(100vh - 434px)',
                            }}
                            locale={{ emptyText: <Empty /> }}
                            rowKey="id"
                            rowSelection={rowSelection}
                            onRow={(record) => {
                                return {
                                    onClick: () => {
                                        // 单行点击处理
                                        const idx = selectedRowKeys.indexOf(
                                            record.id,
                                        )
                                        if (idx === -1) {
                                            // 不存在添加
                                            setSelectedRowKeys([
                                                ...selectedRowKeys,
                                                record.id,
                                            ])
                                        } else {
                                            // 存在删除
                                            setSelectedRowKeys([
                                                ...selectedRowKeys.filter(
                                                    (k) => k !== record.id,
                                                ),
                                            ])
                                        }
                                    },
                                }
                            }}
                        />
                        <div
                            className={styles.paginationBox}
                            hidden={total <= defaultPageSize}
                        >
                            <ListPagination
                                listType={defaultListType}
                                queryParams={searchCondition}
                                totalCount={total || 0}
                                onChange={handlePageChange}
                                className={styles.pagination}
                            />
                        </div>
                    </div>
                </div>
                {/* 选择码表/编码规则 */}
                {editVisible && (
                    <SelDataByTypeModal
                        visible={editVisible}
                        onClose={() => setEditVisible(false)}
                        dataType={CatalogType.DATAELE}
                        oprItems={selDataItems}
                        setOprItems={setSelDataItems}
                        onOk={(oprItems: any) =>
                            handleSelDataEle(oprItems?.[0])
                        }
                        handleShowDataDetail={(
                            dataType: CatalogType,
                            dataId?: string,
                        ) => {
                            setShowDEDetailId(dataId || '')
                            setDataEleDetailVisible(true)
                        }}
                        stdRecParams={stdRecParams}
                    />
                )}
                {/* 查看数据元详情 */}
                {dataEleDetailVisible && !!showDEDetailId && (
                    <DataEleDetails
                        visible={dataEleDetailVisible}
                        dataEleId={showDEDetailId}
                        onClose={() => setDataEleDetailVisible(false)}
                    />
                )}
                {/* <StandardChoose
                title={__('请选择数据元')}
                visible={false}
                keyVal={editItem?.id}
                standardEnum={standardEnum}
                name={name}
                fid={fid}
                mbid={mbid}
                config={config}
                onClose={() => setEditVisible(false)}
                onSure={() => {
                    setEditVisible(false)
                    setFields(
                        fieldsInfo.map((f) => {
                            const obj = f.originalField
                            if (editItem?.id === f.keyId) {
                                obj.new_flag = false
                            }
                            return obj
                        }),
                    )
                    checkDataIsChanged()
                }}
            /> */}
                {/* 查看新建标准 */}
                {viewStandardsVisible && (
                    <ViewFieldStd
                        visible={viewStandardsVisible}
                        keyVal={editItem?.id}
                        standardEnum={standardEnum}
                        name={name}
                        mid={mid}
                        fid={fid}
                        mbid={mbid}
                        config={config}
                        onClose={() => setViewStandardsVisible(false)}
                        onSure={(info?: any) => {
                            getUnreadStandardList({
                                // 业务表模型id
                                business_table_model_id: mid || '',
                                // 业务表名称
                                business_table_id: fid,
                                state: `${ToBeCreStdStatusValue.CREATED}`,
                            })
                            getFormFields(searchCondition)
                            setViewStandardsVisible(false)
                        }}
                        getContainer={getContainer || false}
                    />
                )}

                {taskShow && (
                    <CreateTask
                        show={taskShow}
                        operate={OperateType.CREATE}
                        title={__('新建任务')}
                        defaultData={createTaskDefaultData}
                        isSupportFreeTask={!taskInfo?.projectId}
                        // isNameRow={isNameRow}
                        // needParentTaskId={needParentTaskId}
                        isTaskShowMsg={false}
                        onClose={(info) => {
                            if (info) {
                                createTaskToStandard(info)
                            }
                            setTaskShow(false)
                            setSureLoading(false)
                        }}
                    />
                )}
            </CustomDrawer>
            {addStandardVisible && (
                <ReqAddStandard
                    open={addStandardVisible}
                    showStateTabs={showStateTabs}
                    coreBizName={coreBizName}
                    fid={fid}
                    mbid={mbid}
                    titleText={__('标准化')}
                    onClose={() => setAddStandardVisible(false)}
                    onSure={() => {
                        // setAddStandardVisible(false)
                    }}
                    getContainer={getContainer}
                />
            )}
        </div>
    )
}

export default Standardizing
