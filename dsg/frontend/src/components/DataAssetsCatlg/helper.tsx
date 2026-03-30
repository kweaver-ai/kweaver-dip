import { Tooltip } from 'antd'
import React from 'react'
import { isNumber, toNumber, isString } from 'lodash'
import Icon, { InfoCircleOutlined } from '@ant-design/icons'
import classnames from 'classnames'
import {
    DepartmentOutlined,
    DistrictOutlined,
    FontIcon,
    OrganizationOutlined,
    UniqueFlagColored,
} from '@/icons'
import {
    InfoTypeEnum,
    ShareTypeEnum,
    typeOptoins,
    updateCycleOptions as dirUpdateCycleOptions,
} from '../ResourcesDir/const'
import styles from './styles.module.less'
import { ReactComponent as level1 } from '@/assets/DataAssetsCatlg/level1.svg'
import { ReactComponent as level2 } from '@/assets/DataAssetsCatlg/level2.svg'
import { ReactComponent as level3 } from '@/assets/DataAssetsCatlg/level3.svg'
import { ReactComponent as level4 } from '@/assets/DataAssetsCatlg/level4.svg'
import { ReactComponent as icon1 } from '@/assets/DataAssetsCatlg/icon1.svg'

import { ReactComponent as techLevel1 } from '@/assets/DataAssetsCatlg/techLevel1.svg'
import { ReactComponent as techLevel2 } from '@/assets/DataAssetsCatlg/techLevel2.svg'
import { ReactComponent as techLevel3 } from '@/assets/DataAssetsCatlg/techLevel3.svg'

import { ReactComponent as viewCount } from '@/assets/DataAssetsCatlg/viewCount.svg'
import { ReactComponent as applyCount } from '@/assets/DataAssetsCatlg/applyCount.svg'

import { ReactComponent as word } from '@/assets/DataAssetsCatlg/word.svg'
import { ReactComponent as excel } from '@/assets/DataAssetsCatlg/excel.svg'
import { ReactComponent as pdf } from '@/assets/DataAssetsCatlg/pdf.svg'

import { ReactComponent as businessSystem } from '@/icons/svg/outlined/businessSystem.svg'
import { ReactComponent as library } from '@/assets/DataAssetsCatlg/library.svg'
import { ReactComponent as buildTree } from '@/assets/DataAssetsCatlg/buildTree.svg'
import { ReactComponent as userOutlined } from '@/assets/DataAssetsCatlg/userOutlined.svg'

import __ from './locale'
import {
    formatError,
    messageError,
    messageInfo,
    SortDirection,
    IBusinNodeParams,
    IDataCatlgBasicInfo,
    isMicroWidget,
    getSubjectDomain,
    checkRescItemsHavePermission,
    AssetTypeEnum,
    PolicyActionEnum,
} from '@/core'
import { INode } from './AssetGraph/helper'
import { NodeTypes } from './AssetGraph/const'
import { FormatDataTypeToText } from '../DatasheetView/DataQuality/helper'
import DataTypeIcons from '../DimensionModel/components/Icons'
import { formatDataType } from '../DatasheetView/helper'
import { getInnerUrl } from '@/utils'
import { DataRescType } from './ApplicationService/helper'
import { FilterConditionEleType } from './FilterConditionLayout'
import { shareTypeList, ShowUpdateCycleOptions } from '../InfoRescCatlg/const'
import { BusinessDomainType } from '../BusinessDomain/const'
import { IDataCatlgSortType, unCategorizedObj } from './const'
import { SearchType } from '@/ui/LightweightSearch/const'

/**
 * 服务类型
 * @param BUSINESSASSETS   业务对象
 * @param DATACATLG    数据目录
 * @param TECHNOLOGICALASSETS  技术资源
 * @param INDICATORASSETS  指标资源
 * @param APPLICATIONSERVICE  数据资源-接口
 * @param LOGICVIEW  数据资源-库表
 * @param LICENSE  电子证照目录
 */
export enum ServiceType {
    // BUSINESSASSETS = 'businessAssets',
    INFORESOURCESDATACATLG = 'infoResourcesDataCatlg',
    DATACATLG = 'dataCatlg',
    TECHNOLOGICALASSETS = 'technologicalAssets',
    INDICATORASSETS = 'indicatorAssets',
    APPLICATIONSERVICE = 'applicationService',
    LOGICVIEW = 'data_view',
    LICENSE = 'license',
}

export const DataRescToServiceType = {
    [DataRescType.LOGICALVIEW]: ServiceType.LOGICVIEW,
    [DataRescType.INTERFACE]: ServiceType.APPLICATIONSERVICE,
    [DataRescType.INDICATOR]: ServiceType.INDICATORASSETS,
}

/**
 * 服务超市-数据目录
 * @param TAG 标签
 * @param SELECT 下拉框
 * @param CASCADER 多级选择框
 * @param RANGEPICKER 日期范围选择器
 */
export enum FilterConditionDisplayType {
    TAG = 'tag',
    SELECT = 'select',
    CASCADER = 'cascader',
    RANGEPICKER = 'rangePicker ',
}

// 共享条件
export const shareCondition = [
    {
        label: __('无条件共享'),
        value: ShareTypeEnum.UNCONDITION,
    },
    {
        label: __('有条件共享'),
        value: ShareTypeEnum.CONDITION,
    },
    {
        label: __('不予共享'),
        value: ShareTypeEnum.NOSHARE,
    },
]

// 数据资源对应的策略资源类型枚举值对应关系
export const dataRescTypeToAssetType = {
    [DataRescType.LOGICALVIEW]: AssetTypeEnum.DataView,
    [DataRescType.INTERFACE]: AssetTypeEnum.Api,
    [DataRescType.INDICATOR]: AssetTypeEnum.Indicator,
}

// /**
//  * 过滤条件类型
//  */
// export enum FilterConditionEleType {
//     MULTIPLE = 'multiple',
//     RADIO = 'radio',
//     DATE = 'date',
//     // 单选
//     DROPDOWN = 'dropdown',
// }

/**
 * 每一项都对映filterCondition查询参数中的参数名称
 */
export enum FilterConditionType {
    BASICINFO = 'data_kind',
    THEME = 'business_object_id',
    DATARANGE = 'data_range',
    UPDATECYCLE = 'update_cycle',
    SHARE = 'shared_type',
    ORGSTRUCTURE = 'orgcode',
    RESOURCEINFO = 'group_id',
    UPDATETIME = 'data_updated_at',
    RELEASETIME = 'published_at',
    UPDATEAT = 'updated_at',
    ONLINETIME = 'online_at',
    UPDATESORTER = 'data_updated_at',
    DATACOLUMNSORTER = 'table_rows',
    SCORESORTER = '_score',
    BUSINESSPROCESS = 'business_process_ids',
}

export interface IFilterCondition {
    key: string
    type:
        | FilterConditionEleType
        | FilterConditionType
        | FilterConditionDisplayType
    icon?: React.ReactElement
    label: string
    values?: any
    options?: any
    value?: any
    expandAll?: boolean
    showLabel?: string
    open?: boolean
    lock?: any
}

// export const multipleDefaultVal = -1

// export const multipleDefaultItem = (item) => {
//     return {
//         key: null,
//         value: multipleDefaultVal,
//         label: item.label,
//         type: item.type,
//     }
// }

// export const filterDefaultValue = {
//     [FilterConditionEleType.MULTIPLE]: multipleDefaultItem,
//     [FilterConditionEleType.DATE]: {},
// }
// 发布状态
export const resourceStateOptionList = [
    {
        key: 1,
        value: 1,
        label: __('未发布'),
    },
    {
        key: 2,
        value: 2,
        label: __('未上线'),
    },
    {
        key: 3,
        value: 3,
        label: __('已上线'),
    },
]
export const unlimited = { label: __('不限'), value: '', key: '' }

export enum ResourceType {
    DataView = 'data_view',
    Api = 'interface_svc',
    Indicator = 'indicator',
    File = 'file',
}

export const catlogResourceTypeList = [
    {
        label: __('库表'),
        key: ResourceType.DataView,
        value: ResourceType.DataView,
    },
    { label: __('接口'), key: ResourceType.Api, value: ResourceType.Api },
    // { label: __('文件'), key: ResourceType.File, value: ResourceType.File },
]

export const publishStatusList = [
    { label: __('不限'), value: '', key: '' },
    { label: __('未发布'), value: '1', key: '1' },
    { label: __('已发布'), value: '2', key: '2' },
]
export const onlineStatusList = [
    { label: __('不限'), value: '', key: '' },
    { label: __('未上线'), value: '1', key: '1' },
    { label: __('已上线'), value: '2', key: '2' },
]

// 数据目录-筛选条件
export const businFilterConditionConfig: Array<IFilterCondition> = [
    {
        key: 'data_resource_type',
        type: FilterConditionEleType.MULTIPLE,
        open: false,
        label: __('资源类型'),
        expandAll: true,
        options: catlogResourceTypeList,
        value: [],
    },
    // {
    //     key: 'is_publish',
    //     type: FilterConditionEleType.DROPDOWN,
    //     open: false,
    //     label: __('发布状态'),
    //     expandAll: true,
    //     options: publishStatusList,
    //     value: [unlimited],
    // },
    // {
    //     key: 'is_online',
    //     type: FilterConditionEleType.DROPDOWN,
    //     open: false,
    //     label: __('上线状态'),
    //     expandAll: true,
    //     options: onlineStatusList,
    //     value: [unlimited],
    // },
    {
        key: FilterConditionType.THEME,
        type: FilterConditionEleType.THEME,
        open: false,
        label: __('所属业务对象'),
        expandAll: true,
        options: [],
        value: [],
    },
    {
        key: FilterConditionType.UPDATECYCLE,
        type: FilterConditionEleType.MULTIPLE,
        open: false,
        label: __('更新周期'),
        expandAll: true,
        options: dirUpdateCycleOptions,
        value: [],
    },
    {
        key: FilterConditionType.SHARE,
        type: FilterConditionEleType.MULTIPLE,
        open: false,
        label: __('共享属性'),
        expandAll: true,
        options: shareCondition,
        value: [],
    },
    {
        key: FilterConditionType.UPDATEAT,
        type: FilterConditionEleType.DATE,
        label: __('目录更新时间'),
        expandAll: true,
    },
]

export const filterTypeToLwSearchType = {
    [FilterConditionEleType.DROPDOWN]: SearchType.Radio,
    [FilterConditionEleType.MULTIPLE]: SearchType.Checkbox,
    [FilterConditionEleType.DATE]: SearchType.RangePicker,
}

export const filterConditionConfigInit: Array<IFilterCondition> = [
    // {
    //     key: FilterConditionType.BASICINFO,
    //     type: FilterConditionDisplayType.TAG,
    //     icon: <Icon component={basicInfo} />,
    //     label: __('基础信息分类'),
    //     expandAll: true,
    //     values: dataKindOptions,
    // },
    // {
    //     key: FilterConditionType.DATARANGE,
    //     type: FilterConditionDisplayType.TAG,
    //     icon: <Icon component={dataRange} />,
    //     label: __('数据范围'),
    //     expandAll: true,
    //     values: dataRangeOptions,
    // },
    // {
    //     key: FilterConditionType.UPDATECYCLE,
    //     type: FilterConditionDisplayType.TAG,
    //     icon: <Icon component={updateCycle} />,
    //     label: __('更新频率'),
    //     expandAll: true,
    //     values: updateCycleOptions,
    // },
    // {
    //     key: FilterConditionType.SHARE,
    //     type: FilterConditionDisplayType.TAG,
    //     icon: <Icon component={share} />,
    //     label: __('共享条件'),
    //     expandAll: true,
    //     values: shareCondition,
    // },
    // // {
    // //     key: FilterConditionType.ORGSTRUCTURE,
    // //     type: FilterConditionDisplayType.CASCADER,
    // //     icon: <Icon component={orgStructure} />,
    // //     label: __('组织架构'),
    // //     expandAll: true,
    // //     values: [],
    // // },
    // {
    //     key: FilterConditionType.RESOURCEINFO,
    //     type: FilterConditionDisplayType.CASCADER,
    //     icon: <Icon component={rescClassify} />,
    //     label: __('资源分类'),
    //     expandAll: true,
    //     values: [],
    // },
    // {
    //     key: FilterConditionType.UPDATETIME,
    //     type: FilterConditionDisplayType.RANGEPICKER,
    //     icon: <Icon component={updateTime} />,
    //     label: __('更新时间'),
    //     expandAll: true,
    // },
    // {
    //     key: FilterConditionType.RELEASETIME,
    //     type: FilterConditionDisplayType.RANGEPICKER,
    //     icon: <Icon component={releaseTime} />,
    //     label: __('上线时间'),
    //     expandAll: true,
    // },
]
// 信息资源数据目录-筛选条件
export const infoRescFilterConditionConfig: Array<IFilterCondition> = [
    {
        key: FilterConditionType.BUSINESSPROCESS,
        type: FilterConditionEleType.BUSINESSPROCESS,
        open: false,
        label: __('业务流程'),
        expandAll: true,
        options: [],
        value: [],
    },
    {
        key: 'publish_status',
        type: FilterConditionEleType.DROPDOWN,
        open: false,
        label: __('发布状态'),
        expandAll: true,
        options: publishStatusList,
        value: [unlimited],
    },
    {
        key: 'online_status',
        type: FilterConditionEleType.DROPDOWN,
        open: false,
        label: __('上线状态'),
        expandAll: true,
        options: onlineStatusList,
        value: [unlimited],
    },
    {
        key: FilterConditionType.UPDATECYCLE,
        type: FilterConditionEleType.MULTIPLE,
        open: false,
        label: __('更新周期'),
        expandAll: true,
        options: ShowUpdateCycleOptions,
        value: [],
    },
    {
        key: FilterConditionType.SHARE,
        type: FilterConditionEleType.MULTIPLE,
        open: false,
        label: __('共享属性'),
        expandAll: true,
        options: shareTypeList,
        value: [],
    },
    {
        key: FilterConditionType.ONLINETIME,
        type: FilterConditionEleType.DATE,
        label: __('上线时间'),
        expandAll: true,
    },
]
// 默认降序，悬停提示：点击升序；  已是升序，悬停提示：点击取消排序；已是取消排序，悬停提示：点击降序
export const sorterDirectionList = [
    {
        key: SortDirection.DESC,
        tip: __('点击升序'),
    },
    {
        key: SortDirection.ASC,
        tip: __('取消排序'),
    },
    {
        key: SortDirection.NONE,
        tip: __('点击降序'),
    },
]

// 默认排序方式
export const defaultDirection = SortDirection.DESC

/**
 * 排序
 * @param key key对应请求参数filterCondition.orders中的sort参数
 */
export const filetSortConfig = [
    {
        key: FilterConditionType.UPDATESORTER,
        label: __('更新时间'),
        direction: defaultDirection,
    },
    {
        key: FilterConditionType.DATACOLUMNSORTER,
        label: __('数据量'),
        direction: defaultDirection,
    },
]
// 排序方向，枚举：asc：正序；desc：倒序。默认倒序
type DirectionFilterType = SortDirection.DESC | SortDirection.ASC

/**
 * 排序类型
 * _score：按算分排序；
 * data_updated_at：按数据更新时间排序；
 * table_rows：按数据量排序。默认按算分排序
 */
type SortFilterType = '_score' | 'data_updated_at' | 'table_rows'

export interface ITimeAt {
    end_time?: number
    start_time?: number
}

// 统计信息
export interface IStatisticsInfo {
    data_kind_count?: Array<any>
    data_range_count?: Array<any>
    shared_type_count?: Array<any>
    update_cycle_count?: Array<any>
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

export interface IRescBasicInfo {
    code: string
    data_range: number
    description: string
    id: string
    infos: Array<{
        entries: Array<{
            info_key: string
            info_value: string
        }>
        info_type: number
    }>
    orgaddr: string
    orgcode: string
    orgname: string
    orgphone: string
    published_at: number
    res_format: number
    row_count: number
    title: string
    update_cycle: number
    updated_at: number
    open_condition: string | number
}

export const updateTreeData = (
    list: Array<any>,
    id: string,
    children: Array<any>,
): Array<any> =>
    list?.map((node) => {
        const resNode = { ...node }
        if (node.children) {
            return {
                ...resNode,
                children: updateTreeData(node.children, id, children),
            }
        }
        return { ...resNode }
    })

interface IOprTreeData {
    compValue?: string | Array<string>
    keyName?: string
    data: Array<any>
    aimItemPrams?: {}
    level?: number
    otherItemParms?: {}
    allItemParms?: {}
}

/**
 * @param compValue 目录节点比较值值
 * @param keyName 比较对象项的名称
 * @param data 目录data
 * @param aimItemPrams 匹配 keyName 值为参数 compValue 的节点并向其中加上aimItemPrams
 * @param otherItemParms 不匹配 keyName 值为参数 compValue 的节点并向其中加上otherItemParms
 * @param allItemParms 所有节点都加上 allItemParms
 * @returns
 */
export const oprTreeData = (oParams: IOprTreeData) => {
    const {
        compValue,
        keyName,
        data,
        aimItemPrams,
        level,
        otherItemParms,
        // allItemParms,
    } = oParams
    data?.forEach((item: any) => {
        if (
            compValue &&
            keyName &&
            item[keyName] &&
            (item[keyName] === compValue || compValue?.includes(item[keyName]))
        ) {
            Object.assign(item, aimItemPrams)
        } else if (otherItemParms) {
            Object.assign(item, otherItemParms)
        }

        if (level) {
            Object.assign(item, { level })
        }

        if (item.children) {
            oprTreeData({
                ...oParams,
                data: item.children,
                level: level ? level + 1 : level,
            })
        }
    })
    return data
}

// 通过key获取目录
export const findTreeNodeByKey = (
    key: string,
    keyName: string,
    data: Array<any>,
) => {
    let dir
    data?.forEach((item: any) => {
        if (item[keyName] === key) {
            dir = item
        } else if (item.children) {
            const res = findTreeNodeByKey(key, keyName, item.children)
            if (res) {
                dir = res
            }
        }
    })
    return dir
}

// 通过key获取目录树
/**
 *
 * @param value 搜索关键词
 * @param key  搜索节点项的key
 * @param arr Array 搜索数组
 * @returns
 */
export const searchNodesByKey = (
    value: string,
    key: string,
    arr: Array<any>,
) => {
    const newarr: Array<any> = []
    arr.forEach((element) => {
        let node: any
        let redata: any
        let obj: any

        if (new RegExp(value, 'gi').test(element[key])) {
            node = element
        }
        if (element.children && element.children.length > 0) {
            redata = searchNodesByKey(value, key, element.children)
        }

        // 本身匹配或者子孙元素有匹配的
        if (node?.name || redata?.length) {
            obj = {
                ...element,
                children: redata || [],
                isExpand: true,
            }
            newarr.push(obj)
        }
    })
    return newarr
}

/**
 * 传入两个参数
 * @param str 目标字符串（需要被筛选的字符串）
 * @param keyword 筛选条件（筛选需要高亮的字符串）
 * @returns 返回处理后字符串
 */
export const highLight = (
    str: string,
    keyword: string,
    hlClassName?: string,
    hlStyle?: string,
) => {
    if (!keyword) return str
    const pattern = new RegExp(
        keyword.replace(/[.[*?+^$|()/]|\]|\\/g, '\\$&'),
        'gi',
    )
    return str?.replace(
        pattern,
        `<span class=${hlClassName} style=${hlStyle}>$&</span>`,
    )
}

export interface IObject {
    id: string
    name: string
    type: string
    path: string
    path_id: string
    children?: Array<IObject>
}

/**
 * @description 将列表转为树结构
 * @param list 列表
 * @param idKey 表示节点id的对应key的名称
 * @returns
 */
export const listToTree = (list: Array<any>, idKey: string) => {
    const map = {}

    const treeData: Array<any> = []

    for (let i = 0; i < list.length; i += 1) {
        const node1 = list[i]

        map[node1[idKey]] = i
        node1.children = []
    }

    for (let i = 0; i < list.length; i += 1) {
        const node2 = list[i]
        const pidArr = node2.path_id.split('/')
        const pid = pidArr[pidArr.length - 2] || ''
        if (pid && pid !== node2[idKey] && list[map[pid]]) {
            list[map[pid]].children.push(node2)
        } else {
            treeData.push(node2)
        }
    }
    return treeData
}

/**
 * @param BUSINESS  业务视角
 * @param ORGNIZATION   组织视角
 * @param TECHNOLOGY    技术视角
 */
export enum ViewType {
    // BUSINESS = 'business',
    // ORGNIZATION = 'orginization',
    // TECHNOLOGY = 'technology',
    BUSINESS = 1,
    ORGNIZATION = 2,
    TECHNOLOGY = 3,
}

// 根据视角不同,目录列表查询参数节点id名称对应关系
export const ViewTypeListQueryParamIdKey = {
    [ViewType.BUSINESS]: 'business_object_id',
    [ViewType.ORGNIZATION]: 'orgcode',
    [ViewType.TECHNOLOGY]: 'info_system_id',
}

// 视角
export const viewOptionList = [
    // {
    //     // label: __('业务视角'),
    //     label: __('主题域'),
    //     value: ViewType.BUSINESS,
    // },
    {
        // label: __('组织视角'),
        label: __('组织架构'),
        value: ViewType.ORGNIZATION,
    },
    {
        // label: __('技术视角'),
        label: __('信息系统'),
        value: ViewType.TECHNOLOGY,
    },
]

// ai列表项参数-暂不显示（图标等需要显示的时候再修改）
export const aiOtherInfo = [
    {
        infoKey: 'tableName',
        title: <Icon component={level1} className={styles.commonIcon} />,
    },
    {
        infoKey: 'dataBaseName',
        title: <Icon component={level1} className={styles.commonIcon} />,
    },
    {
        infoKey: 'orgName',
        title: <Icon component={level1} className={styles.commonIcon} />,
    },
]

// 业务逻辑实体列表项参数
export const itemOtherInfo = [
    {
        infoKey: 'published_at',
        type: 'timestamp',
        title: `${__('更新于')} `,
    },
    {
        infoKey: 'system_name',
        title: (
            <Icon
                component={businessSystem}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('信息系统')}：`,
    },
    {
        infoKey: 'data_source_name',
        title: (
            <Icon
                component={library}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('数据源')}：`,
    },
    {
        infoKey: 'schema_name',
        title: (
            <Icon
                component={buildTree}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('Schema')}：`,
    },
    {
        infoKey: 'owner_name',
        title: (
            <Icon
                component={userOutlined}
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('数据Owner')}：`,
    },
    {
        infoKey: 'orgname',
        title: (
            <DepartmentOutlined
                className={styles.commonIcon}
                style={{ fontSize: 16 }}
            />
        ),
        toolTipTitle: `${__('所属部门')}：`,
    },
]

export interface INodeType {
    id: string
    name: string
    level: number
    children?: INodeType[]
    isExpand?: boolean
}

// 文件类型
export enum FileType {
    WORD = 'Word',
    EXCEL = 'Excel',
    PDF = 'PDF',
}

// 视角节点IconList
// 1-业务视角   2-组织视角  3-技术视角
export const ViewIconList = {
    1: {
        1: <Icon component={level1} className={styles.level1} />,
        2: <Icon component={level2} className={styles.level2} />,
        3: <Icon component={level3} className={styles.level3} />,
        4: <Icon component={level4} className={styles.level4} />,
    },
    2: {
        1: <DistrictOutlined style={{ color: '#3A8FF0', fontSize: 16 }} />,
        2: <OrganizationOutlined style={{ color: '#3A8FF0', fontSize: 16 }} />,
        3: <DepartmentOutlined style={{ color: '#3A8FF0', fontSize: 16 }} />,
    },
    3: {
        1: (
            <Icon
                component={techLevel1}
                style={{ color: '#3A8FF0', fontSize: 16 }}
            />
        ),
        2: (
            <Icon
                component={techLevel2}
                style={{ color: '#3A8FF0', fontSize: 16 }}
            />
        ),
        3: (
            <Icon
                component={techLevel3}
                style={{ color: '#3A8FF0', fontSize: 16 }}
            />
        ),
    },
    fileIcon: {
        [FileType.WORD]: <Icon component={word} />,
        [FileType.EXCEL]: <Icon component={excel} />,
        [FileType.PDF]: <Icon component={pdf} />,
    },
}

export const sorterBusinDirectionList = [
    {
        key: SortDirection.DESC,
        tip: __('点击升序'),
    },
    {
        key: SortDirection.ASC,
        tip: __('点击降序'),
    },
]

/**
 * 排序
 * @param key key对应请求参数filterCondition.orders中的sort参数
 */
export const businessAssetsSortConfig = [
    {
        key: 'updated_at',
        label: __('数据更新时间'),
        direction: defaultDirection,
    },
]

/**
 * 业务对象域数据目录整合-查询目录列表参数
 * @param statistics 是否返回统计信息，若body参数中next_flag存在，则该参数无效（不会返回统计信息）
 * @param business_object_id string 业务对象ID，用于左侧业务域树筛选
 * @param info_system_id string 信息系统ID，用于左侧信息系统列表筛选
 * @param group_id 资源分类ID <=6 items
 * @param orgcode 组织架构ID <=6 items
 * @param next_flag 从该flag标志后获取数据，该flag标志由上次的搜索请求返回，若本次与上次的搜索参数存在变动，则该参数不能传入，否则结果不准确
 * @param orders 排序，没有keyword时默认以data_updated_at desc & table_rows desc排序，有keyword时默认以_score desc排序
 * @param size 不传默认20
 */
export interface IBusinessAssetsFilterQuery {
    statistics?: boolean
    business_object_id?: string
    data_kind?: Array<number>
    info_system_id?: string
    keyword?: string
    next_flag?: Array<string>
    orgcode?: Array<string>
    published_at?: {
        end_time?: number
        start_time?: number
    }
    // 目录开始更新时间
    start_update_time?: number | string
    // 目录结束更新时间
    end_update_time?: number | string
    // 仅挂接文件资源的目录
    only_file_resource?: boolean
    shared_type?: Array<number>
    size?: number
    update_cycle?: Array<number>
    // 不传该参数时：没有keyword时默认以online_at desc & update desc排序，有keyword时默认以_score desc排序
    orders?: Array<{
        sort: IDataCatlgSortType
        direction: SortDirection.ASC | SortDirection.DESC
    }>
}

export const businessAssetsFilterInit: IBusinessAssetsFilterQuery = {
    data_kind: [],
    // keyword: '',
    shared_type: [],
    size: 20,
    update_cycle: [],
    // orders: [
    //     {
    //         sort: IDataCatlgSortType.UPDATETIME,
    //         direction: SortDirection.DESC,
    //     },
    // ],
}

// 左侧视角-树结构搜索初始值
export const businTreeFilterInit: IBusinNodeParams = {
    category_type: ViewType.ORGNIZATION,
    keyword: '',
}

// 业务对象
export interface IBusinessObject {
    id: string
    name: string
    description?: string
    system_id?: string
    system_name?: string
    data_source_id?: string
    data_source_name?: string
    schema_id?: string
    schema_name?: string
    orgcode?: string
    orgname?: string
    updated_at: number
}

/**
 * 数据资源目录详情tab
 * BASIC   基本信息
 * COLUMN  列属性
 * ABSTRACT    摘要信息
 * FILEINFO   文件信息
 * FIELDINFO   字段信息
 * SAMPLTDATA  样例数据
 * FILEDATA  文件数据
 * CONSANGUINITYANALYSIS   数据血缘
 * QUALITY 数据质量
 * DATASERVICE 数据服务
 * CHANGEINFO  变更信息
 * UNDSREPORT  理解报告
 */
export enum DataCatlgTabKey {
    ABSTRACT = 'abstract',
    FILEINFO = 'file_info',
    FIELDINFO = 'filed_info',
    SAMPLTDATA = 'sample_data',
    FILEDATA = 'file_data',
    CONSANGUINITYANALYSIS = 'consanguinity_anylysis',
    QUALITY = 'quality',
    DATASERVICE = 'data_service',
    CHANGEINFO = 'change_info',
    UNDSREPORT = 'unds_report',
    DATAPREVIEW = 'data_preview',
    RELATEDCATALOG = 'RelatedCatalog',
    IMPACTANALYSIS = 'impactAnalysis',
}

// 业务对象-详情-基本信息
export const catlgBasicInfoConfig = [
    {
        label: __('编码'),
        colSpan: 24,
        key: 'code',
    },
    {
        label: __('基础分类信息'),
        colSpan: 24,
        key: 'data_kind',
    },
    {
        label: __('更新周期'),
        colSpan: 24,
        key: 'update_cycle',
    },
    {
        label: __('上线时间'),
        colSpan: 24,
        key: 'published_at',
    },
    {
        label: __('共享属性'),
        colSpan: 24,
        key: 'shared_type',
    },
    {
        label: __('共享条件'),
        colSpan: 24,
        key: 'shared_condition',
    },
    {
        label: __('接口服务'),
        colSpan: 24,
        key: 'services',
    },
]

// 业务对象-详情-接口信息
export const businBasicServices = [
    {
        label: __('接口服务'),
        colSpan: 24,
        key: 'services',
    },
]

// 样例数据类型
export enum SampleType {
    DEFAULT = 'default',
    AI = 'ai',
}

export const SampleTypeList = {
    [SampleType.DEFAULT]: 1,
    [SampleType.AI]: 2,
}

export enum RescErrorCodeList {
    NOTEXISTED = 'DataCatalog.Public.ResourceNotExisted',
    PUBLISHDISABLED = 'DataCatalog.Public.ResourcePublishDisabled',
    SHAREDISABLED = 'DataCatalog.Public.ResourceShareDisabled',
    OPENDISABLED = 'DataCatalog.Public.ResourceOpenDisabled',
    ASSETSOFFLINEERROR = 'DataCatalog.Public.AssetOfflineError',
    DATASOURCENOTFOUND = 'DataCatalog.Public.DataSourceNotFound',
}

// 目录错误code集
export const errorCodeList = {
    [RescErrorCodeList.NOTEXISTED]: __('当前目录已被删除，请查看其他目录'),
    [RescErrorCodeList.PUBLISHDISABLED]: __(
        '当前目录暂不支持在数据资源目录中查看，请查看其他目录',
    ),
    [RescErrorCodeList.SHAREDISABLED]: __('当前目录不再共享，请查看其他目录'),
    [RescErrorCodeList.OPENDISABLED]: __('当前目录不再开放，请查看其他目录'),
    [RescErrorCodeList.DATASOURCENOTFOUND]: __('挂接资源不存在'),
}

export const formatCatlgError = (error: any, callback?: any) => {
    let errMsg = ''

    const { code, description } = error?.data || {}
    // 资源下线-蓝色提示
    if (code === RescErrorCodeList.ASSETSOFFLINEERROR) {
        messageInfo(description)
        callback?.(error)
        return
    }
    if (isString(code) && errorCodeList[code]) {
        errMsg = errorCodeList[code]
    }
    if (errMsg) {
        messageError(errMsg)
        callback?.(error)
        return
    }

    formatError(error)
}

export const SubTitle: React.FC<{
    text: string
    showIcon?: boolean
    className?: any
}> = ({ text, showIcon = true, className = '' }) => (
    <div className={styles.dq_subTitleWrapper}>
        {showIcon && <Icon component={icon1} className={styles.icon} />}
        <div className={classnames(styles.title, className)}>{text}</div>
    </div>
)

/**
 * 数据服务脱敏策略
 */
export enum Desensitization {
    plaintext = 'plaintext',
    hash = 'hash',
    override = 'override',
    replace = 'replace',
}

/**
 * 数据服务脱敏策略释义
 */
export const desensitizationText = {
    [Desensitization.plaintext]: __('无'),
    [Desensitization.hash]: __('哈希'),
    [Desensitization.override]: __('覆盖'),
    [Desensitization.replace]: __('替换'),
}
export interface IStatisticsConfig {
    key: string
    icon: React.ReactElement
    label: string
}

// 业务对象-详情-统计信息
export const bsinsAbstractStaticsConfig: Array<IStatisticsConfig> = [
    // {
    //     label: __('数据量'),
    //     key: 'row_count',
    //     icon: (
    //         <Icon component={assetsDataVolumn} className={styles.staticsIcon} />
    //     ),
    // },
    {
        label: __('访问量'),
        key: 'preview_count',
        icon: <Icon component={viewCount} className={styles.staticsIcon} />,
    },
    // {
    //     label: __('评分数'),
    //     key: 'score_count',
    //     icon: <Icon component={scoreCount} />,
    // },
    {
        label: __('下载申请数'),
        key: 'apply_count',
        icon: <Icon component={applyCount} className={styles.staticsIcon} />,
    },
]

// 下载权限申请有效期
export const expirationDateOption = [
    {
        label: __('7天'),
        value: 7,
    },
    {
        label: __('15天'),
        value: 15,
    },
    {
        label: __('30天'),
        value: 30,
    },
]

// 置顶
export const goBackTop = (eleId: string) => {
    document.body.scrollTop = 0
    document.documentElement.scrollTop = 0
    const layout = document.getElementById(eleId)

    if (layout?.scrollTop) {
        layout.scrollTop = 0
    } else {
        layout?.scrollTo(0, 0)
    }
}

// 详情-字段信息
export const filedInfoColumns = [
    {
        title: '信息项名称',
        dataIndex: 'name_cn',
        key: 'name_cn',
        // ellipsis: true,
        width: 185,
        render: (text, record) => {
            return (
                <span title={text} className={styles.fieldName}>
                    <span
                        className={classnames(
                            styles.name,
                            record.primary_flag === 1 && styles.hasIcon,
                        )}
                    >
                        {text || '--'}
                    </span>
                    {record.primary_flag === 1 && (
                        <UniqueFlagColored className={styles.filedTypeIcon} />
                    )}
                </span>
            )
        },
    },
    {
        title: '字段技术名称',
        dataIndex: 'name_en',
        key: 'name_en',
        // ellipsis: true,
        editable: true,
        width: 185,
        render: (text) => {
            return <span title={text}>{text || '--'}</span>
        },
    },
    {
        title: '数据类型',
        dataIndex: 'data_format',
        key: 'data_format',
        // ellipsis: true,
        editable: true,
        width: 120,
        render: (val) => {
            const text =
                typeOptoins.find((item) => item.value.toString() === val)
                    ?.label || ''
            return <span title={text}>{text || '--'}</span>
        },
    },
    {
        title: '数据长度',
        dataIndex: 'data_length',
        key: 'data_length',
        // ellipsis: true,
        width: 120,
        editable: true,
        render: (text) => {
            const value = toNumber(text) || 0
            const content = isNumber(value) ? `${value}` : '--'
            return <span title={content}>{content}</span>
        },
    },
    // {
    //     title: '业务定义',
    //     dataIndex: 'business_def',
    //     key: 'business_def',
    //     ellipsis: true,
    //     render: (text) => text || '--',
    // },
    // {
    //     title: '业务规则',
    //     dataIndex: 'business_rule',
    //     key: 'business_rule',
    //     ellipsis: true,
    //     render: (text) => text || '--',
    // },
    {
        title: (
            <div className={styles.fieldDesc}>
                <span>描述</span>
                <Tooltip
                    title={__('以下内容由AI数据理解生成')}
                    placement="bottom"
                    getPopupContainer={(n) => n}
                    overlayClassName={styles.toolTip}
                >
                    <InfoCircleOutlined className={styles.infoIcon} />
                </Tooltip>
            </div>
        ),
        dataIndex: 'ai_description',
        key: 'ai_description',
        // ellipsis: true,
        width: 556,
        render: (text) => {
            return <div>{text || '--'}</div>
        },
    },
]

const arrayToList = (arr) => {
    return arr.reduce(
        (prev, cur) =>
            prev ? { ...cur, children: [{ ...prev }] } : { ...cur },
        null,
    )
}

export const generatGraphData = (
    res: IDataCatlgBasicInfo,
    name: string,
): INode => {
    const gD: INode = {
        id: 'root',
        name,
        type: NodeTypes.data_asset,
        children: [],
    }
    if (res.business_object_path?.length > 0) {
        const objArr = res.business_object_path.map((item) => {
            return {
                id: item[item.length - 1]?.id,
                name: item[item.length - 1]?.name,
                type: NodeTypes.business_obj,
                // item[item.length - 1].type ||
                path: item,
            }
        })
        const objList = arrayToList(objArr)
        if (gD.children) {
            gD.children.push(objList)
        }
    }
    if (gD.children) {
        if (res.owner_name) {
            gD.children.push({
                id: res.owner_id,
                name: res.owner_name,
                type: NodeTypes.owner,
            })
        }
        if (res.orgname) {
            gD.children.push({
                id: res.orgcode,
                name: res.orgname,
                type: NodeTypes.department,
            })
        }
        const infoSystem = res.infos?.find(
            (item) => item.info_type === InfoTypeEnum.ASSOCIATEDSYSTEM,
        )?.entries
        if (infoSystem && infoSystem?.length > 0) {
            gD.children.push({
                id: infoSystem[0].info_key,
                name: infoSystem[0].info_value,
                type: NodeTypes.info_system,
            })
        }

        const tagArr = res.infos?.find(
            (item) => item.info_type === InfoTypeEnum.TAG,
        )?.entries

        if (tagArr) {
            const tagList = arrayToList(
                tagArr.map((tag) => {
                    return {
                        id: tag.info_key,
                        name: tag.info_value,
                        type: NodeTypes.asset_tag,
                    }
                }),
            )
            gD.children.push(tagList)
        }
        if (res.data_source_name) {
            gD.children.push({
                id: res.data_source_id,
                name: res.data_source_name,
                type: NodeTypes.data_source,
            })
        }
        if (res.schema_name) {
            gD.children.push({
                id: res.schema_id,
                name: res.schema_name,
                type: NodeTypes.schema,
            })
        }
        if (res?.catalog_api?.length) {
            const objArr = res.catalog_api.map((item) => {
                return {
                    id: item?.catalog_id,
                    name: item?.catalog_name,
                    type: NodeTypes.api,
                }
            })
            const objList = arrayToList(objArr)
            gD.children.push(objList)
        }
    }

    return gD
}

export const formViewFieldRender = (field: any) => {
    const {
        business_name,
        data_type,
        primary_key,
        label_icon,
        label_id,
        label_name,
        label_path,
    } = field
    const type = formatDataType(data_type)

    return (
        <div className={styles['item-wrapper']}>
            <Tooltip
                title={
                    <span
                        style={{ color: 'rgba(0,0,0,0.85)', fontSize: '12px' }}
                    >
                        {FormatDataTypeToText(data_type)}
                    </span>
                }
                placement="top"
                color="#fff"
            >
                <div>
                    <DataTypeIcons type={type} />
                </div>
            </Tooltip>
            <div className={styles['item-wrapper-title']}>
                <div
                    title={business_name}
                    className={styles['item-wrapper-title-text']}
                >
                    {business_name}
                </div>
                {primary_key && (
                    <div className={styles['item-wrapper-title-tag']}>
                        {__('主键')}
                    </div>
                )}
                <div
                    className={styles.label}
                    hidden={
                        !(label_icon || label_id || label_name || label_path)
                    }
                >
                    <Tooltip
                        title={
                            <div className={styles['label-tip']}>
                                <span>数据分级:</span> {label_path || '--'}
                            </div>
                        }
                        showArrow={false}
                        overlayClassName={styles['field-label']}
                    >
                        <FontIcon
                            name="icon-biaoqianicon"
                            style={{ color: label_icon }}
                        />
                    </Tooltip>
                </div>
            </div>
        </div>
    )
}

export const fieldsSortByPrimaryKey = (field: any[]) => {
    const primaryFields = field.filter((item) => item.primary_key) || []
    const otherFields = field.filter((item) => !item.primary_key)
    return [...primaryFields, ...otherFields]
}

/**
 * 样例数据是否需要传 user_id
 */
export const getIsNeedPermisControl = (microWidgetProps: any) => {
    // 服务超市作为AS插件时，不需要传user_id
    if (isMicroWidget({ microWidgetProps })) {
        return false
    }

    // 2.0.0.3版本，非首页、资产全景、服务超市引用详情-样例数据都需要传userid
    return !['/asset-view', '/asset-center', '/data-assets'].some((item) =>
        getInnerUrl(window.location.pathname).includes(item),
    )
}

export const getMoreInfoData = (item: any) => {
    if (!item) return {}
    const {
        online_at,
        data_resource_type,
        cate_info,
        scoreInfo,
        mount_data_resources,
    } = item
    const department = cate_info?.find(
        (it) => it.cate_id === '00000000-0000-0000-0000-000000000001',
    )
    const system = cate_info?.find(
        (it) => it.cate_id === '00000000-0000-0000-0000-000000000002',
    )
    return {
        online_at,
        data_resource_type,
        department,
        department_name: department?.node_name,
        system,
        system_name: system?.node_name,
        subject_domain_name: item?.subject_info
            ?.map((it) => it.name)
            ?.join('，'),
        scoreInfo,
        mount_data_resources,
    }
}

// 搜索所有L2、L3主题域
export const getAllL2_3Domains = async () => {
    try {
        const domain = await getSubjectDomain({
            offset: 1,
            limit: 2000,
            // type: [
            //     BusinessDomainType.subject_domain,
            //     BusinessDomainType.business_object,
            // ].join(','),
            type: BusinessDomainType.subject_domain,
            is_all: true,
        })
        const businObjectRes = await getSubjectDomain({
            offset: 1,
            limit: 2000,
            type: BusinessDomainType.business_object,
            is_all: true,
        })
        const businObject = {}
        businObjectRes?.entries?.forEach((item) => {
            const path = item.path_id.split('/')
            if (businObject[path[1]]) {
                businObject[path[1]].push(item)
            } else {
                businObject[path[1]] = [item]
            }
        })
        const data = [...domain.entries, unCategorizedObj].map((item) => {
            return {
                ...item,
                label: item.name,
                key: item.id,
                value: item.id,
                children: businObject[item.id] || [],
            }
        })

        // setBusinThemeList(data)
        return data
    } catch (error) {
        formatError(error)
        return []
    }
}

// 检查资源是否配置启用的审核策略
export const checkAuditPolicyPermis = async (
    originList: Array<any>,
    fieldNames: { id: string; type: string } = { id: 'id', type: 'type' },
) => {
    try {
        if (!originList?.length) return []
        const ids = originList?.map((item) => item[fieldNames?.id])
        // 查询资源是否有审核策略
        const auditPolicyRes = await checkRescItemsHavePermission(ids)
        // 内置策略是否设置
        const buildInAuditPolicy = {
            [DataRescType.LOGICALVIEW]:
                auditPolicyRes.data_view_has_built_in_audit,
            [DataRescType.INDICATOR]:
                auditPolicyRes.indicator_has_built_in_audit,
            [DataRescType.INTERFACE]:
                auditPolicyRes.interface_svc_has_built_in_audit,
        }
        // 自定义策略是否设置
        const customAuditPolicy = {
            [DataRescType.LOGICALVIEW]:
                auditPolicyRes.data_view_has_customize_audit,
            [DataRescType.INDICATOR]:
                auditPolicyRes.indicator_has_customize_audit,
            [DataRescType.INTERFACE]:
                auditPolicyRes.interface_svc_has_customize_audit,
        }

        const newListDataTemp = originList?.map((item: any) => {
            const type = item[fieldNames?.type]
            const id = item[fieldNames?.id]
            return {
                ...item,
                // 是否设置了启用内置策略
                hasInnerEnablePolicy: buildInAuditPolicy[type],
                // 是否同类型资源有启用策略
                hasCustomEnablePolicy: customAuditPolicy[type],
                // item.hasAuditPolicy 为true：当前资源设置了启用策略（内置启用或启用自定义策略选了当前资源），可申请权限申请
                hasAuditEnablePolicy:
                    buildInAuditPolicy[type] ||
                    (customAuditPolicy[type] &&
                        auditPolicyRes?.resources?.find(
                            (rItem) => rItem.id === id,
                        )?.has_audit),
            }
        })
        return newListDataTemp
    } catch (e) {
        formatError(e)
        return []
    }
}

export const expeditionQualityGrade = (data: any) => {
    const noExpedition = !data?.has_quality_report
    const uniqueness_score = Math.round(data.uniqueness_score * 100) || 0
    const accuracy_score = Math.round(data.accuracy_score * 100) || 0
    const standardization_score =
        Math.round(data.standardization_score * 100) || 0
    const completeness_score = Math.round(data.completeness_score * 100) || 0
    const items = [
        {
            label: __('唯一性'),
            key: 'uniqueness_score',
            value: data.uniqueness_score === null ? '--' : uniqueness_score,
            color:
                uniqueness_score < 60
                    ? 'red'
                    : uniqueness_score <= 80
                    ? 'yellow'
                    : 'green',
        },
        {
            label: __('准确性'),
            key: 'accuracy_score',
            value: data.accuracy_score === null ? '--' : accuracy_score,
            color:
                accuracy_score < 60
                    ? 'red'
                    : accuracy_score <= 80
                    ? 'yellow'
                    : 'green',
        },
        {
            label: __('规范性'),
            key: 'standardization_score',
            value:
                data.standardization_score === null
                    ? '--'
                    : standardization_score,
            color:
                standardization_score < 60
                    ? 'red'
                    : standardization_score <= 80
                    ? 'yellow'
                    : 'green',
        },
        {
            label: __('完整性'),
            key: 'completeness_score',
            value: data.completeness_score === null ? '--' : completeness_score,
            color:
                completeness_score < 60
                    ? 'red'
                    : completeness_score <= 80
                    ? 'yellow'
                    : 'green',
        },
    ]
    return noExpedition ? (
        <span style={{ color: 'rgb(107 121 141 / 65%)' }}>
            {__('无质量报告')}
        </span>
    ) : (
        <span className={styles.gradeBox}>
            {items.map((o) => (
                <span key={o.key} className={styles.gradeItem}>
                    {o.label}:<span className={styles[o.color]}>{o.value}</span>
                </span>
            ))}
        </span>
    )
}
