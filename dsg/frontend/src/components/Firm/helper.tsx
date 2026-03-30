import { ExclamationCircleFilled } from '@ant-design/icons'
import dataEmpty from '@/assets/dataEmpty.svg'
import { SortDirection, SortType } from '@/core'
import { Empty, Loader } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import __ from './locale'

/**
 * 厂商名录菜单
 */
export enum FirmMenuEnum {
    // 厂商名录管理
    List = 'list',
}

/**
 * 厂商名录操作
 */
export enum FirmOperate {
    // 编辑
    Edit = 'Edit',
    // 删除
    Delete = 'Delete',
}

export const FirmTabMap = {
    [FirmMenuEnum.List]: {
        title: __('厂商名录管理'),

        // 表格列名
        columnKeys: [
            'name',
            'uniform_code',
            'legal_represent',
            'contact_phone',
            'updated_at',
            'action',
        ],
        // 操作项映射
        actionMap: [FirmOperate.Edit, FirmOperate.Delete],
        // 操作栏宽度
        actionWidth: 138,
        // 默认表头排序
        defaultTableSort: { name: SortDirection.DESC },
        initSearch: {
            limit: 10,
            offset: 1,
            sort: SortType.UPDATED,
            direction: SortDirection.DESC,
        },
    },
}

/**
 * 空数据
 */
export const renderEmpty = (marginTop: number = 36) => (
    <Empty
        iconSrc={dataEmpty}
        desc={__('暂无数据')}
        style={{ marginTop, width: '100%' }}
    />
)

/**
 * 加载中
 */
export const renderLoader = (marginTop: number = 104) => (
    <div style={{ marginTop, width: '100%' }}>
        <Loader />
    </div>
)

// 统一的弹窗样式
export const getConfirmModal = ({ title, content, onOk }) => {
    return confirm({
        title,
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        content,
        onOk,
    })
}
