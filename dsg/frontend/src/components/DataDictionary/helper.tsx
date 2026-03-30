import { Anchor, Button, Space } from 'antd'

import { ExclamationCircleFilled, LeftOutlined } from '@ant-design/icons'
import moment from 'moment'
import { ReactElement } from 'react'
import dataEmpty from '@/assets/dataEmpty.svg'
import { SortDirection, SortType } from '@/core'
import { Empty } from '@/ui'
import { confirm } from '@/utils/modalHelper'
import __ from './locale'
import styles from './styles.module.less'

// 数据字典操作类型
export enum DataDictionaryOperate {
    // 编辑
    Edit = 'edit',
    // 详情
    Details = 'details',
    // 删除
    Delete = 'delete',
}

export const sortMenus = [
    { key: SortType.NAME, label: __('按名称排序') },
    { key: SortType.UPDATED, label: __('按更新时间排序') },
]

export const defaultMenu = {
    key: SortType.UPDATED,
    sort: SortDirection.DESC,
}

// 抽屉标题
export const DrawerTitle = ({
    name,
    onClose,
}: {
    name: string
    onClose: () => void
}) => {
    return (
        <div className={styles.drawerTitle}>
            <div onClick={onClose} className={styles.return}>
                <LeftOutlined />
                <span className={styles.returnText}>{__('返回')}</span>
            </div>
            <div className={styles.objectionName}>{name || '--'}</div>
        </div>
    )
}

// 抽屉footer
export const DrawerFooter = ({
    onSubmit,
    onClose,
}: {
    onSubmit: () => void
    onClose: () => void
}) => {
    return (
        <Space
            style={{ justifyContent: 'flex-end', display: 'flex' }}
            size={12}
        >
            <Button onClick={onClose}>{__('取消')}</Button>
            <Button onClick={onSubmit} type="primary">
                {__('提交')}
            </Button>
        </Space>
    )
}

// 详情展示中的分组样式
export const DetailGroupTitle = ({ title }: { title: string }) => {
    return <div className={styles.detailGroupTitle}>{title}</div>
}

export const renderEmpty = ({
    iconSrc = dataEmpty,
    desc = __('暂无数据'),
}: {
    iconSrc?: string
    desc?: string | ReactElement
}) => {
    return <Empty iconSrc={iconSrc} desc={desc} style={{ width: '100%' }} />
}

// 渲染文本或者时间
export const renderContent = (value: any, isDate?: boolean) => {
    if (!value) return '--'
    return isDate ? moment(value).format('YYYY-MM-DD') : value
}

// 锚点链接
export const detailsAnchorLinks = [
    {
        key: 'detailsBasic',
        href: '#detailsBasic',
        title: __('基本属性'),
    },
    {
        key: 'detailsItems',
        href: '#detailsItems',
        title: __('字典项'),
    },
    {
        key: 'detailsVersion',
        href: '#detailsVersion',
        title: __('版本信息'),
    },
]

// 锚点链接
export const editAnchorLinks = [
    {
        key: 'editBasic',
        href: '#editBasic',
        title: __('基本属性'),
    },
    {
        key: 'editItems',
        href: '#editItems',
        title: __('字典项'),
    },
]

export const renderAnchor = ({
    container,
    top,
    operate = DataDictionaryOperate.Details,
}: {
    container: any
    top?: number
    operate?: DataDictionaryOperate
}) => {
    const anchorLinks =
        operate === DataDictionaryOperate.Edit
            ? editAnchorLinks
            : detailsAnchorLinks
    return (
        <Anchor
            className={styles.anchor}
            style={{ top }}
            getContainer={() => (container.current as HTMLElement) || window}
            onClick={(e: any) => {
                e.preventDefault()
            }}
        >
            {anchorLinks.map((link) => (
                <Anchor.Link
                    key={link.key}
                    href={link.href}
                    title={link.title}
                />
            ))}
        </Anchor>
    )
}

// 统一的弹窗样式
export const getConfirmModal = ({ title, content, onOk }) => {
    return confirm({
        title,
        icon: <ExclamationCircleFilled style={{ color: '#FAAD14' }} />,
        content,
        onOk,
    })
}
