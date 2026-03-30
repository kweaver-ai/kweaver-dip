import React, { useEffect, useMemo, useState } from 'react'
import classnames from 'classnames'
import DataResource from './DataResource'
import ApiService from './ApiService'
import styles from './styles.module.less'
import __ from './locale'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { getPlatformNumber } from '@/utils'
import DataUnderstandingReport from './DataUnderstandingReport'
import WorkOrderQuality from './WorkOrderQuality'
import WorkOrderQualityExamine from './WorkOrderQualityExamine'
import DataView from './DataView'

const MenuItems = [
    {
        key: 'data-view',
        label: __('库表上线'),
        children: <DataView />,
    },
    {
        key: 'api-service',
        label: __('接口管理'),
        children: <ApiService />,
    },
    {
        key: 'data-catalog',
        label: __('数据资源目录'),
        children: <DataResource />,
    },
    {
        key: 'data-understanding-report',
        label: __('数据理解报告'),
        children: <DataUnderstandingReport />,
    },
    // {
    //     key: 'work-order-data-quality-audit',
    //     label: __('质量检测工单'),
    //     children: <WorkOrderQualityExamine />,
    // },
    // {
    //     key: 'work-order-quality',
    //     label: __('数据质量整改'),
    //     children: <WorkOrderQuality />,
    // },
]

interface IConfirm {
    content?: React.ReactNode
}

const AuditPolicy: React.FC<IConfirm> = () => {
    const [{ using, governmentSwitch }] = useGeneralConfig()
    const [activeMenu, setActiveMenu] = useState<any>()
    const platform = getPlatformNumber()
    const menus = useMemo(() => {
        const isResource = using === 2
        const filterKeys = isResource
            ? ['data-understanding-report', 'data-understanding-report']
            : []
        return MenuItems.filter(
            (item) =>
                governmentSwitch.on ||
                !item.key.startsWith('sszd-') ||
                item.key === 'sszd-app-apply-escalate',
        )
            .filter((item) =>
                using === 1
                    ? item.key !== 'data-view'
                    : !['data-catalog', 'catalog-open'].includes(item.key),
            )
            .filter((item) => {
                if (platform === 1) {
                    // 标品，过滤掉指定的菜单项
                    return ![
                        'data-push',
                        'catalog-open',
                        'city-demand',
                        'data-investigation-report',
                        'front-machine-apply',
                        'tag-management',
                    ].includes(item.key)
                }
                // cs ，过滤掉data-requirement，显示city-demand
                return item.key !== 'data-requirement'
            })
            .filter((item) => !filterKeys.includes(item.key))
    }, [using, governmentSwitch.on, platform])

    useEffect(() => {
        if (menus?.length) {
            setActiveMenu(menus[0])
        }
    }, [menus])
    return (
        <div className={styles.container}>
            <div className={styles['container-left']}>
                {menus.map((k) => (
                    <div
                        key={k.key}
                        className={classnames({
                            [styles['policy-type']]: true,
                            [styles['is-active']]: activeMenu?.key === k.key,
                        })}
                        onClick={() => setActiveMenu(k)}
                    >
                        {k.label}
                    </div>
                ))}
            </div>
            <div className={styles['container-right']}>
                {activeMenu?.children}
            </div>
        </div>
    )
}

export default AuditPolicy
