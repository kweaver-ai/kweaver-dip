import { useMemo, useRef, useState } from 'react'
import { Tabs } from 'antd'
import DataUndsFinishContent from './DataUndsFinishContent'
import styles from './styles.module.less'
import __ from './locale'
import useScopePermission from '@/hooks/useScopePermission'
import { PermissionScope } from '@/core'

const DataCatalogUnderstanding = () => {
    const [activeKey, setActiveKey] = useState<PermissionScope>()
    const [count, setCount] = useState({
        [PermissionScope.All]: 0,
        [PermissionScope.Organization]: 0,
    })
    const { scope } = useScopePermission()

    const handleTabChange = (key: string) => {
        setActiveKey(key as PermissionScope)
    }

    const tabItems = useMemo(() => {
        const TabItems = [
            {
                label: `${__('所有数据理解报告')}(${
                    count[PermissionScope.All]
                })`,
                key: PermissionScope.All,
                children: (
                    <DataUndsFinishContent
                        isAll
                        onCountChange={(num) =>
                            setCount((prev) => ({
                                ...prev,
                                [PermissionScope.All]: num ?? 0,
                            }))
                        }
                    />
                ),
                forceRender: true,
            },
            {
                label: `${__('本部门数据理解报告')}(${
                    count[PermissionScope.Organization]
                })`,
                key: PermissionScope.Organization,
                children: (
                    <DataUndsFinishContent
                        onCountChange={(num) =>
                            setCount((prev) => ({
                                ...prev,
                                [PermissionScope.Organization]: num ?? 0,
                            }))
                        }
                    />
                ),
                forceRender: true,
            },
        ]
        // if (scope === PermissionScope.All) {
        return TabItems
        // }
        // return TabItems.filter((item) => item.key === scope)
    }, [scope, count])

    return (
        <div className={styles.dataCatalogUnderstandingWrap}>
            <Tabs
                activeKey={activeKey}
                onChange={handleTabChange}
                items={tabItems}
                className={styles.catlgTabs}
                destroyInactiveTabPane={false}
            />
        </div>
    )
}

export default DataCatalogUnderstanding
