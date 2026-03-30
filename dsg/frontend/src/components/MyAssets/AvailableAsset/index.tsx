import React, { useContext, useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import classnames from 'classnames'
import { Button, Tabs } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { isMicroWidget, LoginPlatform } from '@/core'
import DataViewAsset from './DataViewAsset'
import ApiAsset from './ApiAsset'
import { MicroWidgetPropsContext } from '@/context'
import IndicatorAsset from './IndicatorAsset'
import { useAssetsContext } from '../AssetsVisitorProvider'
import { AssetVisitorTypes } from '../const'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import ViewDetail from '@/components/ApplicationAuth/ApplicationManage/ViewDetail'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'
import { getActualUrl, getPlatformNumber } from '@/utils'
import { AssetItemType } from './helper'

const items = [
    {
        label: __('库表'),
        key: AssetItemType.DataView,
        children: <DataViewAsset />,
    },
    {
        label: __('接口服务'),
        key: AssetItemType.Api,
        children: <ApiAsset />,
    },
    {
        label: __('指标'),
        key: AssetItemType.Indicator,
        children: <IndicatorAsset />,
    },
]

function AvailableAsset({
    isPersonalCenter = false,
    isApplication = false,
}: {
    isPersonalCenter?: boolean
    isApplication?: boolean
}) {
    const [searchParams, setSearchParams] = useSearchParams()
    const assetType = searchParams.get('assetType') || undefined
    const [active, setActive] = useState<AssetItemType>(AssetItemType.DataView)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [{ local_app }] = useGeneralConfig()
    const { selectedType, selectedId, updateSelectedType } = useAssetsContext()
    const [openDetail, setOpenDetail] = useState(false)
    const navigator = useNavigate()
    const platform = getPlatformNumber()

    useEffect(() => {
        if (!isApplication) {
            updateSelectedType(AssetVisitorTypes.USER)
        }
    }, [selectedType, isApplication, isPersonalCenter])

    useEffect(() => {
        if (assetType) {
            setActive(assetType as AssetItemType)
        }
    }, [assetType])

    const handleGoApplicationAuth = () => {
        if (platform === LoginPlatform.drmp) {
            window.open(
                getActualUrl('/applicationAuth/manage', true, 2),
                '_self',
            )
        } else {
            navigator('/applicationAuth/manage')
        }
    }

    return (
        <div
            className={classnames(
                styles['available-asset'],
                isMicroWidget({ microWidgetProps }) &&
                    styles['as-available-asset'],
                isPersonalCenter && styles.isPersonalCenter,
            )}
        >
            {isMicroWidget({ microWidgetProps }) ? null : selectedType ===
              AssetVisitorTypes.USER ? (
                <div className={styles['available-asset-title']}>
                    {__('我的资源')}
                </div>
            ) : (
                <div className={styles['asset-title-wrapper']}>
                    <div
                        className={styles['available-asset-title']}
                        onClick={() => {
                            setOpenDetail(true)
                        }}
                    >
                        <FontIcon
                            name="icon-jichengyingyongguanli"
                            type={IconType.COLOREDICON}
                            className={styles.icon}
                        />
                        <span className={styles.app}>{__('应用')}</span>
                    </div>
                    <div>
                        <Button type="link" onClick={handleGoApplicationAuth}>
                            {__('应用管理>>')}
                        </Button>
                    </div>
                </div>
            )}
            <Tabs
                items={items.filter((current) => {
                    if (!local_app && current.key === AssetItemType.Api) {
                        return false
                    }
                    if (
                        current.key === AssetItemType.Api &&
                        selectedType === AssetVisitorTypes.USER
                    ) {
                        return true
                    }

                    return true
                })}
                activeKey={active}
                onChange={(k) => setActive(k as AssetItemType)}
                destroyInactiveTabPane
            />
            <ViewDetail
                open={openDetail}
                appId={selectedId || ''}
                onClose={() => {
                    setOpenDetail(false)
                }}
            />
        </div>
    )
}

export default AvailableAsset
