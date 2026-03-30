import React from 'react'
import classnames from 'classnames'
import { ResType, CatalogResType, LicenseResType, IFavoriteItem } from '@/core'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { BusinessDomainType } from '../BusinessDomain/const'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'

// 数据库表
const CatalogResTypeMap = {
    [CatalogResType.DataView]: __('库表'),
    [CatalogResType.InterfaceSvc]: __('接口服务'),
}

// 电子证照
const LicenseResTypeMap = {
    [LicenseResType.ProofFile]: __('证明文件'),
    [LicenseResType.Approval]: __('批文批复'),
    [LicenseResType.Report]: __('鉴定报告'),
    [LicenseResType.Other]: __('其他文件'),
}

/**
 * 收藏操作
 */
export enum FavoriteOperate {
    // 详情
    Details = 'Details',
    // 取消收藏
    CancelFavorite = 'CancelFavorite',
    // 收藏
    Favorite = 'Favorite',
}

export const FavoriteTabMap = {
    [ResType.InfoCatalog]: {
        name: __('信息资源目录名称'),
        // 标题
        title: __('收藏列表'),
        // 表格列名
        columnKeys: ['res_name', 'subjects', 'org_name', 'online_at', 'action'],
        columnTitle: {
            org_name: __('所属部门'),
            res_type: '',
        },
        // 操作项映射
        actionMap: [FavoriteOperate.Details, FavoriteOperate.CancelFavorite],
        // 操作栏宽度
        actionWidth: 140,
        // 图标
        iconName: 'icon-xinximulu1',
        // 搜索框提示
        searchPlaceholder: __('搜索信息资源目录名称、编码'),
        // 初始化搜索条件
        initSearch: {
            limit: 10,
            offset: 1,
            res_type: ResType.InfoCatalog,
        },
    },
    [ResType.DataCatalog]: {
        name: __('数据资源目录名称'),
        title: __('收藏列表'),
        columnKeys: [
            'res_name',
            'res_type',
            'subjects',
            'org_name',
            'score',
            'online_at',
            'action',
        ],
        columnTitle: {
            res_type: __('资源类型'),
            org_name: __('所属部门'),
        },
        actionMap: [FavoriteOperate.Details, FavoriteOperate.CancelFavorite],
        actionWidth: 140,
        iconName: 'icon-shujumuluguanli1',
        searchPlaceholder: __('搜索数据资源目录名称、编码'),
        initSearch: {
            limit: 10,
            offset: 1,
            res_type: ResType.DataCatalog,
        },
    },
    [ResType.InterfaceSvc]: {
        name: __('接口服务名称'),
        title: __('收藏列表'),
        columnKeys: ['res_name', 'org_name', 'subjects', 'online_at', 'action'],
        columnTitle: {
            org_name: __('所属部门'),
        },
        actionMap: [FavoriteOperate.CancelFavorite],
        actionWidth: 140,
        iconName: 'icon-jiekoufuwuguanli',
        searchPlaceholder: __('搜索接口服务名称、编码'),
        initSearch: {
            limit: 10,
            offset: 1,
            res_type: ResType.InterfaceSvc,
        },
    },
    [ResType.ElecLicenceCatalog]: {
        name: __('电子证照目录名称'),
        title: __('收藏列表'),
        columnKeys: ['res_name', 'res_type', 'org_name', 'online_at', 'action'],
        columnTitle: {
            res_type: __('证件类型'),
            org_name: __('管理部门'),
        },
        actionMap: [FavoriteOperate.Details, FavoriteOperate.CancelFavorite],
        actionWidth: 140,
        iconName: 'icon-dianzizhengzhaomulu',
        searchPlaceholder: __('搜索电子证照目录名称、编码'),
        initSearch: {
            limit: 10,
            offset: 1,
            res_type: ResType.ElecLicenceCatalog,
        },
    },
    [ResType.DataView]: {
        name: __('库表'),
        title: __('收藏列表'),
        columnKeys: ['res_name', 'org_name', 'subjects', 'online_at', 'action'],
        columnTitle: {
            org_name: __('所属部门'),
        },
        actionMap: [FavoriteOperate.CancelFavorite],
        actionWidth: 140,
        iconName: 'icon-shujubiaoshitu',
        searchPlaceholder: __('搜索库表名称、编码'),
        initSearch: {
            limit: 10,
            offset: 1,
            res_type: ResType.DataView,
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

/**
 * 双列表头
 */
export const MultiHeader = ({
    mainTitle,
    subTitle,
}: {
    mainTitle: string
    subTitle: string
}) => {
    return (
        <span>
            <span>{mainTitle}</span>
            <span className={styles.subTitle}>{subTitle}</span>
        </span>
    )
}

// 双列行
export const MultiColumn = ({
    menu,
    record,
    onClick,
}: {
    menu: ResType
    record: any
    onClick?: () => void
}) => {
    // 是否下线
    const isOnline = record?.is_online

    // 点击事件
    const handleClick = () => {
        if (!isOnline) return
        onClick?.()
    }

    return (
        <div className={styles.multiColumnWrapper}>
            <FontIcon
                name={FavoriteTabMap[menu].iconName}
                type={IconType.COLOREDICON}
                className={styles.icon}
            />
            <div className={styles.contentWrapper}>
                <div
                    title={record?.res_name}
                    className={styles.valueWrapper}
                    onClick={handleClick}
                >
                    <span
                        className={classnames(styles.value, {
                            [styles.disabledValue]: !isOnline,
                        })}
                    >
                        {record?.res_name}
                    </span>
                    {!isOnline && (
                        <span className={styles.offlineTips}>
                            {__('已下线')}
                        </span>
                    )}
                </div>
                <div title={record?.res_code} className={styles.subValue}>
                    {record?.res_code}
                </div>
            </div>
        </div>
    )
}

// 所属主题
export const SubjectView = ({ record }: { record: IFavoriteItem }) => {
    const { subjects } = record
    const map = [
        BusinessDomainType.subject_domain_group,
        BusinessDomainType.subject_domain,
        BusinessDomainType.business_object,
        BusinessDomainType.logic_entity,
    ]

    // 格式化 title 显示
    const formatTitle = () => {
        return subjects
            .map((subject, index) => `${index + 1}. ${subject.path}`)
            .join('\n')
    }

    // 获取图标类型
    const getIconType = (id: string) => {
        return map[(id?.split('/')?.length || 0) - 1]
    }

    // 将主题名称合并为字符串
    const getSubjectsText = () => {
        if (!subjects?.length) return '--'
        return subjects.map(({ name }) => name || '--').join(' | ')
    }

    // 获取第一个主题的图标类型（用于显示图标）
    const firstSubject = subjects?.[0]
    const iconType = firstSubject?.id ? getIconType(firstSubject.id) : null

    return (
        <span
            className={styles.subjectViewContainer}
            title={subjects?.length ? formatTitle() : ''}
        >
            {firstSubject?.name && iconType && (
                <GlossaryIcon
                    width="18px"
                    type={iconType}
                    fontSize="18px"
                    styles={{
                        marginRight: '8px',
                        flexShrink: 0,
                    }}
                />
            )}
            <span className={styles.subjectText}>{getSubjectsText()}</span>
        </span>
    )
}

// 资源类型
export const ResourceTypeView = ({ record }: { record: any }) => {
    const resTypeMap = {
        ...CatalogResTypeMap,
        ...LicenseResTypeMap,
    }

    // 如果 res_type 不存在，返回默认值
    if (!record?.res_type) {
        return '--'
    }

    // 将 res_type 按逗号分割，处理多个资源类型的情况
    const resTypes = String(record.res_type)
        .split(',')
        .map((type) => type.trim())
        .filter((type) => type) // 过滤空字符串

    // 映射每个资源类型
    const mappedTypes = resTypes
        .map((type) => resTypeMap[type])
        .filter((type) => type) // 过滤未映射的类型

    // 如果有映射结果，用逗号连接；否则返回默认值
    return mappedTypes.length > 0 ? mappedTypes.join('，') : '--'
}
