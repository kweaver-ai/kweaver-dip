import __ from './locale'
import { SortDirection } from '@/core'

export enum OperateType {
    View = 'view',
    Details = 'details',
    Eidt = 'edit',
    Delete = 'delete',
}

export const menus = [
    { key: 'form_view_name', label: __('按库表业务名称排序') },
    { key: 'created_at', label: __('按策略创建时间排序') },
    { key: 'updated_at', label: __('按策略更新时间排序') },
]
export const defaultMenu = {
    key: 'updated_at',
    sort: SortDirection.DESC,
}
export const titleTipsText = [
    __(
        '1、通过白名单策略，可以自动过滤掉指定表内（库表）的敏感数据信息，被过滤的数据禁止查询/下载/校核，未设置策略的表不受影响。',
    ),
    // __(
    //     '2、库表通过白名单策略过滤掉的数据，基于该库表衍生出来的数据（如衍生新库表、指标、接口等），此类数据也禁止查询/下载/校核。',
    // ),
    __(
        '2、策略作用范围：对库表信息有管理权限的用户（例如：数据运营工程师）仍然可以正常查询数据以及做相关的管理操作，但不能下载，其他用户禁止查询/下载/校核。',
    ),
]
export const detailsInfo = [
    {
        key: 'basic',
        title: __('策略应用对象信息'),
        list: [
            { label: __('库表名称'), key: 'form_view_name', value: '' },
            { label: __('库表编码'), key: 'form_view_code', value: '' },
            { label: __('库表所属主题'), value: '', key: 'subject_name' },
            {
                label: __('库表所属部门'),
                value: '',
                key: 'department_name',
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
        key: 'updateInfo',
        title: __('策略更新信息'),
        list: [
            {
                label: __('创建人'),
                value: '',
                key: 'created_by_name',
            },
            {
                label: __('创建时间'),
                value: '',
                key: 'created_at',
            },
            {
                label: __('更新人'),
                value: '',
                key: 'updated_by_name',
            },
            {
                label: __('更新时间'),
                value: '',
                key: 'updated_at',
            },
        ],
    },
]
