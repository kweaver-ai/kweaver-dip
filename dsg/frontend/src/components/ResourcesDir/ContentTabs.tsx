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
    HasAccess,
    ICoreBusinessDetails,
} from '@/core'
import { ResourceType, TabKey } from './const'
import { TaskInfoContext } from '@/context'
import styles from './styles.module.less'
import { useQuery } from '@/utils'
import { dirContItems, dirFileContItems } from './helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import { useResourcesCatlogContext } from './ResourcesCatlogProvider'

interface ITabs {
    id: string
    activeKey: TabKey
    setActiveKey: (tabKey: TabKey) => void
}

const ContentTabs: React.FC<ITabs> = ({ id, activeKey, setActiveKey }) => {
    // 表单类型
    const query = useQuery()
    const resourcesType = query.get('resourcesType') || '2'
    const { checkPermissions } = useUserPermCtx()
    const { isFileRescType } = useResourcesCatlogContext()

    useEffect(() => {
        // 默认跳转存在
        const tab = query.get('targetTab')
        if (tab) {
            setActiveKey(tab as TabKey)
        }
    }, [id])

    const isTrueRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])

    const tabItems = useMemo(() => {
        const items =
            resourcesType === '1'
                ? dirContItems
                : isFileRescType
                ? dirFileContItems
                : dirContItems?.filter(
                      (item) =>
                          item.key !== TabKey.CONSANGUINITYANALYSIS &&
                          item.key !== TabKey.DATAPREVIEW,
                  )

        return isTrueRole
            ? items
            : items?.filter((item) => item.key !== TabKey.SCORE)
    }, [resourcesType, isTrueRole, isFileRescType])

    return (
        <div className={styles.tabs}>
            <Tabs
                activeKey={activeKey}
                onChange={(e) => {
                    setActiveKey(e as TabKey)
                }}
                getPopupContainer={(node) => node}
                tabBarGutter={32}
                items={tabItems}
                destroyInactiveTabPane
            />
        </div>
    )
}
export default ContentTabs
