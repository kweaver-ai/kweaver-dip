import React from 'react'
import classnames from 'classnames'
import { noop } from 'lodash'
import {
    ResType,
    IFavoriteItem,
    OnlineStatus,
    IndicatorType,
    SortType,
    SortDirection,
} from '@/core'
import styles from './styles.module.less'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import __ from './locale'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import { BusinessDomainType } from '../BusinessDomain/const'
import { GlossaryIcon } from '../BusinessDomain/GlossaryIcons'
import OrgAndDepartmentFilterTree from '@/components/MyAssets/OrgAndDepartmentFilterTree'
import { SearchType } from '@/ui/LightweightSearch/const'
import { Architecture } from '../BusinessArchitecture/const'

// 数据库表
const IndicatorTypeMap = {
    [IndicatorType.Atomic]: __('原子指标'),
    [IndicatorType.Derived]: __('衍生指标'),
    [IndicatorType.Composite]: __('复合指标'),
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

const OriginSelectComponent: React.FC<{
    value?: any
    onChange?: (value: any) => void
}> = ({ onChange = noop, value }) => {
    return (
        <OrgAndDepartmentFilterTree
            getSelectedNode={(sn) => {
                onChange(sn.id)
            }}
            filterType={[
                Architecture.ORGANIZATION,
                Architecture.DEPARTMENT,
            ].join()}
        />
    )
}

export const FavoriteTabMap = {
    [ResType.DataView]: {
        // 表格列名
        columnKeys: ['name', 'subjects', 'org_name', 'online_at', 'action'],
        // 操作项映射
        actionMap: [FavoriteOperate.CancelFavorite],
        // 操作栏宽度
        actionWidth: 80,
        // 初始化搜索条件
        initSearch: {
            limit: 10,
            offset: 1,
            sort: SortType.ONLINEAT,
            direction: SortDirection.DESC,
            res_type: ResType.DataView,
        },
        // 排序菜单
        sortMenus: [
            { key: SortType.NAME, label: __('按资源名称排序') },
            { key: SortType.ONLINEAT, label: __('按上线时间排序') },
        ],
        // 默认菜单排序
        defaultMenu: {
            key: SortType.ONLINEAT,
            sort: SortDirection.DESC,
        },
        // 筛选项
        searchFormData: [
            {
                label: __('部门'),
                key: 'department_id',
                options: [],
                type: SearchType.Customer,
                Component: OriginSelectComponent as React.ComponentType<{
                    value?: any
                    onChange: (value: any) => void
                }>,
            },
        ],
        // 默认搜索条件
        defaultSearch: {
            department_id: '',
        },
        // 默认表头排序
        defaultTableSort: { online_at: SortDirection.DESC },
    },
    [ResType.InterfaceSvc]: {
        columnKeys: ['name', 'subjects', 'org_name', 'online_at', 'action'],
        actionMap: [FavoriteOperate.CancelFavorite],
        actionWidth: 80,
        initSearch: {
            limit: 10,
            offset: 1,
            sort: SortType.ONLINEAT,
            direction: SortDirection.DESC,
            res_type: ResType.InterfaceSvc,
        },
        sortMenus: [
            { key: SortType.NAME, label: __('按资源名称排序') },
            { key: SortType.ONLINEAT, label: __('按上线时间排序') },
        ],
        defaultMenu: {
            key: SortType.ONLINEAT,
            sort: SortDirection.DESC,
        },
        // 默认表头排序
        defaultTableSort: { online_at: SortDirection.DESC },
        searchFormData: [
            {
                label: __('部门'),
                key: 'department_id',
                options: [],
                type: SearchType.Customer,
                Component: OriginSelectComponent as React.ComponentType<{
                    value?: any
                    onChange: (value: any) => void
                }>,
            },
        ],
        defaultSearch: {
            department_id: '',
        },
    },
    [ResType.Indicator]: {
        columnKeys: [
            'name',
            'res_type',
            'subjects',
            'org_name',
            'published_at',
            'action',
        ],
        actionMap: [FavoriteOperate.CancelFavorite],
        actionWidth: 80,
        initSearch: {
            limit: 10,
            offset: 1,
            sort: SortType.PUBLISHEDAT,
            direction: SortDirection.DESC,
            res_type: ResType.Indicator,
        },
        sortMenus: [
            { key: SortType.NAME, label: __('按资源名称排序') },
            { key: SortType.PUBLISHEDAT, label: __('按发布时间排序') },
        ],
        defaultMenu: {
            key: SortType.PUBLISHEDAT,
            sort: SortDirection.DESC,
        },
        // 默认表头排序
        defaultTableSort: { published_at: SortDirection.DESC },
        searchFormData: [
            {
                label: __('部门'),
                key: 'department_id',
                options: [],
                type: SearchType.Customer,
                Component: OriginSelectComponent as React.ComponentType<{
                    value?: any
                    onChange: (value: any) => void
                }>,
            },
            {
                label: __('指标类型'),
                key: 'indicator_type',
                options: [
                    {
                        label: __('不限'),
                        value: '',
                    },
                    {
                        label: __('原子指标'),
                        value: IndicatorType.Atomic,
                    },
                    {
                        label: __('衍生指标'),
                        value: IndicatorType.Derived,
                    },
                    {
                        label: __('复合指标'),
                        value: IndicatorType.Composite,
                    },
                ],
                type: SearchType.Radio,
            },
        ],
        defaultSearch: {
            department_id: '',
            indicator_type: '',
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

/**
 * 获取资源图标
 */
const getSourceIcon = (menu: ResType, type: string) => {
    let iconName = ''
    switch (menu) {
        case ResType.DataView:
            iconName = 'icon-shujubiaoshitu'
            break
        case ResType.InterfaceSvc:
            iconName = 'icon-jiekoufuwuguanli'
            break
        case ResType.Indicator:
            if (type === IndicatorType.Atomic) {
                iconName = 'icon-yuanzizhibiaosuanzi'
            } else if (type === IndicatorType.Derived) {
                iconName = 'icon-yanshengzhibiaosuanzi'
            } else if (type === IndicatorType.Composite) {
                iconName = 'icon-fuhezhibiaosuanzi'
            }
            break
        default:
            break
    }

    return (
        <FontIcon
            className={styles.sourceIcon}
            name={iconName}
            type={IconType.COLOREDICON}
        />
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
    // const isOnline = [
    //     OnlineStatus.ONLINE,
    //     OnlineStatus.DOWN_AUDITING,
    //     OnlineStatus.DOWN_REJECT,
    // ].includes(record?.online_status)
    const isOnline = record?.is_online

    // 点击事件
    const handleClick = () => {
        if (!isOnline) return
        onClick?.()
    }

    return (
        <div
            className={classnames(styles.multiColumnWrapper, {
                [styles.offline]: !isOnline,
            })}
        >
            {getSourceIcon(menu, record?.indicator_type)}
            <div className={styles.contentWrapper}>
                <div
                    title={record?.res_name}
                    className={styles.valueWrapper}
                    onClick={handleClick}
                >
                    <span className={styles.value}>{record?.res_name}</span>
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

// 所属业务对象
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

    return (
        <span title={subjects?.length ? formatTitle() : ''}>
            {subjects?.length
                ? subjects?.map(({ id, name }, index) => {
                      return (
                          <React.Fragment key={id}>
                              <span className={styles.subjectViewWrapper}>
                                  {name && (
                                      <GlossaryIcon
                                          width="18px"
                                          type={getIconType(id)}
                                          fontSize="18px"
                                          styles={{ marginRight: '8px' }}
                                      />
                                  )}
                                  <span>{name || '--'}</span>
                                  {index < subjects.length - 1 && (
                                      <span className={styles.divider}>|</span>
                                  )}
                              </span>
                          </React.Fragment>
                      )
                  })
                : '--'}
        </span>
    )
}

// 指标类型
export const IndicatorTypeView = ({ record }: { record: any }) => {
    return IndicatorTypeMap[record?.indicator_type] || '--'
}
