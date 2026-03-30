import * as React from 'react'
import { useState, useEffect } from 'react'
import { ShrinkOutlined } from '@ant-design/icons'
import { Anchor, Button, Space, Tooltip } from 'antd'
import { AnchorContainer } from 'antd/lib/anchor/Anchor'
import __ from '../locale'
import styles from './styles.module.less'
import CommonIcon from '@/components/CommonIcon'
import { ReactComponent as hoverNavigation } from '@/icons/svg/outlined/hoverNavigation.svg'

type NavItem = {
    id: string
    label: string
    children?: Array<NavItem>
}

interface AnchorMenuType {
    navData: Array<NavItem>
    getContainer?: () => HTMLElement
    targetOffset?: number
}

const AnchorMenu = ({
    navData,
    getContainer,
    targetOffset = 160,
}: AnchorMenuType) => {
    const [expand, setExpand] = useState<boolean>(true)
    const { Link } = Anchor

    const getLabel = (label) => {
        return (
            <div className={styles.itemLabel}>
                <div className={styles.itemDot} />
                <div className={styles.label}>{label}</div>
            </div>
        )
    }

    const getAnchorItem = (navs: Array<NavItem>) => {
        return (
            <>
                {navs.map((nav) => {
                    if (nav?.children?.length) {
                        return (
                            <Link href={nav.id} title={getLabel(nav.label)}>
                                {getAnchorItem(nav?.children)}
                            </Link>
                        )
                    }
                    return <Link href={nav.id} title={getLabel(nav.label)} />
                })}
            </>
        )
    }

    return (
        <Anchor
            getContainer={getContainer}
            showInkInFixed={false}
            targetOffset={targetOffset}
            bounds={1}
        >
            {expand ? (
                <div className={styles.navAnchorExpand}>
                    <div className={styles.nvaTitleBar}>
                        <span className={styles.title}>{__('导航')}</span>
                        <Tooltip placement="bottom" title={__('收起导航')}>
                            <ShrinkOutlined
                                onClick={() => {
                                    setExpand(false)
                                }}
                            />
                        </Tooltip>
                    </div>
                    <div>{getAnchorItem(navData)}</div>
                </div>
            ) : (
                <div
                    style={{
                        width: 142,
                    }}
                >
                    <Tooltip title={__('展开导航')} placement="bottom">
                        <Button
                            shape="circle"
                            icon={<CommonIcon icon={hoverNavigation} />}
                            size="large"
                            className={styles.ra_hoverBtn}
                            onClick={() => {
                                setExpand(true)
                            }}
                        />
                    </Tooltip>
                </div>
            )}
        </Anchor>
    )
}

export default AnchorMenu
