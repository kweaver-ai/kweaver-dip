import { Dropdown, Menu, MenuProps } from 'antd'
import classnames from 'classnames'
import React, { useEffect, useMemo, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { DownOutlined } from '@ant-design/icons'
import { getActualUrl, getPlatformNumber } from '@/utils'
import { MenuOutlined } from '@/icons'
import {
    findFirstPathByKeys,
    findFirstPathByModule,
    getRouteByAttr,
    getRouteByModule,
    useMenus,
} from '@/hooks/useMenus'
import styles from './styles.module.less'
import { homeRouteKeys } from '@/routers/config'
import { LoginPlatform } from '@/core'

const PortalMenu: React.FC = () => {
    const [dropdownOpen, setDropdownOpen] = useState<boolean>(false)

    const domBtnRef = useRef<HTMLDivElement>(null)

    const [selectedKey, setSelectedKey] = useState<string[]>([])
    const navigate = useNavigate()
    const { pathname } = useLocation()
    const ref = useRef(null)
    const [menus] = useMenus()

    const menuItems: MenuProps['items'] = useMemo(() => {
        const items = homeRouteKeys[LoginPlatform.drmp]
            .map((item) => {
                // TODO homeRouteKeys目前只放开了两个菜单
                const menu = menus.find((it) => it.key === item)
                if (menu) {
                    const { key, label } = menu
                    if (menu.type === 'module') {
                        const childs = getRouteByModule(key).filter(
                            (m) => m.type !== 'group',
                        )
                        return {
                            key,
                            label,
                            title: (
                                <span className={styles.menuTitleWrapper}>
                                    <span className={styles.menuTitle}>
                                        {label}
                                    </span>
                                    <DownOutlined />
                                </span>
                            ),
                            type: 'SubMenu',
                            children: childs.map((c) => ({
                                key: c.key,
                                label: c.label,
                            })),
                        }
                    }
                    return { key, label, title: label }
                }
                return null
            })
            .filter((item) => item !== null)

        return items
    }, [selectedKey, menus?.length])

    /**
     * 获取选中菜单的路径
     * @returns 路径
     */
    const getDefaultSelectKey = () => {
        const pathnameArr: string[] = pathname.split('/')
        if ((menuItems || []).find((item) => item?.key === pathnameArr[1])) {
            setSelectedKey([pathnameArr[1]])
        } else {
            setSelectedKey([pathnameArr[1], 'more'])
        }
    }

    const handleMenuClick = (item) => {
        const { key, keyPath } = item
        setSelectedKey(keyPath)
        const findMenu = menus.find((it) => it.key === key)
        if (findMenu.type === 'module') {
            const firstUrl = findFirstPathByModule(key)
            window.open(
                getActualUrl(firstUrl, true, LoginPlatform.drmp),
                '_self',
            )
        } else {
            const currentRoute = getRouteByAttr(key, 'key')
            const firstUrl = currentRoute?.path || findFirstPathByKeys([key])
            window.open(
                getActualUrl(firstUrl, true, LoginPlatform.drmp),
                '_self',
            )
        }
    }

    useEffect(() => {
        getDefaultSelectKey()
    }, [pathname])

    return (
        <div className={styles.globalMenuWrapper}>
            <Dropdown
                overlay={<Menu items={menuItems} onClick={handleMenuClick} />}
                trigger={['click']}
                open={dropdownOpen}
                overlayClassName={classnames(styles.globalMenuPopupWrapper)}
            >
                <div
                    ref={domBtnRef}
                    className={styles.globalIconBox}
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                >
                    <MenuOutlined className={styles.globalIcon} />
                </div>
            </Dropdown>
        </div>
    )
}

export default PortalMenu
