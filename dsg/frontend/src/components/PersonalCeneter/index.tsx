import { useState, useEffect, useRef, FC, useMemo } from 'react'
import { Menu, Tag } from 'antd'
import { useSetState } from 'ahooks'
import classnames from 'classnames'
import { DownOutlined, UpOutlined } from '@ant-design/icons'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import { useCurrentUser } from '@/hooks/useCurrentUser'
import { FontIcon } from '@/icons'
import {
    formatError,
    getNotifications,
    getUserDetails,
    IRole,
    LoginPlatform,
} from '@/core'
import styles from './styles.module.less'
import __ from './locale'
import { menus, routes } from './const'
import { AssetsVisitorProvider } from '../MyAssets/AssetsVisitorProvider'
import { getPlatformNumber, useQuery } from '@/utils'
import { IconType } from '@/icons/const'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const PersonalCenter = () => {
    const navigate = useNavigate()
    const [searchParams] = useSearchParams()
    const leftTab = searchParams.get('leftTab')
    const subTabKey = searchParams.get('subTabKey')
    const [info] = useCurrentUser()
    const [Route, setRoute] = useSetState<{
        Component: FC<any>
        props: Record<string, any>
        // eslint-disable-next-line react/no-unstable-nested-components
    }>({ Component: () => <div />, props: {} })
    const query = useQuery()
    const { pathname } = useLocation()
    const platformNumber = getPlatformNumber()
    const [roleList, setRoleList] = useState<Array<IRole>>([])

    const [isAppDeveloperEmpty, setIsAppDeveloperEmpty] =
        useState<boolean>(false)
    const [expanded, setExpanded] = useState(false)
    const tagsRef = useRef<HTMLDivElement>(null)
    const [displayedCount, setDisplayedCount] = useState(0)
    const [messages, setMessages] = useState<any[]>([])
    const { checkPermission } = useUserPermCtx()
    const [{ using }] = useGeneralConfig()
    const DETAULT_MENU = useMemo(() => {
        return platformNumber === LoginPlatform.default
            ? 'myCollections'
            : 'apply'
    }, [platformNumber])
    const [activeKey, setActiveKey] = useState<string>(DETAULT_MENU)

    const unRead = useMemo(() => {
        const unReadMsgs = messages.filter((msg) => !msg?.read)?.length ?? 0

        if (unReadMsgs === 0) return ''

        return unReadMsgs > 99 ? '99+' : `${unReadMsgs}`
    }, [messages])

    const menuProps = useMemo(() => {
        let res
        res = menus
            .filter((menu) => {
                if (menu.key === 'integratedApp') {
                    return checkPermission('manageIntegrationApplication')
                }
                if (menu.key === 'myApplys') {
                    return checkPermission(
                        [
                            { key: 'initiateDataSupplyDemand' },
                            { key: 'analysisAndImplementSupplyDemand' },
                            { key: 'initiateSharedApplication' },
                            { key: 'initiateDataAnalysisDemand' },
                            { key: 'applicationFrontMachine' },
                        ],
                        'or',
                        true,
                    )
                }
                return true
            })
            .map((menu) => {
                if (menu.key === 'myMsg') {
                    return {
                        ...menu,
                        label: (
                            <span className={styles.msgMenu}>
                                <span>{menu.label}</span>
                                {unRead !== '' && <span>{unRead}</span>}
                            </span>
                        ),
                    }
                }
                return menu
            })
        if (using === 2) {
            res = res.filter((item) => item.key !== 'myRating')
        }
        if (platformNumber === LoginPlatform.default) {
            res = res.filter((item) => item.key !== 'myResForCS')
        } else {
            res = res.filter((item) => item.key !== 'myAssets')
        }
        return res
    }, [unRead])

    const getUserInfo = async () => {
        try {
            const res = await getUserDetails(info?.ID)
            if (res) {
                const { roles = [], role_groups = [] } = res
                const totalRoles: any[] = [
                    ...roles,
                    ...role_groups.map((item) => item.roles || []).flat(),
                ]
                const roleMap = new Map()
                totalRoles.forEach((role) => {
                    if (!roleMap.has(role.id)) {
                        roleMap.set(role.id, role)
                    }
                })
                const allRoles = Array.from(roleMap.values())
                setRoleList(allRoles)
            }
        } catch (error) {
            formatError(error)
        }
    }

    const updateMessages = async (params) => {
        try {
            const res = await getNotifications(params)
            setMessages(res?.entries)
        } catch (error) {
            formatError(error)
        }
    }

    const onMenusChange = ({ key }) => {
        setActiveKey(key)
        const item = routes.find((route) => route.key === key)
        if (item && item.element) {
            let props: Record<string, any> = {}
            if (key === 'integratedApp') {
                props = {
                    updateAssetList: setIsAppDeveloperEmpty,
                }
            } else if (key === 'myMsg') {
                props = {
                    onMessageChange(msgs) {
                        setMessages(msgs)
                    },
                }
            }
            if (key === 'docAuditClient') {
                if (!pathname.includes('/personal-center/doc-audit-client')) {
                    navigate('/personal-center/doc-audit-client')
                }
            } else if (pathname.includes('/doc-audit-client')) {
                const pathArr =
                    pathname?.slice(-1) === '/'
                        ? pathname.slice(0, pathname.length - 1).split('/')
                        : pathname.split('/')
                pathArr.pop()
                const newPath = pathArr.join('/')
                navigate(newPath)
            }
            setRoute({
                Component: item.element,
                props:
                    typeof item.props === 'function'
                        ? item.props(props)
                        : item.props ?? {},
            })
        }
    }

    useEffect(() => {
        const calculateDisplayedCount = () => {
            if (!tagsRef.current) return
            const tags = tagsRef.current.children
            let rowCount = 0
            let prevTop: number | null = null
            for (let i = 0; i < tags.length; i += 1) {
                const tag = tags[i]
                const rect = tag.getBoundingClientRect()
                if (prevTop !== null && rect.top !== prevTop) {
                    rowCount += 1
                    if (rowCount === 2) {
                        setDisplayedCount(i)
                        return
                    }
                }
                prevTop = rect.top
            }
            setDisplayedCount(tags.length)
        }

        calculateDisplayedCount()
    }, [roleList])

    const displayedRoles = expanded
        ? roleList
        : roleList.slice(0, displayedCount || roleList.length)

    useEffect(() => {
        if (pathname.includes('/personal-center/doc-audit-client')) {
            onMenusChange({ key: 'docAuditClient' })
        } else if (leftTab) {
            onMenusChange({ key: leftTab })
        } else {
            onMenusChange({ key: DETAULT_MENU })
        }
        getUserInfo()
        updateMessages({ limit: 100, offset: 1 })
    }, [])

    return (
        <div className={styles.personalCenter}>
            <div className={styles['personalCenter-sidebar']}>
                <div className={styles['personalCenter-sidebar-userInfo']}>
                    <div className={styles['userinfo-container']}>
                        <span className={styles['userinfo-container-icon']}>
                            <FontIcon
                                name="icon-wubeijingtouxiang"
                                type={IconType.COLOREDICON}
                            />
                        </span>
                        <span
                            title={info?.VisionName || '--'}
                            className={styles.userName}
                        >
                            {info?.VisionName || '--'}
                        </span>
                    </div>
                    <div className={styles['userinfo-position']}>
                        {/* <div className={styles['userinfo-position-row']}>
                                <div>{__('部门')}：</div>
                                <div>
                                    {details.parent_deps?.[0]
                                    ?.map((dep) => dep.department_name)
                                    ?.join('/') ?? ''}
                                </div>
                            </div> */}
                        <div className={styles['userinfo-position-row']}>
                            <div>{__('角色')}：</div>
                            <div ref={tagsRef}>
                                {displayedRoles.map((role, index) => (
                                    <Tag
                                        className={styles.tag}
                                        key={index}
                                        title={role.name}
                                    >
                                        {role.name}
                                    </Tag>
                                ))}
                                {roleList.length > displayedCount && (
                                    <span
                                        className={classnames(
                                            styles.tag,
                                            styles.btn,
                                        )}
                                        onClick={() => {
                                            setExpanded(
                                                (prevState) => !prevState,
                                            )
                                        }}
                                    >
                                        {expanded ? __('收起') : __('展开')}
                                        {expanded ? (
                                            <UpOutlined />
                                        ) : (
                                            <DownOutlined />
                                        )}
                                    </span>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
                <Menu
                    mode="inline"
                    defaultSelectedKeys={[
                        pathname.includes('/personal-center/doc-audit-client')
                            ? 'docAuditClient'
                            : leftTab || DETAULT_MENU,
                    ]}
                    items={menuProps}
                    onClick={onMenusChange}
                />
            </div>
            <div
                className={classnames(styles['personalCenter-content'], {
                    [styles.docAuditClientContent]:
                        activeKey === 'docAuditClient',
                })}
                style={Route.props.wrapperStyle ?? {}}
            >
                <AssetsVisitorProvider key={activeKey}>
                    {Route.Component && (
                        <Route.Component
                            {...Route.props}
                            isPersonalCenter
                            subTabKey={subTabKey}
                        />
                    )}
                </AssetsVisitorProvider>
            </div>
        </div>
    )
}

export default PersonalCenter
