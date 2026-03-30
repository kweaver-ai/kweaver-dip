import {
    AutoComplete,
    Button,
    Collapse,
    Select,
    Table,
    Tooltip,
    Switch,
} from 'antd'
import {
    ReactElement,
    ReactNode,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { isEqual, trim } from 'lodash'
import { CloseOutlined } from '@ant-design/icons'
import { useUpdateEffect } from 'ahooks'
import {
    allRoleList,
    AssetTypeEnum,
    formatError,
    getAppsList,
    getAppsListByDataOwner,
    getCurUserDepartment,
    getIntegratedAppList,
    HasAccess,
    searchUserDepart,
} from '@/core'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { FontIcon, InfotipOutlined, UserOutlined } from '@/icons'
import { Loader, SearchInput } from '@/ui'
import AddVisitorModal from '../AddVisitorModal'
import { SearchItem } from '../AddVisitorModal/VisitorTree'
import VisitAccessSelect from '../VisitAccessSelect'
import {
    AccessOptMap,
    AccessOptsList,
    IPermission,
    OptType,
    calcByte,
    getLabelByPermission,
} from '../VisitAccessSelect/helper'
import { OptionType, useVisitorContext } from '../VisitorProvider'
import styles from './styles.module.less'
import Empty from '@/ui/Empty'
import dataEmpty from '@/assets/dataEmpty.svg'
import {
    DepartInfoItem,
    getDepartLabelByDepartments,
    isContainerIgnoreCase,
} from '../../helper'
import {
    AccessTipText,
    AccessType,
    getBelongType,
    getUserIsVisitor,
    VisitorType,
} from '../../const'
import __ from '../../locale'
import { MicroWidgetPropsContext } from '@/context'
import { TipsLabel } from '@/components/BusinessTagAuthorization/helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import ExpiredTimeSelect from '../ExpiredTimeSelect'
import BatchConfig from '../BatchConfig'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

export interface IVisitorCard {
    onChange?: (bindItems: any[]) => void
    // [{isOwner, isExtend, isOrigin, isForbidden}]
    // isOwner-数据Owner  isExtend-继承Owner isOrigin-初始数据  isForbidden-申请模式下禁止修改
    value?: any
    type: string
    height?: string
    // 申请模式
    applyMode?: boolean
    // 新建规则
    isCreate?: boolean
    // 标签模式
    tagMode?: boolean
    empty?: ReactElement
    loading?: boolean
    buttonText?: any
    modalTitle?: any
}

function VisitorCard({
    onChange,
    value,
    type,
    height,
    applyMode = false,
    isCreate = false,
    empty,
    loading,
    buttonText,
    modalTitle,
    tagMode = false,
}: IVisitorCard) {
    const [userInfo] = useCurrentUser()
    const { bindItems, optBindItems, setBindItems } = useVisitorContext()
    const [addVisible, setAddVisible] = useState<boolean>(false)
    const isSearchRef = useRef<any>(false)
    const [keyword, setKeyword] = useState<string>()
    const [searchResult, setSearchResult] = useState<any[]>()
    const [sk, setSK] = useState<string>('')
    const [filterDataSource, setFilterDataSource] = useState<any[]>()
    const [currentDepart, setCurrentDepart] = useState<any>([])
    // 是否添加过当前用户
    const [hasAdd, setHasAdd] = useState<boolean>(false)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const { checkPermission, checkPermissions } = useUserPermCtx()
    const appDeveloperRole = useMemo(
        () => checkPermission(allRoleList.ApplicationDeveloper),
        [checkPermission],
    )
    const applyRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness),
        [checkPermissions],
    )

    const [searchApplications, setSearchApplications] = useState<any[]>([])
    const isDataOwner = useMemo(
        () => checkPermission('manageDataResourceAuthorization'),
        [checkPermission],
    )
    const [visitorAllApps, setVisitorAllApps] = useState<any[]>([])

    const [tableColumns, setTableColumns] = useState<any[]>([])

    const [batchConfigVisible, setBatchConfigVisible] = useState<boolean>(false)
    const [selectedRows, setSelectedRows] = useState<any[]>([])
    const [{ local_app }] = useGeneralConfig()

    const { Panel } = Collapse

    const [belongType, hiddenType] = useMemo(() => {
        // 所属大类  视图 | 接口 | 指标
        const belong = getBelongType(type as AssetTypeEnum)
        const hidden = [AssetTypeEnum.DataView].includes(belong)
            ? undefined
            : [OptType.Download]
        return [belong, hidden]
    }, [type])

    const getCurrentUser = async () => {
        try {
            const ret = await getCurUserDepartment()
            if (ret?.length) {
                setCurrentDepart(
                    (ret || []).map((o) => [
                        {
                            department_id: o?.id,
                            department_name: o?.name,
                        },
                    ]),
                )
            }
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    useEffect(() => {
        if (applyMode) {
            getCurrentUser()
        } else if (local_app || tagMode || type === AssetTypeEnum.Api) {
            getApplicationsByOwner()
        }
    }, [applyMode, local_app])

    useEffect(() => {
        if (sk) {
            const list = bindItems?.filter((o) =>
                isContainerIgnoreCase(o?.subject_name, sk),
            )
            setFilterDataSource(list)
        } else {
            setFilterDataSource([])
        }
        setSelectedRows([])
    }, [sk, bindItems])

    useEffect(() => {
        if (applyMode) {
            const showItems = value?.filter(
                (o) =>
                    !(
                        o?.permissions?.length === 1 &&
                        [OptType.Allocate, OptType.Auth].includes(
                            o?.permissions[0]?.action,
                        )
                    ),
            )
            const showBind = showItems?.map((o) => ({
                ...o,
                permissions: o?.permissions?.filter(
                    (p) =>
                        ![OptType.Allocate, OptType.Auth].includes(p?.action),
                ),
            }))
            setBindItems(showBind || [])
        } else {
            setBindItems(value || [])
        }
    }, [value, applyMode])

    useUpdateEffect(() => {
        if (onChange && !isEqual(value || [], bindItems)) {
            onChange(bindItems)
        }
    }, [bindItems])

    const getVisitors = async (kw: string) => {
        try {
            const res = await searchUserDepart({
                keyword: kw,
                limit: 99,
                offset: 1,
            })
            // setSearchResult(
            //     res?.filter((current) => getUserIsVisitor(current)) ?? [],
            // )
            setSearchResult(res ?? [])
        } catch (error) {
            formatError(error, microWidgetProps?.components?.toast)
        }
    }

    /**
     * 根据所有者获取应用程序列表
     *
     * 此函数尝试获取由当前用户拥有的所有应用程序如果当前用户是数据的所有者，
     * 则调用另一个函数从服务器获取应用程序列表，并将结果设置到状态变量中
     * 如果发生错误，则格式化错误信息
     */
    const getApplicationsByOwner = async () => {
        try {
            // 检查当前用户是否为数据所有者
            if (isDataOwner) {
                // 如果是数据所有者，获取其应用程序列表
                // const res = await getAppsListByDataOwner()
                const res = await getIntegratedAppList()
                setVisitorAllApps(res.entries)
            }
        } catch (err) {
            // 格式化并处理错误
            formatError(err)
        }
    }
    /**
     * 异步获取应用程序列表
     * @param kw 搜索关键字，用于过滤应用程序列表
     * 此函数通过调用getAppsList函数从远程获取应用程序列表，并根据特定条件过滤结果
     */
    const getApplications = async (kw: string) => {
        try {
            if (applyMode && !!appDeveloperRole) {
                // 调用getAppsList函数，传递搜索关键字、限制数量和偏移量作为参数
                // const res = await getAppsList({
                //     keyword: kw,
                //     limit: 99,
                //     offset: 1,
                //     only_developer: true,
                // })
                const res = await getIntegratedAppList()
                setSearchApplications(res.entries)
            } else {
                setSearchApplications(
                    visitorAllApps.filter((current) =>
                        current.name
                            .toUpperCase()
                            .includes(trim(kw).toUpperCase()),
                    ),
                )
            }
        } catch (err) {
            // 在出现错误时，调用formatError函数进行错误处理
            formatError(err)
        }
    }

    const handleAddItem = (item) => {
        if (!bindItems?.some((o) => o.subject_id === item.id)) {
            optBindItems(OptionType.Add, [item], applyMode)
            setKeyword('')
        }
    }

    const options = useMemo(
        () =>
            searchResult?.map((o) => ({
                label: <SearchItem data={o} onClick={handleAddItem} />,
                value: o.id,
            })),
        [searchResult],
    )

    const ApplicationOptions = useMemo(
        () =>
            searchApplications?.map((o) => ({
                label: (
                    <SearchItem
                        data={{ ...o, type: 'app' }}
                        onClick={handleAddItem}
                    />
                ),
                value: o.id,
            })),
        [searchApplications],
    )

    // owner也支持选择
    // useEffect(() => {
    //     setCheckMe(!applyMode)
    // }, [applyMode])

    useEffect(() => {
        if (keyword) {
            // getVisitors(keyword)
            if (local_app || tagMode || type === AssetTypeEnum.Api) {
                getApplications(keyword)
            }
        } else {
            setSearchResult([])
            setSearchApplications([])
        }
    }, [keyword, appDeveloperRole, local_app, type])

    const containCurUser = useMemo(() => {
        const isContain = bindItems?.some((o) => o?.subject_id === userInfo?.ID)
        // 只要存在过当前用户  均判定为已添加过
        if (isContain) {
            setHasAdd(true)
        }

        return isContain
    }, [bindItems, userInfo])

    useEffect(() => {
        getTableColumns()
    }, [appDeveloperRole, applyRoles, type])

    const handleChangeAccess = (item: any, permissions: IPermission[]) => {
        optBindItems(OptionType.Update, { ...item, permissions }, applyMode)
    }

    const Columns: any = [
        {
            title: __('访问者'),
            dataIndex: 'subject_name',
            key: 'subject_name',
            ellipsis: true,
            width: 120,
            fixed: 'left',
            render: (text, record) => {
                return (
                    <div className={styles.subjectName}>
                        {record.subject_type === 'app' ? (
                            <FontIcon name="icon-jichengyingyong-xianxing" />
                        ) : (
                            <UserOutlined style={{ fontSize: '18px' }} />
                        )}
                        <span className={styles.text} title={text}>
                            {text}
                        </span>
                        {record?.user_status === 'Deleted' && (
                            <Tooltip
                                color="#fff"
                                overlayInnerStyle={{
                                    color: 'rgba(0,0,0,0.85)',
                                }}
                                title={__(
                                    '当前用户不在组织架构中，可将其权限进行删除操作',
                                )}
                            >
                                <span className={styles.deleted}>
                                    {__('已删除')}
                                </span>
                            </Tooltip>
                        )}
                    </div>
                )
            },
        },
        {
            title: __('访问者类型'),
            dataIndex: 'subject_type',
            key: 'subject_type',
            ellipsis: true,
            width: 120,
            render: (subjectType: string, record) => {
                return __('应用账户')
                // return subjectType === 'app' ? __('集成应用') : __('用户')
            },
        },
        // {
        //     title: __('所属部门'),
        //     dataIndex: 'departments',
        //     key: 'departments',
        //     width: 180,
        //     ellipsis: true,
        //     render: (arr: DepartInfoItem[][], record) => {
        //         const { title, tip } = getDepartLabelByDepartments(arr)
        //         return (
        //             <span
        //                 title={
        //                     record.subject_type === 'app'
        //                         ? __('集成应用无部门属性')
        //                         : tip || __('未分配')
        //                 }
        //             >
        //                 {record.subject_type === 'app'
        //                     ? tip || __('--')
        //                     : title || '--'}
        //             </span>
        //         )
        //     },
        // },
        {
            title: (
                <div className={styles.tooltip}>
                    <span className={styles['tooltip-span']}>
                        {__('访问权限')}
                    </span>
                    <Tooltip
                        title={
                            <div>
                                {Object.keys(AccessTipText[belongType]).map(
                                    (ac) => {
                                        return (
                                            <div
                                                className={
                                                    styles['tooltip-panel']
                                                }
                                            >
                                                <div>
                                                    {
                                                        AccessOptsList.find(
                                                            (o) =>
                                                                o.value === ac,
                                                        )?.label
                                                    }
                                                    ：
                                                </div>
                                                <div>
                                                    {
                                                        AccessTipText[
                                                            belongType
                                                        ][ac]
                                                    }
                                                </div>
                                            </div>
                                        )
                                    },
                                )}
                            </div>
                        }
                        color="#fff"
                        placement="top"
                    >
                        <InfotipOutlined />
                    </Tooltip>
                </div>
            ),
            dataIndex: 'permissions',
            key: 'permissions',
            width: 180,
            render: (dom, record) => {
                const isMe = record.subject_id === userInfo?.ID

                // TODO：申请模式下暂时屏蔽授权与授权仅分配
                const extraHidden =
                    record.subject_type === 'app' // 集成应用均不支持授权
                        ? [OptType.Auth, OptType.Allocate]
                        : belongType === AssetTypeEnum.Api
                        ? applyMode
                            ? [OptType.Read, OptType.Auth, OptType.Allocate]
                            : [OptType.Read]
                        : applyMode
                        ? [OptType.Auth, OptType.Allocate]
                        : undefined

                if (record.isOwner) {
                    return [
                        OptType.Read,
                        OptType.Download,
                        OptType.Auth,
                        OptType.Allocate,
                    ]
                        .filter(
                            (o) =>
                                ![
                                    ...(hiddenType || []),
                                    ...(extraHidden || []),
                                ]?.includes(o),
                        )
                        .map(
                            (o) =>
                                AccessOptsList.find((it) => it.value === o)
                                    ?.label,
                        )
                        .join('/')
                }

                if (record.isExtend) {
                    const optAccess = (record.permissions ?? []).map(
                        (o) => AccessOptMap[`${o.action}-${o.effect}`],
                    )
                    const label = getLabelByPermission(optAccess)
                    return (
                        <Select
                            value={{
                                label: `${label ? `${label}/` : ''}${__(
                                    '授权',
                                )}`,
                                value: calcByte(optAccess),
                            }}
                            style={{ width: '100%' }}
                            placeholder={__('请设置访问权限')}
                            disabled
                        />
                    )
                }

                return (
                    <VisitAccessSelect
                        hiddenType={hiddenType}
                        extraHidden={extraHidden}
                        canCustom={false}
                        value={record.permissions}
                        disabled={
                            (applyMode && record?.isForbidden) ||
                            record?.user_status === 'Deleted' || // 存在读取和下载权限 或用户已经被删除 则禁止变更
                            (!applyMode && !isCreate && isMe) // 授权模式下 非新建规则 当前用户禁止变更
                        }
                        // disabled={!!record.isExtend}
                        // canReject={false}
                        onChange={(val) => handleChangeAccess(record, val)}
                    />
                )
            },
        },
        {
            title: __('有效期至'),
            dataIndex: 'expired_at',
            key: 'expired_at',
            width: 370,
            render: (expiredTime: string, record) => {
                return (
                    <ExpiredTimeSelect
                        value={record.expired_at}
                        onChange={(val) => {
                            optBindItems(
                                OptionType.Update,
                                {
                                    ...record,
                                    expired_at: val,
                                },
                                applyMode,
                            )
                        }}
                    />
                )
            },
        },
        {
            title: applyMode ? (
                <div className={styles.tooltip}>
                    <span className={styles['tooltip-span']}>{__('操作')}</span>
                    <Tooltip
                        title={
                            <div>
                                {__(
                                    '权限申请只能对本次添加的访问者进行删除操作',
                                )}
                            </div>
                        }
                        color="#fff"
                        placement="topRight"
                        overlayInnerStyle={{ color: 'rgba(0,0,0,0.65)' }}
                        overlayStyle={{
                            maxWidth: 500,
                        }}
                    >
                        <InfotipOutlined />
                    </Tooltip>
                </div>
            ) : (
                __('操作')
            ),
            key: 'action',
            width: 90,
            fixed: 'right',
            render: (dom, record) => {
                const showDelete =
                    !record.isOwner &&
                    !record.isExtend &&
                    !(applyMode && record.isOrigin)
                return (
                    showDelete && (
                        <a
                            onClick={() =>
                                optBindItems(
                                    OptionType.Remove,
                                    record,
                                    applyMode,
                                )
                            }
                        >
                            {tagMode ? (
                                <CloseOutlined
                                    style={{ color: 'rgba(0 0 0 / 85%)' }}
                                />
                            ) : (
                                __('删除')
                            )}
                        </a>
                    )
                )
            },
        },
    ]

    const handleCompositionStart = () => {
        isSearchRef.current = true
    }

    const handleCompositionEnd = (e: any) => {
        isSearchRef.current = false
    }

    const handleSure = (arr: any[]) => {
        optBindItems(OptionType.Add, arr, applyMode)
        setAddVisible(false)
    }

    const handleAddCurrent = (e) => {
        e.stopPropagation()
        const curUser = {
            id: userInfo?.ID,
            name: userInfo?.VisionName,
            type: 'user',
            parent_deps: currentDepart,
        }

        optBindItems(OptionType.Add, [curUser], applyMode)
    }

    const dropdownRender = (origin: ReactNode) => {
        switch (true) {
            case type === AssetTypeEnum.Api && applyMode:
            case !!appDeveloperRole && !applyRoles:
                return ApplicationOptions?.length ? (
                    <div>{ApplicationOptions?.map((o) => o.label)}</div>
                ) : (
                    <span
                        style={{
                            color: 'rgba(0, 0, 0, 0.65)',
                            padding: '0 12px',
                        }}
                    >
                        {__('抱歉，没有找到相关内容')}
                    </span>
                )
            case !applyMode:
            case !!appDeveloperRole && !!applyRoles:
                return options?.length || ApplicationOptions?.length ? (
                    <div className={styles['pop-container']}>
                        <Collapse defaultActiveKey={['user', 'app']} ghost>
                            {options?.length ? (
                                <Panel
                                    header={__('用户')}
                                    key="user"
                                    className={styles['search-wrapper-list']}
                                >
                                    {options?.map((o) => o.label)}
                                </Panel>
                            ) : null}
                            {ApplicationOptions?.length ? (
                                <Panel
                                    header={__('集成应用')}
                                    key="user"
                                    className={styles['search-wrapper-list']}
                                >
                                    {ApplicationOptions?.map((o) => o.label)}
                                </Panel>
                            ) : null}
                        </Collapse>
                    </div>
                ) : (
                    <span
                        style={{
                            color: 'rgba(0, 0, 0, 0.65)',
                            padding: '0 12px',
                        }}
                    >
                        {__('抱歉，没有找到相关内容')}
                    </span>
                )

            case !appDeveloperRole && !!applyRoles:
                return options?.length ? (
                    <div>{options?.map((o) => o.label)}</div>
                ) : (
                    <span
                        style={{
                            color: 'rgba(0, 0, 0, 0.65)',
                            padding: '0 12px',
                        }}
                    >
                        {__('抱歉，没有找到相关内容')}
                    </span>
                )
            default:
                return (
                    <span
                        style={{
                            color: 'rgba(0, 0, 0, 0.65)',
                            padding: '0 12px',
                        }}
                    >
                        {__('抱歉，没有找到相关内容')}
                    </span>
                )
        }
    }

    const getVisitorTypes = () => {
        return [VisitorType.APPLICATION]
        // if (tagMode) {
        //     return [VisitorType.APPLICATION]
        // }
        // if (type === AssetTypeEnum.Api) {
        //     return [VisitorType.APPLICATION]
        // }
        // if (!local_app) {
        //     return [VisitorType.USER]
        // }
        // switch (true) {
        //     case type === AssetTypeEnum.Api && applyMode:
        //     case !!appDeveloperRole && !applyRoles:
        //         return [VisitorType.APPLICATION]
        //     case !applyMode:
        //     case !!appDeveloperRole && !!applyRoles:
        //         return [VisitorType.USER, VisitorType.APPLICATION]

        //     default:
        //         return [VisitorType.USER]
        // }
    }

    const getTableColumns = () => {
        if (tagMode) {
            const columns = [
                Columns.map((item) => ({
                    ...item,
                    title:
                        item.key === 'subject_name' ? (
                            <TipsLabel
                                label={__('集成应用')}
                                tips={
                                    <div>
                                        <div style={{ fontWeight: 550 }}>
                                            {__('集成应用')}
                                        </div>
                                        <div>
                                            {__(
                                                '开发者使用应用账号完成认证后，可调用应用内提供的资源/标签的 OpenAPI 接口（使用这些接口需要先获取相关数据授权）。',
                                            )}
                                        </div>
                                    </div>
                                }
                            />
                        ) : (
                            item.title
                        ),
                })).find((item) => item.key === 'subject_name'),
                {
                    title: (
                        <TipsLabel
                            label={__('智能标签')}
                            placement="bottom"
                            tips={
                                <div>
                                    <div style={{ fontWeight: 550 }}>
                                        {__('智能标签')}
                                    </div>
                                    <div>
                                        {__(
                                            '1、智能标签作用：系统可根据打标签的对象，智能推荐标签。',
                                        )}
                                    </div>
                                    <div>
                                        {__(
                                            '2、开启智能标签后，开发者通过集成应用调用标签的 OpenAPI 接口时，还可以调用智能标签能力。',
                                        )}
                                    </div>
                                </div>
                            }
                        />
                    ),
                    dataIndex: 'intelligentTag',
                    key: 'intelligentTag',
                    ellipsis: true,
                    render: (val, record) => (
                        <Switch
                            checked={val}
                            onChange={(ck) => onStateChange(ck, record)}
                            size="small"
                        />
                    ),
                },
                Columns.find((item) => item.key === 'action'),
            ]
            setTableColumns(columns)
        } else if (
            (type === AssetTypeEnum.Api && applyMode) ||
            (!!appDeveloperRole && !applyRoles)
        ) {
            setTableColumns(
                Columns.filter((current) => current.key !== 'departments'),
            )
        } else {
            setTableColumns(Columns)
        }
    }

    const onStateChange = (checked: boolean, record: any) => {
        setBindItems((pre) =>
            pre.map((item) => ({
                ...item,
                intelligentTag:
                    item.subject_id === record.subject_id
                        ? checked
                        : item.intelligentTag,
            })),
        )
    }

    /**
     * 选择行
     * @param selectedRowKeys
     * @param selectedData
     */
    const onSelectChange = (selectedRowKeys: any[], selectedData: any[]) => {
        setSelectedRows(selectedData)
    }
    /**
     * 获取搜索框提示文字
     * @returns
     */
    const getSearchPlaceholder = () => {
        if (tagMode) {
            return __('输入应用名称可快速添加')
        }
        if (
            (type === AssetTypeEnum.Api && applyMode) ||
            (!!appDeveloperRole && !applyRoles)
        ) {
            return __('输入应用名称可快速添加')
        }
        if (!local_app) {
            return __('输入用户名称可快速添加')
        }

        if (applyMode && !hasAdd && !containCurUser) {
            return userInfo?.VisionName
        }
        return __('输入应用账户名称快速添加')
    }

    const handleBatchConfig = (configs: any) => {
        selectedRows.forEach((item) => {
            optBindItems(
                OptionType.BatchUpdate,
                selectedRows?.map((o) => ({
                    ...o,
                    ...configs,
                    permissions: configs.permissions
                        ? configs.permissions
                        : o.permissions,
                    expired_at:
                        configs.expired_at === null
                            ? o.expired_at
                            : configs.expired_at,
                })),
                applyMode,
            )
        })
        setBatchConfigVisible(false)
    }

    return (
        <div className={styles['visitor-card']}>
            <div className={styles['visitor-card-search']}>
                <div className={styles['visitor-card-search-left']}>
                    {!tagMode && (
                        <div>
                            <Button
                                type="primary"
                                onClick={() => setBatchConfigVisible(true)}
                                disabled={!selectedRows.length}
                            >
                                {__('批量配置')}
                            </Button>
                        </div>
                    )}
                    {!tagMode && (
                        <div className={styles.label}>
                            {(type === AssetTypeEnum.Api && applyMode) ||
                            (!!appDeveloperRole && !applyRoles)
                                ? __('添加集成应用：')
                                : __('添加应用账户：')}
                        </div>
                    )}
                    <AutoComplete
                        dropdownMatchSelectWidth={252}
                        style={{ width: tagMode ? 400 : 320 }}
                        dropdownRender={dropdownRender}
                        maxLength={128}
                        value={keyword}
                        popupClassName={styles['search-select']}
                        notFoundContent={
                            keyword && (
                                <span
                                    style={{
                                        color: 'rgba(0, 0, 0, 0.65)',
                                        padding: '0 12px',
                                    }}
                                >
                                    {__('抱歉，没有找到相关内容')}
                                </span>
                            )
                        }
                    >
                        <SearchInput
                            style={{ width: tagMode ? 392 : 320 }}
                            placeholder={getSearchPlaceholder()}
                            onCompositionStart={handleCompositionStart}
                            onCompositionEnd={handleCompositionEnd}
                            onKeyChange={(key) => {
                                if (!isSearchRef.current) {
                                    setKeyword(key)
                                }
                            }}
                            suffix={
                                applyMode &&
                                !hasAdd &&
                                !containCurUser &&
                                !(type === AssetTypeEnum.Api && applyMode) &&
                                !!applyRoles ? (
                                    <div
                                        className={styles['add-current']}
                                        onClick={handleAddCurrent}
                                    >
                                        {__('添加')}
                                    </div>
                                ) : undefined
                            }
                        />
                    </AutoComplete>

                    <Button type="default" onClick={() => setAddVisible(true)}>
                        {
                            buttonText || __('选择应用')
                            // ((!!appDeveloperRole && !applyRoles) ||
                            // (type === AssetTypeEnum.Api && applyMode)
                            //     ? __('选择应用')
                            //     : __('选择访问者'))
                        }
                    </Button>
                </div>

                {!tagMode && (
                    <div className={styles['visitor-card-search-right']}>
                        <SearchInput
                            style={{ maxWidth: 280 }}
                            placeholder={__('搜索访问者')}
                            onKeyChange={(key) => setSK(key)}
                        />
                    </div>
                )}
            </div>
            <div className={styles['visitor-card-table']}>
                {loading ? (
                    <div style={{ paddingTop: '56px' }}>
                        <Loader />
                    </div>
                ) : (
                    <Table
                        columns={tableColumns}
                        dataSource={sk ? filterDataSource : bindItems}
                        scroll={{
                            x: !tagMode ? 1180 : 'auto',
                            y: height || `calc(100vh - 270px)`,
                        }}
                        rowKey="subject_id"
                        locale={{
                            emptyText: sk ? (
                                <Empty />
                            ) : (
                                empty || (
                                    <Empty
                                        desc={__('暂无数据')}
                                        iconSrc={dataEmpty}
                                    />
                                )
                            ),
                        }}
                        rowSelection={
                            tagMode
                                ? undefined
                                : {
                                      type: 'checkbox',
                                      onChange: onSelectChange,
                                      selectedRowKeys: selectedRows.map(
                                          (item) => item.subject_id,
                                      ),
                                  }
                        }
                        pagination={false}
                    />
                )}
            </div>
            {addVisible && (
                <AddVisitorModal
                    visible={addVisible}
                    currentId={userInfo?.ID}
                    onSure={handleSure}
                    onClose={() => setAddVisible(false)}
                    visitorTypes={getVisitorTypes()}
                    applyMode={applyMode}
                    title={
                        modalTitle ||
                        ((!!appDeveloperRole && !applyRoles) ||
                        (type === AssetTypeEnum.Api && applyMode)
                            ? __('选择应用')
                            : __('添加访问者'))
                    }
                />
            )}
            {batchConfigVisible && (
                <BatchConfig
                    visible={batchConfigVisible}
                    onCancel={() => setBatchConfigVisible(false)}
                    selectItems={selectedRows}
                    type={type as AssetTypeEnum}
                    onConfirm={handleBatchConfig}
                />
            )}
        </div>
    )
}

export default VisitorCard
