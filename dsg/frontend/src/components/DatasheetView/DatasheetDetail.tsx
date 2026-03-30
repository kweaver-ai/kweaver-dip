import {
    ExclamationCircleFilled,
    InfoCircleFilled,
    LeftOutlined,
} from '@ant-design/icons'
import { useUnmount } from 'ahooks'
import { Button, Popconfirm, Radio, Space, Tabs, Tooltip, message } from 'antd'
import classnames from 'classnames'
import { has, isEqual, isNull, omit, pick } from 'lodash'
import moment from 'moment'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    DataViewRevokeType,
    GradeLabelStatusEnum,
    IGradeLabel,
    LogicViewType,
    LoginPlatform,
    SortDirection,
    createExcelView,
    editDatasheetView,
    formatError,
    getDataGradeLabel,
    getDataGradeLabelStatus,
    getDataViewBaseInfo,
    getDataViewCompletion,
    getDataViewRepeat,
    getDatasheetView,
    getDatasheetViewDetails,
    messageSuccess,
    putDataViewCompletion,
    revokeDataViewAudit,
} from '@/core'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useTestLLM } from '@/hooks/useTestLLM'
import {
    EditOutlined,
    FontIcon,
    FormListModelOutlined,
    FormTableModelOutlined,
} from '@/icons'
import { IconType } from '@/icons/const'
import { SearchInput } from '@/ui'
import Empty from '@/ui/Empty'
import Loader from '@/ui/Loader'
import ReturnConfirmModal from '@/ui/ReturnConfirmModal'
import {
    OperateType,
    getPlatformNumber,
    useQuery,
    isSemanticGovernanceApp,
} from '@/utils'
import { info } from '@/utils/modalHelper'
import { BusinessDomainType } from '../BusinessDomain/const'
import ConsanguinityGraph from '../ConsanguinityGraph'
import { getTagsData } from '../DataClassificationTag/const'
import GlobalMenu from '../GlobalMenu'
import ImpactAnalysis from '../ImpactAnalysis'
import { ModuleType } from '../SceneAnalysis/const'
import ReportDetailContent from '../WorkOrder/QualityReport/ReportDetail/ReportDetailContent'
import AdvancedSettings from './AdvancedSettings'
import CompletionViewDrawer from './AutoCompletion/CompletionViewDrawer'
import {
    AuditOperateMsg,
    AuditingStatus,
    AutoCompleteStatus,
    IEditFormData,
    VIEWERRORCODElIST,
    detailTabItems,
    detailTabKey,
    excelFormTemplate,
    filterEmptyProperties,
    onLineStatus,
    stateType,
} from './const'
import DataQuality from './DataQuality'
import DataViewDetail from './DataViewDetail'
import { useDataViewContext } from './DataViewProvider'
import DelFieldsModal from './DelFieldsModal'
import FieldList from './FieldList'
import FieldsTable from './FieldsTable'
import FormViewExampleData from './FormViewExampleData'
import { updateExcelFieldsStatus, validateRepeatName } from './helper'
import IconInstructions from './IconInstructions'
import __ from './locale'
import styles from './styles.module.less'

interface IDatasheetDetail {
    id?: string
    model?: string
    isCompleted?: string
    detailsUrl?: string
    logic?: string
    targetTab?: string
}

// 页面路径中获取参数
const DatasheetDetail = (props: IDatasheetDetail) => {
    const query = useQuery()
    const navigator = useNavigate()
    const { pathname } = useLocation()
    const model = query.get('model') || props?.model || ''
    const id = query.get('id') || props?.id || ''
    // 任务中心参数
    const detailsUrl = query.get('detailsUrl') || props?.detailsUrl || ''
    const dataSourceType = query.get('dataSourceType') || ''
    const backPrev = query.get('backPrev') || ''
    const backUrl = query.get('backUrl') || ''
    const taskId = query.get('taskId') || ''
    const projectId = query.get('projectId') || ''
    const isCompleted = query.get('isCompleted') || props?.isCompleted || ''
    const targetTab = query.get('targetTab') || props?.targetTab
    const logic = (query.get('logic') ||
        props?.logic ||
        LogicViewType.DataSource) as LogicViewType
    const filename = query.get('filename')
    const dataSourceId = query.get('dataSourceId') || ''
    const isEvaluation = query.get('isValueEvaluation') || ''
    const fieldsTableRef: any = useRef()
    const optionTypeRef: any = useRef()
    const [openDropdown, setOpenDropdown] = useState<boolean>(false)
    const [openDelFields, setOpenDelFields] = useState<boolean>(false)
    const [{ using }] = useGeneralConfig()
    // semanticGovernance 专用
    const isSemanticGovernance = isSemanticGovernanceApp()
    const [dataList, setDataList] = useState<any[]>([])
    const [fillteDataList, setFillteDataList] = useState<any[]>([])
    const [currentData, setCurrentData] = useState<any>({})
    const [dropdownSearchKey, setDropdownSearchKey] = useState<string>('')
    const [delfieldList, setDelFieldList] = useState<any[]>([])
    const [isNotExistDatasheet, setIsNotExistDatasheet] =
        useState<boolean>(false)
    const [openEditBasicInfo, setOpenEditBasicInfo] = useState<boolean>(false)
    const [moreInfoIschanged, setMoreInfoIschanged] = useState<boolean>(false)
    const platformNumber = getPlatformNumber()
    const {
        baseInfoData,
        setBaseInfoData,
        optionType,
        setOptionType,
        taskIsCompleted,
        setTaskIsCompleted,
        completeStatus,
        setCompleteStatus,
        completeSelectData,
        setCompleteSelectData,
        completeData,
        setCompleteData,
        editedComplete,
        setEditedComplete,
        setCompletionTimer,
        getCompletionTimer,
        setLogicViewType,
        fieldsTableData,
        setFieldsTableData,
        datasheetInfo,
        setDatasheetInfo,
        onValidateNameRepeat,
        onSubmitBasicInfo,
        setDataOriginType,
        excelForm,
        isValueEvaluation,
        setIsValueEvaluation,
    } = useDataViewContext()
    const [tabActiveKey, setTabActiveKey] = useState<detailTabKey | string>(
        detailTabKey.view,
    )
    const [viewModalRadio, setViewModalRadio] = useState<string>('table')
    const [formViewStatus, setFormViewStatus] = useState<string>('')
    const [loading, setLoading] = useState<boolean>(false)
    const [openDataViewDetail, setOpenDataViewDetail] = useState<boolean>(false)
    // const [operationWid, setOperationWid] = useState<number>(99)
    const [isStart, setIsStart] = useState(false)
    const [isAuditing, setIsAuditing] = useState(false)
    const [auditOperateType, setAuditOperateType] = useState<any>()
    const [tagData, setTagData] = useState<IGradeLabel[]>([])
    // 补全抽屉
    const [openCompletionView, setOpenCompletionView] = useState<boolean>(false)

    // 保存失败
    const [saveFailed, setSaveFailed] = useState<boolean>(false)
    const [llm] = useTestLLM()

    // 库表信息校验属性
    const baseInfoAttr = [
        'business_name',
        'technical_name',
        'description',
        'subject_id',
        'department_id',
        'owner_id',
    ]
    // 字段信息校验属性
    const fieldInfoAttr = [
        'id',
        'business_name',
        'standard_code',
        'code_table_id',
        'attribute_id',
        'classfity_type',
        'clear_attribute_id',
        'business_timestamp',
        'data_type',
        'reset_convert_rules',
        'reset_data_length',
        'reset_data_accuracy',
        'label_id',
        'label_name',
        'grade_type',
        'shared_type',
        'open_type',
        'sensitive_type',
        'secret_type',
    ]

    // 表格字段信息校验属性
    const excelFieldInfoAttr = [
        'id',
        'business_name',
        'technical_name',
        'standard_code',
        'code_table_id',
        'attribute_id',
        'classfity_type',
        'clear_attribute_id',
        'business_timestamp',
        'data_type',
    ]

    useEffect(() => {
        if (isEvaluation) {
            setIsValueEvaluation(true)
        }
    }, [isEvaluation])

    useEffect(() => {
        if (id) {
            getDetails()
            setCompleteStatus(AutoCompleteStatus.None)
        } else if (dataSourceType === 'excel') {
            setDatasheetInfo({
                ...excelFormTemplate,
                excel_file_name: filename,
                datasource_id: dataSourceId,
            })
            setOpenDataViewDetail(true)
        }
    }, [id, dataSourceId, dataSourceType])

    useEffect(() => {
        if (
            baseInfoData?.id &&
            tabActiveKey === detailTabKey.view &&
            baseInfoData?.status !== stateType.delete
        ) {
            getCompletionResult()
        } else {
            clearCompletionTimer()
        }
    }, [baseInfoData?.id, tabActiveKey])

    useEffect(() => {
        if (targetTab) {
            setTabActiveKey(targetTab)
        }
    }, [targetTab])

    useEffect(() => {
        setOptionType(model || 'view')
        setLogicViewType(logic)
        getTagStatus()
    }, [])

    useEffect(() => {
        if (optionType === 'view') {
            setSaveFailed(false)
        }
    }, [optionType])

    useEffect(() => {
        setTaskIsCompleted(taskId && isCompleted === 'true')
    }, [isCompleted, taskId])

    useUnmount(() => {
        clearCompletionTimer()
    })

    // 获取分级标签是否开启
    const getTagStatus = async () => {
        try {
            const res = await getDataGradeLabelStatus()
            setIsStart(res === GradeLabelStatusEnum.Open)
            if (res === GradeLabelStatusEnum.Open) {
                const result = await getDataGradeLabel({ keyword: '' })
                const tagArr = []
                getTagsData(result.entries, tagArr)
                setTagData(tagArr)
            }
        } catch (error) {
            formatError(error)
        }
    }

    useEffect(() => {
        setDataOriginType(dataSourceType)
    }, [dataSourceType])

    const showEditBtn: boolean = useMemo(() => {
        const hideEditBtnStatus = [
            onLineStatus.OnlineAuditing,
            onLineStatus.OfflineAuditing,
        ]
        const flag = taskId
            ? isCompleted !== 'true' && !isAuditing
            : !isAuditing
        return flag && !isValueEvaluation
    }, [isCompleted, taskId, isAuditing, isValueEvaluation])

    // useEffect(() => {
    //     if (optionTypeRef?.current) {
    //         setTimeout(() => {
    //             const width = (optionTypeRef?.current?.offsetWidth || 0) + 8
    //             setOperationWid(width)
    //         }, 1000)
    //     }
    // }, [detailsData])

    const handleReturn = () => {}

    const handleOpenDropdownChange = (flag: boolean) => {
        setOpenDropdown(flag)
    }

    const getDetails = async (hideLoading?: boolean) => {
        try {
            if (!hideLoading) {
                setLoading(true)
            }
            const res = await getDatasheetViewDetails(id)
            const publish = !!res?.last_publish_time
            setFormViewStatus(
                !res?.last_publish_time && res.status !== 'delete'
                    ? 'unPublished'
                    : res.status,
            )
            const baseRes = await getDataViewBaseInfo(id)
            // 去除空字段
            const baseResValue: IEditFormData = filterEmptyProperties(baseRes)
            let subject_type = {}
            if (baseResValue.subject_id) {
                subject_type = {
                    subject_type:
                        logic === LogicViewType.LogicEntity
                            ? BusinessDomainType.logic_entity
                            : BusinessDomainType.subject_domain,
                }
            }
            const totalData = {
                ...baseResValue,
                ...res,
                id,
                ...subject_type,
            }
            // 屏蔽切换库表功能，指定详情数据为当前数据，后续放开需调整
            setCurrentData({
                ...res,
                updated_at: baseResValue?.updated_at,
                publish_at: res?.last_publish_time,
            })
            const delFields = res?.fields
                ?.filter((item) => item.status === stateType.delete)
                .sort((a, b) =>
                    a.business_name.localeCompare(b.business_name, 'pinyin', {
                        numeric: true,
                    }),
                )
            setDelFieldList(delFields)
            // setOptionType(!res?.last_publish_time ? 'edit' : model)
            const data = res?.fields.filter((item) =>
                publish
                    ? item.status !== stateType.new
                    : item.status !== stateType.delete,
            )
            setFieldsTableData(data)
            setDatasheetInfo(omit(totalData, ['fields']))
            setLoading(false)
            setOpenDataViewDetail(
                !hideLoading && (!targetTab || targetTab === detailTabKey.view),
            )
            setIsAuditing(AuditingStatus.includes(baseResValue?.online_status))
            setAuditOperateType(
                baseResValue?.online_status?.startsWith('up-')
                    ? DataViewRevokeType.Online
                    : DataViewRevokeType.Offline,
            )
            // 从列表通过编辑/变更按钮进入
            if (model === 'edit') {
                // 已发布详情过滤新增字段，编辑显示所有字段
                setFieldsTableData(
                    res?.fields?.map((item) => ({
                        ...item,
                        tips:
                            validateRepeatName(
                                res?.fields?.filter(
                                    (it) => it.status !== stateType.delete,
                                ),
                                item,
                            ) && item.status !== stateType.delete
                                ? __('此名称和其他字段的业务名称重复，请修改')
                                : '',
                    })),
                )
            }
            setBaseInfoData(totalData)
        } catch (err) {
            setIsNotExistDatasheet(
                err?.data?.code === 'DataView.FormView.FormViewIdNotExist',
            )
            setFieldsTableData([])
            setLoading(false)
        }
    }

    const getDatasheetData = async () => {
        try {
            const res = await getDatasheetView({
                limit: 2000,
                offset: 1,
                task_id: taskId || undefined,
                direction: SortDirection.DESC,
                sort: 'updated_at',
            })
            // const list = res?.entries.filter((item) => item.publish_at)
            const list = res?.entries
            setDataList(list)
            setFillteDataList(list)
            const current = res?.entries.find((item) => item.id === id) || {}
            setCurrentData(current)
        } catch (err) {
            formatError(err)
        }
    }

    const datasheetChange = (item: any) => {
        setCurrentData(item)
        setOpenDropdown(false)
        setDropdownSearchKey('')
        const taskUrl = `${detailsUrl}&projectId=${projectId}&taskId=${taskId}&backUrl=${backUrl}`
        const url = `${pathname}?id=${
            item.id
        }&model=${model}&isCompleted=${isCompleted}&${
            detailsUrl && detailsUrl !== 'null' ? `&detailsUrl=${taskUrl}` : ''
        }`
        // setOptionType(item?.publish_at ? 'view' : 'eidt')
        navigator(url)
    }

    const onBackClick = () => {
        const baseInfo = filterEmptyProperties(pick(baseInfoData, baseInfoAttr))
        const editBaseInfo = filterEmptyProperties(
            pick(datasheetInfo, baseInfoAttr),
        )
        const fieldsInfo =
            baseInfoData?.fields.map((item) =>
                filterEmptyProperties(pick(item, fieldInfoAttr)),
            ) || []
        const editFieldsInfo =
            fieldsTableData.map((item) =>
                filterEmptyProperties(pick(item, fieldInfoAttr)),
            ) || []
        const isChanged = !(
            isEqual(baseInfo, editBaseInfo) &&
            isEqual(fieldsInfo, editFieldsInfo) &&
            !editedComplete
        )
        if (isChanged && optionType === 'edit') {
            ReturnConfirmModal({
                onCancel: () => {
                    onBack()
                },
            })
        } else {
            onBack()
        }
    }

    const onBack = () => {
        if (backPrev || isValueEvaluation) {
            navigator(-1)
            return
        }
        const url = `${detailsUrl}&projectId=${projectId}&taskId=${taskId}&backUrl=${backUrl}`
        navigator(
            detailsUrl && detailsUrl !== 'null'
                ? url
                : `/datasheet-view?tab=${logic}`,
        )
    }

    const onEdit = () => {
        // 已发布详情过滤新增字段，编辑显示所有字段
        setFieldsTableData(
            baseInfoData?.fields?.map((item) => ({
                ...item,
                tips:
                    validateRepeatName(
                        baseInfoData?.fields?.filter(
                            (it) => it.status !== stateType.delete,
                        ),
                        item,
                    ) && item.status !== stateType.delete
                        ? __('此名称和其他字段的业务名称重复，请修改')
                        : '',
            })),
        )
        // 当前选中字段信息
        const selectedField = fieldsTableRef?.current?.currentDataId
            ? `&offset=${fieldsTableRef.current.offset}&selectFieldId=${fieldsTableRef.current.currentDataId}`
            : ''
        if (logic === LogicViewType.Custom) {
            navigator(
                `/datasheet-view/graph?operate=${OperateType.EDIT}&module=${ModuleType.CustomView}&from=detail&sceneId=${baseInfoData?.scene_analysis_id}&viewId=${id}${selectedField}`,
            )
        } else if (logic === LogicViewType.LogicEntity) {
            const objId = baseInfoData?.subject_path_id.split('/').slice(-2)[0]
            const entityId = baseInfoData?.subject_path_id
                .split('/')
                .slice(-1)[0]
            navigator(
                `/datasheet-view/graph?operate=${OperateType.EDIT}&module=${ModuleType.LogicEntityView}&from=detail&sceneId=${baseInfoData?.scene_analysis_id}&viewId=${id}&objId=${objId}&entityId=${entityId}${selectedField}`,
            )
        } else {
            setViewModalRadio('table')
        }
        setOptionType('edit')
    }

    /**
     * 创建 Excel 库表
     */
    const handleCreateExcelView = async () => {
        if (openDataViewDetail && excelForm?.current) {
            try {
                // 校验编辑框表单是否正确
                await excelForm.current.validateFields()
            } catch (err) {
                return
            }
        }

        try {
            // 校验信息
            const businessNameError = await onValidateNameRepeat(
                datasheetInfo?.business_name,
                'business_name',
            )
            if (businessNameError !== false) {
                info({
                    title: __('无法发布'),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#1890FF' }} />
                    ),
                    content: __('库表业务名称重复'),
                    okText: __('确定'),
                })
                return
            }
            const technicalNameError = await onValidateNameRepeat(
                datasheetInfo?.technical_name,
                'technical_name',
            )
            if (technicalNameError !== false) {
                info({
                    title: __('无法发布'),
                    icon: (
                        <ExclamationCircleFilled style={{ color: '#1890FF' }} />
                    ),
                    content: __('库表技术名称重复'),
                    okText: __('确定'),
                })
                return
            }

            if (fieldsTableData.filter((item) => item.tips).length > 0) {
                fieldsTableRef?.current?.showErrorModal()
                return
            }

            const business_name = datasheetInfo?.business_name
            const params = {
                ...datasheetInfo,
                business_name,
                fields: fieldsTableData.map((item) =>
                    pick(item, excelFieldInfoAttr),
                ),
            }
            await createExcelView(params)
            message.success(__('发布成功'))
            onBack()
        } catch (err) {
            formatError(err)
        }
    }

    const onSave = async (type: string, ownerId?: string) => {
        // if (!detailsData?.owner_id && !ownerId) {
        //     setOpenEditBasicInfo(true)
        //     return
        // }
        if (
            dataSourceType === 'excel' &&
            openDataViewDetail &&
            excelForm?.current
        ) {
            try {
                // 校验编辑框表单是否正确
                await excelForm.current.validateFields()
            } catch (err) {
                return
            }
        }
        try {
            // 校验信息
            const businessNameError = await onValidateNameRepeat(
                datasheetInfo?.business_name,
                'business_name',
            )
            if (businessNameError !== false) {
                setOpenDataViewDetail(true)
                fieldsTableRef?.current?.hideFieldDetails()
                return
            }
            if (fieldsTableData.filter((item) => item.tips).length > 0) {
                fieldsTableRef?.current?.showErrorModal()
                return
            }
            if (!datasheetInfo.department_id) {
                setDatasheetInfo((pre) => ({
                    ...pre,
                    department_id_tips: __('请选择所属部门'),
                }))
                message.info(__('请选择所属部门'))
                return
            }
            if (!datasheetInfo.owners?.length) {
                setDatasheetInfo((pre) => ({
                    ...pre,
                    owner_id_tips: __('请选择数据Owner'),
                }))
                message.info(__('请选择数据Owner'))
                return
            }

            const business_name = datasheetInfo?.business_name
            const info_system_id = datasheetInfo?.info_system_id
            const business_timestamp_id = fieldsTableData.find(
                (item) => item.business_timestamp,
            )?.id

            const params = {
                type,
                id,
                business_name,
                info_system_id,
                business_timestamp_id: business_timestamp_id || '',
                fields: fieldsTableData.map((item) =>
                    pick(item, fieldInfoAttr),
                ),
            }
            await Promise.all([
                editDatasheetView(params),
                editCompleteData(),
                onSubmitBasicInfo(),
            ])
            message.success(
                __(
                    type === 'temp'
                        ? '保存草稿成功'
                        : baseInfoData?.last_publish_time
                        ? '更新库表成功'
                        : '发布成功',
                ),
            )
            getDetails()
            // getDatasheetData()
            setOptionType('view')
        } catch (err) {
            setSaveFailed(true)
            if (err?.data?.code === 'DataView.FormView.FormViewIdNotExist') {
                message.info(__('无法操作，库表已不存在'))
            } else if (err?.data?.code === VIEWERRORCODElIST.VIEWSQLERRCODE) {
                message.error(`${err?.data?.description}${err?.data?.detail}`)
            } else {
                formatError(err)
            }
        }
    }

    const dropdownItems = [
        {
            key: '1',
            label: (
                <div className={styles.dropdownOverlay}>
                    <div className={styles.dropdownInput}>
                        <SearchInput
                            value={dropdownSearchKey}
                            onKeyChange={(kw: string) => {
                                // 至少搜索过一次之后的清空操作
                                setFillteDataList(
                                    kw
                                        ? dataList.filter((item) => {
                                              return item.business_name
                                                  .toLocaleLowerCase()
                                                  .includes(
                                                      kw.toLocaleLowerCase(),
                                                  )
                                          })
                                        : dataList,
                                )
                                setDropdownSearchKey(kw)
                            }}
                            placeholder={__('搜索库表')}
                        />
                    </div>
                    <div className={styles.itemBox}>
                        {fillteDataList.length > 0 ? (
                            fillteDataList.map((item) => {
                                return (
                                    <div
                                        onClick={() => datasheetChange(item)}
                                        key={item.id}
                                        className={classnames(
                                            styles.dropdownItem,
                                            currentData.id === item.id &&
                                                styles.active,
                                        )}
                                        title={item.business_name}
                                    >
                                        {item.business_name}
                                    </div>
                                )
                            })
                        ) : (
                            <div
                                className={classnames(
                                    styles.dropdownItem,
                                    styles.emptyDesc,
                                )}
                            >
                                {__('抱歉，没有找到相关内容')}
                            </div>
                        )}
                    </div>
                </div>
            ),
        },
    ]

    const notExistDatasheet = () => {
        return (
            <div className={styles.emptyWrapper}>
                <Empty
                    desc={__('当前库表已不存在，无法查看')}
                    iconSrc={dataEmpty}
                />
            </div>
        )
    }

    const notExistExcel = () => {
        return (
            <div className={styles.emptyWrapper}>
                <Empty
                    desc={__(
                        '请先在右侧选取库表的数据范围，再在表格中补全字段属性信息',
                    )}
                    iconSrc={dataEmpty}
                />
            </div>
        )
    }

    // 撤销 上线、下线、发布审核
    const revokeAudit = async (
        logic_view_id: string,
        operate_type: DataViewRevokeType,
    ) => {
        try {
            await revokeDataViewAudit({
                logic_view_id,
                operate_type,
            })
            message.success(
                `${__('撤销')}${AuditOperateMsg[operate_type]}${__(
                    '审核成功',
                )}`,
            )
            getDetails()
        } catch (err) {
            if (err?.data?.code === 'DataView.LogicView.NotFound') {
                message.info(
                    `${__('无法')}${AuditOperateMsg[operate_type]}${__(
                        '，此条记录已不存在',
                    )}`,
                )
            } else if (err?.data?.code === 'Public.AuthorizationFailure') {
                message.info(
                    `${__('无法')}${AuditOperateMsg[operate_type]}${__(
                        '，您的角色权限失效',
                    )}`,
                )
            } else {
                formatError(err)
            }
        }
    }

    // 清除补全定时器
    const clearCompletionTimer = () => {
        if (getCompletionTimer()) {
            clearTimeout(getCompletionTimer())
            setCompletionTimer(undefined)
        }
    }

    // 设置补全定时器，5秒轮询获取补全结果
    const installCompletionTimer = () => {
        const t = setTimeout(getCompletionResult, 5000)
        setCompletionTimer(t)
    }

    // 获取字段补全结果 - 元数据库表
    const getCompletionResult = async () => {
        if (logic !== LogicViewType.DataSource) {
            return
        }
        try {
            const { result } = await getDataViewCompletion(id)
            // 补全有结果
            if (result) {
                const fields =
                    (optionType === 'edit'
                        ? fieldsTableData
                        : baseInfoData?.fields
                    )
                        ?.filter((item) => item.status !== stateType.delete)
                        ?.map((item) => {
                            return {
                                ...item,
                                selected: true,
                            }
                        }) || []
                // 过滤掉不存在的字段
                const resultFields = result?.fields?.filter((f1) =>
                    fields.find((f2) => f2.id === f1.field_id),
                )

                // 组装补全数据
                let resultData: any = null
                if (has(result, 'form_view_business_name')) {
                    if (result.form_view_business_name) {
                        const res = await getDataViewRepeat({
                            name: result.form_view_business_name,
                            form_id: baseInfoData?.id,
                            datasource_id: baseInfoData?.datasource_id,
                            name_type: 'business_name',
                            type: logic,
                        })
                        resultData = {
                            viewName: {
                                value: result.form_view_business_name,
                                isCompleted: true,
                                selected: true,
                                tips: res
                                    ? __('库表业务名称和其他库表重复，请修改')
                                    : '',
                            },
                        }
                    } else {
                        resultData = {
                            viewName: {
                                value: datasheetInfo?.business_name,
                                isCompleted: false,
                                selected: true,
                            },
                        }
                    }
                }
                if (has(result, 'form_view_description')) {
                    resultData = {
                        ...resultData,
                        viewDescription: {
                            value:
                                result.form_view_description ||
                                datasheetInfo?.description,
                            isCompleted: !!result.form_view_description,
                            selected: true,
                        },
                    }
                }
                if (resultFields?.length > 0) {
                    resultData = {
                        ...resultData,
                        fields: resultFields.map((item) => {
                            const findItem = fields.find(
                                (f) => f.id === item.field_id,
                            )
                            return {
                                ...findItem,
                                business_name:
                                    item.field_business_name ||
                                    findItem.business_name,
                                isCompleted: !!item.field_business_name,
                                selected: true,
                            }
                        }),
                    }
                }
                if (resultData) {
                    setCompleteData(resultData)
                    setCompleteStatus(AutoCompleteStatus.Completed)
                    if (getCompletionTimer()) {
                        messageSuccess(__('自动补全成功'))
                    }
                } else {
                    // 过滤后无数据了，清空补全记录
                    editCompleteData(null)
                    setCompleteStatus(AutoCompleteStatus.Failed)
                }
                return
            }
            // 无结果为补全中
            setCompleteStatus(AutoCompleteStatus.Completing)
            installCompletionTimer()
        } catch (err) {
            // 没有补全过
            if (
                err?.data?.code === 'DataView.FormView.CompletionNotFound' ||
                err?.status === 404
            ) {
                setCompleteStatus(AutoCompleteStatus.None)
                return
            }
            if (err?.data?.code === 'DataView.FormView.FormViewIdNotExist') {
                setIsNotExistDatasheet(true)
                message.info(__('无法操作，库表已不存在'))
            } else {
                formatError(err)
            }
            setCompleteStatus(AutoCompleteStatus.Failed)
        }
    }

    // 更新补全数据 null-相当于清空记录
    const editCompleteData = async (value: any = completeData) => {
        if (
            ![
                AutoCompleteStatus.Completed,
                AutoCompleteStatus.Failed,
                AutoCompleteStatus.UsedAll,
            ].includes(completeStatus)
        ) {
            return
        }
        try {
            let params: any = {}
            if (value) {
                if (has(value, 'viewName')) {
                    params = {
                        ...params,
                        form_view_business_name: value.viewName.value,
                    }
                }
                if (has(value, 'viewDescription')) {
                    params = {
                        ...params,
                        form_view_description: value.viewDescription.value,
                    }
                }
                if (has(value, 'fields')) {
                    params = {
                        ...params,
                        fields: value.fields.map((item) => ({
                            field_id: item.id,
                            field_business_name: item.business_name,
                        })),
                    }
                }
            } else {
                params = null
                setEditedComplete(false)
            }
            await putDataViewCompletion(id, { result: params })
        } catch (err) {
            if (err?.data?.code === 'DataView.FormView.CompletionNotFound') {
                return
            }
            if (err?.data?.code === 'DataView.FormView.FormViewIdNotExist') {
                message.info(__('无法操作，库表已不存在'))
            } else {
                formatError(err)
            }
        }
    }

    // 自动补全按钮点击处理
    const handleClickCompletion = (
        status = completeStatus,
        clear: boolean = false,
    ) => {
        if (!llm) {
            return
        }
        const dataNull = clear ? true : isNull(completeSelectData)
        const data: any = {
            viewName: {
                value: datasheetInfo?.business_name,
                selected: dataNull
                    ? true
                    : completeSelectData.viewName?.selected,
                tips: datasheetInfo?.business_name_tips,
            },
            viewDescription: {
                value: datasheetInfo?.description,
                selected: dataNull
                    ? true
                    : completeSelectData.viewDescription?.selected,
            },
            fields:
                (optionType === 'edit' ? fieldsTableData : baseInfoData?.fields)
                    ?.filter((item) => item.status !== stateType.delete)
                    ?.map((item) => {
                        if (dataNull) {
                            return {
                                ...item,
                                selected: true,
                            }
                        }
                        const findItem = completeSelectData.fields.find(
                            (f) => f.id === item.id,
                        )
                        return {
                            ...item,
                            selected: findItem?.selected ?? true,
                        }
                    }) || [],
        }
        switch (status) {
            case AutoCompleteStatus.None:
                setCompleteStatus(AutoCompleteStatus.None)
                setCompleteSelectData(data)
                setOpenCompletionView(true)
                break
            case AutoCompleteStatus.Completing:
                // 补全中不允许点击
                break
            case AutoCompleteStatus.Completed:
            case AutoCompleteStatus.Failed:
            case AutoCompleteStatus.UsedAll:
                setOpenCompletionView(true)
                setCompleteSelectData(data)
                break
            default:
                break
        }
    }

    /**
     * 根据不同的key渲染对应的库表组件。
     * @param key 库表的类型键，决定渲染哪个库表组件。
     * @returns 返回对应库表的组件。
     */
    const getViewComponents = (key: string) => {
        switch (key) {
            // 渲染详情字段库表
            case detailTabKey.view:
                return (
                    <div className={styles.detailFieldsTitle}>
                        <div
                            className={classnames(
                                styles.detailFields,
                                viewModalRadio === 'list' && styles.list,
                            )}
                            ref={optionTypeRef}
                        >
                            {isAuditing &&
                                using === 2 &&
                                !isValueEvaluation &&
                                viewModalRadio === 'table' && (
                                    <div>
                                        <InfoCircleFilled
                                            className={styles.auditIcon}
                                        />
                                        <span>
                                            {__('变更库表需要等待完成审核或')}
                                        </span>
                                        <Popconfirm
                                            title={`${__('确定要')}${__(
                                                '撤销',
                                            )}${
                                                AuditOperateMsg[
                                                    auditOperateType
                                                ]
                                            }${__('审核')}${__('吗?')}`}
                                            placement="bottomLeft"
                                            okText={__('确定')}
                                            cancelText={__('取消')}
                                            onConfirm={() => {
                                                revokeAudit(
                                                    id,
                                                    auditOperateType,
                                                )
                                            }}
                                            icon={
                                                <InfoCircleFilled
                                                    style={{
                                                        color: '#3A8FF0',
                                                        fontSize: '16px',
                                                    }}
                                                />
                                            }
                                            overlayInnerStyle={{
                                                whiteSpace: 'nowrap',
                                            }}
                                            overlayClassName={
                                                styles.datasheetTablePopconfirmTips
                                            }
                                        >
                                            <span className={styles.auditText}>
                                                {`${__('撤销')}${
                                                    AuditOperateMsg[
                                                        auditOperateType
                                                    ]
                                                }${__('审核')}`}
                                            </span>
                                        </Popconfirm>
                                    </div>
                                )}
                            {optionType === 'view' &&
                                showEditBtn &&
                                isSemanticGovernance && (
                                    <Tooltip
                                        title={
                                            baseInfoData?.status ===
                                            stateType.delete
                                                ? __('源表已删除，无法编辑')
                                                : ''
                                        }
                                    >
                                        <div
                                            className={classnames(
                                                styles.detailsEditBtn,
                                                baseInfoData?.status ===
                                                    stateType.delete &&
                                                    styles.disbale,
                                            )}
                                            onClick={() => {
                                                if (
                                                    baseInfoData?.status ===
                                                    stateType.delete
                                                ) {
                                                    return
                                                }
                                                onEdit()
                                            }}
                                            // disabled={
                                            //     detailsData?.status ===
                                            //     stateType.delete
                                            // }
                                        >
                                            <div
                                                className={
                                                    styles.detailsEditBtnIcon
                                                }
                                            >
                                                <EditOutlined />
                                            </div>
                                            <div>
                                                {currentData?.publish_at
                                                    ? __('变更库表')
                                                    : __('编辑库表')}
                                            </div>
                                        </div>
                                    </Tooltip>
                                )}
                            {optionType === 'view' && (
                                <div className={styles.detailFieldsRadio}>
                                    <Radio.Group
                                        onChange={({ target: { value } }) => {
                                            setViewModalRadio(value)
                                            setOpenDataViewDetail(
                                                value === 'table',
                                            )
                                        }}
                                        value={viewModalRadio}
                                        optionType="button"
                                        buttonStyle="solid"
                                    >
                                        <Tooltip
                                            placement="bottom"
                                            title={__('切换为图表')}
                                        >
                                            <Radio.Button value="table">
                                                <FormTableModelOutlined />
                                            </Radio.Button>
                                        </Tooltip>
                                        <Tooltip
                                            placement="bottom"
                                            title={__('切换为列表')}
                                        >
                                            <Radio.Button value="list">
                                                <FormListModelOutlined />
                                            </Radio.Button>
                                        </Tooltip>
                                    </Radio.Group>
                                </div>
                            )}
                        </div>
                        <div
                            className={styles.dataViewDetailsBtn}
                            onClick={() => setOpenDataViewDetail(true)}
                        >
                            <div className={styles.text}>
                                {__('展开库表信息')}
                            </div>
                            <span className={styles.icon}>{'<<'}</span>
                        </div>
                        {viewModalRadio === 'table' ? (
                            <div className={styles.tableBox}>
                                <FieldsTable
                                    fieldList={fieldsTableData}
                                    setFieldList={(data) => {
                                        setFieldsTableData(
                                            dataSourceType === 'excel'
                                                ? updateExcelFieldsStatus(data)
                                                : data?.map((item) => ({
                                                      ...item,
                                                      tips:
                                                          validateRepeatName(
                                                              data?.filter(
                                                                  (it) =>
                                                                      it.status !==
                                                                      stateType.delete,
                                                              ),
                                                              item,
                                                          ) &&
                                                          item.status !==
                                                              stateType.delete
                                                              ? __(
                                                                    '此名称和其他字段的业务名称重复，请修改',
                                                                )
                                                              : '',
                                                  })),
                                        )
                                    }}
                                    datasheetInfo={datasheetInfo}
                                    setDatasheetInfo={setDatasheetInfo}
                                    dataViewList={dataList}
                                    ref={fieldsTableRef}
                                    setDataViewDetailOpen={
                                        setOpenDataViewDetail
                                    }
                                    isDataView
                                    isStart={isStart}
                                    tagData={tagData}
                                    dataSheetId={id}
                                    onClickCompletion={() =>
                                        handleClickCompletion()
                                    }
                                    taskIsCompleted={taskIsCompleted}
                                />
                                {isStart && <IconInstructions />}
                            </div>
                        ) : (
                            <FieldList
                                fieldList={fieldsTableData}
                                currentData={baseInfoData}
                                hideEditBtn={!showEditBtn}
                                operationWid={showEditBtn ? 219 : 99}
                                isStart={isStart}
                                tagData={tagData}
                                style={{ marginTop: 68 }}
                                tableScroll={{
                                    y: 'calc(100vh - 278px)',
                                    x: 1300,
                                }}
                                showCompletion
                                onClickCompletion={() =>
                                    handleClickCompletion()
                                }
                                taskIsCompleted={taskIsCompleted}
                            />
                        )}
                    </div>
                )
            // 渲染样本数据库表
            case detailTabKey.sampleData:
                return (
                    <div className={styles.sampleDataWrapper}>
                        <FormViewExampleData
                            id={id}
                            formViewStatus={formViewStatus}
                        />
                    </div>
                )
            // 渲染数据预览库表
            case detailTabKey.dataPreview:
                return (
                    // <DataPreview
                    //     dataViewId={id}
                    //     isMarket={taskIsCompleted}
                    //     formViewStatus={formViewStatus}
                    // />
                    <div className={styles.tabContentWrapper}>
                        <ReportDetailContent
                            item={{
                                ...(baseInfoData || {}),
                                form_view_id: id,
                            }}
                            isMarket={taskIsCompleted}
                            showCorrection={false} // 不显示整改按钮
                        />
                    </div>
                )
            // 渲染数据亲和性库表
            case detailTabKey.dataConsanguinity:
                return (
                    <div className={styles.graphWrapper}>
                        <ConsanguinityGraph id={id} />
                    </div>
                )
            case detailTabKey.impactAnalysis:
                return (
                    <div className={styles.graphWrapper}>
                        <ImpactAnalysis id={id} />
                    </div>
                )
            // 渲染数据质量库表
            case detailTabKey.dataQuality:
                return (
                    <DataQuality dataViewId={id} isMarket={taskIsCompleted} />
                )
            // 渲染高级设置库表
            case detailTabKey.advancedSettings:
                return (
                    <AdvancedSettings
                        fieldsList={fieldsTableData}
                        dataViewId={id}
                        taskIsCompleted={isCompleted === 'true' && !!taskId}
                    />
                )
            // 默认情况下返回null
            default:
                return null
        }
    }

    return (
        <div className={styles.detailsWrapper}>
            <div
                className={classnames(
                    styles.detailsTitle,
                    optionType === 'edit' && styles.isEdit,
                )}
            >
                <div onClick={handleReturn} className={styles.titleLeft}>
                    <GlobalMenu />
                    <span className={styles.back} onClick={() => onBackClick()}>
                        <LeftOutlined className={styles.returnArrow} />
                        <span className={styles.returnText}>{__('返回')}</span>
                    </span>
                    {!isNotExistDatasheet &&
                        !loading &&
                        currentData?.business_name && (
                            <>
                                <div className={styles.divider} />
                                {/* <DatasheetViewColored
                                    style={{ fontSize: 24 }}
                                /> */}
                                <FontIcon
                                    name="icon-shujubiaoshitu"
                                    type={IconType.COLOREDICON}
                                    style={{ fontSize: 24 }}
                                />
                                <span
                                    title={currentData?.business_name}
                                    className={styles.filterText}
                                >
                                    {currentData?.business_name}
                                </span>
                                <span>
                                    {currentData.edit_status === 'draft' &&
                                        (baseInfoData?.status ===
                                        stateType.delete
                                            ? !currentData?.publish_at
                                            : true) &&
                                        (optionType === 'edit' &&
                                        logic === LogicViewType.DataSource ? (
                                            <span
                                                className={styles.draft}
                                                title={__(
                                                    '当前草稿 ${time} 由【${user}】扫描产生',
                                                    {
                                                        time: moment(
                                                            currentData?.updated_at,
                                                        ).format(
                                                            'YYYY-MM-DD HH:mm:ss',
                                                        ),
                                                        user: baseInfoData?.updated_by,
                                                    },
                                                )}
                                            >
                                                {__(
                                                    '当前草稿 ${time} 由【${user}】扫描产生',
                                                    {
                                                        time: moment(
                                                            currentData?.updated_at,
                                                        ).format(
                                                            'YYYY-MM-DD HH:mm:ss',
                                                        ),
                                                        user: baseInfoData?.updated_by,
                                                    },
                                                )}
                                            </span>
                                        ) : (
                                            <span
                                                style={{
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                }}
                                            >
                                                <Tooltip
                                                    placement="bottom"
                                                    color="#fff"
                                                    overlayInnerStyle={{
                                                        color: 'rgba(0,0,0,0.85)',
                                                    }}
                                                    title={
                                                        currentData?.publish_at
                                                            ? __(
                                                                  '通过变更库表来查看和发布内容',
                                                              )
                                                            : __(
                                                                  '通过编辑库表来发布内容',
                                                              )
                                                    }
                                                >
                                                    <span
                                                        className={styles.draft}
                                                    >
                                                        {__('有草稿')}
                                                    </span>
                                                </Tooltip>
                                                {!currentData?.publish_at && (
                                                    <span
                                                        className={
                                                            styles.descText
                                                        }
                                                    >
                                                        {__(
                                                            '【未完成发布，当前展示最新草稿内容】',
                                                        )}
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                </span>
                            </>
                        )}
                </div>
                {!isNotExistDatasheet && optionType === 'edit' && !loading && (
                    <div className={styles.titleRight}>
                        {/* {optionType === 'view' ? (
                            showEditBtn && (
                                <Button type="primary" onClick={() => onEdit()}>
                                    {__('编辑')}
                                </Button>
                            )
                        ) : ( */}
                        <Space size={8}>
                            {delfieldList.length > 0 &&
                                optionType === 'edit' && (
                                    <div className={styles.delFieldTips}>
                                        <InfoCircleFilled
                                            className={styles.titleIcon}
                                        />
                                        <span>
                                            {__('提示：有')}
                                            {delfieldList.length}
                                            {__(
                                                '个标记删除的字段，更新库表后会删除记录。',
                                            )}
                                        </span>
                                        <span
                                            onClick={() =>
                                                setOpenDelFields(true)
                                            }
                                            className={styles.deltext}
                                        >
                                            {__('查看删除字段')}
                                        </span>
                                    </div>
                                )}
                            <Button
                                onClick={() => {
                                    if (saveFailed) {
                                        setOptionType('view')
                                        getDetails()
                                        return
                                    }
                                    setDatasheetInfo(
                                        omit(baseInfoData, 'fields'),
                                    )
                                    if (model === 'edit') {
                                        onBackClick()
                                    } else {
                                        setOptionType('view')
                                        const publish =
                                            !!baseInfoData?.last_publish_time
                                        setFieldsTableData(
                                            baseInfoData?.fields.filter(
                                                (item) =>
                                                    publish
                                                        ? item.status !==
                                                          stateType.new
                                                        : item.status !==
                                                          stateType.delete,
                                            ),
                                        )
                                    }
                                }}
                                hidden={
                                    dataSourceType === 'excel' &&
                                    !datasheetInfo?.id
                                }
                            >
                                {__('取消')}
                            </Button>
                            {/* <Button onClick={() => onSave('temp')}>
                                {__('保存草稿')}
                            </Button> */}
                            <Button
                                type="primary"
                                onClick={(e) => {
                                    e.preventDefault()
                                    e.stopPropagation()
                                    if (
                                        dataSourceType === 'excel' &&
                                        !datasheetInfo?.id
                                    ) {
                                        handleCreateExcelView()
                                    } else {
                                        onSave('final')
                                    }
                                }}
                            >
                                {__(
                                    baseInfoData?.last_publish_time
                                        ? '更新库表'
                                        : '发布',
                                )}
                            </Button>
                        </Space>
                        {baseInfoData?.status === stateType.delete && (
                            <div>
                                <InfoCircleFilled
                                    className={classnames(
                                        styles.titleIcon,
                                        styles.del,
                                    )}
                                />
                                <span>{__('提示：源表已删除，无法编辑')}</span>
                            </div>
                        )}
                        {/* )} */}
                    </div>
                )}
                {optionType === 'view' && !loading && (
                    <div className={styles.detailTabs}>
                        <Tabs
                            activeKey={tabActiveKey}
                            onChange={(key: any) => {
                                if (
                                    tabActiveKey === detailTabKey.moreInfo &&
                                    moreInfoIschanged
                                ) {
                                    ReturnConfirmModal({
                                        onCancel: () => {
                                            setTabActiveKey(key)
                                        },
                                    })
                                } else {
                                    setTabActiveKey(key)
                                }
                                if (
                                    openDataViewDetail &&
                                    key !== detailTabKey.view
                                ) {
                                    setOpenDataViewDetail(false)
                                }
                            }}
                            items={
                                isValueEvaluation
                                    ? [
                                          {
                                              label: __('库表'),
                                              key: detailTabKey.view,
                                          },
                                          {
                                              label: __('评估报告'),
                                              key: detailTabKey.dataPreview,
                                          },
                                      ]
                                    : // 仅标准数据源有血缘
                                    logic && logic !== LogicViewType.DataSource
                                    ? detailTabItems.filter(
                                          (item) =>
                                              item.key !==
                                              detailTabKey.advancedSettings,
                                      )
                                    : detailTabItems.filter(
                                          (item) =>
                                              item.key !==
                                                  detailTabKey.advancedSettings ||
                                              platformNumber ===
                                                  LoginPlatform.default,
                                      )
                            }
                        />
                    </div>
                )}
            </div>

            {loading ? (
                <Loader />
            ) : !datasheetInfo?.sheet && dataSourceType === 'excel' ? (
                notExistExcel()
            ) : isNotExistDatasheet ? (
                notExistDatasheet()
            ) : (
                getViewComponents(tabActiveKey)
            )}

            {openDelFields && (
                <DelFieldsModal
                    fieldData={delfieldList}
                    onClose={() => setOpenDelFields(false)}
                    open={openDelFields}
                    sum={delfieldList.length}
                />
            )}
            {/* {openEditBasicInfo && (
                <EditBasicInfoModal
                    formData={datasheetInfo}
                    onClose={() => setOpenEditBasicInfo(false)}
                    onOk={(ownerId) => {
                        onSave('final', ownerId)
                        setOpenEditBasicInfo(false)
                    }}
                    open={openEditBasicInfo}
                />
            )}
            {/* 库表信息 */}
            <DataViewDetail
                onClose={() => setOpenDataViewDetail(false)}
                logic={logic}
                open={openDataViewDetail && !isNotExistDatasheet}
                optionType={optionType}
                isDataView
                isExcel={dataSourceType === 'excel'}
            />
            {/* 补全 */}
            <CompletionViewDrawer
                open={openCompletionView}
                onClose={(err = false) => {
                    setOpenCompletionView(false)
                    setIsNotExistDatasheet(err)
                }}
                onOk={() => {
                    setOpenCompletionView(false)
                    installCompletionTimer()
                }}
                onRebuild={() =>
                    handleClickCompletion(AutoCompleteStatus.None, true)
                }
                onEdit={() => {
                    if (baseInfoData?.status === stateType.delete) {
                        return
                    }
                    onEdit()
                }}
                onReqEditCompleteData={(value) => editCompleteData(value)}
            />
        </div>
    )
}

export default DatasheetDetail
