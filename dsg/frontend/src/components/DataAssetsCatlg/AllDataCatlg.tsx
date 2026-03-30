import React, { useMemo, useState, ReactNode, useRef } from 'react'
import { Tabs } from 'antd'
import styles from './styles.module.less'
import __ from './locale'
import { getPlatformNumber, useQuery } from '@/utils'
import { ServiceType } from './helper'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import DataCatlg from './DataCatlg'
import InfoResourcesCatlg from './InfoResourcesCatlg'
import Interface from './Interface'
import { useRescProviderContext } from './RescProvider'
import ApplicationService from './ApplicationService'

interface IAllDataCatlgProps {
    ref?: any
    searchKey: string
    getClickAsset?: (asset: any, st: ServiceType) => void
    getAddAsset?: (asset: any) => void
    addedAssets?: any[]
    isIntroduced?: boolean
    searchRender?: any
}

const AllDataCatlg: React.FC<IAllDataCatlgProps> = (props: any, ref) => {
    const {
        searchKey,
        getClickAsset,
        getAddAsset,
        addedAssets,
        isIntroduced,
        searchRender,
    } = props
    const query = useQuery()
    const [{ governmentSwitch, local_app, using }] = useGeneralConfig()
    const platform = getPlatformNumber()

    const [activeKey, setActiveKey] = useState<string>()

    const catlgItems = useMemo(() => {
        const tabs = [
            {
                label: __('库表'),
                key: ServiceType.LOGICVIEW,
                show: using === 2,
            },
            {
                label: __('数据资源目录'),
                key: ServiceType.DATACATLG,
                show: using === 1,
            },
            {
                label: __('接口服务'),
                key: ServiceType.APPLICATIONSERVICE,
                show: using === 2 || using === 1,
            },
        ]?.filter((item) => item?.show) as Array<{
            key: string
            label: ReactNode
        }>
        setActiveKey(tabs[0]?.key)
        return tabs
    }, [governmentSwitch?.on, platform])

    const { resetCatlgView } = useRescProviderContext()

    return (
        <>
            <div className={styles.bannerWrapper}>
                <h1>{__('数据服务超市')}</h1>
                {/* <div className={styles.bannerContent}>
                    {__('简化数据管理，极简找数用数，实现数据资产')}
                </div> */}
            </div>
            <Tabs
                activeKey={activeKey}
                onChange={(key) => {
                    setActiveKey(key)
                    resetCatlgView?.()
                }}
                getPopupContainer={(node) => node}
                tabBarGutter={32}
                items={catlgItems}
                destroyInactiveTabPane
                className={styles.serviceTabs}
                tabBarExtraContent={{
                    right: null,
                }}
            />

            {/* 信息资源目录 */}
            {activeKey === ServiceType.INFORESOURCESDATACATLG && (
                <InfoResourcesCatlg />
            )}
            {activeKey === ServiceType.LOGICVIEW && (
                <ApplicationService
                    searchKey={searchKey}
                    isIntroduced={isIntroduced}
                    getClickAsset={getClickAsset}
                    getAddAsset={getAddAsset}
                />
            )}
            {/* 数据资源目录 */}
            {activeKey === ServiceType.DATACATLG && (
                <DataCatlg
                    // ref={dataRef}
                    searchKey={searchKey}
                    getClickAsset={getClickAsset}
                    getAddAsset={getAddAsset}
                    addedAssets={addedAssets}
                    isIntroduced={isIntroduced}
                    searchRender={searchRender}
                />
            )}
            {/* 接口服务 */}
            {activeKey === ServiceType.APPLICATIONSERVICE && <Interface />}
        </>
    )
}

export default AllDataCatlg
