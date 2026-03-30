import { Alert, AlertProps, Tooltip } from 'antd'
import moment from 'moment'
import { forEach, isEqual, noop, pick } from 'lodash'
import {
    InfoCircleFilled,
    CheckCircleFilled,
    DownOutlined,
    RightOutlined,
} from '@ant-design/icons'
import { ReactNode } from 'react'
import {
    RescCatlgType,
    TabKey,
    STATE,
    DataServiceType,
    auditStateList,
    flowTypeList,
    stateList,
    htmlDecodeByRegExp,
    initSearchCondition,
    resourceTypeList,
    publishStatusList,
    onLineStatusList,
    shareTypeList,
    openTypeList,
    sensitivityLevelList,
    YesOrNoList,
    BoolYesOrNoList,
    UseSceneList,
    shareModeList,
    dataSyncMechanismList,
    updateCycleOptions,
    CatalogTagList,
    DataProcessingList,
    DataLevelList,
    DataDomainList,
    DepartmentCodeList,
    DivisionCodeList,
    RequestContentTypeList,
    ResTypeEnum,
    mountTypeOptions,
    ShareTypeEnum,
    OpenTypeEnum,
    classifyLabelSensitiveKeyMap,
    classifyLabelClassifiedKeyMap,
    classifyLabelShareKeyMap,
    publishAudingAndRejectList,
    ScheduleTypeList,
    ScheduleTypeTips,
    ScheduleType,
    comprehensionStatus,
    comprehensionStatusList,
    IKL,
    comprehensionReportStatus,
    DataProvideChannelList,
} from './const'
import DirBasicInfo from './DirBasicInfo'
import DirColumnInfo from './DirColumnInfo'
import __ from './locale'
import { dataTypeMapping, WorkOrderStatus } from '@/core'
import styles from './styles.module.less'
import { Expand } from '@/ui'
import {
    BusinessSystemOutlined,
    AppApiColored,
    BinaryTypeOutlined,
    BooleanTypeOutlined,
    DatasheetViewColored,
    FontIcon,
    LimitDatellined,
    NumberTypeOutlined,
    StringTypeOutlined,
    UnkownTypeOutlined,
} from '@/icons'
import { SearchType } from '@/components/SearchLayout/const'
import DataConsanguinity from '../DataConsanguinity'
import DataPreview from '../DatasheetView/DataPreview'
import DataCatlgAbstract from '../DataAssetsCatlg/DataCatlgAbstract'
import CatlgScore from './CatlgScore'
import FileInfoDetail from './FileInfoDetail'
import { IconType } from '@/icons/const'
import ReliabilityEvaluationDetail from './ReliabilityEvaluationDetail'
import { BusinessDomainType } from '../BusinessDomain/const'
import TaskMonitor from './TaskMonitor'
import ComprehensionReport from './ComprehensionReport'
import ImpactAnalysis from '@/components/ImpactAnalysis'

/**
 * 关联信息项
 * @param id: id
 * @param name_cn: 名称
 * @returns
 */
export interface IAssociatedInfo {
    id: string
    name_cn: string
}
/**
 * 关联信息
 * @param id: id
 * @param name_cn: 名称
 * @returns
 */
export interface IInfos {
    info_type: number
    entries: IInfosEntries[]
}
/**
 * 关联信息
 * @param info_key: 关联信息key
 * @param info_value: 关联信息名称
 * @returns
 */
export interface IInfosEntries {
    info_key: string
    info_value: string
}
/**
 * 库表信息
 * @param name: 表名
 * @param id: 表id
 * @param schema_id: 库Id
 * @param schema_name: 库名
 * @returns
 */
export interface IMatadataTables {
    name: string
    id: string
    schema_name: string
    data_source_id?: string
    schema_id?: string
}
export enum dataKindFlag {
    YES = 1,
    NO = 0,
}
// 数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县
export enum dataRange {
    CITY = 1,
    DIRECTLY_CITY = 2,
    COUNTY = 3,
}
export const dataRangeOptions = [
    { label: '全市', value: dataRange.CITY },
    { label: '市直', value: dataRange.DIRECTLY_CITY },
    { label: '区县（市）', value: dataRange.COUNTY },
]
// 数据范围 -- 省直达:1-全国 2-全省 3-各市(州) 4-全市(州)5-各区(县) 6-全区(县) 7-其他;上
export enum dataRangeGovernment {
    NATIONAL = 1, // 1-全国
    PROVINCE = 2, // 2-全省
    PREFECTURE_CITIES = 3, // 3-各市（州）
    PREFECTURE = 4, // 4-全市（州）
    DISTRICT_COUNTY = 5, // 5-各区（县）
    DISTRICT = 6, // 6-全区（县）
    OTHER = 7, // 7-其他
}
export const dataRangeOptionsGovernment = [
    { label: '全国', value: dataRangeGovernment.NATIONAL },
    { label: '全省', value: dataRangeGovernment.PROVINCE },
    { label: '各市（州）', value: dataRangeGovernment.PREFECTURE_CITIES },
    { label: '全市（州）', value: dataRangeGovernment.PREFECTURE },
    { label: '各区（县）', value: dataRangeGovernment.DISTRICT_COUNTY },
    { label: '全区（县）', value: dataRangeGovernment.DISTRICT },
    { label: '其他', value: dataRangeGovernment.OTHER },
]
export const getDataRangeOptions = (governmentStatus?: boolean) => {
    return governmentStatus ? dataRangeOptionsGovernment : dataRangeOptions
}
export const themeOptions = [
    { label: '医疗健康', value: '1' },
    { label: '社会保障', value: '2' },
    { label: '金融信息', value: '3' },
    { label: '信用信息', value: '4' },
    { label: '生态环境', value: '5' },
    { label: '应急维稳', value: '6' },
]

export enum mountResourcesType {
    FORM = 1,
    API = 2,
    FILE = 3,
}
export enum openType {
    FORM = 1,
    API = 2,
    FILE = 3,
}
/**
 * 挂载资源
 * @param res_id: 挂载资源id
 * @param res_name: 挂载资源名称
 * @returns
 */
export interface IMountResourcesEntries {
    res_id: string
    res_name: string
}
/**
 * 挂载资源
 * @param res_type: 挂载资源类型
 * @param entries: 挂载资源数据
 * @returns
 */
export interface IMountResources {
    res_type: mountResourcesType
    entries: IMountResourcesEntries[]
}
/**
 * 资源目录信息
 * @param code_profix: 目录编码前缀
 * @param columns: 关联信息项
 * @param data_kind: 基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他 可组合，如 人和地 即 1|2 = 3
 * @param data_kind_flag: 基础信息分类是否智能推荐 (1 是 ; 0 否)
 * @param data_range: 数据范围：字典DM_DATA_SJFW，01全市 02市直 03区县
 * @param description: 资源目录描述
 * @param group_id: 数据资源目录分类ID
 * @param group_name: 数据资源目录分类名称
 * @param infos: 关联信息
 * @param label_flag: 标签是否智能推荐
 * @param mount_resources: 挂接资源
 * @returns
 */
export interface IResourcesInfo {
    code_profix: string
    columns: IAssociatedInfo[]
    data_kind?: number
    data_kind_flag: dataKindFlag
    data_range?: dataRange
    description?: string
    group_id: string
    group_name: string
    infos?: IInfos[]
    label_flag: dataKindFlag
    mount_resources: IMountResources
    open_condition: string
    open_type: openType
}

// data_kind: 基础信息分类 1 人 2 地 4 事 8 物 16 组织 32 其他 可组合，如 人和地 即 1|2 = 3
export enum dataKind {
    person = 1,
    land = 2,
    matter = 4,
    thing = 8,
    org = 16,
    other = 32,
}
export const dataKindOptions = [
    {
        label: '人',
        value: dataKind.person,
        disabled: false,
    },
    // {
    //     label: '地',
    //     value: dataKind.land,
    //     disabled: false,
    // },
    {
        label: '事',
        value: dataKind.matter,
        disabled: false,
    },
    {
        label: '物',
        value: dataKind.thing,
        disabled: false,
    },
    // {
    //     label: '组织',
    //     value: dataKind.org,
    //     disabled: false,
    // },
    // {
    //     label: '其他',
    //     value: dataKind.other,
    //     disabled: false,
    // },
]
// 挂接资源类型 1 库表 2 接口 3 文件
export enum mountResources {
    TABLE = 1,
    API = 2,
    FILE = 3,
}
export const mountResourcesOptions = [
    { label: '库表', value: mountResources.TABLE },
    { label: '接口', value: mountResources.API },
    // { label: '文件', value: mountResources.FILE },
]

// 目录分类tab
export const rescCatlgItems = [
    {
        value: RescCatlgType.DOAMIN,
        label: __('主题域'),
    },
    {
        value: RescCatlgType.ORGSTRUC,
        label: __('组织架构'),
    },
    {
        value: RescCatlgType.RESC_CLASSIFY,
        label: __('资源分类'),
    },
]

// 目录内容tab
export const dirContItems = [
    {
        label: __('基本信息'),
        key: TabKey.BASIC,
    },
    {
        label: __('信息项'),
        key: TabKey.COLUMN,
    },
    // {
    //     label: __('相关目录'),
    //     key: TabKey.RELATEDCATALOG,
    // },
    // {
    //     label: __('样例数据'),
    //     key: TabKey.SAMPLTDATA,
    //     // children: (
    //     // ),
    // },
    {
        label: __('数据血缘'),
        key: TabKey.CONSANGUINITYANALYSIS,
    },
    {
        label: __('数据预览'),
        key: TabKey.DATAPREVIEW,
    },
    // {
    //     label: __('任务监控'),
    //     key: TabKey.TASKMONITOR,
    // },
    // {
    //     label: __('可信度评估'),
    //     key: TabKey.EVALUATION,
    // },
    {
        label: __('评分'),
        key: TabKey.SCORE,
    },
    {
        label: __('理解报告'),
        key: TabKey.COMPREHENSIONREPORT,
    },
    // {
    //     label: __('影响分析'),
    //     key: TabKey.IMPACTANALYSIS,
    // },
]

export const dirFileContItems = [
    {
        label: __('基本信息'),
        key: TabKey.BASIC,
    },
    {
        label: __('评分'),
        key: TabKey.SCORE,
    },
]

interface ContentContainerType {
    children: ReactNode
    title: string
}
const ContentContainer = ({ children, title }: ContentContainerType) => {
    return (
        <div className={styles.contentContainer}>
            <div className={styles.title}>{title}</div>
            <div className={styles.content}>{children}</div>
        </div>
    )
}

/**
 * 根据菜单内容返回
 */
interface DirItemsComponentType {
    catalogId: string
    formViewId?: string
    ref: any
    tabkey: TabKey
    updateActiveKey?: (key: TabKey) => void
}
export const DirItemsComponent = ({
    catalogId,
    ref,
    tabkey,
    formViewId,
    updateActiveKey = noop,
}: DirItemsComponentType) => {
    switch (tabkey) {
        case TabKey.BASIC:
            return (
                // <ContentContainer title={__('基本信息')}>
                <DirBasicInfo catalogId={catalogId} ref={ref} />
                // </ContentContainer>
            )
        case TabKey.COLUMN:
            return (
                // <ContentContainer title={__('列属性')}>
                <DirColumnInfo catalogId={catalogId} showTitle />
                // </ContentContainer>
            )
        case TabKey.RELATEDCATALOG:
            return (
                <div style={{ height: '100%' }}>
                    <DataCatlgAbstract
                        catalogId={catalogId}
                        relatedRescId={formViewId}
                    />
                </div>
            )
        // case TabKey.SAMPLTDATA:
        //     return (
        //         <ContentContainer title={__('样例数据')}>
        //             <FormViewExampleData id={catalogId} />
        //         </ContentContainer>
        //     )
        case TabKey.CONSANGUINITYANALYSIS:
            return (
                <DataConsanguinity
                    id={formViewId || ''}
                    dataServiceType={DataServiceType.DirContent}
                />
            )
        case TabKey.DATAPREVIEW:
            return <DataPreview dataViewId={formViewId || ''} />
        case TabKey.TASKMONITOR:
            return (
                <TaskMonitor
                    catalogId={catalogId}
                    updateActiveKey={updateActiveKey}
                />
            )
        case TabKey.EVALUATION:
            return (
                <ReliabilityEvaluationDetail
                    catlgId={catalogId}
                    updateActiveKey={updateActiveKey}
                    relatedRescId={formViewId}
                />
            )
        case TabKey.SCORE:
            return <CatlgScore catalogId={catalogId} />
        case TabKey.FILEINFO:
            return <FileInfoDetail fileId={formViewId} />
        case TabKey.COMPREHENSIONREPORT:
            return <ComprehensionReport catalogId={catalogId} />
        case TabKey.IMPACTANALYSIS:
            return <ImpactAnalysis id={catalogId} />
        default:
            return <div />
    }
}

/**
 * @params CLKTOEXPAND 点击展开节点
 * @params SEARCH 搜索
 * @params OTHER 其他情況-如首次进入目录
 */
export enum CatlgOperateType {
    CLKTOEXPAND = 'click_to_expand',
    SEARCH = 'search',
    OTHER = 'other',
}

/**
 * 查询参数
 * @param label 名称
 * @param rightNode 右侧节点
 */
export interface ILabelTitle {
    label: string
    id?: string
    rightNode?: ReactNode
}

export const getAuditStateLabel = (
    type: number | undefined,
    flowType: number | undefined,
) => {
    const {
        label,
        color = 'rgba(0, 0, 0, 0.85)',
        bgColor = 'rgba(0, 0, 0, 0.04)',
    } = auditStateList.find((s) => s.value === type) || {}
    const str: string =
        flowTypeList.find((it) => it.value === flowType)?.label || ''
    return label ? (
        <div
            className={styles.stateContainer}
            style={{
                color: `${color}`,
                // backgroundColor: `${bgColor}`,
            }}
        >
            {str}
            {label}
        </div>
    ) : (
        <div className={styles.stateContainer}>{__('未发布')}</div>
    )
}

export const getAuditingLabel = (
    type: number | undefined,
    list: {
        label: string
        value: any
        color?: string
        bgColor?: string
    }[] = publishAudingAndRejectList,
) => {
    const {
        label,
        color = 'rgba(0, 0, 0, 0.85)',
        bgColor = 'rgba(0, 0, 0, 0.04)',
    } = list.find((s) => s.value === type) || {}
    return label ? (
        <div
            style={{
                color: `${color}`,
                backgroundColor: `${bgColor}`,
                padding: '2px 6px',
                borderRadius: '20px',
                cursor: 'default',
                marginLeft: '4px',
            }}
        >
            {label}
        </div>
    ) : (
        '--'
    )
}

/**
 * 显示审核状态
 * @param key 接口返回字段
 * @param useStrValue 是否使用strValue字段
 * @param 资源目录使用key，接口服务使用strValue
 * @returns
 */
export const getState = (key: STATE, useStrValue?: boolean) => {
    const { label, bgColor = '#d8d8d8' } =
        stateList.find(
            (item) => item[useStrValue ? 'strValue' : 'key'] === key,
        ) || {}

    return (
        <div className={styles.state}>
            <span className={styles.dot} style={{ background: bgColor }} />
            {label}
        </div>
    )
}

export interface IStateInfo {
    hideState: boolean
    state: number | undefined
    audit_state?: number
    flow_type?: number
    audit_advice?: string
}

/**
 * 详情显示审核状态
 * @param hideState 是否隐藏状态
 * @param state 资源状态
 * @param audit_state 审核状态
 * @param flow_type 审核类型
 * @param audit_advice 审核意见
 * @returns
 */
export const getStateInfo = (data: IStateInfo) => {
    const { hideState, state, audit_state, flow_type, audit_advice } = data
    if (hideState) {
        return ''
    }
    let type: AlertProps['type']
    let icon: any
    switch (state) {
        case STATE.Online:
            type = 'success'
            break
        case STATE.published:
            type = 'info'
            icon = <CheckCircleFilled />
            break
        case STATE.Offline:
            type = 'error'
            break
        case STATE.Draft:
            type = 'warning'
            icon = <InfoCircleFilled />
            break
        default:
            type = 'warning'
    }

    return state ? (
        <div className={styles.alertWrapper}>
            <Alert
                message={
                    <>
                        <div className={styles.alertMeessage}>
                            <span className={styles.alertText}>
                                {stateList.find((item) => {
                                    return item.key === state
                                })?.label || ''}
                            </span>
                            {audit_state &&
                                flow_type &&
                                getAuditStateLabel(audit_state, flow_type)}
                        </div>
                        {audit_advice && (
                            <Expand
                                content={`${__(
                                    '审批建议：',
                                )}${htmlDecodeByRegExp(audit_advice || '')}`}
                                expandTips={__('展开')}
                            />
                        )}
                    </>
                }
                icon={icon}
                type={type}
                showIcon
            />
        </div>
    ) : (
        ''
    )
}

export const getFieldTypeIcon = (type, fontSize?: number) => {
    switch (true) {
        case dataTypeMapping.char.includes(type):
            return <StringTypeOutlined style={{ fontSize: fontSize || 18 }} />
        case dataTypeMapping.number.includes(type):
            return <NumberTypeOutlined style={{ fontSize: fontSize || 18 }} />
        case dataTypeMapping.datetime.includes(type):
            return (
                <FontIcon
                    style={{
                        fontSize: fontSize ? fontSize - 4 : 14,
                        margin: '0 2px',
                    }}
                    name="icon-riqishijianxing"
                />
            )
        case dataTypeMapping.date.includes(type):
            return (
                <LimitDatellined
                    style={{
                        fontSize: fontSize ? fontSize - 4 : 14,
                        margin: '0 2px',
                    }}
                />
            )
        case dataTypeMapping.time.includes(type):
            return (
                <FontIcon
                    style={{
                        fontSize: fontSize ? fontSize - 4 : 14,
                        margin: '0 2px',
                    }}
                    name="icon-shijianchuoxing"
                />
            )
        case dataTypeMapping.interval.includes(type):
            return (
                <FontIcon
                    style={{
                        fontSize: fontSize ? fontSize - 4 : 14,
                        margin: '0 2px',
                    }}
                    name="icon-shijianduan11"
                />
            )
        case dataTypeMapping.bool.includes(type):
            return <BooleanTypeOutlined style={{ fontSize: fontSize || 18 }} />
        case dataTypeMapping.binary.includes(type):
            return <BinaryTypeOutlined style={{ fontSize: fontSize || 18 }} />
        default:
            return <UnkownTypeOutlined style={{ fontSize: fontSize || 18 }} />
    }
}
export const AllResourcesSearchFormInitData = [
    {
        label: '数据资源目录名称、编码',
        key: 'keyword',
        type: SearchType.Input,
        defaultValue: initSearchCondition.keyword,
        isAlone: true,
        itemProps: {
            maxLength: 255,
        },
    },
    {
        label: '资源类型',
        key: 'mount_type',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: mountTypeOptions,
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    // {
    //     label: __('目录提供方'),
    //     key: 'department_id',
    //     type: SearchType.Select,
    //     itemProps: {
    //         options: [],
    //         placeholder: __('请选择'),
    //         searchPlaceholder: __('搜索目录提供方'),
    //     },
    // },
    {
        label: __('所属业务对象'),
        key: 'subject_id',
        type: SearchType.SelectThemeDomainTree,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
                type: BusinessDomainType.subject_domain_group,
            },
            otherCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000001',
                name: __('其他'),
                type: BusinessDomainType.subject_domain_group,
            },
            selectableTypes: [
                BusinessDomainType.subject_domain_group,
                BusinessDomainType.subject_domain,
                BusinessDomainType.business_object,
                BusinessDomainType.business_activity,
            ],
            placeholder: __('请选择'),
        },
    },
    {
        label: __('发布状态'),
        key: 'publish_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: publishStatusList.map((item) => ({
                ...item,
                icon: (
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            marginRight: '3px',
                            borderRadius: '50%',
                            background: item.bgColor,
                        }}
                    />
                ),
            })),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('理解状态'),
        key: 'comprehension_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: comprehensionStatusList.map((item) => {
                const bgColor =
                    item.value === comprehensionStatus.Comprehension
                        ? '#52C41B'
                        : 'rgba(0, 0, 0, 0.30)'
                const obj: any = {
                    ...item,
                    value: `${item.value}`,
                    icon: (
                        <span
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                marginRight: '3px',
                                borderRadius: '50%',
                                background: bgColor,
                            }}
                        />
                    ),
                }
                return obj
            }),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('上线状态'),
        key: 'online_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: onLineStatusList.map((item) => ({
                ...item,
                icon: (
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            marginRight: '3px',
                            borderRadius: '50%',
                            background: item.bgColor,
                        }}
                    />
                ),
            })),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('更新时间'),
        key: 'updateTime',
        type: SearchType.RangePicker,
        itemProps: {
            format: 'YYYY-MM-DD',
            // disabledDate: (current: any) => disabledDate(current, {}),
        },
        startTime: 'updated_at_start',
        endTime: 'updated_at_end',
    },
]
export const searchFormInitData = [
    {
        label: '数据资源目录名称、编码',
        key: 'keyword',
        type: SearchType.Input,
        defaultValue: initSearchCondition.keyword,
        isAlone: true,
        itemProps: {
            maxLength: 255,
        },
    },
    {
        label: '资源类型',
        key: 'mount_type',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: mountTypeOptions,
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('所属业务对象'),
        key: 'subject_id',
        type: SearchType.SelectThemeDomainTree,
        itemProps: {
            allowClear: true,
            unCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000000',
                name: __('未分类'),
                type: BusinessDomainType.subject_domain_group,
            },
            otherCategorizedObj: {
                id: '00000000-0000-0000-0000-000000000001',
                name: __('其他'),
                type: BusinessDomainType.subject_domain_group,
            },
            selectableTypes: [
                BusinessDomainType.subject_domain_group,
                BusinessDomainType.subject_domain,
                BusinessDomainType.business_object,
                BusinessDomainType.business_activity,
            ],
            placeholder: __('请选择'),
        },
    },
    {
        label: __('发布状态'),
        key: 'publish_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: publishStatusList.map((item) => ({
                ...item,
                icon: (
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            marginRight: '3px',
                            borderRadius: '50%',
                            background: item.bgColor,
                        }}
                    />
                ),
            })),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('理解状态'),
        key: 'comprehension_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: comprehensionStatusList.map((item) => {
                const bgColor =
                    item.value === comprehensionStatus.Comprehension
                        ? '#52C41B'
                        : 'rgba(0, 0, 0, 0.30)'
                const obj: any = {
                    ...item,
                    value: `${item.value}`,
                    icon: (
                        <span
                            style={{
                                display: 'inline-block',
                                width: '10px',
                                height: '10px',
                                marginRight: '3px',
                                borderRadius: '50%',
                                background: bgColor,
                            }}
                        />
                    ),
                }
                return obj
            }),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('上线状态'),
        key: 'online_status',
        type: SearchType.MultipleSelect,
        itemProps: {
            options: onLineStatusList.map((item) => ({
                ...item,
                icon: (
                    <span
                        style={{
                            display: 'inline-block',
                            width: '10px',
                            height: '10px',
                            marginRight: '3px',
                            borderRadius: '50%',
                            background: item.bgColor,
                        }}
                    />
                ),
            })),
            fieldNames: { label: 'label', value: 'value' },
            showSearch: false,
        },
    },
    {
        label: __('更新时间'),
        key: 'updateTime',
        type: SearchType.RangePicker,
        itemProps: {
            format: 'YYYY-MM-DD',
            // disabledDate: (current: any) => disabledDate(current, {}),
        },
        startTime: 'updated_at_start',
        endTime: 'updated_at_end',
    },
]

export const timeStrToTimestamp = (searchObj: any) => {
    const obj: any = {}
    const timeFields = ['updated_at_start', 'updated_at_end']
    // eslint-disable-next-line no-restricted-syntax, guard-for-in
    for (const key in searchObj) {
        if (Object.prototype.hasOwnProperty.call(searchObj, key)) {
            obj[key] = searchObj[key]
                ? timeFields.includes(key)
                    ? moment(searchObj[key]).valueOf()
                    : searchObj[key]
                : undefined
        }
    }
    return obj
}

export const catalogMoreInfo = [
    { label: __('数据资源目录名称'), value: '', key: '1', span: 8 },
    { label: __('目录编码'), value: '', key: '2', span: 8 },
    {
        label: __('数据库类型'),
        value: '',
        key: '3',
        span: 8,
        options: resourceTypeList,
    },
    {
        label: __('空间范围'),
        value: '',
        key: '4',
        span: 8,
        options: dataRangeOptions,
    },
    {
        label: __('共享属性'),
        value: '',
        key: '5',
        span: 8,
        options: shareTypeList,
    },
    {
        label: __('开放属性'),
        value: '',
        key: '6',
        span: 8,
        options: openTypeList,
    },
    {
        label: __('数据分级'),
        value: '',
        key: '7',
        span: 8,
        options: sensitivityLevelList,
    },
    {
        label: __('是否发布'),
        value: '',
        key: '8',
        span: 8,
        options: YesOrNoList,
    },
    { label: __('描述'), value: '', key: 'desc', span: 24 },
]

export const resourceMoreInfo = [
    { label: __('资源名称'), value: '', key: '1', span: 8 },
    { label: __('数据库名称'), value: '', key: '2', span: 8 },
    { label: __('数据表名称'), value: '', key: '3', span: 8 },
    { label: __('描述'), value: '', key: 'desc', span: 24 },
]
export const apiResourceMoreInfo = [
    { label: __('资源名称'), value: '', key: '1', span: 8 },
    { label: __('请求方式'), value: '', key: '10', span: 8 },
    { label: __('服务协议'), value: '', key: '11', span: 8 },
    { label: __('服务地址'), value: '', key: '12', span: 8 },
    { label: __('服务路径'), value: '', key: '13', span: 8 },
    { label: __('描述'), value: '', key: 'desc', span: 24 },
]
export const resourceReportDetailsInfo = [
    {
        label: __('上报目录信息'),
        key: 'catalog',
        list: [
            ...catalogMoreInfo.filter((item) => item.key !== 'desc'),
            { label: __('数据所属领域'), value: '', key: '1', span: 8 },
            { label: __('数据所属层级'), value: '', key: '10', span: 8 },
            { label: __('时间数据范围'), value: '', key: '10', span: 8 },
            { label: __('提供渠道'), value: '', key: '11', span: 8 },
            { label: __('数据资源来源部门'), value: '', key: '12', span: 8 },
            { label: __('行政区域代码'), value: '', key: '13', span: 8 },
            { label: __('中央指导部门代码'), value: '', key: '13', span: 8 },
            { label: __('数据来源事项'), value: '', key: '13', span: 8 },
            { label: __('应用场景分类'), value: '', key: '13', span: 8 },
            { label: __('更新周期'), value: '', key: '13', span: 8 },
            { label: __('数据加工程度'), value: '', key: '13', span: 8 },
            { label: __('目录标签'), value: '', key: '13', span: 8 },
            { label: __('是否电子证照编码'), value: '', key: '13', span: 8 },
            { label: __('描述'), value: '', key: 'desc', span: 24 },
        ],
    },
    {
        label: __('上报资源信息'),
        key: 'resource',
        list: [
            ...resourceMoreInfo.filter((item) => item.key !== 'desc'),
            { label: __('调度计划'), value: '', key: '13', span: 8 },
            { label: __('描述'), value: '', key: 'desc', span: 24 },
        ],
    },
]
export const governmentInfoKeys = [
    // 'time_range',
    'provider_channel',
    'data_domain',
    'yycjflqt',
    'data_level',
    'central_department_code',
    'administrative_code',
    'processing_level',
    'catalog_tag',
    'is_electronic_proof',
    'scheduling_plan',
    'request_format',
    'response_format',
]

export const basicInfoDetailsList = [
    {
        label: __('基本属性'),
        key: 'basic',
        list: [
            {
                label: __('资源类型'),
                value: '',
                key: 'resource_type',
                span: 12,
            },
            {
                label: __('数据资源来源部门'),
                value: '',
                key: 'source_department',
                span: 12,
            },
            {
                label: __('目录提供方'),
                value: '',
                key: 'department',
            },
            {
                label: __('所属信息系统'),
                value: '',
                key: 'info_system',
            },
            {
                label: __('所属业务对象'),
                value: '',
                key: 'subject',
            },
            {
                label: __('应用场景分类'),
                value: '',
                key: 'app_scene_classify',
                options: UseSceneList,
            },
            {
                label: __('其他应用场景'),
                value: '',
                key: 'other_app_scene_classify',
            },
            {
                label: __('数据所属事项'),
                value: '',
                key: 'business_matters',
            },
            {
                label: __('空间范围'),
                value: '',
                key: 'data_range',
                options: dataRangeOptions,
            },
            {
                label: __('数据时间范围'),
                value: '',
                key: 'time_range',
            },
            {
                label: __('更新周期'),
                value: '',
                key: 'update_cycle',
                options: updateCycleOptions,
            },
            {
                label: __('其他更新周期'),
                value: '',
                key: 'other_update_cycle',
            },
            {
                label: __('数据分级'),
                value: '',
                key: 'data_classify',
            },
            {
                label: __('供应渠道'),
                value: '',
                key: 'provider_channel',
                options: DataProvideChannelList,
                governmentStatus: true,
            },
            {
                label: __('数据所属领域'),
                value: '',
                key: 'data_domain',
                options: DataDomainList,
                governmentStatus: true,
            },
            {
                label: __('数据所在层级'),
                value: '',
                key: 'data_level',
                options: DataLevelList,
                governmentStatus: true,
            },
            {
                label: __('中央业务指导部门代码'),
                value: '',
                key: 'central_department_code',
                options: DepartmentCodeList,
                governmentStatus: true,
            },
            {
                label: __('行政区划代码'),
                value: '',
                key: 'administrative_code',
                options: DivisionCodeList,
                governmentStatus: true,
            },
            {
                label: __('数据加工程度'),
                value: '',
                key: 'processing_level',
                options: DataProcessingList,
                governmentStatus: true,
            },
            {
                label: __('目录标签'),
                value: '',
                key: 'catalog_tag',
                options: CatalogTagList,
                governmentStatus: true,
            },
            {
                label: __('是否电子证照编码'),
                value: '',
                key: 'is_electronic_proof',
                options: BoolYesOrNoList,
                governmentStatus: true,
            },
        ],
    },
    {
        label: __('资源属性分类'),
        key: 'resourcesAttr',
        list: [],
    },
    // {
    //     label: __('挂接资源'),
    //     key: 'resourcesMount',
    //     list: [
    //         {
    //             label: __('资源名称'),
    //             value: '',
    //             key: 'resourceName',
    //         },
    //         {
    //             label: __('调度计划'),
    //             value: '',
    //             key: 'scheduling_plan',
    //         },
    //         {
    //             label: __('服务请求报文格式'),
    //             value: '',
    //             key: 'request_format',
    //             options: RequestContentTypeList,
    //         },
    //         {
    //             label: __('服务响应报文格式'),
    //             value: '',
    //             key: 'response_format',
    //             options: RequestContentTypeList,
    //         },
    //     ],
    // },
    {
        label: __('共享信息'),
        key: 'sharedAttr',
        list: [
            {
                label: __('共享属性'),
                value: '',
                key: 'shared_type',
                options: shareTypeList,
            },
            {
                label: __('共享条件'),
                value: '',
                key: 'shared_condition',
            },
            {
                label: __('共享方式'),
                value: '',
                key: 'shared_mode',
                options: shareModeList,
            },
            {
                label: __('开放属性'),
                value: '',
                key: 'open_type',
                options: openTypeList,
            },
            {
                label: __('开放条件'),
                value: '',
                key: 'open_condition',
            },
        ],
    },
    {
        label: __('更多信息'),
        key: 'moreInfo',
        list: [
            {
                label: __('数据同步机制'),
                value: '',
                key: 'sync_mechanism',
                options: dataSyncMechanismList,
            },
            {
                label: __('同步频率'),
                value: '',
                key: 'sync_frequency',
            },
            {
                label: __('数据是否存在物理删除'),
                value: '',
                key: 'physical_deletion',
                options: YesOrNoList,
            },
            {
                label: __('是否上线到超市'),
                value: '',
                key: 'publish_flag',
                options: YesOrNoList,
            },
            {
                label: __('是否可授权运营'),
                value: '',
                key: 'operation_authorized',
                options: YesOrNoList,
            },
            {
                label: __('创建时间'),
                value: '',
                key: 'created_at',
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
            },
        ],
    },
    {
        label: __('挂接资源'),
        key: 'resourcesMountList',
        list: [],
    },
]

// 目录详情-文件信息
export const fileInfoDetailsList = [
    {
        label: __('资源信息'),
        key: 'basic',
        list: [
            {
                label: __('资源名称'),
                value: '',
                key: 'name',
                span: 12,
            },
            {
                label: __('编码'),
                value: '',
                key: 'code',
            },
            {
                label: __('目录提供方'),
                value: '',
                key: 'department_path',
                span: 12,
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
            },
        ],
    },
    // {
    //     label: __('附件清单'),
    //     // key: 'accessories_list',
    //     key: 'fileList',
    //     list: [],
    // },
]

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
            {expanded ? <DownOutlined /> : <RightOutlined />}
        </span>
    ) : null
}

export const resourceTypeIcon = (type: ResTypeEnum) => {
    switch (type) {
        case ResTypeEnum.TABLE:
            return <DatasheetViewColored />
        case ResTypeEnum.API:
            return <AppApiColored />
        case ResTypeEnum.FILE:
            return (
                <FontIcon
                    type={IconType.COLOREDICON}
                    name="icon-wenjianziyuan"
                />
            )
        default:
            return null
    }
}

// 可信度评估结果类型
export enum ScoreType {
    EXCELLENT = 'excellent',
    GOOD = 'good',
    GENERAL = 'general',
}

// 可信度评估结果配置
export const ScoreConfig = {
    [ScoreType.EXCELLENT]: {
        color: '#52C41B',
        text: __('优秀'),
    },
    [ScoreType.GOOD]: {
        color: '#2F9BFF',
        text: __('良好'),
    },
    [ScoreType.GENERAL]: {
        color: '#FAAD14',
        text: __('一般'),
    },
}

// 可信度评估结果展示
export const ScoreText = ({
    name,
    score,
}: {
    name: string
    score: number | null
}) => {
    const scoreType =
        score || score === 0
            ? score >= 85
                ? ScoreType.EXCELLENT
                : score >= 60
                ? ScoreType.GOOD
                : ScoreType.GENERAL
            : null
    return (
        <div className={styles.scoreText}>
            <div>{name}</div>
            <Tooltip
                title={scoreType ? ScoreConfig[scoreType].text : ''}
                color="#fff"
                overlayInnerStyle={{ color: 'rgba(0,0,0,0.85)' }}
            >
                {scoreType ? (
                    <div
                        className={styles.spot}
                        style={{ background: ScoreConfig[scoreType].color }}
                    />
                ) : (
                    '--'
                )}
            </Tooltip>
        </div>
    )
}

export const getScoreConfig = (score: number) => {
    const scoreType = score
        ? score >= 85
            ? ScoreType.EXCELLENT
            : score >= 60
            ? ScoreType.GOOD
            : ScoreType.GENERAL
        : ScoreType.GENERAL
    return ScoreConfig[scoreType]
}

export const getSharedTpeAndOpenType = (fieldData: any[] = []) => {
    if (!fieldData?.length) {
        return {
            shared_type: ShareTypeEnum.UNCONDITION,
            open_type: OpenTypeEnum.OPEN,
        }
    }
    const sharedTyps = [ShareTypeEnum.NOSHARE, ShareTypeEnum.UNCONDITION]
    const openTyps = [OpenTypeEnum.OPEN, OpenTypeEnum.NOOPEN]
    const shared_type = fieldData.every(
        (o) => o.shared_type === ShareTypeEnum.NOSHARE,
    )
        ? ShareTypeEnum.NOSHARE
        : fieldData.every((o) => o.shared_type === ShareTypeEnum.UNCONDITION)
        ? ShareTypeEnum.UNCONDITION
        : fieldData.some((o) => o.shared_type === ShareTypeEnum.CONDITION) ||
          fieldData.every((o) => sharedTyps.includes(o.shared_type))
        ? ShareTypeEnum.CONDITION
        : ShareTypeEnum.UNCONDITION

    const open_type = fieldData.every((o) => o.open_type === OpenTypeEnum.OPEN)
        ? OpenTypeEnum.OPEN
        : fieldData.every((o) => o.open_type === OpenTypeEnum.NOOPEN)
        ? OpenTypeEnum.NOOPEN
        : fieldData.some((o) => o.open_type === OpenTypeEnum.HASCONDITION) ||
          fieldData.every((o) => openTyps.includes(o.open_type))
        ? OpenTypeEnum.HASCONDITION
        : OpenTypeEnum.OPEN
    return {
        shared_type,
        open_type,
    }
}

export const notNullObject = (obj: any) => {
    const filterKeys = ['isSelectedFlag']
    const filterObj = Object.entries(obj).reduce((acc, [key, value]) => {
        if (
            value !== null &&
            value !== undefined &&
            value !== '' &&
            !filterKeys.includes(key)
        ) {
            acc[key] = value
        }
        return acc
    }, {})
    return filterObj
}

export const compareObjIsChangeByKeys = (
    obj1: any,
    obj2: any,
    keys: string[],
) => {
    return keys.some((key) => {
        const picked1 = pick(obj1, key)
        const picked2 = pick(obj2, key)
        return !isEqual(picked1, picked2)
    })
}

export const compareObjectArraysIsChange = (
    arr1: any[] = [],
    arr2: any[] = [],
) => {
    if (arr1.length !== arr2.length) return true

    // eslint-disable-next-line no-plusplus
    for (let i = 0; i < arr1.length; i++) {
        if (
            JSON.stringify(notNullObject(arr1[i])) !==
            JSON.stringify(notNullObject(arr2[i]))
        ) {
            return true
        }
    }

    return false
}
export const getTimeRangeStr = (time: any[]) => {
    const startTime = time[0]
        ? moment(time[0]).format('YYYY-MM-DD 00:00:00')
        : ''
    const endTime = time[1] ? moment(time[1]).format('YYYY-MM-DD 23:59:59') : ''
    return time?.length > 0 ? `${startTime},${endTime}` : ''
}
// 根据标签敏感属性、涉密属性、共享属性转为目录属性
export const getLabelSensitiveFlag = (
    lableList: any[] = [],
    field: any = {},
) => {
    const labelItem = field?.label_id
        ? lableList.find((o) => o.id === field?.label_id)
        : {}
    if (labelItem?.id) {
        const info = {
            sensitive_flag: labelItem?.sensitive_attri
                ? classifyLabelSensitiveKeyMap[labelItem?.sensitive_attri]
                : undefined,
            classified_flag: labelItem?.secret_attri
                ? classifyLabelClassifiedKeyMap[labelItem?.secret_attri]
                : undefined,
            shared_type: labelItem?.share_condition
                ? classifyLabelShareKeyMap[labelItem?.share_condition]
                : undefined,
        }
        return info
    }
    return {}
}

/**
 * 获取下拉框的选项的显示
 * @param name
 * @returns
 */
export const getInfoSystemLabel = (name: string) => {
    return (
        <div
            style={{
                display: 'flex',
                alignItems: 'center',
            }}
        >
            <BusinessSystemOutlined
                style={{
                    marginTop: '2px',
                    marginRight: '2px',
                    fontSize: '16px',
                }}
            />
            <span
                style={{
                    marginLeft: '10px',
                }}
                className={styles.systemInfoName}
                title={name}
            >
                {name}
            </span>
        </div>
    )
}

export const TaskStatusMap = {
    Ready: {
        label: __('未开始'),
        color: '#9BA0BA',
    },
    [WorkOrderStatus.Running]: {
        label: __('进行中'),
        color: '#2f9bff',
    },
    [WorkOrderStatus.Completed]: {
        label: __('已完成'),
        color: '#52c41b',
    },
    [WorkOrderStatus.Failed]: {
        label: __('异常'),
        color: '#ff5e60',
    },
}

export const TaskTypes = {
    aggregation: {
        label: __('归集'),
        key: 'data_aggregation_status',
    },
    processing: {
        label: __('加工'),
        key: 'data_processing_status',
    },
    comprehension: {
        label: __('理解'),
        key: 'data_comprehension_status',
    },
}

/** 任务监控状态显示 */
export const renderTaskStatus = (data: any) => {
    return (
        <div className={styles.tableScoreList}>
            {['aggregation', 'processing', 'comprehension'].map((key) => {
                const status = TaskStatusMap?.[data?.[TaskTypes[key].key]]
                return (
                    <div key={key} className={styles.scoreText}>
                        <div>{TaskTypes[key].label}</div>
                        <div
                            className={styles.text}
                            style={{
                                background: status?.color || 'transparent',
                                color: status ? '#fff' : 'rgba(0,0,0,0.85)',
                            }}
                        >
                            {status?.label || '--'}
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

export const UndsLabel = ({
    type,
    noSubType = false,
    auditMsg,
}: {
    type: any
    noSubType?: boolean
    auditMsg?: string
}) => {
    // const l0ist = [
    //     { label: __('已生成'), value: comprehensionReportStatus.generated },
    //     { label: __('未理解'), value: comprehensionReportStatus.not_generated },
    //     {
    //         label: __('未生成'),
    //         value: comprehensionReportStatus.generateding,
    //     },
    //     { label: __('未生成'), value: comprehensionReportStatus.refuse },
    //     { label: __('已生成'), value: comprehensionReportStatus.done },
    // ]
    const understoodValue = [2, 5]
    const understood = understoodValue.includes(type)
    const color = understood ? 'rgba(82, 196, 26, 1)' : undefined

    const item: any =
        comprehensionStatusList.find((o) => o.value === type) || {}

    const filterBrackets = (text: string) => {
        return text?.replace?.(/\([^)]*\)/g, '') || ''
    }

    return (
        <div className={styles.ul_title} style={{ color }}>
            <span
                style={{
                    display: 'inline-block',
                    width: '10px',
                    height: '10px',
                    marginRight: '8px',
                    borderRadius: '50%',
                    background: color || 'rgba(0, 0, 0, 0.3)',
                }}
            />
            {noSubType ? filterBrackets(item?.label) : item?.label}
            {auditMsg && (
                <Tooltip title={auditMsg} placement="bottom">
                    <FontIcon
                        name="icon-shenheyijian"
                        type={IconType.COLOREDICON}
                        className={styles.icon}
                        style={{
                            fontSize: 20,
                            marginLeft: 4,
                        }}
                    />
                </Tooltip>
            )}
        </div>
    )
}

export const getDepartmentName = (record: any) => {
    const deptNameList = record?.department_path?.split('/')?.filter((o) => !!o)
    if (deptNameList?.length > 1) {
        return deptNameList[1]
    }
    return record.department
}
export const getScheduling = (data: any) => {
    const schedulingLbel = ScheduleTypeList.find(
        (o) => o.value === data?.scheduling_plan,
    )?.label
    const schedulingType = data?.scheduling_plan
    const firstText = ScheduleTypeTips[schedulingType]?.first || ''
    const lastText = ScheduleTypeTips[schedulingType]?.last || ''
    let middleText = ''
    switch (schedulingType) {
        case ScheduleType.Minute:
            middleText = data?.interval
            break
        case ScheduleType.Day:
            middleText = data?.time
            break
        case ScheduleType.Week:
            middleText = `${data?.interval}，${data?.time}`
            break
        case ScheduleType.Month:
            middleText = `${data?.interval}${__('天，')}${data?.time}`
            break
        default:
            middleText = ''
            break
    }
    const value = schedulingLbel
        ? `${schedulingLbel}；${firstText}${middleText}${lastText}`
        : '--'
    return value
}
export const validateScheduling = (obj: any) => {
    let flag = true
    if (!obj?.scheduling_plan) {
        flag = false
    }
    if (obj?.scheduling_plan === ScheduleType.Minute && !obj?.interval) {
        flag = false
    }
    if (obj?.scheduling_plan === ScheduleType.Day && !obj?.time) {
        flag = false
    }
    if (
        (obj?.scheduling_plan === ScheduleType.Week ||
            obj?.scheduling_plan === ScheduleType.Month) &&
        (!obj?.time || !obj?.interval)
    ) {
        flag = false
    }
    const msg = flag ? '' : '请选择调度计划'
    return { flag, msg }
}

export const getColorOptions = (data: IKL[]) => {
    return data.map((item) => ({
        ...item,
        label: (
            <div style={{ display: 'flex', alignItems: 'center' }}>
                <span
                    style={{
                        display: 'inline-block',
                        width: '10px',
                        height: '10px',
                        marginRight: '8px',
                        borderRadius: '50%',
                        background: item.color,
                    }}
                />
                {item.label}
            </div>
        ),
    }))
}
/**
 * 递归展开数组中的 children 嵌套结构
 */
export const flattenChildrenEnhanced = (array, childrenKey = 'children') => {
    if (!Array.isArray(array)) {
        return []
    }

    const result: any[] = []

    const recursiveFlatten = (items, depth = 0) => {
        items.forEach((item) => {
            if (item && typeof item === 'object') {
                // 创建新对象，避免修改原数据
                const flattenedItem = { ...item }

                // 添加到结果中
                result.push(flattenedItem)

                // 递归处理 children
                if (Array.isArray(item[childrenKey])) {
                    recursiveFlatten(item[childrenKey], depth + 1)
                }
            }
        })
    }

    recursiveFlatten(array)
    return result
}
