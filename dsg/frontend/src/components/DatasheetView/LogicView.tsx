import React, { memo, useEffect, useMemo } from 'react'
import { Tabs } from 'antd'
import { useLocation, useNavigate } from 'react-router-dom'
import classnames from 'classnames'
import styles from './styles.module.less'
import __ from './locale'
import { LogicViewType, LoginPlatform } from '@/core'
import { tabItems } from './const'
import DatasheetView from '../DatasheetView'
import LogicEntityLogicView from './LogicEntityView'
import CustomView from './CustomView'
import { useQuery, getPlatformNumber } from '@/utils'
import { useDataViewContext } from './DataViewProvider'
import MyTaskDrawer from '../AssetCenterHeader/MyTaskDrawer'
/**
 * 库表外框
 */
const LogicView = () => {
    const navigator = useNavigate()
    const query = useQuery()
    const tab = query.get('tab') || LogicViewType.DataSource
    const { setLogicViewType, showMytask, setShowMytask } = useDataViewContext()
    const platform = getPlatformNumber()

    useEffect(() => {
        if (tab) {
            setLogicViewType(tab)
        }
    }, [])

    const handleTabChange = (key) => {
        navigator(`/datasheet-view?tab=${key}`)
        setLogicViewType(key)
    }

    return (
        <div className={styles.logicView}>
            {platform === LoginPlatform.default && (
                <Tabs
                    defaultActiveKey={LogicViewType.DataSource}
                    activeKey={tab}
                    onChange={handleTabChange}
                    items={tabItems}
                    className={styles.logicViewTabs}
                />
            )}
            <div
                className={classnames(styles['logicView-container'], {
                    [styles['logicView-container-drmb']]:
                        platform === LoginPlatform.drmb,
                })}
            >
                {tab === LogicViewType.DataSource && <DatasheetView />}
                {tab === LogicViewType.Custom && <CustomView />}
                {tab === LogicViewType.LogicEntity && <LogicEntityLogicView />}
            </div>

            {showMytask && (
                <MyTaskDrawer
                    open={showMytask}
                    onClose={() => {
                        setShowMytask(false)
                    }}
                    tabKey="1"
                />
            )}
        </div>
    )
}

export default memo(LogicView)
