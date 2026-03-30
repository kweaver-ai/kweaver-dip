import React, { useContext, useEffect, useState } from 'react'
import classnames from 'classnames'
import { Tabs } from 'antd'
import __ from '../locale'
import styles from './styles.module.less'
import { AssetTypeEnum, isMicroWidget } from '@/core'
import DataViewAsset from './DataViewAsset'
import ApiAsset from './ApiAsset'
import { MicroWidgetPropsContext } from '@/context'
import { useAssetsContext } from './AssetsVisitorProvider'
import { AssetVisitorTypes } from './const'
import { FontIcon } from '@/icons'
import { IconType } from '@/icons/const'
import ViewDetail from '@/components/ApplicationAuth/ApplicationManage/ViewDetail'
import { useGeneralConfig } from '@/hooks/useGeneralConfig'

/**
 * 资源类型
 */
enum AssetItemType {
    /** 库表 */
    DataView = 'data-view',
    /** 接口服务 */
    Api = 'api',

    // 指标
    Indicator = 'indicator',
}

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
]

function AvailableAsset() {
    const [active, setActive] = useState<AssetItemType>(AssetItemType.DataView)
    const { microWidgetProps } = useContext(MicroWidgetPropsContext)
    const [{ local_app }] = useGeneralConfig()
    const {
        isDataOwner,
        selectedType,
        selectedId,
        isVisitor,
        updateSelectedType,
    } = useAssetsContext()
    const [openDetail, setOpenDetail] = useState(false)
    useEffect(() => {
        if (isVisitor && selectedType === AssetVisitorTypes.None) {
            updateSelectedType(AssetVisitorTypes.USER)
        }
    }, [selectedType, isVisitor])
    return (
        <div
            className={classnames(
                styles['available-asset'],
                isMicroWidget({ microWidgetProps }) &&
                    styles['as-available-asset'],
            )}
        >
            {isMicroWidget({ microWidgetProps }) ? null : selectedType ===
              AssetVisitorTypes.USER ? (
                <div className={styles['available-asset-title']}>
                    {__('我的资源')}
                </div>
            ) : (
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
            )}
            <Tabs
                items={items.filter((current) => {
                    if (!local_app && current.key === AssetItemType.Api) {
                        return false
                    }
                    if (
                        current.key === AssetItemType.Api &&
                        !isDataOwner &&
                        selectedType === AssetVisitorTypes.USER
                    ) {
                        return false
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
