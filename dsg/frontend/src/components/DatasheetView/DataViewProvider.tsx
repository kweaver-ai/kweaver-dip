import {
    Dispatch,
    ReactNode,
    SetStateAction,
    createContext,
    useContext,
    useMemo,
    useRef,
    useState,
} from 'react'
import { keys, omit, pick, isArray, isEmpty, head } from 'lodash'
import { useGetState } from 'ahooks'
import {
    LogicViewType,
    editDataViewBaseInfo,
    formatError,
    getDataViewRepeat,
} from '@/core'
import { ExplorationType, ExplorationRule } from './DatasourceExploration/const'

import { AutoCompleteStatus } from './const'
import __ from './locale'

interface IExplorationData {
    // 库表字段
    fieldList?: any
    // 当前选中字段
    activeField?: any
    // 数据源id
    datasourceId?: string
    // 库表id
    dataViewId?: string
    // 采样规则：全量数据：0，随机抽样：自定义数量
    total_sample?: number
    // 探查类型：数据源、库表
    explorationType?: ExplorationType
    // 探查规则
    explorationRule?: ExplorationRule
    // 当前规则信息 - 编辑信息
    currentRuleInfo?: any
    // 内置规则模板
    internalRuleList?: any
    // 数据源探查规则分类
    internalDatasouceRuleGroup?: any
    // 是否禁用批量启用开关
    disabledEnableSwitch?: boolean
    // 数据源探查库表规则
    datasourceDataViewRuleList?: any
    // 已探查数据源规则配置
    datasourceRuleConfig?: any
    // 更新字段列表
    updateFieldList?: boolean
    // 更新规则列表
    updateRuleList?: boolean
    // 是否cssjj
    cssjj?: boolean
    // 启用的模板规则
    enableTemplateRuleList?: any[]
    // 批量创建规则状态 {metadata:boolean,field:boolean}
    batchCreateRuleStatus?: any
    // 字段类型-数据统计选项
    dataStatisticsOptions?: any
    // 探查规则是否查看模式
    viewMode?: boolean
    // 探查-字段级-字段高度限制
    field_max_height?: number
    // 探查-属性高度限制
    attribute_max_height?: number
}

type IDataViewContext = {
    showMytask: boolean
    setShowMytask: Dispatch<SetStateAction<any>>
    isSubmitBasicInfoForm: boolean
    setIsSubmitBasicInfoForm: Dispatch<SetStateAction<any>>
    taskIsCompleted: boolean
    setTaskIsCompleted: Dispatch<SetStateAction<any>>
    baseInfoData: any
    setBaseInfoData: (item: any) => void
    auditProcessStatus: any
    setAuditProcessStatus: (item: any) => void
    optionType: 'view' | 'edit' | 'create'
    setOptionType: (item: any) => void
    reportStatusIsRunning: boolean
    setReportStatusIsRunning: Dispatch<SetStateAction<any>>
    logicViewType: LogicViewType
    setLogicViewType: (item: any) => void
    explorationData: IExplorationData
    setExplorationData: Dispatch<SetStateAction<IExplorationData>>
    [key: string]: any
}

const DataViewContext = createContext<IDataViewContext>({
    showMytask: false,
    setShowMytask: () => {},
    isSubmitBasicInfoForm: false,
    setIsSubmitBasicInfoForm: () => {},
    taskIsCompleted: false,
    setTaskIsCompleted: () => {},
    baseInfoData: {},
    setBaseInfoData: () => {},
    auditProcessStatus: {},
    setAuditProcessStatus: () => {},
    optionType: 'view',
    setOptionType: () => {},
    reportStatusIsRunning: false,
    setReportStatusIsRunning: () => {},
    logicViewType: LogicViewType.DataSource,
    setLogicViewType: () => {},
    explorationData: {},
    setExplorationData: () => {},
    isValueEvaluation: false,
    setIsValueEvaluation: () => {},
    isTemplateConfig: false,
    setIsTemplateConfig: () => {},
})

export const useDataViewContext = () =>
    useContext<IDataViewContext>(DataViewContext)

export const DataViewProvider = ({ children }: { children: ReactNode }) => {
    // 库表 - 发起探查 - 我的任务弹窗
    const [showMytask, setShowMytask] = useState<any>()
    // 我的任务 - 库表任务 - 任务完成状态
    const [taskIsCompleted, setTaskIsCompleted] = useState<any>()
    // 库表详情 - 所有信息，只在请求获取数据时更新
    const [baseInfoData, setBaseInfoData] = useState<any>()
    // 库表 - 审核策略状态：发布、上线、下线是否配置审核策略
    const [auditProcessStatus, setAuditProcessStatus] = useState<any>()
    // 库表详情 - 操作类型
    const [optionType, setOptionType] = useState<'view' | 'edit'>('view')
    // 库表 - 自定义库表、逻辑实体库表创建（编辑不可用）提交标识
    const [isSubmitBasicInfoForm, setIsSubmitBasicInfoForm] =
        useState<boolean>(false)
    // 探查报告状态
    const [reportStatusIsRunning, setReportStatusIsRunning] = useState<any>()
    // 库表类型
    const [logicViewType, setLogicViewType] = useState<any>()
    // 库表 - 探查参数
    const [explorationData, setExplorationData] = useState<IExplorationData>({})
    // 库表字段展示信息
    const [fieldsTableData, setFieldsTableData] = useState<any[]>([])
    // 库表基础展示信息
    const [datasheetInfo, setDatasheetInfo] = useState<any>()
    // 字段补全状态
    const [completeStatus, setCompleteStatus] = useState<AutoCompleteStatus>(
        AutoCompleteStatus.None,
    )
    // 字段补全选择数据 {viewName, viewDescription, fields}
    const [completeSelectData, setCompleteSelectData] = useState<any>(null)
    // 补全结果数据
    const [completeData, setCompleteData] = useState<any>(null)
    // 是否编辑过补全信息
    const [editedComplete, setEditedComplete] = useState<boolean>(false)
    // 补全定时器
    const [completionTimer, setCompletionTimer, getCompletionTimer] =
        useGetState<any>()

    // 数据源类型
    const [dataOriginType, setDataOriginType] = useState<string>('')

    const [hasExcelDataView, setHasExcelDataView] = useState<boolean>(false)
    // 是否价值评估菜单
    const [isValueEvaluation, setIsValueEvaluation] = useState<boolean>(false)
    // 是否规则模板配置
    const [isTemplateConfig, setIsTemplateConfig] = useState<boolean>(false)

    const excelForm = useRef<any>(null)

    // 校验重名
    const onValidateNameRepeat = async (
        name: string,
        flag: 'business_name' | 'technical_name',
    ): Promise<any> => {
        try {
            if (name) {
                const res = await getDataViewRepeat({
                    name,
                    form_id: datasheetInfo?.id,
                    datasource_id:
                        datasheetInfo?.datasource_id ||
                        datasheetInfo.data_source_id,
                    name_type: flag,
                    type: logicViewType,
                })
                setDatasheetInfo((prev) => ({
                    ...prev,
                    business_name_tips:
                        flag === 'business_name' && res
                            ? __('业务名称和其他库表重复，请修改')
                            : prev.business_name_tips,
                    technical_name_tips:
                        flag === 'technical_name' && res
                            ? __('技术名称和其他库表重复，请修改')
                            : prev.technical_name_tips,
                }))
                return Promise.resolve(res)
            }
            return Promise.resolve(null)
        } catch (error) {
            formatError(error)
            return Promise.reject(error)
        }
    }

    // 保存库表信息
    const onSubmitBasicInfo = async () => {
        try {
            const updateTypeKeys = ['update_cycle', 'shared_type', 'open_type']
            let data: any = {
                ...pick(datasheetInfo, [
                    'business_name',
                    'technical_name',
                    'description',
                    'subject_id',
                    'department_id',
                    'owners',
                    'source_sign',
                    ...updateTypeKeys,
                ]),
                form_view_id: datasheetInfo?.id,
            }
            // 处理 owners 字段，兼容两种格式
            if (isArray(data.owners) && !isEmpty(data.owners)) {
                const firstOwner = head(data.owners)
                // 如果是字符串数组，转换为对象数组
                if (typeof firstOwner === 'string') {
                    data.owners = data.owners.map((id) => ({ owner_id: id }))
                }
                // 如果已经是对象数组且包含 owner_id，则不做处理
            }
            keys(data).forEach((k) => {
                data[k] =
                    updateTypeKeys.includes(k) && !data[k]
                        ? undefined
                        : data[k] || ''
            })
            if (logicViewType === LogicViewType.LogicEntity) {
                data = omit(data, 'subject_id')
            } else if (logicViewType === LogicViewType.DataSource) {
                data = omit(data, 'technical_name')
            }
            if (!data?.source_sign) {
                data.source_sign = 0
            }
            await editDataViewBaseInfo(data)
            return Promise.resolve()
        } catch (err) {
            return Promise.reject(err)
        }
    }

    const values = useMemo(
        () => ({
            showMytask,
            setShowMytask,
            baseInfoData,
            setBaseInfoData,
            optionType,
            setOptionType,
            taskIsCompleted,
            setTaskIsCompleted,
            auditProcessStatus,
            setAuditProcessStatus,
            isSubmitBasicInfoForm,
            setIsSubmitBasicInfoForm,
            reportStatusIsRunning,
            setReportStatusIsRunning,
            logicViewType,
            setLogicViewType,
            explorationData,
            setExplorationData,
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
            fieldsTableData,
            setFieldsTableData,
            datasheetInfo,
            setDatasheetInfo,
            onValidateNameRepeat,
            onSubmitBasicInfo,
            dataOriginType,
            setDataOriginType,
            hasExcelDataView,
            setHasExcelDataView,
            excelForm,
            isTemplateConfig,
            setIsTemplateConfig,
            isValueEvaluation,
            setIsValueEvaluation,
        }),
        [
            showMytask,
            setShowMytask,
            baseInfoData,
            setBaseInfoData,
            optionType,
            setOptionType,
            taskIsCompleted,
            setTaskIsCompleted,
            auditProcessStatus,
            setAuditProcessStatus,
            isSubmitBasicInfoForm,
            setIsSubmitBasicInfoForm,
            reportStatusIsRunning,
            setReportStatusIsRunning,
            logicViewType,
            setLogicViewType,
            explorationData,
            setExplorationData,
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
            fieldsTableData,
            setFieldsTableData,
            datasheetInfo,
            setDatasheetInfo,
            onValidateNameRepeat,
            onSubmitBasicInfo,
            dataOriginType,
            setDataOriginType,
            hasExcelDataView,
            setHasExcelDataView,
            excelForm,
            isTemplateConfig,
            setIsTemplateConfig,
            isValueEvaluation,
            setIsValueEvaluation,
        ],
    )
    return (
        <DataViewContext.Provider value={values}>
            {children}
        </DataViewContext.Provider>
    )
}
