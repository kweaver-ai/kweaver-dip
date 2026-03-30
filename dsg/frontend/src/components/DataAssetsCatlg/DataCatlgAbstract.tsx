import { FC, useState, useEffect } from 'react'
import { set } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import {
    formatError,
    getDataCatalogRelation,
    businessObjectPreviewSave,
    getRescDirDetail,
    reqDataCatlgBasicInfo,
} from '@/core'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import GraphShow from '@/components/DataAssetsCatlg/AssetGraph'
import { INode } from '@/components/DataAssetsCatlg/AssetGraph/helper'
import { formatCatlgError } from '@/components/DataAssetsCatlg/helper'
import { NodeTypes } from '@/components/DataAssetsCatlg/AssetGraph/const'

interface DataCatlgAbstractType {
    catalogId: string
    relatedRescId?: string
    isMarket?: boolean
}
const DataCatlgAbstract: FC<DataCatlgAbstractType> = ({
    catalogId,
    relatedRescId,
    isMarket,
}) => {
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const [graphData, setGraphData] = useState<INode>()
    // 摘要信息预览量埋点
    const previewSave = async () => {
        await businessObjectPreviewSave(catalogId)
    }

    useEffect(() => {
        if (catalogId) {
            previewSave()
        }
    }, [catalogId])

    useEffect(() => {
        getDataCatlgAbstractInfo()
    }, [])

    const generatGraphData = (res: any, catlgName: string): INode => {
        const gD: INode = {
            id: 'root',
            catlgName: res?.catalog_view?.catalog_name,
            name: res?.catalog_view?.resource_name,
            type: NodeTypes.catalog,
            rescType: NodeTypes.data_view,
            children: [],
        }
        if (gD.children) {
            if (res?.catalog_api?.length) {
                const objArr = res.catalog_api.map((item) => {
                    return {
                        id: item?.catalog_id,
                        catlgName: item?.catalog_name,
                        name: item?.resource_name,
                        type: NodeTypes.catalog,
                        rescType: NodeTypes.api,
                        isCurDir: item?.resource_id === relatedRescId,
                    }
                })
                gD.children = objArr
            }
        }

        return {
            ...gD,
            isCurDir: res?.catalog_view?.resource_id === relatedRescId,
        }
    }

    const getDataCatlgAbstractInfo = async () => {
        if (!catalogId) return
        try {
            setLoading(true)
            const res = await getDataCatalogRelation(catalogId)
            const detailsAction = isMarket
                ? reqDataCatlgBasicInfo
                : getRescDirDetail
            const basicInfo = await detailsAction(catalogId)
            const gd = generatGraphData(res, basicInfo.name)
            setIsEmpty(!res?.catalog_api)
            setGraphData(gd)
        } catch (error) {
            setIsEmpty(true)
            // formatCatlgError(error, errorCallback)
        } finally {
            setLoading(false)
        }
    }

    const errorCallback = () => {}

    return loading ? (
        <Loader />
    ) : isEmpty ? (
        <Empty iconSrc={dataEmpty} desc={__('暂无相关目录')} />
    ) : (
        <div className={styles.showGraphWrapper}>
            {graphData && <GraphShow data={graphData} />}
        </div>
    )
}

export default DataCatlgAbstract
