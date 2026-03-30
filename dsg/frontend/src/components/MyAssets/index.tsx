import React, { useEffect, useRef, useState } from 'react'
import { useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import classNames from 'classnames'
import { TabsList, TabKey } from './helper'
import styles from './styles.module.less'
import { useQuery, getActualUrl } from '@/utils'
import AvailableAsset from './AvailableAsset'
import __ from './locale'
import {
    AssetsVisitorProvider,
    useAssetsContext,
} from './AssetsVisitorProvider'
import AssetsVisitorList from './AssetsVisitorList'
import LogicViewDetail from '../DataAssetsCatlg/LogicViewDetail'
import IndicatorViewDetail from '../DataAssetsCatlg/IndicatorViewDetail'
import { MyFeedbackList } from '../FeedbackResMode'
import DragBox from '../DragBox'
import TabItem from './TabItem'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import MyScore from './MyScore'
import MyFavoriteList from '../FavoriteResMode'
import MyDataset from '../Dataset'
import IntegralPreview from './IntegralPreview'
import MyMessages from '../MyMessages'
import DocAuditClientPlugin from '../DocAuditClientPlugin'
import { useUserPermCtx } from '@/context/UserPermissionProvider'
import App from './App'

const MyAssets = () => {
    const [active, setActive] = useState<TabKey>(TabKey.AuditPending)
    const [defaultSize, setDefaultSize] = useState<Array<number>>([10, 90])
    const query = useQuery()
    const navigator = useNavigate()
    const { pathname } = useLocation()
    const menuType = query.get('menuType') || undefined
    const { checkPermission } = useUserPermCtx()

    const [isAppDeveloperEmpty, setIsAppDeveloperEmpty] =
        useState<boolean>(false)

    // 是否开启本地应用
    const [{ local_app }] = useGeneralConfig()

    const [searchParams, setSearchParams] = useSearchParams()
    // 库表详情 id
    const dataviewId = query.get('dataviewId') || ''
    // 指标详情id
    const indicatorId = query.get('indicatorId') || ''
    // 数据库表详情
    const [dataviewOpen, setDataviewOpen] = useState<boolean>(false)
    // 指标详情
    const [indicatorOpen, setIndicatorOpen] = useState<boolean>(false)

    // useEffect(() => {
    //     if (dataviewId) {
    //         setDataviewOpen(true)
    //         return
    //     }
    //     if (indicatorId) {
    //         setIndicatorOpen(true)
    //     }
    // }, [dataviewId, indicatorId])

    useEffect(() => {
        if (menuType) {
            setActive(menuType as TabKey)
        }
    }, [menuType])

    const tabsChange = (key) => {
        if (key === TabKey.AuditPending) {
            navigator(`/my-assets/doc-audit-client`)
        } else {
            navigator(`/my-assets/?menuType=${key}`)
        }
        setActive(key)
    }

    return (
        // <div className={styles.myAssetsWrapper}>
        <AssetsVisitorProvider>
            {/* <div className={styles.contentBox}>
                    {searchRole && (
                        <div
                            className={
                                isAppDeveloperEmpty
                                    ? styles.listEmpty
                                    : styles.listWrapper
                            }
                        >
                            <AssetsVisitorList
                                updateAssetList={setIsAppDeveloperEmpty}
                            />
                        </div>
                    )}

                    {isAppDeveloperEmpty ? null : (
                        <div className={styles.tableWrapper}>
                            <AvailableAsset />
                        </div>
                    )}
                    <AvailableAssets />
                </div> */}

            <DragBox
                defaultSize={defaultSize}
                minSize={[120, 500]}
                maxSize={[480, Infinity]}
                onDragEnd={(size) => {
                    setDefaultSize(size)
                }}
                showExpandBtn={false}
            >
                <div className={styles.leftBox}>
                    <TabItem active={active} tabsChange={tabsChange} />
                </div>
                <div className={styles.rigthBox}>
                    {active === TabKey.AvailableAssets && <AvailableAsset />}
                    {/* {active === TabKey.MyDemand && <DemandApplication />} */}
                    {active === TabKey.AuditPending && (
                        <DocAuditClientPlugin
                            basePath={getActualUrl(
                                '/my-assets/doc-audit-client',
                            ).substring(1)}
                        />
                    )}
                    {active === TabKey.Application &&
                        checkPermission('manageIntegrationApplication') && (
                            // <AssetsVisitorList
                            //     updateAssetList={setIsAppDeveloperEmpty}
                            // />
                            <App />
                        )}
                    {active === TabKey.Favorite && <MyFavoriteList />}
                    {active === TabKey.Dataset && <MyDataset />}
                    {active === TabKey.Feedback && <MyFeedbackList />}
                    {active === TabKey.Score && <MyScore />}
                    {active === TabKey.Integral && <IntegralPreview />}
                    {active === TabKey.Message && <MyMessages />}
                </div>
            </DragBox>

            {/* 数据库表详情 */}
            {dataviewOpen && (
                <LogicViewDetail
                    open={dataviewOpen}
                    onClose={() => {
                        setDataviewOpen(false)
                        if (dataviewId) {
                            searchParams.delete('dataviewId')
                            setSearchParams(searchParams)
                        }
                    }}
                    showShadow={false}
                    canChat
                />
            )}

            {/* 指标详情 */}
            {indicatorOpen && (
                <IndicatorViewDetail
                    open={indicatorOpen}
                    onClose={() => {
                        setIndicatorOpen(false)
                        if (indicatorId) {
                            searchParams.delete('indicatorId')
                            setSearchParams(searchParams)
                        }
                    }}
                    canChat
                />
            )}
        </AssetsVisitorProvider>
        //  </div>
    )
}

export default MyAssets
