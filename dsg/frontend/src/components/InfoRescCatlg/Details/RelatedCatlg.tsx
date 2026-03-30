import { FC, useState, useEffect, useMemo } from 'react'
import { set } from 'lodash'
import styles from './styles.module.less'
import __ from './locale'
import {
    formatError,
    getDataCatalogRelation,
    businessObjectPreviewSave,
    getRescDirDetail,
    getInfoCatlgDetailByOper,
    getInfoCatlgDetail,
    HasAccess,
} from '@/core'
import { Empty, Loader } from '@/ui'
import dataEmpty from '@/assets/dataEmpty.svg'
import GraphShow from '@/components/DataAssetsCatlg/AssetGraph'
import { INode } from '@/components/DataAssetsCatlg/AssetGraph/helper'
import { formatCatlgError } from '@/components/DataAssetsCatlg/helper'
import { NodeTypes } from './helper'
import RelateGraphShow from './RelateGraphShow'
import {
    invalidSelOptionVal,
    selectNullOptionValue,
} from '../EditInfoRescCatlg/helper'
import { useUserPermCtx } from '@/context/UserPermissionProvider'

interface DataCatlgAbstractType {
    catalogId: string
}
const DataCatlgAbstract: FC<DataCatlgAbstractType> = ({ catalogId }) => {
    const [isEmpty, setIsEmpty] = useState<boolean>(false)
    const [loading, setLoading] = useState(false)
    const [graphData, setGraphData] = useState<INode>()
    const { checkPermissions } = useUserPermCtx()

    // 是否拥有数据运营工程师
    const hasDataOperRole = useMemo(() => {
        return checkPermissions(HasAccess.isGovernOrOperation) ?? false
    }, [checkPermissions])
    // 摘要信息预览量埋点
    // const previewSave = async () => {
    //     await businessObjectPreviewSave(catalogId)
    // }

    // useEffect(() => {
    //     if (catalogId) {
    //         previewSave()
    //     }
    // }, [catalogId])

    useEffect(() => {
        getDataCatlgAbstractInfo()
    }, [])

    const generatGraphData = (res: any, name: string): INode => {
        const gD: INode = {
            id: 'root',
            name,
            type: NodeTypes.RESC_CATLG_NAME,
            children: [
                {
                    id: 'infoRescCatlgList',
                    name: __('关联信息资源目录（${text}）', {
                        text:
                            res?.info_resource_catalogs?.filter(
                                (item) => item.id !== selectNullOptionValue,
                            )?.length || '0',
                    }),
                    type: NodeTypes.RESC_CATLG_NAME,
                    children:
                        res?.info_resource_catalogs?.map((item) => {
                            return {
                                id: item?.id,
                                name: item?.name,
                                type: NodeTypes.INFO_RESC_CATALOG,
                            }
                        }) || [],
                },
                {
                    id: 'dataRescCatlgList',
                    name: __('关联数据资源目录（${text}）', {
                        text: res?.data_resource_catalogs?.length || '0',
                    }),
                    type: NodeTypes.RESC_CATLG_NAME,
                    children:
                        res?.data_resource_catalogs?.map((item) => {
                            return {
                                id: item?.id,
                                name: item?.name,
                                type: NodeTypes.DATA_RESOURCE_CATALOG,
                            }
                        }) || [],
                },
            ],
        }

        return {
            ...gD,
            isCurDir: true,
        }
    }

    const getDataCatlgAbstractInfo = async () => {
        if (!catalogId) return
        try {
            setLoading(true)
            const action = hasDataOperRole
                ? getInfoCatlgDetailByOper
                : getInfoCatlgDetail
            const res = await action(catalogId)
            const { relation_info = {} } = res
            // 过滤掉无id或不存在节点
            const info_resource_catalogs =
                relation_info?.info_resource_catalogs?.filter(
                    (item) =>
                        !!item.id &&
                        ![invalidSelOptionVal, selectNullOptionValue].includes(
                            item.id,
                        ),
                )
            const data_resource_catalogs =
                relation_info?.data_resource_catalogs?.filter(
                    (item) =>
                        !!item.id &&
                        ![invalidSelOptionVal, selectNullOptionValue].includes(
                            item.id,
                        ),
                )
            const gd = generatGraphData(
                {
                    info_resource_catalogs,
                    data_resource_catalogs,
                },
                res?.name,
            )
            setIsEmpty(
                !info_resource_catalogs?.length &&
                    !data_resource_catalogs?.length,
            )
            setGraphData(gd)
        } catch (error) {
            setIsEmpty(true)
            formatCatlgError(error, errorCallback)
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
            {graphData && <RelateGraphShow data={graphData} />}
        </div>
    )
}

export default DataCatlgAbstract
