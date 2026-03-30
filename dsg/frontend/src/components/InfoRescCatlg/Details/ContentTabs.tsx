import React, {
    useContext,
    useEffect,
    useImperativeHandle,
    useRef,
    useState,
    useMemo,
} from 'react'
import { useParams } from 'react-router-dom'
import { Tabs } from 'antd'
import form from 'antd/lib/form'
import {
    formatError,
    getCoreBusinessDetails,
    ICoreBusinessDetails,
} from '@/core'
import { TaskInfoContext } from '@/context'
import styles from './styles.module.less'
import { useQuery } from '@/utils'
import { dirContItems, TabKey } from './helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

interface ITabs {
    id: string
    activeKey: TabKey
    setActiveKey: (tabKey: TabKey) => void
}

const ContentTabs: React.FC<ITabs> = ({ id, activeKey, setActiveKey }) => {
    // 表单类型
    const query = useQuery()
    const resourcesType = query.get('resourcesType') || '2'

    useEffect(() => {
        // 默认跳转存在
        const tab = query.get('targetTab')
        if (tab) {
            setActiveKey(tab as TabKey)
        }
    }, [id])

    return (
        <div className={styles.tabs}>
            <Tabs
                activeKey={activeKey}
                onChange={(e) => {
                    setActiveKey(e as TabKey)
                }}
                getPopupContainer={(node) => node}
                tabBarGutter={32}
                items={dirContItems}
                destroyInactiveTabPane
            />
        </div>
    )
}
export default ContentTabs
