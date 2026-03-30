import __ from './locale'
import {
    LogicViewType,
    SortDirection,
    DataViewAuditType,
    DataViewRevokeType,
    getDataViewRepeat,
    formatError,
} from '@/core'
import { cancelRequest } from '@/utils'

export interface IDatasourceInfo {
    name: string
    type: IconType
    desc: string
}

export interface IEditFormData {
    business_name: string
    technical_name: string
    description?: string
    owner_id?: string
    subject_id?: string
    department_id?: string
    id: string
    status?: string
    subject?: string
    department?: string
    owner?: string
    datasource?: string
    view_source_catalog_name?: string
    created_at?: string
    updated_at?: string
    last_publish_time?: string
    viewStatus?: string
    datasource_id?: string
    fields?: any
    online_status?: any
}

export const menus = [
    { key: 'name', label: __('按库表业务名称排序') },
    { key: 'type', label: __('按所属数据源排序') },
    { key: 'created_at', label: __('按库表创建时间排序') },
    { key: 'updated_at', label: __('按库表更新时间排序') },
]

export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}

export enum scanType {
    'history',
    'all',
    'init',
}
/**
 * 目录类型
 * @parma RESCCLASSIFY 资源分类
 * @parma ORGSTRUC 组织架构
 */
export enum RescCatlgType {
    RESC_CLASSIFY = 'resource',
    ORGSTRUC = 'organization',
}

// 组织架构/资源目录-通用树节点
export interface DatasourceTreeNode {
    id: string
    title?: string
    name: string
    type?: IconType
    dataType?: string
    catalog_name?: string
    children?: DatasourceTreeNode[]
    dataSourceId?: string
}

export const allNodeInfo = {
    id: '',
    path: '',
    name: '全部',
}

export enum stateType {
    new = 'new',
    modify = 'modify',
    delete = 'delete',
    uniformity = 'uniformity',
}

// 扫描结果
export const scanList: Array<any> = [
    {
        label: __('新增'),
        value: stateType.new,
        bgColor: '#1890ff',
        tag: __('新'),
        desc: __('表示从数据源里扫描到一张新的“数据表（也称物理表）”'),
    },
    {
        label: __('源表更改'),
        value: stateType.modify,
        bgColor: '#faad14',
        tag: __('改'),
        desc: __('表示数据源里的数据表“字段信息”有变更'),
    },
    {
        label: __('源表删除'),
        value: stateType.delete,
        bgColor: '#ff4d4f',
        tag: __('删'),
        desc: __(
            '表示列表中展示的“库表”，无法再在数据源内匹配到对应的“数据表”',
        ),
    },
    {
        label: __('无变化'),
        value: stateType.uniformity,
        bgColor: '',
        desc: __('表示数据源里的数据表“字段信息”无变化'),
    },
]
// 发布状态
export const stateList: Array<any> = [
    {
        label: __('未发布'),
        value: 'unpublished',
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    { label: __('已发布'), value: 'publish', bgColor: '#52C41B' },
]

export enum explorationStatus {
    Exploration = 'exploration',
    UnExploration = 'unExploration',
}
// 发布状态
export const explorationStatusList: Array<any> = [
    {
        label: __('未探查'),
        value: explorationStatus.Exploration,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('已探查'),
        value: explorationStatus.UnExploration,
        bgColor: '#52C41B',
    },
]
// 评估状态
export const evaluationStatusList: Array<any> = [
    {
        label: __('未评估'),
        value: explorationStatus.UnExploration,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('已评估'),
        value: explorationStatus.Exploration,
        bgColor: '#52C41B',
    },
]
export enum publishStatus {
    Unpublished = 'unpublished',
    PublishedAuditing = 'pub-auditing',
    PublishedAuditReject = 'pub-reject',
    Published = 'published',
    ChangeAuditing = 'change-auditing',
    ChangeReject = 'change-reject',
}
export const publishStatusList = [
    {
        label: __('未发布'),
        value: publishStatus.Unpublished,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('发布审核中'),
        value: publishStatus.PublishedAuditing,
        bgColor: '#1890FF',
    },
    {
        label: __('发布审核未通过'),
        value: publishStatus.PublishedAuditReject,
        bgColor: '#FF4D4F',
    },
    {
        label: __('已发布'),
        value: publishStatus.Published,
        bgColor: '#52C41B',
    },
    {
        label: __('变更审核中'),
        value: publishStatus.ChangeAuditing,
        bgColor: '#1890FF',
    },
    {
        label: __('变更审核未通过'),
        value: publishStatus.ChangeReject,
        bgColor: '#FF4D4F',
    },
]
export enum onLineStatus {
    UnOnline = 'notline',
    OnlineAuditing = 'up-auditing',
    OnlineAuditingReject = 'up-reject',
    Online = 'online',
    OfflineAuditing = 'down-auditing',
    OfflineReject = 'down-reject',
    Offline = 'offline',
    OfflineAuto = 'down-auto',
}
export const onLineStatusTitle = {
    [onLineStatus.OnlineAuditingReject]: __('审核未通过理由：'),
    [onLineStatus.OfflineReject]: __('审核未通过理由：'),
    [onLineStatus.Online]: __('上线审核通过理由：'),
    [onLineStatus.Offline]: __('下线审核通过理由：'),
}

export const onLineStatusList = [
    {
        label: __('未上线'),
        value: onLineStatus.UnOnline,
        bgColor: 'rgba(0, 0, 0, 0.30)',
    },
    {
        label: __('上线审核中'),
        value: onLineStatus.OnlineAuditing,
        bgColor: '#1890FF',
    },
    {
        label: __('上线审核未通过'),
        value: onLineStatus.OnlineAuditingReject,
        bgColor: '#FF4D4F',
    },
    {
        label: __('已上线'),
        value: onLineStatus.Online,
        bgColor: '#52C41B',
    },
    {
        label: __('下线审核中'),
        value: onLineStatus.OfflineAuditing,
        bgColor: '#1890FF',
    },
    {
        label: __('下线审核未通过'),
        value: onLineStatus.OfflineReject,
        bgColor: '#FF4D4F',
    },
    {
        label: __('已下线'),
        value: onLineStatus.Offline,
        bgColor: '#B2B2B2',
    },
    // {
    //     label: __('已下线'),
    //     value: onLineStatus.OfflineAuto,
    //     bgColor: '#B2B2B2',
    // },
]
// 内容状态
export const contentList: Array<any> = [
    {
        label: __('有草稿'),
        value: 'draft',
        color: '#4c5b76',
        bgColor: 'rgba(229, 231, 237, 0.8)',
    },
    // {
    //     label: __('最新'),
    //     value: 'latest',
    //     color: 'rgb(82, 196, 26)',
    //     bgColor: 'rgba(82, 196, 26, 0.06)',
    // },
]

// 业务架构节点枚举
export enum IconType {
    DATASHEET = 'datasheet',
    MYSQL = 'mysql',
    MARIADB = 'maria',
    HIVE = 'hive-hadoop2',
    HIVEJDBC = 'hive-jdbc',
    POSTGRESQL = 'postgresql',
    ORACLE = 'oracle',
    SQLSERVER = 'sqlserver',
    CLICKHOUSE = 'clickhouse',
    DORIS = 'doris',
    UNKNOWN = 'unknown',
    STRING = 'string',
    LEFTARROW = 'leftArrow',
    RIGHTARROW = 'rightArrow',
    ERROR = 'error',
    TYPETRANSFORM = 'typeTransform',
    NULL = '', // type 为空串暂时解决方案
}

export enum DsType {
    all,
    datasourceType,
    datasource,
    unknown,
}

export const datasourceTitleData = {
    [DsType.all]: {
        name: __('全部'),
        desc: __(
            '展示全部扫描过的数据源内“数据表（也称物理表）的对应库表”，新增库表或库表源表变更需要重新扫描获取状态',
        ),
        type: IconType.DATASHEET,
    },
    [DsType.datasourceType]: {
        name: __('【数据源类型】'),
        desc: __(
            '展示此类型下，已扫描过的数据源内“数据表（也称物理表）的对应库表”，简称“库表”，新增库表需要重新扫描',
        ),
        type: IconType.MYSQL,
    },
    [DsType.datasource]: {
        name: '',
        desc: __(
            '展示此数据源内“数据表（也称物理表）的对应库表”，简称“库表”，新增库表需要重新扫描',
        ),
        type: IconType.MYSQL,
    },
    [DsType.unknown]: {
        name: __('未知数据源'),
        desc: __(
            '展示未匹配到数据源的“库表”，且这些库表无法再编辑。另外，未知数据源无法进行扫描',
        ),
        type: IconType.UNKNOWN,
    },
}

export const stateTagList = [
    {
        label: __('删'),
        color: '#fff',
        bgColor: 'rgb(255 77 79 / 100%)',
        key: 'del',
        isCircle: true,
    },
    {
        label: __('主键'),
        color: 'rgb(24 144 255 / 100%)',
        bgColor: 'rgb(24 144 255 / 7%)',
        key: 'key',
    },
    {
        label: __('新'),
        color: '#fff',
        bgColor: '#1890FF',
        key: 'new',
        isCircle: true,
    },
    {
        label: __('改'),
        color: '#fff',
        bgColor: '#FAAD14',
        key: 'modify',
        isCircle: true,
    },
]
export const fieldTagsTips = {
    [stateType.delete]: __('源数据表删除了此字段，请及时更新库表'),
    [stateType.modify]: __('源数据表更改了此字段，请及时更新库表'),
}

export const fieldDetailData = (isStart: boolean) => {
    const classificationInfo = isStart
        ? [
              {
                  key: 'attribute_name',
                  label: __('分类属性'),
                  span: 24,
              },
              {
                  key: 'label_name',
                  label: __('数据分级标签'),
                  span: 24,
              },
          ]
        : [
              {
                  key: 'attribute_name',
                  label: __('分类属性'),
                  span: 24,
              },
          ]
    return [
        {
            key: 'fieldInfo',
            label: __('字段名称'),
            fields: [
                {
                    key: 'business_name',
                    label: __('业务名称'),
                    span: 24,
                },
                {
                    key: 'technical_name',
                    label: __('技术名称'),
                    span: 24,
                },
            ],
        },
        {
            key: 'tecInfo',
            label: __('源字段技术属性'),
            fields: [
                {
                    key: 'standard',
                    label: __('关联数据标准'),
                    span: 24,
                },
                {
                    key: 'code_table',
                    label: __('关联码表'),
                    span: 24,
                },
                {
                    key: 'data_type',
                    label: __('数据类型'),
                    span: 24,
                },
                {
                    key: 'reset_convert_rules',
                    label: __('数据解析规则'),
                    span: 24,
                },
                {
                    key: 'original_data_type',
                    label: __('原始数据类型'),
                    span: 24,
                },
                {
                    key: 'data_length',
                    label: __('数据长度'),
                    span: 24,
                },
                {
                    key: 'data_accuracy',
                    label: __('数据精度'),
                    span: 24,
                },
                {
                    key: 'primary_key',
                    label: __('是否主键'),
                    span: 24,
                    options: [
                        {
                            label: __('是'),
                            key: true,
                        },
                        {
                            label: __('否'),
                            key: false,
                        },
                    ],
                },
            ],
        },
        {
            key: 'classificationInfo',
            label: __('分类分级信息'),
            fields: classificationInfo,
        },
        // {
        //     key: 'templeInfo',
        //     label: __('样例数据'),
        //     subTitle: __('（当前字段可能不存在样例数据，以下为AI生成）'),
        //     fields: [],
        // },
        {
            key: 'moreInfo',
            label: __('更多信息'),
        },
    ]
}

// export const editBasicModalDesc = [
//     { title: __('说明：') },
//     {
//         title: __(
//             '1、若需要在数据服务超市的“数据资源”下展示库表，需要同时满足以下条件：',
//         ),
//         subTitle: [
//             __('库表“已发布”成功'),
//             __('库表有“所属部门”或“所属主题”'),
//         ],
//     },
//     {
//         title: __(
//             '2、其他功能模块在引用库表时，只能查看和选择“已发布”成功的库表',
//         ),
//     },
// ]

export const moreInfoList = [
    {
        label: __('基本属性'),
        list: [
            {
                label: __('库表业务名称'),
                value: '',
                key: 'business_name',
                span: 24,
            },
            {
                label: __('编码'),
                value: '',
                key: 'uniform_catalog_code',
                span: 24,
            },
            {
                label: __('库表技术名称'),
                value: '',
                key: 'technical_name',
                span: 24,
            },
            {
                label: __('描述'),
                value: '',
                key: 'description',
                span: 24,
            },
            {
                label: __('发布状态'),
                value: '',
                key: 'status',
                span: 24,
            },
            {
                label: __('上线状态'),
                value: '',
                key: 'online_status',
                span: 24,
            },
            {
                label: __('所属主题'),
                value: '',
                key: 'subject',
                span: 24,
            },
            {
                label: __('所属部门'),
                value: '',
                key: 'department',
                span: 24,
            },
            {
                label: __('数据Owner'),
                value: '',
                key: 'owner',
                span: 24,
            },
            {
                label: __('数据源名称'),
                value: '',
                key: 'datasource_name',
                span: 24,
            },
            {
                label: 'catalog',
                value: '',
                key: 'view_source_catalog_name',
                span: 24,
            },
            {
                label: __('库名称'),
                value: '',
                key: 'schema',
                span: 24,
            },
            {
                label: __('关联信息系统'),
                value: '',
                key: 'info_system',
                span: 24,
            },
        ],
    },
    {
        label: __('其他信息'),
        list: [
            {
                label: __('创建人'),
                value: '',
                key: 'created_by',
                span: 24,
            },
            {
                label: __('创建时间'),
                value: '',
                key: 'created_at',
                span: 24,
            },
            {
                label: __('更新人'),
                value: '',
                key: 'updated_by',
                span: 24,
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
                span: 24,
            },
            {
                label: __('业务数据更新时间'),
                value: '',
                key: 'data_updated_at',
                span: 24,
            },
        ],
    },
]

export const dataViewOtherInfo = [
    {
        label: __('所属数据源'),
        value: '',
        key: 'datasource_name',
        span: 24,
    },
    {
        label: 'catalog',
        value: '',
        key: 'view_source_catalog_name',
        span: 24,
    },
    {
        label: __('库名称'),
        value: '',
        key: 'schema',
        span: 24,
    },
    {
        label: __('关联信息系统'),
        value: '',
        key: 'info_system',
        span: 24,
    },
]

export enum detailTabKey {
    view = '0',
    sampleData = '1',
    dataConsanguinity = '2',
    dataQuality = '3',
    moreInfo = '4',
    accessInfo = '5',
    advancedSettings = '6',
    dataPreview = '7',
    impactAnalysis = '8',
}
export const detailTabItems = [
    {
        label: __('库表'),
        key: detailTabKey.view,
    },
    // {
    //     label: __('样例数据'),
    //     key: detailTabKey.sampleData,
    // },
    {
        label: __('数据预览'),
        key: detailTabKey.dataPreview,
    },
    {
        label: __('数据血缘'),
        key: detailTabKey.dataConsanguinity,
    },
    {
        label: __('影响分析'),
        key: detailTabKey.impactAnalysis,
    },
    // {
    //     label: __('数据质量'),
    //     key: detailTabKey.dataQuality,
    // },
    {
        label: __('高级配置'),
        key: detailTabKey.advancedSettings,
    },
    // {
    //     label: __('更多信息'),
    //     key: detailTabKey.moreInfo,
    // },
]

export const filterEmptyProperties = (obj) => {
    const filteredObj: any = {}
    // eslint-disable-next-line no-restricted-syntax
    for (const key in obj) {
        if (obj[key] !== null && obj[key] !== undefined && obj[key] !== '') {
            filteredObj[key] = obj[key]
        }
    }
    return filteredObj
}

export const tabItems = [
    {
        label: __('元数据库表'),
        key: LogicViewType.DataSource,
        children: '',
    },
    {
        label: __('逻辑实体库表'),
        key: LogicViewType.LogicEntity,
        children: '',
    },
    {
        label: __('自定义库表'),
        key: LogicViewType.Custom,
        children: '',
    },
]

export const AuditOperateMsg = {
    [DataViewAuditType.Online]: __('上线'),
    [DataViewAuditType.Offline]: __('下线'),
    [DataViewAuditType.Publish]: __('发布'),
    [DataViewRevokeType.Publish]: __('发布'),
    [DataViewRevokeType.Online]: __('上线'),
    [DataViewRevokeType.Offline]: __('下线'),
}

export const disableEditBtnTips = {
    [stateType.delete]: __('源表已删除，无法编辑'),
    [onLineStatus.OnlineAuditing]: __('上线审核中，无法编辑'),
    [onLineStatus.OfflineAuditing]: __('下线审核中，无法编辑'),
}
/**
 * @param {Auto} 自动分类
 * @param {Manual} 手动分类
 * @param {NotLimit} 不限制 （仅前端）
 * @param {No} 未分类 （仅前端）
 */
export enum ClassifyType {
    Auto = 1,
    Manual = 2,
    NotLimit = 3,
    No = 4,
}

export const AuditingStatus = [
    onLineStatus.OnlineAuditing,
    onLineStatus.OfflineAuditing,
]

/**
 * 高级设置状态枚举
 *
 * 用于表示高级设置的不同状态，包括空状态、配置状态和查看状态。
 * 这些状态用于区分高级设置的当前操作阶段或模式。
 */
export enum AdvancedSettingStatus {
    EMPTY = 'empty',
    CONFIG = 'config',
    VIEW = 'view',
}

/**
 * 定义执行过程中可能遇到的错误类型。
 *
 * 本枚举用于标识命令执行过程中可能出现的特定错误情况，便于错误处理和分类。
 */
export enum ExecError {
    // 表示命令行输入为空，即没有提供任何命令或参数。
    EMPTY = 'empty',

    // 表示服务器相关错误，可能包括服务器连接失败、服务器响应错误等。
    SERVER = 'server',
}

/**
 * 自动补全状态
 */
export enum AutoCompleteStatus {
    // 无
    None = 1,
    // 补全中
    Completing,
    // 已补全
    Completed,
    // 失败
    Failed,
    // 全部应用
    UsedAll,
}

// 合成数据-错误类型
export enum SyntheticDataError {
    // 样例数据为空，导致合成数据为空
    SampleDataEmpty,
    // 数据异常为合成合成加载失败
    LOADERROR,
    // 有数据但完全无权限
    NOSAMPLEPERMIS,
    // 无AI，不显示样例数据、合成数据
    NOAI,
    // 源表无任何数据信息，导致所有合成数据为空
    ORIGINDATAEMPTY,
    // 字段变更异常导致无法查看数据
    ORIGINDATAERROR,
}

// 库表错误code
export const VIEWERRORCODElIST = {
    // 源表无任何数据信息，导致合成数据为空时的错误码
    VIEWDATAEMPTYERRCODE: 'DataView.LogicView.ViewDataEntriesEmpty',
    // 合成数据生成中
    ADGENERATING: 'DataView.LogicView.ADGenerating',
    // 字段变更异常
    VIEWSQLERRCODE: 'VirtualizationEngine.SqlSyntaxError.',
    // 库表与源表的字段不一致
    VIEWTABLEFIELD: 'VirtualizationEngine.TableFieldError.',
    // af服务连接失败
    AFSAILORERROR: 'DataView.Driven.SailorGenerateFakeSamplesError',
}

export enum DefaultDataType {
    Int = 'int',
    Float = 'float',
    DECIMAL = 'decimal',
    Boolean = 'boolean',
    Date = 'date',
    DateTime = 'datetime',
    String = 'string',
    Char = 'char',
    Varchar = 'varchar',
    Time = 'time',
    None = 'none',
}
export const DefaultDataTypeMapping = {
    // 整数型
    [DefaultDataType.Int]: [
        'number',
        'tinyint',
        'smallint',
        'integer',
        'bigint',
        'int',
    ],
    // 小数型
    [DefaultDataType.Float]: ['real', 'float', 'double', 'precision'],
    // 高精度型
    [DefaultDataType.DECIMAL]: ['decimal', 'dec'],
    // 布尔型
    [DefaultDataType.Boolean]: ['boolean', 'bool'],
    // 日期型
    [DefaultDataType.Date]: ['date'],
    // 日期时间型
    [DefaultDataType.DateTime]: [
        'datetime',
        'timestamp',
        'timestamp with time zone',
    ],
    // 字符型
    [DefaultDataType.String]: ['string'],
    [DefaultDataType.Char]: ['char'],
    [DefaultDataType.Varchar]: ['varchar'],
    [DefaultDataType.Time]: ['time', 'time with time zone'],
}

export const DefaultDataTypeChinese = {
    [DefaultDataType.Int]: __('整数型'),
    [DefaultDataType.Float]: __('小数型'),
    [DefaultDataType.DECIMAL]: __('高精度型'),
    [DefaultDataType.Boolean]: __('布尔型'),
    [DefaultDataType.Date]: __('日期型'),
    [DefaultDataType.DateTime]: __('日期时间型'),
    [DefaultDataType.String]: __('字符型'),
    [DefaultDataType.Char]: __('字符型'),
    [DefaultDataType.Varchar]: __('字符型'),
    [DefaultDataType.Time]: __('时间型'),
    [DefaultDataType.None]: '',
}

export const DataTypeTransformRules = {
    [DefaultDataType.Int]: [
        {
            label: __('字符型'),
            value: 'varchar',
        },
        {
            label: __('布尔型'),
            value: 'boolean',
        },
    ],
    [DefaultDataType.Float]: [
        {
            label: __('字符型'),
            value: 'varchar',
        },
        {
            label: __('布尔型'),
            value: 'boolean',
        },
    ],
    [DefaultDataType.DECIMAL]: [
        {
            label: __('字符型'),
            value: 'varchar',
        },
    ],
    [DefaultDataType.Boolean]: [],
    [DefaultDataType.Date]: [
        {
            label: __('字符型'),
            value: 'varchar',
        },
    ],
    [DefaultDataType.DateTime]: [
        {
            label: __('字符型'),
            value: 'varchar',
        },
        {
            label: __('日期型'),
            value: 'date',
        },
    ],
    [DefaultDataType.String]: [
        {
            label: __('整数型'),
            value: 'bigint',
        },
        {
            label: __('小数型'),
            value: 'double',
        },
        {
            label: __('高精度型'),
            value: 'decimal',
        },
        {
            label: __('日期型'),
            value: 'date',
        },
        {
            label: __('日期时间型'),
            value: 'timestamp',
        },
        {
            label: __('布尔型'),
            value: 'boolean',
        },
    ],
    [DefaultDataType.Varchar]: [
        {
            label: __('整数型'),
            value: 'bigint',
        },
        {
            label: __('小数型'),
            value: 'double',
        },
        {
            label: __('高精度型'),
            value: 'decimal',
        },
        {
            label: __('日期型'),
            value: 'date',
        },
        {
            label: __('日期时间型'),
            value: 'timestamp',
        },
        {
            label: __('时间型'),
            value: 'time',
        },
        {
            label: __('布尔型'),
            value: 'boolean',
        },
    ],
    [DefaultDataType.Char]: [],
    [DefaultDataType.Time]: [
        {
            label: __('字符型'),
            value: 'varchar',
        },
    ],
    [DefaultDataType.None]: [],
}

export const getDefaultDataType = (dataType: string) => {
    switch (true) {
        case DefaultDataTypeMapping[DefaultDataType.Int].includes(dataType):
            return DefaultDataType.Int
        case DefaultDataTypeMapping[DefaultDataType.Float].includes(dataType):
            return DefaultDataType.Float
        case DefaultDataTypeMapping[DefaultDataType.DECIMAL].includes(dataType):
            return DefaultDataType.DECIMAL
        case DefaultDataTypeMapping[DefaultDataType.Boolean].includes(dataType):
            return DefaultDataType.Boolean
        case DefaultDataTypeMapping[DefaultDataType.Date].includes(dataType):
            return DefaultDataType.Date
        case DefaultDataTypeMapping[DefaultDataType.DateTime].includes(
            dataType,
        ):
            return DefaultDataType.DateTime
        case DefaultDataTypeMapping[DefaultDataType.String].includes(dataType):
            return DefaultDataType.String
        case DefaultDataTypeMapping[DefaultDataType.Char].includes(dataType):
            return DefaultDataType.Char
        case DefaultDataTypeMapping[DefaultDataType.Varchar].includes(dataType):
            return DefaultDataType.Varchar
        case DefaultDataTypeMapping[DefaultDataType.Time].includes(dataType):
            return DefaultDataType.Time
        default:
            return DefaultDataType.None
    }
}

export const ParseRuleVar = [
    {
        name: '%Y',
        desc: __('四位数字年份（2024）'),
    },
    {
        name: '%y',
        desc: __('两位数字年份（24）'),
    },
    {
        name: '%m',
        desc: __('两位数字月份（01...12）'),
    },
    {
        name: '%c',
        desc: __('自然月份（1...12）'),
    },
    {
        name: '%b',
        desc: __('月份简称 （Jan...Dec）'),
    },
    {
        name: '%M',
        desc: __('月份名称 （January...December）'),
    },
    {
        name: '%d',
        desc: __('两位日期（01...31）'),
    },
    {
        name: '%e',
        desc: __('自然日期（1...31）'),
    },
    {
        name: '%H',
        desc: __('两位小时（00...23）'),
    },
    {
        name: '%i',
        desc: __('两位分钟（00...59）'),
    },
    {
        name: '%s',
        desc: __('两位秒数（00...59）'),
    },
    {
        name: '%r',
        desc: __('12小时时间（hh:mm:ss），后跟AM或PM'),
    },
    {
        name: '%f',
        desc: __('微秒'),
    },
    {
        name: '%p',
        desc: __('AM或PM'),
    },
    // {
    //     name: '%x',
    //     desc: __('任意字符'),
    // },
]

const CommonPaeseRuleExample = [
    {
        name: '年月日 时分',
        children: [
            {
                rule: '%Y-%m-%d %H:%i',
                example: '2024-01-01 13:01',
            },
            {
                rule: '%Y-%c-%e %H:%i',
                example: '2024-8-1 16:07',
            },
            {
                rule: '%Y/%m/%d %H:%i',
                example: '2024/08/01 16:07',
            },
            {
                rule: '%Y/%c/%e %H:%i',
                example: '2024/8/1 16:07',
            },
            {
                rule: '%Y年%m月%d日 %H:%i',
                example: '2024年08月01日 16:07',
            },
            {
                rule: '%Y年%c月%e日 %H:%i',
                example: '2024年8月1日 16:07',
            },
        ],
    },
    {
        name: '年月日 时分秒',
        children: [
            {
                rule: '%Y-%m-%d %H:%i:%s',
                example: '2024-08-01 16:07:35',
            },
            {
                rule: '%Y-%c-%e %H:%i:%s',
                example: '2024-8-1 16:07:35',
            },
            {
                rule: '%Y/%m/%d %H:%i:%s',
                example: '2024/08/01 16:07:35',
            },
            {
                rule: '%Y/%c/%e %H:%i:%s',
                example: '2024/8/1 16:07:35',
            },
            {
                rule: '%Y年%m月%d日 %H:%i:%s',
                example: '2024年08月01日 16:07:35',
            },
            {
                rule: '%Y年%c月%e日 %H:%i:%s',
                example: '2024年8月1日 16:07:35',
            },
        ],
    },
]
export const DateParseRuleExample = [
    {
        name: '年月日',
        children: [
            {
                rule: '%Y%m%d',
                example: '20240101',
            },
            {
                rule: '%Y-%m-%d',
                example: '2024-01-01',
            },
            {
                rule: '%Y-%c-%e',
                example: '2024-8-1',
            },
            {
                rule: '%Y/%m/%d',
                example: '2024/08/01',
            },
            {
                rule: '%Y/%c/%e',
                example: '2024/8/1',
            },
            {
                rule: '%Y年%m月%d日',
                example: '2024年08月01日',
            },
            {
                rule: '%Y年%c月%e日',
                example: '2024年8月1日',
            },
        ],
    },
    ...CommonPaeseRuleExample,
]

export const TimeParseRuleExample = [
    {
        name: '时间',
        children: [
            {
                rule: '%H:%i',
                example: '16:07',
            },
            {
                rule: '%H:%i:%s',
                example: '16:07:35',
            },
            {
                rule: '%H:%i:%s.%f',
                example: '16:07:35.000',
            },
        ],
    },
    ...CommonPaeseRuleExample,
]

// 表单配置
export const excelFormConfig = [
    {
        title: __('基本属性'),
        key: 'basic_info',
        fields: [
            {
                label: __('库表业务名称'),
                key: 'business_name',
            },
            {
                label: __('库表技术名称'),
                key: 'technical_name',
            },
            {
                label: __('库表字段配置'),
                key: 'field_config',
            },
            {
                label: __('描述'),
                key: 'description',
            },
            {
                label: '',
                key: 'subject_department_owner',
            },
            // {
            //     label: __('所属主题'),
            //     key: 'subject',
            // },
            // {
            //     label: __('所属部门'),
            //     key: 'department',
            // },
            // {
            //     label: __('数据Owner'),
            //     key: 'owner',
            // },
        ],
    },
    {
        title: __('数据范围'),
        key: 'data_range_info',
        fields: [
            {
                label: __('Sheet页'),
                key: 'data_range',
            },
            {
                label: __('单元格范围'),
                key: 'cell_range',
            },
            {
                label: __('库表字段配置'),
                key: 'field_config',
            },
            {
                label: __('Sheet名作字段'),
                key: 'sheet_name_as_field',
            },
        ],
    },
]

/**
 * 校验重名
 * @param name 名称
 * @param flag 类型
 * @param type 类型
 * @param datasource_id 数据源id
 * @param id 库表id
 * @returns 是否重复 并且返回错误
 */
export const validateNameRepeat = async ({
    name,
    flag,
    type,
    datasource_id,
    id,
}: {
    name: string
    flag: 'business_name' | 'technical_name'
    type: LogicViewType
    datasource_id?: string
    id?: string
}): Promise<void> => {
    try {
        // 取消请求, 存在重复的时候取消请求
        cancelRequest(`/api/data-view/v1/form-view/repeat`, 'get')
        const res = await getDataViewRepeat({
            name,
            form_id: id,
            datasource_id,
            name_type: flag,
            type,
        })
        return !res
            ? Promise.resolve()
            : Promise.reject(
                  new Error(
                      flag === 'business_name'
                          ? __('业务名称和其他库表重复，请修改')
                          : __('技术名称和其他库表重复，请修改'),
                  ),
              )
    } catch (error) {
        formatError(error)
        return Promise.resolve()
    }
}

// 数据表详情配置
// 数据表详情配置
export const excelDetailConfig = [
    {
        label: __('基本属性'),
        list: [
            {
                label: __('库表业务名称'),
                value: '',
                key: 'business_name',
                span: 24,
            },
            {
                label: __('编码'),
                value: '',
                key: 'uniform_catalog_code',
                span: 24,
            },
            {
                label: __('库表技术名称'),
                value: '',
                key: 'technical_name',
                span: 24,
            },
            {
                label: __('描述'),
                value: '',
                key: 'description',
                span: 24,
            },
            {
                label: __('发布状态'),
                value: '',
                key: 'status',
                span: 24,
            },
            {
                label: __('上线状态'),
                value: '',
                key: 'online_status',
                span: 24,
            },
            {
                label: __('所属主题'),
                value: '',
                key: 'subject',
                span: 24,
            },
            {
                label: __('所属部门'),
                value: '',
                key: 'department',
                span: 24,
            },
            {
                label: __('数据Owner'),
                value: '',
                key: 'owner',
                span: 24,
            },
            {
                label: __('数据源名称'),
                value: '',
                key: 'datasource_name',
                span: 24,
            },
            {
                label: __('所属文件'),
                value: '',
                key: 'excel_file_name',
                span: 24,
            },
            {
                label: __('关联信息系统'),
                value: '',
                key: 'info_system',
                span: 24,
            },
        ],
    },
    {
        label: __('数据范围'),
        list: [
            {
                label: __('Sheet页'),
                value: '',
                key: 'sheet',
                span: 24,
            },
            {
                label: __('单元格范围'),
                value: '',
                key: 'cell_range',
                span: 24,
            },
            {
                label: __('库表字段配置'),
                value: '',
                key: 'has_headers',
                span: 24,
            },
            {
                label: __('Sheet名作字段'),
                value: '',
                key: 'sheet_as_new_column',
                span: 24,
            },
        ],
    },
    {
        label: __('其他信息'),
        list: [
            {
                label: __('创建人'),
                value: '',
                key: 'created_by',
                span: 24,
            },
            {
                label: __('创建时间'),
                value: '',
                key: 'created_at',
                span: 24,
            },
            {
                label: __('更新人'),
                value: '',
                key: 'updated_by',
                span: 24,
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
                span: 24,
            },
            {
                label: __('业务数据更新时间'),
                value: '',
                key: 'data_updated_at',
                span: 24,
            },
        ],
    },
]
// 库表字段配置类型
export enum ExcelFieldConfigTypes {
    FirstRow = 1,
    Custom = 0,
}

// 表单字段模板
export const excelFieldTemplate = {
    attribute_id: null,
    attribute_name: '',
    attribute_path: '',
    business_name: '',
    business_timestamp: false,
    classfity_type: null,
    code_table: '',
    code_table_id: '',
    code_table_status: '',
    data_accuracy: null,
    data_length: null,
    data_type: '',
    label_icon: '',
    label_id: '',
    label_name: '',
    label_path: '',
    original_data_type: null,
    standard: '',
    standard_code: '',
    standard_status: '',
    standard_type: '',
    standard_type_name: '',
    technical_name: '',
}

// 表单模板
export const excelFormTemplate = {
    business_name: null,
    data_source_id: '',
    department_id: null,
    description: null,
    end_cell: '',
    excel_fields: [],
    excel_file_name: '',
    has_headers: true,
    owner_id: null,
    sheet: '',
    sheet_as_new_column: false,
    start_cell: null,
    subject_id: null,
    technical_name: null,
}

// 将列字母转换为数字（A->1, B->2, AA->27 等）
export const columnToNumber = (column: string): number => {
    let result = 0
    for (let i = 0; i < column.length; i += 1) {
        result *= 26
        result += column.charCodeAt(i) - 'A'.charCodeAt(0) + 1
    }
    return result
}

// 将单元格引用拆分为列和行
const parseCellReference = (cellRef: string) => {
    const match = cellRef.match(/^([A-Z]+)(\d+)$/)
    if (!match) throw new Error('Invalid cell reference')
    return {
        column: columnToNumber(match[1]),
        row: parseInt(match[2], 10),
    }
}

interface CompareOptions {
    compareRow?: boolean // 是否比较行
    compareColumn?: boolean // 是否比较列
}

export const compareCells = (
    cell1: string,
    cell2: string,
    options: CompareOptions = { compareRow: true, compareColumn: true },
): number => {
    const pos1 = parseCellReference(cell1)
    const pos2 = parseCellReference(cell2)

    // 只比较列
    if (options.compareColumn && !options.compareRow) {
        return pos1.column - pos2.column
    }

    // 只比较行
    if (options.compareRow && !options.compareColumn) {
        return pos1.row - pos2.row
    }

    // 同时比较行列
    if (options.compareRow && options.compareColumn) {
        if (pos1.column !== pos2.column) {
            return pos1.column - pos2.column
        }
        return pos1.row - pos2.row
    }

    return 0 // 都不比较时返回相等
}

// 编码完整
export const encodeComplete = (str: string): string => {
    return encodeURIComponent(str).replace(
        /[!'()*~]/g,

        (c: string) => {
            const encoder = new TextEncoder()
            const bytes = encoder.encode(c)
            return bytes.reduce(
                (acc, byte) =>
                    `${acc}%${byte
                        .toString(16)
                        .padStart(2, '0')
                        .toUpperCase()}`,
                '',
            )
        },
    )
}
