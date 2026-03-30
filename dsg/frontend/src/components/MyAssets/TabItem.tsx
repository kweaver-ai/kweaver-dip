import React, { useState, useEffect } from 'react'
import classNames from 'classnames'
import styles from './styles.module.less'
import { useAssetsContext } from './AssetsVisitorProvider'
import __ from './locale'
import { TabKey, TabsList } from './helper'
import { AssetVisitorTypes } from './const'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

const TabItem = ({
    active,
    tabsChange,
}: {
    active: string
    tabsChange: (key: string) => void
}) => {
    const { updateSelectedType, isAppDeveloper } = useAssetsContext()
    const [{ using }] = useGeneralConfig()

    const [tabs, setTabs] = useState(TabsList)

    useEffect(() => {
        let newTabs = isAppDeveloper
            ? TabsList
            : TabsList.filter((item) => item.key !== TabKey.Application)
        if (using === 2) {
            newTabs = newTabs.filter((item) => item.key !== TabKey.Score)
        }
        setTabs(newTabs)
    }, [isAppDeveloper])

    const handeTabsChange = (item) => {
        switch (item.key) {
            case TabKey.Application:
                updateSelectedType(AssetVisitorTypes.APPLICATION)
                break
            case TabKey.AvailableAssets:
                updateSelectedType(AssetVisitorTypes.USER)
                break
            default:
                break
        }
        tabsChange(item.key)
    }

    return (
        <>
            {tabs.map((item) => {
                return (
                    <div
                        key={item.key}
                        className={classNames(
                            styles.tabItem,
                            active === item.key && styles.active,
                        )}
                        onClick={() => handeTabsChange(item)}
                    >
                        <span className={styles.listIcon}>{item?.icon}</span>
                        <span title={item.label} className={styles.listText}>
                            {item.label}
                        </span>
                    </div>
                )
            })}
        </>
    )
}

export default TabItem
