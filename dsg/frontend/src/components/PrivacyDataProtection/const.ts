import { title } from 'process'
import __ from './locale'
import { SortDirection } from '@/core'

export enum OperateType {
    View = 'view',
    Details = 'details',
    Eidt = 'edit',
    Delete = 'delete',
}

export const menus = [
    { key: 'name', label: __('按库表业务名称排序') },
    { key: 'created_at', label: __('按策略创建时间排序') },
    { key: 'updated_at', label: __('按策略更新时间排序') },
]
export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}
export const titleTipsText = [
    __(
        '1、隐私数据保护可以对隐私数据进行脱敏，用户查询库表的隐私数据时，会展示脱敏后的数据，未设置策略的表不受影响。',
    ),
    __('脱敏示例：'),
    'img',
    // __(
    //     '2、库表通过保护策略脱敏后的数据，基于该库表衍生出来的数据（如衍生新库表、指标、接口等），此类数据也会做脱敏展示。',
    // ),
    __(
        '2、策略作用范围：对库表信息有管理权限的用户仍然可以正常查询数据以及做相关的管理操作。',
    ),
]
export const detailsInfo = [
    {
        key: 'basic',
        title: __('策略应用对象信息'),
        list: [
            { label: __('库表名称'), key: 'business_name', value: '' },
            { label: __('库表编码'), key: 'uniform_catalog_code', value: '' },
            { label: __('库表技术名称'), value: '', key: 'technical_name' },
            { label: __('所属业务对象'), value: '', key: 'subject' },
            {
                label: __('库表所属部门'),
                value: '',
                key: 'department',
            },
        ],
        hasDetailsBtn: true,
    },
    {
        key: 'desc',
        title: __('策略描述'),
        list: [{ label: __('策略描述'), key: 'description', value: '' }],
    },
    {
        key: 'config',
        title: __('脱敏配置'),
        list: [],
    },
    {
        key: 'updateInfo',
        title: __('策略更新信息'),
        list: [
            {
                label: __('创建人'),
                value: '',
                key: 'created_by_user',
            },
            {
                label: __('创建时间'),
                value: '',
                key: 'created_at',
            },
            {
                label: __('更新人'),
                value: '',
                key: 'updated_by_user',
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
            },
        ],
    },
]
export const desensitizationModeTipsText = [
    { title: __('全部脱敏'), content: __('数据全部替换为*，示例：**********') },
    {
        title: __('首尾脱敏'),
        content: __('首尾内容替换为*，中间内容可正常展示，示例：***4567***'),
    },
    {
        title: __('中间脱敏'),
        content: __('中间内容替换为*，首尾内容可正常展示，示例：123****890'),
    },
]

export enum DesensitizationMode {
    ALL = 'all',
    HEAD_TAIL = 'head-tail',
    MIDDLE = 'middle',
}

export const desensitizationModeList = [
    {
        label: __('全部脱敏'),
        value: DesensitizationMode.ALL,
    },
    {
        label: __('首尾脱敏'),
        value: DesensitizationMode.HEAD_TAIL,
    },
    {
        label: __('中间脱敏'),
        value: DesensitizationMode.MIDDLE,
    },
]
