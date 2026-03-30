import { Tabs } from 'antd'
import React from 'react'
import { ResourceType } from '../ResourceDirReport/const'
import { TabKey } from '../ResourcesDir/const'
import { dirContItems } from '../ResourcesDir/helper'
import styles from './styles.module.less'

interface IAuditTabs {
    type: ResourceType
    activeKey: TabKey
    setActiveKey: (tabKey: TabKey) => void
}

const AuditTabs: React.FC<IAuditTabs> = ({ type, activeKey, setActiveKey }) => {
    return (
        <div className={styles.tabs}>
            <Tabs
                activeKey={activeKey}
                onChange={(e) => {
                    setActiveKey(e as TabKey)
                }}
                getPopupContainer={(node) => node}
                tabBarGutter={32}
                items={
                    type === ResourceType.VIEW
                        ? dirContItems
                        : dirContItems?.filter(
                              (item) =>
                                  item.key !== TabKey.CONSANGUINITYANALYSIS &&
                                  item.key !== TabKey.DATAPREVIEW,
                          )
                }
                destroyInactiveTabPane
            />
        </div>
    )
}
export default AuditTabs
