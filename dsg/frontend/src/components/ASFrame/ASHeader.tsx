import { Tooltip, Menu } from 'antd'
import { useState, useMemo, useEffect } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import DataDownloadDrawer from '@/components/AssetCenterHeader/MyTaskDrawer'
import { FontIcon } from '@/icons'
import styles from './styles.module.less'
import __ from './locale'
import { HasAccess } from '@/core'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface IItems {
    // 显示名
    label: string

    // key
    key: string
}

function ASHeader() {
    const navigate = useNavigate()
    const location = useLocation()

    // 当前选中item key
    const [current, setCurrent] = useState<string>('')
    // menu item
    const [items, setItems] = useState<IItems[]>([])
    // 是否显示下载弹窗
    const [downloadVisible, setDownloadVisible] = useState(false)
    const { checkPermission, checkPermissions, checking } = useUserPermCtx()
    const applyRoles = useMemo(
        () => checkPermissions(HasAccess.isHasBusiness) ?? false,
        [checkPermissions],
    )

    const handleClickReview = () => {
        navigate('/test')
    }

    const onClick = (e) => {
        setCurrent(e.key)
        navigate(`/${e.key}`)
    }

    useMemo(() => {
        if (checking) {
            return
        }

        let menuItems: IItems[] = []
        if (checkPermission('accessDataResource')) {
            menuItems = [
                ...menuItems,
                {
                    label: __('数据服务超市'),
                    key: 'data-assets',
                },
            ]
        }

        menuItems = [
            ...menuItems,
            {
                label: __('我的'),
                key: 'my-assets',
            },
        ]

        if (checkPermission('demandAnalysisAndImplement')) {
            menuItems = [
                ...menuItems,
                {
                    label: __('需求申请'),
                    key: 'demand-application',
                },
            ]
        }

        setItems(menuItems)

        if (menuItems.length === 0) {
            navigate('/403?errCode=RolesNotSupport')
        } else {
            const pathname = location?.pathname?.slice(1)
            let cur = ''
            if (menuItems.find((item) => item.key === pathname)) {
                cur = pathname
            } else {
                cur = menuItems[0].key
            }

            setCurrent(cur)
        }
    }, [checking])

    return (
        <div className={styles.header}>
            <Menu
                onClick={onClick}
                selectedKeys={[current]}
                mode="horizontal"
                items={items}
                className={styles.menu}
            />
            <div className={styles.optionsWrapper}>
                {applyRoles && (
                    <div
                        className={styles.iconWrapper}
                        onClick={() => setDownloadVisible(true)}
                    >
                        <Tooltip title={__('下载任务')}>
                            <div className={styles.icon}>
                                <FontIcon name="icon-xiazai1" />
                            </div>
                        </Tooltip>
                        <div className={styles.tips}>{__('下载任务')}</div>
                    </div>
                )}
                {/* <div className={styles.iconWrapper} onClick={handleClickReview}>
                    <Tooltip title={__('审核待办')}>
                        <div className={styles.icon}>
                            <FontIcon name="icon-a-shenhedaibanxianxing" />
                        </div>
                    </Tooltip>
                    <div className={styles.tips}>{__('审核待办')}</div>
                </div> */}
            </div>
            {downloadVisible ? (
                <DataDownloadDrawer
                    open={downloadVisible}
                    onClose={() => setDownloadVisible(false)}
                    hideExplorationTask
                />
            ) : null}
        </div>
    )
}

export default ASHeader
