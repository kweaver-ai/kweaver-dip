import __ from './locale'
import { IformItem, SearchType } from '@/ui/LightweightSearch/const'
import { AppCaseItem, SortDirection, SortType } from '@/core'
import { Architecture } from '@/components/BusinessArchitecture/const'
import { orgDeptTitle } from './helper'

export enum OrgType {
    Organization = 0,
    AdministrativeDivision = 1,
    Department = 2,
    Bureau = 3,
}
export const typeOptions = [
    {
        value: OrgType.Organization,
        label: __('组织'),
    },
    {
        value: OrgType.AdministrativeDivision,
        label: __('行政区'),
    },
    {
        value: OrgType.Department,
        label: __('部门'),
    },
    {
        value: OrgType.Bureau,
        label: __('处（科）室'),
    },
]
// 部门：可以改成 部门、行政区、科室
// 行政区：可以改成 部门、行政区
// 科室：可以改成 部门、科室
export const subTypeOptionMap = {
    [Architecture.DEPARTMENT]: typeOptions.filter((item) =>
        [
            OrgType.AdministrativeDivision,
            OrgType.Department,
            OrgType.Bureau,
        ].includes(item.value),
    ),
    [OrgType.AdministrativeDivision]: typeOptions.filter((item) =>
        [OrgType.AdministrativeDivision, OrgType.Department].includes(
            item.value,
        ),
    ),
    [OrgType.Department]: typeOptions.filter((item) =>
        [
            OrgType.AdministrativeDivision,
            OrgType.Department,
            OrgType.Bureau,
        ].includes(item.value),
    ),
    [OrgType.Bureau]: typeOptions.filter((item) =>
        [OrgType.Department, OrgType.Bureau].includes(item.value),
    ),
}
/**
 * 排序方式
 * @param UPDATETIME 'updated_at' 按更新时间排序
 * @param NAME 'name' 按名称排序
 */
export enum CaseSortType {
    UPDATETIME = 'updated_at',
    NAME = 'name',
}

// 排序menu
export const menus = [
    { key: CaseSortType.UPDATETIME, label: __('按更新时间排序') },
    { key: CaseSortType.NAME, label: __('按名称排序') },
]

export const defaultMenu = {
    key: CaseSortType.UPDATETIME,
    sort: SortDirection.DESC,
}

export const departmentFields = [
    { title: __('联系人：'), key: 'contacts' },
    { title: __('部门职责：'), key: 'department_responsibilities' },
    { title: __('文件要求：'), key: 'file' },
]

export const searchData: IformItem[] = [
    {
        label: __('类型'),
        key: 'subtype',
        options: [
            {
                label: __('全部'),
                value: '',
            },
            ...typeOptions.filter(
                (item) => item.value !== OrgType.Organization,
            ),
        ],
        type: SearchType.Radio,
        initLabel: __('查看全部类型'),
    },
]
export const contentTypes = {
    // PDF 文件
    pdf: 'application/pdf',

    // Excel 文件
    xls: 'application/vnd.ms-excel', // Excel 97-2003
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // Excel 2007+

    // Word 文件
    doc: 'application/msword', // Word 97-2003
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // Word 2007+
}
export const mainDeptTips = {
    first: [
        __(
            '1、主部门属性设置不影响用户原来的部门结构。没有特地设定主部门的情况下，可以默认用户所在的直属部门就是其主部门；若设定了用户上上级或上上上级部门为主部门，则提供目录时，目录提供归属方以设定的部门为准，本部门的数据范围也将扩大至设定部门。',
        ),
        __(
            '2、若用户所在的部门有多层级（部门结构如：1/2/3/4/5），且这些层级都被设为了主部门，则以用户在层级上最近的一个部门读取。',
        ),
        // __(
        //     '3、对于一个用户属于2个部门，且这2个部门是上下级关系时，此时用户会有2个直属部门，无论是否有特地设定主部门，都以用户在层级上较上面的一个直属部门读取。',
        // ),
        // __('4、对于用户属于2个部门，且这2个部门不是上下级关系的时：'),
    ],
    second: [
        // __(
        //     '1）对于本部门的数据读取默认可以读取多个部门，和是否特地设定主部门无关。',
        // ),
        // __(
        //     '2）对于提供目录时，目录提供方归属：若都有特地设定主部门或都没有特地设定主部门，则可以选定一个归属；若特定设定了一个主部门，则默认归属于此主部门。',
        // ),
    ],
}
