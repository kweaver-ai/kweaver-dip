import React, { useEffect, useState } from 'react'
import { Button, Drawer, message, Space, Table } from 'antd'
import { useGetState } from 'ahooks'
import styles from './styles.module.less'
import { ResourceSource, ResourceType } from './const'
import DataAssetsCatlg from '../DataAssetsCatlg'
import { ServiceType } from '../DataAssetsCatlg/helper'
import DataCatlgContent from '../DataAssetsCatlg/DataCatlgContent'
import ApplicationServiceDetail from '../DataAssetsCatlg/ApplicationServiceDetail'
import __ from './locale'
import IndicatorViewDetail from '../DataAssetsCatlg/IndicatorViewDetail'
import LogicViewDetail from '../DataAssetsCatlg/LogicViewDetail'

interface IAddResource {
    open: boolean
    onClose: () => void
    getSelectedSources: (vals) => void
    selectedRes: any[]
}
const AddResource: React.FC<IAddResource> = ({
    open,
    onClose,
    getSelectedSources,
    selectedRes,
}) => {
    const [selectedSources, setSelectedSources, getSelectedSourcesInComp] =
        useGetState<any[]>([])
    const [clickAssets, setClickAssets] = useState<any>()
    const [serviceType, setServiceType] = useState<ServiceType>(
        ServiceType.DATACATLG,
    )

    // 详情页抽屉的显示/隐藏
    const [detailOpen, setDetailOpen] = useState(false)

    useEffect(() => {
        if (!open) {
            setSelectedSources([])
            setClickAssets(undefined)
            setDetailOpen(false)
        }
    }, [open])

    const handleClick = () => {
        getSelectedSources(selectedSources)
        onClose()
    }

    const getClickAsset = (asset: any, st: ServiceType) => {
        setClickAssets(asset)
        setDetailOpen(true)
        setServiceType(st)
    }

    const handleReturnList = () => {
        setDetailOpen(false)

        setClickAssets(undefined)
    }

    const getAddAsset = (asset: any) => {
        if (
            getSelectedSourcesInComp().find((item) => item.res_id === asset.id)
        ) {
            return
        }
        setSelectedSources([
            {
                provide_type: 1,
                // id: uuidv4(),
                res_name: asset.raw_title,
                res_type: ResourceType.DBTABLE,
                res_source: ResourceSource.SERVICESHOP,
                res_desc: asset.raw_description,
                res_code: asset.id,
                res_id: asset.id,
                shared_type: asset.shared_type || 1,
            },
            ...getSelectedSourcesInComp(),
        ])
        message.success(__('添加成功'))
    }

    const getComponentByComponent = () => {
        switch (serviceType) {
            case ServiceType.APPLICATIONSERVICE:
                return (
                    <ApplicationServiceDetail
                        open={detailOpen}
                        serviceCode={clickAssets.serviceCode}
                        isIntroduced
                        onClose={() => setDetailOpen(false)}
                        returnInDrawer={handleReturnList}
                    />
                )
            case ServiceType.LOGICVIEW:
                return (
                    <LogicViewDetail
                        id={clickAssets.serviceCode}
                        open={detailOpen}
                        onClose={() => setDetailOpen(false)}
                        hasPermission={clickAssets?.has_permission}
                        isIntroduced
                        returnInDrawer={handleReturnList}
                    />
                )
            case ServiceType.INDICATORASSETS:
                return (
                    <IndicatorViewDetail
                        id={clickAssets.serviceCode}
                        open={detailOpen}
                        isIntroduced
                        onClose={() => setDetailOpen(false)}
                        indicatorType={clickAssets?.indicator_type || ''}
                        returnInDrawer={handleReturnList}
                    />
                )
            default:
                return (
                    <DataCatlgContent
                        open={detailOpen}
                        onClose={() => {
                            setDetailOpen(false)
                            setClickAssets(undefined)
                        }}
                        isIntroduced
                        assetsId={clickAssets.id}
                        returnInDrawer={handleReturnList}
                    />
                )
        }
    }

    return (
        <div className={styles.assetsWrapper}>
            <Drawer
                title={__('从数据服务超市中选择')}
                open={open}
                onClose={handleClick}
                getContainer={false}
                push={{ distance: 0 }}
                contentWrapperStyle={{
                    width: 'calc(100% - 220px)',
                }}
                style={{ height: '100vh' }}
                footer={
                    <div className={styles.footerWrapper}>
                        <div className={styles.count}>
                            {__('已添加：')}
                            {[...selectedSources, ...selectedRes].length}
                        </div>
                        <Button type="primary" onClick={handleClick}>
                            {__('确定')}
                        </Button>
                    </div>
                }
                bodyStyle={{
                    backgroundColor: 'white',
                    overflow: 'hidden',
                    padding: '0 24px 24px',
                }}
                destroyOnClose
            >
                <div
                    hidden={clickAssets}
                    style={{
                        height: '100%',
                        width: '100%',
                    }}
                >
                    <DataAssetsCatlg
                        getClickAsset={getClickAsset}
                        getAddAsset={getAddAsset}
                        addedAssets={[
                            ...getSelectedSourcesInComp(),
                            ...selectedRes,
                        ]}
                        isIntroduced
                    />
                </div>

                {clickAssets?.serviceCode &&
                    serviceType &&
                    detailOpen &&
                    getComponentByComponent()}
            </Drawer>
        </div>
    )
}
export default AddResource
